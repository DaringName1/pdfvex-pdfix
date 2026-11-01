# Large PDF opening — October 7, 2026

The old 100 MiB ceiling is separated into a normal whole-file operation budget and a larger PDF reading route. A PDF such as the user's approximately 156,000 KB drawing can now enter the new reading route rather than being refused solely for exceeding 100 MiB. Its actual rendering and performance have not been tested.

## Saved implementation

- Native opening creates a private file-backed reading snapshot with sequential 256 KiB copy/hash buffers. The renderer receives an opaque source ID and size, not another full PDF byte array. Source identity remains bound to the copied bytes; the original is unchanged.
- The viewer requests PDF data as needed through authorized IPC. Native requests are at most 1 MiB; renderer range assembly is at most 64 MiB, with four reads in flight and a bounded request queue. Automatic fetching of the rest of the file is disabled.
- Existing visible-page canvas and multipage budgets remain. Older page display resources are cleaned up when no page/thumbnail/print rendering is active; approximately eight recent/current/neighbor pages are retained. Hidden thumbnail panels do not initiate large-file thumbnail work.
- Opening progress uses the existing announcement area, throttled in the UI. Large-file notices explain possible slower opening/scrolling. Specific failures explain memory, disk space, source changes, invalid content, page count or reader range limits.
- Closing/leaving a large document releases its snapshot. Renderer loss invalidates pending opens and clears sessions; shutdown disposes sessions. Owned marked leftover snapshots are addressed by native startup cleanup.
- Whole-source tools have an explicit capability boundary. Large PDFs currently support reading, navigation, selection/search, saved page positions, page notes, fullscreen and supported reader reports/print previews. Whole-source editing, native comment inventory/editing, organization, OCR, compression and source-copy export stay limited to 100 MiB. Restricted auxiliary source pickers keep their prior limits.

## Resource limits and honest performance scope

This is not unlimited-size support or a guarantee of smooth rendering. The current viewer admits up to 1 GiB per PDF and 500 pages, subject to available resources. Admission requires an estimated `3 × file size + 768 MiB` of available memory (including an operating-system reserve), and disk space for a reading snapshot plus 64 MiB headroom where free-space statistics are available. These are conservative estimates, not measurements of future rendering cost.

The installed PDF.js worker reserves a full-length byte array even when using ranges. On-demand reading avoids extra full-file copies and eager reads; total memory is not constant. Large images, complex vector artwork, fonts, malformed structures, unusually large individual ranges and full-document search/health work can still cost substantial time or memory. Such work must not be represented as tested simply because compilation succeeds.

Native details: [LARGE-PDF-NATIVE-PROGRESS.md](LARGE-PDF-NATIVE-PROGRESS.md). Reader details: [LARGE-PDF-READER-PROGRESS.md](LARGE-PDF-READER-PROGRESS.md).

## Verification

Source checks and final compilation are recorded after all source edits settle. Runtime testing, the user's actual large file, failure/cancellation timing, disk cleanup after crashes and performance acceptance remain deferred. The running desktop instance needs a restart to load the changed main process and renderer; it is not restarted automatically during coding.

### Compilation receipt

October 7: eight changed source files passed `node --check`; `npm run build` succeeded with 265 modules. Renderer `index-B7IfSm_E.js`, CSS `index-CDz2RNum.css`, contained engine SHA-256 `63189581f2bd6c67dee0c126c465cee9575ecf374e27b8e2a29d5af2dfb98030`, build source SHA-256 `80d5f1995800bc2af03605f25405849d6dab0f6e85fa715c946a301438929717`. The existing bundle-size warning remains. No app restart, actual PDF opening, rendering/performance measurement or runtime test was performed.

## October 7 source queue and computer capacity follow-up

[Source range queue repair](PDF-RANGE-QUEUE-PROGRESS.md) replaces the failing 64-request metadata cap with a source-derived queue budget and nearby-read coalescing. [Reading capacity](READING-CAPACITY-PROGRESS.md) adds local memory/processor/graphics estimates in Settings, shared memory admission and smaller preview/read workloads for lower-resource computers. Ten source syntax checks and compilation (266 modules) passed. Current app restart, the actual large drawing, runtime behavior and performance acceptance remain pending. Reading still has 1 GiB/500-page limits, 64 MiB individual range assembly and 100 MiB whole-file tool limits; no lag-free guarantee or broad feature completion is claimed.
