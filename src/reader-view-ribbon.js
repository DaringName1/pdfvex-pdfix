import {installHomeRibbon} from './reader-home-ribbon.js';
import './reader-view-ribbon.css';

// View mode retains its reading controls. Build groups those same source
// buttons, with anchors returning them to their original containers on exit.
export function installViewRibbon(panel,more){
 let ribbon=null,moved=[],containers=[],contents=new Map();
 const groups=[
  ['Zoom and turn',['Fit page','Rotate view','Hand tool','Zoom to region','Previous view','Next view','Return to previous view','Show PDF only in fullscreen']],
  ['Go to',['Pages panel','Search panel','Save page']],
  ['Read',['Read aloud','Copy page text','Word count','Review spelling']],
  ['Document',['File details','Go to sheet label','PDF layers','Accessibility tag tree','Accessibility audit','Notes on this page']]
 ];
 const icons={
  'Show PDF only in fullscreen':'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  'Fit page':'<rect x="5" y="2" width="14" height="20"/><path d="M8 6h8m-8 12h8"/>',
  'Rotate view':'<path d="M4 10a8 8 0 1 1 1 8M4 3v7h7"/>',
  'Zoom to region':'<path d="M3 8V3h5m8 0h5v5m0 8v5h-5M8 21H3v-5"/><circle cx="11" cy="11" r="4"/><path d="m14 14 4 4"/>',
  'Previous view':'<path d="m10 5-7 7 7 7M3 12h18"/>',
  'Next view':'<path d="m14 5 7 7-7 7M3 12h18"/>',
  'Return to previous view':'<path d="m9 4-6 6 6 6M3 10h11a6 6 0 0 1 0 12"/>',
  'Hand tool':'<path d="M6 12V7a2 2 0 0 1 4 0V4a2 2 0 0 1 4 0v3a2 2 0 0 1 4 0v3a2 2 0 0 1 3 2l-2 8H8l-5-7a2 2 0 0 1 3-1Zm4-5v6m4-6v6m4-3v4"/>',
  'Pages panel':'<rect x="3" y="3" width="7" height="8"/><rect x="14" y="3" width="7" height="8"/><rect x="3" y="15" width="7" height="6"/><rect x="14" y="15" width="7" height="6"/>',
  'Search panel':'<path d="M3 3h18v18H3ZM9 3v18"/><circle cx="15" cy="10" r="3"/><path d="m17 12 3 3"/>',
  'Save page':'<path d="M6 2h12v20l-6-4-6 4Z"/>',
  'Read aloud':'<path d="m3 9 5 0 6-5v16l-6-5H3Zm14-3a8 8 0 0 1 0 12m2-15a12 12 0 0 1 0 18"/>',
  'Copy page text':'<path d="M8 7h13v15H8ZM3 17V2h13M11 11h7m-7 4h7m-7 4h5"/>',
  'Word count':'<path d="M3 5h12M3 11h8M3 17h6m5-6v10m-3-7h7m-2-3v10"/>',
  'Review spelling':'<path d="m3 13 4-10 4 10M4 10h6m3 7 3 3 6-8"/>',
  'File details':'<circle cx="12" cy="12" r="10"/><path d="M12 11v7m0-12v1"/>',
  'Go to sheet label':'<path d="M3 3h12l7 9-10 10-9-7Zm5 4h1"/>',
  'PDF layers':'<path d="m12 2 10 6-10 6L2 8Zm-10 10 10 6 10-6M2 16l10 6 10-6"/>',
  'Accessibility tag tree':'<path d="M4 3h16v5H4Zm8 5v4m-7 0h14M5 12v4m14-4v4M2 16h6v5H2Zm14 0h6v5h-6Z"/>',
  'Accessibility audit':'<circle cx="12" cy="4" r="2"/><path d="M3 9h18m-9-3v9m0-3-6 10m6-10 6 10"/>',
  'Notes on this page':'<path d="M4 3h16v13l-6 6H4Zm10 13h6m-6 0v6M7 7h10M7 11h7"/>'
 };
 function setBuild(build){
  if(build===!!ribbon)return;
  if(!build){ribbon.filter();ribbon.dispose();ribbon=null;for(const [button,nodes]of contents)button.replaceChildren(...nodes);contents.clear();for(const {node,anchor}of moved)anchor.replaceWith(node);for(const {node,anchor}of containers)anchor.replaceWith(node);moved=[];containers=[];return;}
  for(const button of panel.querySelectorAll('button'))contents.set(button,[...button.childNodes]);
  for(const container of [more.querySelector('[role=group]'),panel.querySelector('.reader-pane-controls')].filter(Boolean)){
   for(const node of [...container.querySelectorAll('button')]){const anchor=panel.ownerDocument.createComment('view tool');node.before(anchor);moved.push({node,anchor});panel.append(node);}
  }
  for(const node of [more,panel.querySelector('.reader-pane-controls')].filter(Boolean)){const anchor=panel.ownerDocument.createComment('reading controls');node.before(anchor);containers.push({node,anchor});node.remove();}
  ribbon=installHomeRibbon(panel,{groups,icons,primary:['Fit page','Rotate view','Hand tool','Pages panel','Search panel','Read aloud','File details','PDF layers']});
 }
 return {setBuild,filter:query=>ribbon?.filter(query)??false,dispose(){if(ribbon)setBuild(false);}};
}
