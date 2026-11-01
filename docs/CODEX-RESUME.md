# Codex resume checkpoint — October 30, 2026

## Current checkpoint — October 30: new installer delivered

- Installer: releases/PDFix-Setup-2026-10-30-a7f1900.exe, exact commit a7f190030ef325d226c5bcd6374d8d3e581bef17. SHA-256 22727b0b2d17021fcf62285eed3ef61fc21022d7e40f7c8e5890343d91e0c989. Source snapshot 5d523acd5a62a77a6f3ff2f5fa0b16bbb10cf2ce351db5956aeff812c04e6de5. Package 0.1.0-20261030T083445870-e8702c69.
- Built from a clean git archive outside Drive through agent-build/agent-run; no dependency changes. Packaged app passed5/5checks, all3801inventory hashes, generated PDF + second-instance handoff, normal graphics and clean owned-process shutdown. No install/uninstall. Previous03752e4installer retained and hash unchanged. Installed state was not reverified.
- Completed: live PDF/Word tabs; visible tabs on Files/Home; finite render after parked resize/closing another tab; compact on-page fields and one-header-click checked save; Comment/Draw caller names; Print/secondary Refresh/plain footer; active Cancel/Stop; ribbon Escape preserving inner-tool guards; actual Copied notice; visible crash-recovered pending Type with Enter; PDF/OCR text conversion in a separate Word tab preserving the PDF.
- Latest app inputs match independently revieweddb8f96e exactly. Claude accepted conversion/Word/Password/OCR/table/recovery. Evidence and honest test history: docs/evidence/codex/everyday-installer-2026-10-30/README.md. Final affected29cases pass +3table output/cancel reruns +4Print layouts;22units;187names/0missing; two-round5-task robot replay passed and earlier files stayed byte-identical. Earlier69/45runs and corrected failures remain in evidence. Not a whole-Beta100%claim.
- **Next:** Claude/owner install-over/update testing with the two retained installers (Codex is not authorized to install). Finish Beta release gates in V1-PLAN/TOOL-PLAN. Master robot.mjs Print caller still awaits Claude: replace Open Windows print dialog with exact Print scoped to .pdf-print-workspace and remove the obsolete review tick; all owned Codex action callers are current. No active Codex app/run lease intentionally left.
- **Do not redo the historical NEXT list below.** It records the originalc1773b3checkpoint and is superseded by this delivery, git and newest HANDOFF. Preserve concurrent Claude work.

Read this first in a new chat. This is a checkpoint, not a new plan or a claim that the UI is finished.

## Owner's current request

Finish the remaining everyday UI work, matching tests/robot tasks, and produce a NEW uniquely named Windows installer. Do not stop at a cosmetic slice. Do not install/uninstall unless separately requested. Beta 1 target: October31, Windows only. Bluebeam/add-ons and full large-file performance certification stay after beta.

The authoritative order is docs/V1-PLAN.md (The two lists) and docs/TOOL-PLAN.md. The owner approved consistent Home Style / Font / Paragraph / Find on PDF and Word; other Build tabs keep icon tiles; Quick edit has no tabs. Original file names on disk stay unchanged when the title is renamed: it sets the next copy's name.

## Fast startup — no need to reread the chat

1. Run git status --short and git log --oneline -8. Read newest docs/HANDOFF.md (Claude is working concurrently).
2. Read this checkpoint, docs/V1-PLAN.md bottom table, and only the relevant TOOL-PLAN entries. docs/SHARED-PLAN.md holds older history and current ownership.
3. Inspect the actual current diff before changing anything. This checkpoint's working tree must not be discarded or recreated. Any later Claude changes win over the inventory below.
4. Continue the NEXT section. Source, a development build, an exact-commit test, a packaged build and the installed app are separate claims.

## Committed results

- 711d65f matching rich PDF/Word Home, Word icon tiles and Page setup:15 exact-commit app checks,22 focused units.
- 2e2c3d9 ordinary Highlight drag; d99619f on-page markup pointers/hints; b8fb9ed Quick adjacent method arrows.
- a74ec85 /3595fcb Comment finish/re-edit:30 exact-commit app checks,10 units,49 screenshots inspected; evidence docs/evidence/codex/comment-flow-2026-10-29.
- 195da37 Home recovered-additions notice and repeated list toggles; Claude independently accepted H1/H2 on e99ef03. Recovered work is offered before entering Type; no extra blank list bullets.
- ba81bca simpler Print (Pages/Scale/Copies; More options; no review tick), matching callers and stale saved receipt dismissal. Four DEVELOPMENT layout checks passed;12 screenshots reviewed;5 receipt units. Exact committed recheck still needed. Claude's follow-up: rename main action to Print, make Refresh preview secondary, simplify footer language.
- Claude551a160: setOpenFilesMode('tabs') retains up to10 file sessions/100MB; releaseFile(id) frees a slot. No native permission/source/hash checks weakened. UI startup now calls this API in current work.
- Claude66948d6: robot goHome closes robot-owned tabs once5 are open and handles Discard. Scheduling/seeds unchanged.
- Claude d861adf: unplaced Type recovery via unplacedTyping()/restoreTyping(); KEEP these when editing form UI.

## Current code checkpoint c1773b3 (committed but unfinished; not accepted Beta)

These Codex changes were saved in WIP commit c1773b3. The UI is not100% and no new installer was made. Later git status/HANDOFF can supersede ownership.

- src/app.js, src/open-file-sessions.js, src/document-tabs.css: park/restore actual document DOM/controllers across Home/Files/other tabs; preserve page, zoom, selection and edits; Home always visible; explicit close with Keep editing/Discard; release native sessions; reuse an existing tab rather than duplicate its source. Settings Escape returns to its prior screen.
- src/home-recovery-files.js + app.js: Home cards from recoverableRecents(20); first words distinguish new-document drafts. Safe textContent; no paths in cards.
- src/form-workspace.js/css, src/form-page-fields.js, src/reader-quick-tools.js: smaller Quick placement controls, editable form fields on the page; checked form writer can preview/verify/save from ONE header Save a copy click; preserve S5 pending typing. Build retains full form controls.
- src/unsaved-work-dialog.js + form/markup/pdf-content workspace: explicit close asks Keep editing/Discard when work is unsaved; successful copy save resets the UI modified flag. Native quit still flushes recovery. Tab/Home/mode preservation is not a discard.
- src/reader-options-panel.js/css: active footer Cancel delegates to existing close; one scroll area; more space for focused controls. src/pdf-reader-toolstrip.css: short-window toolbar density adjustment.
- src/markup-workspace.js: visible Build Note -> Comment, Freehand -> Draw; matching callers in actions-codex.mjs/mode/ribbon/tool-search, check-integrated-ui and check-reader-tester-guide.
- src/watched-folder-workspace.js: show Claude's status.notice after settings recovery. Backend untouched.
- scripts/user-robot/actions-codex-compact-form.mjs and actions-codex-sessions.mjs, exported via actions-codex-quick.mjs: independent saved-file verification, cancellation/discard paths, exact source hashes.
- Build tabs, copy title, document mode, unified draft Home and first-Save robot fixtures now get unique destinations/names on repeated runs.
- docs/skills/pdfix-build-delivery/scripts/build-installer.mjs: staging changed from Drive/tmp to OS temp; final unique installer still releases/. Syntax checked, not used yet.
- scripts/check-committed-pdf-home.mjs: added --print-tools to build the exact archived commit and run check-reader-live-previews.mjs. Not run in this mode yet.

## Test receipts — what is actually known

Latest focused DEVELOPMENT run PASSED8/8 (4 live tabs +4 compact forms), both window sizes including150%, through agent-run with generated files:
C:/Users/andre/AppData/Local/Temp/pdfix-live-tabs-compact-results/.last-run.json
Saved output checks: original hashes, page2 comment survives tab switch, filled answer/metadata/source content preserved, one-click save/cancel, Keep editing/Discard, Settings Escape. Screenshots are in its8 test subfolders; the new captures STILL need by-eye inspection. This was a development snapshot, not a clean-commit or installer run. Later CSS/caller adjustments may need recheck.

Other runs (do not hide failures):
- pdfix-everyday-results:23/24; password-cancel test reopened an already-unlocked live tab. Test now explicitly closes that tab first; rerun needed.
- pdfix-compact-form-results:10/16, then pdfix-compact-recovery-results:14/19. In the latter, compact form4/4 and recovery-card/real-kill2/3 passed. Remaining failures: Home placement at800x620/150%; three Quick flows still expected Escape to close an unsaved Comment without a prompt; focused control visibility at800x620/150%.
- Quick caller now handles the unsaved prompt with Keep editing; a short-window CSS fix and pre-failure screenshots added. Recovery placement click and keyboard visibility still need reproducing/proving. Do not extend timeouts blindly or weaken output assertions.
-5 saved receipt units,6 form/Home units,1 native retained-files unit passed.
- Current run lock absent at checkpoint. Previous exec process64710 no longer exists; .last-run.json confirms passed. No run intentionally left active. Verify current lock before launching (Claude may acquire it).

## NEXT — finish before a new installer

1. Read newest HANDOFF: Claude has taken Tier2 panels. Leave src/pdf-combine-workspace.js (currently modified), tool-registry.js, reader-toolstrip.js search text, page-workspace.js/page-recovery.js and forthcoming Compress/Protect/Redact/Export/numbering changes to Claude while owned. Coordinate in HANDOFF rather than overwrite.
2. By-eye inspect the8-pass screenshots. Reproduce/fix Home click-to-type at800x620/150% and focused control clipping in Quick Escape test. Tests/callers have changed since failures; rebuild and rerun relevant specs first.
3. Rerun reader-quick, pdf-home-recovery-notice, pdf-reading, markup, compact-form-ui, live-file-tabs; then Word/shared Home/copy-title/first-Save repeated actions. Add actual Word live-tab and changed/moved-source acceptance (still unverified). Keep saved-output and cancel checks.
4. Finish Cancel/one-panel sweep: Claude found Esc failing in Organize/Extract table/Redact,4 stacked panels after Redact -> OCR, OCR Cancel greyed. Coordinate with Claude's current panel work. The generic footer does not by itself prove every panel closes correctly.
5. Verify repeated draft-preservation robot actions do not call the new tab-cleanup goHome helper mid-action: it can deliberately Discard the draft they still need. Use ordinary visible Home navigation inside those workflows; keep cleanup at task boundaries and coordinate with Claude.
6. One-name/one-job cleanup and Print follow-up above; run node scripts/check-tool-plan.mjs after name changes (latest187 names/0 missing).
7. Broader local suite from committed source after batch; no cloud until Beta. Request Claude's independent same-day review. Fix actual failures rather than call the UI100%.
8. Commit exact source/tests/robots/docs by own paths. Build exact accepted commit using build-delivery skill, keep previous installer for update testing. No install/uninstall. Deliver actual unique exe + full commit/hashes, not a generic Setup name or source-only preview.

## Installer identity / delivery

NO NEW INSTALLER YET for this checkpoint. Installed app remains03752e4. Previous installer:
releases/PDFix-Setup-2026-10-28-03752e4.exe
SHA256489d491ed2c920fda71219f2ba393eb82f163f5c49ca618eb5fd044069373051
Read docs/UI-CURRENT-START-HERE.md and docs/skills/pdfix-build-delivery/SKILL.md before delivery. Clean git archive outside Drive, matching existing dependencies, coordinated build; no downloads/dependency changes; uniquely dated+commit exe. The OS-temp staging change above is not yet packaged/proven. Do not build from whatever HEAD happens to be and call it finished.

## Operating rules

- One main branch/shared folder, external gitdir C:/Users/andre/pdfix-repo.git. Never add-A/add-dot/commit-a/checkout/switch/stash/reset-hard/clean/rebase/merge/pull or create a branch.
- Commit own paths only, author Codex <codex@agents.local>. git writes need escalation here. Restore line endings only on own files with scripts/fix-line-endings.cjs.
- Build node scripts/agent-build.mjs codex. Every app check node scripts/agent-run.mjs codex -- <command>. Hidden windows, temp profiles; close owned process trees. Unit tests need no lock. Dependency junctions/native app diagnostics require escalated execution in this environment; do not bypass runtime manifests.
- No spare PC (Claude owns), no cloud, no upload, no production GPU/security changes. Source/test runtimes/packages out of Google Drive; small notes/evidence and final installer allowed here. Never touch owner personal notes or upload/copy dad's drawings.
- No new workspaces/Bluebeam/add-ons. Do not use old completion percentages as evidence. Keep commentary short; owner wants sustained work through a usable installer.
- Windows rg: search directories with -g patterns; do not pass src/pdf-* or actions-codex*.mjs as literal paths. agent-run shell can misinterpret | in --grep; run explicit spec files or a Node wrapper instead.
