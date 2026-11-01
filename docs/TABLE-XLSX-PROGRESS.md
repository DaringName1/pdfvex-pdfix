# Literal table XLSX export — 2026-10-07

Status: concrete renderer, native validator, contained service and child codec implemented. Source syntax checks passed; runtime execution and Excel acceptance remain deferred. The parent task owns shared native wiring and combined compilation.

## Behavior

The table extraction workspace now offers **Save reviewed XLSX** alongside CSV and portable correction drafts. It uses the same current-source hash, nonstale rectangle, all-rows-visited and explicit cell-review gate as CSV. Loaded corrections require fresh review before either export. Cancelled saving retains corrections and review state. A separate Cancel XLSX preparation action calls the contained-family cancellation bridge; close/departure stays guarded throughout preparation and the native save picker.

The workbook has one sheet named `Extracted table`. Every reviewed cell is stored as `inlineStr` with text number formatting and wrap enabled. Leading zeroes, spaces, empty cells, formula-looking values, multiline text and permitted Unicode remain literal text. No formulas, numeric inference, macros, external relationships, hyperlinks, source PDF content, attachments or links are embedded. Formula-looking text is not prefixed with an apostrophe in XLSX.

OOXML escaped-string-looking literals such as `_x000D_` first escape their underscore; read-back decodes escaped notation exactly once. Carriage returns use OOXML encoding and are restored during the exact cell comparison. XML metacharacters are escaped. Invalid surrogate sequences, unsupported XML/control characters and Excel cell-limit violations are refused; the existing table limit of 10,000 UTF-16 code units is stricter than Excel's 32,767 limit.

Limits: up to 100 × 32 cells, 500,000 total UTF-16 code units, physical page 1–500, 100 MiB original PDF snapshot, 2 MiB contained request including framing, 10 MiB generated/reopened ZIP archive and the existing archive/XML structural limits. ZIP/XML writing and reopening occur only in the fixed contained engine. Native main-process validators inspect inert request/receipt shapes and sealed byte/hash bounds; they do not invoke the codec or ZIP/XML parser.

Read-back independently reopens the generated workbook, checks the exact fixed archive parts, absence of formulas/external/signature/read-only features, each literal cell address/type/value and the generated output SHA. The copy receipt is bound to source SHA, physical page, extraction mode, normalized rectangle, row/column count and literal-cell SHA.

## Parent integration contract

1. In the fixed document engine, require `writeTableXlsx` from `table-xlsx-codec.cjs`, add fixed operation `table-xlsx-write`, reject options whose only key is not `draft`, and return `writeTableXlsx(bytes, options.draft)`. Add the exact operation to `DocumentSandboxService.OPERATIONS`. No larger request budget or unrestricted fallback is needed.
2. Instantiate `TableXlsxService` from `table-xlsx-service.cjs`. Add it to existing contained-family lifecycle, cancellation, disposal/restart and security/status handling. Its `build(id,source,draft)` returns `{bytes,report}` after operation-specific result validation. Its inherited `cancel(id)` cancels preparation and observes containment cleanup.
3. Register `save-table-xlsx` under the existing immutable-source guard and `splitSaves` close protection. Match CSV's contained PDF security inspection/encrypted-source policy; inspect before building and recheck source session/hash before and after the native save picker. Await `service.build(id,source,value)`; then native `.xlsx` Save dialog and `store.saveCopy(id,chosen.filePath,result.bytes,'xlsx',result.report.sha256)`. Return copy metadata plus `rows` and `columns`; picker cancellation returns null. Existing exclusive writer protects originals and existing filenames.
4. Expose preload `saveTableXlsx(id,value)` invoking `save-table-xlsx` and `cancelTableXlsx(id)` invoking `cancel-table-xlsx`. The renderer XLSX action stays disabled if the save bridge is absent.

## Files

- `desktop/table-xlsx-validation.cjs`: strict source-bound, plain-object request and sealed result validation.
- `desktop/table-xlsx-codec.cjs`: contained-only fixed-part XLSX generation and exact read-back.
- `desktop/table-xlsx-service.cjs`: fixed contained family; no ZIP/XML parsing in main.
- `src/pdf-table-extraction-workspace.js`: reviewed XLSX export and preparation cancellation.

## Remaining F17 scope

The existing bounded manual-grid extraction now has correction-draft persistence and literal CSV/XLSX export in source. Merged-cell reconstruction, broad OCR languages, robust table autodetection and runtime accuracy/Excel compatibility acceptance remain outstanding. This export does not claim to preserve the original PDF table's visual formatting.

## Checks performed

`node --check` passed for the four added/changed source files. No runtime tests, test files, app launch, online calls or dependencies were introduced.
