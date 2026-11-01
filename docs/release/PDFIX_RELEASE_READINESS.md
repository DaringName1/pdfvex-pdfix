# PDFix release readiness (audit, October 25, 2026)

Target: Windows-only public GitHub beta on **October 31, 2026**, after a small private test.

Audit only: no code was changed. Claims below come from reading the code and from recorded test results; where a
claim rests only on code, it says so. This is not legal advice.

**Verdict: not release-ready today.** The blockers are listed in [PDFIX_PRIORITY_TASKS.md](PDFIX_PRIORITY_TASKS.md) (P0).

> **October 26 update:** Compress and the flaky robot tasks are resolved. The crash-draft loss and the antivirus
> locks are fixed. Full suite 191 pass on 11ff352. Current blockers and answers:
> [MASTER-IMPROVEMENT-PLAN-2026-10-26.md](MASTER-IMPROVEMENT-PLAN-2026-10-26.md) sections E and H.

## Executive summary

**1. What share of planned features is implemented?**
- **All 67 rows of the app's capability list have code; 63 (94%) are complete**, 3 are partial and 1 fails its tests, in
  [PDFIX_FEATURE_INVENTORY.md](PDFIX_FEATURE_INVENTORY.md). Those rows describe the tools; the planned new UI is not part of them.
- Counting the approved new UI, the figure is lower. That UI is about 50% done (owner's estimate), and SHARED-PLAN
  2.19 and 2.21–2.35 are mostly todo or doing.
- **This is an estimate.** Grouping features differently changes it, and the October 11 plan ledger (264 items) was
  never re-scored.

**2. What share is verified to work?**
- **About 76%** (51 of 67) has an output-checking test that passed on a development build since October 22,
  including the 31 older robot tasks rerun on the new UI on October 25 (all pass).
- **0% has been verified on a packaged build that has the new UI.**
- Nothing has been verified in Acrobat Reader, Foxit or Office.

**3. Can a regular person install and use it today?**
- **A friend helped by the owner: probably yes.** The October 22 tester package has a double-click installer, and the
  October 21 package installed and passed the robot on the spare PC.
- **A stranger downloading from GitHub: not yet.** Nothing is signed (SmartScreen warns once, at install). Update
  October 27-28: people now install with PDFix-Setup.exe (owned by Codex from October 28); the downloaded-zip path and
  install, upgrade and uninstall passed on the spare PC after four fixes (see P0-5, P0-6).

**4. What could make a user lose or corrupt a document?**
The core save path is strongly protected and tested: new copies only, save-over keeps a version first, and
kill/disk-full/locked-file tests pass. The remaining risks:
- **Compress** has no passing output check (P0-1).
- **Kills during the new on-page saves** (Compress, Redact, table) are untested (P1-1).
- **Brief file locks by other programs** (antivirus, Windows Search) can make a save of PDFix's own lists, a
  recovery draft or a save-over fail once with a confusing message (P1-14, reproduced 10-25). The document is not
  harmed, and trying again works.
- **Outside readers:** files might not open or show correctly elsewhere (P0-8).
- **Upgrades:** a new build reading an old build's data is untested (P1-9).
- **Running PDFix from a temporary folder:** the spare PC saw saving fail there on October 19 (P1-3). It did not happen
  on the main PC on October 26 (Word, PDF and form saves all worked); one recheck on the spare PC is still due.
  October 27: a related crash was found and fixed - PDFix did not start when the temp folder has a short 8.3 name.
- **Signed PDFs** are refused rather than damaged; proven only with synthetic signatures.

**5. The ten most important unfinished tasks**
1. Fix and reverify Compress (P0-1)
2. Codex's UI at a stable, committed point with its tests updated, including the 3 specs failing today (P0-3)
3. Full app run and robot run on that commit, with 0 unexplained failures (P0-4)
4. Package with the new UI: install, upgrade, uninstall on the spare PC (P0-5)
5. Downloaded-zip install path and the "Extract all" guard (P0-6)
6. Private test with the dad and friends (P0-7)
7. Acrobat Reader and Foxit check of the outputs (P0-8)
8. Licence and the name decision (P0-9)
9. Fresh public repository and the release page (P0-10)
10. Kill test during the new on-page saves, plus a retry for brief file locks (P1-1, P1-14)

**6. Is October 31 realistic for a Windows beta?**
- **A small private beta (the dad and friends): yes, if Codex's UI is committed and stable by about October 28.**
  That leaves 2–3 days for the full runs, the package test and the testers.
- **A public GitHub beta: possible but tight.** It also needs the licence, the name decision, the fresh repository
  and the download test; any owner decision arriving late moves it.
- **Recommendation:** a private beta on October 31, and the public beta once the private testers' findings are fixed
  (likely early November). If a public October 31 stays the goal, freeze the UI on October 28 and ship what is
  finished then.

**7. Who should do what**
- **Codex:** Compress (P0-1), the two flaky robot tasks (P0-2), finishing and committing the UI with updated tests,
  including the 3 failing specs (P0-3), plain error wording (P1-6).
- **Claude:** all full runs and the robot, the release package and the spare-PC install/upgrade/download tests, the
  licence files, the public repository and release page, kill tests, the history-write investigation, the
  release-notes limitations, Narrator.
- **Human testing:** the private testers, a physical print, Acrobat Reader/Foxit/Word/Excel/PowerPoint, a real
  scanner, read aloud with speakers. Owner decisions: licence, name, signing, fewer save ticks.

---

## 1. Installation, launch and updates

### What PDFix is built with
| Part | What | Where |
|---|---|---|
| App framework | Electron 44.9.3 (Chromium + Node), renderer built with Vite 8.3.1 | `package.json` |
| PDF engines | pdf.js 6.3.289 (view), pdf-lib 1.17.1 (write), qpdf 12.4.2 (repair/encrypt/compress) | `package.json`, `dist/native/qpdf` |
| Document engine | A separate Node runtime inside a Windows AppContainer + Job Object sandbox | `desktop/native-sandbox.cjs`, `desktop/native/SandboxLauncher.cs` |
| Native helpers | Small C# programs compiled with the .NET Framework compiler built into Windows (scanner, certificate signing/trust, speech, spelling, virtual printer, graphics launcher, paged reader) | `desktop/native/*.cs`, `scripts/build-*.mjs` |
| OCR | Tesseract.js 7 with 6 bundled languages | `dist/ocr-assets` |
| Packager | PDFix's own script, **not** electron-builder | `scripts/build-windows-package.mjs` |

### How it installs today
- `npm run package:windows` makes a folder `releases/PDFix-<version>-<time>-<id>-win-x64/`:
  - `app/` (portable program; `app/PDFix.exe` is the graphics launcher, which starts `app/runtime/PDFix.exe`)
  - `Install-PDFix.ps1` and `Uninstall-PDFix.ps1`
  - manifests with a SHA-256 for every file
- **Install** (`packaging/Install-PDFix.ps1`):
  - per user, no administrator rights
  - copies to `%LOCALAPPDATA%\Programs\PDFix\<buildId>\` after checking every file's SHA-256
  - Start menu shortcut, plus a desktop shortcut with `-DesktopShortcut`
  - an uninstall entry under the current user's registry
  - "Open with" only with `-RegisterOpenWith`
  - **never overwrites an existing build**; a new build installs next to the old one
- **Tester wrapper** (hand-made, `releases/PDFix-for-Dad-2026-10-22/`): "Install PDFix.cmd" runs the script with
  `-ExecutionPolicy Bypass -DesktopShortcut`; "Uninstall PDFix.cmd" removes every installed build. No script generates
  this wrapper yet.
- **Update October 27-28:** a standalone PDFix-Setup.exe now exists (Inno Setup, per-user, replaces older versions;
  packaging/PDFix-Setup.iss, scripts/make-setup-exe.mjs) and is **owned by Codex from October 28**. Still **no code
  signing** and **no updater**. Earlier wording, kept for history:
- **There is no standalone installer** (.exe or .msi), **no code signing**, and **no updater**. Updating means
  downloading and installing the next build, which then sits next to the old one.

### Does it need development tools?
No.
- The package carries the Electron runtime, the document engine's Node runtime, qpdf with its Visual C++ runtime DLLs,
  and the compiled helpers.
- It needs Windows 10 or 11, 64-bit, and PowerShell 5.1, which every Windows 10/11 has.
- **Evidence:** the spare PC (Windows 10 Home) ran installed packages; the development PC is Windows 11 Pro. ARM64
  Windows was never tried.

### Can a regular person install it on a clean PC?
**Probably yes, but not proven for the public path.**
- **Proven (October 21, package `d207b695`):** on the spare PC the install took 208 s, the robot passed 8/8 on the
  installed app, and the uninstall took 76 s and left nothing behind (SHARED-PLAN 5.1). The spare PC had earlier
  PDFix builds, so it was not truly clean.
- **Not proven:**
  - Downloading the zip from GitHub (the file then carries the "from the internet" mark), and how SmartScreen reacts
    to the unsigned `.cmd`, the PowerShell script and `PDFix.exe` at first launch.
  - **Double-clicking "Install PDFix" inside the zip without extracting.** Windows extracts only that one file to a
    temporary folder, so the script is not found. The READ ME doesn't say "Extract all" first.
  - **Running PDFix from inside a temporary folder:** the spare-PC notes say Word and PDF copies then fail to save
    ("Document sandbox cleanup failed"). Not re-checked since October 19.
  - A first start that stays fast with the 6 OCR languages and the large package (size not re-measured since
    October 21).

### What a distributable installer still needs
1. A release build from committed code, with version `0.1.0-beta.1`.
2. A script that generates the friendly wrapper (Install/Uninstall .cmd + READ ME) instead of hand-copying it.
3. The zip with its SHA-256 on the GitHub release page.
4. A test of the downloaded zip on the spare PC, including SmartScreen.
5. An upgrade test.
6. An optional "Extract all first" guard in the `.cmd`.
7. Signing (cost and eligibility are open, section 6).

### Data during updates and uninstall
**What's where (from the code):**
- Settings, recovery drafts, recent files, version history and tool data live in
  `%APPDATA%\pdfix-document-workspace` (`desktop/main.cjs:157`).
- Every installed build shares this folder, so a new build reads the old build's data.
- **Uninstall never deletes it, and never touches documents.** Uninstall removes only the files whose SHA-256 still
  matches the install receipt, plus PDFix's own shortcuts and registry values.

**Not tested:**
- That a newer build reads an older build's data correctly. There is no data-version migration test (test 7).
- There is no "remove my PDFix data too" option, so a person who wants everything gone must delete the folder by hand.

---

## 2. Security

**Verified in code and by tests:**
- **The window has no access to the computer:**
  - sandboxed renderer, context isolation, no Node in the page
  - every permission refused, downloads cancelled, navigation blocked, new windows denied
  - every request that isn't a bundled app file is cancelled (`desktop/main.cjs` 270–282)
- **PDF content can't run:** pdf.js runs with `isEvalSupported:false` and `enableXfa:false`. The hostile run
  confirmed that nothing ran and nothing contacted the network (10-25).
- **Document parsing is contained:** it runs in an AppContainer with no network capability, 512 MB memory and a
  115-second limit.
- **Web links** open in the browser only after a confirmation that shows the address (`desktop/main.cjs:296–302`).
- **Dependencies:** `npm audit --omit=dev` showed 0 critical and 0 high on 10-24, after the DOMPurify 3.4.17 and
  Electron 44.9.3 updates.
- **No secrets** found in the source (10-23 scan).
- **Private files** stay out of git going forward, and the upload script refuses any private name it is told about.
  **The public repository must start from fresh history.** This repository's history once contained a private
  drawing.

**Not verified:**
- No fuzzing, only a fixed set of 18 hostile files.
- No outside security review.
- The sandbox's "Verification: runtime isolation… security review pending" note in `native-sandbox.cjs status()` is
  still the code's own statement.

---

## 3. Licensing

- **PDFix's own licence:** GPL-3.0-or-later is the provisional choice. The review found it compatible with all 103
  bundled libraries, qpdf/OpenSSL 3, Electron/Chromium and the fonts (`docs/release/LICENSE-REVIEW-2026-10-23.md`).
  The GPL-2.0-only Liberation fonts ship as separate files, which counts as aggregation and is allowed.
- **Still missing:** a LICENSE file, the `license` field in `package.json` and the README note. The package build does
  not yet check that LICENSE ships.
- **Third-party notices:** 147 licence/notice files and a 103-package inventory ship inside the package (presence
  verified, wording not reviewed line by line).

### The name "PDFix" (release consideration)
PDFix, Inc. (pdfix.net) sells PDF products called PDFix Desktop Pro, PDFix SDK and PDFix Desktop Lite. A public free
PDF editor with the same name could cause a trademark complaint, or forced renaming after users already know the name.
This audit did not check trademark registrations. **Owner decision; ask a lawyer if keeping the name.**

---

## 4. The owner's principles, checked

| Principle | Holds? | Evidence |
|---|---|---|
| All core PDF functions are free | **Yes** | No payment, licence-key or feature-lock code exists (searched desktop/ and src/) |
| No account for ordinary local use | **Yes** | No sign-in code; nothing contacts a server |
| Paid workspaces work with licences that don't need a permanent connection | **Not applicable yet** | Workspaces are postponed; no licence code exists. Design it offline-first when it starts |
| Users control whether PDFix is the default app | **Yes (by design)** | The installer registers "Open with" only with `-RegisterOpenWith`. The default app changes only in Windows Settings (stated in the package README). Never tested in Explorer (project rule) |
| Local processing stays local unless users choose otherwise | **Yes** | Network blocked at the request filter and CSP; the offline robot made 0 network attempts; links need confirmation. The only outbound actions the user can trigger are a confirmed link and their own email client |
| Updates never interrupt active work without permission | **Yes, trivially** | There is no updater. When one is added, it must only notify |

---

## 5. Testing: what passed where

### Development builds (`dist/` + Electron)
| Suite | Latest result | Date |
|---|---|---|
| Unit tests | 520 pass, 0 fail | 10-25 |
| Full app suite (184 cases) | **180 pass, 3 fail, 1 skipped** (17 min); the 3 failures fail again on committed 2487a21 (see "Full run, October 25") | 10-25 |
| Robot, local (86 tasks over 85 sessions) | 84 tasks last passed; 2 failing (both Compress, A2) | 10-17 … 10-25 |
| Hostile PDFs | 18/18 | 10-25 |
| Compatibility checks of 18 outputs (qpdf, Edge's Adobe engine, content, redaction bytes) | 18/18 | 10-24 |
| Robot replay 7101 (22 steps) | 22/22 | 10-24 |

### Packaged builds
| Test | Result | Package / date |
|---|---|---|
| Spare-PC robot runs 3–6 | Run 3: 1,735 sessions, 99.0% clean | Packages of 10-19 to 10-21 |
| Install / robot / uninstall | 208 s / 8 of 8 / clean | `d207b695`, 10-21 |
| Packaged reader launch and graphics checks | passed (Codex, check-reader-packaged-*) | 10-17/18 |
| **Any package with the new UI (10-22 onward)** | **never tested** | — |
| GitHub download → install on a clean PC | never | — |
| Upgrade over an older build | never | — |

### Outside programs
- Acrobat Reader app, Foxit, Word, Excel and PowerPoint: **never**. Only Edge's built-in viewer, which uses Adobe's
  engine.

### Coverage gaps
- **Data loss and corruption:** kills during the new on-page Compress/Redact/table saves; long chains across tools.
- **Save and reopen fidelity:** outside readers.
- **Crashes:** power loss (only process kills tested); sleep or log-off during a job.
- **Large and unusual files:** real signed PDFs; network-share paths; ARM64.
- **Memory:** a full long-session reader memory pass (A-R2 partly closed; Codex's 90-minute gate not run).
- **Security:** fuzzing.
- **Regressions after UI changes:** the 31 robot tasks that last ran before October 22 were rerun on 10-25 and all
  pass; no package with the new UI has been tested.

---

## 6. Release preparation and costs

**Done (Claude, 10-23 to 10-25):**
- SECURITY.md, CHANGELOG.md, release notes draft, issue template
- README introduction, the version in Settings
- the public release checklist (`docs/release/PUBLIC-RELEASE-CHECKLIST.md`)
- the upload privacy check
- backups

**Still to do:**
- LICENSE, the version bump and the fresh public repository
- tag `v0.1.0-beta.1`, then the GitHub Release with the zip and its SHA-256
- the owner turns on private vulnerability reporting
- the downloaded-zip test

**Operating costs:**
- **GitHub:** free for a public repository. GitHub-hosted Actions minutes are also free for public repositories, so
  the "minutes used up" limit applies to the private repository only. **Confirm this in the account before relying on
  it.**
- **Code signing:** not decided.
  - Microsoft's Artifact Signing (formerly Trusted Signing) has a Basic tier at a monthly fee. The pricing page didn't
    show the amount during this audit, and eligibility for individuals wasn't confirmed.
  - SignPath Foundation offers free signing for open-source projects that are approved. Eligibility wasn't checked.
  - Without signing, every tester sees SmartScreen's "Windows protected your PC".
- **No servers, no hosting, no paid services** are used by the app.

---

## 7. Launch requirements (summary)

**Must have for October 31** (detail and owners in PDFIX_PRIORITY_TASKS.md):
1. A2 and A4 fixed, then reverified.
2. Codex's UI at a stable, committed point, with its tests updated.
3. A full app run and a robot run on that commit, with 0 unexplained failures.
4. A release-candidate package tested on the spare PC: install, robot, upgrade over an older build, uninstall, and the
   downloaded-zip path.
5. The private test with the dad and friends, and its findings triaged.
6. Outputs opened in Acrobat Reader and Foxit, at least for the 18-file folder.
7. The licence finalized, the name decided, and the fresh public repository passing `publish-github.mjs --check`.

---

## Full run, October 25

- **Build:** the working tree at 7b70a89 plus Codex's then-uncommitted file-action changes (committed at 20:53 as
  2487a21). **Result:** 184 cases, **180 passed, 3 failed, 1 skipped**, in 17.1 min.
- **The 3 failures**, rerun alone on a fresh build of committed 2487a21: **all 3 fail again.**
  - `markup.spec.js:19` waits for a Print button in the reader's second row
  - `reader-paged-search-all.spec.js:8` and `reader-paged-search.spec.js:10` wait for "Find on this page"
- Print and Find now live in the fixed top-right file actions ("Find in PDF"). Codex's commit did not update these
  specs (SHARED-PLAN rule 1), so they are **most likely test-only**. That isn't proven until the specs are updated and
  pass with their checks unchanged.
- A1 (`reader-real-engineering`, 163 pages, 1,372 comments inventoried) and A3 (`document-editor`) pass in this run.

## UI usability (current UI, October 25, about half finished)

Reviewed from 40 screenshots of the built app (commit 2487a21; every Build tab and its first drop-down, at 1366×820
and 1366×700), saved in `tmp/ui-review-2026-10-25/` (not in git). **No UI was changed.**

**Better since October 23:**
- File actions now stay in one place, top right (Find in PDF, Save a copy, Print).
- View is much simpler.
- Groups have names with ▾.
- Short screens fold to icons with "Show names".
- Messages no longer cover the page.

**Problems, most important first:**
1. **Quick edit doesn't exist yet.** PDFs open in **View**, and the mode list offers only View and Build. Signing and
   filling, the most common jobs, need a switch to Build first, which contradicts the owner's rule (UI-RULES; 2.31).
2. **"Actions" (top right) is a vague name**, and there's no **Share**.
3. **Two full-screen buttons** (top bar and second row), plus an unlabelled icon beside them. The left rail icons have
   no visible names. Accessible names were not checked in this audit.
4. **Inconsistent buttons on the second row:** page and zoom buttons are boxed, while "Fit page"/"Fit width" and
   "Pages panel" are plain text. The fit button reads "Fit page" in View and "Fit width" in Build.
5. **Export:** still 10 buttons with three-line names. "Edit a text document copy" sits under Save as, and "Inspect
   and repair thin lines" belongs to Measure (UI-LAYOUT-PLAN).
6. **Drop-downs repeat the visible tools** with no "Less used" part (Edit's TEXT menu lists exactly its 3 buttons).
7. **Not built yet:** Undo/Redo by the file name, the right-edge panel bar, the side panel with "Save as my default",
   click anywhere to type in Quick edit, drag and drop onto the page, and a status bar beyond "Page 1 of 3".
8. **Too many steps for saving** (W1, owner decision): preview, an "I checked" tick, then Save, for each tool.
9. **Unclear errors:** about 100 error strings in `desktop/*.cjs` use internal words ("isolated", "contained",
   "envelope", "SHA-256"). Most appear only on internal failures, but two raw engine messages were seen on screen in
   the hostile run.
10. **Keyboard and accessibility:**
    - keyboard menus are tested in 3 of the new tabs
    - focus and Escape were fixed earlier (KNOWN-ISSUES A-R11/A-R12)
    - **no screen-reader test at all**
11. **Hard to discover for a first-time user:**
    - Build is needed for anything beyond reading
    - "Find a tool" is shown only in Build
    - Fill and sign sits under "Pages and forms" on the Home tab
    - the left rail has no names
