# Reader, Drawing and Pages UI debug pass — October 15, 2026

Scope: debug the current interface before human testing. No redesign, new workspaces, Bluebeam expansion or Add-ons. This record distinguishes sampled UI acceptance from broader functionality, human/device and release acceptance.

## Fixed and verified

- **9c87192:** Escape now dismisses Tools & view when its summary/buttons have focus; normal controls retain keyboard behavior. Six PDF/measurement dialog close icons gained matching tooltips. Four keyboard source checks and the four size/text configurations verify the menu closes and summary focus returns.
- **e35b58f:** closing a PDF dialog whose original workspace card no longer exists returns focus to visible PDF artwork (or its live opener/workspace tab). Sheet-label Close/Escape returns to Tools & view; a successful jump focuses artwork. The full matrix records 52 native dismissals without BODY focus, four label-dismissal returns, and 336 sampled Tab stops with visible outlines.
- **672a273:** readable page-box fallback colors, navigation labels that wrap at 150%, glyph-control tooltips, wider intended sheet-set preview, one-column tool groups at 150%, view-history buttons that fit their grid row, an embedded menu anchored inside its preview, crop settings that wrap without sideways scrolling, and a plain-language custom-page-label refusal. The last overflow was traced to Zoom to region inside the nested view-history group, not missing artwork or file corruption.

## Evidence

The complete four-configuration run is `tmp/reader-ui-9RzBHQ/report.json`: **213 screenshots**, all visually reviewed in 18 indexed contact sheets, plus full-size defect close-ups. Window sizes 800x620 / 1366x820, each with actual Settings text 100% / 150%. Generated disposable three-page PDF includes selectable text, page labels, an outline, a standard source note and thin strokes. The check exercises all 16 Drawing/Pages tool entry points, the reader's four existing view modes, Find/F3, navigation panes, label search, print preparation and actual prepared sheets, expanded settings and lower dialog controls. It records names, overflow/overlap, errors, sampled keyboard focus, closes and transitions. It preserves its original input and closes its own app.

That matrix is **red**, with two observations of the same remaining sheet-set view-history overflow. It has **zero page/console errors and zero departure failures**. We do not change a failing receipt into a pass; a separate focused post-fix receipt will establish the correction. Earlier interrupted/checker-development reports remain diagnostics: batch tools do not require an underlying reader, hidden/clipped controls are not overlapping controls, and clicking Close while Escape is already removing a dialog was a checker race. Native pending work is allowed to settle. No app overlays were removed by test code.

Final focused regressions: **passed within sampled scope**. Sheet sets: `tmp/reader-ui-qoAwm2/report.json`, 12 screenshots across all four configurations, zero errors/geometry findings/departure failures. Crop/resize, custom paper, all four split modes, safe custom-label refusal and organizing sections: `tmp/reader-ui-fHCheR/report.json`, 40 screenshots, zero errors/geometry findings/failures. All screenshots personally inspected, with the narrow enlarged-text crop inspected full-size. Source preflight checks seven owned files against the build snapshot.

Additional child-dialog receipts: `tmp/reader-ui-zZVDy4` (112 screens) and `tmp/reader-ui-lB0DkP` (96) cover source comment selection, plain comment editing, text/CSV/JSON export review, XFDF entry dialogs, print four-up/booklet options, page notes and empty link review. Their successful UI states are separate from their red aggregates: obsolete crop accessible-name selector, an incorrect test expectation that a custom-labelled PDF supports preserving reorder, and then-fixed embedded menu clipping. `tmp/reader-ui-jjAhRM` passes 40 states for the refusal wording but predates final crop CSS; it does not prove that CSS fix. Final fresh-source fHCheR supersedes its crop caveat. All these screenshots were personally inspected. Detailed per-screen statuses are in the reader handoff.

No all-state coverage claim: markup subtypes, rare/source-dependent errors and every possible disabled prerequisite need appropriate data/state fixtures. Hidden UI sampling is narrower than visible Windows/human and full assistive-technology acceptance.

## Connected real-app workflow

`scripts/check-reader-connected.mjs` passes, first report `tmp/reader-connected-J3ACzE/report.json`, final repeat `tmp/reader-connected-kXT8Zg/report.json`:

1. Open generated three-page PDF in the actual built reader.
2. Add a note in markup, preview the real output and save a new annotated PDF.
3. Reopen it, enter Organize pages and explicitly select the preserving reorder mode. The regular page-copy route discloses annotation removal and is not used for a preservation claim.
4. Reverse all three original pages, review all three output mappings/pages, save a preserving copy and close both dialogs.
5. Independently inspect disk objects with pdf-lib, then reopen the actual saved copy in PDFix. Verify source page 3 is first and source page 1 is last; the note remains on output page 3. Original and intermediate annotated copies remain byte-identical.

A separate Python/pypdf readback confirms the three pages, exact reversed text order and retained note contents. Both screenshots in each workflow run were visually inspected. Final source snapshot: 4c3b0af25e412256fb67657389037778ec7e625f2fefc45bdbf95f570ccc10f9. This is actual built hidden Electron + independent file parsing; no outside desktop PDF editor or physical printer was used.

## A-R4 graphics evidence — still open

New native-process report: `C:/Users/andre/AppData/Local/Temp/pdfix-startup-native-zy0eXU/report.json`. Minimal software control paints/responds; minimal default-graphics hidden-window capture fails with **UnknownVizError**; unchanged hidden built PDFix paints/responds. All three owned processes close with exit 0. The aggregate diagnostic remains failed because the graphics control failed. The full actual reader/tool UI runs succeed serially, but this does not prove visible/default-graphics startup reliability or identify the Windows/driver/Electron cause.

Read-only machine capture: `tmp/reader-ui-closeout-qtnv8d/machine.json`: Windows 11 Pro build 26200; NVIDIA GeForce RTX 5070 Ti driver 32.0.16.1656; OS-reported device status OK/error code 0; Intel Core i7-14700K. An OK device status does not prove a healthy graphics capture path. No production GPU/security settings or driver changes were made. Software mode is a minimal test control, not a proposed production bypass.

## A-R2 memory follow-up — still open

Actual supplied 163-page PDF, copied to temporary storage: five reader lifecycles with 15-second active holds each, distant page jumps every roughly five seconds and final live-shape/prototype heap analysis. Report `C:/Users/andre/AppData/Local/Temp/pdfix-reader-closeout-8fBATf/report.json`: **2 checks pass**, 84,066 ms, original unchanged, exit 0, no retained reader classes. Live positive controls identify Reader/Search/Readable/MultiPage once each and TextLayer three times. Renderer heap 3.2 to 4.8 MiB; Home DOM 331 initially then stable 341. Fifteen hold-period jumps measure 48–176 ms.

Summed **Electron-process** private memory at Home: 215.9 baseline, then 381.0 / 410.0 / 393.4 / 400.9 / 387.5 MiB. These samples cover Electron main/GPU/utility/renderer metrics; external native helper peaks are not included. Hold-period sampling does not force collection; lifecycle heap checkpoints use diagnostic renderer collection. No production forced GC was added. This short high-end-PC run shows a warm plateau within its scope, not hours-long stability, total peak memory, a weaker-machine baseline or absence of every leak. Keep A-R2 open alongside the earlier higher-growth runs.

Read-only source inspection also confirms FileStore's ordinary open path clears prior non-retained session handles and keeps one bounded snapshot; no unbounded handle-map leak is established by the private-memory numbers. Shared FileStore/IPC/allocator changes remain with Claude and need their own evidence/review.

## Printer

[Letter calibration PDF](../output/pdf/pdfix-printer-calibration-letter.pdf) and [exact Epson WF-3820 instructions](PRINTER-ACCEPTANCE-2026-10-15.md) are prepared. One page; 100 mm and 4 inch rulers; 50 × 50 mm square. Independently parsed and rendered/visually inspected. The user must choose actual-size Letter printing and measure physical marks. **No physical print job was sent.**

## Limits and requests for Claude

- Make the combined build/package after both lanes are committed and quiet; these are private built-runtime test snapshots, not a newly packaged release. Repeat affected checks after later changes.
- Retain A-R2/A-R4 and physical printer, visible/high-DPI/multiple-monitor, screen-reader, long-duration and wider malformed/multilingual/source-corpus acceptance. Do not call sampled Tab/naming checks a complete accessibility certification.
- UI receipts list disabled controls needing context review; nearby status/policy text explains many prerequisites. Their complete state-by-state usability and error-path matrix is not certified by a default-state screenshot. Rare signature/encryption/proprietary or data-dependent branches need their appropriate fixtures and owners.
- Claude's shell/editor/converters/forms/redaction/images/OCR/shared native files, current dirty UI changes and master trackers were not edited or staged. This pass does not certify those lanes. Reader-owned pdf-file-details.js was already dirty from the other agent and was left alone.
- Continue ordinary human testing from the fresh combined build; use the printer sheet in the checklist only when the user chooses to print. Keep workspace redesign and specialist expansion deferred.

Reproduce with `node scripts/agent-build.mjs codex`, then `node scripts/agent-run.mjs codex -- node scripts/check-reader-ui-closeout.mjs`. The suite keeps failing diagnostics visible and proceeds to independent workflows/memory instead of hiding the failures. Its aggregate is not expected green while A-R4 remains reproduced. For focused UI rechecks set PDFIX_UI_ONLY to comma-separated exact screen names (plus reader), optionally PDFIX_UI_CONFIG to e.g. 800,620,1.5, then use agent-run with check-reader-ui.mjs. Profiles, PDF copies, receipts and heap files are verification scratch and are not user deliverables.

Commits: 9c87192, e35b58f, 170ffc4, 672a273. The per-screen evidence table and Requests for Claude are in docs/PDF-READER-PARALLEL-HANDOFF-2026-10-12.md. All Codex source/check changes are committed; final packaging remains with Claude.
