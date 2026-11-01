# PDFix: SW3 persistent reader implementation and verification

The user's actual FAA SW3 PDF now opens through the Windows AppContainer page reader. Targeted checks passed for source integrity, selected artwork/text, navigation, cancellation/recovery, reopening, bounded cache, parser recycling and cleanup. This supersedes the earlier unresolved startup/per-page parsing findings in the [opening deep dive](LARGE-PDF-OPENING-DEEP-DIVE-2026-10-11.md). Broad release/security acceptance remains pending.

## Exact target

- File: `C:\Users\andre\Downloads\SW3.pdf for cal where i live.pdf`
- Size: 160,236,608 bytes (152.81 MiB); 700 pages.
- Original SHA-256 before/after: `13ae0033371cea8d43cc1fb819b7ef9cb848fd5774b761fc43b555aa60cb87c5`.
- This is the FAA SW3 approach-chart volume, not the earlier private drawing sample or a Bluebeam drawing.

## Implemented changes

1. **Contained startup repair.** A child loader trace isolated the earlier `0xc0000142` to KERNELBASE initialization, before the qpdf DLL loaded. Starting console engines with `DETACHED_PROCESS` and redirected pipes resolved it on this computer. AppContainer, exact SID/no-capability checks before resume, one-process Job, restricted child creation, pinned runtime/search paths and private desktop remain. Experimental station widening and loader-trace/debug-memory code were removed from the production broker.
2. **Persistent native parser.** `PagedSessionEngine.cs` uses qpdf's C API to retain one parsed source and prepare independent page PDFs. It runs only inside the broker's AppContainer and Job. OPEN/PAGE/CLOSE has bounded ASCII framing, exact request tokens and page checks, one active command, per-command deadline, idle expiry, bounded diagnostics and observed termination.
3. **Bounded lifecycle.** Prepared pages are capped at 32 MiB; cache at 48 MiB globally and four encoded pages per source. Returned bytes are independent copies. The helper has a 512 MiB Job limit and a lower soft guard. The service recycles after 64 prepared pages or reported private memory over 384 MiB. Cancellation stops the contained process; later requests reparse in a fresh contained session. The pinned output slot is safely truncated after distinct input/output identities are verified on restart.
4. **Path and identity fixes.** The broker validates ancestors; the child checks its permitted staged tree and pinned canonical file identities. It no longer queries denied ancestors outside that tree. Hardlinks, reparse points and nonregular files remain rejected. Windows/Google Drive change-time-only updates no longer falsely invalidate an otherwise immutable, identity/content/mtime-checked snapshot ownership marker.
5. **Earlier low-memory routing.** PDFs above 100 MiB use page preparation when the capacity profile is conservative, before the full-source admission threshold fails. Existing two-copy disk admission, chunked source hashing/staging and original-file identity checks remain.
6. **Build/package integration.** The new helper is compiled with an explicit source hash, bundled with its manifest, pinned when staged, and verified by the Windows package builder. No unrestricted native fallback was added.

## Executed checks

| Check | Result |
| --- | --- |
| Native opening | 700 pages; initial snapshot 559 ms, contained parser preparation 1,745 ms in the cancellation/reopen run. |
| Uncached page preparation | Pages 1 / 350 / 700: 129 / 143 / 121 ms; same helper PID and one parser start. This excludes PDF.js display/render time. |
| Cache revisit | Page 1: 1 ms; original cached hash survived zeroing the separately returned bytes. |
| Cancellation | Active request returned `CANCELED`; another uncached page succeeded with a new helper PID and parserStarts=2. |
| Close/reopen | Fresh contained source session and page 1 succeeded. Generated preview document IDs can differ across parser lifetimes; cross-session byte equality is not a fidelity requirement. |
| Memory/recycling | 65 distributed SW3 pages prepared; peak reported parser private memory 33 MiB, cache 762,684 bytes at end; automatic restart observed for page 65. This is parser private memory, not total application RAM. |
| Original integrity | Original SHA-256 and size/identity/timestamps unchanged after source-service checks. |
| Artwork fidelity | Original versus extracted pages 1, 350 and 700 rendered by independent Poppler at 144 DPI: pixel-exact for all three. Page 350 is the LAX RNAV (RNP) Z RWY 25L chart; visually inspected fine text, symbols and lines. |
| Desktop viewer | Final hidden Electron run: page 1 ready in 4,935 ms including staging/render/text; page 350 in 923 ms; page 700 in 906 ms; revisit page 1 in 874 ms. These are one-machine samples, not universal timing promises. |
| Selectable text | Desktop text-layer characters: 648 / 2,682 / 687 for pages 1 / 350 / 700; no missing-text warning visible. Original/extracted text availability was also checked independently. |
| Desktop lifecycle | Window remained hidden; zero renderer page errors; navigation returned to Home successfully. |
| Cleanup | Source/session cleanup observed after cancellation, reopen and 65-page run. Earlier verification snapshot folders cleaned through verified ownership markers; 20 folders checked, no cleanup warnings. |

## Saved evidence

- `tmp/sw3-cancellation-reopen-ab695290-b04c-471d-871b-38c19e959ef0/report.json`
- Same folder: `visual-report.json`, original/extracted page PNGs and preview PDFs.
- `tmp/sw3-recycle-report.json`
- `tmp/sw3-desktop-55249f7a-c206-43ed-9152-62969f7b1ac1/report.json` and complete canvas PNGs.
- `tmp/sw3-snapshot-cleanup-report.json`

Test staging used a dedicated Windows temporary directory. Google Drive creates upload hardlinks in the project tree; early project-tree staging therefore correctly failed the helper's hardlink check. Production app-data staging is outside that synced project tree. Do not remove hardlink protection to accommodate a synced scratch folder.

## Build checkpoint and remaining limits

Production build completed with exit 0, 328 modules, renderer `index-DQykMknb.js`. Final source snapshot: `f76d7b06564a325106bcecc6adbd0f5c401edfe8a2898f0f8da30d3afd469369`.

- Broker executable SHA-256: `045067ca5cdb8de9fc4bce5ca2e18aba3294b23370159fb53850d6841c1f3032`.
- Broker source SHA-256: `61bd92189e91fff8a7844f8d6edc29bc0ec7dacb77a381ffa233cfb90cfcd95c`.
- Persistent helper executable SHA-256: `2e6bf3c42eae3fde431b323f2108c8c290924263a262f041f79a896a25d43388`.
- Persistent helper source SHA-256: `bc749fc5f00c3c755063caab11a70d963ebb5e0d99bf09f01572c68cee405b13`.

Verified scope is this exact SW3 file on this Windows machine, including the sampled pages above. This does not verify every PDF, every page, another Windows machine or a security release. Very complex pages can still exceed memory/output/time/canvas bounds. Opening still makes two source-sized immutable disk copies; restart after cancellation/recycling still reparses once. Full-document search/printing/editing/export, encrypted paged sources, original document destinations/outlines/layers, malformed-file corpus, renderer total-memory/performance measurements, actual low-memory extremes and independent isolation/security acceptance remain separate work. No broad test suite was run.

Desktop update: PDFix was launched from the current development build and its visible workspace window was observed under process 254768. The exact SW3 file was passed as a Windows open request, ready for the app's Review & open action. The desktop shortcut still targets this project build with the supplied PDFix icon.
