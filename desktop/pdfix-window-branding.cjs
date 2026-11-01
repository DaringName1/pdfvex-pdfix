'use strict';
const path=require('node:path');
// The running Electron process is inside runtime; taskbar relaunch must keep
// going through the outer graphics-retry launcher, just like desktop shortcuts.
function packagedWindowDetails({platform=process.platform,isPackaged,execPath,iconPath}){
 if(platform!=='win32'||!isPackaged)return null;
 if(typeof execPath!=='string'||!path.win32.isAbsolute(execPath)||/["\r\n\0]/.test(execPath)||path.win32.basename(path.win32.dirname(execPath)).toLowerCase()!=='runtime')return null;
 if(typeof iconPath!=='string'||!path.win32.isAbsolute(iconPath)||/["\r\n\0]/.test(iconPath))return null;
 const launcher=path.win32.join(path.win32.dirname(execPath),'..','PDFix.exe');
 return {appId:'com.pdfix.documentworkspace',appIconPath:iconPath,appIconIndex:0,relaunchCommand:'"'+launcher+'"',relaunchDisplayName:'PDFix'};
}
function configureWindowBranding(window,{app,root,execPath=process.execPath,platform=process.platform}){
 const details=packagedWindowDetails({platform,isPackaged:app.isPackaged,execPath,iconPath:path.join(root,'brand','pdfix.ico')});
 if(!details)return false;
 // Cosmetic shell integration must never turn into a startup failure.
 try{window.setAppDetails(details);return true;}catch(error){console.warn('PDFix taskbar branding could not be set:',error.message);return false;}
}
module.exports={packagedWindowDetails,configureWindowBranding};
