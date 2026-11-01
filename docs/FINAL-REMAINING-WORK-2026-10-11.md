# PDFix complete scope and remaining-work register — October 11, 2026

This register retains 264 overlapping requirement/checklist IDs across R50, S1, M71, B12, F67, A25, G16 and D22. These are traceability IDs, not 264 separate features or a percentage. Every canonical definition is present. The [source ledger](FINAL-SCOPE-LEDGER-2026-10-11.json) saves complete text and hashes of all 160 local planning/status/architecture/intake sources, including details that have no stable ID. Earlier sources remain saved and linked; their original wording is not replaced by these summaries.

Current order: Workspaces → viewing → editing → creation/editor → Bluebeam review → remaining adopted scope → digital pen → UI/function/debugging and release gates. [Work order](../FINAL-IMPLEMENTATION-PLAN.md). All features remain free. No broad acceptance target is currently certified 100% complete. Historical tests and compiled subsets retain their narrower evidence.

**Deferred by the user (October 15, 2026):** Bluebeam review and its dedicated drawing workspace wait until the rest of the main app works; the 30 requested add-ons wait for the first update and are tracked in [the add-ons backlog](ADD-ONS-FIRST-UPDATE-BACKLOG-2026-10-15.md), not counted in this register. Main-app functionality, supported file formats and fixes from human testing come first.

The user requested a complete UI/function pass. Current checks do not cover every tool, supported file, hardware or service. The inventory/checkpoints below retain all pending implementation and acceptance. Digital pen is not finished from basic Ink. A real Revu round trip is not proved by a synthetic PDF comment fixture.

## Original and expanded product requirements

### R01

- **R01 Recovery and versions:** debounce autosave, preserve undo/redo during editing, recover after an interrupted process, and retain bounded local versions. Show timestamps and a preview before restoring. Restoring must checkpoint the current state first and must never rewrite the source file. Bind recovery to source fingerprints so externally changed files do not silently receive stale edits. Explain retention, size limits, unencrypted local content and how to clear it.

Source: [REQUIREMENTS.md:9](../REQUIREMENTS.md#L9).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R02

- **R02 Leaving unsaved work:** wait for pending recovery writes before closing or switching files. If recovery fails, keep the editor available with export/retry options; never silently discard unsaved edits. Offer a clear discard action only after a warning. Converted/edited outputs use a native location chooser and save as a new copy.

Source: [REQUIREMENTS.md:10](../REQUIREMENTS.md#L10).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R03

- **R03 Cleanup:** users can clear recent metadata, recovery/version content and temporary job files independently. Show what will be removed and what remains. Never delete original or exported documents. Diagnostic logs must exclude document text, passwords and secrets. Display online-transfer history when AI/cloud features exist.

Source: [REQUIREMENTS.md:11](../REQUIREMENTS.md#L11).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R04

- **R04 Recoverable operations:** retain recoverable inputs and staged outputs before risky changes. A failed or canceled conversion leaves the original intact, and users can review or discard its output. Clearly distinguish rotation of a view from rotation of saved pages.

Source: [REQUIREMENTS.md:12](../REQUIREMENTS.md#L12).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R05

- **R05 Output collisions:** explain duplicate output names and offer another name/folder or an explicit keep-both operation. Never overwrite an original or alias. Replacing an unrelated existing output, if later supported, requires a specific user choice and a recoverable backup; the current exclusive writer continues refusing replacements.

Source: [REQUIREMENTS.md:13](../REQUIREMENTS.md#L13).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R06

- **R06 Navigation and views:** show document outline/bookmarks, page labels and internal links; support personal bookmarks, single page, continuous scroll, two-page spread, fit width/page and temporary view rotation. Lazy loading, bounded canvases, progress and cancellation remain mandatory for large files.

Source: [REQUIREMENTS.md:17](../REQUIREMENTS.md#L17).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R07

- **R07 Complex selection:** show readable text with page references, preserve sensible row/column order where verified, and offer a bounded local region when automatic selection fails. Columns, tables, footnotes, captions and rotated text require corpus tests; never promise perfect reading order from arbitrary PDF content streams.

Source: [REQUIREMENTS.md:18](../REQUIREMENTS.md#L18).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R08

- **R08 Safe links and attachments:** identify the destination of external links and ask before opening a website. Do not execute PDF scripts. List embedded files with type/size warnings and save only to a user-chosen location; never auto-open or auto-run extracted content. ZIP traversal, bombs, device names and symlinks require safe handling before any extraction feature ships.

Source: [REQUIREMENTS.md:19](../REQUIREMENTS.md#L19).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R09

- **R09 Compare:** open two user-selected PDFs side by side with independent and linked navigation. Compare page count/order, extracted text and page artwork; scanned pages require visual comparison. Explain alignment and OCR uncertainty, highlight additions/removals, and avoid equating an OCR-only difference with a proven source change. Source/output comparison is available before accepting a lossy conversion.

Source: [REQUIREMENTS.md:20](../REQUIREMENTS.md#L20).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R10

- **R10 Printing:** preview exactly the prepared output, select page ranges, paper size, orientation and fit/actual-size scaling, and disclose raster resolution or annotation flattening. Detect invalid ranges, clipped content and unsupported print settings. OS cancellation must clean up temporary pages. Physical printer review remains a release gate.

Source: [REQUIREMENTS.md:21](../REQUIREMENTS.md#L21).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R11

- **R11 OCR:** let users choose among actually bundled/installed languages, review and correct recognized text, locate uncertain words/lines on the scan, and see confidence as an engine estimate rather than accuracy. Warn about handwriting, poor scans and complex reading order. Only advertise tested languages. English recognition/review/searchable output is already scoped and verified; broad quality/language support is not.

Source: [REQUIREMENTS.md:25](../REQUIREMENTS.md#L25).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R12

- **R12 Scan cleanup:** offer viewable rotation, deskew, contrast cleanup and proposed blank-page removal before OCR. Preview every destructive change, allow undo, distinguish blank from faint content, and verify searchable output against reviewed text. Preserve the original.

Source: [REQUIREMENTS.md:26](../REQUIREMENTS.md#L26).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R13

- **R13 Forms:** support a verified subset of AcroForms with values, required-field guidance, usable tab order and supported calculations. Never execute arbitrary form JavaScript. Identify unsupported calculations/XFA clearly; preserve values and appearances when exporting. Scanned forms use user-positioned text/checkmarks first; automatic field detection remains an experimental proposal until tested.

Source: [REQUIREMENTS.md:27](../REQUIREMENTS.md#L27).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R14

- **R14 Signatures:** distinguish typed/drawn/stored visual signatures from cryptographic signatures. A pasted signature image is not certificate validation. Detect existing signature fields, show validity as unknown unless a reviewed validator actually checks it, and warn/refuse changes that may invalidate a signature. Certified signing is not a first-release promise.

Source: [REQUIREMENTS.md:28](../REQUIREMENTS.md#L28).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R15

- **R15 Annotations:** highlight, underline, drawing, text, notes/comments; preserve supported existing annotations when saving. Users can show/hide, include/exclude in print, flatten or export a separate annotation copy when those options are verified. Keep original artwork, annotation state and temporary reading marks distinct. Operations that cannot preserve structure must warn before conversion rather than silently drop it.

Source: [REQUIREMENTS.md:29](../REQUIREMENTS.md#L29).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R16

- **R16 Explicit capabilities:** separately show Open, Preview, Edit and Convert per format and per operation. Explain imported text copies, unsupported features, size limits and lossy changes before processing. Permission to edit does not make a format supported or a conversion faithful.

Source: [REQUIREMENTS.md:33](../REQUIREMENTS.md#L33).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R17

- **R17 Format coverage:** evaluate PDF, DOCX/RTF/TXT/Markdown, JSON/XML/YAML/CSV, XLSX/PPTX, PNG/JPEG/WebP/BMP, multipage TIFF and HEIC/HEIF. Stage DOC/XLS/PPT and Apple Pages/Numbers/Keynote behind decoder/license/corpus gates. Unsupported types get realistic alternatives, never success-shaped placeholders.

Source: [REQUIREMENTS.md:34](../REQUIREMENTS.md#L34).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R18

- **R18 Conversion options:** expose only tested preservation choices for links, images, page size, outline/bookmarks, annotations and form fields. Show what survives, what is dropped, and preview page breaks/fonts/tables against the source. Do not label a byte-for-byte copy a conversion.

Source: [REQUIREMENTS.md:35](../REQUIREMENTS.md#L35).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R19

- **R19 Apple photos:** honor HEIC/HEIF orientation, color and metadata choices. Recognize whether a Live Photo's still and motion components were actually supplied; do not invent a missing motion file. Separate exports are explicit user actions with codec/distribution review.

Source: [REQUIREMENTS.md:36](../REQUIREMENTS.md#L36).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R20

- **R20 Archival/accessibility output:** evaluate PDF/A and tagged-PDF checks using reviewed engines and validators. A visually correct PDF or OCR layer is not a tagged accessible PDF. Report compliance as unknown until validated; no standards claim based only on file extension or appearance.

Source: [REQUIREMENTS.md:37](../REQUIREMENTS.md#L37).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R21

- **R21 Batch jobs:** selected-file convert/compress/rename/combine queues have per-file progress/results, cancellation, output locations, collision rules and bounded concurrency/resources. Failures do not silently skip files or report the whole batch successful. Distinguish completed outputs from canceled/unstarted work. Batch rename defaults to new-copy names rather than renaming originals.

Source: [REQUIREMENTS.md:41](../REQUIREMENTS.md#L41).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R22

- **R22 Sharing:** export a new copy and provide a reviewed Windows share handoff. Cloud links require a specifically chosen cloud account/service and explicit upload/share consent; local-only mode never fabricates a public link. Display the destination and resulting permissions.

Source: [REQUIREMENTS.md:42](../REQUIREMENTS.md#L42).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R23

- **R23 Accessibility:** complete keyboard workflows, shortcut help, meaningful screen-reader names/roles, visible focus, scalable UI text, readable contrast, reduced motion and announced job/error status. Verify editing, dialogs, comparison, selection, printing and cancellation at larger text scales and with assistive technology. Searchable/copyable text and tagged document structure are separate capabilities.

Source: [REQUIREMENTS.md:43](../REQUIREMENTS.md#L43).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R24

- **R24 Request scope and consent:** choose provider/model or agent plus exact files for every request. Show local/online data destination and obtain consent bound to endpoint, file fingerprints and the specific request. Local gateway addresses do not prove local processing. No unselected context or broad file access.

Source: [REQUIREMENTS.md:47](../REQUIREMENTS.md#L47).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R25

- **R25 Read-only AI:** document instructions are untrusted source content. Answers cite source pages/lines. AI cannot edit, export, overwrite or invoke file tools automatically; proposed changes require specific user approval and a reviewable diff/output. Connection accounts/API charges are separate from PDFix and must be disclosed during setup.

Source: [REQUIREMENTS.md:48](../REQUIREMENTS.md#L48).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R26

- **R26 Connection controls:** test, discover/select models, show endpoint and capabilities, remove connections and securely delete stored secrets. Windows-backed secure storage must fail closed if unavailable. Distinguish model providers from agent runtimes and disclose upstream/tool access.

Source: [REQUIREMENTS.md:49](../REQUIREMENTS.md#L49).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R27

- **R27 Layout context and uncertainty:** show whether the chosen model accepts images; let users deliberately include page images/charts only when supported and consented. Label OCR-derived context and weak recognition; citations identify exact pages or source lines and do not imply the model inspected the whole document.

Source: [REQUIREMENTS.md:50](../REQUIREMENTS.md#L50).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R28

- **R28 Windows integration:** reviewed installer/uninstaller, portable workflow, Open With, optional file associations/Explorer actions and a user-initiated default-reader path through Windows settings. No silent default changes, registry takeover or forced association. Test upgrade/uninstall without deleting documents or unintended user settings.

Source: [REQUIREMENTS.md:54](../REQUIREMENTS.md#L54).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R29

- **R29 Corpus and adversarial files:** actual varied files verify opening/saving, conversion, OCR, compression, annotations, forms, signatures, print preparation and output structure. Include damaged/encrypted/restricted/oversized files, large page counts, awkward reading order, ZIP bombs, Unicode filenames and stale sources. Redaction must remove original text/images/streams and survive search/copy/object inspection; a black overlay is insufficient.

Source: [REQUIREMENTS.md:55](../REQUIREMENTS.md#L55).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R30

- **R30 Brand assets:** preserve the supplied PDFix logo unchanged as the master. Prepare separate app-icon, light/dark-background and monochrome variants for packaging, inspect at small sizes, and retain transparent asset licensing/provenance. Do not replace the master with a generated derivative.

Source: [REQUIREMENTS.md:56](../REQUIREMENTS.md#L56).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R31

- **R31 Window and layout controls (user addition):** visible native fullscreen control plus F11/Escape; collapsible named sidebar navigation; focus mode with an easy way back; independently collapsible PDF thumbnails/search panels. Remember non-sensitive layout choices, make hidden search available with Ctrl F, and retain document content, recovery and selection behavior when resizing. Verify the minimum window size and keyboard access.

Source: [REQUIREMENTS.md:60](../REQUIREMENTS.md#L60).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R32

- **R32 Visual polish:** remove redundant header rows and artificial UI measurement graphics, tighten unnecessary container padding, keep document artwork/page margins intact, and make controls align and fit the window. Audit Home, Files, Workspaces, reading, editing, settings and workflow dialogs at normal/minimum sizes. No unintended body scroll, clipped bottom controls or overlapping interactive controls. Preserve keyboard names, usable focus and content/recovery while changing layouts.

Source: [REQUIREMENTS.md:64](../REQUIREMENTS.md#L64).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R33

- **R33 Complete everyday page tools:** add crop/resize and automatic split rules to the verified arrange/rotate/remove/extract/combine/insert-by-reorder workflow. Show the affected boundary/pages before output. Cropping hides artwork outside a page box; it must never be described as secure redaction.

Source: [REQUIREMENTS.md:65](../REQUIREMENTS.md#L65).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R34

- **R34 Useful PDF editing:** user-positioned text/image overlays and a verified subset of existing text/image object edits. Explain font, spacing and layout restrictions before accepting an edit. Do not equate an extracted text document with editing the original PDF objects. Source/output review and original preservation are required.

Source: [REQUIREMENTS.md:66](../REQUIREMENTS.md#L66).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R35

- **R35 PDF creation:** actual local PDF output from supported text/documents/images, with preview and tested page size/orientation/font/image behavior. Office layout conversions remain engine/corpus dependent.

Source: [REQUIREMENTS.md:67](../REQUIREMENTS.md#L67).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R36

- **R36 Guided form/signature assistance:** identify supported blank/required fields and offer likely signature/date/initial locations as proposals with uncertainty. Users confirm placement and values before writing. Scanned forms use explicit positioned overlays; no fabricated field certainty or automatic signing. Saved visual signatures are distinct from certificate validity and external signature-request workflows.

Source: [REQUIREMENTS.md:68](../REQUIREMENTS.md#L68).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R37

- **R37 Security Sandbox:** contain native PDF engines with Windows AppContainer and a bounded Job Object, grant only app-owned job inputs/output and pinned runtime binaries, omit network capabilities, scrub inherited environment, limit subprocesses/memory/time and fail closed if containment cannot start. Keep global Electron sandbox, renderer network/download/permission restrictions, active-content refusal and source-bound IPC. Worker threads provide resource limits only. Require a hidden Windows containment/security review before release claims.

Source: [REQUIREMENTS.md:125](../REQUIREMENTS.md#L125).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R38

- **R38 Complete saved master-list coverage:** all ten sections of PDFix-Missing-Features-Master-List.md are accepted planning requirements; MASTER-GAP-TRACKER.md preserves every item with stable IDs. These expand R06–R29 and R33–R36, including drawing/measurement/layers/print, sanitation, forms, OCR, format fidelity, batches, accessibility, Windows and AI. Later candidates retain their reviewed-engine/service gates and explicit initial-release boundaries. No item is complete merely because it is saved here.

Source: [REQUIREMENTS.md:126](../REQUIREMENTS.md#L126).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R39

- **R39 Bluebeam/Revu compatibility:** prioritize seeing existing comments/markups in Revu-produced PDFs, a searchable drawing-wide markup panel, sheet-location navigation, supported replies/states/locks and preservation when saving copies. The user confirmed drawing/comment review is their dad's main workflow. Add clouds/callouts, aligned revision review, sheet sets, reusable review tools, custom data and calibrated takeoffs in that order. Detailed open targets B01–B12, flattened-data limits, proprietary-format gates and separate Studio integration boundaries are saved in [BLUEBEAM-COMPATIBILITY-PLAN.md](BLUEBEAM-COMPATIBILITY-PLAN.md). Existing annotation rendering/summaries do not prove Bluebeam compatibility.

Source: [REQUIREMENTS.md:131](../REQUIREMENTS.md#L131).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R40

- **R40 PDF-only fullscreen:** provide an explicit reader control that fills the screen with PDF artwork and hides the Windows frame, application sidebar/top bar/status bar, workspace tabs, reader toolbar, thumbnails, inspector, comments/review panels and other surrounding controls. Preserve the physical page, zoom, reading mode, scroll position and unsaved work. Provide an obvious temporary exit control and Escape; temporary controls disappear when not needed. Retain accessible keyboard page/zoom navigation, restore the previous layout on exit, respect open dialogs and leave this mode safely before switching files or leaving the reader. Test standard/rotated/cropped/non-unit PDFs, all supported reading views, minimum/large screens and multi-monitor/DPI changes. Existing F11 and focus mode do not satisfy this complete requirement.

Source: [REQUIREMENTS.md:135](../REQUIREMENTS.md#L135).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R41

## R41 — Acrobat replacement expansion (October 7 user request)

Adopt every category from the supplied Acrobat gap comparison into the full PDFix plan. A01–A25 in [ACROBAT-COMPETITIVE-PLAN.md](ACROBAT-COMPETITIVE-PLAN.md) define certificate trust/signing/routing, prepress/color/standards, full accessibility remediation, XFA/contained form logic/barcodes/submissions, portfolios, 3D/GIS/media, managed enterprise policies, browser/mobile/platform clients and difficult-file reliability. Preserve the source, retain prior IDs and avoid double-counting overlaps. Expand historical specialist exclusions into explicitly staged later targets with engine, licensing, service, security and independent output/standards acceptance where applicable. Core reading/editing/comment reliability and S00 retain priority. This is adopted planned scope, not implemented feature parity or a blanket legal/compliance promise; current script and consent restrictions remain until a separately reviewed compatible design is accepted.

Source: [REQUIREMENTS.md:155](../REQUIREMENTS.md#L155).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R42

- **R42 Virtual PDF printer (F43):** optional Windows PDFix print destination, bounded local print-job capture, review/import/exclusive copy save, cancellation/recovery and free signed installation/uninstallation. Existing PDF export/physical printing is separate.

Source: [REQUIREMENTS.md:162](../REQUIREMENTS.md#L162).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R43

- **R43 Read aloud (F44):** free local text-to-speech with play/pause/resume/stop, voice/language/speed, text/page/document scope and source highlighting; preserve permissions, disclose OCR/order uncertainty and process incrementally. Whisper recognizes speech rather than generating it.

Source: [REQUIREMENTS.md:163](../REQUIREMENTS.md#L163).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R44

- **R44 Word count (F45):** expand the basic editor counter to explicit selection/page/document word/character/paragraph/page statistics for supported editable and extracted PDF text, with language/scope/omission disclosures.

Source: [REQUIREMENTS.md:164](../REQUIREMENTS.md#L164).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R45

- **R45 Spell-checking (F46):** free local dictionaries, language choice, suggestions/replace/ignore/personal dictionary and Undo/recovery in supported editable text; read-only PDF findings cannot bypass edit/font permissions.

Source: [REQUIREMENTS.md:165](../REQUIREMENTS.md#L165).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R46

- **R46 Free app:** no required paid API/subscription, paid feature unlock or purchase/upgrade links. These additions work locally without uploading document data. Evaluate other adopted integrations under this rule and record incompatibilities honestly.

Source: [REQUIREMENTS.md:166](../REQUIREMENTS.md#L166).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R47

- **R47 Free Acrobat additions:** adopt all 20 priorities as F47–F66 in [FREE-ACROBAT-ADDITIONS-PLAN.md](FREE-ACROBAT-ADDITIONS-PLAN.md): field detection, local autofill, labeling/tab suggestions, Windows context tools, Office shortcuts, Edge handoff, synchronized folders, EML conversion, clipboard PDF, local translation, bookmark suggestions, selected-folder PDF search, filename suggestions, approved watched folders, CSV form merge, signature handoff preparation, SHA-256 verification, production marks, five-box editing and thin-line inspection/repair. Preserve R46's free-app rule and all earlier scope. Existing overlapping subsets are not completion of these full additions.

Source: [REQUIREMENTS.md:177](../REQUIREMENTS.md#L177).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R48

- **R48 Explicit selected-folder grants:** expand individually selected-file search only after the user selects a folder and its purpose, recursive scope and persistence. Keep access within the granted tree, handle placeholders/links/changed files, provide revocation and index cleanup. Folder search permission does not authorize writing, watching or running jobs; watched recipes need their own approved operations and output destination. No unrestricted system/drive scans.

Source: [REQUIREMENTS.md:178](../REQUIREMENTS.md#L178).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### R49

- **R49 Unified creation/editor/review UI:** after Workspaces/viewing/editing, finish a familiar Word/Google Docs/DocHub-inspired document/PDF creation toolbar, then Bluebeam comment viewing, adding and permitted editing with preservation and visible restrictions. Use clean grouped controls and actual integrated functionality. Perform the user's requested full UI/function debugging pass with documented coverage; no blanket working claim from compilation.

Source: [REQUIREMENTS.md:183](../REQUIREMENTS.md#L183).

Dated implementation status: coded and scoped functional cases passed; full UI/function acceptance open. Familiar document toolbar, source-comment panel/actions and selected-page note route integrated; custom rich-style validation, contained Node startup, current PDF.js corner geometry and owning-task lifecycle repaired. Seven declared functional checks passed; hidden-only aggregate did not pass; real Revu/pen/all-tool gates pending.

### R50

- **R50 Digital-pen PDF drawing (F67):** handwriting/ink directly on PDF pages using a digital pen, saved editable ink/appearance copies and recoverable drafts; pen/highlighter/color/width/opacity, pressure where supported, palm rejection, touch/navigation modes, stroke selection/erasing, Undo/Redo and coordinate-accurate zoom/rotation/page handling. Existing basic Ink is partial groundwork. The user clarified the Store-app reference by function; exact brand is not a dependency.

Source: [REQUIREMENTS.md:184](../REQUIREMENTS.md#L184).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

## Security Sandbox

### S00

## S00 — Security Sandbox (explicit user addition)

Required: Windows OS containment for native document engines; job-only file grants; no network capability; bounded memory/processes/time; cancellation kills the contained process; no unsandboxed fallback. Renderer sandbox, blocked active document content, narrow IPC and chosen-file grants remain mandatory. Native Node workers are not OS sandboxes. Security review and hidden runtime containment checks remain release gates.

Source: [MASTER-GAP-TRACKER.md:10](../MASTER-GAP-TRACKER.md#L10).

Recorded status: **U** (see inventory legend).

Coded/evidence: Fixed Windows AppContainer/Job Object code; qpdf and adopted document families have contained routes and pinned builds. Fixed contained DOCX/RTF parsing and DOCX/RTF rich-copy exports integrated October 7; image/OCR/PDF rendering decode still remains. Current runtime acceptance pending. Additional fixed contained bookmark/decorations/Bates, attachment decoding, web destination review, table XLSX and supported batch text routes coded October 7. Fillable-field inspection/creation and document-generated PDF output inspection now use fixed child routes; initial field inspection has source-bound cancellation. Existing form filling and visual placements now use contained inspection/build, inert parent validation, preservation checks and source-bound token-only saving; compiled October 9. Renderer form worker fallback removed. Supported qpdf repair uses bounded contained diagnostics and source/output verification. Supported FDF import/export now use fixed contained routes; editable reorder/Bates workflows chain verified native outputs. Broker file envelope aligned with existing 256 MiB file-comment/36 MiB portfolio contracts; compiled October 9.

Still required: Finish other native parser/writer routes; prove ACL/network/process/memory/time/parent-death/cancel/cleanup isolation on Windows; independent security review.

## Every original master-list item

### M01.01

M01.01 — **Verified permanent redaction:** remove selected text, regions, image content, and underlying objects so hidden information cannot be recovered. Search repeated words/numbers, show every match, and require review before applying.

Source: [MASTER-GAP-TRACKER.md:16](../MASTER-GAP-TRACKER.md#L16).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Clean-image reconstruction was tested; current contained inspection/verification route is newer and untested.

Still required: Retest removal/object/pixel/disk proofs and recovery on current route; vector-preserving redaction, forensic/real-file corpus.

### M01.02

M01.02 — **Sanitize before sharing:** inspect and selectively remove metadata, embedded attachments, hidden layers, comments, form values, scripts/actions, and other hidden content. Show what will be removed.

Source: [MASTER-GAP-TRACKER.md:17](../MASTER-GAP-TRACKER.md#L17).

Recorded status: **U** (see inventory legend).

Coded/evidence: Structural inventory and selective cleanup copy are coded with contained native routes and reviewed outputs.

Still required: Execute hidden-content/retention cases; expand unsupported structures, metadata/layer/form/action cases; avoid blanket clean/safe verdict.

### M01.03

M01.03 — **Password protection and changes:** add or change PDF passwords using a reviewed implementation; explain permissions and never bypass access controls.

Source: [MASTER-GAP-TRACKER.md:18](../MASTER-GAP-TRACKER.md#L18).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: AES-256 and owner-authorized removal/change passed older real-file tests; later native sandbox code needs regression.

Still required: Current containment/cancel/cleanup checks, wider legacy/public-key/password-normalization corpus and encrypted editing boundaries.

### M01.04

M01.04 — **Digital signature validation:** detect certificate signatures and report valid, invalid, or unable to verify only when a reviewed validator supports the result. Warn when edits may invalidate signatures.

Source: [MASTER-GAP-TRACKER.md:19](../MASTER-GAP-TRACKER.md#L19).

Recorded status: **U** (see inventory legend).

Coded/evidence: Restricted contained CMS ByteRange integrity and signer identity plus Windows offline base-chain/root-anchor inspection are integrated and compiled October 9. Runtime acceptance pending.

Still required: Revocation, trusted timestamps, document EKU/policy, AATL/EUTL, broader signature profiles and cryptographic/security corpus acceptance.

### M01.05

M01.05 — **Separate signature types:** distinguish visual signatures, certificate-based signatures, and external signature requests.

Source: [MASTER-GAP-TRACKER.md:20](../MASTER-GAP-TRACKER.md#L20).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Visual signature workflows tested; newer structural report differentiates certificate signatures and external requests.

Still required: Retest current UI and all write warnings; cryptographic validation and online requests remain separate unfinished work.

### M01.06

M01.06 — **Safe links and attachments:** show external destinations before opening; list attachments with type/size details and save only to a chosen location. Never execute PDF scripts or auto-open extracted files.

Source: [MASTER-GAP-TRACKER.md:21](../MASTER-GAP-TRACKER.md#L21).

Recorded status: **U** (see inventory legend).

Coded/evidence: Source-bound destination review, internal links, attachment inventory and reviewed inert .bin copies are coded. Native attachment inventory/decoding and PDF URI inspection now use fixed contained routes with inert parent validation and awaited cancellation.

Still required: Current Windows isolation, bypass, unusual destinations, attachment identity/size, cancellation and exclusive-save acceptance; broader type handling.

### M01.07

M01.07 — **Plain-language security report:** explain encryption, signatures, active content, attachments, and unsupported structures.

Source: [MASTER-GAP-TRACKER.md:22](../MASTER-GAP-TRACKER.md#L22).

Recorded status: **U** (see inventory legend).

Coded/evidence: Encryption/signature/action/attachment/unsupported-structure reporting is coded on contained inspection.

Still required: Real-file truthfulness/error/cancel/partial-result and accessibility checks; certificate validity remains unknown.

### M02.01

M02.01 — **Compression with quality preview:** show expected size savings and let users inspect quality before saving. Disclose possible loss of text, forms, links, annotations, or other structures.

Source: [MASTER-GAP-TRACKER.md:25](../MASTER-GAP-TRACKER.md#L25).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Single-PDF measured compression and page review tested historically; later containment and batch integrations untested.

Still required: Current file/filter/image/form/cancel regressions, quality corpus, native resource limits and package operation.

### M02.02

M02.02 — **Broader conversions:** support more tested conversions between PDFs, documents, images, and data files. For each, disclose what happens to fonts, page breaks, images, links, bookmarks, forms, and annotations.

Source: [MASTER-GAP-TRACKER.md:26](../MASTER-GAP-TRACKER.md#L26).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Basic DOCX/TXT and one-image PDF subsets tested; RTF, richer DOCX/PDF, workbook/slide and image/page exports are coded.

Still required: Each new conversion needs reopen/preservation/corpus tests; more decoders and faithful document/slide layouts.

### M02.03

M02.03 — **Multiple images to PDF:** add an ordered image list, per-image rotation, page layout, paper size, and recoverable source references. Current documented workflow makes one PDF from one image.

Source: [MASTER-GAP-TRACKER.md:27](../MASTER-GAP-TRACKER.md#L27).

Recorded status: **U** (see inventory legend).

Coded/evidence: Ordered multi-image collection, per-page setup/crop/tone/order, recovery and preview are coded.

Still required: Mixed-image/duplicate/relink/rotate/cancel/recovery/save tests and expanded EXIF/color/metadata behavior.

### M02.04

M02.04 — **Create PDFs from text/documents:** provide page size, margins, fonts, page breaks, and preview.

Source: [MASTER-GAP-TRACKER.md:28](../MASTER-GAP-TRACKER.md#L28).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Basic document editing/export was tested; richer PDF page setup, bands/images/tables and page breaks are newer code. October 11: tabbed creation commands and selected serif/16pt style coded; local fixture DOCX and reviewed one-page PDF exports saved successfully. Broader layout/fidelity acceptance remains open.

Still required: Reopen and layout/fonts/page-break/table/image/header corpus; complex source layout fidelity remains limited.

### M02.05

M02.05 — **More export options:** save a page or selected pages as images; export selected pages as separate PDFs; consider reverse PDF-to-image conversion.

Source: [MASTER-GAP-TRACKER.md:29](../MASTER-GAP-TRACKER.md#L29).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Ordered range extraction and split copies tested; selected-page PNG/JPEG export is coded.

Still required: Image-export current runtime/size/quality/cancel/output-name checks and wider split/export corpus.

### M02.06

M02.06 — **Page additions:** insert blank pages, replace pages with corrected scans, and add page numbers, headers, footers, watermarks, or reusable Draft/Approved/Reviewed stamps.

Source: [MASTER-GAP-TRACKER.md:30](../MASTER-GAP-TRACKER.md#L30).

Recorded status: **U** (see inventory legend).

Coded/evidence: Blank/replacement page workflows, numbering/bands/watermarks/stamps and reusable templates are coded. Page decorations and Bates now use the fixed contained writer with exact draft/sequence receipts and sealed copies.

Still required: Actual outputs, appearance, source retention, every-page review and recovery tests; more preservation cases.

### M02.07

M02.07 — **Metadata tools:** inspect and optionally edit or remove title, author, subject, keywords, and other supported metadata.

Source: [MASTER-GAP-TRACKER.md:31](../MASTER-GAP-TRACKER.md#L31).

Recorded status: **U** (see inventory legend).

Coded/evidence: Declared metadata inspection/edit/removal and structural sanitation are coded.

Still required: Exact retained/removed keys, XMP/encodings/unsupported metadata, cancellation and independent reopening.

### M02.08

M02.08 — **Output naming:** offer clear names, keep-both, and destination choices; never silently overwrite originals or unrelated files.

Source: [MASTER-GAP-TRACKER.md:32](../MASTER-GAP-TRACKER.md#L32).

Recorded status: **H** (see inventory legend).

Coded/evidence: Exclusive new-copy saving, original/alias/existing-file refusal and destination picking tested historically.

Still required: Regression every new writer, clear collision/keep-both UX and folder/name/long-path cases; no silent overwrites.

### M03.01

M03.01 — **Paper-size presets:** common US Letter and Legal, engineering ANSI A–E, architectural ARCH A–E, and ISO A-series such as A0–A4, where supported by the operation.

Source: [MASTER-GAP-TRACKER.md:35](../MASTER-GAP-TRACKER.md#L35).

Recorded status: **U** (see inventory legend).

Coded/evidence: US, ANSI engineering, ARCH and ISO presets coded for supported page/document/print operations.

Still required: Physical dimensions/orientation/margins/current UI tests across each operation and large sheets.

### M03.02

M03.02 — **More page views:** single page, continuous scroll, facing pages, two-page spread, and side-by-side pages, with clear page order.

Source: [MASTER-GAP-TRACKER.md:36](../MASTER-GAP-TRACKER.md#L36).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Single-page view tested; continuous/facing-page views are coded.

Still required: Mode/page order, lazy release, large-file/zoom/selection/cancel and accessibility tests; broader independent spreads.

### M03.03

M03.03 — **Large-sheet navigation:** smooth pan and zoom, zoom-to-region, fit-sheet, and return-to-previous-view for blueprints, plans, schematics, and maps.

Source: [MASTER-GAP-TRACKER.md:37](../MASTER-GAP-TRACKER.md#L37).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Basic zoom/fit tested; markup-location zoom, previous-view and drawing navigation coded. October 7: artwork fullscreen and hand/pointer zoom implemented and compiled; current runtime acceptance pending. Zoom-to-region and session Previous/Next view history integrated October 7. Current runtime acceptance pending. October 11: current PDF.js comment/zoom-region geometry fixed; local comment location and PDF-only fullscreen/restore functional cases passed. Native fullscreen visibility prevents calling this a fully hidden test pass.

Still required: Broader region zoom/pan, high-DPI/large-sheet responsiveness, position retention, keyboard/accessibility and native-window/hardware edge cases.

### M03.04

M03.04 — **Scale-aware measurement:** calibrate drawing scale first, then measure distance, perimeter, and area with visible units and a way to confirm calibration.

Source: [MASTER-GAP-TRACKER.md:38](../MASTER-GAP-TRACKER.md#L38).

Recorded status: **U** (see inventory legend).

Coded/evidence: Calibration, distance/perimeter/area/count ledger and supported persistent takeoffs are coded.

Still required: Known dimensions/UserUnit/rotations/units/math/recovery/save tests; Revu takeoff interoperability.

### M03.05

M03.05 — **Drawing markups:** dimension lines, arrows, callouts, revision clouds, and color-coded comments alongside notes, highlights, and drawing tools.

Source: [MASTER-GAP-TRACKER.md:39](../MASTER-GAP-TRACKER.md#L39).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Five basic PDFix tools tested; line/arrow/cloud/callout and measurement artwork coded.

Still required: New appearance/geometry/colors/retention/undo/print tests on real drawings; unsupported markup handling.

### M03.06

M03.06 — **PDF layers:** show or hide layers where the PDF contains them.

Source: [MASTER-GAP-TRACKER.md:40](../MASTER-GAP-TRACKER.md#L40).

Recorded status: **U** (see inventory legend).

Coded/evidence: Optional-content inventory and temporary visibility controls coded.

Still required: Hierarchy/state/artwork/unsupported configuration and view/print tests; no claim of saved layer edits.

### M03.07

M03.07 — **Drawing revision comparison:** align sheets and compare with a transparent overlay or side-by-side view; allow alignment adjustment when scale or position shifted.

Source: [MASTER-GAP-TRACKER.md:41](../MASTER-GAP-TRACKER.md#L41).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Linked two-PDF/text/source-output comparison tested; manually aligned/color overlay is newer code. Reviewed page-match proposals and manually confirmed comparison counterparts integrated October 7. Current runtime acceptance pending.

Still required: Overlay alignment/scale/rotation/pan/labels/differences and realistic drawing corpus; no automatic design verdict.

### M03.08

M03.08 — **Large-format printing:** print at actual size, fit to a chosen sheet, or tile across pages with overlap and alignment marks. Include ranges, orientation, scaling, and multiple pages per sheet.

Source: [MASTER-GAP-TRACKER.md:42](../MASTER-GAP-TRACKER.md#L42).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Older bounded raster preparation/OS handoff tested; range/paper/scale/N-up/tile controls coded.

Still required: Preview/handoff/cancel/large-sheet memory tests plus actual printer output, overlap/alignment/annotation checks.

### M03.09

M03.09 — **Booklet printing:** provide layout preview and clear paper/duplex requirements.

Source: [MASTER-GAP-TRACKER.md:43](../MASTER-GAP-TRACKER.md#L43).

Recorded status: **U** (see inventory legend).

Coded/evidence: Booklet page planning and reviewed layout/duplex disclosures coded.

Still required: Page pairing, blank insertion, binding/duplex/orientation and real printer validation.

### M03.10

M03.10 — **Sheet sets:** group related drawings, navigate sheets, and preserve order.

Source: [MASTER-GAP-TRACKER.md:44](../MASTER-GAP-TRACKER.md#L44).

Recorded status: **U** (see inventory legend).

Coded/evidence: Named ordered sets, navigation, source references and controlled revision-reference review coded.

Still required: Changed/missing/relinked sources, selection/recovery/navigation tests; physical revision replacement/comment transfer expansion.

### M03.11

M03.11 — **Drawing information:** show sheet number, title, revision, dimensions, and page size when present.

Source: [MASTER-GAP-TRACKER.md:45](../MASTER-GAP-TRACKER.md#L45).

Recorded status: **U** (see inventory legend).

Coded/evidence: Printed/sheet labels, user-entered title/revision and visible-page details coded.

Still required: Source accuracy/ambiguous labels and real-drawing checks; richer reliable embedded-sheet metadata extraction.

### M03.12

M03.12 — **CAD boundary:** do not imply PDFix edits CAD models; DWG and other CAD formats need separate decoder, licensing, and corpus evaluation.

Source: [MASTER-GAP-TRACKER.md:46](../MASTER-GAP-TRACKER.md#L46).

Recorded status: **X** (see inventory legend).

Coded/evidence: PDF viewing/measurement is scoped separately from CAD model editing.

Still required: Keep DWG/CAD editing out of initial release; any future adapter needs its own licensed decoder/corpus.

### M04.01

M04.01 — **Create basic fillable forms:** add supported text, checkbox, radio, and choice fields, in addition to filling existing fields.

Source: [MASTER-GAP-TRACKER.md:49](../MASTER-GAP-TRACKER.md#L49).

Recorded status: **U** (see inventory legend).

Coded/evidence: Supported text/check/radio/choice field placement, labels/flags and source-bound recovery coded. Fixed contained inspection/creation and initial-inspection cancellation now coded; no fallback. October 11 batch: Digital text/vector and opt-in local OCR/dark scan-line proposals are integrated in the builder, with editable reviewed selection and existing real output route. Nearby label/type/confidence/order proposals, editable names/tooltips/geometry and explicitly accepted creation order.

Still required: Actual field geometry/appearances/values/tab behavior/retention/export/reopen/cancel tests.

### M04.02

M04.02 — **Improve form usability:** clearer labels, tab order, required-field guidance, supported fonts, and explanations for unsupported calculations/fields.

Source: [MASTER-GAP-TRACKER.md:50](../MASTER-GAP-TRACKER.md#L50).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Required/blank guidance and supported existing field values tested; newer field creation coded. Reviewed user-authored declarative field calculations, dependency/cycle checks, explicit inputs/results/rounding review, undo/recovery and write consistency are coded and compiled October 9; source PDF actions remain inert. Native contained fill inspection/build and source/output preservation verification are integrated and compiled; reviewed calculations and recovery retained. Reviewed supported-page custom widget order, numbered overlays, undo/recovery and native PDF 2.0 order verification are integrated and compiled October 9. October 11 batch: OS-protected local profile CRUD/clear, explicit matching/manual mapping/review, protected-field exclusions and one-step-undo application in Fill and Sign. Real encryption/reopen/update/delete/temporary cleanup plus model matching passed.

Still required: Tagged/mixed/ambiguous widget navigation and wider fonts, document declarative validation/formatting/legacy calculation compatibility, screen-reader labels and broad real forms; current calculation/precision/recovery/behavior acceptance. Arbitrary PDF scripts stay inactive.

### M04.03

M04.03 — **Form submission:** save a completed copy, print it, or export supported field data; explain unsupported fields.

Source: [MASTER-GAP-TRACKER.md:51](../MASTER-GAP-TRACKER.md#L51).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Completed-copy saving and visual signing tested; field-data JSON/CSV/text exports coded. Filled copies now save from a main-retained source-bound seal, with awaited cancellation/departure cleanup; compiled October 9.

Still required: Current data exports, withheld password-field content, print/cancel and unsupported-field disclosures; online submission later.

### M04.04

M04.04 — **Signature placement help:** identify likely signature/date/initial fields and suggest locations, but require confirmation of content and placement.

Source: [MASTER-GAP-TRACKER.md:52](../MASTER-GAP-TRACKER.md#L52).

Recorded status: **H** (see inventory legend).

Coded/evidence: Current-page selectable label proposals and manually confirmed placement tested historically.

Still required: Broader label/OCR/uncertainty/cropped/rotated/date/initial placement corpus; no automatic signing.

### M04.05

M04.05 — **Reusable assets:** save user-approved signatures, initials, stamps, and common markups with clear local storage and deletion controls.

Source: [MASTER-GAP-TRACKER.md:53](../MASTER-GAP-TRACKER.md#L53).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Local approved visual signature library tested; reusable drawing styles and stamps/templates coded.

Still required: New template/style import/delete/apply/undo/storage/recovery tests; more portable assets and proprietary tools.

### M04.06

M04.06 — **Broader annotations:** edit third-party annotations, threaded replies, and comment exchange only after preservation tests.

Source: [MASTER-GAP-TRACKER.md:54](../MASTER-GAP-TRACKER.md#L54).

Recorded status: **U** (see inventory legend).

Coded/evidence: Standard comment inventory, threads/states/locks, supported plain-comment/reply edits coded.

Still required: Foreign/unknown/appearance/provenance preservation and real Revu round trips; broader annotation types/private fields.

### M04.07

M04.07 — **Annotation export:** offer a separate annotation summary or copy where verifiable.

Source: [MASTER-GAP-TRACKER.md:55](../MASTER-GAP-TRACKER.md#L55).

Recorded status: **U** (see inventory legend).

Coded/evidence: Reviewed TXT/CSV/JSON reports, summary PDFs and supported XFDF import/export coded. Supported native FDF comments with bounded grammar, chosen-source import, omission review, actual PDF comparison and sealed FDF/PDF saving are integrated and compiled October 9.

Still required: Every format/omission/formula/source-seal/import-retention/interop test; Broader FDF/form-data/appearance coverage, BAX/BTX and private data remain unfinished.

### M05.01

M05.01 — **Scan from a device:** import from scanner/document camera, including multi-page scans where supported; preview, reorder, rotate, or remove pages before making a PDF.

Source: [MASTER-GAP-TRACKER.md:58](../MASTER-GAP-TRACKER.md#L58).

Recorded status: **U** (see inventory legend).

Coded/evidence: Windows WIA flatbed/repeated and simplex feeder capture, bounded pinned native helper, cancellation, durable verified PNG copies and image/PDF page review integration are coded and compiled October 8.

Still required: Actual scanner/device/driver and cancellation acceptance; document camera, duplex/TWAIN/vendor-only and broader acquisition compatibility. WIA device normalization is outside document AppContainer.

### M05.02

M05.02 — **Scan cleanup:** preview deskew, contrast/brightness cleanup, rotation, and proposed blank-page removal. Distinguish faint content from blank pages and allow undo.

Source: [MASTER-GAP-TRACKER.md:59](../MASTER-GAP-TRACKER.md#L59).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Basic still-image rotation/crop/layout tested; deskew/tone/multi-image cleanup and blank-page proposals coded.

Still required: Faint-content/blank/undo/skew/geometry/OCR and destructive-change review tests on real scans.

### M05.03

M05.03 — **Broader OCR:** add only tested bundled/installed languages; make language choice clear and show confidence as an estimate.

Source: [MASTER-GAP-TRACKER.md:60](../MASTER-GAP-TRACKER.md#L60).

Recorded status: **U** (see inventory legend).

Coded/evidence: Six bundled local OCR languages (English, Spanish, French, German, Portuguese, Italian), selected-language request/result/output provenance and packaged metadata/notices are coded and compiled October 8.

Still required: Recognition quality, fonts/shaping/RTL/CJK, mixed-language/orientation/handwriting expansion and restart recovery.

### M05.04

M05.04 — **Uncertainty review:** locate uncertain words/lines on the scan, preserve page references, and require review before saving corrections.

Source: [MASTER-GAP-TRACKER.md:61](../MASTER-GAP-TRACKER.md#L61).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: English correction/source-position/searchable output tested; richer confidence overlays/exports/table OCR coded.

Still required: Low-confidence word/line mapping, corrections, poor scans, output and recovery on current code.

### M05.05

M05.05 — **Extract tables:** offer table-to-CSV/spreadsheet export only when recognition is suitable, with preview to catch misaligned rows and columns.

Source: [MASTER-GAP-TRACKER.md:62](../MASTER-GAP-TRACKER.md#L62).

Recorded status: **U** (see inventory legend).

Coded/evidence: Region/grid, selectable words or English OCR, editable cells, paged review and source-bound CSV coded. Source-bound portable table correction drafts integrated October 7. Current runtime acceptance pending. Source-bound literal XLSX export/cancel coded October 7, preserving leading zeros and formula-looking text with child readback. Manual rectangular merge/split corrections with empty covered cells, portable merge ranges, CSV disclosure and XLSX merge readback now coded.

Still required: Accuracy/irregular/merged/rotated tables, cancellation/source/recovery and Excel/runtime acceptance.

### M05.06

M05.06 — **Searchable documents:** preserve scan images and explain when OCR reading order or recognition needs review.

Source: [MASTER-GAP-TRACKER.md:63](../MASTER-GAP-TRACKER.md#L63).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Mixed/text/scan image-preserving searchable copies tested historically; newer cleanup/review integration coded.

Still required: Current output geometry/text/pixels/reading order and poor-scan/language corpus; tagging is separate.

### M05.07

M05.07 — **Clear scan limits:** explain limits for handwriting, low resolution, skew, mixed languages, and complex reading order.

Source: [MASTER-GAP-TRACKER.md:64](../MASTER-GAP-TRACKER.md#L64).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Printed-English, handwriting/quality/reading-order limits documented; newer scan/table UI has updated disclosures.

Still required: Review every path for accurate language/score/output limits and user comprehension; broaden quality evidence.

### M06.01

M06.01 — Evaluate and add tested support for HEIC/HEIF (orientation and metadata choices), multipage TIFF, RTF, XLSX/PPTX preview/conversion, legacy DOC/XLS/PPT, and Apple Pages/Numbers/Keynote. Add a meaningful Markdown preview and structured table views for CSV/data files while retaining source editing. Complete real-file fixtures for XML, YAML, CSV, BMP, and uncommon image variants before claiming support. Clearly separate Open, Preview, Edit, and Convert for each format. Explain fidelity limits before conversion. Let users choose whether photo metadata/color profiles are kept or removed.

Source: [MASTER-GAP-TRACKER.md:67](../MASTER-GAP-TRACKER.md#L67).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: PDF/basic DOCX/TXT/source and still images have historical subsets; RTF/XLSX/PPTX/Markdown/CSV/richer DOCX code exists. Supported authored formatted header/footer runs export to DOCX/RTF/PDF; supported explicit single-section DOCX bands import; additional already-mapped embedded TrueType simple glyphs can be independently proved for original-resource edits. Supported classic multipage TIFF decoding, reviewed oriented PNG copies and image-workspace import are integrated and compiled October 9. Supported CCITT MH/Group 3/Group 4 TIFF strip decoding is integrated and compiled.

Still required: Wider TIFF modes/color/metadata and actual decoding/import acceptance; HEIC/HEIF/legacy Office/iWork decoders; real XML/YAML/CSV/BMP/photo variants, EXIF/color/metadata and layout fidelity.

### M07.01

M07.01 — **Search navigation:** match counts and next/previous controls.

Source: [MASTER-GAP-TRACKER.md:70](../MASTER-GAP-TRACKER.md#L70).

Recorded status: **U** (see inventory legend).

Coded/evidence: In-document counts/next/previous match navigation coded beyond older page-result search.

Still required: Exact offsets/highlights/multiple columns/copy restrictions/huge texts, resize/cancel and keyboard tests.

### M07.02

M07.02 — **Search selected files:** search only deliberately selected files; show filename and page for each result.

Source: [MASTER-GAP-TRACKER.md:71](../MASTER-GAP-TRACKER.md#L71).

Recorded status: **U** (see inventory legend).

Coded/evidence: Chosen-source local search, filenames/pages/lines, bounded extraction and hash-checked reopening coded.

Still required: Cross-format/cancel/partial-result/source-change/navigation/limits tests; no broad folder scanning.

### M07.03

M07.03 — **Quick action finder:** “What do you want to do?” search for sign, split, compress, OCR, compare, or convert.

Source: [MASTER-GAP-TRACKER.md:72](../MASTER-GAP-TRACKER.md#L72).

Recorded status: **U** (see inventory legend).

Coded/evidence: Searchable actions/shortcuts and workspace filtering/direct tasks coded.

Still required: Keyboard focus, disabled-action reasons, correct routing and every new task at minimum/larger UI scales.

### M07.04

M07.04 — **Move pages across PDFs:** drag pages between open PDFs with a visible preview.

Source: [MASTER-GAP-TRACKER.md:73](../MASTER-GAP-TRACKER.md#L73).

Recorded status: **U** (see inventory legend).

Coded/evidence: Adding another PDF to the organizer is supported; direct cross-document page dragging is absent. Chosen-source page drag/copy/reorder with reviewed mappings and undo integrated October 7. Current runtime acceptance pending.

Still required: Visible drag preview/source mapping, ordering/cancel/retention and verified output.

### M07.05

M07.05 — **Page navigation:** jump by printed page label; edit bookmarks/table-of-contents entries; safely show internal link destinations.

Source: [MASTER-GAP-TRACKER.md:74](../MASTER-GAP-TRACKER.md#L74).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Source outline/labels/personal pages tested; label jumps, bookmark editing and destination review coded. Bookmark inspection/writing now use fixed contained routes with exact hierarchy/source-bound validation. October 11 batch: Bounded physical-page heading analysis with geometric word spaces, running-header filtering, scored editable hierarchy/page proposals and undoable acceptance in existing outline editor.

Still required: Current label ambiguity/internal-link coordinates/bookmark graph/retention/recovery tests.

### M07.06

M07.06 — **Batch operations:** queue supported conversion, compression, rename, combine, and other verified actions with per-file progress/results, cancellation, output location, collision handling, and bounded resources.

Source: [MASTER-GAP-TRACKER.md:75](../MASTER-GAP-TRACKER.md#L75).

Recorded status: **U** (see inventory legend).

Coded/evidence: Selected-PDF compression queue, per-file review/retry/skip/cancel/result and new-folder saves coded. Reviewed source-sealed PDF copy/rename and narrowly supported literal TXT queues coded October 7.

Still required: Queue/resource/output/partial/failure/collision acceptance; wider conversions/combine and multi-step batches.

### M07.07

M07.07 — **Reusable workflows:** repeat reviewed sequences such as OCR → review → save copy or combine → number pages → print; show and allow editing of steps before running.

Source: [MASTER-GAP-TRACKER.md:76](../MASTER-GAP-TRACKER.md#L76).

Recorded status: **U** (see inventory legend).

Coded/evidence: Named page-plan recipes and drawing settings; editable native reorder/Bates sequences with sealed review/save; named definitions and exact-source editable draft recovery. Standalone native full-source combination is integrated and compiled October 9. Native multi-source combine can now chain reorder/Bates continuation with final-page/source mappings and sealed saving.

Still required: OCR/print/other chained runner stages, combined workflow definitions/recovery, durable interrupted-job resume and current execution/cancel/storage/preservation/source-binding acceptance.

### M07.08

M07.08 — **Recover interrupted jobs:** let users retry/discard failed or canceled jobs without confusing partial output for completed work.

Source: [MASTER-GAP-TRACKER.md:77](../MASTER-GAP-TRACKER.md#L77).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Older known-job cleanup/recovery subsets tested; newer source recipes and batch retry/discard coded.

Still required: Abrupt death/partial output/disk-full/cleanup failures across all new services and stages.

### M07.09

M07.09 — Search and batch features must not imply broad folder scanning.

Source: [MASTER-GAP-TRACKER.md:78](../MASTER-GAP-TRACKER.md#L78).

Recorded status: **U** (see inventory legend).

Coded/evidence: Search/batch pick exact sources and disclose no broad folder scanning.

Still required: Prove unselected files are never inspected and grants remain scoped through failure/reopen/import.

### M08.01

M08.01 — **Accessibility checks:** inspect tags, reading order, headings, links, and form labels; distinguish searchable OCR from accessible structure.

Source: [MASTER-GAP-TRACKER.md:81](../MASTER-GAP-TRACKER.md#L81).

Recorded status: **U** (see inventory legend).

Coded/evidence: Source-bound metadata/tag/ParentTree/role/heading/figure/table/link/form audit with page/object evidence, human checks, tag repair routing and sealed evidence export is integrated and compiled October 9. Reviewed existing table header IDs/associations/Scope/spans, list numbering and printable leaf Form semantics are integrated and compiled October 9; broader semantic acceptance remains.

Still required: Marked-content coverage, broader semantics, verified standard rule mappings, manual order/focus correctness, assistive technology and PDF/UA/WCAG/508 acceptance.

### M08.02

M08.02 — **Guided accessibility repair:** offer fixes only when results can be validated; don’t promise automatic tagging makes a PDF fully accessible.

Source: [MASTER-GAP-TRACKER.md:82](../MASTER-GAP-TRACKER.md#L82).

Recorded status: **U** (see inventory legend).

Coded/evidence: Existing tag-tree editing plus eligible initial structure creation, reading order, artifact marking, Figure Alt, language and supported table associations are integrated with undo/redo and exact tree/page output review; compiled October 9. Reviewed existing table header IDs/associations/Scope/spans, list numbering and printable leaf Form semantics are integrated and compiled October 9; broader semantic acceptance remains.

Still required: Broader marked-content/nested-form/link/list/table/MCID remediation and recovery; actual semantic, assistive-technology and standards acceptance.

### M08.03

M08.03 — **Document health report:** identify missing fonts, oversized images, broken links, unusual page sizes, unsupported features, and possible print problems; offer safe fixes only where verified.

Source: [MASTER-GAP-TRACKER.md:83](../MASTER-GAP-TRACKER.md#L83).

Recorded status: **U** (see inventory legend).

Coded/evidence: Visible geometry, permitted text problems, internal destinations, structure/form-label observations coded.

Still required: Embedded/missing fonts, oversized images, broader unsupported/print checks; current partial/cancel/report tests and verified safe fixes.

### M08.04

M08.04 — **Trustworthy file details:** show page dimensions/orientation/count, file size, text searchability, encryption state, and feature limits.

Source: [MASTER-GAP-TRACKER.md:84](../MASTER-GAP-TRACKER.md#L84).

Recorded status: **U** (see inventory legend).

Coded/evidence: Snapshot dimensions/rotation/count/size/hash/metadata/permissions/text scope and all-page geometry coded.

Still required: Actual diverse-file accuracy, current permission Set handling, partial/cancel/error/export and accessibility tests.

### M08.05

M08.05 — **Accessible job status:** announce progress, failures, and cancellation to keyboard and screen-reader users.

Source: [MASTER-GAP-TRACKER.md:85](../MASTER-GAP-TRACKER.md#L85).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Older workflows have tested statuses/keyboard names; new workflows contain progress/error/cancel announcements.

Still required: Screen-reader confirmation of every current job/dialog, errors, focus transitions and cancellation.

### M08.06

M08.06 — **Scalable interface:** test larger text, contrast, visible focus, keyboard navigation, and reduced motion throughout dialogs/workflows.

Source: [MASTER-GAP-TRACKER.md:86](../MASTER-GAP-TRACKER.md#L86).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Minimum-window/focus/keyboard subsets tested; larger text/contrast/reduced-motion controls coded.

Still required: All workflows at large text/high contrast, assistive technology, high DPI and multi-monitor screens.

### M08.07

M08.07 — **Print preview:** inspect prepared output, selected pages, paper, orientation, scaling, annotations, and rasterization before Windows handoff.

Source: [MASTER-GAP-TRACKER.md:87](../MASTER-GAP-TRACKER.md#L87).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Older bounded prepared output tested; full range/paper/layout/tile/booklet preview coded.

Still required: Verify exact current preview equals handoff, annotation choices/resolution/clipping/cancel and memory limits.

### M08.08

M08.08 — Physical printer validation remains a release check; simulated preparation alone does not prove paper output.

Source: [MASTER-GAP-TRACKER.md:88](../MASTER-GAP-TRACKER.md#L88).

Recorded status: **N** (see inventory legend).

Coded/evidence: Historical OS handoff used mocked completion; no accepted physical-printer evidence.

Still required: Print ordinary and large-sheet/tiled/booklet/form/annotation copies on real printers.

### M09.01

M09.01 — **Share local copies:** provide Windows share handoff for a new copy. For cloud links/uploads, show service, account, destination, and permissions before sending.

Source: [MASTER-GAP-TRACKER.md:91](../MASTER-GAP-TRACKER.md#L91).

Recorded status: **N** (see inventory legend).

Coded/evidence: New-copy export exists; Windows Share handoff and cloud share links are absent.

Still required: Local copy handoff; future cloud service/account/destination/permission/consent handling.

### M09.02

M09.02 — **Transfer history:** if online AI/sharing is added, show what files were sent, to which endpoint/service, and when; allow cleanup.

Source: [MASTER-GAP-TRACKER.md:92](../MASTER-GAP-TRACKER.md#L92).

Recorded status: **U** (see inventory legend).

Coded/evidence: Provider request/history/privacy-cleanup code records online context disclosures.

Still required: Actual provider/request/error/cancel/log/redaction/cleanup checks; cloud-share transfer history if sharing is added.

### M09.03

M09.03 — **Optional AI providers/agents:** scope each request to selected files; show provider, model, endpoint, destination, and possible account charges before transfer.

Source: [MASTER-GAP-TRACKER.md:93](../MASTER-GAP-TRACKER.md#L93).

Recorded status: **U** (see inventory legend).

Coded/evidence: Explicit connection/context/request review and provider calls coded.

Still required: Provider interoperability/timeouts/errors/consent/account-charge/context/source checks; expanded agent runtimes.

### M09.04

M09.04 — **Cited answers:** provide page/line references where available and distinguish source text from generated explanation.

Source: [MASTER-GAP-TRACKER.md:94](../MASTER-GAP-TRACKER.md#L94).

Recorded status: **U** (see inventory legend).

Coded/evidence: Read-only answers and source page/line references/navigation coded.

Still required: Exact citation/source offsets, generated-vs-source text, uncertain OCR and malformed-response tests.

### M09.05

M09.05 — **Read-only AI by default:** treat document contents as untrusted; prevent automatic saving/exporting/overwriting/tool use. Require separate approval and a reviewable result for changes.

Source: [MASTER-GAP-TRACKER.md:95](../MASTER-GAP-TRACKER.md#L95).

Recorded status: **U** (see inventory legend).

Coded/evidence: No automatic file-write/tool route; scoped context and proposed-answer review coded.

Still required: Adversarial document/provider injection tests, no implicit grants/actions, privacy and source retention.

### M09.06

M09.06 — **Connection controls:** test, select, and remove connections; store secrets using Windows-backed secure storage and fail closed if unavailable.

Source: [MASTER-GAP-TRACKER.md:96](../MASTER-GAP-TRACKER.md#L96).

Recorded status: **U** (see inventory legend).

Coded/evidence: Windows secure-storage connection/model/test/remove controls coded, fail-closed intent.

Still required: Real secure-storage unavailable/locked/error/remove cases, request cancellation, endpoint/model validation and no leaked keys.

### M09.07

M09.07 — **Hermes:** evaluate its documented HTTP API before implementing.

Source: [MASTER-GAP-TRACKER.md:97](../MASTER-GAP-TRACKER.md#L97).

Recorded status: **L** (see inventory legend).

Coded/evidence: Evaluation requirement recorded; generic supported provider routes do not prove Hermes integration.

Still required: Identify/verify documented API, capabilities/authentication/privacy; implement a bounded adapter only after evaluation.

### M09.08

M09.08 — **Harness:** defer until the exact product/interface is identified.

Source: [MASTER-GAP-TRACKER.md:98](../MASTER-GAP-TRACKER.md#L98).

Recorded status: **L** (see inventory legend).

Coded/evidence: Exact product/interface still unidentified; deferred by requirement.

Still required: Resolve product/API before adapter design; do not invent integration.

### M09.09

M09.09 — **Windows lifecycle:** installer, uninstaller, updates, optional file associations, and Open with PDFix.

Source: [MASTER-GAP-TRACKER.md:99](../MASTER-GAP-TRACKER.md#L99).

Recorded status: **U** (see inventory legend).

Coded/evidence: Open-with intake/association metadata, portable development package and install/uninstall scripts coded; old package built only.

Still required: Real install/upgrade/uninstall/Open With, signing/icon branding, current package, update/rollback and clean-machine acceptance.

### M09.10

M09.10 — **Release readiness:** security, licensing, dependency/SBOM, performance, clean-machine install, and real-file corpus reviews.

Source: [MASTER-GAP-TRACKER.md:100](../MASTER-GAP-TRACKER.md#L100).

Recorded status: **U** (see inventory legend).

Coded/evidence: Locked dependencies/notices, bounded source/build inventories and older safety tests exist.

Still required: Full security/license/SBOM/provenance, performance/large corpus/accessibility/clean-machine review and scope-specific beta acceptance.

### M10.01

M10.01 — Later candidates: online signature requests/tracking, shared/cloud review, online form response collection, PDF/A or PDF/X validation, tagged-PDF validation, accessibility repair, and Bates numbering. Each needs a clear user need and reviewed engine/service before it appears as working.

Source: [MASTER-GAP-TRACKER.md:103](../MASTER-GAP-TRACKER.md#L103).

Recorded status: **L** (see inventory legend).

Coded/evidence: Practical profile-based preflight with source-bound page/font/image/color/transparency/output-intent evidence and report exports is integrated and compiled October 9; existing Bates groundwork is coded. Online services, standards validation/output and broad repair remain later adopted work.

Still required: Reviewed validators/services and explicit requirements before adding working claims.

### M10.02

M10.02 — Keep bulk signature/payment workflows, PDF portfolios, barcode fields, advanced print-shop color/trapping, geospatial/3D measurement, embedded multimedia, presentation generation, and CAD model editing out of the initial scope unless the direction changes.

Source: [MASTER-GAP-TRACKER.md:104](../MASTER-GAP-TRACKER.md#L104).

Recorded status: **X** (see inventory legend).

Coded/evidence: Bulk signing/payments, portfolios/barcodes, print-shop color/trapping, geospatial/3D, multimedia, presentation generation and CAD editing excluded. Source-bound geospatial CRS/calibration inventory, supported coordinate/path queries and page/layer workspace are integrated and compiled October 9; accuracy remains unknown.

Still required: Do not count excluded items as missing beta features unless the user changes scope.

## Every Bluebeam drawing-review requirement

### B01

**B01 — Open Revu-produced PDFs and show existing markup artwork.** Start with normal PDF annotation objects and saved appearances. Retain original files. Show unsupported annotation types or missing appearances clearly instead of silently dropping them. Cover rotated/cropped large sheets and printed sheet labels.

Source: [BLUEBEAM-COMPATIBILITY-PLAN.md:7](../BLUEBEAM-COMPATIBILITY-PLAN.md#L7).

Recorded status: **U** (see inventory legend).

Coded/evidence: Standard annotation artwork/metadata handling and unsupported cases coded.

Still required: Authorized Revu originals with rotated/cropped/large sheets, missing appearances, flattened marks and uncommon fonts.

### B02

**B02 — Drawing-wide Comments / Markups panel.** Show page/sheet, subject, comment text, author, creation/modification dates, type and color where present. Search and filter by text, author, sheet, type and status; sort and retain stable selection. Selecting a row jumps to and highlights its exact drawing location. The panel can collapse and resize without losing the current sheet or selected row.

Source: [BLUEBEAM-COMPATIBILITY-PLAN.md:8](../BLUEBEAM-COMPATIBILITY-PLAN.md#L8).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Search/filter/sort/page/reply-state/metadata and row-to-location navigation coded. October 11: automatic inspection, selected-comment actions/reasons and New comment route coded. Standard local Text fixture inspection, navigation and selected-page routing passed; no real Revu compatibility claim.

Still required: Real Revu row identity/location/selection, panel resize/collapse, huge inventories and malformed data tests.

### B03

**B03 — Replies, review states and locks.** Reconstruct supported parent/reply relationships, including multi-level threads, and display original review-state values/history without inventing missing data. Distinguish missing parents, duplicate IDs and unsupported proprietary states. Display lock/read-only flags. Subsequent supported reply/status editing must preserve provenance and require an actual output review.

Source: [BLUEBEAM-COMPATIBILITY-PLAN.md:9](../BLUEBEAM-COMPATIBILITY-PLAN.md#L9).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Supported relationships/history/read-only flags and preserving additive reply/plain-comment editing coded. October 11: a supported plain Text comment edit and new note saved to reviewed copies; independent reopen confirmed exact page-two text and retained source note on addition. Broader replies/states/private/locked/foreign cases remain pending.

Still required: Multi-level/missing-parent/duplicate/private-state/locked/provenance and Revu reopen tests.

### B04

**B04 — Preserve other people's markups when making a copy.** Every writer must disclose whether it retains comments, appearances, replies, author/date, flags, identifiers, layers and unknown extension dictionaries. Retain unknown data when a verified preservation route supports it; otherwise refuse the write or disclose an explicit reviewed conversion. No automatic flattening or rewriting of foreign comments. A displayed comment is not evidence that an export preserves it.

Source: [BLUEBEAM-COMPATIBILITY-PLAN.md:10](../BLUEBEAM-COMPATIBILITY-PLAN.md#L10).

Recorded status: **U** (see inventory legend).

Coded/evidence: Declared-object graph and retained-data validation code exists in supported copy writers; preserving reorder added.

Still required: Execute unknown/private/appearance/reply/identifier/layer retention tests in every writer and Revu.

### B05

**B05 — Review reports and comment exchange.** Export a reviewed CSV and readable report with page references, stable markup IDs, parent IDs, comments, dates, authors and available states; show omitted/unsupported data. Keep spreadsheet formulas inert. Evaluate standard FDF/XFDF interoperability and a separate adapter for Bluebeam BAX/XML only after format, licensing and sample-file evaluation. Round-trip import remains gated on preservation checks.

Source: [BLUEBEAM-COMPATIBILITY-PLAN.md:11](../BLUEBEAM-COMPATIBILITY-PLAN.md#L11).

Recorded status: **U** (see inventory legend).

Coded/evidence: TXT/CSV/JSON reports and 11-type standard XFDF export plus supported import coded. Supported native FDF comment import/export integrated and compiled October 9, with explicit mapping omissions and actual prepared PDF review.

Still required: Current XFDF/FDF/Revu round trips and omission/appearance/private-field acceptance; wider FDF, BAX and BTX/private adapters remain unfinished.

### B06

**B06 — Revision clouds, arrows and callouts.** Add these beside existing notes/highlights; support consistent review colors, clear subjects and reusable locally stored styles. Preview the exact PDF markups and preserve unrelated foreign markups before saving a copy.

Source: [BLUEBEAM-COMPATIBILITY-PLAN.md:17](../BLUEBEAM-COMPATIBILITY-PLAN.md#L17).

Recorded status: **U** (see inventory legend).

Coded/evidence: New drawing tools with color/subjects/styles and reviewed copy paths coded.

Still required: Artwork/geometry/undo/crop/rotation/retention/print and Revu compatibility tests.

### B07

**B07 — Compare revised drawings.** Extend current comparison with aligned transparent/color overlays, synchronized zoom/pan and clear old/new sheet labels. Support manual alignment when drawings shift. Proposed changes need human review; a pixel difference does not prove a design change.

Source: [BLUEBEAM-COMPATIBILITY-PLAN.md:18](../BLUEBEAM-COMPATIBILITY-PLAN.md#L18).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Older comparison tested; new aligned/cyan-magenta/transparent overlays coded.

Still required: Shifted/scaled/rotated drawing alignment, zoom/pan/labels, large-sheet behavior and human interpretation.

### B08

**B08 — Sheet sets and controlled revision replacement.** Group related PDFs/sheets, use printed sheet numbers/titles when available, and provide fast navigation. Propose old/new matches by sheet label or explicit user mapping. Preview missing/duplicate matches and decide where old-version comments belong before replacing sheets; never silently transfer a comment to the wrong revision.

Source: [BLUEBEAM-COMPATIBILITY-PLAN.md:19](../BLUEBEAM-COMPATIBILITY-PLAN.md#L19).

Recorded status: **U** (see inventory legend).

Coded/evidence: Ordered source-linked sets and explicit new revision reference review coded. October 11 batch: October 11: actual contained same-geometry revision writer and UI connected. Known output pair independently reopened, carried/imported comments/private values and stable source pages verified; originals unchanged. Broader transformed/Revu/large/dependency cases remain.

Still required: Real multi-file changes/relink/recovery/navigation tests; physical replacement and comment carry-forward.

Dated implementation status: coded and narrow known-fixture writer passed; full revision/sheet-set/Revu scope remains open. Existing preserving page-order workspace launches the real reviewed original/donor/output revision dialog with per-page comment/geometry choices and original identities.

### B09

**B09 — Review navigation for large drawings.** Zoom to a selected markup, return to the previous view, keep a selected thread visible during zoom/pan, and show sheet/revision context in fullscreen and focus mode. Stable text/region selection on unusual layouts stays an existing core requirement.

Source: [BLUEBEAM-COMPATIBILITY-PLAN.md:20](../BLUEBEAM-COMPATIBILITY-PLAN.md#L20).

Recorded status: **H+U** (see inventory legend).

Coded/evidence: Older generic fullscreen/panes tested; comment jump/zoom/return/review-panel code newer. October 7: artwork fullscreen and hand/pointer zoom implemented and compiled; current runtime acceptance pending. Zoom-region/view history added October 7. Current runtime acceptance pending.

Still required: R40 PDF-only fullscreen, large-sheet/high-DPI/view-state retention and collapsed review-panel tests.

### B10

**B10 — Reusable review stamps and tools.** Save approved local styles/templates, such as reviewed, revise and approved, with local-library deletion controls. Distinguish visual review stamps from certificate signatures. Evaluate Bluebeam BTX tool-set import separately; do not assume a proprietary tool set is a PDF.

Source: [BLUEBEAM-COMPATIBILITY-PLAN.md:21](../BLUEBEAM-COMPATIBILITY-PLAN.md#L21).

Recorded status: **U** (see inventory legend).

Coded/evidence: Local style presets, decoration templates and portable review drafts coded.

Still required: Create/apply/export/import/delete/recovery/appearance tests; proprietary .btx/tool-set evaluation separate.

### B11

**B11 — Custom markup columns and quantities.** Inspect PDF-embedded custom data and retain its original meaning/type where understood; show unknown values as unsupported rather than coercing them. Evaluate material, discipline, assigned reviewer and other available custom columns. Do not fabricate data that lives only in a Bluebeam profile. Editing/export must verify retained values and distinguish raw source quantities from PDFix calculations.

Source: [BLUEBEAM-COMPATIBILITY-PLAN.md:27](../BLUEBEAM-COMPATIBILITY-PLAN.md#L27).

Recorded status: **U** (see inventory legend).

Coded/evidence: PDFixData structured takeoff metadata/recovery/editing coded.

Still required: Bluebeam private/custom columns/quantity decoding/exchange not implemented; evaluate formats and real fixtures.

### B12

**B12 — Measurements and quantity takeoffs.** Extend current temporary calibrated distance/perimeter/area tools with reviewed persistent measurement markups, counts, grouped totals, unit conversion, sheet-specific scale and exportable quantities. Require calibration and disclose precision. Large-sheet printing, layers and measurement remain linked to existing M03 requirements.

Source: [BLUEBEAM-COMPATIBILITY-PLAN.md:28](../BLUEBEAM-COMPATIBILITY-PLAN.md#L28).

Recorded status: **U** (see inventory legend).

Coded/evidence: Distance/perimeter/area/count annotations, totals, recovery and supported update copies coded.

Still required: Known quantities, unit/scale/geometry/source proofs, appearance preservation/recovery/real Revu and printed output tests.

## All future features, including the 20 free additions and digital pen

### F01

F01 | PDF-only fullscreen | R40 artwork mode, auto-hiding exit, keyboard entry/navigation and previous-view restoration coded October 7; runtime/DPI/focus/transition acceptance pending.

Source: [PDFIX-FUTURE-FEATURES.md:13](../PDFIX-FUTURE-FEATURES.md#L13).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### F02

F02 | Comfortable/compact reading appearance | Larger UI text/contrast controls are coded; Compact/Comfortable reading density coded October 7; consistent reader/dialog behavior and runtime acceptance remain.

Source: [PDFIX-FUTURE-FEATURES.md:14](../PDFIX-FUTURE-FEATURES.md#L14).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### F03

F03 | Reliable selection on complex PDFs | Single-pointer rectangle selection with page/geometry cleanup and row/column/content-order copy previews is coded and compiled October 9. Complex layout, vertical/rotated writing and runtime acceptance remain.

Source: [PDFIX-FUTURE-FEATURES.md:15](../PDFIX-FUTURE-FEATURES.md#L15).

Dated implementation status: coded, current acceptance pending. Single-pointer bounded rectangle selection, page/geometry invalidation, explicit row/two-column/three-column/content order, exact copy preview and direction-aware row grouping integrated and compiled October 9. Rotated or mirrored rectangle geometry is refused where ambiguous. Complex layouts, vertical writing and runtime acceptance remain.

### F04

F04 | More capable large-sheet navigation | Hand/pointer zoom plus zoom-to-region and session Previous/Next view history coded October 7. Synchronized navigation, DPI/monitor/very-large-drawing behavior and current acceptance remain.

Source: [PDFIX-FUTURE-FEATURES.md:16](../PDFIX-FUTURE-FEATURES.md#L16).

Dated implementation status: coded, current acceptance pending. Hand/pointer zoom plus zoom-to-region and session Previous/Next view history coded October 7. Synchronized navigation, DPI/monitor/very-large-drawing behavior and current acceptance remain. Source-derived large-PDF queue backpressure, bounded nearby-read coalescing, native RAM/CPU/graphics capacity estimates and adaptive preview/read budgets are coded and compiled October 7. Actual large-file and performance acceptance remain pending.

### F05

F05 | More page selection/split recipes | Bookmark/range recipes and actual encoded file-size splitting integrated and compiled October 9. Size/work budgets and single-page refusals apply; current acceptance remains.

Source: [PDFIX-FUTURE-FEATURES.md:17](../PDFIX-FUTURE-FEATURES.md#L17).

Dated implementation status: coded, current acceptance pending. Bookmark/range recipes plus actual encoded file-size splitting are integrated and compiled October 9. Budget/one-page refusals are explicit; preservation and current runtime acceptance remain.

### F06

F06 | Broader page/object preservation | Current standard organizer and separate preserving reorder; preserve comments/forms/links/bookmarks/unknown data across more insert/delete/replace/combine operations.

Source: [PDFIX-FUTURE-FEATURES.md:18](../PDFIX-FUTURE-FEATURES.md#L18).

Dated implementation status: coded subsets integrated and compiled; current acceptance pending. Standalone contained native full-source combination is integrated and compiled, including supported graph/object preservation, form and destination namespaces, grouped bookmarks, exact-source review and native sealed saving. Partial/duplicate pages, tagged/layered/label/private catalog reconciliation and runtime fidelity acceptance remain.

### F07

F07 | Drag pages between PDFs | Chosen-source drag/copy, output reorder, reviewed insertion/source mapping, keyboard alternatives and undo/redo coded October 7. Broader object preservation and current acceptance remain.

Source: [PDFIX-FUTURE-FEATURES.md:19](../PDFIX-FUTURE-FEATURES.md#L19).

Dated implementation status: coded subsets integrated and compiled; current acceptance pending. Existing chosen-source drag/copy/reorder remains coded. Standalone native full-source combination now supports cross-source page permutation with reviewed mappings and sealed saving. Partial extraction/insertion, duplicate identity policies, broader preservation and current acceptance remain.

### F08

F08 | Broader drawing comparison | Local text/dimension/artwork matching proposals, manual correction, reviewed counterpart mappings and unmatched-page handling coded October 7. High-resolution/sensitivity/alignment expansion and drawing-corpus acceptance remain.

Source: [PDFIX-FUTURE-FEATURES.md:20](../PDFIX-FUTURE-FEATURES.md#L20).

Dated implementation status: coded, current acceptance pending. Local text/dimension/artwork matching proposals, manual correction, reviewed counterpart mappings and unmatched-page handling coded October 7. High-resolution/sensitivity/alignment expansion and drawing-corpus acceptance remain.

### F09

F09 | Source/output comparison for more formats | Current PDF comparison; review actual document/office/image conversions and changed fonts/tables/page breaks against original content.

Source: [PDFIX-FUTURE-FEATURES.md:21](../PDFIX-FUTURE-FEATURES.md#L21).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### F10

F10 | More complete document/PDF editing | New glyphs/fonts/shaping/reflow, wider original/nested PDF text/image cases, richer Word/slide layouts, rich/multi-section bands and source-preservation evidence.

Source: [PDFIX-FUTURE-FEATURES.md:22](../PDFIX-FUTURE-FEATURES.md#L22).

Dated implementation status: coded, current acceptance pending. Supported formatted authored header/footer runs export to DOCX/RTF/PDF; explicit single-section DOCX band imports and additional already-mapped embedded TrueType simple glyph proofs are coded. Broad imports, source font edits/new mappings, shaping/reflow and current corpus acceptance remain.

### F11

F11 | Wider conversion and photo handling | Tested conversions with explicit preservation choices; original orientation, color profiles and metadata options, and clear lossy-output review.

Source: [PDFIX-FUTURE-FEATURES.md:23](../PDFIX-FUTURE-FEATURES.md#L23).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### F12

F12 | Additional file decoders | Supported classic multipage TIFF including MH/Group 3/Group 4 fax decoding and reviewed page import is integrated and compiled October 9. Wider TIFF, HEIC/HEIF, legacy DOC/XLS/PPT and Apple Pages/Numbers/Keynote remain, with decoder/licensing/corpus acceptance.

Source: [PDFIX-FUTURE-FEATURES.md:24](../PDFIX-FUTURE-FEATURES.md#L24).

Dated implementation status: coded subsets integrated and compiled; current acceptance pending. Classic TIFF now includes actual bounded CCITT Modified Huffman/Group 3/Group 4 strip decoding plus previous uncompressed/PackBits/LZW/Deflate modes. Reviewed oriented PNG import is integrated and compiled. BigTIFF/JPEG/tiles/wider colors/depth/profiles, other decoders and runtime correctness/fidelity acceptance remain.

### F13

F13 | Live Photo components | Recognize separately supplied still/motion assets and explicit exports; no fabricated missing motion component. Depends on decoder/metadata work.

Source: [PDFIX-FUTURE-FEATURES.md:25](../PDFIX-FUTURE-FEATURES.md#L25).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### F14

F14 | Direct scanner/document-camera capture | Actual Windows device integration, multi-page acquisition/preview/order/rotate/remove/cancel and bounded security handling.

Source: [PDFIX-FUTURE-FEATURES.md:26](../PDFIX-FUTURE-FEATURES.md#L26).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### F15

F15 | More OCR languages and better quality | Bundled/installed language selection, wider output fonts and mixed-language/poor-scan/handwriting limitations. Printed English is the current tested subset.

Source: [PDFIX-FUTURE-FEATURES.md:27](../PDFIX-FUTURE-FEATURES.md#L27).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### F16

F16 | Better scan cleanup and uncertainty review | Current deskew/tone/blank/confidence code needs accuracy tests; expand low-resolution/faint/skew/crop/rotated sources and recoverable corrections.

Source: [PDFIX-FUTURE-FEATURES.md:28](../PDFIX-FUTURE-FEATURES.md#L28).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### F17

F17 | Stronger table extraction | Reviewed CSV, source-bound correction drafts and contained literal XLSX export with exact cell readback are coded. Merged/irregular/rotated tables, automatic reconstruction and runtime/Excel acceptance remain.

Source: [PDFIX-FUTURE-FEATURES.md:29](../PDFIX-FUTURE-FEATURES.md#L29).

Dated implementation status: coded, current acceptance pending. Reviewed manual rectangular merge/split corrections preserve anchor text and require empty covered cells; portable drafts, CSV disclosure and literal XLSX merge readback are coded. Irregular/rotated extraction accuracy, automatic reconstruction and runtime/Excel acceptance remain.

### F18

F18 | Broader forms and signing assistance | Reviewed supported-page custom tab order, numbered widgets, undo/recovery and native output verification are coded and compiled October 9. Wider appearance fonts, tagged/mixed navigation, declarative/source logic and current runtime acceptance remain.

Source: [PDFIX-FUTURE-FEATURES.md:30](../PDFIX-FUTURE-FEATURES.md#L30).

Dated implementation status: coded subsets integrated and compiled; current acceptance pending. Reviewed custom supported-page widget order, overlays, apply/undo/recovery and source-bound native order retention are integrated and compiled October 9. Broader forms/appearance/source logic and viewer/runtime acceptance remain.

### F19

F19 | Certificate signature validation | Reviewed integrity/identity/trust results and edit warnings; visual signing and signature-presence reporting remain separate.

Source: [PDFIX-FUTURE-FEATURES.md:31](../PDFIX-FUTURE-FEATURES.md#L31).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### F20

F20 | Wider third-party markup preservation | Broader annotations, appearances, reply/status/lock/provenance/unknown-data retention and actual round trips, especially dad's Revu drawings.

Source: [PDFIX-FUTURE-FEATURES.md:32](../PDFIX-FUTURE-FEATURES.md#L32).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### F21

F21 | Broader review exchange and reusable tools | Supported native FDF comment import/export is integrated and compiled October 9 alongside XFDF/JSON/stamp/style code. Broader FDF/form data/appearance, BAX/BTX/private adapters and actual Revu interchange remain.

Source: [PDFIX-FUTURE-FEATURES.md:33](../PDFIX-FUTURE-FEATURES.md#L33).

Dated implementation status: coded subsets integrated and compiled; current acceptance pending. Supported native FDF comment exchange integrated and compiled October 9 with bounded inert import/export, original-preserving copy, disclosed omissions and token-only saving. Wider FDF/form data/appearance coverage, BAX/BTX/private Bluebeam adapters and actual interchange acceptance remain.

### F22

F22 | Richer sheet revision handling | October 11: reviewed native physical artwork replacement with exact-geometry original comment retention, donor comments and stable page/private graph preservation is coded; a contained known-pair output/reopen passed. Coordinate transforms, larger pairs, unsupported dependencies, metadata/relink expansion and actual Revu remain.

Source: [PDFIX-FUTURE-FEATURES.md:34](../PDFIX-FUTURE-FEATURES.md#L34).

Dated implementation status: coded preserving same-geometry revision subset; focused contained writer/reopen passed; full scope remains open. Physical sheet replacement, explicit exact-geometry source-comment retention and donor comments with stable original page IDs, private/appearance graph preservation, original-safe reviewed new-copy save. Source/donor original hashes and independently reopened known-fixture note/private data passed. Transforms, unsupported dependencies, larger pairs, proprietary/locked semantics and actual Revu remain.

### F23

F23 | Bluebeam custom data and takeoff interoperability | Decode understood PDF-embedded custom columns/quantities without fabricating profile-only values; extend current PDFix takeoff metadata and unit/scale workflows.

Source: [PDFIX-FUTURE-FEATURES.md:35](../PDFIX-FUTURE-FEATURES.md#L35).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### F24

F24 | Broader compression | Wider real image/filter/color/form files and reviewed optimization choices; current code does not promise existing-JPEG recompression/downsampling.

Source: [PDFIX-FUTURE-FEATURES.md:36](../PDFIX-FUTURE-FEATURES.md#L36).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### F25

F25 | Vector-preserving redaction | Remove selected source text/image/objects while retaining unmarked vector artwork, with forensic proofs and recovery; current secure mode rebuilds image-only pages.

Source: [PDFIX-FUTURE-FEATURES.md:37](../PDFIX-FUTURE-FEATURES.md#L37).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### F26

F26 | More complete sanitation/security coverage | Contained DOCX/RTF, bookmarks, decorations/Bates, attachment inspection/decoding, source-bound web destinations, literal table XLSX and supported batch PDF text routes are coded. Other native families, Chromium image/OCR/PDF decode, hidden structures and effective OS security acceptance remain.

Source: [PDFIX-FUTURE-FEATURES.md:38](../PDFIX-FUTURE-FEATURES.md#L38).

Dated implementation status: coded, current acceptance pending. Contained DOCX/RTF, bookmarks, decorations/Bates, attachment decoding, web destinations, table XLSX, supported batch PDF text, fillable-field inspection/creation and document-generated PDF output inspection are coded. Initial form inspection supports source-bound cancellation. Other native families, Chromium image/OCR/PDF decode and OS security acceptance remain. Existing fill inspection/writing now uses the fixed contained engine, preservation verification and native token-only saving; compiled October 9.

### F27

F27 | More batch actions | Compression plus reviewed source-sealed PDF copy/rename and narrowly supported literal TXT queues are coded, with chosen new folders, keep-both names, individual results and cancellation. Wider conversions/combine/workflow batches and current acceptance remain.

Source: [PDFIX-FUTURE-FEATURES.md:39](../PDFIX-FUTURE-FEATURES.md#L39).

Dated implementation status: coded subsets integrated and compiled; current acceptance pending. Existing batch copies/text/compression remain coded. Continuous multi-file native Bates queue/report now integrated and compiled. Wider conversions/workflow batches, durable resume and current runtime acceptance remain.

### F28

F28 | Editable multi-step workflows | Native reorder/Bates with definitions/drafts, plus native combine → reorder/Bates continuation, integrated and compiled October 9. OCR/print/other stages, saved combined definitions, in-flight resume and runtime acceptance remain.

Source: [PDFIX-FUTURE-FEATURES.md:40](../PDFIX-FUTURE-FEATURES.md#L40).

Dated implementation status: coded subsets integrated and compiled; current acceptance pending. Native combination now chains editable preserving reorder/Bates continuation stages in either order, integrated and compiled with mapped final-page review and sealed save. Single-source definitions/draft recovery remain coded. OCR/print/general stages, saved combined definitions, durable in-flight resume and runtime acceptance remain.

### F29

F29 | Complete health/accessibility inspection | Embedded/missing fonts, oversized images, broader print issues, actual tags/reading order/headings/link/form semantics and carefully scoped results.

Source: [PDFIX-FUTURE-FEATURES.md:41](../PDFIX-FUTURE-FEATURES.md#L41).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### F30

F30 | Guided accessibility repair | Only reviewed repairs with validated semantics/results; tagging or OCR alone never establishes accessible output.

Source: [PDFIX-FUTURE-FEATURES.md:42](../PDFIX-FUTURE-FEATURES.md#L42).

Dated implementation status: coded subsets integrated and compiled; current acceptance pending. Existing table tag semantics now support authoring header IDs/IDTree, same-table Headers/Scope/spans and bounded consistent grids; ListNumbering and printable leaf Form properties are editable with preserving output and awaited lifecycle. Broader tree manipulation/namespace/class remediation, assistive-technology and standards acceptance remain.

### F31

F31 | Windows local sharing | Share a newly exported local copy through Windows handoff, with a clear destination and no original mutation.

Source: [PDFIX-FUTURE-FEATURES.md:43](../PDFIX-FUTURE-FEATURES.md#L43).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### F32

F32 | Finished Windows lifecycle | Branded/signed installer, clean-machine install/upgrade/uninstall, optional Open With/associations/default-reader flow, updates/rollback and user-data safety.

Source: [PDFIX-FUTURE-FEATURES.md:44](../PDFIX-FUTURE-FEATURES.md#L44).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### F33

F33 | Final brand derivatives | Separate inspected executable/app icons, small/light/dark/monochrome variants, licensing/provenance; preserve the supplied master unchanged.

Source: [PDFIX-FUTURE-FEATURES.md:45](../PDFIX-FUTURE-FEATURES.md#L45).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### F34

F34 | Broader selected-file AI | Real provider acceptance, image-capable context when consented, better citation/uncertainty handling and separately approved proposed edits; no automatic file tools.

Source: [PDFIX-FUTURE-FEATURES.md:46](../PDFIX-FUTURE-FEATURES.md#L46).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### F35

F35 | Hermes / Harness / agent integrations | Hermes requires documented API/capability/authentication verification; Harness requires identifying the exact product. Generic provider code is not named integration proof.

Source: [PDFIX-FUTURE-FEATURES.md:47](../PDFIX-FUTURE-FEATURES.md#L47).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### F36

F36 | Cloud/shared reviews and links | Identified service/account, authentication, selected destination/permissions, transfer consent/history and no implied public link.

Source: [PDFIX-FUTURE-FEATURES.md:64](../PDFIX-FUTURE-FEATURES.md#L64).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### F37

F37 | Bluebeam Studio Sessions/Projects | Supported API/licensing/account/privacy evaluation; opening a local Revu PDF does not fetch session-only data or connect to Studio.

Source: [PDFIX-FUTURE-FEATURES.md:65](../PDFIX-FUTURE-FEATURES.md#L65).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### F38

F38 | Online forms and response collection | Reviewed collection service, explicit submission destination, privacy/permission and response handling. Existing local form saving is separate.

Source: [PDFIX-FUTURE-FEATURES.md:66](../PDFIX-FUTURE-FEATURES.md#L66).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### F39

F39 | External signature requests, tracking and templates | Evaluated service/authentication/consent and clear separation from visual signatures and certificate validation.

Source: [PDFIX-FUTURE-FEATURES.md:67](../PDFIX-FUTURE-FEATURES.md#L67).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### F40

F40 | PDF/A, PDF/X and tagged-PDF validation/output | Reviewed standards engines/validators and actual corpus/compliance evidence; appearance/file extension is insufficient.

Source: [PDFIX-FUTURE-FEATURES.md:68](../PDFIX-FUTURE-FEATURES.md#L68).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### F41

F41 | Bates numbering | Single-file numbering and continuous multi-file reviewed queue/report are integrated and compiled October 9. Persistent/global registry, existing-ID/artwork detection, wider fonts/limits and runtime acceptance remain.

Source: [PDFIX-FUTURE-FEATURES.md:69](../PDFIX-FUTURE-FEATURES.md#L69).

Dated implementation status: coded subsets integrated and compiled; current acceptance pending. Multi-file continuous Bates queue is integrated and compiled with selected physical-page ranges, numbering advancement after verified save, paired every-page review, native new folders and identifier report. Durable/global registries, existing-ID/artwork detection, wider limits/fonts and runtime acceptance remain.

### F42

F42 | Wider release acceptance | Full real-world/adversarial corpus, performance, accessibility, physical printing, clean-machine packaging, licensing/SBOM/provenance and independent security review. This is acceptance work rather than a new app feature.

Source: [PDFIX-FUTURE-FEATURES.md:70](../PDFIX-FUTURE-FEATURES.md#L70).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### F43

F43 | Virtual PDF printer | No PDFix virtual printer is implemented. Existing document export and physical-print preparation are separate features. Provide an optional PDFix Windows print destination for other applications, bounded local job capture, paper/orientation settings, review/import/save, cancellation and recovery; choose a free supported integration and complete signing/install/uninstall work.

Source: [PDFIX-FUTURE-FEATURES.md:55](../PDFIX-FUTURE-FEATURES.md#L55).

Addition status: U.

Coded subset: Optional native PDFix queue install/remove/status and printed-PDF review import using installed free Windows PDF driver.

Still required: Automatic capture, spool/job recovery, signing/installer lifecycle and print fidelity/runtime acceptance.

### F44

F44 | Read aloud | No integrated document/PDF read-aloud controller is implemented. Free local text-to-speech, voice/language/speed controls, selected text/current page/document scopes, play/pause/resume/stop, highlighting/source navigation, bounded incremental reading and OCR/reading-order disclosures.

Source: [PDFIX-FUTURE-FEATURES.md:56](../PDFIX-FUTURE-FEATURES.md#L56).

Addition status: U.

Coded subset: Local voice/rate controls, bounded source batches and continuation, play/pause/resume/stop, editor/PDF scopes and progress.

Still required: Semantic/tagged order, additional voice platforms, exact PDF word geometry, scanned/OCR corpus and runtime acceptance.

### F45

F45 | Word count and document statistics | The document editor currently displays a basic whitespace-based word count in src/document-editor.js. This does not implement the complete requested scope. Selection/page/document statistics for supported editor and PDF text; words/characters with and without spaces/paragraphs/pages; language-aware rules, explicit counted scope, cancellation and honest OCR/unsupported-content omissions.

Source: [PDFIX-FUTURE-FEATURES.md:57](../PDFIX-FUTURE-FEATURES.md#L57).

Addition status: U.

Coded subset: Locale-aware words/characters/paragraph statistics and editor/PDF scoped cancellable counting; omissions declared.

Still required: Broader content fidelity and counting-rule corpus; physical editable-document pagination and runtime acceptance.

### F46

F46 | Spell-checking | Desktop native spell-checking is currently disabled; source editor spell-checking is also disabled. No complete review/suggestion/personal-dictionary feature is implemented. Free local dictionary/native-engine integration, language selection, underlines/suggestions, replace/ignore/ignore-all/personal dictionary, undo/recovery and read-only PDF findings linked to supported editing; keep source/code fields opt-in.

Source: [PDFIX-FUTURE-FEATURES.md:58](../PDFIX-FUTURE-FEATURES.md#L58).

Addition status: U.

Coded subset: Local spelling review/suggestions/language/ignore/personal dictionaries, document underlines/approved Undo replacements, read-only PDF page links.

Still required: Form/comment and supported original PDF text-edit replacement integration, mixed-language corpus and runtime acceptance.

### F47

1 | F47 | Automatic form-field detection | Detect candidate blank text fields, checkboxes, dates and signature areas on digital and scanned forms. Show confidence, geometry and editable suggestions before creating fields. | R13 / F18; Forms room; scans depend on bounded OCR/layout analysis.

Source: [FREE-ACROBAT-ADDITIONS-PLAN.md:13](../FREE-ACROBAT-ADDITIONS-PLAN.md#L13).

Dated implementation status: coded; brief source/model checks; full scope remains open. Digital text/vector and opt-in local OCR/dark scan-line proposals are integrated in the builder, with editable reviewed selection and existing real output route. Remaining: Wider geometry, faint/skew/handwriting/marked-state and language/layout detection, robust scan cancellation/shared-worker budgets, real builder output/corpus checks.

Addition status: coded; syntax/model evidence only; broader acceptance pending.

Coded subset: Digital text/vector and opt-in local OCR/dark scan-line proposals are integrated in the builder, with editable reviewed selection and existing real output route.

Still required: Wider geometry, faint/skew/handwriting/marked-state and language/layout detection, robust scan cancellation/shared-worker budgets, real builder output/corpus checks.

### F48

2 | F48 | Smart form autofill | Store names, addresses and reusable values locally; explicitly choose a profile and review proposed values before applying. Edit/delete profiles and exclude passwords/private keys. | Forms room; protected local storage and user-selected matching.

Source: [FREE-ACROBAT-ADDITIONS-PLAN.md:14](../FREE-ACROBAT-ADDITIONS-PLAN.md#L14).

Dated implementation status: coded; narrow runtime storage/model check passed; full scope remains open. OS-protected local profile CRUD/clear, explicit matching/manual mapping/review, protected-field exclusions and one-step-undo application in Fill and Sign. Real encryption/reopen/update/delete/temporary cleanup plus model matching passed. Remaining: Full UI and actual filled-PDF output cases, broader labels/choices, corruption/lock/disk-full, profile edit recovery and OS migration/key rotation.

Addition status: coded; focused storage/model checks passed; broader target/UI/output acceptance pending.

Coded subset: OS-protected local profile CRUD/clear, explicit matching/manual mapping/review, protected-field exclusions and one-step-undo application in Fill and Sign. Real encryption/reopen/update/delete/temporary cleanup plus model matching passed.

Still required: Full UI and actual filled-PDF output cases, broader labels/choices, corruption/lock/disk-full, profile edit recovery and OS migration/key rotation.

### F49

3 | F49 | Automatic form-field labeling | Suggest names, accessible labels, field type and tab order using nearby text; review ambiguous matches and permit correction. | R13 / F18 / F30; form builder and keyboard-order tools.

Source: [FREE-ACROBAT-ADDITIONS-PLAN.md:15](../FREE-ACROBAT-ADDITIONS-PLAN.md#L15).

Dated implementation status: coded; brief source/model checks; full scope remains open. Nearby label/type/confidence/order proposals, editable names/tooltips/geometry and explicitly accepted creation order. Remaining: Document-aware reading/tab-order semantics, date/signature-widget behaviors, structured accessibility and multilingual/corpus checks.

Addition status: coded; syntax/model evidence only; broader acceptance pending.

Coded subset: Nearby label/type/confidence/order proposals, editable names/tooltips/geometry and explicitly accepted creation order.

Still required: Document-aware reading/tab-order semantics, date/signature-widget behaviors, structured accessibility and multilingual/corpus checks.

### F50

4 | F50 | Windows right-click PDF tools | Optional context-menu actions to open, convert, compress or merge selected files. Route to the appropriate reviewed PDFix workspace, preserving selected-file permissions. | F32 / R28; Windows installation/removal and safe argument handling.

Source: [FREE-ACROBAT-ADDITIONS-PLAN.md:16](../FREE-ACROBAT-ADDITIONS-PLAN.md#L16).

Dated implementation status: coded subset; argument/snapshot seed fixture passed; packaged Explorer/registry/UI acceptance pending. Optional per-user PDF-only fixed open/convert/compress/merge verbs, exact package/own-key identity checks, status/install/remove and pending-file review workspace; safe reviewed immutable sources routed to reader/images/compression and preserving combination.

Addition status: coded subset; argument/snapshot seed fixture passed; packaged Explorer/registry/UI acceptance pending.

Coded subset: Optional per-user PDF-only fixed open/convert/compress/merge verbs, exact package/own-key identity checks, status/install/remove and pending-file review workspace; safe reviewed immutable sources routed to reader/images/compression and preserving combination.

Still required: Actual packaged registry install/remove/repair/localized Explorer/selection/path/security/UI/deployment cases, Unicode package paths, more conversion targets and large transform route.

### F51

5 | F51 | Microsoft Word, Excel and PowerPoint shortcuts | Free local export shortcuts and evaluated direct Office integration where compatible. Explicitly declare installed-Office requirements and supported output fidelity. | R16–R20 / F10 / F32; no bundled or required paid Office license.

Source: [FREE-ACROBAT-ADDITIONS-PLAN.md:17](../FREE-ACROBAT-ADDITIONS-PLAN.md#L17).

Addition status: planned; expanded target not newly implemented or tested.

### F52

6 | F52 | Microsoft Edge browser extension | User-triggered handoff of a PDF or web page to PDFix, with exact URL/source and destination review. Use a bounded local native-messaging path; no automatic browsing/history collection. | F32 / A22; optional extension/native host installation and removal.

Source: [FREE-ACROBAT-ADDITIONS-PLAN.md:18](../FREE-ACROBAT-ADDITIONS-PLAN.md#L18).

Addition status: planned; expanded target not newly implemented or tested.

### F53

7 | F53 | Cloud-folder compatibility | Work with Google Drive, OneDrive and Dropbox folders already synchronized on the PC. Handle placeholders, hydration, offline errors, locks, changed sources and provider hardlinks while keeping staging local. | R01/R03/R04/R05; all open/save workflows; no implicit cloud grants or sync guarantees.

Source: [FREE-ACROBAT-ADDITIONS-PLAN.md:19](../FREE-ACROBAT-ADDITIONS-PLAN.md#L19).

Dated implementation status: coded availability/opening subset; one local Windows metadata fixture passed; real provider/UI acceptance pending. Native selected synchronized-file review, short-lived token/identity recheck, explicit provider-download approval, central FileStore availability hook and immutable source snapshot; useful offline/lock/permission/network messages; existing-source aliases stay unchanged.

Addition status: coded availability/opening subset; one local Windows metadata fixture passed; real provider/UI acceptance pending.

Coded subset: Native selected synchronized-file review, short-lived token/identity recheck, explicit provider-download approval, central FileStore availability hook and immutable source snapshot; useful offline/lock/permission/network messages; existing-source aliases stay unchanged.

Still required: Actual Drive/OneDrive/Dropbox placeholders, provider hydration progress/timeouts/cancel, reparse-specific adapters, conflicts/remote versions and cloud/alias/lock/hostile-path/UI/security/device acceptance.

### F54

8 | F54 | Email-to-PDF conversion | Convert standard .eml messages to PDF, retaining supported headers/body and an explicit attachment inventory. Preserve supported attachments through reviewed output where feasible; declare omissions. | F10 / A17; bounded MIME decoding, inert HTML and no remote images/scripts.

Source: [FREE-ACROBAT-ADDITIONS-PLAN.md:20](../FREE-ACROBAT-ADDITIONS-PLAN.md#L20).

Dated implementation status: coded subset; one contained EML fixture passed; full conversion/attachment/output/UI acceptance pending. Native selected EML snapshot -> contained MIME/header/body/inert HTML parser -> reviewed editable document creation using existing PDF export pipeline; explicit attachment inventory and omissions.

Addition status: coded subset; one contained EML fixture passed; full conversion/attachment/output/UI acceptance pending.

Coded subset: Native selected EML snapshot -> contained MIME/header/body/inert HTML parser -> reviewed editable document creation using existing PDF export pipeline; explicit attachment inventory and omissions.

Still required: Attachment preservation/extraction, expanded MIME/charset/layout/corpus support, actual editor/PDF export and original/output UI acceptance.

### F55

9 | F55 | PDF from clipboard | Create a PDF from explicitly pasted text, images or screenshots, with editable arrangement, page settings and reviewed output. | Document/Images rooms; inspect clipboard only after a user action and bound bytes/pixels.

Source: [FREE-ACROBAT-ADDITIONS-PLAN.md:21](../FREE-ACROBAT-ADDITIONS-PLAN.md#L21).

Dated implementation status: coded and compiled; clipboard/UI/runtime acceptance pending. Explicit native text/PNG clipboard action with byte/pixel limits; reviewed ordered editable items; document editor handoff with existing page settings and PDF export.

Addition status: coded and compiled; clipboard/UI/runtime acceptance pending.

Coded subset: Explicit native text/PNG clipboard action with byte/pixel limits; reviewed ordered editable items; document editor handoff with existing page settings and PDF export.

Still required: Actual clipboard/render/export and source-integrity cases, richer arrangement/recovery/format support, device/UI/resource acceptance.

### F56

10 | F56 | Offline PDF translation | Translate permitted extracted/OCR text through optional local models. Show original/translation with physical-page references, language/model identity and uncertain layout/order. Save a separate copy. | Reading/Document rooms; free licensed local models, cancel/resource limits; no silent online fallback.

Source: [FREE-ACROBAT-ADDITIONS-PLAN.md:22](../FREE-ACROBAT-ADDITIONS-PLAN.md#L22).

Addition status: planned; expanded target not newly implemented or tested.

### F57

11 | F57 | Automatic bookmark generation | Detect candidate headings and suggest bookmark hierarchy/destinations. Review and edit suggestions before writing a preserved copy. | F06 / M07.05; outline tools and OCR uncertainty.

Source: [FREE-ACROBAT-ADDITIONS-PLAN.md:23](../FREE-ACROBAT-ADDITIONS-PLAN.md#L23).

Dated implementation status: coded; brief source/model checks; full scope remains open. Bounded physical-page heading analysis with geometric word spaces, running-header filtering, scored editable hierarchy/page proposals and undoable acceptance in existing outline editor. Remaining: OCR/column-aware/tag-based proposals, calibrated multilingual quality, extraction cancellation/resource extremes and corpus/actual-output checks.

Addition status: coded; syntax/model evidence only; broader acceptance pending.

Coded subset: Bounded physical-page heading analysis with geometric word spaces, running-header filtering, scored editable hierarchy/page proposals and undoable acceptance in existing outline editor.

Still required: OCR/column-aware/tag-based proposals, calibrated multilingual quality, extraction cancellation/resource extremes and corpus/actual-output checks.

### F58

12 | F58 | Search across PDF folders | Search hundreds of PDFs in explicitly selected local folders without opening them individually. Show scope, recursive choice, progress, partial results and page/file references. | M07.02 / R48; bounded local index/search, changed-file handling, cancel and index removal.

Source: [FREE-ACROBAT-ADDITIONS-PLAN.md:24](../FREE-ACROBAT-ADDITIONS-PLAN.md#L24).

Dated implementation status: coded session-only subset; one nonrecursive snapshot/revoke case passed; full indexing/search acceptance pending. Explicit recursion/purpose/session PDF folder scope, native picker, fixed Windows attribute checks, bounded async enumeration/progress/partial results, sequential per-file stable snapshot/release and existing search extraction.

Addition status: coded session-only subset; one nonrecursive snapshot/revoke case passed; full indexing/search acceptance pending.

Coded subset: Explicit recursion/purpose/session PDF folder scope, native picker, fixed Windows attribute checks, bounded async enumeration/progress/partial results, sequential per-file stable snapshot/release and existing search extraction.

Still required: Protected persistent index/grants/removal, incremental changed-file handling, larger PDFs/OCR and expanded content search, full extraction containment and hostile-path/device/cloud/corpus/UI acceptance.

### F59

13 | F59 | Smart file naming | Suggest filenames from titles, dates or OCR metadata. Show the reason and editable proposal; sanitize Windows names and use exclusive save/keep-both rules. | R05 / M02.08; no automatic original renaming.

Source: [FREE-ACROBAT-ADDITIONS-PLAN.md:25](../FREE-ACROBAT-ADDITIONS-PLAN.md#L25).

Dated implementation status: coded subset; proposal/sanitization and 101 MiB disk-backed copy cases passed; full naming/UI acceptance pending. Pages/PDF-tools/command action proposes editable reasoned metadata/current permitted text/date/source names; native destination chooser saves an unchanged exclusive copy. Disk-backed source streaming uses bounded chunks, source/hash/readback verification, progress and cancellation.

Addition status: coded subset; proposal/sanitization and 101 MiB disk-backed copy cases passed; full naming/UI acceptance pending.

Coded subset: Pages/PDF-tools/command action proposes editable reasoned metadata/current permitted text/date/source names; native destination chooser saves an unchanged exclusive copy. Disk-backed source streaming uses bounded chunks, source/hash/readback verification, progress and cancellation.

Still required: Reviewed OCR metadata naming, expanded date/language heuristics, naming recovery, full UI/hostile-path/cloud/lock/disk-full/device and measured large-drawing memory cases.

### F60

14 | F60 | Watched-folder automation | Watch only explicitly granted folders and suggest or execute approved recipes when stable files arrive. Persist consent, pause/revoke controls, receipts and recovery. | F27/F28 / R48; avoid output loops, duplicate jobs and partially synchronized/locked sources.

Source: [FREE-ACROBAT-ADDITIONS-PLAN.md:26](../FREE-ACROBAT-ADDITIONS-PLAN.md#L26).

Dated implementation status: coded copy/text recipe subset; protected approval/stable exact-copy/save/reopen/pause/restart/revoke fixture passed; full workflow acceptance pending. Connected persistent explicit source/output folder, recursion/run-mode/recipe grant, baseline/stable discovery, sequential approved copy or contained literal-text queue, loop/version/lock guards, exclusive output receipts, pause/revoke and reviewed recovery/reconcile/export.

Addition status: coded copy/text recipe subset; protected approval/stable exact-copy/save/reopen/pause/restart/revoke fixture passed; full workflow acceptance pending.

Coded subset: Connected persistent explicit source/output folder, recursion/run-mode/recipe grant, baseline/stable discovery, sequential approved copy or contained literal-text queue, loop/version/lock guards, exclusive output receipts, pause/revoke and reviewed recovery/reconcile/export.

Still required: Broader recipe composition/conversion/compression/forms, disk-backed sources, cloud readiness, richer cleanup/conflict policies and actual text/cancel/crash/disk-full/path/security/UI/corpus/performance acceptance.

### F61

15 | F61 | CSV mail merge | Map local CSV headers to supported PDF form fields, review rows/results, then generate separate documents with safe names, bounded queues and per-row errors. | F18/F27/F28; standard bounded CSV, no spreadsheet macros or network submissions.

Source: [FREE-ACROBAT-ADDITIONS-PLAN.md:27](../FREE-ACROBAT-ADDITIONS-PLAN.md#L27).

Dated implementation status: coded subset; actual contained two-row writer/safe saves/independent reopen passed; full mail merge acceptance pending. Fill and sign launches real CSV merge: native snapshot, explicit headers-to-fields mapping, edited/selected rows/names, reviewed PDF preview, sealed queue and contained sequential outputs/new-folder exclusive saves/receipts/progress/cancel.

Addition status: coded subset; actual contained two-row writer/safe saves/independent reopen passed; full mail merge acceptance pending.

Coded subset: Fill and sign launches real CSV merge: native snapshot, explicit headers-to-fields mapping, edited/selected rows/names, reviewed PDF preview, sealed queue and contained sequential outputs/new-folder exclusive saves/receipts/progress/cancel.

Still required: Durable editable-session/partial-receipt recovery, receipt export/retry, expanded templates/multi-choice/large PDF route and real forms/CSV/UI/cancel/failure acceptance.

### F62

16 | F62 | Signature request preparation | Prepare reviewed signing/date/initial locations and an email handoff artifact. The user sends the request; no hosted tracking or inferred cryptographic signing. | F39 / A04; distinguish preparation, visual signatures and certificate signatures.

Source: [FREE-ACROBAT-ADDITIONS-PLAN.md:28](../FREE-ACROBAT-ADDITIONS-PLAN.md#L28).

Dated implementation status: coded placement-note/email subset; contained request/EML writer/save/reopen/source integrity fixture passed; full preparation/UI acceptance pending. Connected recipient/message and signing/date/initial placement editing, contained explicit printable annotation appearances preserving unrelated artwork/comments, changed-page preview/review/new-copy save and actual saved-name/hash-bound local EML draft without automated sending.

Addition status: coded placement-note/email subset; contained request/EML writer/save/reopen/source integrity fixture passed; full preparation/UI acceptance pending.

Coded subset: Connected recipient/message and signing/date/initial placement editing, contained explicit printable annotation appearances preserving unrelated artwork/comments, changed-page preview/review/new-copy save and actual saved-name/hash-bound local EML draft without automated sending.

Still required: Durable request recovery, expanded sources/layouts/recipients and interactive signing-field support, actual email-client handling and appearance/geometry/permissions/security/UI/corpus acceptance.

### F63

17 | F63 | PDF fingerprint verification | Compute SHA-256 of selected files, compare expected values/earlier receipts, and export verification records. Clearly distinguish file change from signer authenticity. | File-details hashes/source seals exist; add explicit compare/import/export verification workflow.

Source: [FREE-ACROBAT-ADDITIONS-PLAN.md:29](../FREE-ACROBAT-ADDITIONS-PLAN.md#L29).

Dated implementation status: coded subset; exact SHA match/mismatch/export/clear fixture passed; full workflow/UI/security acceptance pending. Workspace/command action streams a native selected PDF SHA-256 with progress/cancel; compares typed or imported expected fingerprints; exclusively exports digest/comparison receipt and clears session state.

Addition status: coded subset; exact SHA match/mismatch/export/clear fixture passed; full workflow/UI/security acceptance pending.

Coded subset: Workspace/command action streams a native selected PDF SHA-256 with progress/cancel; compares typed or imported expected fingerprints; exclusively exports digest/comparison receipt and clears session state.

Still required: Full UI/cancel/locks/cloud/hostile-path cases, receipt history/authenticated formats and opened-source integration.

### F64

18 | F64 | Print-production marks | Add reviewed crop, bleed and registration marks to supported layouts, with units, offset, bounds and ink/color choices. Preserve original artwork in a new copy. | F29/F40 / A05–A08; no claim that marks alone create bleed or establish PDF/X/color compliance.

Source: [FREE-ACROBAT-ADDITIONS-PLAN.md:30](../FREE-ACROBAT-ADDITIONS-PLAN.md#L30).

Dated implementation status: coded subset; one contained vector-mark preservation/save/reopen case passed; print/UI acceptance pending. Pages/PDF-tools/command workspace builds actual crop/bleed/registration mark streams, with units, offsets, selected RGB ink/width, expanded boxes and disclosed retained effective TrimBox materialization; reviews selected pages before exclusive new-copy saving.

Addition status: coded subset; one contained vector-mark preservation/save/reopen case passed; print/UI acceptance pending.

Coded subset: Pages/PDF-tools/command workspace builds actual crop/bleed/registration mark streams, with units, offsets, selected RGB ink/width, expanded boxes and disclosed retained effective TrimBox materialization; reviews selected pages before exclusive new-copy saving.

Still required: Selected nondefault UserUnit support, broader layouts and press/color separation/compliance features, durable recovery, real print/geometry/corpus/security/UI acceptance.

### F65

19 | F65 | Detailed PDF page-box editor | Inspect/edit MediaBox, CropBox, TrimBox, BleedBox and ArtBox, including explicit/inherited/default values, units, rotation and selected-page application. Compare/review before saving. | R33 / A05; existing crop/box inspection is partial; clipping is not redaction.

Source: [FREE-ACROBAT-ADDITIONS-PLAN.md:31](../FREE-ACROBAT-ADDITIONS-PLAN.md#L31).

Dated implementation status: coded subset; five-box/inheritance/unit/rotation preservation/save/reopen fixture passed; full geometry/UI acceptance pending. Pages/PDF-tools/command workspace inspects all five explicit/inherited/default page boxes and physical units/rotation; edits selected leaf boxes, compares/reviews source/output and saves a sealed contained preserving copy.

Addition status: coded subset; five-box/inheritance/unit/rotation preservation/save/reopen fixture passed; full geometry/UI acceptance pending.

Coded subset: Pages/PDF-tools/command workspace inspects all five explicit/inherited/default page boxes and physical units/rotation; edits selected leaf boxes, compares/reviews source/output and saves a sealed contained preserving copy.

Still required: Expanded source/geometry and large-file writer support, durable editor recovery, full crop/rotation/UserUnit/layout/permissions/security/UI/corpus acceptance.

### F66

20 | F66 | Thin-line inspection and repair | Identify very thin vector strokes with page/object locations and effective physical widths. Offer explicit selected fixes and before/after review, preserving unaffected artwork and original files. | F29 / A05–A07; account for transforms/UserUnit/zero-width strokes; disclose unsupported patterns/forms/appearance cases.

Source: [FREE-ACROBAT-ADDITIONS-PLAN.md:32](../FREE-ACROBAT-ADDITIONS-PLAN.md#L32).

Dated implementation status: coded subset; CTM/hairline/Form inspection and selected stroke repair/save/reopen fixture passed; full line/UI acceptance pending. Pages/PDF-tools/command workspace inspects page and invoked Form strokes with effective physical width bounds and locations; repairs selected supported unique complete page programs, reviews changed pages and saves a contained preserving copy.

Addition status: coded subset; CTM/hairline/Form inspection and selected stroke repair/save/reopen fixture passed; full line/UI acceptance pending.

Coded subset: Pages/PDF-tools/command workspace inspects page and invoked Form strokes with effective physical width bounds and locations; repairs selected supported unique complete page programs, reviews changed pages and saves a contained preserving copy.

Still required: Shared/nested Form, pattern, Type3/text, annotation appearance and other unsupported repair semantics; recovery, larger source route and real drawings/press/UI/security/corpus acceptance.

### F67

F67 | Digital-pen handwriting and drawing on PDFs | R50: saved editable PDF Ink and standard appearances; pen/highlighter/color/width/opacity, supported pressure with honest fallback, palm rejection, explicit pen/touch/navigation modes, stroke selection/move/delete/erasing, Undo/Redo, zoom/rotation/crop coordinates, multi-page use and recoverable drafts. Preview and save a new copy, reopen to continue editing; flatten only by explicit choice. Basic existing Ink is groundwork; hardware and saved-output acceptance remain open.

Source: [PDFIX-FUTURE-FEATURES.md:165](../PDFIX-FUTURE-FEATURES.md#L165).

Addition status: planned expansion; existing basic Ink is partial groundwork; pen hardware/output acceptance pending.

## Every adopted Acrobat specialist work package

### A01

**A01 — Certificate validation and trust.** Expand F19/M01.04 to cryptographic integrity, signer identity, certificate chain, timestamp and revocation results. Evaluate authorized AATL/EUTL or other appropriate trust sources, update provenance and offline behavior. Show valid/invalid/unverifiable separately from trusted/untrusted/unknown; never infer validity from a visible mark.

Source: [ACROBAT-COMPETITIVE-PLAN.md:19](../ACROBAT-COMPETITIVE-PLAN.md#L19).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### A02

**A02 — Certificate signing and certification.** Add user-selected certificate signing, hardware-token/SmartCard and Windows certificate-store integration where supported. Review certification permissions, multiple signatures, incremental updates and edit-invalidation warnings. Private keys remain with the authorized key provider; verify outputs independently. This moves certified signing into later adopted scope beyond the original first-release exclusion.

Source: [ACROBAT-COMPETITIVE-PLAN.md:20](../ACROBAT-COMPETITIVE-PLAN.md#L20).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### A03

**A03 — Durable signature evidence.** Evaluate timestamp authorities and supported long-term validation profiles, certificate/revocation evidence retention and verification after expiry or offline use. Define exactly what evidence is retained and what cannot be established. Legal eligibility depends on the chosen workflow and jurisdiction and must be reviewed before related product claims.

Source: [ACROBAT-COMPETITIVE-PLAN.md:21](../ACROBAT-COMPETITIVE-PLAN.md#L21).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### A04

**A04 — Routed signature requests and audit history.** Expand F39 to templates, ordered/parallel recipients, recipient tracking, reminders, supported identity challenges such as email/SMS OTP, bulk requests and cancellation. Specify tamper-evident event records, document identity and downloadable evidence. Identify the provider, costs, authentication, consent, retention and data destination before integration. Visual signing, local certificate signing and remote requests remain separate workflows. Payment pipelines are not added by this intake.

Source: [ACROBAT-COMPETITIVE-PLAN.md:22](../ACROBAT-COMPETITIVE-PLAN.md#L22).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### A05

**A05 — Preflight inspection and reviewed fixes.** Evaluate a contained commercial-grade engine for syntax, fonts, image resolution, transparency, page boxes, output intent and printer-specific rules. Provide versioned profiles, item/page locations, detailed reports, suggested fixes and source/output review. Report unsupported checks and preserve originals. (F29, F40; M10.01.)

Source: [ACROBAT-COMPETITIVE-PLAN.md:26](../ACROBAT-COMPETITIVE-PLAN.md#L26).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### A06

**A06 — Color-profile conversion.** Review ICC profiles, device-independent color, RGB/CMYK/spot-color handling and explicit output intents. Preview changes, disclose color loss, preserve supported objects and validate conversions against a print corpus. Engine/profile licensing and distribution are prerequisites. (F40; expands M10.02's first-release boundary.)

Source: [ACROBAT-COMPETITIVE-PLAN.md:27](../ACROBAT-COMPETITIVE-PLAN.md#L27).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### A07

**A07 — Separations, overprint and trapping.** Add supported CMYK and spot-color plate previews, overprint simulation, ink coverage and reviewed dot-gain/trapping controls or profiles. State monitor/proof limitations and prove output with representative commercial-print files and physical printing. Advanced print-production work is later adopted scope.

Source: [ACROBAT-COMPETITIVE-PLAN.md:28](../ACROBAT-COMPETITIVE-PLAN.md#L28).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### A08

**A08 — PDF/X validation and output.** Expand F40 to evaluated PDF/X editions, including the supplied X-1a, X-3, X-4 and X-6 targets. Offer only editions actually supported by the reviewed engine/validator. Report standard/version, passed and failed rules, repair choices and output verification; appearance or extension is insufficient proof.

Source: [ACROBAT-COMPETITIVE-PLAN.md:29](../ACROBAT-COMPETITIVE-PLAN.md#L29).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### A09

**A09 — PDF/A conversion and validation.** Expand F40/M10.01 to selected PDF/A profiles, including the supplied A-1b, A-2b and A-3u targets. Review font embedding, ICC/output intents, metadata, attachments, transparency and unsupported content; explain changes and validate each saved output independently. Arbitrary input conversion is not guaranteed.

Source: [ACROBAT-COMPETITIVE-PLAN.md:33](../ACROBAT-COMPETITIVE-PLAN.md#L33).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### A10

**A10 — PDF/E feasibility and support.** Evaluate engineering-document standard editions and their decoder/validator requirements. Define supported engineering content, conversion limits, reports and real-file evidence before advertising compliance. This records the PDF/E heading in the intake even though its detailed comparison primarily describes PDF/A.

Source: [ACROBAT-COMPETITIVE-PLAN.md:34](../ACROBAT-COMPETITIVE-PLAN.md#L34).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### A11

**A11 — Tag-tree and reading-order workspace.** Expand F30/M08.01–02 to direct tag-tree editing, logical reading-order review, headings, lists, links, artifacts, alt text, form labels and table header/cell associations. Support bulk artifact operations, keyboard access, undo/recovery, source-page navigation and semantic output review. OCR text is separate from document accessibility.

Source: [ACROBAT-COMPETITIVE-PLAN.md:38](../ACROBAT-COMPETITIVE-PLAN.md#L38).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### A12

**A12 — Accessibility audits and evidence.** Expand F29–F30 to detailed PDF/UA, relevant WCAG and Section 508 requirement mappings, rule versions, evidence locations and repair guidance. Distinguish automated findings from required manual checks. Validate with assistive technology and representative users before claiming accessible output; a checker pass alone is insufficient.

Source: [ACROBAT-COMPETITIVE-PLAN.md:39](../ACROBAT-COMPETITIVE-PLAN.md#L39).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### A13

**A13 — XFA compatibility.** Evaluate static and dynamic XFA layouts, reflow, data binding, field appearances, input/export and print fidelity with government and other representative forms. Detect unsupported content and explain usable alternatives. Select a licensed, contained engine and verify limits; current AcroForm support is not XFA support. (F18; later expansion of M04.)

Source: [ACROBAT-COMPETITIVE-PLAN.md:43](../ACROBAT-COMPETITIVE-PLAN.md#L43).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### A14

**A14 — Isolated form-logic compatibility.** Inventory form calculations, validation, formatting and button actions. Prefer narrowly supported declarative calculations; evaluate a dedicated contained compatibility runtime only for required features. Document-origin code must have no ambient file, process or network access, with resource bounds and effective isolation proof. General PDF script/macro execution remains disabled in current and first-release readers. Later compatibility is explicitly gated on a separate reviewed design and does not relax S00 or R08.

Source: [ACROBAT-COMPETITIVE-PLAN.md:44](../ACROBAT-COMPETITIVE-PLAN.md#L44).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### A15

**A15 — 2D barcode form fields.** Evaluate supported symbologies, live encoding of selected field values, field creation/filling, capacity/error handling and print/scan round trips. Show what data is encoded and review decoder/encoder licensing. This moves barcode fields into later adopted scope.

Source: [ACROBAT-COMPETITIVE-PLAN.md:45](../ACROBAT-COMPETITIVE-PLAN.md#L45).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### A16

**A16 — Reviewed form submissions.** Expand F38/M04.03 to explicit endpoint submissions and authenticated approved database/service connectors. Show the exact destination and payload, request consent, protect credentials, record success/failure and support offline export. Document actions cannot silently contact a server or database. (F38; R03/R27.)

Source: [ACROBAT-COMPETITIVE-PLAN.md:46](../ACROBAT-COMPETITIVE-PLAN.md#L46).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### A17

**A17 — PDF portfolio navigation and creation.** Add an inert inventory, searchable grid/list navigation, supported previews, extraction and creation/reordering of selected contents. Preserve names/metadata where supported and report unsupported layouts. Apply attachment size/count/decompression limits, traversal protection and contained decoders. Embedded Office, CAD or media content needs its own supported capability; never auto-run extracted files. Interactive 3D portfolio presentation is a separate renderer evaluation within this target. (M10.02; S00/R08.)

Source: [ACROBAT-COMPETITIVE-PLAN.md:50](../ACROBAT-COMPETITIVE-PLAN.md#L50).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### A18

**A18 — Interactive 3D PDF.** Evaluate U3D/PRC decoding, rotation, assembly visibility, cross-sections and calibrated geometry measurements with explicit units. Review licensing, GPU/resource budgets and containment. Embedded model viewing and measuring do not imply CAD authoring. (M10.02; separate from M03.12.)

Source: [ACROBAT-COMPETITIVE-PLAN.md:54](../ACROBAT-COMPETITIVE-PLAN.md#L54).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### A19

**A19 — Geospatial PDF.** Inspect coordinate reference systems, georegistration, latitude/longitude and map measurements. Show unit/projection/precision and calibration limits, support layers where meaningful and verify against known reference maps. Local PDF measurements do not establish accurate GIS coordinates. (M10.02.)

Source: [ACROBAT-COMPETITIVE-PLAN.md:55](../ACROBAT-COMPETITIVE-PLAN.md#L55).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### A20

**A20 — Embedded multimedia.** Evaluate user-initiated audio/video playback with inert inventory, codec support, licensing, bounded decode and cancellation. No automatic playback, remote retrieval or script/plugin execution. Rich-media actions require separately reviewed supported behavior. (M10.02; S00.)

Source: [ACROBAT-COMPETITIVE-PLAN.md:56](../ACROBAT-COMPETITIVE-PLAN.md#L56).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### A21

**A21 — Policy-managed access.** Evaluate an authenticated managed-document service with centrally administered access, expiry, revocation, print permissions, audit history and explicit offline policy. Report that revocation controls supported clients and cannot recall screenshots or unrestricted copies. Show service destination, identity and retention. Adobe/AEM policy-file interoperability requires supported API/licensing evaluation; never bypass another system's DRM. Password encryption is a separate existing feature. (M10.02; service/security evaluation.)

Source: [ACROBAT-COMPETITIVE-PLAN.md:60](../ACROBAT-COMPETITIVE-PLAN.md#L60).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### A22

**A22 — Browser shared reviews.** Expand F36 to authenticated or explicitly permissioned link review with no desktop install, drawing/page locations, comment threads, sync/conflict handling, invitations, expiry/revocation and exports. Review browser support for Mac, Chromebook, phones and PCs; show upload destination and permissions before sharing. Keep anonymous/public links deliberate, scoped and revocable. (F36; R22/R27; B01–B05.)

Source: [ACROBAT-COMPETITIVE-PLAN.md:64](../ACROBAT-COMPETITIVE-PLAN.md#L64).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### A23

**A23 — Additional platform clients.** Add feasibility and delivery plans for Mac and iOS/Android reading/review clients, plus a Chromebook/browser path. Preserve source/comment identity, permissions, sync/recovery and format boundaries; retain Windows-first development priority. Phone/tablet gestures, accessibility, offline support, secure storage and distribution need their own acceptance.

Source: [ACROBAT-COMPETITIVE-PLAN.md:65](../ACROBAT-COMPETITIVE-PLAN.md#L65).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### A24

**A24 — Phone-friendly reading and reflow.** Add evaluated text reflow, responsive layout, adjustable type, navigation and accessible reading for mobile documents. Preserve page/source references and flag uncertain order, tables, columns and drawings. Let users return to exact page artwork; do not silently turn reflowed content into an edited original. OCR/reflow fidelity needs a real-file corpus.

Source: [ACROBAT-COMPETITIVE-PLAN.md:66](../ACROBAT-COMPETITIVE-PLAN.md#L66).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### A25

**A25 — Robust opening, repair and honest failure.** Make F42's corpus explicit for legacy/PostScript-derived, malformed, truncated, mixed-generator, unusual-font/image, encrypted, giant and adversarial PDFs. Add bounded cancellable diagnostics, useful error causes and reviewed repair-to-copy where supported. Measure opening/navigation/selection/memory responsiveness across hardware profiles and verify repairs preserve supported content. Never silently call a partially rendered document complete or raise limits without resource evidence. (R06–R09/R29; F04/F29/F42; S00.)

Source: [ACROBAT-COMPETITIVE-PLAN.md:70](../ACROBAT-COMPETITIVE-PLAN.md#L70).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

## Original G checklist retained

### G01

G01 Protect work | R01 | Existing editor slice/reliability

Source: [REQUIREMENTS.md:78](../REQUIREMENTS.md#L78).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### G02

G02 Prevent loss | R02, R04, R05 | All writers/editors

Source: [REQUIREMENTS.md:79](../REQUIREMENTS.md#L79).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### G03

G03 Compare PDFs | R09 | PDF fixes/fidelity

Source: [REQUIREMENTS.md:80](../REQUIREMENTS.md#L80).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### G04

G04 Batch handling | R21 | PDF fixes, then format adapters

Source: [REQUIREMENTS.md:81](../REQUIREMENTS.md#L81).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### G05

G05 Dependable printing | R10 | Reading/print polish

Source: [REQUIREMENTS.md:82](../REQUIREMENTS.md#L82).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### G06

G06 Sharing | R22 | Windows polish; cloud only with consent

Source: [REQUIREMENTS.md:83](../REQUIREMENTS.md#L83).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### G07

G07 Accessibility | R23 | Every workflow; release review

Source: [REQUIREMENTS.md:84](../REQUIREMENTS.md#L84).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### G08

G08 Format clarity | R16, R18 | Existing matrix; every adapter

Source: [REQUIREMENTS.md:85](../REQUIREMENTS.md#L85).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### G09

G09 Useful file types | R17, R19 | Documents/images/compatibility

Source: [REQUIREMENTS.md:86](../REQUIREMENTS.md#L86).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### G10

G10 Trustworthy OCR | R11, R12 | PDF fixes

Source: [REQUIREMENTS.md:87](../REQUIREMENTS.md#L87).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### G11

G11 Bad files | R29 | Every parser/writer

Source: [REQUIREMENTS.md:88](../REQUIREMENTS.md#L88).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### G12

G12 Safe AI | R24, R25, R27 | AI phase

Source: [REQUIREMENTS.md:89](../REQUIREMENTS.md#L89).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### G13

G13 Connection details | R26 | AI phase

Source: [REQUIREMENTS.md:90](../REQUIREMENTS.md#L90).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### G14

G14 Windows fit | R28 | Packaging/polish

Source: [REQUIREMENTS.md:91](../REQUIREMENTS.md#L91).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### G15

G15 Real-document testing | R29 | Every gate

Source: [REQUIREMENTS.md:92](../REQUIREMENTS.md#L92).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### G16

G16 Logo preparation | R30 | Packaging/polish

Source: [REQUIREMENTS.md:93](../REQUIREMENTS.md#L93).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

## Deeper D checklist retained

### D01

D01 Outline/bookmarks | R06 | Reading improvements

Source: [REQUIREMENTS.md:94](../REQUIREMENTS.md#L94).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### D02

D02 Page views/view rotation | R06, R04 | Reading improvements

Source: [REQUIREMENTS.md:95](../REQUIREMENTS.md#L95).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### D03

D03 Links/attachments | R08 | Reading/security

Source: [REQUIREMENTS.md:96](../REQUIREMENTS.md#L96).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### D04

D04 Complicated copying | R07 | Existing selection plus corpus

Source: [REQUIREMENTS.md:97](../REQUIREMENTS.md#L97).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### D05

D05 Huge documents | R06, R21, R29 | Every job

Source: [REQUIREMENTS.md:98](../REQUIREMENTS.md#L98).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### D06

D06 Scan cleanup | R12 | PDF fixes

Source: [REQUIREMENTS.md:99](../REQUIREMENTS.md#L99).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### D07

D07 Uncertain OCR | R11 | PDF fixes

Source: [REQUIREMENTS.md:100](../REQUIREMENTS.md#L100).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### D08

D08 Scanned forms | R13 | PDF fixes

Source: [REQUIREMENTS.md:101](../REQUIREMENTS.md#L101).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### D09

D09 Form behavior | R13 | PDF fixes

Source: [REQUIREMENTS.md:102](../REQUIREMENTS.md#L102).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### D10

D10 Signature kinds | R14 | PDF fixes/release scope

Source: [REQUIREMENTS.md:103](../REQUIREMENTS.md#L103).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### D11

D11 Annotation preservation | R15, R18 | PDF fixes/fidelity

Source: [REQUIREMENTS.md:104](../REQUIREMENTS.md#L104).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### D12

D12 Text/image/page comparison | R09 | PDF fixes/fidelity

Source: [REQUIREMENTS.md:105](../REQUIREMENTS.md#L105).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### D13

D13 Preservation choices | R18 | Every conversion

Source: [REQUIREMENTS.md:106](../REQUIREMENTS.md#L106).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### D14

D14 Apple photos/Live Photos | R19 | Decoder/compatibility gates

Source: [REQUIREMENTS.md:107](../REQUIREMENTS.md#L107).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### D15

D15 PDF/A/tagging | R20, R23 | Compatibility/standards evaluation

Source: [REQUIREMENTS.md:108](../REQUIREMENTS.md#L108).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### D16

D16 Safe extraction | R08, R29 | Parser/security gates

Source: [REQUIREMENTS.md:109](../REQUIREMENTS.md#L109).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### D17

D17 Visual AI context | R27 | AI phase

Source: [REQUIREMENTS.md:110](../REQUIREMENTS.md#L110).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### D18

D18 Document injection/read-only AI | R25 | AI phase

Source: [REQUIREMENTS.md:111](../REQUIREMENTS.md#L111).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### D19

D19 Privacy cleanup/logs | R03, R24 | Existing local data; AI audit later

Source: [REQUIREMENTS.md:112](../REQUIREMENTS.md#L112).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### D20

D20 Recoverable operations | R01, R04 | All editors/fixes

Source: [REQUIREMENTS.md:113](../REQUIREMENTS.md#L113).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### D21

D21 Conversion recovery | R04, R09 | Every conversion

Source: [REQUIREMENTS.md:114](../REQUIREMENTS.md#L114).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

### D22

D22 Duplicate outputs | R05 | Safe-copy workflow

Source: [REQUIREMENTS.md:115](../REQUIREMENTS.md#L115).

Complete target remains open. Use the source definition and linked current inventory/checkpoints for overlapping coded subsets; absence of an individual runtime receipt means acceptance is pending.

## Inventory legend and additional constraints

{
  "H": "Historical bounded runtime evidence; current regression pending",
  "U": "Coded, current runtime acceptance pending",
  "H+U": "Older tested subset plus newer untested work",
  "N": "First requested implementation or execution pending",
  "L": "Deferred API/engine/service evaluation",
  "X": "Explicit first-release exclusion"
}

All original-preservation, permission, containment, cancellation, recovery, free-app, licensing, standards, device/service and release constraints remain in force. Historical exclusions are preserved as staging/boundaries, with later adopted A scope and R48 folder grants explicitly reconciled in the final plan.

## Full source manifest

| Source | SHA-256 |
| --- | --- |
| [ACROBAT-COMPETITIVE-PLAN.md](../ACROBAT-COMPETITIVE-PLAN.md) | a2052b35feca5ff4fdb237915bdfb3a985ca60e1e9696aa49bfc5e935ef08832 |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | c8d72f74b1f05bce0371e3cd2e17165f84b336726eef9587ba4926efd132975c |
| [BLUEBEAM-COMPATIBILITY-PLAN.md](../BLUEBEAM-COMPATIBILITY-PLAN.md) | b0de8519677e1e91e9008d59e670a8995bfd59dac33b8cbca987948ff4f195ce |
| [DECISIONS.md](../DECISIONS.md) | 912c21f2de414dca4828a6e29e8f5bd92890d3d78e3f722277534e53d7da7a03 |
| [FEATURE-TRACKER.md](../FEATURE-TRACKER.md) | dce4abea95c60bd1dc81c6451191ea7a7ab00c91a8f8f66298027cc7a5d06faa |
| [FINAL-IMPLEMENTATION-PLAN.md](../FINAL-IMPLEMENTATION-PLAN.md) | ca2e7221c90b71c5f9e3d18ed540b58c451e8f92b3f72a4b3a114ba7c27ee509 |
| [FORMAT-SUPPORT.md](../FORMAT-SUPPORT.md) | 4cb52ae049746acb3d31c2f738fc1f3eb5926c947cd33b1131c6a5c9f5aebc10 |
| [FREE-ACROBAT-ADDITIONS-PLAN.md](../FREE-ACROBAT-ADDITIONS-PLAN.md) | 7e366d3d614d2fb669c196a406d9b7f261c4b0ce2441b7f4f095ea468d749765 |
| [MASTER-GAP-TRACKER.md](../MASTER-GAP-TRACKER.md) | 275b2e2e879f3d37fb6294cfbefe018976899981425006b2e33480fb46ea0c6f |
| [PARALLEL-WORKSTREAMS.md](../PARALLEL-WORKSTREAMS.md) | 6801554d78bf26c7c2fb308a7be70209a3f9e628e1d271bfecd7fa5119a4d602 |
| [PDFIX-ALL-PLANNED-FEATURES.md](../PDFIX-ALL-PLANNED-FEATURES.md) | b574285a11ab546f1924b49fbf12a8ce02534d160749e54fb4d79fe711672e6c |
| [PDFIX-COMPLETE-STATUS-2026-10-04.md](../PDFIX-COMPLETE-STATUS-2026-10-04.md) | c380a72854104b95e798b2415c126f85b7ee22ad84a09f20a7330df061a55a86 |
| [PDFIX-FUTURE-FEATURES.md](../PDFIX-FUTURE-FEATURES.md) | ce26fec27ae68c6e53d643bd60c72c4081cbd81190febdfa21ba1a592522ad7e |
| [PDFix-Missing-Features-Master-List.md](../PDFix-Missing-Features-Master-List.md) | 1f475f320c33435074559031bf49cef74b4be1137956c544faf03734c9f9070f |
| [PHASE-LOG.md](../PHASE-LOG.md) | c041f289de09e31e83c561803e93b0d7ec1f0a3cc732373c9f75c55a023bd15f |
| [PRODUCT-PLAN.md](../PRODUCT-PLAN.md) | bdf9b8a25f7bc56566be3a9eb361a69ebf54705c8e0ebec5b5fc08952ed1bb62 |
| [READING-WRITING-PRINT-PLAN.md](../READING-WRITING-PRINT-PLAN.md) | 77104635fe5f41e936812bee2d2c905747fbd65b1493055989e057824392636d |
| [README.md](../README.md) | b3194a3a22470033620266ccb2a8426a94f8ce13cd3376b77beb4514ab27fd96 |
| [REQUIREMENTS.md](../REQUIREMENTS.md) | 4dd4978494fe039c90bd1362502ae9d5674efb66e2f90dbcc0922e4f9a5279a8 |
| [ROADMAP.md](../ROADMAP.md) | 152ef13cbd85f5c7e314af822a4d2b3cc144263653f3b707f4868440196c0f9a |
| [THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md) | 558840d6d77f3a4c790221aa509d677abc00f7d6e4c962b35914032bca28025e |
| [WORKSPACE-CONTENTS.md](../WORKSPACE-CONTENTS.md) | 1c899570262c0d67d8e41fd7b4ac8dbef413e07e9f4a6856697951ff988b8c4c |
| [docs/ACROBAT-COMPARISON-USER-INPUT-2026-10-07.txt](../docs/ACROBAT-COMPARISON-USER-INPUT-2026-10-07.txt) | 5ec5f0de8b5069140e3f8a411e39cc47b8c6c9af2fe7d1b8f8d0aeb762d2edb6 |
| [docs/BANNER-CLEANUP-PROGRESS.md](../docs/BANNER-CLEANUP-PROGRESS.md) | e4ddc30026377c97d1067e112eaefd70b9c7c42f6bc4f1249b63665400aa47a8 |
| [docs/BATCH-BATES-PROGRESS.md](../docs/BATCH-BATES-PROGRESS.md) | c1b458e4364bc64d91762661617b80fe484d9555fcd5c418618e89e2e0f39ec9 |
| [docs/BATCH-COMPRESSION-PROGRESS.md](../docs/BATCH-COMPRESSION-PROGRESS.md) | 958bcfe69da9eba83441957eb3e2222c9f2e3e0827dd15448b3a35ba3fae37fd |
| [docs/BATCH-DOCUMENT-ACTIONS-PROGRESS.md](../docs/BATCH-DOCUMENT-ACTIONS-PROGRESS.md) | 3bfad90527a9ee1128faaeb179f6c19cffdc086b6b4ef379707966edd90bdd65 |
| [docs/BATES-COMBINE-TIFF-TAGS-CODING-2026-10-09.md](../docs/BATES-COMBINE-TIFF-TAGS-CODING-2026-10-09.md) | 6e5d69423ef51d0e861ce898ed514a5187efccac497f79b5c22e56351133ca41 |
| [docs/BATES-NUMBERING-PROGRESS.md](../docs/BATES-NUMBERING-PROGRESS.md) | 88c9549ca813ca6ab172a4bd1777eaeed72a172e1ca4e3912f01440b2a2da564 |
| [docs/BIGGEST-GAPS-CODING-2026-10-07.md](../docs/BIGGEST-GAPS-CODING-2026-10-07.md) | aec8015e64262a5634256ff2ec1b54838c10be17afbee113434405851268456f |
| [docs/BLUEBEAM-SOURCE-GAPS.md](../docs/BLUEBEAM-SOURCE-GAPS.md) | 9b109bff4d25b39bb23ac214af966b4be2c6b929caf0a80f7107968138e59199 |
| [docs/BOOKMARK-PROPOSALS-CODING-2026-10-11.md](../docs/BOOKMARK-PROPOSALS-CODING-2026-10-11.md) | 5af9a5dae5985acf56225a0c63850042a62ba414f4a4c4ae9c220badf43af89c |
| [docs/BOOKMARK-SPLIT-PROGRESS.md](../docs/BOOKMARK-SPLIT-PROGRESS.md) | f2bb89ddab9db5f813f3f6a0e6e878c2f51ed62928d500fd2dd1d3bb82fcb726 |
| [docs/CERTIFICATE-SIGNING-PROGRESS.md](../docs/CERTIFICATE-SIGNING-PROGRESS.md) | 507ca24bddcd6351013b60a3853c60541b2436bc5209742befea2ddfa3407c89 |
| [docs/CERTIFICATE-VALIDATION-PROGRESS.md](../docs/CERTIFICATE-VALIDATION-PROGRESS.md) | c1a434017f20f234433998ff5e1321294ba5620f7601c9c50194d9f85953750b |
| [docs/CODING-CHECKPOINT-2026-10-04.md](../docs/CODING-CHECKPOINT-2026-10-04.md) | 72083ef2d4bbf10cef35e7ef44ca4e966334fc67b89b1a12f8cb7adefaab5031 |
| [docs/COMBINE-TIFF-WORKFLOWS-CODING-2026-10-09.md](../docs/COMBINE-TIFF-WORKFLOWS-CODING-2026-10-09.md) | f5697ea3e38cc7577a44346ad4faf6b5ab1035680359f50fb464b9f8ea3b4fda |
| [docs/COMBINE-WORKFLOW-PROGRESS.md](../docs/COMBINE-WORKFLOW-PROGRESS.md) | 88330eb46a4d34335da7863e92285a0ec19b302eb53fc9d55ffebc9df9da2f27 |
| [docs/COMPACT-DOCUMENT-HEADER-PROGRESS.md](../docs/COMPACT-DOCUMENT-HEADER-PROGRESS.md) | 19f136f384cc6381044fa401afbaf6393059950c24f4c6064fd0e34a447675bb |
| [docs/CROSS-DOCUMENT-PAGE-DRAG-PROGRESS.md](../docs/CROSS-DOCUMENT-PAGE-DRAG-PROGRESS.md) | e230f92a2fd31969770d9c981dcd2ed15302f84f3afb72aee39b17c7e729dd2f |
| [docs/CSV-MAIL-MERGE-CODING-2026-10-12.md](../docs/CSV-MAIL-MERGE-CODING-2026-10-12.md) | f1de450492cb0cfab70d0fe009a302fff3660e2dc194440f0e534e129cc11cd2 |
| [docs/DAD-DRAWING-REVIEW-SAMPLES.md](../docs/DAD-DRAWING-REVIEW-SAMPLES.md) | 8218afa03df2e9099e24984a77b826684ad53af1e5ea6114fef686e93f7c5bf2 |
| [docs/DEVELOPMENT-READINESS.md](../docs/DEVELOPMENT-READINESS.md) | bf8b2a939201656d0554cd7109d751d63f7887bceed92e7bb22f2fba1e0d9132 |
| [docs/DISK-BACKED-PDF-CODING-2026-10-10.md](../docs/DISK-BACKED-PDF-CODING-2026-10-10.md) | 219a30b7a457f802e4b26877e8b7eb2b28aa4cb8098759ff53014e05b2d5d7c1 |
| [docs/DOCUMENT-BAND-IMPORT-PROGRESS.md](../docs/DOCUMENT-BAND-IMPORT-PROGRESS.md) | 3c13fa71215eb5a4fc3252ebdbe6199ae9d09502be2e040402fb3756f11100a2 |
| [docs/DOCUMENT-FIDELITY-PROGRESS.md](../docs/DOCUMENT-FIDELITY-PROGRESS.md) | 84e0d9650dabac8e2c9f26c875855b65ca3ecc7a71ac01c0c16858a74c35ff01 |
| [docs/DOCUMENT-GRID-CONTAINMENT.md](../docs/DOCUMENT-GRID-CONTAINMENT.md) | baecd70782e4ddcdbe99a7518de2c5008708818928768c8c5da0197c66f992e7 |
| [docs/DOCUMENT-HEADER-FOOTER-PROGRESS.md](../docs/DOCUMENT-HEADER-FOOTER-PROGRESS.md) | fcdb1a165a59bf62064e306c7f14ea068bb752b0ed05e9e6aa50bf7f42d137c4 |
| [docs/DOCUMENT-IMAGE-FIDELITY-PROGRESS.md](../docs/DOCUMENT-IMAGE-FIDELITY-PROGRESS.md) | 18fad7bfd31a7a2afdd477795d3e0d3e9690c029a37a73967d1f9ac0aaf59080 |
| [docs/DOCUMENT-OUTPUT-CONTAINMENT-PROGRESS.md](../docs/DOCUMENT-OUTPUT-CONTAINMENT-PROGRESS.md) | 4f41dad063918b4d8296197981eb9fa2321891c79caeaba1baaec1ac430f62f0 |
| [docs/DOCUMENT-TABLE-WIDTHS-PROGRESS.md](../docs/DOCUMENT-TABLE-WIDTHS-PROGRESS.md) | 58eee858b457c501f9953e35b85e92ef28d25d19b5e46710490d58d8bc688476 |
| [docs/DOCUMENT-TOOLBAR-CODING-2026-10-11.md](../docs/DOCUMENT-TOOLBAR-CODING-2026-10-11.md) | 0def7cf3872066eef8b1f3562ef3ce2825d862563ebf4517aa4a8ee8ce261a57 |
| [docs/DRAWING-COMMENTS-UI-CODING-2026-10-11.md](../docs/DRAWING-COMMENTS-UI-CODING-2026-10-11.md) | 9764847e63e5e165e3bc76ba9f4bc5d898033805471fde3f5434c5de54095279 |
| [docs/DRAWING-XFDF-EXPORT.md](../docs/DRAWING-XFDF-EXPORT.md) | 5295f858740753182023a44d98f28f3845e41e5d92fa165b53c24c4200523f14 |
| [docs/EDITABLE-WORKFLOWS-PROGRESS.md](../docs/EDITABLE-WORKFLOWS-PROGRESS.md) | 96e4ce2f761a4c707828c41ffb5d9d81436c3157ed9beea1d24152380edd74af |
| [docs/EDITING-FIDELITY-CODING-2026-10-07.md](../docs/EDITING-FIDELITY-CODING-2026-10-07.md) | 798f2441a5e37a71b1be13aa44430f87fa2181525697fac55f0d8fd2e056ef60 |
| [docs/EMAIL-CLIPBOARD-CODING-2026-10-11.md](../docs/EMAIL-CLIPBOARD-CODING-2026-10-11.md) | 4509244c52bc5a6ce228706383cdd047be50645c4eafe151fea3c38f9a88431b |
| [docs/FDF-EXCHANGE-PROGRESS.md](../docs/FDF-EXCHANGE-PROGRESS.md) | 929959e9a94be6dbd15927304a5681dbfe51d0026555da3db50bd12e18d44f0e |
| [docs/FEATURE-BATCH-FORMS-REVISIONS-2026-10-11.md](../docs/FEATURE-BATCH-FORMS-REVISIONS-2026-10-11.md) | e59bd81394e4e8c5fe79a155d9e44cf4972aafec39dd7530cbabcd1c17b19f54 |
| [docs/FINGERPRINT-CODING-2026-10-12.md](../docs/FINGERPRINT-CODING-2026-10-12.md) | 2b23b86ec7e6d3153bf44ea042e1299752f4ca91319f364347d0fbeee5074d4b |
| [docs/FOLDER-SEARCH-CODING-2026-10-11.md](../docs/FOLDER-SEARCH-CODING-2026-10-11.md) | 6cc06cacaf0d0746b2ad530c65ffc08f3578de9fff8dc518a0cafc7c3b7d391a |
| [docs/FORM-AUTOFILL-CODING-2026-10-11.md](../docs/FORM-AUTOFILL-CODING-2026-10-11.md) | 6d4c82e6730659808d8457a8a1bf4888c7358114bc15f7a73fe9eadd6ce672d4 |
| [docs/FORM-BUILDER-CONTAINMENT-PROGRESS.md](../docs/FORM-BUILDER-CONTAINMENT-PROGRESS.md) | d39f87dc6deb4e56b3997c698e0fe1171530253cb6e252be163008b395d8c348 |
| [docs/FORM-CUSTOM-TAB-ORDER-PROGRESS.md](../docs/FORM-CUSTOM-TAB-ORDER-PROGRESS.md) | e611add67cbc7e22b303e57e8a6fe2e8fb6b18dbb64d970cbd77d62d68439805 |
| [docs/FORM-DECLARATIVE-CALCULATIONS-PROGRESS.md](../docs/FORM-DECLARATIVE-CALCULATIONS-PROGRESS.md) | f94907220b1c0b344c2d63967edad1a4aac1bcfaa66a879f33cb2d6b432d1212 |
| [docs/FORM-DETECTION-CODING-2026-10-11.md](../docs/FORM-DETECTION-CODING-2026-10-11.md) | b81ecf65b72b4938ca69d7f1284c370c9a4de9a831aa495ee20ee8fa793ba7b0 |
| [docs/FORM-FILL-CONTAINMENT-PROGRESS.md](../docs/FORM-FILL-CONTAINMENT-PROGRESS.md) | 1eb9da61d55d4d9427dc9e66044fe40fa8acc738bb3ac7a9b6de256c105f3694 |
| [docs/FORMATTED-BAND-IMPORT-PROGRESS.md](../docs/FORMATTED-BAND-IMPORT-PROGRESS.md) | 75aa65289e0f03ce4ddd0a9e1238f0b8f65fe65592242c769d42a789d7baac19 |
| [docs/FORMS-FDF-WORKFLOWS-CODING-2026-10-09.md](../docs/FORMS-FDF-WORKFLOWS-CODING-2026-10-09.md) | 5922cadcf4d8961246e775f44a26279d6e5f2d9de5d2922f2bb5913efde7ac3e |
| [docs/FREE-APP-PROGRESS.md](../docs/FREE-APP-PROGRESS.md) | f8b6ad6b39aca8170619f8719bfee0853179eae65dbde3c37b517a0fda2e3766 |
| [docs/FREE-WORKFLOW-BATCH-2026-10-12.md](../docs/FREE-WORKFLOW-BATCH-2026-10-12.md) | 588e91965ae67b53ea10d710bba5b9f04e6fc590b2541ae9f2270773a6a60936 |
| [docs/intake/ACROBAT-EXPANSION-REQUEST.txt](../docs/intake/ACROBAT-EXPANSION-REQUEST.txt) | 5ec5f0de8b5069140e3f8a411e39cc47b8c6c9af2fe7d1b8f8d0aeb762d2edb6 |
| [docs/intake/EARLY-GAPS-REQUEST.txt](../docs/intake/EARLY-GAPS-REQUEST.txt) | 1b9d0c76ded15d3b9a9f020ac33cf07530997bbc1ccb98e1628e31b7dc8880df |
| [docs/intake/FINAL-PLAN-USER-REQUESTS-2026-10-11.md](../docs/intake/FINAL-PLAN-USER-REQUESTS-2026-10-11.md) | 660cd968b2ef785c90925c96969e803adcd3f221b9fcaf424ab25410113d17f7 |
| [docs/intake/INITIAL-PRODUCT-REQUEST.txt](../docs/intake/INITIAL-PRODUCT-REQUEST.txt) | 74612b8a4086989312d58f8e8f21e5c3ebb84a2e897e463e79ec998f31acec07 |
| [docs/intake/ORIGINAL-MISSING-FEATURES-MASTER-LIST.md](../docs/intake/ORIGINAL-MISSING-FEATURES-MASTER-LIST.md) | 1f475f320c33435074559031bf49cef74b4be1137956c544faf03734c9f9070f |
| [docs/intake/ORIGINAL-SOURCE-PROVENANCE-2026-10-11.json](../docs/intake/ORIGINAL-SOURCE-PROVENANCE-2026-10-11.json) | 2f46c51ad7d87d2b51354df556c3358f25ddd4999bfbb7c225c568cbfeea516f |
| [docs/INTEGRATED-FEATURES-CODING-2026-10-08.md](../docs/INTEGRATED-FEATURES-CODING-2026-10-08.md) | 34684a0b6b026dbb342842df20e182da95493f76f91512ff05a8c0e686c2c604 |
| [docs/INTEGRATED-FEATURES-CODING-2026-10-09.md](../docs/INTEGRATED-FEATURES-CODING-2026-10-09.md) | c2f835e6c972d534ac33a3a79fb8042a144628bca4c31c86dedbf80ab6ef704b |
| [docs/INTERFACE-CONTRAST-CODING-2026-10-10.md](../docs/INTERFACE-CONTRAST-CODING-2026-10-10.md) | 5c6ee3827f479434a639fea3059909e62832bac6f3b68a8d642b4984f6e6ea25 |
| [docs/LARGE-PDF-DEFENSIVE-REVIEW-2026-10-11.md](../docs/LARGE-PDF-DEFENSIVE-REVIEW-2026-10-11.md) | 3576da94e8d1fdd1ec436649b5bbf52aaa85179cf8b76059514abba6b40a5641 |
| [docs/LARGE-PDF-LOADING-CODING-2026-10-10.md](../docs/LARGE-PDF-LOADING-CODING-2026-10-10.md) | f49145835329faf993f97b5fafe7735377e088cc428873b9a6186e6768ffdcdb |
| [docs/LARGE-PDF-NATIVE-PROGRESS.md](../docs/LARGE-PDF-NATIVE-PROGRESS.md) | f0e7b2d99c16716252b90b3b8d85a37aaea85a8c82b67319bf066adf0606d059 |
| [docs/LARGE-PDF-OPENING-DEEP-DIVE-2026-10-11.md](../docs/LARGE-PDF-OPENING-DEEP-DIVE-2026-10-11.md) | 3664d80e674fbba52879cc8c23e60ae02a4ce54408cacf45b340859cac4b2b74 |
| [docs/LARGE-PDF-OPENING-PROGRESS.md](../docs/LARGE-PDF-OPENING-PROGRESS.md) | d6fd87031c0288952880ba900083dac712a74c1e4723c3ead4cbbc82bc40fe92 |
| [docs/LARGE-PDF-READER-PROGRESS.md](../docs/LARGE-PDF-READER-PROGRESS.md) | 8463e91fe507fd391c3d66768f94e6379ff91c354076f458bba5ff5851759adb |
| [docs/LARGE-PDF-REVIEW-PROGRESS.md](../docs/LARGE-PDF-REVIEW-PROGRESS.md) | 59d8088e441c47411f423a44a541ba9714e788d7ae6a4592344afdff1bd585ae |
| [docs/LARGE-PDF-SANDBOX-REPAIR-2026-10-11.md](../docs/LARGE-PDF-SANDBOX-REPAIR-2026-10-11.md) | 3b808534c7a4116619a3d064dc84faeba41905dcfb7853e8dae3d17cc6d916cd |
| [docs/LINK-ATTACHMENT-CONTAINMENT-PROGRESS.md](../docs/LINK-ATTACHMENT-CONTAINMENT-PROGRESS.md) | c51afafb8b05d2b0db3a2844d7fbd421c6d72e6bc12c7b00dccf38d283894472 |
| [docs/LOCAL-TEXT-PRINT-CODING-2026-10-09.md](../docs/LOCAL-TEXT-PRINT-CODING-2026-10-09.md) | 7604d14b2248a367ba9d772a88029b1efd1e65ed75a53792d001733958d12929 |
| [docs/MAJOR-GAP-CODING-2026-10-07.md](../docs/MAJOR-GAP-CODING-2026-10-07.md) | e2af4ba7f7c0ba013ae4506c2165891b3ec19b67bb37131ad45416eadbd5434b |
| [docs/MULTILINGUAL-OCR-PROGRESS.md](../docs/MULTILINGUAL-OCR-PROGRESS.md) | daab8812ffc968110bc68ec7fe2ed3eef58bb6070f9bbd9c38730fbcf4f84ab3 |
| [docs/NATIVE-BROKER-ENVELOPE-PROGRESS-2026-10-09.md](../docs/NATIVE-BROKER-ENVELOPE-PROGRESS-2026-10-09.md) | ba2473d379d07340b3cfba4bf2920b6219e6d6abb33336da4e28230a0bee01f3 |
| [docs/NATIVE-PDF-COMBINATION-PROGRESS.md](../docs/NATIVE-PDF-COMBINATION-PROGRESS.md) | aed62e6fe88a89296f4cf571ba778ace0f4664cd8532d278a11dd285dee8f9ab |
| [docs/PAGE-BOX-CODING-2026-10-12.md](../docs/PAGE-BOX-CODING-2026-10-12.md) | 4a9ef728e786cfc3e584ff8486f9e45a0b355504667052fc79c1dc5bf0f15396 |
| [docs/PAGE-ORDER-CONTAINMENT.md](../docs/PAGE-ORDER-CONTAINMENT.md) | ce9608ae8addcb39a189b23a2ab0910706dca2d747a123810d07bdb856741c42 |
| [docs/PDF-ACCESSIBILITY-AUDIT-PROGRESS.md](../docs/PDF-ACCESSIBILITY-AUDIT-PROGRESS.md) | 0df0aeed59e59697bf6e70039f204b7386573e66c79fe2467f7f1ebfed19a926 |
| [docs/PDF-COMPARISON-MATCHING-PROGRESS.md](../docs/PDF-COMPARISON-MATCHING-PROGRESS.md) | 5bd40f348e6afc617a10c1358bd9d4719398d4907d7c9cd0fdef815598b44ec6 |
| [docs/PDF-EDITING-FIDELITY-PROGRESS.md](../docs/PDF-EDITING-FIDELITY-PROGRESS.md) | 74c43d676621e7dc5383e009618a7857177d639fa76ae932a257e6c5f5ee65ee |
| [docs/PDF-GEOSPATIAL-PROGRESS.md](../docs/PDF-GEOSPATIAL-PROGRESS.md) | 87796a4202d0bcf23e6fe60295232b6730a28d317e7cab617fde3f627bb83fa4 |
| [docs/PDF-HEALTH-REPORT-PROGRESS.md](../docs/PDF-HEALTH-REPORT-PROGRESS.md) | 48b4eb21b1e07e62fb7eaa6b160824ddacf8103c94afc4b6b4ff7af9020af7a2 |
| [docs/PDF-NESTED-IMAGE-PROGRESS.md](../docs/PDF-NESTED-IMAGE-PROGRESS.md) | 54578d9f0ffa04be33979dcac31f7629380d814aff6a3b1b37aff85a21bdfb9c |
| [docs/PDF-NESTED-TEXT-PROGRESS.md](../docs/PDF-NESTED-TEXT-PROGRESS.md) | ec1e484da8ac496f4385c32e40c3de1b59fd9cd4d164d9f73acc1c635302c0b0 |
| [docs/PDF-ORIGINAL-GLYPH-EXPANSION-PROGRESS.md](../docs/PDF-ORIGINAL-GLYPH-EXPANSION-PROGRESS.md) | 7b2c9568205cdaa1076ddb4aefe3aa77460b5c8a56139842fefe38d677b94b8b |
| [docs/PDF-PORTFOLIO-PROGRESS.md](../docs/PDF-PORTFOLIO-PROGRESS.md) | 4498ae2352a0239400a0fb1c30d12c04998cf5471fb1c1af40e1dfbfa007d0f6 |
| [docs/PDF-PREFLIGHT-PROGRESS.md](../docs/PDF-PREFLIGHT-PROGRESS.md) | 5f81e42b113aca9d595790e65258b8c79cf331f517cb796071f2e9b1088cee0a |
| [docs/PDF-PRESERVING-PAGE-ORDER-PROGRESS.md](../docs/PDF-PRESERVING-PAGE-ORDER-PROGRESS.md) | dcf010dc253966cef7b405b36b52eb36c53bb4094f80835584c0d6d0b15f942b |
| [docs/PDF-RANGE-QUEUE-PROGRESS.md](../docs/PDF-RANGE-QUEUE-PROGRESS.md) | fcdb52e1ee2cbc282ecdc7eb84e65ddddb31d955e231c15a2698472bfe6ec0be |
| [docs/PDF-READABLE-VIEW-PROGRESS.md](../docs/PDF-READABLE-VIEW-PROGRESS.md) | f8bc3882078d636cef4ccfaf091ae70af46fc6f9e58d2cc7b416bba2f49176da |
| [docs/PDF-READER-USABILITY-2026-10-07.md](../docs/PDF-READER-USABILITY-2026-10-07.md) | df175985a696c2f9d7925e3fdae31d8b9f235fdabc21c4043999dcb4b1d26e50 |
| [docs/PDF-REPAIR-PROGRESS.md](../docs/PDF-REPAIR-PROGRESS.md) | 3855ec28b8e1a04e37515fc3e99c2e864f7e06b913c6264feaecfb573b8405af |
| [docs/PDF-SELECTION-GEOMETRY-PROGRESS.md](../docs/PDF-SELECTION-GEOMETRY-PROGRESS.md) | 5c21a5199c101379e26c0182b3a589c6631ca8f818d36e433e000eb8c8c2c5ad |
| [docs/PDF-SIZE-SPLIT-PROGRESS.md](../docs/PDF-SIZE-SPLIT-PROGRESS.md) | e25cab07d5a1160a60c4fc095a3613c92a6abdc4954aeb00c175e90fa99da8b1 |
| [docs/PDF-TAG-TREE-PROGRESS.md](../docs/PDF-TAG-TREE-PROGRESS.md) | aa2306c4976d279fc7c28dc8731ddbee26efcd8e3819b412b66a849fdf3bd711 |
| [docs/PDF-TOOL-CONTAINMENT-PROGRESS.md](../docs/PDF-TOOL-CONTAINMENT-PROGRESS.md) | e0ad4223a8fd151466edf5535706cb53378bd795876f03001a7981c9ff3a6f79 |
| [docs/PDF-VIEW-NAVIGATION-PROGRESS.md](../docs/PDF-VIEW-NAVIGATION-PROGRESS.md) | 95495b63850a6b6dfe143327523b715dca70301e02e0a0d3172d909ba9f2cdb3 |
| [docs/PDF-XFDF-IMPORT-PROGRESS.md](../docs/PDF-XFDF-IMPORT-PROGRESS.md) | 7683c42bec938e0dd8ec63b16477acbc6ecef2df5bd883db01b802c44eb92307 |
| [docs/PDFJS-LIFECYCLE-CODING-2026-10-11.md](../docs/PDFJS-LIFECYCLE-CODING-2026-10-11.md) | 07db2d6e50ac7d736e3b0d533977d1055295ab4f8259193579b8947097b7fb42 |
| [docs/PREFLIGHT-FORMS-CODING-2026-10-09.md](../docs/PREFLIGHT-FORMS-CODING-2026-10-09.md) | 816ec5587ce410b6f3ff839360039bd785ffcf781021ff9e165e89e0fcf19538 |
| [docs/PREPRESS-AND-NAMING-BATCH-2026-10-12.md](../docs/PREPRESS-AND-NAMING-BATCH-2026-10-12.md) | ce77a7c595e13a27f7a903c334be117671b42fff5c6f6b4c0307e804ababe406 |
| [docs/PRINT-MARKS-CODING-2026-10-12.md](../docs/PRINT-MARKS-CODING-2026-10-12.md) | 32c5b12d85b464f818a1157a5b3a5dd1b5ebd91dff8241511c7e33e8e613e1b7 |
| [docs/READ-ALOUD-PROGRESS.md](../docs/READ-ALOUD-PROGRESS.md) | 583fe578718d9d2b5b6c961f64c8d8934a65b8729a60220e237bd18edc98e7fa |
| [docs/READING-CAPACITY-PROGRESS.md](../docs/READING-CAPACITY-PROGRESS.md) | dc58290d313756fa5624611e49c951e4949554b907d5e9fb5e13f0fac2e669f9 |
| [docs/REDACTION-CONTAINMENT-PROGRESS.md](../docs/REDACTION-CONTAINMENT-PROGRESS.md) | 705ca5aa88e51a0980850ce9ce307f9247083e4494455aef0aeebe305de58e70 |
| [docs/reference/forma-document-workspace-mockup.html](../docs/reference/forma-document-workspace-mockup.html) | b03fd59859286c240f28a89d57ecc572f7d04d2129d578af4a509d51221a1bb1 |
| [docs/RELIABILITY-PERFORMANCE-USABILITY-GATES.md](../docs/RELIABILITY-PERFORMANCE-USABILITY-GATES.md) | dee016a63b45b4e32d2f101adb8e05d3d835f3fb47823d665b07e369c7d0fda9 |
| [docs/REPAIR-FORMS-SELECTION-CODING-2026-10-09.md](../docs/REPAIR-FORMS-SELECTION-CODING-2026-10-09.md) | a396909ea9498208f0062b9b87d366bb7aa0cb097a7ce913dd291e2d654ace55 |
| [docs/REQUEST-WINDOWS-AND-WATCH-BATCH-2026-10-12.md](../docs/REQUEST-WINDOWS-AND-WATCH-BATCH-2026-10-12.md) | 9b32d46cba1bd679f6d87b41ec9ba5b20fdc4a9a4d834c39044bea2fb443400e |
| [docs/REVISION-CARRY-FORWARD-CODING-2026-10-11.md](../docs/REVISION-CARRY-FORWARD-CODING-2026-10-11.md) | 442207226741933b8996cca78a6aa73f71993aa00d73412842ba46beb51a5214 |
| [docs/SANDBOX-EXPLAINED-AND-ERROR-203-2026-10-11.md](../docs/SANDBOX-EXPLAINED-AND-ERROR-203-2026-10-11.md) | 287c99e98bbe8555053f10805e342cf657d7c0c52b730ca643f5f9f528b8878b |
| [docs/SANDBOX-LOADER-REPAIR-2026-10-11.md](../docs/SANDBOX-LOADER-REPAIR-2026-10-11.md) | ab3456651e92a18eb1d1b31a32079cb2754c564b3d3c7d0e44464278dfcd2e8f |
| [docs/SANDBOX-PRIVATE-DESKTOP-REPAIR-2026-10-11.md](../docs/SANDBOX-PRIVATE-DESKTOP-REPAIR-2026-10-11.md) | 3200d62c1af90c4252ff2d98f9d037404e826bd0f097966236e2d61a91f2efcf |
| [docs/SCANNER-CAPTURE-PROGRESS.md](../docs/SCANNER-CAPTURE-PROGRESS.md) | 779246ba19169f613642ae68e9a5a11ca8e8ac68ecca5fee9afdcf93d0f8face |
| [docs/SECURITY-SANDBOX-ADOPTION.md](../docs/SECURITY-SANDBOX-ADOPTION.md) | 0d14427da0f71fb78d5ae33eb2f2fe097dda231f54546c36d70b561edabbde6f |
| [docs/SECURITY-SANDBOX-PROGRESS.md](../docs/SECURITY-SANDBOX-PROGRESS.md) | 848d788da4d9bb00a839af61125ebdd9237f7879e9393876929841ad59731574 |
| [docs/SECURITY-SANDBOX.md](../docs/SECURITY-SANDBOX.md) | 332c64a8e07bcc71ea2138e260927f6ee4e36824ddb42711b444c8b50c413962 |
| [docs/SECURITY-SANITIZE-CONTAINMENT.md](../docs/SECURITY-SANITIZE-CONTAINMENT.md) | 8a1db9a167f7d87b9b795dc5778832fda491979d476444a35fc5ee3e81fe4b18 |
| [docs/SELECTED-FILE-SEARCH.md](../docs/SELECTED-FILE-SEARCH.md) | f9cb177e9866989b25e38a221775048561f0ca87dd33e9d72b23cb51e87bd703 |
| [docs/SIGNATURE-REQUEST-CODING-2026-10-12.md](../docs/SIGNATURE-REQUEST-CODING-2026-10-12.md) | 280d7a4f7057dd94ef848f26f90aabfb8254d538199cbb65c8031f92f17e3865 |
| [docs/SMART-NAMES-AND-STREAMING-COPIES-2026-10-12.md](../docs/SMART-NAMES-AND-STREAMING-COPIES-2026-10-12.md) | 60812af116d09feaec1fd059723958567cda10822a79df9c862c35d9108ce8bc |
| [docs/SPELL-CHECK-PROGRESS.md](../docs/SPELL-CHECK-PROGRESS.md) | 05dacacbaf971ab9e165b1534100218c9a820dfaf595515cb3d0a6e076485753 |
| [docs/SW3-PERSISTENT-READER-VERIFICATION-2026-10-11.md](../docs/SW3-PERSISTENT-READER-VERIFICATION-2026-10-11.md) | 08b69e1df237445f578450b756309e5af84c344c743098a3299dbf7e0d1e9f4c |
| [docs/SW3-SCROLLING-FIX-2026-10-11.md](../docs/SW3-SCROLLING-FIX-2026-10-11.md) | c2cb376de098c4c8004648ecabb6e2dbb29cb6da481c8aef85891a5a44146422 |
| [docs/SYNCHRONIZED-FILES-CODING-2026-10-12.md](../docs/SYNCHRONIZED-FILES-CODING-2026-10-12.md) | ad361d6c60167639a26a58bf9f1759f685b9444b9a326580089a65356b694032 |
| [docs/TABLE-CORRECTION-DRAFT-PROGRESS.md](../docs/TABLE-CORRECTION-DRAFT-PROGRESS.md) | fa1053de451e44df6ee176125a6bcc3f8d874e256170cffc87cdf32e24e89fb2 |
| [docs/TABLE-EXTRACTION-PROGRESS.md](../docs/TABLE-EXTRACTION-PROGRESS.md) | 0fafb673ca84ddb89994476523617a4ad715590aab7b6d1dfb2bf996c9189a4f |
| [docs/TABLE-MERGE-CORRECTIONS-PROGRESS.md](../docs/TABLE-MERGE-CORRECTIONS-PROGRESS.md) | 01af979896b47350e65af173f34035d085186a07135acfe25a8ce4214fb05f11 |
| [docs/TABLE-XLSX-PROGRESS.md](../docs/TABLE-XLSX-PROGRESS.md) | 91d8c112ae1c6f1a68a01279ba5fa7ddedeec5d25d08004f1713d8702f38c217 |
| [docs/TAG-TABLE-SEMANTICS-PROGRESS.md](../docs/TAG-TABLE-SEMANTICS-PROGRESS.md) | 777c3fe33493cd30734b39152425c044c6566678b08babe04e70318a5d83853b |
| [docs/THIN-LINE-CODING-2026-10-12.md](../docs/THIN-LINE-CODING-2026-10-12.md) | c546181c9ae5a321e610255dcb1d1929c4028011cbe55eaf70c82f0409fc447d |
| [docs/TIFF-CCITT-PROGRESS.md](../docs/TIFF-CCITT-PROGRESS.md) | c9b1c7f6ce84f3a12b8938bdeaef6bfa08e0bbb3b11197962a509584d0cbe275 |
| [docs/TIFF-DECODER-PROGRESS.md](../docs/TIFF-DECODER-PROGRESS.md) | e8dc12df20653dc68fde9c1e8f2ff8dcf5c4d015260b97b135ffbc083320636c |
| [docs/UI-INTEGRATION-AND-FINAL-SCOPE-2026-10-11.md](../docs/UI-INTEGRATION-AND-FINAL-SCOPE-2026-10-11.md) | 903e5f70e366e7789e70fe37d2be0daff125e8c108db1da8b60fcd7cddaa0fdf |
| [docs/WATCHED-FOLDER-CODING-2026-10-12.md](../docs/WATCHED-FOLDER-CODING-2026-10-12.md) | 59b1ad8c920b24c3dc574675f0d723493dceab7761688c019297916ed3bbc9d2 |
| [docs/WINDOWS-CONTEXT-CODING-2026-10-12.md](../docs/WINDOWS-CONTEXT-CODING-2026-10-12.md) | 7970eb09f825fc93398961171d4aa2ef6f961a576f50fcab4721a87fcbd669b3 |
| [docs/WINDOWS-PACKAGING-PROGRESS.md](../docs/WINDOWS-PACKAGING-PROGRESS.md) | 71ae618c4b6ac4d8529129d5d8e99c6dd26e0be0d1dfa9b0f7b86468902947f5 |
| [docs/WORD-COUNT-PROGRESS.md](../docs/WORD-COUNT-PROGRESS.md) | 709918defce19c05833d20d65cdb56eef9a3ee3cfd4ddb7ae1a87b20cd884d2f |
| [docs/WORKFLOW-LIBRARY-PROGRESS.md](../docs/WORKFLOW-LIBRARY-PROGRESS.md) | acdf9c527f1263a624ba26d1a15699c7055c853174cd7210cc473840c2ca157a |
| [docs/XFDF-IMPORT-CONTAINMENT.md](../docs/XFDF-IMPORT-CONTAINMENT.md) | f0b4f0bd3691f25b3e4261b4dda57fce69aee049bffcbe66dbbf1942cf6ddaa8 |
| [docs/PDFIX-STATUS-INVENTORY-2026-10-04.json](../docs/PDFIX-STATUS-INVENTORY-2026-10-04.json) | f194a474a3867d76d571b8d371195861cc47d869ff21514b494081871e2a7d08 |
