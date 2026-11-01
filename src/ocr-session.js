import { requireOcrLanguage } from './ocr-languages.js';

export class OcrSession {
  constructor(languageCode = 'eng', onProgress = () => {}) {
    this.language = requireOcrLanguage(languageCode);
    this.worker = new Worker(new URL('./ocr.worker.js', import.meta.url), { type: 'module' });
    this.onProgress = onProgress;
    this.sequence = 0;
    this.worker.onmessage = ({ data }) => {
      if (this.closed || data.sequence !== this.pending?.sequence) return;
      if (data.kind === 'progress') {
        this.onProgress(data.progress);
        return;
      }
      clearTimeout(this.timer);
      const pending = this.pending;
      this.pending = null;
      data.kind === 'result' ? pending.resolve(data.value) : pending.reject(new Error(data.message));
    };
    this.worker.onerror = () => {
      this.pending?.reject(new Error('Local OCR could not run. Reopen the file and try again.'));
      this.dispose();
    };
  }

  request(data) {
    if (this.closed) return Promise.reject(new Error('OCR was canceled. No copy was saved.'));
    if (this.pending) return Promise.reject(new Error('Wait for the current page to finish.'));
    const sequence = ++this.sequence;
    return new Promise((resolve, reject) => {
      this.pending = { resolve, reject, sequence };
      this.timer = setTimeout(() => {
        if (this.pending?.sequence !== sequence) return;
        this.pending.reject(new Error('OCR exceeded two minutes on this page. Try a smaller or clearer scan.'));
        this.dispose();
      }, 120000);
      this.worker.postMessage({ ...data, sequence, language: this.language.code });
    });
  }

  initialize() {
    return this.request({ action: 'initialize', assets: new URL('ocr-assets/', document.baseURI).href });
  }
  recognize(image) { return this.request({ action: 'recognize', image }); }
  recognizeTable(image) { return this.request({ action: 'recognize-table', image }); }

  dispose() {
    if (this.closed) return;
    this.closed = true;
    clearTimeout(this.timer);
    this.worker.terminate();
    this.pending?.reject(new Error('OCR was canceled. No copy was saved.'));
    this.pending = null;
  }
}
