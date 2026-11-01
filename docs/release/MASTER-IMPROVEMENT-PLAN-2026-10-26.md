# PDFix master workflow, usability and release improvement plan (October 26, 2026)

**Planning only:** no code was changed for this plan, and Codex's UI work was not touched.
- **Sources:** the repository, the October 25 audit files in `docs/release/`, SHARED-PLAN, HANDOFF, and test runs on
  commit **11ff352** (Codex's latest committed UI batch), run from a clean copy of that commit.
- **Not verified here:** Codex's two later commits (bc6c5ef; 28e22a5, marked "WIP").
- **Ranks:** **P0** = must be fixed before a public release; **P1** = important for usability and quality; **P2** =
  after the initial release.

## Where each deliverable lives (existing files are updated rather than duplicated)

| # | Deliverable | File |
|---|---|---|
| 1 | Feature verification matrix | [PDFIX_FEATURE_INVENTORY.md](PDFIX_FEATURE_INVENTORY.md): October 26 status changes at the top; per-feature rows below |
| 2 | Master workflow testing matrix | [PDFIX_WORKFLOW_TEST_MATRIX.md](PDFIX_WORKFLOW_TEST_MATRIX.md): new section G (the 12 priority workflows) and section H (user groups) |
| 3 | UI and usability improvement list | [../UI-A-GRADE-CHECKLIST.md](../UI-A-GRADE-CHECKLIST.md), plus section C below (is the redesign easier?) |
| 4 | Document-safety and compatibility gap report | Section D below |
| 5 | Release-readiness assessment | [PDFIX_RELEASE_READINESS.md](PDFIX_RELEASE_READINESS.md), plus section E below (October 26 changes) |
| 6 | Post-release AI and human testing plan | [../AI-HUMAN-TESTING-PLAN.md](../AI-HUMAN-TESTING-PLAN.md): updated with the real-desktop and ordinary-people requirements |
| 7 | Highest-impact actions for Claude and Codex | Section F below; the full ranked list is in [PDFIX_PRIORITY_TASKS.md](PDFIX_PRIORITY_TASKS.md) |
| — | Growth and metrics (no telemetry built) | Section G below |
| — | Answers to the final questions | Section H below |

## A. What changed since the October 25 audit

| Item | October 25 | October 26 (evidence) |
|---|---|---|
| Compress (A2, P0-1) | robot 0/2, specs failing | **9/9 Compress app tests pass on 11ff352**; robot Compress task passed twice; batch compress passed |
| Print/Find tests moved by the UI | 3 specs failing | Fixed by Codex; pass on 11ff352 |
| Full app suite | 180/184 | **191 pass, 0 real failures, 2 skipped** (11ff352, clean copy) |
| Robot | 84/86 tasks last passed | 31 older tasks rerun on the new UI 31/31; replay 22/22; random 29/30 (the 1 is Codex's task looking in an old place) |
| Quick edit | missing; PDFs opened in View | **PDFs open in Quick edit**; one mode button with three modes |
| Crash draft lost when the file changed (P0-11) | found | **Fixed** (932355e) |
| Brief antivirus locks (P1-14) | found | **Fixed** (77e8395, tested against a real Windows lock) |
| Continue with saved copy | missing | Backend ready (77e8395); UI button is Codex's |
| Temporary files after a crash | 4 GB found | Fixed (087e22b) |
| Flaky robot tasks (A4) | 1/3 each | **3/3 each pass on 11ff352** (large scans; cross-style refusal) |

**The October 25 baseline** (67 capabilities: 51 verified in development, 12 unverified, 3 partial, 1 failing) now
reads as follows. Every number is for development builds:
- **52 verified:** Compress moved from failing to verified.
- **12 unverified**
- **3 partial**
- **0 failing**

**Not verified at all for any capability:**
- **A packaged Windows build with the new UI:** the spare PC is down, and no package has been built since the new UI
  started.
- **Outside readers:** Acrobat Reader and Foxit have not been used.

## B. The five questions per capability (summary; rows in PDFIX_FEATURE_INVENTORY.md)

| Question | Status across the 67 |
|---|---|
| Implemented? | 67/67 have code; 3 partial (undo everywhere, the one Text tool, watched folders) |
| Works in the app now? | 52 have a passing app-level check since October 22 |
| Saved output verified? | Yes for every "Verified" row: the robot and specs re-read saved files. No for the 12 unverified |
| Works when packaged? | **Unknown for all with the new UI.** The last packaged runs (Oct 19–21) covered the old UI |
| Easy for a first-timer to find? | **Not measured.** Only a by-eye review exists. Biggest risks: everything beyond Quick edit needs Build; "Actions" is vague; less-used tools hide in drop-downs |
| Works with related tools? | Partly: robot chains (crash-and-sign, 30-step random runs). Dedicated chains (markup → redact, OCR → redact, fill → protect) are not tested |

## C. Is the redesign easier than before? (deliverable 3, alongside the A-grade checklist)

**Easier, with evidence from the October 23 and 26 screenshots:**
- PDFs open in Quick edit, so signing, filling and marking up need no mode switch. Before, they needed Build.
- File actions (Find, Save a copy, Print) sit in one fixed place.
- Groups with names replace long rows of boxed buttons.
- View is uncluttered.
- Messages no longer cover the page.
- Tools such as Redact, Compress and Fill and sign work beside the open document instead of in a second window.

**Not yet easier, or worse:**
- The **Build tab rows still need a drop-down** for less-used tools. A first-timer can't tell where Bates numbering,
  portfolios or preflight live, and "Find a tool" exists only in Build.
- **Undo/Redo is not by the file name**, and works differently in different tools (SHARED-PLAN 2.27).
- **"Saved or not" is not shown anywhere** (no status bar, 2.26).
- **Each save still takes several steps** (preview, tick, save; W1 waits on the owner).

**Verdict:** easier for the common jobs in Quick edit; no better yet for Build-heavy work. **No second interface is
recommended.** Everything open is in [../UI-A-GRADE-CHECKLIST.md](../UI-A-GRADE-CHECKLIST.md) (Codex builds, Claude
confirms).

**Workflow gaps not on that checklist:**

| # | Gap | Why it matters / who | Rank | Owner | Accepted when |
|---|---|---|---|---|---|
| U1 | **No "Saved / not saved" indicator** | Everyone; people lose work or save twice | P1 | Codex (2.26) | Status bar shows "Unsaved changes" / "Saved as …" in reader and editor |
| U2 | **Undo differs between tools** | Everyone; a failed undo feels like data loss | P1 | Codex (2.27) | The same Ctrl+Z/Ctrl+Y and buttons in every tool; a robot task per tool checks undo against saved output |
| U3 | **Where to begin** for a first-timer: Home has many cards; tools beyond Quick edit need Build | Students, older users | P1 | Codex | A first-time tester finds open, sign, save and print without help (A-grade checklist section 3) |
| U4 | **After saving, the next tool still works on the original** | Office workers chaining tasks (compress, then sign) | P1 | Claude backend done; Codex button | The "Continue with saved copy" button opens the saved file; robot chain compress → sign passes |
| U5 | **Share** has no real target | Office workers expect to email a file | P2 | Claude (native helper) | A Windows share sheet opens with the saved copy; no upload |
| U6 | **Batch work is hidden** (several PDFs at once) | Administrators, teachers | P2 | Codex | Reachable from Home and Files in 2 clicks |
| U7 | **Project groupings / document tabs** exist as tabs only | Researchers, engineers | P2 | Codex | Optional, after the beta |

## D. Document-safety and compatibility gap report (deliverable 4)

Anything that can permanently damage or lose a document is P0.

| # | Gap | Evidence | Severity | Rank | Owner | Accepted when |
|---|---|---|---|---|---|---|
| S1 | **Outside readers never used.** A PDFix file could look wrong or ask for repair in Acrobat or Foxit | Only Edge's Adobe engine + qpdf (18/18) | High | **P0** | Owner installs; Claude scripts | The 18 outputs open in Acrobat Reader and Foxit with forms, comments, password and redaction intact, and no repair prompt |
| S2 | **Upgrade over an older build never tested.** Settings, recovery drafts and version history are shared between builds | `%APPDATA%\pdfix-document-workspace` shared; no migration test | High (could lose recovery data) | **P0** | Claude | Install the old package, create drafts and versions, install the new one: all readable; then uninstall both: documents untouched |
| S3 | **Kill during the new on-page saves** (Compress, Redact, table) | Only the old window versions tested | High | **P0** | Claude + Codex | Kill at 3 points in each; no partial file; original intact; draft restored |
| S4 | **Saving after the new UI's mode switches** (Quick edit ↔ View ↔ Build with unsaved work) | Codex's quickActions pass; no kill test | Medium | P1 | Claude | Kill test across a mode switch keeps the work |
| S5 | **Save fidelity across chains** (markup → redact → save; OCR → redact; fill → protect; combine → numbers → compress) | Not tested as chains | Medium | P1 | Claude (robot chains) | Each chain's saved file keeps everything that should survive and removes what should go (checked by verify.mjs) |
| S6 | **USB sticks / SD cards (FAT32/exFAT)**: saving a copy is refused | Code reading; no stick tested | Medium (usability, no data risk) | P1 | Claude (needs a stick) | A real stick: save works through a safe no-overwrite fallback, or a clear message says why |
| S7 | **PDFix run from a temporary folder** can't save | Spare-PC note Oct 19 | Medium | P1 | Claude | Reproduced or ruled out on the release package; the installer guard stops running from inside the zip |
| S8 | **Real signed PDFs** | Refusal proven only with generated signatures | Medium | P2 | Claude | An Acrobat-signed PDF is refused by every modifying route, with a clear message |
| S9 | **Very large real files over long sessions** (memory) | A-R2 partly closed | Medium | P2 | Codex | 90-minute real-file gate passes |
| S10 | **Fuzzing beyond the 18 hostile files** | Fixed corpus only | Low–medium | P2 | Claude | 1,000 mutated PDFs: no hang, crash or code run |
| S11 | Version backups stay after uninstall (privacy) | `backups/` in app data | Low | P2 | Claude | The uninstaller offers to remove PDFix data; release notes say where it is |

**Closed since October 25:**
- crash draft lost when the file changed
- brief antivirus locks
- temporary files after a crash
- Compress output checks
- the hostile corpus (18/18)

**Tested and solid:**
- save never overwrites a PDF
- save-over keeps a backup
- disk full, locked file, two saves at once, kill mid-save
- redaction removes content

## E. Release readiness: October 26 changes (deliverable 5; full assessment in PDFIX_RELEASE_READINESS.md)

**Can an ordinary Windows user…**

| Step | Answer | What's missing |
|---|---|---|
| Download from GitHub | **Not yet:** no public repository or release exists | P0-10 (fresh public repo, release page, SHA-256) |
| Install without development tools | **Yes, by design**; proven Oct 21 on the spare PC with the old UI | P0-5: test the new-UI package |
| Launch normally | Yes (Start menu / desktop shortcut) | — |
| Open, edit and safely save | Yes in development builds (191 app tests, robot) | Packaged confirmation (P0-5) |
| Uninstall and reinstall without losing documents | Yes by design (the uninstaller removes only its own files); proven Oct 21 | Retest on the new package |
| Upgrade without corrupting settings or recovery data | **Unknown** | S2 above (P0) |

**The ZIP problem:**
- Double-clicking "Install PDFix" inside the zip fails, because Windows extracts only that one file.
- Fixed so far: the release notes say "Extract All" first.
- Still needed: a guard in the `.cmd`, so it detects that it's running from a temporary folder and says "Extract the
  zip first" (P0-6, Claude, about 1 h).

**Warnings, signing, licence, name and privacy:**
- **Unsigned:** SmartScreen shows "Windows protected your PC" (documented). Signing is the owner's decision; options
  and costs are in PDFIX_RELEASE_READINESS section 6.
- **Licence:** GPL-3.0-or-later is compatible; the owner must confirm it before LICENSE is added (P0-9).
- **Name:** PDFix, Inc. sells PDF software under the same name. An owner decision, and a lawyer if keeping it.
- **Privacy:**
  - no network
  - private files out of git
  - the upload script refuses private names
  - **the public repository must start from fresh history**

**Not published automatically:** release steps wait for the owner.

**The free-software and user-control rules hold today** (checked in PDFIX_RELEASE_READINESS section 4):
- free core tools
- no account
- no cloud
- no uploads
- the default app only via Windows Settings
- no prompts
- no updater, so no interruptions

Keep it that way: paid workspaces later, offline after activation, accounts only for real online services, no new
servers.

## F. Highest-impact actions (deliverable 7)

**Codex:**
1. **Finish and commit the UI batch by about October 28.** Accepted when it has the A-grade checklist section 1
   items, Undo/Redo by the file name, the status bar "saved / not saved" (U1), the "Continue with saved copy" button
   (U4), and Esc closes panels.
2. **Fix the robot accessibility task** (opens View ▾ Document). Accepted when it passes alone 3×.
3. **Flaky tasks (A4):** passed 3/3 each on 11ff352. Watch for them in the next full robot run; no work unless they fail again.
4. **Plain-word engine messages.** Accepted when no raw engine sentence is on screen in the hostile-PDF run.

**Claude:**
1. **Release-candidate package with the new UI:** install, robot, upgrade over the old package, uninstall (P0-5, S2).
   On the spare PC, or on this PC with the owner's OK if the spare PC stays down. Accepted with 0 failures and settings,
   drafts and versions kept.
2. **The zip guard and the downloaded-zip test** (P0-6). Accepted when a downloaded zip with the internet mark installs
   after "Extract All", and running it from inside the zip gives the plain message.
3. **Kill tests during the on-page saves and mode switches** (S3, S4). Accepted when no partial file and the work is
   restored.
4. **Outside-reader script** once Acrobat Reader and Foxit are installed (S1).
5. **Full suite and robot on Codex's final UI commit**, then the final UI pass and grade (A-grade checklist
   section 6).
6. **Fresh public repository and release page** after the owner's licence and name decisions (P0-9, P0-10).

**Owner:**
- the licence and the name
- signing (yes/no)
- Acrobat Reader and Foxit
- W1 (fewer save ticks)
- the "Beta" tag decision for the 10 not-yet-proven features
- the private test with the dad and friends

## G. Preparing for growth (no telemetry built in this task)

- **First 1,000 genuine users, without accounts or tracking:**
  - **GitHub release download counts** (public in the GitHub API)
  - **GitHub stars and issues**
  - **voluntary feedback**: a "Send feedback" link that opens a GitHub issue or the owner's form in the browser, with
    nothing attached automatically
- **Later, optional and local only:** a counter on the PC of app opens, documents opened and days used. It is never
  sent; the person can view it in Settings and choose to copy a summary into feedback. If sharing is ever added:
  - **one** optional question at first start, never asked again
  - a small "Share usage summary" button on Home that shows exactly what would be sent
  - never document contents, names, paths or personal data
- **No servers or operating costs:** GitHub Releases hosts the downloads for free.

## H. Answers

**Biggest remaining weaknesses:**
- **Nothing tested outside PDFix:** no Acrobat Reader, no Foxit, and no packaged build with the new UI.
- **Upgrades are untested.**
- **The UI is half finished:** no Undo/Redo by the file name, no "saved" indicator, no shared side panel yet.
- **Unknown discoverability:** no first-time person has used it yet.

**Workflows that already match professional editors** (in PDFix's own tests, not yet outside):
- **Redaction** (true removal, verified)
- **save safety** (never overwrites; recovery after crashes)
- **page organization** (rotate, delete, extract, combine, reorder)
- **fill and sign on the page**
- **markup with replies**
- **drawing takeoffs and revision compare**: this one is closer to Bluebeam than most free tools

**Workflows that need the most improvement:**
- **saving steps:** too many ticks
- **PDF → Word fidelity:** never checked in real Word
- **compress quality choices:** they work, but are hard to judge
- **batch work:** hidden
- **OCR beyond English**
- **chains across tools:** after saving, the next tool still uses the original until "Continue with saved copy" ships

**What could make users abandon PDFix:**
- the first-launch SmartScreen warning (unsigned)
- not finding a tool, or not knowing whether work was saved
- a PDFix file that looks wrong in Acrobat
- slow steps without feedback (add field 8 s, redact 7.6 s)
- the extra save ticks
- the name looking like another company's product

**What could still damage documents:**
- **No known open path loses a saved document.** The two found this week are fixed.
- **Untested paths that could:**
  - a kill during the new on-page saves (S3)
  - an upgrade reading old recovery data (S2)
  - chains across tools that might drop comments or bookmarks (S5)
  - files that open wrongly in other readers (S1)

  S1–S3 are P0.

**What is actually blocking October 31:**
1. **Codex's UI committed and stable by about October 28**, with the checklist's must-fix items.
2. **The release-candidate package tested** (install, upgrade, uninstall), and the downloaded-zip test. The spare PC
   being down is a risk.
3. **The outside-reader check** (needs Acrobat Reader and Foxit).
4. **Kill tests on the new on-page saves.**
5. **Owner decisions:** licence and name. For a **public** beta: the fresh repository too.

Compress is no longer blocking.

**Now versus after launch:**
- **Now, until October 31:** the P0 items above, section F, and the private test with the dad and friends.
- **After launch:**
  - the AI human testing and the full-app robot coverage ([../AI-HUMAN-TESTING-PLAN.md](../AI-HUMAN-TESTING-PLAN.md))
  - the line-by-line reading of the whole app
  - USB-stick saving and Share
  - OCR languages
  - real signed PDFs and fuzzing
  - code signing, macOS, workspaces, and optional local usage counts

## I. Added October 26 (owner requests)

- **Finishing the UI from 95%:** [UI-95-FINISH-LIST.md](UI-95-FINISH-LIST.md). When Codex reaches about 95%, both
  agents finish the last 5% at the same time, claiming items and files in HANDOFF.md first.
- **PDFix for AI apps (MCP), after the beta:** [../MCP-PLAN.md](../MCP-PLAN.md). AI apps such as Claude Desktop use
  PDFix's tools with your permission: allowed folders only, new copies only, nothing deleted, sent or uploaded.
  Version 1 about 3–4 days; not started.
