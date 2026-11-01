// Current branding overlay on a private copy of the integrator's runtime.
// Not a new release and never edits an installed/user package.
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';
import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {createHash} from 'node:crypto';import {expect} from '@playwright/test';
import {launchReader,attachReaderFailure} from '../tests/helpers/reader-launch.mjs';
import {closeReaderApp} from '../tests/helpers/reader-desktop.mjs';
const arg=process.argv.find(a=>a.startsWith('--package='));if(!arg)throw Error('Choose --package= with an existing integrator-built package.');
const source=path.resolve(arg.slice(10)),root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-branding-check-')),runtime=path.join(root,'runtime'),hash=b=>createHash('sha256').update(b).digest('hex'),exec=promisify(execFile);
const manifest=JSON.parse(await fs.readFile(path.join(source,'package-manifest.json'),'utf8')),report={scope:'Hidden real packaged Electron runtime, test-only current main/branding overlay; not a final release or spare-PC visual test',checks:[],errors:[]};
let app,timer;
try{
 console.log('Copying a private packaged runtime for branding verification.');
 await fs.cp(path.join(source,'app/runtime'),runtime,{recursive:true,errorOnExist:true,force:false});
 const payload=path.join(runtime,'resources/app');
 for(const file of ['main.cjs','pdfix-window-branding.cjs'])await fs.copyFile(path.resolve('desktop',file),path.join(payload,'desktop',file));
 await fs.copyFile(path.resolve('dist/native/graphics-startup/PDFix.exe'),path.join(root,'PDFix.exe'));
 const icon=path.join(payload,'dist/brand/pdfix.ico');await fs.copyFile(path.resolve('public/brand/pdfix.ico'),icon);const expectedIcon=hash(await fs.readFile('public/brand/pdfix.ico'));if(hash(await fs.readFile(icon))!==expectedIcon)throw Error('Packaged/source logo changed.');
 const compiler=path.join(process.env.SystemRoot||'C:/Windows','Microsoft.NET/Framework64/v4.0.30319/csc.exe'),checker=path.join(root,'properties.exe');
 await exec(compiler,['/nologo','/target:exe','/platform:x64','/warnaserror+','/reference:System.Web.Extensions.dll','/out:'+checker,path.resolve('tests/helpers/pdfix-window-properties.cs')],{windowsHide:true,timeout:30000});
 app=await launchReader({executablePath:path.join(runtime,'PDFix.exe'),args:[],env:{...process.env,PDFIX_TEST_VISIBLE:'0',PDFIX_TEST_DATA:path.join(root,'profile')}});
 timer=setTimeout(()=>app.process().kill(),90000);const page=await app.firstWindow();page.on('pageerror',e=>report.errors.push(e.message));
 await expect(page.getByRole('button',{name:'Open a file',exact:true})).toBeVisible({timeout:60000});
 const state=await app.evaluate(({app,BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0],h=w.getNativeWindowHandle();return {packaged:app.isPackaged,visible:w.isVisible(),handle:h.length===8?h.readBigUInt64LE().toString():String(h.readUInt32LE())};});
 if(!state.packaged||state.visible)throw Error('Expected actual packaged mode in a hidden window.');
 const {stdout}=await exec(checker,[state.handle],{windowsHide:true,timeout:10000}),properties=JSON.parse(stdout);
 expect(properties['5']).toBe('com.pdfix.documentworkspace');expect(properties['2']).toBe('"'+path.join(root,'PDFix.exe')+'"');expect(properties['4']).toBe('PDFix');expect(properties['3']).toBe(icon+',0');
 report.checks.push({name:'Real packaged window properties',pass:true,properties,iconSha256:expectedIcon});
 const desktopShortcutSource=await fs.readFile('packaging/Install-PDFix.ps1','utf8');expect(desktopShortcutSource).toContain("$shortcut.IconLocation=(Join-Path $installRoot 'runtime\\resources\\app\\dist\\brand\\pdfix.ico')+',0'");
 report.checks.push({name:'Installer uses the same packaged icon',pass:true});
 // Verify the source release was never edited by this overlay check.
 for(const relative of ['PDFix.exe','runtime/resources/app/desktop/main.cjs','runtime/resources/app/dist/brand/pdfix.ico']){const item=manifest.files.find(f=>f.path===relative);if(!item||hash(await fs.readFile(path.join(source,'app',relative)))!==item.sha256)throw Error('Original package changed: '+relative);}
 report.checks.push({name:'Source release unchanged',pass:true});report.pass=report.errors.length===0;
}catch(error){report.pass=false;report.error=error.stack;}
finally{clearTimeout(timer);if(app)try{await closeReaderApp(app);report.closed=true;}catch(error){report.pass=false;report.closeError=error.message;}report.pass=!!(report.pass&&report.closed);await fs.writeFile(path.join(root,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({pass:report.pass,report:path.join(root,'report.json'),error:report.error}));if(!report.pass)process.exitCode=1;}
