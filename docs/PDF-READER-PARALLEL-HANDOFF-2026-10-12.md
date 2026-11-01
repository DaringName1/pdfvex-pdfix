# PDF reader parallel handoff — 2026-10-12

This is the handoff for the reader workstream in this chat. The user authorized adding missing reader features and asked for a list of everything left alone so two agents can return to it. Claude owns Workspace/document creation/editing. One integrating workstream should own shared files and the final build.

## Reader work saved in this chat

| Feature | Files | Status |
| --- | --- | --- |
| Split-word search, correct Unicode/source offsets | `src/pdf-search.js`, `src/pdf-search-model.js` | Focused tests and real-PDF browser cases pass |
| Prompt Stop/replacement search, page-reading deadlines | `src/pdf-search-page.js`, `src/pdf-search.js` | Focused tests and delayed-request browser cases pass; an already-dispatched worker request can still finish |
| Source-sequence readable text and source paragraph identity | `src/pdf-readable-sequence.js`, `src/pdf-readable-view.js`, `src/pdf-search.js` | Focused tests and readable match navigation pass |
| Exact readable-text search highlighting | `src/pdf-readable-sequence.js`, `src/pdf-readable-layout.js`, `src/pdf-readable-view.js`, `src/pdf-search.js` | Source character fragments identify the selected occurrence after row/column reordering. Unicode expansion and repeated words keep correct offsets; order changes refresh highlights without wrapping or changing paragraph text. Browsers without Custom Highlight get a paragraph fallback. |
| Exact outline destinations and view-history integration | `src/pdf-destination.js`, `src/reader-navigation.js` | Named and explicit destinations, position/zoom, page/width/height/rectangle fitting; scoped tests/browser evidence |
| Exact positioning from reviewed internal links | `src/pdf-link-review.js`, `src/pdf-destination.js` | Browser-tested internal link; external-link review behavior unchanged |
| Readable row/column words and middle headings | `src/pdf-readable-layout.js`, `src/pdf-readable-view.js` | Adjacent style fragments join; real gaps/whitespace remain; spanning rows divide column sections; automatic gutter proposal improved |
| Explanation for matches outside readable layout | `src/pdf-search.js` | Explains how to see an omitted match instead of silently selecting an invisible paragraph |
| Reader keyboard focus and shortcuts | `src/pdf-reader-keyboard.js`, small wiring change in `src/pdf-reader.js` | Editing controls, handled/modifier/composition events, hidden readers and other modal dialogs keep their keys. Ctrl+Home/End navigate first/last page; Ctrl+F/F3 and Escape search handling are browser-tested. |
| Destinations during panel resize | `src/pdf-destination.js` | Waits up to 20 seconds for the view to settle instead of rejecting an immediate Outline click during resize. Changed navigation/source/disposal cancels the queued jump. |
| Fit-page resize render loop | `src/pdf-reader.js` | Replacing a rendered page preserves the previous banner geometry while the bottom status reports loading. This prevents loading messages from repeatedly changing stage height and triggering another fit-page render. Component checks verify stable fit/page bounds at 800/1100/1380 widths and a page with a visible no-text warning. |

Tests owned here: `tests/pdf-search-model.test.cjs`, `tests/pdf-search-page.test.cjs`, `tests/pdf-readable-sequence.test.cjs`, `tests/pdf-destination.test.cjs`, `tests/pdf-readable-layout.test.cjs`, `tests/pdf-reader-keyboard.test.cjs`.

Isolated browser runners: `scripts/check-reader-search.mjs`, `scripts/check-reader-navigation.mjs`, `scripts/check-reader-component.mjs`. The first two generate PDFs and use production reader components with reader adapters. The third opens the generated navigation fixture in the actual `PdfReader` constructor with production CSS and explicit native-interface test doubles. All build separate temporary Vite previews; none launches a competing shared build or claims full Electron acceptance.

## Files and areas deliberately left alone

| Area/files | Reason and follow-up |
| --- | --- |
| Workspace/document editor modules, editor toolbars, document creation/formatting/export | Claude's assigned workstream. This chat does not replace that implementation or certify its results. |
| `src/app.js`, shared home/navigation/layout/style modules, `index.html` | Shared shell/UI ownership stays with integration. The review saw a malformed encoded title and some malformed text; recheck current source before correcting shared/editor strings. |
| `src/action-panel.js` | Earlier review noted no explicit Escape handling for its search input; the runtime harness also had wrong sidebar labels. Reproduce the actual Escape issue before changing shared UI. |
| `desktop/**`, shared file-store/native adapters | Native bridge, save/verification/containment behavior stays with integration. This pass does not write PDFs or change grants, native processes or external network behavior. |
| Multi-page/fullscreen/measurement/comment/tool modules | Existing render, zoom, navigation and history interfaces are used as provided. `src/pdf-reader.js` wires the keyboard handler and preserves loading-banner geometry during replacement renders; native-tool integrations were preserved. Other reader tools keep their previous acceptance status. |
| `package.json`, `package-lock.json`, `vite.config.js`, packaging/native build scripts | Avoid competing dependency/config changes and native packaging builds. No new dependency is required by this reader pass. |
| Shared `dist/**`, `Launch PDFix.cmd` | Final build belongs to the integrating workstream. Earlier bundles were missing; a later build had them, but its manifest did not contain all reader fixes. Launcher validation of every referenced bundle remains a possible follow-up, not a current missing-bundle diagnosis. |
| Master plan, feature inventory, gap tracker and other agents' progress records | Preserved shared records. This separate document records this chat's scope; integration can update master statuses after combining work. |
| Existing native writer/form/image tests and broad acceptance suites | Earlier audit failures included ESM JSON-import syntax and stale native-verifier mocks. Those are not resolved by reader component tests. Update fixtures/interfaces in the owning workstream, then run the required native checks. |
| Three reader cases in `tests/desktop/document-editor.spec.js` | Claude reports stale reader selectors in this shared editor test file. Left untouched while Claude owns the file; return to its reader cases during coordinated desktop acceptance. |

No claim is made that this is an inventory of every missing feature in the whole application. It lists all known work this chat left outside its changes and the remaining reader acceptance below. Unreviewed app features retain their master-plan status.

## Reader work still to return to

- Full Electron integration after one coordinated build, including real outline and link clicks in the app shell; broader keyboard/focus/accessibility checks; real window resize and native fullscreen; sustained navigation on real large documents. The actual-reader browser pass covers continuous/facing/text-mode transitions, restoration of readable mode, several viewport widths, rapid page requests and delayed destinations superseded by newer navigation; native/large-document acceptance remains open.
- Real large PDFs/drawings: sustained search/jumps/scroll/zoom, measured memory/responsiveness, cache/worker limits, range-source error/cancel behavior and paged-source capabilities. Paged reading currently has unavailable outline/destination APIs; this pass does not add native metadata support.
- Wider destination cases: null coordinates across view modes, multiple rotations/crop origins/UserUnit values, unusual zoom requests, invalid/hostile destinations and bounding-box Fit variants. FitB/FitBH/FitBV use the page viewport as PDF.js's viewer does; precise painted-content bounds are not newly computed here. Requested views remain subject to existing canvas/zoom limits.
- Wider readable layouts: tables, captions, drawings, vertical text, complex bidirectional text, overlapping fragments and irregular/many columns. Auto column detection remains an inferred proposal, with content/row/manual-column/region choices available. It is not semantic structure recovery or OCR.
- Broader readable-highlight acceptance on real multilingual/complex layouts. Exact character ranges now work in content/row/column views and refresh after reading-order changes; Unicode expansion, repeated words and no-Custom-Highlight fallback are tested. A regional/unsupported layout may omit the source paragraph and explains alternatives. The fallback indicates a whole paragraph rather than exact characters.
- All unrelated reader/tool gaps in the master plan, including comment/markup interoperability, exact output/native acceptance, hardware and clean-machine/release checks. These are neither completed nor silently dropped by this pass.

## Verification and integration record

The previous search checkpoint is in `docs/PDF-READER-SEARCH-PROGRESS-2026-10-12.md`. Its build observation is historical and must not be treated as proof of current integration.

Run the focused suite:

```powershell
node --test tests/pdf-reader-keyboard.test.cjs tests/pdf-destination.test.cjs tests/pdf-readable-layout.test.cjs tests/pdf-search-model.test.cjs tests/pdf-search-page.test.cjs tests/pdf-readable-sequence.test.cjs
```

Run both browser scripts with a writable output directory. Each writes a temporary folder with `report.json`; navigation also captures `rotated-destination.png`.

Current results (October 13): **27/27 focused tests, 12/12 search browser checks, 10/10 navigation/column/keyboard browser checks and 12/12 actual-reader browser checks passed**, with zero renderer errors in all three reports. Changed modules/runners pass syntax checks and isolated browser compilation. Browser runs checked that their original PDF fixture bytes were unchanged. The actual-reader screenshot was inspected: the selected readable words have visible glyphs and an orange highlight. Expanded component checks confirm stable fit-page rendering, resized destinations, rapid/superseded navigation and a visible no-text warning.

- Search report: `C:\Users\andre\.codex\visualizations\2026\10\13\01a133b5-db03-7e80-b23c-be4867bb9992\reader-search-WfzKHB\report.json`.
- Navigation/column/keyboard report: `C:\Users\andre\.codex\visualizations\2026\10\13\01a133b5-db03-7e80-b23c-be4867bb9992\reader-navigation-CI7i7E\report.json`.
- Actual reader report: `C:\Users\andre\.codex\visualizations\2026\10\13\01a133b5-db03-7e80-b23c-be4867bb9992\reader-component-0UDgcG\report.json` (representative screenshot: `actual-reader-readable.png`). This covers the production reader lifecycle and UI components with a synthetic three-page fixture, simple test icons, and metadata/window/editor-guard test doubles. It is browser component integration, not the Electron app/native bridge.
- To run the actual-reader check, generate the navigation fixture first, then run `node scripts/check-reader-component.mjs OUTPUT_DIRECTORY NAVIGATION_OUTPUT_DIRECTORY/preview/fixture.pdf`.
- Reader source hashes: `docs/PDF-READER-SOURCE-SNAPSHOT-2026-10-12.json`. This records only this workstream's files so integration can compare the coordinated build manifest with these exact sources.

An earlier manifest comparison matched seven of nine production module hashes. Further keyboard and destination-resize changes have since been saved. Integration must compare the refreshed source snapshot with its final build, rather than treating that earlier comparison as current. Matching source hashes does not establish desktop runtime acceptance.

Integration order: let both owners finish saving their files; review source changes; make one shared build; check its source manifest against the saved reader and editor files; perform Electron/native acceptance; update master records with the actual scoped results. Source, component browser, desktop and release evidence remain distinct.

## Claude coordination read on October 13

Read the local `docs/CLAUDE-HANDOFF-2026-10-12.md`, including its “For Codex” section. Claude confirms no reader files were edited. Its hyperlink popup/selection/Remove implementation and paragraph-spacing/RTF-import follow-ups stay in its lane. Its reported build around 00:12 is a test build, not evidence that these later reader changes are integrated. No shared `dist` or native build was run here.

Claude records that opening editor links used a recorder instead of launching the real browser/mail app, that visible-window mouse selection still needs confirmation, and that quit/departure handling changed in `desktop/main.cjs`. Those stay pending for their owner/integration; this reader pass neither edits nor certifies them. Shared title encoding, native test failures, real Electron checks and the coordinated final build remain open as listed above.

## Testing order agreed on October 13

The user asked to prioritize work that does not need the full app while Claude is editing. This pass completes reader source fixes, focused tests and isolated component checks; Electron acceptance is deferred to one combined build, followed by checks on each computer. At that initial checkpoint no separate Electron test copy was made or launched; a preparation-only copy was made afterward, as recorded below. The temporary web preview server was stopped, and its unused serving helper was removed. No shared build or dependency/native/editor changes were made.

Later desktop checklist: verify Ctrl+F, F3/Shift+F3, Ctrl+Home/End and focus around controls/dialogs; exact outline/internal-link jumps and view history; readable highlighting across reading orders; fit-page/width while resizing and toggling panels; rapid/superseded requests; remembered page/bookmarks through restart; real large PDFs and native fullscreen. Run that same combined build on each computer and keep machine-specific results separate. Native output/save/security and Claude's editor follow-ups retain their own acceptance requirements.

## Converter workstream added October 13

The user additionally authorized converter work that does not interfere with Claude's document editor. This chat owns image/PDF conversion core source and standalone tests; DOCX/RTF/document text export and shared native save/import bridges remain untouched. No full-app conversion acceptance is claimed.

Changes: `src/image-output.js` validates source dimensions and all page recipes before image decoding/editing or progress. It snapshots canonical settings so later draft changes do not alter planned pages. `src/pdf-image-export-model.js` supplies pure PDF-to-image resolution/rotation/geometry and aggregate pixel-budget checks, wired into `src/pdf-image-export.js`. Invalid negative, nonfinite or excessive geometry is rejected before canvas allocation. Existing bounds, supported formats and saving contracts are preserved.

**9/9 converter unit tests pass** in `tests/image-conversion-core.test.cjs` and `tests/pdf-image-export-model.test.cjs`, bringing the combined source suite to **36/36**. Tests reopen real PNG-generated PDFs, decode embedded RGB/alpha streams, inspect actual image-paint transforms for every rotation/paper/orientation combination, check page order/duplicates/shared assets/source bytes, and reject invalid later recipes before canvas editing. PDF-to-image tests cover sizing and budgets; actual canvas encoding and native saving remain pending. Syntax checks pass. Existing `tests/image-output.test.cjs` still imports the shared FileStore/native stack and retains its previous separate acceptance status; these standalone tests do not certify that stack.

Full converter list mapped against current `src/formats.js` and the planned-format inventory:

| Conversion group | Ownership and remaining evidence |
| --- | --- |
| PNG/JPEG/static WebP/supported BMP → PDF; ordered multiple images → PDF | Core is in this lane. PNG embedding/alpha, geometry and order verified without the app. JPEG orientation, WebP/BMP decoding, image editing/deskew and UI/native copy saving still need browser/app/corpus checks. |
| PDF → PNG/JPEG; edited images → PNG/JPEG | Pure PDF pixel planning strengthened here. Canvas encoding, JPEG white background/quality, PNG transparency, reviewed previews/cancellation and saved-copy receipts still need later runtime checks. |
| Multipage TIFF → PNG → image PDF | Existing contained decoder/import path; not edited here. Wider formats, corpus/orientation/color, reviewed import and native saving remain pending. |
| DOCX/RTF/TXT/Markdown → document PDF/DOCX/RTF/TXT; PDF text/OCR → document | Claude's editor/export lane. Leave its codecs, popup, formatting and save/reopen work alone. |
| JSON/XML/YAML/CSV → source-text PDF | Existing document/source export path; defer shared/editor work. This is source text, not structured-document layout conversion. |
| XLSX → XLSX/CSV; PPTX → PPTX/TXT/text DOCX/text PDF | Existing limited Office adapters. Broader fidelity and faithful slide/workbook PDF output are not proven or added by this pass. |
| HEIC/HEIF; legacy DOC/XLS/PPT; Apple Pages/Numbers/Keynote | Still unsupported/planned. Decoder, dependency/licensing and real-file gates remain; no new format support is advertised. |
| Batch conversions and clean-machine compatibility | Wider queue/cancellation/collision handling and machine-specific native/codec evidence remain integration work. |

Run the new source checks with `node --test tests/image-conversion-core.test.cjs tests/pdf-image-export-model.test.cjs`. Converter source hashes are in `docs/PDF-CONVERTER-SOURCE-SNAPSHOT-2026-10-13.json`; compare them against the later combined build.

### Converter follow-up: cancellation, selection and encoder validation

Current converter evidence supersedes the earlier 9-test checkpoint: **20/20 converter unit tests and 47/47 combined reader/converter unit tests pass**. Add `tests/pdf-image-operation.test.cjs` and `tests/image-file-output-core.test.cjs` to the converter command above.

- `src/pdf-image-export-model.js` now selects current/all/range pages before worker dispatch. All-page and large-range requests are capped at 100 before expanding them; invalid modes, unavailable current pages, overlaps and malformed ranges are rejected. The parser accepts bounded physical ranges beyond page 500, but this does not enable image export in currently unsupported native on-demand reading modes.
- New `src/pdf-image-operation.js`, wired into `src/pdf-image-export.js`, supplies a bounded operation deadline, prompt cancellation, source/permission/generation checks, consumed late worker errors and discarded late bitmap cleanup. Worker/encoder functions are dispatched lazily so a canceled job does not start the next operation. The export remains tied to its captured PDF document and file; saving rejects a changed source. An already dispatched encoder/worker can still finish, but its result is not adopted. Tests cover stopped, timed-out, source-changed and replaced operations and listener cleanup.
- `src/image-file-output.js` now rejects decoder dimensions that differ from the prepared image, unexpected encoder MIME fallback (for example PNG when JPEG was requested), and encoded header dimensions that differ from the expected output. Its bitmap is released on these failure paths. These four contract tests use explicit bitmap/canvas test doubles and real generated PNG bytes; they do not prove browser color conversion, JPEG encoding quality or pixel-exact browser rendering.

Changed modules pass syntax checks and compile in an isolated frozen renderer build. Latest prepared copy: `C:\Users\andre\.codex\visualizations\2026\10\13\01a133b5-db03-7e80-b23c-be4867bb9992\reader-desktop-yzDVHF`. Its `snapshot.json` still says desktop tests **not run**. No Electron window was launched; Claude's source, the native bridge, shared dependencies/configuration and shared `dist` remain untouched. Refresh the copy after later source edits. Full conversion UI/cancellation, source replacement, actual PNG/JPEG browser encoding and native copy saving are still on the combined-app acceptance list.

Preparation-only follow-up: `scripts/prepare-reader-desktop.mjs OUTPUT_PARENT` creates a frozen source copy and isolated renderer build, copies existing native/PDF/OCR assets, and never launches Electron. A copy was prepared at `C:\Users\andre\.codex\visualizations\2026\10\13\01a133b5-db03-7e80-b23c-be4867bb9992\reader-desktop-e45Y16`, with `snapshot.json` recording desktop tests as **not run**. It predates these converter changes and must be refreshed before later desktop acceptance. It is not a new native build or release build. No Electron check runner has been added or executed; use the later coordinated acceptance process.

### Converter follow-up: intermediate image validation and memory cleanup

Current source evidence: **28/28 converter checks and 55/55 combined reader/converter checks pass**, counting nested failure cases. The full command is `node --test tests/image-adjustments-core.test.cjs tests/image-file-output-core.test.cjs tests/image-conversion-core.test.cjs tests/pdf-image-export-model.test.cjs tests/pdf-image-operation.test.cjs tests/pdf-reader-keyboard.test.cjs tests/pdf-destination.test.cjs tests/pdf-readable-layout.test.cjs tests/pdf-search-model.test.cjs tests/pdf-search-page.test.cjs tests/pdf-readable-sequence.test.cjs`.

`src/image-adjustments.js` now validates intermediate PNG MIME, header dimensions and limits before returning edited artwork to either converter. Unavailable editing/export canvas contexts produce an actionable error. Both it and `src/image-file-output.js` close decoded bitmaps and zero canvas dimensions on success and failure, releasing the large backing surface. Tests cover wrong MIME, wrong dimensions, encoder/context failures, source-byte preservation and brightness RGB changes with unchanged alpha. Bitmap/canvas calls are unit-test doubles; real generated PNG bytes validate output headers. These checks do not certify actual browser pixels or JPEG quality. Changed modules pass syntax checks, and the converter source snapshot now includes the adjustment module and its tests.

Left alone this pass: Claude's editor, document codecs and hyperlink popup; native bridges/save handling; dependencies, configuration and shared build output; shared image-header parsing; TIFF/Office/unsupported-format paths; and all desktop windows/runtime tests. The prepared renderer copies above predate these latest changes. Refresh a copy or make the coordinated build before desktop acceptance. Crop/deskew pixel fidelity, real PNG/JPEG encoding, memory behavior in the browser, conversion UI cancellation and native saved-copy receipts remain pending in the app, followed by each computer's checks.

### Converter follow-up: validate PDF page encoding before preview

`src/pdf-image-encoding.js`, wired into `src/pdf-image-export.js`, rejects encoder MIME fallback before reopening, empty/invalid blob sizes, per-page/aggregate output overflow, mismatched byte lengths, and encoded header dimensions that differ from the planned page. This prevents a PNG fallback being labeled as JPEG or a wrong-sized encoded image reaching review/save. Existing bitmap reopening remains in place. Shared image-header parsing and native saving are untouched.

Four new standalone checks in `tests/pdf-image-encoding.test.cjs` pass: requested format, exact budget boundaries, valid PNG byte preservation, and size/dimension/format mismatch rejection. Current totals are **32/32 converter checks and 59/59 combined reader/converter checks**, including nested cases. Add this file to the full command above. These are source/unit checks using generated PNGs and synthetic blob metadata, not actual JPEG encoder or desktop evidence. Converter hashes were refreshed. All previous left-alone areas and pending app checks still apply; no app window was launched.

Changed modules pass syntax checks. A renderer-only Vite build with `configFile:false` and target `es2022` passed in `C:\Users\andre\.codex\visualizations\2026\10\13\01a133b5-db03-7e80-b23c-be4867bb9992\converter-encoding-build`; its only reported warning was large bundle chunks. It reads current source and writes separate output; it is not a frozen desktop copy, native build, runtime acceptance or release. Shared `dist` and native build hooks were not used.

### Full converter-plan request: expanded work and exact remaining scope

The user authorized continuing until converters in the adopted plan are finished. The goal remains active. [The converter completion register](PDF-CONVERTER-COMPLETION-REGISTER-2026-10-13.md) now lists every route, its evidence and actual remaining functionality/acceptance, including broader batches, photo metadata/color choices, unsupported decoders, EML/clipboard and Claude-owned document routes. It does not mark all converters complete.

Current evidence supersedes previous counts: **63/63 converter source/disk checks; 27/27 reader unit checks; 13/13 standalone real-browser codec/disk checks**. The browser harness does not launch PDFix/Electron or use its native bridge. It exercises actual PNG/JPEG/WebP/BMP decoding/encoding and PDF page rendering, not only canvas test doubles. Source tests additionally use independent TIFF/Office fixtures and the existing email parser. See the register for exact report paths and limitations. The initial sandbox browser launch failed to create its profile; an authorized outside-sandbox run succeeded. An early harness cleanup used the wrong PDF.js cleanup method; correcting it to the loading task's `destroy()` made the checks pass. No production reader code changed for that harness issue.

New implementation: `src/image-codec.js` validates normalized source/output geometry/MIME and releases canvas/bitmap resources; `src/workbook-csv.js` and its workspace integration enforce actual UTF-8 export bytes; `desktop/image-export-writer.cjs` snapshots reviewed bytes/page metadata before asynchronous saves; new `desktop/image-output-png-validation.cjs` checks PNG framing/checksums before creating output folders. The native writer is a standalone converter-owned module: no main/preload/FileStore/contained-engine dispatch changes. Added edited-image source/output comparison in `src/image-file-export.js` and separate CSS; compiled, visible-app check pending. Existing TIFF/Office/email codecs were tested without editing them. New runners are `scripts/check-converter-source.mjs` and `scripts/check-converter-codecs.mjs`.

Latest renderer-only compile output is `C:\Users\andre\.codex\visualizations\2026\10\13\01a133b5-db03-7e80-b23c-be4867bb9992\converter-expanded-build`. It is not a native or release build. Existing prepared desktop copies predate these changes. Claude's document editor/codecs/links, main/preload bridge, dependency/configuration files, shared dist and master completion claims remain untouched. The completion register preserves all later integration, decoder, corpus, UI and machine checks.

### Batch follow-up

Converter source/disk evidence now **75/75 passing**; previous reader evidence remains **27/27** with unchanged hashes. Dedicated batch service/workspace files now fence changed originals before conversion and saving, wait for asynchronous cancellation, record source-change warnings after publication, and retain per-file save errors with reviewed output available for retry. Tests exercise actual file snapshots and source changes, explicit compression/PDF-save doubles, the actual bounded text parser and actual FileStore TXT publication/collision preservation. The contained dispatch/native PDF compression/verification and app UI remain pending; see the [completion register's batch section](PDF-CONVERTER-COMPLETION-REGISTER-2026-10-13.md#batch-follow-up) for exact scope.

Changed files: `desktop/batch-compression.cjs`, `desktop/batch-document-actions.cjs`, `src/batch-compression-workspace.js`, `src/batch-document-actions-workspace.js`, two new batch test files and the source-test runner. No Claude document editor/codecs, main/preload/FileStore/contained-engine dispatch, dependencies/configuration or shared dist changes. Batch modules loaded successfully in the current Node environment; this is a narrow observation and does not resolve previously recorded whole-suite failures. Renderer-only compile passes at `converter-batch-build` beneath the same QA root; native/app/release acceptance remains deferred. Full converter goal is still active.


## October 13: new lane ownership and built Electron acceptance

Read `AGENT-WORKFLOW.md`, the complete known-issues list and Claude handoff before editing. Codex now owns reader/Drawing/Pages; Claude owns editor/shell/Documents/More tools/converters and shared integration. Previous converter work remains in the baseline but is now Claude's lane. Left Claude's modified paper-size/editor/shell/source-conversion files and fixture alone.

Added `scripts/check-reader-electron.mjs`: hidden actual Electron app with a unique retained temporary profile, actual native opening/rendering/search/navigation and only dialog selection substituted. Eight of eight checks pass: actual page pixels/text; three-page search and precise artwork word ranges; named XYZ outline jump and 150% zoom; reviewed internal link while external web destination stays inert; input-aware first/last/page keys; readable selected range exactly `maintenance`; fit-page resize at 800/1280 widths; leave/reopen and SHA-256 original retention. No renderer errors or HTTP requests. App closed in 99 ms. Report: `tmp/reader-electron-Q6pJbU/report.json`. This is built-app generated-fixture acceptance, not an outside viewer, personal corpus or performance certification. First runs exposed incorrect new-test assumptions (match count, unselected match state, old DOM highlight selectors), corrected without production changes. Coding-sandbox launch failed; normal Windows execution passed.

Build uses `node scripts/agent-build.mjs codex` and passed. Shared `dist` remains a test build; integrator owns final build.

After Claude's JSON import commit `a49873b`, scoped native Node run of PDF operations/OCR/split/compression: 15/23 pass. Six compression failures include outdated checksum/cancel assumptions and native sandbox startup; OCR test omits newly required language; split failed-write test expects an obsolete wrapped error contract. Classify/fix in follow-up without weakening native containment or touching FileStore. Reader desktop selector updates, large-file measurements and Drawing/Pages tool-by-tool outputs are next. No full-goal completion claim.

### Requests for the integrator

Keep current shared ownership/build lock. No bridge or dependency change requested for reader checks. Native sandbox startup in standalone compression tests requires investigation; record the actual OS/helper failure before changing infrastructure. Preserve review/departure quit behavior.

### Reader selector and printed-label follow-up

Updated `tests/desktop/pdf-reading.spec.js` and `reader-navigation.spec.js`, with `tests/helpers/reader-desktop.mjs` for current grouped reader menus and 15-second close timeout. Updated only the three reader test bodies in shared `document-editor.spec.js`; its four editor tests/hooks remain untouched. Three rectangle/readable/import cases pass; both reader suites pass 9/9 in built hidden Electron, including actual passwords, copy restrictions, outlines/labels, view rotation, exact-byte copy saving, reading-state restart/source reset, page-output preview and minimum window. Print uses actual prepared-page review but a recorder for Windows printing; no physical printer proof. Compact test now checks reader controls rather than duplicating Claude's editor layout acceptance.

Found/fixed production reader issue: initial printed labels loaded only when Outline opened. `reader-navigation.js` loads labels with initial state and updates an already rendered first-page status without rendering again. Native app test verifies Label i before Outline is opened. Locked build passed. Nine desktop cases passed in 42.2 seconds; all owned windows closed.

Left all Claude application/shared files and his generated document fixture untouched. Remaining: measured large/drawing runs, named close controls for the four smoke traps, each Drawing/Pages output and richer readable corpus. Shared shell layout spec still has old View options/search strings: request Claude update its reader-facing assertions using the reader helper; Codex did not edit shell-owned spec.

### Unit-test failure classification resolved in assigned suites

After Claude's JSON import fix, PDF operations/OCR output/split output/compression pass 23/23 under normal Windows access. All eight remaining failures in the first scoped run were stale tests/setup: wrong vendor runtime path/missing adjacent sandbox; incomplete tampered-engine fixture; missing actual FileStore structural verifier; OCR language provenance/new encoding refusal wording; and old direct-write injection/error assumptions after staged split publication. No production compressor/OCR/FileStore/native sandbox code changed.

`tests/compression.test.cjs` now uses `dist/native/qpdf`, copies actual pinned runtime into its tampering fixture and wires actual `PdfOutputCheckService` into FileStore saving. Actual AppContainer compression preserves forms/outline/attachments/metadata, performs JPEG work, cancels and rejects tampering; actual native structural checking and exclusive publication protect originals/collisions. `ocr-output.test.cjs` supplies reviewed English provenance. `split-output.test.cjs` injects second-publication failure and independently checks rollback, retained incomplete-copy bytes, absent completion receipt and source retention. These are source/native/disk checks, not full compression/OCR/split UI acceptance or broad corpus. No fake verifier was added. Other failing suites remain Claude/integrator scope. No current whole-project test count inferred.

### Performance and reported tool exits: built app evidence

Added `scripts/check-reader-performance.mjs`: five cases pass on a generated on-disk 500-page vector PDF and the supplied private drawing sample (local only, not in git). Actual opening, 12 distant jumps, zoom, search over all 500 pages, continuous wheel scrolling/jump and supplied drawing zoom run through normal native bridges. Dialog paths alone are substituted. Report `tmp/reader-performance-9u0NeN/report.json`: open 1,086 ms; jumps 45–52 ms; full search 855 ms; renderer heartbeat extra delay p95 12.5 ms/max 79.4 ms. Sum of process working sets: 594 MiB after open, 658 after jumps, 777 after search, 863 after continuous scrolling, 800 after supplied drawing. Sum of individual process peak working sets reached 885 MiB; that is not a measured simultaneous peak. Three canvases held 1,717,695 pixels after continuous scrolling. No renderer errors or network requests; owned app closed. Helper now waits for the target continuous/facing slot instead of the hidden single-page paper.

Limits: short synthetic workload, not prolonged soak or release benchmark. Real historical 300 MB SW3 drawing is absent on this computer. No real large-corpus or outside viewer claim. No memory leak conclusion from this run.

Added `scripts/check-reader-tool-exits.mjs`: four independent hidden actual app sessions inspect the supplied drawing, use named exit controls and return Home, preserving SHA-256 `034525620271fd4e983b8df9150231f48439d48b78e62ab279bc2b48329a16a7`. All 4 pass in `tmp/reader-tool-exits-T3sEOn/report.json`. Sheet sets requires explicit second discard decision; comments Collapse works; thin-line and outline Close work after native inspection completes. The generic smoke closer trap did not reproduce. This is automated built-app evidence, not human visible-window verification or certification of each saved tool output. A3 updated accordingly. Actual tool outputs are next.

### Drawing comparison/markup and Pages organizer/compressor acceptance

Updated owned desktop suites for current grouped controls, confirmed comparison mappings, reviewed print preparation, Pages room navigation, current PDFix name and crop/resize summary. Actual hidden built Electron results: comparison 6/6, markup 5/5, page workspace 4/4 and compression 5/5. All 20 pass; apps close through the departure path with a timeout. Comparison requires explicitly confirmed counterparts before whole-document checking; tests no longer assume positional pairing. Print is reviewed actual preparation with Windows printing recorded, not hardware proof.

Disk output checks preserve form values, source comments/outline/attachments and original bytes; reopen saved markup and organized pages; check cropped/rotated artwork pixels; verify flattened appearances, persistent note text, recovery/restart, save collisions, real JPEG and lossless compression, cancellation and minimum-window controls. Generated PDFs and project fixtures, not wider user corpus or outside software. A2 updated. No production change was needed for these 20 stale test expectations. Left all Claude specs, four shared editor cases, shell and integration files alone.

### All Pages room tools: actual output checkpoint

`scripts/check-reader-pages-tools.mjs` passes 9/9, report `tmp/reader-pages-tools-26H3D9/report.json`. It opens each remaining Pages card, uses actual native writers/save bridges, independently parses the saved on-disk PDF and reopens it in PDFix: page boxes, production marks, thin strokes, unchanged-copy naming, page numbering, outline, batch Bates, batch exact copies and batch compression. Combined with the organizer and compressor desktop suites, every Pages room tool has scoped built-app use evidence. One generated single-page drawing with a source note; not broad drawings, all settings or outside-software acceptance. Copy/naming bytes match exactly; native outputs retain the source comment; original unchanged; all owned apps closed. Bates/page-number text is verified after app reopen. Batch text export and broader multi-file continuation are still additional cases, not inferred from batch-copy success.

Found/fixed real print-marks UI bug: input listeners on every dialog input included final review and the preview page selector, causing prepared output to be discarded when reviewed. Listeners now cover only actual mark settings. Built regression verifies preview selection/review/save/reopen and that a later bleed edit still disables saving. A19 records the resolved defect. Initial runner failures included incorrect card names and an outline title readback expecting PDFString rather than valid PDFHexString; corrected test assumptions, not production writers. Locked build passed. No shared/main/preload/editor changes.

### Remaining Drawing room outputs verified

`scripts/check-reader-drawing-tools.mjs` passes 3/3, report `tmp/reader-drawing-tools-v9aVhO/report.json`. Supplied drawing: changed sheet title/revision, saved local sheet-set library, independently read JSON and loaded the set against freshly picked exact source bytes. Supplied drawing: three count points saved to source-bound JSON and persistent Ink annotation in a PDF copy, independently read metadata/quantity/source SHA and reopened PDFix output. Generated annotated drawing: edited plain comment, built/saved native preserving copy, independently read the new comment and reopened the output. All originals unchanged and apps closed. This completes scoped tool use for the six Drawing cards alongside reader/comparison/markup checks. It does not certify calibrated area/perimeter, all comment/reply/proprietary types, annotation interchange or outside viewers. Visible human verification remains separate.

### Readable tables, captions and unequal columns

Added a user-selected Table rows with gap separators mode: wide geometry gaps become tabs, adjacent font fragments remain joined and source offsets remain exact. It renders pre-wrapped monospaced rows; gaps are proposals, not verified table cells/headers. Added Column split at 20–80% for manual two-column order so unequal columns can be reviewed without forcing a midpoint. Spanning separators still divide vertical sections; column-local captions stay beside their column content. Older saved preferences migrate to a 50% split; invalid stored splits are rejected. No document bytes change.

19/19 related layout/sequence/search source checks pass. Locked build passes. `scripts/check-reader-readable.mjs` passes 5/5 in built hidden Electron (`tmp/reader-readable-jnRVBE/report.json`): actual generated PDF table with a word split across font runs, tabs/caption, exact maintenance highlight, unequal-column caption/section sequence, 800-width controls/artwork return, source preservation and preference process restart. No renderer errors; all windows closed. The initial script expected singular match wording while the existing position counter uses matches; corrected the assertion without changing search code.

D4 updated. Left open: merged-cell semantics and arbitrary region layouts; vertical/complex RTL text and broader real/multilingual corpus; exact highlighting fallback in browsers lacking Custom Highlight. These controls help manual review; no universal accessibility or semantic-reading claim. No editor, shell or shared bridge changes.

### Reader metadata test classification

`tests/reading-state.test.cjs` passes 2/2. Its historical page-501 refusal was stale: on-demand PDFs intentionally exceed 500 pages, FileStore permits positive safe integers, and the reader clamps positions against its actual PDF. The test now positively verifies storing page 501 and rejects zero, fractions, unsafe integers, unsafe bookmark pages and excessive titles/counts. Source resets and bounded corrupted metadata checks remain. No shared FileStore edit. Section B records this test correction; no new full-app unit total inferred.

Integrator request: the known-issues table currently has two A18 identifiers (reader labels and Claude fill/sign). Please reconcile IDs with the final whole-suite count; Codex did not renumber Claude's entry.

### Sustained performance checkpoint and resource-reference cleanup

Extended `check-reader-performance.mjs` to 30 seconds of repeated continuous jumps, wheel movement and zoom, sampling native process working sets every five cycles. Latest built app passes 6/6 (`tmp/reader-performance-zSqcBd/report.json`): 68 cycles/272 additional jumps over 30,274 ms; initial jumps 45–59 ms, full search 852 ms; heartbeat extra delay p95 58.3 ms/max 125 ms. Live slot pixels remained below 32 million, with two live canvases during repeated navigation. No renderer errors/network requests; original supplied drawing retained; app closed.

Found in source: released slots still retained canceled TextLayer objects (including references to detached text nodes). `pdf-multi-page-view.js` now clears textLayer, task and viewport references on eviction as well as existing content/page/canvas cleanup. Actual continuous jump/zoom/scroll workload passes after the change. This does not prove an overall memory improvement: before and after runs both show substantial process working sets. Latest sampled sum 497–1,541 MiB; renderer rose from 186 to about 642 MiB, ending around 637 MiB after repetition. Total ended at 1,088 MiB, then 1,192 MiB after opening the small supplied drawing. Working-set samples are neither heap-retention evidence nor a simultaneous peak measurement between samples. A20 preserves the investigation; D2 contains current measurements.

After two measured workloads and the targeted reference cleanup, longer memory profiling is left open instead of claiming a leak-free result. Missing real SW3 file remains the large-corpus blocker. No runtime/dependency/architecture/shared-file change.

## End-of-pass integration summary — October 13

Final scoped reader desktop regression after readable/continuous cleanup: 12/12 pass in 53.2 seconds, excluding Claude's four editor tests. Earlier Drawing/Pages desktop checkpoint: 20/20 pass. New scoped hidden check scripts: reader 8/8, reported exits 4/4, performance 6/6, remaining Pages outputs 9/9, remaining Drawing outputs 3/3, readable layouts 5/5. Counts are separate script scopes, not proof of every possible input or a full-app release pass. Assigned native unit suites 23/23, reader metadata 2/2 and related readable/sequence/search units 19/19 pass. Locked builds passed; git diff whitespace check passes. All Codex-owned app sessions closed.

All six requested steps were addressed in order where possible; unit fixes followed Claude's JSON commit while tool checks continued. Real large-corpus acceptance and human visible-window verification could not be completed here. No claim that the app has no remaining bugs.

### Explicitly left alone / next acceptance

- Claude: document editor, app shell, Documents/More tools, converters, shared main/preload/FileStore, dependencies/configuration, his modified/untracked scripts and the four editor desktop cases. No broad staging, branch, stash, merge, reset or source cleanup.
- Integrator: coordinated final build, whole-app unit/desktop counts, source/build manifest comparison, duplicate A18 issue IDs and shell-owned stale layout selectors. Shared dist is a test build.
- Reader: A20 high total process memory still needs longer profiling and a real large drawing; SW3 is absent. Very-large on-demand outline/destinations remain unsupported; broader crop/rotation/hostile destination corpus is unproven.
- Readable text: table separators and unequal-column splits are geometry/manual-review options. Merged-cell semantics, arbitrary regions, vertical/complex RTL and broader multilingual exact highlights remain unproven. Custom Highlight fallback is paragraph-level.
- Drawing: calibrated distance/area/perimeter and every measurement unit, all rich/locked/proprietary comment/reply/state cases, revision/comment carry, wider sheet-set workflows and outside-app interchange remain acceptance work. Current supplied-drawing evidence is count takeoff/local sheet-set persistence; plain comment writer uses an explicit generated fixture.
- Pages: current per-tool copies are scoped fixtures. Wider multi-file Bates continuation, batch TXT route, all stamp/production/geometry settings and broad corpus remain separate cases. Existing native source/disk evidence must not be equated with full app/corpus acceptance.
- Visible human checks, real outside viewers/editors and physical printing were not performed. Windows print calls were recorded after real preparation; no physical-printer claim. A3 exits passed explicit hidden controls, not by-hand visible use.

No shared-file integration change requested by the implemented reader changes. Do not mark real-corpus/memory/outside-software gates complete from these reports.

### 90-second memory diagnosis (still open)

Performance runner now accepts `PDFIX_READER_SOAK_MS` from 15,000 through 120,000 and an optional `--memory-diagnostics`. The diagnostic requests renderer heap/DOM metrics and forced collection only after the workload, then leaves Home and collects again. No production garbage-collection calls or runtime flags were added. Console output is compact; full process samples remain in the JSON report.

Built hidden Electron run: 7/7 pass, `tmp/reader-performance-zxdxhD/report.json`. 206 cycles/824 additional jumps in 90,423 ms, full 500-page search 856 ms; heartbeat extra delay p95 58 ms/max 150.4 ms. Sampled sum of process working sets ranged 613–1,722 MiB. Main-renderer JS heap: 40.1 MiB before diagnostic collection, 8.4 after, 7.2 at Home. Total working sets: 1,350 MiB before collection, 1,129 after, 1,011 at Home with zero live canvases. CDP DOM count still about 10,290 at Home; no baseline/detached-tree ownership proof, so this remains an investigation, not a diagnosed leak fix. No renderer errors/network traffic; source retained; app closed. Real SW3 remains unavailable.

Issue-ID cleanup changed only Codex rows to avoid collisions with Claude additions: reader labels is now A21 (previous A18), print marks A22 (previous A19), reader memory A23 (previous A20). Historical handoff mentions retain their old identifiers; current known-issues rows and D2 use the unique IDs. Claude's A18/A19/A20 rows were not edited.

### Batch continuation, calibrated takeoffs and recovery

Added `tests/desktop/drawing-pages-followup.spec.js`. Three built hidden Electron scenarios pass (two batch cases passed together; expanded takeoff/recovery final case passed in 11.5 seconds):

- Batch literal TXT from two chosen PDFs (one and two pages): actual native preparation/review, saved bytes equal exact UTF-8 preview text, sources unchanged, second TXT reopened in PDFix. Files/check receipt retained in test scratch directories.
- Batch Bates starts at 41, saves the first PDF, skips a middle original and saves a two-page final PDF. Independent output page counts and queue JSON show saved/skipped/saved, next number 44; PDFix reopen shows 000041, 000042 and 000043 on the correct pages. Skipping consumed no number and originals are unchanged.
- Rotated 90-degree PDF with offset crop: calibrate a known 10 mm reference; retain distances in mm/cm/m/in/ft/yd, closed perimeter and area. Independently read JSON quantities: each distance 10 mm, perimeter 40 mm, area 100 mm². CSV includes all entries. Native PDF copy preserves crop/rotation and eight Line/Polygon annotations; independent PDFixData JSON equals every complete entry. Reopen, inspect/review recovery and save a rebound ledger: points, quantities and calibration unchanged; original entry/source provenance retained; new source identity binds to the saved PDF copy.

Initial test failures were test synchronization/selectors: CSV read raced the previous JSON Saved status; recovery button sits in the grouped reader controls. The CSV check now waits for its specific filename and idle ledger controls; recovery opens the current groups. No production takeoff/Bates/batch change. A failed test's own unsaved ledger can now be explicitly discarded during teardown before the close timeout; this applies only to isolated test data. One early failed run hit the close watchdog and killed its owned app; successful final runs closed normally.

Known-issues inventory updated with this later acceptance. Numeric issue IDs collided again with a concurrent Claude addition, so Codex's rows now use stable lane IDs: A-R1 reader labels, A-P1 print marks, A-R2 memory. Claude's numeric entries remain untouched. This supersedes the immediately preceding numeric-ID note.

Final takeoff assertion also verifies displayed conversions for the same 10 mm distance: 10 mm, 1 cm, 0.01 m, 0.3937 in, 0.0328 ft and 0.0109 yd. The expanded calibration/recovery check passes in 12.6 seconds and closes normally. This verifies conversion of a chosen scale, not correctness of a real engineering reference.

Still left alone: Claude's current watched-folder/document tools and all editor/shell/shared source; dependencies and final build. Remaining acceptance: actual-scale validation on real drawings, nonuniform/distorted sources, full comment/proprietary exchange, batch cancellation/failure/collision combinations and wider PDFs; memory/native/DOM retention plus missing large SW3 corpus; human visible windows, physical printers and real outside viewers. No universal converter/tool completion or low-memory release claim.

### Reviewed stamps/templates and reply/history fix

Added `tests/desktop/drawing-review-styles.spec.js`: 2/2 built hidden Electron cases pass in 25.1 seconds. Decoration case enables all five additions, saves a named style, restarts the process, explicitly applies the style while preserving page range 1,3, reviews both changed pages and saves a native PDF copy. Independent readback proves three pages, unchanged unselected page-2 content bytes, retained source comment and unchanged original; PDFix reopen shows correct physical/sequence numbering, header/footer, watermark and Approved text stamp only on selected pages. A template is settings only, not authenticated approval or a saved PDF. Five decoration checkboxes and their fieldsets now have explicit accessible names (A-P2).

Reply case exports/reloads an exact portable JSON draft, builds/saves a new reply with Accepted review history and reopens it. Independent dictionaries prove original parent text/private field retained and no parent State overwritten; new reply has the exact IRT parent, author, text, State/StateModel. Source bytes unchanged and all owned apps closed.

Found/fixed real reply bug (A-D1): native writer encoded enumerated State/StateModel as UTF-16 hex strings. PDF.js returned raw byte strings (for example BOM plus NUL-separated Accepted), so app independent verification rejected the otherwise valid output. These ASCII enumerations now use literal PDFString; Unicode comment/author text remains Unicode. `tests/pdf-review-entry.test.cjs` passes 7/7 including Accepted/Rejected/Cancelled/Completed/None/no-status and independent PDF.js annotations, Unicode text/author, original parent/private-field/source retention. Locked builds pass. No shared bridge/editor/shell/dependency edits. Early decoration selector failures were test scoping/naming assumptions; source checkbox labels were a separate accessibility gap. Broad/proprietary reply/appearance interchange and real Revu remain unproven.

User confirmed continuing only Codex lanes after Claude reached its limit. Claude's unfinished watched-folder files, root/master ledgers and untracked docs remain untouched.

### Exact fallback character highlights

Added `src/pdf-search-fallback.js`, integrated with search and reader styles. When CSS Custom Highlight is unavailable, bounded source ranges are painted as exact mark elements in readable paragraphs and artwork text runs. Overlapping/adjacent intervals retain active priority. Clearing unwraps only PDFix marks, normalizes text nodes and preserves paragraph source metadata/text. Artwork active ranges are rebuilt on the new marks so scrolling keeps noncollapsed geometry. Existing native Custom Highlight path remains.

New `tests/desktop/reader-highlight-fallback.spec.js` passes in built hidden Electron (4.4 seconds) with Highlight deliberately unavailable: exact split-font artwork word, nonzero geometry, three repeated/split readable occurrences, unchanged row text/tabs, layout changes, replacement query and clearing without leftover marks; source unchanged, no renderer errors and app closed. First assertion raced asynchronous selection; polling the actual marks corrected the test. This exercises the fallback in current Electron, not a claim about untested old browser distributions or all scripts/languages. A-R3/D5 updated; the earlier paragraph/run fallback limitation is superseded. Locked build passes.

### Revision/cancellation preservation and destination geometry

`tests/desktop/drawing-pages-recovery.spec.js` has two passing built-app scenarios: review both actual drawing revisions before replacement, preserve title/revision labels, Undo/Redo reference changes, save/read independent sheet-set JSON and retain both source PDFs/comments; batch compression stops without creating output, retries, saves first copy, skips/retries second and keeps an occupied filename while independently reopening the alternative copy. Original bytes and existing sentinel file remain. Both apps close. Early test assumptions clicked a still-disabled Stop before the microtask dispatched, and tried populating an output folder before native ownership; corrected to real enabled controls and a collision inside the batch's already-created folder, preserving exclusive-folder safeguards.

`tests/desktop/reader-destination-geometry.spec.js` passes 32 actual outline jumps in 8.1 seconds: all eight supported destination kinds across four rotations, negative media/crop origins, correct page/aspect ratio, XYZ 200%, page fitting, bounded canvas pixels and unchanged original. It waits for navigation's focus handoff, rather than reading an old same-page ready flag. No exact external-viewer/pixel-coordinate or hostile-corpus certification. D6 updated.

After fallback/reply changes, final reader desktop regression 12/12 passes in 53.6 seconds; focused readable/search/reply units 26/26 pass. No all-app release claim. Claude's untouched dirty files are still the watched-folder manager/storage and master plan/inventory documents; all tests use isolated profiles and close owned windows.

### XFDF export/import and standard review history

`tests/desktop/drawing-xfdf.spec.js` passes in built hidden Electron in 17.6 seconds: export the actual source comment as reviewed UTF-8 XFDF, independently parse XML and recover literal angle-bracket text, disclose/omit private source fields; choose a linked parent/reply XFDF with Unicode authors/text and Accepted state, inspect/select/review, save native preserving PDF, independently read dictionaries and reopen drawing-wide comments. Original bytes/private source field retained; parent/reply link exact; no renderer errors; app closed. This is PDFix-to-PDFix supported-subset evidence, not real Revu/Acrobat round trip or full XFDF conformance.

Found/fixed A-D2: imported State/StateModel also used UTF-16 hex strings, reproducing BOM/NUL Accepted in independent PDF.js decoding. Writer now uses literal enumerated state strings. Independent app verification additionally checks imported reply parents/type and Text review fields, instead of only text/geometry. `tests/pdf-review-entry.test.cjs` now passes 8/8 with Unicode interchange and DTD/external entity refusal. First test fixture used unsupported replyType=reply; corrected to the supported standard R before reproducing the real encoding defect. Locked build and app route pass. No bridge/dependency/shell/editor change.

### Pen input ownership and moving selected markup

Added `src/markup-pointer.js` and input/movement controls in the existing markup workspace. Default pen/mouse input leaves touch for panning; Pen only refuses mouse/touch drawing; Touch drawing explicitly opts in. Active gestures retain their pointer identity, so another pointer cannot overwrite, finish or cancel a stroke. Matching cancel/lost capture discards the in-progress gesture. Move selected markup translates rectangle/path/quads/callout text geometry together, previews it live and commits through existing bounds/history/recovery checks; no output schema or bridge changed. The UI discloses fixed-width ink without pressure.

`tests/desktop/drawing-pointer.spec.js` verifies in the built hidden app: real CDP pen stroke, refused mouse in Pen only, deliberately injected other-pointer touch down/move/up/cancel, native editable Ink save/independent path readback, uniform selected-stroke movement, Undo/Redo copies, app reopen and unchanged original. Coordinates are measured again after preview because the dialog scrolls; the first test used stale screen coordinates and did not actually hit the drawing. Existing rotated flattening pixel test now fixes its preview width so responsive scrollbar/layout changes cannot compare different raster dimensions. Five existing markup scenarios retain annotated/flattened preservation, all rotations, minimum window, print choices and recovery failure/rescue checks.

Focused source tests pass 7/7 (pointer modes, immutable geometry, refusal, output preservation and recovery). Recovery test initially hit sandbox profile-write restrictions; allowed isolated-profile rerun passed. App tests close their owned windows. Physical stylus pressure/palm behavior, high DPI, sustained real handwriting, variable width/opacity, eraser interaction and outside-viewer Ink acceptance remain open. A-D3 and digital-pen remaining scope updated. Claude editor/shell/Documents/More, dirty watched-folder files and master ledgers left alone. Final integration/build remains Claude's; dist is a locked test build.

Touch follow-up: `drawing-pointer.spec.js` now passes 2/2 (16.9 seconds); the five existing markup cases passed with the final production code in the prior 6-case run (54.8 seconds). Second case uses CDP touch input with emulation enabled: default touch navigation creates no ink, explicit Touch drawing accepts a stroke, owned touchCancel discards it, selected-stroke removal/Undo/Redo works, restored stroke independently saves as editable Ink. This is simulated touch on current Electron, not a physical tablet/palm guarantee. Locked build passed (398 modules); focused source tests 7/7. All owned app sessions closed.

### Reviewed ink removal and externally changed stroke preservation

Added Review ink removal to the Drawing markup tool. Picking measures distance to displayed ink segments with an eight-pixel tolerance, respecting current page, zoom/rotation/UserUnit and later-stroke ties. Foreign annotations and non-ink marks are not picked. Clicking blank space clears the selection without deletion. Picking highlights the chosen stroke and explicitly asks for Remove selected markup; only that existing button changes the draft. Undo/Redo, source-bound local recovery and reviewed new-copy save remain in place. This is whole-stroke selection plus confirmed removal, not sweep/partial erasing or physical stylus eraser-end support.

Fixed A-D4 in `src/markup-output.js`: standard InkList path and BS width now must agree with supported PDFix metadata before a stroke is considered editable. Changed paths, added strokes and changed widths are retained as foreign; their private fields and dictionaries remain. Previously stale metadata could replace externally modified ink. Preview independently verifies new InkList coordinates via PDF.js in addition to text/rectangle.

Verification: focused source tests 9/9 pass, including visible-segment picking, degenerate strokes/ties, three foreign-edit variants, output and recovery. New built-app scenarios cover reviewed removal at 0/90/270 degrees on cropped pages, no deletion before confirmation, blank misses, Undo/Redo, exact standard InkList disk readback, foreign comment retention and app reopen. External-edit scenario recognizes the changed stroke as non-editable, adds a note, saves through native structural verification, independently reads the exact changed coordinates/private field and preserves original bytes. Five existing markup cases and two input-mode cases pass on the final production code. Aggregate run was 10 pass / 1 failed (Windows Security Sandbox startup); the focused failed case then passed on retry in 5.1 seconds with actual containment. Thus 11 distinct scoped cases have passing results, not an uninterrupted 11-case pass. All owned windows closed.

Locked final test build passed (399 modules). Earlier locked build failed CS0016 because the sandbox executable was in use; process inspection found no holder, and retry passed. The initial test runner following that failed build was interrupted and its results were discarded. Process inventory showed other checks and an older orphan app; none was stopped or claimed as ours. No sandbox, dependency, bridge, shared build script or shell workaround was introduced. A-B1 records these transient failures, without asserting their cause. Requests for the integrator: coordinate native executable rebuilds with running checks, and investigate sandbox startup diagnostics rather than bypassing containment. Shared build lock currently serializes builds but does not cover running app checks.

Left alone: Claude's newly modified `src/app.js`, document tabs files/check, watched-folder files and master/inventory ledgers, plus editor/Documents/More tools. Remaining Codex acceptance includes physical pen pressure/palm/high-DPI, width/opacity, sweep/partial erasing, actual large drawing corpus and memory profiling, complex readable-layout corpus, real Revu/Acrobat interchange and printer checks. Shared architecture changes, proprietary adapters, final build and release integration remain with their recorded owners/prerequisites.

### Ink width, opacity, reusable styles and recovery

Implemented ink-only width 0.5–12 pt and opacity 10–100% in Drawing. New stroke controls and selected-stroke controls are distinct. Gesture start captures its style; live SVG, editable standard Ink BS/CA, appearance ExtGState and explicit flattening use it consistently. Selected edits retain coordinates/identity, revalidate geometry, resize width bounds and support Undo/Redo without resetting the comment textarea/caret. Picking a wide stroke includes its displayed radius. Highlighter, underline, shapes, notes and text styles keep their existing behavior; highlighter opacity is still fixed 30%.

Styles are bounded optional fields in existing markup and saved-tool records. Legacy copies without the fields retain 2 pt/100% ink without inserting fields into their models. Recovery validator enforces the same limits. Saved named tools capture width/opacity, preserve them across process restart and apply them explicitly to new ink. Manual width/opacity changes clear a pending preset. Custom fractional preset percentages retain an accurate option label; no silent integer rounding of a 12.5% style. Changing supported standard ink opacity externally now also makes it non-editable/preserved, alongside path/width changes (A-D4).

Independent PDF.js preview verifies standard InkList, BS width and CA opacity. This caught A-D5: a wide horizontal stroke's half-width bounds made PDF.js discard its BS width. New bounds include sufficient full-width dimensions and shift inward at crop edges; pages too small for the chosen width refuse it. Source cases cover all crop edges and refusal. Output source checks inspect standard dictionaries, the decompressed appearance's stroke width and ExtGState opacity, editable metadata, legacy defaults, malformed styles and foreign opacity changes.

Verification: 13/13 focused source tests pass. Final built hidden Electron regression passes 8/8 (1.3 minutes): pen-only input/movement, explicit touch/cancel/delete, all prior markup types, annotations/printing choices, 90/180/270-degree crop/flatten preservation, minimum window and failed-recovery rescue; plus the new styled-ink case. Styled case proves a near-edge wide stroke, restart recovery, saved preset restart/reuse, selected-style edits/Undo/Redo, native save, independent standard dictionary readback, app reopen and identical editable-versus-flattened raster within the existing 24-level tolerance. Original unchanged, owned apps close. Additional targeted fractional preset check exercises a 12.5% saved style and its option label/Undo on the same final style flow.

Earlier runs found two test errors (incomplete saved-tool option label, generic canvas selector also matching an empty thumbnail canvas), corrected in the test. One intermediate run had app startup/readiness timeouts; rerun passed without weakening access or containment. The real wide-bound failure was fixed rather than relaxing width verification. Locked test builds pass; no outside viewer or physical pen/pressure claim. No dependency, bridge, FileStore, app shell or architecture changes.

Left alone: Claude's active editor paragraph/indent/paste/RTF/PDF work and tests, watched-folder manager/storage, master remaining-work/scope/inventory docs, and request/coding notes. Remaining: pressure-sensitive strokes and device palm/high-DPI acceptance, partial/sweep erasing, configurable highlighter opacity, real large drawing/memory corpus and outside Revu/Acrobat/printer acceptance. Integrator's native build/check coordination request and final build remain open.

Fractional preset follow-up passed on final build in 12.9 seconds: preset opacity 12.5% applies as 0.125, displays 12.5%, survives Undo, and later selected edits/native output/reopen still pass. Raster comparison initially used responsive preview height and compared different dimensions; fixed both preview width/height and waited two layout frames, retaining the same pixel-difference criterion. No renderer/output workaround. Current test build has renderer index-wZMNPxio.js; broad 8-case regression passed immediately before the percentage-label-only change, with the targeted final scenario rerun afterwards. All owned apps closed.

### Continuous lane run: highlighter, partial erasing, pressure and integrity checkpoint

User requested completing the remaining Codex lanes in one continuous run without keep-going checkpoints. Continuing after this commit into reader memory/navigation/layout and Drawing/Pages acceptance. The work register is `docs/CODEX-LANE-COMPLETION-2026-10-13.md`; it preserves pending external/hardware/integrator work without taking over Claude's converters/editor/shell.

Highlighter opacity 10–100% now flows through new/selected controls, Undo/Redo, recovery, reusable styles, standard CA and appearance ExtGState. Older highlights keep 30%. Partial/sweep erasing cuts exact InkList segments against rounded sweep capsules, previews fragments without changing the draft, disables output saving until Apply/Keep, supports one Undo/Redo step and retains original style/text/first identity with new identities for further fragments. Work/point/count budgets refuse an oversized operation rather than publishing a partial result. Calculations use the existing worker; the clean shared worker dispatch was additive and committed alone as `103ec5e`, after tested geometry commit `8391a15`.

Reported pen pressure is bounded/quantized per point (at most 1,000 samples), optional in the existing ink records and validated in recovery. The variable width is 25–100% of selected base width; a single polygon appearance avoids dark overlapping translucent stroke segments. Live preview, standard InkList/BS/CA, pressure metadata, editable save/reopen and flattening remain consistent. Mouse/missing-pressure input explicitly falls back to uniform width. Named ink presets retain the pressure mode. Partial erasing accounts for linearly varying pressure width and interpolates new endpoint samples. No physical pen exists on this machine per user; CDP input is simulated evidence only.

New outputs include an appearance digest over normalized appearance dictionary/resources, encoded bytes and supported metadata. Changed bytes/state/metadata remain foreign/non-editable, preserving them in later copies (A-D6). Legacy outputs without a digest retain narrower existing checks; no authenticity claim. Pressure records require this provenance digest. Maximum supported per-mark metadata rises from 50,000 characters to a bounded 65,536 for pressure samples; whole-file/point limits remain.

Verification: 20/20 focused source tests and final 8/8 hidden built-app scenarios pass (about 1.1 minutes). New app scenarios prove opacity edits/preset/standard CA; eraser review/cancel/apply/Undo/Redo/native output; simulated pressure metadata save/reopen, pressured erasing and explicit mouse fallback; pressure preset mode restoration. Existing all-markup, annotation/print-choice, 90/180/270 crop/flatten/minimum-window and failed-recovery/rescue cases pass. Earlier pressure test hit a worker-load failure; retry reached an eraser gesture whose start was under the sticky header after preview scrolling. Moving its start below the header and asserting actual pointer capture corrected the test. No source/containment validation was relaxed. Owned apps closed; locked builds pass.

Reader retention probe: `scripts/check-reader-retention.mjs` produced `tmp/reader-retention-RXyd4f/report.json`. Generated 120-page PDF, three repeated open/continuous-jump/Home cycles, diagnostic-only GC and final heap retainer scan. Home baseline 306 nodes; each later Home 316 nodes; final snapshot has no retained reader/multi-page/search/readable/TextLayer objects. JS heap rises from 3.3 MiB before first library use to about 6.3 MiB after three cycles; process working sets remain higher and are not a leak diagnosis or total physical-RAM claim. Original unchanged, no renderer errors, app closed. Larger/private/native profiling remains; no speculative cleanup fix introduced.

External prerequisites: Acrobat is installed, but PDDoc COM fails E_NOINTERFACE in both PowerShell runtimes; no Acrobat-view/round-trip pass. User has no pen and has a printer. Epson WF-3820 queue is registered; its current status is nonzero (131072), with no queued job observed. No physical test job sent yet, and no paper/measurement claim. Real Revu/proprietary fixtures remain missing. Claude's active paragraph/Word import/paste/RTF/PDF work, watched-folder files, master ledgers and own handoff stay untouched.

## October 14 — physical sheet revision proof

Existing Organize pages → Preserve comments / links: reorder original → Replace sheets and carry comments forward was tested, without replacing its implementation. `tests/desktop/drawing-sheet-revision.spec.js` passes 1/1 in hidden built Electron with native inspection/preparation/save and isolated profile, then closes all its windows. Independent pdf-lib disk readback proves original page identity, exact parent/reply/link dictionaries (including private fields), four active annotations after donor comment import, new artwork Contents reference and exact untouched second-page dictionary. Both input files remain byte-identical and no renderer error occurred. This is generated-fixture built-app evidence; no real Revu, Acrobat visual or physical print acceptance is claimed.

`tests/pdf-page-revision-boundaries.test.cjs` passes 3/3: geometry mismatch refuses retained comments but explicit omission permits changed artwork; incomplete reply groups and protected comments refuse carry; changed inputs and duplicate physical mappings refuse output. Existing locked/read-only protection remains. Left alone: geometry alignment/transforms, proprietary custom columns/BAX/BTX, Claude lanes and final integration build. User reports a printer and no pen; physical pen acceptance remains unavailable.

## October 14 — region order and larger lifecycle probe

Readable view now offers Reviewed region order: 1–20 percent rectangles in explicit order, selected by source run center. It retains exact source fragments/search ranges, refuses duplicate selection, reports omitted runs, keeps region choices only per page in the current PDF session and clears them on disposal. Geometry ordering is not semantic table reconstruction or vertical/tagged interpretation. Eight layout source tests and six hidden built-Electron readable checks pass after the locked 404-module build; source unchanged and app closed. Report: tmp/reader-readable-HJAjpi/report.json.

Retention script now accepts bounded 2–500 pages / 1–10 cycles and reports Windows private memory separately. Five 500-page cycles pass unchanged-source/error/close checks; Home DOM stays 316, final diagnostic heap 6.43 MiB, zero retained reader-class objects. Summed private process memory baseline 180.7 MiB, open samples 298.6–362.9 MiB, Home samples 211.1–362.2 MiB. The final elevated native/private allocation remains unresolved; this does not close A-R2 or prove a release memory gate. Report tmp/reader-retention-zHkdak/report.json.

User authorized a bounded metadata command in the existing contained native protocol on October 14, with smooth/fast behavior as the priority. No new permissions, parser or unrestricted fallback is authorized by that choice.

## October 14 — large-file bookmark prototype, paused at user request

User approved extending the existing bounded contained protocol, then asked to stop after this item and produce a combined progress document. Added native NAV:UUID:0 metadata through the existing pinned output slot; broker allowlists request/response with 2 MiB output and existing memory/deadline gates. Native traversal bounds pages (25,000), handles (60,000), named destinations (4,096), outline nodes (1,000), nesting and strings; destinations normalize original page refs to zero-based indices, unsupported actions stay disabled. Source hash pins updated; no dependency, sandbox capability, new bridge, external access or unrestricted parser added.

IMPORTANT: this remains experimental and disabled by default. Only PDFIX_PAGED_NAVIGATION=1 opts in. Locked native build passes and two metadata boundary source tests pass. Built-app acceptance did NOT pass: first broker gate was missing and corrected; a subsequent run showed the metadata-enabled outline and rendered initial artwork but the repeated page-view run reported staged source changed. Later app launches (including nine established reader cases) all closed before firstWindow. An owned startup-only diagnostic shows repeated GPU process exits and GPU process is not usable fatal termination. No established reader regression pass is claimed for this checkpoint; the startup failure cannot be assigned to reader code from this evidence. All own checks ended; no other agent processes were terminated.

Resume by restoring stable hidden-app startup, proving original staged identity during NAV then PAGE, and testing direct/named bookmark jumps. The experimental test is skipped unless explicitly opted in; skipping is not acceptance. Original-page link metadata, page labels and document-wide search remain unavailable in native paged reading. Keep default on-demand reading unchanged until the experimental test passes. Shared sandbox request/response changes were committed immediately and separately (e7bf96f,31b3506).

## October 14 resumed — native bookmark acceptance

User resumed the remaining reader/Drawing/Pages work. Current Claude Save work in main/preload/file-store/verified-output/editor and watched-folder files is dirty and untouched. Hidden app startup now works: 10/10 built reader/navigation/native-bookmark cases pass in 52.1 s, each app closed. Native bookmark case uses a local temporary profile, waits for initial continuous artwork, switches to Page view and reopens Tools & view before showing the navigation pane. The old test had tried a hidden Pages panel control after changing views; correcting the actual UI sequence permits direct last-page and named middle-page jumps, refusal of JavaScript bookmark, seven further physical page jumps, unchanged input and no renderer error. No security/source-identity check was weakened. Earlier GPU/staged-identity failures remain historical, not a current reproduced diagnosis.

Bounded native outlines now enabled by default; PDFIX_PAGED_NAVIGATION=0 is an explicit opt-out. Metadata deadline is 20 seconds; non-security metadata failure retires that contained session and restarts contained page-only reading. Changed sources/cancellation/unsafe sandbox state still fail closed. Truncated metadata has a visible notice; FitR null coordinates are rejected. Twenty focused reader source tests pass. Locked build first failed because the shared sandbox executable was in use; after its process ended, retry passed (404 modules), with no other agent process terminated. Still missing: original-page link metadata, paged labels/whole-file search and real large-drawing corpus. Memory diagnostic is continuing with main-process Node heap/buffers added.

## October 14 resumed — large disk path, tags, sample and memory

Native retained session: scripts/check-reader-native-session.mjs passes 70 independent one-page PDF readbacks on both a small 200-page generated PDF and a 335,657,848-byte generated PDF containing 320 MiB of unused stream payload. Original hashes unchanged; parser retires after 64 pages and restarts (2 starts); session cleaned up. Large fixture report: C:/Users/andre/AppData/Local/Temp/pdfix-reader-native-n8TVxs/report.json; page extraction/readback p95 about 10 ms, max about 152 ms, native parser private memory sampled at most 22 MiB. This validates a disk-backed size path, not real image-heavy engineering resources. scripts/check-reader-large-file.mjs passes 7 built-app checks on that file (capacity response alone simulated at 256 MiB), native bookmark to sheet 200, distant jumps, zoom and Home; open about 3.47 s, source unchanged, app closed. Report C:/Users/andre/AppData/Local/Temp/pdfix-reader-large-app-NUGhIP/report.json.

Declared PDF tag order added to readable view. Bounded marked-content/tag traversal, source mapping equivalence, duplicate-source refusal, untagged/unresolved-reference disclosure, 20-second deadline and stale-view/disposal cancellation. It does not invent OCR, tag semantics, merged cells, vertical text or image descriptions. Source segmentation differences refuse tag mapping and suggest other orders. Three tag source cases and 15 combined readable source cases pass. Final tagged-order and native-bookmark app group passes 2/2, including exact search word, opposite stream/tag paragraph order, rapid tagged→rows replacement and an untagged second-page message/fallback. Existing readable script passes 6/6 on final build (tmp/reader-readable-kbK4r2/report.json); overlapping regions now retain previous reviewed text instead of losing it. All own apps close. Locked build passes 405 modules.

Real supplied drawing: user provided a private file in Downloads. It is byte-identical to the existing samples copy (SHA256 034525620271fd4e983b8df9150231f48439d48b78e62ab279bc2b48329a16a7). Native comment inventory, page navigation, zoom and Home pass on both locations; zero annotation objects. This is artwork/navigation evidence only and cannot prove editable Bluebeam comments. User has no Revu. Downloads report C:/Users/andre/AppData/Local/Temp/pdfix-drawing-sample-7NAnHc/report.json. Document contents are treated as data, never agent instructions.

Five-cycle 500-page diagnostic now records Node memory too: main heap about 7.8–8.1 MiB after Home (9.4 baseline), array buffers round to 0 MiB, external memory 4.5–11.4 MiB. Main private allocations fluctuate about 114–178 MiB; renderer private about 76–90 MiB. Stable Home DOM 316, no retained reader-class objects, no errors/changed source, app closed. This narrows JS/buffer retention; native allocation/real-corpus release gate remains open. Report tmp/reader-retention-xKo9qr/report.json.

### Requests for the integrator — resumed build coordination

Repeated builds hit CS0016 while another broker held the shared sandbox executable; failed build left an incomplete test bundle, so those subsequent UI attempts were not accepted as feature regressions. Clean shared scripts/build-native-sandbox.mjs now reuses only unchanged reviewed-source/manifest/executable SHA256 matches, bounded plain files, and MZ prefix. Committed immediately as 08e11b8. Missing/stale/changed artifacts compile normally; source pins remain. A live owned broker reuse check passed without changing executable mtime/size, then 70 extractions/retirement/cleanup passed (C:/Users/andre/AppData/Local/Temp/pdfix-reader-native-AWa71W/report.json). For final clean packaging, set PDFIX_FORCE_NATIVE_BUILD=1 with both lanes quiet; reuse is local build caching, not binary authenticity/release proof. No other agent process was terminated. Claude Save/editor/shell/shared file work was left untouched.

## October 14 resumed — native page labels and supplied-drawing ink

Native on-demand reading now retains bounded embedded page labels through the same NAV metadata slot: sorted number-tree ranges, decimal/Roman/alphabetic styles, prefixes and starts; malformed/cyclic/unsupported/excessive tables are conservatively omitted with truncation notice. Labels are capped at 25,000 pages, 1 MiB UTF-8 and bounded prefixes/style output. Sheet-label navigation now works in paged reading when exact labels are present, including beyond page 500; reader label display no longer truncates to the first 500. Native source pin updated. No new permissions/parser/bridge. Source metadata tests pass 3/3. Locked final build passes 406 modules. App group passes 2/2: native labels i on initial open, A-248/A-499 with exact sheet jump to physical 501, all Roman/alphabetic styles, bookmarks and further jumps; existing tagged/source/cancel/untagged scenario passes. Unsupported label style is omitted while bookmarks and 70 contained extraction/readbacks still pass (report C:/Users/andre/AppData/Local/Temp/pdfix-reader-native-TZWXrj/report.json).

Pressure test now accepts PDFIX_DRAWING_SAMPLE to copy an actual drawing into its own test folder. With the supplied Downloads path it passes pressure preset/save/reopen, partial erasing and uniform mouse fallback in 9.7 s; both test source and Downloads original are compared byte-for-byte afterward. Native saved copies read back independently. This is actual source-artwork compatibility with simulated input, not real pen/palm/Revu acceptance or imported comment editing. User original unchanged.

## October 14 resumed — original-page internal links and cancellation

Paged reader now retrieves bounded per-page internal-link metadata through NAV:UUID:physical-page in the same contained parser, same output slot and same source identity fence. Broker separates PAGE versus NAV responses and checks token/kind (shared clean additive change f4bff48). Native reader normalizes original indirect page refs/named GoTo destinations to physical indices and retains visible link rectangles/flags. Hidden/no-view links, scripts, mixed Dest/action declarations, chained actions, additional actions, remote/files/web targets and unsupported destinations are omitted with an explicit review notice. No scripts, websites or embedded files are opened. The ordinary reader link path remains. Per-page metadata shares the four-page/48 MiB serialized cache accounting with extracted bytes; cancellation uses the same request token, uppercase UUIDs normalize, malformed metadata retires its contained session and safely falls back to page-only reading. Security/source/cancellation failures remain closed.

Final generated 501-page app fixture passes direct/named outline jumps, every label style, exact physical-501 label jump, repeated physical jumps and two original-page internal link jumps to 501/250. Two safe links are offered; hidden/script/mixed/chained/additional-action cases are not. Source unchanged, no renderer errors and app closed. Tagged-order scenario also passes (2/2 app group); established reader suites pass 9/9 in 18.7 s. Native metadata/protocol source tests pass 6/6, with wrong kind/token, over-limit payload and non-ASCII stdout refusal. Final readable check passes 6/6 at tmp/reader-readable-hPtIrz/report.json, now also proving region choices survive page changes. Full reader disposal still clears region drafts and cancels pending tagged work.

Final 320 MiB controlled-source native probe completes 70 independent readbacks, 64-page retirement and cancellation during NAV followed by successful page read 71; original unchanged and owned session cleaned. Report C:/Users/andre/AppData/Local/Temp/pdfix-reader-native-WUIcaI/report.json has metadataCancellation=true and recovered parserStarts=3. This is contained native evidence separate from app/real outside software. Locked final builds pass 406 modules; one build retried automatically after another agent saved. No other agent process was stopped.

Requests for the integrator: the reader toolbar now permits the read-only links action when reader.doc.nativeLinkReadingAvailable. The shell Actions panel still uses its whole-source action predicate; consider the same narrow links exception in src/app.js pdfAction, without enabling transformative tools. Left untouched: Claude’s shell/editor/rich-document/watched-folder files and master trackers. Remaining: whole-file search in native paged mode, native/private memory profiling, complex vertical/RTL/tagged corpus, plain/rich/locked comment preservation adapters and real BAX/BTX/custom-column/Revu evidence, sheet alignment transforms and hardware/release gates. The supplied real sample has no annotation objects and user has no Revu/pen; its artwork/ink checks do not certify those external gaps.

## October 14 continued — Find on the displayed on-demand page

Committed in 5bf9488: explicitly scoped Find using only selectable text already rendered by the reader. Continuous/facing reading switches through the normal viewer route to Page view. Search itself never dispatches getPage/native extraction or walks the source. UI scope, Ctrl+F, F3/Shift+F3, exact character highlights, empty/no-match results and page-change invalidation are supported. Whole-document native paged search remains unavailable; copy restrictions still gate search. No shared bridge/parser/dependency or Claude files changed.

Verification: 11 focused source tests pass. Locked build passes 406 modules after its normal retry when another agent saved. The established reader/navigation/outline/tagged scenarios pass 11/11. New generated 501-page built-app check searches first and last pages and independently counts real native page invocations: no extra extraction while searching or moving among matches, exact highlighted text is needle, original bytes unchanged. Initial test focus outside the reader was corrected. During the combined run the new case once did not finish opening (page total unavailable); isolated rerun passes in 3.3 s, closes normally, no renderer errors. Do not call the combined 12-case run all-pass. Startup/native coordination remains an intermittent acceptance gap. Known-issues A-R5 was updated before the feature commit; a concurrent integrator commit captured that shared documentation line.

Left alone: Claude editor/shell/RTF/watched-folder and master trackers/final integration. Integrator request: shell Actions may still use native-paged availability predicates for Find/links; toolbar and Ctrl+F provide page-scoped Find. Whole-file tool guards remain.

## October 14 continued — FreeText additive reply preservation

Added a controlled FreeText fixture with a real vector/text Form appearance, font resources, rich text and private parent/appearance fields. New source coverage proves ordinary, locked+lockedContents and rich-text parents retain their exact dictionaries, original appearance bytes/dictionaries/font resources while receiving additive Unicode replies. Body edits stay refused, and read-only parents refuse replies. These tests exercise the existing preserving writer; no production restriction was loosened and no new adapter or dependency was introduced.

Built hidden Electron now proves rich FreeText's Edit plain comment control is disabled, Add reply/review entry works, Unicode author/body plus Accepted status pass native construction and independent reader verification, the user-reviewed copy saves, original parent/AP bytes stay identical on independent pdf-lib readback, and app reopen shows the correct reply/status/parent text. Source unchanged, no renderer errors, app closed. New app case passes 1/1 in 10.4 s; source FreeText plus established reply/XFDF group passes 13/13 including nested cases. No Revu/Acrobat or physical-device claim. This narrows the unproven reply path; FreeText body regeneration, proprietary exchange/columns and real marked-up corpus remain open.

## October 14 completion pass — whole-document on-demand search

Entire PDF scope now scans one independently extracted page at a time through the existing contained native route. Each text worker receives only a validated <=32 MiB one-page copy and is destroyed afterward; the full original is never loaded by the search worker. Text limits and 10,000-match cap remain. Search text is not accumulated in the reader index. Native/source SHA and page identities are checked before consuming each page. Stop aborts native/text work; navigating gives priority to viewing and pauses the scan; Continue resumes from the next unfinished page, keeping earlier results. Continuous mode switches to Page view to avoid competing nearby-page preparation. Page-only Find remains the default and reads only finished viewer text.

Corrected an important test instrumentation mistake: earlier page-only extraction counters watched read-paged-pdf rather than the actual pdfix:read-paged-pdf channel, so their empty-array equality did not prove absence of extra extraction. The corrected tests assert native calls actually occur and monitor the real handler. Final two built-app cases pass in 47.1 s. Whole-file fixture searches 501 pages, stops/resumes, navigates to page 250 during scanning and continues, finds first/last matches, independently verifies exact needle highlighting and F3 wrap, retains unchanged original and closes normally. Resumed full scan took 39,257 ms. Report C:/Users/andre/AppData/Local/Temp/pdfix-search-all-jg1V9r/report.json. Thirteen focused source cases pass, including hash/identity refusal, cancellation, oversized text and worker destruction. Locked build passes 407 modules. First whole-file run completed its scan but failed the counter assertion; corrected final run passes. No shared IPC, native protocol, dependency or Claude-owned file changed.

This completes selectable-text whole-file search functionality in native paged mode within the existing extraction limits. OCR/scanned text and real huge engineering-corpus memory/performance acceptance remain separate.

## October 14 completion pass — plain FreeText body appearance adapter

Eligible plain rectangular FreeText bodies can now be edited with a real regenerated normal appearance, not just a changed Contents field. The composer explains that declared font/style is rebuilt and custom appearance decorations are not reproduced. Native checks require a bounded declared Core-14 Type1 font with ordinary encoding, supported gray/RGB text color, finite rectangle, solid border, supported alignment and page scale/rotation. Rich text, callouts/insets, rotated/translucent boxes, locked/read-only contents, custom/embedded fonts, unsupported glyphs and text that would clip are refused. Unicode replies remain available where body-font encoding cannot represent the text.

The retained-object manifest permits AP only for the declared FreeText target; all old appearance/font/private objects stay exact. New AP/font refs and appearance hash/text are strictly validated and reloaded; independent PDF.js checks replacement appearance characters and the app requires actual before/after visual review. Fifteen review/XFDF/FreeText source cases pass, including overflowing/custom-font/callout/glyph refusals and all-original-object retention. Both FreeText app cases pass native preview/save/reopen (10.6 and 11.1 s), retaining source bytes and private metadata, no renderer errors, apps closed. Existing decoration case passes. Existing portable-reply case failed once opening its saved copy, then passes alone in 10.6 s; the recorded error was a failed dynamic fetch of pdfix://app/assets/pdf.worker-TGcf_-kp.mjs, providing an asset/worker startup diagnosis rather than a FreeText preservation error. Further opening diagnosis remains. Locked build passes 407 modules. No dependency/shared bridge change.

## October 14 completion pass — artwork alignment for different sheet geometry

Reviewed fit/scale/offset alignment now embeds replacement artwork into the original sheet coordinate system. Source page boxes/rotation, comment/link coordinates, identities, private data and appearance streams remain unchanged. Original resources are retained and a new artwork XObject is added. Alignment requires matching rotations/UserUnit 1 and explicit omission of replacement comments; it does not guess coordinate transformations for imported annotations. Uniform fit has a 0.1–10 multiplier and bounded point offsets; wholly invisible placement and invalid scales/coordinates are refused. The existing exact-geometry route remains.

Five source boundary cases pass, including independently extracted text coordinates after a .5 scale and offsets, all-original-nonpage-object retention, protected groups, mismatched rotations, untransformed imported comments, nonfinite/out-of-bound values and invisible placement. Both exact and different-geometry built-app revisions pass native save, three actual previews, independent preserved parent/reply/link/private-field checks, unchanged second page and both source files, followed by app reopen and NEW SHEET text readback (12.4/12.3 s). New generated page-content streams are canonicalized to exact raw encoded streams before preservation fingerprinting; no original stream payload changes.

One locked build failed EPERM while Vite emptied dist/native; retry passed 407 modules, without stopping another agent's process. This reinforces the integrator request to isolate running test assets from mutable dist. A previous concrete opening failure was a missing dynamic PDF worker module during saved-copy reopen; exact rebuild overlap is suspected, not yet independently proven for every historical opening failure.

## October 15 — readable directions, isolated tests and corrected memory evidence

Added reviewed right-to-left two/three-column ordering and vertical columns (right to left, top to bottom), retaining source character mappings. Ten layout source cases pass; the generated built Electron direction case passes after replacing a racing immediate highlight assertion with polling for the actual completed R2 highlight. Ruby, mixed orientations, merged-cell semantics and real multilingual corpus remain unproven.

Reader acceptance tests now capture a bounded private copy of the successful built runtime (manifest/hash checked, no symlinks, at most 5,000 files/one GiB). Rebuilding mutable dist cannot remove assets under these tests. Four native FreeText/revision acceptance cases pass with isolated assets. This addresses test asset mutation; it is not a release packaging or all-opening-failures fix.

Correction to earlier memory notes: matching class names in a minified heap snapshot did not establish absence of retained reader objects. Earlier DOM, heap and process measurements remain measurements; earlier zero-retained-class claims are withdrawn. The replacement probe identifies live reader/search/readable/multi-page/TextLayer objects by shapes and prototype identities, requires positive controls, and tests final retention against those prototypes. Its synthetic collision/retention unit test passes. Revised Electron five-cycle verification did not complete: source-staging validation refused one Drive-staged run, then local-profile/private-runtime attempts closed before firstWindow. Captured stderr shows six GPU crashes with 0x80000003 and fatal GPU initialization failure; --disable-gpu did not cure it. Reports: C:/Users/andre/AppData/Local/Temp/pdfix-reader-retention-tloODN/report.json and pdfix-reader-retention-csVBC1/report.json. No new app memory pass is claimed; all owned test processes closed.

Requests for the integrator: investigate global GPU startup in the shell/Windows environment; retain fatal stderr and distinguish it from missing worker assets. Coordinate in-app checks between agents. Consider immutable/atomic production asset replacement separately; these reader tests only isolate their private runtimes. No shared shell, dependency, production GPU flag or sandbox change was made. Claude's dirty editor/watched-folder files were left alone.

## October 15 — supplied real Revu drawing, preservation and native search corpus

Found the newly supplied root-folder PDF, SHA-256 c6ca373bb20f98c8fe7ac1a4c4249c45d59bdff2659c635723c176b2cd797fb0, 37,881,918 bytes, 163 sheets. Poppler identifies Bluebeam Revu x64/PDF Library 21, PDF 1.7, unencrypted; the source is gitignored and never staged or written. It contains 1,372 annotations, including 300 FreeText, 565 links, and 131 optional-content groups. This is materially different from the earlier one-page sample with zero annotations.

Added read-only literal custom-column inventory, validation, search and JSON retention. Three definitions (Issue, Action, Severity), bounded choice tuples and 762 annotation value rows are visible as raw source slots. Values do not consistently match same-index named definitions; the UI explicitly marks association unverified and never remaps guessed business statuses. Formulas/actions are not evaluated. BAX/BTX or external custom-column XML were not supplied and no proprietary writer is claimed.

The real source exposed stale destination refs to removed sheets. The narrow adapter tolerates only recognized bounded inactive destination arrays, keeps those refs unchanged/unavailable and warns; unrelated unresolved objects remain refused. Reply preservation previously mistook long indirect-reference paths for deep direct nesting; indirect objects now start at depth zero, retaining the 100,000-object/300,000-node/80-direct-level limits. New tests prove a long indirect chain is admitted while a deep direct structure and unrelated missing refs still refuse.

Verified through contained native services (not Electron): scripts/check-reader-real-review.mjs inventories all sheets in about 3.4 s and, with PDFIX_REAL_REPLY=1, creates only a clearly labeled temporary verification reply copy. C:/Users/andre/AppData/Local/Temp/pdfix-real-review-H0sIno/report.json records native preservation pass, 1,373 output annotations and unchanged original. Its older scope label predates the optional-reply wording correction; it does include a real temporary additive reply. Independent bundled Python/pypdf readback confirms 163 pages, every original annotation dictionary exactly equal by canonical PDF object value, all column definitions unchanged, 131 layer entries retained and exactly one labeled test reply. No outside Revu edit/open was performed. Poppler renders the original and output first page; I viewed both engineering cover sheets and visible markups. Missing local display-font warnings prevent a font-fidelity claim. Scratch copies/images are not deliverables or source edits.

scripts/check-reader-real-paged.mjs independently prepares and reads back every one of the 163 sheets through the existing contained parser, using local temporary staging and a verified private runtime. Three parser starts demonstrate retirement/restart; peak reported parser private memory is 48 MiB. Native-only report: C:/Users/andre/AppData/Local/Temp/pdfix-real-paged-pDZEOb/report.json. With PDFIX_REAL_TEXT=1, the real extractedPageSearchText helper also runs on every extracted sheet in disposable Node PDF.js documents, verifying source/page hashes and text bounds: 328,752 characters, drawing on 117 sheets, 9,046 ms, service closed and original unchanged. Report: pdfix-real-paged-AaBfg9/report.json. That first run warned about missing standard-font configuration; corrected Windows slash formatting and a final font-configured run passes (pdfix-real-paged-Ti3uCD/report.json). Remaining TT/NaN/cm warnings originate in source/font parsing and prevent claims of perfect artwork or semantic fidelity. These are native/Node search-core checks, not Electron rendering, scroll latency or full-process memory proof.

Fifty-nine focused source tests pass across search, readable mapping/tags, review/FreeText/raw columns/stale links, paged metadata/protocol, alignment and heap diagnostics. The five directly changed column/stale-reference tests pass again after the aggregate literal budget fix. Locked test build passes 410 modules. New tests/desktop/reader-real-engineering.spec.js is ready for a quiet run with the optional local sample, but the attempted run failed before firstWindow with A-R4 GPU crashes; real-file panel/navigation acceptance is explicitly not claimed.

Remaining boundaries / requests for the integrator: diagnose global GPU startup; coordinate window checks and make the final combined build when lanes are quiet. Proprietary BAX/BTX round trips need genuine exports/documented schemas and outside Revu acceptance. Real rich/callout/custom-font FreeText bodies remain protected; the plain body adapter is proven only for its declared styles. Layered replacement sheets still refuse rather than dropping their catalog semantics; this file has 131 layers and is not proof of layered sheet replacement. Arbitrary rotation/annotation transforms, merged-cell/ruby/mixed-orientation reading, full Electron corpus retention, printer and pen acceptance remain. Claude's editor, shell, converters, shared bridges and dirty files were left alone. No dependency, native protocol or production sandbox changes were made.

## October 15 — functionality first, startup isolated beyond PDFix modules

User clarified that workspace organization/redesign is for later; continue functionality and existing feature closeout in the assigned lanes. No workspace or visual rearrangement was made.

Added scripts/check-reader-startup.mjs, a sequential hidden diagnostic with fresh local profiles, bounded stderr, an owned-process watchdog and timeout close. Default compares a minimal offscreen/software Electron page containing no PDFix modules with the private built app. Both fail before firstWindow with repeated GPU 0x80000003 crashes. Report: C:/Users/andre/AppData/Local/Temp/pdfix-reader-startup-2kQojY/report.json.

Additional controls use standard hidden windows (offscreen false), software and default graphics. A brief default-graphics control initially created a window, but that was too weak to count as startup. Strengthened the check to require an actual screenshot and a responding renderer after one second; both controls then fail. Final control report: pdfix-reader-startup-2JmOwK/report.json. Also attempted unchanged PDFix normal-graphics mode through a test-only bootstrap that intercepts window.show/showInactive so no window is displayed; it too fails (pdfix-reader-startup-1otJF7/report.json). That bootstrap is diagnostic only and has not become an acceptance bypass. No full reader acceptance or production fix is claimed.

Fresh profiles show persistent GPU cache sharing errors as well as fatal GPU crashes; these may be consequences, not the cause. Failure in controls without PDFix code narrows investigation beyond reader/native PDF parsing, but does not identify the responsible Windows/runtime/driver component. All owned apps closed; no other processes were stopped. Do not repeat unchanged GPU attempts. Requests for integrator: investigate the shared Electron/Windows graphics startup path using these controls; do not claim success from firstWindow alone and do not weaken GPU/renderer security to get passing tests. Existing native corpus/source proof remains separate. Claude's dirty files and all shared shell files remain untouched.

## October 15 — deferred Add-ons intake, main-app scope retained

User supplied 30 additional features and explicitly placed them in an Add-ons/first-update phase when the main app reaches human testing, alongside the deferred Bluebeam workspace/features. Saved all 30 with their descriptions/priorities and local ADD-01 through ADD-30 identifiers in docs/ADD-ONS-FIRST-UPDATE-BACKLOG-2026-10-15.md. This is planning intake, not authorization to start the implementations now or a claim that all are wholly absent. Potential overlaps with existing tools require review before coding. No existing non-Bluebeam main-app requirement was deferred by this intake.

Requests for the integrator: link the intake from the master plan and scope ledger after your current tracking-file edits are committed; reconcile overlapping requirements without double counting. Main-app functionality, supported file formats and human-test bug fixes remain the priority. All 30 plus Bluebeam are substantial future work and may need multiple batches; no completion date or small-update-size promise was made. Application code, dependencies, shared/dirty tracking files and builds were left alone. Verification was document-only: 30 unique sequential IDs with 14 High (including High for research), 14 Medium and 2 Low entries.

## October 15 — main-app reader and Pages coding closeout

User now prioritizes the general main app and all its agreed file workflows; Bluebeam-specific features/workspace and the new 30 Add-ons are deferred. The scoped closeout record is docs/CODEX-MAIN-APP-CLOSEOUT-2026-10-15.md. No existing non-Bluebeam requirement was waived and no broad whole-app release claim is made.

Fixed a real fast on-demand Find race. Opening Find reflows a fitted page; a query submitted before text layout finishes could refuse with Wait for selectable text. Find now finishes the display render and rechecks source/page/search generation before consuming text. The focused reproducer fails before the fix and passes after it, with no extra native extraction for page-only Find. Final combined acceptance also proves newer navigation supersedes the query, whole-PDF Stop/Continue, a paused jump, every one of 501 matches, exact last-match highlighting and F3 wrap (505 native read calls, 33.5 s).

A new direct native-process controller runs the unchanged built hidden app without the browser-test loader/debugging flags that were crashing. Actual native file bridges, render/search/writer code, mouse/keyboard and DOM controls are exercised; only file dialogs are substituted. Final combined run passes 15/15: reader basics, pane reflow/focus/reload preferences, real organization/combine/rotate/save/reopen, empty-plan refusal/reset, compression save/reopen, three-sheet print preparation without spooling, and 501-page on-demand search. All input hashes unchanged and app exit 0. Report: C:/Users/andre/AppData/Local/Temp/pdfix-reader-closeout-NYvxSJ/report.json. Independent Python/pypdf checks confirm organized first/last text, three pages and 90-degree first rotation; compressed copy retains text, both links, named destination and Service history outline targeting physical page 3.

The final inspected screenshot exposed overlapping reader-menu dropdowns/buttons and horizontal overflow. Fixed sizing/wrapping in reader-owned CSS within the existing groups. Subsequent 10/10 core app cases pass at 800x620 and 1280x850, with explicit menu/artwork containment and a viewed final screenshot (pdfix-reader-closeout-O3I6gV/report.json). Only the reader case in the shared layout spec was updated; Claude's other two cases were left alone. The native equivalent passes; no new Playwright pass is claimed while its graphics startup remains unresolved.

The final scoped source/native suite passes 129/129 (tmp/reader-closeout-source.log). New heap diagnostics identify live minified reader classes by property shape/prototype, stream snapshots within 100 MiB, and parse them externally after app exit. Failed diagnostic-file creation closes cleanly and removes its chunk listener. Five generated 500-page lifecycles pass with no retained reader instances, renderer heap 4.5 to 4.8 MiB, stable Home DOM, and final summed private process memory 265 MiB vs 234 baseline (an intermediate higher sample drops again). Report: pdfix-reader-closeout-ZPGt2G/report.json. Three supplied-PDF reader lifecycles also pass with unchanged original SHA and no retained reader instances (pdfix-reader-closeout-MPGOYw/report.json), but summed Home private memory grows 242 to 613 MiB. Browser private allocation grows most; do not call the native-memory release gate complete or hide it with production forced GC.

Requests for the integrator: keep A-R2 native/private memory and A-R4 graphics/old-driver diagnosis open, use these direct-app checks as additional evidence, and perform the final quiet combined build/source-manifest check after both lanes are committed. Source/hash guards refused a mixed runtime; a native executable-lock build failure passed after its holder ended, without stopping other agents. Standard builds pass 410 modules. Actual printer/visible Windows/high-DPI/assistive-technology and broader semantic/corpus checks remain human/release gates. Bluebeam expansion/Add-ons remain deferred; manual readable geometry is not universal merged-table/ruby/mixed-orientation reconstruction.

Left alone: all Claude editor/shell/converter/shared-native files, dirty master trackers, dependencies and production security/graphics settings. No app window remains from the checks. Test profiles/copies/heaps/private runtime snapshots are verification scratch, not dad/release deliverables. The last report-field-only controller update adds snapshot provenance and removes an unused option; application behavior is unchanged from the verified run.

### Final memory comparison: hidden layout control

Normal app graphics were also tested with showing suppressed by the controller (not visible Windows acceptance). Before a layout refresh, the hidden Home page retained one disposed reader cluster through Blink cached LayoutResult/PhysicalBoxFragment nodes and an old Fit button. Forcing a Home bounding-rectangle read in the test controller, then taking diagnostic samples, removes that cluster: all five live class positive controls identify their targets and none remain at final Home. Report: C:/Users/andre/AppData/Local/Temp/pdfix-reader-closeout-OVCwZo/report.json, two checks pass, three supplied-file cycles, original unchanged, exit 0. Home DOM stays 317; renderer heap is 3.2 to 4.7 MiB. This is evidence of stale hidden-window layout retention, not a production listener fix. No production forced layout or GC was added.

Normal-graphics Home private memory still rises about 238 to 567 MiB (Browser 99 to 153, GPU 78 to 227, renderer 50 to 175 MiB). Together with the offscreen comparison, this leaves native/graphics allocation investigation open; short runs do not establish a plateau. Use PDFIX_CLOSEOUT_MEMORY=1, MEMORY_ONLY=1, NORMAL_GRAPHICS=1 and LAYOUT_FLUSH=1 (each prefixed PDFIX_CLOSEOUT_) for this comparison, optionally CYCLES=3 and SOURCE set to the supplied file. Focused flags now refuse missing prerequisite flags or conflicting focused modes rather than allowing an empty green run.

## October 15 — approved future UI philosophy

User approved the document-centered UI philosophy and four connected workspaces: Documents & Publishing (default), Science & Data, Engineering and Research. Exact placements/grouping remain flexible and may improve for clear usability reasons, especially user-testing evidence. Saved authoritative interpretation in docs/UI-DESIGN-BASELINE-2026-10-15.md and the full supplied attachment verbatim in docs/intake/UI-DESIGN-DIRECTION-USER-SUPPLIED-2026-10-15.md. This is a design baseline, not implementation or immediate feature/architecture expansion; main-app reliability remains first, Bluebeam and the 30 Add-ons stay deferred.

Requests for the integrator: read both documents, link them from the master plan, and coordinate a shared mockup/tool mapping for the future four-workspace model. Current app room labels are not the approved future taxonomy. Existing ownership stays in force; no shell, editor, shared plans, current dirty layout tests or app source were changed. Verification: reference copy matches the attachment byte for byte; documentation only, no app/build claim. Claude has not acknowledged this update in this chat.

## October 15 — do not skip quality safeguards; workspaces later

User supplied a full quality-risk/testing discussion and requested it not be overlooked. Preserved verbatim in docs/intake/QUALITY-AND-COMPUTER-USE-USER-REFERENCE-2026-10-15.md; actionable coverage and evidence rules in docs/QUALITY-VERIFICATION-REGISTER-2026-10-15.md. Includes all 12 traps, 13 specialist areas, automated/real-desktop-AI/human layers, ordered connected workflows, independent outputs, provenance, failure visibility and release approval. No fresh audit or explorer implementation is claimed; historical percentages are not current results. Existing same-folder ownership rules override generic branch suggestions.

Latest user clarification: finish main app/features now; workspace redesign later; future four workspaces must feel like one app. Updated UI baseline accordingly. Requests for integrator: link/reconcile this register into master release tracking, retain open memory/graphics/human/package gates, reuse existing verification infrastructure and plan actual desktop connected-workflow proof without conflating hidden/browser checks. No current Claude shell/layout code, dependencies or shared root trackers touched. Documentation-only verification: full intake byte equality and all Q01–Q12/X01–X13 IDs present.

## October 15 — consolidated goal/current/future summary

User requested a double-check and one list of the recent decisions, current goal and future plans. docs/GOAL-NOW-AND-FUTURE-2026-10-15.md consolidates main-app-first scope, current agent lanes, three testing layers, connected workflow coverage, evidence/release gates, flexible future UI, four connected later workspaces, and deferred Bluebeam/30 Add-ons. New quality attachment SHA-256 matches the preserved reference exactly; all Q01–Q12, X01–X13 and ADD-01–ADD-30 records are present. Documentation consistency was checked; no new whole-app audit/test or readiness claim. Requests for integrator: link this summary alongside the baseline/quality register in master tracking and reconcile actual current evidence before choosing the next risk-based workflow. No shell/layout source or Claude dirty files touched.

## October 15 — latest Claude owner-unlock handoff closed

User asked to finish the outstanding unlock-to-editor handoff now. Fresh inspection showed Claude had already corrected the stale label in tests/desktop/passwords.spec.js (88e8a75): the real command is Edit a text document copy under PDF tools. My preceding status answer was based on the handoff text and was stale relative to that committed test correction. No reader/editor production defect was reproduced.

Ran the locked build (410 modules), then targeted owner-removal regression. First attempt stopped while creating the protected fixture with Windows Security Sandbox could not start, before the handoff. Pinned broker verification and workspace/temp fixture staging passed, unchanged retry passed (5.3 s). Kept that failed attempt visible; did not weaken or bypass sandboxing.

Extended only the owner-removal case's final reader handoff: click the actual command, require Editable document to contain Keep selectable text, require both extracted-copy and columns/images/tables/page-layout-loss warnings, and compare both the encrypted source and verified unprotected saved PDF bytes after transition. The strengthened case passes in the actual hidden built Electron app (5.6 s test, 6.2 s run). Command: node node_modules/@playwright/test/cli.js test tests/desktop/passwords.spec.js --grep 'owner removal' --workers=1. Build manifest SHA-256 d6a263fb92fb8c7cabc08ad4b8be4331ad28d14a767964b9c24644274b894776; underlying commit 88e8a75 with Claude's in-progress redaction-workspace edit included on disk. Temporary profile/outputs: .test-data/passwords-1792116465682. Test teardown closes/exits its own app. This is hidden desktop/real native protection and editor handoff, not visible human or external-editor acceptance.

A-R10 records this resolution. Broader A-R2 memory, A-R4 graphics/startup diagnosis, human/physical acceptance and final integration of subsequent source changes remain separate. Claude's redaction, shell/editor sources and other test cases were left untouched. No dependency or security/architecture changes. Requests for integrator: reconcile the historical failed-selector note in your handoff with this result; include the strengthened regression in the next integration check.

## October 15 — current-interface UI pass in progress: first confirmed fix

All app checks now use agent-run; builds use agent-build. In the initial generated-PDF sweep, Escape from Tools & view summary left the menu open. Fixed scoped reader keyboard handling; four source tests pass. Rebuilt hidden Electron verifies menu closed and summary focus restored at 800x620 and 1366x820, each 100%/150% text (tmp/reader-ui-LujRR1/report.json). Added missing tooltips to six close icons in comparison, markup, Pages, compression, measurements and print preparation; the full 164-screenshot sweep reports no remaining icon-button tooltip warnings in its sampled states. The checker was corrected to exclude hidden/clipped/covered controls and not require a reader behind batch dialogs. Its original page-box-close race and sheet-set menu overflow remain recorded and are being retested; no whole-pass green claim yet. No production GPU/security changes. Claude dirty shell/editor/other tools left alone.

UI pass second confirmed fix: A-R12. The earlier focused retest (tmp/reader-ui-91XjbZ/report.json) reproduced hidden sheet-label input focus and four page-box dismissals leaving BODY focus. Added one PDF-dialog focus helper, used by 16 owned dialog classes; it preserves a live native opener and falls back to the visible PDF stage or workspace tab only when focus is lost, avoiding other open modals. Sheet-label Close/Escape returns to Tools & view, and a successful jump returns to artwork. The full four-configuration run tmp/reader-ui-9RzBHQ/report.json now records 52 native dismissals without BODY focus, four sheet-label dismissals to the summary, 336 visible sampled Tab stops and zero page/console errors. All 213 screenshots were visually reviewed as indexed contact sheets, with full-size close-ups for defects. The run remains honestly red for the remaining Zoom to region overflow; focus evidence is a scoped pass, not an aggregate UI green claim. Connected preserving workflow subsequently passed and independently retained its note.


## October 15 — connected workflow, memory/startup controls and printer preparation

New check-reader-connected.mjs passes in actual hidden built Electron (tmp/reader-connected-J3ACzE/report.json): add note, preview/save markup, reopen, preserving reorder, review all reversed pages, save and reopen. Independent pdf-lib object inspection and Python/pypdf confirm three reversed pages and the annotation on output page 3. Original and intermediate file bytes are unchanged. Both screenshots were personally inspected. No outside PDF application or physical printer claim.

A-R2 follow-up: five supplied 163-page PDF cycles, 15-second active holds each (84 seconds total), 15 distant jumps at 48-176 ms. No retained reader classes at Home; warm Electron-process private samples 381-410 MiB, ending 388 MiB. Hold samples do not force collection; lifecycle heap diagnostics do. External native helper peaks are outside these samples. Earlier higher-growth receipts remain valid and A-R2 stays open for hours-long/native/weak-PC investigation. Report: C:/Users/andre/AppData/Local/Temp/pdfix-reader-closeout-8fBATf/report.json.

A-R4 new native controls: minimal software passes, minimal default-graphics hidden capture fails UnknownVizError, unchanged built PDFix paints/responds. All three owned processes close exit 0. Aggregate startup diagnostic is failed, root cause unproved, visible startup gate open. Report: C:/Users/andre/AppData/Local/Temp/pdfix-startup-native-zy0eXU/report.json. Read-only Windows/GPU inventory saved in tmp/reader-ui-closeout-qtnv8d/machine.json; no production GPU/security/driver changes.

Printer deliverables: output/pdf/pdfix-printer-calibration-letter.pdf and docs/PRINTER-ACCEPTANCE-2026-10-15.md. Letter page independently parsed, rendered and personally inspected. Exact user steps specify page 1, Actual size 100%, rulers 100 mm and 4 inches, square 50 x 50 mm. No Windows print dialog or physical job sent. User measurement remains required.

New check-reader-ui-closeout.mjs runs UI, connected workflow, startup and bounded memory checks sequentially under one external agent-run lock, continuing independent checks after a failed diagnostic. Parent tmp/reader-ui-closeout-qtnv8d/report.json is red for the then-unfixed UI overflow and reproduced graphics control; connected and memory cases pass. Six targeted keyboard/heap unit tests pass. This is not a combined release build.

### Requests for Claude

Keep A-R2/A-R4 and physical printing as open gates. Include the printer instructions in the human checklist when the user chooses to print. Final combined packaging remains yours after both lanes commit and quiet down. Do not interpret short hidden tests as visible/device or whole-app acceptance. No changes to Claude shell/editor/converter/shared native files or dirty tests were staged. The final UI layout regression/table follows separately.


## Current-interface UI evidence table — October 15

All ordinary rows refer to actual hidden built Electron at 800x620 and 1366x820, each 100% and 150% Settings text. Full receipt: tmp/reader-ui-9RzBHQ/report.json, 213 personally reviewed screenshots. That receipt remains red for the sheet-set view-history overflow; focused post-fix receipts below establish the corrections. Passed denotes the sampled state, not universal feature/accessibility/release acceptance. Every screen was personally inspected in indexed contact sheets, with defect close-ups. The checker records control names, geometry, sampled visible keyboard focus, Escape and tool transitions. Nearby policies/status text explain many disabled prerequisites; warnings remain context-review prompts rather than a claim of all-state coverage.

| Screen / tool | Status | Evidence / limits |
| --- | --- | --- |
| Reader page view | Passed | Page artwork, controls and names; four configurations. |
| Continuous scroll | Passed | Rendered multi-page scroll state; four configurations. |
| Facing pages | Passed | Facing-page artwork and labels; four configurations. |
| Readable text | Passed | Controls, text flow, source warning and return to artwork; four configurations. Complex semantic layouts remain a separate gate. |
| Tools & view | Failed (keyboard fixed in 9c87192; layout fixed in 672a273) | Keyboard Enter/Space/Escape and summary return; all groups expanded. 150% select width and nested history overflow corrections verified by focused post-fix receipts. |
| Pages / thumbnails pane | Failed (label wrapping fixed in 672a273) | Thumbnails, current-page state and navigation labels at 100/150%. |
| Outline pane | Failed (label wrapping fixed in 672a273) | Embedded fixture outline and readable tab labels. |
| Saved pages pane | Failed (label wrapping fixed in 672a273) | Bookmark name/save control and empty-state instructions. |
| Inspector / Find / F3 | Passed | Three text matches, search results and F3; four configurations. |
| Sheet-label popup | Failed (fixed in e35b58f) | Label search and Escape return to Tools & view in all four configurations. |
| Print preparation / prepared sheets | Passed | Three prepared print sheets; no Windows print dialog or spool operation. |
| Mark up a drawing | Failed (fixed in 9c87192 / e35b58f) | Default, expanded and lower controls; close tooltip/focus. Actual note save/reopen covered by connected workflow. |
| Review drawing comments | Passed | Loaded source note, filter/review toolbar, Collapse and next tool. Child dialogs in final retest. |
| Compare drawing revisions | Failed (fixed in 9c87192 / e35b58f) | Side-by-side copies, matching section, lower controls, close/focus. |
| Drawing takeoffs | Failed (fixed in 9c87192) | Calibration/measurement toolbar and dismiss. No physical pen or certified quantity claim. |
| Drawing sheet sets | Failed (fixed in 672a273) | Wider intended preview, list/library and embedded reader; unsaved-set departure explicitly discarded. |
| Organize pages | Failed (fixed in 9c87192 / e35b58f) | Page list, workflow/source sections, lower controls and dismissal; preserving output proven separately. |
| Compress a PDF | Failed (fixed in 9c87192 / e35b58f) | Quality/save review controls, policy, close/focus. |
| Page numbers and stamps | Failed (fixed in e35b58f) | Templates, enabled settings, lower preview/save controls and focus return. |
| Edit the PDF outline | Failed (fixed in e35b58f) | Outline proposals, range/edit controls and lower review/save controls. |
| Name and save unchanged copy | Failed (fixed in e35b58f) | Token/name settings and destination/cancel prerequisites. |
| Compress several PDFs | Failed (fixed in e35b58f) | Empty-queue prerequisites, quality, destination/report controls and departure. |
| Batch copy, rename or export text | Failed (fixed in e35b58f) | Queue/actions, output rules, reports and departure. |
| Bates numbering across PDFs | Failed (fixed in e35b58f) | Batch setup, range/order/review controls and departure. |
| Edit PDF page boxes | Failed (fixed in 672a273) | Inspection table, expanded semantics, coordinates and lower queue/save controls; focus fixed in e35b58f. |
| Print-production marks | Failed (fixed in e35b58f) | Bleed/mark settings, lower preview/save controls and focus return. |
| Inspect and repair thin lines | Failed (fixed in e35b58f) | Inspection status, candidate/repair controls and lower review/save controls. |
| Crop / resize and custom size | Failed (fixed in 672a273) | Nested child dialog; close tooltip added. |
| Split: every / ranges / bookmarks / size | Passed | All four rule-setting layouts; close tooltip added. |
| Preserving reorder child dialog | Passed; refusal message fixed in 672a273 | Actual supported reverse/save/reopen retains note. The labelled fixture is safely refused; UI explains custom labels and next steps in plain language. |
| Comment edit / text export / XFDF dialogs | Passed | Loaded-note child dialogs in all four configurations; no external proprietary interchange claim. |
| Print four-up / booklet options | Passed | Option layouts; physical output remains untested. |
| A-R4 graphics startup | Blocked (intermittent native graphics control failure) | Software control and built app pass, default-graphics hidden capture fails. No production flags changed. |
| A-R2 hours-long native/private memory | Untested (long-duration/native/weak-PC gate) | Five active 163-page cycles pass bounded diagnostics; earlier higher-growth evidence retained. |
| Physical Epson print / measurement | Untested (needs user print approval and ruler measurement) | Calibration PDF and exact Letter/100% instructions prepared; no job sent. |
| Visible Windows / high-DPI / screen reader | Untested (hidden checks only) | No assistive-technology certification; sampled Tab outlines/names are narrower evidence. |
| Rare data-dependent/error branches | Untested (fixture/state matrix incomplete) | Default/expanded UI is not every encrypted/signed/proprietary/malformed-file state or every disabled-control explanation. |

Post-fix receipts: tmp/reader-ui-qoAwm2/report.json passes all 12 sheet-set default/expanded/lower screenshots across the four configurations (zero geometry/errors/failures). The menu is anchored inside its own preview even when the toolbar wraps. tmp/reader-ui-jjAhRM/report.json passes 40 organize/crop/split/refusal/expanded/lower states with plain-language custom-label refusal; its snapshot predates the final crop-column wrapping CSS, so that specific visual finding still requires the final fresh-source retest. tmp/reader-ui-zZVDy4 (112 screens) and tmp/reader-ui-lB0DkP (96) remain red receipts for obsolete crop selector, incorrect supported-fixture assumption and the earlier menu clipping; they contain zero page/console errors. Their successful child-dialog states establish the comment edit/export/XFDF, print options, page notes and empty link-review UI samples. All their screenshots were personally inspected in contact sheets and defect close-ups. No original bytes changed and all owned apps closed.

Final fresh-source UI receipt: tmp/reader-ui-fHCheR/report.json passes 40 states across all four configurations, zero errors/failures/geometry findings, original unchanged and app closed. Source preflight now also checks crop CSS and preserving-reorder source. All 40 screenshots personally reviewed; the 800x620/150% custom crop screenshot was inspected full-size to confirm no horizontal scrollbar. The earlier jjAhRM snapshot had the new refusal wording but old crop CSS; it does not prove that CSS fix. The final receipt supersedes its pending crop caveat. Added wrapping/min-width constraints within the owned settings column rather than hiding overflow.

Final connected repeat: tmp/reader-connected-kXT8Zg/report.json passes after the last UI changes. Source manifest 4c3b0af25e412256fb67657389037778ec7e625f2fefc45bdbf95f570ccc10f9. Both screenshots personally inspected; independent Python/pypdf again reads source pages 3, 2, 1 and the original note on output page 3. No page/console errors, inputs unchanged, owned app closed. Six keyboard/heap source tests pass. All in-app commands used agent-run and all builds used agent-build.

Requests for Claude at completion: final combined build/package and human checklist remain yours. Include these UI commits and the strengthened connected check. Keep A-R2/A-R4, visible/high-DPI/screen-reader and physical printer measurement gates open. All 16 Drawing/Pages entry points and current core reader modes were sampled in the matrix, but rare/error/data-dependent branches, every markup subtype and every possible disabled state are not universally certified. No redesign, workspaces or Add-ons added; no production graphics/security/dependency changes. All other-agent dirty source/tests and shared native files left alone. No owned app remains running.

Committed UI closeout: 9c87192 (menu Escape/tooltips), e35b58f (modal/label focus), 170ffc4 (connected/memory checks and print calibration), 672a273 (responsive layout/contrast/tooltips/refusal and evidence matrix). Final summary: docs/READER-UI-DEBUG-2026-10-15.md. Claude can now include this lane in the quiet combined build.


## Claude UI handoff acknowledged — October 15

Read the complete user-supplied Claude UI update. Current Git records Claude UI commit 0cf2cbf and printer-checklist follow-up fe0262f, following Codex UI closeout 966f555. Claude reports 293 passing unit tests and passing affected tool tests; these are Claude-reported results, not independently rerun by Codex. No new automated app or unit checks were run for this handoff acknowledgment.

The remaining tests/desktop/drawing-pointer.spec.js diff was only CRLF normalization on its final two lines. Byte inspection against HEAD, after line-ending normalization, confirmed identical text content. Restored only the committed line-ending form; no test logic changed and no unfinished functional test edit remains. The user information folder was left untouched.

Requests for Claude: both UI batches are committed, so make the quiet combined build/package and use docs/HUMAN-TEST-CHECKLIST.md. Preserve the reader screen evidence table, A-R2/A-R4 investigations and physical printer measurement gate; neither agent's UI pass closes those gates. No new workspace/redesign/Add-ons scope.


## October 16 — approved focused startup/memory work resumed

User explicitly approved focused startup and long-session memory diagnostics. New scripts/check-reader-startup-matrix.mjs separates renderer responsiveness, process failure and capture failure; first 18/18 native hidden starts/captures pass, all 54 frames visually reviewed. App normal-graphics cases report compositing enabled. No production GPU/security changes. First natural-memory attempt stopped on an incorrect remembered-page expectation (actual page 162 ready, expected 163); corrected test preserves the actual remembered page and now traverses the full 163-page range across view modes. Corrected 20-minute session was later found interrupted at 17.35 minutes; no final receipt exists. The queued native allocation trace never produced evidence. See the afternoon update below. Read-only Windows process-tree sampler includes non-Electron helpers, fences root PID reuse and exits when that owned root exits. Detailed live evidence: docs/READER-STARTUP-MEMORY-2026-10-16.md. No broad UI/unit suites or final package rebuild resumed.


## October 16 afternoon — fresh Windows CI and renewed startup blocker

Read GitHub run 38873399074 logs and downloaded full-reports locally. See docs/READER-CLEAN-WINDOWS-2026-10-16.md for the six-case evidence table. All six suites already generate their own PDF fixtures; the excluded samples/dad-drawing-review folder is unnecessary for them. Rebuilt with the lock, including Claude’s c204940 sandbox change.

Changed only reader test helpers/specs and markup test readiness: firstWindow has its own bounded CI timeout; initial page-count waits now outlast the native service’s existing 120-second request deadline; failures attach bounded process stderr, native request/result information, renderer errors, window state, screen text and screenshot when available. Markup waits for an actionable rendered surface and checks the count after each physical mouse gesture. No production renderer, GPU, native sandbox or security policy changed.

Verification: baseline targeted six-file suite 14/14 passed in the hidden built app with CI timing. Updated suite passed decoration (2), markup (5), paged outline and entire-PDF search (37.2-second final scan), then the next launch crashed before a window existed; subsequent splitting launches also crashed. The new diagnostic attachment captured repeated GPU exits 0x80000003 and the fatal unusable-GPU message. A final five-case retry failed before feature use, confirming that live revalidation is blocked. Separate native controls reproduce the startup crash, including software controls: 9/9 timing cases and 18/18 full matrix cases fail, all owned roots exited. This does not establish that GitHub had the same cause: its old traces lack the new process evidence.

A-R2: recovered partial natural receipt contains 17.35 minutes/157 jumps, with private memory growth still concerning. It is explicitly interrupted, not a complete pass. No further memory app was started once startup controls failed repeatedly. No physical print job sent.

Left alone: Claude’s modified robot/verification scripts and document editor, user information folder, shell/shared desktop files, passwords/forms/redaction/recovery, production graphics configuration, dependency versions, release package, family sample files. tests/desktop/drawing-pointer.spec.js is clean; cca47d1 already settled the old two-line line-ending leftover.

### Requests for Claude / integrator

- Upload these committed reader test changes with your fixes and rerun the six files on fresh Windows (then the full desktop suite). Do not call the three paged cases fixed until that run confirms it. The diagnostic attachments are inside the retained trace ZIP as well as Playwright attachments.
- ead976d already covers decoration/splitting’s old five-second default; no duplicate spec timeout edits needed.
- Current local A-R4 blocker now affects minimal Electron and software controls as well as PDFix; investigate machine/runtime/driver or session conditions before changing production GPU/security policy. Native stderr and matrix reports are listed in the new CI note. Windows event-log query yielded no crash event; disk has over 1 TiB free.
- Keep A-R2 and printer measurements open. Final build remains yours; this batch changes tests/docs only.


## October 16 evening — post-restart memory session checkpoint

User authorized continuing the memory work while Claude prepares the tester bundle/cloud run. Locked build completed, then a new hidden normal-graphics session began with the test-only in-process GPU switch explicitly unset. Current temporary receipt: C:/Users/andre/AppData/Local/Temp/pdfix-reader-closeout-oea0e1/receipt.json. Planned four five-minute phases use a copy of the 163-page PDF; independent Windows sampler receipt tmp/reader-memory-os-postrestart-2026-10-16.json. This is in progress, not yet a completed result.

Added scripts/check-reader-memory-report.mjs for read-only receipt analysis. It separates Electron private totals, JS heap, Home samples, response timings and independent Windows process-tree measurements. Missing final completion/integrity evidence is never promoted to a pass; a mismatched Windows root PID is rejected. Three unit checks pass. Corrected the fresh-Windows issue ID to A-R8 because A-R7 already labels the real engineering corpus. No production or shared source changes.


### In progress after fresh run 38983836383

New cloud diagnostics prove all three paged-reader failures return native exit 1 before handshake, with no renderer crash; increasing waits did not resolve them. The reader-specific PagedSessionEngine still opens NUL before creating its protocol writer, outside the structured error handler. A candidate fix now detaches native stderr without opening a device; managed stderr and explicit qpdf error/warning suppression stay in place. No sandbox permissions, shared launcher or production GPU flags changed. Build/source pin updated; native/privacy and built-app checks are queued after the isolated natural memory run. Do not package this candidate as verified until the final result update below. Splitting now uses the bounded failure diagnostics because the latest cloud run has one first-render timeout. Markup and decoration pass in that new cloud run.


### Reader helper verification complete; allocation trace still running

Candidate reader helper now passes generated valid/malformed privacy/refusal checks, a 70-page native extraction/retirement run, and all 14 hidden built-app tests across the six cloud-failing suites. No test-only in-process GPU switch. Eleven focused unit checks also pass. Detailed new-cloud evidence and receipts: docs/READER-CLEAN-WINDOWS-2026-10-16.md.

The new cloud run proves native OPEN exit 1 rather than a timing-only failure. Reader helper no longer opens NUL before handshake; it detaches native stderr, retaining controlled diagnostics plus explicit qpdf suppression and the same sandbox grants. Splitting’s remaining cloud first-render failure gets richer failure evidence; it is not claimed fixed just from local green.

Natural memory session is complete: 1,231 seconds, 187 measured jumps, all hashes unchanged, exit 0, Windows sampler observes root exit. Memory remains high and is not called a solved leak/plateau. Separate three-minute allocation trace is now running; its results will follow in a documentation update.

Requests for Claude: upload the reader helper correction and rerun the three paged tests plus splitting on fresh Windows, then the full suite. Markup and decoration already pass in run 38983836383. Keep final packaging quiet until both lanes are committed; source and shared GPU/security configuration were not otherwise changed.


## Final October 16 evening results and integrator handoff

Commits 76f070d (read-only memory summary/checks), 4916685 (include those tests in existing CI unit glob), 91514fe (reader native startup fix, diagnostics and verified checks). Built-app six-file suite passes 14/14; native valid/malformed privacy/refusal and 70-page retirement/readback pass; eleven focused unit checks pass. No in-process GPU workaround. Fresh Windows still must validate the startup correction: upload the native fix and rerun reader-paged-search, reader-paged-search-all, reader-paged-outline and splitting, then the full suite. Consider running node scripts/check-reader-native-stderr.mjs on fresh Windows as well.

Natural normal-graphics memory run completes 20.5 minutes/187 measured jumps covering every one of the 163 physical pages, original hashes unchanged, exit 0 and independent OS root-exit observation. Final settled private memory remains 953.2 MiB versus 235.8 MiB baseline; sampled peak 1,138.5 MiB for Electron, broader OS tree 1,442.2 MiB. The separate 210.5-second allocation trace completes and closes, reports hardware compositing enabled and no child-process failures. It identifies buffer/canvas/Blink and GPU image/transfer/cache allocations, with overlapping counters and a final partial dump; neither a leak nor a long-run plateau is established. Detailed receipts/limits: docs/READER-STARTUP-MEMORY-2026-10-16.md. A-R2 remains open for native/driver/allocator attribution and spare-PC/longer-session acceptance; no speculative production memory fix.

Owned Electron processes exited; app-run lock released. No printer job, dependency update, graphics/security policy change, upload or final release package made. Claude’s robot script and user information folder left alone. Next for Claude: upload committed changes, rerun fresh Windows, integrate the results with your own cloud fixes, and own the quiet combined package. This batch is ready for that handoff; local success is not a claimed cloud pass.

## October 16 — run 38993362771 reader follow-up and spare-PC readiness

The new cloud run is 101 passed / 7 failed. Three owned paged-reader failures now return native CHANGED within 1.3-1.4 seconds, with no renderer error. The earlier pre-handshake native exit is no longer the observed failure. Fourth owned failure: tagged-order's separate firstWindow 30-second timeout. Markup, decoration and splitting pass in this run.

Native reader now pins its staged directory and compares input/output handles in the NT namespace, avoiding the DOS-volume translation that AppContainer may refuse. Identity, no-reparse, single-link, fixed-slot checks, bounds and sandbox permissions remain. Broker canonicalizes staging with no-link checks on both spellings. CI-only native failure logging strictly permits two fixed stage/numeric lines; no raw paths/document text. Tagged-order uses the existing reader launch/failure helper; assertions unchanged. Source pin and locked build updated.

Verified: 11 staging/protocol/navigation/search unit checks; valid/malformed native privacy/refusal checks; all 70 extracted pages independently read back with parser retirement/restart; real 8.3 alias and canonical-path 501-page compatibility; six-file hidden built Electron suite 14/14; tagged-order 1/1. All services/apps close and source-integrity checks pass. First tagged retry under restricted process permissions fails before launch; normal process permissions pass. No new GPU-failure claim. Detailed receipts and limits in docs/READER-CLEAN-WINDOWS-2026-10-16.md. This is local built-app/native evidence, not fresh-Windows confirmation or spare-PC manual UI proof. Local short aliases worked before this change too: do not claim they reproduce the cloud restriction. Fresh-Windows issue now A-R14, correcting the earlier duplicate A-R8.

Spare PC: user reports unlocked. Existing SSH connection works. Read-only inventory finds five Node processes in session 1 and no PDFix/RustDesk process; permissions hide start times/CPU and deny detailed CIM process inspection. No processes stopped, no remote files changed, no remote app launched. Current local screen-control runtime lists no RustDesk viewer and cannot directly control the remote desktop through SSH. Spare package remains 20261017T001619918-9dd71497, preceding this native fix. Manual spare-PC UI pass is pending a supported screen-control connection and confirmation that Claude is not using that desktop; do not bypass the lock screen or replace Claude's staged harness.

Left alone: Claude forms/signature/redaction work, shared desktop launcher/shell, final packages, user information folder, remote OS/security/power settings, all existing remote processes. A-R2 high native/private memory and A-R4 intermittent graphics remain open; this batch adds no graphics workaround. Printer measurement remains unperformed, nothing spooled.

### Requests for Claude

- Upload the committed reader batch and rerun reader-paged-search, reader-paged-search-all, reader-paged-outline and reader-tagged-order, then the full desktop suite. If CHANGED persists, inspect the new bounded PDFIX_PAGED stage/numeric diagnostics in stderr plus the attached native OPEN response.
- Coordinate spare-PC use and provide/open the existing remote screen viewer when idle. Integrate a new package containing this fix before treating spare-PC reader results as current-source evidence. Final packaging remains yours.
## October 16 — cloud follow-up, scaled markup and bookmark refit

Read runs 38995241174 (97 passed / 11 failed / 2 skipped) and completed 38998234834 (102 passed / 6 failed / 2 skipped), logs and retained traces downloaded read-only under tmp/github-windows-<run>-artifacts. Their GitHub messages identify local e2e1d8a and b5005ed: neither includes reader correction 90d20f0. Three paged OPEN requests in each return CHANGED within 1.3–1.6 seconds, renderer alive, no renderer errors. This is no longer the earlier unexplained native exit 1. The native-path correction still has zero cloud validation runs.

| Screen/tool | Local result and method | Cloud status |
| --- | --- | --- |
| Reader outline/internal destinations | Stress failure reproduced after native open; corrected view-settle ordering passes twice with sixfold renderer slowdown. Six further built-app navigation/destination tests pass. Failure screenshot personally reviewed. | Pending two runs including 90d20f0 and this batch |
| Whole-PDF/page search | Both pass in the throttled built app, unchanged generated sources; final resumed whole-file scan 46.4 seconds, search-all-jPhAtK/report.json | Three old native OPEN failures remain; fix not uploaded in these runs |
| Markup tools/recovery | Seven built-app cases pass, including two new independently read-back scale/rotation cases. Four markup screenshots reviewed. Both launches now use bounded reader helper. | Prior all-tools save/restart failures pass only in newer run; not closed |
| Crop/resize/organize | Four built-app cases pass under slowdown, crop pixel colors/readback/unchanged originals retained. Three screenshots reviewed. CI review completion gets a bounded 90-second assertion while the old trace shows preview still loading. | Older failure/newer pass; two-pass gate pending |
| Split previews/save | Four built-app cases pass under slowdown, including deferred folder picker, attempted close, saved-part readback and unchanged source. Two screenshots reviewed. | Older pass/newer save-canceled failure; cause still unproven |

Confirmed production fixes: (1) markup coordinates now map actual displayed paper bounds into PDF.js viewport units, with consistent measured-word mapping back to the viewport; old generated normal/rotated cases failed by 20 / 54.4 PDF points, new saved readbacks pass. (2) bookmark destination waits for current-page refit before extracting target geometry, avoiding a current-page render superseding the on-demand target. Source/user-navigation/disposal checks and unsafe-destination refusals remain. No production GPU/security/dependency/shared-file changes.

Test evidence: initial existing-tool slowdown baseline 13/13; extended affected suite 17/18, which exposed the new outline race; corrected outline stress rerun 2/2; six related navigation/geometry regressions 6/6; pointer/destination units 14/14. This is not a single final 18/18 rerun. All checks used app-run, both rebuilds used agent-build; temporary profiles, hidden windows, apps closed. Added bounded test-only save IPC acknowledgment/null-result and safe mock-picker decisions to failure evidence. Optional test-only CDP CPU throttling affects the renderer, not native helper CPUs or every cloud condition. Detailed per-run table and receipts in READER-CLEAN-WINDOWS-2026-10-16.md; A-D9/A-R15 added, A-P3/A-R14 updated.

### Requests for Claude

- Upload 90d20f0 and this next commit. Run the three paged-reader cases, markup, page-workspace, splitting and reader-tagged-order on two fresh cloud runs before calling the intermittent failures fixed; then integrate the full-suite outcome. Preserve traces if saving returns null or never calls a picker: the new diagnostics distinguish those outcomes.
- Cloud run 38998234834 still has forms drawn-signature and redaction failures in your lane. Those sources/tests were left alone; no suggestion that the markup geometry fix proves their cause.
- Final packaging/uploads remain yours. Shared desktop files, editor/shell/converters, remote PC processes and user information folder untouched. A-R2 private memory, A-R4 graphics, spare-PC manual UI connection and physical printer measurements remain open; no print job sent.
## October 16 — priority 0, current-interface by-eye review (in progress)

The first full hidden built-Electron screenshot tour produced 279 screenshots across 800×620 and 1366×820, each at 100% and Settings 150%. Every image 001–279 was personally inspected. Source: tmp/reader-ui-ez8J60/report.json. Original generated PDF unchanged; all four sessions closed; no recorded renderer/console errors. One automatic overlap flag is a menu above an underlying thumbnail, visually reviewed as intentional overlay. This is a screenshot review of named states, not proof of every possible error or output.

Full per-screen table and one-line before/after list: [READER-BY-EYE-UI-2026-10-16.md](READER-BY-EYE-UI-2026-10-16.md). Fixes include the blank sheet-set source dropdown, singular/plural counts, clipped options in decoration/print marks/comment editor, broken Outline wrapping at 150%, plain print/comparison/split wording, internal page-box references, and collapsed thin-line technical evidence. Organize also falsely counted empty annotation arrays as affected pages; focused units pass 7/7 including direct and indirect empty-array cases. Rebuilt follow-ups hOB8J8 (103 actual PNGs) and DcPIMf (45 actual PNGs) were all personally inspected, for 427 images total. Final targeted report passes with no findings or page/console errors, unchanged original and closed sessions. Confirmed every listed fix in the captured states. Expanded Tools and view now uses full-width options to avoid mid-word breaks. All four configurations show the corrected annotation warning. The per-screen ledger retains untested branches; do not equate this with every possible error/save state.

### Requests for Claude

- Shell toast temporarily covers lower reader/comments controls, especially at 150% (screenshots 159, 231). Please consider dismissal/reserved message space in your shell lane. No shell edit made here.
- Locked rebuilds and screenshot follow-ups finished after your lock cleared normally. No session killed, no spare-PC access or upload.
- Launch note retained from your report: SSH-direct sandbox robot failed without an interactive desktop; the same robot passed 24/24 when launched through an interactive scheduled task in the signed-in desktop (`schtasks /create ... /it`, then `/run`). Future spare-PC checks must use that route. This is your reported evidence, not a new Codex reproduction.

### Left alone / still open

Editor, shell, Documents/More/converters, all shared desktop files and the user's information folder untouched. No GPU/security/dependency change and no printing. Robot action module is work in progress, not run or ready to integrate. Cloud confirmation still needs two clean fresh-Windows runs including the committed fixes. A-R2 soak, A-R4 decision note, save-safety audit, large-file timings and broader keyboard checks remain separate pending items. Additional by-eye states (populated ledger, replacements, portable recipes and preview/save/error branches) are explicitly untested in the new tour.


## October 17 — graphics decision note and stale UI assertions

Graphics policy note: [GRAPHICS-STARTUP-DECISION-2026-10-17.md](GRAPHICS-STARTUP-DECISION-2026-10-17.md). Separates actual GPU exits from screenshot errors, the fullscreen hidden-window issue and SSH sandbox failures. Gives machine/session evidence without inventing an everyday failure rate. Recommendation: keep hardware acceleration by default; if the owner approves, offer a bounded, explicit software retry after a confirmed graphics startup failure. No production graphics/security changes made. A-R4 remains open pending the owner's policy decision and visible acceptance.

Updated only two stale assertions introduced by af246c3's approved wording: comparison.spec.js expects “These pages have not been matched.”; drawing-ink-removal.spec.js expects singular “1 existing non-editable annotation kept”. No output/integrity assertions removed and no production behavior changed. Locked hidden built-app run of both complete files: 10/10 pass (38.0 seconds), generated files, app sessions closed. Fresh-Windows confirmation remains pending; Claude uploads/reruns.

Claude reports cloud run 2: 104 passed, six failed, including these two stale assertions and four Claude-lane failures. Local log tmp/cloud-full7.log independently confirms those totals and wording failures. This is not two passing fresh-Windows runs. Run 3 is Claude's responsibility; no Codex upload, cancellation or spare-PC access.

### Requests for Claude

- Include the next committed assertion fixes in a future upload after the active run finishes; don't cancel it for this. GPU note is ready for the owner. Do not enable a production fallback from this note alone.
- In scripts/user-robot/verify.mjs, inspectPdf passes its data buffer to PDF.js and computes hash/length afterward. This run reported a valid three-page text extraction but zero bytes and the empty-buffer hash: PDF.js transferred the buffer. Please compute the original byte count/hash before loading, or supply a separate copied buffer. Codex's new action verifier recalculates its receipt from a fresh on-disk read; your shared robot verifier was left untouched.

The earlier toast request is addressed by Claude commit 8d27e3f (reported and source committed); the Codex follow-up visual check of that change remains separate. User information folder, editor/shell/shared files, uploads, spare PC and printer untouched.


## October 17 — save-safety audit and library correction

Table: [READER-SAVE-SAFETY-2026-10-17.md](READER-SAVE-SAFETY-2026-10-17.md). Inspected reader exact/streamed copies, markup, page operations/split/compression, drawing/comment exchanges/quantities, decoration/outline/page-box/print-mark/thin-line copies, batch routes and internal libraries. Distinguishes checked source paths, unit faults and actual built-app evidence. Normal handled cleanup is not a power-loss guarantee; split folder publication is not an atomic whole-batch transaction. Existing OS cleanup refusals remain explicit failures, not silent success.

Fixed two owned internal-library gaps: desktop/page-workflows.cjs and desktop/sheet-sets.cjs now use the existing verified stage helper before same-directory replacement, preserving prior originals and sheet-library external-change checks. No shared helper/desktop source changed. Seven disk fault tests pass, including read failure after flushing for each library; old bytes and only the old filename remain, and a subsequent valid persist reopens. Locked rebuilt app check at 800×620 / Settings 150% saves both named libraries; JSON independently read from profile/page-workflows and profile/sheet-sets, with no .partial artifact. Receipt: C:/Users/andre/AppData/Local/Temp/pdfix-codex-robot-oyfcHV/report.json; 7/7 tool actions plus both libraries pass, no page errors, app closed. Four actual screenshots personally inspected. Native dialogs were replaced with disposable fixture/output paths; no real user source changed.

Other ongoing UI/robot source changes remain a separate commit. Claude's robot.mjs is modified by Claude and untouched here. No upload, spare-PC access, printer output or production GPU/security change.


## October 17 — seven robot actions ready; saved-result UI fixes

scripts/user-robot/actions-codex.mjs exports seven actions (name, weight, run(page,ctx), verify(ctx)): reader Find/page/zoom/bookmark; markup highlight/note/save/reopen; Pages rotate/delete/extract/combine saves; Drawing calibrated line and reviewed JSON ledger. Uses visible text/roles/accessible names only, no CSS classes/internal IDs or app state. Requires ctx.files (absolute disposable directory), goHome(), chooseFile(path), saveAs(path); optional capture(name). Claude should adapt/import it in robot.mjs, which was left untouched. Each action uses a fresh generated source copy, so an earlier recovered page arrangement cannot change the next action's assumptions. The verifier caught that false assumption during development; it was correct PDFix recovery, not a production extraction defect.

Verification reads saved files independently with PDF.js/pdf-lib, validates exact reader-copy bytes, page counts/rotations/retained and removed text, Highlight/Text annotation types and note contents, and JSON source identity/points/recomputed 100 mm measurement. All generated originals and working-input hashes are checked. The module recomputes byte/hash receipts before returning; it does not rely on app messages. Local four-size/text matrix passes 28/28 actions; another corrected matrix passes 28/28 after UI fixes. Every actual PNG in both matrices (64 total) personally inspected. Final exact rebuild checks oyfcHV and xflHyO each pass 7/7 plus saved-library disk readback, no page errors, apps closed. This is built-app generated-file evidence, not a packaged/spare-PC/cloud/outside-software claim.

Before → after: small page-preview heading hid Compare/Save after auto-scroll → scroll padding measured from the actual heading keeps review controls visible; extracted copy said 1 pages → 1 page; takeoff said 1 entries and split distance → 1 entry, Distance stays whole, dialog uses intended width and large table text; saved library rows said 1 source PDFs → 1 source PDF. Details/screenshot rows in READER-BY-EYE-UI-2026-10-16.md.

Requests for Claude: robot module ready to integrate with the contract above; uploads remain yours. Many tabs at 800 px can shrink to close glyphs (aoCqpW/drawing-populated-ledger.png); please review shell tab minimum widths. The shared verifier's detached-buffer receipt issue remains requested, not changed here. Your top-message change fixes the lower-control obstruction; a transient upper-toolbar cover remains visible at 800/150%, with clicks passing through.

Still open: additional visual preview/error/replacement branches, two clean fresh-Windows runs after the wording fixes, A-R2 longer natural-memory plateau, owner choice on A-R4, the large-file speed matrix and exhaustive keyboard walk. Spare PC/user-information folder/shared source/editor/converters/GPU/security/printer untouched. No final release package or upload made.


## October 17 — top priority: search-all / launch cascade

Read both requested logs/full-report artifacts: 39015538648 (89 passed / 21 failed), 39030515039 (90 passed / 20 failed), published head cc94c8bc. The first failed page-search launch after successful search-all has repeated GPU 0x80000003 exits and fatal “GPU process isn't usable” in both traces. This confirms the immediate abort, not the cross-machine trigger. User reports 3 of the last 5 runs. Neither longer startup waits nor labelling this mere slowness is justified.

Implemented the minimum requested test cleanup, using existing releasePagedPdf and without production changes: capture source IDs; await all paged releases before quit (bounded); require empty native job folders; capture rooted process identities/memory; observe broker/parser/GPU/renderer exit; bounded cleanup fallback only for captured PID/name/creation matches; forced cleanup fails this test. Fresh-profile Home probe then closes/observes its own descendants. Final report passes only after search, cleanup and the probe all pass. Successful receipts are attached for full-reports. Added read-only private-desktop counts and window-station ACL size/hash, with diagnostic failure explicit. Four ownership/fallback unit tests pass, including refusal of a nonmatching live PID and termination of only a disposable test child. No name-wide kills, desktop/permission changes or GPU flags.

Initial local sequence 7/7; then repeated sequence 14/14 (search-all, fresh-profile probe, page search, tagged order and four splitting cases). W3vTlN receipt shows parser/broker present during search, absent after awaited release, no staged jobs and no surviving captured processes; no force needed. Sampled private totals 278/541/442/406 MiB for Home/Stop/completed/released. Repeated YnDWJn and MOke0Q also have clean release and successful probes. These are local generated-file built-app checks, not a reproduced cloud failure or two fresh-Windows passes. Final broader sequence with the final desktop receipts and bounded-finally change is queued under the run lock; results follow.

Evidence and exact scope: [READER-LAUNCH-CASCADE-2026-10-17.md](READER-LAUNCH-CASCADE-2026-10-17.md). Updated the A-R4 decision note: two cloud traces now prove the same graphics abort, broadening it beyond the main NVIDIA machine. Owner fallback choice remains separate, no policy changed.

### Requests for Claude

- Wording fixes already committed in 3ce2abd; the supplied logs still contain old assertions. Current source is correct. Include that commit plus the new test cleanup in the next upload, after active runs finish; do not cancel a run for this.
- Keep the successful reader-search-all-resource-cleanup attachment in full-reports. Compare private memory, available virtual memory, helper/process leftovers, private desktops and ACL hashes. Two clean fresh-Windows runs required before closing A-R14/A-R4; if a cascade survives clean teardown, these receipts distinguish a Windows/global-graphics problem from leftover app processes.
- No Codex upload or spare-PC access. The 24-hour robot until Sunday 11 AM is untouched. Concurrent contained-service/document-service changes and tests remain Claude's and were neither changed nor staged by Codex.


### Final local cascade verification

Reader-first final run passes 19/19 (2.8 minutes): search-all including new clean-profile probe, page search, tagged reader, five recovery, seven redaction and four splitting cases. TYcGdm/report.json search 59,345 ms; native release completes; zero job folders or captured surviving/forced processes; probe opens/closes. Before/active/released desktop totals 1/2/1 and permission entry counts 17/18/17; original ACL hash restored. Four cleanup identity/fallback units pass. Both wording files passed all 10 cases again in the separate broader attempt.

That first broader attempt was 26/29, with all three reader cases blocked before launch by changed desktop sources versus the build manifest (5XP5yw receipt); not a GPU abort. Rebuilt via lock and immediately ran the passing reader-first sequence. Do not report it as 29/29. The no-app cleanup path now preserves the original startup/capture error rather than replacing it with a cleanup assertion.

The named-private-desktop diagnostic callback needed explicit Unicode marshalling; fixed. Earlier TYcGdm active pdfixDesktops=0 is invalid for that field, although total desktop/permission counts are valid. Separate bounded built-app positive control YHzuFa verifies named count 0→1→0 and exact ACL-hash restoration; no process leftovers/force. Other native PDFix processes are recorded read-only to reveal older-test leftovers but never added to cleanup ownership. No production desktop/permission policy changed.

Minimum requested test cleanup is ready for the next Claude upload. A-R4 root trigger remains unproven and A-R14 still requires two clean fresh-Windows runs. The successful resource attachment makes this next diagnosis possible without relying on a passed search alone. Spare PC, shared source and GPU settings untouched; all Codex checks closed and locks released normally.

## October 17 — Monday drawing guide rehearsed

Claude's Saturday list reconciled against committed work: robot actions are ready in 36b8f2a (seven actions, including independent saved-PDF/ledger verification); populated/saved-result UI corrections and the four-size/text matrix are in that commit; save-safety table and seven fault tests are in c29d8bc. They are not unfinished implementation tasks. Additional rare visual/error branches, natural long-session memory, speed and exhaustive keyboard coverage remain separate open work.

Corrected docs/TESTER-GUIDE-2026-10-19.md with the exact note/arrow/cloud preview/save controls, reference points/units/confirmation/measurement sequence, pointer-over-page zoom, and save/reopen before printing new marks. Narrowed the original-file promise to the PDF drawing tools; it must not imply that the editor's explicit Save cannot replace an opened Word file.

Built-app guide rehearsal: scripts/check-reader-tester-guide.mjs, launched hidden via agent-run with a private built runtime and generated PDFs. Six checks pass at the default window (wxMQjr/report.json) and six at 800x620 / Settings 150% (S9N1j4/report.json), both under C:/Users/andre/AppData/Local/Temp/pdfix-tester-guide-*. Checked Ctrl+wheel, plus/minus, Ctrl+F/Enter/F3, exact Workspaces > Drawing > Mark up a drawing route, note/arrow/cloud creation and independently reopened annotation dictionaries, saved-copy reopen, reviewed print preparation, and a saved measurement ledger independently recomputed as 100 mm. No page errors; both app sessions closed. All six successful screenshots personally inspected. Earlier script attempts corrected two check assumptions (canvas text overlay receives hover; initial search shows total matches before selecting a result), not app defects.

| Guide screen / workflow | Evidence |
| --- | --- |
| Reader zoom and Find keyboard steps | Passed in built app at default and 800x620 / 150%; screenshots inspected |
| Drawing room > markup, notes/arrows/clouds, saved preview | Passed; saved annotations independently read; screenshots inspected |
| Saved drawing > Print preparation and Escape close | Passed; review enables Windows dialog; screenshots inspected; physical printing intentionally not invoked |
| Calibrate scale > distance > saved ledger | Passed; saved geometry recomputes 100 mm |

Save-safety unit recheck: 7/7 pass with normal Windows filesystem permissions. A restricted-shell attempt refused hard links/renames (2/7); no production fix inferred from that sandbox limitation. The successful rerun exercises collision, cancellation, corruption, stream cancellation and preservation of both old internal libraries.

Cloud 39059991502 was still in progress when checked; d8dabbc upload is reported by Claude. No two-clean-cloud claim yet. Graphics option 2 still needs the owner's explicit approval; no fallback implemented. No spare-PC access, physical print, upload, editor/shell/shared-source edit or user-source modification.

### Requests for Claude

- Seven Codex robot actions are ready to import, with the existing ctx contract documented above; no further implementation required before integration.
- Guide drawing instructions are now rehearsed and corrected. The Monday package remains yours after cloud results.
- Your inspectPdf detached-buffer receipt request still applies; verify.mjs was modified by you during this session and left alone.
- At 800/150%, markup's review page is small but its zoom controls work; the transient toast still covers upper controls briefly (clicks pass through). These remain simplicity/shell follow-ups, not newly claimed fixes.

## October 17 — shared damaged-file wording, Codex files complete

Matched the agreed plain message in src/pdf-operations.js, src/pdf-reader.js and desktop/large-pdf-store.cjs: "It may be damaged or have the wrong file ending. Try getting a new copy." Password-specific guidance and structured error codes stay intact. Also made the guide's measurement menu path exact: Tools & view > Pages and files > Measure drawing.

Verification: 10/10 PDF-operation/staging units; locked build; 4/4 hidden built-app pdf-reading cases, including damaged-PDF recovery, passwords and print preparation. This is a message-only change; no new production graphics, file publication or document parsing behavior. Claude's running robot owned the app lock first; the reader regression waited and ran afterward. No shared-source edit or upload.

Monday pre-package items 3–6 are complete in b57e585, 36b8f2a and c29d8bc. Item 1 requires the two active fresh-Windows results; item 2 requires owner approval before code, followed by coordinated visible verification. After-Monday memory/speed/keyboard/simplicity tasks remain open as requested; do not call the whole plan complete.

## October 17 — owner approved graphics option 2; implementation

The owner explicitly approved one opt-in software-graphics retry after a confirmed startup graphics failure. New native GraphicsStartup.cs supervises only a fixed runtime/PDFix.exe, preserves argument boundaries without a shell, waits for its child to exit and requires the exact fatal graphics diagnostic, abnormal exit and an unchanged pre-interactive marker. Only attempt zero can offer a choice. Software failure has no retry, and cancellation closes. No live process is killed or restarted; any loaded/shown interface or trusted IPC permanently fences retry, so saves cannot be interrupted by the fallback. Direct starts without the launcher retain existing behavior.

New graphics-startup.cjs validates its random per-launch marker, refuses alternate paths/hard links/changed markers, and disables acceleration only for the explicitly selected software child. Small additive main/build hooks follow separately per shared-file rules. Native watcher retains no document arguments/logs in the small latest-mode receipt. No sandbox/security changes.

Ten initial unit/native-harness tests pass (seven native scenarios within the native case): normal success, accepted software success, both failures, decline, graphics crash after an interactive/save-possible marker, unrelated error and invalid marker. Native child stubs simulate fatal diagnostics; this does not reproduce a real GPU failure. Built-app and visible acceptance and package integration remain required before claiming the recovery is shipped.

### Requests for the integrator — graphics package

Package integration is larger than an additive shared-file change, so remains Claude's: put the compiled dist/native/graphics-startup/PDFix.exe at app/PDFix.exe, and move the existing complete Electron payload to app/runtime/ (runtime/PDFix.exe and runtime/resources/app etc.). Keep the launcher and runtime in the same package inventory/hash checks. Validate the new helper manifest/source hash. Preserve manifest launch PDFix.exe and installer/shortcut paths. Windows-context registration currently receives process.execPath; resolve that to the outer launcher for the packaged runtime so Open with/right-click entries use recovery too. Do not point the launcher at an executable from arguments/environment. No package/upload changes made by Codex.

## October 17 — graphics retry implementation verified; package handoff

Owner approval is now explicit. Main hooks ca283db (two additive lines) and locked-build hook 5c6afdd (two additive lines) were committed separately. Core implementation is 6f3c91c plus the final acceptance commit. Exact integration steps and limits: GRAPHICS-RECOVERY-INTEGRATION-2026-10-17.md. Claude must integrate the outer native launcher and inner runtime payload; package/upload files were left alone.

Final 10/10 safety/native tests include eight native scenarios and real argument round trips. Hidden normal/software built-app pair passes; final 49MLGT receipt checks generated drawing text, painted screenshots, normal hardware acceleration true and software false. Visible acceptance YhEEy9 passes both real drawing windows and native Retry/default Close behavior; all four final PNGs personally inspected and all sessions exit 0. The fatal first child is a test simulation; no real driver failure was induced. Four existing reader desktop cases also pass. A concurrent source save caused one locked build retry, which then passed; no guard was weakened.

| Graphics screen / workflow | Result |
| --- | --- |
| Normal visible built-app drawing | Passed; hardware acceleration true, exit 0, PNG inspected |
| Accepted software retry drawing | Passed; one simulated fatal first child, one software child, acceleration false, exit 0, PNG inspected |
| Native retry prompt | Passed visible; Retry works; default Close refuses; both captures inspected |
| Later graphics failure after interactive/save-possible marker | Native test passes: no restart or prompt |
| Combined package / spare-PC real desktop | Pending Claude integration and acceptance; spare PC untouched |

Cloud update read directly from logs: 39059991502's full desktop suite passes 110/110 in 18.3 minutes, without the launch cascade. Its overall workflow failed three old image-wording unit assertions (315 pass, 3 fail, one skipped). Claude already committed wording-test updates fdc5a7a; no Codex edits to those files. The next run 39061542176 was in progress at inspection. This is ONE clean full desktop run, not yet two consecutive confirmations. Preserve the search-all resource attachment.

No uploads, spare-PC use, physical printing, editor/shell implementation edits beyond the two separately committed shared hooks, or persistent graphics/security preference changes. Direct non-launcher starts keep the previous startup behavior. Known issues/decision note updated; A-R4 root cause and fresh/spare-machine acceptance remain open.

## October 17 — Saturday follow-up: cloud drawing-review wait

Run 39061542176 is 108/110 desktop cases with no launch cascade. Its portable reply case saves and independently validates both annotations, then reopens the saved PDF; the error snapshot shows the comments panel still actively inspecting (Cancel inspection visible, filters disabled), not an error or completed empty inventory. The prior 30-second row count wait expired. The test now waits on the actual Inspect source comments completion control (120 seconds in CI / 60 local), then retains the exact row count, reply state/thread and original-byte checks. On failure it attaches bounded reader/native diagnostics, and cancels/waits for inspection before app shutdown to avoid the secondary 15-second close failure. Native diagnostics now include inspect/cancel review requests. No production timeout or result validation weakened; a true engine stall/error remains a failing test.

Local hidden built app: both complete cases repeated three times pass 6/6 (56.5 seconds). A test-only wrapper deliberately delays the reopened inventory response by 35 seconds, beyond the old deadline: portable reply case passes in 45.5 seconds with independent saved annotation/reply checks intact. This establishes the new wait can handle that delay, not that the actual cloud job would eventually finish. Fresh-Windows confirmation remains required. Wording/save-safety/graphics work is already committed; no duplicate implementation. Robot integration 16c5e82 is Claude's and left alone. No upload or spare-PC use.

## October 17 — local supplied drawing acceptance complete

Eight tasks pass twice in hidden built Electron: open/scroll/zoom, honest Find limitation, note/save/independent annotation readback/reopen, source comments, scale/distance with independent ledger calculation, print preparation without a job, saved sheet-set JSON/readback/reload, and comparison against the local annotated revision. Original bytes unchanged, no page errors or online requests, apps closed. Seven initial and two corrected screenshots personally inspected. Results in LOCAL-DRAWING-ACCEPTANCE-2026-10-17.md deliberately omit the drawing's name/content. All artifacts/derived drawing files stay local and are not committed/uploaded/transferred.

Important limitation for Monday: this small sample has no selectable text. Reader reports that honestly; Dad's guide now points to Home > Make a scan searchable. Calibration was a chosen-point mechanics exercise, not a claim about real drawing dimensions. No printer output sent. This one-page sample does not complete large-file memory/speed acceptance.

By-eye fixes: singular prepared side/source page and singular sheet-set count. Locked build and follow-up eight-task run pass with two corrected screenshots inspected. No production processing/scale/render behavior changed. The saved-result toolbar remains crowded as documented for later simplicity work.

## October 17 — eight more robot actions ready for integration

Additional actions exported separately as additionalActions; the existing seven/default random-robot actions stay unchanged. Number/stamp all pages, compress, outline destination, page boxes, review reply/save/reopen, print preparation/byte-exact copy, comparison/revision-file verification and saved sheet-set/reload all pass in the hidden built app. Receipt: C:/Users/andre/AppData/Local/Temp/pdfix-codex-robot-m0yZvZ/report.json. Eight of eight, no page errors, app closed. Each published PDF/library is independently read; source hashes are checked. Print stops before the Windows dialog. Comparison has no exported-report feature; evidence is UI difference plus independent revision/source files, not a fictional app report export.

Saved sheet-set rows now have role=group and an accessible name from the visible set title. This lets the robot choose the correct Review and load button among several sets without internal IDs/CSS classes. The generated-file suite verifies that named-group route and the disk-backed library.

### Requests for Claude

- Import additionalActions alongside actions and add the runner's temporary profile path to codexCtx as profile. The sheet-set verifier requires ctx.profile to independently read its saved library. Never use a real profile. Detailed table and reproduction command: ROBOT-CODEX-EXTRA-ACTIONS-2026-10-17.md.
- The additional array is intentionally opt-in until you wire it in; no edits were made to robot.mjs or verify.mjs. Your integrated seven-action random run remains distinct from this new eight-action harness.

Automatic approval review subsequently refused a repository/cloud status command because the review service's usage limit was reached. That status command did not execute. The already-authorized eight-action check finished successfully and was collected. No approval bypass was attempted; final commit/check availability is reported separately.

## October 17 late follow-up — long-session coordination request

**Requests for the integrator:** the requested 1–2 hour single-session soak exceeds the existing app-run lock lease. `scripts/agent-run.mjs` treats even a live holder as stale at 60 minutes; `scripts/agent-build.mjs` likewise stops honoring that run at 60 minutes. Please add a coordinated heartbeat/renewable lease to both wrappers before scheduling the full soak, or arrange a documented exclusive window with a supported longer lease. I will not silently renew/delete another lock or run outside agent-run. This is a coordination prerequisite, not evidence of a memory pass. The existing 20.5-minute result still does not prove a plateau.

## October 17 — keyboard follow-up (44 built-app states)

Confirmed fixes: outline arrows previously had no descriptive name/title; now named Move outline entry up/down. Measurement Escape previously left focus on its hidden SVG; now returns it to the drawing stage. Comments Escape previously focused its opener inside a closed Tools menu; now returns it to the visible drawing stage. Restore happens only when focus was inside the closing panel/overlay, avoiding stealing focus from another control.

`node scripts/agent-run.mjs codex -- node scripts/check-reader-keyboard-walk.mjs` passes 44/44 states, no page errors, app closed. Receipt: local temporary `pdfix-keyboard-walk-DJiFOY/report.json`. Real Tab/arrow/Enter/Space/Escape events, generated files, 1366x820 at 100% and 800x620 at 150%. The walker checks every currently exposed enabled tabbable control in each scoped state for reachability, descriptive name and visible focus ring, and checks modal Escape returns focus to a visible control. These are initial/revealed states; this is not a universal certificate for every data-dependent or saved-result branch.

| Screen/state | Both size/text configurations |
| --- | --- |
| Reader, Tools & view groups expanded | Passed |
| Navigation Pages / Outline / Saved | Passed (tab arrow navigation exercised; available inventory only) |
| Continuous / Facing / Readable text / Page views | Passed |
| Print preparation | Passed; no physical printing |
| Compression initial settings | Passed |
| Organize pages initial rows | Passed |
| Markup initial controls | Passed |
| Page numbers, Bates and stamps initial controls | Passed |
| Outline edit controls | Passed; named arrows fixed |
| Page boxes / Print-production marks | Passed |
| Thin lines after ready / Sheet sets after ready | Passed |
| Comparison after rendered-ready | Passed |
| Measurement controls, point placement, Escape | Passed; hidden-focus bug fixed |
| Comments initial inventory controls, Collapse/Escape | Passed; hidden-focus bug fixed |

By-eye evidence: personally inspected all eight PNGs from the earlier S5iXvo run (reader tools, Print, Organize and Outline in both configurations), all five WETwze investigation PNGs, and both later UVXehT/Y88dqY failure PNGs. Focus rings are strong; small/large-text dialogs scroll vertically. No new lateral clipping was observed in those screenshots. Some outline explanatory wording remains technical and is a later simplicity item; not silently marked resolved. The final passing keyboard run captured no new screenshots. No redesign and no claims of outside screen-reader/physical-device testing.

## October 18 — memory runner workflow validation

Implemented the natural single-session runner and explicit plateau gate described in `docs/READER-NATURAL-SOAK-2026-10-17.md`. Five unit cases pass. Hidden built-app `--smoke` completes 16 cycles in 124.347 seconds, scrolling all 12 generated pages per cycle, searching, zooming, adding/saving/reopening independently verified markup, returning Home and recording Windows private process-tree and per-type Electron metrics. Source unchanged, no page errors, windows hidden, normal close, no surviving/forced descendants. Receipt: local temporary `pdfix-reader-soak-L4Pojv/report.json`. Settled private peak 514.73 MiB; final 445.7 MiB. This run uses test software graphics and **does not** establish normal GPU behavior or a one-hour plateau: `workflowPass: true`, memory `pass: false`, `eligible: false` deliberately remain separate. Full-duration run is not started until the integrator provides the longer supported run lease requested above. No spare-PC run performed.

Cloud read-only refresh: 39067984799 has a successful Full desktop suite but fails the separate unit job on Windows short-path email fixture quoting (Claude lane). Previous 39065771302 has 109 desktop passes and one 270-degree markup save timeout; its diagnostics show the first save completed in 2.447 seconds, while the second save-copy request has no response after 30 seconds. No renderer errors/crash and both save dialogs were called. Latest run passes that case, but two consecutive clean desktop runs are **not** established. No evidence justifies calling the timeout fixed merely by increasing waits; continuing the native-save investigation. Nothing uploaded.

## October 18 — large-file speed and wheel measurements

Generated local matrix is complete: 1,000 text/vector pages; three 14,400-point (200-inch) square pages; a 221,762,386-byte PDF with four referenced 55,440,000-byte RGB raster diagrams plus synthetic selectable labels. The raster case is not a real scan/OCR proof and uses no unused payload padding. Separate pdf-lib readback confirms four page image objects and their dimensions/lengths. All cases pass first-page, exact full-search result counts, distant-jump, renderer heartbeat and sampled owned-private-memory limits in the hidden built app; source hashes unchanged, no page errors, clean descendant exit. Separate actual wheel panning/renderer-frame scheduling passes all three corpora (40 wheel samples and 400+ frames each). Detailed timings, limits and evidence boundaries are in `docs/READER-SPEED-MATRIX-2026-10-18.md`. Speed receipt `pdfix-reader-speed-slCpub/report.json`; wheel receipt `pdfix-reader-scroll-lwhxR9/report.json`, both local Temp. No production performance workaround justified by these samples. Test software graphics, no one-hour plateau, no physical-display/compositor or real scanned-corpus claim.

## October 18 — markup save progress, cancellation and cloud wait

Before/after UI fixes:
- Save kept saying “Verified … Review before saving” during native checking -> now says “Saving your copy and checking it before completion…”.
- A previous Saved popup could still be visible during the next save -> the new save replaces it with its current progress message; cancellation replaces it too.
- Canceling the Save dialog gave no explicit outcome -> now says “Save canceled. Your original and prepared copy are unchanged.” Retry remains available.
- “1 editable annotations” / “1 flattened visual marks” -> singular annotation/mark where appropriate.

The cloud 39065771302 trace contains a completed first save, a second save-copy request with no response at the 30-second assertion, two real Save-dialog callbacks, no renderer errors/crash. The owned spec now waits on the save control becoming available again (CI 120 s/local 60 s), **then** asserts Saved and independently inspects the saved PDF exactly as before. It does not treat a pending message as success or weaken output assertions. A bounded, opt-in test-only second-save delay permits a positive control beyond the former 30-second wait. No production watchdog, sandbox or security setting changed. Actual cloud lateness root cause remains unproven; two clean cloud suites still required.

Verification: all 8 markup cases pass in the hidden built app (43.5 seconds), including a new real dialog cancellation/native-response receipt and retry with independent annotation readback and unchanged source. All three cropped rotations additionally pass with a deliberate 35-second second-save delay (2 minutes total). After the popup correction, the delayed 270-degree case passes again (41.2 seconds), and cancellation passes again (4 seconds). Every newly captured PNG was personally inspected: original preview plus three minimum-size views; saving/minimum views for all three delayed rotations; final saving/minimum views after popup replacement. Final screenshot shows the progress popup and status agree. All apps closed. These are local built-app and by-eye screenshots, not fresh-Windows acceptance of the new wait.

Review inventory A-D10 now has two consecutive cloud passes for that spec: both cases passed in 39065771302; the entire desktop job passed in 39067984799. The former run's markup failure and latest separate unit failure prevent claiming two globally clean runs.

### Requests for Claude / remaining boundary

- Upload the committed Codex batches when your current run permits, then obtain two consecutive fresh-Windows desktop runs including the markup change. No upload performed here. Your Windows short-path email unit failure in 39067984799 is left to you.
- Package/integrate the approved graphics launcher as already documented; packaged/spare-PC recovery acceptance remains yours after the reserved robot ends.
- Please supply the supported longer run lease in both wrappers before the 60–120-minute single-session memory gate. The runner deliberately refuses to bypass their current 60-minute expiry. If checks repeatedly run back-to-back, a short gap lets the other agent's five-second lock waiter acquire the next slot; a fair queue would be a later coordination improvement.
- Extra robot actions are ready in 4551943 and need the documented temporary ctx.profile contract when wired into your runner; I did not edit your currently modified robot.mjs.
- Health-report technical rows/button are in your lane under AGENT-WORKFLOW, despite the older simplicity list labelling them Codex. Please handle them or explicitly transfer that file. Reader preview-toolbar simplification and broader data-dependent keyboard/error/visual branches remain later work after the priority acceptance gates, not claimed complete by the 44 initial/revealed keyboard states.
- A real photo-rich scanned corpus, real normal-GPU/weak-PC long memory plateau, physical printer measurements and human/screen-reader acceptance remain separate. No printer job, spare-PC access, external upload, dependency/architecture/security change, user-information-folder edit or Claude-source edit in this batch.

## October 18 — compact output previews and working Find panel

Before/after:
- Markup/Pages output previews repeated Fit width and Find on an already crowded toolbar -> page navigation, zoom and existing print access stay on the toolbar; Fit width and Find move into the existing Tools & view / View and selection group. Main reader and markup placement toolbar keep their existing arrangement.
- Find/Control+F in these previews selected a search panel forcibly hidden by the tool stylesheet -> an explicitly opened preview search now appears as a scrollable overlay, with a named Close preview search button.
- Escape from the preview query could reach the surrounding dialog -> active search stops first; a subsequent Escape closes only that preview panel and returns focus to its page stage. Clicking the close button does the same. This is opt-in for the owned markup output and Pages output readers; other tools are not opted in.

Verification: five keyboard unit cases pass. All 16 built-app reader/markup/Pages desktop cases pass (1.1 minutes), including independent saved PDF pages, text, rotation, annotation, crop and vector-size checks. The generated-file robot's markup save/reopen and rotated Pages save each pass in four size/text combinations: 800x620 and 1366x820, each 100%/150%. Each configuration checks visible preview search, all three expected hits, Escape focus, Fit width/Find availability in the menu, no lateral toolbar overflow, saved-file readback, no page errors and closed app. A repeated 800x620/150% run also opens Find by its menu button and closes it by the named close button; both outputs pass again.

All captured screenshots personally inspected: 16 preview/search matrix PNGs, six minimum-size preview/search/menu repeat PNGs, eight regression PNGs (markup preview/minimum, Pages saved output/crop, main reader), plus two initial compact-preview investigation PNGs. Menu controls fit within a bounded scrollable menu; large-text search headings wrap and results scroll. Main reader screenshot has a possible stale selected thumbnail despite page 1 rendered; investigating separately rather than counting the screenshot as a universal visual pass.

Local Temp matrix receipts: pdfix-codex-robot-YOfzzR (800/100%), MNDuRM (1366/100%), Oye56t (1366/150%), 28wgf2 (800/150%); repeat Jzoxck. Initial ngqjsm predates the visible-search fix and is not its acceptance receipt. All in-app runs used agent-run; final successful build used agent-build (a transient native-directory lock succeeded on one retry; a later concurrent source-save was caught by the build manifest and automatically rebuilt). No process belonging to Claude stopped, no printing, no spare PC, no upload, no shared launcher/wrapper/editor changes.

Requests for Claude: include this preview-only UI batch in the next quiet combined package. The long-run lock remains unchanged at this checkpoint; long-session and fresh-Windows/package acceptance are still open. Health-report wording stays yours. Current main reader thumbnail-selection observation is being checked in Codex's lane.

## October 18 — thumbnail observation checked

The screenshot observation did not reproduce as a persistent selection bug. The exact same reader sequence passes explicit assertions that page 1 is the sole `.thumbnail.current` and sole `aria-current=page` thumbnail when page 1 has rendered. A fresh screenshot was personally inspected: page 1 has the stronger selected border, while page 2's former background is fading. Shared button styles animate background/border for 150 ms. No production change made; the three semantic selection assertions remain as a regression check. Focused built-app case passes in 2.6 seconds, app closed. Screenshot: .test-data/pdf-1792308482411/reader.png. This closes the provisional observation above, not a claim of every thumbnail transition tested.

## October 18 — normal-GPU soak path ready; full gate still blocked

Added --normal-graphics to the natural reader soak, using the same isolated hidden bootstrap approach as earlier normal-graphics diagnostics. Before loading the pinned app runtime it suppresses show/showInactive/focus and disables background throttling. The child selects the existing normal graphics path rather than the offscreen hidden-test path that disables acceleration; each memory sample rejects a visible window or any recorded show event. Main/preload/production GPU flags/security settings are not edited.

Normal-GPU hidden built-app smoke completes two full cycles in 235.404 seconds: hardware acceleration and gpu_compositing enabled, no recorded process failures, source unchanged, saved markup independently verified, clean exit and no forced/surviving descendants. Settled private bytes rise from 566.15 to 637.13 MiB. This is only workflow validation: memory pass=false/eligible=false, no claimed plateau, no visible-window speed conclusion. Receipt: local Temp pdfix-reader-soak-9wfTqr/report.json. Full workflow recording now includes GPU feature status, process events, visibility checks and graceful close even if final sampling fails.

A GPU/renderer crash can reset private-memory counters and imitate stability; such failures and missing diagnostics now prevent the workflow passing. Seven memory-gate unit cases pass; the new event filter also independently accepts the captured normal-run events with no failures. The long command through agent-run was explicitly tried and correctly refused before opening an app because the supported extended lease still does not exist. Please support duration plus TEN minutes (supersedes five) in both wrappers, covering startup/watchdog/cleanup. Full acceptance remains 60–120 minutes, minimum eight cycles; no lock bypass or heartbeat spoofing.

Claude's current dirty main/preload/app/problem-log files were left alone. No upload/package/printer/spare-PC action taken. The latest observed cloud results are unchanged; next cloud and packaged-graphics validation still require integration. Compact preview UI and thumbnail semantic check are committed separately in 6f5df67 and 5ddbb59.

## October 18 — Pages save messages agree with the saved result

By-eye review of the regression screenshot found a real contradiction: Saved organized.pdf in the popup while the page workspace still said Nothing has been saved yet / Review before saving. The save route now updates its persistent status during saving, after success and after cancellation. The review summary names the saved file; a short success popup keeps a long filename from obscuring the dialog, while the full name remains in wrapped persistent text. Changing the arrangement clears the old save message and hides the stale preview. Counts use page/pages correctly.

Added built-app checks for cancellation (no file published, preview still usable), a genuinely unavailable destination folder (plain error and retry enabled), successful retry with a 103-character filename, independent three-page PDF readback and original byte equality, 800-pixel dialog width, and editing after save invalidating the preview/status. All five Pages cases pass after rebuilding (17.3 seconds), including the original crop/vector/rotation checks. After shortening the popup, the full cancel/failure/long-name/retry/edited-plan case passes again (3.9 seconds). All 13 newly captured PNGs were personally inspected: four initial Pages result/crop/cancel images, six final suite images and three final focused images. The failed folder message says what to do next; full filenames wrap inside the dialog and the success popup stays short. Apps closed; no print job or spare PC.

| Follow-up screen/state | Evidence |
| --- | --- |
| Pages saved result | Passed: persistent Saved status and Saved as summary match the popup |
| Save dialog canceled | Passed: explicit cancellation, prepared copy retained, target absent |
| Destination folder unavailable | Passed: actual native path refusal, plain error, retry available |
| Long saved filename at 800x620 | Passed: wrapped filename, short popup, no horizontal dialog overflow |
| Arrangement changed after save | Passed: current-plan message replaces old Saved state and preview is invalidated |

Requests for Claude: include this final Pages commit after the current cloud run finishes; do not cancel that run for this wording/status batch. Fresh cloud run 39107338420 was in progress at the read-only checkpoint; no pass result inferred. The shared build wait logs say building even while another agent's app check holds the lock (observed foundation/layout/forms check); cosmetic wrapper wording could be clarified alongside the lease work. I left the wrapper and your currently modified pdf-content-workspace.js alone. Full memory lease and packaged graphics/hardware acceptance remain open as described above; no user confirmation is needed for the committed fixes themselves.

## October 18, 00:50 PDT — full memory soak started after lease integration

Claude commit 4ab0b8c resolves the shared run/build lease prerequisite. Fixed a soak admission bug: comparing the remaining reservation to exactly duration plus ten minutes rejected any milliseconds already spent starting the command. It now verifies the original reservation covers all ten extra minutes, startup consumed at most one minute, and nine extra minutes remain. Eight memory/lease unit cases pass. No shared wrapper or production behavior changed.

Built through agent-build, then started the full hidden normal-GPU session through agent-run with --minutes=90 on BOTH commands. Main-PC temporary receipt folder: pdfix-reader-soak-PRvz6j. Run lock began 2026-10-18T07:50:27.816Z and expires 09:30:27.816Z. Nominal completion about 02:20 PDT, plus cycle completion/cleanup. Result pending: do not call the memory gate passed until final report records plateau, source integrity, independent markup readback and clean descendants. No forced collection or memory reset.

Read-only cloud checkpoint: run 39107338420 completed successfully. That is one clean full run, not two successive clean runs; no upload or run dispatch performed. Graphics retry code remains committed and documented for integration; packaged recovery verification is still pending Claude's integration, rather than unimplemented Codex code. Extra robot actions are wired in and passed according to Claude's update. Spare PC and printer left alone.

## October 18 — shared Drive continuation archive

At the user's request, added docs/AI-START-HERE.md as the entry point for any future agent and docs/CODEX-CONTINUATION-2026-10-18.md with current goals, ownership, commit/evidence map, open gates, machine lessons and the running soak's receipt/lock. Six explicitly selected generated-file JSON receipts are copied to docs/evidence/codex with original/copy hashes and user-home path redaction. Reproduction helper: node scripts/archive-reader-evidence.mjs. No private drawing artifact, user profile, original attachment or chat transcript was copied. Notes distinguish preserved summaries from complete transcript export.

A portable committed-history Git bundle is being saved inside tmp/portable-history in this Drive folder; live Git remains outside Drive as required. Bundle receipt identifies its exact commit/checksum; it is a dated backup, not an automatically synchronized Git database. No production code/build change or new app session in this documentation task; current authorized soak remains running.

Request for Claude: please read AI-START-HERE.md, add your current editor/shell/integrator continuation snapshot and link it there, and preserve important results that currently exist only in your chat or temporary files. User wants both agents' continuation information in the shared project folder. This records the request, not an acknowledgement or claim that your private chat has been exported. Keep pending work and packaged/visible/device evidence distinct.

## October 18 — combined main-app finish plan requested by user

Saved docs/CODEX-MAIN-APP-ACCEPTANCE-PLAN-2026-10-18.md and linked it alongside Claude's combined tracker from AI-START-HERE.md. Claude concurrently created/committed the initially chosen MAIN-APP-FINISH-PLAN filename; restored that file byte-for-byte from its committed content and kept this detailed checklist separate. No Claude plan edits retained. User asked for one plan covering both agents, actual feature gaps and all testing. Interprets OK following recommended C as main-app agreed scope plus direct editor printing and picture resize/crop; no blanket approval for other candidates, workspace redesign, Bluebeam expansion or Add-ons. Plan requires a per-requirement provenance/implementation/evidence ledger, distinct private Monday test-package and complete-main-app/public-release gates, exact package/commit tracking, independent saved-output checks, fault/recovery/security/accessibility/physical/outside-software checks, two consecutive full cloud workflows and human acceptance. Existing features are not relabelled absent merely because old notes lack acceptance.

Request for Claude: read and acknowledge the combined plan, link it from your START-HERE record and merge the lane audits. Shared verification/master files were left alone. Your graphics integration, editor and workbook/slides work remain yours; Codex reader/Drawing/Pages audit and pending memory follow-up remain Codex. This was documentation only; no new app check or build while the authorized soak owns the lock, and no upload/spare-PC/printer action. Scope review should not block undisputed fixes or require repeated approval for already adopted tasks.

## October 18 — approved now work started, Phase 1 lane audit and X7 preparation

Read the owner-approved finish plan and START-HERE; now scope is X1/X6/X7 and packaged recovery checks when Claude supplies the package. X3/X4/X5 remain later; X2 only if time. Added the requested Codex Phase 1 table to the plan: actual reader/menu capabilities and every Drawing/Pages room entry, with bounded Done versus Unfinished versus Later and cited evidence. No item is called misleading without a current reproduced mismatch. Owner review and complete original-ID reconciliation remain separate; this does not grant missing features blanket completion.

X7 preparation: native render/preview/review waits now use 120 seconds CI / 60 seconds local in the listed paths. Bates and split save checks wait for actual controls to become available again before requiring the exact Saved result and independent disk readback. Review-save uses the same rule; existing markup second-save readiness already used it, and its preview readiness now does too. Drawing/Pages follow-up uses the bounded launch helper and attaches real renderer/native diagnostics. Added Bates/build-review/save-review channels to those test diagnostics. No production timeouts/security/settings changed, no source/output assertions removed, no retries/skips added. These are candidate test fixes, not proven cloud root-cause repairs.

Verification so far: all touched scripts parse; Playwright discovers all 18 cases in the five specs; 13 focused keyboard/memory/lease units pass. App checks are deliberately pending while the already authorized 90-minute soak owns the run lock. No new screenshot captured, no UI change in this batch. The memory run started 00:50 PDT, nominally ends about 02:20 plus cleanup; first three completed cycles at the checkpoint were 627.57, 723.93 and 752.74 MiB settled private, 18.4 minutes elapsed. That is early warmup, not a plateau pass or confirmed leak. Current local receipt is pdfix-reader-soak-PRvz6j/report.json; no second soak started.

Latest read-only cloud checkpoint: 39107338420 succeeded; 39109191417 is in progress at the same uploaded head f9393e8e88b23e103eb164297527d515a9ea1bb3. It cannot certify later local changes. Claude owns uploads. Current dirty main.cjs, installer and package script belong to Claude's integration and were untouched.

Requests for Claude: the shared app lock is held by the memory run through its bounded expiry, so do not rebuild underneath it. Package acceptance waits for your new package path; no Codex package build or spare-PC access. Please include these candidate test changes only with their honest pending app/cloud status; two consecutive fresh-Windows passes remain required. X1 source review confirms current rich/custom-font/callout bodies are refused while plain standard-font FreeText and additive replies are implemented. Next X1 coding must preserve original objects, rich/appearance consistency, flags and independently verified glyphs; this is not proprietary Bluebeam work.

## October 18 — X6 complete duration, FAILED plateau; X7 local app checks pass

Completed full natural normal-GPU run: 18 cycles, 94.04 minutes, all workflow/source/markup readback and clean-close checks pass, no page/process failures and no forced or surviving descendants. The fixed memory rule FAILS: after four warmup cycles, median 666.55 -> 736.13 MiB (+69.58 vs allowance64), slope0.937 MiB/min and settled peak834.71 MiB. Do not call this a plateau or loosen its threshold. Renderer private samples rise103->201MiB; Browser/Utility broadly stable; GPU periodically releases around400->130MiB without recorded crashes. This suggests further renderer allocation/heap-vs-native diagnostics; it is not proof of a particular JS leak or justification for forced GC/graphics changes. Detailed completed results in READER-NATURAL-SOAK-2026-10-17.md; sanitized full receipt docs/evidence/codex/pdfix-reader-soak-PRvz6j.json, hashes in manifest. X6/A-R2 remains open for the failed gate.

X7 candidate changes in cea7abe now have real locked built-app validation: all18 cases in drawing-pages-followup, reader-paged-search, splitting, markup and drawing-review-styles pass in2.0minutes. Exact saved output/readback/source preservation assertions remain. All6 captured PNGs personally inspected: markup preview/three minimum-size rotations and split preview/minimum. No new UI failure in those captured states. This supersedes the previous pending-local-app note, not the requirement for cloud confirmation.

New cloud evidence: 39109191417 failed comparison first-open readiness and a Claude password-cancel case; 39127085332 fails only a Claude scan-only forms case (Next blank field disabled). All listed Codex cases pass in that newest suite, but two consecutive full clean runs are still absent. Logs kept in tmp/cloud-39109191417-failed.log and tmp/cloud-39127085332-failed.log; no upload dispatched. The attempted report-artifact download returned no files, so no unviewed cloud screenshot is claimed. Comparison diagnostics/wait follow-up remains separate.

Claude's package integration is committed as35dc17f, but no new finished package path has been supplied. A subsequent locked build is waiting while Claude's package command holds app-run.lock; nothing bypassed. Own X1 callout adapter/unit/robot work is in progress, not yet app-accepted or committed as finished. No spare-PC/physical print activity.

## October 18 — X1 bounded standard callout body editing, local increment ready

Added a declared-geometry appearance adapter for standard FreeTextCallout bodies: positive solid border/black text/standard font, explicit RD insets, two/three-point CL lines, None/OpenArrow/ClosedArrow. Text fits the inset box, not the full annotation; source geometry, flags, author/private fields and original objects/appearance bytes remain unchanged. Malformed/degenerate/outside/incorrect-attachment/inside-tip/clipped-arrow/hairline/effect/unsupported-color/rich/custom-font/locked/overflow cases refuse. Only selected Contents/M/AP change and new appearance/font objects are added. No dependency or architecture/security/GPU change. Rich-text/custom-font X1 work remains unfinished.

Verification: 37 focused callout/FreeText/review-entry units pass. Initial two native app cases pass; final rebuilt guard-only repeat passes 2/2 in23.3s (success-save-independent-readback-reopen, unsupported-layout/no-publication/source-preserved). Full final units:355pass/0fail/1pre-existing jsdom editor skip in11.1s. The earlier restricted-shell full run had filesystem errors and hung; proved ownership via its command ancestry, stopped only that4-process Codex tree and reran with normal Windows permissions. No Claude process touched.

Robot action scripts/user-robot/actions-codex-review.mjs uses only visible names/roles and separately verifies the saved bytes via inspectPdf, PDF.js annotation appearance text and pdf-lib geometry/original-object comparisons. Final four size/text runs pass, each closes/no page errors: JHZGCN800/100,6c3GfX800/150,MZWBA11366/100,1ta2Qj1366/150. All16 final screenshots personally inspected and preserved with four JSON receipts/hashes in docs/evidence/codex. All17 earlier exploratory PNGs also viewed; the first robot failure was a selector matching3status elements after a successful save, since corrected. At small sizes the dialog/page panels scroll; no universal every-state claim. Source-preview heading shots do not show the entire source artwork at small sizes; large side-by-side and rebuilt samples show the callout. By-eye review also removed visible internal object-reference codes and replaced technical results/status wording with Checked comment changes and a plain explanation.

Intermediate combined regression: all6comparison and2review-style cases pass, five captured comparison PNGs personally inspected. Its2callout cases were refused before app launch by the immutable snapshot guard after final native refusal checks changed; rebuilt and repeated those2successfully, without weakening the manifest fence. The comparison initial-open cloud candidate has bounded launch/native failure diagnostics and CI120/local60 render readiness; cloud root cause remains unproven. Will record that test change separately.

Requests for Claude: import reviewActions from actions-codex-review.mjs when integrating; ctx needs files/goHome/chooseFile/saveAs, optional capture. Include its generated fixture dependencies tests/helpers/review-callout.cjs and review-freetext.cjs on the spare-PC source runner (cloud repository already contains them). No robot.mjs edit by Codex. Existing harness opt-in: PDFIX_ROBOT_REVIEW=1. Upload for cloud proof and include in the next spare-PC run; not yet claimed as all six Done points. Exact current package may include earlier in-progress source; use package manifest, not HEAD assumptions. New full memory allocation counters are diagnostic follow-up only; A-R2 remains failed/open.

## October 18 — comparison cloud readiness candidate verified locally

Follow-up for39109191417: comparison's initial open had no pdf-paper at30seconds. It now uses the existing bounded launch/diagnostic helper and CI120/local60 actual-page readiness. All6comparison cases pass locally, all5captured PNGs personally inspected. No production change, expected-output weakening or retry. Newest39127085332has no Codex failures but a Claude forms failure; two full clean runs still absent. Docs/READER-CLOUD-READINESS-2026-10-18.md records the results and limits. Claude uploads; candidate still needs fresh-Windows proof. Existing comparison report has a minor singular/plural wording issue visible in its summary; left as a named P3 follow-up rather than expanding this readiness-only test change.

## October18 — X6 allocation-counter follow-up validated

Added non-collecting renderer heap/DOM/live-canvas counters to each natural-soak sample. Two-cycle normal-GPU hidden smoke passes workflow/source/markup/exit checks in235seconds and leaves no forced/surviving descendants. Receipt1jM0Yo records private561.83->644.76MiB while JS used8.35->8.07MB, backing~2.93MB, DOM2817->2687, listeners444->447,2documents,0connected canvases/pixels atHome. It remains memory pass=false (short), not a replacement for the full18-cycle failed gate. Eight memory/lease unit cases pass; no forced GC, heap snapshot, cache purge or production workaround. Full receipt and limits are in READER-NATURAL-SOAK-2026-10-17.md and Drive evidence. Next full instrumented run needs a quiet window after the priority package work, not another immediate long lock.

## October 18 — X1 uniformly formatted comment body increment, locally verified

Existing FreeText comments with one supported uniformly styled rich paragraph can now be edited without dropping
that rich structure. The source's standard font/style must agree with its plain text. Replacement text is escaped;
the style/tree seal and exact saved appearance text are checked. Only selected Contents/M/AP/RC may change; original
objects/private data and source bytes are retained. Mixed runs, default rich styles, unsafe XML, custom fonts,
unsupported glyphs/geometry, locks and overflow remain refused. No new dependency, service or sandbox/GPU change.

Verification: final full units 361 pass/0 fail/1 existing skip (362 total). Six new units cover safe rich parsing,
malformed/active XML refusal, style match, native/source/model/result validation, object preservation and independent
PDF.js appearance readback. Final locked built-app run passes all6 drawing-richtext/callout/review-style cases in
56.1s, including main save/reopen and unsupported-rich-format no-output/source-unchanged. Four final robot configs
pass, each independently checking the saved PDF, retained objects, exact rich field, original hash and appearance
text. No page errors; all apps close. Node PDF.js prints an XFA rich-text parser warning on this generated fixture;
plain text/normal appearance checks pass. No universal rich compatibility or real outside-software acceptance claimed.

By eye: 24 final PNGs personally inspected and preserved in docs/evidence/codex/richtext-ui. Roots BK70Id(800/100%),
yDWe0Z(800/150%), Glv0fI(1366/100%), nz4Epi(1366/150%). All earlier 24 exploratory shots also personally inspected.
Found opening policy text crowded the form; changed it to two short instructions plus expandable Editing limits and
draft files. Enter expands, Space collapses, focus stays visible. Fixture now explicitly declares its yellow fill,
so the before/after preview checks declared formatting, not an undeclared custom appearance decoration. Final small
source-heading shots do not show the whole original canvas; large before/after shots do show both comments.

| Screen / state | Current evidence |
| --- | --- |
| Comment editor opening | Passed locally, all four size/text configurations; short instructions replace long opening policy |
| Editing limits and draft files | Passed locally; keyboard expand/collapse and visible focus, four configurations |
| Edited/staged rich paragraph | Passed locally, all four configurations |
| Original/rebuilt page previews | Passed locally; responsive stacked/side-by-side panels, output independently read back |
| Reviewed result and saved confirmation | Passed locally, all four configurations; exact saved text/rich structure/object preservation |
| Unsupported rich source | Passed built app; Edit disabled, unchanged original, no output |
| Cloud / spare PC / exact package | Pending Claude integration/upload/package readiness; not claimed complete |

Requests for Claude: import richTextActions from scripts/user-robot/actions-codex-richtext.mjs when ready; include
tests/helpers/review-richtext.cjs and review-freetext.cjs in the spare-PC source runner. Same ctx contract as the
callout action. Harness opt-in PDFIX_ROBOT_RICHTEXT=1. Upload the committed source for cloud confirmation and include
this action in the next spare-PC run. I did not edit robot.mjs, your tools, package files, or use the spare PC.

Still open: X1 custom fonts and mixed layouts; X6 private-memory plateau (failed full gate, new natural allocation
counters only smoke-tested); X7 two clean full cloud runs. Latest read-only gh status still ends at39127085332,
which fails in Claude's forms lane; no uploads/dispatches here. Exact packaged graphics retry awaits the integrator's
ready-package handoff. This increment is not a claim that all six finish-plan Done points or all X1 are finished.
See STANDARD-RICH-COMMENT-EDITING-2026-10-18.md for supported/refused scope and reproduction.

## October 18 — exact Monday package checked

Checked Claude's 20261018T212559026-02d0cdb2 package, not a fresh Codex build. Five actual-package checks pass:
all5,673 inventory hashes/completion, outer launch and requested-file review, second-instance review/handoff,
correct sources unchanged, normal startup receipt and clean exit/no owned leftovers. Final two reader PNGs
personally inspected and preserved with receipt S8ewoH. Initial immediate second-file capture was stale; final
host-side paint delay shows the correct second drawing. Native requested-file confirmation is substituted before
clicking. Standard hidden rendering disables acceleration; this is not independent hardware-GPU acceptance.

Eight exact-launcher-byte native fixture cases also pass: accept/decline/both-fail/no-loop, interactive-save fence,
normal/argument roundtrip, unrelated and invalid-marker refusal. Real prompt controls run on a non-input test desktop;
all desktop handles close. Receipt R1hEC5 preserved. All four captures personally viewed, but black PrintWindow images
are explicitly not visual proof. Actual GPU failures are simulated; production settings/package unchanged. Earlier
wrong URL/installer/confirmation test attempts failed and were corrected; one early attachment failure forced only
its captured test process tree, final checks close naturally. See PACKAGED-READER-ACCEPTANCE-2026-10-18.md.

Requests for Claude: package checker confirms outer layout/handoff. Cosmetic A-CI1/ef9f3f4 is yours: missing separator
in runtimePDFix.exe icon lookup; outer executable target is correct. Uploads, installation/registration, spare-PC and
next package remain yours. I am proceeding to the full instrumented memory run under the long shared lease, then
remaining X1 source work; all app windows hidden. No spare-PC use.

## October18 — pre-audit comment work parked, owner font decision

Before the new whole-app audit arrived, a bounded standard-font mixed rich-paragraph adapter was already on disk.
It now passes eight focused mixed-run units, the full current unit suite (384pass/1skip), and two hidden native
save/reopen/refusal app cases. It retains source XML/style structure and all original objects; replacement spanning
different styles refuses rather than guesses. Individual font bounds, actual unkerned Tj advances and reset text
state are checked. Tests/fixture/standalone robot action are kept in the project, not hidden in chat or Temp.

This is **work in progress**, not all six finish-plan Done gates: four-size/text visual matrix, cloud, external
viewer and spare-PC acceptance are absent. actions-codex-mixedtext.mjs is NOT wired into Claude's robot.mjs;
existing reviewActions/richTextActions remain Claude's integration. Do not claim custom-font support or all X1 done.
No more feature implementation is being done while the V1 audit permits only data-loss/security/crash fixes.

Owner explicitly approved @pdf-lib/fontkit1.1.1. CUSTOM-COMMENT-FONT-PROPOSAL-2026-10-18.md records the exact bounded
scope and approval. Package/lockfile and installed dependencies have not changed; adapter installation/implementation
waits for feature resumption under the newer audit priority. Standard-only work has not silently substituted a font.

Left alone: Claude's document-images.js edit, shell/shared publication code, robot.mjs, private owner folder, all
private drawings and spare PC. The current installed Monday package remains the earlier clean combined package.
## October18 — V1 audit, desktop installation and cloud handoff

Read the owner's12-area audit and paused new feature work. Added lane evidence and per-save-family structure/signature
tables in V1-WHOLE-APP-AUDIT-2026-10-18.md; Claude owns the score. Only confirmed data-integrity fixes implemented:
- Pages now refuses signature markers outside AcroForm, attachment-bearing and tagged sources instead of silently
  making destructive fresh-catalog copies. Existing explicit annotation/metadata removal option unchanged.
- Markup now traverses bounded direct dictionaries/arrays/stream dictionaries for nested signature markers.

Verification: locked build succeeds; npm test384pass/0fail/1skip.27 targeted save/page/markup units pass plus two
full-object preservation cases (attachments, tags, CO/calculation actions, form values, metadata, outline).
Six new publisher fault tests cover partial-write ENOSPC/sharing injections, actual vanished folder,
post-publication cancel, competing copy publishers and real child termination during staging. Original bytes remain;
crash residue is explicitly incomplete, not a final file. No production publisher/security setting changed.

Hidden built app: FreeText/XFDF3/3, mixed-comment/Pages7/7, markup/Pages14/14 after correcting the new test's hidden
Save lookup. Four refusal screenshots at800x620 personally viewed and preserved in evidence/codex/audit-refusals;
all show usable Close/refusal, but stale Reading saved arrangement banner listed A-P-AUDIT2, not fixed under freeze.
Active-content generated-source check passes through reader/markup/Pages: no observed renderer HTTP/external opening;
independent saved page copy has no OpenAction/AA/Annots. This is not an OS-wide network capture or hostile corpus.
Fresh connected reader -> markup -> preserving reorder -> save -> reopen passes; note survives on correct reordered
page, both inputs unchanged. Receipt audit-connected-workflow.json preserved and reopened screenshot personally seen.
The full forced-close rotation/reorder/measurement/recovery chain remains UNVERIFIED, not equated to separate tests.

Memory: full instrumented normal-GPU94.03minute/18cycle session finished and released run lock. Workflows/source/
clean process exit pass, memory FAILS unchanged thresholds (+80.44MiB median,1.872MiB/min). W9AiHQ receipt archived.
Heap/DOM growth does not explain all native/private growth. A-R2 stays open; no speculative GPU/cache/GC workaround.

Owner requested installation: shipped combined20261018T212559026-02d0cdb2 package installed by its hash-verifying
per-user installer to LocalAppData/Programs/PDFix; desktop and Start-menu shortcut receipts point to outer launcher.
No launch, default-app association or personal-document change. This installed package predates audit fixes/WIP.
Main-PC install is separate from spare-PC install/uninstall/update acceptance. Spare PC untouched.

Requests for Claude:
-6a51211 fixes XFDF slow-runner readiness;2911b8c fixes FreeText wording. Both pass locally; upload and seek two full
 clean runs. No uploads/dispatches by Codex. Long soak lock is released; no further long run started.
- f17e11f preserves pre-audit mixed-comment WIP. Do not treat X1 or custom fonts as finished; no new robot.mjs wiring.
- Merge audit gaps/structure fixtures with your shared diff tool and whole engineering recovery job. Outside viewers,
 genuine signatures, all-route structure comparisons and real device/network faults remain open.
- A-CI1 installer icon lookup and A-P-AUDIT2 noncritical UI banner remain listed; editor/document-images.js left alone.

All important progress is in project docs and generated evidence, not only this chat. No private owner content read.
## October18 — owner's installed shortcut logo

Owner reported missing desktop/taskbar branding. Verified installed desktop/Start-menu shortcuts used outer launcher
PDFix.exe,0; that12KiB launcher lacks a branded icon. Corrected only those two installed shortcuts to the immutable,
inventory-hash-verified runtime/resources/app/dist/brand/pdfix.ico,0. Targets remain outer launcher. Updated each
shortcut hash in install-receipt.json so uninstallation can still recognize its own shortcuts. No matching pinned
PDFix launcher shortcut existed in the taskbar folder inspected; no pin or running window was changed. Shell icon
appearance/cache not visually verified. No executable, package manifest or production source modified.

Request for Claude (installer/package lane): use the packaged brand/pdfix.ico for shortcuts rather than either
launcher or Electron executable. The current runtimePDFix.exe fallback (A-CI1) lacks a separator, and even a corrected
Electron path need not contain PDFix branding. For future packages embed the approved icon in the outer launcher
and runtime identity consistently. User can pin the corrected desktop shortcut; existing cached pins may need renewal.
## October18 — owner requests portable branding fix, implemented

Owner explicitly asked to fix desktop/running-taskbar logos for any computer, including unpin/reopen. Limited clean
shared integration committed immediately per file:15b8cbd main icon/window identity,27417f4 installer icon path,
a17fd6a package icon verification. Own helper3ab66c3 plus native launcher build adds embedded seven-size PDFix icon
and iconSha256. These are cosmetic branding changes; graphics retry decision/limits/save fence unchanged.

Five focused tests pass (includes eight native retry scenarios). Native executable RT_ICON bytes match all seven
source sizes. Locked build succeeds. Hidden actual packaged-mode clone passes3checks: real window native shell
properties for icon/display/app-ID/quoted outer relaunch target; installer source selects same.ico; original package
unchanged. App closed naturally, no page errors. Receipt packaged-window-branding.json preserved. This is a test
overlay, not a new release or outside-PC visual proof. Details in WINDOWS-BRANDING-FIX-2026-10-18.md.

Requests for Claude: next combined package must include these commits; verify installed shortcut and running-window
logo/unpin/reopen/taskbar relaunch on spare PC AFTER its reserved run. No spare-PC use, package creation or upload by
Codex. No production package binary hand-patched. Current installed package still older; its local shortcuts corrected.
Earlier A-R2, structure matrices, engineering forced-close recovery, cloud and acceptance work remains open, not dropped.
## Owner screenshot follow-up: readable icon and Markdown overlap

The full-wordmark.ico really is too tiny at taskbar sizes. Replaced it with existing logo's document symbol only,
using deterministic alpha-bound crop/scaling in build-pdfix-windows-icon.mjs/pdfix-icon-artwork.cs. FullwordmarkPNG
unchanged. Seven Windows sizes plus512px standalone appPNG, personally inspected. Native resource test verifies
exact payloads plus minimum visible occupancy (75%height/50%width). Full unit suite388pass/1skip; native packaged
window properties pass again with new icon (hfeaO9, sanitized receipt/hash preserved). No AI brand redesign.
Main-PC desktop/Start-menu icon copies updated without app restart; no matching taskbar pin remained to change.
Running old release and spare PC still need Claude's new package; neither production executable hand-patched.

Requests for Claude: owner Markdown screenshot is confirmed A-C-MD1, even at Fit width. Source pane uses inline210mm
and1.37/2CSSzoom while assigned half a grid. At1366 source right1329(Fit)/1829(200) covers preview starting797.5.
Read CLAUDE-MARKDOWN-LAYOUT-REQUEST-2026-10-18.md. Read-only generated reproduction and two personally inspected PNGs
archived under evidence/codex/markdown-layout-report. No source-preview/document-zoom/editor source edited by Codex.
This is NOT fixed yet; please repair within your lane and check Markdown/CSV source/preview/split, zoom/resizing,
typing/save/reopen and large interface text. User report is a repair request, not new feature scope.

Other earlier work remains open and recorded: A-R2, all-route structure matrix, long engineering recovery chain,
cloud confirmations and human/device/outside-viewer acceptance. Font adapter approval remains; audit priority pauses
new feature implementation. No uploads, new package or spare-PC actions by Codex.
Branding regression qualification: initial full388pass/1skip; a later full repeat387pass/1fail/1skip hits compression
independent-output AppContainer startup while expecting overwrite refusal. No output published; isolated compression
suite10/10 passes. Underlying intermittent sandbox/resource cause not established, no security fallback added.
Confirmation full run pending; retain both logs rather than treating one retry as a fix.
Quiet full confirmation388pass/0fail/1skip (389total). Both failure and confirmation retained. New icon/branding changes are ready for Claude's combined package; Markdown layout is still an editor-lane repair request, not claimed fixed.

## October18 continuation — route structure coverage

New tests/pdf-audit-save-routes.test.cjs passes21cases: preserving reorder; outline; boxes; print marks; thin lines;
page numbers/Bates/header/footer/watermark/stamp; takeoff; XFDF; replacement-sheet supported/refused cases; flattened
text markup; contained lossless compression; four signature-marker variants over eight preserving/opening routes.
Successful outputs are written and independently reopened, all unrelated source objects compared, actual attachment
payload/tag/form/CO/calculation retained. PDF.js checks visible added text; native lossless output and negative
CO/tag corruption checks pass. Initial failed tests were test configuration errors (Windows font URL trailing slash,
and expecting inspection to throw instead of reporting revision blockers); corrected, not production bugs.

Full unit suite before the last two added cases407pass/1skip (408total); all21targeted final cases pass. No production
changes for this increment. See READER-SAVE-STRUCTURE-AUDIT-2026-10-18.md for exact layer/route limits. No score raised.
Long engineering recovery script is being finalized separately; do not infer its proof from these unit cases.
## October18 — engineering forced-close recovery

check-reader-engineering-recovery.mjs passes13steps in the hidden built app under agent-run: initial bare-page
organize/rotate, note, calibrated measurement and JSON/PDF output, preserving reorder, acknowledged unsaved markup
draft, actual captured Electron-main termination, same-profile recovery, final save/reopen and independent PDF-lib/
PDF.js inspection. Three final screenshots personally inspected, receipts/generated files/hashes preserved under
docs/evidence/codex/engineering-recovery. Main termination and normal exit leave no captured processes; errors[].

Initial attempts targeted the Windows wrapper and are superseded by captured-main termination proof. Earlier files
remain byte-identical. Final source order3,1,2; rotations0,0,90; both notes retained; ledger exact; recomputed100mm.
A-D-AUDIT2 explicitly records older annotations becoming non-editable and takeoff text retaining original page1
after preserving reorder. No speculative metadata rewrite. No kill-mid-save, power-loss, external viewer or
Claude cross-lane claim. Spare PC untouched, no upload/package. Requests for integrator: merge bounded evidence
and list A-D-AUDIT2 accurately; cloud/package/device confirmation still outstanding.


### Reply/history common-fixture audit

Added two Unicode reply cases to tests/pdf-audit-save-routes.test.cjs: no status and Accepted/Review. Disk readback
retains all original objects except appended page Annots; attachments/tags/widgets/field calculations and parent
comment/appearance/private data stay. PDF.js independently reads new reply/status/appearance. All23targeted cases
pass. Initial reference-key vs PDF-reference expectation corrected in the test. No production change.
Full unit run after engineering recovery but before these two additions:409pass/1skip (410total).


### October18 — font-resource instrumentation

Added read-only FontFaceSet counts (faces/families/loading) and stylesheet counts to the existing reader soak
samples. No font names/paths, forced GC, heap snapshot, cache purge or production graphics setting change.
A normal-graphics hidden smoke completes two cycles/235seconds with source unchanged, independent markup readback,
no process/page failures and clean exit (zero forced or surviving owned processes). In both cycles, open state
records1font/1family/2stylesheets/26connected canvases; closed state records0fonts/0families/1stylesheet/0canvases.
This rules out accumulation in those live counters over these two cycles only. Native caches/off-DOM objects and
long-session ownership remain unproven. Private bytes rise566.96to634.68MiB; the two warmup cycles cannot establish
a plateau. The unchanged duration gate correctly returns eligible:false/pass:false. The smoke exit0 certifies
workflow/instrumentation only; A-R2 stays open after the earlier two failed full soaks.
Evidence: docs/evidence/codex/reader-font-resource-smoke.json plus hashes. Run lock released; no app left running.


### October18 — real Windows exclusive file locks

New tests/pdf-save-windows-locks.test.cjs passes3cases using a separate hidden PowerShell process with an actual
FileShare.None handle (no mocked filesystem call): locked existing destination; locked retained-stream source;
locked verified stage. Existing destination/source bytes remain exact and reopen independently. The first two
cases leave no stage/final copy. When Windows also blocks cleanup of the owned stage, the publisher returns PARTIAL
and names the artifact instead of claiming success or deleting another process's file. After releasing the lock,
the test checks retained staged bytes; any possible final link must contain the complete staged PDF and be named
in the error. Owned lock-holder processes release and exit normally.

These are real local NT sharing-handle boundary checks of the shared publisher used by reader/Drawing/Pages,
not the renderer message, remote SMB/USB loss, full disk, app kill-mid-save or power failure. No shared publisher
code changed. They supersede the earlier NT-lock-unverified statement only for these explicit local cases.


### October18 — reader-only diagnostic and real-lock suite confirmation

The soak now accepts --reader-only only together with --smoke; normal/full runs still require markup saved-file
verification and the unchanged memory limits. Two reader-only normal-graphics cycles/137seconds pass workflow,
source-unchanged and clean-exit checks, with no captured process/page failures. Settled private memory475.71then
536.80MiB; embedder7,461,320then8,218,112bytes. Both closes have0live fonts/canvases,1stylesheet. No markup save was
performed or claimed. Evidence: reader-only-memory-smoke.json and hashes under docs/evidence/codex.

Growth during reader-only warmup means the short-term symptom does not require a markup save, but does not
identify a leak/owner or establish a plateau. This is not a controlled same-runtime A/B study, not a performance
pass, and does not supersede the two failed full soaks. No speculative production fix, GC or GPU change.

Full unit confirmation after the two reply cases and three actual Windows sharing-lock cases:414pass/1skip
(415total), log tmp/codex-native-lock-unit.log. The skipped pre-existing case is not newly marked passing.


## October18 — actual app termination mid-save

The same check with --mid-save passes14steps. In the test app only, the existing file writer is paused after
writing and flushing17bytes of the chosen generated destination's .pdfix-UUID.partial file. The final filename
does not exist. The actual captured Electron main process is then terminated; its children exit without force.
The same temporary profile reopens, recovers the exact acknowledged markup draft and saves a complete final PDF.
Independent PDF-lib/PDF.js checks confirm page order/rotations, notes, exact measurement entry and recomputed100mm;
all earlier source copies remain unchanged. No page errors, normal close leaves no owned processes.

The17byte .partial remains identifiable after process death and is never presented as a completed copy. It is
retained as interrupted-stage.bin in evidence/codex/engineering-mid-save with generated inputs/outputs, report,
SHA-256 manifest and3personally inspected screenshots. This proves this markup/native-copy publication path
under an injected mid-write pause plus actual process termination; not every save path, actual full disk, power
loss, SMB/USB disappearance, shared editor recovery or storage-controller durability. The prior statement that
no app kill-mid-save check exists is superseded only for this bounded case.

The first attempt failed before injection because dynamic import is unavailable in Playwright's main evaluation
context. The check now uses the running Electron's built-in module access; that attempt closed cleanly and is
not a product failure. No production writer, graphics, security or recovery code changed.


### October18 — malformed-input refusal and next-job recovery

New scripts/check-reader-damaged-recovery.mjs passes4generated cases in one hidden built-app session under
agent-run: empty input, text with .pdf ending, PDF header without objects, catalog without page tree. Each gets
a plain refusal in104–261ms; the two parser failures reach PDF unavailable, not just a stale toast. After EACH
failure, a valid PDF opens, an unchanged copy saves, independent PDF-lib readback verifies geometry/page count
and exact SHA, and the copy reopens with expected text. Original good and bad files remain unchanged.
No uncaught page errors, observed renderer HTTP requests, shell-open attempts, forced cleanup or surviving
captured app processes. This is a four-file generated boundary corpus, not fuzzing, all-tool/native coverage,
OS-level outbound capture, denial-of-service certification or a real hostile-file collection.

All4error screenshots personally viewed; generated fixtures/copies/report/hash manifest preserved under
docs/evidence/codex/damaged-reader-recovery. Reader failure state remains usable and messages provide a next step.
Requests for Claude: transient shared toast overlays Home's heading and the reader toolbar in these screenshots.
That visual placement is a shell/design issue; listed for the current UI work, not modified during this audit.
No new production bug or production code change from these cases. No spare-PC use or upload.


## October19 — approved one-place reader toolbar, first increment

View, Comment, Edit, Fill & Sign, Pages, Protect, Measure, Export now appear in that fixed order above an open
PDF. Existing tools are buttons; view/selection settings sit alongside the page. The visible Tools & view menu
and PDF tools shell menu are gone in the main reader. Original shell button callbacks/large-file restrictions
are retained by moving the actual controls; duplicate Edit content is reduced to one. Private preview readers
temporarily retain compact menus. Find a tool filters the available controls; shared search/name integration
is requested from Claude in READER-ONE-PLACE-INTEGRATION-2026-10-19.md.

check-reader-one-place.mjs passes all8groups, source unchanged, actual markup save and independent disk annotation
readback at1366x820/800x620 and100/150% text. Search clear/Escape and arrow-key tab focus pass. Initial screenshot
review caught the short-window large-text controls pushing the page away; corrected with bounded scrolling tools
and a minimum page-height assertion. All14final PNGs personally viewed, report/output PDFs/hashes archived in
docs/evidence/codex/one-place-toolbar. Shared toast still covers tabs briefly: request for Claude remains.

This is the toolbar increment, not a claim that all underlying dialogs are already in-place. Comment, Pages
thumbnails/preservation, live previews and old test/robot navigation migration follow. No spare-PC use or upload.
Requests for Claude: fetch run3 failing robot seeds; supply shared names/search and onProtect entry point; migrate
check-integrated-ui's old Drawing review menu click. Existing source callbacks for your tools remain callable.


## October19 — Comment on the open page and direct text entry

Selecting Comment opens editing on the existing reader page with options beside it, rather than a modal and
second source viewer. Highlight, Underline, Note, Text box, Draw, Line, Arrow, Cloud, Callout, Move and ink-erasing
are direct buttons; the old internal tool selector is hidden. Ink/highlighter settings are contextual; saved
styles and long drawing/recovery details are folded. Stamp still opens the existing decoration workflow (step4).
Source-comment review still uses its existing separate panel; moving that panel fully beside the page remains.

Click Text box, click on the PDF and type directly. Default black is validated by both model and recovery and
persists as PDF FreeText. Escape finishes editing. Save comments and Ctrl+S use the existing independent build/
verification/publication pipeline; common header Save also includes edited comments. Ordinary save does not leave
a second preview pane. Explicit flatten still requires the separate preview/save review. Managed existing
markups use their stripped baseline while editing, restoring the original reader document on exit to avoid
drawing the old appearance beneath edited text. Source bytes never overwritten. Edit also has Add text shortcut.

check-reader-comment-in-place.mjs passes4window/text configurations: live typing, focus, no fit-width sideways
scroll, canceled save, black saved annotation, original unchanged, clean overlay removal. It additionally reopens
the saved text, edits it in place and saves through the header: exactly1updated FreeText survives; the prior saved
file remains unchanged. All5final screenshots personally viewed; generated outputs/report/hashes preserved in
docs/evidence/codex/comment-in-place. The first check found an unsupported viewport-rectangle method; fixed with
the existing supported point conversion. A subsequent by-eye stale fit-width issue was fixed by awaiting the
reader render before enabling Comment tools. No page errors in final checks. Full units416pass/1skip (417total),
including the independent black-text/recovery round trip and Claude's shared registry test.

Reader now consumes Claude's TOOL_GROUPS/TOOLS/toolByName registry and hasToolStrip integration contract. Existing
onProtect/onFindTool/onSecurityReport/onCertificates/onOcr/onEditCopy callbacks are accepted; main Edit duplicate
is removed. Find a tool filters canonical names/aliases and Enter invokes shared search. Please forward the query
in onFindTool and commit the shared registry before upload. Tests/robot navigation migration remains in progress;
no full app/cloud/package pass claimed. Requests/evidence from spare-PC run3 fetched by Claude, source untouched.


## October19 matching UI/robot checkpoint (A: urgent integration)

Reader/Comment/Pages robot navigation now uses the eight tabs and direct Comment buttons; Pages tasks use the inline Organize PDF pages region. Extract opens Page options first. Page saves wait for completed disk verification, not just file existence. Review/rich/mixed-text tasks use Comment. Export's editable-text-copy callback is explicitly placed under Export to match the existing shell robot/password check; the shared registry currently calls its group Edit, so Claude should move that registry entry to Export. Callback captions and all other grouping use the shared registry.

| Item | Evidence / honest status |
| --- | --- |
| Reader + markup + Pages rotate/delete/extract/combine robot tasks | Six pass in one hidden built-app session; each saved file independently checked. Receipt pdfix-codex-robot-5HkLlG. |
| Drawing robot | Menu migration matches; first run exposed a click before measurement readiness. Button now waits for rendered Page view and driver uses Fit page. Follow-up app proof pending the shared run lock. |
| Thumbnail drag / preserving default reorder | Four size/text configurations pass, including canceled save; original page object references, comment/link objects, outline target and metadata independently retained. Eight screenshots personally viewed. Generated evidence in docs/evidence/codex/one-place-pages. Badge placement/lazy-image screenshot timing subsequently improved; final new capture pending. |
| Automatic Compress / numbering / Print | All three update automatically at four configurations; compressed/numbered saved PDFs independently reopened; canceled print uses a recording stub, no physical printing. Twelve screenshots viewed in docs/evidence/codex/live-previews. By-eye follow-up: Print preview is below settings, and Compress preview is tiny at800x620/150%; these are not visual acceptance passes. |
| Existing source comments / FreeText / XFDF / recovery | Four affected built-app regressions pass. Closing inline Comment now clears its temporary input lock; the old lock made later tools unclickable. |
| Advanced five-mark proof preview | One existing regression still fails from a measured201/215px height oscillation (horizontal scrollbar track). A bounded preview track fix is implemented; rerun pending the shared run lock. Do not report a full desktop-suite pass. |

Next: finish matching Drawing/robot confirmation, final thumbnail captures, advanced-preview repeat; then improve Print/Compress small-window layout, flatten private preview menus, and add the requested robot coverage. A-R2 remains failed/open. No new90-minute soak, spare-PC access, cloud upload, real printing or release package performed. Claude's clean-copy build and two consecutive cloud runs remain separate gates. Broader V1 save/hostile-file audit stays open; earlier generated fault evidence remains valid for its stated routes.

Requests for Claude: copy the complete matching actions-codex*.mjs set with this UI checkpoint, not an older isolated helper; migrate robot.mjs/document-print.spec.js/images.spec.js from Prepare preview to Refresh preview (previews now start automatically). Please move edit-copy in the shared registry to Export. Existing Home/All tools routes must open the current reader before calling tools if they should use the in-place mode. Source shell/shared desktop code was left alone.


## October19 evening — matching robots and preview follow-up

The core seven reader/markup/Pages/Drawing actions now have built-app saved-output proof with the eight-group UI. The urgent matching checkpoint is a76a22a; copy the complete actions-codex*.mjs set. Two more opt-in actions cover all eight groups/Find a tool and thumbnail drag with retained comments/links/bookmark destination. Print and Compress now put settings beside the preview; print imposition changes refresh automatically; private previews have one flat options list. The advanced five-mark proof regression and XFDF reopen now pass.

Detailed per-screen status, before/after list, generated outputs and limitations: [READER-UI-ROBOT-CHECKPOINT-2026-10-19.md](READER-UI-ROBOT-CHECKPOINT-2026-10-19.md).54focused unit/save-fault cases pass. Four-configuration live-preview and thumbnail checks pass; all their final PNGs personally viewed. One preceding preview run needed forced process cleanup and remains recorded as failed; the complete final run exited cleanly. Cleanup ownership now also rejects pre-existing processes with a recycled parent PID. No cloud/spare-PC/package/physical-print acceptance claimed.

A-R2 remains failed/open; no new full soak or graphics setting change. Remaining broad robot coverage and audit cases are listed in the checkpoint. Requests for Claude: shared registry edit-copy under Export; copy current full action set; migrate your preview names; move the shell toast away from controls; bound recursive shared structure inventories before hostile-file use; upload and obtain two clean cloud runs. Spare PC untouched.


### October19 memory continuation

UI/robot follow-up committed as83b8c6b. A-R2 analysis of the existing94-minute receipt separates a steady main process (78.00→77.39MiB) from sustained renderer growth (98.89→202.64MiB;1.251MiB/min after warmup) and bursty graphics allocation. New opt-in native sampling smoke completes2cycles/190seconds with saved-output/source checks, no page/process errors, clean exit and no forced/surviving children. Connected canvases/fonts return to0; sampled estimates and address-only stacks do not identify a component. This is not a plateau pass. No production workaround, forced collection, threshold change or GPU/security change. Details: [READER-MEMORY-INVESTIGATION-2026-10-19.md](READER-MEMORY-INVESTIGATION-2026-10-19.md); raw generated receipt and prior-process analysis preserved in docs/evidence/codex. Five focused memory-report/profiler units pass. Run lock released; no spare-PC access.
# October19 late evening: remaining-work continuation

The full uninstrumented normal-graphics reader soak acquired the Codex run lock at21:46 PDT and completed19cycles/91.99minutes. Every saved markup is independently verified, source unchanged, no page/process failures, clean close with zero forced/surviving children. Original memory gate passes: earlier/later medians746.57/730.78MiB, slope0.604MiB/min, settled peak781.96MiB. Full receipt and runtime identity in docs/evidence/codex/reader-memory-2026-10-19. This is one local generated100-page workflow, not a universal leak-fix or weaker-PC guarantee. Historical failures remain recorded. Run lock released; no spare-PC access or upload.

The optional native diagnostic now retains bounded module build identities and module-relative address offsets; four focused profiler tests pass. This is diagnostic support, not a production memory fix. New robot actions and a current-layout hostile-content regression are being prepared separately and are not yet app-verified.
# October19 signed-source boundary extension

The23-case structure/save-route suite passes again, now with48 refusal assertions: orphan signature, nested signature-field, ByteRange and certification markers across12routes. Added tag editing, repair, cleanup and portfolio creation; each refuses rewriting and retains original bytes. This is generated-marker refusal evidence, not real signature validity or signing-provider acceptance. Shared save-safety/fault/Windows-lock/preservation checks also pass20cases (including two new robot-verifier cases). Full unit suite:451pass/1skip/0fail. The2new map-display unit cases are included; the map fix's built-app rerun is pending Claude's active check lock.


## October20 — complete robot module dependency set

The remaining/native candidate modules are now committed with their importer. They stay in `candidateActions`, outside active overnight coverage until their checks pass. Two independent evidence-verifier units pass; script syntax checks pass. New candidates currently expose unresolved thin-line and initial-tag native refusals; do not enable all candidates. The three established crop/comparison/compression routes are being checked against the shared tool registry and All tools migration. The92-minute normal-graphics memory gate passed locally in1ae8ab3; its lock is released. No spare-PC use or upload.


### Established robot routes restored

Crop boxes now use Pages; revision comparison and reopened sheet sets use Measure; compression opens the generated PDF then the Export tool instead of a removed Home tile. Registered tools resolve their group from `src/tool-registry.js` rather than legacy room names. All three reported actions pass in the hidden built app at1366×820: independently reopened crop geometry, smaller intact compression output, and exact unchanged comparison-source copy. No page errors; clean exit. Receipt: `docs/evidence/codex/reader-remaining-2026-10-20/T5CKuO/report.json`. Claude can copy the complete committed action module set; candidateActions remain opt-in.


### October20 — confirmed cleanup, repair, geographic and narrow-filter fixes

The four fixes are recorded under the new October20 known-issue rows.28targeted units pass (including23save-route cases); the latest generated-file native action run passes its first13actions before thin-line refusal. Saved cleanup, repair and map outputs were independently reopened. Four larger-window final screenshots personally inspected; small map/filter images inspected earlier. The new candidate driver initially misread a harmless empty Names dictionary; corrected. UI-only residuals: repair preview remains small, geographic optional-reference placeholders truncate, and some report wording remains technical; these are listed rather than called finished. No unverified candidate is enabled overnight.


### Bounded decoder repair — October20

Tiny thin-line and initial-tag builds used full ceiling-sized reads; PDF-lib reserves the requested length before EOF.64KiB incremental reads now preserve the old4/8/9MiB stream limits and aggregate contained security limits. Both native saved-file actions pass in FBJDDc, alongside reviewed blank-page removal and Home entry coverage. Original comments,0.5-point selected paint followed by0.1-point graphics-state restoration, linked PDF.js paragraph structure and retained source hashes independently checked. Initial verifier assumptions about restoring widths and nested Document/P trees were corrected against actual PDF semantics. Four output screenshots personally viewed. Decoding-bound units and actual encrypted-source refusal pass. No unrestricted engine, security limit increase or production graphics change.


## October20: Home quick tools and matching coverage

Home/More toolbar ready for integration: all ten approved Home entries call existing tools; source Find/Print and Save callback retain permissions. More closes after tool selection; layers/dialogs restore visible focus. Registry unchanged. Home IDs for Claude: read, highlight, note, edit-content, ink, fill-sign, organize, find, print, save-copy.

Evidence: docs/evidence/codex/home-coverage-2026-10-20/. All18new actions pass at both sizes,60keyboard states pass, four toolbar configurations pass; units474pass/1skip. Migrated desktop33/34, corrected old outline route then focused3/3paged outline/search pass. No cloud/spare acceptance claimed. New18actions promoted into additionalActions; core7 unchanged. Copy complete actions-codex*.mjs set.

Final capture-by-capture visual review remains pending; limits in READER-REMAINING-PROGRESS-2026-10-20.md. Shared toast obscures top controls at800/150 (request for Claude). Area-selection disappearance reproduced in2/3reader rectangle tests and is next. No spare-PC use, upload, printing, real signing or production graphics/security change.


## October20 follow-up: selected-area copy survives redraw

Reproduced2/3reader rectangle failures. Same-page redraw cleared the result. Completed geometry is now retained without old DOM ranges; the fresh text layer regenerates words/highlights. Different page/document/rotation, unavailable text, explicit clear and permission loss invalidate it. Five targeted units and all3built-app reader rectangle cases pass, including350ms, resizing and navigating away/back. Only the3owned reader tests in document-editor.spec.js changed; Claude's editor tests untouched. Personally viewed final aligned highlight/result screenshot in selection-reflow evidence.

Final Home/More screenshot review is complete:18toolbar,22large-action,22small-action and8keyboard captures personally inspected. Captured-state observations and remaining polish are listed in READER-BY-EYE-UI-2026-10-16.md; no claim every branch is perfect.

Guide rehearsal also found All tools opened markup while Home stayed selected, hiding its toolbar. The reader now selects Comment/Pages when those inline tools are opened externally. Guide repeat pending. No shared shell files edited.


### Final guide and narrow-window fixes

Guide default rehearsal6/6 passed with saved note/arrow/cloud readback and recomputed100mm takeoff. Small800x620/150% then exposed20-pixel drawing width: search, navigation and Comment side panels were all open. Reader now temporarily folds search/thumbnails when entering Comment in a narrow window, restores them on close, and does not change saved preferences. Embedded proof readers start with their own panes closed and do not save their pane changes as main-reader preferences. Final small guide6/6 passes, with >120pixel drawing-width assertion, restored panes and isolated proof panes. Three final screenshots personally inspected. No physical printing.

All-tools Comment and direct reader Pages entry now select the matching tool group. Default guide passed before final narrow/preview changes; final small guide verifies those changes. Full unit run482pass/1skip before the last pane-layout-only increment; focused selection/keyboard12pass. Current cloud/package acceptance is for Claude after upload, not claimed here.


### Requests for Claude (entry integration)

All tools markup now reaches visible Comment tools through the reader fix. All tools Organize still calls shell openPageWorkspace(file) directly (app.js task pages), which creates a separate modal; this does NOT use reader.openPagesMode. Please route that task to the already-open reader's openPagesMode after opening completes, preserving the existing no-whole-file guard and the reviewed-blank-selection special case. Reader direct Pages opens now select their matching tab. Shell file left alone. Please also address the shared top toast and tab-name crowding shown in final guide screenshots.


### Integrated UI comment-step migration for Claude

New comment now switches the existing reader to Comment. Assert the visible Comment tools toolbar's Note button is aria-pressed=true; the drawing page is the main document-area pdf-paper (data-page2), not a paper inside markup-workspace. The options region is PDF comment options; its textarea remains Markup comment or text. Place on the global Markup drawing surface, then Save comments in the main toolbar, or the region's Preview annotated copy/Save annotated copy. Verify the saved annotation Contents independently, rather than only checking file size. The legacy hidden Markup tool combobox is intentionally removed from the visible flow. I left check-integrated-ui.mjs to you because its fullscreen step is known to surface a hidden window; do not interpret this as permission to show it.

New report: initial Sheet sets marks itself dirty on open. Baseline now starts clean; two real-method units verify untouched departure and refusal after edits. New bounded generated-file check-reader-sheet-departure.mjs will verify actual close, refused unsaved quit and saved-library disk readback once the shared lock releases.


## October20 final checkpoint and lock blocker

Committed9efaf98(Home/More + matching18actions) and dfb975e(selected-area reflow, visible Comment entry, narrow markup/proof pane isolation, guide/visual evidence). Full units484pass/1skip; two new Sheet-set departure units also pass separately. All own app sessions closed.

Sheet sets: opening the original creates an unchanged default arrangement; it no longer starts dirty. Edited arrangements still refuse departure. New script check-reader-sheet-departure.mjs checks clean close, refused unsaved quit, saved JSON contents and unchanged original, but has NOT run yet. Treat this last fix/check as work in progress until built-app validation.

Blocked app validation: Claude's check-ui-screens wrote its final report at13:29:51PDT but remained alive, holding app-run.lock from20:21:48UTC (wrapper23504, script20780) beyond13:32PDT. No Claude process or lock touched. Canceled only Codex's verified waiting wrapper31340 (zero children); it had not launched any app. Final post-pane rectangle repeat and the new Sheet-set native check remain pending. Earlier3/3rectangle proof and final6/6small guide remain valid for their captured builds.

For Claude: finish/stop your own UI check and clean its owned descendants, then release the normal lock. Its close() races app.close against15seconds but does not stop an owned process tree after timeout, so a finished report need not mean a finished process. Please fix that cleanup in your script. After release: agent-build codex, then locked rectangle cases and check-reader-sheet-departure.mjs. Keep the app hidden. No spare-PC use/upload/printing.


## October20 resumed verification: initial sheet-set close and area selection

Shared lock released normally; no other agent process was stopped. Built committed09be9b7 and ran check-reader-sheet-departure.mjs: both native cases pass, untouched close allowed, edited quit refused, saved named-library JSON independently read (two sheets/exact changed title), original byte-identical and no forced cleanup/errors. Two screenshots personally inspected. First driver attempt used an ambiguous role=status and was corrected; no product failure inferred. Evidence: docs/evidence/codex/sheet-departure-2026-10-20/. All three reader rectangle cases also pass on the rebuilt app (7.7seconds), including resize/350ms persistence and navigation invalidation. This supersedes the previous blocked/WIP status only for these checks; cloud/package acceptance remains separate.


## October20: visual polish and expanded save evidence

Built hidden-app checks pass: five independently verified native actions at1366x820/100% and800x620/150%; four toolbar configurations;60keyboard states; both Sheet-set departure/save cases. Personally reviewed all44screenshots (16native,18toolbar,8keyboard,2sheets). Evidence: docs/evidence/codex/ui-polish-2026-10-20/. Repair proof fills its frame (page height>200px asserted); geographic inputs have visible labels; singular counts corrected; saved sheet sets clear stale unsaved warnings. Comment controls use one bounded scrolling region with sticky group tabs.

Still imperfect: small150% layouts with all panes open need considerable scrolling; shared top toast overlaps header (Claude request); technical FDF/portfolio/outline copy remains long. Keyboard reachability passes, not every layout is polished.

Save audit:44route cases plus16failure/safety/Windows-lock cases =60/60pass. Nine markup kinds independently reopened in editable and flattened modes (notes stay editable); encoded original content, attachments, tags, field value/calculation, outline and unrelated annotations checked within each route policy. Added metadata cleanup, portfolio attachment and real sandbox repair, including wrong-fingerprint refusal and discarded-output invalidation. No production codec change needed. Physical full disk/power loss, every UI interruption route, real certificates and outside-viewer acceptance remain unverified.

Cloud39491483690: build/unit/smoke job passes, desktop pending; excludes latest changes. Claude uploads and obtains two clean full runs. Real-corpus performance/memory checks continue separately. No spare PC, uploads, physical printing or production graphics changes.
