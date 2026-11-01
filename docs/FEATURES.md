# What PDFix can do (October 26, 2026)

Only features that are **in the app today**. Planned features are not listed; they're in
[release/PDFIX_FEATURE_INVENTORY.md](release/PDFIX_FEATURE_INVENTORY.md), section 3.

- No mark: tested and working.
- **(not yet tried for real)** means the feature exists and its screens open, but it hasn't been proven with the real
  device or outside program it depends on.

Everything works offline, on your computer. No account, no uploads. Core PDF features are free.

## Three ways to work on a PDF
- **Quick edit** (opens first): mark up, type on the page, fill and sign. Existing text and pictures stay as they are.
- **View**: just read, with nothing in the way.
- **Build**: every tool for changing the PDF itself.

## Reading
- Open PDFs, including very large ones (hundreds of pages, big engineering drawings and scans).
- Page through, zoom, fit to width or page, full screen, rotate the view.
- Page thumbnails, bookmarks (outline), page labels (like "A-101").
- Find a word on the page or in the whole PDF.
- Reading view that reflows text to fit the window, in the right order (columns, tagged PDFs).
- Select and copy text, by line or by box.
- File details, PDF layers, accessibility tag tree.
- Read aloud **(not yet tried for real: never played with sound)**.
- Safe with damaged and hostile PDFs: they open or are refused with a message, and hidden scripts never run.
- Remembers where you were in each file.

## Comment and mark up
- Highlight, underline, strike out, notes, text boxes, callouts, lines, arrows, shapes, clouds, freehand ink, eraser.
- Pen and touch support, with pressure.
- Replies and review status on comments (Bluebeam-style review), formatted comment text.
- Review a drawing's comments in a list; filter them; save and reopen.
- Export or import comments (XFDF/FDF).
- Compare two drawing revisions.

## Edit the PDF
- Fix or change text on the page; add text and pictures.
- Make a scanned PDF searchable (OCR) in English, Spanish, French, German, Portuguese and Italian **(only English
  proven so far)**.
- Turn a PDF into an editable document copy (Word).

## Fill and sign
- Fill in form fields; type anywhere on the page.
- Sign with a typed, drawn or imported signature (a picture of your signature).
- Date stamps.
- Create fillable form fields.
- Prepare a PDF for someone else to sign (mark where they sign).
- Sign with a digital certificate from Windows **(not yet tried for real: not checked in Adobe Acrobat)**.
- Saved form-fill details for reuse (autofill).

## Pages
- Rotate, delete, extract, split, reorder (drag thumbnails), combine several PDFs.
- Move pages from one open PDF into another.
- Crop and change page sizes (page boxes).
- Page numbers, headers, footers and stamps.
- Bates numbering across several PDFs.
- Edit the bookmark outline.
- Find and remove blank pages.

## Protect and check
- Password to open, limits only, or both; remove a password you know.
- Redact: truly removes text and pictures (not just covers them) and checks the result.
- Remove hidden data (metadata, hidden structures).
- Document health report, security report, repair a damaged PDF into a copy.
- Verify a PDF's fingerprint (has it changed?).
- Accessibility audit and print preflight reports **(not yet tried for real)**. No standards conformance is claimed.

## Drawings and measuring
- Calibrate a drawing's scale, then measure distance and area and count items; export the list (takeoffs).
- Drawing sheet sets (a library of sheets).
- Geospatial PDF coordinates **(not yet tried for real)**.
- Inspect and repair thin lines.

## Export and save
- Save a copy (never overwrites your original); save over Word, RTF and text files with a backup kept.
- Compress a PDF, one or several at once.
- PDF pages to pictures (PNG, JPEG).
- Extract a table to Excel (XLSX) or CSV.
- Print, with print preparation (several pages per sheet, booklet, tiling, print-production marks) **(not yet
  measured on paper)**.
- Batch copy, rename and export text from several PDFs.
- PDF portfolios and attached files (view, extract, build).
- Version history: restore earlier versions; unsaved work comes back after a crash.

## Make and edit documents (Word-style editor)
- New documents: headings, bold, italic, underline, colours, highlight, lists, tables, pictures, links, headers and
  footers, page breaks, table of contents, paper size and margins.
- Spell check, word count.
- Open and save Word (DOCX), RTF, text, Markdown, JSON, XML, YAML and CSV; export to PDF.
- Edit Excel workbook cells (XLSX) and PowerPoint slide text (PPTX) **(not yet opened in real Excel or PowerPoint)**.

## Create PDFs from other things
- Pictures to PDF (PNG, JPEG, WebP, BMP, TIFF including multi-page).
- Email (.eml, .msg) or the clipboard into a document.
- Scan to PDF from a Windows scanner **(not yet tried for real: never tried with a real scanner)**.
- Virtual PDF printer: print to PDF from other programs **(not yet tried for real)**.

## Files and Windows
- Home with recent files; open by dragging a file onto the window.
- Document tabs (several files open).
- Search for a word across chosen files.
- Open files from a synced folder (OneDrive or Google Drive) safely.
- Watched folders: new PDFs dropped in a folder get processed automatically.
- Windows right-click PDF tools **(not yet tried for real)**.
- Settings: text size, privacy (clear recent files and recovery data), the version number, a problem report you can
  save and send yourself.

---

Counted by script:
- **69 lines of features** (several lines hold more than one feature)
- **10 of them** carry a "not yet tried for real", "only English proven" or "not yet measured" note

The detailed status of every feature, with test evidence, is in
[release/PDFIX_FEATURE_INVENTORY.md](release/PDFIX_FEATURE_INVENTORY.md).
