# PDFix priority tasks (release readiness audit, October 25, 2026)

**Ranks:**
- **P0** — blocks the October 31 beta
- **P1** — important before release; ship only with a written reason
- **P2** — can wait until after the beta

**Owners:**
- **Codex** builds the UI and owns the reader/toolbar files
- **Claude** tests, fixes, plans and packages
- **Owner** decides, installs programs and recruits testers
- **Human** means a person must do it

Efforts are estimates.

## P0 — release blockers

| # | Task | Evidence | Files | Owner | Effort |
|---|---|---|---|---|---|
| P0-1 | ~~Compress has no passing output check (A2)~~ **Resolved 10-26:** 9/9 Compress app tests and the robot Compress task pass on 11ff352 (clean copy) | tmp/rc-11ff352-results.txt | Codex fixed; Claude verified | done |
| P0-2 | ~~Two flaky robot tasks (A4)~~ **Passed 3/3 each on 11ff352 (10-26)**; watch in the next full robot run | tmp/rc-11ff352/tmp/robot-try-each.json | Claude | done unless seen again |
| P0-3 | **Codex's UI reaches a committed, stable point** for the release candidate, with its tests and robot tasks updated in the same commits (SHARED-PLAN rule 1) | about 50% done (owner's estimate); working tree clean at 20:53 on 10-25 (2487a21), but 2.19 and 2.24–2.35 are still todo or doing | 2.30–2.35 | Codex | ends by **10-28** to leave 3 days |
| P0-4 | **Full app run + robot run on the release-candidate commit**, 0 unexplained failures | Full run 10-25: see PDFIX_RELEASE_READINESS.md; 31 robot tasks last ran before 10-22 | — | Claude | 1.5 h + triage |
| P0-5 | **Test a package that has the new UI**: build it, then on the spare PC install, run the robot, upgrade over an older build, uninstall | **Install, upgrade, uninstall done 10-27 on the spare PC:** zip installer (all new-version checks pass) and PDFix-Setup.exe (18/18). Fixed on the way: startup crash with a short 8.3 temp folder, upgrade kept the old version, download mark on every installed file (SmartScreen at every start), empty Apps entries (1164ff8, 4b04d20, 5b57fac). Robot on the installed final package still open. **The Setup .exe is owned by Codex from 10-28 (owner).** | `scripts/build-windows-package.mjs`, `packaging/*.ps1` | Claude | 3 h |
| P0-6 | **The downloaded-zip path**: download from a GitHub release draft, check the SHA-256, extract, install, SmartScreen, first start. Fix the "double-click inside the zip" failure (the READ ME must say Extract all first, or the `.cmd` detects it) | never tested; the wrapper `.cmd` uses `%~dp0PDFix\…` | `releases/PDFix-for-Dad-…/Install PDFix.cmd` (hand-made) | Claude | 2 h; **guard done 10-26** (Install PDFix refuses to run from inside the zip or a temporary folder and gives the Extract All steps; tested in 3 cases); **downloaded-zip test done 10-27 on the spare PC** (zip marked as a download, fingerprint, refused inside the zip, Extract All, install, first start); people install with PDFix-Setup.exe from now on (owner 10-27; Codex owns it from 10-28); **Windows Sandbox fresh-install test prepared 10-26** (scripts/make-sandbox-test.mjs; tester zip from 5098381, offline, zip marked as a real download; waits for the owner to switch on Windows Sandbox) |
| P0-7 | **Private test** with the dad and 1–3 friends on the release-candidate package; triage what they find | Owner decision 10-23 | `docs/BETA-TESTER-GUIDE.md` | Owner + Human; Claude triages | 1–2 days elapsed |
| P0-8 | **Outside readers:** open the 18 outputs in Adobe Acrobat Reader and Foxit Reader (form, comments, password, redaction, no repair prompt) | B2: only Edge's Adobe engine so far | `releases/compatibility-check-2026-10-24/CHECKLIST.txt` | Owner installs (or approves a download); Claude scripts it | 1 h |
| P0-9 | **Licence and name:** confirm GPL-3.0-or-later, then LICENSE + `package.json` + README, LICENSE shipped in the package; decide on "PDFix" (PDFix, Inc. sells PDF products under that name) | LICENSE-REVIEW-2026-10-23 | root, `package.json` | Owner decides; Claude adds the files | 1 h after the decision |
| P0-10 | **Fresh public repository** from the upload copy (never this history), `publish-github.mjs --check` passing, version `0.1.0-beta.1`, tag, release with zip + SHA-256, private vulnerability reporting on | PUBLIC-RELEASE-CHECKLIST | `scripts/publish-github.mjs` | Claude; Owner turns on the GitHub setting | 2 h |
| P0-11 | ~~Crash draft silently dropped when the original changed before reopening~~ **Fixed 10-25:** the draft is still never applied to the changed file, but it is now kept as a pinned Version history entry ("Unsaved work from before PDFix closed") that newer versions never push out, and the editor says so. Checked: 4 new unit tests (3 fail on the old code), 525 units, 15/15 app recovery and crash tests, real-app crash test. Still open: Excel and PowerPoint copies keep the work but show no message; PDF tool drafts unchanged | CODE-SCAN-2026-10-25 #5 | `desktop/recovery-store.cjs`, `desktop/file-store.cjs` | Claude | done |
| P0-12 | **After saving a copy, the next tool still works on the original** (27 of 29 save routes). It can't damage a file, but people send the wrong one (compressed but unsigned) | Code: only open-saved-password-copy and open-saved-new-document offer the saved file; UI-A-GRADE-CHECKLIST X1–X3 | Backend done (77e8395, `openSavedCopy`); Codex: the "Saved as … [Continue with this copy] [Keep working on the original]" message on every save; Claude: robot chain compress → continue → sign → verify compressed and signed | 2–3 h (Codex) + 1 h (Claude) |

## P1 — important before release

| # | Task | Evidence | Owner | Effort |
|---|---|---|---|---|
| P1-1 | Kill test during the new on-page saves: **Compress and Redact done 10-26** (tests/desktop/process-kill-inline-saves.spec.js, 6/6 on fcda545: killed 0.15/0.6/2 s into saving; no partial file, any copy complete, original intact, restart works). **Table extraction done 10-26** (process-kill-table-save.spec.js, 6/6 on fcda545: CSV and XLSX killed at 0.1/0.5/1.5 s; each time either no file or a complete one with the right cells, the PDF unchanged, restart works) | Claude | Claude | **done** |
| P1-2 | ~~Re-run the 31 robot tasks last run before 10-22~~ **Done 10-25: 31/31 pass on commit 2487a21** | tmp/robot-try-each.json, robot-try-with-setup.json, robot-forced.json | Claude | done |
| P1-3 | Running PDFix from a temporary folder fails to save Word/PDF copies | spare-PC note, October 19. **Not reproduced on the main PC, 10-26:** with PDFix itself run from %TEMP%, saving into %TEMP%, and with %TEMP% set to a short 8.3 path, Word, PDF, crash-case and form saves all worked (fcda545 source). **10-27 spare PC:** found and fixed a related crash: PDFix did not start at all when Windows' temp folder has a short 8.3 name, as on accounts with a space in the name ("Invalid graphics startup receipt location", 1164ff8); saving from a temp folder itself still to recheck on the final package | Claude: recheck once on the spare PC with the release package | 30 min on the spare PC |
| P1-4 | Physical print at 100% on a real printer | never printed (`docs/PRINTER-ACCEPTANCE-2026-10-15.md`) | Human (owner, 10 min) | 10 min |
| P1-5 | Word copies opened in Word (or Word Online), workbook in Excel, slides in PowerPoint | only package structure checked | Owner / Human | 20 min |
| P1-6 | Plain wording for engine errors ("Pages tree contains circular reference", "unknown encryption method"); Save a copy/Print disabled for unreadable PDFs | HOSTILE-PDF-RESULTS small issues 1–2 | Codex | 1 h |
| P1-7 | Fill and sign refusal: message at the top in plain words, hide disabled controls | HOSTILE-PDF-RESULTS small issue 3 | Claude | 1 h |
| P1-8 | ~~A script that generates the tester wrapper~~ **Done 10-26:** `node scripts/make-tester-package.mjs --package <releases/PDFix-…-win-x64> --label <name>` makes the folder, the zip and its SHA-256. Tested on the 10-21 package: Windows unzip gives back all 5,696 files and all 5,685 package hashes match | scripts/make-tester-package.mjs | Claude | done |
| P1-9 | Upgrade data check: an old build's settings, drafts and version history open in the new build | never tested | Claude (spare PC) | 45 min |
| P1-10 | Known limitations written in the release notes: no certificate-signing acceptance, scanner untested, read aloud never spoken, no macOS, unsigned, no updater, OCR proven in English only | this audit | Claude | 30 min |
| P1-11 | Narrator smoke test: open, find a tool, save | never | Claude | 1 h |
| P1-12 | Fewer save steps (show the "I checked" tick only where a mistake can't be undone) | W1; owner decision pending | Owner decides; Codex/Claude implement | 2–4 h |
| P1-13 | Kill/recovery of the unsaved-tab state with the new mode button (View ↔ Quick edit ↔ Build) | **done 10-26**: process-kill-mode-switch.spec.js (fill a form in Quick edit, switch to View or Build, kill: nothing new beside the PDF, the PDF unchanged, the answer comes back; 2/2 twice on fcda545) | Claude | done |
| P1-14 | **Brief file locks by other programs (antivirus, Windows Search) cause one-off errors.** Investigated 10-25: "Local file history could not be saved" comes from the **recent-files list** (`desktop/file-store.cjs:45–57`), not version history. It writes a temporary file and renames it over `workspace.json` with no retry. Reproduced on this PC: while another program holds the file open, the rename fails with EPERM, and it succeeds once that program lets go. The same no-retry rename is in the recovery drafts (`desktop/recovery-store.cjs:51`) and save-over (`desktop/verified-output.cjs:47`, which shows "locked, save a copy"). **No data loss:** the original and the open document stay intact, but a person can see a confusing error. Fix: retry the rename a few times over about half a second on EPERM/EBUSY/EACCES, plus a unit test that holds the file open | Codex, HANDOFF 10-25; Claude reproduction | Claude (needs owner OK: code change) | 1–2 h |
| P1-15 | Saving a copy on drives without hard links (FAT32/exFAT USB sticks, SD cards, Google Drive streaming, some network drives): **fallback done 10-26**, an exclusive copy that never overwrites, checked byte for byte; the plain message if even that fails. 6 unit tests. **Still open: a test on a real USB stick** (none here; E: is only a Google Drive shortcut) | CODE-SCAN-2026-10-25 #6 | Claude | needs a stick |

## P2 — can wait until after the beta

| # | Task | Owner |
|---|---|---|
| P2-1 | Certificate signing: runtime acceptance and an Acrobat validity check | Codex + Owner (Acrobat) |
| P2-2 | Real scanner test | Human |
| P2-3 | Real signed PDF through every modifying route (test 11) | Claude |
| P2-4 | Long chains with a restart in the middle (test 14); undo/redo the same in every tool (2.27) | Claude / Codex |
| P2-5 | Reader memory over long sessions (A-R2), Codex's 90-minute real-file gate | Codex |
| P2-6 | PDF fuzzing campaign | Claude |
| P2-7 | Home previews/pins (2.19), Files (2.7), status bar (2.26), Draw/Measure/Image/Table tools (2.22, 2.23, 2.28, 2.29) | Codex |
| P2-8 | Code signing | Owner decides (cost) |
| P2-9 | "Check for a newer version" that only opens the Releases page, after asking | Claude |
| P2-10 | "Remove my PDFix data too" option in the uninstaller | Claude |
| P2-11 | OCR checks in the other 5 languages | Claude |
| P2-12 | macOS port; paid workspaces with offline licences | later projects |
| P2-13 | Editor gaps: comments, tracked changes, footnotes, columns, fonts, direct print | Codex |
| P2-14 | Test tooling: `scripts/agent-run.mjs` removes the app-run lock on Ctrl+C even while only waiting for another agent's lock (Codex, HANDOFF 10-25) | Claude | **done 10-26 (e3d8544)**: only the owner removes a lock; a stale lock is removed only if nobody replaced it; a half-written lock is not treated as abandoned |

## Who does what (summary)

**Codex**
- P0-1, P0-2, P0-3
- P1-6, P1-12 (after the owner decides), P1-1 for the reader tools
- the UI items in P2

**Claude**
- P0-4, P0-5, P0-6, P0-8 (scripted part), P0-9 (files), P0-10
- P1-1 (Fill and sign), P1-2, P1-3, P1-7 to P1-11, P1-13, P1-14, P2-14
- triage of the private test

**Owner / human testers**
- decisions: the licence, the name, signing, W1
- installing Acrobat Reader and Foxit (or approving the download)
- the private test, a physical print, opening outputs in Office
- turning on GitHub private vulnerability reporting
