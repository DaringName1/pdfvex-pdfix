// Hidden check that the application menu offers no Reload, Force Reload or developer tools (which would restart the
// interface without the departure checks). Keys typed into a hidden test window do not reach menu shortcuts, so this
// reads the menu itself rather than pressing Ctrl+R.
import {_electron as electron} from '@playwright/test';
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Menu-'));let app,report={};
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0',PDFIX_DEVTOOLS:''},timeout:30000});await app.firstWindow();
 report=await app.evaluate(({Menu})=>{const items=[];const walk=menu=>{for(const item of menu?.items??[]){items.push({label:item.label,role:item.role??null,accelerator:item.accelerator??null});walk(item.submenu);}};walk(Menu.getApplicationMenu());return {items};});
 const roles=report.items.map(item=>String(item.role).toLowerCase());report.forbidden=roles.filter(role=>['reload','forcereload','toggledevtools'].includes(role));
 report.kept=['undo','redo','cut','copy','paste','selectall','togglefullscreen','quit'].filter(role=>!roles.includes(role)).map(role=>'missing '+role);
}catch(error){report.error=error.message;}
finally{if(app)await Promise.race([app.close().catch(()=>{}),new Promise(r=>setTimeout(r,10000))]);await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.error&&!report.forbidden?.length&&!report.kept?.length;
console.log(JSON.stringify({pass:report.pass,forbidden:report.forbidden,missing:report.kept,error:report.error}));process.exit(report.pass?0:1);
