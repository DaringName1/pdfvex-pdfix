'use strict';
const http=require('node:http');
const https=require('node:https');
class AiError extends Error{constructor(code,message){super(message);this.code=code;}}
function endpoint(value){
  if(typeof value!=='string'||value.length>2048||/[\s\\]/.test(value))throw new AiError('AI_ENDPOINT','Enter an exact API base URL without spaces.');
  let url;try{url=new URL(value);}catch{throw new AiError('AI_ENDPOINT','Enter a valid API base URL.');}
  const local=url.hostname==='127.0.0.1'||url.hostname==='[::1]';
  if(url.username||url.password||url.search||url.hash||!['https:','http:'].includes(url.protocol)||url.protocol==='http:'&&!local)throw new AiError('AI_ENDPOINT','Use HTTPS, or HTTP on numeric loopback 127.0.0.1 / [::1]. Credentials and query strings cannot be part of a URL.');
  url.pathname=url.pathname.replace(/\/+$/,'');
  return {url:url.href.replace(/\/$/,''),local};
}
function requestJson(base,route,{key='',body,signal,timeout=60000}={}){
  const verified=endpoint(base);if(!verified.local)throw new AiError('AI_ENDPOINT','AI requests are limited to a local server at 127.0.0.1 or [::1].');if(!['/models','/chat/completions','/capabilities'].includes(route))throw new AiError('AI_ENDPOINT','Unsupported provider operation.');
  const url=new URL(verified.url+route),payload=body===undefined?null:Buffer.from(JSON.stringify(body));
  if(payload&&payload.length>256*1024)throw new AiError('AI_SIZE','Choose less text for this request.');
  if(key)throw new AiError('AI_KEY','API keys are disabled for local AI requests.');
  return new Promise((resolve,reject)=>{
    let done=false,timer,req;const fail=error=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);req?.destroy();reject(error instanceof AiError?error:new AiError('AI_NETWORK','The provider could not be reached securely. Check its address, certificate and connection.'));};
    const abort=()=>fail(new AiError('AI_CANCELLED','Request cancelled. The provider may already have received the reviewed content.'));
    if(signal?.aborted)return abort();
    const headers={Accept:'application/json','Accept-Encoding':'identity','User-Agent':'PDFix/Development'};
    if(key)headers.Authorization=`Bearer ${key}`;if(payload){headers['Content-Type']='application/json';headers['Content-Length']=String(payload.length);}
    req=(url.protocol==='https:'?https:http).request(url,{method:payload?'POST':'GET',headers,agent:false,rejectUnauthorized:true},res=>{
      if(res.statusCode>=300&&res.statusCode<400){res.resume();return fail(new AiError('AI_REDIRECT','Provider redirects are blocked. Save and review the exact destination URL.'));}
      if(res.statusCode!==200){res.resume();return fail(new AiError('AI_PROVIDER',`Provider returned HTTP ${res.statusCode}. Check access, model and account limits. No automatic retry was made.`));}
      if(!String(res.headers['content-type']||'').toLowerCase().includes('application/json')||res.headers['content-encoding']&&res.headers['content-encoding']!=='identity'){res.resume();return fail(new AiError('AI_RESPONSE','Provider did not return supported plain JSON.'));}
      const parts=[];let size=0;res.on('data',part=>{size+=part.length;if(size>1024*1024)fail(new AiError('AI_SIZE','Provider response exceeded the 1 MB limit.'));else parts.push(part);});
      res.on('error',fail);res.on('aborted',()=>fail(new AiError('AI_RESPONSE','Provider response ended early.')));
      res.on('end',()=>{if(done)return;let value;try{value=JSON.parse(Buffer.concat(parts).toString('utf8'));}catch{return fail(new AiError('AI_RESPONSE','Provider returned invalid JSON.'));}done=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);resolve(value);});
    });
    req.on('error',fail);signal?.addEventListener('abort',abort,{once:true});timer=setTimeout(()=>fail(new AiError('AI_TIMEOUT','Provider request timed out. No automatic retry was made.')),timeout);req.end(payload||undefined);
  });
}
module.exports={AiError,endpoint,requestJson};
