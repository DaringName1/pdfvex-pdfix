import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {builtinModules} from 'node:module';
import {rolldown} from 'rolldown';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function bundleDocumentEngine({directory=path.resolve('dist/native/document-engine')}={}){
 await fs.mkdir(directory,{recursive:true});const engine=path.join(directory,'engine.cjs');
 const bundle=await rolldown({input:path.resolve('desktop/document-engine-entry.cjs'),platform:'node',external:id=>id.startsWith('node:')||builtinModules.includes(id),onwarn:warning=>{if(warning.code==='UNRESOLVED_IMPORT')throw new Error('Document engine contains an unresolved dependency: '+warning.message);}});
 try{await bundle.write({file:engine,format:'cjs',codeSplitting:false,sourcemap:false});}finally{await bundle.close();}
 const engineBytes=await fs.readFile(engine);if(!engineBytes.length||engineBytes.length>32*1024*1024)throw new Error('The bundled document engine exceeds its packaging budget.');
 return {engine,engineBytes};
}
// An explicit packaging input is required. Electron.exe is not a Node CLI runtime.
// Never download a runtime or substitute the caller's unrestricted worker if absent.
export async function buildDocumentEngine({nodeExecutable,nodeSha256,nodeLicense,directory=path.resolve('dist/native/document-engine')}={}){
 if(process.platform!=='win32'||process.arch!=='x64'||typeof nodeExecutable!=='string'||path.basename(nodeExecutable).toLowerCase()!=='node.exe'||!/^[a-f0-9]{64}$/.test(nodeSha256??'')||typeof nodeLicense!=='string')throw new Error('Document engine packaging requires an explicit Windows x64 node.exe, its reviewed SHA-256 and Node license path.');
 const stat=await fs.lstat(nodeExecutable);if(!stat.isFile()||stat.isSymbolicLink()||stat.size<1||stat.size>128*1024*1024)throw new Error('Invalid document engine runtime.');
 const bytes=await fs.readFile(nodeExecutable);if(hash(bytes)!==nodeSha256||bytes.toString('ascii',0,2)!=='MZ')throw new Error('Document engine runtime hash does not match the approved packaging input.');
 const pe=bytes.readUInt32LE(0x3c);if(pe<64||pe+26>bytes.length||bytes.toString('ascii',pe,pe+4)!=='PE\0\0'||bytes.readUInt16LE(pe+4)!==0x8664||bytes.readUInt16LE(pe+24)!==0x20b)throw new Error('Document engine runtime must be a Windows x64 PE executable.');
 const license=await fs.readFile(nodeLicense);if(!license.length||license.length>1024*1024)throw new Error('A bounded Node license is required for packaging.');
 const {engineBytes}=await bundleDocumentEngine({directory});
 await fs.writeFile(path.join(directory,'node.exe'),bytes);
 const files=[{name:'node.exe',sha256:hash(bytes),bytes:bytes.length},{name:'engine.cjs',sha256:hash(engineBytes),bytes:engineBytes.length}];
 await fs.writeFile(path.join(directory,'engine-manifest.json'),JSON.stringify({version:1,platform:'win32-x64',policy:'appcontainer-document-v1',files},null,2)+'\n');
 await fs.mkdir(path.join(path.dirname(directory),'document-engine-licenses'),{recursive:true});
 await fs.writeFile(path.join(path.dirname(directory),'document-engine-licenses','Node-LICENSE.txt'),license);
 const licenseDirectory=path.join(path.dirname(directory),'document-engine-licenses');
 for(const [label,source] of [['pdf-lib','node_modules/pdf-lib/LICENSE.md'],['xmldom','node_modules/@xmldom/xmldom/LICENSE'],['pako','node_modules/pako/LICENSE'],['tslib','node_modules/tslib/LICENSE.txt'],['standard-fonts','node_modules/@pdf-lib/standard-fonts/LICENSE.md'],['upng','node_modules/@pdf-lib/upng/LICENSE'],['rolldown','node_modules/rolldown/LICENSE']])await fs.copyFile(path.resolve(source),path.join(licenseDirectory,label+'-LICENSE.txt'));
 // Preserve the original-font attribution and the separate zlib source notice too.
 await fs.copyFile(path.resolve('node_modules/@pdf-lib/standard-fonts/README.md'),path.join(licenseDirectory,'standard-fonts-upstream-README.md'));
 const zlibSource=await fs.readFile(path.resolve('node_modules/pako/lib/zlib/inflate.js'),'utf8'),notice=zlibSource.match(/\/\/ \(C\) 1995-2013[\s\S]*?\/\/ 3\. This notice may not be removed or altered from any source distribution\./)?.[0];
 if(!notice)throw new Error('The bundled zlib source attribution could not be located.');
 await fs.writeFile(path.join(licenseDirectory,'pako-zlib-source-NOTICE.txt'),notice+'\n');
 return {directory,files};
}
