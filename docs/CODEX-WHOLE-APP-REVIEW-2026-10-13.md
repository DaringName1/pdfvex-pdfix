# PDFix whole-app bugs and missing-work review — October 13, 2026

This is a source and evidence review requested by the user, with no application code changes. It reconciles Claude's whole-app report with current reader/converter work and the full adopted plan. It is a return-to-work list, not a claim that every defect has been discovered or that every feature has been exercised.

## What was actually checked

- Fresh Node syntax checks: **474 JavaScript/CommonJS/module files under `src` and `desktop`, zero syntax failures**. Syntax checks do not resolve imports or prove behavior.
- Fresh isolated module probes: the native Node paper-size import fails; the CSV preview accepts 5,643,018 UTF-8 bytes despite its stated 2 MB limit. No PDFix/Electron window was started.
- Read current format capabilities, reader/paged-source code, reading-state code and tests, converter register, Claude handoff/known-issues report, packaging/security/accessibility/signing/scanner progress, the 84-row scope inventory and adopted requirements/plans.
- Existing evidence retained with its original scope: 75 converter source/disk cases, 13 standalone browser codec/disk cases, 27 earlier reader unit cases, and Claude's reported editor/shell checks. These were **not rerun as a whole-app suite during this review**.
- Claude reports 166/191 unit tests passing and 25 failing in [his whole-app report](KNOWN-ISSUES-2026-10-13.md). That is a historical run, not this review's current measured total; tests have been added since earlier runs. A fresh full run is deferred with combined-app testing. One existing document test rewrites a fixture, so even `npm test` is not entirely read-only.

Raw fresh results: `C:\Users\andre\.codex\visualizations\2026\10\13\01a133b5-db03-7e80-b23c-be4867bb9992\final-source-audit.json`.

Labels below: **confirmed source/probe** = current source or isolated behavior verified here; **reported** = observed by Claude or an earlier workstream, not reproduced here; **missing/limited** = deliberately absent or only partly implemented; **unproven** = code exists but the required evidence is absent. P1 = integrity/security/release priority, P2 = broken workflow or significant missing behavior, P3 = usability/test-maintenance priority. No confirmed P0 is established by this review.

## 1. Bugs, failing checks and integration problems

| ID | Priority / evidence | Problem and practical next action |
| --- | --- | --- |
| BUG-01 | P2 confirmed probe | `src/paper-sizes.js:1` imports JSON without `with { type: 'json' }`. Native Node throws `ERR_IMPORT_ATTRIBUTE_MISSING`; bundler acceptance hides this. Claude attributes nine unit failures to it. Fix the import and verify Node plus the renderer build. |
| BUG-02 | P2 confirmed probe | `src/source-preview-codec.js` checks JavaScript character length instead of UTF-8 bytes for its stated 2 MB CSV/Markdown preview budget. A valid 19-row CSV of 1,881,018 code units / **5,643,018 bytes** was accepted. This proves the module budget mismatch; native intake may separately fence opened files, so it does not prove every app entry accepts oversized sources. Align byte budgets across edited source, preview and save paths. |
| BUG-03 | P2 reported failures | Native sandbox/verifier-dependent tests fail: compression startup, form retention, image/redaction independent checks. Distinguish missing test setup from native app defects; do not weaken production verification to make mocks pass. Run normal-filesystem/native checks separately from execution-sandbox checks. |
| BUG-04 | P2 reported failures | File-store failed-write cleanup validation (2), password temporary cleanup (1), redaction security-report source eligibility (1) and error-message expectations (3) need individual reproduction. Cleanup failures have integrity/privacy consequences; assertion mismatches alone do not identify a product defect. |
| BUG-05 | P3 confirmed source disagreement | `tests/reading-state.test.cjs` calls page 501 invalid, but `desktop/file-store.cjs:243` deliberately accepts positive safe-integer page numbers and the reader supports larger paged files. This is a stale-limit candidate, **not a confirmed invalid-page bug**. Decide the current metadata/page-count contract and test out-of-range bookmarks against actual document counts without restoring an obsolete 500-page cap. |
| BUG-06 | P2 reported | Three reader cases in the shared editor Playwright file have stale selectors; most other desktop specs have not been validated against current UI. Update selectors in coordinated ownership and execute actual workflows, not just screen opening. |
| BUG-07 | P2 reported, unconfirmed | Claude's generic smoke closer could not leave Sheet sets, Drawing comments, Thin lines and Outline editing without restarting. Reproduce with actual supported Close/Back controls before diagnosing a focus/departure trap. |
| BUG-08 | P3 reported | Canceled-job status messages can remain after opening another tool. Bind status to the active job/workspace and clear stale messages on departure. |
| BUG-09 | P3 reported/source | Back from documents always returns Home instead of the originating Files/Workspaces screen. Preserve origin if that behavior is adopted. |
| BUG-10 | P2/P3 reported/source | Clear recents also clears favorites, reading positions and page bookmarks, immediately. This is broader than many users expect from the label. Make the scope clear before the action; separate clearing categories if adopted. |
| BUG-11 | P3 reported | Large interface text does not scale headings; editor ribbon/minimum-width behavior is not accepted. Review all controls at large text/high DPI rather than treating a shell pass as an editor pass. |
| BUG-12 | P3 reported | Spell-check Ignore once disappears after any edit; repeated header/footer formatting controls have indistinguishable accessible names; rapid typing/formatting/indent can share one Undo step. Review expected behavior and accessibility separately. |
| BUG-13 | P3 reported | Simplified DOCX reopen may report even/odd header behavior when the document has none. Correct the disclosure detection without claiming broader fidelity. |
| BUG-14 | P2 confirmed/project | No `.git` history exists. Source snapshots are useful receipts but do not provide general change history/rollback. Add deliberate version control before further shared-file integration; this review does not initialize it. |
| BUG-15 | P2 reported/build | Parallel saves have caused `Source changed during compilation`; an earlier missing renderer bundle was never explained. Coordinate a quiet final build, compare its manifest to source, and check launcher assets. The old missing bundle is not confirmed missing now. |
| BUG-16 | P3 reported/test | `tests/document-codec.test.cjs` rewrites its checked-in editing fixture when run. Separate generated fixtures from stable source fixtures. |
| BUG-17 | P3 reported/static | Four preload methods have no app callers: `batchDocumentActionSource`, `cancelPdfXfdf`, `getPdfRepairStatus`, `saveImage`. Unused methods alone do not prove missing handlers or broken routes. Audit their intended lifecycle before deleting or connecting them. |

## 2. Document editor: known missing or lossy behavior

Claude owns these files. Preserve his current work; use [his latest handoff](CLAUDE-HANDOFF-2026-10-12.md) for details.

| ID | State | Remaining behavior |
| --- | --- | --- |
| DOC-01 | P2 limited | External/modified DOCX and RTF go through simplified import. Full source formatting/layout is not retained; unchanged supported PDFix DOCX can reopen using its stored model. The model falls back above 512 KB or 20 images. |
| DOC-02 | P2 limited | RTF lists flatten to visible labels, tables to text rows, images to placeholders; paragraph line spacing is not restored. RTF hyperlinks **are now restored**, so do not list lost link targets as an open defect. |
| DOC-03 | P2 missing | Multiple simultaneously open documents/tabs and independent new-document recovery drafts. Current new documents share one draft; document name is outside the draft/version model. |
| DOC-04 | P2 missing | First-line/hanging/right indent, arbitrary custom spacing, custom paper dimensions and independently editable four-side margins. Standard paragraph indent/spacing already exists. |
| DOC-05 | P3 missing | Text highlight, superscript/subscript, internal heading/bookmark links and image links; only three font families. |
| DOC-06 | P2 missing | Rich document comments/tracked changes, table of contents, footnotes, columns and differing section page setups. Do not confuse PDF review comments with document-editor comments. |
| DOC-07 | P2 limited | Pasted image insertion, table borders/shading and additional Word formatting are omitted; nested tables are refused. Inserted inline PNG/JPEG and supported merged tables work within current scope. Image wrapping/crop/rotation and drag resize in this editor are absent. |
| DOC-08 | P3 boundary | Save always creates a copy; direct overwrite is deliberately absent under the safe-copy rule. Editor printing requires PDF export first. These are product decisions/limits, not evidence of corrupt saving. |
| DOC-09 | Unproven | Real Word/browser clipboard, DOCX open in external Office tools, actual browser/mail launch, spoken playback, other dictionaries, A3/A5/Tabloid PDF output, large documents, minimum window and assistive technology. Hidden-window scripts and a link recorder do not establish these. |

## 3. PDF reader, editing, drawings and digital pen

| ID | State | Remaining behavior |
| --- | --- | --- |
| PDF-01 | P2 missing/source | Paged very-large-source reader has no outline, page-label, destination/page-index or optional-layer APIs; extracted pages filter Link annotations. Whole-source tools remain limited separately. See `src/paged-pdf-document.js`. |
| PDF-02 | P2 limited | Readable text does not reconstruct arbitrary tables, captions, vertical/bidirectional text or irregular columns. It is an order proposal, not semantic recovery. |
| PDF-03 | Unproven | Search/destinations/keyboard/resize fixes need integrated Electron acceptance. Complex crop/rotation/UserUnit/Fit destinations, long-running large-document navigation and memory/resource behavior remain open. Exact readable character highlighting **is implemented**; paragraph highlighting is the fallback where Custom Highlight is unavailable. |
| PDF-04 | P2 limited | Original PDF text replacement supports particular source fonts/glyph mappings; new ambiguous glyphs, vertical/custom maps, Type3 and marked-content cases are refused. Image replacement refuses masked/external/cyclic/unsupported resource paths. Full Word-like PDF layout editing is absent. |
| PDF-05 | P1/P2 limited | Clean-image redaction is a flattening reconstruction, not vector-preserving redaction. Current native retention/removal/disk/forensic proofs and real-file regressions are still required. Metadata editing does not remove all XMP/history/hidden content. |
| DRAW-01 | P2 limited | Standard comment/reply/review subsets exist. Locked/rich/grouped/private structures are retained or refused where unsupported. Real Revu round trips, unknown appearance/identity/thread/state/custom-field preservation across writers remain unproven. Do not report all replies or carry-forward as wholly absent: newer source contains subsets. |
| DRAW-02 | P2 missing/limited | Bluebeam proprietary custom columns/quantities and BAX/BTX tool exchange are unfinished. Sheet-revision replacement/comment carry-forward and takeoffs still need broader real-source preservation/geometry/recovery acceptance. |
| DRAW-03 | P2 missing | Full digital pen: pressure handling, palm rejection, predictable pen/touch modes, selecting/moving/erasing strokes and robust editable-ink reopen/recovery. Basic Ink/line/arrow/cloud/callout code is groundwork, not F67/R50 completion. |
| DRAW-04 | Unproven | Engineering measurements, comparison overlays, units/scale, print geometry and large sheets need known-reference tolerances and actual drawings. PDF-only fullscreen, every view mode, high DPI/multiple monitors and restoration need runtime checks. |

## 4. All converter gaps retained

Detailed routes and receipts: [converter completion register](PDF-CONVERTER-COMPLETION-REGISTER-2026-10-13.md).

| ID | State | Remaining behavior |
| --- | --- | --- |
| CONV-01 | P2 missing | HEIC/HEIF decoder is not installed/bundled/activated. Live Photo still/motion pairing and separate exports are missing. Orientation/HDR/color/metadata/alpha and distribution review remain prerequisites. |
| CONV-02 | P2 missing | Legacy DOC/XLS/PPT and Apple Pages/Numbers/Keynote decoding/layout conversion. Explicitly disabled in `src/formats.js`; no working converter should be advertised. |
| CONV-03 | P2 limited | TIFF handles supported classic strip modes; BigTIFF, tiled/JPEG/CMYK/YCbCr/alpha/wider-depth TIFF and profile choices are unsupported. Broader fax/multipage/real-scanner corpus and native service acceptance remain. |
| CONV-04 | P2 missing | Faithful XLSX-to-PDF and PPTX slide-to-PDF layout rendering. Workbook editing/CSV and presentation text exports already exist; cached formulas are not recalculation, and text PDF is not a slide rendering. |
| CONV-05 | P2 limited | Image conversion normalizes artwork and omits photo metadata/profiles. Preservation choices and broader color/real-camera corpus are missing. Animated images and unsupported BMP variants are refused. |
| CONV-06 | P2 limited/unproven | EML supports headers/body and attachment inventory but drops attachments from document output. Richer MIME, reviewed attachment preservation and integrated PDF export remain. |
| CONV-07 | Unproven | Clipboard text/PNG creation exists, but real capture/arrangement/recovery/native output and richer-format behavior need acceptance. Source-data PDFs are literal source text, not faithfully rendered structured data. |
| CONV-08 | P2 missing/limited | General cross-format batch conversion/combination and durable resumable workflows. Existing PDF copy/text/compression/Bates queues and ordered image pages are only subsets. |
| CONV-09 | Unproven | Image/PDF export dialog, Stop/departure/source changes, form/annotation/transparency combinations, file pickers, native permissions/output seals and actual comparison UI. Standalone codec checks do not cover the full app. |

## 5. Other app areas: missing implementation and required evidence

| ID | State | Remaining behavior |
| --- | --- | --- |
| OTHER-01 | P1 limited/unproven | Security Sandbox adoption is incomplete: renderer PDF/image/OCR processing remains; native ACL/network/process/time/memory/cancel/parent-death/cleanup boundaries and independent review need proof. A failed test under the coding sandbox is not proof of broken PDFix isolation. |
| OTHER-02 | P2 limited | Forms support bounded AcroForms/declarative calculations. XFA and arbitrary document JavaScript are unsupported/inactive. Detection/autofill/tab suggestions/mail merge are coded subsets; richer compatibility, labeling/accessibility, recovery and output validation remain. Never enable arbitrary scripts merely to match a form. |
| OTHER-03 | P1/P2 limited | Signing has restricted initial invisible Windows RSA approval signatures; certification, multiple signatures, visible certificate appearance, additional algorithms and hardware-provider compatibility are incomplete. Certificate validation lacks revocation, trusted timestamps, document modification-policy validation and broader trust profiles. |
| OTHER-04 | P2 missing | Durable long-term signature evidence and routed remote signing/tracking/audit services. Local email request preparation exists and is a different workflow. |
| OTHER-05 | P2 limited | WIA scanner route exists. Document camera, TWAIN/vendor-only drivers, automatic duplex and wider settings are missing; real driver/device/cancellation acceptance remains. Typical full-page 600 dpi can exceed image limits. |
| OTHER-06 | P2 limited | OCR/scans require wider real-language/handwriting/RTL/CJK/orientation/poor-scan tests, confidence/word mapping and searchable output proof. Bundled languages do not establish recognition quality. Table extraction needs irregular/merged/rotated/external Excel acceptance. |
| OTHER-07 | P2 missing/limited | PDF/A, PDF/X and PDF/E conversion/compliance; commercial color-profile conversion, separations, overprint/trapping and full preflight. Page boxes, print marks, thin-line inspection and structural checks exist as subsets and do not establish standards compliance. |
| OTHER-08 | P2 limited | Tag-tree/initial tagging tools exist but full nested-content/link/form/table semantics and PDF/UA/WCAG/508 audits are incomplete. Assistive technology and manual meaning/order checks are mandatory. |
| OTHER-09 | P2 missing/limited | Windows share handoff/cloud links/browser shared reviews, managed rights/expiry/revocation and additional platform clients remain separate unfinished service/platform work. Do not invent upload links or claim sync from a local copy. |
| OTHER-10 | P2 missing/evaluation | Offline PDF translation has no integrated translation route identified in current app/source scan; free model selection, contained execution and page-aligned review are prerequisites. Hermes/Harness adapters remain evaluation work. |
| OTHER-11 | P2 limited/unproven | Optional AI providers/cited answers need actual provider, privacy/consent, prompt-injection, source-citation, timeout/cancel and secure-storage failure tests. Read-only controls in code are not adversarial acceptance. |
| OTHER-12 | P2 missing/limited | Virtual printer automatic capture, job recovery and signed installer lifecycle. Current helper/workspace source does not establish a fully installed automatic PDF destination. |
| OTHER-13 | P2 limited | Persistent folder indexing, broader search content, durable watched-workflow/interrupted-job resume and multi-step recipes. Session folder search/watched-folder tools already exist; each grant/recipe has separate permissions. |
| OTHER-14 | P2 missing/unproven | Office shortcuts/direct integration and Edge extension/native-host handoff need individual adoption/implementation records; no integrated Edge/Office shortcut route was identified in the current app scan. Windows context tools and synchronized-file handling already exist but need actual shell/provider/placeholder/lock/hydration checks. |
| OTHER-15 | P2 limited | Portfolio/embedded-content, geospatial, 3D and multimedia need wider supported decoders/corpus. Geospatial WGS84/limited Web Mercator inspection exists; arbitrary CRS, interactive 3D/media playback and specialist compliance are not established. |
| OTHER-16 | P1 release gate | Fresh package/source identity, install/upgrade/uninstall/Open With, signing/branding, rollback, clean-machine launch, security/license/SBOM/provenance. Existing October 4 package is an older development snapshot, not a current accepted release. |
| OTHER-17 | P1 release gate | Every command's success/error/cancel/recovery/output checks, disk-full/access-denied/interrupted save, independent reopen and original hashes. Also real printers, 500-page/300 MB performance, accessibility and per-computer acceptance. Opening a tool's screen is not functional completion. |

## Corrections to older lists

1. Exact readable-text search highlighting is implemented, with a documented fallback; it is not wholly missing.
2. RTF hyperlink targets now survive reopen; other RTF losses remain.
3. Workspaces, email/clipboard, folder search, watched folders, fingerprints, form merge, standard comments/replies and several advanced inspection tools have integrated source subsets. Treat their expanded requirements as incomplete, not their entire feature as absent.
4. Page 501 acceptance does not by itself establish a bug, because the old cap no longer matches large-file support.
5. Earlier reports' test counts, build timestamps and unused-method scans retain their dates and scopes. This review does not turn them into newly measured current failures.
6. No all-app passing claim follows from 474 syntax passes, 75 converter tests, or Claude's smoke-opening results. No broad acceptance target is certified complete by the adopted plan.

## Suggested repair/testing order

1. Fix the confirmed JSON import and preview byte-budget mismatch in coordinated ownership; reproduce/classify the other 25 historical failures individually.
2. Prioritize output/cleanup/source-integrity/security failures and the four potential departure traps. Retain production verifiers.
3. Make one coordinated build with both agents idle, current source manifests and a stable launcher. Update desktop tests to current controls.
4. Execute reader/editor/converter success, cancellation, save/reopen and original-preservation checks together; then check the same frozen build on each computer.
5. Implement missing codecs/general converter batches/digital pen and preserve all other adopted scope below. Run corpus, printer, hardware, accessibility and release gates before a broad working claim.

## Everything left unchanged in this review

All application files, tests, fixtures, native bridges/services, dependencies, configuration, shared `dist`, release artifacts, other agents' handoffs and master statuses. Only this new review document and isolated QA evidence were created. No fixes, git initialization, package build, app launch, upload or messaging another agent occurred. Converter work remains unfinished; this audit is the requested intervening review.

## Complete broad-scope follow-up appendix

The following 84 rows are copied from the current scope inventory (which declares October 11 as its date). They preserve broader work not individually runtime-tested here. They are **historical planning entries, not 84 newly confirmed bugs**. Current reader/editor/converter evidence above supersedes stale subset descriptions. Overlapping R/M/B/F/A identifiers must not be added into a feature-completion percentage.

| Plan ID | Area | Remaining work from scope inventory |
| --- | --- | --- |
| S00 | Security Sandbox | Finish other native parser/writer routes; prove ACL/network/process/memory/time/parent-death/cancel/cleanup isolation on Windows; independent security review. |
| M01.01 | Permanent redaction | Retest removal/object/pixel/disk proofs and recovery on current route; vector-preserving redaction, forensic/real-file corpus. |
| M01.02 | Sanitize before sharing | Execute hidden-content/retention cases; expand unsupported structures, metadata/layer/form/action cases; avoid blanket clean/safe verdict. |
| M01.03 | Password protection/change/removal | Current containment/cancel/cleanup checks, wider legacy/public-key/password-normalization corpus and encrypted editing boundaries. |
| M01.04 | Certificate signature validation | Revocation, trusted timestamps, document EKU/policy, AATL/EUTL, broader signature profiles and cryptographic/security corpus acceptance. |
| M01.05 | Separate signature types | Retest current UI and all write warnings; cryptographic validation and online requests remain separate unfinished work. |
| M01.06 | Safe links and attachments | Current Windows isolation, bypass, unusual destinations, attachment identity/size, cancellation and exclusive-save acceptance; broader type handling. |
| M01.07 | Plain-language security report | Real-file truthfulness/error/cancel/partial-result and accessibility checks; certificate validity remains unknown. |
| M02.01 | Compression with quality preview | Current file/filter/image/form/cancel regressions, quality corpus, native resource limits and package operation. |
| M02.02 | Broader conversions | Each new conversion needs reopen/preservation/corpus tests; more decoders and faithful document/slide layouts. |
| M02.03 | Multiple images to PDF | Mixed-image/duplicate/relink/rotate/cancel/recovery/save tests and expanded EXIF/color/metadata behavior. |
| M02.04 | PDF creation from documents/text | Reopen and layout/fonts/page-break/table/image/header corpus; complex source layout fidelity remains limited. |
| M02.05 | Selected-page PDF/image exports | Image-export current runtime/size/quality/cancel/output-name checks and wider split/export corpus. |
| M02.06 | Page additions and decorations | Actual outputs, appearance, source retention, every-page review and recovery tests; more preservation cases. |
| M02.07 | Metadata tools | Exact retained/removed keys, XMP/encodings/unsupported metadata, cancellation and independent reopening. |
| M02.08 | Output naming and safe destinations | Regression every new writer, clear collision/keep-both UX and folder/name/long-path cases; no silent overwrites. |
| M03.01 | Paper-size presets | Physical dimensions/orientation/margins/current UI tests across each operation and large sheets. |
| M03.02 | Page views | Mode/page order, lazy release, large-file/zoom/selection/cancel and accessibility tests; broader independent spreads. |
| M03.03 | Large-sheet navigation | Broader region zoom/pan, high-DPI/large-sheet responsiveness, position retention, keyboard/accessibility and native-window/hardware edge cases. |
| M03.04 | Calibrated measurement | Known dimensions/UserUnit/rotations/units/math/recovery/save tests; Revu takeoff interoperability. |
| M03.05 | Drawing markups | New appearance/geometry/colors/retention/undo/print tests on real drawings; unsupported markup handling. |
| M03.06 | PDF layers | Hierarchy/state/artwork/unsupported configuration and view/print tests; no claim of saved layer edits. |
| M03.07 | Drawing revision comparison | Overlay alignment/scale/rotation/pan/labels/differences and realistic drawing corpus; no automatic design verdict. |
| M03.08 | Large-format printing | Preview/handoff/cancel/large-sheet memory tests plus actual printer output, overlap/alignment/annotation checks. |
| M03.09 | Booklet printing | Page pairing, blank insertion, binding/duplex/orientation and real printer validation. |
| M03.10 | Sheet sets | Changed/missing/relinked sources, selection/recovery/navigation tests; physical revision replacement/comment transfer expansion. |
| M03.11 | Drawing information | Source accuracy/ambiguous labels and real-drawing checks; richer reliable embedded-sheet metadata extraction. |
| M03.12 | CAD boundary | Keep DWG/CAD editing out of initial release; any future adapter needs its own licensed decoder/corpus. |
| M04.01 | Create fillable forms | Actual field geometry/appearances/values/tab behavior/retention/export/reopen/cancel tests. |
| M04.02 | Form usability | Tagged/mixed/ambiguous widget navigation and wider fonts, document declarative validation/formatting/legacy calculation compatibility, screen-reader labels and broad real forms; current calculation/precision/recovery/behavior acceptance. Arbitrary PDF scripts stay inactive. |
| M04.03 | Form submission/output | Current data exports, withheld password-field content, print/cancel and unsupported-field disclosures; online submission later. |
| M04.04 | Signature placement suggestions | Broader label/OCR/uncertainty/cropped/rotated/date/initial placement corpus; no automatic signing. |
| M04.05 | Reusable assets | New template/style import/delete/apply/undo/storage/recovery tests; more portable assets and proprietary tools. |
| M04.06 | Third-party annotations and threads | Foreign/unknown/appearance/provenance preservation and real Revu round trips; broader annotation types/private fields. |
| M04.07 | Annotation reports and exchange | Every format/omission/formula/source-seal/import-retention/interop test; Broader FDF/form-data/appearance coverage, BAX/BTX and private data remain unfinished. |
| M05.01 | Scanner/document-camera capture | Actual scanner/device/driver and cancellation acceptance; document camera, duplex/TWAIN/vendor-only and broader acquisition compatibility. WIA device normalization is outside document AppContainer. |
| M05.02 | Scan cleanup | Faint-content/blank/undo/skew/geometry/OCR and destructive-change review tests on real scans. |
| M05.03 | Additional OCR languages | Recognition quality, fonts/shaping/RTL/CJK, mixed-language/orientation/handwriting expansion and restart recovery. |
| M05.04 | OCR uncertainty review | Low-confidence word/line mapping, corrections, poor scans, output and recovery on current code. |
| M05.05 | Table extraction | Accuracy/irregular/merged/rotated tables, cancellation/source/recovery and Excel/runtime acceptance. |
| M05.06 | Searchable scan documents | Current output geometry/text/pixels/reading order and poor-scan/language corpus; tagging is separate. |
| M05.07 | Clear scan limits | Review every path for accurate language/score/output limits and user comprehension; broaden quality evidence. |
| M06.01 | Formats, photos and editing fidelity | Wider TIFF modes/color/metadata and actual decoding/import acceptance; HEIC/HEIF/legacy Office/iWork decoders; real XML/YAML/CSV/BMP/photo variants, EXIF/color/metadata and layout fidelity. |
| M07.01 | Search occurrence navigation | Exact offsets/highlights/multiple columns/copy restrictions/huge texts, resize/cancel and keyboard tests. |
| M07.02 | Search selected files | Cross-format/cancel/partial-result/source-change/navigation/limits tests; no broad folder scanning. |
| M07.03 | Quick action finder | Keyboard focus, disabled-action reasons, correct routing and every new task at minimum/larger UI scales. |
| M07.04 | Move pages across PDFs by drag | Visible drag preview/source mapping, ordering/cancel/retention and verified output. |
| M07.05 | Page labels, bookmarks and destinations | Current label ambiguity/internal-link coordinates/bookmark graph/retention/recovery tests. |
| M07.06 | Batch operations | Queue/resource/output/partial/failure/collision acceptance; wider conversions/combine and multi-step batches. |
| M07.07 | Reusable workflows | OCR/print/other chained runner stages, combined workflow definitions/recovery, durable interrupted-job resume and current execution/cancel/storage/preservation/source-binding acceptance. |
| M07.08 | Interrupted job recovery | Abrupt death/partial output/disk-full/cleanup failures across all new services and stages. |
| M07.09 | Selected-file scope boundaries | Prove unselected files are never inspected and grants remain scoped through failure/reopen/import. |
| M08.01 | Accessibility inspection | Marked-content coverage, broader semantics, verified standard rule mappings, manual order/focus correctness, assistive technology and PDF/UA/WCAG/508 acceptance. |
| M08.02 | Guided accessibility repair | Broader marked-content/nested-form/link/list/table/MCID remediation and recovery; actual semantic, assistive-technology and standards acceptance. |
| M08.03 | Document health report | Embedded/missing fonts, oversized images, broader unsupported/print checks; current partial/cancel/report tests and verified safe fixes. |
| M08.04 | Trustworthy file details | Actual diverse-file accuracy, current permission Set handling, partial/cancel/error/export and accessibility tests. |
| M08.05 | Accessible job status | Screen-reader confirmation of every current job/dialog, errors, focus transitions and cancellation. |
| M08.06 | Scalable interface | All workflows at large text/high contrast, assistive technology, high DPI and multi-monitor screens. |
| M08.07 | Print preview | Verify exact current preview equals handoff, annotation choices/resolution/clipping/cancel and memory limits. |
| M08.08 | Physical printer validation | Print ordinary and large-sheet/tiled/booklet/form/annotation copies on real printers. |
| M09.01 | Windows/local/cloud sharing | Local copy handoff; future cloud service/account/destination/permission/consent handling. |
| M09.02 | Transfer history | Actual provider/request/error/cancel/log/redaction/cleanup checks; cloud-share transfer history if sharing is added. |
| M09.03 | Optional AI providers/agents | Provider interoperability/timeouts/errors/consent/account-charge/context/source checks; expanded agent runtimes. |
| M09.04 | Cited answers | Exact citation/source offsets, generated-vs-source text, uncertain OCR and malformed-response tests. |
| M09.05 | Read-only AI and untrusted documents | Adversarial document/provider injection tests, no implicit grants/actions, privacy and source retention. |
| M09.06 | Connection controls and secrets | Real secure-storage unavailable/locked/error/remove cases, request cancellation, endpoint/model validation and no leaked keys. |
| M09.07 | Hermes integration | Identify/verify documented API, capabilities/authentication/privacy; implement a bounded adapter only after evaluation. |
| M09.08 | Harness integration | Resolve product/API before adapter design; do not invent integration. |
| M09.09 | Windows lifecycle | Real install/upgrade/uninstall/Open With, signing/icon branding, current package, update/rollback and clean-machine acceptance. |
| M09.10 | Release readiness | Full security/license/SBOM/provenance, performance/large corpus/accessibility/clean-machine review and scope-specific beta acceptance. |
| M10.01 | Later candidates | Reviewed validators/services and explicit requirements before adding working claims. |
| M10.02 | Initial-release exclusions | Do not count excluded items as missing beta features unless the user changes scope. |
| B01 | Revu markup artwork | Authorized Revu originals with rotated/cropped/large sheets, missing appearances, flattened marks and uncommon fonts. |
| B02 | Comments/Markups panel | Real Revu row identity/location/selection, panel resize/collapse, huge inventories and malformed data tests. |
| B03 | Replies, states and locks | Multi-level/missing-parent/duplicate/private-state/locked/provenance and Revu reopen tests. |
| B04 | Foreign markup preservation | Execute unknown/private/appearance/reply/identifier/layer retention tests in every writer and Revu. |
| B05 | Reports and exchange | Current XFDF/FDF/Revu round trips and omission/appearance/private-field acceptance; wider FDF, BAX and BTX/private adapters remain unfinished. |
| B06 | Clouds, arrows, callouts | Artwork/geometry/undo/crop/rotation/retention/print and Revu compatibility tests. |
| B07 | Revision review | Shifted/scaled/rotated drawing alignment, zoom/pan/labels, large-sheet behavior and human interpretation. |
| B08 | Sheet sets and revisions | Real multi-file changes/relink/recovery/navigation tests; physical replacement and comment carry-forward. |
| B09 | Large-sheet layout/navigation | R40 PDF-only fullscreen, large-sheet/high-DPI/view-state retention and collapsed review-panel tests. |
| B10 | Reusable review tools/stamps | Create/apply/export/import/delete/recovery/appearance tests; proprietary .btx/tool-set evaluation separate. |
| B11 | Custom data and quantities | Bluebeam private/custom columns/quantity decoding/exchange not implemented; evaluate formats and real fixtures. |
| B12 | Persistent calibrated takeoffs | Known quantities, unit/scale/geometry/source proofs, appearance preservation/recovery/real Revu and printed output tests. |

## Later adopted targets retained individually

These definitions and dated statuses come from the October 11 consolidated remaining-work register. Each full target remains open; existing partial implementations are described above. This is scope retention, not a finding that all code for these targets is absent. Some dated statuses are stale: F50 Windows context tools, F53 synchronized-file handling, F60 watched folders and F62 signature-request preparation have newer source subsets. Use the current findings above and newer per-feature progress records for those implementations; their full acceptance still remains open.

### F47

1 | F47 | Automatic form-field detection | Detect candidate blank text fields, checkboxes, dates and signature areas on digital and scanned forms. Show confidence, geometry and editable suggestions before creating fields. | R13 / F18; Forms room; scans depend on bounded OCR/layout analysis.

Addition status: coded; syntax/model evidence only; broader acceptance pending.

Still required: Wider geometry, faint/skew/handwriting/marked-state and language/layout detection, robust scan cancellation/shared-worker budgets, real builder output/corpus checks.

### F48

2 | F48 | Smart form autofill | Store names, addresses and reusable values locally; explicitly choose a profile and review proposed values before applying. Edit/delete profiles and exclude passwords/private keys. | Forms room; protected local storage and user-selected matching.

Addition status: coded; focused storage/model checks passed; broader target/UI/output acceptance pending.

Still required: Full UI and actual filled-PDF output cases, broader labels/choices, corruption/lock/disk-full, profile edit recovery and OS migration/key rotation.

### F49

3 | F49 | Automatic form-field labeling | Suggest names, accessible labels, field type and tab order using nearby text; review ambiguous matches and permit correction. | R13 / F18 / F30; form builder and keyboard-order tools.

Addition status: coded; syntax/model evidence only; broader acceptance pending.

Still required: Document-aware reading/tab-order semantics, date/signature-widget behaviors, structured accessibility and multilingual/corpus checks.

### F50

4 | F50 | Windows right-click PDF tools | Optional context-menu actions to open, convert, compress or merge selected files. Route to the appropriate reviewed PDFix workspace, preserving selected-file permissions. | F32 / R28; Windows installation/removal and safe argument handling.

Addition status: planned; expanded target not newly implemented or tested.

### F51

5 | F51 | Microsoft Word, Excel and PowerPoint shortcuts | Free local export shortcuts and evaluated direct Office integration where compatible. Explicitly declare installed-Office requirements and supported output fidelity. | R16–R20 / F10 / F32; no bundled or required paid Office license.

Addition status: planned; expanded target not newly implemented or tested.

### F52

6 | F52 | Microsoft Edge browser extension | User-triggered handoff of a PDF or web page to PDFix, with exact URL/source and destination review. Use a bounded local native-messaging path; no automatic browsing/history collection. | F32 / A22; optional extension/native host installation and removal.

Addition status: planned; expanded target not newly implemented or tested.

### F53

7 | F53 | Cloud-folder compatibility | Work with Google Drive, OneDrive and Dropbox folders already synchronized on the PC. Handle placeholders, hydration, offline errors, locks, changed sources and provider hardlinks while keeping staging local. | R01/R03/R04/R05; all open/save workflows; no implicit cloud grants or sync guarantees.

Addition status: planned; expanded target not newly implemented or tested.

### F54

8 | F54 | Email-to-PDF conversion | Convert standard .eml messages to PDF, retaining supported headers/body and an explicit attachment inventory. Preserve supported attachments through reviewed output where feasible; declare omissions. | F10 / A17; bounded MIME decoding, inert HTML and no remote images/scripts.

Addition status: coded subset; one contained EML fixture passed; full conversion/attachment/output/UI acceptance pending.

Still required: Attachment preservation/extraction, expanded MIME/charset/layout/corpus support, actual editor/PDF export and original/output UI acceptance.

### F55

9 | F55 | PDF from clipboard | Create a PDF from explicitly pasted text, images or screenshots, with editable arrangement, page settings and reviewed output. | Document/Images rooms; inspect clipboard only after a user action and bound bytes/pixels.

Addition status: coded and compiled; clipboard/UI/runtime acceptance pending.

Still required: Actual clipboard/render/export and source-integrity cases, richer arrangement/recovery/format support, device/UI/resource acceptance.

### F56

10 | F56 | Offline PDF translation | Translate permitted extracted/OCR text through optional local models. Show original/translation with physical-page references, language/model identity and uncertain layout/order. Save a separate copy. | Reading/Document rooms; free licensed local models, cancel/resource limits; no silent online fallback.

Addition status: planned; expanded target not newly implemented or tested.

### F57

11 | F57 | Automatic bookmark generation | Detect candidate headings and suggest bookmark hierarchy/destinations. Review and edit suggestions before writing a preserved copy. | F06 / M07.05; outline tools and OCR uncertainty.

Addition status: coded; syntax/model evidence only; broader acceptance pending.

Still required: OCR/column-aware/tag-based proposals, calibrated multilingual quality, extraction cancellation/resource extremes and corpus/actual-output checks.

### F58

12 | F58 | Search across PDF folders | Search hundreds of PDFs in explicitly selected local folders without opening them individually. Show scope, recursive choice, progress, partial results and page/file references. | M07.02 / R48; bounded local index/search, changed-file handling, cancel and index removal.

Addition status: coded session-only subset; one nonrecursive snapshot/revoke case passed; full indexing/search acceptance pending.

Still required: Protected persistent index/grants/removal, incremental changed-file handling, larger PDFs/OCR and expanded content search, full extraction containment and hostile-path/device/cloud/corpus/UI acceptance.

### F59

13 | F59 | Smart file naming | Suggest filenames from titles, dates or OCR metadata. Show the reason and editable proposal; sanitize Windows names and use exclusive save/keep-both rules. | R05 / M02.08; no automatic original renaming.

Addition status: coded subset; proposal/sanitization and 101 MiB disk-backed copy cases passed; full naming/UI acceptance pending.

Still required: Reviewed OCR metadata naming, expanded date/language heuristics, naming recovery, full UI/hostile-path/cloud/lock/disk-full/device and measured large-drawing memory cases.

### F60

14 | F60 | Watched-folder automation | Watch only explicitly granted folders and suggest or execute approved recipes when stable files arrive. Persist consent, pause/revoke controls, receipts and recovery. | F27/F28 / R48; avoid output loops, duplicate jobs and partially synchronized/locked sources.

Addition status: planned; expanded target not newly implemented or tested.

### F61

15 | F61 | CSV mail merge | Map local CSV headers to supported PDF form fields, review rows/results, then generate separate documents with safe names, bounded queues and per-row errors. | F18/F27/F28; standard bounded CSV, no spreadsheet macros or network submissions.

Addition status: coded subset; actual contained two-row writer/safe saves/independent reopen passed; full mail merge acceptance pending.

Still required: Durable editable-session/partial-receipt recovery, receipt export/retry, expanded templates/multi-choice/large PDF route and real forms/CSV/UI/cancel/failure acceptance.

### F62

16 | F62 | Signature request preparation | Prepare reviewed signing/date/initial locations and an email handoff artifact. The user sends the request; no hosted tracking or inferred cryptographic signing. | F39 / A04; distinguish preparation, visual signatures and certificate signatures.

Addition status: planned; expanded target not newly implemented or tested.

### F63

17 | F63 | PDF fingerprint verification | Compute SHA-256 of selected files, compare expected values/earlier receipts, and export verification records. Clearly distinguish file change from signer authenticity. | File-details hashes/source seals exist; add explicit compare/import/export verification workflow.

Addition status: coded subset; exact SHA match/mismatch/export/clear fixture passed; full workflow/UI/security acceptance pending.

Still required: Full UI/cancel/locks/cloud/hostile-path cases, receipt history/authenticated formats and opened-source integration.

### F64

18 | F64 | Print-production marks | Add reviewed crop, bleed and registration marks to supported layouts, with units, offset, bounds and ink/color choices. Preserve original artwork in a new copy. | F29/F40 / A05–A08; no claim that marks alone create bleed or establish PDF/X/color compliance.

Addition status: coded subset; one contained vector-mark preservation/save/reopen case passed; print/UI acceptance pending.

Still required: Selected nondefault UserUnit support, broader layouts and press/color separation/compliance features, durable recovery, real print/geometry/corpus/security/UI acceptance.

### F65

19 | F65 | Detailed PDF page-box editor | Inspect/edit MediaBox, CropBox, TrimBox, BleedBox and ArtBox, including explicit/inherited/default values, units, rotation and selected-page application. Compare/review before saving. | R33 / A05; existing crop/box inspection is partial; clipping is not redaction.

Addition status: coded subset; five-box/inheritance/unit/rotation preservation/save/reopen fixture passed; full geometry/UI acceptance pending.

Still required: Expanded source/geometry and large-file writer support, durable editor recovery, full crop/rotation/UserUnit/layout/permissions/security/UI/corpus acceptance.

### F66

20 | F66 | Thin-line inspection and repair | Identify very thin vector strokes with page/object locations and effective physical widths. Offer explicit selected fixes and before/after review, preserving unaffected artwork and original files. | F29 / A05–A07; account for transforms/UserUnit/zero-width strokes; disclose unsupported patterns/forms/appearance cases.

Addition status: coded subset; CTM/hairline/Form inspection and selected stroke repair/save/reopen fixture passed; full line/UI acceptance pending.

Still required: Shared/nested Form, pattern, Type3/text, annotation appearance and other unsupported repair semantics; recovery, larger source route and real drawings/press/UI/security/corpus acceptance.

### F67

F67 | Digital-pen handwriting and drawing on PDFs | R50: saved editable PDF Ink and standard appearances; pen/highlighter/color/width/opacity, supported pressure with honest fallback, palm rejection, explicit pen/touch/navigation modes, stroke selection/move/delete/erasing, Undo/Redo, zoom/rotation/crop coordinates, multi-page use and recoverable drafts. Preview and save a new copy, reopen to continue editing; flatten only by explicit choice. Basic existing Ink is groundwork; hardware and saved-output acceptance remain open.

Addition status: planned expansion; existing basic Ink is partial groundwork; pen hardware/output acceptance pending.

### A01

**A01 — Certificate validation and trust.** Expand F19/M01.04 to cryptographic integrity, signer identity, certificate chain, timestamp and revocation results. Evaluate authorized AATL/EUTL or other appropriate trust sources, update provenance and offline behavior. Show valid/invalid/unverifiable separately from trusted/untrusted/unknown; never infer validity from a visible mark.

### A02

**A02 — Certificate signing and certification.** Add user-selected certificate signing, hardware-token/SmartCard and Windows certificate-store integration where supported. Review certification permissions, multiple signatures, incremental updates and edit-invalidation warnings. Private keys remain with the authorized key provider; verify outputs independently. This moves certified signing into later adopted scope beyond the original first-release exclusion.

### A03

**A03 — Durable signature evidence.** Evaluate timestamp authorities and supported long-term validation profiles, certificate/revocation evidence retention and verification after expiry or offline use. Define exactly what evidence is retained and what cannot be established. Legal eligibility depends on the chosen workflow and jurisdiction and must be reviewed before related product claims.

### A04

**A04 — Routed signature requests and audit history.** Expand F39 to templates, ordered/parallel recipients, recipient tracking, reminders, supported identity challenges such as email/SMS OTP, bulk requests and cancellation. Specify tamper-evident event records, document identity and downloadable evidence. Identify the provider, costs, authentication, consent, retention and data destination before integration. Visual signing, local certificate signing and remote requests remain separate workflows. Payment pipelines are not added by this intake.

### A05

**A05 — Preflight inspection and reviewed fixes.** Evaluate a contained commercial-grade engine for syntax, fonts, image resolution, transparency, page boxes, output intent and printer-specific rules. Provide versioned profiles, item/page locations, detailed reports, suggested fixes and source/output review. Report unsupported checks and preserve originals. (F29, F40; M10.01.)

### A06

**A06 — Color-profile conversion.** Review ICC profiles, device-independent color, RGB/CMYK/spot-color handling and explicit output intents. Preview changes, disclose color loss, preserve supported objects and validate conversions against a print corpus. Engine/profile licensing and distribution are prerequisites. (F40; expands M10.02's first-release boundary.)

### A07

**A07 — Separations, overprint and trapping.** Add supported CMYK and spot-color plate previews, overprint simulation, ink coverage and reviewed dot-gain/trapping controls or profiles. State monitor/proof limitations and prove output with representative commercial-print files and physical printing. Advanced print-production work is later adopted scope.

### A08

**A08 — PDF/X validation and output.** Expand F40 to evaluated PDF/X editions, including the supplied X-1a, X-3, X-4 and X-6 targets. Offer only editions actually supported by the reviewed engine/validator. Report standard/version, passed and failed rules, repair choices and output verification; appearance or extension is insufficient proof.

### A09

**A09 — PDF/A conversion and validation.** Expand F40/M10.01 to selected PDF/A profiles, including the supplied A-1b, A-2b and A-3u targets. Review font embedding, ICC/output intents, metadata, attachments, transparency and unsupported content; explain changes and validate each saved output independently. Arbitrary input conversion is not guaranteed.

### A10

**A10 — PDF/E feasibility and support.** Evaluate engineering-document standard editions and their decoder/validator requirements. Define supported engineering content, conversion limits, reports and real-file evidence before advertising compliance. This records the PDF/E heading in the intake even though its detailed comparison primarily describes PDF/A.

### A11

**A11 — Tag-tree and reading-order workspace.** Expand F30/M08.01–02 to direct tag-tree editing, logical reading-order review, headings, lists, links, artifacts, alt text, form labels and table header/cell associations. Support bulk artifact operations, keyboard access, undo/recovery, source-page navigation and semantic output review. OCR text is separate from document accessibility.

### A12

**A12 — Accessibility audits and evidence.** Expand F29–F30 to detailed PDF/UA, relevant WCAG and Section 508 requirement mappings, rule versions, evidence locations and repair guidance. Distinguish automated findings from required manual checks. Validate with assistive technology and representative users before claiming accessible output; a checker pass alone is insufficient.

### A13

**A13 — XFA compatibility.** Evaluate static and dynamic XFA layouts, reflow, data binding, field appearances, input/export and print fidelity with government and other representative forms. Detect unsupported content and explain usable alternatives. Select a licensed, contained engine and verify limits; current AcroForm support is not XFA support. (F18; later expansion of M04.)

### A14

**A14 — Isolated form-logic compatibility.** Inventory form calculations, validation, formatting and button actions. Prefer narrowly supported declarative calculations; evaluate a dedicated contained compatibility runtime only for required features. Document-origin code must have no ambient file, process or network access, with resource bounds and effective isolation proof. General PDF script/macro execution remains disabled in current and first-release readers. Later compatibility is explicitly gated on a separate reviewed design and does not relax S00 or R08.

### A15

**A15 — 2D barcode form fields.** Evaluate supported symbologies, live encoding of selected field values, field creation/filling, capacity/error handling and print/scan round trips. Show what data is encoded and review decoder/encoder licensing. This moves barcode fields into later adopted scope.

### A16

**A16 — Reviewed form submissions.** Expand F38/M04.03 to explicit endpoint submissions and authenticated approved database/service connectors. Show the exact destination and payload, request consent, protect credentials, record success/failure and support offline export. Document actions cannot silently contact a server or database. (F38; R03/R27.)

### A17

**A17 — PDF portfolio navigation and creation.** Add an inert inventory, searchable grid/list navigation, supported previews, extraction and creation/reordering of selected contents. Preserve names/metadata where supported and report unsupported layouts. Apply attachment size/count/decompression limits, traversal protection and contained decoders. Embedded Office, CAD or media content needs its own supported capability; never auto-run extracted files. Interactive 3D portfolio presentation is a separate renderer evaluation within this target. (M10.02; S00/R08.)

### A18

**A18 — Interactive 3D PDF.** Evaluate U3D/PRC decoding, rotation, assembly visibility, cross-sections and calibrated geometry measurements with explicit units. Review licensing, GPU/resource budgets and containment. Embedded model viewing and measuring do not imply CAD authoring. (M10.02; separate from M03.12.)

### A19

**A19 — Geospatial PDF.** Inspect coordinate reference systems, georegistration, latitude/longitude and map measurements. Show unit/projection/precision and calibration limits, support layers where meaningful and verify against known reference maps. Local PDF measurements do not establish accurate GIS coordinates. (M10.02.)

### A20

**A20 — Embedded multimedia.** Evaluate user-initiated audio/video playback with inert inventory, codec support, licensing, bounded decode and cancellation. No automatic playback, remote retrieval or script/plugin execution. Rich-media actions require separately reviewed supported behavior. (M10.02; S00.)

### A21

**A21 — Policy-managed access.** Evaluate an authenticated managed-document service with centrally administered access, expiry, revocation, print permissions, audit history and explicit offline policy. Report that revocation controls supported clients and cannot recall screenshots or unrestricted copies. Show service destination, identity and retention. Adobe/AEM policy-file interoperability requires supported API/licensing evaluation; never bypass another system's DRM. Password encryption is a separate existing feature. (M10.02; service/security evaluation.)

### A22

**A22 — Browser shared reviews.** Expand F36 to authenticated or explicitly permissioned link review with no desktop install, drawing/page locations, comment threads, sync/conflict handling, invitations, expiry/revocation and exports. Review browser support for Mac, Chromebook, phones and PCs; show upload destination and permissions before sharing. Keep anonymous/public links deliberate, scoped and revocable. (F36; R22/R27; B01–B05.)

### A23

**A23 — Additional platform clients.** Add feasibility and delivery plans for Mac and iOS/Android reading/review clients, plus a Chromebook/browser path. Preserve source/comment identity, permissions, sync/recovery and format boundaries; retain Windows-first development priority. Phone/tablet gestures, accessibility, offline support, secure storage and distribution need their own acceptance.

### A24

**A24 — Phone-friendly reading and reflow.** Add evaluated text reflow, responsive layout, adjustable type, navigation and accessible reading for mobile documents. Preserve page/source references and flag uncertain order, tables, columns and drawings. Let users return to exact page artwork; do not silently turn reflowed content into an edited original. OCR/reflow fidelity needs a real-file corpus.

### A25

**A25 — Robust opening, repair and honest failure.** Make F42's corpus explicit for legacy/PostScript-derived, malformed, truncated, mixed-generator, unusual-font/image, encrypted, giant and adversarial PDFs. Add bounded cancellable diagnostics, useful error causes and reviewed repair-to-copy where supported. Measure opening/navigation/selection/memory responsiveness across hardware profiles and verify repairs preserve supported content. Never silently call a partially rendered document complete or raise limits without resource evidence. (R06–R09/R29; F04/F29/F42; S00.)

