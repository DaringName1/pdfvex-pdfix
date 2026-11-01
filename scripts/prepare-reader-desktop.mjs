import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {build} from 'vite';

// Preparation only: never launches Electron or writes the shared dist/profile.
const sourceRoot=fileURLToPath(new URL('../',import.meta.url));
if(!process.argv[2])throw new Error('Usage: node scripts/prepare-reader-desktop.mjs OUTPUT_PARENT');
const parent=path.resolve(process.argv[2]);await fs.mkdir(parent,{recursive:true});
const output=await fs.mkdtemp(path.join(parent,'reader-desktop-')),app=path.join(output,'app');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),sources=[];
let total=0;
async function capture(relative){
 const absolute=path.join(sourceRoot,relative),stat=await fs.lstat(absolute);
 if(stat.isSymbolicLink())throw new Error('Source snapshot does not follow links: '+relative);
 if(stat.isDirectory()){for(const entry of (await fs.readdir(absolute)).sort())await capture(path.join(relative,entry));return;}
 if(!stat.isFile()||stat.size>16*1024*1024||(total+=stat.size)>64*1024*1024)throw new Error('Unexpected source snapshot size: '+relative);
 const bytes=await fs.readFile(absolute),target=path.join(app,relative);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,bytes);
 sources.push({path:relative.split(path.sep).join('/'),sha256:hash(bytes)});
}
const report={kind:'PDFix.IsolatedReaderDesktop.v1',output,app,profile:path.join(output,'profile'),prepared:false,desktopTests:'not run',scope:'Frozen renderer and desktop source copy; new renderer build only. Existing native/PDF/OCR assets are copied from shared dist without rebuilding. Dependencies use a read-only-in-practice directory junction; no install or dependency changes.',sources};
try{
 for(const relative of ['package.json','index.html','src','desktop','public'])await capture(relative);
 // Refuse a torn source snapshot when another writer changes a copied file.
 for(const source of sources)if(hash(await fs.readFile(path.join(sourceRoot,source.path)))!==source.sha256)throw new Error('Source changed while taking the isolated copy: '+source.path+'. Retry once editing settles.');
 await fs.symlink(path.join(sourceRoot,'node_modules'),path.join(app,'node_modules'),'junction');
 const index=await fs.readFile(path.join(app,'index.html'),'utf8');
 await fs.writeFile(path.join(app,'index.html'),index.replace('/src/app.js','/src/reader-test-bootstrap.js'));
 // Test observation only, inside the copied app. Production source is intact.
 await fs.writeFile(path.join(app,'src/reader-test-bootstrap.js'),`import {PdfReader} from './pdf-reader.js';\nconst open=PdfReader.prototype.open;\nPdfReader.prototype.open=async function(...args){window.isolatedReader=this;return open.apply(this,args);};\nawait import('./app.js');\n`);
 await build({root:app,configFile:false,base:'./',build:{outDir:path.join(app,'dist'),target:'es2022'},logLevel:'error'});
 for(const relative of ['native','pdf-assets','ocr-assets'])await fs.cp(path.join(sourceRoot,'dist',relative),path.join(app,'dist',relative),{recursive:true,errorOnExist:true,force:false});
 const readerSnapshot=JSON.parse(await fs.readFile(path.join(sourceRoot,'docs/PDF-READER-SOURCE-SNAPSHOT-2026-10-12.json'),'utf8').then(text=>text.replace(/^\uFEFF/,'')));
 for(const file of readerSnapshot.files.filter(file=>file.path.startsWith('src/')))if(hash(await fs.readFile(path.join(app,file.path)))!==file.sha256)throw new Error('Reader copy differs from its recorded source: '+file.path);
 report.readerSourcesVerified=true;report.prepared=true;
}catch(error){report.error=error.stack;process.exitCode=1;}
finally{await fs.writeFile(path.join(output,'snapshot.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({prepared:report.prepared,output,desktopTests:report.desktopTests,error:report.error}));}
