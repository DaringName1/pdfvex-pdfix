import {ReaderPageToolHost} from './pdf-reader-page-tool-host.js';
import {PermissionFlag} from 'pdfjs-dist';
import {inspectPdfHealth} from './pdf-health-inspection.js';
import './pdf-file-details.css';
const MAX_BYTES=100*1024*1024,MAX_PAGES=500,MAX_FIELD=2000,MAX_METADATA=32000;
const make=(tag,text,className)=>{const value=document.createElement(tag);if(text!==undefined)value.textContent=text;if(className)value.className=className;return value;};
const clean=value=>String(value??'').replace(/[\p{Cc}\p{Cf}\p{Cs}]/gu,char=>'\\u'+char.charCodeAt(0).toString(16).padStart(4,'0'));
const rounded=value=>Math.round(value*100)/100;
function wait(promise,signal,milliseconds=15000){return new Promise((resolve,reject)=>{
  if(signal.aborted){reject(new Error('File details canceled.'));return;}
  const abort=()=>finish(new Error('File details canceled.'));
  const finish=(error,value)=>{clearTimeout(timer);signal.removeEventListener('abort',abort);error?reject(error):resolve(value);};
  const timer=setTimeout(()=>finish(new Error('This details operation exceeded its reading limit.')),milliseconds);signal.addEventListener('abort',abort,{once:true});
  Promise.resolve(promise).then(value=>finish(null,value),error=>finish(error));
});}
export function pdfPageGeometry(page){
  const box=page.view,unit=page.userUnit,rotation=page.rotate;
  if(!Array.isArray(box)||box.length!==4||box.some(value=>!Number.isFinite(value))||!Number.isFinite(unit)||unit<=0||unit>75000||!Number.isInteger(rotation)||rotation%90!==0)throw new Error('This page has unsupported or uncertain geometry.');
  const width=Math.abs(box[2]-box[0])*unit,height=Math.abs(box[3]-box[1])*unit;
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||width>1e9||height>1e9)throw new Error('This page’s physical dimensions could not be established.');
  const normalizedRotation=((rotation%360)+360)%360,swapped=normalizedRotation===90||normalizedRotation===270;
  const savedWidth=swapped?height:width,savedHeight=swapped?width:height;
  return {visibleBox:box.slice(),userUnit:unit,savedPageRotation:normalizedRotation,widthPoints:rounded(width),heightPoints:rounded(height),widthInches:rounded(width/72),heightInches:rounded(height/72),widthMillimeters:rounded(width*25.4/72),heightMillimeters:rounded(height*25.4/72),savedDisplayWidthPoints:rounded(savedWidth),savedDisplayHeightPoints:rounded(savedHeight),orientation:Math.abs(savedWidth-savedHeight)<0.5?'square':savedWidth>savedHeight?'landscape':'portrait',scope:'Visible page bounds reported by PDF.js, scaled by UserUnit; not a MediaBox/TrimBox/BleedBox prepress inspection.'};
}
function metadataFields(value){
  const rows=[],limits=[];let total=0;
  function add(namespace,key,input){
    if(input===undefined||input===null||input==='')return;
    let text;
    if(['string','number','boolean'].includes(typeof input))text=clean(input);
    else if(Array.isArray(input))text=input.slice(0,8).filter(item=>['string','number','boolean'].includes(typeof item)).map(clean).join('; ')+(input.length>8?' [more values omitted]':'');
    else return;
    if(text.length>MAX_FIELD){text=text.slice(0,MAX_FIELD)+' [truncated]';limits.push(namespace+':'+key+' exceeds 2,000 characters.');}
    if(total+text.length>MAX_METADATA){limits.push('Metadata exceeded the 32,000-character display limit.');return;}
    total+=text.length;rows.push({namespace,key,value:text});
  }
  for(const key of ['Title','Author','Subject','Keywords','Creator','Producer','CreationDate','ModDate','Trapped'])add('PDF information',key,value?.info?.[key]);
  if(value?.metadata&&typeof value.metadata.get==='function')for(const key of ['dc:title','dc:creator','dc:description','dc:subject','pdf:keywords','pdf:producer','xmp:creatortool','xmp:createdate','xmp:modifydate','xmp:metadatadate','xmp:rights','dc:rights'])add('XMP',key,value.metadata.get(key));
  return {fields:rows,limits,scope:'Standard information fields and selected XMP fields, shown as literal text. Metadata is supplied by the document and is not authenticated; dates are shown as declared, without guessing a time zone.'};
}
export class PdfFileDetails{
  constructor(reader){this.reader=reader;this.generation=0;this.disposed=false;}
  current(generation=this.generation){return !this.disposed&&!this.reader.disposed&&(this.inline?!!this.dialog?.isConnected:!!this.dialog?.open)&&generation===this.generation&&this.reader.doc===this.document&&this.reader.file===this.source&&this.reader.pageNumber===this.page;}
  open({health=false}={}){
    if(this.disposed||this.reader.disposed||!this.reader.doc)return null;
    this.close();this.document=this.reader.doc;this.source=this.reader.file;this.page=this.reader.pageNumber;this.trigger=document.activeElement;
    this.inline=!!this.reader?.hasToolStrip&&!!this.reader.paper?.isConnected;const dialog=make(this.inline?'section':'dialog',undefined,'pdf-file-details'+(this.inline?' file-details-inline':''));this.dialog=dialog;
    const heading=make('h2',health?'PDF document health report':'PDF file details');heading.id='pdf-details-'+crypto.randomUUID();dialog.setAttribute('aria-labelledby',heading.id);
    this.status=make('p','Reading details from the opened snapshot...','pdf-details-status');this.status.setAttribute('role','status');this.status.setAttribute('aria-live','polite');
    this.body=make('div',undefined,'pdf-details-body');
    const actions=make('div',undefined,'pdf-details-actions');this.refresh=make('button','Refresh','secondary');this.scan=make('button','Check all page sizes','secondary');this.cancelScan=make('button','Cancel page-size check','secondary');this.cancelScan.hidden=true;this.health=make('button','Run document health report','secondary');this.cancelHealth=make('button','Cancel health inspection','secondary');this.cancelHealth.hidden=true;this.save=make('button','Save details as JSON','secondary');const close=make('button','Close','primary');
    for(const button of [this.refresh,this.scan,this.cancelScan,this.health,this.cancelHealth,this.save,close])button.type='button';this.save.disabled=this.scan.disabled=this.health.disabled=true;
    close.onclick=()=>this.close();this.refresh.onclick=()=>this.load();this.scan.onclick=()=>this.checkGeometry();this.cancelScan.onclick=()=>this.geometryController?.abort();this.health.onclick=()=>this.checkHealth();this.cancelHealth.onclick=()=>this.healthController?.abort();this.save.onclick=()=>this.export();
    actions.append(this.refresh,this.scan,this.cancelScan,this.health,this.cancelHealth,this.save,close);dialog.append(heading,this.status,this.body,actions);if(this.inline)this.host=new ReaderPageToolHost(this.reader,{panel:dialog,label:'File details',allowQuick:true,onEscape:()=>this.close()});else{document.body.append(dialog);dialog.addEventListener('close',()=>{if(this.dialog===dialog)this.close();},{once:true});dialog.showModal();}close.focus();this.load().then(()=>{if(health&&this.current()&&this.report)this.checkHealth();});return dialog;
  }
  row(list,label,value){const term=make('dt',label),description=make('dd',value);list.append(term,description);}
  async load(){
    if(!this.current())return;this.controller?.abort();this.geometryController?.abort();this.geometryController=null;this.healthController?.abort();this.healthController=null;this.controller=new AbortController();const signal=this.controller.signal,generation=++this.generation;
    this.report=null;this.body.replaceChildren();this.refresh.disabled=true;this.scan.disabled=this.save.disabled=true;this.cancelScan.hidden=true;this.cancelHealth.hidden=true;this.health.disabled=true;this.status.textContent='Reading details from the opened snapshot...';
    const bytes=this.source.bytes,byteLength=bytes instanceof Uint8Array?bytes.byteLength:Number.isSafeInteger(this.source.size)?this.source.size:null;
    const report={version:1,inspectedAt:new Date().toISOString(),source:{name:clean(this.source.name).slice(0,500),type:'PDF',mimeType:'application/pdf',byteLength,sha256:null,hashStatus:'not available'},physicalPageCount:this.document.numPages,currentPage:{number:this.page,printedLabel:clean(this.reader.navigation?.labels?.[this.page-1]||'').slice(0,100)||null},permissions:{copying:'unknown',printing:'unknown',scope:'PDF reader permission flags, not operating-system file permissions or proof of ownership.'},encryption:{state:'unknown',scope:'Reported reader fact; never inferred from copying or printing restrictions.'},text:{state:'unknown',scope:'Current-page selectable text only. This does not prove that a page is a scan, blank, searchable throughout or correctly ordered.'},metadata:null,allPageGeometry:{state:'not checked'},limits:[],boundaries:'Details describe the immutable opened snapshot. No malware verdict, certificate validation, accessibility compliance, font preservation, prepress validation or physical-printer compatibility is established.'};
    try{
      const results=await Promise.allSettled([wait(this.document.getPage(this.page),signal),wait(this.document.getMetadata(),signal),wait(this.document.getPermissions(),signal),bytes instanceof Uint8Array&&bytes.length&&bytes.length<=MAX_BYTES?wait(crypto.subtle.digest('SHA-256',bytes),signal):Promise.resolve(null)]);
      if(!this.current(generation))return;
      const [page,metadata,permissions,hash]=results;
      if(page.status==='fulfilled'){try{report.currentPage.geometry=pdfPageGeometry(page.value);report.currentPage.viewRotation=((Number(this.reader.viewRotation)||0)%360+360)%360;}catch(error){report.limits.push(error.message);}}else report.limits.push('Current page geometry could not be read.');
      if(metadata.status==='fulfilled'){
        report.metadata=metadataFields(metadata.value);report.limits.push(...report.metadata.limits);
        const info=metadata.value?.info;
        if(typeof info?.PDFFormatVersion==='string')report.source.pdfVersion=clean(info.PDFFormatVersion).slice(0,30);
        if(info&&Object.hasOwn(info,'EncryptFilterName')){
          if(typeof info.EncryptFilterName==='string'&&info.EncryptFilterName.length){report.encryption.state='reader reports encryption';report.encryption.filter=clean(info.EncryptFilterName).slice(0,100);}
          else if(info.EncryptFilterName===null)report.encryption.state='reader reports no encryption filter';
        }
      }else report.limits.push('Metadata and reader encryption information could not be read.');
      if(permissions.status==='fulfilled'){
        const rawPermissions=permissions.value,values=rawPermissions instanceof Set&&rawPermissions.size<64?[...rawPermissions]:rawPermissions;
        if(values===null){report.permissions.copying='no copying restriction reported';report.permissions.printing='no printing restriction reported';}
        else if(Array.isArray(values)&&values.length<64&&values.every(Number.isInteger)){report.permissions.copying=values.includes(PermissionFlag.COPY)?'allowed by PDF flags':'restricted by PDF flags';report.permissions.printing=values.includes(PermissionFlag.PRINT)||values.includes(PermissionFlag.PRINT_HIGH_QUALITY)?'allowed by PDF flags':'restricted by PDF flags';}
        const canInspect=values===null||Array.isArray(values)&&values.length<64&&values.every(Number.isInteger)&&values.includes(PermissionFlag.COPY);
        if(canInspect&&page.status==='fulfilled'){
          try{
            const content=await wait(page.value.getTextContent(),signal);if(!this.current(generation))return;
            if(!Array.isArray(content?.items)||content.items.length>100000)throw new Error('The current page exceeds the 100,000-text-item inspection limit.');
            let characters=0;for(const item of content.items)if(typeof item.str==='string'){characters+=item.str.length;if(characters>2*1024*1024)throw new Error('The current page exceeds the 2 MiB text inspection limit.');}
            report.text={...report.text,state:characters?'selectable text found':'no selectable text found; scan or blank-page status uncertain',characterCount:characters};
          }catch(error){report.limits.push('Current-page text inspection did not complete. '+clean(error.message).slice(0,200));}
        }else report.text.state=report.permissions.copying==='restricted by PDF flags'?'not inspected because copying is restricted':'unknown; copying permission or page unavailable';
      }else report.limits.push('PDF permission flags could not be read.');
      if(hash.status==='fulfilled'&&hash.value){report.source.sha256=[...new Uint8Array(hash.value)].map(value=>value.toString(16).padStart(2,'0')).join('');report.source.hashStatus='SHA-256 of provided opened snapshot bytes';}
      else if(hash.status==='rejected')report.limits.push('The source SHA-256 could not be computed.');
      if(!this.current(generation))return;this.report=report;this.render();this.status.textContent=report.limits.length?'Details read with the limitations listed below.':'Opened-snapshot details read.';
    }catch(error){if(this.current(generation))this.status.textContent=clean(error.message).slice(0,500);}
    finally{if(this.current(generation)){this.refresh.disabled=false;this.scan.disabled=this.health.disabled=!this.report||this.document.numPages>MAX_PAGES;this.save.disabled=!this.report||!this.source.id||!window.pdfix?.exportDocument;}}
  }
  render(){
    const report=this.report;this.body.replaceChildren();const facts=make('dl',undefined,'pdf-details-facts');
    this.row(facts,'Opened filename',report.source.name);this.row(facts,'Type',report.source.type+(report.source.pdfVersion?' '+report.source.pdfVersion:''));this.row(facts,'File size',report.source.byteLength===null?'Unknown':report.source.byteLength.toLocaleString()+' bytes');this.row(facts,'Physical pages',String(report.physicalPageCount));this.row(facts,'Current page',String(report.currentPage.number)+(report.currentPage.printedLabel?' / printed label '+report.currentPage.printedLabel:''));
    const geometry=report.currentPage.geometry;
    if(geometry){this.row(facts,'Visible page size',`${geometry.widthPoints} x ${geometry.heightPoints} pt / ${geometry.widthInches} x ${geometry.heightInches} in / ${geometry.widthMillimeters} x ${geometry.heightMillimeters} mm`);this.row(facts,'Saved page orientation',geometry.orientation);this.row(facts,'Page unit scale',String(geometry.userUnit)+' (one unit = UserUnit / 72 inch)');this.row(facts,'Saved page rotation',geometry.savedPageRotation+' degrees');this.row(facts,'PDFix view rotation',report.currentPage.viewRotation+' degrees; changes only this reading view');}
    else this.row(facts,'Page dimensions','Unknown');
    this.row(facts,'Copying',report.permissions.copying);this.row(facts,'Printing',report.permissions.printing);this.row(facts,'Encryption',report.encryption.state+(report.encryption.filter?' / filter '+report.encryption.filter:''));this.row(facts,'Selectable text',report.text.state);this.row(facts,'Source SHA-256',report.source.sha256||'Unknown / '+report.source.hashStatus);this.row(facts,'All-page geometry',report.allPageGeometry.summary||report.allPageGeometry.state);this.body.append(facts);
    if(geometry)this.body.append(make('p',geometry.scope,'pdf-details-note'));
    this.body.append(make('p',report.permissions.scope,'pdf-details-note'),make('p',report.text.scope,'pdf-details-note'),make('h3','Declared metadata'));
    if(report.metadata?.fields.length){const values=make('dl',undefined,'pdf-details-facts');for(const item of report.metadata.fields)this.row(values,item.namespace+' / '+item.key,item.value);this.body.append(values);}else this.body.append(make('p',report.metadata?'No listed metadata fields were found.':'Metadata is unavailable.'));
    if(report.metadata)this.body.append(make('p',report.metadata.scope,'pdf-details-note'));
    if(report.limits.length){this.body.append(make('h3','Inspection limits'));const list=make('ul');for(const issue of report.limits)list.append(make('li',issue));this.body.append(list);}
    if(report.health)this.renderHealth(report.health);
    this.body.append(make('p',report.boundaries,'pdf-details-note'));
  }
  async checkGeometry(){
    if(!this.current()||!this.report||this.document.numPages>MAX_PAGES||this.geometryController)return;
    const generation=this.generation,controller=new AbortController();this.geometryController=controller;this.scan.disabled=this.health.disabled=this.refresh.disabled=this.save.disabled=true;this.cancelScan.hidden=false;
    const groups=new Map();let checked=0;const started=performance.now();
    try{
      for(let page=1;page<=this.document.numPages;page++){
        if(!this.current(generation)||controller.signal.aborted)throw new Error('Page-size check canceled.');if(performance.now()-started>30000)throw new Error('The all-page geometry check exceeded 30 seconds.');
        const proxy=await wait(this.document.getPage(page),controller.signal,5000),geometry=pdfPageGeometry(proxy);
        const size=[geometry.savedDisplayWidthPoints,geometry.savedDisplayHeightPoints].map(value=>Math.round(value*10)/10),key=size.join('x');
        const group=groups.get(key)||{widthPoints:size[0],heightPoints:size[1],count:0,firstPage:page};group.count++;groups.set(key,group);checked++;
        if(checked%10===0||checked===this.document.numPages)this.status.textContent=`Checking page dimensions: ${checked} of ${this.document.numPages}...`;
      }
      if(!this.current(generation))return;
      this.report.allPageGeometry={state:'complete',checkedPages:checked,groups:[...groups.values()],comparisonRoundingPoints:0.1,summary:groups.size===1?'All '+checked+' visible pages have the same dimensions and saved orientation (rounded to 0.1 pt).':groups.size+' different visible size/orientation groups across '+checked+' pages. View rotation is excluded.'};
      this.render();this.status.textContent='All-page geometry check completed; no pages were rendered.';
    }catch(error){if(this.current(generation)){this.report.allPageGeometry={state:controller.signal.aborted?'canceled':'incomplete',checkedPages:checked,summary:clean(error.message).slice(0,250)+' '+checked+' pages checked; no conclusion about all page sizes.'};this.render();this.status.textContent=this.report.allPageGeometry.summary;}}
    finally{if(this.geometryController===controller)this.geometryController=null;if(this.current(generation)){this.cancelScan.hidden=true;this.scan.disabled=this.health.disabled=this.refresh.disabled=false;this.save.disabled=!this.source.id||!window.pdfix?.exportDocument;}}
  }
  async checkHealth(){
    if(!this.current()||!this.report||this.healthController||this.geometryController||this.document.numPages>MAX_PAGES)return;
    const generation=this.generation,controller=new AbortController();this.healthController=controller;
    this.health.disabled=this.scan.disabled=this.refresh.disabled=this.save.disabled=true;this.cancelHealth.hidden=false;
    const health={};this.report.health=health;
    const check=()=>{if(controller.signal.aborted||!this.current(generation))throw new Error('Health inspection canceled.');};
    try{
      await inspectPdfHealth({doc:this.document,copyAllowed:this.report.permissions.copying==='allowed by PDF flags'||this.report.permissions.copying==='no copying restriction reported',geometry:pdfPageGeometry,read:promise=>wait(promise,controller.signal,5000),check,report:health,onProgress:(number,total)=>{if(this.current(generation))this.status.textContent=`Inspecting document health: ${number} of ${total} pages…`;}});
      if(this.current(generation))this.status.textContent=`Check finished: ${health.checkedPages} ${health.checkedPages===1?'page':'pages'}, ${health.issues.length+health.omittedIssues} ${health.issues.length+health.omittedIssues===1?'thing':'things'} to look at. What was and was not checked is listed below.`;
    }catch(error){if(this.current(generation)){if(controller.signal.aborted)health.state='canceled';this.status.textContent=clean(error.message).slice(0,400)+` ${health.checkedPages||0} complete pages; this report is partial.`;}}
    finally{if(this.healthController===controller)this.healthController=null;if(this.current(generation)){this.cancelHealth.hidden=true;this.health.disabled=this.scan.disabled=this.refresh.disabled=false;this.save.disabled=!this.source.id||!window.pdfix?.exportDocument;this.render();}}
  }
  renderHealth(health){
    this.body.append(make('h3','Document health observations'),make('p',health.scope,'pdf-details-note'));
    const facts=make('dl',undefined,'pdf-details-facts'),counts=health.counts||{};
    this.row(facts,'Inspection coverage',`${health.state} · ${health.checkedPages||0} of ${health.totalPages||this.document.numPages} complete pages`);
    this.row(facts,'Visible page geometry',`${counts.geometryRead||0} pages · ${health.sizeGroups?.length||0} size/orientation groups`);
    this.row(facts,'Selectable text',`${counts.textRead||0} pages read · ${counts.pagesWithoutText||0} without selectable text`);
    this.row(facts,'Links',`${counts.links||0} encountered · ${counts.internalLinksResolved||0} internal destinations resolved · ${counts.webAddressesRecognized||0} web addresses recognized; reachability not checked`);
    this.row(facts,'Structure presence',`${counts.pagesWithStructure||0} of ${counts.structureRead||0} inspected pages have a structure tree; correctness not checked`);
    this.row(facts,'Form widgets',String(counts.formFields||0));this.body.append(facts);
    const issues=health.issues||[];
    if(issues.length){
      const list=make('ol'),controls=make('div',undefined,'pdf-health-pagination'),previous=make('button','Previous observations','secondary compact'),next=make('button','Next observations','secondary compact'),position=make('span');let offset=0;
      previous.type=next.type='button';
      const draw=()=>{list.replaceChildren();list.start=offset+1;for(const item of issues.slice(offset,offset+50))list.append(make('li',(item.page?'Page '+item.page+': ':'Document: ')+item.message));position.textContent=`${offset+1}–${Math.min(offset+50,issues.length)} of ${issues.length}`;previous.disabled=offset===0;next.disabled=offset+50>=issues.length;};
      previous.onclick=()=>{offset=Math.max(0,offset-50);draw();};next.onclick=()=>{offset=Math.min(Math.floor((issues.length-1)/50)*50,offset+50);draw();};controls.append(previous,position,next);this.body.append(list,controls);draw();
    }else this.body.append(make('p','No observations recorded in the inspected subset. Unread checks still apply.'));
    if(health.omittedIssues)this.body.append(make('p',`${health.omittedIssues} additional observations omitted after the 1,000-observation limit.`,'pdf-details-note'));
    for(const message of health.limits||[])this.body.append(make('p',message,'pdf-details-note'));
    this.body.append(make('h3','Checks outside this report'));const unread=make('ul');for(const item of health.notChecked||[])unread.append(make('li',item));this.body.append(unread);
  }
  async export(){
    if(!this.current()||!this.report||!this.source.id||!window.pdfix?.exportDocument||this.save.disabled)return;
    const generation=this.generation;this.save.disabled=true;
    try{const bytes=new TextEncoder().encode(JSON.stringify(this.report,null,2)+'\n');if(bytes.length>1024*1024)throw new Error('This report exceeds its 1 MiB export size limit.');const output=await window.pdfix.exportDocument(this.source.id,'json',bytes);if(this.current(generation))this.status.textContent=output?'Details saved as a new JSON copy.':'Details export canceled.';}
    catch(error){if(this.current(generation))this.status.textContent=clean(error.message).slice(0,500);}
    finally{if(this.current(generation))this.save.disabled=false;}
  }
  pageChanged(){if(this.dialog&&(this.reader.pageNumber!==this.page||this.reader.doc!==this.document||this.reader.file!==this.source||this.reader.disposed))this.close();}
  close(){this.generation++;this.controller?.abort();this.controller=null;this.geometryController?.abort();this.geometryController=null;this.healthController?.abort();this.healthController=null;const dialog=this.dialog;this.dialog=null;if(dialog){if(this.inline){this.host?.dispose();this.host=null;}else if(dialog.open)dialog.close();dialog.remove();if(this.trigger?.isConnected&&!this.reader.disposed)this.trigger.focus();}this.report=null;}
  dispose(){this.disposed=true;this.close();}
}
