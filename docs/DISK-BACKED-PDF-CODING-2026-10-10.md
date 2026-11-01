# Disk-backed page-at-a-time PDF opening

October 10, 2026. User authorized implementation after the large drawing was still refused by the full-document memory estimate. This is actual integrated code, not a planned-only entry. It is not evidence that the user's drawing opens correctly or that arbitrary PDFs have no lag.

## Opening and rendering changes

- An immutable large-PDF disk snapshot can be created without the previous 1 GiB input refusal or full-document RAM refusal. File length must be a supported positive safe integer and the filesystem must have room for the snapshot. The existing read-only fingerprint and source-change checks remain.
- When the full viewer's estimate is above available memory, or a source exceeds its 1 GiB buffer budget, opening selects a disk-backed paged descriptor instead of sending the full source length to PDF.js. Ordinary ranged reading remains available when admitted within its budgets.
- A PDF with more than 500 physical pages can switch to paged reading, including a bounded in-memory original. Personal positions/bookmarks can refer to these larger physical page numbers; their count and title length remain bounded.
- A private main-process capability streams the immutable snapshot into an isolated persistent input slot using a 256 KiB buffer. The isolated copy is reused for subsequent page requests. This initially uses two temporary disk copies for large sources; preparing them and checking their fingerprints requires sequential I/O proportional to file size.
- A distinct pinned Windows AppContainer broker profile admits disk-backed input without the old 100 MiB native-input bound. Existing native and document profiles retain their previous limits. The new profile only grants reading of input/runtime and writing of one output slot; parent tracking, observed broker exit, process/memory/time restrictions and file watchdogs remain.
- The contained qpdf engine checks encryption status and page count, then creates a private one-page working PDF on demand. Renderer workers receive only that small PDF and validate its source identity and SHA-256. The original file is not rewritten or saved.
- The frontend serializes page work, deduplicates requests, cancels superseded work and keeps at most two page workers. Preview pixels are reduced. Physical page number/Previous/Next, text selection, readable text, local notes, bookmarks and fullscreen remain available.
- Loading status and a Cancel loading control are available. A first-page failure keeps the document's physical navigation available so a different page can be attempted. Native sessions are released when their source is released, the renderer ends or the app exits. Recognized interrupted native staging has a bounded cleanup pass; unknown folders are left untouched.

## Boundaries still requiring work

- “Any size” means input size alone no longer triggers the previous fixed large-file rejection in the disk-backed fallback. It is not a guarantee to open every PDF on every computer. Disk space, safe filesystem lengths, staging time, PDF structure and native/parser/rendering resources still apply.
- Native parsing remains limited to 512 MiB and a 115-second watchdog per command. Each extracted working page is at most 32 MiB. A complex page or huge object graph can exceed these limits even with a small input. Such failure is reported rather than running an unrestricted parser.
- Encrypted/permission-controlled files are refused in paged mode pending an owner-authorized password/permission-preserving implementation. Regular supported password opening remains on the ordinary viewer path.
- This mode does not yet support whole-document editing/export, printing, document-wide search/text tools, continuous/facing view, background thumbnails, original outline/page labels, original link destinations, layer controls, signature validation or document-wide review panels. Controls are disabled with scope explanations; working-page metadata/signatures must not be presented as the original document's evidence.
- qpdf page copying is intended to retain page content/resources and geometry, but blueprint accuracy, annotations, optional content defaults, transparency, fonts, cropped/rotated sheets, huge raster pages and accessibility behavior remain unverified. Existing viewer image-size limits can affect difficult raster pages and require later fidelity work.
- Native parsing repeats per requested page and can have substantial latency. A persistent parser, bounded extracted-page cache or carefully bounded nearby-page prefetch are possible later improvements after measuring the actual drawing; they were not implemented here.
- No PDF/runtime/UI/device/performance tests or new fixtures were executed. Only source syntax and compilation checks were performed. The user's approximately 156,000 KB engineering file is the first required runtime acceptance case; record first useful page, navigation, cancellation, source integrity, geometry and peak memory before calling the blocker resolved.

Compilation evidence is recorded below and in the status inventory after the final build completes.

## Compilation evidence

Eleven changed JavaScript/CJS/MJS files passed source syntax checks. The native broker compiled with its explicit source pin. Final `npm run build` exited 0, with 328 modules; renderer `index-DWg8N_Uh.js`, CSS `index-C7ZkSOlK.css`. Existing bundle-size warning remains. Build source SHA-256: `5ec1c6883ef24edf3062cab589b994e60ef0e9b4f094fd7499262f24477ee3fc`. Native broker SHA-256: `15c7f6b05f23f2fec00e322132b872d99aad6778214378aebd45c5a51cae1eab`; source SHA-256: `b60859854068bad923c3683f8cf0e8de3817ca8ea36f7fdd2f22686e3d88908e`. No runtime acceptance was executed.
