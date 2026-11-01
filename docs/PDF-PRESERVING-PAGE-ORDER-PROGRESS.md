# Preserving page reorder — saved bounded slice

## Added behavior

The page workspace has a separate **Preserve comments / links: reorder original** entry. It uses the original native PDF only; regular page-workspace additions, deletion/duplicate/crop/rotation changes and legacy preview output are excluded. The user can move pages, reverse their order or enter a complete physical-page permutation. Every source page must appear exactly once. An unchanged order is not emitted as a new copy.

The native inspection records source SHA-256, exact page object identities and geometry, annotation/link/widget/form tree counts, and bookmark/named-destination/structure-tree presence. It supplies an inspection hash for the selected exact-source draft. The preserving writer retains every original page reference and all original objects. It updates only the active page-tree root Kids/Count and each original page's Parent, copying original inherited Resources/MediaBox/CropBox/Rotate onto page leaves where needed before reparenting. Original intermediate tree objects remain retained. No page artwork, font, image, content stream, annotation, form field, widget, link, bookmark or destination object is reconstructed.

Comments and widget annotations remain in their original page annotation arrays with their source dictionary/reference identities. Existing reference-based destinations continue pointing to the same original page. Bookmark hierarchy/list order, form field/calculation order, logical structure and existing action data remain unchanged. This is physical page reorder, not logical reading-order editing or sanitation.

Every original object outside the declared page/root field changes is fingerprinted and checked during construction. Encoded streams/resources remain unchanged; only raw stream Length fields normalize to their unchanged encoded payload sizes for the writer. The output is serialized and reopened natively, then checked for exact constructed object fingerprints, original object count, page-reference permutation, corresponding source geometry, trailer references and preserved annotation/link/form/bookmark inventories. Receipts include original/output object-manifest hashes and exact materialized field names.

The renderer independently opens both source and output with PDF.js, checks all reordered source/output page geometry, original ordered annotations/plain comments/link destinations/form values and indirect annotation identities, and the full source bookmark hierarchy/destinations. Direct annotation IDs may depend on physical page position, so those records are compared in unchanged annotation-array order using their literal metadata rather than inventing stable IDs. Both source and output are rendered as real PDF pages with annotation appearances. Every output page and every order mapping must be shown before the review checkbox enables sealed native save.

## Supported and refused cases

This slice supports a native unencrypted, unsigned, uncertified PDF with 1–500 physical pages, a unique bounded indirect page tree, supported explicit/inherited page geometry, and supported source AcroForm field/widget trees. Existing AcroForm field dictionaries, values, appearances, calculation order and resource dictionaries remain untouched. No form-editing claim is made.

Refused cases include deletion/duplication/insertion/merge/crop/rotation, protected/encrypted/signed/certified/XFA documents, catalog PageLabels requiring positional semantics, numeric destination arrays, destinations outside the active unique page tree, direct/shared/cyclic page-tree entries, malformed parent/Count fields, malformed annotations/field lists, ambiguous annotation page pointers, nonstandard inherited UserUnit and unsupported page geometry. Some remote destination arrays are conservatively refused because numeric destination arrays are outside this first slice. URI links and supported page-reference/named destinations are retained as original data; no linked files or URLs are opened.

Geometry supports literal UserUnit 1, finite right-angle rotation, boxes with finite origins within 10 million PDF units and dimensions at most 14,400 units. Limits include 5,000 active tree nodes, depth 80, 100,000 source indirect objects, 300,000 source graph traversal nodes, 10,000 annotation occurrences, 10,000 indirect unique form tree entries, 100 MiB source/output and 4 MiB inspection/output receipts. Preview canvases are bounded to two megapixels each. Page labels, tagged logical reading order and proprietary drawing software semantics need their own later reviewed extension.

## Integration contract and saved files

Standalone fixed engine operations are `page-order-inspect` with `{}` and `page-order-build` with `{draft}`. Codec exports `inspectPageOrder(bytes)` and `writePageOrder(bytes,draft)`. The draft is `{inspectionSha256,order:[one-based source physical page numbers]}`.

Renderer/native APIs are `inspectPdfPageOrder(id)`, `buildPdfPageOrder(id,token,draft)`, `discardPdfPageOrder(id,token)`, `cancelPdfPageOrder(id,token?)`, and `savePdfPageOrder(id,token)`. Inspection returns the direct inert report. Build returns `{token,bytes,report,receiptSha256}`; the receipt hash covers canonical report JSON plus one newline. Parent/native save uses the sealed token's bytes, never renderer-provided output. Cancellation/final close await contained cancellation and owned PDF preview/loading/render cleanup. The parent page workspace retains its existing draft/recovery workflow and restores its guard after this mode closes.

- `desktop/pdf-page-order-codec.cjs`: strict source tree/destination/form inspection, preserving permutation and native reopened proof.
- `desktop/pdf-page-order-validation.cjs`: exact inert inspection/draft/result contracts and finite geometry bounds.
- `src/pdf-page-order-model.js`: renderer source/inspection/selection/output/receipt binding and exact page mappings.
- `src/pdf-page-order-workspace.js`: separate original-only order selection, actual page comparison, independent reader checks, cancellation and reviewed sealed save.
- `src/page-workspace.js`: dedicated preserving entry and parent lifecycle integration.

## Verification status

Saved source passes targeted JS/CJS syntax compilation. No app, browser, worker, broker, contained-engine runtime or test files were run/added, following the user's current testing restriction. Later runtime gates include deep/shared trees, inherited resources/boxes, direct annotations, hidden comments, widgets, reference/named links, bookmarks, cropped/rotated drawings, unsupported PageLabels/numeric destinations, original action data, cancel/save races and real Bluebeam/Acrobat reopening. No full page-operation preservation, tagged reading-order, proprietary compatibility or signature-validity claim is made.
