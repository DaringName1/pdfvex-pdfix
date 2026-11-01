// Run with agent-run. Separate renderer startup, GPU failure and capture failure.
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {readerRuntime} from '../tests/helpers/reader-runtime.mjs';

const require=createRequire(import.meta.url);
const root=await fs.mkdtemp(path.resolve('tmp/reader-startup-matrix-'));
const runtime=await readerRuntime();
const report={scope:'Hidden native Electron controls; no production graphics/security changes',runtime:JSON.parse(await fs.readFile(path.join(runtime,'reader-runtime.json'),'utf8')),cases:[]};
const controls=[
  {name:'software-hidden',software:true,offscreen:false},
  {name:'hardware-hidden',software:false,offscreen:false},
  {name:'software-offscreen',software:true,offscreen:true},
  {name:'hardware-offscreen',software:false,offscreen:true},
  {name:'pdfix-hidden-software',built:true,normal:false},
  {name:'pdfix-hidden-normal',built:true,normal:true},
];
const chosen=process.env.PDFIX_STARTUP_TIMING==='1'?[
  {name:'default-throttled-awake',software:false,offscreen:false,throttle:true,early:true},
  {name:'default-throttled-not-awake',software:false,offscreen:false,throttle:true,early:true,awake:false},
  {name:'default-unthrottled-awake',software:false,offscreen:false,throttle:false,early:true},
]:controls;
for(let round=1;round<=3;round++)for(const control of chosen){
  const folder=path.join(root,`${round}-${control.name}`);
  await fs.mkdir(folder);
  const config={...control,folder,receipt:path.join(folder,'receipt.json'),main:path.join(runtime,'desktop/main.cjs')};
  const entry=path.join(folder,'main.cjs');
  await fs.writeFile(entry,`(${bootstrap.toString()})(${JSON.stringify(config)});`);
  const env={...process.env,PDFIX_TEST_DATA:path.join(folder,'profile'),PDFIX_TEST_VISIBLE:control.normal?'1':'0',ELECTRON_ENABLE_LOGGING:'1'};
  delete env.ELECTRON_RUN_AS_NODE;
  const record={round,control:control.name,stderr:''};
  let timer;
  const started=Date.now();
  try{
    const child=spawn(require('electron'),[entry],{env,windowsHide:true,stdio:['ignore','ignore','pipe']});
    child.stderr.on('data',chunk=>record.stderr=(record.stderr+chunk).slice(-20000));
    record.exit=await new Promise((resolve,reject)=>{
      child.once('error',reject);child.once('exit',(code,signal)=>resolve({code,signal}));
      timer=setTimeout(()=>{record.watchdog=true;child.kill();},30000);
    });
    record.receipt=await fs.readFile(config.receipt,'utf8').then(JSON.parse,()=>null);
    record.startupPass=record.exit.code===0&&record.receipt?.responsive===true&&!record.receipt.errors.length;
    record.capturePass=record.receipt?.captures.some(c=>c.painted)===true;
  }catch(error){record.error=error.message;record.startupPass=false;record.capturePass=false;}
  finally{clearTimeout(timer);record.elapsedMs=Date.now()-started;report.cases.push(record);await fs.writeFile(path.join(root,'report.json'),JSON.stringify(report,null,2));}
  console.log(JSON.stringify({round,control:record.control,startupPass:record.startupPass,capturePass:record.capturePass,errors:record.receipt?.errors}));
}
report.startupPass=report.cases.every(c=>c.startupPass);
report.capturePass=report.cases.every(c=>c.capturePass);
report.pass=report.startupPass&&report.capturePass;
await fs.writeFile(path.join(root,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({startupPass:report.startupPass,capturePass:report.capturePass,report:path.join(root,'report.json')}));
if(!report.pass)process.exitCode=1;

function bootstrap(config){
  const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
  const result={errors:[],captures:[],responsive:false,visible:false};
  let finished=false,window;
  const finish=error=>{
    if(finished)return;finished=true;clearTimeout(deadline);
    if(error)result.errors.push(error.stack||String(error));
    fs.writeFileSync(config.receipt,JSON.stringify(result,null,2));
    app.quit();setTimeout(()=>app.exit(2),3000).unref();
  };
  const deadline=setTimeout(()=>finish(new Error('Startup diagnostic exceeded 25 seconds')),25000);
  app.on('child-process-gone',(_event,details)=>result.errors.push({stage:'child-process-gone',...details}));
  app.on('browser-window-created',(_event,created)=>{
    if(window)return;window=created;
    // Normal-graphics control preserves the app's configuration, but never shows it.
    created.show=created.showInactive=()=>{};
    created.on('show',()=>{result.visible=true;result.errors.push('Unexpected visible window');});
    created.webContents.on('render-process-gone',(_event,details)=>result.errors.push({stage:'render-process-gone',...details}));
    created.webContents.once('did-finish-load',()=>{void inspect().then(()=>finish(),finish);});
  });
  async function inspect(){
    const expected=config.built?'Open a file':'Runtime control ready';
    const body=await window.webContents.executeJavaScript('document.body.innerText');
    if(!body.includes(expected))throw Error('Expected renderer content missing');
    result.domReady=true;result.features=app.getGPUFeatureStatus();result.versions=process.versions;
    const capture=async label=>{
      try{
        // The default capture may temporarily reveal a hidden window.
        const image=await window.webContents.capturePage(undefined,{stayHidden:true,stayAwake:config.awake!==false});
        if(image.isEmpty())throw Error('Empty captured image');
        fs.writeFileSync(path.join(config.folder,`frame-${label}.png`),image.toPNG());
        result.captures.push({delay:label,painted:true,size:image.getSize()});
      }catch(error){result.captures.push({delay:label,painted:false,error:error.message});}
    };
    if(config.early)await capture('dom');
    for(const delay of [200,800,1500]){
      await new Promise(resolve=>setTimeout(resolve,delay));
      const started=Date.now();
      const value=await window.webContents.executeJavaScript('new Promise(resolve=>setTimeout(()=>resolve("alive"),50))');
      result.heartbeatMs=Date.now()-started;
      if(value!=='alive')throw Error('Renderer response missing');
      await capture(delay);
    }
    result.responsive=true;result.visible=window.isVisible();result.featuresAfterCapture=app.getGPUFeatureStatus();
    if(result.visible)throw Error('Window became visible');
  }
  if(config.built){require(config.main);return;}
  app.setPath('userData',process.env.PDFIX_TEST_DATA);
  if(config.software)app.disableHardwareAcceleration();
  app.whenReady().then(()=>{
    const created=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:config.throttle===true,offscreen:config.offscreen}});
    return created.loadURL('data:text/html,<meta http-equiv="Content-Security-Policy" content="default-src %27none%27"><title>Runtime control</title><p>Runtime control ready</p>');
  }).catch(finish);
}
