import {installHomeRibbon} from './reader-home-ribbon.js';
import './reader-editing-ribbons.css';

// Group the original controls: permission checks, callbacks and workspace
// ownership continue to belong to the tool that supplied each button.
export function installEditingRibbons(panels){
 const configurations=[
  ['Edit',[
   ['Text',['Add text','Edit PDF text and images','Make a scan searchable','Edit a text document copy']],
   ['Select and link',['Review page links']]
  ]],
  ['Fill & Sign',[
   ['Fill',['Fill and sign']],
   ['Sign',['Sign with a Windows certificate']],
   ['Set up forms',['Create fillable fields','Prepare signing request']],
   ['Transfer comments',['Export FDF comments','Import FDF comments']]
  ]],
  ['Measure',[
   ['Measure',['Drawing takeoffs','Inspect and repair thin lines']],
   ['Scale and maps',['Map coordinates and distances']],
   ['Compare',['Compare drawing revisions','Drawing sheet sets']]
  ]]
 ];
 const icons={
  'Edit a text document copy':'<path d="M5 2h10l4 4v16H5ZM8 10h8m-8 4h8m-8 4h5"/>',
  'Inspect and repair thin lines':'<path d="M3 5h18M3 12h18m-18 7h18"/>',
  'Edit PDF text and images':'<path d="M3 4h18M12 4v16M8 20h8m9-10 3 3-7 7h-3v-3Z"/>',
  'Make a scan searchable':'<path d="M4 9V3h6m4 0h6v6m0 6v6h-6m-4 0H4v-6M7 10h10M7 14h7"/>',
  'Review page links':'<path d="m9 15 6-6m-8 3-3 3a4 4 0 0 0 6 6l3-3m-2-12 3-3a4 4 0 0 1 6 6l-3 3"/>',
  'Sign with a Windows certificate':'<circle cx="12" cy="8" r="6"/><path d="m8 13-2 9 6-3 6 3-2-9m-7-6 2 2 4-4"/>',
  'Create fillable fields':'<path d="M4 2h12l4 4v16H4ZM7 9h10v4H7Zm0 8h5m4-2v4m-2-2h4"/>',
  'Prepare signing request':'<path d="M3 5h18v14H3Zm0 0 9 8 9-8M7 22h10"/>',
  'Export FDF comments':'<path d="M3 3h14v12H8l-5 4Zm10 17h9m-3-3 3 3-3 3"/>',
  'Import FDF comments':'<path d="M3 3h14v12H8l-5 4Zm19 17h-9m3-3-3 3 3 3"/>',
  'Drawing takeoffs':'<path d="m3 17 14-14 5 5L8 22Zm4-4 3 3m1-7 3 3m1-7 3 3"/>',
  'Map coordinates and distances':'<path d="m2 5 7-3 6 3 7-3v17l-7 3-6-3-7 3Zm7-3v17m6-14v17"/>',
  'Compare drawing revisions':'<path d="M2 3h8v18H2Zm12 0h8v18h-8M5 8h2m-2 5h2m10-5h2m-2 5h2"/>',
  'Drawing sheet sets':'<path d="M3 3h13v16H3Zm5 16v3h13V6h-5M6 7h7m-7 4h7m-7 4h4"/>'
 };
 return new Map(configurations.map(([name,groups])=>[name,installHomeRibbon(panels.get(name),{groups,icons,primary:name==='Edit'?['Add text','Edit PDF text and images','Make a scan searchable','Review page links']:name==='Measure'?['Drawing takeoffs','Map coordinates and distances','Compare drawing revisions','Drawing sheet sets']:undefined})]));
}
