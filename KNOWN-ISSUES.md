# Known issues in PDFVEX / PDFix Beta 3

PDFVEX is the new name for PDFix. Beta 3 still shows PDFix inside the app; the name changes there in Update 3.

For the build and release details, see [Beta 3 release notes](docs/release/RELEASE-NOTES-0.1.0-beta.3.md).

| Area | What to expect |
| --- | --- |
| Windows installer | The installer is unsigned. Windows SmartScreen may show a warning. Use the download and SHA-256 instructions in the [README](.github/README.md). |
| Highlight dragging | A drag may occasionally fail to register. If no highlight appears, drag again. A fix is planned for Update 3. |
| Blank-page review | The actual-page preview can open very small. Use Fit page to inspect it. A fix is planned for Update 3. |
| Rare damaged PDFs | A small number of unusual files may take too long to open without a clear answer. Close that PDF and try another copy. |
| Windows Open with | Windows may list PDFix as **Electron**. A fix is planned for Update 3. |
| Organize pages | Rotating or removing pages makes a copy that keeps the pages and leaves out existing comments, links, bookmarks, and document details. PDFix warns before saving. |
| Protected PDFs | A PDF that needs a password to open can be read after you enter it. Editing it is unavailable in this beta. For PDFs that open without a password, permitted edits support checked copies up to 50 MB. |
| Protected PDFs that forbid changes | The edit is blocked. The message may refer to copying or measuring rather than the tool you chose. |
| Protected PDFs with minor damage | Comment may be refused with a technical message. Your original stays intact. |
| Ink preview | Ink made permanent on the page can appear at a different size in the preview. The saved-file checks passed for the reported case. |
| Form and viewer compatibility | Some Adobe Reader-extended forms can be filled and commented on. The saved copy may lose Adobe Reader’s extra rights. Reopen the copy in the viewer you intend to use before sending it. |
| Language support | English and Spanish are supported for entering text in the PDF tools. Other characters may be refused. This limit applies to entering text and is separate from viewing existing text. |
| Opening from File Explorer | Double-click or **Open with** starts PDFix on Home and lists the file under **Files requested by Windows**, lower on the page. Choose **Review & open**, then **Open document**. Opening it directly is planned for Update 3. |
| Installing while PDFix is open | Close PDFix before installing. If it is open, the installer may stop without installing. |
| Interface text size | After PDFix closes suddenly, a changed interface text size may return to 100%. Set it again in **Settings & privacy**. |
| Damaged or unusually complex PDFs | The app may refuse to open or edit a file it cannot handle safely. Try a fresh copy from the source. |

For a new issue, include steps and a synthetic example. Never attach personal, medical, financial, or confidential documents. See [Contributing](CONTRIBUTING.md).
