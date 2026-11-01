# Editing fidelity checkpoint — 2026-10-07

This is a source-backed scope checkpoint for the October 7 editing batch. It records implemented source behavior and the boundaries visible in the saved code; source is saved and compilation is recorded below; runtime acceptance remains pending.

| Area | Source-backed scope | Current boundary |
|---|---|---|
| F17 table merge/split | Manual rectangular merge and split corrections preserve the anchor text and require every covered cell to be exactly empty. Source-bound portable drafts retain merge ranges. CSV stays rectangular with blank covered cells; XLSX writes explicit merge ranges and validates the saved layout/readback. | Does not establish extraction-grid accuracy, automatic merge detection, or visual/semantic fidelity to the source table. Runtime/native export and Excel acceptance remain pending. |
| F26 form builder | `form-inspect` and `form-create` run through contained child operations. Inspection/build receipts preserve source identity and bounded proofs for original pages, widgets, fields, annotations and geometry; local drafts remain inert and source-bound. | Does not certify accessibility, sanitation, signature validity, or guaranteed behavior in all PDF viewers. Real application, recovery and containment acceptance remain pending. |
| F10 original glyph expansion | Existing embedded TrueType simple glyphs can be used for additional characters already declared by the original ToUnicode map when Unicode cmap, CID-to-GID, outline and width proofs agree. Existing font objects and mappings remain unchanged. | No new character mappings, font-object edits, compound new glyphs, shaping, reflow, or broader font support. This path's parser budgets do not prove effective OS-level allocation containment. |
| Formatted header/footer editor | The authored run editor supports up to six paragraphs and 800 characters per band, with alignment and per-run text, selected font, 8–24 pt size, color, bold, italic and underline. Layout reserves top/bottom body margins for the bands. DOCX, RTF and PDF exporters serialize formatted runs. | Preview is not a guarantee of identical pagination or appearance across renderers. Source import is a separate, limited path. |
| Formatted DOCX band import | Supported single-section default DOCX bands import explicit alignment and per-run supported fonts, sizes, colors and emphasis. Separate PAGE/NUMPAGES paragraphs are omitted with notices; cached field results never become authored text. | Multisection, first/even/odd, inherited formatting, images, links and broader source structures remain outside this subset. Existing RTF import handles only bounded plain default header/footer text/alignment; it omits rich formatting and rejects/omits multiple sections or declarations. |

## Batch boundary

These source changes do not complete the whole editing plan or establish corpus-wide fidelity. Remaining gaps include whole-plan coverage, representative PDF/DOCX/RTF corpus acceptance, native runtime and OS acceptance, and security/containment verification. Rich and multi-section source imports, text shaping and reflow, and accurate reconstruction of complex tables remain outside the demonstrated scope. Syntax checks or source inspection alone do not establish those outcomes.

## Compilation and acceptance

The initial combined editing batch compiled successfully before the desktop launch: 264 renderer modules, `index-gYU4eYg9.js`, `index-CDz2RNum.css`; contained engine SHA-256 `18817e1cca30d24138ecad91271b18e51c55479ee7a51d540fdec29ddf157cd1`. An earlier build refused a source change during compilation, then a rebuild after agents finished succeeded. This records compilation only, not runtime acceptance.

Subsequent coding adds source-bound cancellation of initial form inspection and keyboard focus/legacy alignment improvements in formatted bands. Document-generated PDF output inspection now uses a fixed contained child route with inert SHA/byte-length/page/geometry validation and observed-cleanup lifecycle guards. No runtime tests have run.

### Final combined compilation

October 7, 2026: 36 changed source files passed `node --check`; `npm run build` succeeded with 264 renderer modules. Renderer `index-CTPdDExv.js`, CSS `index-CDz2RNum.css`, contained engine SHA-256 `63189581f2bd6c67dee0c126c465cee9575ecf374e27b8e2a29d5af2dfb98030` (3058588 bytes), build source SHA-256 `9eca68f10c65f9e680c36d9eb849391cefdb3c5054ebea5c6e0ea0cce5fca0d1`. The existing bundle-size warning remains. This is source syntax and compilation evidence only. No app, PDF, broker, engine-operation, export, font, provider or print acceptance tests ran. The open desktop instance was not restarted.

The complete planned feature catalog is saved in [PDFIX-ALL-PLANNED-FEATURES.md](../PDFIX-ALL-PLANNED-FEATURES.md).
