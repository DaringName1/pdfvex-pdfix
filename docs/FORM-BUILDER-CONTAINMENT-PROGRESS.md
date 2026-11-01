# Fillable-field builder containment — October 7, 2026

Implemented in `desktop/form-builder-service.cjs`, new `desktop/form-builder-codec.cjs`, and `desktop/form-builder-validation.cjs`. Source syntax checks passed. App, native engine and runtime acceptance checks remain deferred at the user's request.

- `FormBuilderService(directory, options)` now extends `ContainedServiceContext` and forwards fixed runtime/staging options. PDF parsing and field writing use fixed `form-inspect` and `form-create` child operations. Production service code no longer imports Node Workers or uses an unrestricted fallback. The child entry's shared compressed-object limits replace the former Worker's larger per-object allowance.
- Opened PDF snapshots require their unchanged native fingerprint and the existing 100 MiB limit. Builds use a version-4 UUID token. Strict draft validators reconstruct inert field recipes before staging; the child receives no renderer paths, operation names or parser options.
- Inspections retain pages, crop/media intersections, page rotations, existing widget locations, field names and page count, now with the actual source SHA-256. Main validates exact schemas, finite geometry, unique bounded names, 500-page/field and 2,000-widget limits before caching an inspection or returning it.
- Existing new-field support remains: text, checkbox, radio, dropdown and single-select list; labels/tooltips, required/read-only flags, reviewed PDF rectangles, choice labels/export values, and initial empty/unselected values. Drafts retain 100-new-field, 500-total-field, 2,000-widget and 120 KiB bounds. Duplicate names, malformed Unicode/control characters, inconsistent radio locations, overlaps and invalid choices remain refused.
- Child creation independently reopens the saved copy and checks exact new field types, flags, labels, appearances, font sizes, initial selections, choice/export pairs and widget positions. Existing page content payloads, crop/media boxes, rotation, original annotation order, original field dictionaries and annotation dictionaries are checked for retention. Main validates the exact requested field mapping, source/output hashes and lengths, page/field/widget counts and bounded typed retention receipt before sealing output.
- Protected inputs remain refused: encryption, permission/certification catalog entries, signature-bearing objects, XFA, malformed objects/references, unsupported numerical values and sources beyond bounded traversal limits. Signature/XFA guards now also traverse direct nested dictionaries under the same 100,000-object / 300,000-node / 80-level budget; no signature, script or form action executes.
- Verified copy bytes are independently cloned, and saving rechecks source ID/fingerprint, token and stored output hash. Token-only `discard(token)` retains its public API while awaiting the active child's cancellation and common broker cleanup. Matching sealed output is zeroed/invalidated. Disposal zeros all seals, clears inspection state, awaits child cleanup and drains the existing recipe queue. Failed containment cleanup leaves the service closed.
- Local recipe behavior is preserved: the same `form-builder-drafts/<source-hash>.json` directory, queued atomic temporary-file/rename saves, source-bound load validation, 128 KiB disk limit, 100-recipe cap, explicit recipe clearing, and local privacy inventory. These inert JSON recipes stay in the app process; PDF parsers stay in the child.

## Root integration hooks

Add `form-inspect` and `form-create` to the fixed operation allowlist and import the codec only from the child entry:

```js
const {inspect:inspectFormBuilder,create:createFormBuilder}=require('./form-builder-codec.cjs');
'form-inspect':(bytes,o)=>{if(Object.keys(o).length)throw new Error('Form inspection has no operation/path options.');return inspectFormBuilder(bytes);},
'form-create':(bytes,o)=>{if(Object.keys(o).join(',')!=='draft')throw new Error('Form creation requires only its reviewed draft.');return createFormBuilder(bytes,o.draft);},
```

Main must safely restart with `new FormBuilderService(app.getPath('userData'), options)` after observed cleanup, retain current recipe directory/queue semantics, guard service jobs during restart, await discard/disposal promises and include this family in containment status. Source-bound save callbacks must retrieve the current service so a restarted instance cannot authorize an old seal. Initial source inspection uses its fingerprint as the internal contained job identity; creation uses the actual source ID and token.

Response compatibility: `inspect(source)` retains `pages`, `widgets`, `fieldNames`, `pageCount`, and `fingerprint`, adding `sourceSha256`. `create(...)` retains `bytes`, `pageCount`, `expected`, `sha256`, and `sourceFingerprint`, adding `report`. `output(...)` remains `{bytes, sha256}`. The report is an inert retention receipt, not a claim of sanitation, accessibility certification, signature validity or guaranteed runtime form behavior.

Remaining acceptance: real Acrobat/Bluebeam forms and inserted fields, unsupported protected sources, recipe recovery, cancellation/crash cleanup, source replacement during native save review and clean-machine containment. No runtime tests or new tests were run or written for this migration.

## Initial inspection cancellation — October 7, 2026

The renderer can now request source-bound cancellation while initial inspection is running, before a creation token exists. The native route only cancels a matching source-fingerprint inspection with a null token; creation jobs and unrelated sources are not selected by that route. Closing waits for cancellation and the active operation to settle. A canceled inspection is not adopted even if its response races the cancel request. Runtime cancellation and recovery acceptance remain pending.
