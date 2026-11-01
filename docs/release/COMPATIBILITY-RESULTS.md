# Compatibility results (B2) — PDFix-made files in other software

## October 29, 2026: rebuilt on commit 95337de (Claude)

The October 24 folder was removed in the October 28 storage cleanup. Rebuilt with
`scripts/user-robot/compat-replay.json` (the same 20 robot steps, seed 7101, so the same 18 file names): 20/20 steps
passed, and all 18 outputs pass the checker again (qpdf, Edge/Adobe engine rendering, text, form field, redaction
absent from every decompressed byte, password refusal, Office packages). **Folder for the owner (outside Google Drive):
`C:\Users\andre\PDFix-compatibility-2026-10-29\` with CHECKLIST.txt.** The "Still to do" list below is unchanged:
Acrobat Reader, Foxit and Office still have to be opened by a person.

## October 24, 2026: automated checks on fresh outputs (Claude)

**Files:** `releases/compatibility-check-2026-10-24/`. 18 outputs made by today's build through the robot replay of
session 7101: 22/22 steps passed, each saved file checked by the robot's own reader. The PDFs are:
- Word → PDF export, and export with a header
- picture → PDF
- protected
- typed signature
- fillable field
- prepared for signing
- OCR searchable
- edited text
- redacted

The other files are Word, RTF, Excel, CSV, PowerPoint and PNG. Originals are in `originals/`.

**Checker:** `scripts/check-compatibility-outputs.mjs`. It uses none of PDFix's own writing code:
- **qpdf strict check** (`qpdf --check`); the protected file is checked with its test password, and also opened without
  it to confirm it is refused.
- **Microsoft Edge's built-in PDF viewer.** Since 2023 this viewer runs on **Adobe's Acrobat PDF engine** (the viewer
  shows "Powered by Adobe Acrobat"). The checker renders page 1, screenshots it into `_edge-screenshots/`, and measures
  that the page is not blank.
- **Content:**
  - expected text present (pdf.js extraction)
  - form fields present
  - for the redacted file, the removed word must be absent from the text **and** from every decompressed byte of the
    file (`qpdf --qdf --object-streams=disable --decode-level=all`)
- **Office files:** opened as packages; document text, pictures and tables counted; the workbook formula
  (`D2 = B2*C2`) and both sheets present; slide count; RTF header; CSV header; PNG signature.

| File | qpdf | Renders (Edge / Adobe engine) | Content |
|---|---|---|---|
| copy-4.pdf (Word → PDF) | no errors | yes | "Robot note 7101-1" present |
| header-6.pdf | no errors | yes | header text present |
| picture-9.pdf | no errors | yes | — |
| protected-8.pdf | no errors with password | — | **refused without the password** (AES-256, R6) |
| signed-10.pdf | no errors | yes | 3 pages |
| fillable-11.pdf | no errors | yes, field box visible | 1 form field |
| to-sign-12.pdf | no errors | yes | 3 pages |
| searchable-16.pdf | no errors | yes | "Replace the oil every 5,000 miles" is text |
| edited-17.pdf | no errors | yes | 3 pages |
| redacted-18.pdf | no errors | yes, black bars | **"welcome" absent from text and all decompressed bytes** |
| copy-3 / picture-2 / linked-7 .docx | valid packages | — | text, 2 pictures, 1 table |
| copy-5.rtf, table-13.csv, workbook-14.xlsx, slides-15.pptx, page-19.png | valid | — | formula kept, 2 sheets, 3 slides |

**Result: 18 of 18 pass the automated checks.**

## Still to do (not claimed above)

- [ ] **Adobe Acrobat Reader (the app)** and **Foxit PDF Reader:** open each PDF, fill the form field, search
  "oil" in the searchable copy, enter the password, and look for any "repair" prompt. Both are free; neither is
  installed yet (owner to install, or approve a download).
- [ ] **Microsoft Word / Word Online, Excel, PowerPoint:** open the Office files. Only package structure is checked
  above.
- [ ] Edge's viewer was checked on page 1 only, with a pixel measure. Pages 2+ were not looked at by eye.
- [ ] Bluebeam: no free version; not planned for the beta.
