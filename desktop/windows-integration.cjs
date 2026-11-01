'use strict';
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const OPEN_EXTENSIONS=Object.freeze(['pdf','docx','rtf','txt','md','markdown','json','xml','yaml','yml','csv','xlsx','pptx','png','jpg','jpeg','webp','bmp']);
function launchFiles(argv,{defaultApp=false,workingDirectory=process.cwd()}={}){
  if(!Array.isArray(argv)||argv.length>100)return [];
  const files=[];
  for(const argument of argv.slice(defaultApp?2:1)){
    if(typeof argument!=='string'||!argument||argument.length>32767||argument.startsWith('-')||/[\0\r\n]/.test(argument)||/^[a-z][a-z\d+.-]*:\/\//i.test(argument))continue;
    // A file association is a file-open request, never a URL/protocol or shell command.
    const candidate=path.isAbsolute(argument)?path.normalize(argument):path.resolve(workingDirectory,argument);
    if(!OPEN_EXTENSIONS.includes(path.extname(candidate).slice(1).toLowerCase()))continue;
    if(!files.some(value=>value.toLowerCase()===candidate.toLowerCase()))files.push(candidate);
    if(files.length===10)break;
  }
  return files;
}
class WindowsOpenQueue{
  constructor(){this.pending=[];this.active=false;}
  enqueue(argv,options){const paths=launchFiles(argv,options);for(const filename of paths){if(this.pending.length>=10)break;if(!this.pending.some(item=>item.path.toLowerCase()===filename.toLowerCase()))this.pending.push({id:randomUUID(),path:filename,name:path.basename(filename)});}return this.list();}
  list(){return this.pending.map(({id,name,path:filename})=>({id,name,location:filename}));}
  discard(id){this.pending=this.pending.filter(item=>item.id!==id);return this.list();}
  clear(){this.pending=[];return [];}
  async open(id,{store,dialog,window}){
    if(this.active)throw new Error('Finish the current Windows file-open request first.');
    const entry=this.pending.find(item=>item.id===id);if(!entry)throw new Error('This Windows file-open request is no longer pending.');this.active=true;
    try{
      const result=await dialog.showMessageBox(typeof window==='function'?window():window,{type:'question',title:'PDFix — open requested file',message:`Open ${entry.name}?`,detail:`Windows requested this file:\n${entry.path}\n\nPDFix will open it as a document, subject to format and size limits. It will not run the file or follow any document actions. Your current editor should finish its departure review first.`,buttons:['Open document','Cancel'],defaultId:1,cancelId:1,noLink:true});
      if(result.response!==0)return {cancelled:true};
      if(!this.pending.some(item=>item.id===id))return {cancelled:true};
      const file=await store.open(entry.path);this.discard(id);return {file,pending:this.list()};
    }finally{this.active=false;}
  }
}
/** Packaging input only. No registry writes, default-app changes or machine mutations occur here. */
function associationManifest(executable){
  if(typeof executable!=='string'||!path.win32.isAbsolute(executable)||/["\r\n\0]/.test(executable)||path.win32.extname(executable).toLowerCase()!=='.exe')throw new Error('Use the exact installed PDFix executable path.');
  const command=`"${executable}" "%1"`,application='Software\\Classes\\Applications\\PDFix.exe';
  const entries=[{key:application,name:'FriendlyAppName',value:'PDFix'},{key:application+'\\shell\\open\\command',name:'',value:command},{key:'Software\\PDFix\\Capabilities',name:'ApplicationName',value:'PDFix'},{key:'Software\\PDFix\\Capabilities',name:'ApplicationDescription',value:'Local document reading, editing and reviewed copy exports'},{key:'Software\\RegisteredApplications',name:'PDFix',value:'Software\\PDFix\\Capabilities'}];
  for(const ext of OPEN_EXTENSIONS){const progid=`PDFix.${ext}`;entries.push({key:application+'\\SupportedTypes',name:`.${ext}`,value:''},{key:`Software\\Classes\\.${ext}\\OpenWithProgids`,name:progid,value:''},{key:`Software\\Classes\\${progid}`,name:'',value:`PDFix ${ext.toUpperCase()} document`},{key:`Software\\Classes\\${progid}\\DefaultIcon`,name:'',value:`"${executable}",0`},{key:`Software\\Classes\\${progid}\\shell\\open\\command`,name:'',value:command},{key:'Software\\PDFix\\Capabilities\\FileAssociations',name:`.${ext}`,value:progid});}
  return {hive:'HKEY_CURRENT_USER',entries,command,extensions:[...OPEN_EXTENSIONS],defaultAppPolicy:'User chooses defaults in Windows Settings. Installer must not write UserChoice or replace extension defaults.',uninstallPolicy:'Remove only PDFix-named values and PDFix-owned ProgID/Application/Capabilities keys; retain shared extension keys, other handlers and user files.'};
}
module.exports={OPEN_EXTENSIONS,launchFiles,WindowsOpenQueue,associationManifest};
