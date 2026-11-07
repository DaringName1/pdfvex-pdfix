# PDFVEX / PDFix 0.1.0 Beta 3 release notes

PDFVEX is the new name for PDFix. Beta 3 still shows PDFix inside the app; the name changes there in Update 3.

**For Windows 10 and 11, 64-bit.** Beta 3 brings Updates 1 and 2 together. Beta 2 was skipped, so testers on Beta 1 will update directly to Beta 3.

Use the [tester guide](../BETA-TESTER-GUIDE.md) for the download, SHA-256 check and a short walkthrough. The Setup executable is unsigned, so Windows may show a SmartScreen warning.

## What’s new

- **Open files with accented names.** PDFs can now open when their filename or folder contains accents, such as año or número.

- **Keep the PDF in view while you work.** Several tool panels open beside the document. In tools that use the main area for review, **Back to my PDF** returns you to your page.
- **Fill and sign from Home.** Fill fields beside the PDF and use **Save filled copy** in one step. If the PDF is already open, the Home action returns to your current page and keeps your draft.
- **Fill and comment on more forms.** This includes supported Adobe Reader-extended forms, such as the English and Spanish IRS W-9, W-4 and 1040. The new copy keeps the regular form fields. Adobe Reader’s extra rights may be removed from that copy.
- **Work within a protected PDF’s permissions.** On supported PDFs that open without a password, use the permitted filling or commenting tool. In the tested copies, the encryption and permissions were kept. The save check supports protected copies up to 50 MB.
- **Enter text in English or Spanish.** This includes added text, comments, form answers and typed signatures. When you type or paste unsupported characters, PDFix explains the limit and keeps the text you already entered. **Make searchable** can also recognize Spanish text in scans.
- **Get clearer messages when a PDF can’t be read or edited safely.** The reader handles several files that used to stall and gives a plain explanation for many damaged files. **Save a copy** leaves the source PDF intact.

## Known limits

- A highlight drag may occasionally fail to register. If no highlight appears, drag again. A fix is planned for Update 3.
- The actual-page preview in blank-page review may open very small. Use Fit page to inspect it.
- Rare damaged PDFs may take too long to open without a clear answer. Close that PDF and try another copy.

- PDFs that require a password to open can be read after you enter it. Editing these files is unavailable in this beta.
- The preview for ink made permanent on the page can sometimes appear at a different size from the editable preview. The saved-file checks passed for the reported case.
- When a protected PDF forbids all changes, you may see a message about copying or measuring. The edit is blocked according to the file’s permissions.
- Rotating or removing pages in **Organize pages** makes a copy that keeps the pages and leaves out existing comments, links, bookmarks, and document details. PDFix warns before you save.
- Windows **Open with** may list PDFix as **Electron**. A fix is planned for Update 3.
- A protected PDF with minor damage may refuse comments and show a technical message. Your original stays intact.
- When you open a PDF from File Explorer (double-click or **Open with**), PDFix starts on Home and lists the file under **Files requested by Windows**, lower on the page. Choose **Review & open**, then **Open document**. Opening it directly is planned for Update 3.
- Close PDFix before installing Beta 3. If PDFix is open, the installer may stop without installing.
- Reopen an important saved copy in the viewer you intend to use. The candidate’s sample outputs were read back, and Adobe Acrobat Reader compatibility was not checked for this release.

## How Beta 3 was tested

Everything below ran on the exact Beta 3 code unless it says otherwise. These are our own tests, not an independent audit.

**Most tested:** opening and reading PDFs, Find, highlight, comment, draw, type on the page, Fill and sign (including the English and Spanish IRS W-9, W-4 and 1040), visual signatures, **Save a copy**, Organize pages, Combine PDFs, print preview, and getting unsaved work back after PDFix closes suddenly.

- **Automatic checks:** 608 small code checks passed with none failing. Desktop tests drive the real app the way a person does and then read the saved file with separate tools. Among them: the real Windows Save and Open windows, folders and file names with accents (año, número, Núñez), and leaving Fill and sign and coming back.
- **Robot user:** a separate Windows 10 test PC runs random everyday jobs in random order, day and night. Each saved file is opened and checked, not just the "Saved" message.
- **Public test PDFs:** 3,576 files from public test collections (veraPDF, PDF.js, qpdf, IRS forms, LibreOffice and DSS samples), many of them damaged on purpose. Each was opened, then commented on or filled, and saved. No work was lost and no saved copy was broken. Files PDFix can't handle are refused with a message. This ran on the Beta 3 candidate, before the last two small fixes.
- **Installer:** updating Beta 1 to Beta 3 kept recent files, saved signatures, unsaved comments and unsaved new documents. A fresh install also passed, with shortcuts and the Windows Apps entry checked.

**Not tested yet** (please tell us how these go): OneDrive or Google Drive folders, PDFix left open for hours or through sleep, 125% or 150% display scaling, screen readers, printing on a real printer, saved copies opened in Adobe Acrobat Reader, and very large files (1,000+ pages).

[Known issues](../../KNOWN-ISSUES.md) · [Report a bug](https://github.com/DaringName1/pdfvex-pdfix/issues)

**Download:** PDFix-Setup-2026-11-06-0c9511a.exe from the [Beta 3 release](https://github.com/DaringName1/pdfvex-pdfix/releases/tag/v0.1.0-beta.3). SHA-256: `8e191bbd6e56e15625eceb87623ee4f507eeedaec45b80b43a256663fafd1a6b`
