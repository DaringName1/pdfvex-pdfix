# Physical drawing revision and source-comment carry-forward — October 11, 2026

This adds a functional preserving writer, contained service and reviewed UI for an explicit original/replacement physical-sheet mapping. It advances F22 and B08 (revision replacement); B07 comparison/alignment remains a separate family. This checkpoint is coded scope, not full Bluebeam compatibility or complete F22/B07/B08 acceptance.

## User path and exact supported behavior

Open the existing preserving page-order workspace, then **Replace sheets and carry comments forward**. This opens the revision modal owned by that workspace; closing returns to preserving page-order. Source selection uses the opened original and the native, explicitly chosen retained replacement PDF. The pair must total less than 100 MiB, and each PDF has 1–500 pages. Choose 1–100 unique original/replacement physical mappings; there is no automatic printed-label matching.

For each mapping, choose original annotation identities to retain, retain/omit original links, include/omit donor comments and confirm the exact physical page numbers and geometry. Original omitted comments are initially unchecked. Existing supported comment types include Text, FreeText, standard highlights/text markups, ink, rectangle/ellipse/polygon/polyline/line, stamp, caret and popup. Known popup/reply relationships must be retained or omitted as a whole. Locked/read-only/locked-content comments cannot be carried. Unsupported rows show their reason. Including donor comments requires every non-Link donor annotation on that selected page to be supported; donor links are excluded.

Retaining any original annotation requires exact equality of MediaBox, CropBox, BleedBox, TrimBox, ArtBox, rotation and UserUnit 1. No coordinate or appearance transform is performed. If all original annotations are explicitly omitted, a replacement with differing supported page geometry can be chosen and reviewed. Widgets on either selected page, tagged/optional-content documents, signed/certified/encrypted/XFA sources, shared/direct annotations, malformed references, positional page labels/numeric destinations and unsupported page PieceInfo/VP/Measure/AA/StructParents dependencies are refused with a visible reason.

The writer preserves every original page reference and physical page order. Only declared page Contents/Resources, five boxes, Rotate, Annots and obsolete Thumb change. Exact original annotation objects, NM/author, appearance stream bytes, private data, known replies/popups and states stay in the retained graph. Standard stream Length fields are normalized before the preservation baseline. Donor artwork/resources/comments are recursively copied with reference remapping and seeded original page identities; donor comment NM/author/appearance/private data stays intact, while donor indirect reference numbers change. Active duplicate NM values are refused. Donor document metadata, catalog layers/structure/forms/bookmarks and links are excluded.

All original objects remain, including omitted annotations and old artwork. Omission/replacement is not redaction or permanent deletion. Unmapped pages and the original trailer are verified unchanged against constructed object fingerprints. Output is reopened in the contained native writer and checked against the complete original-plus-imported graph, original page references/order and inspected output geometry. The renderer independently checks all page geometries, retained source identities/text/rectangle data, chosen donor comment data and original outlines with PDF.js. It renders original, chosen donor and actual output canvases; every mapped page must be viewed and final review checked before the native new-copy Save dialog.

## Integration contract

- `desktop/pdf-page-revision-codec.cjs`: `inspectPageRevision(bundleBytes)` and `writePageRevision(bundleBytes,draft)`.
- `desktop/pdf-page-revision-validation.cjs`: `packRevisionSources`, `unpackRevisionSources`, `validRevisionDraft`, `validRevisionInspection`, `validRevisionResult`, shared hash/canonical/source/token helpers.
- `desktop/pdf-page-revision-service.cjs`: `PdfPageRevisionService` extends `ContainedServiceContext`; `inspect(sourceId,source,replacementId,replacement)`, `build(sourceId,source,replacementId,replacement,token,draft)`, `output(sourceId,source,replacementId,replacement,token)`; inherited cancel/discard/dispose/status.
- Fixed contained operations: `page-revision-inspect` with `{}` and `page-revision-build` with `{draft}`. The binary immutable input is `PDFixRev1\0` (10 bytes), little-endian original length and replacement length (4 bytes each), then exact original and replacement bytes. Aggregate including envelope is bounded to 100 MiB. The service seals both source hashes/lengths, source IDs, token and canonical receipt; its build re-inspects the same exact pair inside containment before the writer.
- Preload methods: `inspectPdfPageRevision(sourceId,replacementId)`, `buildPdfPageRevision(sourceId,replacementId,token,draft)`, `savePdfPageRevision(sourceId,replacementId,token)`, `cancelPdfPageRevision(sourceId)`, `discardPdfPageRevision(sourceId,token)`. Picker reuses `pickSheetSetSource(sourceId)` and expects the retained packet `{id,name,ext,bytes,...}`. The reused native picker title currently mentions sheet-set drawing selection.
- Browser draft: `{version:1,inspectionSha256,mappings:[{sourcePage,replacementPage,sourceCommentRefs,sourceLinks:'retain'|'omit',replacementComments:'include'|'omit',geometryReviewed:true}]}`. `sourceCommentRefs` uses native `ref:object:generation` identities, never PDF.js labels. Save reads the sealed native output; the renderer does not supply bytes/path to Save.
- UI exports `PdfPageRevisionWorkspace`; existing `PdfPageOrderWorkspace.openRevision()` owns child closure/departure, returns to its original modal and restores editor holds. It discards a prepared reorder output when entering revision. Revised output remains a reviewed copy, never installed as the original source.

Root owns engine dispatch/allowlists, source pins, main/preload registration and source/token-bound exclusive output saving. The agent changed only page-order-family/new revision modules and this note.

## Focused verification and fixture recipe

All new/changed JavaScript modules passed `node --check` on October 11. No broad build or unrestricted real-file processing was performed by this agent. Root prepared `scripts/check-form-revision-batch.mjs` for the single focused postbuild contained writer/profile check; actual execution/evidence belongs in the root integration checkpoint.

Construct two original pages and a one-page donor with matching default 612×792 boxes, rotation 0/UserUnit 1. On original page 1 add a unique indirect Text annotation with `/NM (original-note)`, `/P` equal to original page 1, a normal appearance stream and a private dictionary such as `/BBPrivate << /Opaque (preserve me) >>`; put a distinguishable original stream on each page. Put a donor Text annotation with `/NM (donor-note)` and donor artwork on its sole page. Serialize fixtures without object streams, retain both as normal service sources with byte SHA-256 fingerprints and different IDs, then call the contained service inspection.

Generate the exact draft from that returned inventory:

```js
const draft={version:1,inspectionSha256:inspection.inspectionSha256,mappings:[{
 sourcePage:1,replacementPage:1,
 sourceCommentRefs:inspection.source.pages[0].annotations
   .filter(a=>a.subtype!=='Link'&&a.supported).map(a=>a.objectRef),
 sourceLinks:'omit',replacementComments:'include',geometryReviewed:true
}]};
```

Build with a UUID v4 token. Reopen the service output independently and assert: both fixture byte hashes are unchanged; two active original page identities remain in the same order; page 1 artwork/resources now match donor; page 2 artwork/dictionary remains original; retained original note reference, `/NM`, `/T`, private dictionary and appearance stream bytes are exact; imported donor note is present with its original NM/private/appearance data and its remapped `/P` equal to original page 1; original page 1 old Contents/comment objects still exist; receipt hashes and source/output lengths match; `service.output` accepts only the exact pair/token. Optional fixture extension: source reply/popup closure and locked-annotation or geometry-mismatch refusal. Confirm real OS-protected containment for this operation before treating it as a runtime pass. No direct Electron parser/writer fallback is permitted.

## Remaining full target

The complete adopted revision target remains open: reviewed affine/translated geometry with coordinate/appearance/private-adapter safety, label-assisted matching and duplicate/missing proposals, supported layer/catalog/structure merging, broader page dependency adapters, transformed grouped/measurement markups, large-pair file-backed containment and real authorized Revu round trips. Current exact-geometry retention does not imply those paths exist. B07 synchronized overlays/manual alignment and B08 sheet-set features elsewhere do not establish comment-transform support here. Broader cancellation/recovery/resource bounds, device/UI accessibility and release acceptance remain pending.

Owned files are frozen after this checkpoint so root can perform its single integration build and focused check.
