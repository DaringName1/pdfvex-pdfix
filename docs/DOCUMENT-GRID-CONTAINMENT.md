# Contained DOCX table-grid inspection

Saved 2026-10-04. The fixed `document-table-grids` operation invokes `desktop/document-grid-import.cjs` only inside the packaged Windows AppContainer document engine. The parent never opens DOCX ZIP/XML to derive table layout and has no direct or worker fallback.

`desktop/document-grid-service.cjs` exports:

```js
await inspectDocumentTableGrids(id,store.source(id));
await cancelDocumentTableGrids(id); // ID can be omitted to cancel the current job
await disposeDocumentTableGrids();
await restartDocumentTableGrids(); // replaces only after observed safe disposal
await documentTableGridStatus();
```

Main must use an opened FileStore DOCX source. The service verifies its immutable fingerprint, makes an owned snapshot and retains source ID/generation cancellation fences. It uses the shared one-job-per-family lifecycle, two-job process cap, observed broker exit/profile cleanup and permanent unsafe-failure closure. The shared package status cache remains display-only; every launch still checks pinned broker/runtime bytes.

The child and parent require the exact compact inert report:

```js
{
  version:1,
  sourceSha256:'64 lowercase hexadecimal characters',
  tables:[{
    key:'table-1', // exact one-based source ordinal, not an association guess
    rows:1,
    columns:2,
    widthsTwips:[3000,3000], // null when unavailable; otherwise 1..30000 each
    signature:'64 lowercase hexadecimal characters', // null when unavailable
    reason:null // bounded explicit explanation when layout/identity is unavailable
  }],
  notices:[]
}
```

Input is DOCX only and at most 10 MiB; there are no operation/path options. Reports have at most 50 source-table descriptors, 100 rows and 32 columns each, 20,000 aggregate rectangular slots and 256 KiB serialized output. Unsupported tables have both dimensions zero, null widths/signature and a nonempty reason. A positive shape with unavailable widths or signature also requires a disclosed reason. Notices and reasons are bounded inert strings, never markup.

The extractor computes table signatures from canonical source geometry plus normalized plain text. The editor must associate imported tables only through unique matching signatures; ordinals and a successful containment report do not authorize guessing a correspondence. No width should be applied to an ambiguous, mismatched or unsupported table.

Source additions: `document-grid-service.cjs`, `document-grid-validation.cjs`; fixed operation added to `document-engine-entry.cjs` and `document-sandbox-service.cjs`. The document-fidelity agent owns the extractor/editor; root owns main/preload/status integration. Source syntax checks passed, and the actual codec bundle including the saved extractor compiled and passed `node --check` in the source-check directory. Root must rebuild the pinned shipping engine after these changes. Broker/policy code was unchanged for this operation. No application, document engine, native worker or runtime tests were launched. Full DOCX fidelity and Security Sandbox release acceptance remain open.
