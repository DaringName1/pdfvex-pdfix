import {installHomeRibbon} from './reader-home-ribbon.js';
import './reader-pages-ribbon.css';

// Keep the actual reader buttons: permissions and tool callbacks have one owner.
export function installPagesRibbon(panel){
 return installHomeRibbon(panel,{
  groups:[
   ['Organize',['Organize pages','Review possible blank pages','Combine PDFs']],
   ['Numbering',['Page numbers and stamps']],
   ['Outline and boxes',['Edit the PDF outline','Edit PDF page boxes','Editable PDF workflow']]
  ],
  icons:{
   'Organize pages':'<rect x="3" y="3" width="7" height="8"/><rect x="14" y="3" width="7" height="8"/><rect x="3" y="15" width="7" height="6"/><rect x="14" y="15" width="7" height="6"/>',
   'Review possible blank pages':'<path d="M5 2h10l4 4v16H5ZM15 2v5h4M9 13h6"/>',
   'Combine PDFs':'<path d="M3 3h7v7H3ZM14 3h7v7h-7ZM8 16h8v6H8ZM6 10v3h12v-3m-6 3v3"/>',
   'Page numbers and stamps':'<path d="M5 2h10l4 4v16H5ZM9 11h6m-6 4h6m-4-6-2 9m6-9-2 9"/>',
   'Edit the PDF outline':'<path d="M4 4h3m4 0h10M4 10h3m4 0h10M7 16h3m4 0h7M7 22h3m4 0h7"/>',
   'Edit PDF page boxes':'<path d="M3 3h18v18H3ZM7 7h10v10H7ZM1 7h4m14 10h4M7 1v4m10 14v4"/>',
   'Editable PDF workflow':'<path d="M3 3h7v7H3ZM14 14h7v7h-7ZM10 6h7v8m-3-3 3 3 3-3M3 16h7m-3-3 3 3-3 3"/>'
  }
 });
}
