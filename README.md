# PDFix for Windows — Beta 1

**A free, private PDF and document app for Windows 10 and 11 (64-bit).** Read, mark up, fill and sign, organize,
convert and protect PDFs, and write Word-style documents. Everything runs on your PC: no account, no uploads, no
tracking, no ads.

> **This is a test version (beta).** Keep a copy of important files, and please tell us what goes wrong.

## Download and install

1. Go to **[Releases](../../releases)** and download `PDFix-Setup-….exe` (and `SHA256SUMS.txt` if you want to check
   the download: in PowerShell run `Get-FileHash .\PDFix-Setup-….exe`).
2. Double-click it. Windows may say **"Windows protected your PC"** because the beta is not code-signed yet: choose
   **More info → Run anyway**.
3. To remove it: Windows Settings → Apps → PDFix → Uninstall. Your documents are kept.

PDFix installs just for you (no administrator rights needed) and never changes your original files unless you choose
to save over them.

## What to try first (10 minutes)

1. **Open a PDF** from Home. It opens in Quick edit.
2. **Highlight** a line (drag along the words) and **Comment** (click the page, type, press Enter).
3. **Type on page**, **Fill form** and **Sign**.
4. **Save a copy** (Ctrl+S). Your original is never changed.
5. **Close PDFix without saving**, open it again and open the same PDF: your unsaved work is offered back.
6. On **Home**, choose **New document**, write a few lines and save it as Word or PDF.
7. **Find** (Ctrl+F), **Undo / Redo** (Ctrl+Z / Ctrl+Y) and **Print** (Ctrl+P).

## Known problems in Beta 1 (fixed first in the next update)

See the release notes on the [Releases](../../releases) page for the full, current list. In short:

- Some tools still open in their own window instead of beside your PDF (Combine, Password, Page numbers,
  PDF to pictures, Make searchable, Split, Clean up and others). They move onto the main page in the next update.
- **Fill and sign started from Home** opens in its own window with a two-step save. Started from an open PDF it works
  on the page.
- The installer is not code-signed yet (Windows shows a warning the first time).
- The interface text size setting may not be kept on some PCs.

## Reporting problems

Open an [issue](../../issues) and describe what you did, what you expected and what happened. Use **Settings →
Save a problem report** in PDFix and attach it if you can. **Never attach private documents.** Security problems:
see [SECURITY.md](SECURITY.md).

## Licence

PDFix is free software under the **GNU General Public License, version 3 or (at your option) any later version**
(GPL-3.0-or-later). See [LICENSE](LICENSE). Third-party components keep their own licences; see
[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

This project is not affiliated with PDFix, Inc. or its products.

## Building from source

The full source for this release is in this repository. See [docs/README-DEVELOPMENT.md](docs/README-DEVELOPMENT.md)
for how the app is put together. In short: Node.js and npm, then `npm ci`, `npm run build`, and
`node scripts/build-windows-package.mjs` for a Windows package.
