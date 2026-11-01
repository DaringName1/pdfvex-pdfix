# Saved master-list coverage

**October 7 additional scope:** R41/A01–A25 in [ACROBAT-COMPETITIVE-PLAN.md](ACROBAT-COMPETITIVE-PLAN.md) adopt all ten supplied Acrobat comparison categories. This extension preserves the 71 original M IDs and source file; covered specialist first-release exclusions now also have explicit later planned targets. Existing master acceptance checkboxes retain their evidence.

**Current whole-scope status (October 4):** [complete feature/debug/testing inventory](PDFIX-COMPLETE-STATUS-2026-10-04.md) and [full future list](PDFIX-FUTURE-FEATURES.md). These distinguish older executed tests from newer untested code and unfinished acceptance; older entries below are historical checkpoints. New R40 requires PDF-only fullscreen.


Saved 2026-10-02. The source is preserved verbatim in [PDFix-Missing-Features-Master-List.md](PDFix-Missing-Features-Master-List.md). Every feature below is in the plan. Saving a requirement does not implement it. Existing subsets have narrower evidence in FEATURE-TRACKER.md and PHASE-LOG.md; the complete master-list acceptance targets remain open.

## S00 — Security Sandbox (explicit user addition)

Required: Windows OS containment for native document engines; job-only file grants; no network capability; bounded memory/processes/time; cancellation kills the contained process; no unsandboxed fallback. Renderer sandbox, blocked active document content, narrow IPC and chosen-file grants remain mandatory. Native Node workers are not OS sandboxes. Security review and hidden runtime containment checks remain release gates.

## 1. PDF security, cleanup, and protection

- [ ] M01.01 — **Verified permanent redaction:** remove selected text, regions, image content, and underlying objects so hidden information cannot be recovered. Search repeated words/numbers, show every match, and require review before applying.
- [ ] M01.02 — **Sanitize before sharing:** inspect and selectively remove metadata, embedded attachments, hidden layers, comments, form values, scripts/actions, and other hidden content. Show what will be removed.
- [ ] M01.03 — **Password protection and changes:** add or change PDF passwords using a reviewed implementation; explain permissions and never bypass access controls.
- [ ] M01.04 — **Digital signature validation:** detect certificate signatures and report valid, invalid, or unable to verify only when a reviewed validator supports the result. Warn when edits may invalidate signatures.
- [ ] M01.05 — **Separate signature types:** distinguish visual signatures, certificate-based signatures, and external signature requests.
- [ ] M01.06 — **Safe links and attachments:** show external destinations before opening; list attachments with type/size details and save only to a chosen location. Never execute PDF scripts or auto-open extracted files.
- [ ] M01.07 — **Plain-language security report:** explain encryption, signatures, active content, attachments, and unsupported structures.
## 2. Compression, conversion, and PDF creation

- [ ] M02.01 — **Compression with quality preview:** show expected size savings and let users inspect quality before saving. Disclose possible loss of text, forms, links, annotations, or other structures.
- [ ] M02.02 — **Broader conversions:** support more tested conversions between PDFs, documents, images, and data files. For each, disclose what happens to fonts, page breaks, images, links, bookmarks, forms, and annotations.
- [ ] M02.03 — **Multiple images to PDF:** add an ordered image list, per-image rotation, page layout, paper size, and recoverable source references. Current documented workflow makes one PDF from one image.
- [ ] M02.04 — **Create PDFs from text/documents:** provide page size, margins, fonts, page breaks, and preview.
- [ ] M02.05 — **More export options:** save a page or selected pages as images; export selected pages as separate PDFs; consider reverse PDF-to-image conversion.
- [ ] M02.06 — **Page additions:** insert blank pages, replace pages with corrected scans, and add page numbers, headers, footers, watermarks, or reusable Draft/Approved/Reviewed stamps.
- [ ] M02.07 — **Metadata tools:** inspect and optionally edit or remove title, author, subject, keywords, and other supported metadata.
- [ ] M02.08 — **Output naming:** offer clear names, keep-both, and destination choices; never silently overwrite originals or unrelated files.
## 3. Paper, print, engineering, and architecture drawings

- [ ] M03.01 — **Paper-size presets:** common US Letter and Legal, engineering ANSI A–E, architectural ARCH A–E, and ISO A-series such as A0–A4, where supported by the operation.
- [ ] M03.02 — **More page views:** single page, continuous scroll, facing pages, two-page spread, and side-by-side pages, with clear page order.
- [ ] M03.03 — **Large-sheet navigation:** smooth pan and zoom, zoom-to-region, fit-sheet, and return-to-previous-view for blueprints, plans, schematics, and maps.
- [ ] M03.04 — **Scale-aware measurement:** calibrate drawing scale first, then measure distance, perimeter, and area with visible units and a way to confirm calibration.
- [ ] M03.05 — **Drawing markups:** dimension lines, arrows, callouts, revision clouds, and color-coded comments alongside notes, highlights, and drawing tools.
- [ ] M03.06 — **PDF layers:** show or hide layers where the PDF contains them.
- [ ] M03.07 — **Drawing revision comparison:** align sheets and compare with a transparent overlay or side-by-side view; allow alignment adjustment when scale or position shifted.
- [ ] M03.08 — **Large-format printing:** print at actual size, fit to a chosen sheet, or tile across pages with overlap and alignment marks. Include ranges, orientation, scaling, and multiple pages per sheet.
- [ ] M03.09 — **Booklet printing:** provide layout preview and clear paper/duplex requirements.
- [ ] M03.10 — **Sheet sets:** group related drawings, navigate sheets, and preserve order.
- [ ] M03.11 — **Drawing information:** show sheet number, title, revision, dimensions, and page size when present.
- [ ] M03.12 — **CAD boundary:** do not imply PDFix edits CAD models; DWG and other CAD formats need separate decoder, licensing, and corpus evaluation.
## 4. Forms, signatures, and review

- [ ] M04.01 — **Create basic fillable forms:** add supported text, checkbox, radio, and choice fields, in addition to filling existing fields.
- [ ] M04.02 — **Improve form usability:** clearer labels, tab order, required-field guidance, supported fonts, and explanations for unsupported calculations/fields.
- [ ] M04.03 — **Form submission:** save a completed copy, print it, or export supported field data; explain unsupported fields.
- [ ] M04.04 — **Signature placement help:** identify likely signature/date/initial fields and suggest locations, but require confirmation of content and placement.
- [ ] M04.05 — **Reusable assets:** save user-approved signatures, initials, stamps, and common markups with clear local storage and deletion controls.
- [ ] M04.06 — **Broader annotations:** edit third-party annotations, threaded replies, and comment exchange only after preservation tests.
- [ ] M04.07 — **Annotation export:** offer a separate annotation summary or copy where verifiable.
## 5. Scanning, OCR, and information extraction

- [ ] M05.01 — **Scan from a device:** import from scanner/document camera, including multi-page scans where supported; preview, reorder, rotate, or remove pages before making a PDF.
- [ ] M05.02 — **Scan cleanup:** preview deskew, contrast/brightness cleanup, rotation, and proposed blank-page removal. Distinguish faint content from blank pages and allow undo.
- [ ] M05.03 — **Broader OCR:** add only tested bundled/installed languages; make language choice clear and show confidence as an estimate.
- [ ] M05.04 — **Uncertainty review:** locate uncertain words/lines on the scan, preserve page references, and require review before saving corrections.
- [ ] M05.05 — **Extract tables:** offer table-to-CSV/spreadsheet export only when recognition is suitable, with preview to catch misaligned rows and columns.
- [ ] M05.06 — **Searchable documents:** preserve scan images and explain when OCR reading order or recognition needs review.
- [ ] M05.07 — **Clear scan limits:** explain limits for handwriting, low resolution, skew, mixed languages, and complex reading order.
## 6. File formats, photos, and editing fidelity

- [ ] M06.01 — Evaluate and add tested support for HEIC/HEIF (orientation and metadata choices), multipage TIFF, RTF, XLSX/PPTX preview/conversion, legacy DOC/XLS/PPT, and Apple Pages/Numbers/Keynote. Add a meaningful Markdown preview and structured table views for CSV/data files while retaining source editing. Complete real-file fixtures for XML, YAML, CSV, BMP, and uncommon image variants before claiming support. Clearly separate Open, Preview, Edit, and Convert for each format. Explain fidelity limits before conversion. Let users choose whether photo metadata/color profiles are kept or removed.
## 7. Navigation, search, and multi-file workflows

- [ ] M07.01 — **Search navigation:** match counts and next/previous controls.
- [ ] M07.02 — **Search selected files:** search only deliberately selected files; show filename and page for each result.
- [ ] M07.03 — **Quick action finder:** “What do you want to do?” search for sign, split, compress, OCR, compare, or convert.
- [ ] M07.04 — **Move pages across PDFs:** drag pages between open PDFs with a visible preview.
- [ ] M07.05 — **Page navigation:** jump by printed page label; edit bookmarks/table-of-contents entries; safely show internal link destinations.
- [ ] M07.06 — **Batch operations:** queue supported conversion, compression, rename, combine, and other verified actions with per-file progress/results, cancellation, output location, collision handling, and bounded resources.
- [ ] M07.07 — **Reusable workflows:** repeat reviewed sequences such as OCR → review → save copy or combine → number pages → print; show and allow editing of steps before running.
- [ ] M07.08 — **Recover interrupted jobs:** let users retry/discard failed or canceled jobs without confusing partial output for completed work.
- [ ] M07.09 — Search and batch features must not imply broad folder scanning.
## 8. Accessibility, quality checks, and inspection

- [ ] M08.01 — **Accessibility checks:** inspect tags, reading order, headings, links, and form labels; distinguish searchable OCR from accessible structure.
- [ ] M08.02 — **Guided accessibility repair:** offer fixes only when results can be validated; don’t promise automatic tagging makes a PDF fully accessible.
- [ ] M08.03 — **Document health report:** identify missing fonts, oversized images, broken links, unusual page sizes, unsupported features, and possible print problems; offer safe fixes only where verified.
- [ ] M08.04 — **Trustworthy file details:** show page dimensions/orientation/count, file size, text searchability, encryption state, and feature limits.
- [ ] M08.05 — **Accessible job status:** announce progress, failures, and cancellation to keyboard and screen-reader users.
- [ ] M08.06 — **Scalable interface:** test larger text, contrast, visible focus, keyboard navigation, and reduced motion throughout dialogs/workflows.
- [ ] M08.07 — **Print preview:** inspect prepared output, selected pages, paper, orientation, scaling, annotations, and rasterization before Windows handoff.
- [ ] M08.08 — Physical printer validation remains a release check; simulated preparation alone does not prove paper output.
## 9. Privacy, sharing, Windows, and AI

- [ ] M09.01 — **Share local copies:** provide Windows share handoff for a new copy. For cloud links/uploads, show service, account, destination, and permissions before sending.
- [ ] M09.02 — **Transfer history:** if online AI/sharing is added, show what files were sent, to which endpoint/service, and when; allow cleanup.
- [ ] M09.03 — **Optional AI providers/agents:** scope each request to selected files; show provider, model, endpoint, destination, and possible account charges before transfer.
- [ ] M09.04 — **Cited answers:** provide page/line references where available and distinguish source text from generated explanation.
- [ ] M09.05 — **Read-only AI by default:** treat document contents as untrusted; prevent automatic saving/exporting/overwriting/tool use. Require separate approval and a reviewable result for changes.
- [ ] M09.06 — **Connection controls:** test, select, and remove connections; store secrets using Windows-backed secure storage and fail closed if unavailable.
- [ ] M09.07 — **Hermes:** evaluate its documented HTTP API before implementing.
- [ ] M09.08 — **Harness:** defer until the exact product/interface is identified.
- [ ] M09.09 — **Windows lifecycle:** installer, uninstaller, updates, optional file associations, and Open with PDFix.
- [ ] M09.10 — **Release readiness:** security, licensing, dependency/SBOM, performance, clean-machine install, and real-file corpus reviews.
## 10. Later candidates and first-release boundaries

- [ ] M10.01 — Later candidates: online signature requests/tracking, shared/cloud review, online form response collection, PDF/A or PDF/X validation, tagged-PDF validation, accessibility repair, and Bates numbering. Each needs a clear user need and reviewed engine/service before it appears as working.
- [ ] M10.02 — Keep bulk signature/payment workflows, PDF portfolios, barcode fields, advanced print-shop color/trapping, geospatial/3D measurement, embedded multimedia, presentation generation, and CAD model editing out of the initial scope unless the direction changes.

## Latest coding checkpoint — 2026-10-02

Native Security Sandbox foundation, M01.06 link-review subset, M01.07 structural reports, M03.01 paper presets, M03.04 calibrated measurement, M03.06 temporary layers, M04.03 supported field-data exports, M04.07 annotation summaries and M06.01 Markdown/CSV preview subsets are coded. Runtime/security/corpus acceptance gates remain unchecked. Attachment saving, certificate validation, complete sanitation, all decoder containment and the other master-list items remain work. Exact boundaries are in FEATURE-TRACKER.md, ARCHITECTURE.md and PHASE-LOG.md.

M08.04 file-details subset is coded, with runtime/corpus gates open. Password-field privacy withholding was added to supported-form UI/data/recovery handling; source password data is retained in original/copy PDFs, not sanitized.


## Latest coding increments (acceptance remains open)

Parallel 2026-10-02 coding added selective cleanup (M01.02), reviewed .bin attachment copies (M01.06), range/paper/fit/actual/N-up/booklet print preparation (M03.08–09), continuous/facing-page views (M03.02), new text/checkbox fields with labels/flags/recovery (M04.01–02), scan deskew and OCR uncertainty/review exports (M05 subsets), provider connection/context review and Windows intake metadata (M09 subsets). See PARALLEL-WORKSTREAMS.md, FORMAT-SUPPORT.md and PHASE-LOG.md for exact limits. Full checkbox targets remain unverified and incomplete; source compilation does not establish corpus, preservation, physical printer or sandbox security results.


## 11. Bluebeam/Revu drawing review — user addition, 2026-10-03

R39 adds [BLUEBEAM-COMPATIBILITY-PLAN.md](BLUEBEAM-COMPATIBILITY-PLAN.md). Priority confirmed: review drawings and comments. The source master list is unchanged.

- [ ] B01 — Existing Revu PDF markup artwork and explicit unsupported types.
- [ ] B02 — Searchable/filterable markup list with sheet-location navigation.
- [ ] B03 — Supported reply threads, review states/history and locks.
- [ ] B04 — Verified foreign-markup and unknown-data preservation in edited copies.
- [ ] B05 — Reviewed comment reports and evaluated exchange formats.
- [ ] B06 — Revision clouds, arrows and callouts.
- [ ] B07 — Aligned/color-overlay drawing revision review.
- [ ] B08 — Sheet sets and controlled revision replacement.
- [ ] B09 — Large-sheet markup navigation, fullscreen and collapsible review panel.
- [ ] B10 — Reusable review stamps/tools; separate proprietary tool-set evaluation.
- [ ] B11 — PDF-embedded custom markup data and quantities.
- [ ] B12 — Persistent calibrated measurements/counts/takeoff totals.

Viewing flattened artwork cannot restore missing comment metadata. Studio/cloud integration remains a separate evaluated future item. All acceptance targets above remain open.


R39 drawing-review coding checkpoint: source-bound read-only comments inventory and filtered/threaded panel, named filters, reviewed TXT/CSV reports, comment-location/previous-view navigation, embedded sheet-label jump and line/arrow/cloud/callout markup tools are saved and compiled. Exact limits are in FEATURE-TRACKER.md/PHASE-LOG.md. Bluebeam/Revu round-trip, imported comment editing, unknown-data preservation and the full B01–B12 acceptance targets remain open; no runtime testing performed.


R39 follow-on source coding: supported imported plain-comment edits, additive replies and explicit standard review-history entries now have a preserving native writer and exact changed-page review UI. Reusable local tool styles and searchable direct Workspaces access are saved. B03/B04/B06/B10 progress; no Revu round-trip acceptance or runtime checks. Portable recipes, standard source colors and drawing overlays are currently assigned, not yet delivered. Full master acceptance remains open.


2026-10-03 integrated follow-on: preserving supported plain-comment/reply copies, explicit source-bound portable JSON drafts, standard /C and /IC metadata/reporting, reusable local drawing styles and aligned transparent/cyan-magenta comparison overlays are now saved and compiled (202 modules). Exact bounds and remaining gates are in FEATURE-TRACKER.md/PHASE-LOG.md. Recipes preserve unsaved staged/composer text after explicit save and exact-source restore, with reviewed replacement/Undo. They do not restore output seals or automatically save a PDF. Runtime/Revu round-trip verification and full B01–B12 acceptance remain open. Earlier in-progress/blanket read-only entries record older checkpoints.


2026-10-03 integrated 208-module checkpoint: named related-sheet sets, ordered navigation/user labels and explicit original/new revision-reference review; separate calibrated length/area/count ledger with grouped totals, source-bound reviewed JSON/CSV export/import; reviewed JSON comment metadata; native universal registered-renderer close handshake. Exact limits/status are saved in FEATURE-TRACKER.md/PHASE-LOG.md. B05/B08/B12 and M03.04/M03.10/M03.11 subsets advanced. Physical PDF revision replacement/comment transfer, full embedded measurement annotations and runtime/Revu/release acceptance remain open; these features do not complete the full targets.


## Persistent takeoff copies and reusable decoration templates — 2026-10-04

This later checkpoint supersedes earlier statements that takeoffs are separate-ledger-only. The drawing takeoff ledger now opens a frozen PDF-copy workspace. A source-bound native writer adds one Line (distance), PolyLine (open perimeter), Polygon (closed perimeter/area), or Ink (count) annotation per entry. Explicit vector appearances include numeric quantity labels in the chosen display unit. Unicode comments/author and canonical PDFixData retain original points, physical-page identity, source fingerprint, calibration and recomputed quantities. Maximum 200 entries / 10,000 aggregate points, 2 MiB request, 100 MiB PDF and 500 pages. Source crop/media intersection and UserUnit are checked natively. Physical pages are authoritative; sheet labels remain supplied descriptions independently reviewed against the source. Counts carry no length calibration.

The native construction manifest allows only cloned/appended selected page Annots arrays and normalization of raw-stream Length to unchanged encoded payload size. All original objects, existing annotations, unknown/private fields and encoded stream payloads are retained. After serialization, native reopening compares every declared object, geometry/trailer references, exact annotation order, appearance bytes and canonical metadata. The immutable native receipt is fenced to source SHA/token/generation before an exclusive chosen-file Save Copy. Source-bound ledger math is generated from the same pure UI source during compilation. The worker has a two-minute deadline, 256 MiB old-generation heap, 16 MiB single / 64 MiB aggregate compressed-object decoding budgets; this worker is not an OS sandbox. Signed, certified, encrypted, XFA and unsupported sources are refused. No standard Measure dictionary or proprietary Bluebeam measurement editing is promised.

The UI also checks output/ledger/metadata hashes and exact annotation types, coordinates, text/author and appearances with an independent PDF reader. Every changed original/output drawing page must be visibly reviewed before saving (2 MP per preview). Ledger mutation and measurement controls are held while this copy workspace is open. Cancellation/discard retains the source and full separate ledger. Leaving protects unsaved JSON ledger data; saving a PDF does not mark that separate portable recipe as saved. Exported PDF annotations include unencrypted author, names and complete point/calibration metadata. Recovering this embedded metadata into an editable ledger is a remaining feature; existing JSON import remains source-bound.

Decoration templates now save up to 20 named styles / 64 KiB locally: standard font, inset, page numbers, headers, footers, watermarks and Draft/Approved/Reviewed text stamps. Apply requires explicit confirmation and invalidates a previous PDF preview; current physical-page selection and range stay selected. Templates exclude source IDs, page selection, generated PDFs and receipts. Named save, apply, delete/clear and bounded raw-text export are explicit. Corrupt storage fails closed; concurrent library changes are checked before writes. Text/styles are unencrypted local-profile data, separately disclosed in Settings & privacy, with deletion in Page numbers and stamps. Text stamps do not certify approval or create certificate signatures.

Source and build milestone only. Runtime, native-worker, broker, app, print and Revu acceptance tests remain deferred at the user's request. These additions advance B10/B12 drawing workflows without completing the full Bluebeam or master requirements. Earlier subagent source for templates/preview UI was retained; root completed the missing native writer and integration after those agents hit the account limit. Full interoperability, broader editing/format fidelity, release packaging and security/accessibility acceptance remain open.


## Recover and revise embedded PDFix takeoffs — 2026-10-04

Saved native read-only recovery, independent-reader comparison and actual drawing-page review for canonical PDFix takeoff metadata. The reader's Takeoff quantities panel now has Recover takeoffs from this PDF and a native-processing cancel control. Recovery is explicit, never automatic. Native inspection requires a unique indirect annotation on its declared physical page; exact canonical metadata/author/NM, recomputed quantity, source geometry/UserUnit, Line/Polygon/PolyLine coordinates or count marker strokes and bounded normal appearance are checked. Unsupported versions/malformed recognized takeoffs fail closed; other/unreadable PDFix metadata is reported as untouched. Maximum 10,000 source annotations, 200 recovered entries, 2 MiB aggregate metadata / 4 MiB complete receipt, two-minute worker deadline and existing bounded worker heap/decode budgets. Protected/signed/XFA and unsupported sources remain refused. This worker is not an OS sandbox.

Each adopted entry receives a new identity bound to the currently opened PDF SHA, retaining original source SHA, annotation structural reference, author and metadata hash as provenance. Optional origin fields are strictly validated and travel with JSON/PDF metadata. Independent PDF-reader checks compare actual source annotation identity/type, bounds, author/text and path/count coordinates; actual crop/UserUnit and shortened labels must match this current source. Every recovered drawing page must be viewed (one reusable 2 MP canvas), then the user explicitly replaces the current in-memory ledger. Source bindings/hash are rechecked after asynchronous steps; cancellation retains the previous ledger. Undo restores it. Recovery is dirty until JSON is saved. Embedded metadata/calibration is untrusted file data and is not authenticated engineering information.

Edit entry now supports reviewed name/group changes and known reference length/unit changes for each calibrated quantity. Saved measurement/reference positions stay fixed. Quantities are recomputed, fully schema-validated and source-fenced before adoption; preview invalidity disables Apply, edits are dirty and Undo is available. Counts carry no length calibration. Editing a ledger alone does not change PDF bytes.

The takeoff PDF-copy dialog now offers an explicit unchecked-by-default option to update supported recovered annotations. Native selection is fenced by source SHA, unique structural reference, original NM/author/metadata hash, unchanged physical-page/path/reference geometry and known annotation fields. Locked/read-only, shared, threaded/replied-to, popup/group/rich/private-extended or independently changed targets are refused. Only declared original page references are removed, replacement appearances/metadata are appended, and all unrelated annotation entries stay in order. Native reopening verifies exact retained objects, arrays, geometry/trailer and new annotation results; the independent reader verifies declared removals and unrelated identity retention before every changed-page actual before/after review. Saving remains an immutable source/token-bound exclusive new copy. Original dictionaries/appearances remain in the retained object graph, including replaced takeoffs; this is neither redaction nor permanent deletion. Leave the update option unchecked to append additional visible annotations.

This supersedes the earlier recovery-pending and always-append-only checkpoint descriptions. Revu/proprietary takeoff interchange, new point/reference placement for an existing recovered entry, deleting embedded annotations and broad compatibility/security/release acceptance remain future work. Full master requirements remain open. No app, native worker, broker or runtime tests were launched; tests remain deferred as requested.


## Reviewed XFDF export — 2026-10-04

B05/M04.06/M04.07 advanced with reviewed standard-geometry XFDF export and separate exact JSON omission receipt. Complete annotation exchange, appearance/private-field preservation and runtime interoperability remain open; existing master checkboxes stay unchecked. [Source implementation](docs/DRAWING-XFDF-EXPORT.md). Original master-list file is unchanged.


## Three major-gap agents integrated — 2026-10-04

User requested renewed subagents on the largest gaps. All three new agents completed concrete source slices; root integrated and compiled them. Earlier account-limit failures did not recur for these agents.

- Document fidelity: editable tables with ProseMirror cell selection, bounded rectangular spans, row/column/merge/split/header/fill controls and Undo; supported DOCX import and structured DOCX/PDF export; native recovery validation; TXT/RTF explicit tabular flattening. Original column widths/borders, images/nested tables and page-perfect Word preservation remain open. Details: [DOCUMENT-FIDELITY-PROGRESS.md](docs/DOCUMENT-FIDELITY-PROGRESS.md).
- Original PDF editing: bounded embedded Type1/TrueType one-byte and horizontal Type0 Identity-H two-byte ToUnicode maps, per-string multipart TJ edits retaining numeric spacing, reuse of observed source glyphs, preserved stream dictionaries and reopened source-font graph/encoded-program hash proof. Multicharacter/ligature entries omit affected runs while retaining other usable map entries. New glyph embedding, shaping/reflow, Type3/custom/vertical/nested/marked-content editing and complete unrelated-object preservation acceptance remain open. Details: [PDF-EDITING-FIDELITY-PROGRESS.md](docs/PDF-EDITING-FIDELITY-PROGRESS.md).
- Security Sandbox: fixed document-engine AppContainer/Job Object source with exact token/capability checks, one-process/512 MiB/115-second bounds, read-only staged source/request/runtime and three precreated writable output slots. Codec bundle supports nine fixed operations. Root packages the existing standalone Windows x64 Node runtime/license with SHA pins and bundled dependency attribution; XFDF export adopts the contained path exclusively, with no worker fallback. Cancellation observes broker close, source/output validators remain, cleanup failure/unsafe termination permanently closes the service. Broker close observation is subscribed immediately at launch to cover early failures across async boundaries. Other Office/review/takeoff/redaction routes still need adoption. Details: [SECURITY-SANDBOX-PROGRESS.md](docs/SECURITY-SANDBOX-PROGRESS.md).

Root also completed reviewed 11-type XFDF geometry/plain-comment export with exact XML, filtered source identity/fingerprint checks, per-annotation omissions, reviewed exclusive sealed saves and separately saved JSON receipt. Native runtime/security status is shown in Settings. Existing comment TXT/CSV/JSON snapshots remain separate. The XLSX sharedStrings undeclared-variable failure is fixed with an 8 MiB aggregate bound; current format/workspace/AI/privacy text reflects saved capabilities.

Final compilation passed: 224 Vite modules; index-BFhcaNJF.js / index-kVg5VJNm.css; pdf-job.worker-KFHKMFMu.js / document.worker-BXg1i3K9.js. Broker C# and fixed engine bundle compile; targeted JS/CJS syntax checks passed. Build output includes pinned node.exe, engine.cjs, broker manifests and runtime/dependency licenses. No app, broker, document engine, native worker, network/print or runtime tests were launched. Verifier code and compilation are not evidence of executed fidelity/OS isolation/Revu acceptance. User-requested runtime testing remains deferred; full master requirements and S00 remain open. Original master-list source is unchanged.


## Integrated images, table grids, nested editing, containment and search — 2026-10-04

Three user-requested agents delivered inline document images, editable/preserved table column proportions, nested original PDF text/image changes with shared Form isolation, and contained-only Office/comment/takeoff/grid processing. Root integrated native source/lifecycle guards, local search across selected files, import cancellation and current capability/status text. The combined build passed: 231 modules, index-CRv3V24I.js / index-Cc33oWd9.css; Windows broker and fixed engine packaging compiled. Exact support, bounds, artifact identities and pending work: [coding checkpoint](docs/CODING-CHECKPOINT-2026-10-04.md).

Source/compile milestone only; no app/native job/runtime tests were launched. Full master, S00, Word/PDF fidelity and Revu/release acceptance remain open. The original master-list file is unchanged. Current 65% coding / 35% remaining estimate is rough engineering judgment (about ±5 points), separate from runtime delivery and beta readiness.


## Integrated headers, batch and XFDF import — 2026-10-04

Authored document header/footer exports, reviewed selected-PDF batch compression, supported XFDF import, contained structural security/cleanup and native API/lifecycle/privacy integration are saved. Combined compilation passed with 237 Vite modules and refreshed engine/broker pins. Runtime tests remain deferred; private-beta, full master-list, Security Sandbox and Revu interoperability acceptance remain open. [Exact implementation and compilation evidence](docs/CODING-CHECKPOINT-2026-10-04.md); [batch limits](docs/BATCH-COMPRESSION-PROGRESS.md); [XFDF import limits](docs/PDF-XFDF-IMPORT-PROGRESS.md).


## Band import, preserving page order and contained redaction — 2026-10-04

Plain DOCX/RTF header/footer import, exact original-page permutation retaining drawing comments/links/forms/bookmarks, and fixed contained redaction verification are integrated. Combined compilation passed with 240 modules and current engine/broker/source pins. Windows development packaging and per-user install/uninstall sources are saved; no installation or runtime testing occurred. [Current coding evidence](docs/CODING-CHECKPOINT-2026-10-04.md); [Windows package bounds and remaining gates](docs/WINDOWS-PACKAGING-PROGRESS.md). Full master targets and beta/release/security/Revu acceptance remain open.


## Table extraction, scoped health report and selection geometry — 2026-10-04

Reviewed PDF-word/local-English-OCR table extraction with corrected-cell CSV save is integrated. A scoped health report adds visible geometry, permitted text, internal-link/URL-syntax, structure-presence and form-label observations with cancellation and JSON export. Rotated/non-unit text selection uses the source viewport's rotation and UserUnit across all three text-layer views. Source/compile evidence only; broader extraction/font/image/accessibility/fidelity/security/Revu and runtime acceptance remain open. [Latest checkpoint](docs/CODING-CHECKPOINT-2026-10-04.md); [table extraction](docs/TABLE-EXTRACTION-PROGRESS.md); [health scope](docs/PDF-HEALTH-REPORT-PROGRESS.md); [selection fix](docs/PDF-SELECTION-GEOMETRY-PROGRESS.md). Original master-list source and full acceptance checkboxes remain unchanged.

## Acrobat replacement scope intake — October 7, 2026

R41 adopts the entire supplied comparison: [ACROBAT-COMPETITIVE-PLAN.md](ACROBAT-COMPETITIVE-PLAN.md) defines all ten categories and A01–A25 work packages, overlaps, priorities, dependencies and acceptance boundaries. The original comparison is preserved in [the intake record](docs/ACROBAT-COMPARISON-USER-INPUT-2026-10-07.txt). The product plan, roadmap, complete planned catalog, future list and status inventory include the new scope. Existing related implementations keep their narrower recorded status; no code, test, acceptance, benchmark or release claim is added. Older completion percentages have not been recalculated for this expanded plan. Covered specialist features become later adopted targets; current containment, consent and no-DRM-bypass rules remain.


## October 11 complete scope consolidation

[Final implementation plan](FINAL-IMPLEMENTATION-PLAN.md) sets the current order: Workspaces → PDF viewing → PDF editing → PDF creation/document toolbar → Bluebeam comments/review → remaining complete adopted scope → digital-pen drawing → full UI/function and release acceptance. The [complete remaining-work register](docs/FINAL-REMAINING-WORK-2026-10-11.md) and [source-preserving scope ledger](docs/FINAL-SCOPE-LEDGER-2026-10-11.json) retain R01–R50, S00, all 71 M rows, B01–B12, F01–F67, A01–A25 and G01–G16/D01–D22. Every earlier specification, dependency, preservation/security/free-app rule and applicable acceptance gate remains represented. Later adopted specialist targets supersede only their historical staging exclusions; unrelated excluded scope is retained as a boundary.

R49 records the familiar creation toolbar, comment viewing/adding/eligible editing and requested full UI/function pass. R50/F67 records digital-pen PDF handwriting and saved editable ink. Existing basic ink and newly coded toolbar/comment controls do not complete the broader targets. Current checks are scoped evidence; no blanket all-features/all-files or release-ready claim is made.
