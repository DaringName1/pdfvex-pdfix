# PDF reader search progress — 2026-10-12

This is the earlier search checkpoint. Later destination, column-reading and integration progress, including the current list of work left alone, is recorded in `docs/PDF-READER-PARALLEL-HANDOFF-2026-10-12.md`.

This chat owns PDF search and reader reliability. The other workstream owns Workspace and document creation/editing. These changes leave the shared shell, native bridge, dependencies and shared build output untouched.

## Saved reader fixes

- Search and copied/page text preserve words split across PDF.js font/style fragments. Only actual whitespace and `hasEOL` create separators.
- Highlight offsets retain PDF.js text-div indices, whitespace offsets, Unicode lowercase expansion and contextual lowercase across fragments.
- Stop and a replacement search settle promptly while a page/text request is pending. Earlier matches remain available and stale results are not adopted. Each page wait has a deadline: 20 seconds normally, 120 seconds for range loading. This does not terminate an already-dispatched PDF.js worker operation or destroy the viewer's shared document.
- Readable text's PDF content sequence preserves complete words and empty-item line endings. Its existing 20,000-item / 200,000-character bounds now also include whitespace-only items.
- Readable paragraphs carry source-run identities. Selecting a match scrolls to the paragraph containing that source occurrence even without a canvas text layer; it does not choose the first paragraph merely containing the query. Page-artwork highlighting remains unchanged.

Production files: `src/pdf-search.js`, `src/pdf-search-model.js`, `src/pdf-search-page.js`, `src/pdf-readable-view.js`, `src/pdf-readable-sequence.js`.

## Current verification

Command:

```powershell
node --test tests/pdf-search-model.test.cjs tests/pdf-search-page.test.cjs tests/pdf-readable-sequence.test.cjs
```

Result: **11/11 passed**. Covers split words, true whitespace/line endings, Unicode offsets, extraction bounds, cancellation, deadlines, late worker failures and readable source identity. Syntax checks passed for all five production modules and the browser runner.

Command:

```powershell
node scripts/check-reader-search.mjs 'C:\Users\andre\.codex\visualizations\2026\10\13\01a133b5-db03-7e80-b23c-be4867bb9992'
```

Result: **9/9 browser checks passed; zero renderer errors** using headless Microsoft Edge, actual PDF.js extraction, canvas rendering and TextLayer, and the production search/readable components. The runner builds an isolated preview with Vite plugins disabled and does not rebuild shared `dist`. Its generated two-page PDF has adjacent bold/regular word fragments, repeated matches and a rotated second page.

Declared browser cases: source extraction; readable content sequence; three matches across two pages; active fragment ranges and same-page navigation; rotated-page navigation and wrap; phrase offsets; readable source-paragraph navigation in content/rows/two-column modes with no canvas text layer; stopping a delayed request; replacement search rejecting stale results. The fixture SHA-256 was unchanged after the run.

Latest report: `C:\Users\andre\.codex\visualizations\2026\10\13\01a133b5-db03-7e80-b23c-be4867bb9992\reader-search-y5WMLs\report.json`.

Screenshot: same folder, `split-word-active.png`.

This is component/browser evidence with a small synthetic PDF and a reader adapter. It is not full Electron, native-save, hostile-file, large-drawing, memory, hardware or release acceptance.

## Integration and earlier blockers

The earlier review encountered an incomplete shared build: its HTML referenced missing main JavaScript and CSS bundles. On recheck after this coding pass, `dist/index.html` referenced `index-BZ6m6nQr.js` and `index-BU3WFZja.css`, and both existed. That earlier missing-asset state is no longer current.

The current build manifest is `4824a8a6225e911ecc3c6e72e398902cbd2487580e83e9281e652890079e1b5a`. Its search model matches this source, but its search and readable-view files do not match the latest source; search-page/readable-sequence modules and the runner are absent from that manifest. **A coordinated integration rebuild is still required for all of this pass to reach the desktop build.** This chat did not launch a competing shared build.

Some pre-existing plain-Node tests also failed during the earlier audit because their ESM JSON imports/native-verification mocks did not match current interfaces. Those failures are separate from the focused reader results above.

## Remaining reader acceptance

The complete implementation plan remains open. Further work includes readable row/column word joining and ordering, exact outline/destination positioning, realistic Unicode/font/crop/UserUnit fixtures, large-file search/cache/resource checks, source changes and disposal under concurrent rendering, and full Electron integration. This pass adds source-paragraph navigation in readable mode; it does not add exact character highlighting to readable paragraphs or make every inferred layout semantically correct.
