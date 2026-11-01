# PDF source range queue repair

## Cause and primary source evidence

The previous renderer transport rejected its 65th queued request even though queued requests held only two offsets, not PDF byte buffers. A valid PDF.js burst could therefore abort a readable large PDF before the byte or native I/O budgets were reached.

The installed primary implementation is `pdfjs-dist` 6.3.289:

- `node_modules/pdfjs-dist/build/pdf.worker.mjs`, `ChunkedStreamManager._requestChunks`: `_requestsByChunk` admits each missing 256 KiB source chunk only once while pending, then `groupChunks` combines contiguous chunks into native range-reader requests.
- `node_modules/pdfjs-dist/build/pdf.mjs`, `PDFDataTransportStream.#onReceiveData`: responses are routed by their original `begin` offset. `PDFDataTransportStreamRangeReader._enqueue` completes and unregisters that reader synchronously after receiving one buffer.
- `PDFDataRangeTransport.onDataRange` calls its listener synchronously. `transport_stream_getArrayBuffer` copies partial typed-array views, so merged reads must deliver independent complete buffers rather than fragments or views into a larger assembly.
- `desktop/large-pdf-store.cjs` admits sources up to 1 GiB and serves native reads up to 1 MiB.

## Implemented algorithm

1. Bound all pending request records, including those in the active batch, by `ceil(source length / 256 KiB)`. The maximum is 4096 for the admitted 1 GiB source. A normal burst above 64 requests is queued instead of aborted. The source descriptor is checked against the existing 1 GiB admission ceiling.
2. Queue offset metadata only. One drain controls byte allocation and native I/O; requests wait behind its active assembly.
3. Start from the oldest request and scan queued records in arrival order. Coalesce overlapping or adjacent requests only when their union is at most 1 MiB, and never read a gap or assemble a whole source through merging. Larger original requests retain their single original assembly, up to the existing 64 MiB limit.
4. Read each batch through the admitted hardware profile's validated concurrency of one to four native calls (default four), each at most 1 MiB. Fully covered small requests that arrive during the read reuse the completed batch's bytes. Overlapping small requests therefore reuse disk reads where safe.
5. Deliver exactly one complete response per original range reader. A merged batch uses exact independent `bytes.slice` buffers, each at most 1 MiB. An unmerged original range transfers its assembly directly. An older queued request excluded from a batch blocks later requests with the same `begin` from joining that batch, preserving PDF.js's begin-only routing order.
6. Validate response types and exact lengths. Failure aborts the generation and clears pending metadata before calling the existing loading-task error handler. Every asynchronous native read is covered by `Promise.all`; aborted or obsolete generations neither copy nor deliver responses. The fire-and-forget drain catches failures, and asynchronous error-handler failures remain handled.

## Limits and remaining scope

The original refusal for a whole-source request or an individual request larger than 64 MiB remains. This patch does not add eager full reads, increase native read sizes, or raise the source ceiling. A request count beyond the source-derived metadata invariant still fails explicitly; it is outside the installed worker's deduplicated request behavior.

The transport controls one active assembly (at most 64 MiB), at most four outstanding 1 MiB native responses, and small exact response copies from a merged assembly of at most 1 MiB. PDF.js retains its own source and decoded data, and delivered buffers can outlive the transport operation. These transport limits are not a claim of constant application RAM usage.

## Verification status

October 7: ten changed source files passed `node --check`, including this transport and the native/renderer capacity integrations. `npm run build` succeeded with 266 modules, renderer `index-CGoTIaCk.js`, and build source SHA-256 `43fd6036a346d8b92f1c043deb8279971a1f057e154b12b0578c6bec01bac6a5`. Runtime tests, synthetic transport tests, application relaunch and actual large-document opening were not performed. Functional behavior is not reported as runtime verified. Hardware integration and adaptive preview details are in [READING-CAPACITY-PROGRESS.md](READING-CAPACITY-PROGRESS.md).
