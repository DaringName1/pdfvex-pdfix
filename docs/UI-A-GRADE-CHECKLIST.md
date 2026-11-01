# UI checklist: from B− to A (October 26, 2026)

**Last independent grade (October26):** B− (Claude, from commit 11ff352). This is a historical baseline, not a grade of the October28 UI. See [the current index](UI-CURRENT-START-HERE.md) before reviewing newer commits.
- look: B
- following the owner's plan: B+
- ease of use: C+
- finished: C
- quality and testing: A−

**Goal:** an A before the beta.

**Rules:** [UI-RULES-2026-10-22.md](UI-RULES-2026-10-22.md). **Layout:** [UI-LAYOUT-PLAN-2026-10-22.md](UI-LAYOUT-PLAN-2026-10-22.md).
**Mockup:** [mockups/final-2026-10-22/](mockups/final-2026-10-22/README.md).

**How it's used:**
- **Codex builds and fixes.** Codex ticks an item only when it's committed with its tests updated.
- **Claude checks.** Claude confirms an item from screenshots of the committed build, never from unfinished changes.
- **A page is "finished"** when every item for it is ticked by both. Codex writes "finished: <page>" in HANDOFF.md.

Legend:
- `[ ]` open
- `[C]` Codex says done (commit id)
- `[✓]` Claude confirmed (date)

## 1. Must fix (stops an A)

**Top bar (every PDF screen)**
- [C] Undo and Redo next to the file name for active inline reader tools, Word and native source text (3a991cc; evidence header-history-2026-10-26). Standalone dialogs retain scoped history; full integration pending (SHARED-PLAN 2.27).
- [C] PDF Find, Save a copy and Print remain top right across modes (reader-file-actions coverage plus tool-search-2026-10-27); Share stays hidden until a real Windows share
      exists (no dead button).
- [C] Header Find a tool replaces Actions in every mode (0c55e4d; three exact-saved-comment robot replays, nine screenshots reviewed).
- [C] One visible window-fullscreen icon; PDF-only presentation retained by name in View > Zoom and turn > Less used and Ctrl Shift Enter (October26; navigation-bar-2026-10-26).

**Toolbar**
- [C] Page/zoom/Fit actions share the slim unboxed style; page number stays a numerical input (October26; navigation-bar-2026-10-26).
- [C] Common Fit width in every PDF mode; distinct Fit page remains available (Oct28; fit-fdf-ui-2026-10-28:4 app cases,8 saved-output robot layouts,8screens reviewed). Independent Claude check pending.
- [C] (9dd5b4b) "Hide names" / "Show names" sits at the far right in every mode (today it floats in the middle of Quick edit).
- [C] (October26 Quick/Escape commit) "To change the PDF itself, switch to Build" becomes a **Switch to Build** button.
- [ ] No tab has more than 8 buttons, and no button name is longer than two lines. Export today has 10 buttons with
      three-line names.
- [C] Tools allocated to their current tabs: thin-line inspection in Measure (b057aba); editable document copy in Edit/Text (f5d0bba), matching menus/specs/master robot replay.
- [ ] Each group's ▾ lists **every** tool in that group, with less-used ones last under a "Less used" line. It doesn't
      just repeat the visible buttons (today Edit ▾ lists its 3 buttons only).
- [ ] Short screens (700 px high) fold to icons, with "Show names" at the right.

**Tools and the side panel (UI-RULES section 7)**
- [ ] Every tool works at once with its default: mouse on the page, **Enter finishes, Esc stops**.
- [ ] **Esc closes** the side panels (Compress, Redact and the others); today only × does.
- [ ] One side panel, the same for every tool:
  - [ ] the tool's name and one line on what it does at the top
  - [ ] its settings in the middle
  - [ ] **Save as my default** / **Reset** at the bottom
- [ ] A Tool defaults list in Settings.
- [ ] Panels close and reopen without losing their tool or settings (2.25).
- [ ] Type on the page: click with a text tool, double-click otherwise.
- [ ] Drag and drop on the page: pictures and files onto the page; moving marks and text boxes by dragging.
- [C] (c92e7fc + Word follow-up; independent chain tracked in HANDOFF) **Continue with saved copy** button after a save (the backend is ready: `openSavedCopy(continueToken)`, see HANDOFF.md).

**Status bar (2.26)**
- [C] Common position/zoom/tool/selection/editing state in reader/Word/source (Oct27; shared-status-2026-10-27). Word editing position explicitly differs from final exported page count.

**Messages**
- [ ] No engine wording on screen ("Pages tree contains circular reference", "unknown encryption method"). Say what
      happened and what to do, in plain words.
- [ ] Save a copy and Print are disabled when a PDF couldn't be read.
- [ ] The View scan banner doesn't point to a button View doesn't have.
- [C] Version history shows512MB and one native newest-first list; earlier entries read-only, backups copy-only (Oct27; unified-history-2026-10-27).

## 1b. Confusing behaviours to remove (owner, October 26: "no weird things that confuse people")

**X3 implementation, October28:** common saved-copy receipt includes Show in folder through the native continueToken bridge, without switching files or consuming Continue. Narrow/150% wrapping and keyboard focus covered; missing/replaced copies refused. Built-app and saved-file evidence in saved-folder-ui-2026-10-28; independent Claude confirmation remains.

Each item is something a person would find surprising. Every one must be fixed or explained on screen before an A.

| # | What happens today | What people expect | Fix | Owner | Rank |
|---|---|---|---|---|---|
| X1 | **After "Save a copy", the window stays on the original.** The next tool works on the original, not the copy just saved (compress, then sign → the signed file is not compressed) | To keep working on what they just saved | After every successful save, show: *"Saved as <name>. [Continue with this copy] [Keep working on the original]"*. **Continue** calls `window.pdfix.openSavedCopy(result.continueToken)` (backend ready, 77e8395). Never switch files silently | Codex (button); Claude (robot chain test) | **P0** |
| X2 | **Only 2 of 29 save routes offer to open what was saved** (remove password → "Open unprotected copy"; new document). The other 27 don't | The same choice after every save | Use the X1 message everywhere; the two existing buttons get the same wording and behaviour | Codex | **P0** (with X1) |
| X3 | **Which file am I in?** After saving a copy, the header still names the original, with no hint that a copy exists | To see the file name of what they are editing, and where the copy went | Header shows the open file's name. The "Saved" message names the copy, with **Show in folder** | Codex | P1 |
| X4 | **Ctrl+S on an unchanged PDF does nothing**, with no message (tested 10-25) | Ctrl+S always does something | Ctrl+S on a PDF = Save a copy; if nothing changed, say "No changes to save" | Codex | P1 |
| X5 | **A PDF can never be saved over; Word/RTF/text can.** Same button names, different results | To understand why there's no plain "Save" for PDFs | Once, the first time: "PDFix keeps your original PDF safe and saves your changes as a copy." The button always reads "Save a copy" for PDFs | Codex | P1 |
| X6 | **Escape doesn't close side panels**, but closes menus | Esc closes what's on top | Esc closes the top panel (asks first if there's unsaved work) | Codex | P1 |
| X7 | **Engine and technical messages:** "Pages tree contains circular reference", "unknown encryption method", "Choose a folder on a local NTFS drive", "isolated / contained" wording | Plain words and what to do next | Rewrite (about 100 strings; the reader ones first) | Codex (reader), Claude (backend) | P1 |
| X8 | **Saving to a USB stick or SD card is refused** (FAT32/exFAT) with the NTFS message | It just saves | A safe fallback, or "This drive can't take a safe copy. Save to Documents first, then copy it" | Claude | P1 |
| X9 | **Running PDFix from inside the zip / a temporary folder:** the installer fails, or saving fails | It works, or says why | The installer guard says "Extract the zip first"; the release notes say it too | Claude | **P0** (installer) |
| X10 | **Watched folders are disabled when PDFix itself lives in a cloud-synced folder** | It works | A clear message on the disabled controls naming the cause (exists) plus the fix: "Install PDFix normally" | Claude | P2 |
| X11 | **Version history hides versions made before the file changed elsewhere** (only the kept unsaved work shows since 932355e) | To see all their versions | A "Versions from before this file changed" group, shown read-only with a warning | Claude | P2 |
| X12 | **Different "fit" names** ("Fit page" in View, "Fit width" in Build); **two full-screen buttons**; **"Actions"** is vague | One name per thing | See section 1 | Codex | P1 |
| X13 | **Find a tool only in Build.** In Quick edit and View there is no way to search for a tool | Search for any tool from anywhere | "Find a tool" in every mode; choosing a Build tool switches to Build | Codex | P1 |
| X14 | **Several ticks and steps for every save** (preview → "I checked" → Save) | Save is one step | Owner decision W1: one tick only where a mistake can't be undone | Owner, then Codex/Claude | P1 |
| X15 | **"Version history" and "Saved file backups" sit in one dialog with different rules** (20 versions vs 5 backups) | One history | One list, newest first, each labelled "edit version" or "saved file"; plain explanation | Codex (UI), Claude (backend) | P2 |

**How we make sure none are left:**
- Claude's final UI pass (section 6) walks the section 3 jobs and chains (compress → sign, fill → protect, combine →
  numbers) and lists anything surprising.
- After the beta, the AI human testers and real people look for the rest (AI-HUMAN-TESTING-PLAN.md).

## 2. Must exist (planned pages not built yet)

- [ ] **Home:** stays as it is, plus recent files with small previews and pinned files (setting: Off / On hover
      (default) / Always) (2.19).
- [ ] **Files:** thumbnails, "Ask about files" setup, drag and drop (2.7).
- [C] **Word editor:** shared mode button, grouped responsive toolbar, status/header and selection options; heading navigation in Build/View33939d9. Four heading/object saved-DOCX layouts pass; independent Claude acceptance pending (2.34).
- [C] **Right-edge panel bar:** reader pages/outline/search, direct saved-source Comments72ee63c, active Options fold/restore; Word picture/table and heading navigation33939d9. Saved-output and focus workflows pass; independent Claude acceptance pending.
- [ ] **Small always-there buttons** (Google Docs style) only for actions used all the time, and only on short
      screens or where the plan says so.

## 3. Ease-of-use bar (what makes it an A and not a B)

- [ ] A first-time person can do these **without help** (checked by a first-time tester, or the owner's dad on the
      private beta):
  - [ ] open a PDF
  - [ ] sign it
  - [ ] fill a form
  - [ ] add a note
  - [ ] save a copy
  - [ ] print
  - [ ] find a word
  - [ ] shrink a file
- [ ] Every common job takes **no more steps than Acrobat Reader's** (sign: open tool, place, save).
- [ ] Saving needs **one tick at most**, and only where a mistake can't be undone (Redact, remove hidden data). This
      Owner approved W1 October27: no ordinary-copy tick; one for Redact/Remove hidden data. Rollout and independent verification remain.
- [ ] Nothing important is only inside a drop-down when it is used often.

## 4. Look and polish

- [ ] Same spacing, icon size and font sizes in every tab and mode.
- [ ] Nothing overlaps or gets cut off at 1366×820, 1366×700, 800×620 and 150% text size.
- [ ] Every icon is clear without its name, or the name is shown.
- [ ] Your logo and colours everywhere, matching the mockup.
- [ ] Keyboard: every button and menu reachable with Tab, with a visible focus ring; Esc closes menus and panels.

## 5. Quality (keep the A−)

- [ ] Every UI commit updates its tests and robot tasks in the same commit (SHARED-PLAN rule 1).
- [ ] Full app suite: 0 failures on the final commit. Robot: replay and a 30-step random run clean.
- [ ] Narrator smoke test: open, find a tool, save. Each control is read out with a sensible name.

## 6. The final pass (both, before the UI is called done)

**Codex's pass** (on its last UI commit):
1. Tick every item above that is done; list any it decides not to do, with the reason.
2. Screenshots of every tab, mode and panel at the 4 sizes in section 4, each looked at.
3. Full app suite and robot pass; HANDOFF.md: "UI final pass done: <commit>".

**Claude's pass** (after Codex's, on a clean copy of that commit, never on unfinished changes):
1. Its own screenshots at the same sizes; each item checked by eye and marked `[✓]` or sent back with the reason.
2. Full app suite and robot on that commit.
3. A keyboard-only walk through the section 3 jobs, and the Narrator smoke test.
4. A grade per area (look, plan, ease, finished, quality) and an overall grade, with the reasons, for the owner.

**An A means:**
- every section 1 and 2 item `[✓]`
- section 3 done
- no open problem in section 4
- section 5 green

Anything not done by the beta goes on a written list for the owner to accept or move.

**Codex October27 checkpoint:** Word object options/rail and selected-picture resize d535840 locally verified at four layouts; final table-close/typing and wording checks17+4 (overlapping) pass. Do not mark the whole checklist complete. Fill-and-sign checked-output nested reader newly confirmed open (A-UI-FORM-REVIEW-DUPLICATE); source/selected-picture paint observations open. Main-layout estimate about95%; A grade still awaits full review.
