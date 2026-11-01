# PDFix implementation checkpoint — October 9, 2026

This records integrated source and successful compilation. Runtime, document, UI, hardware, performance, security and standards acceptance remain pending. The full adopted goal is still active.

| Area | Coded and integrated | Remaining scope |
| --- | --- | --- |
| Certificate signing (A02) | Explicit Windows CurrentUser/My RSA certificate choice, reviewed identity/provider/dates, actual incremental approval signature, provider-bound CAPI/CNG handles, contained CMS preparation/finalization, independent output integrity validation, exact signed artwork preview and exclusive saved copy. Original bytes are preserved. | Initial invisible approval signature only: eligible unencrypted single-revision classic-xref PDFs without existing forms/signatures. Certification, multiple signatures, broader formats/algorithms, timestamping and provider/device acceptance remain. |
| Offline certificate trust (A01) | Source-bound signer certificate bundle and Windows offline base-chain inspection; explicit Windows root-store anchor fingerprint and current-date/key-usage diagnostics. Native cancellation and observed process exit. | No fetched trust information, revocation or trusted timestamp validation. Document policy/EKU, AATL/EUTL, broader profiles and runtime/security acceptance remain. Helper runs with normal Windows store access outside the document AppContainer. |
| Geospatial PDF (A19) | Actual page Viewport/Measure/CRS inspection, supported WGS84 and conservative EPSG:3857 registration, calibrated bounded coordinate queries, WGS84 point/path distances, reference-point comparison, page artwork and optional layer controls. Contained source-bound calculations connected to the reader. | Unsupported projections/ambiguous registration fail explicitly. Accuracy is unknown; known-map corpus, wider CRS and large-file expansion remain. Whole-source input limit is 100 MiB. |
| Initial accessibility tagging (A11) | Classification and ordering of eligible whole text objects, image draws and path paints; artifacts, language, Figure alternative text, eligible Span ActualText, bulk page choices, undo/redo, actual structure creation and tree/page output review. | Conservative source subset; broader nested forms, existing marked content, links/forms, semantic recovery, assistive technology and standards acceptance remain. Tagging alone does not establish accessible output. |
| File-size splitting (F05) | Actual encoded contiguous parts bounded by the chosen size, measured candidate search, complete ordered page coverage, explicit single-page-too-large refusal and existing review/save pipeline. | Not maximal compression packing; source/output/work budgets apply. Real-file preservation, cancellation and interoperability acceptance remain. |
| Readable text controls (A24 partial) | Type size, line spacing, width and text/row/column ordering choices, source-page reference, exact artwork return, local settings, column proposals and uncertainty disclosure. Hidden artwork render is skipped in readable mode. | Tables, unusual glyph maps, drawings, rotated/vertical text and semantic order need corpus work. This desktop reading view does not provide a mobile client. |

## Compilation evidence

- 35 integration/source files passed Node syntax checks.
- npm run build exited successfully; 282 renderer modules transformed, including Windows native certificate trust and signing helper compilation.
- Renderer: index-CtxkjbBR.js; CSS: index-BxCtlNi-.css.
- Build source SHA-256: c693a17e14acb81140752052a07e733c9e53e1cefa46e1489445c95889259459.
- Fixed document engine: 9794ce5f313d65a4c1e4b4144899ed0709ef09046d22ce9f21736a3c88595799 (3,261,933 bytes).
- Trust helper: db2925b43ed4e2d6bd9a12488662529ff3cb916d08a4d31f9987358a93dbb3a7 (20,992 bytes).
- Signing helper: 21e03551cabba8749078466f9b263bd23abd68e4b876d192ea2c69fdb87a23b2 (23,552 bytes).
- Windows packaging source now checks both helpers' executable/source identity, hash, size and notices. No installer/package build was run.
- No app launch/restart, runtime test, PDF execution test, scanner/key-provider/device test or broad debug cycle was performed. The running app still requires a restart to load this build.

All requirements, future items, Bluebeam drawing/comment work and A01–A25 remain adopted. Partial implementations are not full feature completion or beta readiness.
