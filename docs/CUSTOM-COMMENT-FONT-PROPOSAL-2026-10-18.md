# X1 custom-font implementation proposal (October 18, 2026)

Owner approved October18: add the exact production dependency @pdf-lib/fontkit 1.1.1, the font adapter recommended by
pdf-lib, for bounded source-font inspection inside the existing contained PDF review worker. Do not install until
owner approval (now received). The only shared integration is package.json/package-lock.json, committed alone by the integrator
(or a specifically authorized additive shared change); Codex owns the review adapter/tests.

Why: PDFix currently knows only the standard PDF fonts. Replacing an embedded custom font with Helvetica would
change a drawing review. A handwritten TrueType/CFF parser would add unnecessary security/maintenance risk.
The existing pdf-lib 1.17.1 already has the intended font-adapter API; no new service, network use or security
permission is proposed. No installed/system fonts are read by this work.

Concrete first implementation:
1. Read only an already embedded font program from the immutable source, through bounded unfiltered/Flate streams
   (4 MiB per font, 16 MiB unique total). Refuse external streams, unsupported decoding parameters and collections.
2. Support a declared horizontal Type0/Identity-H CIDFontType2 source first. Decode a bounded ToUnicode map and
   CIDToGIDMap; use the adapter to check that each replacement character maps to a real existing glyph and to measure
   its bounds. Keep the original font program and original mappings. Clone only the font resource dictionary for
   the new appearance; never silently substitute another font or invent absent subset glyphs.
3. Retain the same source identity, standard annotation geometry/format checks, source seal, reviewed preview and
   verified-copy publication. Oversized fonts, malformed maps, missing glyphs, shaping requirements or overflowing
   text refuse safely with a useful message. Broader font types only after an explicit tested adapter.
4. Generated test PDFs use the Liberation font already distributed by pinned pdfjs-dist. No private drawings or
   operating-system font files are uploaded. Include source/object/font-byte preservation, independent PDF.js
   appearance text, a failure path, app save/reopen, robot verification and four visual configurations.
5. Cloud/spare-PC/package acceptance is still separate; Claude uploads and packages. No Bluebeam or X4 scope added.

Read-only npm metadata on October18: @pdf-lib/fontkit 1.1.1 is MIT, 4,299,890 unpacked bytes, one declared dependency
pako ^1.0.6. The alternative upstream fontkit 2.0.4 is MIT, 5,610,637 unpacked bytes and nine dependencies; the
pdf-lib-specific adapter is the documented integration and has the smaller dependency closure. The locked resolved
closure/license/security results must be reviewed before committing; a new adverse finding returns to the owner.

References: https://pdf-lib.js.org/docs/api/classes/pdfdocument#registerfontkit and
https://github.com/Hopding/pdf-lib#embed-font-and-measure-text. Source PDF mapping rules:
https://developer.adobe.com/document-services/docs/assets/35e4369068f86065372c18787171a17e/PDF_ISO_32000-1.pdf.

AGENT-WORKFLOW Rule5 / If something goes wrong explicitly says: Anything destructive, any dependency change,
any architecture change: stop and ask the user. This proposal is a real dependency decision, not permission to
resume already authorized comment editing or tests. Until answered, Codex continues standard-font rich formatting,
the existing memory investigation and cloud/packaged checks.

Implementation status: the owner has approved this bounded dependency. The later V1 audit freezes new feature work, so installation and implementation are deferred until the critical audit work permits resumption. No dependency or lockfile has been changed. This is an approved plan, not shipped custom-font support.
