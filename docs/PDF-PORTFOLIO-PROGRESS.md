# A17 PDF portfolio implementation progress

## Implemented core

The portfolio codec reads the actual catalog `Collection` dictionary, supported
`CollectionSchema` fields, scalar/prefixed `CollectionItem` metadata, and the
bounded `Names/EmbeddedFiles` name tree. It reports names, descriptions, declared
types/sizes, decoded sizes and SHA-256 hashes. An ordinary PDF with embedded files
can supply cover pages for a new standard portable collection. Inventory does
not execute document actions, navigators or embedded content and never follows
external resources.

The workspace provides searchable list/grid navigation, an inert metadata
preview, source selection, safe filename/description edits, removal and
reordering. Explicitly selected files are held as main-process snapshots behind
opaque identities bound to the base PDF. The renderer receives descriptors and
receipts, not raw source snapshots or filesystem paths. Its file picker can add
arbitrary file types as inert bytes, without interpreting those files.

Creation writes real embedded streams/file specifications, Unicode filenames,
an encoded-key-sorted `EmbeddedFiles` name tree, a `Collection` dictionary,
supported original schema fields, and a numeric order schema/`CI` field used by
the collection sort dictionary. Retained existing entries preserve their
supported metadata and embedded bytes. The preferred standard view can be
details (`D`), tiles (`T`) or initially hidden (`H`). A retained default embedded
document follows a rename; a removed default document is cleared. The opened
base supplies the actual cover PDF pages.

The codec reopens the exact resulting PDF and checks the chosen names,
descriptions, decoded byte hashes/sizes, metadata and order, original schema,
unchanged catalog/name-tree entries, every physical page's geometry and every
retained original object/stream fingerprint. The service validates the returned
receipt against source and selection identities, seals output bytes in the
desktop process and checks the source/output hashes again on save. The user
reviews the concrete receipt and saves a separate PDF copy.

Extraction independently decodes the chosen source-bound entry, creates a
sealed receipt with its exact hash/size, and saves only after explicit review.
The default output filename is a generated `.bin`; nothing is automatically
opened. Portfolio `CI` metadata is supported by this dedicated decoder rather
than incorrectly routing through the existing simple attachment decoder's
portfolio refusal.

## Containment and bounds

- Operations: `portfolio-inspect`, `portfolio-build`, `portfolio-select` in the
  fixed contained document engine. Only build carries source byte snapshots,
  with its dedicated 36 MiB request cap; other request limits remain unchanged.
- Base/output: 100 MiB. Entries: 100. Per embedded file: 10 MiB encoded and
  decoded. Total decoded contents/work: 25 MiB. Selected source snapshots:
  25 MiB aggregate. Name tree: 256 nodes and 32 levels. PDF graph: 100,000
  objects, 300,000 visits and depth 80.
- Only unfiltered/plain Flate embedded streams with bounded decompression are
  decoded. External streams, URL file specifications, related-file/platform
  stream variants and unsupported filters/parameters are refused.
- New filenames have no path separators, control/bidirectional characters,
  reserved Windows device names, trailing dots/spaces or duplicate names.
- Encrypted bases require an authorized decrypted copy. Signature-bearing,
  permission-constrained or XFA bases cannot be rewritten. Signature validity
  is not claimed. Unsupported Collection fields/layouts or metadata block
  authoring while an inert inventory can still be shown where structurally
  readable.
- Source selection identities and exact bytes must match. Selected inputs are
  discarded when the workspace closes after its job settles. Generated output
  is invalidated on edits, cancellation, source mismatch and disposal.

## Explicit remaining gates

A17 remains a staged capability, not a completed Acrobat-equivalence claim.
Interactive/proprietary navigators, folders, custom layouts, embedded-content
previews, Office/CAD/media decoders and interactive 3D portfolio presentation
still need separate supported engines and acceptance work. The implemented
preview is a metadata/receipt preview; it does not claim to render embedded
documents. Collection-aware behavior in third-party viewers, native containment
security acceptance and interactive workflow acceptance have not been exercised
in this coding pass.

Removal/replacement edits the active collection only. Original objects are
intentionally retained to protect other document structures, so removed
attachment bytes can remain in the output. This is not redaction, secure
deletion or sanitation. Original active content can also remain as inert
preserved source data; the portfolio editor never executes it.

## Validation performed in this pass

`node --check` passed for the codec, validation module, service and renderer.
No runtime/document/UI tests were run and no test files were created, following
the user's instruction. The integration owner performs the project build and
records its result separately.

## References

The implementation uses the installed `pdf-lib` 1.17.1 object/stream writer and
Unicode string encoding APIs. Collection/name-tree/view scope was cross-checked
with the PDF Association's [Files inside PDF](https://pdfa.org/files-inside-pdf/)
and [PDF-UX: Collections](https://pdfa.org/pdf-ux-collections/) articles. Its
[PDF Specification Archive](https://pdfa.org/resource/pdf-specification-archive/)
indexes the authoritative format references; the linked Adobe 2008 PDF was
unavailable during this pass.

## Integration contract

`PdfPortfolioWorkspace(reader, ui)` accepts optional `openedFiles()` or `files`
descriptors, `announce` and `onClosed`. Native API calls:

```text
inspectPdfPortfolio(baseId)
pickPdfPortfolioSource(baseId) -> descriptor | descriptors[] | null
buildPdfPortfolio(baseId, inventoryToken, token, {view, entries})
selectPdfPortfolioEntry(baseId, inventoryToken, entryId, token)
savePdfPortfolio(baseId, token)
savePdfPortfolioEntry(baseId, token)
cancelPdfPortfolio(baseId, token)
discardPdfPortfolio(baseId, token)
discardPdfPortfolioInputs(baseId)
```

Descriptors have `id`, `name`, optional `ext`, `size` and `sha256`. Entry drafts
are `{kind:'existing', id, name, description}` or
`{kind:'opened', sourceId, name, description}`. The integration layer resolves
chosen opaque source identities into bounded snapshots before service creation;
it never accepts a renderer-supplied path or byte snapshot.

`PdfPortfolioService.build(baseId, source, inventoryToken, draft, token,
openedSources)` accepts main-owned `{sourceId, bytes, fingerprint?}` snapshots.
`source` uses the existing PDF source identity contract. `output()` returns the
sealed PDF copy; `outputSelection()` returns the sealed embedded-file bytes.
Both recheck source identity and output hashes. Inspection/build/extraction
receipts stay separate from the main-owned bytes and save dialogs.


## October 8 integration

Main/preload/reader/app routes, native selected-input snapshots, contained operations and reviewed exclusive saves are integrated and compiled. Explicit embedded-PDF artwork preview is now coded in `src/pdf-portfolio-preview.js`, with exact decoded-entry SHA checks, a separate PDF.js worker, 10 MiB/500-page/16M-pixel bounds and per-operation deadlines. Actions, links and scripts have no preview execution route. Metadata-only statements above describe the earlier module checkpoint; PDF artwork is now an additional supported preview. Office/CAD/media and proprietary presentation support remain open. Runtime/document/security acceptance remains pending.
