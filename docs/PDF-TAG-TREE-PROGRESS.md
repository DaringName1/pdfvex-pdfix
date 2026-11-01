# PDF tag-tree remediation progress

This implements concrete, bounded existing-tag remediation and reviewed initial tagging of supported untagged page content toward A11/F30. It does **not** complete full tagging or establish PDF/UA or Section 508 conformance.

## Implemented

- Contained `tags-inspect` inventory of `StructTreeRoot`, every supported `K` child, `RoleMap`, and the complete bounded `ParentTree`. Reports include indirect structure IDs, parent/depth, inherited physical page, raw/resolved role, Alt/ActualText/Lang, existing element IDs, table attributes, MCIDs, MCR stream references and OBJR object references.
- Bounded traversal with cycle, shared-child, unresolved-reference, duplicate MCID ownership, structure parent, role-map cycle, number-tree ordering/limits and bidirectional ParentTree ownership checks. Unknown `K` forms cause a concrete refusal; unknown dictionary fields and objects are retained.
- Real native PDF mutations of existing tag roles, alternative text, language and eligible leaf ActualText; exact sibling `K` permutations change reading order without reassigning any content owner. Heading and existing list roles are supported; edited list/table structures must satisfy the implemented structural checks.
- Table TH/TD `Scope`, `RowSpan`, `ColSpan` and `Headers` updates when attributes are absent or a single Table dictionary, with no class attributes. Header associations require existing uniquely identified TH elements in the same Table and matching entries in a checked IDTree. Original byte-string IDs are reused. No IDs or IDTree entries are invented.
- Source SHA-256, inventory SHA-256, selection SHA-256 and output SHA-256 binding. Selected-field masking proves that other fields in edited tag dictionaries did not change. Every other source object is fingerprinted. The serialized copy is reopened and every indirect object/stream must match its intended fingerprint. The original page content and resource objects remain unchanged. Stream Length normalization can occur without changing stream payloads.
- Full bounded hierarchy navigation, selected-tag details, physical-page previews, MCID/MCR/OBJR relationship navigation, RoleMap/ParentTree inspection, staged changes, undo/redo, explicit exact-change review, cancellation/discard and save-as-copy. Rewritten pages use the independent PDF.js renderer. Tree verification is performed by the native re-open checks; the UI does not claim an independent standards validator.
- Initial untagged-content inventory uses a bounded PDF object/operator lexer, not string matching. It identifies complete BT–ET text objects, individual Image XObject Do operations and complete painted paths. Every candidate is source-bound by page, exact decoded-program byte range and SHA-256. Parenthesized/hex strings and text arrays remain operands, so operator-looking bytes in text cannot become candidate boundaries.
- Initial authoring starts with every group **unclassified**. Users select supported text/heading roles, Figures with required descriptions, Spans with verified replacement text, or explicit Artifact types. Whole-document reading order can be changed without changing drawing order. Document language and an explicit review of all classifications/order are required. Bulk current-page paragraph classification and Layout artifact marking are user-invoked actions with undo/redo. A visual marker gives an approximate text starting point or image center where available; it does not claim exact content bounds.
- Initial output contains a real indirect StructTreeRoot and Document element, indirect semantic elements, page MCIDs, StructParents, ParentTree entries, ParentTreeNextKey and MarkInfo/Marked. Artifacts are actual `/Artifact << /Type ... >> BDC ... EMC` sequences, excluded from the structure tree. The writer adds paired BDC/EMC wrappers around exact original decoded operator ranges, preserving drawing instructions/order and original resource/stream objects. Reopened replacement streams must match exactly; removing only the recorded inserted wrappers must recover each original decoded program hash.

## API contract

`desktop/pdf-tags-codec.cjs` exports `inspect(bytes)`, `write(bytes, selection)` and `MAX_BYTES`. The engine operations are `tags-inspect` and `tags-build`, with build options `{ selection }`.

`PdfTagsService` uses the established `ContainedServiceContext` and provides `inspect(sourceId, source)`, `build(sourceId, source, token, selection)`, `output(sourceId, source, token)`, `cancel`, `discard`, `dispose` and inherited `status`. A source is the existing source registry record with PDF bytes and fingerprint. Output retrieval requires the same source ID, source hash and operation token and checks the retained output hash.

The selection is:

```js
{
  inventorySha256,
  edits: [{ nodeId, changes: { role, alt, actualText, lang, scope, headers, rowSpan, colSpan } }],
  orders: [{ nodeId: '$root' /* or an existing structure ref */, children: ['stable K child ID'] }]
}
```

Only changed keys appear in `changes`; text/Scope/spans may be null to remove the entry. `headers` is an array of existing TH structure references; empty removes Headers. Node IDs use the original PDF indirect reference, e.g. `12 0 R`. Child IDs are stable relationship identities; all children must appear exactly once in an order selection. Edits are strictly allowlisted; unsupported mutation types are rejected.

For supported untagged inputs, inspection additionally returns `creation: { available, reason, candidates }`. Initial authoring uses the same operation/service/bridge and this mutually exclusive selection:

```js
{
  inventorySha256,
  edits: [], orders: [],
  create: {
    language: 'en-US', reviewed: true,
    items: [{
      candidateId: 'content-1-1', // Every source candidate exactly once, in reviewed reading order
      role: 'P',               // Text/heading, Figure, Span, or explicit Artifact
      alt: null, actualText: null, artifactType: null
    }]
  }
}
```

Figures require nonempty Alt; graphics representing text may use Span with explicit nonempty ActualText. Initial ActualText is limited to Span. Artifacts require Pagination, Layout, Page or Background and cannot carry Alt/ActualText. The receipt adds `createdTags` and `artifacts`; both are zero for existing-tree edits. No new IPC or engine operation names were added.

`src/pdf-tags-workspace.js` exports `PdfTagsWorkspace(reader, ui)` with `open()`, `close()` and `prepareDeparture()`. Bridge methods are `inspectPdfTags(id)`, `buildPdfTags(id, token, selection)`, `savePdfTags(id, token)`, `cancelPdfTags(id, token)`, and `discardPdfTags(id, token)`. The bridge's save-as-copy policy remains authoritative.

## Explicit limitations and remaining acceptance

- Initial authoring supports only fully inventoried untagged page programs in the bounded subset. Unsupported content refuses the entire initial plan with a concrete reason; there is no silently skipped page/group. No automatic semantic classification/reading order, OCR generation, text-object splitting/merging, initial list/table/link/form hierarchy construction or cross-parent moves. Initial semantic leaves are children of Document and require manual meaning/order acceptance.
- Artifact creation is supported for explicitly classified initial content groups. Editing/removing existing artifact sequences or converting existing tags into artifacts remains unsupported. `NonStruct` is never presented as an artifact substitute. Existing marked-content operators cause initial tagging to refuse rather than nesting new semantics over them.
- PDF 2.0/unknown document versions, namespace-aware structures, direct StructTreeRoot editing, unresolved custom roles, malformed structures, unsupported content children, signed/certified/permission-constrained/encrypted documents and XFA are refused or read-only as stated in the report. The writer emits PDF 1.7. PDF/UA identification metadata is preserved and is never added or upgraded.
- No class/revision-array/multiple-owner attribute editing or inferred table headers. Attributed role changes are refused where their semantic compatibility cannot be proved. Existing unsupported attributes remain intact. Table geometry, header correctness and content meaning require manual review.
- ActualText is deliberately limited to supported leaf text/formula roles containing existing MCID references; Figure, grouping, empty and OBJR-bearing tags require a specialist workflow. ActualText is replacement content, not a substitute for an image description.
- Existing-tree ParentTree checks establish structure ownership only; that path does not decode original streams to prove that each claimed MCID exists, has balanced marked-content operators, covers all meaningful content, or follows visual reading order. The initial-tag path checks the supported source grammar and inserts/validates every new wrapper, but semantic coverage still requires human acceptance of the chosen groups. Neither path audits font Unicode mapping, invisible/duplicate OCR content, language correctness or assistive-technology behavior.
- Initial content refusals include annotations/forms, optional-content layers, existing marked-content or structural ownership/orphan tags, nested Form XObjects, inline images, shading/pattern painting, external streams, DecodeParms, unknown/compatibility operators, unbalanced text/graphics/path syntax, image painting within text/path construction, graphics nesting/transforms within text, and text clipping. Source text labels are only decoded for the supported explicit built-in WinAnsi subset; other fonts receive a visual-review label. Approximate location markers are not text selection or reliable bounding boxes.
- The preservation checks cover parsed indirect objects and their dictionary fields/stream payloads. This is a fresh serialization, not an incremental byte-preserving update: cross-reference and object-stream containers, file offsets, original trailer syntax and revision history are not retained in the output. The original file must remain available. Nonstandard trailer extensions are outside this workflow's verification scope.
- Fixed input/output limit 100 MiB; 500 pages; 100,000 indirect objects; 300,000 graph visits / 80 graph levels; 2,000 tags / 48 hierarchy levels; 20,000 K relationships; 20,000 ParentTree/IDTree entries; 100,000 ParentTree slots; 4,096 characters per supported text field. Oversized structures are refused rather than truncated.
- Initial authoring additionally limits decoded content to 8 MiB/page and 32 MiB/document, 1,000 content groups, 200,000 tokens/page, 16 operand/string nesting levels and 64 graphics-state levels. The existing contained request/output limits also apply.
- Structural preservation verification is not accessibility certification. Full A11/F30 acceptance still requires broader content/group authoring, existing artifact conversion, list/table/link/form creation, recovery, standards validation and manual assistive-technology acceptance on representative PDFs.

## Verification performed for this change

Source-only `node --check` on the three native files and the workspace JavaScript. Per the requested fast implementation boundary, no sample PDF parsing, runtime, UI, document or fixture tests were run and no test PDFs were created. Central engine/bridge registration and application build are owned by the integrating change.

## Primary references used

- PDF Association, ISO 32000-2:2020 clause 14 errata and examples for structure parents, K, MCID, MCR and OBJR: <https://pdf-issues.pdfa.org/32000-2-2020/clause14.html>
- PDF Association logical structure object reference: <https://pdfa.org/download-area/cheat-sheets/LogicalStructureObjects.pdf>
- PDF Association accessible PDF techniques background, including semantic coverage and correct sequence: <https://pdfa.org/techniques-for-accessible-pdf-background/>
- PDF Association marked-content operators and artifact semantics: <https://taggedpdfschool.pdfa.org/content?tag=Caption&useCase=0>
- PDF Association tagged-PDF syntax best practices, including ActualText on Span: <https://pdfa.org/download-area/publications/Tagged-PDF-Best-Practice-Guide.pdf>
- Installed pdf-lib source for `PDFDict.clone`, string byte/text handling, object traversal and `PDFWriter` serialization; installed package APIs are used directly instead of assuming higher-level tag editing support.
