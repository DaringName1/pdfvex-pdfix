# Large-PDF opening: source deep dive, October 11, 2026

Scope: file selection, immutable staging, RAM routing, contained engine startup, page preparation, range transport, renderer ownership, cancellation and cleanup. This checkpoint records source findings and changes. JavaScript syntax checks and production compilation are the verification for this pass. No PDF, UI, native-engine, memory, performance or isolation acceptance tests were run.

User correction after this checkpoint: the target is the **FAA SW3 approach-chart PDF**. A matching local file was located at `C:\Users\andre\Downloads\SW3.pdf for cal where i live.pdf`; only filename/size metadata was inspected. Prior references to the user's drawing refer to this chart target for upcoming acceptance. Its contents and failing-page behavior have not been examined. Targeted fidelity checks must cover small chart text, symbols, fine lines, orientation and page order/navigation; existing drawing-comment plans remain separate feature work.

## Later implementation and executed verification

The follow-up fixed contained startup and added a persistent qpdf C-API source session. The actual SW3 file now opens; sampled artwork/text, cancellation/reopen, 65-page memory/recycling and cleanup checks passed. See [SW3-PERSISTENT-READER-VERIFICATION-2026-10-11.md](SW3-PERSISTENT-READER-VERIFICATION-2026-10-11.md). The findings below describe the earlier implementation and unresolved state at that checkpoint; they are retained as history. Broad corpus and security acceptance remain pending.

## Main finding

The page-at-a-time route avoids PDF.js allocating a buffer for the entire original PDF. It does **not** make opening or navigation independent of file complexity. Opening first copies/hashes the original, then copies/hashes it again into the isolated parser folder. Each qpdf invocation starts a fresh process and reads the original staged document. A huge object graph or one complex page can still exceed the parser or renderer budgets.

The reported Windows loader `0xc0000142` remains an unresolved runtime result. It says initialization failed; it does not identify the failing DLL. The preceding private-desktop/environment/library-search repair is compiled, but the actual failing drawing has not been reopened during this pass. The new cross-process ACL transaction below fixes a source-level concurrency problem in that repair. It is not evidence that the loader now succeeds.

## Opening path

1. `desktop/file-store.cjs` accepts a user-selected regular file, checks its type and tracks its source identity. PDFs above the ordinary 100 MiB tool/input limit enter `LargePdfStore`; ordinary PDFs can also switch to paged viewing when their page count exceeds 500.
2. `desktop/large-pdf-store.cjs` reads the original in 256 KiB chunks into an exclusively created snapshot while calculating SHA-256. Size, file identity, modification time and change time must remain consistent. Only an opaque session ID, size and reading metadata reach the renderer.
3. The initial full-viewer admission estimate is `3 × source bytes + 908 MiB`. Above 1 GiB or below that available-RAM estimate, opening chooses disk-backed page preparation. A fresh available-RAM check in `src/pdf-reader.js` now also handles RAM falling during the initial snapshot.
4. For paged viewing, `desktop/paged-pdf-service.cjs` makes a separate, hash-checked parser input copy. It verifies encryption status and page count using the contained native engine. It refuses encrypted or permission-controlled sources in this route.
5. `desktop/native-sandbox.cjs` verifies the packaged broker and private qpdf runtime, prepares a per-session AppContainer and starts the fixed `--paged` broker route. It never retries outside containment.
6. The native command extracts only the requested physical page to `output.pdf`. The parent verifies size, file identity and digest; the renderer verifies source identity, requested page, page count, typed-byte contract and output digest.
7. `src/paged-pdf-document.js` gives PDF.js the extracted page rather than the original. Old workers are released when page cleanup succeeds; the adapter refuses accumulating more workers while prior pages remain in use.
8. `src/pdf-reader.js` renders within preview limits. Selection, readable text and notes are separate from successful artwork. Paged mode disables unsupported document-wide operations.

## Problems fixed in this pass

| Finding | Implemented change |
| --- | --- |
| Initial disk admission counted only the first copy for paged opening. | It now budgets two source-sized copies plus 64 MiB headroom. The isolated-copy destination separately checks its own volume; actual ENOSPC/EDQUOT failures have specific explanations. |
| Large snapshot copying had no overall time budget. | A cooperative 30-minute deadline and source-generation checks now run throughout partial reads/writes and after final synchronization. |
| Ordinary file reads could accept truncated or changed contents. | They now require the exact initial length and unchanged size/device/inode/mtime/ctime, with generation checks during reading. |
| Native page requests could accumulate without explicit admission limits. | The service bounds outstanding page requests to three per source and sixteen globally, validates page numbers before queuing, and returns a clear busy reason. |
| Canceling one source waited for unrelated work on the global queue. | Cancellation waits for that command's completion, bounded to six seconds, and reports unconfirmed termination rather than claiming success. Uncertain staging is retained. |
| Canceled/superseded requests could still start after DLL preparation. | Generation checks now propagate through runtime verification/preparation and run before native launch; a cancellation arriving across the spawn boundary immediately stops the observed child. |
| Different native brokers could overwrite each other's window-station ACL changes. | Grant/removal now share a per-user, per-Windows-session named mutex around their read/modify/write transaction. Only the exact per-job permission entry is removed. |
| Superseded renders/opening operations could overwrite current status or retain workers. | Request versions and document ownership now guard asynchronous results; pending PDF.js loads and native preparation are invalidated during disposal. |
| A failed later page could leave stale artwork labeled as rendered. | Page loading clears stale paper/text identity; a failure hides it, releases the canvas and shows the failed physical page and reason. Navigation remains available in paged mode. |
| Text extraction or selection-layer failure could discard successful artwork. | Successful drawing output survives; failed text controls show explicit unavailable status. Completed artwork becomes visible before optional text preparation finishes. |
| Long, narrow pages and pixel rounding could exceed preview bounds. | Finite positive dimensions, a 16,384-pixel axis ceiling and rounding-safe output sizing are enforced. The existing 16-million-pixel embedded-image cap remains; decoding canvas resizing is bounded to 64 MB. |
| Renderer preparation copied already typed extracted page bytes again. | The 32 MiB Uint8Array contract is validated and the existing bytes are used directly, retaining integrity checks. IPC and PDF.js may still make their own copies. |
| Capacity and scan messages implied capabilities unavailable in paged mode. | Full-viewer RAM guidance now distinguishes its estimate from a maximum file size; scan recognition and document-wide tool messages reflect the active reading mode. |

## Current boundaries

| Area | Current coded boundary / practical consequence |
| --- | --- |
| Original source length | Disk-backed admission accepts positive safe-integer lengths; available disk, filesystem limits, staging and parser budgets still apply. This is not unlimited successful opening. |
| Temporary disk | Approximately two original-sized copies for paged viewing, plus runtime/output/headroom. Multiple retained documents consume additional space. |
| Staging | Each large copy has a cooperative 30-minute budget. Checks cannot interrupt a Windows filesystem call that itself is blocked. Cloud/network/slow disks can delay the first page. |
| Native parsing | 512 MiB process memory, 115-second broker execution budget, one contained process. The parent also observes termination with a longer watchdog. |
| Prepared page | At most 32 MiB encoded output. A compressed page can decode to substantially more memory than its encoded size. |
| Preview | Mode-dependent 4/8/16-million-pixel preview budgets, axis bounds, plus the separate embedded-image cap. More RAM does not guarantee a faithful render of every PDF. |
| Range/full viewer | At most 1 GiB source, adaptive 64/128/256 MiB assembly and bounded IPC/cache. PDF.js still reserves a full-source byte array. Range failures do not currently reopen automatically in paged mode. |
| Paged features | Physical page navigation, available text/selection, local page notes and reader view controls. Full search, printing, document-wide editing/export, outlines/labels, source destinations and optional-content controls are unavailable or limited. |
| Drawing comments | Extracted appearances may render, but this is not acceptance of Bluebeam comment inventory, layers, uncommon marks, fonts, rotations or drawing fidelity. Document-wide review tools still need a large-source route. |
| Windows startup | Strict runtime hashes/search paths, private hidden desktop and exact SID checks remain. The reported DLL initialization failure still needs runtime diagnosis/confirmation. |

## Remaining engineering gaps, in priority order

1. **Confirm contained startup on the failing drawing and Windows machine.** The next diagnostic must identify whether USER32/private-desktop initialization, another DLL, protection policy or a different startup dependency is failing. Retain exact loader/stage codes. No unrestricted fallback, blanket ACL grant or security exclusion is an acceptable repair.
2. **Avoid parsing the whole file for every navigation.** A persistent contained parser session with a bounded request protocol, one active page preparation, recoverable process restart and measured object-cache budget is the main architectural improvement. It needs a suitable engine/API implementation; keeping the current DLL folder alive does not keep qpdf's parsed document alive.
3. **Reduce first-page delay safely.** Evaluate an immutable source capability that avoids a second physical copy where containment and source identity permit it. Do not replace the copies with a mutable original path or an unverified hard link. Show staging/parser progress and cancellation clearly.
4. **Bound decoded page work more completely.** Text item counts, operator-list size, pathological vectors, fonts, annotation expansion and decompression can exceed useful renderer budgets despite small encoded pages. Optional text preparation now leaves artwork visible, but it still needs a bounded streaming extraction route. Worker memory and graphics allocations need actual measurement.
5. **Add a bounded prepared-page cache and large-document feature routes.** Cache admission/eviction must account for encoded bytes, worker usage and source identity. Large-source comments, search and output operations require separate contained support, not enabling small-file controls against partial extracted PDFs.
6. **Prove fidelity, responsiveness and cleanup.** Opening the actual authorized drawing, page comparisons, RAM/process measurements, navigation/cancel/reopen, malformed-input cases, Windows ACL/network/process/parent-death isolation and independent security review remain acceptance work. Compilation does not prove these properties.

## Source and compilation checkpoint

Modified code: `desktop/large-pdf-store.cjs`, `desktop/file-store.cjs`, `desktop/paged-pdf-service.cjs`, `desktop/native-sandbox.cjs`, `desktop/native/SandboxLauncher.cs`, `scripts/build-native-sandbox.mjs`, `src/pdf-reader.js`, `src/paged-pdf-document.js`, `src/pdf-source.js`, `src/reading-capacity.js`.

Nine JavaScript files passed `node --check`. The reviewed C# source pin is `3ae1f9379b7daf0a99269553f0304d1837f8b1ee487a0b8436ed347894e97e42`. Production build hashes/results are saved in `PDFIX-STATUS-INVENTORY-2026-10-04.json` after compilation. All changes remain coded with runtime acceptance pending.

Production compilation completed with exit code 0, 328 renderer modules and bundle `index-DQykMknb.js`. Build source snapshot: `160a8195606c4dd138434daa6d7e3e96c69c807aa94f3a8ce215fd85f88ae23f`. Compiled sandbox SHA-256: `923d8cb2cae4599eccf1b9807a07a05edfe2ba6026915dd3a39b400a8f6ea8f4`. PDFix was gracefully restarted to load these changes; its desktop window was observed under process 171108. This startup observation is not a PDF-opening or native parser acceptance test.
