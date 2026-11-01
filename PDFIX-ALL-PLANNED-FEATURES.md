# PDFix — complete planned feature catalog

**Planning catalog, updated October 11, 2026.** This document describes the full adopted plan, including future work. It is not a claim that these features are finished or accepted. The status report says no broad master, Security Sandbox, or Bluebeam acceptance target is certified complete on the current build; some rows have coded subsets, and many of those still need runtime, corpus, security, usability, or release acceptance.

The catalog consolidates overlapping commitments from `REQUIREMENTS.md` (R01–R50, including G01–G16/D01–D22 traceability), the supplied master list (71 M-rows), the Security Sandbox addition (S00), Bluebeam/Revu compatibility (12 B-rows), the adopted future list (F01–F67), and the October 7 Acrobat replacement targets (A01–A25). The 20 October 11 additions, F47–F66, are adopted in full in [FREE-ACROBAT-ADDITIONS-PLAN.md](FREE-ACROBAT-ADDITIONS-PLAN.md), including their per-item overlap mappings and explicit folder grants. R49 preserves the creation/comment/UI work; R50/F67 adds digital-pen PDF handwriting. Feature counts across these sources must not be added together.

**Current priority:** Workspaces, PDF viewing and PDF editing, with clear Drawing/Document/Pages rooms, uncluttered paper, fullscreen/collapsible panels and easy creation/export. All 20 free additions remain planned expansions, with existing overlapping code retaining its narrower status.

## Product-wide behavior

PDFix is planned as a Windows-first, local document workspace for reading, editing, organizing and reviewing PDFs, plus supported documents, images and engineering drawings. Every format and operation needs an honest Open / Preview / Edit / Convert capability boundary. Before conversion, show what may change or be lost. Preserve originals, save outputs as new copies, explain collisions and offer keep-both/destination choices. Never suggest that a file type or extension proves fidelity, accessibility, security or standards compliance.

Protect work with source-bound autosave and recovery, undo/redo, bounded local versions, restore previews and timestamps, and recoverable outputs for risky operations. Wait for writes before closing or switching; if saving/recovery fails, keep the work available and offer rescue/export/retry. Restoring checkpoints current state and never rewrites the source. Let people clear recents, recovery, temporary files and transfer history independently, explaining what is removed. Diagnostics must not include document text, passwords or secrets. (R01–R05; R29; M02.08; M07.08; M09.02.)

Keep keyboard, screen-reader, focus, contrast, scalable text, reduced-motion and visible job/error status usable across every workflow. Provide responsive navigation/sidebar/focus controls and a PDF-only fullscreen mode with a reliable return path. Inspect minimum and large windows, dialogs, reader panels, comparison, editing, printing and cancellation. Keep the supplied PDFix master logo intact; create separately reviewed app/icon/background variants with licensing and provenance. (R23, R28, R30–R32, R40; M08.05–06; M09.09; M10.02; F01–F02, F32–F33.)

## Read, navigate, search and select

- Read PDFs with single-page, continuous, facing-page/two-page and side-by-side views; fit page/width, zoom and temporary view rotation. Provide outline/bookmarks, printed page labels, internal-link destinations, saved reading positions, personal bookmarks and editable bookmark/TOC entries. (R06; M03.02–03; M07.05; F01–F04.)
- Navigate large drawings with pan, zoom-to-region, fit-sheet, previous/next view history and context for sheet/revision. Keep markup selection visible while moving around; make panels collapsible/resizable without losing the selected drawing location. (M03.03, M03.10–11; B02, B09; F04.)
- Search the current document with counts and next/previous controls. Current selected-file search stays explicit. Adopted F58 adds bounded search of folders explicitly granted under R48, with recursion/persistence choices, filename/page results, cancellation and index deletion. F60 watchers require separately approved recipes/destinations. Never imply unrestricted folder or drive access. Provide a quick action finder for common commands. (M07.01–03, M07.09; F28/F58/F60; R48.)
- Copy/select readable text with page references and sensible row/column order when verified. Cover rotated, cropped, scaled, RTL, vertical, multi-column and unusual-font material; allow a bounded local region as fallback. Tables, footnotes, captions and arbitrary PDF reading order need testing, so communicate uncertainty rather than promising perfect extraction. (R07; F03.)
- Review external link destinations before opening. Do not execute PDF scripts. Show embedded attachments with type/size, and save only to a chosen location; never auto-open extracted content. Any extraction must safely handle traversal, bombs, device names and symlinks. (R08; M01.06; F26.)

## Organize, edit and compare PDFs

- Arrange, rotate, remove, extract, combine, insert, reorder, crop and resize pages; split by ranges, odd/even, every-N/custom groups and bookmarks/sections. Include page-range recipes and explain affected pages/boundaries. Crop only hides outside-page artwork; it is not redaction. Recover operations and preserve supported comments, forms, links, bookmarks and unknown data or disclose/refuse when preservation cannot be proven. (R04, R33; M02.05–06; M07.04; F05–F07.)
- Drag/copy pages between explicitly selected PDFs with preview, source mapping, keyboard alternatives, undo and output reordering. Preserve page-associated data where the supported route proves it. (M07.04; F06–F07.)
- Edit PDF text and images within a declared supported subset, add positioned text/image overlays, and edit supported existing objects. Explain font, spacing, layout, nested-resource and reflow limits. Provide preview, undo, source/output comparison and a new-copy save. Extracting text to a document is not editing PDF objects. (R34; F10.)
- Compare two PDFs side by side with independent or linked navigation, page count/order, text and artwork differences. Compare scanned pages visually and label OCR uncertainty. Align drawings with proposed/manual page matches, adjustable overlays and synchronized navigation; a pixel difference is not proof of a design change. Review lossy conversion output against source before accepting it. (R09; M03.07; B07–08; F08–09, F22.)
- Provide safe PDF compression with estimated size/quality preview, output review and disclosure of possible structure loss. Broaden image/filter/color/form coverage only after corpus and resource-limit review; existing-JPEG recompression/downsampling is not assumed. (M02.01; F24.)
- Provide useful PDF creation from supported text/documents/images, including ordered multiple images, per-image setup, paper size, margins, fonts, page breaks and preview. Export pages or selected pages to separate PDFs or images where supported. Make page additions such as blank/replacement pages, numbers, headers/footers, watermarks and reusable Draft/Approved/Reviewed stamps explicit. (R35; M02.03–06; F10–11, F41.)
- Inspect/edit/remove supported metadata, including title, author, subject and keywords. Sanitize selectively, showing planned removals for metadata, attachments, hidden layers, comments, form values, scripts/actions and other hidden content. Report limits; do not imply a complete clean bill if structures are unsupported. Permanent redaction must remove selected text/image/object content and survive forensic search/copy/object inspection. A vector-preserving mode is planned; the current clean-image approach flattens pages. (M01.01–02, M01.07, M02.07; R29; F25–26.)

## Drawings, markups, sheet sets and takeoffs

- Show existing annotations/markups from Revu-produced PDFs, with unsupported types or missing appearances identified. Add a drawing-wide searchable/filterable comments panel showing page/sheet, subject, comment, author/date, type/color/status and exact location; support stable selection and jump/highlight. (R39; B01–02, B09; F20.)
- Where supported, show reply threads, review states/history, locks and read-only status without inventing missing data. Preserve foreign markups, appearances, authors/dates, flags, IDs and unknown extension data in edited copies, or refuse/disclose a reviewed conversion. Flattened artwork cannot recreate lost metadata. (B03–04; F20.)
- Export reviewed comment reports and supported annotation exchange formats, including evaluated FDF/XFDF and separately evaluated Bluebeam BAX/XML. Report omissions. Provide reusable review stamps/styles; investigate BTX tool-set import separately. (M04.05–07; B05, B10; F21.)
- Add drawing markups such as dimensions, arrows, callouts, revision clouds, notes and color-coded comments. Distinguish visual stamps from certificate signatures. (M03.05; B06, B10.)
- Group sheets into ordered sets, use sheet number/title/revision metadata where present, and compare/revise with explicit old/new mappings. Preview missing/duplicate matches and decide whether and how comments carry forward; do not silently transfer comments to a wrong revision. Show dimensions and page size. (M03.10–11; B08; F22.)
- Show/hide actual PDF optional-content layers where supported. (M03.06.)
- Calibrate a drawing scale, then measure distance, perimeter and area with visible units and confirmation. Support persistent measurement/count markups, grouped totals, sheet-specific scale, recovery/import/export and unit conversion with disclosed precision. Distinguish source quantities from PDFix calculations; do not claim proprietary Bluebeam measurement editing or profile-only data. (M03.04; B11–12; F23.)
- Offer engineering/architectural/ISO paper presets and large-format printing at actual size, fit-to-sheet or tiled with overlap/alignment marks. Support page ranges, orientation, scaling, N-up and booklet preview with paper/duplex requirements. Physical printer validation remains necessary. (M03.01, M03.08–09; M08.07–08.)
- Treat CAD model editing and DWG-style support as a separate decoder/licensing/corpus evaluation. PDF drawing review does not imply CAD model editing. (M03.12; F12.)

## Forms, signatures and annotations

- Fill supported AcroForms and create supported text, checkbox, radio and choice fields. Improve labels, required-field guidance, tab order, fonts and supported calculations. Explain unsupported calculations/XFA. Save a completed copy, print, or export supported field data. Never execute arbitrary form JavaScript; scanned forms use confirmed user-positioned overlays unless automatic detection is validated. (R13; M04.01–03; F18.)
- Suggest likely signature/date/initial locations with uncertainty; users confirm placement and content. Support typed/drawn/stored visual signatures and reusable signatures, initials, stamps and markups with local storage/deletion controls. Explain that visual marks are not certificate validation. Certificate signatures need a reviewed validator for integrity, identity and trust; edits may invalidate them. Certified signing is not a first-release promise. External signature requests are a separate evaluated service. (R14; M01.04–05; M04.04–05; F18–19, F39.)
- Provide highlights, underline, drawing, text, notes/comments and supported preservation of existing markups. Allow show/hide, print inclusion, flattening or separate annotation-copy/report only where verified. Keep reading marks, source artwork and saved annotations distinct. (R15; M04.06–07; B04–06, B10; F20–21.)

## Scanning, OCR and extracted information

- Add direct scanner/document-camera acquisition after Windows device evaluation, including multi-page preview, ordering, rotation, removal and cancellation. Importing existing scan files is separate from device capture. (M05.01; F14.)
- Preserve originals while previewing rotation, deskew, contrast/brightness cleanup and proposed blank-page removal. Allow undo; distinguish faint content from blank. Let users locate/review uncertain OCR words/lines on the scan, correct them and verify searchable output against reviewed text. (R11–12; M05.02, M05.04, M05.06–07; F16.)
- Offer only bundled/installed, tested OCR languages; widen language/font support with corpus evidence. Show confidence as an engine estimate and explain handwriting, mixed-language, poor-resolution, skew and reading-order limits. Current tested baseline is printed English. (M05.03, M05.07; F15–16.)
- Extract tables to CSV/spreadsheet only when recognition is suitable; preview/correct cells and retain source/page references. Expand to merged, irregular and rotated tables, and validate literal exports. Do not promise automatic reconstruction of arbitrary tables. (M05.05; F17.)

## Documents, data, images and conversion

- Support tested Open/Preview/Edit/Convert subsets for PDF; DOCX/RTF/TXT/Markdown; JSON/XML/YAML/CSV; XLSX/PPTX; PNG/JPEG/WebP/BMP; multipage TIFF; HEIC/HEIF. Stage legacy DOC/XLS/PPT and Apple Pages/Numbers/Keynote behind decoder, licensing and corpus gates. Provide meaningful Markdown preview and structured data/table views while retaining source editing. (R16–19; M06.01; F09–13.)
- Improve DOCX/RTF/table/image/header/footer and PPTX fidelity with explicit layout, font, page-break, table, image, band and source-preservation review. New decoders do not imply page-perfect Word/slide fidelity. Add source/output comparison for document, office and image conversions. (M02.02, M02.04; F09–12.)
- Handle HEIC/HEIF orientation, color and metadata choices; recognize whether a Live Photo's still and motion assets were both supplied. Never invent a missing motion component. Separate component exports are explicit and codec/distribution-reviewed. (R19; F11–13.)
- Explain which links, images, page size, outlines, annotations and fields survive each conversion. Preview page breaks, fonts and tables. Do not call a byte-for-byte copy a conversion. (R16–18; F09–11.)

## Batches and reusable workflows

- Queue supported selected-file convert/compress/rename/combine operations with per-file progress/results, cancellation, bounded concurrency, output folder and collision handling. Batch rename defaults to new copies. Failures must not be silently skipped or called successful; distinguish completed, failed, canceled and unstarted work. Current planned batches include broader work beyond coded PDF copy/rename, compression and narrow TXT routes. No broad folder scan. (R21; M07.06, M07.08–09; F27.)
- Make multi-step workflows editable and reviewable, such as OCR → review → save, or combine → number → print. Reuse page recipes/settings and recover interrupted jobs without treating partial outputs as complete. (M07.07–08; F05, F28.)

## Document health, accessibility and output review

- Inspect tags, reading order, headings, links and form labels; distinguish searchable OCR from accessible structure. Add guided repairs only where semantics/results can be validated. (R20, R23; M08.01–02; F29–30, F40.)
- Expand health reports to missing/embedded fonts, oversized images, broken links, unusual dimensions, unsupported structures and print issues. Provide trustworthy file details such as dimensions, orientation, page count, size, searchability and encryption. Report only inspected evidence. (M01.07; M08.03–04; F29.)
- Prepare exact print output for preview with range, paper, orientation, scaling, annotations and raster resolution/flattening disclosed; detect invalid ranges and clipping. Clean temporary pages after OS cancellation. Validate on physical printers before release. (R10; M08.07–08.)
- Validate PDF/A, PDF/X and tagged-PDF output only with reviewed engines and actual compliance evidence. A visual match, OCR layer or filename extension is not standards proof. (R20; M10.01; F40.)

## Privacy, AI, sharing, Windows and release

- Keep ordinary processing local. For each AI request, choose provider/model or agent and exact files; show endpoint/destination, selected context and charges, and obtain consent bound to that request and file identity. An address that looks local does not prove local processing. Show image capability and require deliberate consent before page images/charts are sent. (R24, R27; M09.03–06; F34–35.)
- Keep AI read-only by default. Treat document content as untrusted, cite pages/lines and label OCR/model uncertainty. No automatic edits, exports, overwrites or file tools; proposed changes need specific approval and a reviewable diff/output. Securely manage/delete credentials and fail closed if Windows secure storage is unavailable. Show connection testing/model selection/removal and transfer history. (R25–27; M09.02–08; F34–35.)
- Evaluate Hermes against its documented API and capabilities. Identify the exact Harness product/interface before committing to integration. Generic provider support is not proof of either named integration. (M09.07–08; F35.)
- Offer a Windows share handoff for a new local copy. Cloud links/shared reviews require an identified service/account, explicit upload consent, destination and permission display, and transfer history. Bluebeam Studio Sessions/Projects are separate API/licensing/privacy evaluations; a local Revu PDF does not connect to Studio. (R22; M09.01–02; F31, F36–37.)
- Complete Windows installer/uninstaller, upgrade/update/rollback, optional Open With/file associations and user-initiated default-reader path. Never silently change defaults or delete documents/settings. Review branded/signed packaging and icon assets. (R28, R30; M09.09; F32–33.)
- Complete a real-file/adversarial corpus, performance, accessibility, physical printing, clean-machine install, licensing/SBOM/provenance and independent security review. These are release gates, not extra user-facing buttons. (R29; M08.08; M09.10; F42.)

## Acrobat replacement expansion — adopted October 7

All ten categories in the user's supplied comparison are now included. The detailed acceptance, staging and source intake are saved in [ACROBAT-COMPETITIVE-PLAN.md](ACROBAT-COMPETITIVE-PLAN.md). This expansion is planned work, with existing narrower implementations tracked separately; it establishes no new completion or Adobe benchmark claim.

| Target | Planned capability | Existing relationship |
| --- | --- | --- |
| A01 | Cryptographic validation, chain/revocation/timestamp results and evaluated trust lists | F19; M01.04 |
| A02 | Certificate signing/certification with authorized hardware tokens, SmartCards and certificate stores | Later signing expansion; M01.05 |
| A03 | Timestamp and durable long-term signature evidence | A01–A02 dependency |
| A04 | Multi-recipient routing, tracking, authentication, bulk requests and audit records | F39 |
| A05 | Commercial preflight rules, reports and reviewed fixes | F29/F40 |
| A06 | Reviewed ICC/color-profile conversion and output intents | F40; later print-production scope |
| A07 | CMYK/spot plates, overprint, ink coverage, dot gain and trapping | Later print-production scope |
| A08 | Evaluated PDF/X edition validation and output | F40 |
| A09 | Evaluated PDF/A profiles, conversion and independent validation | F40; M10.01 |
| A10 | Engineering PDF/E feasibility, supported output and validation | Standards expansion |
| A11 | Full tag-tree/reading-order editing, artifacts, alt text and table semantics | F30; M08.01–02 |
| A12 | PDF/UA, WCAG and Section 508 rule evidence plus manual/assistive-technology review | F29–F30 |
| A13 | Contained static/dynamic XFA layout, binding and data/print compatibility | F18 expansion |
| A14 | Reviewed isolated form logic; current/general document script execution stays disabled | F18; S00/R08 constraints |
| A15 | 2D barcode fields, encoding and print/scan interoperability | Later form expansion |
| A16 | Explicit consented form endpoint/database submissions | F38; M04.03 |
| A17 | Safe portfolio navigation, previews, extraction and creation | Later container support |
| A18 | Evaluated U3D/PRC 3D viewing, assemblies, sections and measurements | Later specialist decoder support |
| A19 | Georegistration, coordinate systems and calibrated GIS measurements | Later specialist decoder support |
| A20 | Contained, user-initiated embedded audio/video and evaluated rich media | Later media support |
| A21 | Authenticated enterprise policy service, expiry/revocation and offline behavior | Later service evaluation; no DRM bypass |
| A22 | Permissioned browser reviews across desktop/mobile browser clients | F36; review preservation work |
| A23 | Evaluated Mac/iOS/Android clients and Chromebook/browser reach | Windows-first platform expansion |
| A24 | Phone-friendly reflow with uncertainty and exact source-page return | Mobile reading/selection expansion |
| A25 | Legacy/malformed/large/adversarial corpus, bounded diagnostics and verified repair copies | F42; R29; S00 |

## Later candidates and explicit initial-release exclusions

These appear in the planning sources as later candidates subject to a reviewed service, standard, engine or clarified product need; they are not promised as working integrations today: cloud/shared review and links (F36); Bluebeam Studio (F37); online forms and response collection (F38); external signature requests, tracking and templates (F39); PDF/A, PDF/X and tagged-PDF validation/output (F40); and broader Bates workflows (F41). The October 7 source records a bounded single-PDF Bates feature as coded, but multi-file continuity, existing-identifier detection/registries and runtime acceptance remain. F42 is broader release acceptance, not a feature button.

Historical sources exclude from initial release: a complete office suite; unrestricted agent tools; running document macros/scripts; certified digital signatures; DRM bypass; arbitrary proprietary-format fidelity guarantees; bulk signature/payment workflows; PDF portfolios; barcode fields; advanced print-shop color management/trapping; geospatial/3D measurements; embedded multimedia playback; presentation/marketing generation; and CAD model editing/DWG-style formats. The October 7 user decision adds specialist targets covered by A02/A04/A06–A07/A13–A15/A17–A21/A23–A24 to later adopted scope; they are no longer permanently outside the full plan. General uncontained script execution, DRM bypass and payment pipelines remain excluded. Editing supported existing PPTX text and reviewing PDF drawings are distinct in-scope tasks. (M01.05, M03.12, M10.02; `PRODUCT-PLAN.md`; `PDFIX-FUTURE-FEATURES.md`; `ACROBAT-COMPETITIVE-PLAN.md`.)

## Traceability index

The following IDs are all represented in the workflows above. M IDs are the 71 distinct master-list rows; B IDs are the 12 Bluebeam rows. Source wording and detailed acceptance boundaries remain in the linked planning documents.

| Source set | IDs and subjects |
| --- | --- |
| Requirements | R01–R05 work protection/privacy; R06–R10 reading/selection/links/comparison/printing; R11–R15 OCR/forms/signatures/annotations; R16–R20 formats/conversion/Apple photos/standards; R21–R23 batches/sharing/accessibility; R24–R27 AI; R28–R30 Windows/corpus/brand; R31–R36 window/layout, visual polish, page tools, PDF editing/creation, guided signing; R37–R39 sandbox/master/Bluebeam; R40 PDF-only fullscreen; R41 all ten Acrobat replacement categories; R42 virtual printer; R43 read aloud; R44 word count; R45 spell-checking; R46 free-app rule; R47 all 20 free additions; R48 explicit folder grants; R49 creation/comment/UI integration; R50 digital-pen PDF drawing. |
| Acrobat extension | A01–A04 signatures/trust/services; A05–A08 prepress/color/PDF-X; A09–A10 archival/PDF-E; A11–A12 accessibility; A13–A16 forms; A17 portfolios; A18–A20 3D/GIS/media; A21 policy-managed access; A22–A24 browser/platform/mobile; A25 difficult-PDF reliability. All detailed targets and dependencies are in ACROBAT-COMPETITIVE-PLAN.md. |
| Security Sandbox | S00 Windows native-engine AppContainer/Job Object containment, job-only file grants, no network, bounded resources, cancellation/termination, no fallback and independent security acceptance. |
| Master: PDF security | M01.01 permanent redaction; M01.02 sanitation; M01.03 password protection/change; M01.04 certificate validation; M01.05 signature-type distinction; M01.06 safe links/attachments; M01.07 security report. |
| Master: conversion/output | M02.01 compression preview; M02.02 conversions; M02.03 multiple images to PDF; M02.04 document/text PDF creation; M02.05 page/image exports; M02.06 page additions/decorations; M02.07 metadata; M02.08 naming/collisions. |
| Master: drawings/print | M03.01 paper presets; M03.02 views; M03.03 large-sheet navigation; M03.04 calibrated measurement; M03.05 drawing markups; M03.06 layers; M03.07 revision comparison; M03.08 large-format print; M03.09 booklet; M03.10 sheet sets; M03.11 drawing information; M03.12 CAD boundary. |
| Master: forms/review | M04.01 create fields; M04.02 usability; M04.03 submission/data export; M04.04 signature placement; M04.05 reusable assets; M04.06 broader annotations; M04.07 annotation export. |
| Master: scan/OCR | M05.01 device capture; M05.02 scan cleanup; M05.03 languages; M05.04 uncertainty review; M05.05 table extraction; M05.06 searchable output; M05.07 scan limits. |
| Master: formats | M06.01 format/codec evaluation, Open/Preview/Edit/Convert distinctions, Markdown/data previews, photo metadata/color handling and corpus. |
| Master: search/jobs | M07.01 search navigation; M07.02 selected-file search; M07.03 action finder; M07.04 cross-PDF pages; M07.05 labels/bookmarks/internal links; M07.06 batches; M07.07 reusable workflows; M07.08 interrupted jobs; M07.09 no implied folder scan. |
| Master: quality/accessibility | M08.01 accessibility checks; M08.02 guided repair; M08.03 health report; M08.04 file details; M08.05 announced jobs; M08.06 accessible UI; M08.07 print preview; M08.08 physical print validation. |
| Master: privacy/Windows/AI | M09.01 sharing; M09.02 transfer history; M09.03 scoped providers; M09.04 citations; M09.05 read-only AI; M09.06 connections/secrets; M09.07 Hermes evaluation; M09.08 Harness identification; M09.09 Windows lifecycle; M09.10 release readiness. |
| Master: candidates/boundaries | M10.01 later services/standards/Bates candidates; M10.02 explicit first-release exclusions. |
| Bluebeam/Revu | B01 markup artwork; B02 comments panel; B03 replies/states/locks; B04 foreign-markup preservation; B05 reports/exchange; B06 clouds/arrows/callouts; B07 aligned revision comparison; B08 sheet sets/replacement; B09 large-sheet review navigation; B10 reusable tools; B11 custom data; B12 takeoffs. |
| Future additions | F01 fullscreen; F02 reading density; F03 complex selection; F04 large-sheet navigation; F05 split recipes; F06 object preservation; F07 cross-PDF drag; F08 drawing comparison; F09 conversion comparison; F10 editing fidelity; F11 conversion/photo handling; F12 decoders; F13 Live Photos; F14 device capture; F15 OCR; F16 cleanup/uncertainty; F17 tables; F18 forms/signing; F19 certificate validation; F20 markup preservation; F21 exchange/tools; F22 revisions; F23 custom data/takeoffs; F24 compression; F25 vector redaction; F26 sanitation; F27 batches; F28 workflows; F29 health/accessibility inspection; F30 accessibility repair; F31 Windows sharing; F32 Windows lifecycle; F33 brand variants; F34 selected-file AI; F35 Hermes/Harness; F36 cloud review; F37 Bluebeam Studio; F38 online forms; F39 signature requests; F40 standards validation; F41 Bates; F42 release acceptance; F43 virtual printer; F44 read aloud; F45 word count; F46 spell-checking; F47 form detection; F48 local autofill; F49 labels/tab order; F50 Explorer tools; F51 Office shortcuts; F52 Edge handoff; F53 synced folders; F54 EML conversion; F55 clipboard PDF; F56 local translation; F57 bookmark proposals; F58 granted-folder search; F59 naming; F60 approved watched folders; F61 CSV form merge; F62 signature preparation; F63 hashes; F64 production marks; F65 five page boxes; F66 thin lines; F67 digital-pen drawing. |

## Source precedence and status notes

The full future inventory and October 7 updates in `PDFIX-FUTURE-FEATURES.md` provide the adopted F01–F67 scope. `MASTER-GAP-TRACKER.md` and `PDFix-Missing-Features-Master-List.md` preserve the 71 original master rows and their criteria. `BLUEBEAM-COMPATIBILITY-PLAN.md` is authoritative for B01–B12 boundaries. `REQUIREMENTS.md` supplies the R01–R50 user requirements. `PDFIX-COMPLETE-STATUS-2026-10-04.md` is the status source for what is historically tested, newly coded, still untested, deferred or excluded; use it together with its October 7 linked coding checkpoints. `FEATURE-TRACKER.md` provides cross-links and older implementation detail. Older statements that a now-coded subset is absent are superseded by the dated newer status entries, but coding/build status never by itself means accepted delivery.


Latest integrated source milestone: [October 8 coding checkpoint](docs/INTEGRATED-FEATURES-CODING-2026-10-08.md). Supported scanning/OCR/certificate integrity/tag-tree/portfolio/large-comment subsets are coded and compiled; broader scope and runtime acceptance remain.


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


## October 9 adopted printing, reading and writing additions

- Virtual PDF printer: receive explicit print jobs from other Windows applications into reviewed local PDF copies. (F43/R42.)
- Read aloud: free local voices, transport/speed/language controls, scoped text, highlighting and incremental reading with OCR/order disclosures. Whisper is audio-to-text, not the read-aloud engine. (F44/R43.)
- Word count: selection/page/document statistics for supported editor and PDF text, with declared counting rules and omissions; expand the existing basic editor counter. (F45/R44.)
- Spell-checking: free local suggestions, approved replacement, ignore/personal dictionary and Undo/recovery in supported editable content. (F46/R45.)

R46: PDFix is free. No required paid API/subscription, purchase/upgrade link or paid feature unlock; these additions stay local. Engine/integration choices throughout the plan must respect this rule. [Detailed plan](READING-WRITING-PRINT-PLAN.md). All four remain planned rather than newly implemented/tested.


## October 9 local text/printing coding update

See [current compiled checkpoint](docs/LOCAL-TEXT-PRINT-CODING-2026-10-09.md) for F43–F46 / R42–R46: local read aloud, spelling, scoped statistics, optional Windows PDFix printer and local-only AI are integrated coded subsets. Compilation passed; runtime/output/performance/beta acceptance remains pending. Preserve all remaining full-scope work. The [three release priorities](docs/RELIABILITY-PERFORMANCE-USABILITY-GATES.md) govern integrity, large-file responsiveness and separate simple workspaces; none is certified passed.


## October 11 complete scope consolidation

[Final implementation plan](FINAL-IMPLEMENTATION-PLAN.md) sets the current order: Workspaces → PDF viewing → PDF editing → PDF creation/document toolbar → Bluebeam comments/review → remaining complete adopted scope → digital-pen drawing → full UI/function and release acceptance. The [complete remaining-work register](docs/FINAL-REMAINING-WORK-2026-10-11.md) and [source-preserving scope ledger](docs/FINAL-SCOPE-LEDGER-2026-10-11.json) retain R01–R50, S00, all 71 M rows, B01–B12, F01–F67, A01–A25 and G01–G16/D01–D22. Every earlier specification, dependency, preservation/security/free-app rule and applicable acceptance gate remains represented. Later adopted specialist targets supersede only their historical staging exclusions; unrelated excluded scope is retained as a boundary.

R49 records the familiar creation toolbar, comment viewing/adding/eligible editing and requested full UI/function pass. R50/F67 records digital-pen PDF handwriting and saved editable ink. Existing basic ink and newly coded toolbar/comment controls do not complete the broader targets. Current checks are scoped evidence; no blanket all-features/all-files or release-ready claim is made.
