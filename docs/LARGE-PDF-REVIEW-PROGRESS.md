# Source-backed drawing-wide comment inventory

The review service now has a distinct read-only source-file path for opened PDFs
larger than 100 MiB and no larger than 256 MiB. The user's approximately
156,000 KB drawing fits that byte admission limit. Admission is not a guarantee
that its object complexity fits the isolated parser's memory or traversal budgets.
The reader continues to admit PDFs up to 1 GiB; inventory above 256 MiB remains an
implementation gap and produces an explicit limit message before staging.

## Main-process source contract

`FileStore` adds a non-enumerable `reviewInput()` capability to each file-backed
source. The renderer receives only the existing opaque session ID and safe open
metadata, now including `sourceSha256` and `capabilities.reviewInventory`.
It never receives the capability, a snapshot path, or a native descriptor.

`reviewInput()` returns a frozen `{length, sha256, stage, validate}` object.
`stage(target, {signal})` exclusively creates the contained job's `input.bin` and
copies from the already-retained immutable snapshot descriptor in 256 KiB chunks.
The parent never allocates or transmits a whole-source byte array for this route.
The copy hashes exactly the staged bytes and verifies the opened fingerprint,
retained descriptor stat, path stat, session ID, and FileStore generation.
Staging has a 120-second deadline, abort checks between reads and writes, and a
disk admission check for the source length plus 64 MiB when statfs is available.

Snapshot release invalidates capabilities immediately and waits for outstanding
staging leases before closing its descriptor or removing its owned leaf. A child
uses a separate contained staging copy, so no snapshot descriptor is inherited.
`validate()` must run before staging/launch and after child termination, before
returning a source-bound report. Session release during parsing invalidates that
result even if the contained parser completed successfully. Failed staging files
are left to the contained job owner's checked cleanup path.

## Contained operation and results

`PdfReviewService.inspect()` routes file-backed sources through
`_runContainedSourceFile(sourceId, null, 'review-inventory-file', input,
{pages}, validator)`. The distinct operation must be the only allowlisted
source-file operation in the shared containment service. It must require a
value-only result and an empty binary output. Paths or callbacks cannot appear
in renderer requests or the serialized child options.

The fixed child operation calls `inspectReviewSourceFile(bytes, pages)` after
bounded file input and source-hash validation. Only this entry point admits
256 MiB. Existing `inspectReview(bytes, pages, retainDocument)` remains capped
at 100 MiB, including callers that retain a document for editing or export.
Structural review extraction and its strict source-bound report validator are
shared, preserving physical page/object identities, reply relationships,
plain literal comments, flags, standard color metadata, and reported omissions.

Existing budgets remain: 500 pages, 10,000 annotations including popups,
100,000 indirect objects, 300,000 traversal nodes, bounded annotation strings,
and an 8 MiB complete inventory. All source pages are scanned for reply identity,
even when only selected-page literal fields are returned. A structural, source,
output, decoding, memory, or wall-clock failure returns an error without a partial
inventory. Read-only admission does not decode appearance streams, execute PDF
actions, or validate proprietary Bluebeam semantics or certificate trust.

## Reader integration and current limits

The review panel verifies large-file reports against the native open fingerprint
instead of reading or hashing `file.bytes`. It preserves search, filters, saved
filter sets, annotation details, source thread navigation, and bounds navigation.
Large-file edit actions and TXT/CSV/JSON/XFDF import/export actions remain disabled,
with method-level guards in addition to disabled controls. PDF copy permission
still controls access to the inventory.

Shared containment and reader integration were completed and compiled October 8. The reader and app now
mount the panel for large PDFs, preserve actual copy-permission checks, admit the
distinct fixed child operation, and keep broker/runtime/result validation and
observed-child-exit cleanup fences. The current native process/heap/decode/time
budgets remain fixed; sources that exceed them require a future parser or
explicitly designed resource profile, rather than a global edit-budget increase.

Validation for this change is limited to source inspection and `node --check`
on the six changed JavaScript modules. No runtime, browser, UI, document, or
fixture tests were run, and the user's drawing has not been executed or inspected.
