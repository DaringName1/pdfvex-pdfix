# Multilingual OCR status

PDFix bundles local Tesseract 4.0.0 best-int language data from the official
`@tesseract.js-data/*` packages. The available printed-text choices are English
(`eng`), Spanish (`spa`), French (`fra`), German (`deu`), Portuguese (`por`),
and Italian (`ita`). Each run uses one language chosen by the user. The current
workflow does not guess a language or run an unselected language combination.

The recognition input stays local. Worker initialization receives the selected
code and loads its matching bundled `*.traineddata.gz`; the session and each
recognized page retain that code and `user-selected` source. TXT/CSV exports
include OCR language provenance. No online language download or handwriting
accuracy claim is part of this workflow.

Searchable PDF creation currently uses pdf-lib's standard Helvetica font. Its
encoding boundary is checked for every reviewed line, and the operation stops
with an actionable message if that font cannot encode a character. This is a
practical Western-script boundary; it does not claim reliable searchable output
for arbitrary Unicode scripts. TXT, CSV, and document-editor export preserve
Unicode text.

The official npm metadata labels each language package MIT, while the upstream
Tesseract `tessdata_best` training-data repository publishes its files under
Apache-2.0. Both notices are included with the copied runtime to preserve the
package metadata and upstream data terms. Tesseract.js and its WebAssembly core
license files are copied beside the bundled runtime. `scripts/copy-ocr-assets.mjs`
records package/version/license details in `dist/ocr-assets/languages.json`;
The Vite close-bundle hook now invokes this script; the six languages were included in the October 8 compilation milestone.

This is an incremental implementation. Current gaps include RTL and CJK
searchable PDF fonts, language detection, mixed-language pages, OCR recovery
across app restarts, orientation correction, handwriting support, and accuracy
benchmarks. The recognized-language choice is kept with the active OCR session
and output records, but those records are not persisted for crash recovery.

Package/API references: [official Tesseract.js local installation guide](https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md),
[official Tesseract.js API](https://github.com/naptha/tesseract.js/blob/master/docs/api.md),
[official Tesseract.js language data repository](https://github.com/naptha/tessdata),
[upstream `tessdata_best` license](https://github.com/tesseract-ocr/tessdata_best/blob/main/LICENSE),
and [official Spanish package metadata](https://www.npmjs.com/package/@tesseract.js-data/spa).
