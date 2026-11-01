# F65 detailed PDF page boxes — October 12, 2026

Status: coded bounded native writer, validation/service and renderer workspace; one syntax/selection/physical-unit model check passed. Parent integration and contained generated-fixture writer/source-integrity/independent-reopen checks are recorded by the integrating task. This document does not establish full F65 acceptance or Acrobat/prepress parity.

## Implemented scope

- Inspect MediaBox, CropBox, TrimBox, BleedBox and ArtBox for every original physical page, with exact unrotated rectangle, explicit/inherited/default origin, owning page-tree object reference or default source. MediaBox/CropBox/Rotate inherit through a validated unique indirect page tree. BleedBox/TrimBox/ArtBox default to CropBox; CropBox defaults to MediaBox. Rotation and leaf UserUnit are inspected and retained.
- Display effective physical points, inches or millimeters using UserUnit. Applying coordinates to multiple selected pages converts the same selected physical coordinates through each target page's own UserUnit. Inputs use original physical page numbers and bounded comma/range selection.
- Queue arbitrary supported leaf box changes together, or remove a leaf entry to restore its standard inheritance/default. MediaBox reset fails visibly when no inherited MediaBox exists. Rebuilding checks all five effective boxes on each selected page, including boxes changed indirectly through defaults.
- Reject non-positive/out-of-bound rectangles and selected outputs with any box outside MediaBox, or TrimBox/ArtBox outside BleedBox. Inspection discloses source cross-box issues; unchanged unselected source issues remain retained by the native writer. Unsupported original rectangle syntax/geometry produces a visible failure instead of inventing a replacement.
- Prepare a true native preserving PDF copy. No PDF page reconstruction, content flattening, annotation migration or uncontained parser fallback occurs. The contained worker changes only exact declared leaf box keys. Original object identities, artwork/stream bytes/resources, annotations/forms, outlines/destinations, unknown data, metadata and trailer are proved through complete constructed object fingerprints after native reopen. Existing stream Length declarations are canonicalized and counted, consistent with the existing preserving codec.
- Bind inspections, edits, reviewed output and receipts to exact source SHA-256, inspection hash, selected changes hash and output hash. Original bytes are untouched. The service retains only a sealed reviewed buffer for the existing exclusive new-copy save integration; discard/rebuild/cancel/dispose zero that retained buffer.
- Reopen through PDF.js independently; compare physical page count, effective crop, rotation/UserUnit, annotations/links/form values and outline hierarchy. Render original and actual output, show original/output box tables, and require every changed page to have been displayed plus an explicit review checkbox before saving.
- Use ContainedServiceContext/DocumentSandboxService for inspect/build, existing cancel/process containment/grants/resource limits/termination cleanup, bounded renderer promises and two-megapixel source/output previews. No worker path, network access or external action is taken from PDF content.

## Contracts

Native codec: `inspectPageBoxes(bytes)` and `writePageBoxes(bytes,draft)`.

Service: `PdfPageBoxService.inspect(sourceId,source)`, `.build(sourceId,source,token,draft)`, `.output(sourceId,source,token)` plus `.cancel/.discard/.dispose/.status`. Engine operations: `page-box-inspect`, `page-box-build` (options `{draft}`).

Draft: `{inspectionSha256,changes:[{page:1,boxes:{CropBox:[left,bottom,right,top],TrimBox:null}}]}`. Coordinates are PDF units, not display units. Every changed page occurs once, with one or more of the five supported keys. `null` deletes that exact leaf entry.

Renderer API: `inspectPdfPageBoxes(id)`, `buildPdfPageBoxes(id,token,draft)`, `savePdfPageBoxes(id,token)`, `discardPdfPageBoxes(id,token)`, `cancelPdfPageBoxes(id)`. `PdfPageBoxWorkspace(file,{owner,onClosed,announce})` supports `open`, `close`, `prepareDeparture`.

## Full target and remaining acceptance

F65 remains the full adopted detailed editor requirement in FINAL-IMPLEMENTATION-PLAN.md and FREE-ACROBAT-ADDITIONS-PLAN.md. Unsupported cases are not removed from that target. This slice accepts 1–500 pages, 100 MiB, at most 100,000 indirect objects, bounded unique indirect page trees and right-angle rotations. UserUnit must be a numeric standard leaf value/default, greater than zero and at most 75,000. Rectangle dimensions are at most 14,400 PDF units and absolute coordinates at most 10,000,000. Signed/certified/encrypted/XFA sources, nonstandard inherited UserUnit, shared/cyclic/direct/malformed trees and unsupported geometry fail visibly. Signature preservation/editing requires a separate authorizing workflow and cryptographic validation; this editor never silently strips signatures.

Rotation/UserUnit editing, geometric drag/resize, selected-page physical-coordinate transformations of artwork/annotations and PDF/X/color compliance are outside this coded slice. UserUnit/rotation inspection and display conversion are implemented. Original clipping changes are not redaction, bleed generation or content scaling. Broader large-file geometries, protected-signature cases, malformed-source repair and specialist prepress interoperability remain adopted work where applicable.

Pending evidence includes real nested/inherited/negative-origin/mixed-UserUnit/rotated page corpora and foreign annotation/form/structure/outline fixtures; preserved explicit/default resets; source-change/cancel/timeout/crash/resource-limit/disk-full/denied-destination/exclusive-save cases; independent renderer execution; and keyboard/focus/screen-reader/contrast/high-DPI/responsive/large-file checks. A syntax/model check alone does not establish those gates. Final release claims require all applicable scope and preservation checks.
