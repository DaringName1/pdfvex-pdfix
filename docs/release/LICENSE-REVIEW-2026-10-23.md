# Licence review for PDFix: GPL-3.0-or-later (October 23, 2026)

The owner provisionally chose **GPL-3.0-or-later** and asked for every bundled dependency to be checked and the
consequences explained before it is final. Checked against the newest package
(`PDFix-0.1.0-20261021T054409131-d207b695`), its `dependency-inventory.json` (103 libraries), the native folders and
the fonts. This is a careful engineering review, **not legal advice**.

## 1. Can PDFix be GPL-3.0-or-later? Yes.

| Component (shipped in the app) | Licence | GPL-3.0 compatible? | Notes |
|---|---|---|---|
| 84 JavaScript libraries | MIT | Yes | Keep their notices |
| pdf.js, Tesseract.js (+ core), idb-keyval, wasm-feature-detect | Apache-2.0 | Yes (GPL **3**, not 2) | Why it must be "3.0 or later", not GPL-2.0 |
| mammoth, lop, option, dingbat-to-unicode, webidl-conversions, duck | BSD-2-Clause | Yes | duck says "BSD"; its text is the 2-clause form |
| sprintf-js | BSD-3-Clause | Yes | |
| inherits, minimalistic-assert | ISC | Yes | |
| tslib | 0BSD | Yes | |
| pako | MIT AND Zlib | Yes | |
| sax | BlueOak-1.0.0 | Yes (permissive) | Keep its notice |
| DOMPurify | MPL-2.0 OR Apache-2.0 | Yes | Use it under Apache-2.0 (already recorded) |
| JSZip | MIT OR GPL-3.0-or-later | Yes | Either option works |
| Electron (Chromium inside) | MIT; Chromium BSD + many (some LGPL) | Yes | Many GPL apps use Electron; LICENSES.chromium.html ships |
| qpdf 12.4.2 + OpenSSL 3, zlib, libjpeg-turbo | Apache-2.0; Apache-2.0; Zlib; IJG/BSD | Yes | OpenSSL **3** is Apache-2.0 (old OpenSSL 1.x was not GPL-compatible) |
| Node.js runtime in the document engine | MIT (+ bundled notices) | Yes | Node-LICENSE.txt ships |
| Foxit standard fonts (from PDFium, via pdf.js) | BSD-style | Yes | |
| **Liberation Sans fonts** (via pdf.js) | **GPL-2.0 only**, with a font/document exception | Shipped as separate data files: allowed | See note A |
| Tesseract language data | Apache-2.0 upstream (packages say MIT) | Yes | |
| PDFix's own helpers (sandbox, signing, trust, scanner, speech, spelling, printer) | PDFix's own code | Yours to license | Their source is in this repository |

**Note A, the Liberation fonts.** GPL-2.0-only code cannot be merged into GPL-3.0 code. These fonts are not merged:
pdf.js ships them as separate font files that are loaded as data, the same way Mozilla's pdf.js and Firefox ship them.
Both GPL versions allow distributing separate works side by side ("aggregation"). Keep the fonts as separate files with
their own licence (`LICENSE_LIBERATION` already ships). The font's own exception means documents that use or embed it
are not affected.

**Nothing found that blocks GPL-3.0-or-later.** No AGPL, SSPL or "non-commercial" licences in the app.

## 2. What GPL-3.0-or-later means for the owner

- **Anyone may use, copy, change and share PDFix**, including selling copies. Anyone who shares a changed version
  must share its full source under the same licence. **No one can turn PDFix into a closed-source product.**
- **The owner's model still works:**
  - core tools free
  - charging only for optional outside services
  - donations and sponsorships
- **The owner keeps the copyright to the owner's own code.** As long as the owner owns all of it (the code written for
  the owner by Claude and Codex, and any outside contributions signed over to the owner), the owner can later also offer
  PDFix under a different licence, for example to a company. Outside contributions would need a simple contributor
  agreement to keep that option.
- **Every binary release must come with its source.** The public GitHub repository at the same version tag satisfies
  this, if it contains everything needed to build, including PDFix's native helper sources.
- **Patents:** GPL-3.0 includes a patent licence from contributors to users.
- **Later, for macOS:** distributing outside Apple's App Store is fine. Apple's App Store terms have historically
  conflicted with GPL, so a future Mac App Store version would need a separate decision. Microsoft Store allows GPL apps.
- **The licence does not cover the name.** See section 3.

## 3. A naming risk found during this review (not a licence issue)

An existing company, **PDFix, Inc.** (pdfix.net, founded 2016), sells PDF software named **PDFix Desktop Pro, PDFix SDK
and PDFix Lite**. The ChatGPT master record already listed "name clearance" as unresolved. Releasing a free PDF app
publicly as "PDFix" could cause confusion or a trademark complaint. Whether the name is a registered trademark was not
checked here. **Owner decision before October 31:** keep the name after checking, or choose a new name for the public
release (the code can keep its internal name).

## 4. To finalize (after the owner confirms)

1. Add `LICENSE` (the full GPL-3.0 text) at the repository root, and `"license": "GPL-3.0-or-later"` in `package.json`.
2. Add a short notice to the README and the About line ("PDFix is free software under GPL-3.0-or-later").
3. Ship `LICENSE` in the package next to the existing third-party notices (`scripts/build-windows-package.mjs`).
4. Keep the full dependency licence inventory with each release.
