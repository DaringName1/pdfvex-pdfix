const fs = require('node:fs/promises');
const path = require('node:path');
const {MAX_READING_PDF_BYTES,readingMemoryRequired,getReadingCapacity}=require('./reading-capacity.cjs');
const { randomUUID, createHash } = require('node:crypto');

const MAX_PDF_BYTES = MAX_READING_PDF_BYTES;
const PDF_CHUNK_SIZE = 256 * 1024;
const MAX_RANGE_BYTES = 1024 * 1024;
const OWNER_FILE = 'snapshot-owner.json';
const OWNER_NAME = 'pdfix-large-pdf-snapshot';
const OWNER_LIMIT = 16 * 1024;
const SNAPSHOT_TIMEOUT = 30 * 60 * 1000;
const UUID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const PDF_LEAF_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.pdf$/;

function sameFile(left, right) {
  return left.isFile() && right.isFile() &&
    ['size', 'dev', 'ino', 'mtimeMs', 'ctimeMs'].every(key => left[key] === right[key]);
}

// Windows/cloud storage can update change-time after ACL or other metadata
// changes. The immutable owner marker is still checked for exact schema/content
// and stable identity while reading; change-time alone does not change ownership.
function sameOwnerFile(left, right) {
  return left.isFile() && right.isFile() &&
    ['size', 'dev', 'ino', 'mtimeMs'].every(key => left[key] === right[key]);
}

// Snapshot paths and descriptors stay private to this store. The renderer receives
// only an opaque FileStore session ID and bounded range metadata.
class LargePdfStore {
  constructor(directory, ErrorClass) {
    this.directory = directory;
    this.ErrorClass = ErrorClass;
    this.root = null;
    this.rootStat = null;
    this.owner = null;
    this.ownerStat = null;
    this.snapshots = new WeakMap();
    this.sources = new Set();
    this.pendingFiles = new Map();
  }
  error(code, message) { return new this.ErrorClass(code, message); }
  async readOwner(root) {
    const marker = path.join(root, OWNER_FILE), before = await fs.lstat(marker);
    if (!before.isFile() || before.isSymbolicLink() || before.size <= 0 || before.size > OWNER_LIMIT) return null;
    const handle = await fs.open(marker, 'r');
    try {
      if (!sameFile(before, await handle.stat())) return null;
      const bytes = Buffer.alloc(before.size + 1);
      let length = 0;
      while (length < bytes.length) {
        const read = await handle.read(bytes, length, bytes.length - length, length);
        if (!read.bytesRead) break;
        length += read.bytesRead;
      }
      if (length !== before.size || !sameFile(before, await handle.stat()) || !sameFile(before, await fs.lstat(marker))) return null;
      const owner = JSON.parse(bytes.subarray(0, length).toString('utf8'));
      if (!owner || Object.keys(owner).sort().join(',') !== 'id,owner,root,version' || owner.owner !== OWNER_NAME || owner.version !== 1 || typeof owner.id !== 'string' || !UUID_PATTERN.test(owner.id) || owner.root !== path.basename(root) || !/^large-pdf-[A-Za-z0-9]{6}$/.test(owner.root)) return null;
      return { owner, stat: before };
    } finally { await handle.close(); }
  }
  async checkRoot(root, identity) {
    const current = await fs.lstat(root);
    if (!current.isDirectory() || current.isSymbolicLink() || current.dev !== identity.dev || current.ino !== identity.ino) throw this.error('PDF_SNAPSHOT_CLEANUP', 'The temporary PDF reading folder changed. Its contents were left untouched.');
  }
  async init() {
    let warning = null;
    let entries;
    try { entries = await fs.readdir(this.directory, { withFileTypes: true }); }
    catch { return 'Temporary PDF reading snapshots could not be checked for cleanup. Your original documents and recent-file history are unaffected.'; }
    for (const entry of entries) {
      if (!entry.isDirectory() || !/^large-pdf-[A-Za-z0-9]{6}$/.test(entry.name)) continue;
      const root = path.join(this.directory, entry.name);
      if (root === this.root) continue;
      let known = false, markerSeen = false;
      try {
        const identity = await fs.lstat(root);
        if (!identity.isDirectory() || identity.isSymbolicLink()) continue;
        const markerLeaf = await fs.lstat(path.join(root, OWNER_FILE));
        markerSeen = true;
        if (!markerLeaf.isFile() || markerLeaf.isSymbolicLink()) continue;
        const marker = await this.readOwner(root);
        if (!marker) {
          warning = 'A temporary PDF reading folder had an incomplete or unrecognized ownership marker and was left untouched. Your original documents and recent-file history are unaffected.';
          continue;
        }
        const leaves = await fs.readdir(root);
        if (leaves.length > 129 || leaves.some(name => name !== OWNER_FILE && !PDF_LEAF_PATTERN.test(name))) continue;
        const files = [];
        let valid = true;
        for (const name of leaves) {
          if (name === OWNER_FILE) continue;
          const stat = await fs.lstat(path.join(root, name));
          if (!stat.isFile() || stat.isSymbolicLink()) { valid = false; break; }
          files.push({ name, stat });
        }
        if (!valid) continue;
        known = true;
        for (const file of files) {
          await this.checkRoot(root, identity);
          const current = await this.readOwner(root);
          if (!current || !sameOwnerFile(marker.stat, current.stat) || current.owner.id !== marker.owner.id) throw this.error('PDF_SNAPSHOT_CLEANUP', 'The temporary PDF reading folder changed during cleanup.');
          const target = path.join(root, file.name), stat = await fs.lstat(target);
          if (!stat.isFile() || stat.isSymbolicLink() || stat.dev !== file.stat.dev || stat.ino !== file.stat.ino) throw this.error('PDF_SNAPSHOT_CLEANUP', 'A temporary PDF snapshot changed during cleanup.');
          await fs.rm(target, { force: true });
        }
        await this.checkRoot(root, identity);
        const current = await this.readOwner(root), remaining = await fs.readdir(root);
        if (!current || !sameOwnerFile(marker.stat, current.stat) || remaining.length !== 1 || remaining[0] !== OWNER_FILE) throw this.error('PDF_SNAPSHOT_CLEANUP', 'The temporary PDF reading folder changed during cleanup.');
        await fs.unlink(path.join(root, OWNER_FILE));
        await this.checkRoot(root, identity);
        await fs.rmdir(root);
      } catch (error) {
        if (known) warning = 'An app-owned temporary PDF reading snapshot could not be cleaned up. Check application-folder permissions or close other applications using it. Your original documents and recent-file history are unaffected.';
        else if (markerSeen) warning = 'A temporary PDF reading folder could not be verified for cleanup and was left untouched. Your original documents and recent-file history are unaffected.';
        // Unrecognized, incomplete, or inaccessible markers are never treated
        // as authorization to delete a directory or any of its contents.
      }
    }
    return warning;
  }
  async createRoot() {
    this.root = await fs.mkdtemp(path.join(this.directory, 'large-pdf-'));
    this.rootStat = await fs.lstat(this.root);
    this.owner = { owner: OWNER_NAME, version: 1, id: randomUUID(), root: path.basename(this.root), files: [] };
    const handle = await fs.open(path.join(this.root, OWNER_FILE), 'wx', 0o600);
    // The ownership marker is immutable: it is durable before any PDF leaf is
    // created. A crash can never tear a later marker update. Live UUID leaves
    // are tracked privately; startup derives their bounded list from this root.
    try { await handle.writeFile(JSON.stringify({ owner: this.owner.owner, version: 1, id: this.owner.id, root: this.owner.root })); await handle.sync(); this.ownerStat = await handle.stat(); }
    finally { await handle.close(); }
  }
  async trackOwnedFiles(files) {
    await this.checkRoot(this.root, this.rootStat);
    const marker = await this.readOwner(this.root);
    if (!marker || marker.owner.id !== this.owner.id || !sameOwnerFile(marker.stat, this.ownerStat)) throw this.error('PDF_SNAPSHOT_CLEANUP', 'The temporary PDF ownership marker changed. Reopen the PDF.');
    if (files.length > 128 || files.some(name => !PDF_LEAF_PATTERN.test(name)) || new Set(files).size !== files.length) throw this.error('PDF_SNAPSHOT_CLEANUP', 'Temporary PDF snapshot tracking is full. Close and reopen the application before opening more large PDFs.');
    this.owner = { ...this.owner, files };
  }
  async removeOwnedFile(target, identity) {
    await this.checkRoot(this.root, this.rootStat);
    const name = path.basename(target), marker = await this.readOwner(this.root);
    if (path.dirname(target) !== this.root || !PDF_LEAF_PATTERN.test(name) || !marker || marker.owner.id !== this.owner.id || !sameOwnerFile(marker.stat, this.ownerStat) || !this.owner.files.includes(name)) throw this.error('PDF_SNAPSHOT_CLEANUP', 'The temporary PDF ownership record changed. Its contents were left untouched.');
    let stat;
    try { stat = await fs.lstat(target); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (stat) {
      if (!stat.isFile() || stat.isSymbolicLink() || identity && (stat.dev !== identity.dev || stat.ino !== identity.ino)) throw this.error('PDF_SNAPSHOT_CLEANUP', 'The temporary PDF snapshot changed ownership. Its contents were left untouched.');
      await fs.rm(target, { force: true });
    }
    await this.trackOwnedFiles(this.owner.files.filter(file => file !== name));
  }
  async create(input, initial, metadata, checkActive = () => {}, progress = () => {}) {
    if (!initial.isFile() || !Number.isSafeInteger(initial.size) || initial.size <= 0) {
      throw this.error('TOO_LARGE', 'This PDF has an unsupported file length for disk-backed reading.');
    }
    let output, snapshotPath, registered = false, created = false;
    const deadline=Date.now()+SNAPSHOT_TIMEOUT;
    const active=()=>{checkActive();if(Date.now()>deadline)throw this.error('PDF_STAGING_BUDGET','Preparing the disk-backed PDF exceeded 30 minutes. No partial document was opened. Try copying the source to a faster local drive.');};
    try {
      active();
      // PDF.js reserves a full-length byte array even with range loading. This is
      // a conservative admission estimate, not a prediction of total viewer RAM.
      const capacity = getReadingCapacity({pdfBytes: initial.size}), availableMemory = capacity.availableMiB * 1024 * 1024, neededMemory = readingMemoryRequired(initial.size);
      // A small page working set avoids allocating PDF.js's full-source buffer.
      // Native parsing is separately contained; a difficult single page can
      // still exceed that process budget and returns a specific failure.
      // Avoid oscillating into full-source buffering when free RAM only barely
      // clears admission. Large files on a conservative profile use page working
      // sets before the hard memory blocker is reached.
      const pagedFile = initial.size > MAX_PDF_BYTES || availableMemory < neededMemory ||
        initial.size > 100 * 1024 * 1024 && capacity.conservativeReading;
      if (!sameFile(initial, await input.stat())) throw this.error('CHANGED', 'The PDF changed while opening. Close the other editor and try again.');
      if (!this.root) await this.createRoot();
      if (typeof fs.statfs === 'function') {
        try {
          const volume = await fs.statfs(this.root, { bigint: true });
          const availableDisk = volume.bavail * volume.bsize, neededDisk = BigInt(initial.size) * BigInt(pagedFile?2:1) + BigInt(64 * 1024 * 1024);
          if (availableDisk < neededDisk) throw this.error('PDF_DISK_BUDGET', `PDF opening needs ${Math.ceil(Number(neededDisk) / 1024 / 1024)} MiB of free temporary disk space${pagedFile?' for the source snapshot and isolated parser copy':''}, including headroom; ${Math.floor(Number(availableDisk) / 1024 / 1024)} MiB is available. Free disk space and try again.`);
        } catch (error) {
          // Some platforms do not expose filesystem free-space statistics.
          if (!['ENOSYS', 'ENOTSUP', 'EOPNOTSUPP'].includes(error.code)) throw error;
        }
      }
      snapshotPath = path.join(this.root, `${randomUUID()}.pdf`);
      await this.trackOwnedFiles([...this.owner.files, path.basename(snapshotPath)]);
      registered = true;
      output = await fs.open(snapshotPath, 'wx+', 0o600);
      created = true;
      this.pendingFiles.set(snapshotPath, null);
      this.pendingFiles.set(snapshotPath, await output.stat());
      const buffer = Buffer.alloc(PDF_CHUNK_SIZE), hash = createHash('sha256');
      let position = 0, lastProgress = Date.now();
      while (position < initial.size) {
        active();
        const length = Math.min(buffer.length, initial.size - position);
        let readLength = 0;
        while (readLength < length) {
          active();
          const read = await input.read(buffer, readLength, length - readLength, position + readLength);
          if (!read.bytesRead) throw this.error('CHANGED', 'The PDF changed while opening. Close the other editor and try again.');
          readLength += read.bytesRead;
        }
        if (position === 0 && !buffer.subarray(0, Math.min(1024, length)).toString('latin1').includes('%PDF-')) {
          throw this.error('DAMAGED', 'The contents do not match a PDF file. It may be damaged or have the wrong file ending. Try getting a new copy.');
        }
        hash.update(buffer.subarray(0, length));
        let written = 0;
        while (written < length) {
          active();
          const result = await output.write(buffer, written, length - written, position + written);
          if (!result.bytesWritten) throw this.error('READ', 'The PDF reading snapshot could not be created. Check available disk space.');
          written += result.bytesWritten;
        }
        position += length;
        if (Date.now() - lastProgress >= 500) {
          try { progress({ stage: 'progress', bytes: position, total: initial.size }); } catch {}
          lastProgress = Date.now();
        }
      }
      const extra = await input.read(buffer, 0, 1, initial.size);
      active();
      if (extra.bytesRead || !sameFile(initial, await input.stat())) throw this.error('CHANGED', 'The PDF changed while opening. Close the other editor and try again.');
      await output.sync();
      active();
      const writtenStat = await output.stat();
      if (!writtenStat.isFile() || writtenStat.size !== initial.size) throw this.error('READ', 'The PDF reading snapshot could not be completed. Check available disk space.');
      await output.close();
      output = null;
      await fs.chmod(snapshotPath, 0o400);
      output = await fs.open(snapshotPath, 'r');
      const snapshotStat = await output.stat();
      if (snapshotStat.size !== writtenStat.size || snapshotStat.dev !== writtenStat.dev || snapshotStat.ino !== writtenStat.ino || !snapshotStat.isFile()) {
        throw this.error('CHANGED', 'The PDF reading snapshot changed. Reopen the PDF.');
      }
      const source = { ...metadata, size: initial.size, fileBacked: true, pagedFile, fingerprint: hash.digest('hex') };
      Object.defineProperty(source, 'bytes', {
        get: () => { throw this.error('LARGE_PDF_OPERATION', 'This large PDF is available for reading. Editing, conversion, export, and saving copies have a 100 MiB per-operation limit; open a PDF under that limit for these operations.'); }
      });
      this.snapshots.set(source, { handle: output, path: snapshotPath, stat: snapshotStat, staging: new Set(), releasing: false, releasePromise: null });
      this.sources.add(source);
      this.pendingFiles.delete(snapshotPath);
      output = null;
      return source;
    } catch (error) {
      if (output) await output.close().catch(() => {});
      let cleanupFailed = false;
      if (registered) {
        try {
          // An exclusive-create failure never authorizes deleting an existing
          // file, even if its leaf happens to match the randomly chosen UUID.
          if (created) await this.removeOwnedFile(snapshotPath, this.pendingFiles.get(snapshotPath));
          else await this.trackOwnedFiles(this.owner.files.filter(file => file !== path.basename(snapshotPath)));
          this.pendingFiles.delete(snapshotPath);
        }
        catch { cleanupFailed = true; }
      }
      await this.removeEmptyRoot();
      if (cleanupFailed) throw this.error('PDF_SNAPSHOT_CLEANUP', 'Opening failed and the temporary PDF reading snapshot could not be removed. Check application-folder permissions and close the application to retry cleanup.');
      if (error instanceof this.ErrorClass) throw error;
      if(error.code==='ENOSPC'||error.code==='EDQUOT')throw this.error('PDF_DISK_BUDGET','Temporary disk space ran out while opening this PDF. Free space in the PDFix application-data drive and try again. The original PDF was not changed.');
      throw this.error('READ', 'The PDF reading snapshot could not be created. Check application-folder permissions and available disk space.');
    }
  }
  async read(source, begin, end) {
    const snapshot = this.snapshots.get(source);
    if (!snapshot || !this.sources.has(source)) throw this.error('MISSING', 'The PDF session ended. Reopen the PDF before reading more pages.');
    if (!Number.isSafeInteger(begin) || !Number.isSafeInteger(end) || begin < 0 || end <= begin || end > source.size || end - begin > MAX_RANGE_BYTES) {
      throw this.error('RANGE', 'Choose a valid PDF byte range of at most 1 MiB.');
    }
    try {
      await this.checkSnapshot(snapshot);
      const bytes = Buffer.alloc(end - begin);
      let readLength = 0;
      while (readLength < bytes.length) {
        const result = await snapshot.handle.read(bytes, readLength, bytes.length - readLength, begin + readLength);
        if (!result.bytesRead) throw this.error('CHANGED', 'The PDF reading snapshot changed. Reopen the PDF.');
        readLength += result.bytesRead;
      }
      await this.checkSnapshot(snapshot);
      return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.length);
    } catch (error) {
      // Expire a mutated or unavailable snapshot instead of serving it again.
      await this.release(source).catch(() => {});
      if (error instanceof this.ErrorClass) throw error;
      throw this.error('CHANGED', 'The PDF reading snapshot is unavailable or changed. Reopen the PDF.');
    }
  }
  async checkSnapshot(snapshot) {
    if (!sameFile(snapshot.stat, await snapshot.handle.stat()) || !sameFile(snapshot.stat, await fs.lstat(snapshot.path))) {
      throw this.error('CHANGED', 'The PDF reading snapshot changed. Reopen the PDF.');
    }
  }
  // This capability is main-process-only. Neither its methods nor the private
  // snapshot path/descriptor are part of the renderer's opened-file metadata.
  reviewInput(source, checkActive = () => {}) {
    return this.snapshotInput(source, checkActive);
  }
  pagedInput(source, checkActive = () => {}) {
    return this.snapshotInput(source, checkActive, { leaf: 'input.pdf', timeout: 1800000 });
  }
  snapshotInput(source, checkActive = () => {}, { leaf = 'input.bin', timeout = 120000 } = {}) {
    const snapshot = this.snapshots.get(source), length = source.size, sha256 = source.fingerprint;
    if (!snapshot || !this.sources.has(source) || snapshot.releasing) throw this.error('MISSING', 'The PDF session ended. Reopen the PDF before inspecting its comments.');
    const check = () => {
      checkActive();
      if (snapshot.releasing || !this.sources.has(source) || this.snapshots.get(source) !== snapshot) throw this.error('MISSING', 'The PDF session ended. No comment inventory was released.');
    };
    const validate = async () => { check(); await this.checkSnapshot(snapshot); check(); };
    return Object.freeze({ length, sha256, validate, stage: async (target, { signal } = {}) => {
      check();
      if (snapshot.staging.size) throw this.error('BUSY', 'This PDF snapshot is already being staged for a comment inventory.');
      if (typeof target !== 'string' || !path.isAbsolute(target) || path.basename(target) !== leaf) throw this.error('PATH', 'PDF processing requires an app-owned isolated input slot.');
      let finish;
      const lease = new Promise(resolve => { finish = resolve; });
      snapshot.staging.add(lease);
      const deadline = Date.now() + timeout;
      const active = () => {
        check();
        if (signal?.aborted) throw this.error('CANCELED', 'Comment inventory staging was canceled. No inventory was released.');
        if (Date.now() > deadline) throw this.error('PDF_REVIEW_BUDGET', 'Preparing this PDF exceeded the bounded staging time. No partial document was returned.');
      };
      let output, created = false;
      const buffer = Buffer.alloc(PDF_CHUNK_SIZE), hash = createHash('sha256');
      try {
        active(); await validate();
        // Reject links/junctions throughout the destination ancestry before the
        // exclusive create. Containment owns this new job folder and its cleanup.
        let parent = path.dirname(target);
        while (true) {
          const stat = await fs.lstat(parent);
          if (!stat.isDirectory() || stat.isSymbolicLink()) throw this.error('PATH', 'Comment inventory staging contains an unsupported path.');
          const next = path.dirname(parent); if (next === parent) break; parent = next;
        }
        if (typeof fs.statfs === 'function') {
          try {
            const volume = await fs.statfs(path.dirname(target), { bigint: true });
            if (volume.bavail * volume.bsize < BigInt(length) + BigInt(64 * 1024 * 1024)) throw this.error('PDF_DISK_BUDGET', 'PDF processing needs another temporary copy of this PDF plus 64 MiB of disk headroom. Free disk space and try again.');
          } catch (error) { if (!['ENOSYS', 'ENOTSUP', 'EOPNOTSUPP'].includes(error.code)) throw error; }
        }
        active(); output = await fs.open(target, 'wx', 0o600); created = true;
        let position = 0;
        while (position < length) {
          active();
          const count = Math.min(buffer.length, length - position);
          let read = 0;
          while (read < count) {
            active(); const result = await snapshot.handle.read(buffer, read, count - read, position + read);
            if (!result.bytesRead) throw this.error('CHANGED', 'The PDF reading snapshot changed. Reopen the PDF.');
            read += result.bytesRead;
          }
          hash.update(buffer.subarray(0, count));
          let written = 0;
          while (written < count) {
            active(); const result = await output.write(buffer, written, count - written, position + written);
            if (!result.bytesWritten) throw this.error('READ', 'The comment inventory input could not be staged. Check available disk space.');
            written += result.bytesWritten;
          }
          position += count;
        }
        active(); await validate();
        if (hash.digest('hex') !== sha256) throw this.error('CHANGED', 'The PDF reading snapshot no longer matches its opened fingerprint. Reopen the PDF.');
        await output.sync();
        const stat = await output.stat(), leaf = await fs.lstat(target);
        if (stat.size !== length || !sameFile(stat, leaf) || leaf.isSymbolicLink()) throw this.error('CHANGED', 'The isolated comment inventory input changed while staging.');
        active();
      } catch (error) {
        if (error instanceof this.ErrorClass) throw error;
        if(error.code==='ENOSPC'||error.code==='EDQUOT')throw this.error('PDF_DISK_BUDGET','Temporary disk space ran out while preparing the isolated PDF copy. Free space in the PDFix application-data drive and try again. The original PDF was not changed.');
        throw this.error('READ', created ? 'Comment inventory staging failed. No partial inventory was returned.' : 'The isolated comment inventory input could not be created.');
      } finally {
        buffer.fill(0);
        try { if (output) await output.close().catch(() => { throw this.error('READ', 'The isolated comment input could not be closed. No inventory was released.'); }); }
        finally { snapshot.staging.delete(lease); finish(); }
      }
    } });
  }
  release(source) {
    const snapshot = this.snapshots.get(source);
    if (!snapshot) return Promise.resolve(false);
    if (snapshot.releasePromise) return snapshot.releasePromise;
    snapshot.releasing = true;
    snapshot.releasePromise = this.releaseSnapshot(source, snapshot).catch(error => { snapshot.releasePromise = null; throw error; });
    return snapshot.releasePromise;
  }
  async releaseSnapshot(source, snapshot) {
    // A release invalidates capabilities immediately, then waits for each bounded
    // staging copy to finish before closing the retained FD or deleting its leaf.
    await Promise.all([...snapshot.staging]);
    await snapshot.handle.close().catch(() => {});
    try { await this.removeOwnedFile(snapshot.path, snapshot.stat); }
    catch (cause) { throw Object.assign(this.error('PDF_SNAPSHOT_CLEANUP', 'The temporary PDF reading snapshot could not be removed. Check application-folder permissions and close the application to retry cleanup.'),{cause}); }
    this.snapshots.delete(source);
    this.sources.delete(source);
    await this.removeEmptyRoot();
    return true;
  }
  async removeEmptyRoot() {
    if (this.root && !this.sources.size && !this.pendingFiles.size) {
      const root = this.root;
      try {
        if (this.ownerStat) {
          await this.checkRoot(root, this.rootStat);
          const marker = await this.readOwner(root), leaves = await fs.readdir(root);
          if (!marker || !sameOwnerFile(marker.stat, this.ownerStat) || marker.owner.id !== this.owner.id || this.owner.files.length || leaves.length !== 1 || leaves[0] !== OWNER_FILE) return;
          await fs.unlink(path.join(root, OWNER_FILE));
        }
        await this.checkRoot(root, this.rootStat);
        await fs.rmdir(root);
        this.root = null; this.rootStat = null; this.owner = null; this.ownerStat = null;
      }
      catch (error) { if (error.code === 'ENOENT') this.root = null; }
    }
  }
  async dispose() {
    let failure;
    for (const source of [...this.sources]) {
      try { await this.release(source); } catch (error) { failure = error; }
    }
    for (const [snapshotPath, identity] of [...this.pendingFiles]) {
      try { await this.removeOwnedFile(snapshotPath, identity); this.pendingFiles.delete(snapshotPath); }
      catch { failure = this.error('PDF_SNAPSHOT_CLEANUP', 'A temporary PDF reading snapshot could not be removed. Check application-folder permissions before retrying cleanup.'); }
    }
    await this.removeEmptyRoot();
    if (failure) throw failure;
  }
}

module.exports = { LargePdfStore, MAX_PDF_BYTES, PDF_CHUNK_SIZE, MAX_RANGE_BYTES };
