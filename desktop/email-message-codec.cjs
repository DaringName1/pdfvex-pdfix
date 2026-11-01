// This bounded MIME reader is called only inside the contained document engine.
const {createHash}=require('node:crypto');
const MAX_EMAIL=10*1024*1024,MAX_BODY=1024*1024;
const clean=value=>String(value).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g,'').replace(/\r\n?/g,'\n');
const single=value=>clean(value).replace(/\s+/g,' ').slice(0,2000);
const escape=value=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function transfer(raw,encoding){
 const mode=encoding.toLowerCase().trim();
 if(!mode||['7bit','8bit','binary'].includes(mode))return Buffer.from(raw,'latin1');
 if(mode==='base64'){const text=raw.replace(/[\t\r\n ]/g,'');if(text.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(text))throw new Error('Malformed MIME base64.');return Buffer.from(text,'base64');}
 if(mode==='quoted-printable'){const text=raw.replace(/=\r?\n/g,'');if(/=(?![a-f0-9]{2})/i.test(text))throw new Error('Malformed MIME quoted-printable.');return Buffer.from(text.replace(/=([a-f0-9]{2})/gi,(_,hex)=>String.fromCharCode(parseInt(hex,16))),'latin1');}
 throw new Error('Unsupported MIME transfer encoding.');
}
function decode(bytes,charset='utf-8'){
 const label=charset.toLowerCase().trim(),supported=new Set(['utf-8','utf8','us-ascii','ascii','iso-8859-1','latin1','windows-1252','utf-16le','utf-16be']);
 if(!supported.has(label))throw new Error('Unsupported email character set.');
 if(['ascii','us-ascii'].includes(label)&&bytes.some(value=>value>127))throw new Error('Invalid ASCII email text.');
 return clean(new TextDecoder(label==='ascii'?'us-ascii':label,{fatal:true}).decode(bytes));
}
function encodedHeader(value,warnings){
 return single(value.replace(/(=\?[^?]+\?[bq]\?[^?]*\?=)\s+(?==\?)/gi,'$1').replace(/=\?([^?]+)\?([bq])\?([^?]*)\?=/gi,(whole,charset,mode,text)=>{try{return decode(transfer(mode.toLowerCase()==='q'?text.replace(/_/g,' '):text,mode.toLowerCase()==='q'?'quoted-printable':'base64'),charset);}catch{warnings.add('Some encoded headers could not be decoded and retain their literal source text.');return whole;}}));
}
function headerValue(value){
 const match=/^\s*([^;]*)(.*)$/.exec(value||''),params=Object.create(null),rest=match[2];
 const regex=/;\s*([a-z0-9_-]+\*?)\s*=\s*(?:"((?:\\.|[^"\\])*)"|([^;\s]*))/gi;let item;
 while((item=regex.exec(rest))){const key=item[1].toLowerCase();if(!Object.hasOwn(params,key))params[key]=(item[2]??item[3]).replace(/\\(.)/g,'$1');}
 return {value:match[1].trim().toLowerCase(),params};
}
function filename(params,warnings){
 if(params['filename*']||params['name*']){const extended=params['filename*']??params['name*'],match=/^([^']*)'[^']*'(.*)$/.exec(extended);try{if(!match||/%(?![a-f0-9]{2})/i.test(match[2])||/[^\x20-\x7e]/.test(match[2]))throw new Error();return single(decode(Buffer.from(match[2].replace(/%([a-f0-9]{2})/gi,(_,hex)=>String.fromCharCode(parseInt(hex,16))),'latin1'),match[1]||'utf-8')).slice(0,300);}catch{warnings.add('An extended attachment filename could not be decoded.');}}
 return encodedHeader(params.filename??params.name??'',warnings).slice(0,300);
}
function splitPart(raw,budget){
 const separator=/\r?\n\r?\n/.exec(raw);if(!separator||separator.index>65536)throw new Error('Email MIME headers are missing or exceed 64 KiB.');
 const head=raw.slice(0,separator.index);budget.headers+=head.length;if(budget.headers>262144)throw new Error('Email MIME headers exceed the total 256 KiB limit.');
 const lines=head.split(/\r?\n/),headers=Object.create(null);let previous=null;if(lines.length>1000)throw new Error('Email headers exceed the line limit.');
 for(const line of lines){if(/^[ \t]/.test(line)){if(!previous)throw new Error('Malformed folded MIME header.');headers[previous]+=' '+line.trim();continue;}const match=/^([a-z0-9-]{1,100}):[ \t]*(.*)$/i.exec(line);if(!match)throw new Error('Malformed MIME header.');const key=match[1].toLowerCase();if(Object.hasOwn(headers,key)&&['content-type','content-transfer-encoding','content-disposition'].includes(key))throw new Error('Ambiguous duplicate MIME content header.');if(!Object.hasOwn(headers,key))headers[key]=match[2];previous=key;}
 return {headers,body:raw.slice(separator.index+separator[0].length)};
}
function entities(text){return text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,(whole,code)=>{const map={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};if(code[0]!=='#')return map[code.toLowerCase()];const n=code[1].toLowerCase()==='x'?parseInt(code.slice(2),16):parseInt(code.slice(1),10);return n>=32&&n<=0x10ffff&&!(n>=0xd800&&n<=0xdfff)?String.fromCodePoint(n):' ';});}
function inertHTML(html,warnings){
 // Rebuild a tiny formatting-only vocabulary. No source attributes or URLs survive.
 const allowed=new Set(['p','h1','h2','h3','strong','b','em','i','u','s','ul','ol','li','br','blockquote','pre','code','hr']);
 const blocked=new Set(['script','style','iframe','object','embed','svg','math','template','head']);let skipped=null,out='',tokens=0;
 for(const token of html.match(/<!--[\s\S]*?(?:-->|$)|<[^>]*>|[^<]+|</g)||[]){if(++tokens>30000)throw new Error('Email HTML exceeds the element limit.');if(token.startsWith('<!--'))continue;
  const tag=/^<\s*(\/?)\s*([a-z][a-z0-9:-]*)\b[^>]*>$/i.exec(token);if(tag){const name=tag[2].toLowerCase(),closing=!!tag[1];if(skipped){if(closing&&name===skipped)skipped=null;continue;}if(blocked.has(name)){if(!closing)skipped=name;continue;}if(name==='img'){out+='[Image omitted]';continue;}if(allowed.has(name))out+='<'+(closing?'/':'')+name+'>';else if(['div','tr','table'].includes(name))out+='<br>';}
  else if(!skipped)out+=escape(entities(token));
 }
 warnings.add('Email HTML is simplified to inert text formatting; links, styles, scripts, remote and inline images are omitted.');return out;
}
function readEmailMessage(input){
 const bytes=Buffer.from(input);if(!bytes.length||bytes.length>MAX_EMAIL)throw new Error('Choose a standard EML message up to 10 MiB.');
 const warnings=new Set(),attachments=[],budget={parts:0,headers:0,decoded:0},top=splitPart(bytes.toString('latin1'),budget);
 function parse(part,depth){
  if(depth>12||++budget.parts>200)throw new Error('Email exceeds 200 MIME parts or 12 nesting levels.');
  const type=headerValue(part.headers['content-type']||'text/plain'),disposition=headerValue(part.headers['content-disposition']||''),name=filename({...type.params,...disposition.params},warnings),attachment=disposition.value==='attachment'||!!name;
  if(type.value.startsWith('multipart/')){
   if(attachment){attachments.push({name:name||'Attached MIME message',mime:type.value,size:null,omitted:true,reason:'Multipart attachment omitted; decoded size unavailable.'});return null;}
   const boundary=type.params.boundary;if(!boundary||boundary.length>200||/[\x00-\x1f\x7f]/.test(boundary))throw new Error('Email multipart boundary is missing or unsupported.');
   const lines=part.body.split(/\r?\n/),parts=[];let started=false,closed=false,chunk=[];
   for(const line of lines){if(line.trimEnd()==='--'+boundary||line.trimEnd()==='--'+boundary+'--'){if(started)parts.push(chunk.join('\r\n'));chunk=[];started=true;if(line.trimEnd()==='--'+boundary+'--'){closed=true;break;}}else if(started)chunk.push(line);}
   if(!closed)throw new Error('Email multipart message is truncated.');const bodies=parts.map(raw=>parse(splitPart(raw,budget),depth+1)).filter(Boolean);
   if(type.value==='multipart/alternative')return bodies.find(body=>body.kind==='text')??bodies[0]??null;
   return bodies.length?{kind:'html',content:bodies.map(body=>body.kind==='text'?'<pre>'+escape(body.content)+'</pre>':body.content).join('<hr>')}:null;
  }
  let decoded;try{decoded=transfer(part.body,part.headers['content-transfer-encoding']||'');budget.decoded+=decoded.length;if(budget.decoded>MAX_EMAIL)throw new Error('Email decoded content exceeds 10 MiB.');}catch(error){if(!attachment&&['text/plain','text/html'].includes(type.value))throw error;attachments.push({name:name||'Unnamed MIME part',mime:type.value||'application/octet-stream',size:null,omitted:true,reason:'Unsupported or malformed transfer encoding; decoded size unavailable.'});return null;}
  if(attachment||!['text/plain','text/html'].includes(type.value)){attachments.push({name:name||'Unnamed MIME part',mime:type.value||'application/octet-stream',size:decoded.length,omitted:true,reason:'Listed only; attachment bytes are not embedded, extracted or executed.'});return null;}
  if(decoded.length>MAX_BODY)throw new Error('Email body parts are limited to 1 MiB.');let content;try{content=decode(decoded,type.params.charset||'us-ascii');}catch{warnings.add('An email body part was omitted because its character set or encoded text is unsupported.');return null;}
  return type.value==='text/html'?{kind:'html',content:inertHTML(content,warnings)}:{kind:'text',content};
 }
 const body=parse(top,0)??{kind:'text',content:'[No supported message body]'};if(Buffer.byteLength(body.content)>MAX_BODY)throw new Error('Combined email body exceeds 1 MiB.');
 const headers=['from','to','cc','bcc','date','subject','reply-to','message-id'].filter(name=>Object.hasOwn(top.headers,name)).map(name=>({name,value:encodedHeader(top.headers[name],warnings)}));
 if(attachments.length)warnings.add('All '+attachments.length+' MIME attachments are explicitly listed as omitted. Attachment preservation/extraction is unavailable in this route.');
 return {version:1,sourceSha256:createHash('sha256').update(bytes).digest('hex'),title:(headers.find(item=>item.name==='subject')?.value||'Email message').slice(0,150),headers,body,attachments,warnings:[...warnings]};
}
module.exports={readEmailMessage};
