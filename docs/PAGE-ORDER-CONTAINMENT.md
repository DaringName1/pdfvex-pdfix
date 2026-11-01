# Fixed contained preserving page reorder

Saved 2026-10-04. `desktop/pdf-page-order-service.cjs` exports `PdfPageOrderService` using the existing optional runtime/staging constructor configuration and shared containment lifecycle. It calls only fixed `page-order-inspect` and `page-order-build` operations. PDF parsing, page-tree changes, preserving serialization and independent output reopening happen in the packaged AppContainer child. Parent validation is inert shape, semantic permutations and hashes; it never reparses PDF bytes.

## Main/preload contract

`await service.inspect(id,store.source(id))` returns the direct source/hash-bound inspection. `await service.build(id,source,token,{inspectionSha256,order})` returns `{token,bytes,report,receiptSha256}`. `service.output(id,currentSource,token)` returns detached native-owned `{bytes,report}` for the existing exclusive source-bound reviewed-PDF save helper. Receipt SHA is SHA256 of canonical report JSON followed by a newline.

Inherited `cancel(id,token?)`, `discard(id,token)`, `dispose()` and `status()` are asynchronous. Root owns inspect/build/cancel/discard/save routes, native-owned source selection, save suffix, Settings status and awaited renderer-loss/restart/quit integration. Await observed cleanup before replacing the service; retain an unsafe failed service permanently closed if disposal rejects.

Original source fingerprint/SHA, reviewed inspection SHA, exact order-selection SHA, token/generation, original byte length, sealed output SHA and receipt SHA are bound across build and save. Renderer preview bytes and report are detached copies. Build child re-inspects the exact immutable input and rejects a stale inspection or identity permutation. Parent requires the reopened report's original byte count to equal its owned input count.

## Bounds and scope

The fixed request stays **2 MiB**, original/output **100 MiB**, result envelope **32 MiB** and inert domain report **4 MiB**. No extra file, network capability, process, alternate executable or uncontained worker fallback is added. All existing pinned launch checks, shared two-job cap, process/memory/deadline constraints, observed broker close, cleanup-before-release and permanent unsafe failure closure remain.

The PDF editing agent owns the preserving codec, pure schema validators and reviewed UI. This slice accepts an exact 1–500-page permutation only, retaining existing physical page/object references, annotations, resources, forms and supported page-reference destinations. The codec refuses unsupported positional page labels, numeric destinations, signed/certified/encrypted/XFA sources, malformed/shared/cyclic trees and unsupported geometry. Original logical/bookmark order and action data remain; this is neither sanitation nor broader merge/delete/rotate fidelity.

Source/bundle compilation is the permitted verification; no application, broker, engine or feature runtime jobs/tests ran. Root must rebuild the shipping pinned artifact after the codec agent's final source-stable checkpoint. Runtime containment, preservation and exported-viewer acceptance remain open.
