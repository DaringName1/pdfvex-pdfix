# Fixed contained XFDF comment import

Saved 2026-10-04. `PdfXfdfImportService` uses the packaged Windows AppContainer document engine exclusively. Incoming XFDF XML and target PDF decoding, annotation creation and source-preserving output reopening happen in the fixed child. The trusted parent validates inert proposals/receipts and hashes; it never parses the XML or PDF and never opens resource references from the input.

## Main/preload contract

`desktop/pdf-xfdf-import-service.cjs` exports `PdfXfdfImportService`, with optional established `{runtimeDirectory,stagingDirectory}` constructor configuration:

```js
await service.inspect(id,source,{xfdf:canonicalBase64});
await service.build(id,source,token,{
  xfdf:canonicalBase64,
  proposalSha256:reviewedProposalHash,
  keys:explicitDistinctSelectedRowKeys
});
service.output(id,currentSource,token);
await service.cancel(id,token); // token optional for active inspection
await service.discard(id,token);
await service.dispose();
await service.status();
```

Inspection returns the validated source/XML-bound proposal directly. Build returns `{token,bytes,report,receiptSha256}`; the receipt SHA is computed over canonical report JSON followed by a newline. Output returns the sealed native PDF bytes/report for saving. The renderer supplies neither saved output bytes nor a source path. Source ID/SHA, XML SHA, proposal hash, selected-row hash and token/generation remain bound to the exact job. Saved preview bytes and receipts are detached from native-owned immutable output. Current source fingerprint and sealed source/XML/proposal/output hashes are rechecked by output().

Main owns the explicit `.xfdf` picker and bounded read. Its renderer response is `{name,bytes:Uint8Array,sha256}`; read at most 8 MiB from a regular chosen file, detect growth/short reads and never accept renderer paths/URLs. The renderer converts the selected bytes to canonical base64 for the explicit inspect/build request. The service accepts only the exact `{xfdf}` inspection or `{xfdf,proposalSha256,keys}` draft shape validated by the import codec's pure module. Input XML is at most 8 MiB decoded and cannot substitute another target PDF through XFDF IDs or file/appearance references.

Main/preload routes: `inspectPdfXfdfImport(id,inspection)`, `buildPdfXfdfImport(id,token,draft)`, `cancelPdfXfdfImport(id,token?)`, `discardPdfXfdfImport(id,token)` and `savePdfXfdfImport(id,token)`. Save should use the existing reviewed-PDF exclusive source-bound helper with an imported-comments filename suffix. Root owns those route/status/lifecycle hooks. Await disposal before replacement after renderer loss; retain failed closed service on unsafe rejection and catch disposal errors at quit.

## Fixed engine and bounds

The fixed operations are `xfdf-import-inspect` and `xfdf-import-build`. Inspection options carry canonical base64 only; build carries the validated exact draft. No command, executable, path, URL, dynamic import or alternate worker is selectable.

Accepted XML remains at most 8 MiB, 1,000 source annotations, 200 selected creations, 200,000 aggregate coordinate values and 8 MiB proposal/receipt. Proposal and result validators bound exact inert geometry/style/literal metadata, source/page identities, supported types, notes, new annotation/AP references and the reopened output inventory. Parent additionally checks original source byte length and XML SHA against its owned input. The existing PDF source/copy limit is 100 MiB; signed/encrypted/certified/unsupported source refusals remain in the preserving writer.

Canonical base64 expands an 8 MiB XML file beyond the ordinary 2 MiB request cap. These two operations therefore receive a **12 MiB request.json** budget, enough for the accepted XML plus source/proposal/selection envelope. **Every earlier operation retains its 2 MiB parent and child request cap.** The broker's fixed read-only request slot is bounded to 12 MiB and its aggregate staging watchdog to 244 MiB plus marker/error overhead. Output JSON remains globally 32 MiB with the stricter 8 MiB import domain receipts; import parent traversals cap at 750,000 inert nodes/depth100 so accepted ink/quad coordinate scope does not exceed the generic 300,000-node cap. This is a bounded watchdog, not an OS disk quota.

All launches still verify the pinned broker/runtime bytes and exact AppContainer/job token policy. Shared two-job process leases, one-job family slots, observed broker close, cleanup-before-release and permanent unsafe-failure closure are reused. The status-only package cache remains independent of every launch check. The qpdf mode, handles, capabilities, file ACL grants and Node/Job Object memory/process/deadline limits are unchanged.

## Scope and verification

The document/PDF-editing agent owns the XFDF parser, appearance adapter, preserving codec, schema validators and reviewed UI. This service does not broaden their supported annotation mapping, create certificate trust, execute scripts/resources or silently overwrite existing annotations. Revu/private appearances, full XFDF conformance and runtime viewer acceptance remain open.

Changed/new containment files: `pdf-xfdf-import-service.cjs`, `document-engine-entry.cjs`, `document-sandbox-service.cjs`, `native/SandboxLauncher.cs` and this note. Source syntax checks passed; the updated child bundle/broker are rebuilt by compilation. No application, broker, native worker, fixed engine or runtime tests were launched. Root's combined shipping build must refresh the pinned generated artifacts after these changes.
