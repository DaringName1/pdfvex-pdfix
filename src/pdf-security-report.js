import './pdf-security-report.css';
const rowLabels = [
  ['javascript','JavaScript-bearing dictionaries'], ['additionalActions','Additional-action dictionaries'], ['openActions','Document/open-action entries'],
  ['actions','Action dictionaries'], ['linkActions','External-link, launch or submission actions'], ['embeddedStreams','Embedded-file streams'],
  ['attachmentSpecs','Embedded-file descriptions'], ['optionalLayers','Optional-content layer dictionaries'], ['formFields','Dictionaries with a form field type'],
  ['signatureFields','Signature field dictionaries'], ['signatureDictionaries','Signature or signed-byte-range dictionaries'], ['xmpStreams','XML metadata stream dictionaries'],
  ['multimedia','Multimedia or 3D dictionaries'], ['invalidObjects','Uninspectable objects']
];
const flagLabels = [['xfa','XFA forms'],['acroForm','AcroForm entry'],['optionalContent','Optional-content settings'],['embeddedFileNameTree','Embedded-file name tree'],['informationMetadata','Document information metadata'],['tagged','Structure tags']];
const element = (tag,text,className) => { const node=document.createElement(tag); if(text!==undefined)node.textContent=text; if(className)node.className=className;return node; };
function reportText(file, report) {
  return ['PDFix PDF security report', file.name, 'Snapshot SHA-256: '+report.sha256, 'Inspected: '+report.inspectedAt,
    report.complete?'Structural traversal completed within its limits.':'Inspection incomplete. Counts are minimum findings; unreadable structures may contain additional items.',
    'Encryption: '+(report.encrypted?'present':'not found in the parsed trailer'), 'Certificate signature validity: unable to verify',
    ...rowLabels.map(([key,label])=>label+': '+report.counts[key]), ...flagLabels.map(([key,label])=>label+': '+(report.flags[key]?'present':'not found in inspected structures')),
    'Action types: '+(report.actionTypes.map(item=>item.type+' ('+item.count+')').join(', ')||'none found'),
    'Embedded-file descriptions (not extracted):', ...report.attachments.map(item=>item.name+' | declared type: '+item.type+' | declared size: '+(item.declaredBytes===null?'unknown':item.declaredBytes+' bytes')+(item.description?' | '+item.description:'')),
    ...report.limits, report.scope, report.boundaries,
    'Visual signatures, typed names and initials are not certificate signatures. Certificate presence does not establish identity, validity or trust. Absence from this inventory does not establish that a PDF is safe.'
  ].join('\n\n');
}
export function showPdfSecurityReport(file,{announce=()=>{}}={}) {
  if(file?.ext!=='pdf'||typeof file.id!=='string'){announce('Open a PDF to inspect its security information.',true);return null;}
  const dialog=element('dialog',undefined,'pdf-security-report');dialog.setAttribute('aria-labelledby','pdf-security-report-heading');
  const heading=element('h2','PDF security report');heading.id='pdf-security-report-heading';
  const title=element('p',file.name,'security-file-name');
  const status=element('p','Reading structural information from the opened source snapshot…','security-report-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const body=element('div',undefined,'security-report-body');
  const actions=element('div',undefined,'security-report-actions'),save=element('button','Save report as text','secondary'),close=element('button','Close','primary');save.type=close.type='button';save.disabled=true;
  actions.append(save,close);dialog.append(heading,title,status,body,actions);document.body.append(dialog);
  let closed=false,report=null;
  close.onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{closed=true;window.pdfix.cancelPdfSecurity?.(file.id).catch(()=>{});dialog.remove();},{once:true});
  dialog.showModal();
  const paragraph=(text,className)=>body.append(element('p',text,className));
  window.pdfix.readPdfSecurity(file.id).then(value=>{
    if(closed)return;report=value;
    status.textContent=value.complete?'Structural inspection completed. This inventory is not a safety certification.':'Inspection incomplete. Counts are minimum findings and may exclude unreadable structures.';
    paragraph('Encryption: '+(value.encrypted?'present; encrypted content cannot be fully inspected here.':'not found in the parsed document trailer.'));
    paragraph('Certificate signature validity: unable to verify. Presence does not establish identity, integrity or trust. Visual signatures, typed names and initials are separate from certificate signatures.','security-report-warning');
    const table=element('table'),caption=element('caption','Items found in parsed structures'),head=element('thead'),header=element('tr');header.append(element('th','Structure'),element('th','Count'));head.append(header);const rows=element('tbody');
    for(const[key,label]of rowLabels){const row=element('tr');row.append(element('th',label),element('td',String(value.counts[key])));row.firstElementChild.scope='row';rows.append(row);}table.append(caption,head,rows);body.append(table);
    const list=element('ul');for(const[key,label]of flagLabels)list.append(element('li',label+': '+(value.flags[key]?'present':'not found in inspected structures')));body.append(list);
    paragraph('Action types: '+(value.actionTypes.map(item=>item.type+' ('+item.count+')').join(', ')||'none found in inspected structures')+'. No action was executed.');
    if(value.attachments.length){body.append(element('h3','Embedded files — descriptions only'));paragraph('Names, types and sizes come from PDF metadata and can be misleading. No attachment has been extracted or opened.');const files=element('ul');for(const item of value.attachments)files.append(element('li',item.name+' · declared type: '+item.type+' · declared size: '+(item.declaredBytes===null?'unknown':item.declaredBytes.toLocaleString()+' bytes')+(item.description?' · '+item.description:'')));body.append(files);}
    if(value.limits.length){body.append(element('h3','Inspection limits'));const issues=element('ul');for(const issue of value.limits)issues.append(element('li',issue));body.append(issues);}
    paragraph(value.scope,'footnote');paragraph(value.boundaries,'footnote');paragraph('Snapshot SHA-256: '+value.sha256,'security-report-fingerprint');save.disabled=false;
  }).catch(error=>{if(closed)return;status.textContent=error.message||'This report could not be prepared.';paragraph('Inspection failed. No conclusion about document safety or signature validity can be made.','security-report-warning');});
  save.onclick=async()=>{if(!report||closed)return;save.disabled=true;try{const output=await window.pdfix.exportDocument(file.id,'txt',new TextEncoder().encode(reportText(file,report)));if(output){status.textContent='Saved report as '+output.name+'.';if(!output.continueToken)announce('PDF security report saved as a new text copy.');}}catch(error){if(!closed)status.textContent=error.message;}finally{if(!closed)save.disabled=false;}};
  return dialog;
}
