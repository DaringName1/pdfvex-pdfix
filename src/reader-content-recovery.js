import './reader-content-recovery.css';

export async function showContentRecoveryNotice(reader){
 if(!reader.file.id||!reader.doc||!reader.hasToolStrip||!reader.sourceCapabilities.wholeFileTools)return;
 const draft=await window.pdfix.loadPdfContent(reader.file.id);
 if(reader.disposed||!reader.root.isConnected||!draft||!(draft.objects?.length||draft.replacements?.length||draft.imageReplacements?.length||Object.keys(draft.metadata||{}).length))return;
 const doc=reader.root.ownerDocument,panel=doc.createElement('section'),text=doc.createElement('span'),show=doc.createElement('button');
 panel.className='reader-content-recovery';panel.setAttribute('role','region');panel.setAttribute('aria-label','Recovered PDF additions');text.textContent='Unsaved additions from before PDFix closed are available.';show.type='button';show.className='secondary compact';show.textContent='Show unsaved additions';panel.append(text,show);reader.root.prepend(panel);
 show.onclick=async()=>{show.disabled=true;try{await reader.showToolGroup('Home');await reader.homeTextTools.activate();const workspace=reader.homeTextWorkspace;if(!workspace||workspace.closed)throw Error('Your saved additions could not open. Try again.');const item=workspace.objects.find(item=>item.type==='text')||workspace.objects[0];if(item){workspace.selected=item.id;await reader.go(item.page+1);workspace.render();reader.homeTextTools.sync();}panel.remove();}catch(error){text.textContent=error.message;show.disabled=false;}};
}
