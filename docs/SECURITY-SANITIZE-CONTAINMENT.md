# Contained PDF structural reports and cleanup

Saved 2026-10-04. `PdfSecurityService` and `PdfSanitizeService` now require the fixed Windows AppContainer document engine. Their previous Node Worker routes are no longer instantiated; there is no direct or worker fallback.

The fixed engine has three new operations: `security-inspect`, `sanitize-inspect`, `sanitize-build`. Security inventory logic lives in the child-only `pdf-security-codec.cjs`. Sanitation retains the existing source graph, sensitivity/reachability refusal, retained-object fingerprint and independently reopened output checks inside the child. The central object-stream capacity guard and broker/job limits apply to all three operations.

Parent validation is inert: exact report/receipt shapes, source SHA/size, integer counts, flags, action/attachment lists, category selection, output SHA/size, page count and verified-copy receipt. It does not load or parse the original/output PDF. Parent choice/category validation was moved into a pure module so sanitation services no longer import their PDF decoder. Inspection streams and source metadata remain unexecuted; incomplete/encrypted security inventories remain explicitly incomplete. A report is neither a malware verdict nor certificate verification.

Public service contracts remain:

```js
await security.inspect(id,source);
await security.cancel(id);
await sanitize.inspect(id,source);
const preview=await sanitize.build(id,source,token,selection);
const nativeCopy=sanitize.output(id,currentSource,token);
await sanitize.cancel(id,token);
await sanitize.discard(id,token);
await service.dispose();
await service.status();
```

Constructors optionally accept the established `{runtimeDirectory,stagingDirectory}` package configuration. Each family uses an immutable owned source snapshot, original fingerprint, generation/cancellation fence and observed broker-close/profile cleanup before result release. Copy previews are detached from the sealed native bytes/report used for saving. Cleanup failure or unobserved termination permanently closes the service and retains the shared process-wide lease. Status caching remains display-only and launch verification remains strict.

Root main integration must await family restart promises before inspect/build/save routes, replace services only after successful disposal following renderer loss, retain failed closed services on rejection and catch disposal errors during quit. Cancel/discard now return awaitable booleans. Combined native status must include these families. Root owns those main/preload/status changes.

Source input remains PDF ≤100 MiB. Security reports are ≤256 KiB, at most 100 listed action types/attachment descriptions and bounded counts/text; complete status must agree with its omission/inspection limits. Truncated action-type summaries are now disclosed, alongside existing attachment/structure/encryption omissions. Sanitation inspections/receipts are ≤64 KiB, 1–500 pages, exact selected categories and output SHA/length. Selected categories must have zero after-counts; unselected category removal counters stay zero. Existing signed, encrypted, XFA, malformed, shared-sensitive-root and retained-history refusals remain in the child writer.

Changed/new source: `pdf-security-service.cjs`, `pdf-security-codec.cjs`, `pdf-security-validation.cjs`, `pdf-sanitize-service.cjs`, `pdf-sanitize-codec.cjs`, `pdf-sanitize-validation.cjs`, fixed routes in `document-engine-entry.cjs` and `document-sandbox-service.cjs`, and this note. The full Security Sandbox requirement remains open for remaining decoder families and hidden runtime/release/adversarial acceptance. No application, broker, engine, feature worker or runtime tests were launched.
