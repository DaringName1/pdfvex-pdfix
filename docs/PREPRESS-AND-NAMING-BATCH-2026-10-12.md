# Prepress and filename batch — October 12, 2026

Four feature areas are integrated into PDFix's Pages room, PDF tools and command finder. They perform real operations on the opened source rather than merely displaying a plan. Every transformed output is reviewed and saved as a new exclusive copy; the original stays unchanged. Full release acceptance remains pending.

- F65: inspect all five page boxes with inherited/default/explicit values, rotation and physical units; edit selected pages; review source/output geometry and save a preserving copy. See [page-box implementation](PAGE-BOX-CODING-2026-10-12.md).
- F64: add actual crop, bleed and registration vector marks with reviewed units, offsets, line width/color and expanded bounds. An absent selected-page TrimBox is materialized at the original effective visible trim and disclosed in the receipt. Marks do not create missing bleed artwork or prove print/color compliance. See [print-mark implementation](PRINT-MARKS-CODING-2026-10-12.md).
- F66: inspect transformed physical stroke widths, hairlines and Form strokes; apply explicit selected width repairs to supported complete unique page streams, preserving unrelated objects and artwork. Unsupported/shared/nested cases remain disclosed. See [thin-line implementation](THIN-LINE-CODING-2026-10-12.md).
- F59: reasoned editable filename suggestions and reviewed unchanged copy saving, including bounded disk-backed copying with progress/cancel and hash verification. See [naming/copy implementation](SMART-NAMES-AND-STREAMING-COPIES-2026-10-12.md).

The three prepress writers run only in the contained engine, reject unsupported encryption/certification/signature cases, retain inspected source seals and independently reopen/check their declared preservation proofs. Transforming routes currently retain the 100 MiB/500-page limits; the new exact-copy path is disk-backed and does not parse or transform a large source. Modal departure waits for active operations/cleanup where supported and preserves the current reader session.

Pending: real drawings and production print output, full geometry/stroke corpus and hostile input/path/security cases, UI/keyboard/device/high-DPI checks, durable recovery, expanded shared/Form/pattern/appearance repairs, selected nondefault UserUnit print-mark support, broader color/press features, and measured large-file memory/responsiveness. Compiled routes and narrow synthetic cases do not establish full-feature acceptance.

Build and focused-check receipts will be appended after execution. The visible desktop session has not been restarted by this batch.

Build: 362 modules, exit 0; source snapshot `f518e499e12815e2a6d0b8a1070877274c3732f15c76a885012c84b1eb816d2d`; renderer `index-DFNGcmiE.js`. Focused receipt: [five generated-fixture cases](../tmp/prepress-batch-51ed0ef4-268c-49e7-91ec-2a710755a9cc/report.json). First run exposed a real print-mark parser API defect after the page-box case passed; the production fix and mark geometry corrections preceded the rerun. No real-drawing, UI, physical-print or broad performance acceptance is implied.
