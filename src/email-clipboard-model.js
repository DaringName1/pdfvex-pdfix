import {textDocument} from './document-codec.js';
import {validateDocumentImage,validateDocumentImages} from './document-image-model.js';
import {sanitizeDocumentHTML} from './document-html.js';
const escape=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export function attachmentSize(size){return size===null?'decoded size unavailable':size.toLocaleString()+' decoded bytes';}
export function emailCreationDocument(report,title=report.title){
 if(report?.version!==1||!Array.isArray(report.headers)||!Array.isArray(report.attachments)||!report.body||!['text','html'].includes(report.body.kind))throw new Error('Choose a supported contained email report.');
 const headers=report.headers.map(header=>'<p><strong>'+escape(header.name)+': </strong>'+escape(header.value)+'</p>').join('');
 const body=report.body.kind==='html'?report.body.content:report.body.content.split('\n').map(line=>'<p>'+escape(line)+'</p>').join('');
 const inventory=report.attachments.length?'<h2>Attachment inventory</h2>'+report.attachments.map(item=>'<p><strong>'+escape(item.name)+'</strong> — '+escape(item.mime)+'; '+escape(attachmentSize(item.size))+'. Omitted: '+escape(item.reason)+'</p>').join(''):'<p>Attachment inventory: no MIME attachments detected.</p>';
 const initialContent=sanitizeDocumentHTML('<h1>'+escape(title)+'</h1>'+headers+'<hr>'+body+'<hr>'+inventory);
 if(new TextEncoder().encode(initialContent).length>1600000)throw new Error('The email document exceeds the editable creation limit.');
 return {title,initialContent,importWarning:'Created from a local EML snapshot. Supported headers/body are editable; original message layout is simplified. '+report.warnings.join(' ')+' Review the document and PDF export before saving a separate copy.'};
}
export function clipboardCreationDocument(items,title='Clipboard document'){
 if(!Array.isArray(items)||!items.length||items.length>20)throw new Error('Paste up to 20 text/image items, then review their order.');
 const content=[];
 for(const item of items){if(item.kind==='text'){if(typeof item.text!=='string'||new TextEncoder().encode(item.text).length>1024*1024)throw new Error('Each clipboard text item is limited to 1 MiB.');content.push(...textDocument(item.text).content);}else if(item.kind==='image'){validateDocumentImage(item.attrs);content.push({type:'paragraph',content:[{type:'documentImage',attrs:{...item.attrs}}]});}else throw new Error('Unsupported clipboard item.');}
 const initialContent={type:'doc',content};validateDocumentImages(initialContent);
 if(new TextEncoder().encode(JSON.stringify(initialContent)).length>1600000)throw new Error('The arranged document exceeds 1.6 MB. Remove or shorten items before creating it.');
 return {title,initialContent,importWarning:'Created from explicitly pasted local clipboard text and static images. Clipboard HTML, files and unsupported formats are omitted. Images remain inline and can be resized/aligned in the editor; pixels may be reduced to fit the embedded asset limit. Review page setup and the PDF export before saving a separate copy.'};
}
