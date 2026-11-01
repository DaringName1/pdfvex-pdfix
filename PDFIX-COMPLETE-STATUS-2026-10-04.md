# PDFix — complete feature, debugging and testing status

**October 7 planned-scope addition:** R41/A01–A25 now record all ten categories of the supplied Acrobat comparison in [ACROBAT-COMPETITIVE-PLAN.md](ACROBAT-COMPETITIVE-PLAN.md). These are planned expansions with existing overlap, not 25 newly implemented features. The historical acceptance tables below retain their original evidence; the additional targets have no new implementation or acceptance from this intake. The full catalog and future list include them. Older completion estimates do not measure this expanded scope and must not be reused as a current percentage.

Baseline audit **October 4, 2026**, with coding updates through **October 9, 2026**. This is the current status index for the whole saved scope. It covers the original requirements R01–R39, new PDF-only fullscreen R40, all 71 master targets, Security Sandbox S00, all 12 Bluebeam targets, and current debugging/release work. These lists overlap; their row counts are not separate features to add together.

**PDFix is a working development preview. Core workflows have older test evidence; many newer features are saved code awaiting runtime debugging and acceptance. The current build is not a fully verified beta.** The user has now opened the current app and said its appearance looks good, while reporting substantial debugging and missing usability features. That is useful preview feedback, not an open/edit/save/security acceptance pass.

**October 7 update:** PDF artwork fullscreen, hand/pointer navigation and saved reading density are implemented and compiled (250 modules), with runtime acceptance pending. [Implementation record](docs/PDF-READER-USABILITY-2026-10-07.md).

**Latest October 7 batch:** seven major-gap feature families are integrated and compiled (257 modules); [scope and remaining acceptance](docs/MAJOR-GAP-CODING-2026-10-07.md). The future list and machine-readable inventory include these coding updates.

## How to read the status

| Mark | Meaning |
| --- | --- |
| Done | The exact agreed scope has acceptance evidence for the current version. It does not mean a feature can never have a bug. |
| H | A limited subset was historically runtime-tested. Later code has changed, so current regression is still due. |
| U | Implementation exists, but its current workflow has no recorded runtime acceptance. Syntax/build passes are the available evidence. |
| H+U | An older tested subset plus newer untested functionality or integration. |
| N | A requested capability or expansion still needs its first implementation or execution. Existing related features are listed explicitly. |
| L | Deferred candidate or integration requiring an identified/reviewed API, engine or product. |
| X | Explicit initial-release boundary; not a missing first-release feature. |

An item can be coded and still have missing subfeatures. The tables show both. A test file's existence or a product's validation code is not proof that it was executed successfully. Older green tests do not certify later changes to that feature or its dependencies.

## 1. What is 100% done

**No whole broad master acceptance target is certified 100% complete on the current build.** Full master/Sandbox/Bluebeam acceptance remains open. The foundational Phase 1 and Phase 2 scopes were accepted on September 29; many narrower workflows were verified later, as listed below. Their current regression status is pending.

The following concrete project deliverables are complete:

- The PDFix name and supplied master logo are saved and used in the app. Separate executable/small/dark/monochrome branding is still unfinished.
- The original user master list is preserved and every item has a stable tracking ID. New R40 and this whole-scope inventory are saved.
- The October 8 integrated milestone compiled successfully with 276 renderer modules and packaged fixed native components. Further source additions remain in progress; runtime acceptance is a separate task.
- The current development app was visibly opened at Workspaces at the user's request. The user reviewed its appearance. Launching the app did not test every workspace.

## 2. What has actually been tested

These are **historically tested, bounded subsets**, principally September 29–October 2. All need appropriate current regression because substantial code has been added since then.

| Tested subset | Recorded evidence | Current limits / remaining checks |
| --- | --- | --- |
| Picker/drop/reopen, Files/Favorites/filename search | Phase 1 foundation and FileStore/native tests | New multi-file/type integrations and current UI need regression. |
| Save a new copy without overwriting original/existing files/aliases | FileStore tests, disk/source checks, failure cases | Exercise every new writer, native picker races and partial-output failures. |
| PDF rendering, thumbnails, page/keyboard navigation, basic search/copy/zoom/fit | Phase 2 and reader tests on actual synthetic PDF files | Wider real documents, huge drawings and new multi-page modes are not accepted. |
| Damaged PDFs, password entry/cancel, copy/print restrictions | Reader and password fixtures | Broader encryption variants, errors and newer actions need regression. |
| Word/Docs-inspired basic rich document and source editing, DOCX/TXT output | Document editor/codec tests, source-preservation and draft tests | Rich tables/images/bands/RTF/PDF fidelity additions are newer and untested. |
| Source-bound autosave, versions, undo/redo, restore, failed-write rescue and cleanup | Recovery/FileStore/native tests | Recovery in every newer workspace and latest lifecycle changes need checks. |
| Word/rectangle selection on awkward interleaved columns | Actual PDF fixture and selection checks | New rotated/non-unit alignment fix, RTL/vertical text/tables/footnotes need current corpus checks. |
| General fullscreen/sidebar/focus, reader pane toggles, minimum-window layout | Earlier visible layout tests and later offscreen layout checks | PDF-only fullscreen is not implemented. Hidden suites skipped native fullscreen; larger scales/DPI/accessibility remain open. |
| Outline/page labels, saved pages, last reading position, fit/view rotation | Reading-state/native navigation tests | New label jump, bookmark editing and internal destinations are newer code. |
| Standard page organization, vector crop/resize, ordered ranges and automatic splits | PDF/split tests and independently reopened output | New preserving reorder and recipe recovery need acceptance; unsupported forms/comments can be dropped by the standard organizer with disclosure. |
| Two-document text/visual comparison and source/output comparison | Comparison and PDF-difference tests | New manually aligned/color overlays need testing. |
| Five basic PDFix markup tools, edit/remove/undo/recovery, visibility/flatten options | Markup output/recovery/native tests, cropped/rotated cases | New drawing tools/foreign comment edits/replies/styles/XFDF/Revu compatibility are not accepted. |
| Existing supported AcroForm values and visual signatures, local signature library | Form output/recovery/native tests | New field creation and data export, broader fonts/tab order/calculations and real forms remain open. |
| Confirmed selectable-label signature/date/initial proposals | Native forms tests including placement geometry | Broader label/OCR/uncertainty corpus needed; suggestions never imply automatic signing. |
| Local printed-English OCR, corrections and image-preserving searchable copies | OCR output/native tests on text/scan/mixed PDFs, pixel/text checks | More languages, poor scans, cleanup and new confidence/table paths are not verified. |
| One still image to one-page PDF with layout/rotation/crop/recovery | Image output/native tests | Multi-image collections, tone/deskew and newer exports remain untested. |
| Single-PDF measured compression and reviewed output | Compression file/native tests and independently reopened pages | Current native containment/batch routes, larger varied image/filter/form corpus need tests. |
| Clean-image permanent redaction subset | Text/object/pixel/disk/recovery/native tests | New contained source/output verification needs fresh acceptance; vector-preserving redaction remains absent. |
| AES-256 password copies and supplied-owner removal/change | Password/file/native tests including Unicode, geometry, forms/images and saved-copy reopening | Current containment and larger legacy/public-key/normalization/security corpus unfinished. |
| Older bounded raster print preparation and OS handoff | Reader/image/native checks with mocked OS completion | No physical printer acceptance; newer range/tile/N-up/booklet settings need checks. |

The October 2 log records **147 passing checks in a complete hidden run** (69 Node + 78 executed native), followed by targeted refinements that brought the documented checked corpus to **149** (70 Node + 79 executed native across verified runs). One native fullscreen check was intentionally skipped in hidden runs; older visible evidence is separate. These numbers are historical, not results from the present build. `test-results/.last-run.json` says passed but carries no source identity or usable date/count, so it is not promoted to current-build acceptance.

Test-source coverage exists in [tests](tests), including foundation, reader, recovery, editor, layout, comparison, pages/splitting, markup, forms, OCR, image, compression, redaction and password suites. This audit read records/source only; it did not run them.

## 3. Coded but not runtime-accepted

The following saved additions have source/syntax/build evidence and still need debugging with actual workflows and files:

| Feature family | What is coded | Main evidence / next acceptance |
| --- | --- | --- |
| PDF reader usability | Artwork fullscreen with temporary exit/view restoration; hand drag and pointer zoom; Compact/Comfortable spacing | Current runtime/visual/DPI/transition/focus/drawing tests pending; [October 7 scope](docs/PDF-READER-USABILITY-2026-10-07.md). |
| New major-gap additions | Zoom-region/history, reviewed matching, bookmark split, cross-source drag staging, persistent table corrections, Bates identifiers and contained rich documents | Source/compile evidence only; [October 7 checkpoint](docs/MAJOR-GAP-CODING-2026-10-07.md). |
| PDF content editing | Text/image overlays; supported original font/glyph/TJ edits; nested Form resources and shared-instance isolation | Reopen/preservation/geometry/font/image/cancel/real-file tests; [editing](docs/PDF-EDITING-FIDELITY-PROGRESS.md), [nested text](docs/PDF-NESTED-TEXT-PROGRESS.md), [images](docs/PDF-NESTED-IMAGE-PROGRESS.md). |
| Preserving page reorder | Exact all-page permutation retaining original comment/link/widget/form/bookmark references within supported bounds | Execute graph/artwork/retention/unsafe-source/review/save tests; [scope](docs/PDF-PRESERVING-PAGE-ORDER-PROGRESS.md). |
| Richer documents | Editable table structure/widths/merges, inline images, page setup/breaks, find/replace, formatting, authored/imported plain bands and reviewed PDF export | Actual DOCX/RTF/PDF round trips/layout/recovery/preservation; [tables](docs/DOCUMENT-FIDELITY-PROGRESS.md), [images](docs/DOCUMENT-IMAGE-FIDELITY-PROGRESS.md), [bands](docs/DOCUMENT-BAND-IMPORT-PROGRESS.md). |
| New format workspaces | RTF, supported XLSX values and PPTX text, Markdown/CSV structured previews | Adapter/source/recovery/round-trip/corpus and current containment tests; [formats](FORMAT-SUPPORT.md). |
| Image/scan tools | Multi-image collections, tone/deskew, blank proposals, OCR confidence/review exports, image/page PNG/JPEG exports | Poor/faint scans, mixed image variants, geometry/relink/recovery/output and cancellation. |
| Reading/search | Continuous/facing pages, match next/previous, selected-file content search, label jumps, editable bookmarks, links/attachments, layers, file details | Reader/source identity/permissions/large-file/memory/keyboard/cancel tests; [selected search](docs/SELECTED-FILE-SEARCH.md). |
| Selection correction | PDF.js container rotation and UserUnit-scaled text layers in single/multi/table views | Rotated/cropped/non-unit/RTL/multi-column real PDFs; [geometry fix](docs/PDF-SELECTION-GEOMETRY-PROGRESS.md). |
| Table extraction | Region/grid, PDF words or English scan OCR, corrected cells, uncertainty highlights, reviewed source-bound CSV | Accuracy/merged/irregular cells, literal CSV, page/grid changes, unsaved close and cancellation; [scope](docs/TABLE-EXTRACTION-PROGRESS.md). |
| PDF health/security/cleanup | Scoped reports, supported metadata edits and selective structural cleanup | Actual structures, partial/error results, retained/removed data and misleading-result checks; [health](docs/PDF-HEALTH-REPORT-PROGRESS.md). |
| New print settings | Ranges/paper/scaling/N-up/tile/booklet, prepared-output preview | Exact preview/handoff, memory/cancel/annotations and actual printers. |
| New forms/decorations | Text/check/radio/choice creation, field-data exports, numbers/bands/watermarks/stamps/templates | Geometry/appearance/fonts/tab order/source retention, safe export and recovery. |
| Drawing/Bluebeam review | Comments panel, location navigation, replies/states/locks, supported edits, colors/clouds/callouts/styles, portable drafts and XFDF | Authorized Revu files and round trips; see every B target below and [Bluebeam plan](BLUEBEAM-COMPATIBILITY-PLAN.md). |
| Sheet sets/takeoffs | Source-linked sets/revision references, calibration, persistent measurement/count annotations, quantities, recovery/updates | Known-scale math/geometry/units, exact data/appearance retention, Revu compatibility and recovery. |
| Batch/workflows | Reviewed compression queue with retry/skip/cancel/results/new-folder copies; page-plan recipes and reusable styles/templates | Partial failures/collisions/close/source changes/resources; broader batch and multi-step execution remain to build. |
| Security Sandbox integrations | Fixed AppContainer/Job Object routes, schemas, source/token seals, bounds, close/cleanup fences and native pinned artifacts | Actual Windows isolation/ACL/network/child/memory/time/parent-death/cancel/cleanup; [adoption](docs/SECURITY-SANDBOX-ADOPTION.md). |
| AI connections | Explicit provider/model/endpoint/context review, read-only requests, citations/history, Windows-backed secrets | Real provider and unavailable-secret cases, injection/consent/timeout/privacy tests; no online calls made in this audit. |
| Windows/package | Open-with request queue/metadata, versioned development package and per-user install/uninstall scripts | Real install/upgrade/uninstall/associations, signature/icon/license/SBOM/clean-machine checks; [packaging](docs/WINDOWS-PACKAGING-PROGRESS.md). |
| Workspace/accessibility UI | Action finder, task filtering/direct entries, larger-text/contrast/reduced-motion controls and job announcements | Every workflow at larger scales/keyboard/screen reader/DPI; visual feedback is not full usability acceptance. |

## 4. Still needs a first implementation or broader feature work

- **Certificate signature validation:** current signature presence/unknown reporting is not cryptographic trust validation.
- **Direct scanner/document-camera capture:** file import is present; actual capture/device handling is absent.
- **Additional OCR languages:** English exists; additional models, choice, fonts and quality evidence do not.
- **Windows Share handoff / cloud links:** local copies exist; actual Windows Share and cloud service sharing do not.
- **Accessibility repair and complete checks:** current tag/form-label observations do not validate or repair reading order, headings and semantics.
- **Health-report completion:** actual embedded/missing font and oversized-image inspection, more print/problem checks and validated fixes.
- **Additional decoders:** HEIC/HEIF, multipage TIFF, legacy DOC/XLS/PPT and Apple iWork; orientation/color/metadata/Live Photo handling.
- **Broader PDF/document fidelity:** new glyphs/font embedding, shaping/reflow, unsupported text/image/resource cases, complex Word/slide layouts, rich/multi-section bands, borders/wrapped media and wider structure preservation.
- **Vector-preserving redaction and wider sanitation:** clean-image redaction is a bounded mode; expand safely after validation.
- **Broader batches and multi-step workflows:** conversion/rename/combine queues and editable chained steps beyond current compression/recipes.
- **Broader Bluebeam data/exchange:** private/custom columns, proprietary BAX/BTX formats and unsupported annotations/appearances; Studio/cloud is later evaluation.
- **Broader sheet revision handling:** physical page replacement with controlled comment transfer; richer sheet metadata and takeoff interchange.
- **Installer/update polish:** current scripts/package are development tools; installer signatures/branding, update/rollback and clean-machine installation remain unfinished.
- **Later reviewed services/standards:** Hermes/Harness product/API evaluation, online signature requests, cloud review/forms, PDF/A/PDF/X/tagged-PDF validation and Bates numbering.

Physical printer checks, security review, real-file/regression/accessibility/performance/license/SBOM/provenance checks are also required; they are acceptance work, not missing buttons. Excluded first-release items stay separately marked X below.

## 5. Debugging and usability priorities

The user reports substantial debugging needs but has not supplied individual reproducible defects beyond missing PDF-only fullscreen. The following are an ordered work/acceptance backlog, not claims that each path is broken. No new tests were executed for this report.

| Priority / ID | Work | Acceptance before closing |
| --- | --- | --- |
| P1 D01 | Accept and debug implemented PDF-only fullscreen R40 | Hide all surrounding chrome; retain page/zoom/scroll/reading mode/unsaved work; keyboard navigation and reliable Escape/temporary exit; exact layout restoration. |
| P1 D02 | Daily reader/workspace debugging | Reproduce user-visible errors, missing/disabled actions, clipped controls and incorrect task routing; record file/view/action/expected/actual/fix/current evidence. |
| P1 D03 | Current open/edit/save/reopen/original safety | Actual supported files through each writer, canceled pickers, collisions, altered sources, retained structure/artwork and saved bytes. |
| P1 D04 | Recovery and unsaved work | Close/switch/reload/crash/disk failures in every new workspace; avoid losing corrections or claiming a failed output is complete. |
| P1 D05 | Security Sandbox acceptance | Effective Windows boundaries, no unrestricted fallback, termination/parent death, job limits and safe cleanup; complete remaining adoption. |
| P1 D06 | Stable weird-PDF selection | Rotation/UserUnit/crop/columns/tables/RTL/fonts, zoom/resize/reading-mode changes; copied text matches visible selection. |
| P1 D07 | Dad's drawing/comment workflow | Real authorized Revu drawings/comments/replies/states/locks, exact locations, source retention and reopened copies in Revu. |
| P2 D08 | New feature correctness | Table/OCR cells and word boxes, takeoff math/units, field appearances, bands/images/tables, XFDF and batch results. |
| P2 D09 | Fast, usable large documents | Lazy canvases/text, memory bounds, high-DPI/DPI changes, responsiveness, cancellations, queue fairness and error recovery. |
| P2 D10 | Layout/accessibility/keyboard | Minimum/large screens, larger text/contrast, focus order, screen reader, reduced motion and all dialogs/panels. |
| P2 D11 | Exact print output | Prepared preview, handoff/cancel, real ordinary/large/tiled/booklet printouts and annotation choices. |
| P2 D12 | Windows installation/release | Current package on clean Windows, install/upgrade/uninstall, associations/default control, signatures, branding and dependency review. |
| P2 D13 | AI privacy and reliability | Provider/account/endpoint/context review, secret errors, timeout/cancel, injection, citations and transfer-history cleanup. |

Later testing should stay hidden/offscreen where technically possible, reflecting the user's preference. Native fullscreen, actual scanner/printer hardware and manual assistive-technology validation may need specifically arranged visible/hardware review. The earlier five-different-failed-approaches instruction remains a workflow preference; it does not turn unexecuted checks into acceptance.

## 6. Original requirements — every target accounted for

| ID | Requirement | Current status and remaining scope |
| --- | --- | --- |
| R01 | Recovery and versions | H+U — tested editor/version/recovery subsets; newer workspace recipes/drafts need crash/recovery acceptance. |
| R02 | Leaving unsaved work | H+U — tested failed-save guards; latest dialog/job/renderer close barriers need regression. |
| R03 | Cleanup and privacy | H+U — older local cleanup tested; newer job/provider/library cleanup and diagnostic privacy need acceptance. |
| R04 | Recoverable operations | H+U — bounded older jobs tested; complete newer recipe/output/recovery scope remains. |
| R05 | Output collisions | H — older exclusive safety tested; all new writers and better keep-both UX still need checks/work. |
| R06 | Navigation and views | H+U — old reader/navigation tested; new modes/search/layers/labels/bookmarks need acceptance. |
| R07 | Complex selection | H+U — awkward-column subset tested; new geometry and broader reading-order corpus open. |
| R08 | Safe links/attachments | U — reviewed source-bound code exists; security/runtime/attachment corpus open. |
| R09 | Comparison | H+U — old comparisons tested; drawing overlay/alignment acceptance open. |
| R10 | Printing | H+U — old mocked handoff tested; new print settings and physical output open. |
| R11 | OCR | H+U — bounded English tested; newer review paths and additional languages/quality open. |
| R12 | Scan cleanup | U — deskew/tone/blank proposal code; real faint/poor scans and destructive changes need checks. |
| R13 | Forms | H+U — supported filling/signing tested; field creation/data/fonts/tab order/corpus open. |
| R14 | Signature distinctions | H+U — visual signing tested, structural unknown reporting coded; cryptographic validation absent. |
| R15 | Annotations | H+U — old PDFix tools tested; foreign/reply/exchange/drawing scope needs acceptance. |
| R16 | Explicit capability matrix | H+U — documented format/operation limits; current matrix honesty and UX need review. |
| R17 | Format coverage | H+U — tested basics/new adapters coded; HEIC/TIFF/legacy/iWork and broad corpus absent. |
| R18 | Conversion preservation | H+U — older bounded outputs tested; new rich exports/writers need retention/layout acceptance. |
| R19 | Apple photos | N — HEIC/HEIF/color/metadata/Live Photo support pending decoder evaluation/implementation. |
| R20 | Archival/tagged outputs | L — reviewed validators and compliance proof absent. |
| R21 | Batch jobs | U — compression, reviewed PDF copy/rename and supported TXT queues coded; broader operation types and queue/failure/runtime acceptance remain. |
| R22 | Sharing | N — Windows Share/cloud integration absent; copy export is existing related functionality. |
| R23 | Accessibility | H+U — older keyboard/layout subsets tested, scalable UI coded; full assistive/current-workflow audit open. |
| R24 | AI request consent/scope | U — explicit selected-context request review coded; actual provider/privacy tests open. |
| R25 | Read-only AI | U — no auto file-write/tool route coded; injection/consent/citation acceptance open. |
| R26 | Connections/secrets | U — Windows-backed controls coded; actual provider/secret/error/delete tests open. |
| R27 | Visual AI context/uncertainty | U/partial — context/citation/uncertainty controls; image-capable provider breadth and exact visual-source acceptance open. |
| R28 | Windows integration | U — request intake/package/install sources; clean-machine install/upgrade/uninstall/association/update work open. |
| R29 | Real-file/adversarial corpus | H+U — old synthetic/actual-file safety fixtures exist; current whole-feature/real-world/security corpus open. |
| R30 | Brand assets | Partial — supplied master/name complete; executable/icon/background/monochrome/provenance acceptance open. |
| R31 | General fullscreen/layout | H+U — earlier visible/native evidence, newer workflows unverified; R40 is a separate new scope. |
| R32 | Visual polish | H+U — old screenshots/minimum checks; user now flags debugging, all new screens need review. |
| R33 | Page tools | H+U — old standard crop/resize/split/organizer tested; new recovery/preserving modes and wider rules open. |
| R34 | Useful PDF editing | U — bounded overlays/original/nested object edits coded; real-file fidelity acceptance and unsupported cases open. |
| R35 | PDF creation | H+U — one-image/basic document subsets tested; multi-image/rich table/image/band PDF exports open. |
| R36 | Guided signature assistance | H — bounded selectable-label/manual confirmation tested; broader uncertain/OCR cases open. |
| R37 | Security Sandbox | U — S00 source/build implementation; full adoption and actual OS isolation/security acceptance open. |
| R38 | Full master-list coverage | Planning done — all 71 saved targets mapped below; feature implementation/acceptance remains open. |
| R39 | Bluebeam review | U — standard-PDF subsets coded; B01–B12 and actual Revu acceptance open. |
| R40 | PDF-only fullscreen | U — artwork mode and restoration implemented October 7; current runtime, focus, transition and DPI acceptance pending. |

## 7. Master, Sandbox and Bluebeam targets — complete detail

All 84 targets are mapped below. H/U labels describe evidence for a subset, not completion of the broad target. The original acceptance checkboxes remain open. Each row states implemented behavior and remaining work; related requirements above intentionally overlap.


### Security Sandbox

| ID | Status | Feature | Implemented / available evidence | Still to do |
| --- | --- | --- | --- | --- |
| S00 | U | Security Sandbox | Fixed Windows AppContainer/Job Object code; qpdf and adopted document families have contained routes and pinned builds. | Finish other native parser/writer routes; prove ACL/network/process/memory/time/parent-death/cancel/cleanup isolation on Windows; independent security review. |

### PDF security and protection

| ID | Status | Feature | Implemented / available evidence | Still to do |
| --- | --- | --- | --- | --- |
| M01.01 | H+U | Permanent redaction | Clean-image reconstruction was tested; current contained inspection/verification route is newer and untested. | Retest removal/object/pixel/disk proofs and recovery on current route; vector-preserving redaction, forensic/real-file corpus. |
| M01.02 | U | Sanitize before sharing | Structural inventory and selective cleanup copy are coded with contained native routes and reviewed outputs. | Execute hidden-content/retention cases; expand unsupported structures, metadata/layer/form/action cases; avoid blanket clean/safe verdict. |
| M01.03 | H+U | Password protection/change/removal | AES-256 and owner-authorized removal/change passed older real-file tests; later native sandbox code needs regression. | Current containment/cancel/cleanup checks, wider legacy/public-key/password-normalization corpus and encrypted editing boundaries. |
| M01.04 | U | Certificate signature validation | Restricted contained CMS ByteRange integrity and signer identity plus Windows offline base-chain/root-anchor inspection are integrated and compiled October 9. Runtime acceptance pending. | Revocation, trusted timestamps, document EKU/policy, AATL/EUTL, broader signature profiles and cryptographic/security corpus acceptance. |
| M01.05 | H+U | Separate signature types | Visual signature workflows tested; newer structural report differentiates certificate signatures and external requests. | Retest current UI and all write warnings; cryptographic validation and online requests remain separate unfinished work. |
| M01.06 | U | Safe links and attachments | Source-bound destination review, internal links, attachment inventory and reviewed inert .bin copies are coded. | Native/renderer bypass, unusual destination, attachment identity/size, cancellation and exclusive-save runtime checks; broader type handling. |
| M01.07 | U | Plain-language security report | Encryption/signature/action/attachment/unsupported-structure reporting is coded on contained inspection. | Real-file truthfulness/error/cancel/partial-result and accessibility checks; certificate validity remains unknown. |

### Conversion, creation and output

| ID | Status | Feature | Implemented / available evidence | Still to do |
| --- | --- | --- | --- | --- |
| M02.01 | H+U | Compression with quality preview | Single-PDF measured compression and page review tested historically; later containment and batch integrations untested. | Current file/filter/image/form/cancel regressions, quality corpus, native resource limits and package operation. |
| M02.02 | H+U | Broader conversions | Basic DOCX/TXT and one-image PDF subsets tested; RTF, richer DOCX/PDF, workbook/slide and image/page exports are coded. | Each new conversion needs reopen/preservation/corpus tests; more decoders and faithful document/slide layouts. |
| M02.03 | U | Multiple images to PDF | Ordered multi-image collection, per-page setup/crop/tone/order, recovery and preview are coded. | Mixed-image/duplicate/relink/rotate/cancel/recovery/save tests and expanded EXIF/color/metadata behavior. |
| M02.04 | H+U | PDF creation from documents/text | Basic document editing/export was tested; richer PDF page setup, bands/images/tables and page breaks are newer code. | Reopen and layout/fonts/page-break/table/image/header corpus; complex source layout fidelity remains limited. |
| M02.05 | H+U | Selected-page PDF/image exports | Ordered range extraction and split copies tested; selected-page PNG/JPEG export is coded. | Image-export current runtime/size/quality/cancel/output-name checks and wider split/export corpus. |
| M02.06 | U | Page additions and decorations | Blank/replacement page workflows, numbering/bands/watermarks/stamps and reusable templates are coded. | Actual outputs, appearance, source retention, every-page review and recovery tests; more preservation cases. |
| M02.07 | U | Metadata tools | Declared metadata inspection/edit/removal and structural sanitation are coded. | Exact retained/removed keys, XMP/encodings/unsupported metadata, cancellation and independent reopening. |
| M02.08 | H | Output naming and safe destinations | Exclusive new-copy saving, original/alias/existing-file refusal and destination picking tested historically. | Regression every new writer, clear collision/keep-both UX and folder/name/long-path cases; no silent overwrites. |

### Paper, printing and drawings

| ID | Status | Feature | Implemented / available evidence | Still to do |
| --- | --- | --- | --- | --- |
| M03.01 | U | Paper-size presets | US, ANSI engineering, ARCH and ISO presets coded for supported page/document/print operations. | Physical dimensions/orientation/margins/current UI tests across each operation and large sheets. |
| M03.02 | H+U | Page views | Single-page view tested; continuous/facing-page views are coded. | Mode/page order, lazy release, large-file/zoom/selection/cancel and accessibility tests; broader independent spreads. |
| M03.03 | H+U | Large-sheet navigation | Basic zoom/fit tested; markup-location zoom, previous-view and drawing navigation coded. | PDF-only fullscreen R40, general region zoom/pan improvements, high-DPI/large-sheet responsiveness and position retention. |
| M03.04 | U | Calibrated measurement | Calibration, distance/perimeter/area/count ledger and supported persistent takeoffs are coded. | Known dimensions/UserUnit/rotations/units/math/recovery/save tests; Revu takeoff interoperability. |
| M03.05 | H+U | Drawing markups | Five basic PDFix tools tested; line/arrow/cloud/callout and measurement artwork coded. | New appearance/geometry/colors/retention/undo/print tests on real drawings; unsupported markup handling. |
| M03.06 | U | PDF layers | Optional-content inventory and temporary visibility controls coded. | Hierarchy/state/artwork/unsupported configuration and view/print tests; no claim of saved layer edits. |
| M03.07 | H+U | Drawing revision comparison | Linked two-PDF/text/source-output comparison tested; manually aligned/color overlay is newer code. | Overlay alignment/scale/rotation/pan/labels/differences and realistic drawing corpus; no automatic design verdict. |
| M03.08 | H+U | Large-format printing | Older bounded raster preparation/OS handoff tested; range/paper/scale/N-up/tile controls coded. | Preview/handoff/cancel/large-sheet memory tests plus actual printer output, overlap/alignment/annotation checks. |
| M03.09 | U | Booklet printing | Booklet page planning and reviewed layout/duplex disclosures coded. | Page pairing, blank insertion, binding/duplex/orientation and real printer validation. |
| M03.10 | U | Sheet sets | Named ordered sets, navigation, source references and controlled revision-reference review coded. | Changed/missing/relinked sources, selection/recovery/navigation tests; physical revision replacement/comment transfer expansion. |
| M03.11 | U | Drawing information | Printed/sheet labels, user-entered title/revision and visible-page details coded. | Source accuracy/ambiguous labels and real-drawing checks; richer reliable embedded-sheet metadata extraction. |
| M03.12 | X | CAD boundary | PDF viewing/measurement is scoped separately from CAD model editing. | Keep DWG/CAD editing out of initial release; any future adapter needs its own licensed decoder/corpus. |

### Forms, signatures and review

| ID | Status | Feature | Implemented / available evidence | Still to do |
| --- | --- | --- | --- | --- |
| M04.01 | U | Create fillable forms | Supported text/check/radio/choice field placement, labels/flags and source-bound recovery coded. | Actual field geometry/appearances/values/tab behavior/retention/export/reopen/cancel tests. |
| M04.02 | H+U | Form usability | Required/blank guidance and supported existing field values tested; newer field creation coded. Reviewed user-authored declarative field calculations, dependency/cycle checks, explicit inputs/results/rounding review, undo/recovery and write consistency are coded and compiled October 9; source PDF actions remain inert. Native contained fill inspection/build and source/output preservation verification are integrated and compiled; reviewed calculations and recovery retained. Reviewed supported-page custom widget order, numbered overlays, undo/recovery and native PDF 2.0 order verification are integrated and compiled October 9. | Tagged/mixed/ambiguous widget navigation and wider fonts, document declarative validation/formatting/legacy calculation compatibility, screen-reader labels and broad real forms; current calculation/precision/recovery/behavior acceptance. Arbitrary PDF scripts stay inactive. |
| M04.03 | H+U | Form submission/output | Completed-copy saving and visual signing tested; field-data JSON/CSV/text exports coded. Filled copies now save from a main-retained source-bound seal, with awaited cancellation/departure cleanup; compiled October 9. | Current data exports, withheld password-field content, print/cancel and unsupported-field disclosures; online submission later. |
| M04.04 | H | Signature placement suggestions | Current-page selectable label proposals and manually confirmed placement tested historically. | Broader label/OCR/uncertainty/cropped/rotated/date/initial placement corpus; no automatic signing. |
| M04.05 | H+U | Reusable assets | Local approved visual signature library tested; reusable drawing styles and stamps/templates coded. | New template/style import/delete/apply/undo/storage/recovery tests; more portable assets and proprietary tools. |
| M04.06 | U | Third-party annotations and threads | Standard comment inventory, threads/states/locks, supported plain-comment/reply edits coded. | Foreign/unknown/appearance/provenance preservation and real Revu round trips; broader annotation types/private fields. |
| M04.07 | U | Annotation reports and exchange | Reviewed TXT/CSV/JSON reports, summary PDFs and supported XFDF import/export coded. Supported native FDF comments with bounded grammar, chosen-source import, omission review, actual PDF comparison and sealed FDF/PDF saving are integrated and compiled October 9. | Every format/omission/formula/source-seal/import-retention/interop test; Broader FDF/form-data/appearance coverage, BAX/BTX and private data remain unfinished. |

### Scanning, OCR and extraction

| ID | Status | Feature | Implemented / available evidence | Still to do |
| --- | --- | --- | --- | --- |
| M05.01 | U | Scanner/document-camera capture | Windows WIA flatbed/repeated and simplex feeder capture, bounded pinned native helper, cancellation, durable verified PNG copies and image/PDF page review integration are coded and compiled October 8. | Actual scanner/device/driver and cancellation acceptance; document camera, duplex/TWAIN/vendor-only and broader acquisition compatibility. WIA device normalization is outside document AppContainer. |
| M05.02 | H+U | Scan cleanup | Basic still-image rotation/crop/layout tested; deskew/tone/multi-image cleanup and blank-page proposals coded. | Faint-content/blank/undo/skew/geometry/OCR and destructive-change review tests on real scans. |
| M05.03 | U | Additional OCR languages | Six bundled local OCR languages (English, Spanish, French, German, Portuguese, Italian), selected-language request/result/output provenance and packaged metadata/notices are coded and compiled October 8. | Recognition quality, fonts/shaping/RTL/CJK, mixed-language/orientation/handwriting expansion and restart recovery. |
| M05.04 | H+U | OCR uncertainty review | English correction/source-position/searchable output tested; richer confidence overlays/exports/table OCR coded. | Low-confidence word/line mapping, corrections, poor scans, output and recovery on current code. |
| M05.05 | U | Table extraction | Region/grid, selectable words or English OCR, editable cells, paged review, source-bound CSV/correction drafts and contained literal XLSX coded. | Accuracy/irregular/merged/rotated tables, cancellation/source/recovery and Excel/runtime acceptance. |
| M05.06 | H+U | Searchable scan documents | Mixed/text/scan image-preserving searchable copies tested historically; newer cleanup/review integration coded. | Current output geometry/text/pixels/reading order and poor-scan/language corpus; tagging is separate. |
| M05.07 | H+U | Clear scan limits | Printed-English, handwriting/quality/reading-order limits documented; newer scan/table UI has updated disclosures. | Review every path for accurate language/score/output limits and user comprehension; broaden quality evidence. |

### Formats and editing fidelity

| ID | Status | Feature | Implemented / available evidence | Still to do |
| --- | --- | --- | --- | --- |
| M06.01 | H+U | Formats, photos and editing fidelity | PDF/basic DOCX/TXT/source and still images have historical subsets; RTF/XLSX/PPTX/Markdown/CSV/richer DOCX code exists. | HEIC/HEIF/multipage TIFF/legacy Office/iWork decoders; real XML/YAML/CSV/BMP/photo variants, EXIF/color/metadata and layout fidelity. |

### Navigation and multi-file work

| ID | Status | Feature | Implemented / available evidence | Still to do |
| --- | --- | --- | --- | --- |
| M07.01 | U | Search occurrence navigation | In-document counts/next/previous match navigation coded beyond older page-result search. | Exact offsets/highlights/multiple columns/copy restrictions/huge texts, resize/cancel and keyboard tests. |
| M07.02 | U | Search selected files | Chosen-source local search, filenames/pages/lines, bounded extraction and hash-checked reopening coded. | Cross-format/cancel/partial-result/source-change/navigation/limits tests; no broad folder scanning. |
| M07.03 | U | Quick action finder | Searchable actions/shortcuts and workspace filtering/direct tasks coded. | Keyboard focus, disabled-action reasons, correct routing and every new task at minimum/larger UI scales. |
| M07.04 | N | Move pages across PDFs by drag | Adding another PDF to the organizer is supported; direct cross-document page dragging is absent. | Visible drag preview/source mapping, ordering/cancel/retention and verified output. |
| M07.05 | H+U | Page labels, bookmarks and destinations | Source outline/labels/personal pages tested; label jumps, bookmark editing and destination review coded. | Current label ambiguity/internal-link coordinates/bookmark graph/retention/recovery tests. |
| M07.06 | U | Batch operations | Selected-PDF compression plus reviewed PDF copy/rename and narrowly supported TXT queues with new-folder saves coded. | Queue/resource/output/partial/failure/collision acceptance; broader conversions/combine and multi-step batches. |
| M07.07 | U | Reusable workflows | Named page-plan recipes and reusable drawing/decorative settings coded. Editable page-reorder/Bates sequences now run through native verified intermediates with actual output review and token-only save; integrated and compiled October 9. | Native multi-source combine, OCR/print/other step families, durable workflow definitions/recovery/resume and current execution/cancel/preservation/source-binding acceptance. |
| M07.08 | H+U | Interrupted job recovery | Older known-job cleanup/recovery subsets tested; newer source recipes and batch retry/discard coded. | Abrupt death/partial output/disk-full/cleanup failures across all new services and stages. |
| M07.09 | U | Selected-file scope boundaries | Search/batch pick exact sources and disclose no broad folder scanning. | Prove unselected files are never inspected and grants remain scoped through failure/reopen/import. |

### Accessibility and inspection

| ID | Status | Feature | Implemented / available evidence | Still to do |
| --- | --- | --- | --- | --- |
| M08.01 | U | Accessibility inspection | Source-bound metadata/tag/ParentTree/role/heading/figure/table/link/form audit with page/object evidence, human checks, tag repair routing and sealed evidence export is integrated and compiled October 9. | Marked-content coverage, broader semantics, verified standard rule mappings, manual order/focus correctness, assistive technology and PDF/UA/WCAG/508 acceptance. |
| M08.02 | U | Guided accessibility repair | Existing tag-tree editing plus eligible initial structure creation, reading order, artifact marking, Figure Alt, language and supported table associations are integrated with undo/redo and exact tree/page output review; compiled October 9. | Broader marked-content/nested-form/link/list/table/MCID remediation and recovery; actual semantic, assistive-technology and standards acceptance. |
| M08.03 | U | Document health report | Visible geometry, permitted text problems, internal destinations, structure/form-label observations coded. | Embedded/missing fonts, oversized images, broader unsupported/print checks; current partial/cancel/report tests and verified safe fixes. |
| M08.04 | U | Trustworthy file details | Snapshot dimensions/rotation/count/size/hash/metadata/permissions/text scope and all-page geometry coded. | Actual diverse-file accuracy, current permission Set handling, partial/cancel/error/export and accessibility tests. |
| M08.05 | H+U | Accessible job status | Older workflows have tested statuses/keyboard names; new workflows contain progress/error/cancel announcements. | Screen-reader confirmation of every current job/dialog, errors, focus transitions and cancellation. |
| M08.06 | H+U | Scalable interface | Minimum-window/focus/keyboard subsets tested; larger text/contrast/reduced-motion controls coded. | All workflows at large text/high contrast, assistive technology, high DPI and multi-monitor screens. |
| M08.07 | H+U | Print preview | Older bounded prepared output tested; full range/paper/layout/tile/booklet preview coded. | Verify exact current preview equals handoff, annotation choices/resolution/clipping/cancel and memory limits. |
| M08.08 | N | Physical printer validation | Historical OS handoff used mocked completion; no accepted physical-printer evidence. | Print ordinary and large-sheet/tiled/booklet/form/annotation copies on real printers. |

### Privacy, Windows and AI

| ID | Status | Feature | Implemented / available evidence | Still to do |
| --- | --- | --- | --- | --- |
| M09.01 | N | Windows/local/cloud sharing | New-copy export exists; Windows Share handoff and cloud share links are absent. | Local copy handoff; future cloud service/account/destination/permission/consent handling. |
| M09.02 | U | Transfer history | Provider request/history/privacy-cleanup code records online context disclosures. | Actual provider/request/error/cancel/log/redaction/cleanup checks; cloud-share transfer history if sharing is added. |
| M09.03 | U | Optional AI providers/agents | Explicit connection/context/request review and provider calls coded. | Provider interoperability/timeouts/errors/consent/account-charge/context/source checks; expanded agent runtimes. |
| M09.04 | U | Cited answers | Read-only answers and source page/line references/navigation coded. | Exact citation/source offsets, generated-vs-source text, uncertain OCR and malformed-response tests. |
| M09.05 | U | Read-only AI and untrusted documents | No automatic file-write/tool route; scoped context and proposed-answer review coded. | Adversarial document/provider injection tests, no implicit grants/actions, privacy and source retention. |
| M09.06 | U | Connection controls and secrets | Windows secure-storage connection/model/test/remove controls coded, fail-closed intent. | Real secure-storage unavailable/locked/error/remove cases, request cancellation, endpoint/model validation and no leaked keys. |
| M09.07 | L | Hermes integration | Evaluation requirement recorded; generic supported provider routes do not prove Hermes integration. | Identify/verify documented API, capabilities/authentication/privacy; implement a bounded adapter only after evaluation. |
| M09.08 | L | Harness integration | Exact product/interface still unidentified; deferred by requirement. | Resolve product/API before adapter design; do not invent integration. |
| M09.09 | U | Windows lifecycle | Open-with intake/association metadata, portable development package and install/uninstall scripts coded; old package built only. | Real install/upgrade/uninstall/Open With, signing/icon branding, current package, update/rollback and clean-machine acceptance. |
| M09.10 | U | Release readiness | Locked dependencies/notices, bounded source/build inventories and older safety tests exist. | Full security/license/SBOM/provenance, performance/large corpus/accessibility/clean-machine review and scope-specific beta acceptance. |

### Later scope and boundaries

| ID | Status | Feature | Implemented / available evidence | Still to do |
| --- | --- | --- | --- | --- |
| M10.01 | L | Later candidates | Practical profile-based preflight with source-bound page/font/image/color/transparency/output-intent evidence and report exports is integrated and compiled October 9; existing Bates groundwork is coded. Online services, standards validation/output and broad repair remain later adopted work. | Reviewed validators/services and explicit requirements before adding working claims. |
| M10.02 | X | Initial-release exclusions | Bulk signing/payments, portfolios/barcodes, print-shop color/trapping, geospatial/3D, multimedia, presentation generation and CAD editing excluded. Source-bound geospatial CRS/calibration inventory, supported coordinate/path queries and page/layer workspace are integrated and compiled October 9; accuracy remains unknown. | Do not count excluded items as missing beta features unless the user changes scope. |

### Bluebeam / Revu targets

| ID | Status | Feature | Implemented / available evidence | Still to do |
| --- | --- | --- | --- | --- |
| B01 | U | Revu markup artwork | Standard annotation artwork/metadata handling and unsupported cases coded. | Authorized Revu originals with rotated/cropped/large sheets, missing appearances, flattened marks and uncommon fonts. |
| B02 | U | Comments/Markups panel | Search/filter/sort/page/reply-state/metadata and row-to-location navigation coded. | Real Revu row identity/location/selection, panel resize/collapse, huge inventories and malformed data tests. |
| B03 | U | Replies, states and locks | Supported relationships/history/read-only flags and preserving additive reply/plain-comment editing coded. | Multi-level/missing-parent/duplicate/private-state/locked/provenance and Revu reopen tests. |
| B04 | U | Foreign markup preservation | Declared-object graph and retained-data validation code exists in supported copy writers; preserving reorder added. | Execute unknown/private/appearance/reply/identifier/layer retention tests in every writer and Revu. |
| B05 | U | Reports and exchange | TXT/CSV/JSON reports and 11-type standard XFDF export plus supported import coded. Supported native FDF comment import/export integrated and compiled October 9, with explicit mapping omissions and actual prepared PDF review. | Current XFDF/FDF/Revu round trips and omission/appearance/private-field acceptance; wider FDF, BAX and BTX/private adapters remain unfinished. |
| B06 | U | Clouds, arrows, callouts | New drawing tools with color/subjects/styles and reviewed copy paths coded. | Artwork/geometry/undo/crop/rotation/retention/print and Revu compatibility tests. |
| B07 | H+U | Revision review | Older comparison tested; new aligned/cyan-magenta/transparent overlays coded. | Shifted/scaled/rotated drawing alignment, zoom/pan/labels, large-sheet behavior and human interpretation. |
| B08 | U | Sheet sets and revisions | Ordered source-linked sets and explicit new revision reference review coded. | Real multi-file changes/relink/recovery/navigation tests; physical replacement and comment carry-forward. |
| B09 | H+U | Large-sheet layout/navigation | Older generic fullscreen/panes tested; comment jump/zoom/return/review-panel code newer. | R40 PDF-only fullscreen, large-sheet/high-DPI/view-state retention and collapsed review-panel tests. |
| B10 | U | Reusable review tools/stamps | Local style presets, decoration templates and portable review drafts coded. | Create/apply/export/import/delete/recovery/appearance tests; proprietary .btx/tool-set evaluation separate. |
| B11 | U | Custom data and quantities | PDFixData structured takeoff metadata/recovery/editing coded. | Bluebeam private/custom columns/quantity decoding/exchange not implemented; evaluate formats and real fixtures. |
| B12 | U | Persistent calibrated takeoffs | Distance/perimeter/area/count annotations, totals, recovery and supported update copies coded. | Known quantities, unit/scale/geometry/source proofs, appearance preservation/recovery/real Revu and printed output tests. |

## 8. Complete future feature list

**Plan decision, October 4:** the user has incorporated all F01–F42 into [the product plan](PRODUCT-PLAN.md). This establishes the future scope to complete, with implementation, debugging and acceptance taking priority over further speculative additions. Current/later staging and first-release exclusions remain as listed.

Also saved separately as [PDFIX-FUTURE-FEATURES.md](PDFIX-FUTURE-FEATURES.md). These 42 expansion/candidate/acceptance rows overlap existing requirements and are not 42 additional missing beta features.

## Next usability and feature expansions

| ID | Planned addition / expansion | Starting point and what remains |
| --- | --- | --- |
| F01 | PDF-only fullscreen | R40 artwork mode, auto-hiding exit, keyboard entry/navigation and previous-view restoration coded October 7; runtime/DPI/focus/transition acceptance pending. |
| F02 | Comfortable/compact reading appearance | Larger UI text/contrast controls are coded; density and consistent reader/dialog behavior need completion and acceptance. |
| F03 | Reliable selection on complex PDFs | Single-pointer rectangle selection with page/geometry cleanup and row/column/content-order copy previews is coded and compiled October 9. Complex layout, vertical/rotated writing and runtime acceptance remain. |
| F04 | More capable large-sheet navigation | Hand/pointer zoom plus zoom-to-region and session Previous/Next view history coded October 7. Synchronized navigation, DPI/monitor/very-large-drawing behavior and current acceptance remain. |
| F05 | More page selection/split recipes | Bookmark/range recipes and actual encoded file-size splitting integrated and compiled October 9. Size/work budgets and single-page refusals apply; current acceptance remains. |
| F06 | Broader page/object preservation | Current standard organizer and separate preserving reorder; preserve comments/forms/links/bookmarks/unknown data across more insert/delete/replace/combine operations. |
| F07 | Drag pages between PDFs | Chosen-source drag/copy, output reorder, reviewed insertion/source mapping, keyboard alternatives and undo/redo coded October 7. Broader object preservation and current acceptance remain. |
| F08 | Broader drawing comparison | Local text/dimension/artwork matching proposals, manual correction, reviewed counterpart mappings and unmatched-page handling coded October 7. High-resolution/sensitivity/alignment expansion and drawing-corpus acceptance remain. |
| F09 | Source/output comparison for more formats | Current PDF comparison; review actual document/office/image conversions and changed fonts/tables/page breaks against original content. |
| F10 | More complete document/PDF editing | New glyphs/fonts/shaping/reflow, wider original/nested PDF text/image cases, richer Word/slide layouts, rich/multi-section bands and source-preservation evidence. |
| F11 | Wider conversion and photo handling | Tested conversions with explicit preservation choices; original orientation, color profiles and metadata options, and clear lossy-output review. |
| F12 | Additional file decoders | HEIC/HEIF and multipage TIFF, then legacy DOC/XLS/PPT and Apple Pages/Numbers/Keynote after licensed-engine/corpus evaluation. |
| F13 | Live Photo components | Recognize separately supplied still/motion assets and explicit exports; no fabricated missing motion component. Depends on decoder/metadata work. |
| F14 | Direct scanner/document-camera capture | Actual Windows device integration, multi-page acquisition/preview/order/rotate/remove/cancel and bounded security handling. |
| F15 | More OCR languages and better quality | Bundled/installed language selection, wider output fonts and mixed-language/poor-scan/handwriting limitations. Printed English is the current tested subset. |
| F16 | Better scan cleanup and uncertainty review | Current deskew/tone/blank/confidence code needs accuracy tests; expand low-resolution/faint/skew/crop/rotated sources and recoverable corrections. |
| F17 | Stronger table extraction | Reviewed CSV, source-bound correction drafts and contained literal XLSX export with exact cell readback are coded. Merged/irregular/rotated tables, automatic reconstruction and runtime/Excel acceptance remain. |
| F18 | Broader forms and signing assistance | Reviewed supported-page custom tab order, numbered widgets, undo/recovery and native output verification are coded and compiled October 9. Wider appearance fonts, tagged/mixed navigation, declarative/source logic and current runtime acceptance remain. |
| F19 | Certificate signature validation | Reviewed integrity/identity/trust results and edit warnings; visual signing and signature-presence reporting remain separate. |
| F20 | Wider third-party markup preservation | Broader annotations, appearances, reply/status/lock/provenance/unknown-data retention and actual round trips, especially dad's Revu drawings. |
| F21 | Broader review exchange and reusable tools | Supported native FDF comment import/export is integrated and compiled October 9 alongside XFDF/JSON/stamp/style code. Broader FDF/form data/appearance, BAX/BTX/private adapters and actual Revu interchange remain. |
| F22 | Richer sheet revision handling | Physical page replacement with reviewed comment carry-forward, more reliable title/revision/sheet metadata and changed-source/relink handling. |
| F23 | Bluebeam custom data and takeoff interoperability | Decode understood PDF-embedded custom columns/quantities without fabricating profile-only values; extend current PDFix takeoff metadata and unit/scale workflows. |
| F24 | Broader compression | Wider real image/filter/color/form files and reviewed optimization choices; current code does not promise existing-JPEG recompression/downsampling. |
| F25 | Vector-preserving redaction | Remove selected source text/image/objects while retaining unmarked vector artwork, with forensic proofs and recovery; current secure mode rebuilds image-only pages. |
| F26 | More complete sanitation/security coverage | Contained DOCX/RTF, bookmarks, decorations/Bates, attachment inspection/decoding, source-bound web destinations, literal table XLSX and supported batch PDF text routes are coded. Other native families, Chromium image/OCR/PDF decode, hidden structures and effective OS security acceptance remain. |
| F27 | More batch actions | Compression plus reviewed source-sealed PDF copy/rename and narrowly supported literal TXT queues are coded, with chosen new folders, keep-both names, individual results and cancellation. Wider conversions/combine/workflow batches and current acceptance remain. |
| F28 | Editable multi-step workflows | Editable native reorder/Bates steps, receipt continuity and actual output review are integrated and compiled October 9. Trusted combine, OCR/print/other stages, durable workflow recovery/resume and runtime acceptance remain. |
| F29 | Complete health/accessibility inspection | Embedded/missing fonts, oversized images, broader print issues, actual tags/reading order/headings/link/form semantics and carefully scoped results. |
| F30 | Guided accessibility repair | Only reviewed repairs with validated semantics/results; tagging or OCR alone never establishes accessible output. |
| F31 | Windows local sharing | Share a newly exported local copy through Windows handoff, with a clear destination and no original mutation. |
| F32 | Finished Windows lifecycle | Branded/signed installer, clean-machine install/upgrade/uninstall, optional Open With/associations/default-reader flow, updates/rollback and user-data safety. |
| F33 | Final brand derivatives | Separate inspected executable/app icons, small/light/dark/monochrome variants, licensing/provenance; preserve the supplied master unchanged. |
| F34 | Broader selected-file AI | Real provider acceptance, image-capable context when consented, better citation/uncertainty handling and separately approved proposed edits; no automatic file tools. |
| F35 | Hermes / Harness / agent integrations | Hermes requires documented API/capability/authentication verification; Harness requires identifying the exact product. Generic provider code is not named integration proof. |

## Later candidates requiring service or standards evaluation

| ID | Candidate | Dependency / boundary |
| --- | --- | --- |
| F36 | Cloud/shared reviews and links | Identified service/account, authentication, selected destination/permissions, transfer consent/history and no implied public link. |
| F37 | Bluebeam Studio Sessions/Projects | Supported API/licensing/account/privacy evaluation; opening a local Revu PDF does not fetch session-only data or connect to Studio. |
| F38 | Online forms and response collection | Reviewed collection service, explicit submission destination, privacy/permission and response handling. Existing local form saving is separate. |
| F39 | External signature requests, tracking and templates | Evaluated service/authentication/consent and clear separation from visual signatures and certificate validation. |
| F40 | PDF/A, PDF/X and tagged-PDF validation/output | Reviewed standards engines/validators and actual corpus/compliance evidence; appearance/file extension is insufficient. |
| F41 | Bates numbering workflows | Bounded single-PDF Bates affixes/start/padding, selected-page sequences, native mappings and saved templates coded October 7. Multi-file continuity, existing-identifier detection/registries and runtime acceptance remain. |
| F42 | Wider release acceptance | Full real-world/adversarial corpus, performance, accessibility, physical printing, clean-machine packaging, licensing/SBOM/provenance and independent security review. This is acceptance work rather than a new app feature. |

## Explicit initial-release exclusions

These remain recorded for future product decisions. They are not commitments or missing beta requirements. A direction change is needed before implementation scope expands.

- Bulk signature/payment workflows.
- PDF portfolios and barcode fields.
- Advanced print-shop color management/trapping.
- Geospatial and 3D measurements.
- Embedded multimedia playback.
- Presentation/marketing generation; editing supported existing PPTX text is a different existing capability.
- CAD model editing and DWG-style formats; PDF drawing review remains in scope.

Source coverage: [roadmap](ROADMAP.md), [requirements](REQUIREMENTS.md), [master list](PDFix-Missing-Features-Master-List.md), [feature tracker](FEATURE-TRACKER.md) and [Bluebeam plan](BLUEBEAM-COMPATIBILITY-PLAN.md). Current implementation and evidence are in the complete status report, whose detailed rows take precedence over older roadmap statements that a now-coded feature is still entirely absent.

## 9. Evidence and build identity

- Historical execution evidence: [PHASE-LOG.md](PHASE-LOG.md), supported test sources/fixtures and saved internal artifacts. Full checked-corpus results above are dated historical records, not a new run.
- New coding evidence: [October 4 checkpoint](docs/CODING-CHECKPOINT-2026-10-04.md) and the per-feature documents linked above.
- Latest compiled launch build: 244 modules, renderer `index-CuvP69x0.js`, CSS `index-piqzjQiR.css`, source snapshot `4e7231d219bbed5b90b13a706c3977bfd60ff557f5d16ca27487bc624f44f6f9`. It includes the launch-to-Workspaces routing addition after the preceding coding checkpoint. The current native app was opened only on the user's request; no new feature/regression test suite was executed for this report.
- The local development package `releases/PDFix-0.1.0-20261004T094146195-8d92a0e5-win-x64` is older (240 modules). It predates table extraction, health and selection fixes and is not the current accepted release. Install/uninstall were not executed.
- Full machine-readable S00/M/B mapping: [inventory JSON](docs/PDFIX-STATUS-INVENTORY-2026-10-04.json).

This report supersedes earlier conversational percentages for acceptance decisions. The old approximately 65% coding estimate was engineering judgment, not a measured workload, test score or beta-readiness percentage. This audit does not turn it into a new percentage. Updating a status to Done requires current source/version, exact supported scope, executed evidence and any relevant remaining limitations.

Latest biggest-gap coding continuation: [docs/BIGGEST-GAPS-CODING-2026-10-07.md](docs/BIGGEST-GAPS-CODING-2026-10-07.md). Literal table XLSX, batch PDF copy/rename/supported TXT and four additional native PDF containment families are coded; runtime acceptance remains pending.

## October 7 editing fidelity and feature catalog

The complete adopted planned scope is saved in [PDFIX-ALL-PLANNED-FEATURES.md](PDFIX-ALL-PLANNED-FEATURES.md), including every original requirement, master/Bluebeam row and F01–F42 future item. It is a plan, not a completion claim.

The latest source changes and compilation evidence are recorded in [Editing fidelity coding checkpoint](docs/EDITING-FIDELITY-CODING-2026-10-07.md): supported formatted document bands and DOCX import, original mapped-glyph proofs, manual table merge/split correction, contained form creation and initial-inspection cancellation. [Document PDF output containment](docs/DOCUMENT-OUTPUT-CONTAINMENT-PROGRESS.md) records the new generated-output check route. Runtime, corpus, effective security and release acceptance remain deferred/open. No broad master row is newly marked fully accepted.

## October 7 large PDF reading

[Large PDF opening](docs/LARGE-PDF-OPENING-PROGRESS.md) records the newly coded file-backed range route, memory/disk admission, visible slow-file/progress notices, source/cleanup guards and separate reading/whole-file tool capabilities. It supersedes the blanket 100 MiB opening limit for eligible PDFs. The current viewer budget is 1 GiB and 500 pages; per-operation editing/export limits remain. No actual-file performance, runtime or security acceptance is claimed.


## October 8 integrated coding milestone

[Saved integration and compilation record](docs/INTEGRATED-FEATURES-CODING-2026-10-08.md) supersedes older entirely-unstarted descriptions for certificate integrity, direct scanner capture, additional OCR languages and guided existing tag-tree edits. It also records portfolios with embedded-PDF preview and large-PDF comment inventory. 276 modules compiled; no new runtime/device/document acceptance is claimed. Further size splitting, readable-text controls, initial tagging, geospatial support and offline certificate-chain trust source work is being recorded separately. The full adopted goal stays active.


## October 9 implementation update

[Saved integration and compilation record](docs/INTEGRATED-FEATURES-CODING-2026-10-09.md) records initial local certificate signing, offline base-chain inspection, initial tags/artifacts, geospatial coordinates/distances, measured size splitting and readable-text controls. 282 modules and native helpers compiled. Broad runtime/document/device/security acceptance remains pending; full adopted scope remains active. The running app was not restarted.


## October 9 preflight, audit and form calculation update

[Integrated coding and compilation record](docs/PREFLIGHT-FORMS-CODING-2026-10-09.md) adds practical print profiles, structural accessibility findings, source-bound JSON evidence exports and reviewed user-authored form calculations. 288 modules compiled. These are partial implementations toward A05/A12/A14 and overlapping F18/F29/F30/F40. Broader specialist engines, standards mappings, source-logic compatibility and runtime acceptance remain open. The full adopted scope is unchanged.


## October 9 repair, forms and selection coding update

[Integrated coding and compilation record](docs/REPAIR-FORMS-SELECTION-CODING-2026-10-09.md) adds contained existing form filling/visual placements with native sealed saving, bounded supported qpdf repair-to-copy and rectangle-selection pointer/page lifetime plus row/column preview controls. 292 modules compiled; current runtime acceptance remains pending. Repair requires a complete independently inspected baseline and preserves supported content; broader damaged-file recovery and complex selection layouts remain open. No broad feature is newly accepted, and the full adopted scope remains unchanged.


## October 9 form order, FDF and editable workflows

[Integrated coding and compilation record](docs/FORMS-FDF-WORKFLOWS-CODING-2026-10-09.md) adds reviewed supported-page form keyboard order, native FDF comment import/export, editable native page-reorder/Bates sequences and broker-envelope alignment with existing bounded source/request contracts. 301 modules compiled. Broader form/appearance/interchange coverage, combine/OCR/print workflow steps, durable recovery and current runtime/security/performance acceptance remain. No broad row is newly accepted; the full adopted scope is unchanged.


## October 9 native combination, TIFF and workflow library

[Integrated coding and compilation record](docs/COMBINE-TIFF-WORKFLOWS-CODING-2026-10-09.md) adds standalone native full-source PDF combination with supported comments/forms/bookmarks/destinations, supported classic multipage TIFF decoding and reviewed page import, and named reorder/Bates definitions with exact-source editable draft recovery. 306 modules compiled. Partial/duplicate PDF selection, wider graph and TIFF modes, combine/OCR/print runner stages, durable in-flight resume and runtime/security/fidelity acceptance remain open. Restoring settings never restores output approval. No broad row is newly accepted; the full adopted scope stays active.


## October 9 Bates, combined workflows, TIFF fax and tag semantics

[Integrated coding and compilation record](docs/BATES-COMBINE-TIFF-TAGS-CODING-2026-10-09.md) adds continuous multi-file Bates numbering with reviewed saves/identifier reports, native combine → editable reorder/Bates continuations, real CCITT fax TIFF decoding and reviewed existing table/list/printable-form tag semantics. 308 modules compiled. Persistent queues/global identifier registries, other workflow stages, broader PDF/TIFF/tree compatibility and runtime/security/fidelity/standards acceptance remain. No broad row is newly accepted; the full adopted scope stays active.


## October 9 user additions — free printing and reading/writing tools

Adopt F43–F46 / R42–R45: virtual PDF printer, local read aloud, expanded word count and spell-checking. R46 requires PDFix to stay free, with no required paid APIs/subscriptions, feature unlocks or purchase/upgrade links. These features use free local components; Whisper is not a speech-synthesis engine. The existing basic editor word counter is only a starting point. See [detailed scope and dependencies](READING-WRITING-PRINT-PLAN.md). No new code, tests, installs or paid integrations are claimed. Prior adopted scope remains, with provider/engine choices subject to the free-app requirement.


## October 9 local text/printing coding update

See [current compiled checkpoint](docs/LOCAL-TEXT-PRINT-CODING-2026-10-09.md) for F43–F46 / R42–R46: local read aloud, spelling, scoped statistics, optional Windows PDFix printer and local-only AI are integrated coded subsets. Compilation passed; runtime/output/performance/beta acceptance remains pending. Preserve all remaining full-scope work. The [three release priorities](docs/RELIABILITY-PERFORMANCE-USABILITY-GATES.md) govern integrity, large-file responsiveness and separate simple workspaces; none is certified passed.


## October 11 complete scope consolidation

[Final implementation plan](FINAL-IMPLEMENTATION-PLAN.md) sets the current order: Workspaces → PDF viewing → PDF editing → PDF creation/document toolbar → Bluebeam comments/review → remaining complete adopted scope → digital-pen drawing → full UI/function and release acceptance. The [complete remaining-work register](docs/FINAL-REMAINING-WORK-2026-10-11.md) and [source-preserving scope ledger](docs/FINAL-SCOPE-LEDGER-2026-10-11.json) retain R01–R50, S00, all 71 M rows, B01–B12, F01–F67, A01–A25 and G01–G16/D01–D22. Every earlier specification, dependency, preservation/security/free-app rule and applicable acceptance gate remains represented. Later adopted specialist targets supersede only their historical staging exclusions; unrelated excluded scope is retained as a boundary.

R49 records the familiar creation toolbar, comment viewing/adding/eligible editing and requested full UI/function pass. R50/F67 records digital-pen PDF handwriting and saved editable ink. Existing basic ink and newly coded toolbar/comment controls do not complete the broader targets. Current checks are scoped evidence; no blanket all-features/all-files or release-ready claim is made.

## October 11 final UI integration and complete plan

See [final integration checkpoint](docs/UI-INTEGRATION-AND-FINAL-SCOPE-2026-10-11.md) for the 332-module build, repaired contained startup/custom styles/PDF.js geometry/lifecycle, seven scoped functional passes and independently reopened comment outputs. Native fullscreen exposed the temporary UI test window, so its aggregate hidden-only result did not pass. Current actual SW3 scrolling passed hidden. The final plan/register preserve all earlier and future scope; no broad feature or release gate is newly certified 100% complete.

## October 11 forms, bookmarks and drawing revision coding batch

[Batch checkpoint](docs/FEATURE-BATCH-FORMS-REVISIONS-2026-10-11.md) records F47/F49 digital/scan proposal integration, F48 OS-protected local autofill with review/undo, F57 editable automatic bookmark proposals and F22/B08 actual preserving drawing revision/comment carry-forward. The 342-module build passed. One focused known-fixture writer/storage batch passed, including unchanged originals and independent output/private-data reopen; a real async-decryption result bug was fixed. Broader UI/device/corpus/Revu/transform and remaining full-scope work are still pending. No complete product or broad feature is certified 100%.
