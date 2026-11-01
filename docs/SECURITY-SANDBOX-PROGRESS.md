# Fixed document-engine AppContainer work

Saved 2026-10-04. This is a substantial source implementation toward S00; source compilation is not runtime containment acceptance or security certification.

## Implemented

`desktop/native/SandboxLauncher.cs` now has a separate, fixed `--document` mode. Its executable and arguments are hardcoded to the staged `node.exe` and `engine.cjs`; renderer input cannot select an executable, script, path, Node option or shell command. The existing qpdf mode retains its original runtime whitelist, argument protocol and directory-write behavior.

Document mode uses the existing exact per-job AppContainer SID and zero-capability token checks while the child is suspended, verified Job Object membership, one-process limit, 512 MiB job/process memory, 120-second CPU budget, 115-second wall deadline, explicit three-pipe handle inheritance and child-process restriction. Parent death and pipe limits remain enforced concurrently. No network capability is granted. The fixed Node command further limits old-generation heap to 256 MiB, semi-space to 32 MiB, stack to 4 MiB and disables native addons.

Document staging has a stronger file policy than the existing qpdf jobs. The broker replaces inherited/package-wide DACL grants within the app-owned document job with explicit owner/SYSTEM/Administrators grants and the exact job SID. The job SID has directory traversal/read/execute rights and runtime read/execute rights. Input, request and ownership markers have read rights only. Exactly three already-created files (`output.bin`, `result.json`, `error.json`) receive read/write rights; no directory creation or deletion grant is supplied. Private runtime files remain read-only. Ancestor and job reparse points are refused.

The job watchdog permits only seven known job files and the three fixed runtime files. Source/output bytes are limited to 100 MiB each, JSON result to 16 MiB, request to 2 MiB and diagnostic error to 4 KiB. It rejects unexpected directories and files. These observations are not an OS disk quota; the time between checks remains a release-review concern.

`desktop/document-engine-entry.cjs` implements these fixed operations:

- `review-inventory`, `review-edit`
- `takeoff-write`, `takeoff-recovery`
- `xfdf-export`
- `workbook-read`, `workbook-write`
- `presentation-read`, `presentation-write`

The bundle uses the existing actual codecs and preserving writers. A process-wide PDF object-stream guard enforces 16 MiB per decoded allocation and 64 MiB aggregate capacity. Office archive limits remain in their existing codec. The input length and SHA-256 must match the immutable request before a codec runs. There are no path options or dynamic operation imports.

Copies travel through the fixed binary output slot. Other results use bounded inert JSON with an explicit source/operation/output-hash envelope; embedded presentation-preview bytes use a bounded canonical base64 encoding. The trusted parent checks the envelope, hashes and operation-specific result validator after observed broker exit. No V8-deserialization, script evaluation or renderer-generated output bytes are used.

`desktop/document-sandbox-service.cjs` owns a single active job. It requires explicit app-owned absolute runtime/staging paths, makes an owned input snapshot, verifies packaged broker and runtime hashes before staging, uses exclusive file creation and verifies file ownership before cleanup. Cancellation kills the broker, whose kill-on-close Job Object terminates the contained child. A five-second unobserved-close deadline permanently closes the service and retains the occupied slot/files. Normal completion cleans the AppContainer profile and recognized staging before releasing a result; cleanup failure closes the service and withholds output. There is no unrestricted worker fallback.

## Main-process adoption interface

Do not import or require `document-engine-entry.cjs` into Electron; it is the executable child entry point. Import the service only:

```js
const {DocumentSandboxService}=require('./document-sandbox-service.cjs');
const contained=new DocumentSandboxService({
  runtimeDirectory: /* absolute packaged dist/native/document-engine */,
  stagingDirectory: /* absolute app-owned private staging subfolder */
});
const result=await contained.run(
  'xfdf-export',
  immutableSourceBytes,
  {draft: validatedXfdfDraft},
  value => validXfdfResult(value,validatedXfdfDraft,sourceSha256),
  {signal: nativeAbortController.signal}
);
```

The existing source ID, source permission, source SHA, token/generation fence, draft validator, operation-specific result validator, sealed native copy and reviewed exclusive Save As route must remain around the service. The generic protocol checks do not replace those domain checks. Inventory options use `{pages}`; recovery uses `{name}`; writing uses `{draft}`; Office reading uses `{}`. Read operations return the existing model/report shape. PDF-writing/XFDF operations return `{bytes,report}`. Office writing returns `Uint8Array`.

`cancel()` awaits the active job; `dispose()` closes the service and refuses safe recreation if broker close remains unobserved. `status()` reports package availability, policy, active/closed state and cleanup failure. Main must await disposal before replacement after renderer loss. If contained mode is enabled but the broker/runtime/manifest is absent or corrupt, block that operation. Any transitional older-worker mode must be separately explicit in status; it must not be silently selected after a contained launch failure.

Root integration now adopts this service for XFDF export: `desktop/pdf-xfdf-service.cjs` uses `xfdf-export` through the contained engine only, retains source/token/generation/native sealing and has no worker fallback. The Vite native closeBundle hook now packages the fixed engine using the explicit `vendor/document-node` executable/hash/license manifest. Other existing document-engine routes remain unchanged. The new service does not itself make every decoder contained. DOCX/HTML imports, image/OCR, redaction, PDF.js rendering, form/other PDF workers and remaining operation families still need their own isolation/adoption work.

## Packaging

`scripts/build-document-engine.mjs` exports:

```js
await bundleDocumentEngine(); // compiler only; creates engine.cjs, no runtime launch
await buildDocumentEngine({nodeExecutable,nodeSha256,nodeLicense});
```

The full packaging call requires an explicit standalone Windows x64 `node.exe`, its independently selected SHA-256 and Node LICENSE path. It checks that hash, PE x64 identity and bounded files; it does not download a runtime or substitute Electron.exe. Root copied the existing standalone host runtime and adjacent license into `vendor/document-node` and pinned the 86,973,768-byte executable and license in a source manifest. The Vite hook supplies those exact packaging inputs. Final packaged availability depends on the root combined build succeeding; no contained-runtime launch is implied. The ordinary Vite native-broker build hook rebuilds `PDFix.Sandbox.exe` and its manifest after source edits.

The compiler bundles all codec dependencies into one CJS file with Node builtins external and unresolved imports rejected. The package manifest pins Node and the generated engine. Runtime staging rechecks exact lengths and hashes before each job. Licensing files live separately from the job runtime and include Node, pdf-lib, xmldom, pako, tslib, standard-fonts, upng and compiler attribution, plus the upstream font README notice and separate pako/zlib source notice.

## Verification and outstanding gates

Targeted JavaScript syntax checks passed. The actual fixed codec source bundle compiled and passed `node --check`. The broker source compiled with Windows Framework64 C#, x64, optimization and warnings as errors. No native broker, contained document engine, feature worker, application, document corpus or runtime test was launched.

Release acceptance still requires hidden clean-machine checks for executable/dependency loading in an AppContainer, exact effective file ACLs (including inherited package-wide permissions), denied outside-job writes/network/child-process creation, token/capability values, malformed-input resource limits, cancellation/parent death/observed exit, cleanup failure and profile removal, reproducible hash-pinned shipping/runtime licensing, operation-specific model/copy parity and independent security review. An ordinary AppContainer may access Windows resources deliberately exposed to all packages; no claim is made that all system paths/registry keys are inaccessible. No permanent disk quota or less-privileged AppContainer policy is implemented.


## Root packaging and first adoption — 2026-10-04

The existing local standalone Windows x64 Node build runtime and its adjacent complete license are copied into vendor/document-node with exact SHA-256 pins. Vite compiles the fixed codec bundle and broker, packages runtime/engine manifests and bundled dependency/Node licenses. This is packaging compilation; no broker/engine was executed. The XFDF service now uses DocumentSandboxService exclusively, with source/token/generation and domain-result validation, immutable sealed XML/receipt saves, cancellation, and permanent close when termination or cleanup cannot be observed. The old standalone XFDF worker source is unused; there is no worker fallback in the active service. Settings shows fixed-document-package status separately. Other Office/review/takeoff/redaction routes still need adoption; full S00 remains open. Node provenance/clean-machine loading, OS grants/token/process/network/resource cancellation, compatibility and independent security acceptance remain deferred release gates.
