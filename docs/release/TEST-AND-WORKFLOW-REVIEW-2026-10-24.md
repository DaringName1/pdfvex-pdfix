# Remaining tests, workflows and UI polish — review of October 24, 2026 (Claude)

Owner request, October 23: rank the remaining important tests, study real workflows against competitors, and polish
only UI pages Codex has explicitly finished. **No UI code was changed in this review** (see section 4).

## 1. Remaining tests, ranked by risk

Already passed recently and **not** repeated unless something changes them:
- 516 unit tests
- full local app run on the updated libraries (162/170)
- the Fill and sign suites
- the 22-step robot replay (22/22)
- compatibility checks (18/18)
- privacy upload check
- crash/fault save suites (October 19–22)

| # | Test | Why it matters | Est. time | Who | When |
|---|---|---|---|---|---|
| 1 | Rerun A1–A4 after Codex's fixes: `reader-real-engineering`, the 4 Compress specs + the new `compression-inline.spec`, `document-editor.spec:25`, the 2 robot tasks, and the dad's drawing locally | A real drawing page fails to render today; Compress is a save route | 30 min | Claude | as soon as Codex commits |
| 2 | Full local app run on the release candidate | Codex's UI work touches every reader tab | 25 min + triage | Claude | after A1–A4 and the UI merge |
| 3 | Acrobat Reader app + Foxit Reader on the 18 outputs (fill field, search "oil", password, no "repair" prompt) | First outside-application proof; users will open PDFix files in these | 45 min (manual) or 20 min (scripted screenshots) | owner installs, Claude runs | before beta |
| 4 | Word / Word Online, Excel, PowerPoint on the Office outputs | Only package structure is checked | 20 min | owner | before beta |
| 5 | Kill during the new on-page saves (inline Compress, Redact, table; **Fill and sign done:** process-kill-recovery.spec passes with the panel, October 23) | They changed this week; the old crash tests used the window versions | 1 h | Claude (Fill and sign), Codex (reader tools) | before beta |
| 6 | Clean install from the downloaded GitHub release zip on the spare PC, including the SmartScreen path and checksum | What every public user does first | 30 min | Claude | release candidate |
| 7 | Upgrade: install beta N over N-1 on the spare PC (settings, drafts and documents kept; shortcut points to the new one) | Never tested; every tester will upgrade | 45 min | Claude | before or just after beta 1 |
| 8 | Spare-PC robot run on the release candidate with Codex's new tasks (unattended) | Finds rare failures | 30 min setup, runs 12–24 h | Claude | release candidate |
| 9 | ~~"Edit slide text and save a copy" reliability~~ | **Resolved October 25:** all 4 failures were on October 18 between 20:51 and 20:53, while the task was being written; 7/7 runs since passed | — | Claude | done |
| 10 | Hostile and malformed PDF corpus through open + every save route | Only 4 malformed PDFs tested so far (non-PDF formats are well covered) | 2–3 h | Claude builds, both run | before public beta if possible, else soon after |
| 11 | Real signed PDF (not a synthetic marker) through every modifying route | Refusal is proven only with generated markers | 30 min (needs a signed sample, e.g. from Acrobat Reader's free Fill & Sign) | Claude | after Acrobat Reader is installed |
| 12 | Two cloud runs at beta | Clean-machine proof the owner allowed at beta | 2 × ~45 min | Claude | release candidate |
| 13 | Narrator smoke test: open, find a tool, save | No screen-reader test yet | 1 h | Claude | soon after beta |
| 14 | Long robot job across tools with a restart in the middle | Proves recovery across tools, not one at a time | 1 h | Claude | soon after beta |
| 15 | ~~Temporary files after a crash during a sandbox job~~ | **Defect found and fixed October 25 (commit 087e22b):** killed runs left document copies + an 80 MB engine copy per job in `%TEMP%\PDFix-contained-*` (56 folders, about 4 GB here). PDFix now removes job folders untouched for 2 hours, 20 s after start; 54 real leftovers removed, 0 failures; the full hostile run left none. Two runtime-only folders appeared once during a test close and were not reproduced | — | Claude | done |
| 16 | Reader memory over a long session (A-R2) and large real drawing sets | Partly closed | 2 h | Codex | after beta |

## 2. Workflows to evaluate (whole tasks, not single tools)

1. Open a PDF → find a word → print
2. Fill a form → sign → save → reopen (Acrobat Fill & Sign is the reference)
3. Combine several PDFs → reorder pages → save
4. Extract or split pages into a new PDF
5. Compress for email
6. Redact a word everywhere → save → verify it is gone
7. Scan → make searchable → search → export text
8. Word → PDF, and PDF → editable Word copy
9. Mark up a drawing (highlight, note, cloud) → save → reopen in another reader
10. Protect with a password / remove a password
11. Fix a typo in PDF text
12. Drawing: calibrate scale → measure distance, area, count → export the list (Bluebeam is the reference)
13. Compare two drawing revisions
14. Page numbers or Bates numbers on every page
15. Extract a table to Excel
16. Make a fillable form
17. Prepare a PDF for someone else to sign
18. Pictures → one PDF
19. Move pages from one open PDF into another
20. Write a Word document with a table and a picture → export PDF

## 3. Workflow weaknesses found

**What is measured.** PDFix figures are real:
- robot task timings across 83 local sessions (`tmp/user-robot/run-*.json`)
- interaction counts from the robot's task steps (`scripts/user-robot/robot.mjs`)
- the October 23 by-eye screenshot review

Times are machine times (processing plus screen response with a robot driving), not human task time.

**Competitors.** Their steps come from their own help pages, because none is installed here. Only Adobe's Fill & Sign
and Bluebeam's calibration flow were found with clear steps, so **no "faster than" claim is made.**

| # | Weakness | Evidence | Effect | Suggested fix | Before beta? |
|---|---|---|---|---|---|
| W1 | **Every save takes extra steps.** Each tool asks for a preview, a "checked" tick and then Save, plus the Save dialog | Robot counts: signing = 6 clicks + 2 choices + a page drag + "Add at this location"; Adobe's documented Fill & Sign is open tool → create signature → click to place → Save (about 5 actions) | Slower common tasks; the owner asked for fewer ticks before (2.2) | Keep preview and verification automatic (they already run on their own), make the tick appear only where a mistake can't be undone (Redact, remove hidden data), and offer "Save a copy" as soon as verification passes | **Owner decision** (changes a safety design) |
| W2 | PDFs open in View and the mode list has no Quick edit | Screenshots, October 23 | Signing and filling (the most common jobs) need a mode switch first | 2.31 (Codex, in progress) | Yes |
| W3 | Signing needs an extra "Add at this location" click after dragging | Robot steps; Acrobat places with one click | One more click per placement | Place on release of the drag; keep Undo | Small, after the UI work settles (Fill and sign is mine) |
| W4 | Save a copy, Print and Find move between tabs; Share missing | Screenshots | People hunt for Save | 2.30 (Codex) | Yes |
| W5 | The View screen is cluttered with boxed buttons | Screenshots | Breaks the approved simple View | 2.30 (Codex) | Yes |
| W6 | Export tab: 10 buttons, three-line names; drop-downs repeat visible tools; Measure has a one-item drop-down | Screenshots | Harder to find tools | 2.32/2.33 (Codex) | Yes |
| W7 | Scan banner in View says "Choose Make scan searchable", but View has no such button | Robot screenshot | A dead end for the user | Banner button that switches to Build | Small (Codex) |
| W8 | ~~Edit slide text fails 4 of 11 robot runs~~ | **Not a current problem** (October 25): the 4 failures were all in the task's first hour on October 18; 7/7 since | — | — | — |
| W9 | Slow steps: add fillable field 8.1 s, Redact 7.6 s, signing 6.9 s median | Robot timings (includes building and re-checking a full preview copy) | Waiting without much feedback | Keep the progress message visible; consider verifying in the background while the person continues | After beta |
| W10 | Measure is one "Drawing takeoffs" entry, not Distance / Area / Count tools with calibration up front | Screenshots; Bluebeam's documented flow calibrates first, then picks the tool | More steps for the dad's main job | 2.23 (Codex, after beta) | After |

## 4. Small UI improvements completed on Codex-finished pages

**None.** No UI page is marked finished by Codex: SHARED-PLAN items 2.7, 2.14–2.16, 2.19 and 2.24–2.35 are all "todo" or
"doing", and Codex's working tree currently changes the reader, toolstrip and Compress files. The only pages outside
Codex's assignments are **Settings & privacy** and **Format support**. They are not "Codex-finished", so they were left
alone too; the owner can allow them. Codex has been asked in HANDOFF to mark pages as finished.

## 5. Deferred because Codex is still working there

- W2, W4, W5, W6, W7 (reader toolbar, View, modes)
- the side panel and defaults (2.35)
- Home and Files (2.7, 2.19)
- the Word editor toolbar (2.34)
- Fill and sign's "place on release" (W3) touches the shared page-tool host, so it waits until Codex's on-page work settles

## 6. Before the October 31 beta vs after

**Before:**
- A1–A4
- tests 1–9 in section 1
- W2, W4–W8
- the name decision and the licence
- the fresh public repository

**After:**
- W1 (owner decision; could be before if approved early)
- W3, W9, W10
- tests 10–16
- the macOS port
- an update notice
- Narrator fixes

## 7. Tests rerun (October 23–24) and results

| Test | Result |
|---|---|
| Unit tests (after the library updates) | 516 pass, 0 fail |
| Full local app run on DOMPurify 3.4.17 + Electron 44.9.3 | 162 pass, 7 fail, 1 skip. The 7: A1–A3 (6, Codex's area, unchanged from before the update) + reader-tagged-order (disturbed by my mid-run edit; **passes on rerun**) |
| Targeted rerun: settings-version (new), reader-tagged-order, document-editor, document-pictures, markdown-pictures | 13 pass; 1 fail = A3 (known) |
| Robot replay of session 7101 (22 steps) on today's build | 22/22, every saved file checked |
| Compatibility checker on the 18 fresh outputs | 18/18 (qpdf, Edge/Adobe engine, content, redaction bytes) |
| Privacy upload check | refused the old commit (10 files named); passes now (2,985 files) |
| `npm audit --omit=dev` | 0 critical, 0 high |

**Unresolved:**
- A1 (real engineering page error)
- A2 (Compress specs)
- A3 (box selection)
- A4 (2 robot tasks)

All are in Codex's area and not yet fixed. **PDFix is not release-ready until they are.**
