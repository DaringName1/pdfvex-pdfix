# Large PDF reader implementation

**October 11 scrolling update:** large-file reading now defaults to bounded Continuous scroll. Actual SW3 mouse-wheel navigation forward/back, middle/last-page jumps, selectable text and Page/Continuous switching passed in a hidden window. The measurement-close interaction that reverted the view was repaired. Current build was saved and the visible desktop app restarted. See [SW3-SCROLLING-FIX-2026-10-11.md](SW3-SCROLLING-FIX-2026-10-11.md).

**October 11 runtime update:** the persistent contained reader now opens the actual 153 MiB, 700-page FAA SW3 PDF. Selected chart artwork/text, same-process page navigation, cancellation/recovery, reopening, 65-page memory/recycling and cleanup checks passed. See [SW3-PERSISTENT-READER-VERIFICATION-2026-10-11.md](SW3-PERSISTENT-READER-VERIFICATION-2026-10-11.md) for measured results, exact build hashes and remaining limits. This supersedes the startup/per-page parsing findings below; broad release/security acceptance remains pending.

The October 11 opening deep dive adds staging/disk admission, exact reads, bounded native queuing, source-scoped cancellation, broker ACL concurrency and renderer ownership/failure fixes. See [LARGE-PDF-OPENING-DEEP-DIVE-2026-10-11.md](LARGE-PDF-OPENING-DEEP-DIVE-2026-10-11.md) for the full path, concrete findings and unresolved parser/startup/performance limits. Actual large-drawing and Windows isolation acceptance remain pending.

The later October 10 disk-backed fallback supersedes the full-buffer-only opening limits. See [DISK-BACKED-PDF-CODING-2026-10-10.md](DISK-BACKED-PDF-CODING-2026-10-10.md) for implemented routing, supported subsets and pending fidelity/performance acceptance.

The October 10 loading pass supersedes the queue and fixed-64-MiB details below. See [LARGE-PDF-LOADING-CODING-2026-10-10.md](LARGE-PDF-LOADING-CODING-2026-10-10.md) for the current coded behavior, compilation checkpoint and pending real-file verification. The historical description below is retained as implementation history.

The renderer accepts a native-held immutable source descriptor (`id`, `size`,
`largeFile`, `rangeSource.length`, `rangeSource.chunkSize: 262144`) without whole
file bytes. `createPdfSource` preserves the existing in-memory data path for
ordinary files and provides a `PDFDataRangeTransport` for range sources.

Installed PDF.js 6.3.289 source was inspected in `build/pdf.mjs`:
`PDFDataTransportStream` matches a response by the original requested beginning,
and its range reader completes after one delivered buffer. Native reads are
therefore split into at most 1 MiB chunks, then assembled into the requested
range before a single `onDataRange(begin, bytes)` call. There are at most four
active native reads and one assembly up to 64 MiB. The October 7 queue repair
replaces the old 64-request cap with source-derived metadata backpressure:
at most one pending record per 256 KiB source chunk (4096 for 1 GiB). Nearby
small requests share a read up to 1 MiB, with one exact response per reader.
See [PDF-RANGE-QUEUE-PROGRESS.md](PDF-RANGE-QUEUE-PROGRESS.md).
Whole-file requests and oversized single ranges fail with a visible reason.
Automatic fetch and streaming are disabled, with 256 KiB PDF.js range chunks.

Abort invalidates the transport generation and clears the queue. An in-flight
native read can finish, but its late response is ignored and no further chunk
is scheduled. Range failures destroy the loading task, cancel reader renders,
disable controls and announce the error. Large documents refuse `getData()`.

Whole-source editing/inventory tools are disabled with a clear 100 MiB tool
limit explanation. The native review-comments panel is not mounted. Page
navigation, saved positions/pages, search, selectable/readable text, page notes,
fullscreen, details, annotation summary and bounded print previews remain.
The existing 500-page, canvas-pixel and multipage limits remain in place.

Large-file thumbnails do not start while their navigation panel is hidden.
Outside active reader/thumbnail renders, multipage view or print workspaces,
older page display resources are cleaned up, retaining current/neighbor and
recent pages (approximately eight). PDF.js retains page proxies and worker
caches, and its worker `ChunkedStream` reserves a byte buffer for the source
length. On-demand I/O reduces eager copies/reads but total memory is not constant;
large or complex drawing performance has not been verified.

Validation in this change is limited to source inspection. No app, runtime,
tests or build were launched. Desktop behavior and physical printing require
separate verification.
