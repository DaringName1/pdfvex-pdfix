export function draftPreview(draft){
 if(typeof draft.text==='string')return draft.text.replace(/\s+/g,' ').trim().slice(0,100);
 let text='';const visit=node=>{if(!node||text.length>=120)return;if(typeof node.text==='string')text+=node.text+' ';if(Array.isArray(node.content))for(const child of node.content)visit(child);};visit(draft.content);return text.replace(/\s+/g,' ').trim().slice(0,100);
}
export async function renderRecoverableFiles(main,{onContinue}){
 if(!window.pdfix?.recoverableRecents)return;const section=document.createElement('section');section.hidden=true;section.setAttribute('role','region');section.setAttribute('aria-label','Unsaved file changes');main.append(section);
 try{const rows=await window.pdfix.recoverableRecents(20);if(!section.isConnected||!rows.length)return;const heading=document.createElement('h2'),list=document.createElement('div');heading.textContent='Unsaved changes in your files';list.className='unsaved-document-list';section.append(heading,list);for(const row of rows){const button=document.createElement('button'),name=document.createElement('b'),description=document.createElement('span');button.type='button';button.className='secondary unsaved-document';name.textContent=row.name;description.textContent=(row.kinds?.some(kind=>kind==='marks'||kind==='form')?'Unsaved additions from before PDFix closed':'Saved on this computer')+(row.savedAt?' · '+new Date(row.savedAt).toLocaleString():'');button.append(name,description);button.setAttribute('aria-label','Continue changes in '+row.name);button.onclick=()=>onContinue(row.id);list.append(button);}section.hidden=false;
 }catch{if(section.isConnected){section.textContent='Saved work could not be listed. Open your file to check for recovery.';section.hidden=false;}}
}
