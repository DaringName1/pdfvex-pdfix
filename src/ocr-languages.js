// Bundled language data is copied from the corresponding official
// @tesseract.js-data/* packages by scripts/copy-ocr-assets.mjs.
export const OCR_LANGUAGES = Object.freeze([
  { code: 'eng', name: 'English' },
  { code: 'spa', name: 'Spanish' },
  { code: 'fra', name: 'French' },
  { code: 'deu', name: 'German' },
  { code: 'por', name: 'Portuguese' },
  { code: 'ita', name: 'Italian' },
]);

const byCode = new Map(OCR_LANGUAGES.map(language => [language.code, language]));

export function getOcrLanguage(code) {
  return byCode.get(code) ?? null;
}

export function requireOcrLanguage(code) {
  const language = getOcrLanguage(code);
  if (!language) throw new Error('Choose one of the bundled OCR languages.');
  return language;
}
