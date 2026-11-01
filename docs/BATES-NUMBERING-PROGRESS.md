# Bates numbering — 2026-10-07

Status: bounded single-PDF implementation added in source. Syntax checks passed; runtime parsing, rendering, pickers and output verification were not executed during this work. The parent task handles the combined compilation.

## Added behavior

- The existing Page numbers and stamps workspace now offers a Bates sequence mode inside its page-number card. Existing routes open the same workspace; no new main/preload channels are needed.
- Exact printable ASCII prefix and suffix are preserved, including literal braces and spaces. Each is limited to 40 characters. Numeric start is an explicit integer from 0 through 999,999,999,999; fixed numeric width is 1–12 digits.
- Numbering is consecutive in the selected physical-page order. Physical page numbers are distinct and bounded; up to 100 selected pages from a PDF of up to 500 pages use the existing decoration workflow. A range such as `5, 1-3` numbers page 5 first, then pages 1, 2 and 3. It does not reorder the source PDF.
- A live planned mapping lists every complete identifier with its original physical page and the full first/last identifier. Invalid start, prefix, suffix, selection or fixed-width overflow is explained. The native validator independently checks the complete sequence before producing output.
- The native writer draws the complete identifier using the existing standard-font placement, inset, color, opacity and page-rotation handling. Actual text that cannot fit the visible page is refused. Original source protection and existing signed/encrypted/certified/XFA/geometry restrictions remain.
- The output report contains the complete generated mapping, first/last identifiers, count and uniqueness within this newly generated sequence. It reports bounding-box overlap between Bates artwork and other newly added decorations. Existing source artwork and existing identifiers are explicitly left for manual review; there is no false collision-clear verdict for pre-existing material or other documents.
- Before saving, the workspace shows native output mapping plus original/output artwork for every selected physical page. The explicit review checkbox covers the complete mapping and possible existing identifier/artwork collisions. Changing any settings invalidates the preview and review receipt.
- Saving uses the existing native staged decoration output and verified exclusive new-copy writer. It does not overwrite the original or existing files, and no generated PDF is put into localStorage.

## Compatibility and reusable styles

Version 1 ordinary decoration drafts and templates without a `pageNumbers.mode` property remain valid. Optional `mode` is a strict `standard` / `bates` enum. Bates adds strictly typed `prefix`, `suffix` and integer `padding`; those fields are rejected in ordinary mode.

The renderer style validator, style capture, named-template summary and template apply path now round-trip these settings. Applying an older ordinary template explicitly restores ordinary mode and clears Bates affixes; physical-page selection remains unchanged. The existing template count/size limits and explicit apply/build/review behavior remain. There is no separate native persistent template store to migrate; the authoritative native decoration validator validates the resulting draft again before writing.

## Files

- `src/pdf-decoration-workspace.js` and CSS: Bates controls, live and native-output mappings, collision disclosure and review text.
- `src/pdf-bates-model.js`: bounded renderer sequence/style model.
- `src/pdf-decoration-template-model.js` and `src/pdf-decoration-template-library.js`: backward-compatible saved styles.
- `desktop/pdf-bates-numbering.cjs`: bounded native sequence/style model.
- `desktop/pdf-decoration-validation.cjs`: optional-field and complete-sequence validation.
- `desktop/pdf-decoration-worker.cjs`: exact text drawing and native mapping/overlap report.

## Remaining F41 scope

This is a reviewed single-PDF numbered batch. Multi-file sequence continuity, cross-document collision registries, persisted batch ledgers/number reservations, legal compliance certification, identifier removal and automatic detection of existing Bates numbers remain unimplemented. The app does not claim any legal or evidentiary certification.

## Checks performed

`node --check` passed for the seven changed or added JS/CJS source files. No tests, app launch, online access, or new dependencies were used.
