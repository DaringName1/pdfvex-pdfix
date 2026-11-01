const {test}=require('node:test'),assert=require('node:assert/strict');
const {packagedWindowDetails,configureWindowBranding}=require('../desktop/pdfix-window-branding.cjs');
const input={platform:'win32',isPackaged:true,execPath:'C:\\Users\\Test User\\Programs\\PDFix\\build\\runtime\\PDFix.exe',iconPath:'C:\\Users\\Test User\\Programs\\PDFix\\build\\runtime\\resources\\app\\dist\\brand\\pdfix.ico'};
test('running packaged taskbar uses branded icon and the quoted outer retry launcher',()=>{
 const d=packagedWindowDetails(input);assert.equal(d.appId,'com.pdfix.documentworkspace');assert.equal(d.appIconPath,input.iconPath);assert.equal(d.relaunchCommand,'"C:\\Users\\Test User\\Programs\\PDFix\\build\\PDFix.exe"');assert.equal(d.relaunchDisplayName,'PDFix');assert.equal(d.appIconIndex,0);
});
test('development, other platforms and unexpected runtime paths are not misregistered',()=>{
 for(const extra of [{platform:'linux'},{isPackaged:false},{execPath:'relative.exe'},{execPath:'C:\\PDFix.exe'},{execPath:'C:\\bad"name\\runtime\\PDFix.exe'},{iconPath:'relative.ico'}])assert.equal(packagedWindowDetails({...input,...extra}),null);
});
test('shell branding failure cannot crash startup',()=>{
 assert.equal(configureWindowBranding({setAppDetails(){throw Error('Unavailable');}},{app:{isPackaged:true},root:'C:\\build\\runtime\\resources\\app\\dist',execPath:input.execPath,platform:'win32'}),false);
});
