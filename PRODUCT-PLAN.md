# PDFix product plan

PDFix is a Windows-first, local document workspace for people who need to read a manual, fix a scan, organize paperwork, or understand a file without learning a professional publishing suite.

## Users and problems

- Individuals: readable documents, searchable scans, simple edits, private copies.
- Office staff: dependable page organization, form filling, conversion previews, clear output names.
- Researchers: selectable text, source references, search across deliberately selected files.
- People using assistive technology: keyboard access, scalable controls, readable layouts and progress announcements.

## Product principles

1. Preserve originals. Every output is a new copy; never silently overwrite.
2. Explain capabilities per format: Open, Preview, Edit, Convert. Opening a file is not proof of editability.
3. Make processing local by default. File content must not cause network requests.
4. Explain risks before lossy conversion, rasterization, redaction, remote sharing or agent access.
5. Show actual progress and failures. No fabricated recent files, connections, OCR or AI answers.
6. Offer plain actions, using the supplied HTML's mint palette, restrained sidebar and familiar document controls.

## Scope and acceptance criteria

### Acrobat replacement scope — user decision, October 7, 2026

The entire supplied Acrobat gap comparison is adopted in [ACROBAT-COMPETITIVE-PLAN.md](ACROBAT-COMPETITIVE-PLAN.md), with 25 traceable work packages, A01–A25, covering all ten categories. R41 records this addition. These packages expand or clarify existing work; overlapping R/M/B/F/A counts must not be added as separate features. The original comparison is preserved as planning input, with its product/legal claims unverified.

| Adopted category | Targets and placement |
| --- | --- |
| Certificate signatures and services | A01–A04: integrity/identity/trust, trust sources, token/SmartCard signing, durable evidence and routed requests/audits; expands F19/F39. |
| Commercial prepress and color | A05–A08: preflight, profile conversion, plate/overprint/trapping tools and evaluated PDF/X editions; expands F29/F40. |
| Archival and engineering standards | A09–A10: evaluated PDF/A conversion/validation and PDF/E support; expands F40. |
| Full accessibility remediation | A11–A12: tag-tree/reading-order workspace, semantics, audits and requirement evidence; expands F29/F30. |
| Advanced forms | A13–A16: XFA, isolated form logic, 2D barcode fields and reviewed endpoint/database submissions; expands F18/F38. |
| Portfolios | A17: inert navigation, supported previews, creation/extraction and reviewed layout support. |
| 3D, GIS and multimedia | A18–A20: evaluated U3D/PRC, geospatial coordinates/measurements and contained user-initiated media. |
| Managed enterprise rights | A21: supported service policies, expiry/revocation and offline rules; no DRM bypass. |
| Browser and mobile reach | A22–A24: permissioned browser reviews, additional clients and phone-friendly reflow; expands F36. |
| Difficult real-world PDFs | A25: legacy/malformed/adversarial/large-file corpus, bounded diagnostics and verified repair copies; expands F42. |

Core reliability, selection/editing, drawing comments, recovery, output and containment retain priority. Previously excluded specialist capabilities represented in A01–A25 are now adopted later targets subject to their engine/service/security dependencies. Initial-release exclusions explain staging and do not remove these new targets from the full plan. Arbitrary uncontained scripts, unrestricted agents, DRM bypass and payment pipelines remain excluded. No new implementation or acceptance is claimed, and this scope addition does not set a first-beta deadline for specialist services.

### Two-way conversions and Apple photo support — user decision, October 8, 2026

Adopted at the user's explicit request: ensure every core supported format operates reliably in **both directions** (Format ↔ PDF), and add native support for Apple iPhone/iPad photo formats:

1. **Two-way conversion requirements:**
   - **Documents:** `.docx` ↔ PDF, `.rtf` ↔ PDF, and `.txt` ↔ PDF must both import into editable formats and export to verified PDF copies.
   - **Markdown (`.md`):** Two-way support must include (a) **Styled Markdown → PDF** (rendering `#` headings, `**bold**`, bullet lists, and tables as formatted document pages, not only raw monospace code blocks) and (b) **PDF → Clean Markdown** (1-click export of structured text, headings, and tables for use with LLMs, Obsidian, and Notion).
   - **Spreadsheets (`.csv`, `.xlsx`):** In addition to PDF table extraction → CSV/XLSX, add direct **Sheet/Workbook → PDF** export from the workbook workspace with formatted grid lines and page bounds.
   - **Standard Images:** `.png` ↔ PDF, `.jpg`/`.jpeg` ↔ PDF, `.webp` ↔ PDF, and `.bmp` ↔ PDF with two-way conversion (adding WebP and BMP to the image export dropdown).

2. **Apple photo formats (HEIC / HEIF):**
   - Provide intake for Apple iOS photos (`.heic` / `.heif`) to convert directly into PDF pages alongside standard JPEG/PNG scans.
   - Support Live Photo component extraction (still photo frame) and export.
   - Evaluate a licensed, contained local decoder (such as Windows Imaging Component WIC integration or bundled WebAssembly libheif) so users can drop iPhone photos directly into PDFix without conversion warnings.

### Adopted future scope — user decision, October 4, 2026

The full [future feature list](PDFIX-FUTURE-FEATURES.md), **F01–F42**, is incorporated into this product plan. It is the saved backlog to finish alongside the original requirements, master list, Security Sandbox and Bluebeam targets. Overlapping entries describe expansions of existing features rather than additional independent features. The [complete status report](PDFIX-COMPLETE-STATUS-2026-10-04.md) distinguishes tested subsets, untested code, unfinished implementation and later evaluation.

The user wants this to establish the scope so work can concentrate on completing, debugging and validating the planned app. Do not continually add speculative features. Add further product scope when the user requests it; necessary fixes and dependencies remain part of finishing existing requirements. Keep later evaluation items and initial-release exclusions explicitly staged.

| Future scope | Plan placement |
| --- | --- |
| F01–F08: PDF-only fullscreen, appearance, selection, drawing navigation, page recipes/preservation/dragging/comparison | Reader and PDF fixes; PDF-only fullscreen is the immediate usability priority. |
| F09–F13: conversion comparison, editing fidelity, conversions/decoders and Live Photo components | Documents/images and compatibility, with engine and real-file gates. |
| F14–F19: capture, OCR, cleanup, tables, forms and certificate validation | Scanning and guided PDF fixes, with device/engine/validation dependencies. |
| F20–F23: markup preservation/exchange, sheet revisions and Bluebeam custom data/takeoffs | Drawing/comment review; retain the dad's-workflow priority. |
| F24–F28: compression, vector redaction, sanitation/containment, batches and multi-step workflows | PDF fixes and recoverable jobs. |
| F29–F33: health/accessibility, repair, sharing, Windows lifecycle and brand derivatives | Accessibility, Windows polish and release; repairs require validated results. |
| F34–F35: selected-file AI and evaluated agent integrations | AI connections, including the existing scope/consent/read-only requirements. |
| F36–F41: cloud/Studio/forms/signature services, standards and Bates workflows | Later evaluated integrations and standards work; not implied current capabilities. |
| F42: full release acceptance | Security, corpus, performance, accessibility, printing, licensing/SBOM and clean-machine release gates. |

All feature details and initial-release exclusions in the future list are retained. Incorporation into the plan does not mark their implementation or acceptance complete.

### Workspace

Native picker and drag/drop open real files. Recent files and favorites persist locally, can be filtered and forgotten, and stale paths yield an actionable error. Unsupported, corrupt, empty and excessive files are handled without crashing. Whole-file operations retain a 100 MiB budget. The October 7 large-PDF reading route allows file-backed, on-demand opening up to the current 1 GiB viewer budget, subject to RAM/disk admission and explicit per-operation capabilities; larger or resource-heavy files receive a specific reason. Actual large-file performance acceptance remains pending. No recursive directory indexing. Support matrix is visible from Home.

### PDF reading

Local PDF.js renders actual pages, thumbnails and selectable text. Users navigate, zoom, fit width, search with page references, copy page text and print all pages. Password prompts permit reading only with a supplied password and respect document permissions. Encrypted originals are never rewritten through an ignore-encryption option. Scan detection is a heuristic per page, not an OCR success claim.

### PDF fixes

Ordered page list supports rotation, removal, duplication, extraction, combining and splitting; output is reopened and verified. Annotations include highlight, underline, drawing, text, notes/comments; output retains them. Supported AcroForms and saved signatures are separately tested; XFA/digital signature certification is out of scope initially. OCR runs offline with bundled engine/language data, offers editable recognized text, preserves page coordinates and produces a searchable copy. Compression explicitly previews actual size and quality. The initial lossless/optional JPEG workflow preserves supported reachable structures and non-image content, verifies real output and discloses larger results; broader corpus and resource hardening remain gates. Any future raster mode must disclose lost text/forms. Redaction reconstructs sanitized output, excludes original streams/metadata/attachments, and passes extraction, object inspection and visual tests. Password protection uses a reviewed engine; no DRM bypass.

### Documents and images

Plain UTF-8 text, Markdown and data formats first. Familiar page editor offers headings, lists, bold/italic, undo/redo where the source representation supports them. Plain text must not be marketed as preserving rich formatting. Image preview and conversion operate locally. DOCX import warns about fidelity; RTF and office conversions require corpus tests. XLSX/PPTX initially preview/convert only. HEIC/TIFF require reviewed decoders. Legacy and Apple formats stay unavailable until verified.

### AI and agents

Models and agents are separate connection kinds. Local and custom OpenAI-compatible models can be tested and removed, with selected model displayed. Hermes uses its documented HTTP API; a loopback agent can still send context to its upstream provider and must never be labeled local-only on address alone. Harness is ambiguous: defer a named integration until its product/interface is identified. Each request selects files and shows endpoint and data destination; explicit consent precedes remote transfer. Context is text with page/line references, never broad filesystem access. Secrets use Windows-backed Electron safeStorage; fail closed if unavailable. AI results cannot invoke save/export/edit commands.

### Reliability and release

Job cancellation and memory/page limits, recovery for edits, keyboard workflows, accessible names/focus, clear errors. Windows installer and portable build, clean-machine smoke tests, notices/SBOM, dependency/security review and verified format corpus are release gates. Signing/distribution require owner credentials and a later explicit publishing decision.

## Expanded requirements added 2026-09-30

The user's gap checklist is incorporated in [REQUIREMENTS.md](REQUIREMENTS.md), with 36 detailed requirements (30 checklist requirements plus window/layout, polish and the later core inventory) and traceability for all 38 checklist entries. Its targets include bounded version history/crash recovery, failed-autosave departure protection, privacy cleanup, PDF outline/page views, text and visual comparison, safe link/attachment handling, batch queues, dependable print previews, language/uncertainty/cleanup for OCR, forms/signature distinctions, annotation preservation, conversion choices, BMP/Apple photos, standards evaluation, sharing, accessibility and opt-in Windows integration. AI requirements explicitly include read-only proposals, document-injection boundaries, image capability, per-request consent, billing/account disclosure and transfer records.

Each new operation needs a tested corpus, an explicit capability label and original-preservation/output checks. Recoverable local editor versions, privacy controls and fullscreen/collapsible workspace controls are the first additions to the existing editor slice. Comparison and remaining PDF fixes follow; format/batch/Windows/AI features retain their dependencies. Planned requirements are not verified features.

Current comparison slice: two chosen PDFs can be reviewed locally with linked/independent pages and scrolling, literal text changes and a bounded artwork-change map. Page-organizer and OCR outputs offer source/output comparison before saving. Organizer page plans supply exact source alignment; arbitrary reordered versions use explicit manual alignment until a broader matcher passes its corpus. Scan/OCR uncertainty, resolution limits and excluded metadata/form checks remain visible. See PHASE-LOG.md for native verification; this advances R09 without completing the full PDF-fix or format-fidelity phase.

## Non-goals for first release

A complete office suite, unrestricted agent tools, running document macros/scripts, certified digital signatures, DRM bypass, fidelity guarantees for arbitrary proprietary files, remote processing without consent.

## Verification policy

Complete and verify one roadmap phase before entering the next. Log exact commands, tested fixtures and known limits in PHASE-LOG.md. Infrastructure tests do not imply release readiness. Experimental operations remain labeled accordingly. A runnable checkpoint is acceptable at a session limit; incomplete phases must remain incomplete.

## Scope reconciliation and progress

[FEATURE-TRACKER.md](FEATURE-TRACKER.md) reconciles the original request, gap checklist and later core feature inventory against actual implemented adapters. It records the roughly 54% weighted product estimate, every remaining gate, useful lower-complexity additions and larger workflows. Planning coverage is complete; implementation and release verification are not. Fullscreen/compact layout, outline/page labels/saved reading state and temporary rotation are user-prioritized usability work. Cloud reviews/signature requests/standards repair remain later candidates; enterprise specialist tools remain outside the first release.

Current markup slice: PDFix highlights, underlines, notes, text boxes and drawings persist as editable PDF annotations, with independent preview/reopen checking, undo/redo, separate recovery and exclusive-copy output. Users can remove owned marks, flatten visuals while retaining notes, and choose reader/print annotation visibility. Existing foreign annotations and ordinary unsigned form values are retained; their editing and broader threaded-review support remain gates. This advances R15 without completing phase 3.

Current fill-and-sign slice: supported ordinary AcroForms retain editable values and native appearances, with blank/required guidance and independently reopened output. Typed/drawn/imported visual signatures, initials, date and text require confirmed placement; reuse is saved only by an explicit choice. Selectable label suggestions remain uncertain, and unplaced composer recovery never inserts content. Custom PDF tab order, broader fonts, calculations, OCR-based candidates and a real-form corpus remain gates. Signed/certified, encrypted and XFA writing is refused; visual signatures do not claim certificate validity. This advances R13/R14/R34 without completing phase 3.

Current image slice: PNG/JPEG/static WebP/supported BMP show actual bounded artwork and create one real PDF page with rotation, paper/orientation/margins, retained decoded resolution/transparency, source/output review and exclusive-copy saving. Camera orientation is normalized, while original photo metadata/color profiles are omitted. Source-bound page-settings recovery and failed-save departure protection extend to image workspaces. Multi-image output, pixel edits/crop, reverse export, broader color/codec corpus and text/Office PDF creation retain their gates; this advances R16–R18/R35 without completing phase 4.

Current page-geometry slice: actual-page crop boundaries support dragging or precise visual-edge margins; all-page application validates atomically. A4/Letter/custom paper fitting preserves proportions and centers vector/selectable artwork. Rotation preserves the selected crop, and bounded organizer undo/redo/reset cover the full page plan. Both worker and independent reader verify output dimensions before copy saving. Nonstandard user units, forms/signatures and encrypted writing remain refused. Hidden cropped content is retained; this is not redaction. Operation recovery, further split rules and broader preservation/fidelity corpus remain gates.

Current split slice: ordered page ranges/odd/even presets and every-N/custom-group splitting are implemented on the current page plan. Explicit omissions are disclosed, each output is independently reopened before review, and native exclusive-folder saving verifies disk bytes and handles failures without overwriting originals. Native close is guarded during export. Size/bookmark rules, operation crash recovery and broad real-file/large-split performance remain incomplete.

Current compression slice: measured lossless stream/object compression and optional supported non-JPEG image optimization use a pinned local Windows x64 engine. A reachable-structure/content check and independent all-page reopening precede actual size/quality review and protected new-copy saving. Larger outputs are disclosed. Source files, ordinary reachable forms/links/outlines/metadata/attachments are retained within verified fixture limits; image-quality loss is explicit in JPEG mode. No raster-only conversion, image downsampling, existing-JPEG recompression, sanitization or standards validation is claimed. Signed/certified/encrypted/XFA inputs are refused. Cancellation, interrupted temporary-job cleanup and native close guards are implemented; broader file/filter/color corpus, hard native memory containment, binary notices and clean-machine distribution remain gates.

Current redaction slice: explicit clean-image mode renders all visible pages and replaces marked pixels before encoding. A fresh image-only PDF excludes original text, fields, links, metadata, attachments and annotation objects. Whole-text-run matching proposes reviewable regions; manual dragging/precise positions and source-bound region-only recovery are available. Native canonical object/stream checks, independent all-page pixel/text/geometry checks and exact saved-byte verification precede success. The source remains private and unchanged. This mode flattens all text/forms; vector-preserving redaction, a broader realistic/forensic corpus and hard resource containment remain gates.

Current password slice: local AES-256 revision-6 protection uses distinct opening and owner passwords and chosen print/copy/edit permissions. Changing an encrypted source requires qpdf-confirmed owner authorization; an opening password alone is refused. Output roles/algorithm/permissions and preservation of supported reachable structures are checked natively, then all pages independently match text/geometry/pixels. Native immutable token-bound bytes are saved exclusively with disk hashing. Password fields are cleared on processing/close and are not recovered; temporary jobs can contain unprotected content and known interrupted jobs are cleaned on startup. Compatibility/real-file/normalization/native containment and distribution review remain gates. Permission flags depend on the receiving viewer.

## October scope addition

The user's complete October master list is saved verbatim as PDFix-Missing-Features-Master-List.md; MASTER-GAP-TRACKER.md records all ten sections. The user separately prioritizes **Security Sandbox**: native-engine OS containment must precede treating worker resource limits as security isolation. Continue fast coding increments; defer broad runtime testing as requested, with security/release verification still required before shipping. Engineering drawing tools, sanitation, forms, scan import, format adapters, multifile workflows, accessibility and Windows/AI additions are retained with their stated fidelity and release boundaries.


2026-10-02 parallel coding checkpoint: the saved implementation now includes selective structural PDF cleanup, attachment copies, scan deskew/OCR review exports, simple new form fields, continuous/facing-page views, range/paper/scaling/N-up/booklet printing and AI/Windows connection intake. Exact limits and next agent assignments are in PARALLEL-WORKSTREAMS.md; full feature and release gates stay open. Runtime verification remains deferred.


## Bluebeam/Revu drawing review — 2026-10-03

R39 is added for the user's dad's workflow: **review drawings and comments first**. Prioritize existing markup visibility, a searchable sheet-linked comments panel, supported threads/states/locks and preservation of other people's annotations. Revision clouds/callouts, aligned revision comparison, sheet sets, reusable tools, custom columns and takeoffs follow. [BLUEBEAM-COMPATIBILITY-PLAN.md](BLUEBEAM-COMPATIBILITY-PLAN.md) saves B01–B12 and their compatibility boundaries; the original master list stays intact. This is added scope, not a claim of existing Revu interoperability or Studio support.


### October 7 major-gap coding checkpoint

Seven feature families are now implemented and compiled: zoom-region/view history, portable table corrections, bookmark splitting, contained rich-document processing, reviewed drawing-page matching, cross-source page drag staging and single-PDF Bates numbering. [Exact scope and remaining acceptance](docs/MAJOR-GAP-CODING-2026-10-07.md). Current runtime/corpus/Windows acceptance and broader scope remain open; original acceptance checkboxes are unchanged.

### October 7 biggest-gap continuation

[docs/BIGGEST-GAPS-CODING-2026-10-07.md](docs/BIGGEST-GAPS-CODING-2026-10-07.md) records literal XLSX table export, reviewed PDF copy/rename/supported TXT queues, and contained bookmark, decoration/Bates, attachment and URI inspection routes. Source/compilation evidence only; current runtime acceptance and remaining full-plan work are not marked complete.


## October 9 user additions — free printing and reading/writing tools

Adopt F43–F46 / R42–R45: virtual PDF printer, local read aloud, expanded word count and spell-checking. R46 requires PDFix to stay free, with no required paid APIs/subscriptions, feature unlocks or purchase/upgrade links. These features use free local components; Whisper is not a speech-synthesis engine. The existing basic editor word counter is only a starting point. See [detailed scope and dependencies](READING-WRITING-PRINT-PLAN.md). No new code, tests, installs or paid integrations are claimed. Prior adopted scope remains, with provider/engine choices subject to the free-app requirement.

## Top release priorities — reliability, scale, and workspace clarity (October 9, 2026)

Adopt the [reliability, performance, and usability gates](docs/RELIABILITY-PERFORMANCE-USABILITY-GATES.md) across the full planned scope. Save, sign, split, redact, and blueprint outputs must fail closed, preserve originals, and be independently reopened and validated. Real 500-page PDFs and 300 MB sets must navigate smoothly on a documented realistic hardware tier through bounded visible-page work; numeric interaction targets will be set from measurements. Drawing, Document, and Pages need separate, task-specific workspaces without banner clutter. “Never corrupt” and “100% bug-free” are goals, not provable guarantees. All acceptance rows remain pending; source compilation is not runtime evidence. The free-app rule and all previously adopted requirements remain in force.

## October 11 — core workspaces and 20 free Acrobat additions

The user's current order is **Workspaces → PDF viewing → PDF editing**, keeping Drawing, Document and Pages tools in clear rooms with easy creation/export paths and a large paper area. Continue implementing the broader adopted scope; place new controls contextually.

All 20 additional free features are adopted as F47–F66 / R47, with explicit folder permissions under R48. [Complete list, overlap mapping and work order](FREE-ACROBAT-ADDITIONS-PLAN.md). Retain R46: no required paid providers, unlocks or payment links. Office integration may require the user's existing installed Office; free alternatives remain available. Optional local translation models and native/extension distribution require license/dependency review. No current Acrobat parity or implementation is claimed by this plan update.



## October 11 complete scope consolidation

[Final implementation plan](FINAL-IMPLEMENTATION-PLAN.md) sets the current order: Workspaces → PDF viewing → PDF editing → PDF creation/document toolbar → Bluebeam comments/review → remaining complete adopted scope → digital-pen drawing → full UI/function and release acceptance. The [complete remaining-work register](docs/FINAL-REMAINING-WORK-2026-10-11.md) and [source-preserving scope ledger](docs/FINAL-SCOPE-LEDGER-2026-10-11.json) retain R01–R50, S00, all 71 M rows, B01–B12, F01–F67, A01–A25 and G01–G16/D01–D22. Every earlier specification, dependency, preservation/security/free-app rule and applicable acceptance gate remains represented. Later adopted specialist targets supersede only their historical staging exclusions; unrelated excluded scope is retained as a boundary.

R49 records the familiar creation toolbar, comment viewing/adding/eligible editing and requested full UI/function pass. R50/F67 records digital-pen PDF handwriting and saved editable ink. Existing basic ink and newly coded toolbar/comment controls do not complete the broader targets. Current checks are scoped evidence; no blanket all-features/all-files or release-ready claim is made.
