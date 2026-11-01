# SW3 continuous scrolling repair — October 11, 2026

The paged large-file reader previously forced Page view. It now defaults to Continuous scroll for sources up to 10,000 physical pages. Larger sets retain Page view. Ordinary fully loaded sources retain their existing 500-page continuous-view bound.

Only two nearby page canvases are retained for paged sources, with the existing canvas pixel budget and serial native preparation. Distant native preparation is canceled when scrolling moves away; changing view cancels preparation before releasing canvases. Text caching keeps nearby rendered pages instead of clearing the selected page when its neighbor loads. Thumbnails remain deferred.

An additional existing interaction was found during the focused hidden check: the measurement tool's observer closes measurements when the main paper is hidden. The measurement toggle wrapper forced Page view even when closing the tool, immediately undoing continuous view. Closing now stays in the current view; opening measurements still switches to Page view.

## Actual-file verification

`scripts/verify-sw3-scrolling.mjs` ran in a hidden Electron window against the actual 160,236,608-byte, 700-page FAA SW3 file on this Windows machine. Final run passed:

- Continuous view selected automatically, with 700 lightweight page slots.
- Mouse wheel forward/back through pages 1/2 and 350/351.
- Direct navigation to pages 350 and 700.
- Page 350 retained 2,682 selectable text-layer characters; saved canvas visually reviewed.
- At the recorded page-350 sample: one live canvas, 919,512 pixels; configured maximum two canvases / 32 million pixels, further limited by hardware settings.
- Switch to Page view and back to Continuous scroll on page 700.
- Return Home, no renderer page errors, window remained hidden.

Evidence: `tmp/sw3-scrolling-a72ccd24-3c6e-4c98-ab69-b8194bdb8826/report.json` and `chart-350.png`. This checks selected navigation paths, not all 700 pages or total application memory. No broad test suite was run. Existing native isolation, original-file preservation and single-page extraction are unchanged. Rapid-scroll extremes, broader document corpus and security/release acceptance remain separate work.

## Saved build and desktop update

Production build succeeded, 328 modules, renderer `index-BdmJ-HVp.js`, CSS `index-C7ZkSOlK.css`.

- Source snapshot: `498de4e0673021f341f3290b8e89b3bd83ddb81b9ae5f911a09783355be04bed`.
- Broker executable: `aa613d6e8191746058d7a144db614375d5a556d911edf9dce47a881fee61e58f`.
- Paged helper executable: `991a5b18ef4b01af22ebb09f1e252ee8ad12eafccc8539590a0083c2ef789fd1`.

Visible PDFix was gracefully restarted from the current project build, process 257388. SW3 was queued through the Windows open request. The desktop shortcut already targets this build. Launch evidence: `tmp/sw3-scrolling-desktop-launch.json`.
