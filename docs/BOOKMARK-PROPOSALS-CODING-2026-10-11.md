# F57 bookmark proposal coding record — 2026-10-11

## Coded

- The outline editor can analyze a user-selected physical-page range from the currently open PDF.js document. Range, selectable-item, accumulated text and proposal limits bound work; page progress is reported and cancellation is checked at page boundaries and during candidate scoring.
- Candidate lines are built from actual PDF.js text items and their font sizes, font names and physical-page positions. A heuristic scores numbered/name-like headings, relative type size, bold-font hints, concise title shape and location. Repeated text near page tops or bottoms is filtered as probable running furniture.
- Suggestions expose selection, editable title, hierarchy level and physical destination page, along with a confidence percentage and matched signals. Scanned-like text extraction results report that OCR is not run. The UI calls out complex layouts and missed/false headings as limitations.
- Only an explicit “Add selected to outline” action adds reviewed entries to the existing editable outline. It creates an undo state. The established build-preview, exact-outline verification, review and new-copy save path remains responsible for writing; suggestions never mutate or automatically save the source.

## Remaining / evidence limits

- OCR-based heading proposals are not implemented. PDFs with no selectable text, including image-only scans, can produce zero proposals; the current low-text heuristic can flag those cases.
- Column-aware reading order, semantic heading tags, table/form structures, language-specific numbering, robust font-weight metadata and corpus-level recall/precision evaluation are not implemented. The confidence is a transparent heuristic score, not a calibrated probability.
- Cancellation is checked between page reads and while scoring. PDF.js does not expose an abort signal for a page's in-flight `getTextContent()` call here; cancellation may wait for that current page request to settle.
- Evidence for this task is limited to `node --check src/pdf-bookmark-workspace.js` and `node --check src/pdf-bookmark-proposals.js`, both successful. No tests, build, broad corpus evaluation or UI automation were run, as scoped.

## Freeze

Implementation files frozen for this F57 handoff: `src/pdf-bookmark-workspace.js`, `src/pdf-bookmark-proposals.js`, and `src/pdf-bookmark-workspace.css`. This record captures the coded scope and remaining evidence gaps; later changes should update this file and re-run the minimal syntax checks.
