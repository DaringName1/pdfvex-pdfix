const {app,BrowserWindow,dialog}=require('electron'),fs=require('node:fs/promises');
module.exports=options=>{
 const report={mode:process.env.PDFIX_GRAPHICS_MODE,errors:[],visible:options.visible};let done=false;
 // Only a test fixture simulates the first fatal exit; production has no injection flag.
 if(options.retry&&report.mode==='normal'){process.stderr.write("[FATAL:gpu_data_manager_impl_private.cc] GPU process isn't usable. Goodbye.\n",()=>app.exit(37));return false;}
 if(!options.visible){BrowserWindow.prototype.show=function(){};BrowserWindow.prototype.focus=function(){};}
 dialog.showOpenDialog=async()=>({canceled:false,filePaths:[options.pdf]});
 const timer=setTimeout(()=>finish(Error('Graphics app check exceeded 60 seconds.')),60000);
 async function finish(error){if(done)return;done=true;clearTimeout(timer);if(error)report.error=error.stack;report.hardwareAcceleration=app.isHardwareAccelerationEnabled();report.pass=!report.error&&!report.errors.length;await fs.writeFile(options.report,JSON.stringify(report,null,2));app.quit();setTimeout(()=>app.exit(2),10000).unref();}
 app.on('browser-window-created',(_event,win)=>{
  win.webContents.setBackgroundThrottling(false);
  win.webContents.on('render-process-gone',(_event,details)=>report.errors.push(details.reason));
  win.webContents.once('did-finish-load',()=>setTimeout(async()=>{
   try{
    const js=fn=>win.webContents.executeJavaScript('('+fn.toString()+')()');
    await js(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Open a file').click());
    const started=Date.now();while(!await js(()=>document.querySelector('.pdf-paper')?.dataset.ready==='true')){if(Date.now()-started>30000)throw Error('Drawing did not render.');await new Promise(resolve=>setTimeout(resolve,50));}
    await js(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await new Promise(resolve=>setTimeout(resolve,250));
    report.drawingText=await js(()=>document.querySelector('.textLayer')?.textContent);if(!report.drawingText?.includes('PDFix graphics check'))throw Error('Generated drawing text is missing.');
    report.marker=await fs.readFile(process.env.PDFIX_GRAPHICS_STATE,'utf8');
    report.windowVisible=win.isVisible();report.features=app.getGPUFeatureStatus();
    await fs.writeFile(options.screenshot,(await win.webContents.capturePage()).toPNG());
    await new Promise(resolve=>setTimeout(resolve,options.visible?1500:50));await finish();
   }catch(error){await finish(error);}
  },250));
 });return true;
};
