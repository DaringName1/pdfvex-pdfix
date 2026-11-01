# Manual table merge/split corrections — 2026-10-07

Status: end-to-end source implementation saved. Seven source syntax checks passed. Renderer/runtime, native export, file picker and Excel acceptance testing remain deferred; the parent handles combined compilation.

## Added behavior

- Manual merge controls specify a one-based top-left row/column and rectangular row/column span. A merge requires two or more cells inside the current table; up to 100 nonoverlapping rectangles are accepted.
- The top-left value remains literal editable text. Every covered cell must already be exactly empty, including no spaces. If covered cells contain text, merging is refused with a concrete instruction to deliberately move needed text into the anchor and clear the covered cells first. No text is silently combined, removed, deduplicated or guessed.
- Splitting a selected merged rectangle removes only its merge metadata, preserves top-left text, and restores the already-empty covered cells as editable cells. Choosing a covered coordinate explicitly splits its whole rectangle.
- The review grid retains visible physical table row/column addresses. Anchors show the merge dimensions; covered cells are labeled and cannot be edited while merged. Rectangles spanning the 20-row review window show continuation labels referencing their anchor. Review therefore traverses every actual row without broken HTML spans or losing off-window context.
- Merge and split corrections mark the table dirty, clear review confirmation and row visits, and show the anchor's review window. Cell edits clear confirmation; grid/page/region changes keep the existing stale-table guards. Re-extraction explicitly replaces all corrections and resets merge metadata.
- Version-1 portable correction drafts gain an optional `merges` array while accepting old drafts without it. Source SHA, physical page, region and exact grid edges remain bound to the draft; merged rectangles must fit that grid and have empty covered cells. Import still resets review and never re-extracts or runs OCR automatically.
- CSV accepts the optional ranges but remains a rectangular matrix: anchor text plus blank covered cells. Controls and successful-save messages explicitly disclose that CSV cannot carry merged-cell formatting.
- XLSX emits explicit `mergeCells` ranges along with the same rectangular literal-string cell matrix. Covered cells are empty, avoiding discarded or hidden text. The contained writer reopens the archive and checks every merge reference and its independently parsed row/column bounds against the canonical requested layout, while retaining exact literal cell readback and formula/external/macro refusal.

## Strict schema

Canonical merge entries use zero-based `{row,column,rowSpan,columnSpan}` with all four fields required, no additional fields, plain object prototypes, integer values and positive spans. Bounds are the existing 100 × 32 table dimensions. Sparse arrays, overlapping rectangles and nonempty covered cells are rejected. Canonical order is anchor row then anchor column. Renderer and native helper models enforce the same layout constraints; native validation remains authoritative.

Old correction and CSV/XLSX request shapes remain accepted. Existing source-bound APIs and engine operation names are unchanged; no new IPC channels or dependencies are needed.

## Parent receipt integration

Preserve these additional fields in existing native save-route responses:

- CSV output: `mergedRanges` and `mergePolicy: 'rectangular-anchor-and-blank-cells'`.
- XLSX report: `mergedRanges` and `mergesSha256`. The strict parent result validator checks count and SHA against the canonical requested ranges as well as existing cell/source/output seals.
- Correction-draft save metadata also includes `mergedRanges`.

The renderer cancellation wording now reports a cancellation request until the guarded export settles, supporting the parent's whole-request cancellation fences.

## Files

- `src/table-extraction-model.js`: merge model and coordinate lookup.
- `src/pdf-table-extraction-workspace.js` and CSS: manual corrections, paged review markers, draft/export payloads and disclosures.
- `desktop/table-merge-validation.cjs`: canonical native rectangle validation.
- `desktop/table-correction-draft.cjs`: backward-compatible portable persistence.
- `desktop/table-export-validation.cjs`: rectangular literal CSV plus merge receipt.
- `desktop/table-xlsx-validation.cjs` and `desktop/table-xlsx-codec.cjs`: sealed layout requests/results, OOXML ranges and exact readback.

## Remaining table work

Automatic merged-cell detection, text consolidation suggestions, row/column insertion/deletion, general table reconstruction accuracy, wider OCR language support and runtime export acceptance remain unimplemented or unaccepted. Manual merging alone does not certify that the extracted grid matches the PDF's semantics or visual appearance.

## Validation

`node --check` passed for the seven changed/added JS/CJS files. No runtime tests, new test files, app launch, online access or dependency changes were performed.
