# PDF link and attachment containment — October 7, 2026

Coded changes for S00 / F26 / M01.06. Source checks and combined compilation are separate from runtime security acceptance. No app, native engine, broker, browser or document runtime tests were run for this change.

## Source-bound link inspection

`desktop/pdf-link-service.cjs` now uses `ContainedServiceContext` and the fixed `link-resolve` operation. PDF parsing happens in the child-only `pdf-link-codec.cjs`; the parent imports only inert URL/request/result validation. The existing checks remain: exact opened PDF ID/hash and physical page, annotation reference belongs to that page, a direct URI action, no additional/chained/launch/file/script actions, bounded HTTP(S) destination without credentials, and a native user review before browser opening. Parent validation compares every request identity and normalized URL/host after child termination. Inspection never opens a browser by itself.

## Source-bound attachment inspection

`desktop/pdf-attachment-service.cjs` now uses fixed `attachment-inspect` and `attachment-select` operations. PDF object traversal and Flate stream decoding happen in the contained child. Parent validators check bounded plain report shapes, unique identities, sequential inventory positions, actual sizes/hashes, signature-status scope and exact selected metadata. The selected decoded bytes must match the independently inventoried hash before retaining a review token; the source and retained bytes are checked again before an inert `.bin` copy can be saved.

Existing limits remain: 100 descriptions, 10 MiB per attachment, 25 MiB decoded data/work, source at most 100 MiB, standard unfiltered/plain Flate streams only. Empty attachments receive an explicit no-bytes refusal. Attachment content is never interpreted or opened. Declared names/types remain untrusted metadata. Certificate validity remains unable to verify. Unsupported filters, external resources, XFA, portfolios and multimedia containers are refused.

## Lifecycle and scope

Cancellation awaits the contained broker's observed termination. Renderer loss disposes services and only recreates them after successful cleanup, preserving configured runtime/staging directories. Failed termination or cleanup keeps the old service closed. Ordinary canceled link review cancels the job without permanently disposing the family. Shared contained preflight refusals clear the cloned input bytes. Retained attachment bytes are cleared on cancel, discard, replacement and disposal.

Both routes are included in native and renderer Security Sandbox status. They have no unrestricted parser fallback. Other parser/writer families and Chromium PDF/image/OCR decoding still need adoption or evaluation. Effective Windows containment, ACL/network/process limits, cancellation/parent-death, malformed documents, native dialog behavior and source/output save fencing still require runtime acceptance.
