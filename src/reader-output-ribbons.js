import {installHomeRibbon} from './reader-home-ribbon.js';
import './reader-output-ribbons.css';

export function installOutputRibbons(panels){
 const exportGroups=[
  ['Save as',['PDF to images','Extract a table']],
  ['Size and copies',['Compress a PDF','Name and save unchanged copy']],
  ['Print and archive',['Print-production marks','Review embedded files','Print preflight','PDF portfolio']]
 ];
 const protectGroups=[
  ['Secure',['Protect or unlock a PDF','Redact a PDF','Clean PDF data']],
  ['Check',['Security report','Document health report','Certificate signatures','Repair PDF to a copy']]
 ];
 const pictures={
  'Edit a text document copy':'<path d="M5 2h10l4 4v16H5ZM8 10h8m-8 4h8m-8 4h5"/>',
  'PDF to images':'<rect x="3" y="3" width="18" height="18"/><circle cx="8" cy="8" r="2"/><path d="m3 18 6-6 4 4 4-7 4 9"/>',
  'Extract a table':'<path d="M3 3h18v18H3Zm0 6h18M9 3v18m6-18v18M3 15h18"/>',
  'Compress a PDF':'<path d="M5 2h10l4 4v16H5ZM8 10l4 3 4-3m-4-4v7m-4 5 4-3 4 3m-4-3v6"/>',
  'Name and save unchanged copy':'<path d="M4 3h13l3 3v15H4ZM8 3v6h8V3M8 15h8v6"/>',
  'Print-production marks':'<path d="M6 1v8H1m17-8v8h5M6 23v-8H1m17 8v-8h5M9 6h6v12H9Z"/>',
  'Review embedded files':'<path d="m8 13 7-7a3 3 0 0 1 4 4l-9 9a5 5 0 0 1-7-7L13 2m-7 13 9-9"/>',
  'Print preflight':'<path d="M5 2h10l4 4v16H5ZM8 13l3 3 5-6M8 19h8"/>',
  'PDF portfolio':'<path d="M2 6h8l2 3h10v12H2ZM5 6V3h13v6"/>',
  'Inspect and repair thin lines':'<path d="M3 5h18M3 12h18m-18 7h18"/>',
  'Protect or unlock a PDF':'<rect x="5" y="10" width="14" height="12" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v3"/>',
  'Redact a PDF':'<path d="M5 2h10l4 4v16H5Z"/><path d="M8 10h8v3H8Zm0 6h8v3H8Z" fill="currentColor"/>',
  'Clean PDF data':'<path d="m5 20 5-10 8 4-6 8ZM10 10l3-7m1 11 3-7M3 6h4m-2-2v4"/>',
  'Security report':'<path d="m12 2 9 4v6c0 5-5 9-9 10-4-1-9-5-9-10V6Zm0 6v6m0 3v1"/>',
  'Document health report':'<path d="M5 2h10l4 4v16H5ZM8 13h2l2-4 2 8 2-4h2"/>',
  'Certificate signatures':'<circle cx="12" cy="9" r="6"/><path d="m8 14-2 8 6-3 6 3-2-8m-7-13 3 2 3-2"/>',
  'Repair PDF to a copy':'<path d="M5 2h10l4 4v16H5Zm3 16 8-8m-3-2 4 4m-7 3 3 3"/>'
 };
 return new Map([
  ['Export',installHomeRibbon(panels.get('Export'),{groups:exportGroups,primary:['PDF to images','Extract a table','Compress a PDF','Name and save unchanged copy','Print-production marks'],icons:pictures})],
  ['Protect',installHomeRibbon(panels.get('Protect'),{groups:protectGroups,icons:pictures})]
 ]);
}
