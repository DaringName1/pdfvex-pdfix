'use strict';
// fs.rename that waits out a brief lock. On Windows, antivirus or Windows Search sometimes holds a file open for a
// moment; renaming onto or from it then fails with EPERM, EACCES or EBUSY although nothing is wrong. Tries again a few
// times over about half a second, then gives the original error, so a lock held by a program the person must close
// is still reported as before.
const fs=require('node:fs/promises');
const BRIEF_LOCK=new Set(['EPERM','EACCES','EBUSY']),WAITS=[20,40,80,120,160];
async function renameWithRetry(from,to,{waits=WAITS,rename=fs.rename}={}){
  for(let attempt=0;;attempt++){
    try{return await rename(from,to);}
    catch(error){if(!BRIEF_LOCK.has(error.code)||attempt>=waits.length)throw error;await new Promise(resolve=>setTimeout(resolve,waits[attempt]));}
  }
}
module.exports={renameWithRetry};
