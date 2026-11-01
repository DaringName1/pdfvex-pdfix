# PDF decoration/Bates and bookmark containment — October 7, 2026

Implemented service migration source; native runtime acceptance testing remains deferred at the user's request. No native broker, engine, worker or app was executed for this work.

- `PdfDecorationService` and `PdfBookmarkService` now extend `ContainedServiceContext`, forwarding constructor runtime/staging options. Production services no longer create Node Workers and have no unrestricted parsing fallback. Decoration uses the fixed `decoration-build` operation; bookmarks use `bookmark-inspect` and `bookmark-build`.
- New `pdf-decoration-codec.cjs` contains the existing decoration/Bates writer and its independent PDF reopening checks without a Worker bootstrap or per-worker DecodeStream patch. The child entry's existing fixed decoding budget is authoritative. The existing bookmark codec remains the parser/writer inside the child. Neither codec belongs in Electron main.
- Source inputs require an opened PDF under 100 MiB with an unchanged native fingerprint. All build tokens retain the existing version-4 UUID format. Service requests are reconstructed through strict draft validators; no renderer operation names, paths or parser options are accepted.
- Decoration receipts require exact fields, source/output hashes, lengths, page sequence, standard font, exact text/style additions, source content-reference ordering and added prefix/suffix stream identities. Bates receipts require the exact reviewed sequence, uniqueness within that sequence and independently recomputed overlap flags between new addition rectangles. Existing-identifier/artwork collision checks remain explicitly unavailable/manual. Receipts are bounded to 4 MiB and 200,000 total content references; those are inert receipt bounds, not relaxed parser limits.
- Bookmark inventories require exact fields, supported hierarchy, page/count consistency and the native-computed source-bound inventory digest. Output receipts require exact reviewed titles/pages/depths, source/output hashes, lengths, inventory digest, page bounds and retained-object bounds. Reports are bounded to 1 MiB. Plain titles support well-formed Unicode; control characters, malformed hierarchy and unsupported fields remain refused.
- Verified bytes and reports are independently copied before renderer delivery. Save authorization rechecks the source fingerprint, source ID, token and stored output hash. Cancel/discard invalidate and zero matching sealed previews; disposal zeros any preview. Async cancellation/disposal awaits the common engine's observed child exit and broker/staging cleanup. Common unsafe/cleanup failures leave the service closed and prevent fallback or premature reuse.
- Existing codec limitations remain: encrypted, signed/certified, XFA, malformed and unsupported PDFs are refused. Decoration geometry retains its unit/rotation constraints and ASCII standard-font text. Bookmark writing remains plain direct physical-page/Fit outlines and retains old source data; neither tool claims redaction, sanitation or signature validation.

## Root integration hooks

Add fixed operation names to `DocumentSandboxService.OPERATIONS`: `decoration-build`, `bookmark-inspect`, `bookmark-build`.

In the child-only `document-engine-entry.cjs` import:

```js
const {build:buildDecoration}=require('./pdf-decoration-codec.cjs');
const {inspect:inspectBookmarks,write:writeBookmarks}=require('./pdf-bookmark-codec.cjs');
```

Fixed handlers must reject extra option fields:

```js
'decoration-build':(bytes,o)=>{if(Object.keys(o).join(',')!=='draft')throw new Error('Decoration requires only its reviewed draft.');return buildDecoration(bytes,o.draft);},
'bookmark-inspect':(bytes,o)=>{if(Object.keys(o).length)throw new Error('Bookmark inspection has no operation/path options.');return inspectBookmarks(bytes);},
'bookmark-build':(bytes,o)=>{if(Object.keys(o).join(',')!=='selection')throw new Error('Bookmark editing requires only its reviewed selection.');return writeBookmarks(bytes,o.selection);},
```

Main lifecycle must await both services' `dispose`, expose their containment status, await restart/discard/cancel promises, and retain source-bound save getters when a safely closed service is restarted. Keep common engine resource limits, pinned manifest hashes, two-job process-wide limit and observed cleanup checks. Rebuild the bundled fixed engine after adding these handlers; an old manifest without these operations fails closed.

Source syntax checks passed for the changed service, codec and validator files. Runtime acceptance for cancellation, broker cleanup, unsupported sources and real decorated/bookmarked files remains outstanding.
