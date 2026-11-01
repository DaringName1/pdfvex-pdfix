import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';
import {execFile} from 'node:child_process';import {promisify} from 'node:util';
const exec=promisify(execFile),root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-icon-artwork-'));
try{
 const compiler=path.join(process.env.SystemRoot||'C:/Windows','Microsoft.NET/Framework64/v4.0.30319/csc.exe'),tool=path.join(root,'icon-artwork.exe');
 await exec(compiler,['/nologo','/target:exe','/platform:x64','/warnaserror+','/reference:System.Drawing.dll','/out:'+tool,path.resolve('scripts/pdfix-icon-artwork.cs')],{windowsHide:true,timeout:30000});
 const {stdout}=await exec(tool,[path.resolve('public/brand/pdfix-logo.png'),path.resolve('public/brand/pdfix.ico'),path.resolve('public/brand/pdfix-app.png')],{windowsHide:true,timeout:10000});console.log(stdout.trim());
}finally{await fs.rm(root,{recursive:true,force:true});}
