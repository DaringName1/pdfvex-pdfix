# PDFix v1 plan: beta on October 31, then v1 (free Windows core)

Owner, October 28, 2026: "make me a final plan: what can and should get done before the 31st, and then the v1
release" — **v1 = the free core PDFix for Windows.** Not in v1: paid workspaces (Bluebeam-style shared projects and
sessions, add-ons) and macOS. Those come after v1.

**Most important (owner, October 28): the new UI — the new Home first — and the most-used tools must feel easy** — "it does not seem easy, no one will try it." Then: never losing files, every tool working, everything else. So Beta 1 puts the Tier 1 tools (open, find, save, print, Type, Highlight, Comment, Draw, Sign, Fill, select, undo) first: easy to find, easy to understand, few clicks, and safe.
Details for each item are in docs/TOOL-PLAN.md (Part 0 = file safety S1–S19, Part 4 = every tool, most used first).

**Who does what:**
- **Codex** builds the screens and steps (UI files), fixes UI problems found by testing, owns the Setup .exe and the
  packages.
- **Claude** tests every tool and every file-safety promise on clean copies of committed versions (outside Google
  Drive), fixes saving, recovery and other back-end problems, keeps the robot, the plan and the handoff current, and
  prepares the release paperwork.
- **Owner** decides the items marked **Owner**, and does the two things only a person can do (opening files in
  Acrobat/Office, emptying the Drive trash).

---

## Part A. Before October 31 — Beta 1 (Windows only)

Beta 1 is a version friends and testers can use for real work without losing files. It does not have to be perfect;
known problems are listed for testers.

### Must be done for Beta 1

| # | What | Who | Day |
|---|---|---|---|
| A00 | **The new Home tab for PDFs** (owner layout, October 28): every text tool on Home in compact groups — Style; Font (font, size, B, I, U, S, superscript, subscript, colour, highlight, clear); Paragraph (bullets, numbering, indents, Spacing menu, alignments); Find — working on PDFs the same way as in a new document, and the same Home in both. Other tabs keep the big icon + name tiles. Rename by double-clicking the file name | Codex UI committed711d65f (15/15 exact clean checks); Claude tests it on a clean copy the day it is committed: every Home button on a typed PDF text box, save, reopen, Undo/Redo, cancel | Oct 29–30 (first) |
| A0 | **The everyday tools feel easy** (TOOL-PLAN Part 4 entries 1–12): the standard job on one click with other ways in the ▾ (R5), one name per job (R6), the same panel layout (R7), "Click where you want to type" hints on the page and the pointer changing per tool (R9), changes shown straight away with Undo (R10). Target: each everyday job in no more clicks than Acrobat Reader | Codex builds; Claude walks each tool as a first-time user and counts clicks | Oct 29–31 (first) |
| A1 | **Finish the UI's last 5%:** keyboard, small windows (the 3 failing 800×620 tests), Esc in Settings, the saved-copy double message | Codex | Oct 29 |
| A2 | **Open files stay open** (TOOL-PLAN S19): Home tab + a tab per file, always visible; going Home never closes a file | Codex | Oct 29–30 |
| A3 | **Cancel never greyed out** (X1) and **one tool panel at a time** (X2) | Codex | Oct 29–30 |
| A4 | **Type / Sign / Date / Fill form in Quick edit** get small on-page controls instead of the 55-control panel; Fill and sign steps in order (fill → sign → save) (X4, X5) | Codex | Oct 30 |
| A5 | **Leaving with unsaved work always asks** in every Tier 1 tool (S7) | Codex | Oct 30 |
| A6 | **Crash tests for the Tier 1 tools** (S5, S6): kill the app with unsaved work and in the middle of saving, for Type, Highlight, Comment, Draw, Sign, Fill, Save a copy → original intact, no broken copy, work comes back. Fix what fails in saving/recovery | Claude | Oct 29 |
| A7 | **Update keeps everything** (S12): install the old package on the spare PC, make drafts/signatures/settings, install the new one over it, check nothing is lost | Claude (Codex provides both installers) | Oct 30 |
| A8 | **Compatibility folder rebuilt** (S14): 18 PDFix-made files + checklist, outside Google Drive | Claude | Oct 29 |
| A9 | **Owner opens the compatibility files** in Edge, Acrobat Reader and Word/Excel and ticks the checklist | **Owner** | Oct 30 |
| A10 | **Tier 1 tool walk, first thing on Oct 29** (ease first: can a first-time user do it without help? clicks vs Acrobat Reader) (TOOL-PLAN Part 4, entries 1–12): hand walk, button sweep, cancel and delete sweep on the newest commit; findings to Codex the same day | Claude | Oct 29–30 |
| A11 | **Fix the Tier 1 findings** | Codex (screens), Claude (saving) | Oct 30–31 |
| A12 | **Robot updated to the new UI** (its steps cause most of the ~2 failures per run) and an overnight run on the spare PC | Codex (its tasks), Claude (copies them, runs and reads) | Oct 29 night, Oct 30 night |
| A13 | **Final checks on the Beta 1 commit:** full app suite (0 unexplained failures), unit tests, overnight robot, install/uninstall on the spare PC, the two cloud runs the owner allowed for beta | Claude | Oct 31 |
| A14 | **Beta 1 installer** from the final commit, named with date and commit | Codex | Oct 31 |
| A15 | **Tester guide and known-problems list** updated (what works, what doesn't yet, how to report) | Claude | Oct 31 |

### Needed only if Beta 1 is public on GitHub

| # | What | Who |
|---|---|---|
| A16 | **Licence** (GPL-3.0 was suggested) | **Owner decides**, Claude adds it |
| A17 | **Private drawing not in the public copy:** public repository made from the upload copy only, never this history; check a fresh clone | Claude |
| A18 | Changelog, release notes, SECURITY.md, tag v0.1.0-beta.1, zip + SHA-256 | Claude |
| A19 | Installer not signed (Windows SmartScreen warning) — explained in the READ ME | Owner decides later; Claude writes the note |

**Owner decisions needed now:** (1) Beta 1 private (friends) or public on GitHub on October 31? (2) Licence if public.

### Not before October 31 (moved to v1)

Tier 2–4 tool walks, split buttons and one name per job on the *less-used* tools (the everyday tools get them in Beta 1), drawing on the page instead of typed
numbers, the remaining save problems (full disk, network/cloud folder gone, two windows), uninstall question, large
file certification, screen-reader test.

---

## Part B. After October 31 — v1 (free core PDFix for Windows)

v1 is done when a person can do every everyday and weekly job without help and without ever losing a file.

### 1. Never losing files (all of TOOL-PLAN Part 0)

| What | Who |
|---|---|
| Crash tests (S5, S6) for every Tier 2 tool: Organize, Combine, New document, Compress, Pictures/Scan to PDF, Edit text, Password, Stamp, Export, Redact, OCR, Page numbers | Claude tests and fixes saving; Codex fixes its routes |
| Save problems (S8): full disk, read-only folder, locked file, network or cloud folder gone, USB stick pulled | Claude |
| Two windows on the same file (S11); file changed by another program while open (S9); cloud placeholders (S10) | Claude |
| Signed PDFs warn in every tool (S15); damaged/too-big files refused clearly in every tool (S16) | Claude tests; Codex/Claude fix by lane |
| Uninstall asks what to do with drafts and signatures (S13) | Codex (installer), Claude (test) |
| Every saved file type opens in other apps (S14), rechecked on the final build | Claude + **Owner** |

### 2. Every tool working (TOOL-PLAN Parts 1–4)

| What | Who |
|---|---|
| Tier 2 tools (entries 13–27) walked and fixed to rules R1–R20 | Claude tests, Codex fixes |
| Tier 3 tools (28–40) walked and fixed | Claude tests, Codex fixes |
| Tier 4 specialist tools (41–50) labelled advanced; pass, or ship with listed exceptions the owner accepts | Claude tests, **Owner** accepts exceptions |
| Split buttons (R5) and one name per job (R6) on the remaining tools (everyday tools done in Beta 1); `node scripts/check-tool-plan.mjs` stays green | Codex builds, Claude checks |
| **No pop-up "subpages" (owner, Oct 30):** move pop-up tools into the one side panel beside the PDF, most used first: Password, Page numbers, PDF to pictures, Make searchable, Combine, then Signing request, Create fields, Print. The PDF on screen is the preview; one Save that checks by itself; advanced under More options | Codex builds the shared panel; Claude converts the weekly tools and tests each |
| Same panel layout everywhere (R7), plain words (R15), greyed buttons with reasons (R14), Esc and × everywhere (R2, R3) | Codex |
| Draw on the page instead of typing numbers (X10); no repeated tool lists inside panels (X11) | Codex |
| Robot task for every fixed tool (main job + cancel + delete); overnight robot clean | Claude (Codex for its own tasks) |

### 3. Ready for real users

| What | Who |
|---|---|
| First-time users walk the Tier 1–2 jobs with no help (the owner's after-beta tester plan); every hesitation becomes a fix | Claude runs, both fix |
| Beta testers' reports sorted and fixed | Claude sorts, both fix |
| Large files: memory and speed certified (big drawings, many pages) | Codex |
| Screen reader check (Windows Narrator/NVDA) on the Tier 1 tools | Claude |
| The intermittent "sandbox could not start" proven fixed or explained | Claude |
| Update from Beta 1 to v1 keeps everything (S12 again) | Claude |

### 4. Release

| What | Who |
|---|---|
| Final full suite, overnight robot, install/update/uninstall on the spare PC, two cloud runs — all on the v1 commit | Claude |
| v1 installer, named with date and commit | Codex |
| Release notes, user guide, known limits, licence, SECURITY.md | Claude |
| Code signing (removes the Windows warning) | **Owner decides** |
| Publish | **Owner** |

**Rough time after October 31:** about 2–3 weeks if both agents work every day (Tier 2 about 3–4 days, Tier 3 about
3 days, file-safety cases about 3 days, user tests and fixes about a week). This is an estimate, not measured; it
will be updated after the first week.

### Not in v1 (later)

Paid workspaces (shared projects, sessions, team review), macOS, add-ons, Bluebeam-specific tools beyond today's
Measure tab, AI features beyond the local "Ask about files", the scan low-detail renderer (deferred by the owner).

**Apple Pages, Numbers and Keynote files (owner, October 29):** real support — open a `.pages` file, edit its text,
headings and pictures, save as Word or PDF (and the same for `.numbers` / `.key`) — comes **after v1**. Until then
PDFix keeps refusing them with a clear message, improved to say how to get the file in: "This is an Apple Pages file.
Open it on iCloud.com (free, works on Windows) or in Pages, choose Export To → PDF or Word, then open that file in
PDFix." (Small wording change in src/formats.js / the open-file refusal — Codex's area.)

---

## Daily routine (both agents)

- Codex commits UI work in small pieces and writes in docs/HANDOFF.md what changed and what to test.
- Claude tests each new commit on a clean copy outside Google Drive, sends findings in HANDOFF the same day, and
  fixes saving/back-end problems in its own files.
- One app run at a time (scripts/agent-run.mjs lock); the automatic space cleanup keeps the folder small.
- Nothing is called "done" until it is tested on a committed version; known problems are always listed.

---

## The two lists: Codex and Claude on the same thing, in the same order

Both work down the same numbers at the same time: Codex builds item N, Claude tests item N the day it is committed
and fixes the saving/back-end part. The spare PC runs the robot non-stop on the newest committed version.

| # | Same goal | Codex | Claude |
|---|---|---|---|
| 1 | **New PDF Home tab** (owner layout) | Finish rich Home, commit it, say the commit in HANDOFF | Test it on a clean copy the same day: every Home button on PDF text, save, reopen, Undo/Redo, Cancel, small windows; add a robot task |
| 2 | **Everyday tools easy** (TOOL-PLAN entries 1–12) | Split buttons, one name per job, same panel layout, on-page hints for Type, Highlight, Comment, Draw, Sign, Fill, Save, Print, Find | First-time-user walk of entries 1–12: clicks vs Acrobat Reader, every "what now?"; findings the same day |
| 3 | **Open files stay open** (S19) | Home tab + always-visible file tabs; going Home never closes a file | App test + robot task: open → Home → Files → back by the tab, same page and marks; one file, two files, moved file |
| 4 | **Cancel never greyed; one tool panel at a time** (X1, X2) | Shared rule for every tool panel | Cancel/Esc/× sweep on every tool; check no panel is left behind |
| 5 | **Small on-page Type / Sign / Date / Fill; Fill and sign in order** (X4, X5) | Build the small controls and the fill → sign → save order | Check the saved copy keeps every typed word, signature and date exactly; fix the saving side |
| 6 | **Leaving with unsaved work always asks** (S7) | Keep editing / Discard in every everyday tool | Test leaving every way (tool, tab, mode, Home, close file, close app) |
| 7 | **Nothing lost in a crash** (S5, S6) | Fix any of its save routes that fail | Kill tests for every everyday tool (with unsaved work and mid-save); fix recovery/saving |
| 8 | **Update keeps everything** (S12) | Two installers (previous and new) | Install-over test on the spare PC: drafts, signatures, settings, recent files |
| 9 | **Files work in other apps** (S14) | — | Rebuild the compatibility folder; owner opens the files |
| 10 | **UI last 5%** (keyboard, small windows, Esc) | Finish | Independent review on a clean copy |
| 11 | **Robot up to date** | Update its robot tasks to the new UI | Spare PC non-stop on the newest commit; read results every morning and after each new commit; send failures |
| 12 | **Beta 1** (October 31) | Beta 1 installer from the final commit | Final checks, tester guide, known problems |

**Spare PC (non-stop):** three robot lanes loop forever (`C:\PDFixTest\follow`). Claude builds each new committed
version in a clean copy outside Google Drive and sends it; the lanes switch to it at their next run. Results:
`C:\PDFixTest\follow\results\<commit>-summary.txt`. Only the current and previous versions are kept there.
