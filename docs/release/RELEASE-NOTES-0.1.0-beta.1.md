# PDFix 0.1.0 beta 1 — release notes (October 31, 2026)

**Windows 10 and 11, 64-bit. A free, private PDF and document app that works offline.**
This is a test version. Keep a copy of important files.

## Install
1. Download `PDFix-Setup-2026-10-30-fedfb1c.exe` (and `SHA256SUMS.txt` if you want to check it: `Get-FileHash` in PowerShell).
2. Double-click it. Windows may say **"Windows protected your PC"** because the beta is not code-signed: choose
   **More info → Run anyway**.
3. To remove it: Windows Settings → Apps → PDFix → Uninstall. Your documents are kept.

## What to try first (10 minutes)
1. **Open a PDF** from Home (Open a file, or drag it onto Home). It opens in Quick edit.
2. **Highlight** a line: drag along the words. **Comment**: click the page, type, press Enter.
3. **Type on page**: click where the answer goes and type. **Fill form** for real form fields. **Sign**.
4. **Save a copy** (Ctrl+S). Your original is never changed; PDFix says where the copy went.
5. **Close PDFix without saving**, open it again and open the same PDF: your unsaved work is offered back.
6. On **Home**, choose **New document**, write a few lines, use Bold and Bullets, and save it as Word or PDF.
7. **Find** (Ctrl+F), **Undo/Redo** (Ctrl+Z / Ctrl+Y) and **Print** (Ctrl+P).
Tell us anything that was confusing, took too many clicks, or did something you did not expect.

## What's in it
- Read, search and mark up PDFs and large drawings. PDFs open in Quick edit (sign, fill, mark up); switch to View to
  read or Build to change the PDF. <!-- Checked Oct 29 on e99ef03: PDFs open in Quick edit. -->

- Fill and sign, edit PDF text, organize/split/combine pages, redact (truly removes the content), password protection,
  local OCR, compress, compare drawing revisions, measure on drawings.
- Convert to and from Word, Excel, pictures and text; a Word-style document editor.
- Private by design: no account, no uploads, no tracking, no ads. Core PDF features are free.

## Known limitations

<!-- Written Oct 25 from docs/release/PDFIX_RELEASE_READINESS.md. Recheck each line on release day; delete lines that
     a later test proves, add the open P0/P1 items that remain. -->

**Installing and updating**
- Windows 10 and 11, 64-bit only. Not tested on Windows on ARM. No macOS or Linux version yet.
- Not code-signed, so Windows shows a warning the first time (see Install).
- No automatic updates: watch this repository's Releases page. A new version installs over the old one and keeps your
  recent files, saved signatures and unsaved work (tested: previous candidate a7f1900 → this build).
- Uninstalling keeps your settings and recovery data in `%APPDATA%\pdfix-document-workspace`. Delete that folder by
  hand if you want everything gone.
- Run PDFix from where the installer puts it. Run from a temporary folder (for example straight out of a zip),
  saving copies can fail.

**Features that are in the app but not yet proven in real use**
- **Signing with a certificate** (a digital signature) has not been checked in Adobe Acrobat. The usual "Fill and
  sign" signature is a picture of your name or handwriting, not a digital signature.
- **Files from PDFix** were checked with qpdf and Microsoft Edge's built-in viewer (Adobe's engine), **not yet in
  Adobe Acrobat Reader, Foxit, Word, Excel or PowerPoint**. Tell us if a PDFix file looks wrong in another program.
- **Scan to PDF** has never been tried with a real scanner.
- **Read aloud** has never been tested with sound.
- **Printing** has not been measured on paper. Check the scale of important drawings before relying on a print.
- **Making a scan searchable** is proven in English. Spanish, French, German, Portuguese and Italian are included but
  not yet checked.
- The **virtual PDF printer** and the **Windows right-click tools** are not tested on other PCs.

**Behaviour to know about**
- PDFix never changes your original unless you choose to save over it. Saving over keeps the previous version in
  Version history.
- PDFs with a digital signature are refused by tools that would change them, so the signature isn't silently broken.
- Word or RTF files that were changed in another program reopen in a simplified form (some fonts, colours and page
  numbers are dropped); PDFix tells you when this happens.
- Very large scans (over 100 million pixels per picture) are refused with a message, not shown.
- Screen readers (Narrator, NVDA) have not been tested yet.
- The new toolbar is still being finished; some buttons may move between beta versions.

**Known problems in Beta 1 — these are the first things fixed in the next update**
- **Several tools open in their own window** instead of beside your PDF: Combine, Password, Page numbers and stamps,
  PDF to pictures, Make searchable, Split, Clean up, Create fillable fields, Print and others. They work, but you
  switch windows. The next update moves them onto the main page.
- **Fill and sign started from Home** opens in its own window and saves in two steps ("Copy reopened and checked",
  then **Save filled copy**). Open the PDF first and use Fill and sign there for the one-step save.
- After PDFix closes unexpectedly, unsaved **highlights, drawings and comments** are kept but only appear once you open
  Highlight, Draw or Comment again. Unsaved Home text and typed answers are offered back straight away.
- The **interface text size** setting may go back to the default after a restart on some PCs.
- Some less-used panels still show technical wording; tell us which ones confuse you.
- **Apple Pages, Numbers and Keynote** files are not supported; export them to PDF or Word first.

## Reporting problems
Use **Settings → Save a problem report** and open an issue (never attach private documents).
Security problems: see SECURITY.md (private reporting).

## Checksums
SHA-256 of the installer, built from commit fedfb1cdb9ee4035e2ec2c2634d4cd736b6cadcd:

```
7ea719e0051afb9b885f04216fec7c1ecac543c6941d9898323b3f294dc36165  PDFix-Setup-2026-10-30-fedfb1c.exe
```
