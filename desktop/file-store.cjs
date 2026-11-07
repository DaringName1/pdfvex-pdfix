const {stageOutput,stageStreamOutput,publishOutput,replaceOutput}=require('./verified-output.cjs');
const fs = require('node:fs/promises'),{renameWithRetry}=require('./rename-retry.cjs');
const path = require('node:path');
const { randomUUID, createHash } = require('node:crypto');
const { RecoveryStore } = require('./recovery-store.cjs');
const { LargePdfStore, PDF_CHUNK_SIZE, MAX_RANGE_BYTES } = require('./large-pdf-store.cjs');

const {SignatureStore}=require('./signature-store.cjs');
const MAX_OPEN_FILES=10;
const {writeSplit}=require('./split-writer.cjs');
const {PageRecipes}=require('./page-recipes.cjs');
const {validImagePages,IMAGE_TYPES}=require('./image-pages-validation.cjs');

const MAX_BYTES = 100 * 1024 * 1024;
const NEW_DOCUMENT_KEY=/^new:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const IN_PLACE_FORMATS=['docx','rtf','txt','md','markdown','json','xml','yaml','yml','csv'],BACKUP_NAME=/^\d{4}-\d{2}-\d{2}T[\d-]+Z\.[a-z]{2,8}$/;
const TYPES = new Set(['tif','tiff','pdf', 'docx', 'pptx', 'xlsx', 'rtf', 'txt', 'md', 'markdown', 'json', 'xml', 'yaml', 'yml', 'csv', 'png', 'jpg', 'jpeg', 'webp', 'bmp']);
class FileError extends Error { constructor(code, message) { super(message); this.code = code; } }
function extension(name) { return path.extname(name).slice(1).toLowerCase(); }
function canonical(p) { return path.resolve(p).toLowerCase(); }
function validateFile(name, bytes) {
  const ext = extension(name);
  if (!TYPES.has(ext)) throw new FileError('UNSUPPORTED', `.${ext || '(no extension)'} is not supported in this build. Check Format support for planned options.`);
  if (!bytes.length) throw new FileError('EMPTY', 'This file is empty. Choose a file that contains content.');
  if (bytes.length > MAX_BYTES) throw new FileError('TOO_LARGE', 'This file exceeds the 100 MB opening limit. Try a smaller file.');
  const header = bytes.subarray(0, 1024).toString('latin1');
  const signatures = { rtf: /^\{\\rtf1(?:\\|\s)/.test(header), pdf: header.includes('%PDF-'), pptx: bytes[0]===80 && bytes[1]===75 && bytes[2]===3 && bytes[3]===4, xlsx: bytes[0]===80 && bytes[1]===75 && bytes[2]===3 && bytes[3]===4, docx: bytes[0]===80 && bytes[1]===75 && bytes[2]===3 && bytes[3]===4, png: bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])), jpg: bytes[0] === 255 && bytes[1] === 216, jpeg: bytes[0] === 255 && bytes[1] === 216, webp: header.startsWith('RIFF') && header.slice(8, 12) === 'WEBP', bmp: header.startsWith('BM') };
  if(['tif','tiff'].includes(ext)&&!(bytes.length>=8&&(bytes[0]===73&&bytes[1]===73&&bytes[2]===42&&bytes[3]===0||bytes[0]===77&&bytes[1]===77&&bytes[2]===0&&bytes[3]===42)))throw new FileError('DAMAGED','Choose a classic TIFF 6 file; BigTIFF is not supported in this decoder.');
  if (ext in signatures && !signatures[ext]) throw new FileError('DAMAGED', `The contents do not match a ${ext.toUpperCase()} file. It may be damaged or have the wrong file ending. Try getting a new copy.`);
  return ext;
}
class FileStore {
  constructor(directory) { this.directory = directory; this.recents = []; this.handles = new Map(); this.queue = Promise.resolve();this.mutations=Promise.resolve();this.sessions=Promise.resolve();this.disposed=false;this.generation=0;this.outputWrites=new Set();this.largePdfs=new LargePdfStore(directory,FileError);this.recovery=new RecoveryStore(directory);this.signatures=new SignatureStore(directory,this.recovery);this.pages=new PageRecipes(this,FileError,validateFile);this.imagePages=new PageRecipes(this,FileError,validateFile,{kind:'image-pages',types:IMAGE_TYPES,fields:['pages'],validate:validImagePages,sourceBytes:32*1024*1024}); }
  async init() {
    await fs.mkdir(this.directory, { recursive: true });
    try { this.snapshotCleanupWarning = await this.largePdfs.init(); }
    catch { this.snapshotCleanupWarning = 'Temporary PDF reading snapshots could not be checked for cleanup. Your original documents and recent-file history are unaffected.'; }
    await this.recovery.init();
    try {
      const data = await this.recovery.read(path.join(this.directory, 'workspace.json'),8*1024*1024);
      this.recents = Array.isArray(data.recents) ? data.recents.filter(r => typeof r.id === 'string' && typeof r.path === 'string' && typeof r.name === 'string').slice(0, 100) : [];
    } catch (e) { if (e.code !== 'ENOENT') this.recoveryWarning = 'Recent-file history could not be read. Your documents are safe; history starts fresh.'; }
    if (this.snapshotCleanupWarning) this.recoveryWarning = [this.recoveryWarning, this.snapshotCleanupWarning].filter(Boolean).join(' ');
  }
  list() { return this.recents.map(({id,name,path:location,size,ext,openedAt,favorite}) => ({id,name,location,size,ext,openedAt,favorite:!!favorite})); }
  persist() {
    const json = JSON.stringify({ version: 1, recents: this.recents }, null, 2);
    if(Buffer.byteLength(json)>8*1024*1024)throw new FileError('WORKSPACE_WRITE','Local file history is full. Clear recent files in Settings before adding more.');
    const operation = this.queue.catch(() => {}).then(async () => {
      const temporary = path.join(this.directory, `workspace-${randomUUID()}.tmp`);
      try { await fs.writeFile(temporary, json, { flag: 'wx' });await renameWithRetry(temporary, path.join(this.directory, 'workspace.json')); }
      finally { await fs.rm(temporary, { force: true }); }
    });
    this.queue = operation;
    return operation;
  }
  updateRecents(transform){
    const operation=this.mutations.catch(()=>{}).then(async()=>{const previous=this.recents,next=transform(previous);this.recents=next;try{await this.persist();}catch(error){this.recents=previous;throw error instanceof FileError?error:new FileError('WORKSPACE_WRITE','Local file history could not be saved. Check application-folder permissions or disk space. The current document remains open.');}});
    this.mutations=operation;return operation;
  }
  session(operation) {
    const pending = this.sessions.catch(() => {}).then(operation);
    this.sessions = pending;
    return pending;
  }
  open(filePath, options = {}) {
    const generation = this.generation;
    return this.session(() => {
      this.checkGeneration(generation);
      return this.openSession(filePath, options, generation);
    });
  }
  checkGeneration(generation) { if (this.disposed || generation !== this.generation) throw new FileError('MISSING', 'The file session ended. Reopen the file before continuing.'); }
  openProgress(event) {
    try {
      if (typeof this.onOpenProgress === 'function') {
        const pending = this.onOpenProgress(event);
        if (pending && typeof pending.catch === 'function') pending.catch(() => {});
      }
    } catch {}
  }
  setOpenFilesMode(mode) { if (!['single','tabs'].includes(mode)) throw new FileError('STATE', 'Choose single or tabs.'); this.keepOpen = mode === 'tabs'; return { mode, open: this.handles.size, limit: MAX_OPEN_FILES }; }
  inMemoryBytes() { return [...this.handles.values()].reduce((sum, source) => sum + (source.fileBacked ? 0 : source.bytes.length), 0); }
  async openSession(filePath, { retain = false, expectedHash, maxBytes, storageApproval } = {}, generation = this.generation) {
    if (typeof filePath !== 'string' || !path.isAbsolute(filePath)) throw new FileError('PATH', 'Choose a file with the file picker.');
    if (maxBytes !== undefined && (!Number.isSafeInteger(maxBytes) || maxBytes <= 0)) throw new FileError('TOO_LARGE', 'Choose a valid file opening limit.');
    if (retain && this.handles.size >= 10) throw new FileError('TOO_LARGE', 'This session reached its 10-file input limit. Use fewer files.');
    // Tabs mode (S19, set by the screen with setOpenFilesMode('tabs')): opening a file keeps the other open files, up to 10.
    const tabs = !retain && this.keepOpen === true, alreadyOpen = tabs && [...this.handles.values()].some(held => typeof held.path === 'string' && canonical(held.path) === canonical(filePath));
    if (tabs && !alreadyOpen && this.handles.size >= MAX_OPEN_FILES) throw new FileError('TOO_MANY', 'You have 10 files open. Close one of them, then open this file.');
    const storage=typeof this.beforeOpen==='function'?await this.beforeOpen(filePath,{storageApproval}):undefined;
    this.checkGeneration(generation);
    let real, bytes, stat, source, progressContext;
    try {
      real = await fs.realpath(filePath);
      const handle = await fs.open(real, 'r');
      try {
        stat = await handle.stat();
        if (!stat.isFile()) throw new FileError('NOT_FILE', 'Choose a file, rather than a folder.');
        const name = path.basename(real), ext = extension(name), limit = Math.min(MAX_BYTES, maxBytes ?? MAX_BYTES);
        if (stat.size > limit) {
          if (ext !== 'pdf' || maxBytes !== undefined) throw new FileError('TOO_LARGE', `This file exceeds the ${limit/1024/1024} MB opening limit. Try a smaller file.`);
          progressContext = { name, size: stat.size };
          this.openProgress({ ...progressContext, stage: 'preparing', bytes: 0, total: stat.size });
          source = await this.largePdfs.create(handle, stat, { path: real, name, ext }, () => this.checkGeneration(generation), event => this.openProgress({ ...progressContext, ...event }));
        } else {
        if (retain && this.inMemoryBytes() + stat.size > MAX_BYTES) throw new FileError('TOO_LARGE', 'This session reached its 100 MB in-memory input limit. Use fewer or smaller files.');
        if (tabs && !alreadyOpen && this.inMemoryBytes() + stat.size > MAX_BYTES) throw new FileError('TOO_MANY', 'Your open files are using all the memory PDFix sets aside for them. Close one of them, then open this file.');
        // Never allocate an unbounded buffer if the source grows after stat.
        bytes = Buffer.alloc(stat.size + 1);
        let total = 0;
        while (total < bytes.length) {
          this.checkGeneration(generation);
          const read = await handle.read(bytes, total, bytes.length - total, total);
          if (!read.bytesRead) break;
          total += read.bytesRead;
        }
        const after=await handle.stat();
        if (total !== stat.size || ['size','dev','ino','mtimeMs','ctimeMs'].some(key=>stat[key]!==after[key])) throw new FileError('CHANGED', 'The file changed while opening. Close the other editor and try again.');
        bytes = bytes.subarray(0, total);
        }
      } finally { await handle.close(); }
    } catch (e) {
      if (source?.fileBacked) await this.largePdfs.release(source).catch(() => {});
      if (progressContext) this.openProgress({ ...progressContext, stage: 'canceled', bytes: 0, total: stat.size });
      if (e instanceof FileError) throw e;
      const storageMessage=storage?.downloadRequired?'The storage provider could not supply this file. Make it available offline in its synchronization app, check the connection and try again.':storage?.network?'The network-backed source could not be read. Check the connection, file locks and permissions, then choose it again.':undefined;
      throw new FileError('READ', storageMessage || (['EBUSY','ETXTBSY','EACCES','EPERM'].includes(e.code)?'The file is locked or permission was denied. Close another editor, check permissions and try again.':'This file cannot be read. It may have moved, or access is denied. Browse to the file again.'));
    }
    try {
    this.checkGeneration(generation);
    const name = path.basename(real), ext = source ? 'pdf' : validateFile(name, bytes);
    const fingerprint = source?.fingerprint ?? createHash('sha256').update(bytes).digest('hex');
    if(expectedHash!==undefined&&(!/^[a-f0-9]{64}$/.test(expectedHash)||fingerprint!==expectedHash))throw new FileError('CHANGED','The saved copy changed after verification. Open it separately to review the changed file.');
    const size = source?.size ?? bytes.length;
    const readingProfile=ext==='pdf'&&typeof this.readingProfile==='function'?this.readingProfile(size):undefined;
    if (retain && (this.handles.size >= 10 || this.inMemoryBytes() + (source?.fileBacked ? 0 : size) > MAX_BYTES)) throw new FileError('TOO_LARGE','This session reached its 10-file or 100 MB in-memory input limit. Use fewer or smaller files.');
    let recent;
    await this.updateRecents(previous=>{const old=previous.find(r=>canonical(r.path)===canonical(real));recent={id:old?.id||randomUUID(),path:real,name,size,ext,favorite:!!old?.favorite,openedAt:new Date().toISOString(),reading:old?.reading};return [recent,...previous.filter(r=>r.id!==recent.id)].slice(0,100);});
    this.checkGeneration(generation);
    // Tabs mode: the same unchanged file opened again keeps its one session, so the screen never ends up holding an id
    // it released as a duplicate (S19, Oct 30: Protect after reopening an open PDF said "The file session ended").
    const same = tabs && !source ? [...this.handles.entries()].find(([, held]) => !held.fileBacked && held.bytes && canonical(held.path) === canonical(real) && held.fingerprint === fingerprint) : null;
    const id = same ? same[0] : randomUUID();
    // Keep one session snapshot, matching the one-document workspace.
    if (tabs && !same && (this.handles.size >= MAX_OPEN_FILES || this.inMemoryBytes() + (source?.fileBacked ? 0 : size) > MAX_BYTES)) throw new FileError('TOO_MANY', 'You have too many files open. Close one of them, then open this file.');
    if (!retain && !tabs) await this.clearSessionHandles();
    this.checkGeneration(generation);
    if (!same) this.handles.set(id, source || { path: real, bytes: Buffer.from(bytes), name, ext, fingerprint });
    if(!same&&!source&&ext==='pdf'){
      const owned=this.handles.get(id);
      Object.defineProperty(owned,'pagedInput',{value:()=>{
        const validate=()=>{this.checkGeneration(generation);if(this.handles.get(id)!==owned)throw new FileError('MISSING','The PDF reading session ended.');return true;};
        validate();return Object.freeze({length:owned.bytes.length,sha256:owned.fingerprint,validate,stage:async(target,{signal}={})=>{
          validate();if(signal?.aborted)throw new FileError('CANCELED','PDF preparation canceled.');
          if(typeof target!=='string'||!path.isAbsolute(target)||path.basename(target)!=='input.pdf')throw new FileError('PATH','Choose an app-owned PDF input slot.');
          // This path is already bounded to 100 MiB; it stages the immutable
          // retained bytes, not a fresh read of a possibly changed original.
          const handle=await fs.open(target,'wx',0o600);try{await handle.writeFile(owned.bytes);await handle.sync();}finally{await handle.close();}
          validate();if(signal?.aborted)throw new FileError('CANCELED','PDF preparation canceled.');
        }});
      }});
    }
    if (source?.fileBacked) Object.defineProperty(source, 'reviewInput', { value: () => {
      const checkActive = () => { this.checkGeneration(generation); if (this.handles.get(id) !== source) throw new FileError('MISSING', 'The PDF session ended. No comment inventory was released.'); };
      checkActive(); return this.largePdfs.reviewInput(source, checkActive);
    } });
    if (source?.fileBacked) Object.defineProperty(source, 'pagedInput', { value: () => {
      const checkActive = () => { this.checkGeneration(generation); if (this.handles.get(id) !== source) throw new FileError('MISSING', 'The disk-backed PDF session ended. Reopen the file before loading more pages.'); };
      checkActive(); return this.largePdfs.pagedInput(source, checkActive);
    } });
    if (progressContext) this.openProgress({ ...progressContext, stage: 'done', bytes: size, total: size });
    if (source) return { id, recentId: recent.id, name, ext, size, location: real, sourceSha256: fingerprint, ...(source.pagedFile?{pagedSource:true}:{rangeSource:{length:size,chunkSize:PDF_CHUNK_SIZE}}), largeFile: true, readingProfile:{...readingProfile,...(source.pagedFile?{conservativeReading:true}:{})}, notice: source.pagedFile?'Disk-backed reading prepares one page at a time. Large or complex pages can take longer. Full-document transformations remain limited to 100 MiB. Save a copy streams unchanged original bytes; extracted working pages are private previews, not signed originals.':'Large PDFs use on-demand reads from an immutable disk snapshot. Whole-file transformations are limited to PDFs under 100 MiB. Save a copy can stream unchanged original bytes.', capabilities: { reading: true, reviewInventory: size<=256*1024*1024, editing: false, export: false } };
    return { id, recentId: recent.id, name, ext, size, location: real, bytes: Uint8Array.from(bytes), ...(storage?{sourceStorage:{downloadRequired:storage.downloadRequired,network:storage.network,hardLinkAliases:storage.hardLinkAliases,snapshot:'immutable local source bytes; provider synchronization remains external'}}:{}), ...(readingProfile?{readingProfile}:{}) };
    } catch (error) {
      if (source?.fileBacked) await this.largePdfs.release(source).catch(() => {});
      if (progressContext) this.openProgress({ ...progressContext, stage: 'canceled', bytes: 0, total: stat.size });
      throw error;
    }
  }
  clearSessions() {
    // A crashed/replaced renderer cannot commit an open already waiting in the
    // queue. A later renderer can still create sessions on this FileStore.
    this.generation++;
    return this.session(async () => {
      await Promise.allSettled([...this.outputWrites]);
      let failure;
      try { await this.clearSessionHandles(); } catch (error) { failure = error; }
      // Also retry cleanup of privately tracked failed-open files and any
      // descriptor whose earlier removal failed. LargePdfStore stays reusable.
      try { await this.largePdfs.dispose(); } catch (error) { failure = error; }
      if (failure) throw failure;
    });
  }
  async clearSessionHandles() {
    const entries = [...this.handles.entries()];
    if(this.onReleaseSource)for(const [id]of entries)await this.onReleaseSource(id);
    const sources = entries.map(([,source])=>source);
    this.handles.clear();
    let failure;
    for (const source of sources) if (source.fileBacked) {
      try { await this.largePdfs.release(source); } catch (error) { failure = error; }
    }
    if (failure) throw failure;
  }
  readPdfRange(id, begin, end) {
    const generation = this.generation;
    return this.session(async () => {
      this.checkGeneration(generation);
      const source = this.source(id);
      if (source.ext !== 'pdf') throw new FileError('FORMAT', 'PDF byte ranges require an opened PDF.');
      if (!Number.isSafeInteger(begin) || !Number.isSafeInteger(end) || begin < 0 || end <= begin || end > (source.fileBacked ? source.size : source.bytes.length) || end - begin > MAX_RANGE_BYTES) throw new FileError('RANGE', 'Choose a valid PDF byte range of at most 1 MiB.');
      if (!source.fileBacked) return Uint8Array.from(source.bytes.subarray(begin, end));
      try { const bytes = await this.largePdfs.read(source, begin, end); this.checkGeneration(generation); return bytes; }
      catch (error) { this.handles.delete(id); await this.largePdfs.release(source).catch(() => {}); throw error; }
    });
  }
  release(id) {
    return this.session(async () => {
      const source = this.handles.get(id);
      if (!source) return false;
      if(this.onReleaseSource)await this.onReleaseSource(id);
      this.handles.delete(id);
      if (source.fileBacked) await this.largePdfs.release(source);
      return true;
    });
  }
  dispose() {
    this.disposed = true;
    this.generation++;
    return this.session(async () => {
      let failure;
      try { await this.clearSessionHandles(); } catch (error) { failure = error; }
      try { await this.largePdfs.dispose(); } catch (error) { failure = error; }
      if (failure) throw failure;
    });
  }
  async reopen(id) {
    const entry = this.recents.find(r => r.id === id);
    if (!entry) throw new FileError('MISSING', 'This item is no longer in your recent files. Browse to open it.');
    return this.open(entry.path);
  }
  async favorite(id) {
    await this.updateRecents(previous=>{if(!previous.some(r=>r.id===id))throw new FileError('MISSING','This recent file was removed.');return previous.map(r=>r.id===id?{...r,favorite:!r.favorite}:r);});return this.list();
  }
  async forget(id) { await this.updateRecents(previous=>previous.filter(r=>r.id!==id));return this.list(); }
  reading(id){
    const source=this.source(id);if(source.ext!=='pdf')throw new FileError('FORMAT','Reading positions are available for PDFs.');
    const fingerprint=source.fingerprint,entry=this.recents.find(r=>canonical(r.path)===canonical(source.path)),saved=entry?.reading;
    if(saved?.fingerprint!==fingerprint)return {page:1,bookmarks:[]};
    return {page:Number.isInteger(saved.page)&&saved.page>=1&&saved.page<=Number.MAX_SAFE_INTEGER?saved.page:1,bookmarks:Array.isArray(saved.bookmarks)?saved.bookmarks.filter(b=>Number.isInteger(b.page)&&b.page>=1&&b.page<=Number.MAX_SAFE_INTEGER&&typeof b.title==='string').slice(0,100).map(b=>({page:b.page,title:b.title.slice(0,80)})):[]};
  }
  async saveReading(id,value){
    const source=this.source(id);if(source.ext!=='pdf')throw new FileError('FORMAT','Reading positions are available for PDFs.');
    if(!value||!Number.isInteger(value.page)||value.page<1||value.page>Number.MAX_SAFE_INTEGER||!Array.isArray(value.bookmarks)||value.bookmarks.length>100||value.bookmarks.some(b=>!Number.isInteger(b.page)||b.page<1||b.page>Number.MAX_SAFE_INTEGER||typeof b.title!=='string'||b.title.length>80))throw new FileError('STATE','Choose a valid PDF page and up to 100 short personal bookmarks.');
    const reading={fingerprint:source.fingerprint,page:value.page,bookmarks:value.bookmarks.map(b=>({page:b.page,title:b.title}))};
    await this.updateRecents(previous=>{if(!previous.some(r=>canonical(r.path)===canonical(source.path)))throw new FileError('MISSING','Reopen this PDF to remember its reading position.');return previous.map(r=>canonical(r.path)===canonical(source.path)?{...r,reading}:r);});return {page:value.page,bookmarks:reading.bookmarks};
  }
  source(id) {
    const source = this.handles.get(id);
    if (!source) throw new FileError('MISSING', 'The file session ended. Reopen the file before saving.');
    return source;
  }
  trackOutput(operation){if(this.disposed)throw new FileError('MISSING','The file session ended before saving.');if(this.outputWrites.size)throw new FileError('BUSY','Finish the current verified copy or split save before starting another.');const pending=Promise.resolve().then(operation);this.outputWrites.add(pending);pending.then(()=>this.outputWrites.delete(pending),()=>this.outputWrites.delete(pending));return pending;}
  saveCopy(id,destination,output,exportExt,expectedHash,validation){const generation=this.generation;return this.trackOutput(async()=>this.rememberSaved(await this.saveCopyJob(id,destination,output,exportExt,expectedHash,validation,generation),generation));}
  // "Continue with saved copy": the main process remembers only the newest completed copy (its location and
  // SHA-256) and hands the page a one-off token. The page never supplies a path; nothing is remembered when saving is
  // canceled or fails; the token is replaced by the next save, expires after 30 minutes, and ends on a privacy reset.
  rememberSaved(saved,generation){
    if(!saved||typeof saved.location!=='string'||!/^[a-f0-9]{64}$/.test(saved.sha256||''))return saved;
    const token=randomUUID();this.lastSaved={token,location:saved.location,sha256:saved.sha256,size:saved.size,at:Date.now(),generation};
    return {...saved,continueToken:token};
  }
  savedFor(token,message){
    const saved=this.lastSaved;
    if(!saved||typeof token!=='string'||token!==saved.token||saved.generation!==this.generation||Date.now()-saved.at>30*60*1000)throw new FileError('MISSING',message);
    return saved;
  }
  async openSavedCopy(token){
    const saved=this.savedFor(token,'Save a copy first, then continue with it.');
    // Opens exactly the bytes PDFix saved; a copy changed since by another program is refused by the hash check.
    return this.open(saved.location,{expectedHash:saved.sha256});
  }
  // Show in folder for the same newest copy: the main process uses its own remembered location, never a page path.
  // Only a plain file that is still there at the saved size is shown; the token stays usable for Continue.
  async savedCopyToReveal(token){
    const saved=this.savedFor(token,'Save a copy first, then show it in its folder.');let info;
    try{info=await fs.lstat(saved.location);}catch{throw new FileError('MISSING','The saved copy is no longer in that folder. It may have been moved or deleted.');}
    if(!info.isFile()||info.isSymbolicLink()||(Number.isInteger(saved.size)&&info.size!==saved.size))throw new FileError('CHANGED','The saved copy was changed or replaced after PDFix saved it, so it is not shown.');
    return saved.location;
  }
  async saveCopyJob(id, destination, output, exportExt, expectedHash, validation, generation) {
    this.checkGeneration(generation);
    const source = id ? this.source(id) : null;
    if (source?.fileBacked&&output!==undefined) source.bytes;
    if(!source && !exportExt)throw new FileError('MISSING','Open a document before saving a copy.');
    if(exportExt && !['eml','fdf','xfdf','png','jpg','pdf','pptx','xlsx','docx','rtf','txt','md','markdown','json','xml','yaml','yml','csv'].includes(exportExt))throw new FileError('FORMAT','This export format is unavailable.');
    if (!path.isAbsolute(destination)) throw new FileError('PATH', 'Choose an output location in the Save dialog.');
    let parent;
    try { parent = await fs.realpath(path.dirname(destination)); } catch { throw new FileError('PATH', 'The output folder is unavailable. Choose another folder.'); }
    const resolved = path.join(parent, path.basename(destination));
    if ([...this.handles.values()].some(h => canonical(h.path) === canonical(resolved)) || this.recents.some(r => canonical(r.path) === canonical(resolved))) throw new FileError('ORIGINAL', 'PDFix keeps originals safe. Choose a new filename for your copy.');
    if (extension(resolved) !== (exportExt || source.ext)) throw new FileError('FORMAT', 'Use the selected output extension. Save a copy preserves the source format.');
    if(source?.fileBacked){
      if(exportExt&&exportExt!=='pdf'||expectedHash!==undefined&&expectedHash!==source.fingerprint)throw new FileError('FORMAT','A disk-backed source can currently save an unchanged PDF copy only.');
      const check=()=>{this.checkGeneration(generation);if(this.handles.get(id)!==source)throw new FileError('CHANGED','The PDF source session ended during copying.');if(validation?.signal?.aborted)throw new FileError('CANCELED','Large PDF copying canceled. No completed copy was published.');};
      const input={size:source.size,sha256:source.fingerprint,chunks:(async function*(store){for(let offset=0;offset<source.size;offset+=MAX_RANGE_BYTES){check();const bytes=await store.largePdfs.read(source,offset,Math.min(source.size,offset+MAX_RANGE_BYTES));try{check();yield bytes;}finally{bytes.fill(0);}}})(this)};
      try{if(typeof fs.statfs==='function'){const available=await fs.statfs(parent,{bigint:true});if(available.bavail*available.bsize<BigInt(source.size)+64n*1024n*1024n)throw new FileError('DISK','This copy needs the PDF’s size plus 64 MiB of free disk headroom. Choose another destination or free space.');}check();const stage=await stageStreamOutput(parent,input,{check,progress:validation?.progress});const published=await publishOutput(stage,resolved);return {name:path.basename(resolved),location:resolved,size:published.size,sha256:published.sha256,...(published.cleanupWarning?{cleanupWarning:published.cleanupWarning}:{}),scope:'Exact original-snapshot byte copy; PDF artwork, encryption and signatures are not rewritten.'};}
      catch(error){if(error instanceof FileError)throw error;throw new FileError(error.code||'WRITE',error.message||'The disk-backed PDF copy could not be saved.');}
    }
    const bytes = output === undefined ? source?.bytes : Buffer.from(output);
    if(exportExt==='xfdf'&&(!expectedHash||bytes.length>8*1024*1024))throw new FileError('VERIFY','XFDF requires a sealed native export under 8 MB.');
    if(exportExt==='eml'){if(!expectedHash||!bytes?.length||bytes.length>1024*1024||!bytes.subarray(0,2048).toString('ascii').split('\r\n\r\n')[0].split('\r\n').includes('X-Unsent: 1'))throw new FileError('VERIFY','Email drafts require a sealed bounded native export.');}
    else if(exportExt==='fdf'){if(!expectedHash||!bytes?.length||bytes.length>8*1024*1024||!bytes.subarray(0,8).equals(Buffer.from('%FDF-1.2')))throw new FileError('VERIFY','FDF requires a sealed native FDF 1.2 export under 8 MB.');}
    else validateFile(exportExt==='xfdf'?path.basename(resolved)+'.xml':path.basename(resolved), bytes);
    if(expectedHash!==undefined&&(!/^[a-f0-9]{64}$/.test(expectedHash)||createHash('sha256').update(bytes).digest('hex')!==expectedHash))throw new FileError('VERIFY','The verified output bytes changed. Rebuild the preview before saving.');
    const check=()=>{this.checkGeneration(generation);if(source&&this.handles.get(id)!==source)throw new FileError('CHANGED','The source session changed before publishing the copy.');if(validation?.signal?.aborted)throw new FileError('CANCELED','Copying canceled. No completed copy was published.');};
    let pdfStructure;
    const outputHash=createHash('sha256').update(bytes).digest('hex'),passwordProof=validation?.provider==='password-engine'&&validation.sha256===outputHash&&expectedHash===outputHash;
    const restrictionProof=validation?.provider==='restricted-edit'&&validation.sourceSha256===source?.fingerprint&&validation.sha256===outputHash&&expectedHash===outputHash;
    if(source?.restrictedEncryption&&(exportExt||source.ext)==='pdf'&&output!==undefined&&outputHash!==source.fingerprint&&!passwordProof&&!restrictionProof)throw new FileError('PERMISSION','Use the checked protected-copy save so encryption and permissions are kept. No copy was saved.');
    if((exportExt||source?.ext)==='pdf'&&output!==undefined&&outputHash!==source?.fingerprint&&!passwordProof){if(typeof this.verifyUnsealedPdf!=='function')throw new FileError('VERIFY','Independent PDF checking is unavailable. Use the built Windows app before saving this generated copy.');check();try{pdfStructure=await this.verifyUnsealedPdf({id,bytes,sha256:createHash('sha256').update(bytes).digest('hex')});}catch(error){throw new FileError('PDF_VERIFY','The generated PDF did not pass independent structural checking. No copy was published. '+error.message);}check();}
    try{const stage=await stageOutput(parent,bytes,{expectedHash,check});const published=await publishOutput(stage,resolved);return {name:path.basename(resolved),location:resolved,size:published.size,sha256:published.sha256,...(pdfStructure?{pdfStructure}:{}),...(published.cleanupWarning?{cleanupWarning:published.cleanupWarning}:{})};}
    catch(error){if(error instanceof FileError)throw error;throw new FileError(error.code||'WRITE',error.message||'The copy could not be saved. Choose another folder.');}
  }
  // Save in place: the editor's own formats only, never PDFs. The file must still hold the bytes it was opened with;
  // those bytes are kept as a backup in the app's data folder (the last five per file) before the file is replaced.
  saveInPlace(id,output){const generation=this.generation;return this.trackOutput(()=>this.saveInPlaceJob(id,output,generation));}
  async saveInPlaceJob(id,output,generation){
    this.checkGeneration(generation);const source=this.source(id);
    if(source.fileBacked||!IN_PLACE_FORMATS.includes(source.ext))throw new FileError('FORMAT','Saving over the original is available for DOCX, RTF and text documents. Save a copy instead.');
    if(!(output instanceof Uint8Array)||!output.length||output.length>MAX_BYTES)throw new FileError('OUTPUT','The document to save is empty or too large.');
    const bytes=Buffer.from(output);validateFile(source.name,bytes);
    let current;try{current=await fs.readFile(source.path);}catch(error){/* A program holding the file without sharing it (not just a missing file) gets the locked message. */if(['EBUSY','EPERM','EACCES'].includes(error.code))throw new FileError('LOCKED','The file is open or locked in another program. Close it there, or save a copy.');throw new FileError('MISSING','This file is no longer where it was opened from. Save a copy instead.');}
    if(createHash('sha256').update(current).digest('hex')!==source.fingerprint)throw new FileError('CHANGED','This file was changed by another program since it was opened. Save a copy instead, or reopen it.');
    const check=()=>{this.checkGeneration(generation);if(this.handles.get(id)!==source)throw new FileError('CHANGED','The document session changed before saving.');};
    const backup=await this.keepBackup(source,current);check();
    let stage;try{stage=await stageOutput(path.dirname(source.path),bytes,{check});}catch(error){throw new FileError(error.code||'WRITE',error.message||'The file could not be saved. Save a copy instead.');}
    let saved;try{saved=await replaceOutput(stage,source.path,source.fingerprint);}catch(error){throw new FileError(error.code||'WRITE',error.message||'The file could not be saved. Save a copy instead.');}
    this.handles.set(id,{...source,bytes,fingerprint:saved.sha256});
    return {name:source.name,location:source.path,size:saved.size,sha256:saved.sha256,backup};
  }
  backupFolder(source){return path.join(this.directory,'backups',createHash('sha256').update(canonical(source.path)).digest('hex').slice(0,24));}
  // Backups of an opened file, newest first. Names are generated by keepBackup, so anything else in the folder is ignored.
  async listBackups(id){const source=this.source(id),folder=this.backupFolder(source);let names=[];try{names=await fs.readdir(folder);}catch{return [];}
    const backups=[];for(const name of names){if(!BACKUP_NAME.test(name)||extension(name)!==source.ext)continue;const stat=await fs.stat(path.join(folder,name)).catch(()=>null);if(stat?.isFile())backups.push({name,size:stat.size,savedAt:stat.mtimeMs});}
    return backups.sort((a,b)=>b.name.localeCompare(a.name));}
  async readBackup(id,name){const source=this.source(id);if(typeof name!=='string'||!BACKUP_NAME.test(name)||extension(name)!==source.ext)throw new FileError('MISSING','Choose a listed backup.');try{return await fs.readFile(path.join(this.backupFolder(source),name));}catch{throw new FileError('MISSING','That backup is no longer available.');}}
  async keepBackup(source,bytes){
    const folder=this.backupFolder(source);await fs.mkdir(folder,{recursive:true});
    const name=new Date().toISOString().replace(/[:.]/g,'-')+'.'+source.ext,location=path.join(folder,name);await fs.writeFile(location,bytes,{flag:'wx',mode:0o600});
    const older=(await fs.readdir(folder)).filter(item=>item!==name).sort();for(const item of older.slice(0,Math.max(0,older.length-4)))await fs.unlink(path.join(folder,item)).catch(()=>{});
    return location;
  }
  saveSplit(id,directory,name,parts){const generation=this.generation;return this.trackOutput(async()=>{this.checkGeneration(generation);const source=this.source(id);if(source.ext!=='pdf')throw new FileError('FORMAT','Split saving needs an opened PDF.');if(source.fileBacked)source.bytes;const check=()=>{this.checkGeneration(generation);if(this.handles.get(id)!==source)throw new FileError('CHANGED','The source session changed before publishing split copies.');};try{return await writeSplit(directory,name,parts,{check,sourceSha256:source.fingerprint});}catch(error){throw new FileError(error.code||'WRITE',error.message);}});}
  // Each unsaved new document has its own key "new:<uuid>"; no id is the single shared draft kept from before that.
  draftIdentity(id){
    if(typeof id==='string'&&id.startsWith('new:')){if(!NEW_DOCUMENT_KEY.test(id))throw new FileError('DRAFT','Unknown new document.');return {key:createHash('sha256').update('new-document:'+id.slice(4)).digest('hex'),fingerprint:'new-document'};}
    const source=id?this.source(id):null;
    return {key:createHash('sha256').update(source?canonical(source.path):'new-document').digest('hex'),fingerprint:source?source.fingerprint:'new-document'};
  }
  contentIdentity(id){const source=this.source(id);if(source.ext!=='pdf')throw new FileError('FORMAT','Content recovery needs an opened PDF.');return {key:createHash('sha256').update(canonical(source.path)+'\0pdf-content').digest('hex'),fingerprint:source.fingerprint};}
  loadContent(id){return this.recovery.load(this.contentIdentity(id));}
  saveContent(id,draft){if(draft?.kind!=='pdf-content')throw new FileError('DRAFT','Use PDF content recovery for these additions.');return this.recovery.save(this.contentIdentity(id),draft);}
  clearContent(id){return this.recovery.clearDraft(this.contentIdentity(id));}
  async loadDraft(id){
    const identity=this.draftIdentity(id),draft=await this.recovery.load(identity);if(draft||identity.fingerprint==='new-document')return draft;
    // Unsaved work from before PDFix closed, made on an earlier state of this file: kept in Version history, never applied.
    const kept=await this.recovery.keepStale(identity,'Unsaved work from before PDFix closed');
    if(kept&&(kept.kind==='rich'||kept.kind==='source'))throw new FileError('STALE_DRAFT','Unsaved work from before PDFix closed was not added, because this file was changed since then (for example by a sync or another program). It is kept in Version history as "Unsaved work from before PDFix closed", where you can look at it or restore it.');
    return null;
  }
  async saveDraft(id,draft){if(draft?.kind==='presentation'&&this.source(id).ext!=='pptx'||draft?.kind==='workbook'&&this.source(id).ext!=='xlsx'||!['rich','source','workbook','presentation'].includes(draft?.kind))throw new FileError('DRAFT','Use the document editor for this recovery kind.');const saved=await this.recovery.save(this.draftIdentity(id),draft);if(typeof id==='string'&&id.startsWith('new:'))await this.noteNewDocument(id,true).catch(()=>{});return saved;}
  redactionIdentity(id){const source=this.source(id);if(source.ext!=='pdf')throw new FileError('FORMAT','Redaction recovery needs an opened PDF.');return {key:createHash('sha256').update(canonical(source.path)+'\0redaction').digest('hex'),fingerprint:source.fingerprint};}
  loadRedaction(id){return this.recovery.load(this.redactionIdentity(id));}
  // Signing request work in progress: locations and email details, bound to this exact PDF like redaction plans.
  signatureRequestIdentity(id){const source=this.source(id);if(source.ext!=='pdf')throw new FileError('FORMAT','Signing request recovery needs an opened PDF.');return {key:createHash('sha256').update(canonical(source.path)+'\0signature-request').digest('hex'),fingerprint:source.fingerprint};}
  loadSignatureRequest(id){return this.recovery.load(this.signatureRequestIdentity(id));}
  async saveSignatureRequestDraft(id,draft){if(draft?.kind!=='signature-request')throw new FileError('DRAFT','Use signing request recovery for these locations.');return this.recovery.save(this.signatureRequestIdentity(id),draft);}
  clearSignatureRequestDraft(id){return this.recovery.clearDraft(this.signatureRequestIdentity(id));}
  async saveRedaction(id,draft){if(draft?.kind!=='redaction')throw new FileError('DRAFT','Use redaction recovery for these regions.');return this.recovery.save(this.redactionIdentity(id),draft);}
  clearRedaction(id){return this.recovery.clearDraft(this.redactionIdentity(id));}
  markupIdentity(id){const source=this.source(id);if(source.ext!=='pdf')throw new FileError('FORMAT','Markup recovery needs an opened PDF.');return {key:createHash('sha256').update(canonical(source.path)+'\0markup').digest('hex'),fingerprint:source.fingerprint};}
  // Home list (H1): recent files that still have unsaved work kept for recovery, newest first. Reads only file
  // names and dates; the work itself is checked against the file when it is opened (a changed file keeps it in history).
  async recoverableRecents(limit=20){const kinds=[['','document'],['\0pdf-content','additions'],['\0markup','marks'],['\0form','form'],['\0redaction','redaction'],['\0signature-request','signing request'],['\0image','image']],found=[];
    for(const entry of this.recents.slice(0,100)){const work=[];let savedAt=0;for(const [suffix,kind] of kinds){const key=createHash('sha256').update(canonical(entry.path)+suffix).digest('hex');try{const stat=await fs.stat(this.recovery.file('draft',{key}));if(stat.isFile()&&stat.size>0){work.push(kind);savedAt=Math.max(savedAt,stat.mtimeMs);}}catch{}}
      if(work.length)found.push({id:entry.id,name:entry.name,ext:entry.ext,kinds:work,savedAt:new Date(savedAt).toISOString()});}
    return found.sort((x,y)=>y.savedAt.localeCompare(x.savedAt)).slice(0,Math.max(1,Math.min(50,limit|0||20)));}
  async loadMarkup(id){return this.recovery.load(this.markupIdentity(id));}
  async saveMarkup(id,draft){if(draft?.kind!=='markup')throw new FileError('DRAFT','Use markup recovery for PDF marks.');return this.recovery.save(this.markupIdentity(id),draft);}
  imageIdentity(id){const source=this.source(id);if(!['png','jpg','jpeg','webp','bmp'].includes(source.ext))throw new FileError('FORMAT','Image recovery needs an opened image.');return {key:createHash('sha256').update(canonical(source.path)+'\0image').digest('hex'),fingerprint:source.fingerprint};}
  loadImage(id){return this.recovery.load(this.imageIdentity(id));}
  async saveImage(id,draft){if(draft?.kind!=='image')throw new FileError('DRAFT','Use image recovery for these settings.');return this.recovery.save(this.imageIdentity(id),draft);}
  clearImage(id){return this.recovery.clearDraft(this.imageIdentity(id));}
  formIdentity(id){const source=this.source(id);if(source.ext!=='pdf')throw new FileError('FORMAT','Form recovery needs an opened PDF.');return {key:createHash('sha256').update(canonical(source.path)+'\0form').digest('hex'),fingerprint:source.fingerprint};}
  loadForm(id){return this.recovery.load(this.formIdentity(id));}
  async saveForm(id,draft){if(draft?.kind!=='form')throw new FileError('DRAFT','Use form recovery for these edits.');return this.recovery.save(this.formIdentity(id),draft);}
  clearForm(id){return this.recovery.clearDraft(this.formIdentity(id));}
  async clearMarkup(id){return this.recovery.clearDraft(this.markupIdentity(id));}
  async clearDraft(id){const result=await this.recovery.clearDraft(this.draftIdentity(id));if(typeof id==='string'&&id.startsWith('new:'))await this.noteNewDocument(id,false).catch(()=>{});return result;}
  // Only unsaved new documents (or the shared draft from before keys) can be discarded with their versions.
  async discardNewDocument(id){if(id!==null&&!(typeof id==='string'&&id.startsWith('new:')))throw new FileError('DRAFT','Only an unsaved new document can be discarded.');const result=await this.recovery.discard(this.draftIdentity(id));if(id)await this.noteNewDocument(id,false).catch(()=>{});return result;}
  // Unsaved new documents are also listed here, on disk and replaced atomically with each draft, because the window's own
  // list (browser storage) is written to disk only now and then and is lost when PDFix is ended suddenly.
  newDocumentIndex(){return path.join(this.directory,'new-documents.json');}
  async readNewDocuments(){try{const value=JSON.parse(await fs.readFile(this.newDocumentIndex(),'utf8'));return Array.isArray(value)?value.filter(entry=>entry&&NEW_DOCUMENT_KEY.test(entry.key)&&Number.isFinite(entry.updatedAt)).slice(0,50):[];}catch{return [];}}
  noteNewDocument(id,present){this.newDocumentWrites=(this.newDocumentWrites??Promise.resolve()).catch(()=>{}).then(async()=>{const list=(await this.readNewDocuments()).filter(entry=>entry.key!==id);if(present)list.unshift({key:id,updatedAt:Date.now()});const temp=this.newDocumentIndex()+'.'+process.pid+'.tmp';await fs.writeFile(temp,JSON.stringify(list.slice(0,50)),{mode:0o600});await renameWithRetry(temp,this.newDocumentIndex());});return this.newDocumentWrites;}
  async listNewDocuments(){const found=[];for(const entry of await this.readNewDocuments()){if(await this.recovery.load(this.draftIdentity(entry.key)).catch(()=>null))found.push(entry);}return found;}
  async checkpoint(id,draft,label){return this.recovery.checkpoint(this.draftIdentity(id),draft,label);}
  async versions(id){return this.recovery.list(this.draftIdentity(id));}
  // One newest-first list for the History screen (X15): edit versions, versions from before the file changed
  // elsewhere (read-only) and saved-file backups, each labelled with what it is.
  async documentHistory(id){const at=value=>new Date(value).toISOString();const [versions,earlier,backups]=await Promise.all([this.versions(id).catch(()=>[]),this.earlierVersions(id).catch(()=>[]),this.listBackups(id).catch(()=>[])]);
    return [...versions.map(v=>({type:'version',id:v.id,at:v.createdAt,label:v.label,size:v.size})),...earlier.map(v=>({type:'earlier',id:v.id,at:v.createdAt,label:v.label,size:v.size,readOnly:true})),...backups.map(b=>({type:'backup',name:b.name,at:at(b.savedAt),label:'Saved file',size:b.size}))].sort((a,b)=>b.at.localeCompare(a.at));}
  async earlierVersions(id){return this.recovery.listEarlier(this.draftIdentity(id));}
  async loadEarlierVersion(id,versionId){return this.recovery.getEarlier(this.draftIdentity(id),versionId);}
  async loadVersion(id,versionId){return this.recovery.get(this.draftIdentity(id),versionId);}
  async restoreVersion(id,versionId,current){return this.recovery.restore(this.draftIdentity(id),versionId,current);}
  recoveryInfo(){return this.recovery.info();}
  clearRecovery(){return this.recovery.clearAll();}
  async clearRecents(){await this.updateRecents(()=>[]);return this.list();}
}
module.exports = { FileStore, FileError, validateFile, MAX_BYTES };
