// Which installed libraries the Windows package ships, and a check that keeps that list honest.
// The window (dist/) is built by Vite and carries its own copies of the PDF reader, OCR and editor libraries, so only
// the libraries the main process loads (desktop/ and the src/ files it requires) are copied from node_modules.
// mainProcessPackages() follows every require/import from desktop/ and fails the package build if code starts loading
// a library that is not in RUNTIME_PACKAGES, so a missing library is caught when packaging, not by a tester.
import fs from 'node:fs/promises';import path from 'node:path';import {builtinModules} from 'node:module';
export const RUNTIME_PACKAGES=Object.freeze(['pdf-lib','@pdf-lib/standard-fonts','@xmldom/xmldom','docx','jszip','mammoth']);
// Chromium screen-language files: PDFix is English and Spanish. Chromium falls back to en-US for any other Windows language.
export const KEPT_LOCALE=/^(?:en-US|es|es-419)\.pak$/;
const SPECIFIER=/(?:require\(\s*|import\(\s*|from\s+|import\s+)['"]([^'"]+)['"]/g;
const builtin=name=>name.startsWith('node:')||name==='electron'||builtinModules.includes(name.split('/')[0]);
export const packageName=spec=>spec.startsWith('@')?spec.split('/').slice(0,2).join('/'):spec.split('/')[0];
export async function mainProcessPackages(root){
 const start=(await fs.readdir(path.join(root,'desktop'))).filter(name=>/\.(?:cjs|mjs|js)$/.test(name)).map(name=>path.join(root,'desktop',name));
 const queue=[...start],seen=new Set(),found=new Map();
 while(queue.length){const file=queue.shift();if(seen.has(file))continue;seen.add(file);const text=await fs.readFile(file,'utf8');
  for(const match of text.matchAll(SPECIFIER)){const spec=match[1];if(builtin(spec))continue;
   if(spec.startsWith('.')){const base=path.resolve(path.dirname(file),spec);for(const candidate of [base,base+'.js',base+'.cjs',base+'.mjs',path.join(base,'index.js')]){const stat=await fs.stat(candidate).catch(()=>null);if(stat?.isFile()){queue.push(candidate);break;}}}
   else{const name=packageName(spec);if(!found.has(name))found.set(name,path.relative(root,file));}}}
 return found;
}
export async function checkRuntimePackages(root){
 const found=await mainProcessPackages(root),missing=[...found].filter(([name])=>!RUNTIME_PACKAGES.includes(name));
 if(missing.length)throw new Error('The app loads libraries the package would not ship: '+missing.map(([name,file])=>name+' (from '+file+')').join(', ')+'. Add them to RUNTIME_PACKAGES in scripts/runtime-packages.mjs.');
 return found;
}
