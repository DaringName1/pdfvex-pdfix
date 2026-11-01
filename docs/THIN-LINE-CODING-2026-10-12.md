# F66 thin-line inspection and reviewed repair — October 12, 2026

Implemented a bounded, contained vector stroke inspector and a preserving native repair path. This is a supported slice of F66; the full target stays open.

`PdfThinLineWorkspace` enters from the native PDF reader. The user chooses a physical-point threshold, inspects page/object/content-stream/operator locations, selects individual supported strokes, and chooses a replacement physical minimum. No candidate is selected automatically. Actual original/output pages are rendered side by side; every changed physical page must be viewed and review acknowledged before saving the retained, sealed new copy.

## Evidence and geometry

The lexical scanner is an offset-preserving adaptation of the existing preflight scanner: strings, dictionaries and arrays stay opaque, comments are ignored, operators have checked arity, and nested syntax/token work is bounded. Page Contents arrays form one program so graphics state can span streams. The scanner tracks q/Q, cm, w, ExtGState LW, page UserUnit, invoked Form matrices, path construction, stroke paint operators and conservative path/control-point bounds. Effective widths use CTM singular values, giving directional bounds under anisotropy/shear. Hairlines explicitly have device-dependent physical width. Mid-path transforms and degenerate matrices are uncertain and not repairable.

Limits: 100 MiB input/output, 500 pages, inherited preserving graph traversal (100,000 objects / 300,000 visits), 4 MiB combined program, 32 MiB decoded program work, 1,000,000 lexical tokens, 24 Form levels, 20,000 invocations, 10,000 strokes and 200 selected repairs. The native engine also enforces its global decode allocation/work and containment budgets.

## Preserving repair

Only uniquely referenced, uniquely invoked indirect page-content streams with completely inspected supported programs can be changed. Selected operators receive an explicit replacement `w` immediately before painting and the original width immediately after. Unselected strokes keep their original width, path and matrix. Unchanged program bytes are retained exactly; only selected stream encodings/lengths change. All original objects remain at their original references. Stream lengths are normalized before preservation manifests, matching existing preserving codecs.

The writer snapshots all original object fingerprints, requires every unaffected fingerprint to remain equal, serializes with the native PDF writer, independently reopens, and compares every constructed object fingerprint, trailer, page geometry, stroke path/matrix and selected/unselected widths. Receipts include source/output hashes, source-bound inspection and selection hashes, object manifest hashes and width changes. The service retains source-bound sealed bytes for new-copy save. Renderer PDF.js also independently reopens the actual output, checks changed-page geometry and parses operator lists before review.

Signed, certified, encrypted, permission-constrained, XFA and malformed object graphs are refused by the existing preserving loader/graph policy. Unknown operators, inline images and unsupported graphics-state semantics explicitly report incomplete program coverage and disable repairs for identified strokes in that program.

## Open F66 scope

Invoked Forms are recursively inspected, including inherited resources and matrices, but repairs within Forms remain unavailable. Pattern programs, Type 3 glyph strokes, text stroke rendering, annotation/widget appearances, transparency/reference Forms and uninvoked Forms remain unsupported. Stroke adjustment, clipping/visibility effects and device rendering are not proved. Anisotropic reported minimum/maximum are directional bounds; they are not an assertion that every path segment has that width. Bounding boxes enclose path/control points and exclude stroke expansion; they are location evidence rather than exact ink extents.

This implementation does not establish universal vector repair, complete visual print preflight or commercial editor parity. Root integration owns IPC registration, native operation allowlists, sealed save flow and the single generated-fixture contained write/source-unchanged/independent-reopen focused check. This subtask performs one syntax/model check only; no build or broad sweep is included.
