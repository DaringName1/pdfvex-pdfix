# Document-engine containment adoption

Saved 2026-10-04. This checkpoint supersedes the XFDF-only adoption description in the earlier security progress note. These routes are coded to require the packaged fixed Windows AppContainer engine. Runtime containment and release acceptance remain unverified; no feature tests or application/engine launches were performed.

## Adopted service families

| Service | Fixed operation | Preserved contract |
| --- | --- | --- |
| `PdfReviewService` | `review-inventory` | `inspect(sourceId,source,pages)` returns the validated source/page inventory |
| `PdfReviewEditService` | `review-edit` | `build(sourceId,source,token,draft)` returns token, preview bytes and receipt; `output()` returns the sealed native copy |
| `PdfTakeoffService` | `takeoff-write` | Same build/output contract, with existing takeoff/source/geometry receipt validation |
| `PdfTakeoffRecoveryService` | `takeoff-recovery` | `inspect(sourceId,source)` returns a validated source-bound recovered ledger |
| `OfficeService` | `workbook-read/write`, `presentation-read/write` | Existing `officeJob(action,bytes,draft)` returns its model or copy bytes |
| Existing root-adopted `PdfXfdfService` | `xfdf-export` | Source/token-bound export preview, receipt and sealed save output |

The adopted services no longer instantiate their prior Node Worker implementations and have no worker/direct fallback. Unused worker source files are not evidence of active fallback. Each job passes immutable owned input through the pinned packaged engine and retains its operation-specific validator in the trusted parent. PDF/Office document decoding, source inspection, writing and output read-back are performed in the contained child. Office models are checked as inert data outside the child, without reopening their untrusted ZIP/XML/PDF.

Review/takeoff constructors accept optional `{runtimeDirectory,stagingDirectory}`. Defaults resolve the packaged `dist/native/document-engine` beside the desktop code and a separate app-owned temporary staging root for each family. Packaging relocation must supply the actual installed runtime path instead of substituting an unrestricted worker.

`desktop/contained-service-context.cjs` shares the family lifecycle: one active job, source ID/token/generation fences, native AbortController, awaitable cancellation and disposal, owned source-byte clearing and permanent closure after unsafe cleanup/termination. Review and takeoff copies still keep native-owned sealed bytes/report; the renderer never supplies the subsequent saved output bytes.

## Main/preload integration

Existing `inspect`, `build`, `output`, `cancel(sourceId,token?)` and `discard(sourceId,token?)` call sites retain their arguments/result shapes. Cancel/discard now return **Promises of booleans**; IPC handlers must await them. Cancellation retains the active slot until broker close and profile/job cleanup are observed.

`dispose()` is a Promise and must be awaited before replacing a service after renderer loss. On rejection, retain the disposed service and keep its routes closed. Do not catch-and-create a replacement after unobserved termination or cleanup failure. Quit handlers can initiate disposal and catch the rejection without reporting a successful cleanup. Parent-process death and broker kill-on-close remain additional containment controls, not permission to claim cleanup succeeded.

Every adopted service has `status()` for package/policy/job/closed/cleanup reporting. Root owns the global status/IPC and renderer lifecycle integration.

Office exports:

```js
const {
  officeJob, cancelOfficeJob, disposeOfficeService,
  restartOfficeService, officeStatus, OfficeService
}=require('./office-service.cjs');

const model=await officeJob('read',source.bytes,undefined,{
  sourceId:id,sourceSha256:source.fingerprint
});
const copy=await officeJob('write',source.bytes,validatedDraft,{
  sourceId:id,sourceSha256:source.fingerprint
});
await cancelOfficeJob(id); // omit ID to cancel the current Office job
```

The existing Office action names remain `read`, `write`, `read-presentation` and `write-presentation`. The optional fourth argument supplies the current immutable FileStore identity/hash. A mismatched supplied source hash is rejected before staging. Legacy three-argument callers receive a private generated job identity and still have immutable source SHA matching in the engine protocol; main should pass FileStore identity for precise cancellation/departure behavior.

`restartOfficeService()` disposes the existing singleton before replacing it, serializes concurrent restart calls and refuses replacement on unsafe failure. `officeJob()` awaits a pending restart. `disposeOfficeService()` is for quit; `officeStatus()` returns the singleton's containment status. The native Save As route must still verify its current source and save the generated immutable bytes exclusively. Model validation is not source authenticity, a signature validator or user authorization.

## Bounded trusted Office models

`desktop/office-model-validation.cjs` requires exact plain-object shapes, supported enums and finite geometry. It rejects malformed types, duplicate part/cell/run identities, inconsistent cell addresses or sheet bounds, invalid edit-permission flags, unreferenced/duplicate run tokens and assets whose MIME/header dimensions differ from the declared preview bounds.

Workbook limits remain 50 sheets, 100,000 stored cells, 5,000 merge/formula ranges per sheet, worksheet dimensions 1,048,576 × 16,384, 32,767 characters per stored literal, 8 MiB aggregate stored value text and 8 MiB aggregate formula literals. Boolean/number literals are checked without evaluating formulas. Formula/cache/style/visibility/protection data stay inert. Workbook drafts require exact plain shapes and validate addresses before containment, with 5,000 changes and 500,000 aggregate characters; numeric editing retains its existing finite/15-significant-digit rule.

Presentation limits remain 100 slides, 20,000 runs, 3,000 elements, 2 MiB run text, supported finite page/shape geometry and literal styles. Additional output structural bounds are 50,000 paragraphs, 100,000 tokens, 100 warnings and finite font sizes. Assets remain at most 32 PNG/JPEG previews, 4 MiB/4 million pixels each, 8 MiB/24 million pixels combined. Header-only dimension checks run in the parent; no image pixels or Office document are decoded there. Presentation drafts retain 3,000 edits and 500,000 aggregate characters, require plain exact shapes and cannot modify locked/unsupported runs through the contained writer.

Office copy results are bounded to 10 MiB and the expected ZIP byte envelope. Full source/edit/read-back and retained-part comparisons remain inside the existing contained writers. The parent does not reparse Office archives to duplicate that proof.

## Shared process/resource controls

`DocumentSandboxService` now reserves a process-wide lease before copying/staging any input. At most **two contained document jobs** across all adopted families can be active. Additional jobs receive a bounded busy error. Per-family slots remain in place; canceled jobs retain their lease until observed shutdown/cleanup. Unsafe termination or cleanup failure keeps its lease and closes its service; creating a new service does not silently recover that capacity.

The inert JSON result cap is now **32 MiB** in the engine, parent and broker watchdog. The original 16 MiB cap could not represent the existing 100,000-cell workbook scope plus permitted text. Per-operation parent traversal bounds are 1.2 million nodes for workbook models, 750,000 for presentation models and 300,000 for other results, all at depth ≤100. Exact domain validators still enforce narrower PDF report/receipt budgets. Embedded byte payloads remain canonical base64 and at most 8 MiB.

Input/output binary slots remain 100 MiB each, request JSON 2 MiB and error JSON 4 KiB. The broker's document staging aggregate watchdog is updated consistently to 234 MiB plus bounded marker/error overhead. This is still a watchdog, not a filesystem quota. Existing qpdf limits and mode remain unchanged. Per child: zero capability SIDs, one-process Job Object, 512 MiB process/job memory, 256 MiB Node old heap and existing CPU/wall/decode limits.

The early broker-close observation remains registered inside `NativeDocumentSandbox.launch()` before returning across its async boundary. Immediate launch failure or termination cannot lose the close event before the service subscribes to the stored `brokerExit` promise.

Combined family status now shares one in-flight package verification for the same broker/engine paths, instead of reading and hashing the identical 86 MiB Node runtime six times concurrently. A status-only cache lasts 2.5 seconds and compares cheap bounded file metadata before reuse; each result includes its check timestamp and snapshot. The cache is bounded to eight settled installation-path entries. Family activity/closed/cleanup state remains read live by its own service. Launch, staging and runtime verification never consult this cache and still check the pinned bytes for every job. This display cache is not a launch authorization or runtime-isolation proof.

## Saved source changes and verification

Changed/new files for this adoption: `contained-service-context.cjs`, `pdf-review-service.cjs`, `pdf-review-edit-service.cjs`, `pdf-takeoff-service.cjs`, `pdf-takeoff-recovery-service.cjs`, `office-service.cjs`, `office-model-validation.cjs`, `workbook-validation.cjs`, `presentation-validation.cjs`, `document-sandbox-service.cjs`, `document-engine-entry.cjs`, `native-sandbox.cjs`, `native/SandboxLauncher.cs` and this document. Root separately owns main/preload/Vite/global tracker integration.

Targeted syntax checks passed on changed JavaScript. The updated broker source compiled with Framework64 C#, x64, optimization and warnings as errors. Root must rebuild the pinned broker and bundled document engine after these source changes; its combined build determines current shipping artifact hashes. No broker, fixed engine, feature worker, application or runtime/corpus tests were launched.

Remaining S00 work includes other PDF worker families, DOCX/HTML import/export, image/OCR decode, PDF.js rendering boundaries, all hidden clean-machine/adversarial isolation checks, effective ACL/network/child-process denial, cancellation/parent-death/cleanup acceptance, packaging relocatability and independent security review. These additions do not mark the complete Security Sandbox requirement or full master plan done.
