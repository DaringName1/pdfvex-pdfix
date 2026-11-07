# Contributing to PDFVEX / PDFix

PDFVEX is the new name for PDFix. Beta 3 still shows PDFix inside the app; the name changes there in Update 3.

For bugs and suggestions, use the [public issue tracker](https://github.com/DaringName1/pdfvex-pdfix/issues). For vulnerabilities, follow [SECURITY.md](SECURITY.md).

## Report a problem

- Include the PDFix version, Windows version, the tool you used, the steps, and what happened. Say whether you could reopen the saved copy if the problem involved saving.
- **Never upload personal, medical, financial, or confidential documents.** If a file is necessary, create a small synthetic example that reproduces the problem. The same rule applies to screenshots, logs, and exported problem reports. Review attachments for names, file paths, and document content.
- Keep screenshots of the real app and use only synthetic sample documents. Close unrelated windows and clear private recent-file entries from the frame.

## Propose a change

For a substantial change, open an issue first. Keep a pull request focused and describe what changed, how you checked it, and any remaining limits. For a file-writing change, verify that the output reopens with the expected content and that the source is intact. Keep existing test coverage when updating a test.

The Windows development setup uses Node.js 24 and npm. Run `npm ci` to install dependencies and `npm run build` to compile the app. The public export contains the application and build inputs. Use synthetic fixtures and verify saved output when proposing a change.

See [LICENSE](LICENSE) for the project’s GPL-3.0-or-later license and [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) for bundled components.
