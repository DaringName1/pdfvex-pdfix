# PDFix XFDF comment import — saved implementation

## Concrete supported slice

The drawing comments panel now includes **Review XFDF import**, even when the PDF has no existing comments. The user chooses an explicit native XFDF file, inspects source-bound supported/omitted records, selects up to 200 records per copy, and prepares a new PDF copy. Nothing is selected automatically. All 1–1,000 input records remain available through paginated review, including every omission reason.

Supported standard annotation types are Text, Line, Square, Circle, Polygon, PolyLine, Ink, Highlight, Underline, Squiggly and StrikeOut. Exact plain Unicode comments, author/subject text, supported literal date/state claims, physical page and geometry, standard RGB colors, opacity, border width/dashes and the first nine standard annotation flags are mapped. Text uses a disclosed generic vector comment icon. Lines support None/OpenArrow/ClosedArrow endings. Text markup currently requires axis-aligned rectangular quads.

Selected unique same-page imported parents receive standard IRT/RT reply links to their newly created PDF annotation references. A missing, duplicate, unsupported, self-linked, other-page, cyclic or overly deep parent is disclosed and omitted. A supported parent that is absent from the final selection leaves its child standalone and drops linked state history with an explicit result note. Existing PDF names are never treated as import targets; every new annotation receives a unique PDFix name, while its imported name is retained in the receipt.

The workspace reopens the actual output using PDF.js, checks page count and changed-page geometry, retains the original annotation identities/text/author/bounds, and independently locates each exact imported annotation by its new object reference and plain comment. It renders both original and prepared pages as real PDF artwork, including normal annotation appearances. Saving requires all changed pages, all input record pages and all result pages to have been shown, plus the user's review checkbox. Native save consumes the sealed reviewed output token; renderer bytes are not saved directly. A complete source/import/preservation receipt is available as literal JSON text.

## Parsing and preservation boundaries

Input must be exact valid UTF-8, XML 1.0, standard XFDF namespace, and at most 8 MiB. Parsing rejects DTD/entity declarations, non-declaration processing instructions, external file/appearance references, actions, scripts, embedded attachments and change-set elements. Foreign namespaced attributes cannot override standard fields. Rich/private/popup data is never executed and is individually disclosed as omitted. Only literal text is placed into UI elements; XML is not injected into HTML.

The contained engine receives canonical base64 bytes, never renderer paths or URLs. Fixed inspect/build operations have separate request bounds. Parent validators require exact inert receipt shapes, bounded literal fields/styles/geometry, finite coordinates, physical page identity, acyclic same-page parent references, exact source/XML/proposal/selection/output hashes and output inventory. Limits include 500 PDF pages, 1,000 import records, 200 selected records, 200,000 geometry numbers, 100,000 XML nodes, depth 16, 200 ink strokes per record, 10,000 resulting source annotations and 100 MiB PDF output.

The writer re-inspects the exact selected XML/source proposal before construction. It preserves every original indirect object and encoded content stream, appends new annotation dictionaries and font-free standard vector normal appearance streams, and changes only selected page Annots pointers. It copies the selected page annotation arrays rather than mutating shared arrays. Original annotation order/entries are retained. Only raw stream Length fields normalize to their unchanged encoded payload sizes as required by the writer.

The serialized copy is reopened natively. Full object fingerprints, retained object count, page geometry, trailer references, original annotation entries/order, new page references, exact Unicode comments, unique names and appearance stream hashes are checked against the constructed output. Receipts bind both source PDF and selected XFDF bytes. Cancel and final close clear the native selection/output lifecycle; final departure awaits cancellation and owned preview-document cleanup. The shared source PDF reader is never destroyed.

## Deliberate limits and remaining gates

This slice creates new comments; it does not merge changes into existing comments by NM, delete comments, import form values, create attachments or reproduce private Bluebeam/Revu properties, custom tools, custom appearances, rich text or grouping semantics. Imported file IDs, dates, names, authors and states are source claims, not authentication. Repeating an import creates another set of new annotations.

Coordinates must fit the target physical page's visible media/crop intersection. Unsupported source-page transforms, non-unit UserUnit, non-right-angle rotation, encrypted/signed/certified/XFA or unsafe structural graphs are refused by the preserving engine. Flags that hide an annotation are retained and disclosed; those comments may be visible only in result text. Stroke portions extending outside their source annotation rectangle are clipped by the normal appearance bounding box. Text-markup quad corners are preserved literally; no reading-order reconstruction is promised.

This is a coherent saved code slice with source syntax/bundle verification only. No runtime app, browser, native worker, XML corpus or Revu/Acrobat acceptance tests were run, in accordance with the current user instruction. Later integration gates include real XFDF round trips, output artwork, non-ASCII comments, selected/unselected parent chains, direct/shared annotation arrays, hidden/locked flags, rotated/cropped drawings, unsupported records, picker/cancel/save races and containment limits. No full XFDF conformance, Revu compatibility or certificate-validity claim is made.

## Saved files and API contract

- `desktop/pdf-xfdf-import-parser.cjs`: inert bounded UTF-8 XFDF reader and per-record omission reports.
- `desktop/pdf-xfdf-import-appearance.cjs`: font-free standard vector appearance construction.
- `desktop/pdf-xfdf-import-codec.cjs`: exact-source proposal, preserving-copy writer and native reopened proof.
- `desktop/pdf-xfdf-import-validation.cjs`: strict import and inert result contracts.
- `src/pdf-xfdf-import-model.js`: renderer source/XML/proposal/receipt/output binding and selected-result checks.
- `src/pdf-xfdf-import-workspace.js` / `.css`: selection, complete omission/result review, actual PDF artwork preview, cancellation and sealed save.
- `src/pdf-review-panel.js`: import entry and lifecycle integration.

Native integration owned by the parent/security agents: `pickPdfXfdf()` returns `{name, bytes: Uint8Array, sha256}`; `inspectPdfXfdfImport(id,{xfdf})` returns the proposal directly; `buildPdfXfdfImport(id,token,{xfdf,proposalSha256,keys})` returns `{token,bytes,report,receiptSha256}`. Here `xfdf` is canonical base64 and `receiptSha256` hashes canonical report JSON followed by one newline. `savePdfXfdfImport(id,token)` writes only native sealed output. `discardPdfXfdfImport(id,token)` discards a staged output while retaining selected XML for a rebuild. `cancelPdfXfdfImport(id)` without a token terminates pending work and clears chosen XML during final close/cancel.
