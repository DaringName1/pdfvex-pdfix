import './pdf-home-text.css';

// Reuse the document's live controls and command handlers in the same four
// groups as PDF Home. No second editor, formatting model or save path.
export function installDocumentHomeGroups(toolbar){
 const {workspace,root,quick}=toolbar;if(workspace.sourceMode)return{dispose(){}};
 const home=toolbar.panelByName.get('home'),doc=root.ownerDocument,format=workspace.formatting.root;
 const emphasis=quick.querySelector('[aria-label="Paragraph style and emphasis"]'),lists=home.querySelector('[aria-label="Lists and indent"]'),find=home.querySelector('[aria-label="Find"]'),spacing=home.querySelector('.document-spacing-menu');
 const parents=[quick,home,emphasis,lists,find,format].filter(Boolean),snapshots=parents.map(parent=>({parent,children:[...parent.childNodes]})),hidden=[...home.children].map(node=>[node,node.hidden]),quickHidden=quick.hidden;
 const bar=doc.createElement('div');bar.className='pdf-home-formatting document-home-formatting';
 const command=name=>root.querySelector('[data-command="'+name+'"]');
 const group=name=>{const node=doc.createElement('div'),caption=doc.createElement('span');node.className='pdf-home-format-group';node.setAttribute('role','group');node.setAttribute('aria-label',name);caption.className='pdf-home-group-caption';caption.textContent=name;node.append(caption);bar.append(node);return node;};
 const style=group('Style'),font=group('Font'),paragraph=group('Paragraph'),search=group('Find');
 style.append(root.querySelector('[aria-label="Paragraph style"]'));
 const fontLabel=format.querySelector('[data-text-font]').closest('label'),sizeLabel=format.querySelector('[data-text-size]').closest('label'),colorLabel=format.querySelector('[data-text-color]').closest('label'),clear=format.querySelector('[data-clear-text-style]'),alignment=format.querySelector('.document-align-buttons');
 format.replaceChildren(fontLabel,sizeLabel,...['bold','italic','underline','strike','superscript','subscript'].map(command),colorLabel,toolbar.highlight,clear);font.append(format);
 const clearHandler=clear.onclick;clear.onclick=()=>{workspace.editor.chain().focus().unsetAllMarks().clearNodes().run();workspace.formatState();};
 paragraph.append(...['bulletList','orderedList'].map(command),toolbar.listLevel.liftListItem,toolbar.listLevel.sinkListItem,alignment,spacing);
 for(const[button,name,text]of [[toolbar.listLevel.liftListItem,'Decrease indent','⇤'],[toolbar.listLevel.sinkListItem,'Increase indent','⇥']]){button.setAttribute('aria-label',name);button.textContent=text;}
 if(find?.firstElementChild)search.append(find.firstElementChild);
 for(const [node]of hidden)if(node.parentElement===home)node.hidden=true;
 quick.hidden=true;home.append(bar);root.dataset.unifiedHome='true';
 return{dispose(){clear.onclick=clearHandler;for(const{parent,children}of snapshots)parent.append(...children);for(const[node,value]of hidden)node.hidden=value;quick.hidden=quickHidden;bar.remove();delete root.dataset.unifiedHome;}};
}
