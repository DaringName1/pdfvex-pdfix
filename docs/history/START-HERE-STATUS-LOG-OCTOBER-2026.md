# START-HERE status log, October 2026 (moved here word for word on October 22)

The dated notes that used to be section 8 of START-HERE.md, kept as history. Current status is in START-HERE.md section 8,
SHARED-PLAN.md and HANDOFF.md.

## 8. Where things stand (update this section)
- Codex October21: reader Build/View locally implemented; PDF default View, Ctrl+Shift+E, retained selection/zoom/page and draft save checks pass. Full post-change desktop repeat pending; Word/new-document mode UI still needs Claude integration. Interface and limitations in HANDOFF, evidence build-view-2026-10-21.
- Codex, October19 late evening: the full uninstrumented normal-graphics soak passes19cycles/91.99minutes with independent saved-output checks and clean exit. Unchanged memory gate: later median−15.78MiB, slope0.604MiB/min, settled peak781.96MiB. Local generated-file acceptance only; earlier failures and weaker-PC/real-corpus uncertainty remain. Run lock released. Receipt and build identity: [memory investigation](READER-MEMORY-INVESTIGATION-2026-10-19.md).
- Codex memory follow-up: renderer-private growth is separated from steady main-process usage in the prior long-run data. A190-second hidden native-allocation smoke passes workflow/clean exit; it does not certify a plateau or identify the component. A-R2 remains open. See [memory investigation](READER-MEMORY-INVESTIGATION-2026-10-19.md).
- Codex, October19 evening: a76a22a has matching toolbar/robot tasks; the subsequent preview follow-up proves Drawing, thumbnail drag with retained structures, automatic previews at4configurations and the advanced comment proof.54focused units/save-fault cases pass. See [reader checkpoint](READER-UI-ROBOT-CHECKPOINT-2026-10-19.md) for exact evidence, residual UI issues and Claude requests. A-R2 and cloud/package acceptance remain open.
As of October 18, 2026: test version for the owner's father planned for **Monday October 19**.
- Codex, October 18: now scope confirmed as X1/X6/X7; Phase 1 lane audit is in the finish plan for owner review.
  Full hidden normal-GPU run completed 18 cycles/94.04 minutes: workflows and clean exit pass, but memory gate FAILS
  (later median +69.58 MiB versus 64 MiB allowance). A-R2 stays open; receipt preserved in docs/evidence/codex.
  All 18 native-readiness app cases now pass locally; six screenshots personally inspected. New cloud runs still
  need two consecutive full passes; latest 39127085332 fails only a Claude-lane forms case.
- X1 increment: bounded standard-font callout body editing now passes units, native save/reopen/refusal and
  four size/text robot configurations. Final screenshots/receipts are in docs/evidence/codex. Uniform single-paragraph rich-text
  body editing now also has local unit/app/robot/visual proof; mixed layouts and custom fonts remain unfinished.
  The dialog has short instructions and expandable limits. Cloud/spare-PC/package acceptance is pending.
- X7 follow-up: all six comparison cases pass locally after bounded initial-open readiness/diagnostics; exact
  cloud cause still unproven. Two full clean fresh-Windows runs remain required after upload, by Claude.
- Robot: about 2,500 spare-PC sessions since October 16; real bugs found and fixed include a lost typed line
  (Ctrl+End stale selection), stuck document jobs on slow PCs, short (8.3) Windows paths refused as links, and Home
  clicks dropped while a file loaded.
- Cloud: the launch cascade (GPU crashes after the long search test) is fixed; the remaining failures are slow-runner
  timeouts in Codex's tests. Two clean runs in a row are still needed.
- Claude, October 18 evening: C1 done (Edit a workbook and Edit slide text proven on Excel- and PowerPoint-shaped
  samples; Save was silently locked by a far-away review box, now "I checked my changes" sits beside Save; two robot
  actions added). C2 done (Print button and Ctrl+P in the document editor, through the same print preparation as PDFs).
  C3 mostly done (turn, crop, drag-to-resize pictures; GIF/BMP/WebP pictures in). Text wrap and TIFF pictures are
  left for after the dad's feedback. 24-hour spare-PC run 2 is running with the newest robot.
- Monday test package (Claude, October 18 21:26 UTC): `releases/PDFix-0.1.0-20261018T212559026-02d0cdb2-win-x64`,
  built from a clean tree (Claude to b32b6ce, Codex to acfabb5). Packaged launcher starts in normal graphics; a 10-step
  robot session on the package passed. The spare PC's 24-hour run 3 tests this package.
- Codex, packaged follow-up: Monday package inventory (5,673 files), actual outer-launcher reader opening and
  second-instance file handoff pass with clean exit. Eight native retry/fence scenarios pass using exact launcher
  bytes on an isolated desktop. Real GPU crash and spare-PC acceptance remain separate. See PACKAGED-READER-ACCEPTANCE-2026-10-18.md.
- Next: package the graphics fallback (launcher outside, Electron app under `app/runtime/`), Sunday's 24-hour run
  with the 43-action robot, the owner's Sunday check, then the dad's package.

- Codex V1 audit: twelve-area evidence and per-save-family structure tables added to V1-WHOLE-APP-AUDIT-2026-10-18.md.
  Found/fixed unsafe fresh Pages copies dropping attachments/tags or missing orphan signatures, and nested signature
  markers missed by markup. Source/unit/app proof is separate from the installed Monday package, which predates fixes.
  New disk-fault and original-object/calculation/attachment/tag tests pass. Real power loss, outside viewers, hostile
  corpus and combined forced-close engineering workflow remain unverified. Readiness score stays with Claude.
- Instrumented soak finished94.03minutes/18cycles and released the run lock: workflows/clean exit pass, memory FAIL
  (+80.44MiB median,1.872MiB/min). Full receipt preserved. FreeText/XFDF cloud regressions pass3/3 locally;
  two consecutive full cloud runs still required after Claude upload. Custom-font dependency approved but deferred
  under audit feature freeze. Main-PC owner-requested per-user installation and desktop shortcut completed for
  20261018T212559026-02d0cdb2; no default association or personal-document changes.
- Owner-requested Windows branding repair implemented: embedded launcher icon, packaged running-window taskbar identity/icon/relaunch target and installer shortcut icon. Native icon payload and real packaged-window property checks pass; next combined package and spare-PC visual acceptance still Claude's. See WINDOWS-BRANDING-FIX-2026-10-18.md. No spare-PC use or new release by Codex.

- Owner screenshot follow-up: Windows small icon now uses the existing document symbol rather than unreadable tiny wordmark. Seven native resource sizes and actual packaged-window properties pass; main-PC shortcut icons updated without app restart. Claude's new package/spare-PC verification pending. Confirmed Markdown source/preview overlap (including Fit width) is A-C-MD1; exact cause, generated screenshots and repair request in CLAUDE-MARKDOWN-LAYOUT-REQUEST-2026-10-18.md. Editor source unchanged by Codex. Full unit confirmation388pass/1skip after an intermittent contained-output startup failure; failure remains recorded.

- Codex engineering audit: generated13-step reader/Drawing/Pages forced-close recovery passes in the hidden built app,
  with independent saved-file checks and clean process exit. Evidence: READER-ENGINEERING-RECOVERY-2026-10-18.md.
  Older annotations can become non-editable after preserving reorder; original takeoff page text stays (A-D-AUDIT2).
  Mid-save/power-loss and cross-lane recovery remain unverified.

- Codex memory instrumentation: two-cycle normal-graphics smoke shows fonts/canvases released from live sets and
  app exits cleanly. It is too short for a memory plateau; A-R2 remains open. Full unit confirmation409pass/1skip
  preceded the two new reply cases; targeted save-route suite now23/23. See own handoff for receipts.

- Codex save-failure audit:3actual Windows exclusive-handle cases pass. Full units414pass/1skip (415total).
  Reader-only short memory diagnostic reproduces warmup growth without markup, but A-R2 remains unresolved.

- Codex actual app kill-mid-save:14-step generated engineering job passes after17flushed stage bytes, no final
  publication, main termination, draft recovery and independently checked final save. Partial remains identifiable.
  This is bounded injected-write evidence, not power-loss/all-route durability. See reader engineering audit.

- Codex malformed-reader audit:4generated bad inputs refuse promptly, each followed by valid open/save/independent
  inspect/reopen. Four screenshots personally viewed; no source mutation or captured process left. Broad hostile
  corpus and outside-software acceptance remain separate. Evidence in own handoff.

- October19 Codex: approved8-group reader toolbar first increment locally passes4size/text configurations, saved
  note readback and14personally reviewed screenshots. Comment/Pages/live-preview implementation continues.
  Requests for Claude and runtime entry points: READER-ONE-PLACE-INTEGRATION-2026-10-19.md.

- October19 Codex: Comment direct tools/on-page typing and side options pass4size/text configurations plus
  saved-text reopen/edit/header-save and cancel. Five final PNGs viewed. Shared registry/callbacks consumed;
  stamps/source review, Pages/live previews and full regression migration remain. Details in reader handoff.

- October19 matching UI/robot checkpoint: six core robot tasks pass after tab/direct-button migration; Drawing readiness follow-up pending. Default thumbnail reorder keeps comment/link/outline objects and metadata in4saved-output checks. Automatic Compress/numbering/Print work in4configurations, but Print/large-text Compress visual layout and one advanced markup proof-preview regression remain open. Details and evidence in the reader handoff; A-R2 and clean cloud/package acceptance are still open.

- October20 Codex: approved Home/More and18added robot actions ready; both sizes independently check saved output,60keyboard states and four toolbar configurations pass; units474pass/1skip. Desktop33/34 then corrected outline/search focused3/3. Cloud/release acceptance and final screenshot review pending; area-selection bug reproduced. See READER-REMAINING-PROGRESS-2026-10-20.md.

- October20 follow-up: selected-area copy survives same-page redraw/resize;3built-app reader regressions and5units pass, stale-page selection prevented. All70new toolbar/action/keyboard captures personally reviewed; remaining visual polish listed in READER-BY-EYE-UI. All-tools markup entry-point fix/guide repeat continues.

- October20 final guide:6/6default,6/6small/150%; saved markups and100mm takeoff independently checked. Fixed All-tools Comment entry selection and narrow markup20pixel squeeze; temporary panels restore without saved-preference changes. Proof panes are local. Cloud/package recheck remains Claude's.

- October20 checkpoint:9efaf98/dfb975e ready for Claude integration. Remaining initial-sheet-set dirty fix is unit-checked WIP; built-app check and final rectangle repeat wait for Claude to close its completed UI checker, whose process still holds the run lock. See own handoff for exact bounded evidence and cleanup request.

October22 Codex: inline Redact main-page UI locally verified (19units/11app cases, exact-output robot,10screenshots viewed); App All-tools integration requested in HANDOFF. Models/writers unchanged, full repeat/150% layouts remain. Evidence inline-redact-2026-10-22/. Text methods connected by Claude, but switching to Text box leaves hidden content-host lease and blocks next tool; request recorded.

October22 Codex2.11: Review comments filter drawer was never enabled because panel mounts before toolstrip flag. Root-reader condition now matches toolbar installation; drawer/labels/buttons wrap, sticky header no longer overlays content.57screen states/3configs pass,21final screenshots+2robot captures viewed; exact saved reply/reopen passes. Organize checker waits actual controls and opens options. Heavy150%scroll/toast remains2.12. Evidence comment-pages-layout-2026-10-22/.

October22 full local repeat:159cases152pass/6Claude failures/1hidden-fullscreen skip; all Codex suite cases pass, search-all45.958s and cleanup/fresh launch pass. Evidence full-inline-desktop-2026-10-22/. NEW OPEN A-R-IMAGE1:20million-pixel scan image silently omitted (white canvas, ready/Opened/no error);1million-pixel control black. Same output canvas bounds. Synthetic app and parser/pixel receipts reproduced; owner private drawing not examined/copied, same cause not confirmed. No memory/security limit raised. Existing suite misses this defect; large-scan compatibility is NOT proven.


## Notes appended after section 10



- October20 Codex: robot module dependencies committed c84b7f6; three reported crop/comparison/compression routes restored and independently checked4efb34e. Cleanup xref Size, repair preview helpers, geographic point crashes and narrow audit-search fixes have unit/built-app evidence in the reader handoff. New candidates remain opt-in; cloud/package/spare-PC acceptance stays with Claude. A-R2 current generated-workflow92-minute gate passed1ae8ab3; broader memory acceptance remains separate.

Codex October20: local UI-polish and44route/60total save audit evidence: docs/evidence/codex/ui-polish-2026-10-20/. See Codex handoff for remaining small-window limits, cloud and real-corpus gates.

October21 Codex mode follow-up: full local149cases143pass/5ownfail/1skip; fixed reopened-reader Build readiness and markup Fit intent after mode switching. All12affected/adjacent cases and both saved-note robot sizes pass;7screenshots viewed. Full clean repeat still pending. Evidence docs/evidence/codex/build-view-followup-2026-10-21/.

October21 Text2.15: common method selector + on-page Text box connected;6units/10app checks and exact saved-output robots at both sizes pass. Cancel keeps draft/no output, final black colour verified. Click to type/Edit existing await Claude2.18; interface docs/READER-TEXT-INTERFACE-2026-10-21.md. Small150% crowding remains2.11/2.12. Evidence text-methods-2026-10-21/.

October21 full Text-build local desktop repeat:149passed/1hidden-fullscreen skip/0failures in15.6minutes. Native search-all cleanup and fresh launch pass. Evidence text-full-desktop-2026-10-21/. Local built app only; no cloud/spare.

October21 2.16 table half: main-page Extract table/source overlay + side options connected;4app cases/5units and standalone exact CSV/XLSX robot pass;12screenshots viewed. No duplicate source canvas. Models/writers untouched. Redact/full repeat/new OCR/rotation proof pending; Claude must update old robot.mjs dialog locator before packaging. Evidence inline-table-2026-10-21/.
