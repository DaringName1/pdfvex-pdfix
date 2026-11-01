# PDFix nested original-image editing — saved implementation

Updated 2026-10-04. Source code is saved; hidden runtime acceptance remains deferred under the user's testing pause.

## Concrete support

The original-image list now includes images inside supported Form XObject resource paths. It shows a nested-image label and the exact resource-name chain, such as `Drawing → Detail → Photograph`. Selecting an item builds the artwork preview from the actual original image stream, with its owning resource dictionary's color-space definitions. It does not substitute a screenshot or placeholder for the source image.

Nested identities include the physical page, top-level resource index and a full SHA-256 digest over the exact source-file SHA-256, resource-name chain and original image reference. A changed source or path cannot silently reuse that nested identity. Existing direct-image IDs stay compatible with saved recovery drafts. Both renderer and native recovery validators accept the bounded optional nested suffix; recovery still requires an exact match against the current source inventory.

Replacing artwork changes the leaf XObject resource reference. The original drawing operators, Form program bytes, clipping, BBox, Matrix and page placement remain. The writer clones the selected page resource dictionary and only the Form/resource chain leading to the selected leaf. Shared original Form streams are not modified. Other resource names and other pages retain their original references. Multiple replacements under the same page/path share the same newly cloned parent chain.

All uses through the selected named resource path on that page change. This is a resource-path editor, not an individual draw-occurrence editor. A different artwork aspect ratio may stretch inside the existing placement. The preview displays isolated source artwork; the complete original/output page comparison remains the place to assess Form clipping, blend effects and final placement.

When replacements are combined with added text/images, addition pages now isolate shared/inherited Resources, Font, XObject, ExtGState, Contents arrays and Annots arrays before pdf-lib normalization can modify them. This also addresses the installed dependency's explicit shared-resource normalization limitation.

## Supported boundary and refusal behavior

- Indirect image and Form streams with explicit Form Resources.
- FormType 1/default, finite positive BBox up to 14,400 units in each dimension, finite six-number nondegenerate Matrix, bounded matrix coefficients and positions.
- Up to eight Form levels / nine resource names, 20,000 traversed resource nodes, 1,000 Form paths, 2,000 image candidates and 200 staged replacements.
- Original image dimensions from 1 through 8,192 pixels per side, at most 16 million pixels.
- Form stream bytes capped at 16 MiB each and 64 MiB aggregate traversal/copy budget. Resource names are bounded at 200 characters. Preview copying is bounded at 20,000 graph nodes, depth 32, 2,000 references and 32 MiB encoded streams; the preview PDF is capped at 32 MiB.
- Cycles, external-file/reference Forms, direct stream identities, missing/inherited Form Resources, invalid/degenerate geometry and excessive graphs are omitted or refused. A cyclic/unsupported nested branch does not expose a partially accepted path.
- Image masks, color-key masks, soft masks other than `/None`, embedded alpha masks, alternate artwork, OPI/external images and image-level optional-content associations are refused pending dedicated preservation adapters. An omitted-path notice is visible in the image list.

Original encrypted, protected/certified, signed and XFA source refusal rules remain. Originals are kept and saving creates a new reviewed PDF copy. Old image/Form objects stay in the output graph, so replacement is editing and is not permanent deletion or redaction.

## Saved-output verification code

The writer saves a source receipt for each selected original image/Form stream and checks its original indirect object after output reopen. Encoded stream bytes are SHA-256 compared, and dictionaries are structurally compared excluding only writer-derived stream Length.

For each cloned Form, output reopen must retain exact original encoded program bytes and dictionary fields other than the intentionally changed Resources and derived Length. Its non-XObject resources must match; its complete XObject mapping must match the final declared cloned chain. Unrelated indirect root XObject references on every source page must remain unchanged. The replacement image must be reachable at the exact reopened page/resource path, have the declared replacement reference and retain the expected width, height and Image subtype.

These are source-image/Form/path preservation gates. They do not prove complete PDF object equivalence, individual placement fidelity, color-profile equivalence, tagging or all unrelated page content. Existing source-font, page geometry and PDF.js preview/readback gates remain active in the content workspace code.

## Files and integration

- `src/pdf-original-image-path.js`: bounded Form eligibility/path resolution, copy budgets, selected-path cloning and source/reopened preservation receipts.
- `src/pdf-original-images.js`: source-bound nested inventory and actual original image preview.
- `src/pdf-content-output.js`: asynchronous inventory, source hash, image-plan verification and addition-page resource isolation.
- `src/pdf-image-replacements.js`: nested labels, exact path display, source/path-bound preview receipt and omitted-path disclosure.
- `src/pdf-content-model.js` and `desktop/content-validation.cjs`: optional source-bound nested image identity syntax.
- `src/pdf-content-workspace.js`: supported nested-image editing description.

The existing worker actions, content editor, image picker, recovery and copy-save route are reused. No new main/preload API or package dependency is needed. Root owns the combined Vite compile. Targeted syntax checks passed for all seven JavaScript/CommonJS files; no runtime/app/worker/browser test was launched.

The implementation was grounded in the installed primary pdf-lib source for PDFRawStream cloning/encoded bytes, dictionary lookup and clone behavior, PDFObjectCopier, PDFPageLeaf resource/Contents normalization and Form XObject construction. No outside SDK or executable document content was added.

## Remaining fidelity work and later hidden runtime gates

Resume offscreen fixtures when testing is authorized: single/deep Forms, same Form on several pages, repeated/named aliases on one page, multiple replacements under shared parents, original masks/refusals, named/ICC color spaces, rotated/transformed/clipped Forms, mixed replacement plus additions, content/Resources aliases, Undo/recovery and exact source mismatch. Independently inspect actual nested paths, retained originals, page reference maps, appearance and encoded program bytes. Include cycles, missing resources, singular matrices, malformed/oversized resource dictionaries and copy-budget refusals.

Individual draw-occurrence selection, inherited Form resources, mask-preserving replacement, broader color/profile fidelity, nested original text editing and complete original-object preservation acceptance remain open requirements.
