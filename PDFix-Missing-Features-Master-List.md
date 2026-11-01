# PDFix Missing Features — Master Gap List

This consolidates the useful missing-feature ideas discussed for PDFix. It is a planning list, not a claim that these features are implemented. The goal is a simple document workspace with useful PDF, document, photo, and engineering drawing tools—not a copy of every professional publishing suite.

## Status note

The Drive project documents working PDF reading, page organization, crop/resize, markups, supported forms and visual signatures, OCR, image-to-PDF, comparison, and local recovery. The README and architecture describe page-range selection and automatic splitting as implemented, while the older feature tracker still lists automatic splitting as future work. Confirm that tracker status against the current build.

## 1. PDF security, cleanup, and protection

- **Verified permanent redaction:** remove selected text, regions, image content, and underlying objects so hidden information cannot be recovered. Search repeated words/numbers, show every match, and require review before applying.
- **Sanitize before sharing:** inspect and selectively remove metadata, embedded attachments, hidden layers, comments, form values, scripts/actions, and other hidden content. Show what will be removed.
- **Password protection and changes:** add or change PDF passwords using a reviewed implementation; explain permissions and never bypass access controls.
- **Digital signature validation:** detect certificate signatures and report valid, invalid, or unable to verify only when a reviewed validator supports the result. Warn when edits may invalidate signatures.
- **Separate signature types:** distinguish visual signatures, certificate-based signatures, and external signature requests.
- **Safe links and attachments:** show external destinations before opening; list attachments with type/size details and save only to a chosen location. Never execute PDF scripts or auto-open extracted files.
- **Plain-language security report:** explain encryption, signatures, active content, attachments, and unsupported structures.

## 2. Compression, conversion, and PDF creation

- **Compression with quality preview:** show expected size savings and let users inspect quality before saving. Disclose possible loss of text, forms, links, annotations, or other structures.
- **Broader conversions:** support more tested conversions between PDFs, documents, images, and data files. For each, disclose what happens to fonts, page breaks, images, links, bookmarks, forms, and annotations.
- **Multiple images to PDF:** add an ordered image list, per-image rotation, page layout, paper size, and recoverable source references. Current documented workflow makes one PDF from one image.
- **Create PDFs from text/documents:** provide page size, margins, fonts, page breaks, and preview.
- **More export options:** save a page or selected pages as images; export selected pages as separate PDFs; consider reverse PDF-to-image conversion.
- **Page additions:** insert blank pages, replace pages with corrected scans, and add page numbers, headers, footers, watermarks, or reusable Draft/Approved/Reviewed stamps.
- **Metadata tools:** inspect and optionally edit or remove title, author, subject, keywords, and other supported metadata.
- **Output naming:** offer clear names, keep-both, and destination choices; never silently overwrite originals or unrelated files.

## 3. Paper, print, engineering, and architecture drawings

- **Paper-size presets:** common US Letter and Legal, engineering ANSI A–E, architectural ARCH A–E, and ISO A-series such as A0–A4, where supported by the operation.
- **More page views:** single page, continuous scroll, facing pages, two-page spread, and side-by-side pages, with clear page order.
- **Large-sheet navigation:** smooth pan and zoom, zoom-to-region, fit-sheet, and return-to-previous-view for blueprints, plans, schematics, and maps.
- **Scale-aware measurement:** calibrate drawing scale first, then measure distance, perimeter, and area with visible units and a way to confirm calibration.
- **Drawing markups:** dimension lines, arrows, callouts, revision clouds, and color-coded comments alongside notes, highlights, and drawing tools.
- **PDF layers:** show or hide layers where the PDF contains them.
- **Drawing revision comparison:** align sheets and compare with a transparent overlay or side-by-side view; allow alignment adjustment when scale or position shifted.
- **Large-format printing:** print at actual size, fit to a chosen sheet, or tile across pages with overlap and alignment marks. Include ranges, orientation, scaling, and multiple pages per sheet.
- **Booklet printing:** provide layout preview and clear paper/duplex requirements.
- **Sheet sets:** group related drawings, navigate sheets, and preserve order.
- **Drawing information:** show sheet number, title, revision, dimensions, and page size when present.
- **CAD boundary:** do not imply PDFix edits CAD models; DWG and other CAD formats need separate decoder, licensing, and corpus evaluation.

## 4. Forms, signatures, and review

- **Create basic fillable forms:** add supported text, checkbox, radio, and choice fields, in addition to filling existing fields.
- **Improve form usability:** clearer labels, tab order, required-field guidance, supported fonts, and explanations for unsupported calculations/fields.
- **Form submission:** save a completed copy, print it, or export supported field data; explain unsupported fields.
- **Signature placement help:** identify likely signature/date/initial fields and suggest locations, but require confirmation of content and placement.
- **Reusable assets:** save user-approved signatures, initials, stamps, and common markups with clear local storage and deletion controls.
- **Broader annotations:** edit third-party annotations, threaded replies, and comment exchange only after preservation tests.
- **Annotation export:** offer a separate annotation summary or copy where verifiable.

## 5. Scanning, OCR, and information extraction

- **Scan from a device:** import from scanner/document camera, including multi-page scans where supported; preview, reorder, rotate, or remove pages before making a PDF.
- **Scan cleanup:** preview deskew, contrast/brightness cleanup, rotation, and proposed blank-page removal. Distinguish faint content from blank pages and allow undo.
- **Broader OCR:** add only tested bundled/installed languages; make language choice clear and show confidence as an estimate.
- **Uncertainty review:** locate uncertain words/lines on the scan, preserve page references, and require review before saving corrections.
- **Extract tables:** offer table-to-CSV/spreadsheet export only when recognition is suitable, with preview to catch misaligned rows and columns.
- **Searchable documents:** preserve scan images and explain when OCR reading order or recognition needs review.
- **Clear scan limits:** explain limits for handwriting, low resolution, skew, mixed languages, and complex reading order.

## 6. File formats, photos, and editing fidelity

Evaluate and add tested support for HEIC/HEIF (orientation and metadata choices), multipage TIFF, RTF, XLSX/PPTX preview/conversion, legacy DOC/XLS/PPT, and Apple Pages/Numbers/Keynote. Add a meaningful Markdown preview and structured table views for CSV/data files while retaining source editing. Complete real-file fixtures for XML, YAML, CSV, BMP, and uncommon image variants before claiming support. Clearly separate Open, Preview, Edit, and Convert for each format. Explain fidelity limits before conversion. Let users choose whether photo metadata/color profiles are kept or removed.

## 7. Navigation, search, and multi-file workflows

- **Search navigation:** match counts and next/previous controls.
- **Search selected files:** search only deliberately selected files; show filename and page for each result.
- **Quick action finder:** “What do you want to do?” search for sign, split, compress, OCR, compare, or convert.
- **Move pages across PDFs:** drag pages between open PDFs with a visible preview.
- **Page navigation:** jump by printed page label; edit bookmarks/table-of-contents entries; safely show internal link destinations.
- **Batch operations:** queue supported conversion, compression, rename, combine, and other verified actions with per-file progress/results, cancellation, output location, collision handling, and bounded resources.
- **Reusable workflows:** repeat reviewed sequences such as OCR → review → save copy or combine → number pages → print; show and allow editing of steps before running.
- **Recover interrupted jobs:** let users retry/discard failed or canceled jobs without confusing partial output for completed work.
- Search and batch features must not imply broad folder scanning.

## 8. Accessibility, quality checks, and inspection

- **Accessibility checks:** inspect tags, reading order, headings, links, and form labels; distinguish searchable OCR from accessible structure.
- **Guided accessibility repair:** offer fixes only when results can be validated; don’t promise automatic tagging makes a PDF fully accessible.
- **Document health report:** identify missing fonts, oversized images, broken links, unusual page sizes, unsupported features, and possible print problems; offer safe fixes only where verified.
- **Trustworthy file details:** show page dimensions/orientation/count, file size, text searchability, encryption state, and feature limits.
- **Accessible job status:** announce progress, failures, and cancellation to keyboard and screen-reader users.
- **Scalable interface:** test larger text, contrast, visible focus, keyboard navigation, and reduced motion throughout dialogs/workflows.
- **Print preview:** inspect prepared output, selected pages, paper, orientation, scaling, annotations, and rasterization before Windows handoff.
- Physical printer validation remains a release check; simulated preparation alone does not prove paper output.

## 9. Privacy, sharing, Windows, and AI

- **Share local copies:** provide Windows share handoff for a new copy. For cloud links/uploads, show service, account, destination, and permissions before sending.
- **Transfer history:** if online AI/sharing is added, show what files were sent, to which endpoint/service, and when; allow cleanup.
- **Optional AI providers/agents:** scope each request to selected files; show provider, model, endpoint, destination, and possible account charges before transfer.
- **Cited answers:** provide page/line references where available and distinguish source text from generated explanation.
- **Read-only AI by default:** treat document contents as untrusted; prevent automatic saving/exporting/overwriting/tool use. Require separate approval and a reviewable result for changes.
- **Connection controls:** test, select, and remove connections; store secrets using Windows-backed secure storage and fail closed if unavailable.
- **Hermes:** evaluate its documented HTTP API before implementing.
- **Harness:** defer until the exact product/interface is identified.
- **Windows lifecycle:** installer, uninstaller, updates, optional file associations, and Open with PDFix.
- **Release readiness:** security, licensing, dependency/SBOM, performance, clean-machine install, and real-file corpus reviews.

## 10. Later candidates and first-release boundaries

Later candidates: online signature requests/tracking, shared/cloud review, online form response collection, PDF/A or PDF/X validation, tagged-PDF validation, accessibility repair, and Bates numbering. Each needs a clear user need and reviewed engine/service before it appears as working.

Keep bulk signature/payment workflows, PDF portfolios, barcode fields, advanced print-shop color/trapping, geospatial/3D measurement, embedded multimedia, presentation generation, and CAD model editing out of the initial scope unless the direction changes.

## Current product features (not missing)

The project documents a Windows-first local Electron workspace; picker and drag/drop; recents/favorites; PDF reading, search, selection, print preparation, outlines and saved reading positions; page organization, crop/resize, page ranges and documented automatic splitting; PDF comparison; PDFix markups; supported AcroForm filling and confirmed visual signatures; local English OCR with review; basic DOCX/TXT/source editing; version/recovery tools; and one-image-to-one-page PDF creation. Each has limits; some support applies only to tested subsets.

