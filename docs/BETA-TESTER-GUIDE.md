# PDFVEX / PDFix Beta 3 tester guide

PDFVEX is the new name for PDFix. Beta 3 still shows PDFix inside the app; the name changes there in Update 3.

Allow about 15 minutes. Use a synthetic sample PDF and a spare or test PC if possible. Keep important documents out of the test.

## Get the installer

1. Download the Beta 3 Setup executable and its published SHA-256 checksum from [PDFix Windows releases](https://github.com/DaringName1/pdfvex-pdfix/releases), once available.
2. Open PowerShell in the download folder and run the command below with the actual installer filename. Compare all 64 characters in the displayed hash with the published checksum. Stop if they differ.

   ```powershell
   Get-FileHash -Algorithm SHA256 -LiteralPath '.\PDFix-Setup-YYYY-MM-DD-COMMIT.exe'
   ```

3. Open the verified installer if you trust the download source. The installer is unsigned. If Windows SmartScreen shows **Windows protected your PC**, **More info → Run anyway** is available where Windows policy permits. Open **PDFix** from Start after setup finishes.

## Try an everyday PDF job

1. From **Home**, open a synthetic PDF. In **Quick edit**, find a word, highlight it, add a comment and draw a short line. Try Undo and Redo.
2. Choose **Save a copy** and give it a new name. Open both files. Confirm the copy has your edits and the original still looks as it did before.
3. From **Home**, choose **Fill and sign** and open a synthetic form. Type an answer, such as “Málaga”, in a field. Go Home and pick that same PDF with **Fill and sign**. Confirm the panel reopens and your answer is still there. Save a filled copy and reopen it.
4. Try **Sign** with a made-up name. Click where it should appear, follow the prompt, and check the saved copy. This is a visible signature for the test.
5. Open **Print** and look at the page preview, then close it. Open another tool and check that the original PDF is still open.

If you are checking an update from Beta 1, use the approved Beta 3 installer over the existing test installation. Check that a recent synthetic file, a test signature, a changed setting, and an unsaved draft are still available. Report which ones you checked.

## Report what happened

Include the PDFix version from **Settings**, your Windows version, the exact steps, what you expected, and what you saw after reopening the saved copy. Use [GitHub Issues](https://github.com/DaringName1/pdfvex-pdfix/issues) for ordinary problems and the [private reporting instructions](../SECURITY.md) for vulnerabilities.

**Never upload personal, medical, financial, or confidential documents.** Use synthetic examples. Screenshots must show the real app with synthetic documents only. Check reports and screenshots for names, file paths, and recent-file entries before sharing.

See the [release notes](release/RELEASE-NOTES-0.1.0-beta.3.md) and [known issues](../KNOWN-ISSUES.md).
