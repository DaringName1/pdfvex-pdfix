# PDFix expanded requirements

**October 7 scope extension:** R41 adopts all ten categories of the supplied Acrobat comparison, with stable A01–A25 targets in [ACROBAT-COMPETITIVE-PLAN.md](ACROBAT-COMPETITIVE-PLAN.md). Existing requirements remain; overlapping counts are not independent features. Previously excluded specialist capabilities covered by that addition are later planned work, subject to the stated engine/service/security and acceptance gates. Adoption adds no implementation or verification claim.

Added 2026-09-30 from the user's supplied gap checklist. The checklist is product input, not evidence of missing or completed code. This document defines targets; `FORMAT-SUPPORT.md` and `PHASE-LOG.md` record verified behavior. The existing original-safety and local-processing rules apply throughout.

## Work protection and privacy

- **R01 Recovery and versions:** debounce autosave, preserve undo/redo during editing, recover after an interrupted process, and retain bounded local versions. Show timestamps and a preview before restoring. Restoring must checkpoint the current state first and must never rewrite the source file. Bind recovery to source fingerprints so externally changed files do not silently receive stale edits. Explain retention, size limits, unencrypted local content and how to clear it.
- **R02 Leaving unsaved work:** wait for pending recovery writes before closing or switching files. If recovery fails, keep the editor available with export/retry options; never silently discard unsaved edits. Offer a clear discard action only after a warning. Converted/edited outputs use a native location chooser and save as a new copy.
- **R03 Cleanup:** users can clear recent metadata, recovery/version content and temporary job files independently. Show what will be removed and what remains. Never delete original or exported documents. Diagnostic logs must exclude document text, passwords and secrets. Display online-transfer history when AI/cloud features exist.
- **R04 Recoverable operations:** retain recoverable inputs and staged outputs before risky changes. A failed or canceled conversion leaves the original intact, and users can review or discard its output. Clearly distinguish rotation of a view from rotation of saved pages.
- **R05 Output collisions:** explain duplicate output names and offer another name/folder or an explicit keep-both operation. Never overwrite an original or alias. Replacing an unrelated existing output, if later supported, requires a specific user choice and a recoverable backup; the current exclusive writer continues refusing replacements.

## Reading, selection, comparison and printing

- **R06 Navigation and views:** show document outline/bookmarks, page labels and internal links; support personal bookmarks, single page, continuous scroll, two-page spread, fit width/page and temporary view rotation. Lazy loading, bounded canvases, progress and cancellation remain mandatory for large files.
- **R07 Complex selection:** show readable text with page references, preserve sensible row/column order where verified, and offer a bounded local region when automatic selection fails. Columns, tables, footnotes, captions and rotated text require corpus tests; never promise perfect reading order from arbitrary PDF content streams.
- **R08 Safe links and attachments:** identify the destination of external links and ask before opening a website. Do not execute PDF scripts. List embedded files with type/size warnings and save only to a user-chosen location; never auto-open or auto-run extracted content. ZIP traversal, bombs, device names and symlinks require safe handling before any extraction feature ships.
- **R09 Compare:** open two user-selected PDFs side by side with independent and linked navigation. Compare page count/order, extracted text and page artwork; scanned pages require visual comparison. Explain alignment and OCR uncertainty, highlight additions/removals, and avoid equating an OCR-only difference with a proven source change. Source/output comparison is available before accepting a lossy conversion.
- **R10 Printing:** preview exactly the prepared output, select page ranges, paper size, orientation and fit/actual-size scaling, and disclose raster resolution or annotation flattening. Detect invalid ranges, clipped content and unsupported print settings. OS cancellation must clean up temporary pages. Physical printer review remains a release gate.

## Scans, forms, signatures and annotations

- **R11 OCR:** let users choose among actually bundled/installed languages, review and correct recognized text, locate uncertain words/lines on the scan, and see confidence as an engine estimate rather than accuracy. Warn about handwriting, poor scans and complex reading order. Only advertise tested languages. English recognition/review/searchable output is already scoped and verified; broad quality/language support is not.
- **R12 Scan cleanup:** offer viewable rotation, deskew, contrast cleanup and proposed blank-page removal before OCR. Preview every destructive change, allow undo, distinguish blank from faint content, and verify searchable output against reviewed text. Preserve the original.
- **R13 Forms:** support a verified subset of AcroForms with values, required-field guidance, usable tab order and supported calculations. Never execute arbitrary form JavaScript. Identify unsupported calculations/XFA clearly; preserve values and appearances when exporting. Scanned forms use user-positioned text/checkmarks first; automatic field detection remains an experimental proposal until tested.
- **R14 Signatures:** distinguish typed/drawn/stored visual signatures from cryptographic signatures. A pasted signature image is not certificate validation. Detect existing signature fields, show validity as unknown unless a reviewed validator actually checks it, and warn/refuse changes that may invalidate a signature. Certified signing is not a first-release promise.
- **R15 Annotations:** highlight, underline, drawing, text, notes/comments; preserve supported existing annotations when saving. Users can show/hide, include/exclude in print, flatten or export a separate annotation copy when those options are verified. Keep original artwork, annotation state and temporary reading marks distinct. Operations that cannot preserve structure must warn before conversion rather than silently drop it.

## Editing, formats, fidelity and standards

- **R16 Explicit capabilities:** separately show Open, Preview, Edit and Convert per format and per operation. Explain imported text copies, unsupported features, size limits and lossy changes before processing. Permission to edit does not make a format supported or a conversion faithful.
- **R17 Format coverage:** evaluate PDF, DOCX/RTF/TXT/Markdown, JSON/XML/YAML/CSV, XLSX/PPTX, PNG/JPEG/WebP/BMP, multipage TIFF and HEIC/HEIF. Stage DOC/XLS/PPT and Apple Pages/Numbers/Keynote behind decoder/license/corpus gates. Unsupported types get realistic alternatives, never success-shaped placeholders.
- **R18 Conversion options:** expose only tested preservation choices for links, images, page size, outline/bookmarks, annotations and form fields. Show what survives, what is dropped, and preview page breaks/fonts/tables against the source. Do not label a byte-for-byte copy a conversion.
- **R19 Apple photos:** honor HEIC/HEIF orientation, color and metadata choices. Recognize whether a Live Photo's still and motion components were actually supplied; do not invent a missing motion file. Separate exports are explicit user actions with codec/distribution review.
- **R20 Archival/accessibility output:** evaluate PDF/A and tagged-PDF checks using reviewed engines and validators. A visually correct PDF or OCR layer is not a tagged accessible PDF. Report compliance as unknown until validated; no standards claim based only on file extension or appearance.

## Jobs, sharing and accessibility

- **R21 Batch jobs:** selected-file convert/compress/rename/combine queues have per-file progress/results, cancellation, output locations, collision rules and bounded concurrency/resources. Failures do not silently skip files or report the whole batch successful. Distinguish completed outputs from canceled/unstarted work. Batch rename defaults to new-copy names rather than renaming originals.
- **R22 Sharing:** export a new copy and provide a reviewed Windows share handoff. Cloud links require a specifically chosen cloud account/service and explicit upload/share consent; local-only mode never fabricates a public link. Display the destination and resulting permissions.
- **R23 Accessibility:** complete keyboard workflows, shortcut help, meaningful screen-reader names/roles, visible focus, scalable UI text, readable contrast, reduced motion and announced job/error status. Verify editing, dialogs, comparison, selection, printing and cancellation at larger text scales and with assistive technology. Searchable/copyable text and tagged document structure are separate capabilities.

## AI and agents

- **R24 Request scope and consent:** choose provider/model or agent plus exact files for every request. Show local/online data destination and obtain consent bound to endpoint, file fingerprints and the specific request. Local gateway addresses do not prove local processing. No unselected context or broad file access.
- **R25 Read-only AI:** document instructions are untrusted source content. Answers cite source pages/lines. AI cannot edit, export, overwrite or invoke file tools automatically; proposed changes require specific user approval and a reviewable diff/output. Connection accounts/API charges are separate from PDFix and must be disclosed during setup.
- **R26 Connection controls:** test, discover/select models, show endpoint and capabilities, remove connections and securely delete stored secrets. Windows-backed secure storage must fail closed if unavailable. Distinguish model providers from agent runtimes and disclose upstream/tool access.
- **R27 Layout context and uncertainty:** show whether the chosen model accepts images; let users deliberately include page images/charts only when supported and consented. Label OCR-derived context and weak recognition; citations identify exact pages or source lines and do not imply the model inspected the whole document.

## Windows and release quality

- **R28 Windows integration:** reviewed installer/uninstaller, portable workflow, Open With, optional file associations/Explorer actions and a user-initiated default-reader path through Windows settings. No silent default changes, registry takeover or forced association. Test upgrade/uninstall without deleting documents or unintended user settings.
- **R29 Corpus and adversarial files:** actual varied files verify opening/saving, conversion, OCR, compression, annotations, forms, signatures, print preparation and output structure. Include damaged/encrypted/restricted/oversized files, large page counts, awkward reading order, ZIP bombs, Unicode filenames and stale sources. Redaction must remove original text/images/streams and survive search/copy/object inspection; a black overlay is insufficient.
- **R30 Brand assets:** preserve the supplied PDFix logo unchanged as the master. Prepare separate app-icon, light/dark-background and monochrome variants for packaging, inspect at small sizes, and retain transparent asset licensing/provenance. Do not replace the master with a generated derivative.

## Everyday workspace controls

- **R31 Window and layout controls (user addition):** visible native fullscreen control plus F11/Escape; collapsible named sidebar navigation; focus mode with an easy way back; independently collapsible PDF thumbnails/search panels. Remember non-sensitive layout choices, make hidden search available with Ctrl F, and retain document content, recovery and selection behavior when resizing. Verify the minimum window size and keyboard access.

## Later core inventory and visual audit

- **R32 Visual polish:** remove redundant header rows and artificial UI measurement graphics, tighten unnecessary container padding, keep document artwork/page margins intact, and make controls align and fit the window. Audit Home, Files, Workspaces, reading, editing, settings and workflow dialogs at normal/minimum sizes. No unintended body scroll, clipped bottom controls or overlapping interactive controls. Preserve keyboard names, usable focus and content/recovery while changing layouts.
- **R33 Complete everyday page tools:** add crop/resize and automatic split rules to the verified arrange/rotate/remove/extract/combine/insert-by-reorder workflow. Show the affected boundary/pages before output. Cropping hides artwork outside a page box; it must never be described as secure redaction.
- **R34 Useful PDF editing:** user-positioned text/image overlays and a verified subset of existing text/image object edits. Explain font, spacing and layout restrictions before accepting an edit. Do not equate an extracted text document with editing the original PDF objects. Source/output review and original preservation are required.
- **R35 PDF creation:** actual local PDF output from supported text/documents/images, with preview and tested page size/orientation/font/image behavior. Office layout conversions remain engine/corpus dependent.
- **R36 Guided form/signature assistance:** identify supported blank/required fields and offer likely signature/date/initial locations as proposals with uncertainty. Users confirm placement and values before writing. Scanned forms use explicit positioned overlays; no fabricated field certainty or automatic signing. Saved visual signatures are distinct from certificate validity and external signature-request workflows.

The later supplied inventory is planning input, not an independently verified report of another product. FEATURE-TRACKER.md maps its core targets, useful small/large additions, later candidates and first-release exclusions. Existing R13–R15, R18, R20 and R24–R29 cover the overlapping form/signature/annotation/conversion/standards/AI/release items.

## Traceability to the supplied checklist

The first list is G01–G16; the deeper list is D01–D22. Every entry is covered below. Repeated ideas intentionally share requirements.

| Source entry | Requirements | Stage |
| --- | --- | --- |
| G01 Protect work | R01 | Existing editor slice/reliability |
| G02 Prevent loss | R02, R04, R05 | All writers/editors |
| G03 Compare PDFs | R09 | PDF fixes/fidelity |
| G04 Batch handling | R21 | PDF fixes, then format adapters |
| G05 Dependable printing | R10 | Reading/print polish |
| G06 Sharing | R22 | Windows polish; cloud only with consent |
| G07 Accessibility | R23 | Every workflow; release review |
| G08 Format clarity | R16, R18 | Existing matrix; every adapter |
| G09 Useful file types | R17, R19 | Documents/images/compatibility |
| G10 Trustworthy OCR | R11, R12 | PDF fixes |
| G11 Bad files | R29 | Every parser/writer |
| G12 Safe AI | R24, R25, R27 | AI phase |
| G13 Connection details | R26 | AI phase |
| G14 Windows fit | R28 | Packaging/polish |
| G15 Real-document testing | R29 | Every gate |
| G16 Logo preparation | R30 | Packaging/polish |
| D01 Outline/bookmarks | R06 | Reading improvements |
| D02 Page views/view rotation | R06, R04 | Reading improvements |
| D03 Links/attachments | R08 | Reading/security |
| D04 Complicated copying | R07 | Existing selection plus corpus |
| D05 Huge documents | R06, R21, R29 | Every job |
| D06 Scan cleanup | R12 | PDF fixes |
| D07 Uncertain OCR | R11 | PDF fixes |
| D08 Scanned forms | R13 | PDF fixes |
| D09 Form behavior | R13 | PDF fixes |
| D10 Signature kinds | R14 | PDF fixes/release scope |
| D11 Annotation preservation | R15, R18 | PDF fixes/fidelity |
| D12 Text/image/page comparison | R09 | PDF fixes/fidelity |
| D13 Preservation choices | R18 | Every conversion |
| D14 Apple photos/Live Photos | R19 | Decoder/compatibility gates |
| D15 PDF/A/tagging | R20, R23 | Compatibility/standards evaluation |
| D16 Safe extraction | R08, R29 | Parser/security gates |
| D17 Visual AI context | R27 | AI phase |
| D18 Document injection/read-only AI | R25 | AI phase |
| D19 Privacy cleanup/logs | R03, R24 | Existing local data; AI audit later |
| D20 Recoverable operations | R01, R04 | All editors/fixes |
| D21 Conversion recovery | R04, R09 | Every conversion |
| D22 Duplicate outputs | R05 | Safe-copy workflow |

Priority implementation: strengthen existing recovery with versions and cleanup; then PDF comparison and guided PDF fixes, with accessible/cancellable jobs. Batch behavior grows only as its underlying operations pass their gates. Windows integration, cloud/AI and additional formats retain their ordered dependencies. Planning these additions does not mark them implemented.

Current R29 redaction evidence: the clean-image mode replaces selected pixels before building a fresh image-only document, removes original text and hidden structures, rejects extra/trailing serialized payloads, checks every page independently and verifies saved disk bytes. Source-bound recovery retains only positions/settings; failed recovery blocks departure while allowing verified rescue export. This satisfies the scoped flattened-copy behavior, not the full vector-preserving/large-real-file/forensic corpus gate. Visible unmarked private artwork still requires user review.

Current password-copy evidence: AES-256 revision-6 output is verified against distinct user/owner roles and chosen permissions; existing encryption requires the supplied owner password before modification/removal. Native structure/stream checks and independent original/output text/geometry/pixel checks precede reviewed disk-verified copy saving. Passwords are not recovered or placed in process command lines; temporary unprotected-content files have bounded known-job cleanup. Broad legacy/public-key/normalization/real-file/resource/release review remains unfinished. Permission flags rely on receiving viewers; an opening password alone does not authorize removing owner restrictions.

## Saved October master list and Security Sandbox

- **R37 Security Sandbox:** contain native PDF engines with Windows AppContainer and a bounded Job Object, grant only app-owned job inputs/output and pinned runtime binaries, omit network capabilities, scrub inherited environment, limit subprocesses/memory/time and fail closed if containment cannot start. Keep global Electron sandbox, renderer network/download/permission restrictions, active-content refusal and source-bound IPC. Worker threads provide resource limits only. Require a hidden Windows containment/security review before release claims.
- **R38 Complete saved master-list coverage:** all ten sections of PDFix-Missing-Features-Master-List.md are accepted planning requirements; MASTER-GAP-TRACKER.md preserves every item with stable IDs. These expand R06–R29 and R33–R36, including drawing/measurement/layers/print, sanitation, forms, OCR, format fidelity, batches, accessibility, Windows and AI. Later candidates retain their reviewed-engine/service gates and explicit initial-release boundaries. No item is complete merely because it is saved here.


## Bluebeam drawing-review addition — 2026-10-03

- **R39 Bluebeam/Revu compatibility:** prioritize seeing existing comments/markups in Revu-produced PDFs, a searchable drawing-wide markup panel, sheet-location navigation, supported replies/states/locks and preservation when saving copies. The user confirmed drawing/comment review is their dad's main workflow. Add clouds/callouts, aligned revision review, sheet sets, reusable review tools, custom data and calibrated takeoffs in that order. Detailed open targets B01–B12, flattened-data limits, proprietary-format gates and separate Studio integration boundaries are saved in [BLUEBEAM-COMPATIBILITY-PLAN.md](BLUEBEAM-COMPATIBILITY-PLAN.md). Existing annotation rendering/summaries do not prove Bluebeam compatibility.

## PDF-only fullscreen and debugging inventory — user addition, 2026-10-04

- **R40 PDF-only fullscreen:** provide an explicit reader control that fills the screen with PDF artwork and hides the Windows frame, application sidebar/top bar/status bar, workspace tabs, reader toolbar, thumbnails, inspector, comments/review panels and other surrounding controls. Preserve the physical page, zoom, reading mode, scroll position and unsaved work. Provide an obvious temporary exit control and Escape; temporary controls disappear when not needed. Retain accessible keyboard page/zoom navigation, restore the previous layout on exit, respect open dialogs and leave this mode safely before switching files or leaving the reader. Test standard/rotated/cropped/non-unit PDFs, all supported reading views, minimum/large screens and multi-monitor/DPI changes. Existing F11 and focus mode do not satisfy this complete requirement.

The user reports that the preview looks good but needs substantial debugging. [PDFIX-COMPLETE-STATUS-2026-10-04.md](PDFIX-COMPLETE-STATUS-2026-10-04.md) separates historical runtime evidence, untested source implementation and remaining work across R01–R40, M01–M10, S00 and B01–B12. Individual unspecified problems require concrete reproduction before being called confirmed defects. Preparing this inventory does not run or authorize a new test campaign.

The user subsequently incorporated the complete [F01–F42 future list](PDFIX-FUTURE-FEATURES.md) into the product plan. Those expansions map to the existing requirements and retain their staged evaluation/exclusion boundaries. This establishes the saved scope to finish; additional speculative product features are not the current priority.


### October 7 coding update

R40 artwork fullscreen, hand/pointer navigation (part of F04), and Compact/Comfortable spacing (part of F02) are implemented and compiled. Current runtime/visual/focus/DPI acceptance remains pending. [Exact scope and bounds](docs/PDF-READER-USABILITY-2026-10-07.md).


### October 7 major-gap coding checkpoint

Seven feature families are now implemented and compiled: zoom-region/view history, portable table corrections, bookmark splitting, contained rich-document processing, reviewed drawing-page matching, cross-source page drag staging and single-PDF Bates numbering. [Exact scope and remaining acceptance](docs/MAJOR-GAP-CODING-2026-10-07.md). Current runtime/corpus/Windows acceptance and broader scope remain open; original acceptance checkboxes are unchanged.

### October 7 biggest-gap continuation

[docs/BIGGEST-GAPS-CODING-2026-10-07.md](docs/BIGGEST-GAPS-CODING-2026-10-07.md) records literal XLSX table export, reviewed PDF copy/rename/supported TXT queues, and contained bookmark, decoration/Bates, attachment and URI inspection routes. Source/compilation evidence only; current runtime acceptance and remaining full-plan work are not marked complete.

## R41 — Acrobat replacement expansion (October 7 user request)

Adopt every category from the supplied Acrobat gap comparison into the full PDFix plan. A01–A25 in [ACROBAT-COMPETITIVE-PLAN.md](ACROBAT-COMPETITIVE-PLAN.md) define certificate trust/signing/routing, prepress/color/standards, full accessibility remediation, XFA/contained form logic/barcodes/submissions, portfolios, 3D/GIS/media, managed enterprise policies, browser/mobile/platform clients and difficult-file reliability. Preserve the source, retain prior IDs and avoid double-counting overlaps. Expand historical specialist exclusions into explicitly staged later targets with engine, licensing, service, security and independent output/standards acceptance where applicable. Core reading/editing/comment reliability and S00 retain priority. This is adopted planned scope, not implemented feature parity or a blanket legal/compliance promise; current script and consent restrictions remain until a separately reviewed compatible design is accepted.


## Reading, writing, virtual printing and free-app additions — 2026-10-09

- **R42 Virtual PDF printer (F43):** optional Windows PDFix print destination, bounded local print-job capture, review/import/exclusive copy save, cancellation/recovery and free signed installation/uninstallation. Existing PDF export/physical printing is separate.
- **R43 Read aloud (F44):** free local text-to-speech with play/pause/resume/stop, voice/language/speed, text/page/document scope and source highlighting; preserve permissions, disclose OCR/order uncertainty and process incrementally. Whisper recognizes speech rather than generating it.
- **R44 Word count (F45):** expand the basic editor counter to explicit selection/page/document word/character/paragraph/page statistics for supported editable and extracted PDF text, with language/scope/omission disclosures.
- **R45 Spell-checking (F46):** free local dictionaries, language choice, suggestions/replace/ignore/personal dictionary and Undo/recovery in supported editable text; read-only PDF findings cannot bypass edit/font permissions.
- **R46 Free app:** no required paid API/subscription, paid feature unlock or purchase/upgrade links. These additions work locally without uploading document data. Evaluate other adopted integrations under this rule and record incompatibilities honestly.

Detailed scope and current starting points: [reading/writing/print plan](READING-WRITING-PRINT-PLAN.md). These are planned additions; no new implementation or testing is claimed.


## October 9 local text/printing coding update

See [current compiled checkpoint](docs/LOCAL-TEXT-PRINT-CODING-2026-10-09.md) for F43–F46 / R42–R46: local read aloud, spelling, scoped statistics, optional Windows PDFix printer and local-only AI are integrated coded subsets. Compilation passed; runtime/output/performance/beta acceptance remains pending. Preserve all remaining full-scope work. The [three release priorities](docs/RELIABILITY-PERFORMANCE-USABILITY-GATES.md) govern integrity, large-file responsiveness and separate simple workspaces; none is certified passed.

## October 11 user additions — free Acrobat tools and core workspaces

- **R47 Free Acrobat additions:** adopt all 20 priorities as F47–F66 in [FREE-ACROBAT-ADDITIONS-PLAN.md](FREE-ACROBAT-ADDITIONS-PLAN.md): field detection, local autofill, labeling/tab suggestions, Windows context tools, Office shortcuts, Edge handoff, synchronized folders, EML conversion, clipboard PDF, local translation, bookmark suggestions, selected-folder PDF search, filename suggestions, approved watched folders, CSV form merge, signature handoff preparation, SHA-256 verification, production marks, five-box editing and thin-line inspection/repair. Preserve R46's free-app rule and all earlier scope. Existing overlapping subsets are not completion of these full additions.
- **R48 Explicit selected-folder grants:** expand individually selected-file search only after the user selects a folder and its purpose, recursive scope and persistence. Keep access within the granted tree, handle placeholders/links/changed files, provide revocation and index cleanup. Folder search permission does not authorize writing, watching or running jobs; watched recipes need their own approved operations and output destination. No unrestricted system/drive scans.
- **Current priority:** Workspaces, PDF viewing and PDF editing first, including clean room navigation, PDF-only fullscreen, collapsed panels, bounded large-file tools, usable selection and broader permitted original-content editing. The 20 additions are saved planned targets; no new code or runtime result is claimed.

## October 11 final consolidation, drawing comments and digital pen

- **R49 Unified creation/editor/review UI:** after Workspaces/viewing/editing, finish a familiar Word/Google Docs/DocHub-inspired document/PDF creation toolbar, then Bluebeam comment viewing, adding and permitted editing with preservation and visible restrictions. Use clean grouped controls and actual integrated functionality. Perform the user's requested full UI/function debugging pass with documented coverage; no blanket working claim from compilation.
- **R50 Digital-pen PDF drawing (F67):** handwriting/ink directly on PDF pages using a digital pen, saved editable ink/appearance copies and recoverable drafts; pen/highlighter/color/width/opacity, pressure where supported, palm rejection, touch/navigation modes, stroke selection/erasing, Undo/Redo and coordinate-accurate zoom/rotation/page handling. Existing basic Ink is partial groundwork. The user clarified the Store-app reference by function; exact brand is not a dependency.

[FINAL-IMPLEMENTATION-PLAN.md](FINAL-IMPLEMENTATION-PLAN.md) consolidates the complete earlier scope without removing a requirement. The ordered workstreams and full scope ledger preserve original/master/future/Bluebeam/Acrobat/free-tool targets, including prior exclusions that remain exclusions and later specialist targets that were adopted. Every incomplete item stays open. The newly requested UI/function checks supersede earlier blanket testing deferral for this pass, while hidden-window and original-preservation preferences remain.

