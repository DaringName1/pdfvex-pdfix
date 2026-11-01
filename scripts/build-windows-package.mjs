import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {constants} from 'node:fs';
import {packageSourceSnapshot} from './package-source-snapshot.mjs';
import {RUNTIME_PACKAGES,KEPT_LOCALE,checkRuntimePackages} from './runtime-packages.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const beneath=(base,filename)=>{const relative=path.relative(base,filename);if(!relative||relative.startsWith('..'+path.sep)||relative==='..'||path.isAbsolute(relative))throw new Error('Package paths must stay below their declared root.');return relative;};
const readJson=async filename=>JSON.parse(await fs.readFile(filename,'utf8'));
const cleanName=value=>typeof value==='string'&&/^(@[a-z0-9_.-]+\/)?[a-z0-9_.-]+$/i.test(value);
const OCR_PINS=Object.freeze([{code:'eng',name:'English'},{code:'spa',name:'Spanish'},{code:'fra',name:'French'},{code:'deu',name:'German'},{code:'por',name:'Portuguese'},{code:'ita',name:'Italian'}]);

async function regular(filename){const stat=await fs.lstat(filename);if(!stat.isFile()||stat.isSymbolicLink())throw new Error('Package inputs must be regular files: '+filename);return stat;}
async function boundedBytes(filename,max){const before=await regular(filename);if(before.size<1||before.size>max)throw new Error('A pinned package input exceeds its byte bound: '+filename);const bytes=await fs.readFile(filename),after=await regular(filename);if(bytes.length!==before.size||after.size!==before.size||after.mtimeMs!==before.mtimeMs||after.ctimeMs!==before.ctimeMs)throw new Error('A pinned package input changed while reading: '+filename);return bytes;}
async function files(directory,{exclude=new Set()}={}){
 const found=[];for(const item of await fs.readdir(directory,{withFileTypes:true})){if(exclude.has(item.name))continue;const filename=path.join(directory,item.name);if(item.isSymbolicLink())throw new Error('Linked package inputs are unsupported: '+filename);if(item.isDirectory())found.push(...await files(filename,{exclude}));else if(item.isFile())found.push(filename);else throw new Error('Unexpected package input: '+filename);}return found;
}
async function dependencyDirectory(name,consumer){
 if(!cleanName(name))throw new Error('Invalid dependency name.');let parent=consumer;
 while(true){const candidate=path.join(parent,'node_modules',...name.split('/'));try{const stat=await regular(path.join(candidate,'package.json'));if(stat.size>2*1024*1024)throw new Error('Dependency metadata exceeds its bound.');beneath(path.join(root,'node_modules'),path.join(candidate,'package.json'));return candidate;}catch(error){if(error.code!=='ENOENT'&&error.code!=='ENOTDIR')throw error;}if(parent===root)break;const next=path.dirname(parent);if(next===parent||!next.startsWith(root))break;parent=next;}throw Object.assign(new Error('Missing installed dependency '+name),{code:'MISSING_DEPENDENCY'});
}
async function dependencies(names){
 const pending=names.map(name=>({name,consumer:root,optional:false})),seen=new Map();
 while(pending.length){const {name,consumer,optional}=pending.shift();let directory;try{directory=await dependencyDirectory(name,consumer);}catch(error){if(optional&&error.code==='MISSING_DEPENDENCY')continue;throw error;}if(seen.has(directory))continue;const metadata=await readJson(path.join(directory,'package.json'));if(metadata.name!==name||typeof metadata.version!=='string')throw new Error('Dependency identity mismatch: '+name);seen.set(directory,metadata);if(seen.size>1000)throw new Error('Production dependency closure exceeds 1000 packages.');const required={...metadata.dependencies},optionalNames=new Set(Object.keys(metadata.optionalDependencies??{}));for(const [child]of Object.entries({...required,...metadata.optionalDependencies,...metadata.peerDependencies}))pending.push({name:child,consumer:directory,optional:optionalNames.has(child)||metadata.peerDependenciesMeta?.[child]?.optional===true});}
 return seen;
}
async function verifyCertificateHelper(directoryName,executable,sourceName,serviceName,policy){
 const directory=path.join(root,'dist/native',directoryName),manifest=JSON.parse((await boundedBytes(path.join(directory,'manifest.json'),8192)).toString('utf8'));
 if(manifest.version!==1||manifest.policy!==policy||manifest.platform!=='win32-x64'||manifest.file!==executable||manifest.notice!=='NOTICE.txt'||!Number.isSafeInteger(manifest.bytes)||manifest.bytes<1||manifest.bytes>8*1024*1024||!/^[a-f0-9]{64}$/.test(manifest.sha256)||!/^[a-f0-9]{64}$/.test(manifest.sourceSha256))throw new Error('Invalid certificate helper manifest: '+directoryName);
 const bytes=await boundedBytes(path.join(directory,executable),8*1024*1024),source=await boundedBytes(path.join(root,'desktop/native',sourceName),1024*1024),{SOURCE_SHA256}=createRequire(import.meta.url)(path.join(root,'desktop',serviceName));
 if(bytes.length!==manifest.bytes||hash(bytes)!==manifest.sha256||bytes.toString('ascii',0,2)!=='MZ'||hash(source)!==manifest.sourceSha256||manifest.sourceSha256!==SOURCE_SHA256)throw new Error('Certificate helper executable/source pins changed: '+directoryName);
 await boundedBytes(path.join(directory,manifest.notice),64*1024);return manifest;
}
async function verifyNativeInputs(){
 const engine=await readJson(path.join(root,'dist/native/document-engine/engine-manifest.json'));for(const item of engine.files??[]){if(!/^[a-z0-9_.-]+$/i.test(item.name)||!Number.isInteger(item.bytes))throw new Error('Invalid fixed-engine manifest.');const bytes=await fs.readFile(path.join(root,'dist/native/document-engine',item.name));if(bytes.length!==item.bytes||hash(bytes)!==item.sha256)throw new Error('Fixed-engine package pin changed.');}
 const broker=await readJson(path.join(root,'dist/native/sandbox/manifest.json'));if(broker.file!=='PDFix.Sandbox.exe'||hash(await fs.readFile(path.join(root,'dist/native/sandbox',broker.file)))!==broker.sha256)throw new Error('Windows broker pin changed.');
 const pagedDirectory=path.join(root,'dist/native/paged-session'),pagedSession=JSON.parse((await boundedBytes(path.join(pagedDirectory,'manifest.json'),8192)).toString('utf8'));
 if(pagedSession.version!==1||pagedSession.policy!=='appcontainer-paged-session-v1'||pagedSession.platform!=='win32-x64'||pagedSession.file!=='PDFix.PagedSession.exe'||!/^[a-f0-9]{64}$/.test(pagedSession.sha256)||!/^[a-f0-9]{64}$/.test(pagedSession.sourceSha256))throw new Error('Invalid persistent PDF helper manifest.');
 const pagedBytes=await boundedBytes(path.join(pagedDirectory,pagedSession.file),4*1024*1024),pagedSource=await boundedBytes(path.join(root,'desktop/native/PagedSessionEngine.cs'),1024*1024),pagedBuild=await boundedBytes(path.join(root,'scripts/build-paged-session-engine.mjs'),1024*1024);
 if(pagedBytes.toString('ascii',0,2)!=='MZ'||hash(pagedBytes)!==pagedSession.sha256||hash(pagedSource)!==pagedSession.sourceSha256||!pagedBuild.toString('utf8').includes("const SOURCE_SHA256='"+pagedSession.sourceSha256+"'"))throw new Error('Persistent PDF helper executable/source pins changed.');
 const qpdf=await readJson(path.join(root,'dist/native/qpdf/manifest.json'));for(const item of qpdf.files??[]){if(!/^[a-z0-9_.-]+\.(exe|dll)$/i.test(item.name)||hash(await fs.readFile(path.join(root,'dist/native/qpdf/bin',item.name)))!==item.sha256)throw new Error('qpdf package pin changed.');}
 const scannerDirectory=path.join(root,'dist/native/scanner'),scanner=JSON.parse((await boundedBytes(path.join(scannerDirectory,'manifest.json'),8192)).toString('utf8'));
 if(scanner.version!==1||scanner.policy!=='wia-trusted-device-adapter-v1'||scanner.platform!=='win32-x64'||scanner.file!=='PDFix.Scanner.exe'||scanner.notice!=='NOTICE.txt'||!Number.isSafeInteger(scanner.bytes)||scanner.bytes<1||scanner.bytes>8*1024*1024||!/^[a-f0-9]{64}$/.test(scanner.sha256)||!/^[a-f0-9]{64}$/.test(scanner.sourceSha256))throw new Error('The scanner helper package manifest is invalid.');
 const scannerBytes=await boundedBytes(path.join(scannerDirectory,scanner.file),8*1024*1024),scannerSource=await boundedBytes(path.join(root,'desktop/native/ScannerCapture.cs'),1024*1024);
 if(scannerBytes.length!==scanner.bytes||hash(scannerBytes)!==scanner.sha256||scannerBytes.toString('ascii',0,2)!=='MZ'||hash(scannerSource)!==scanner.sourceSha256)throw new Error('The scanner helper executable/source SHA-256 pins changed. Recompile the scanner helper before packaging.');
 await boundedBytes(path.join(scannerDirectory,scanner.notice),64*1024);
 const ocrDirectory=path.join(root,'dist/ocr-assets'),ocrManifestBytes=await boundedBytes(path.join(ocrDirectory,'languages.json'),32768),ocrManifest=JSON.parse(ocrManifestBytes.toString('utf8'));
 if(!Array.isArray(ocrManifest.languages)||ocrManifest.languages.length!==OCR_PINS.length||ocrManifest.packageLicense!=='MIT (per official @tesseract.js-data package metadata)'||ocrManifest.trainingDataUpstreamLicense!=='Apache-2.0 (per upstream Tesseract tessdata repositories)')throw new Error('The six-language OCR metadata manifest is invalid.');
 const ocr={manifestSha256:hash(ocrManifestBytes),languages:[]};
 for(const [index,pin]of OCR_PINS.entries()){
  const item=ocrManifest.languages[index],packageName='@tesseract.js-data/'+pin.code,file=pin.code+'.traineddata.gz';
  if(!item||Object.keys(item).sort().join(',')!=='code,file,license,name,package,packageVersion'||item.code!==pin.code||item.name!==pin.name||item.package!==packageName||item.packageVersion!=='1.0.0'||item.license!=='MIT'||item.file!==file)throw new Error('OCR language identity/license/version pin changed: '+pin.code);
  const packageDirectory=path.join(root,'node_modules','@tesseract.js-data',pin.code),packageBytes=await boundedBytes(path.join(packageDirectory,'package.json'),1024*1024),metadata=JSON.parse(packageBytes.toString('utf8'));
  if(metadata.name!==packageName||metadata.version!=='1.0.0'||metadata.license!=='MIT')throw new Error('Installed OCR language package metadata changed: '+pin.code);
  const source=await boundedBytes(path.join(packageDirectory,'4.0.0_best_int',file),64*1024*1024),packaged=await boundedBytes(path.join(ocrDirectory,file),64*1024*1024),sha256=hash(source);
  if(source[0]!==0x1f||source[1]!==0x8b||source.length!==packaged.length||hash(packaged)!==sha256)throw new Error('Bundled OCR language bytes differ from their pinned installed package: '+pin.code);
  ocr.languages.push({...item,packageJsonSha256:hash(packageBytes),bytes:source.length,sha256});
 }
 const certificateTrust=await verifyCertificateHelper('certificate-trust','PDFix.CertificateTrust.exe','CertificateTrust.cs','certificate-trust-service.cjs','windows-offline-base-chain-v1');
 const certificateSigning=await verifyCertificateHelper('certificate-signing','PDFix.CertificateSigning.exe','CertificateSigning.cs','certificate-signing-provider.cjs','windows-local-rsa-signing-v1');
 const localSpeech=await verifyCertificateHelper('speech','PDFix.Speech.exe','PDFix.Speech.cs','local-speech-service.cjs','windows-local-plain-speech-v1');
 const localSpelling=await verifyCertificateHelper('local-spelling','PDFix.LocalSpelling.exe','LocalSpelling.cs','local-spelling-service.cjs','windows-local-spelling-v1');
 const virtualPrinter=await verifyCertificateHelper('virtual-printer','PDFix.VirtualPrinter.exe','VirtualPrinter.cs','virtual-printer-service.cjs','windows-local-pdf-print-queue-v1');
 const graphicsStartup=await verifyGraphicsLauncher();
 return {engine,broker,pagedSession,qpdf,scanner,ocr,certificateTrust,certificateSigning,localSpeech,localSpelling,virtualPrinter,graphicsStartup};
}
// The outer app/PDFix.exe: Codex's graphics startup launcher (desktop/native/GraphicsStartup.cs). It starts the Electron
// app at app/runtime/PDFix.exe and offers one simpler-graphics retry after a confirmed graphics startup failure.
async function verifyGraphicsLauncher(){
 const directory=path.join(root,'dist/native/graphics-startup'),manifest=JSON.parse((await boundedBytes(path.join(directory,'manifest.json'),8192)).toString('utf8'));
 if(manifest.version!==1||manifest.policy!=='explicit-once-before-interactive-graphics-retry-v1'||manifest.platform!=='win32-x64'||manifest.file!=='PDFix.exe'||!Number.isSafeInteger(manifest.bytes)||manifest.bytes<1||manifest.bytes>8*1024*1024||!/^[a-f0-9]{64}$/.test(manifest.sha256)||!/^[a-f0-9]{64}$/.test(manifest.sourceSha256))throw new Error('Invalid graphics startup launcher manifest.');
 const bytes=await boundedBytes(path.join(directory,'PDFix.exe'),8*1024*1024),source=await boundedBytes(path.join(root,'desktop/native/GraphicsStartup.cs'),1024*1024);
 if(bytes.length!==manifest.bytes||hash(bytes)!==manifest.sha256||bytes.toString('ascii',0,2)!=='MZ')throw new Error('The graphics startup launcher does not match its manifest. Rebuild it.');
 if(hash(source)!==manifest.sourceSha256)throw new Error('The graphics startup launcher was built from different source. Rebuild it.');
 if(manifest.iconSha256!==hash(await boundedBytes(path.join(root,'public/brand/pdfix.ico'),1024*1024)))throw new Error('The launcher icon differs from the packaged PDFix brand. Rebuild it.');
 return {file:'PDFix.exe',bytes:manifest.bytes,sha256:manifest.sha256,sourceSha256:manifest.sourceSha256,iconSha256:manifest.iconSha256,policy:manifest.policy};
}

export async function buildWindowsPackage(){
 if(process.platform!=='win32'||process.arch!=='x64')throw new Error('This package builder requires Windows x64.');
 const metadata=await readJson(path.join(root,'package.json'));if(!/^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/i.test(metadata.version))throw new Error('Use a supported package version.');await regular(path.join(root,'dist/index.html'));const builtSources=await readJson(path.join(root,'dist/build-source-manifest.json')),currentSources=await packageSourceSnapshot(root);if(builtSources.kind!=='PDFix.BuildSourceSnapshot.v1'||builtSources.sha256!==currentSources.sha256)throw new Error('Code changed since compilation. Finish the current edits and run npm run build before packaging.');const native=await verifyNativeInputs();
 const require=createRequire(path.join(root,'package.json')),electronDirectory=path.dirname(require.resolve('electron/package.json')),electronMetadata=await readJson(path.join(electronDirectory,'package.json')),electronDist=path.join(electronDirectory,'dist');
 if((await fs.readFile(path.join(electronDist,'version'),'utf8')).trim()!==electronMetadata.version)throw new Error('Installed Electron runtime version differs from its package.');
 const executable=await fs.readFile(path.join(electronDist,'electron.exe'));if(executable.toString('ascii',0,2)!=='MZ')throw new Error('A Windows Electron executable is required.');await checkRuntimePackages(root);const closure=await dependencies(RUNTIME_PACKAGES);
 const buildId=metadata.version+'-'+new Date().toISOString().replace(/[-:.]/g,'').replace('Z','')+'-'+randomUUID().slice(0,8),output=path.join(root,'releases','PDFix-'+buildId+'-win-x64'),appRoot=path.join(output,'app'),runtimeRoot=path.join(appRoot,'runtime'),payload=path.join(runtimeRoot,'resources','app');beneath(root,output);await fs.mkdir(output,{recursive:false}).catch(async error=>{if(error.code!=='ENOENT')throw error;await fs.mkdir(path.dirname(output),{recursive:true});await fs.mkdir(output);});
 const inventory=[];let total=0;
 async function copy(source,destination){const before=await regular(source),bytes=await fs.readFile(source),after=await regular(source);if(before.size!==bytes.length||before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ctimeMs!==after.ctimeMs)throw new Error('A package input changed while copying. Finish coding and rebuild: '+source);const relative=beneath(appRoot,destination).split(path.sep).join('/');await fs.mkdir(path.dirname(destination),{recursive:true});await fs.writeFile(destination,bytes,{flag:'wx'});const sha256=hash(bytes);if(hash(await fs.readFile(destination))!==sha256)throw new Error('Copied package bytes failed verification.');inventory.push({path:relative,bytes:bytes.length,sha256});total+=bytes.length;if(inventory.length>60000||total>5*1024**3)throw new Error('The Windows package exceeds its file or byte budget.');}
 try{
  for(const filename of await files(electronDist,{exclude:new Set(['default_app.asar'])})){const relative=path.relative(electronDist,filename);if(path.dirname(relative)==='locales'&&!KEPT_LOCALE.test(path.basename(relative)))continue;await copy(filename,path.join(runtimeRoot,relative==='electron.exe'?'PDFix.exe':relative));}
  await copy(path.join(root,'dist/native/graphics-startup/PDFix.exe'),path.join(appRoot,'PDFix.exe'));
  for(const directory of ['desktop','src'])for(const filename of await files(path.join(root,directory),{exclude:new Set(['vendor','.git','node_modules'])})){if(!/\.(cjs|mjs|js|json|css)$/.test(filename))continue;await copy(filename,path.join(payload,directory,path.relative(path.join(root,directory),filename)));}
  for(const filename of await files(path.join(root,'dist')))await copy(filename,path.join(payload,'dist',path.relative(path.join(root,'dist'),filename)));
  for(const [directory]of closure)for(const filename of await files(directory,{exclude:new Set(['node_modules','.git'])}))await copy(filename,path.join(payload,beneath(root,filename)));
  const appMetadata={name:metadata.name,productName:'PDFix',version:metadata.version,description:metadata.description,private:true,type:'module',main:'desktop/main.cjs'};await fs.mkdir(payload,{recursive:true});const packageBytes=Buffer.from(JSON.stringify(appMetadata,null,2)+'\n');await fs.writeFile(path.join(payload,'package.json'),packageBytes,{flag:'wx'});inventory.push({path:'runtime/resources/app/package.json',bytes:packageBytes.length,sha256:hash(packageBytes)});total+=packageBytes.length;
  if((await packageSourceSnapshot(root)).sha256!==builtSources.sha256)throw new Error('Source changed during packaging. Finish coding and rebuild.');
  const manifest={version:1,kind:'PDFix.WindowsPackage.v1',appId:'com.pdfix.documentworkspace',buildId,appVersion:metadata.version,platform:'win32-x64',created:new Date().toISOString(),launch:'PDFix.exe',electronVersion:electronMetadata.version,sourceSnapshotSha256:builtSources.sha256,verification:'File inventory and source compilation only; runtime, installation, signature/provenance and clean-machine acceptance are pending.',signed:false,totalBytes:total,files:inventory.sort((a,b)=>a.path.localeCompare(b.path)),native};const manifestBytes=Buffer.from(JSON.stringify(manifest,null,2)+'\n');await fs.writeFile(path.join(output,'package-manifest.json'),manifestBytes,{flag:'wx'});
  const dependencyInventory={version:1,kind:'PDFix.DependencyInventory.v1',appVersion:metadata.version,electron:{version:electronMetadata.version,license:electronMetadata.license},packages:[...closure].map(([directory,item])=>({name:item.name,version:item.version,location:beneath(root,directory).split(path.sep).join('/'),license:item.license??null,packageJsonSha256:null})),review:'Inventory only; full SBOM/license/security/provenance review remains pending.'};for(const item of dependencyInventory.packages)item.packageJsonSha256=hash(await fs.readFile(path.join(root,item.location,'package.json')));await fs.writeFile(path.join(output,'dependency-inventory.json'),JSON.stringify(dependencyInventory,null,2)+'\n',{flag:'wx'});
  for(const name of ['Install-PDFix.ps1','Uninstall-PDFix.ps1'])await fs.copyFile(path.join(root,'packaging',name),path.join(output,name),constants.COPYFILE_EXCL);
  const {associationManifest}=require(path.join(root,'desktop/windows-integration.cjs')),placeholder='C:\\__PDFIX_EXECUTABLE__\\PDFix.exe',associations=associationManifest(placeholder);for(const entry of associations.entries)entry.value=entry.value.replaceAll(placeholder,'__PDFIX_EXECUTABLE__');const associationBytes=Buffer.from(JSON.stringify(associations,null,2)+'\n');await fs.writeFile(path.join(output,'open-with-manifest.json'),associationBytes,{flag:'wx'});
  const installerHash=hash(await fs.readFile(path.join(output,'Uninstall-PDFix.ps1')));await fs.writeFile(path.join(output,'package-checksums.json'),JSON.stringify({manifestSha256:hash(manifestBytes),uninstallerSha256:installerHash,associationSha256:hash(associationBytes)},null,2)+'\n',{flag:'wx'});
  await fs.writeFile(path.join(output,'README.txt'),'PDFix Windows development package\r\n\r\nPortable: open app\\PDFix.exe. Keep the complete app folder together.\r\nPer-user install: run Install-PDFix.ps1 with your normal Windows PowerShell policy. Optional switches: -RegisterOpenWith and -DesktopShortcut. Default apps change only in Windows Settings.\r\nUninstall: use the installed Uninstall-PDFix.ps1. Documents and local recovery/settings are retained.\r\n\r\nThis unsigned development build has not passed runtime, installation, isolation, accessibility or clean-machine acceptance. It is not a verified beta release. No application or installer is launched by the package builder.\r\n',{flag:'wx'});
  await fs.writeFile(path.join(output,'PACKAGE-COMPLETE.json'),JSON.stringify({buildId,manifestSha256:hash(manifestBytes),files:inventory.length,totalBytes:total},null,2)+'\n',{flag:'wx'});
  return {output,buildId,files:inventory.length,totalBytes:total,dependencies:closure.size};
 }catch(error){await fs.writeFile(path.join(output,'PACKAGE-INCOMPLETE.txt'),'Packaging stopped: '+String(error.message)+'\nThis directory is not a completed package.\n').catch(()=>{});throw error;}
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const result=await buildWindowsPackage();process.stdout.write(JSON.stringify(result,null,2)+'\n');}
