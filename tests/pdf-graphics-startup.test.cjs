const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {EventEmitter}=require('node:events');
const {install}=require('../desktop/graphics-startup.cjs');
function session(t,mode='normal'){
 const token=crypto.randomBytes(16).toString('hex'),directory=path.join(os.tmpdir(),'pdfix-graphics-startup-'+token);fs.mkdirSync(directory);const file=path.join(directory,'state');fs.writeFileSync(file,token+':starting:'+mode);
 t.after(()=>{fs.rmSync(file,{force:true});fs.rmdirSync(directory);});
 const app=new EventEmitter();app.disableHardwareAcceleration=()=>{app.disabled=(app.disabled||0)+1;};
 return {app,file,token,env:{PDFIX_GRAPHICS_TOKEN:token,PDFIX_GRAPHICS_MODE:mode,PDFIX_GRAPHICS_STATE:file}};
}
test('ordinary direct startup keeps existing graphics and installs no watcher',()=>{const app=new EventEmitter();assert.doesNotThrow(()=>install({app},{}).markInteractive());assert.equal(app.eventNames().length,0);});
for(const mode of ['normal','software'])test(mode+' launch fences retries before any trusted request and records its mode',t=>{
 const s=session(t,mode),guard=install({app:s.app},s.env);assert.equal(s.app.disabled,mode==='software'?1:undefined);
 guard.markInteractive();assert.equal(fs.readFileSync(s.file,'utf8'),s.token+':interactive:'+mode);guard.markInteractive();
});
for(const event of ['show','did-finish-load'])test(event+' permanently fences startup retry before a usable window',t=>{
 const s=session(t),win=new EventEmitter();win.webContents=new EventEmitter();install({app:s.app},s.env);s.app.emit('browser-window-created',{},win);(event==='show'?win:win.webContents).emit(event);
 assert.equal(fs.readFileSync(s.file,'utf8'),s.token+':interactive:normal');
});
test('an arbitrary environment path cannot redirect a graphics marker write',t=>{const s=session(t);assert.throws(()=>install({app:s.app},{...s.env,PDFIX_GRAPHICS_STATE:path.join(path.dirname(s.file),'other')}),/location/);assert.equal(fs.readFileSync(s.file,'utf8'),s.token+':starting:normal');});
test('invalid token, mode or already-used marker refuses software changes',t=>{const s=session(t,'software');for(const env of [{...s.env,PDFIX_GRAPHICS_TOKEN:'bad'},{...s.env,PDFIX_GRAPHICS_MODE:'disable-security'}])assert.throws(()=>install({app:s.app},env));fs.writeFileSync(s.file,'unexpected');assert.throws(()=>install({app:s.app},s.env),/does not match/);assert.equal(s.app.disabled,undefined);});
test('a changed marker fails closed before an app request is authorized',t=>{const s=session(t),guard=install({app:s.app},s.env);fs.writeFileSync(s.file,'changed');assert.throws(()=>guard.markInteractive(),/changed/);assert.equal(fs.readFileSync(s.file,'utf8'),'changed');});
test('hard-linked markers are refused without modifying their target',t=>{const s=session(t),alias=path.join(path.dirname(s.file),'linked');fs.linkSync(s.file,alias);try{assert.throws(()=>install({app:s.app},s.env),/Invalid graphics startup receipt/);}finally{fs.unlinkSync(alias);}});

// Windows short (8.3) names: the launcher and Node may spell the same temp folder differently (for example
// C:\Users\PDFIXT~1 when the account name has a space). The same file is accepted; a different file is not.
const shortName=p=>require('node:child_process').execSync('for %I in ("'+p+'") do @echo %~sI',{shell:'cmd.exe',encoding:'utf8'}).trim();
test('the same receipt spelled with a Windows short name is accepted',{skip:process.platform!=='win32'},t=>{const s=session(t),short=shortName(s.file);if(short.toLowerCase()===s.file.toLowerCase())return t.skip('this drive makes no short names');assert.ok(/~[0-9]/.test(short));assert.doesNotThrow(()=>install({app:s.app},{...s.env,PDFIX_GRAPHICS_STATE:short}));});
test('a short-name path to a different receipt is still refused',{skip:process.platform!=='win32'},t=>{const s=session(t),other=session(t),short=shortName(other.file);if(short.toLowerCase()===other.file.toLowerCase())return t.skip('this drive makes no short names');assert.throws(()=>install({app:s.app},{...s.env,PDFIX_GRAPHICS_STATE:short}),/receipt location/);});
