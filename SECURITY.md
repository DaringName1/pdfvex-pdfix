# Security policy

PDFix opens files from people you may not know, so security reports are welcome and taken seriously.

## Reporting a problem privately

**Please do not report security problems in a public issue.** Use GitHub's private reporting instead:
open this repository's **Security** tab and choose **Report a vulnerability**. Only the maintainers can see the report.

Include, if you can:
- the PDFix version (shown in Settings) and your Windows version;
- what happens and what you expected;
- the smallest file that shows the problem. **Never send a private, client or personal document.** If the problem only
  happens with such a file, describe it instead and we will try to build a harmless file that shows the same thing.

We aim to reply within 7 days. Fixes are released on GitHub Releases and described in [CHANGELOG.md](CHANGELOG.md).

## What PDFix is designed to do

- Work offline. PDFix does not upload your documents, has no account and no tracking. It blocks network requests
  from documents and asks before opening any web link from a PDF in your browser.
- Open risky file formats inside a restricted Windows sandbox with no network access.
- Never change your original file unless you choose to save over it, and keep the previous version when you do.
- Refuse to modify digitally signed or certified PDFs rather than silently break their signatures.

## Supported versions

Only the newest beta release receives fixes during the beta.

## Not covered

- Problems that need someone to already control your Windows account or computer.
- Missing features or wrong-looking output that is not a security risk: please open a normal issue.
