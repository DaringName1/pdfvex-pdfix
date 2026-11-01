const {TextDecoder}=require('node:util');
const {createHash}=require('node:crypto');
const TYPES=new Set(['txt','md','markdown','csv','json','xml','yaml','yml']);
const MAX=2*1024*1024;
function contextSources(store){return [...store.handles].filter(([,source])=>TYPES.has(source.ext)&&source.bytes.length<=MAX).map(([sourceID,source])=>({sourceID,name:source.name,ext:source.ext}));}
function contextText(store,sourceID){const source=store.source(sourceID);if(!TYPES.has(source.ext)||source.bytes.length>MAX)throw new Error('Choose an already opened UTF-8 text, Markdown or data source under 2 MB.');let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(source.bytes);}catch{throw new Error('Source context requires UTF-8 text.');}let lines=1;for(let index=0;index<text.length;index++){if(text[index]==='\r'||text[index]==='\n'){if(text[index]==='\r'&&text[index+1]==='\n')index++;if(++lines>20000)throw new Error('Source context is limited to 20,000 lines. Choose a smaller text source or paste a reviewed excerpt.');}}if(text.includes('\0'))throw new Error('Binary-looking source text cannot be selected here.');if(createHash('sha256').update(source.bytes).digest('hex')!==source.fingerprint)throw new Error('The source snapshot changed. Open it again.');return {sourceID,fingerprint:source.fingerprint,name:source.name,text};}
module.exports={contextSources,contextText};
