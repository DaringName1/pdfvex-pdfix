# Everything left before v1 — October 18, 2026 (late evening)

Written by Claude for the owner. Estimates are judgement, not measurements; they will be updated as the
[V1 audit](V1-WHOLE-APP-AUDIT-2026-10-18.md) and the [UI walkthrough](UI-WALKTHROUGH-2026-10-18.md) are worked through.

## 1. For the owner (only you can do these)

| # | What | When |
| --- | --- | --- |
| O1 | Dad's test (October 19): install, watch, collect problem reports (Settings > Save a problem report) | Monday |
| O2 | Choose the v1 target: **Oct 30 "v1 beta"** (reliable + main flow fixes) or **Oct 30 full v1** (then pick which UI items wait) | This week |
| O3 | Your own UI list: add it to the UI walkthrough, in any order | When ready |
| O4 | A PC with **Acrobat** (and Bluebeam if possible) to open PDFix's saved files: the only way to prove compatibility | Before v1 |
| O5 | Decisions still open in the verification plan: app licence, how bug reports are sent, beta testers, GitHub visibility, the "Physical page" wording | Before v1 beta |
| O6 | Approve the Phase 1 reconciliation table (what counts as in v1) in the finish plan | This week |

## 2. How much of the UI has to change to feel professional

Counted from the walkthrough of every screen (about 45 tool screens plus Home, Files, Settings and the editor):

| Kind of change | Share of screens | Examples | Effort |
| --- | --- | --- | --- |
| **Rebuild how the tool works** (work on the page, live preview, drag) | **about 30%** (13–15 screens) | Reader tool bar; Add text on the page; Mark up; Fill and sign; Edit PDF text; Redact; Fix pages thumbnails; Extract table; Print; Compress; Page numbers; Sheet sets; Word editor page view | 1–3 days each with tests |
| **Rework the layout and wording** (fewer boxes, no jargon, one Save, no extra review ticks) | **about 40%** (18–20 screens) | Protect, Health report, Outline, Takeoffs, Bates, Signing request, Scan, Email, Search, Watched folders, Ask about files, Files page | a few hours each |
| **Small fixes or fine as is** | **about 30%** | Home, Workspaces, Settings, Format support, Fingerprint, Image to PDF, Actions panel | done or minutes |

**Overall: roughly two thirds of the screens need visible changes; about one third need deeper rebuilding.**
Done tonight: 6 of about 50 walkthrough items (workbook typing, automatic image previews, messages, fillable-field
buttons, Redact names, search tidy-ups). Estimate for the rest: **about 3 weeks with both AIs working in
parallel** (Codex has the reader, Mark up, Drawing and Pages: the largest part), plus your own list.

## 3. How much debugging is left

**Known open problems (10):**
1. Reader memory grows on very long sessions; the 90-minute gate still fails (Codex, biggest unknown).
2. Fix or combine pages removes comments, links and bookmarks from the new copy (Codex, data integrity).
3. Cloud: two clean full runs in a row not yet reached (last runs: 2–3 failures each, mostly slow-runner timing).
4. `drawing-freetext-reply.spec.js:44` wording and `drawing-xfdf.spec.js:2` (Codex, test side).
5. Spare PC: "pages: number and stamp every page" fails now and then (Codex, 4 of 441 sessions).
6. Protect cancel on slow PCs (fixed in the test; watch).
7. Picture drag-resize on a cloud runner (fixed; needs a clean cloud run to confirm).
8. Protect opens over an empty page instead of the PDF (Claude).
9. RTF: the Format support page and the editor disagree about whether pictures and tables are kept (Claude, check).
10. Messages still cover the toolbar while shown (Claude, position).

**Not yet looked for (the V1 audit will find more):** failure tests for every save route in Claude's lane (kill
mid-save, full disk, locked or vanished file, two windows), hostile files through every opener, the network-off
check, compatibility in Acrobat/Office, the long robot jobs, install/uninstall on the spare PC.
Codex has started its lane: signed-PDF refusal, forced-close recovery and Windows file locks are now proven.

**Estimate:** about **1–2 weeks** of debugging and audit work, running alongside the UI work. Expect the audit and
the UI rebuilds to turn up 10–30 more bugs; most should be small.

## 4. The spare PC: plan versus what is happening

| | Planned | Actual |
| --- | --- | --- |
| Sessions per 24 hours | about 2,000 (first 24-hour run did 2,039) | **about 1,440** on run 3 (60 an hour; run 1 did 85 an hour) |
| Why slower | — | The robot now has 47 tasks instead of about 30, including heavier ones (drawing comment edits, spreadsheets, slides, page tools), and each session does 24 steps |
| Coverage goal | every tool alone → every pair of tools both ways → **realistic 3–10 step jobs** | pairs: **1,346 of 2,209 tried (61%)**; expected about 75–80% when run 3 ends. **Jobs: not started** |
| Tools covered | every tool | about **47 tasks touching roughly half the tools** (about 100 actions exist); never tried: Bates, outline, page boxes, sheet sets, scanner, watched folders, signing request, health report, OCR on several pages, mail merge |
| Run 2 | 24 hours | stopped after about 1.5 hours to switch to the Monday package |
| Total so far | — | about 3,900 sessions since October 16 |

**To get back on plan:** add robot tasks for the untried tools; add the long "jobs" (engineering set, office
paperwork, spreadsheet-and-slides; see the audit, section A); make random draws favour untried pairs so coverage
reaches 100% instead of levelling off; and keep the spare PC running with each new package.

## 5. Timeline

- **Oct 19–23:** dad's feedback fixes; audit of the critical areas (data integrity, saving and recovery, security);
  first big flow changes (reader tool bar, Add text on the page, Fill and sign on the page); robot jobs.
- **Oct 26–30:** page thumbnails and live previews; compatibility check on a PC with Acrobat; install test;
  two clean cloud runs; final package → **v1 beta on October 30**.
- **Nov 2–mid November:** the rest of the UI list, the editor page view, memory, standards and screen reader
  → **full v1 around mid-November**.

## 6. Progress, October 20 (Claude's lane; agreed order 1, 3, 4, then 2, then 5)

**Done today**

- **Section 3, reliability (Claude's lane complete):**
  - part-by-part checks for every save in Claude's lane (Fill and sign with a placed signature, signing requests,
    Edit PDF text, Redact)
  - crash tests for slides and signing requests (10 crash cases in all)
  - attack files: Markdown, TIFF, PNG/JPEG headers, broken picture data
  - internet-off robot runs: 72/72 steps, no attempt to reach another computer
- **Section 4, robot:**
  - three "jobs" where PDFix is ended suddenly mid-work: a report, signing a PDF, a spreadsheet
  - tasks for six tools no robot had used: watched folders, synchronized files, clipboard, editor links, spell
    check, version history
- **Bugs found and fixed by the new tests:**
  1. Create from clipboard always failed (Electron 44 changed its clipboard API).
  2. A spreadsheet cell address typed while the workbook was opening sent the next value to A1.
  3. Signing requests kept no recovery after a crash.
  4. A Markdown file's picture read could exceed 5 MB if the file grew after the check.
- **Section 1:**
  - 17 check scripts moved to All tools
  - cloud run 39491483690 started on everything committed
- **Passed to Codex:**
  - the area-selection box disappears
  - Drawing sheet sets blocks quitting
  - three robot tasks still use old menus
  - the integrated-UI comment step is out of date

**Next:** cloud results, a new spare-PC package with the jobs and new tasks, then section 2 (tools on the page).
