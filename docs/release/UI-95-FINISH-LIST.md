# Finishing the UI from 95% (October 26, 2026)

**When this list is used:** when Codex says the UI layouts are about 95% done (owner, October 26). From then on,
Codex and Claude both work on the last 5% at the same time, so it gets finished before the beta.

**Built on:** [UI-A-GRADE-CHECKLIST.md](../UI-A-GRADE-CHECKLIST.md) (the full A list; this file doesn't repeat its
wording) and Claude's screenshot reviews in HANDOFF.md.

## How two agents work on it at once without getting in each other's way

1. **Claim before starting.** Each agent writes "taking: <item number>, files: <list>" in HANDOFF.md before it
   starts an item. Nobody edits a file the other has claimed.
2. **Lanes stay the same.** Codex: screens, toolbars, panels, menus and their tests. Claude: backend, saving and
   recovery, messages from the main process, tests, robot, packaging. Claude takes a screen item only when Codex
   hands it over in HANDOFF.md, naming the files.
3. **Small finished commits.** Each item is committed on its own with its tests updated (SHARED-PLAN rule 1), so the
   other agent can test it straight away.
4. **One app-test lock** (`scripts/agent-run.mjs`, now owner-checked). Claude tests only committed work, on a clean copy.
5. **A UI freeze** on a date the owner picks (suggested: October 29). After it, only fixes for failing tests or
   broken behaviour.

## A. Screen fixes (Codex unless handed over)

**From Claude's October 26 screenshot review** (details in HANDOFF.md):

| # | Fix | Rank |
|---|---|---|
| A1 | Codex done locally (8a7f20c): one header Save a copy; matching robot actions/specs updated, 8/8 focused cases | P1 |
| A2 | One "saved" message per save (the "Continue with this copy" banner, not also a toast) | P1 |
| A3 | Tool names shown by default where there is room; icons only on short screens | P1 |
| A4 | 800×620 and 150% text: the search row and the saved banner leave too little room for the page and panel | P1 |
| A5 | One full-screen button; Undo and Redo on one row, same size; "Fit width" looks like a button | P1 |
| A6 | Draw menu: first item says what it does ("Pen" or "Freehand"), not "Draw" again | P2 |
| A7 | Codex done locally (8a7f20c): recovery message now says Saving your work on this computer | P2 |
| A8 | Build after Quick edit ▸ Fill form keeps the Fill and sign panel open: decide whether Build starts clean | P2 |

**Still open in the A checklist, section 1** (tick there when done):

| # | Fix |
|---|---|
| A9 | Undo/Redo next to the file name, the same in every tool |
| A10 | Find, Save a copy, Print always top right; no dead Share button |
| A11 | Codex done locally (0c55e4d): Find a tool in all modes, Escape restores focus |
| A12 | One button style on the second row; one name for the fit button in every mode |
| A13 | No tab with more than 8 buttons or names longer than two lines (Export) |
| A14 | Tools in the right tab (thin lines → Measure) and every group's ▾ lists all its tools, less-used last |
| A15 | Short screens (700 px high) fold to icons |
| A16 | Every tool: Enter finishes, Esc stops; **Esc closes side panels** (X6) |
| A17 | One side-panel layout for every tool (name and one line at the top, settings, Save as my default / Reset) |
| A18 | Tool defaults list in Settings; panels reopen with their settings |
| A19 | Status bar the same in the reader and the editor (page, zoom, selection, saved or not) |
| A20 | Save a copy and Print disabled when a PDF couldn't be read; View scan banner points to a real button |

**Confusing behaviours still open (A checklist 1b):**

| # | Fix | Who |
|---|---|---|
| X2 | "Continue with this copy" after **every** save route, not only the ones done so far | Codex (UI), Claude (checks each route) |
| X3 | Header shows which file is open and where the copy went | Codex |
| X4 | Ctrl+S on a PDF = Save a copy; "No changes to save" when nothing changed | Codex |
| X5 | One-time note: "PDFix keeps your original PDF safe and saves your changes as a copy" | Codex |
| X7 | Reader (pdf.js) engine messages in plain words; main-process messages are done (2a41df1) | Codex |
| X10 | Watched folders: the disabled controls say why and what to do | Claude: **done (f615d77)**, plain message plus "Install PDFix" step |
| X11 | Version history: "Versions from before this file changed" group | Claude backend **done (942344e)**: `earlierVersions(id)`, `loadEarlierVersion(id,versionId)`; Codex: show the group |
| X12 | One name per thing: covered by A5, A11, A12 | Codex |
| X13 | "Find a tool" in every mode | Codex |
| X14 | Fewer save ticks (W1 approved October27: no ordinary-copy tick; one for Redact/Remove hidden data) | Owner, then both |
| X15 | Version history and saved-file backups in one list | Claude backend **done (bc95c12)**: `documentHistory(id)`; Codex: one list on screen |

**Pages still to build (A checklist section 2):** Home recent files with previews; Files (thumbnails, drag and drop);
Word editor in the same layout as the PDF screens; right-edge panel bar. Codex's own list also has: Export/Edit/Measure
allocation, the common header and history, and the compact Word toolbar.

## B. Testing and finishing (Claude)

| # | Task | Needs |
|---|---|---|
| B1 | Full app suite and robot (replay, 30-step random, saved-copy chain) on each finished batch, clean copy | Codex's commit |
| B2 | Check each A and X item by eye at 1366×820, 1366×700, 800×620 and 150%; tick `[✓]` or send back with the reason | Codex's commit |
| B3 | Keyboard-only walk of the 8 everyday jobs, and the Narrator smoke test | UI freeze |
| B4 | Release package: install, robot on the installed app, upgrade over the old package, uninstall. **Install, upgrade, uninstall done October 27 on the spare PC (all new-version checks pass, 1164ff8 and later); robot on the installed app still to do on the final package** | Spare PC, or owner's OK for this PC |
| B5 | Downloaded-zip test with the tester package (SHA-256, Extract All, SmartScreen, first start). **Done October 27 (spare PC, offline-marked download); repeat on the final package** | Spare PC |
| B6 | Recheck "saving from a temporary folder" (P1-3) on the spare PC. **10-27: the related startup crash with a short 8.3 temp folder was found and fixed (1164ff8); the save recheck is still due on the final package** | Spare PC |
| B7 | Saved copies open correctly in Acrobat Reader and Foxit | Owner's OK to install them |
| B8 | Real USB stick save: **done October 27** (`tests/desktop/usb-save.spec.js` 3/3 with PDFIX_USB_FOLDER; trimmed package also starts from the stick, 3,776 files checked) | A USB stick |
| B9 | Final grade per area and overall, with reasons, for the owner | After B1–B3 |

## C. Owner decisions that unblock the last 5%

1. The UI freeze date (suggested October 29).
2. W1 decided October27: Owner decision October27 (W1): ordinary save-a-copy actions have no review checkbox. Keep previews, native/output/disk verification, Saved and Continue with this copy. Redaction and hidden-data removal keep one confirmation. Password protection keeps repeated password entry, removes the extra review tick, and says “Keep this password somewhere safe” after saving. Cryptographic signing authorization and actual edit/calculation consent are separate from redundant copy-review ticks.
3. Spare PC: **back October 27** (B4/B5 run there). The Setup .exe is Codex's from October 28 (owner).
4. Acrobat Reader / Foxit install for B7. (USB stick: B8 done October 27.)
5. The Beta label for the 10 features not yet tried for real.

## D. Done means

- Every A and X item fixed and `[✓]` by Claude, or written down as "after the beta" with the owner's OK.
- B1–B3 green on the final commit; B4–B6 done on the release package.
- Claude's final grade given to the owner.
