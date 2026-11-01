import {pdfjsFailClosedPlugin} from './scripts/pdfjs-fail-closed.mjs';
import {buildSpeechHelper} from './scripts/build-speech-helper.mjs';
import {buildSpellingHelper} from './scripts/build-spelling-helper.mjs';
import {buildVirtualPrinterHelper} from './scripts/build-virtual-printer-helper.mjs';
import {createHash} from 'node:crypto';
import { defineConfig } from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import {buildNativeSandbox} from './scripts/build-native-sandbox.mjs';
import {buildPagedSessionEngine} from './scripts/build-paged-session-engine.mjs';
import {buildScannerHelper} from './scripts/build-scanner-helper.mjs';
import {buildGraphicsStartupHelper} from './scripts/build-graphics-startup-helper.mjs';
import {buildCertificateTrustHelper} from './scripts/build-certificate-trust-helper.mjs';
import {buildCertificateSigningHelper} from './scripts/build-certificate-signing-helper.mjs';
import {buildDocumentEngine} from './scripts/build-document-engine.mjs';
import {packageSourceSnapshot} from './scripts/package-source-snapshot.mjs';
export default defineConfig(async()=>{const initialSources=await packageSourceSnapshot();return { base: './', build: { target: 'es2022' }, plugins:[pdfjsFailClosedPlugin(),{
  name:'bundle-pdf-assets',
  async closeBundle(){
    await buildNativeSandbox();
    await buildPagedSessionEngine();
    await buildScannerHelper();
    await buildGraphicsStartupHelper();
    await buildCertificateTrustHelper();
    await buildCertificateSigningHelper();
    await buildSpeechHelper();
    await buildSpellingHelper();
    await buildVirtualPrinterHelper();
    const documentNode=path.resolve('vendor/document-node'),documentRuntime=JSON.parse(await fs.readFile(path.join(documentNode,'manifest.json'),'utf8'));
    if(documentRuntime.version!==1||documentRuntime.platform!=='win32-x64'||documentRuntime.file!=='node.exe'||documentRuntime.license!=='LICENSE')throw new Error('The fixed document runtime packaging inputs are invalid.');
    if(createHash('sha256').update(await fs.readFile(path.join(documentNode,documentRuntime.license))).digest('hex')!==documentRuntime.licenseSha256)throw new Error('The fixed document runtime license changed.');
    await buildDocumentEngine({nodeExecutable:path.join(documentNode,documentRuntime.file),nodeSha256:documentRuntime.sha256,nodeLicense:path.join(documentNode,documentRuntime.license)});
    const nativeRoot=path.resolve('vendor/qpdf-release/qpdf-12.4.2-msvc64');
    for(const entry of ['licenses','manifest.json'])await fs.cp(path.join(nativeRoot,entry),path.resolve('dist/native/qpdf',entry),{recursive:true});
    const nativeBin=path.resolve('dist/native/qpdf/bin');await fs.mkdir(nativeBin,{recursive:true});for(const file of JSON.parse(await fs.readFile(path.join(nativeRoot,'manifest.json'),'utf8')).files)await fs.copyFile(path.join(nativeRoot,'bin',file.name),path.join(nativeBin,file.name));
    for(const folder of ['cmaps','standard_fonts','wasm','iccs']) await fs.cp(path.resolve('node_modules/pdfjs-dist',folder),path.resolve('dist/pdf-assets',folder),{recursive:true});
    await import('./scripts/copy-ocr-assets.mjs');
    const finalSources=await packageSourceSnapshot();if(finalSources.sha256!==initialSources.sha256)throw new Error('Source changed during compilation. Finish the coding pass and rebuild.');await fs.writeFile(path.resolve('dist/build-source-manifest.json'),JSON.stringify(finalSources,null,2)+'\n');
  }
}] };});
