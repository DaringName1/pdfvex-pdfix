import './reader-content-recovery.css';

export async function showContentRecoveryNotice(reader){
 if(!reader.file.id||!reader.doc||!reader.hasToolStrip||!reader.sourceCapabilities.wholeFileTools)return;
 const {id}=reader.file,api=window.pdfix;
 const results=await Promise.allSettled([api.loadPdfContent(id),api.loadMarkup(id),api.loadForm(id)]);
 if(reader.disposed||!reader.root.isConnected)return;
 const [draft,marks,form]=results.map(result=>result.value);
 const doc=reader.root.ownerDocument,panel=doc.createElement('section'),text=doc.createElement('span');
 panel.className='reader-content-recovery';panel.setAttribute('role','region');panel.setAttribute('aria-label','Recovered PDF additions');text.textContent='Unsaved additions from before PDFix closed are available.';panel.append(text);
 const add=(label,open)=>{
  const button=doc.createElement('button');button.type='button';button.className='secondary compact';button.textContent=label;panel.append(button);
  button.onclick=async()=>{
   const buttons=[...panel.querySelectorAll('button')];for(const control of buttons)control.disabled=true;
   try{await open();button.remove();if(!panel.querySelector('button'))panel.remove();}
   catch(error){reader.announce(error.message,true);}
   finally{for(const control of buttons)control.disabled=false;}
  };
 };
 if(draft&&(draft.objects?.length||draft.replacements?.length||draft.imageReplacements?.length||Object.keys(draft.metadata||{}).length))add('Show unsaved additions',async()=>{
  await reader.showToolGroup('Home');await reader.homeTextTools.activate();const workspace=reader.homeTextWorkspace;
  if(!workspace||workspace.closed)throw Error('Your saved additions could not open. Try again.');
  const item=workspace.objects.find(item=>item.type==='text')||workspace.objects[0];if(item){workspace.selected=item.id;await reader.go(item.page+1);workspace.render();reader.homeTextTools.sync();}
 });
 if(marks?.marks?.length)add('Show unsaved marks',async()=>{
  await reader.openCommentMode('read',marks.marks[0].page+1);
  if(!reader.commentWorkspace?.recovered)throw Error('Your saved marks could not open. Try again.');
 });
 if(form)add('Show unsaved form answers',async()=>{
  reader.setInteractionMode('quick');const workspace=await reader.openQuickForm();
  if(!workspace?.recovered)throw Error('Your saved form answers could not open. Try again.');
  workspace.enableHomeSave();
 });
 if(panel.querySelector('button'))reader.root.prepend(panel);
 const failed=results.find(result=>result.status==='rejected');
 if(failed)throw failed.reason;
}
