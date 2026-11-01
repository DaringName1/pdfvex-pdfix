import { createWorker, PSM } from 'tesseract.js';
import { getOcrLanguage } from './ocr-languages.js';

let engine;
let engineLanguage;
self.onmessage = async ({ data }) => {
  const { sequence, language: languageCode } = data;
  try {
    const language = getOcrLanguage(languageCode);
    if (!language) throw new Error('The requested OCR language is not bundled.');
    if (data.action === 'initialize') {
      if (engine) await engine.terminate();
      engine = await createWorker(language.code, 1, {
        workerPath: data.assets + 'worker.min.js',
        corePath: data.assets + 'core',
        langPath: data.assets,
        workerBlobURL: false,
        cacheMethod: 'none',
        gzip: true,
        logger: progress => self.postMessage({ kind: 'progress', sequence, progress }),
        errorHandler: () => {},
      });
      engineLanguage = language.code;
      await engine.setParameters({ user_defined_dpi: '144', tessedit_pageseg_mode: PSM.AUTO });
      self.postMessage({ kind: 'result', sequence, value: { language: language.code } });
    } else if ((data.action === 'recognize' || data.action === 'recognize-table') && engine && engineLanguage === language.code) {
      const { data: result } = await engine.recognize(data.image, {}, { text: true, blocks: true });
      const lines = (result.blocks || []).flatMap(block => block.paragraphs.flatMap(paragraph => paragraph.lines))
        .map(line => ({ text: line.text.trim(), bbox: line.bbox, confidence: line.confidence }))
        .filter(line => line.text);
      if (lines.length > 5000 || lines.reduce((total, line) => total + line.text.length, 0) > 100000) {
        throw new Error('Recognized text exceeds the per-page limit. Use a smaller scan.');
      }
      let words;
      if (data.action === 'recognize-table') {
        words = (result.blocks || []).flatMap(block => block.paragraphs.flatMap(paragraph => paragraph.lines.flatMap(line => line.words || [])))
          .map(word => ({ text: String(word.text ?? '').trim(), bbox: word.bbox, confidence: word.confidence }))
          .filter(word => word.text);
        if (words.length > 20000 || words.reduce((total, word) => total + word.text.length, 0) > 200000) {
          throw new Error('Table OCR exceeds its word/text budget. Choose a smaller region.');
        }
      }
      self.postMessage({ kind: 'result', sequence, value: { lines, confidence: result.confidence, language: language.code, ...(words ? { words } : {}) } });
    } else {
      throw new Error(engine ? 'The OCR worker language changed. Start OCR again.' : 'The local OCR engine is not ready.');
    }
  } catch (error) {
    self.postMessage({ kind: 'error', sequence, message: error.message || String(error) });
  }
};
