

> **Codex resume checkpoint, October29: c1773b3.** Read [CODEX-RESUME.md](CODEX-RESUME.md) and newest HANDOFF first. Live tabs/compact forms are committed as unfinished WIP; latest focused development check8/8 passed, broader failures and visual acceptance remain. No new installer; installed03752e4 unchanged. Do not package this checkpoint as accepted Beta.
**Spare PC (owner, October 21):** Claude runs it, including any test Codex needs there. Codex asks in HANDOFF.md under "Waiting on Claude".
# Shared plan — Claude and Codex (started October 20, 2026)

**Current UI source, decisions and evidence:** [UI-CURRENT-START-HERE.md](UI-CURRENT-START-HERE.md). Read it before UI review or packaging; latest Codex Home/tile UI slice **711d65f** is committed. The owner replacement finish order is in V1-PLAN.md / TOOL-PLAN.md (see below).

The one list both agents follow. Read it before starting work; update the item (status, date, commit) when you
finish it. Work only on items marked for you, in order, unless the owner says otherwise. The owner changes priorities
here. Notes between the agents go in [HANDOFF.md](HANDOFF.md).

Order agreed with the owner: **1 checks and fixes → 3 reliability → 4 robot → 2 UI → 5 release**.
Targets: v1 beta October 30; full v1 mid-November.

**Owner replacement priorities, October 28–29:** follow [V1-PLAN.md](V1-PLAN.md), especially **The two lists**, and [TOOL-PLAN.md](TOOL-PLAN.md). Beta 1 is **October 31, Windows only**. First matching PDF/Word Home, then everyday tools, persistent file tabs, Cancel/one panel, compact Type/Sign/Fill, unsaved-work protection, crash fixes, update installers, final UI/robot and Beta 1. Earlier ordering/dates above are historical. Codex builds each item; Claude tests the committed item and fixes its saving side.

**Codex item2 October29:** normal word Highlight fixed in2e2c3d9 with12/12 exact-commit app checks and10units; on-page markup hints d99619f pass12/12 exact checks. Quick edit adjacent method arrows b8fb9ed pass15/15 exact clean checks; matching callers/evidence committed. Comment completion/re-edit a74ec85 passes30/30 exact committed clean-source app cases;49result screenshots inspected. Build names/compact panels, S19 and remaining V1 items still open.

**Codex October 29:** matching PDF/Word Home, icon tiles and Page setup implemented in **711d65f**, with **15/15** exact-commit clean-copy app replays and **22/22** focused units passing; evidence shared-home-2026-10-29. Item1 source/local proof is ready for Claude's independent button/recovery review. Remaining Tier 1/S19/crash/update/Beta items stay open; installed app unchanged.

**New division of work (owner, October 22):** Codex builds the new UI everywhere, including the Word editor and Home
(items 2.7, 2.19, 2.24, 2.26–2.35), following [UI-RULES-2026-10-22.md](UI-RULES-2026-10-22.md) and the mockup in
[mockups/final-2026-10-22/](mockups/final-2026-10-22/README.md). Claude's main job is **testing, fixing and planning**
(section 6): finish 2.18, then review every UI change by eye against the rules, run the full suites, the robot and the spare
PC, fix what they find, keep the plan and documents current, and build the packages. Files: Codex may now change the
editor, shell and Home files those items need; say in HANDOFF.md which files you are working in, and Claude stays out of
them until you say you are done.

**Owner priority, October26:** finish the UI layouts across all screens first, then do the broad bug pass. Focused saved-output/keyboard checks remain part of each UI change; defer the full local suite repeat until the layout batch is ready. Codex owns this UI work.

## Rules for both agents

0. No GitHub cloud runs until beta 1, when a lot has changed (owner, October 21; the free monthly minutes are used up).
   Then two full runs back to back. Until then test locally and on the spare PC.
1. A UI change is not done until its tests and robot tasks are updated in the same commit, and the robot replay for
   the affected tasks passes.
2. Hold the app-run lock only while a check is running. A finished check that still holds it → note it in HANDOFF.md.
3. Commit only your own files. Never edit the other agent's lane; ask in HANDOFF.md.
4. When you finish a section, add "done / next / needs from the other agent or the owner" to HANDOFF.md.

Status: **todo**, **doing**, **done** (with commit), **blocked** (say on what).

## 1. Checks and fixes

Owner storage incident October28: approved789obsolete runtime snapshots removed locally (132.91GB); helper now uses OS temp and bounded cleanup, unit/app smoke pass. Drive Trash emptied on owner request, cloud quota/sync still pending and direct deletes rate-limited. See STORAGE-CLEANUP-2026-10-28.md. Both agents must keep disposable full source/runtime/build copies OUTSIDE Drive. UI WIP remains unfinished.

Codex October28 follow-up to Claude review: saved-copy refusal now has one alert and no unavailable Continue/Reveal; fresh-copy recovery passes10app cases. Rejected test-runtime snapshots reset and report the changed filename; real repair regression passes.6focused units/8screens viewed, independent review pending. Cwd-mislaunched runs remain invalid.

| # | Item | Who | Status |
| --- | --- | --- | --- |
| 1.1 | Fix the robot tasks that still use old menus: sheet set, crop box, compare, compress, reader eight groups (~900 spare-PC failures on October 20) | Codex | done locally (Oct20: matching actions9efaf98, fresh five-task replay5/5; evidence menu-compatibility-2026-10-20). Claude must copy matching actions to spare package. |
| 1.2 | Two clean full cloud runs in a row (read each run, fix own-lane failures) | Claude reads and uploads; each fixes own lane | waiting (owner, October 21: no more cloud runs until beta 1 is ready; then two full runs back to back. Use local full runs and the spare PC until then) |
| 1.3 | New spare-PC package from committed work for lanes A and B (includes Codex's October 20 fixes and the new robot jobs) | Claude | done (packages 0f49407a, 729a15d1, 444ec651; run 6 on all four lanes, October 21) |
| 1.4 | check-ui-screens: stop its own app processes after a close timeout (it held the lock on October 20) | Claude | done (e958656) |
| 1.5 | check-integrated-ui comment step: New comment now switches the reader to Comment; assert the Note button is pressed | Claude | done (e958656; check-integrated-ui passes) |
| 1.6 | Area selection box disappearing | Codex | done (dfb975e) |
| 1.7 | Sheet sets refusing to close when nothing changed | Codex | done (09be9b7) |
| 1.8 | Intermittent "Windows Security Sandbox could not start" in local runs (now logged with its line) | Claude | **mitigated October 28:** Codex hit it twice (Oct 28, dev runs), both at the pinned-file check (a file detail moved while it was read). Never seen in 333 spare-PC runs. Now: one fully stable re-read when only the change time moved and the bytes match; anything else still refused; the problem log names the moved fields (no paths). Cause not proven (Drive and Defender ruled out locally); next occurrence will say which field |
| 1.9 | Picture drag-resize fails only in the cloud | Claude | done (passes in clean cloud run 39545463622) |
| 1.10 | Spare PC: copy Codex's current robot tasks (Home readiness 3d3f85b and later) into the tester folder | Claude | todo |
| 1.11 | Robot: add ctx.chooseFiles(paths) and opt in Codex's batchActions (bdfb08e) | Claude | done (1112725: chooseFiles, cancelSave, scan fixtures; Codex opt-in sets on; 19/22 new tasks pass alone, 3 reported) |
| 1.12 | Spare PC: a quiet 100-minute window for Codex's real-file memory test (robot lanes paused) | Claude | todo |

## 3. Reliability (V1 audit)

| # | Item | Who | Status |
| --- | --- | --- | --- |
| 3.1 | Part-by-part save checks, crash tests, hostile files, internet-off runs — Claude's lane | Claude | done (October 20) |
| 3.2 | A kill during Codex-lane saves | Codex | done for connected markup/Pages route (ea4e24b, Oct20:14/14steps,17byte mid-save kill + exact draft recovery/output inspection; plus3223c82 preserving Pages17byte interrupted-save/restart proof Oct20; other routes remain audit follow-up) |
| 3.3 | Real-corpus performance and memory checks | Codex | doing (3223c82): real163-page readiness2cycles/206s and intentional deadline cleanup pass; full90-minute/every-page gate awaits coordinated100-minute app lease. Not certified. |

## 4. Robot

| # | Item | Who | Status |
| --- | --- | --- | --- |
| 4.1 | Crash-and-recover jobs; tasks for watched folders, synchronized files, clipboard, links, spelling, version history | Claude | done (a02eae1, 8fb016d) |
| 4.2 | Robot tasks for Codex-lane tools no robot has used yet | Codex | doing: four new opt-in batch actions pass both sizes (8 workflows), six tamper-verifier units pass; all20 screenshots reviewed. Evidence batch-robot-2026-10-20. Needs Claude chooseFiles context before enablement; other coverage stays open. |

October28 shared Build tab slice: same11ordered tabs on PDF/formatted Word, Review/Pages labels with legacy controller aliases; unavailable PDF-only Word tabs explain why. File/Insert PDF entry points reuse commands, Word Edit/View/Export use actual controls.17app checks then7final comment/tab cases pass. Full PDF Home formatting and equal-height large-tile Word panels remain unfinished; bounded writer ownership proposal awaiting owner.

## 2. UI (tools working on the page, plain words, fewer ticks)

Owner decision October27 (W1): ordinary save-a-copy actions have no review checkbox. Keep previews, native/output/disk verification, Saved and Continue with this copy. Redaction and hidden-data removal keep one confirmation. Password protection keeps repeated password entry, removes the extra review tick, and says “Keep this password somewhere safe” after saving. Cryptographic signing authorization and actual edit/calculation consent are separate from redundant copy-review ticks. Roll out per tool with matching saved-output/cancel tests and robot callers; not yet globally completed.


| # | Item | Who | Status |
| --- | --- | --- | --- |
| 2.1 | Fill and sign: click and type on the page | Claude | done (c05c391) |
| 2.2 | Redact: marks look as they will; one fewer tick | Claude | done (c05c391) |
| 2.3 | Protect: simple choices | Claude | moved to 2.20 (owner chose: all three) |
| 2.4 | Edit PDF text on the page | Claude | done (3e43f2f) |
| 2.5 | Extract table: automatic detection and dragging | Claude | done (3e43f2f) |
| 2.6 | Editor: real separate pages | Claude | done (3e43f2f; view only) |
| 2.7 | Files: thumbnails, "Ask about files" setup, drag and drop | Codex (new UI; owner, October 22) | todo |
| 2.8 | All tools > Organize should open the reader's Pages group, not a separate window | Claude | done (3e43f2f) |
| 2.9 | Messages never cover the header, page or controls | Codex (owner approved UI) | done locally Oct25: reserved message strip and modal spacing,14app cases/9robot actions,15screens viewed; earlier2sizing failures corrected with original assertions retained. Native history transient separately reported. |
| 2.10 | Conversion notes hidden under File (show a short message on open) | Claude | done (3e43f2f) |
| 2.11 | Overlapping controls at small sizes: Review drawing comments, Organize pages, Drawing sheet sets, Page numbers and stamps | Codex | done locally (Oct22:review filters mounted/folded, long sidebar controls wrap;57screen states across3configs,21screenshots viewed and saved-reply robot pass. Prior sheet-set/numbering evidence retained. Heavy150%scrolling/toast remains2.12; package acceptance pending.) |
| 2.12 | Small 150% layouts with all panes open need a lot of scrolling | Codex | doing Oct26:focused Options controls stay in view; long table Close/review labels wrap safely. Fifteen final saved-output robot actions/three layouts pass,27screens reviewed. Oct26:source/preview panes fit at200%; matching saved toasts removed while verified receipt stays.14app cases +1visible refusal and7final layouts pass;18screens viewed. Oct26:compact rail fits150%; safety sentence scrolls with settings; compression Save stays visible. Final19app cases and12screens pass. Overall density remains open. |
| 2.13 | Batch preview dialogs too narrow; duplicate Bates ordinals and singular page grammar | Codex | done locally (Oct20: wider dialogs, singular page/one ordinal/plain check message; 8 workflows pass,20 screenshots reviewed; batch-ui-2026-10-20). Vertical scroll/shared toast remain2.12/2.9. |
| 2.14 | Build / View switch (owner October 22: PDFs now open in Quick edit (2.31), not View; new and Word documents in Build; View hides editing controls; keeps page, zoom, selection and unsaved edits; fullscreen stays separate) — see UI-DIRECTION-2026-10-21.md | Codex | doing (Oct21:reader implemented;6app cases + exact saved-note robot both sizes pass;6screenshots viewed. Full repeat and Claude Word/editor mode integration pending; contract in HANDOFF.) |
| 2.15 | One Text tool with methods: Click to type / Edit existing / Text box, working on the main document (replaces separate text entry in Fill and sign and Edit PDF text; Claude wires those tools to it) | Codex | doing (Oct21:shared selector/native Text box built;6units,10app cases,exact saved-output Text and Home robots both sizes pass;6screenshots viewed. Click-to-type/Edit-existing awaiting Claude2.18 registrations;interface in HANDOFF) |
| 2.16 | Redact and Extract table work on the main document; writers unchanged | Codex | doing (Oct22: both root-reader UIs locally built; table4app/5units and exact CSV/XLSX robot; Redact19units/11app and canonical clean-output robot,10screenshots viewed. Claude App All-tools Redact/old robot wiring requested; full repeat pending; layouts remain.) |
| 2.17 | Full local app suite; fix own-lane failures and list Claude-lane failures | Codex | October28 full repeat256:253pass/1forms failure/2skip on03752e4. Forms.spec.js:13 assigned Claude; no all-green claim. Subsequent fit consistency4app cases and8saved-output robot layouts pass; independent acceptance pending. |
| 2.18 | Fill and sign and Edit PDF text work on the main document, no pop-up with a second copy | Claude | done (a27244c: Fill and sign is a panel beside the open PDF; Edit PDF text d87a0f0) |
| 2.19 | Home: recent files with small previews and pinned files (setting: Off / Show when I hover (default) / Always) | Codex (new UI; owner, October 22) | partial locally Oct26:pinning and bounded PDF first-page previews built, protected exclusion/Off cleanup/restart pass;5app cases and3final saved-copy robot layouts,35batch screenshots reviewed. Other formats still use badges; no live-disk preview claim. |
| 2.20 | Protect: three choices — password to open only, limits only, or both (owner approved October 21) | Claude | done (5d5913e, f43c2bf, 263f131) |
| 2.21 | Build page (UI-DIRECTION): Select tool with choices — text / objects / area | Codex | todo (beta) |
| 2.22 | Build page: Draw tool with choices — line / connected lines / freehand / shapes; separate lines never join by themselves | Codex | todo (after beta unless quick) |
| 2.23 | Build page: Measure tool with choices — distance / area / angle / perimeter / count | Codex | todo (after beta) |
| 2.24 | Build page: settings for the selected thing appear beside it only when something is selected | Codex (new UI; owner, October 22) | partial locally Oct27:Word picture/table controls follow selection beside page; four saved-DOCX robot layouts and16screens reviewed; existing picture/Undo paths pass. Reader selection context remains separate. |
| 2.25 | Build page: panels (pages, bookmarks, comments) close and reopen without losing their tools | Codex | partial locally Oct26:reader rail navigates pages/outline/saved/search and folds active Options without losing marks/history;19final app cases,4units and12screens pass. Word picture/table object rail added Oct27; Oct27 saved-source Comments rail built with draft distinction/fold/restore/Escape;3exact-output robot layouts pass,9screens reviewed. General Word navigation remains. |
| 2.26 | Status bar: page, zoom, what is selected, saved or not — reader and editor alike | Codex (new UI; owner, October 22) | done locally Oct27:common status for reader/Word/source; editing page position explicitly differs from exported page count.9app cases+3final source presentations and2units pass;18screens viewed. Claude independent review pending. |
| 2.27 | Undo/Redo behaves the same in every tool (one place, same keys) | Codex (new UI; owner, October 22) | partial locally Oct26: shared header delegates active reader/Word/native source history;3units and3saved-output workflows pass,18screens viewed.40/43 focused then10/10 follow-up; standalone dialogs keep their history. Full integration remains. |
| 2.28 | Image tool on the page — insert / replace / crop | Codex (new UI; owner, October 22) | todo (after beta) |
| 2.29 | Table tool on the page — insert / edit / extract (extract is 2.16) | Codex (new UI; owner, October 22) | todo (after beta) |
| 2.30 | Window parts as in UI-LAYOUT-PLAN-2026-10-22.md: side rail, top bar, file tabs, tab bar, slim toolbar, Options panel, status bar; PDF toolbar becomes small grouped buttons (no big buttons) | Codex | doing (d9b73c5,Oct23:All nine tab foundations grouped (Oct23);View has eight primary controls/Less used,3View+Word-count saved-copy layouts pass,24screens viewed;19regressions+2final closure/output cases pass across runs. Earlier rail/tabs/measurement evidence retained. Oct25:reading View simplified to one bar;three navigation/print/cancel/exact-copy layouts plus three matching robots pass;12screens viewed. Oct25:Find/Save a copy/Print fixed top right;Home seven editing tools;21focused+10close/form cases and6matching Home robot sessions pass,17screens viewed. Oct26: shared filename Undo/Redo plus slim navigation and one visible fullscreen; final9app cases/12PDFscreens pass. Share bridge, final allocation elsewhere, common Options/topbar/status and Quick edit remain.) |
| 2.31 | Third PDF mode Quick edit (sign, fill, mark up; the PDF itself cannot change) between View and Build. PDFs open in Quick edit. Click anywhere to type, drag to move, drop pictures and files (UI-RULES section 7) | Codex | doing (Oct22:shared single menu now in reader/Word;11+1app cases and3saved-note mode robot layouts pass. October25:PDF default Quick edit implemented, eight primary existing-controller actions; direct note/field/type/date/sign, draft/mode retention and recovered-answer header save pass. Six final Quick cases, nineteen integration cases, eleven units and six saved-file robot sessions;15screens reviewed. Stamp/common Options and full UI remain.) |
| 2.32 | Tool groups like Fusion/Word (UI-LAYOUT-PLAN section 3): 3-4 groups per tab, icon buttons, group name with ▾ under each group listing every tool in it (less used ones last); nobody adds tools themselves | Codex (new UI; owner, October 22) | doing (d9b73c5,Oct23:All nine tab foundations grouped (Oct23);View has eight primary controls/Less used,3View+Word-count saved-copy layouts pass,24screens viewed;19regressions+2final closure/output cases pass across runs. Earlier rail/tabs/measurement evidence retained. Oct26:Comment has eight primary controls and rare group menus, removes duplicate row;3final exact note+line robot layouts pass. Final allocation elsewhere, common Options/topbar/status remain.) |
| 2.33 | Each Build tab holds the tools listed in UI-LAYOUT-PLAN section 3 | Codex (new UI; owner, October 22) | doing Oct26:Export five primary actions, complete rare menus and responsive large-text names; three saved-output replays pass,12screens viewed. Shared Edit-copy/thin-lines allocation requested from Claude. |
| 2.34 | Document editor follows the same parts and drop-down rule (UI-LAYOUT-PLAN section 5) | Codex (new UI; owner, October 22) | doing (Oct22: one shared mode menu wired in Word; 4/4 built-app cases including saved-output robot at both sizes and 150%; nine screenshots reviewed. Oct26:responsive Text/Paragraph panels with live controls;14/14 app cases,three independently verified formatted-DOCX robot replays,16screens viewed. Header/common status and final wide layout remain pending.) |
| 2.35 | Tools work at once with their default (mouse, Enter finishes, Esc stops; tools stay on); the same side panel for every tool with Save as my default / Reset and a Tool defaults list in Settings (UI-RULES section 7) | Codex (new UI; owner, October 22) | doing (Oct23: measurement Options beside page,3saved-ledger/cancel layouts pass; October25:common fixed header/footer/scroll area and resize applied to six main-page tool panels; bounded marking appearance defaults/Reset + Settings list built.19final app cases,5units,nine saved-output robot actions/three layouts pass;12screens reviewed. Remaining tool defaults/action footer and large-text Build density pending) |

| 2.36 | Contained lower-detail Windows scan renderer (SCAN-LOW-DETAIL-FALLBACK-PROPOSAL-2026-10-22.md) | Codex, coordinate shared integration with Claude | deferred AFTER beta by owner October22; do not add before beta. Beta uses100million input cap + exact failure message, canvas stays16million. |
| 2.37 | P0-12: explicit Continue with this copy after saving; preserve current file until chosen | Codex UI / Claude independent chain | doing Oct26:common native-token receipt, guarded reopen, Keep focus and changed-file refusal built. Latest9app/3robot layouts and5units pass;12screens viewed. Word first-save now aligned in the follow-up (6PDF/Word robot actions/3layouts,18related app cases). Oct28:X3 Show in folder uses f1946ad token-only bridge;8app cases/4saved-output robot layouts/4native units pass,6screens reviewed; missing/replaced copies refused and Enter focus retained. Claude compress→continue→sign and route audit remain. |
| 2.38 | W1 ordinary-copy review tick removal; preserve checked preview and native disk verification | Codex UI / Claude independent review | October28: batch0a46837; matching native/Office/image/group/filter/keyboard UI f5d0bba; final export/takeoff/tag/repair/portfolio/request UI9debe7f. Latest16four-layout robot workflows,4app specs and4request cancel/readback workflows pass. Real privacy/import/signing/calibration/edit consent stays. Final screenshot/full-suite acceptance pending; UI-CURRENT-START-HERE is the source/evidence index. |

### Owner addition — October28 unified Build (7b66a3a)

Codex: same ordered File/Home/Insert/Edit/Review/Fill & Sign/Pages/View/Protect/Measure/Export tabs on PDFs and documents; grey unavailable tabs with reasons. Home holds every text tool, other tabs keep labelled icon tiles; remove tab-row Name, use title rename; Quick edit has no tabs. Mockup is conceptual, preserve appearance.

**Doing:** first slice28dd4dc now passes locally: draft title/next-copy name and Home Spacing;11app cases with saved-output robot actions,2native units,16screens viewed. Initial WIPf2fbf16 is superseded by this verified slice; native naming support5d13dd4/4115da0. No completed unified-layout/package claim. Owner chose next-copy name only (October28); original path/name untouched. Primary save-copy/Word/text native naming option5d13dd4/4115da0 is committed; frontend primary PDF/Word copy naming verified at4layouts; remaining unified layout still pending. Service-specific naming follow-up requested of Claude. Full common-tab/PDF Home integration remains. See newest HANDOFF for exact claims/commands.

## 6. Testing, fixing and planning (Claude's main job, owner October 22)

| # | Item | Who | Status |
| --- | --- | --- | --- |
| 6.1 | Finish 2.18 (Fill and sign on the open page) and fix the 6 failing app cases from Codex's October 22 full run | Claude | done (a27244c; the 5 forms/click-to-type failures fixed; the recovery.spec failure did not repeat: 20/20 locally) |
| 6.2 | Review every new-UI change by eye (screenshots at normal and small laptop size) against UI-RULES and the mockup; write what to fix in HANDOFF.md | Claude | ongoing; October 23 review of the grouped reader toolbar in HANDOFF (6 points) |
| 6.3 | Robot tasks and app tests for the new UI: keep the robot working through each change; add tasks for the mode button, tool groups, side panel defaults, click to type and drag and drop | Claude (Codex updates the tests its own change breaks, rule 1) | ongoing; Codex's 22 new-UI robot tasks switched on (1112725) |
| 6.4 | Full local app runs after each big UI change; spare-PC robot runs on new packages; sort every failure to the right owner | Claude | ongoing; October 23 full local run 161/170, 6 real failures sent to Codex in HANDOFF |
| 6.5 | Fix bugs found by testing: in Claude's and shared files directly; in files Codex is working in, send Codex the exact steps in HANDOFF.md | Claude | ongoing |
| 6.6 | Keep the plan, START-HERE status, rules and guides current; the beta tester guide; the beta package (5.3) and the two beta cloud runs | Claude | ongoing |

## 5. Release

| # | Item | Who | Status |
| --- | --- | --- | --- |
| 5.1 | Install and uninstall test on the spare PC | Claude | done (package d207b695: install 208 s, robot 8/8 on the installed app, uninstall 76 s leaves nothing; Start menu shortcut now "PDFix"). Install speed could improve. |
| 5.2 | Acrobat and Office compatibility folder | Claude | ready for the owner: releases/compatibility-check-2026-10-21 (18 outputs + CHECKLIST.txt; not in git) |
| 5.3 | v1 beta package | Claude | todo |

October27 Codex: unified History X11/X15 UI complete locally;8unit/9app checks pass,10screens viewed. Evidence unified-history-2026-10-27. Claude independent review remains.

**Codex October 27 UI progress:** shared header tool search completed locally: three mode/mark/save-output workflows, all nine screenshots reviewed. Word options next. Overall UI final pass remains open.

**Codex October27, 2.34:** Word side Text/Paragraph options locally verified (three exact-formatted-DOCX replays, close/focus/resize/modes). File/Layout/Review no longer repeat Home formatting. Contextual picture/table panels remain; UI final pass still open.

**Codex October27 UI follow-up:** Comment duplicate Save removed; header save remains, seven primary controls, matching robot tasks updated; eight output/cancel/geometry workflows pass, thirty screenshots reviewed. A1 of UI-95 finish list resolved locally. Compact saved receipt queued behind Claude build.

**Codex October27 layout checkpoint (approximately90% implementation estimate):** shared header tool search0c55e4d; Word live side options366f0b4; one Comment save8a7f20c; responsive saved receipt and wide large-text Word folding locally verified next. History/status previously committedd3db070/c500b39. Remaining layout work: contextual picture/table options and Word panel rail, unified selection methods/defaults, final group/name/fit consistency, complete populated-screen small/large-text tour. Then broad bugs/full local suite and Claude independent review. This estimate does not replace the audit evidence/readiness score.

**October27 checkpoint commits:**0c55e4d /366f0b4 /8a7f20c /c18a1c5. All Codex source/check changes committed; optional extra continuation replay canceled before launch behind active Claude lease. Final Word3/3, PDF receipt3/3, Comment8/8 and focused units7/7 pass. Remaining list and exact evidence limitations in newest HANDOFF entry.

**Codex October27: approximately95% main UI layout implementation checkpoint.** Contextual Word picture/table options and object rail d535840; final wording and closed-table typing follow-up verified17mixed cases plus4final layout/output cases. Sixteen final Word screenshots reviewed. Final5% is the ordered list in newest HANDOFF; explicit newly confirmed gap: Fill-and-sign checked-result panel still shows a second small PDF reader, so its review state is NOT layout-complete. A-UI-PICTURE-PAINT/SOURCE-PAINT remain. Full suite and independent Claude review pending; percentage is not readiness.
