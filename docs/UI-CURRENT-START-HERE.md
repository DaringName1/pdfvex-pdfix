# Current PDFix UI: start here

> **October30 delivery: a7f1900.** [New exact-commit installer](../releases/PDFix-Setup-2026-10-30-a7f1900.exe); [evidence](evidence/codex/everyday-installer-2026-10-30/README.md); [current checkpoint](CODEX-RESUME.md). Packaged launch/hash checks pass; no installation/uninstallation performed. Prior installer retained. Full Beta release gates remain in V1-PLAN/TOOL-PLAN.

Updated October 29, 2026. This is an index to the shared project record, not another competing plan. Read this before reviewing, changing or packaging the UI. All paths below are inside the shared PDFix project.

## Current source and delivered installer

**Earlier accepted Comment slice, October29: `a74ec85`** — unused new comments disappear when finished, while existing note icons reopen for editing. Exact committed clean-source build passes **30/30** Comment/Highlight/markup/Quick edit checks; ten focused units pass. Both saved Comment copies are read independently. All49result screenshots inspected. [Comment evidence and receipt](evidence/codex/comment-flow-2026-10-29/README.md).

Earlier slices remain included: Quick edit adjacent method arrows `b8fb9ed`, on-page hints `d99619f`, ordinary word Highlight `2e2c3d9`, matching PDF/Word Home and Word icon tiles/Page setup `711d65f` (15/15 exact committed app checks and22formatting units). [Home evidence](evidence/codex/shared-home-2026-10-29/README.md).

Independent Claude acceptance, the full app suite and Beta1 readiness remain open. **The installed app is still03752e4.** Follow [V1-PLAN.md](V1-PLAN.md) / [TOOL-PLAN.md](TOOL-PLAN.md) for remaining everyday panels/names, persistent file tabs and file safety.

**Owner installation update, October28:** owner explicitly requested uninstall/reinstall after delivery. Normal uninstaller and installer both succeeded; all3779installed package hashes match build03752e4; desktop shortcut verified. [Installation receipt](evidence/codex/installer-2026-10-28-03752e4/installation-receipt.json). Earlier build-only status below describes delivery time. No app launch/full-acceptance claim.

**October28 delivery:** [PDFix-Setup-2026-10-28-03752e4.exe](../releases/PDFix-Setup-2026-10-28-03752e4.exe), built from exact commit03752e4. [Receipt](evidence/codex/installer-2026-10-28-03752e4/build-receipt.json). Codex owns Setup.exe delivery per the owner's October28 decision. [Reusable skill](skills/pdfix-build-delivery/SKILL.md); [Claude skill update](CLAUDE-BUILD-SKILL-UPDATE-2026-10-28.md). Build-only delivery: nothing installed/uninstalled; no full-acceptance claim.

The installed package is **03752e4**. Source has since advanced: common fit/FDF consistency **bfedcc8**, then the saved-copy Show in folder UI batch (see newest HANDOFF and git log). These source changes are not automatically installed. Build a clean intended commit when the owner requests another installer.

| Commit | UI change |
|---|---|
| 03752e4 | Signing-request dialog width/preview-height/sticky-save fixes; portfolio results use plain words with technical details folded. Four request cancel/readback and four portfolio exact-output workflows pass at four layouts; all12new screenshots viewed. |
| 9debe7f | FDF/XFDF export, takeoff/tag/repair/portfolio copies and signing-request PDF/email output use prepared-output readiness rather than a final ordinary-copy tick. Technical export/repair details fold away; dialog/preview sizing improved. Matching checks and robot callers included. Final screenshot review and full-suite repeat pending. |
| f5d0bba | Remaining native-copy/Office/image UI gates, Ctrl+S PDF copy/cancel, plain reader failures, compact local Filter tools, Edit/Measure allocation and matching robot/spec callers. |
| 0a46837 | Owner-approved batch native contract plus matching UI: exact prepared SHA-256 replaces human-reviewed boolean for three batch writers. Source, token, sandbox, disk and exclusive-copy checks remain. |
| 33939d9 | Word heading navigation beside the page in Build and View, actual caret navigation, matching saved-DOCX/object checks at four layouts. |
| b057aba | Shared registry: thin-line inspection belongs in Measure. |
| 72ee63c | Saved-source Comments on the reader rail; source/draft distinction; fold/restore active options; Draw method named Freehand. |
| 22f3800, a2f9f29, 6fc8178, 74fa1e4 | Earlier ordinary-copy caller migrations, source-preview paint/zoom, image/DOCX/PDF preview space, full-page Fill-and-sign checked-output proof. |

These commits build on the earlier grouped toolbar, Quick edit, Home/Files, header/history/status, Word toolbar and panel work already in main. Do not replace them with an older layout. See the shared plan for the older commit/evidence history.

**Source, test build and installed app are different.** The source above is committed. dist is a test build. Codex built the exact archived-source installer linked above and subsequently installed it at the owner's explicit request; later source edits are not installed. Claude independently reviews/tests; Codex owns Setup delivery. An existing desktop shortcut does not update merely because source changed. Check the build-source manifest before comparing screenshots from different packages.

## Read these in order

1. [Owner UI vision](OWNER-UI-VISION.md): why the app should feel calm and obvious.
2. [UI rules](UI-RULES-2026-10-22.md), [layout plan](UI-LAYOUT-PLAN-2026-10-22.md) and [approved mockups](mockups/final-2026-10-22/README.md): design intent. Later explicit owner decisions below supersede older examples.
3. [Shared plan](SHARED-PLAN.md): the single ordered work list and current owners. [Handoff](HANDOFF.md): newest entries first, done/next/needs.
4. [A-grade checklist](UI-A-GRADE-CHECKLIST.md) and [finish list](release/UI-95-FINISH-LIST.md): acceptance work. An unchecked old description is not proof that the current code still behaves that way; check its dated implementation/evidence first. Codex marks its work; Claude independently confirms it.
5. [Known issues](KNOWN-ISSUES-2026-10-13.md), including newer entries at the end; [whole-app audit](V1-WHOLE-APP-AUDIT-2026-10-18.md): remaining risks and evidence boundaries.

The October 15 baseline, October 18 walkthrough and the two old agent handoff files are history. They are not the current work queue. The October 21 direction's initial PDFs-open-in-View rule was replaced October 22.

## Owner decisions to preserve

**October28 update (7b66a3a mockup):** Build is to use the same File/Home/Insert/Edit/Review/Fill & Sign/Pages/View/Protect/Measure/Export tabs on PDFs and documents; Home has all text controls, other tabs use labelled icon tiles, no tab-row Name box, Quick edit stays without tabs. This supersedes the older separate tab lists below. Existing-file title edits set the next copy name only. First naming/Spacing slice28dd4dc verified; complete shared tabs/PDF Home formatting remain to build. Evidence: copy-title-spacing-2026-10-28.

- Keep PDFix's colours and calm appearance. Improve how it works, with the document central and options beside it. No new workspaces now; Bluebeam expansion and the 30 add-ons remain deferred.
- PDFs open in Quick edit. View is for reading; Build exposes the complete editing toolbar. Word/new documents open in Build. One mode menu; switching retains work; fullscreen is separate.
- Build tabs: File, Home, Insert, Edit, Review, Fill & Sign, Pages, View, Protect, Measure, Export. Named groups, common tools visible, all group tools in the group menu, rare ones under Less used. Names collapse on short screens, with Show names available.
- One tool/controller per function. Home, All tools, search, menus and shortcuts call the same tool. Text methods are Click to type, Edit existing and Text box. Main-page tools should not open a second miniature PDF editor.
- Global header search is Find a tool. The reader's local toolbar search is **Filter tools** as of f5d0bba. Older screenshots showing two Find a tool fields are not instructions to restore that duplication.
- Editable document copy is under Edit > Text > Less used; thin-line inspection is under Measure > Measure > Less used. Shared names come from the tool registry.
- October 27 W1: ordinary copy saves have no final review checkbox. Keep real previews and native/source/disk verification, Saved and Continue with this copy. Redact and Remove hidden data keep one confirmation. Password entry is repeated and the saved result reminds the person to keep the password safe.
- W1 does not remove actual signing authorization, foreign/untrusted import or extraction consent, calibration/calculation approval, tag classification, geometry/mapping choices or the signing-note/repair-risk acknowledgements. Never hide a checkbox and send a fabricated reviewed=true flag.
- The three batch native receipt changes were explicitly approved by the owner; use matching UI and backend, not only one side of that change.
- Large scans: owner approved the bounded 100-million-input-pixel cap; canvas remains bounded. On memory/render failure show the exact plain scan-memory message. The proposed Windows lower-detail renderer is after beta, not approved for implementation before beta.

## Code map

| Area | Main source |
|---|---|
| Shell, Home, Files, shared names | src/app.js, src/workspace-rooms.js, src/tool-registry.js |
| Reader mode/tab foundation | src/pdf-reader-toolstrip.js and CSS; src/reader-home-ribbon.js |
| Grouped tools | src/reader-view-ribbon.js, reader-editing-ribbons.js, reader-pages-ribbon.js, reader-output-ribbons.js; src/markup-workspace.js |
| Header Find/Save/Print and PDF Ctrl+S | src/reader-file-actions.js and CSS |
| Right rail and saved comments | src/reader-panel-rail.js, src/pdf-review-panel.js and their CSS |
| Word groups, selected picture/table options, headings | src/document-toolbar.js, document-compact-toolbar.js, document-object-options.js and their CSS |
| Shared history/status/copy result | src/header-history.js, document-status.js, version-history.js, saved-copy-receipt.js and matching CSS/models |
| Source/preview | src/source-preview.js and CSS |
| Current copy-save rollout | docs/COPY-SAVE-REVIEW-ROLLOUT-2026-10-27.md; files and callers in the commit tables above |
| Matching robot/checks | scripts/user-robot/actions-codex*.mjs; tests/desktop; scripts/check-reader-*.mjs; scripts/check-tools-signing-request.mjs |

The master robot's scheduling, seeds, step counts and reporting were not changed. f5d0bba changes only five approved UI lines: three Office saves, PDF image-save readiness, and the editable-copy menu. 9debe7f updates the matching native-action module; the master signing-request action passes unchanged.

## Real screenshots and checks

All evidence is under docs/evidence/codex. These are actual built Electron screenshots, not the HTML mockups.

| Folder | What it proves / limits |
|---|---|
| [comments-rail-2026-10-27](evidence/codex/comments-rail-2026-10-27/) | Saved-source comments rail and restored draft options; three final exact-output workflows, nine final screens personally reviewed. |
| [ui-closeout-2026-10-27](evidence/codex/ui-closeout-2026-10-27/README.md) | Word heading/object four-layout evidence, preserving/native-copy layouts, Office/menu replays and full-baseline failure evidence. README separates final from earlier screenshots. |
| [leaf-copy-ui-2026-10-28](evidence/codex/leaf-copy-ui-2026-10-28/README.md) | Latest ordinary-copy batch: 16 final robot workflows/four layouts, four related desktop specs, four signing-request cancel/PDF/email-readback workflows and unchanged master action. All20frozen and4old request screenshots personally reviewed. Narrow signing layout found and corrected in03752e4; its8new request screenshots supersede the4old ones. |
| [mockups/final-2026-10-22](mockups/final-2026-10-22/README.md) | Approved reference designs, not proof of implemented or tested behavior. |

The Build-mode screenshot shown to the owner in chat was comments-rail-2026-10-27/final/0/header-reader-saved.png. It shows the Comment toolbar/options. Its local search caption predates the Filter tools rename; do not revert current code to match that older caption.

## What is not finished

- Fit/FDF consistency is fixed locally inbfedcc8:4app cases,8saved-output robot layouts and8screens viewed. Show in folder now uses Claude's token-only bridge; dedicated saved-copy/output and changed/missing-file tests are recorded in saved-folder-ui-2026-10-28. Independent acceptance remains.

- Codex reviewed all20frozen leaf-copy and4old request screenshots, then all12signing/portfolio polish screenshots. Claude's independent clean-copy UI review remains required.
- The complete local suite on app-source snapshot03752e4 **finished:253passed,1failed,2skipped (256cases)**. Failure: tests/desktop/forms.spec.js:13:1, guided fields/typed signing/preserved editable copy. The owner requested the installer without further tests/repairs. This is not an all-green result.
- The broad keyboard/Narrator/first-time-user acceptance and the remaining checklist items are not automatically cleared by focused saved-output tests. No 100% UI/A-grade claim yet.
- Claude supplied the safe revealSavedCopy(continueToken) bridge inf1946ad; the saved-copy UI calls it without sending a path. Independent review, native sandbox1.8 follow-up and release acceptance remain.
- Large-file memory, physical printing, outside Acrobat/Office compatibility and release acceptance remain separate from UI coding. No claim that these focused UI checks prove them.

## Coordination and testing

Codex owns current UI implementation throughout the app, per the owner's October 22 decision, and Setup.exe delivery per October28. Claude owns independent checking, backend/integration and the spare PC. Read claims in HANDOFF before editing a file. Commit own paths only; never sweep up the other agent's work.

Build only through node scripts/agent-build.mjs <agent>. App checks only through node scripts/agent-run.mjs <agent> -- <command>, hidden, temporary profiles. Do not build while your own check is running. No cloud runs until the agreed beta gate. Claude controls spare-PC use. Do not change production graphics/security settings, publish, sign or package merely to review this UI.

Essential decisions, code and retained evidence are in this shared folder. Scratch logs under tmp are not the canonical handoff. Git history lives outside Drive at C:/Users/andre/pdfix-repo.git as required by AGENT-WORKFLOW; use git on this PC to inspect it. Other computers need their own repository setup, not this machine's external .git pointer.
