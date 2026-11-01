# Contained structural redaction verification

Saved 2026-10-04. Native original-source parsing and candidate clean-image verification now use only the packaged fixed AppContainer engine. The unrestricted Node worker adapter and worker source have been removed. The renderer retains its existing bounded clean-image rendering/writer and reviewed preview; this migration covers the native independent structural/save gate, not a new rendering engine.

## Integration

`RedactionService` keeps `verify(id,source,token,candidateBytes,draft)`, `output(id,currentSource,token)`, token-only `cancel(token)` and `discard(token)`. **Source is now the owned `store.source(id)` object**, including `ext`, bytes and fingerprint. Output returns a detached Buffer as before; the independently sealed report remains `service.verified.result`. Main must pass current source to output and use that report SHA for the existing exclusive, source-bound copy save. Verification returns the existing pageCount/layout/regions/cleanupOnly/sha256 fields plus version, verified, source/output byte counts and source/inspection/draft hashes.

Cancel/discard are asynchronous. `dispose()` awaits observed termination and cleanup; `status()` uses the shared package status cache and live transaction/engine state. Await disposal before replacing the service after renderer loss, retain the failed closed service on unsafe cleanup rejection, and catch disposal failure during quit. Root owns main/preload/status/lifecycle changes.

## Fixed phases and receipts

`redaction-inspect` receives only the original PDF and empty options. The child refuses encrypted, permission-controlled, signed, XFA, malformed/excessive structures and invalid page/image geometry using the existing redaction source rules. Its compact inert inspection contains the exact original SHA and byte length, 1–100 page geometry records and form-presence flag.

`redaction-verify` receives only the candidate clean-image PDF and `{inspection,draft}`. The adapter exclusively supplies the validated first-phase geometry and immutable draft. Pure parent/child validators independently check exact object keys, geometry math, mark bounds, 144/180/216 DPI, 500 marks, 8,192-pixel edges, 16 million pixels/page and 100 million pixels/job. Original SHA, canonical inspection SHA, draft SHA and candidate SHA are bound to the returned receipt. A token-bound transaction spans both child jobs, so cancellation between phases cannot resume verification or release a saved copy.

The contained child reopens the candidate using the existing strict clean-image verifier: flat exact page tree and allowed object keys, image-only RGB/Flate streams with exact expected dimensions, black pixels throughout expanded masks, canonical image/content stream bytes, no metadata/protection/unreferenced objects and exact canonical whole-file serialization. This canonical reserialization is a proof step in the contained child. Rendering cannot preserve selectable original text; the output intentionally remains the existing clean-image redacted copy. The source fingerprint and original SHA, output SHA and sealed receipt SHA are rechecked when main requests saving.

Both phases keep the ordinary **2 MiB request**, **100 MiB input/candidate** and **32 MiB outer result** limits; redaction receipts are further bounded to 64 KiB. No raw RGB/base64 images or extra file slots are introduced. Existing decoder guards, shared two-job lease, one-job family slot, pinned-byte launch verification, AppContainer capabilities, Job Object limits, observed broker close, cleanup-before-release and permanent unsafe failure closure are unchanged. There is no unrestricted fallback.

## Saved files and remaining gates

`desktop/redaction-service.cjs`, new child-only `redaction-codec.cjs`, new inert `redaction-contained-validation.cjs`, fixed engine entry and operation whitelist, plus this note. The old `redaction-worker.cjs` is deleted. The renderer redaction models/output writer and preview behavior are unchanged.

Source syntax and the actual fixed-child bundle compile passed. No application, broker, engine, worker or browser runtime tests ran. Root's shipping compilation must rebuild the pinned engine artifact. Runtime AppContainer acceptance, independent redaction/security review and exported viewer acceptance remain open; a compiled source change is not a runtime security certificate.
