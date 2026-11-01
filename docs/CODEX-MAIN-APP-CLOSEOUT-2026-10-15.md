# Codex main-app lane closeout — October 15, 2026

Scope: the reader, general PDF markup and Pages tools. Bluebeam-specific interoperability and its dedicated workspace remain deferred. The 30 Add-ons remain deferred until the human-testing/update phase. Existing non-Bluebeam requirements were not silently removed.

The implemented core workflows below pass their declared checks. This is a lane closeout for integration, not whole-app release approval or a claim that every PDF/layout/device is supported. Shared graphics/native-memory and human acceptance gates remain open below.

## Changes in this closeout

- Fixed a reproducible on-demand Find race: opening the search panel can reflow a fitted page; an immediately pasted/submitted query previously found its text index temporarily unavailable. Find now finishes the display render and rechecks source, page and search generation before using text. New navigation still wins. A focused built-app reproduction fails before the change and passes afterward, without extra native extraction for page-only Find.
- Fixed overlapping controls and horizontal scrolling in the reader's Tools & view menu. Dropdown labels/selects fit their existing groups and buttons wrap. Actual 800x620 and 1280x850 windows pass containment checks; the final screenshot was viewed. Tool organization and workspace structure are unchanged.
- Updated only the reader test in the shared layout spec: current grouped controls, actual pane visibility, current search summary and pane preferences. Its native-controller equivalent passes; the Playwright spec itself remains subject to the separate driver-startup problem. Claude's two other layout cases were not edited.
- Added direct native-process startup/acceptance runners. They launch the unchanged built app from a verified private runtime, with a temporary profile and real native file/render/search/writer routes. Only test file dialogs are substituted. Native keyboard/mouse input plus DOM controls drive the app; no browser-test loader or remote-debugging command-line flags are needed. Production security/GPU flags were not changed.
- Heap checks use live property-shape/prototype positive controls, including minified classes, and bounded snapshots streamed to local disk. Snapshot JSON analysis runs in the external Node controller after app exit so it does not inflate PDFix main-process memory. A diagnostic-file failure test proves the stream closes and its event listener is removed.

## Current evidence

| Area | Result and limit |
| --- | --- |
| Scoped source/native regression | 129/129 pass, no skips/failures. Includes reader/search/mapping/destinations, existing general markup, Pages, compression, batch/split and prior OCR-output boundary cases. Log: tmp/reader-closeout-source.log. Does not certify Claude's entire suite. |
| Combined built app | 15/15 declared cases pass in the direct hidden-app runner. Report: C:/Users/andre/AppData/Local/Temp/pdfix-reader-closeout-NYvxSJ/report.json. Actual rendering/pixels, full-document search, exact highlighting, outline/link jumps, keyboard, mouse area selection, readable mapping, resize, close/reopen, pane reflow/focus/reload preferences, page organization, compression, print preparation and native on-demand search. All input hashes unchanged, no renderer-process failure, app exit 0. |
| Final reader-menu correction | Subsequent 10/10 core reader cases pass on the corrected CSS build, including no horizontal menu overflow and fitted artwork at both window sizes. Report: pdfix-reader-closeout-O3I6gV/report.json. Actual reader-window.png inspected. |
| Native on-demand Find | Generated 501-page source: immediate page Find, no extra native reads for it, superseding navigation with no stale result, entire-PDF Stop/Continue, jump during pause, all 501 matches, exact last-match highlight and F3 wrap. 505 native read calls; scenario 33,541 ms in final combined run. Actual pdfix:read-paged-pdf handler is instrumented, delegating unchanged. Focused post-fix report: pdfix-reader-closeout-Bpzvdx/report.json. |
| Page output | Reorder/combine/rotate/save/reopen; empty plan refuses preview and Reset restores all four pages of both recovered sources. Independent pypdf confirms three organized output pages, first rotation 90, expected first/last text. The ordinary page-copy route's disclosed removal of annotations/document-level metadata is not a preserving-copy claim. |
| Compression output | Native build, independent PDF.js preview, explicit quality review, exclusive copy save and actual reader reopen. Independent pypdf confirms three pages, text, both links, Service history outline targeting physical page 3 and the named destination retained. |
| Printing | Three actual prepared sheet images and a usable confirmation control; close succeeds. The check does not open a Windows print dialog or spool a job. Physical printing remains unverified. |
| Generated memory workload | Five 500-page open/continuous/jump/Home cycles pass. Live positive counts: Reader/Search/Readable/MultiPage one each, TextLayer three; none of these instances remain at final Home. Renderer heap 4.5 to 4.8 MiB; Home DOM 317 initially, then stable 331. Sampled summed private process memory 234 to 265 MiB at final Home, with an intermediate Home sample 354 then back to 261 MiB. Report: pdfix-reader-closeout-ZPGt2G/report.json. Diagnostic collection only. |
| Supplied large PDF | Three actual built-app reader lifecycles on a temporary copy of the supplied 163-page/37,881,918-byte PDF pass, with exact original hash unchanged and no retained reader instances under live positive controls. Report: pdfix-reader-closeout-MPGOYw/report.json. Renderer heap 4.5 to 4.9 MiB; Home DOM stable after initial UI setup. Native/private growth remains open below. This is reader/corpus evidence, not Revu editing compatibility. |
| Build and isolation | Locked builds pass 410 modules. One native sandbox executable-lock failure passed on retry after its holder ended; no other agent's process was stopped. One source/hash mismatch correctly refused a runtime capture until a consistent build was made. dist is a test build; final source/build integration belongs to Claude. |

All report names without a full directory above live under C:/Users/andre/AppData/Local/Temp/. Test profiles, heap snapshots and PDF copies are local verification artifacts, not files prepared for the user's dad. They are not committed or release deliverables.

## Open gates, not completion claims

1. **Shared graphics/test-driver issue (A-R4):** earlier Playwright/injected-driver starts and minimal paint controls failed with GPU crashes or UnknownVizError. The unchanged PDFix app now repeatedly starts and passes actual workflows via the direct controller. Native window capture is intermittent; runs report artwork-only fallback explicitly when capture fails. The root graphics/driver cause is not proved or fixed. Keep production security intact and verify visible Windows use during human testing.
2. **Native/private memory on the real corpus (A-R2):** summed private process memory at Home rose from 242 to 613 MiB over three supplied-file cycles despite small/stable renderer/main JS heaps, no retained reader instances and unchanged originals. Browser-process private memory rose 115 to 366 MiB; renderer private memory 87 to 213 MiB. This requires native/allocator/IPC/graphics investigation and a longer real-corpus release gate. Zero retained reader classes is not proof that all memory is freed or that no other leak exists. Do not add production forced collection to hide it.
3. **Human/output acceptance:** physical printer output, visible/high-DPI/multiple-monitor behavior, real assistive technology and broader multilingual/malformed/complex layout corpus. Manual reviewed columns/regions and declared tag order are implemented; merged-table semantics, ruby and mixed orientation are not universally reconstructed. No semantic accuracy claim follows from plain tab/geometry output.
4. **Integration:** final quiet combined build, source-manifest comparison and whole-app regression after Claude's dirty editor/shared/native changes are committed. Current lane checks do not certify those later edits, Office/Edge/other planned integrations, every format converter or whole-app readiness.

## Reproduction

Use the existing build lock first: `node scripts/agent-build.mjs codex`. Run app checks one agent at a time; all owned windows must close. In a fresh PowerShell session:

```powershell
$env:PDFIX_CLOSEOUT_PAGES='1'
$env:PDFIX_CLOSEOUT_PAGED='1'
$env:PDFIX_CLOSEOUT_PAGED_ONLY='0'
$env:PDFIX_CLOSEOUT_MEMORY='0'
node scripts/check-reader-closeout.mjs
```

For a generated memory run, use a fresh session with PDFIX_CLOSEOUT_MEMORY=1 and optionally PDFIX_CLOSEOUT_CYCLES=5 (bounded 1–10). For the real corpus, additionally set PDFIX_CLOSEOUT_SOURCE to its absolute path; only a temporary copy is opened, sources are bounded to 100 MiB/500 pages and the original hash is checked. Do not supply a real corpus as a generated-capacity claim. `scripts/check-reader-startup-native.mjs` separates direct startup controls from the older driver-based diagnostic; its control failures remain failures even when its PDFix case passes.

## Requests for the integrator

- Preserve these exact evidence limits in the master readiness tracker after current edits are committed. Keep A-R2/A-R4 open.
- Use the direct-app runner as additional evidence; it does not repair the old Playwright driver or justify weakening sandbox/GPU settings.
- Investigate Browser/native-private allocation with FileStore/IPC and graphics ownership in a coordinated run. Reader object disposal now has real positive-control proof. Production cache/architecture changes need their own review.
- Take the final combined build when both agents are quiet. Maintain the Bluebeam/Add-ons deferral and the current non-Bluebeam main-app scope.

Claude-owned editor, shell, converters, shared native code, dirty trackers and dependencies were not edited or staged in this closeout. No app window is left running by these checks.

### Final memory comparison: hidden layout control

Normal app graphics were also tested with showing suppressed by the controller (not visible Windows acceptance). Before a layout refresh, the hidden Home page retained one disposed reader cluster through Blink cached LayoutResult/PhysicalBoxFragment nodes and an old Fit button. Forcing a Home bounding-rectangle read in the test controller, then taking diagnostic samples, removes that cluster: all five live class positive controls identify their targets and none remain at final Home. Report: C:/Users/andre/AppData/Local/Temp/pdfix-reader-closeout-OVCwZo/report.json, two checks pass, three supplied-file cycles, original unchanged, exit 0. Home DOM stays 317; renderer heap is 3.2 to 4.7 MiB. This is evidence of stale hidden-window layout retention, not a production listener fix. No production forced layout or GC was added.

Normal-graphics Home private memory still rises about 238 to 567 MiB (Browser 99 to 153, GPU 78 to 227, renderer 50 to 175 MiB). Together with the offscreen comparison, this leaves native/graphics allocation investigation open; short runs do not establish a plateau. Use PDFIX_CLOSEOUT_MEMORY=1, MEMORY_ONLY=1, NORMAL_GRAPHICS=1 and LAYOUT_FLUSH=1 (each prefixed PDFIX_CLOSEOUT_) for this comparison, optionally CYCLES=3 and SOURCE set to the supplied file. Focused flags now refuse missing prerequisite flags or conflicting focused modes rather than allowing an empty green run.
