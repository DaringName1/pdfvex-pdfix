// Unsaved new documents. Each has a key "new:<uuid>" naming its own recovery draft in the main process; this list keeps
// their names and last-edit times so Home can offer them again. The drafts themselves stay in recovery storage.
const KEY='pdfix-new-documents',LIMIT=20,PATTERN=/^new:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const newDocumentKey=()=>'new:'+crypto.randomUUID();
export function listNewDocuments(){try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(value)?value.filter(entry=>entry&&PATTERN.test(entry.key)&&typeof entry.name==='string'&&Number.isFinite(entry.updatedAt)):[];}catch{return [];}}
export function newDocumentName(key){return listNewDocuments().find(entry=>entry.key===key)?.name??null;}
export function rememberNewDocument(key,name){if(!PATTERN.test(key))return;const list=listNewDocuments().filter(entry=>entry.key!==key);list.unshift({key,name:String(name||'Untitled document').slice(0,100),updatedAt:Date.now()});try{localStorage.setItem(KEY,JSON.stringify(list.slice(0,LIMIT)));}catch{}}
export function forgetNewDocument(key){try{localStorage.setItem(KEY,JSON.stringify(listNewDocuments().filter(entry=>entry.key!==key)));}catch{}}
export function forgetAllNewDocuments(){try{localStorage.removeItem(KEY);}catch{}}
