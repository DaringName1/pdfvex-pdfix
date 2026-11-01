// Restores each line's line ending from HEAD so a commit shows only real changes. New lines get the ending of the
// line before them. Usage: node scripts/fix-line-endings.cjs <file>...   (run it only on files you changed yourself, before committing)
const {execFileSync}=require('child_process'),fs=require('fs');
for(const file of process.argv.slice(2)){
  let head;try{head=execFileSync('git',['show','HEAD:'+file],{encoding:'utf8',maxBuffer:64*1024*1024});}catch{console.log('skip (new file)',file);continue;}
  const endings=new Map();for(const match of head.matchAll(/([^\n]*?)(\r?\n)/g)){const line=match[1];if(!endings.has(line))endings.set(line,match[2]);}
  const now=fs.readFileSync(file,'utf8'),parts=now.split(/\r?\n/),lastNewline=/\r?\n$/.test(now);let out='',previous='\r\n';
  parts.forEach((line,index)=>{if(index===parts.length-1&&lastNewline&&line==='')return;const ending=endings.get(line)??previous;previous=ending;out+=line+(index<parts.length-1?ending:'');});
  if(out!==now){fs.writeFileSync(file,out);console.log('fixed',file);}else console.log('unchanged',file);
}
