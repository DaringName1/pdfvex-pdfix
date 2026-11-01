# PDFix release audit — October 23, 2026 (Claude, read-only first pass)

Requested by the owner: an evidence-based audit of requirements, compatibility, testing and release risk before the beta.
**No code was changed for this audit.** Tasks in Report 5 wait for the owner's approval.

## 0. Scope, method and limits (read first)

**Method.** Read the existing plans and audits in the project folder, inspected source code for the high-risk areas,
ran `npm audit`, a secrets scan, a dependency/licence check of the newest package, and used today's test results:
a full local app run (170 cases), 516 unit tests, robot sessions with independent output checks, a by-eye review of 40
screenshots, and opening the owner's dad's real drawing locally.

**Read:** V1-WHOLE-APP-AUDIT-2026-10-18 (12 areas), VERIFICATION-PLAN-2026-10-16, KNOWN-ISSUES, SHARED-PLAN, HANDOFF,
UI-RULES / UI-LAYOUT-PLAN, OWNER-PROJECT-GUIDE, ARCHITECTURE/REQUIREMENTS/THIRD-PARTY-NOTICES (top level), and the owner's
ChatGPT master record (docs/reference/…IDEAS-NOT-ALL-DECIDED.md), which bundles 22 older plans. The project folder *is* the
Google Drive folder, so its plans were reachable. **Not read line by line:** every older plan in full (PHASE-LOG,
FEATURE-TRACKER, MASTER-GAP-TRACKER, FINAL-IMPLEMENTATION-PLAN); they were used through the master record and the audit.
**Not done in this pass:** a hostile-PDF fuzzing run, outside-application checks, a screen-reader test, an upgrade-install
test, the spare PC (not used today).

**Two contradictions with the project's recorded decisions (the owner must decide):**
1. **macOS.** The request says Windows *and* macOS. PDFix is Windows-only by design today: the security sandbox uses Windows
   AppContainer + Job Objects (`desktop/native-sandbox.cjs`, `desktop/native/SandboxLauncher.cs`), the PDF engine is the Windows
   qpdf build, the scanner uses WIA, and `scripts/build-windows-package.mjs` builds win32-x64 only. **There is no macOS build at
   all.** A macOS port needs a new sandbox design, Apple developer enrollment, signing and notarization. It cannot be done
   safely by October 31. Recommendation: **the beta is Windows-only**; macOS is post-beta.
2. **Date and audience.** The plan says a beta on **October 30** for the dad and friends, with the repository **private** and
   "make public / code signing decided near release". The request says a **public GitHub beta on October 31**. A public release
   adds the blockers in R3 group C (licence, private history, security policy, release notes).

Status words used below: **Verified** = implemented and proven by a named test or check; **Partly verified**;
**Partial** = partly implemented; **Missing**; **N/A**; **Unknown**.

---

## Report 1 — Executive assessment

**Biggest verified strengths**
- **Saving is safe.** New copies are staged, re-read from disk and published exclusively; save-over keeps the previous
  version first. Proven under full disk, locked files, vanished folders, two saves at once and the app being killed mid-save
  (`tests/pdf-save-faults.test.cjs`, `pdf-save-windows-locks.test.cjs`, `save-in-place-faults.test.cjs`,
  `tests/desktop/process-kill-recovery.spec.js`, 10 cases). Unsaved work comes back after a crash.
- **Documents are not silently changed.** Every PDF load uses `updateMetadata:false` and `throwOnInvalidObject:true` (40 load
  sites), and a structure-diff tool proves each Claude-lane save route changes only what it should
  (`tests/save-structure-claude-lane.test.cjs`, `tests/helpers/pdf-structure.cjs`). Signed or certified PDFs are refused by
  12 modifying routes instead of silently breaking the signature (`tests/pdf-audit-save-routes.test.cjs`, 48 assertions).
- **Redaction removes, it does not just cover.** Output is rebuilt and verified pixel by pixel, and hidden structures and
  document details are removed on purpose (redaction specs and `src/redaction-output.js` re-checks the output has no Info or
  encryption). "Remove hidden data" deletes unlinked objects and refuses if a removed item is shared with kept content
  (`desktop/pdf-sanitize-codec.cjs`). Page deletion builds a fresh copy, so deleted pages do not linger.
- **Private by design and proven offline.** The window is sandboxed with no Node access; all permissions are denied, downloads
  and navigation blocked, every non-app request cancelled (`desktop/main.cjs` 267–282); the page's CSP has `connect-src 'self'`
  and no `unsafe-eval`; every PDF.js load sets `isEvalSupported:false` and `enableXfa:false`. Web links open only after a
  confirmation showing the address. Robot offline mode: 72/72 steps, 0 network attempts.
- **Hostile inputs bounded** for Office, email, Word/RTF, TIFF, PNG/JPEG and Markdown pictures (dedicated hostile-file tests).
- **Honest about standards.** The PDF/A, PDF/UA and PDF/X tools state that no conformance is claimed.
- **A strong test system:** 516 unit tests; 170 app cases (161 pass today, see R3); a user robot that checks every saved
  file independently (about 2,500 spare-PC sessions so far); one clean full cloud run.

**Actual weaknesses (confirmed today)**
- A **real engineering PDF page fails to render** after the new fail-closed picture handling (R3 A1).
- **6 failing app tests and 3 failing robot tasks**, all from recent reader changes (R3 A1–A3).
- **No macOS, no auto-update, no code signing, no PDFix licence** (R3 group C).
- **One critical dependency advisory** (DOMPurify; likely not exploitable here) and an Electron security patch available.
- A file from the owner's dad's drawings is in the **local git history** (not on GitHub, by the upload exclude list).

**Main unknowns**
- **Outside-application compatibility:** no saved file has been opened in Acrobat Reader, Foxit, Bluebeam, Word or Excel yet
  (the compatibility folder is ready; the owner chose to do this last).
- **Screen-reader use** (Narrator/NVDA) has never been tested.
- **Upgrading** from one version to the next has never been tested.
- Long-session reader memory (A-R2) is only partly closed; a broad hostile-PDF corpus has not been run.

**Overall:** for a **Windows-only beta to the dad and friends**, PDFix is close. The blockers are the rendering bug, the failing
tests, two dependency updates and a compatibility check in free readers. A **public** GitHub beta needs more (R3 group C).

---

## Report 2 — Requirements coverage matrix

| Area | Requirement | Plans | Implementation (evidence) | Automated proof | Status |
|---|---|---|---|---|---|
| A. Standards | Open PDF 1.x/2.0 from other apps | REQUIREMENTS, V1 area 2 | PDF.js reader; pdf-lib writers | Real Revu/engineering fixtures; **today one page fails** | Partly verified |
| A | Keep unknown objects and extensions | V1 area 3 | Full-context pdf-lib save; AES-256 extension kept (`compression-inspect.cjs`) | Structure diff on save routes | Verified (Claude routes); Partly (Codex routes, per their evidence) |
| A | Keep metadata | V1 area 3 | `updateMetadata:false` at all 40 load sites | Structure diff includes document details | Verified |
| A | Incremental saving | — | Only certificate signing appends; other tools rewrite | Signed-source refusal tests | Partial by design (rewrite + refuse signed) |
| A | Signatures kept or warned | V1 item D | Modifying routes refuse signed/certified PDFs | 48 refusal assertions | Verified (refusal), no "allowed change" path |
| A | PDF/A, PDF/UA, PDF/X | V1 area 9 | Tools disclaim conformance | — | Honest; not claimed |
| A | Encrypted, malformed, corrupted | V1 area 5 | Encrypted refused before work; fail-closed loads; repair tool | 4 malformed-input checks (Codex); repair tests | Partly verified (no broad corpus) |
| A | Acrobat / Bluebeam / Foxit acceptance | V1 area 2, item E | Compatibility folder of 18 outputs | **None** | Unknown |
| B. Integrity | Never silently destroy data; Save / Save As / overwrite | V1 areas 3–4 | Exclusive new copies; save-over with version history | Fault, lock, kill tests | Verified |
| B | Interrupted saves, crash recovery, disk full, permissions | V1 area 4 | Staging + re-read + exclusive publish | Fault and kill suites | Verified |
| B | Concurrent saves | V1 area 4 | Per-route serialization | "Two saves at once" tests | Verified |
| B | Reopen own outputs | all | Every robot save re-read by `verify.mjs` | Robot + specs | Verified |
| B | Temporary files cleaned | — | Job folders per operation | Owner's real profile: no leftovers | Partly verified (not after a crash) |
| C. Tests | Check results, not messages | V1 rules | `verify.mjs`, structure diff, pixel checks | Most save tests read output | Verified (rule followed) |
| C | Undo/redo restores the document | SHARED-PLAN 2.27 | Per tool | Some tools | Partial |
| C | Memory, large documents | V1 area 6 | Soak tools | A-R2 partly closed | Partly verified |
| C | Multi-tool chains | V1 item A | Robot jobs (crash-and-sign etc.) | Robot | Partly verified |
| D. Security | Malicious PDF, JavaScript, active content | V1 area 5 | No eval, no XFA, no scripting, CSP, sandbox | Code review + offline robot | Verified (design); broad fuzzing missing |
| D | Decompression bombs, untrusted images/fonts | V1 area 5 | Bounded decoders; image cap (now 100 MP) | Hostile-file tests (non-PDF) | Verified (non-PDF); Partly (PDF) |
| D | Path traversal | V1 area 5 | Validated IPC; grants; refuse `..`/drive paths | Markdown/Office/short-name tests | Verified |
| D | No accidental network | V1 area 5 | Request filter, CSP, denied permissions | Offline robot 0 attempts | Verified |
| D | Secure redaction (no recovery via text, metadata, layers, revisions) | V1 | Rebuilt raster output, structures removed | Redaction specs | Verified |
| D | Dependencies | V1 item F | `npm audit` | **1 critical (DOMPurify), 1 high (Electron) shipped** | Needs update |
| D | Update and installer integrity | V1 area 8 | Package manifest + SHA-256; installer verifies inventory | Spare-PC install test | Partly verified (no signing, no updater) |
| E. Install | Clean Windows install / uninstall | V1 area 8 | Per-user installer and uninstaller | Spare PC: install 208 s, robot 8/8, uninstall clean | Verified |
| E | Upgrade install | V1 area 8 | Installs side by side; never overwrites | **None** | Unknown |
| E | Code signing, SmartScreen | — | Unsigned; READ ME explains "Run anyway" | — | Missing (owner decision, paid) |
| E | macOS, Apple Silicon, notarization | — | **None** | — | Missing (scope) |
| F. Updates | Version, release notes, update notice, rollback | — | Version 0.1.0 + build id; no tags or releases; no updater | — | Missing |
| G. Accessibility | Keyboard, focus, large text | V1 area 9 | Keyboard/focus passes, 150% checks | Keyboard state captures | Partly verified |
| G | Screen reader | V1 area 9 | Labels on controls | **None** | Unknown |
| H. Workflows | Open→edit→save→reopen; merge→reorder→compress; scan→OCR→search; fill→sign→reopen; redact→verify | V1 area 1 | All exist | Robot tasks and specs per tool, with saved-output checks | Verified per tool; long chains partly |
| H | Annotate → reopen in Acrobat | V1 item E | — | **None** | Unknown |
| I. Release | PDFix licence | open owner decision | **None** | — | Missing |
| I | Third-party notices | THIRD-PARTY-NOTICES | 147 licence/notice files + inventory of 103 packages in the package | — | Verified (presence) |
| I | Secrets in source | — | Scan: none found | — | Verified |
| I | Private files kept out | owner rule | Upload excludes the drawing folder | — | Partial: the file is in local history (R3 C2) |
| I | Bug reporting, known issues, security policy, changelog | — | Local problem log; KNOWN-ISSUES; no SECURITY.md or changelog | — | Partial |

**Contradictions between plans:** Windows-only (project) vs Windows + macOS (this request); October 30 private beta (plan)
vs October 31 public beta (this request); "PDFs open in View" (October 21) vs "PDFs open in Quick edit" (October 22, current).

---

## Report 3 — Release blockers (prioritised)

### Group A — must fix before any beta (document correctness)

**A1. A real engineering PDF page fails to render.**
- Evidence: `tests/desktop/reader-real-engineering.spec.js:5` fails twice today. On-screen status: "Page 82 could not be
  displayed. Cannot read properties of undefined (reading 'get')". It started after the fail-closed picture commits
  (0be64d0, 0bf1d90, 07595f3).
- Existing coverage: the test exists and passed on October 22.
- Risk: drawing pages show nothing, exactly the dad's kind of file.
- Severity **High**. Confidence **Confirmed**.
- Action (Codex): fix the error and add a unit test for the object pattern that causes it.
- Verify: the spec passes; the robot large-scan task passes; the dad's drawing is rechecked locally.

**A2. Compress: 4 app tests and 1 robot task fail.**
- Evidence: `compression.spec.js:7, :10, :11, :13` cannot find `.compression-workspace .pdf-paper` since d9b73c5 moved
  Compress into a side panel. The robot screenshot shows Compress working (98.6% smaller, checked).
- Risk: an untested save route ships.
- Severity **Medium**. Confidence **Confirmed** (tests), **Likely** test-only (feature).
- Action (Codex): update the specs and the robot task.
- Verify: the 4 specs and the robot task pass, with saved copies checked.

**A3. Reader box selection cuts text.**
- Evidence: `document-editor.spec.js:25`: "Left second line" becomes "Left second".
- Risk: copied text is silently incomplete.
- Severity **Medium**. Confidence **Confirmed**.
- Action (Codex): fix the selection boundary.
- Verify: the spec passes, plus a unit test at the boundary.

**A4. Two robot tasks fail** ("drawing review: refuse a cross-style replacement", "reader: large scans paint…").
- Severity **Medium**. Confidence **Confirmed** (failing); cause **Needs verification**.
- Action (Codex): investigate.
- Verify: each passes run alone (`ROBOT_ONLY`).

### Group B — must fix before beta (security and reliability)

**B1. Dependency advisories in shipped code.**
- Evidence: `npm audit`: DOMPurify ≤ 3.4.16 **critical** (fix 3.4.17), Electron 44.0–44.9.0 **high** (fix 44.9.3). PDFix
  calls DOMPurify with a strict custom allowlist and does not use the affected modes (SAFE_FOR_TEMPLATES, IN_PLACE,
  RETURN_DOM). The Electron advisory concerns trusted internet certificates, and PDFix makes no connections.
- Severity **Medium**. Confidence **Likely not exploitable here**.
- Action (Claude, needs owner approval as a dependency change): update both, then rerun units, the full app suite and the
  package.
- Verify: `npm audit --omit=dev` shows 0 critical; all suites pass.

**B2. Compatibility in free outside readers never checked.**
- Evidence: V1 area 2. The folder `releases/compatibility-check-2026-10-21` (18 outputs + checklist) is waiting.
- Risk: testers' files may not open elsewhere.
- Severity **High**. Confidence **Unknown**.
- Action (owner + Claude): open the 18 outputs in Edge, Chrome, Adobe Acrobat Reader and Foxit PDF Reader (all free) and
  Word Online. Acrobat Reader and Foxit can be installed on the spare PC by the owner; Claude can then script the opening and
  screenshots.
- Verify: the checklist is filled in for every file; each failure becomes a bug.

**B3. Final full runs on the beta package.**
- Today: 161/170 locally.
- Action (Claude): after A1–A4 and B1, a full local run, a spare-PC robot run, the install/uninstall test on the beta
  package, then the two cloud runs the owner allowed at beta.
- Verify: 0 unexplained failures.

### Group C — needed only if the beta is public on GitHub

**C1. PDFix has no licence.**
- Evidence: no LICENSE file; `package.json` has no `license` field.
- Risk: the public cannot legally use or share it; contributors have no terms.
- Severity **High** (public). Confidence **Confirmed**.
- Action (owner decides; GPL-3.0 was suggested earlier; all bundled licences are compatible, and one dependency is
  "MIT OR GPL-3.0-or-later").
- Verify: LICENSE present; `package.json` names it.

**C2. A file from the dad's drawings is in the local git history.**
- Evidence: the private drawing sample in `samples/dad-drawing-review/` and its receipt were tracked since the first
  commit 303a507; `docs/DAD-DRAWING-REVIEW-SAMPLES.md` names it. The GitHub upload excludes the folder
  (`.github-publish-exclude`) and copies files without history, so the PDF has most likely never left the PC. The doc naming
  it is uploaded.
- Severity **High** (public). Confidence **Confirmed** locally, **Likely** absent on GitHub.
- Action (Claude, with owner approval): stop tracking the sample (keep it on disk), add the doc to the exclude list or remove
  the naming, and make sure the public repository is created from the upload copy, never by pushing this history.
- Verify: in a fresh clone of the public repository, `git log --all -- samples/dad-drawing-review` is empty and the name does
  not appear.

**C3. No release paperwork:** no tags, no GitHub release, no changelog or release notes, no SECURITY.md telling people how to
report a vulnerability privately.
- Severity **Medium**.
- Action (Claude): CHANGELOG, release-notes template, SECURITY.md, tag `v0.1.0-beta.1`, publish the zip + SHA-256.
- Verify: the release page lists the files and their checksums.

**C4. Unsigned installer (SmartScreen warning).**
- Severity **Medium** (public), **Low** (friends; the READ ME explains it).
- Action: owner decision on a paid signing option near release (already recorded).

**C5. macOS.** Not buildable by October 31 (see section 0). The beta is described as Windows-only.

### Not blockers (keep going, do not delay the beta)

- The UI review items, Quick edit and the side panel (SHARED-PLAN 2.30–2.35, Codex).
- Workspaces, Bluebeam-specific work and add-ons (deferred by the owner).

---

## Report 4 — Post-release improvements

1. **Update path without a server:**
   - "About PDFix" shows the version and build.
   - Release notes on GitHub Releases.
   - Later, an optional "check for a newer version" that only opens the GitHub Releases page in the browser, after asking.
   - Signed releases when signing is decided.
2. **Upgrade install:** install over an older version on the spare PC; settings, recovery drafts and documents kept; old
   versions offered for removal; one desktop shortcut.
3. **Screen-reader pass** with Narrator and NVDA on the core workflows; fix labels and announcements.
4. **Hostile-PDF corpus / fuzzing** through every opener (refuse or contain, never hang), plus a temporary-file cleanup check
   after a crash during a sandbox job.
5. **Long chains** (10+ steps across tools with a restart in the middle) as robot jobs; undo/redo checked against saved output.
6. **Reader memory over long sessions** (A-R2) to a clear pass.
7. **Signed PDFs:** allow safe changes (form fill, comments) as an incremental save that keeps the signature, instead of
   refusing.
8. **Bug reports from testers:**
   - a "Copy problem report" button with no document names or contents
   - plus a GitHub issue template
9. **macOS port** (separate project: sandbox design, Apple enrollment, notarization).

---

## Report 5 — Development tasks (await owner approval)

| # | Owner | Task | Acceptance | Regression tests |
|---|---|---|---|---|
| T1 | Codex | Fix the page-render error on the real engineering PDF (A1) | `reader-real-engineering.spec.js` passes twice; page 82 renders; dad's drawing still renders (Claude checks locally) | New unit test for the failing object pattern; robot large-scan task |
| T2 | Codex | Update Compress specs and the robot export task to the side panel (A2) | 4 specs + robot task pass with saved copies verified | Same specs; `check-tools-*` for Compress |
| T3 | Codex | Fix box-selection boundary (A3) | `document-editor.spec.js:25` passes | Boundary unit test |
| T4 | Codex | Fix or explain the 2 failing robot tasks (A4) | Each passes alone with `ROBOT_ONLY` | Robot replay |
| T5 | Claude | Update DOMPurify 3.4.17 and Electron 44.9.3 (B1; owner approves dependency change) | `npm audit --omit=dev` 0 critical; units, full app suite and package build pass | Full suites; editor import/paste tests |
| T6 | Owner + Claude | Compatibility check in free readers (B2) | Checklist complete for all 18 outputs in Edge, Chrome, Acrobat Reader, Foxit, Word Online | Failures become specs with the reproducing file |
| T7 | Claude | Beta verification run (B3) | Full local run 0 unexplained failures; spare-PC robot run; install/uninstall on the beta package; two cloud runs | — |
| T8 | Claude (if public) | Remove the drawing sample from tracking and naming; public repo from the upload copy only (C2) | Fresh public clone has no trace (`git log --all -- samples/dad-drawing-review` empty; name absent) | A check in `publish-github.mjs` that refuses to upload if any excluded path or name appears |
| T9 | Owner, then Claude (if public) | Licence (C1) + SECURITY.md + CHANGELOG + release notes + tag + checksums (C3) | Release page complete; licence in repo and package | Package build checks LICENSE is included |
| T10 | Claude | "About PDFix" with version and build; upgrade install test on the spare PC (R4.1–2) | Version visible; upgrade keeps settings and drafts; shortcut points to the new version | Spare-PC upgrade script |
| T11 | Claude | Narrator smoke test of open, find a tool, save (R4.3) | Results recorded; bugs filed | — |
| T12 | Claude | Temp-file cleanup after a crash during a sandbox job (R4.4) | No job folders left after restart | New kill-during-job spec |

**Owner decisions needed first:**
1. Windows-only beta (recommended)?
2. Private beta on October 30 or public on GitHub on October 31?
3. The licence.
4. Approval for T5 (dependency updates) and T8 (git tracking change).
