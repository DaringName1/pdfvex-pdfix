'use strict';
// A short, private diary of notable events (starts, errors, crashed helpers) that the person can save as a problem
// report and send by choice. It is kept in PDFix's own data folder so it survives a crash, holds at most LIMIT entries,
// and never keeps document contents: paths and document file names are replaced before anything is stored.
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const LIMIT=300,FILE='problem-log.json',EXT='pdf|docx?|xlsx?|pptx?|rtf|txt|md|markdown|csv|json|xml|ya?ml|png|jpe?g|webp|bmp|tiff?|eml|heic|heif|xfdf|fdf|dwg|dxf';
// Names may contain spaces ("Smith House A-201.pdf"), so a path is removed up to its file ending, a quoted name is
// removed whole, and an unquoted name is removed back to the start of its phrase (after ":" ";" "(" or a verb such as
// "Saved"). Losing a few words of context is preferred to keeping any part of a document name.
const QUOTED=new RegExp(`(["'])[^"'\\r\\n]{0,300}\\.(${EXT})\\1`,'gi'),DRIVE_FILE=new RegExp(`\\b[a-zA-Z]:[\\\\/][^"'<>|\\r\\n;]*?\\.(${EXT})\\b`,'gi'),
 SHARE_FILE=new RegExp(`\\\\\\\\[^"'<>|\\r\\n;]*?\\.(${EXT})\\b`,'gi'),
 BARE=new RegExp(`(\\b(?:opened|reopened|saved|exported|open|save|could not open|could not save|file|copy|choose)\\s+)?([^:;"'()\\[\\]\\r\\n]{1,160}?)\\.(${EXT})\\b`,'gi');
function scrub(text){
 return String(text??'').slice(0,800)
  .replace(QUOTED,(m,q,ext)=>q+'[file].'+ext+q)
  .replace(DRIVE_FILE,(m,ext)=>'[path].'+ext).replace(SHARE_FILE,(m,ext)=>'[path].'+ext)
  .replace(/\b[a-zA-Z]:[\\/][^"'<>|\r\n;:]*/g,'[path]').replace(/\\\\[^"'<>|\r\n;:]+/g,'[path]')
  .replace(/(?:^|\s)\/(?:Users|home|tmp|var|mnt)\/[^"'<>|\r\n;:]*/g,' [path]')
  .replace(BARE,(m,verb,name,ext)=>(verb??(/^\s/.test(name)?' ':''))+'[file].'+ext);
}
class ProblemLog{
 constructor(directory){this.file=path.join(directory,FILE);this.entries=[];this.timer=null;this.writing=Promise.resolve();}
 async init(){try{const saved=JSON.parse(await fsp.readFile(this.file,'utf8'));if(Array.isArray(saved))this.entries=saved.filter(e=>e&&typeof e.at==='string').slice(-LIMIT);}catch{}}
 note(kind,detail){
  this.entries.push({at:new Date().toISOString(),kind:scrub(kind).slice(0,40),detail:scrub(detail)});
  if(this.entries.length>LIMIT)this.entries.splice(0,this.entries.length-LIMIT);
  clearTimeout(this.timer);this.timer=setTimeout(()=>{this.flush();},400);
 }
 flush(){const data=JSON.stringify(this.entries),temp=this.file+'.tmp';this.writing=this.writing.then(()=>fsp.writeFile(temp,data).then(()=>fsp.rename(temp,this.file))).catch(()=>{});return this.writing;}
 // Used when the main process is about to stop: there is no time left for an asynchronous write.
 flushNow(){clearTimeout(this.timer);try{fs.writeFileSync(this.file,JSON.stringify(this.entries));}catch{}}
 report(system){
  const lines=['PDFix problem report','Created: '+new Date().toISOString(),'','This report lists recent events and errors. It contains no document contents; file names and folder paths are replaced by [file] and [path].',''];
  for(const [label,value] of Object.entries(system))lines.push(label+': '+scrub(value));
  lines.push('','Recent events (oldest first):');
  for(const e of this.entries)lines.push(`${e.at}  ${e.kind}  ${e.detail}`);
  if(!this.entries.length)lines.push('(none recorded)');
  return lines.join('\r\n')+'\r\n';
 }
}
function systemSummary(app){
 const cpu=os.cpus()[0];
 return {'PDFix version':app.getVersion()+(app.isPackaged?'':' (development run)'),'Electron':process.versions.electron,'Windows':os.release()+' '+os.arch(),
  'Processor':(cpu?.model??'unknown').trim()+' · '+os.cpus().length+' threads','Memory':Math.round(os.totalmem()/2**30)+' GB total, '+Math.round(os.freemem()/2**30)+' GB free',
  'Graphics':JSON.stringify(app.getGPUFeatureStatus?.()??{}).slice(0,400)};
}
module.exports={ProblemLog,systemSummary,scrub};
