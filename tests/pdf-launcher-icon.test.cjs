const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),{createHash}=require('node:crypto');
const {promisify}=require('node:util'),exec=promisify(require('node:child_process').execFile);
test('built startup executable embeds every exact PDFix icon size and pins the source icon',{skip:process.platform!=='win32',timeout:60000},async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-icon-check-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const checker=path.join(root,'check-icon.exe'),compiler=path.join(process.env.SystemRoot||'C:\\Windows','Microsoft.NET/Framework64/v4.0.30319/csc.exe');
 await exec(compiler,['/nologo','/target:exe','/platform:x64','/warnaserror+','/reference:System.Drawing.dll','/out:'+checker,path.resolve('tests/helpers/pdfix-icon-resource.cs')],{windowsHide:true,timeout:30000});
 const icon=path.resolve('public/brand/pdfix.ico'),binary=path.resolve('dist/native/graphics-startup/PDFix.exe'),manifest=JSON.parse(await fs.readFile('dist/native/graphics-startup/manifest.json','utf8'));
 assert.equal(manifest.iconSha256,createHash('sha256').update(await fs.readFile(icon)).digest('hex'));
 const {stdout}=await exec(checker,[binary,icon],{windowsHide:true,timeout:10000}),result=JSON.parse(stdout);assert.equal(result.pass,true);assert.equal(result.exactEmbeddedPayloads,true);assert.equal(result.sizes,7);
});
