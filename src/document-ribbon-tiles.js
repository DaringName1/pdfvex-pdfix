// Add artwork to existing entry points, without replacing commands or summary behaviour.
const paths={
 table:'<rect x="3" y="3" width="18" height="18"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
 picture:'<rect x="3" y="3" width="18" height="18"/><circle cx="8" cy="8" r="2"/><path d="m3 18 6-6 4 4 4-7 4 9"/>',
 link:'<path d="m9 15 6-6m-8 3-3 3a4 4 0 0 0 6 6l3-3m-2-12 3-3a4 4 0 0 1 6 6l-3 3"/>',
 page:'<path d="M5 2h10l4 4v16H5ZM9 10h6m-6 4h6m-6 4h6"/>',
 find:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
 text:'<path d="M4 4h16M12 4v16M8 20h8"/>',
 view:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 save:'<path d="M4 3h13l3 3v15H4ZM8 3v6h8V3M8 15h8v6"/>'
};
export function decorateDocumentTiles(toolbar){
 if(toolbar.workspace.sourceMode)return;
 for(const [name,panel]of toolbar.panelByName){if(name==='home')continue;
  const targets=panel.querySelectorAll(':scope > button,:scope > .document-command-group > button,:scope > details > summary,:scope > .document-copy-exports > button');
  for(const button of targets){if(button.querySelector('.document-tile-icon'))continue;const caption=(button.getAttribute('aria-label')||button.textContent).trim(),word=caption.toLowerCase(),key=word.includes('table')?'table':/picture|image/.test(word)?'picture':/link/.test(word)?'link':/find|search/.test(word)?'find':/view|size|width|read/.test(word)?'view':/save|export/.test(word)?'save':/text|spell|select/.test(word)?'text':'page';
   const icon=panel.ownerDocument.createElement('span');icon.className='document-tile-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+paths[key]+'</svg>';button.prepend(icon);button.classList.add('document-command-tile');button.title||=caption;
  }
 }
}
