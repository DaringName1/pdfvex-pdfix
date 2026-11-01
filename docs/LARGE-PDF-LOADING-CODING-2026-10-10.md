# Large PDF loading coding checkpoint

October 10, 2026. The user authorized the large-file fix after initially deferring it. This pass implements loading improvements; it does not establish that the reported drawing file now opens or that responsiveness acceptance has passed. Subagents were used for the two initial code sections; subsequent integration was handled by the primary agent. Future delegation is reserved for large amounts of coding, per the user's latest instruction.

## Integrated changes

- Source transport queues distinct range requests separately from repeated reader responses. Consecutive identical requests are represented by a count while preserving PDF.js's complete-buffer, begin-ordered delivery contract. Small touching requests can share reads; bounded distinct queued metadata remains a resource limit.
- Recently read native pieces have an independently copied LRU cache of 2 or 8 MiB selected by the opening profile (4 MiB fallback), with a 32-entry cap. Each native IPC read remains at most 1 MiB. Yield points between reads and response deliveries let other renderer work run. Abort clears pending metadata and cached data; late native responses are ignored.
- A single complete source request can use a conservative 64, 128 or 256 MiB assembly budget selected from available memory after estimating document costs. A whole-source request is permitted within that budget. Requests exceeding it report requested and available sizes. This is bounded assembly, not unlimited file support.
- Capacity estimates include the minimum temporary assembly/copy/cache/read budget as well as the source estimate and OS reserve. Weaker computers use one native read slot and reduced preview pixels. Estimates are not guarantees of actual memory consumption or speed.
- Single-page rendering takes precedence over thumbnails. Thumbnail loading proceeds gradually and pauses during visible-page work, including continuous-view updates. Cache eviction is bounded even if many thumbnails fit in the navigation panel.
- Large-file readers have a Low-memory reading option under Tools & view. It reduces page-preview pixels, live continuous/facing pages and thumbnail cache size. It changes preview resource use without modifying source geometry or saving a file. Preview sharpness is lower; full source-buffer memory use still exists.
- First-page startup loads personal saved position/bookmarks without eagerly extracting the PDF outline or label table. Outline and sheet-label navigation load the relevant metadata when requested. Existing physical-page navigation stays available.
- Continuous/facing views include the pixel budget in their layout identity so low-memory changes rebuild existing canvases. Large files get a bounded 120-second page-operation timeout rather than the small-file 20-second timeout; cancellation remains available when the view changes.

## Current limits and pending work

- The reader still limits documents to 1 GiB and 500 physical pages. PDF.js still reserves a full-length source buffer and retains its own worker/parser caches. A difficult page can use substantially more memory than file size suggests.
- Whole-source editing/conversion/export operations still have the 100 MiB boundary. This pass does not implement streaming editing, signing or redaction of large PDFs.
- Runtime verification with the user's approximately 156,000 KB drawing and representative engineering PDFs is pending. Queue routing, cancellation, cache reuse, password handling, low-memory transitions, embedded labels, scrolling, zoom, peak memory and output invariants require executed evidence before acceptance.
- No runtime/UI/PDF/device/performance tests, fixtures or app restart were performed in this pass. The already-open app retains its loaded renderer; a later relaunch is needed to load this build.

Compilation evidence is recorded after the build completes in the status inventory. Source syntax and compilation cannot certify the large-file problem as resolved.

## Compilation evidence

- Nine changed JavaScript/CJS sources passed `node --check`.
- `npm run build` exited 0; 326 renderer modules transformed.
- Renderer: `index-CBVAtc3z.js`; stylesheet: `index-DpZDfaIe.css`.
- Build source SHA-256: `1b4decf5dce4b13f9baec4d16735eb3eefca5c62a1fe4d7df42edb608396f59a`.
- Existing large-bundle warning remains. No runtime acceptance was performed.
