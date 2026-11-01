# Local reader speed matrix

Run `node scripts/agent-run.mjs codex -- node scripts/check-reader-speed-matrix.mjs` on the main PC. The generated sources, profile and receipt remain in a new local temporary folder, outside Google Drive. It uses the built app under the shared lock, preserves input hashes, records owned-process memory and closes the session/descendants. It does not run on GitHub or the reserved spare PC.

The corpus contains:

- 1,000 text/vector pages, with one known search word per page.
- Three 14,400 × 14,400-point pages (200 × 200 inches), with a border and selectable text.
- A 221,762,386-byte PDF containing four **referenced** 4,200 × 4,400 RGB images. Each full-page raster diagram uses 55,440,000 uncompressed image bytes. It also has generated selectable labels. This is a synthetic raster workload, not an actual scanned document, photo-rich drawing or OCR accuracy test. There is no unused/trailing padding. Separate pdf-lib readback confirms four pages and all four image dimensions/stream lengths.

Local regression limits are first page within 30 seconds, complete known-word search within 120 seconds, sampled distant-page jumps p95 within 3 seconds, renderer heartbeat extra delay p95 within 100 ms, and owned private memory within 2 GiB. The 30-second opening allowance covers contained reader startup; three-second jumps target useful navigation; 120 seconds gives a bounded expectation for a 1,000-page search rather than an unlimited wait. These are PC-specific limits, not an advertised minimum-hardware benchmark. Memory samples include native descendants at sampling time, not continuous peak tracking; working-set and private-memory measurements are distinct.

The runner records zoom and distant navigation with a renderer heartbeat. Those measurements **do not certify smooth wheel scrolling**, full frame-rate behavior, every page's artwork, a one-hour plateau or normal-GPU behavior in software test mode. These remain separate evidence gates. The 1,000-page source uses Page view because continuous view is currently capped at 500 pages.

The first attempt successfully searched 1,000 pages, but its check expected `1,000 pages` while the current app displays `1000 pages`; its timeout is a test assertion error, not an app-opening/search failure. The corrected count assertion passes in the completed matrix below; the earlier incomplete receipt is not a matrix pass.

## Completed local results — October 18

All three cases pass in the hidden built app with test software graphics. Speed receipt: local temporary `pdfix-reader-speed-slCpub/report.json`. No page errors, original hashes unchanged, clean app exit, no forced or surviving owned descendants.

| Corpus | First page | Whole search | Jump p95 | Heartbeat extra p95 | Sampled private memory |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1,000 text/vector pages | 2,231 ms | 84,514 ms | 221 ms | 8.2 ms | 568.0 MiB |
| 200-inch pages | 233 ms | 54 ms | 47 ms | 9.7 ms | 483.1 MiB |
| 211.5 MiB raster PDF | 864 ms | 226 ms | 218 ms | 9.3 ms | 859.4 MiB |

A separate `scripts/check-reader-scroll-latency.mjs` run uses those same generated PDFs under agent-run, with a new temporary profile. It measures actual alternating wheel panning after zoom in Page view: 40 wheel-to-scroll samples and more than 400 animation-frame intervals per case. All three pass: wheel response p95 18.1 / 18.2 / 17.6 ms; renderer frame-gap p95 16.7 / 16.8 / 16.7 ms; maximum sampled gap 16.8 ms. Limits are wheel p95 100 ms, frame-gap p95 50 ms, maximum gap 250 ms, at least 30 samples of each kind. These permit an occasional missed frame while rejecting sustained UI stalls. Receipt: local temporary `pdfix-reader-scroll-lwhxR9/report.json`. Source hashes unchanged, no page errors, app closed. These are hidden renderer scheduling/pan measurements, not physical-display compositor frame rates or a real-user hardware acceptance.

Nothing exceeded a configured limit, so no speculative production performance change was made. The long-session gate and real scanned/photographic corpus remain open.
