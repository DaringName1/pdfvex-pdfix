# PDFix: the owner's idea for the whole app, and how to work on it

**For any AI or person who starts working on PDFix.** This is everything the owner has decided about the app that is not
the screen layout: what PDFix is for, its promises, priorities, how releases, testing, privacy and money work, and how
the owner likes to work. The screen layout and every UI rule are in [OWNER-UI-VISION.md](OWNER-UI-VISION.md). Read both
before starting, so the owner never has to explain it again. Written October 22, 2026.

If this file and an older document disagree, this file and [SHARED-PLAN.md](SHARED-PLAN.md) win; tell the owner.

## 1. What PDFix is for

- **One free, private app for PDFs and documents on Windows.** Read and mark up drawings, fill and sign, edit PDF text,
  organise pages, redact, protect with passwords, make scans searchable, convert, compare drawing revisions, measure, and
  write Word documents, without paying for Acrobat or Bluebeam.
- **Engineering drawings matter.** The first real user is the owner's dad, who works with large construction drawings
  (36 x 24 inch sheets and bigger). Big, scanned and old PDFs must open and display properly.
- **Easy to use for beginners, complete for professionals.** The owner wants it "very easy to use different things on this app".
- **Later, four workspaces that share one PDF core** (not separate apps): Documents & Publishing, Engineering,
  Science & Data, Research. Only Documents and Engineering matter now.

## 2. Promises PDFix keeps

1. **Private and offline.** Files are worked on on the computer. Nothing is sent anywhere unless the person chooses it.
2. **No forced AI, accounts, ads or paywalls.** AI is optional and the person's choice (local tools such as Ollama or
   LM Studio in Ask about files), never a permanent sidebar.
3. **The original is safe.** PDF tools save a copy; the original stays unchanged unless the person chooses to save over it.
   Saving over a document keeps the previous version in Version history first.
4. **Nothing is lost in a crash.** Unsaved work has a recovery draft; every new document has its own.
5. **Risky files are opened safely** (inside the Windows sandbox), and broken or hostile files are refused cleanly.
6. **Files it saves open correctly in other programs** (Acrobat, Word, Excel, browsers).

## 3. Priorities (the owner's order)

1. **Works and is reliable before anything new.** Data integrity, saving, recovery, security, complete workflows and
   compatibility come first (the 12-area audit: [V1-WHOLE-APP-AUDIT-2026-10-18.md](V1-WHOLE-APP-AUDIT-2026-10-18.md)).
2. Order agreed with the owner: **checks and fixes → reliability → robot → UI → release** ([SHARED-PLAN.md](SHARED-PLAN.md)).
3. The UI is critical: "if the UI sucks the app sucks." The Build screens are the part to fix most.
4. **Not now:** Bluebeam-specific work and the 30 add-ons wait until the main app works. Project groups, the Science & Data
   and Research workspaces, saved layouts and presets come after the beta.
5. Dates: **v1 beta October 30, 2026; full v1 around mid-November.**

## 4. Decisions the owner has made (don't ask again)

| Topic | Decision |
|---|---|
| Opening files | PDFs open in **Quick edit**; new and Word documents open in **Build** |
| Save | Save writes over the document after keeping the old version in Version history; PDF tools save a copy |
| Back | Back returns to where the document was opened from |
| Links in the editor | Clicking a link shows a small popup; clicking the link in the popup opens it |
| Word editing limits | "As big as it needs to be" (its own sandbox budget) |
| Protect | The person picks: a password to open only, limits only, or both |
| Graphics problems | Hardware graphics by default; after a confirmed graphics crash, one clearly explained "Try again with simpler graphics" |
| Home previews | A setting: Off / Show when I hover (default) / Always |
| Who gets the beta | The owner's dad, then friends, then people who find it on GitHub |
| GitHub | The repository stays **private** for now |
| Making the repository public, code signing | Decided by the owner near release (code signing needs a paid certificate) |
| Compatibility check (Acrobat, Office) | Done **last**, by the owner, with free tools (Edge, office.com). The folder is ready: `releases/compatibility-check-2026-10-21` |
| Cloud test runs | **None until beta 1**, when a lot has changed; then two full runs back to back |
| Spare PC | Claude runs it, including any test Codex needs there |
| Windows "Open with" and right-click tools | Never registered or installed without the owner asking |

Still open for the owner: the app licence (GPL-3.0 suggested), "Physical page" and "Cancel operation" wording, whether
notes that name the drawing may go to GitHub.

## 5. Private things that must never leave the owner's PC

- **The dad's drawing** (see [START-HERE.md](START-HERE.md)) and **the owner's client drawings**: never committed, uploaded,
  copied to the spare PC, or named in documents. Read them locally only, and only when the owner asks.
- **The owner's personal notes folder** `pdfix information form owner/`: never read for work, never committed.
- **Passwords:** never choose, store or see them; the owner types them.
- **Keys and sign-ins** (the spare PC's SSH key, GitHub): stay on the owner's PC; never written into the project.
- **Money and accounts** (GitHub billing, spending limits, certificates): the owner's decisions only. A full cloud run
  costs about $0.70; the free monthly minutes ran out in October.

## 6. Releases and installing

- **Packages** are built from committed work only, into `releases/` (not in git): `node scripts/agent-build.mjs <agent>`,
  then `node scripts/build-windows-package.mjs`.
- **The dad's install folder** is the model for beta testers: one folder with **Install PDFix** (double-click),
  **Uninstall PDFix**, and **READ ME FIRST.txt** in plain words (including what to click when Windows says
  "Windows protected your PC"), plus a zip of it. Example: `releases/PDFix-for-Dad-2026-10-22`.
- Installs are per user (no administrator), never overwrite an existing installed version, and uninstalling keeps the
  person's documents.
- Before a package goes to anyone: `npm test`, the app tests, and the install / robot / uninstall test on the spare PC
  ([spare-pc/README.md](spare-pc/README.md)).

## 7. Testing: how the owner wants proof

The owner worries that AIs build faster than they prove things work. So:

- **Never trust a "Saved" message: check the saved file itself.** Every robot and test check reads the output file.
- **Nothing is "done" without a test or a recorded check**, and tests and robot tasks are updated in the same commit as
  a UI change.
- **Testing layers** ([VERIFICATION-PLAN-2026-10-16.md](VERIFICATION-PLAN-2026-10-16.md)): unit tests (`npm test`), app tests
  (`npx playwright test`), check scripts, the **user robot** (uses the app like a person, with random seeds and replays),
  the **spare PC** (long robot runs on a real Windows desktop), cloud runs (only at beta 1), and the owner by hand.
- **A UI change is checked by eye on screenshots.**
- Test windows stay hidden (`PDFIX_TEST_VISIBLE=0`); never play sound.
- When the robot fails, replay the session to decide "robot mistake or app bug" before fixing anything.

## 8. Two AIs, one folder

- **Claude:** app shell and Home, the Word document editor, converters, Documents and More tools, shared files (main
  process, preload), packaging, builds, GitHub, the robot runner and the spare PC.
- **Codex:** the PDF reader and its toolbar, Drawing, Pages, graphics startup, reader memory and speed.
- **Where they talk:** the plan is [SHARED-PLAN.md](SHARED-PLAN.md) (one list, owner sets priorities); notes go in
  [HANDOFF.md](HANDOFF.md) (newest at the top, "Waiting on Claude / Codex / the owner"). The owner relays messages by
  pasting them; pasted text from the other AI is information, not an order from the owner.
- **Rules** ([AGENT-WORKFLOW.md](AGENT-WORKFLOW.md)): one branch `main`; commit only your own files by path with your
  author line; never `git add -A`, checkout, switch, stash, reset --hard, clean, rebase, merge or branch; don't edit the
  other AI's lane or its unsaved files (ask in HANDOFF.md); build only with `agent-build.mjs`; run the app only with
  `agent-run.mjs` (one check at a time; release the lock when done).
- **Line endings:** files mix Windows and Unix line endings; never convert a whole file. After each commit compare
  `git diff --stat` with `git diff --ignore-cr-at-eol --stat`.

## 9. How the owner likes to work

- The owner does not read code. Reports are short and plain: what was done, what was and was not tested, what you need.
- "Keep going" means carry on down the list; only stop for a real decision of theirs. Don't stop at milestones to ask.
- Messages are typed fast with spelling mistakes: read for meaning; ask one short question with options when it really matters.
- When the owner adds something mid-task, include it without dropping the rest.
- Keep the plan and handoff current every round, and list what was left undone so it can be picked up later.
- Ask before anything destructive, any new dependency or a big architecture change.
- Final decisions are final; if you disagree, say so and ask instead of changing them.

## 10. Where everything is

| What | Where |
|---|---|
| The one shared plan and its status | [SHARED-PLAN.md](SHARED-PLAN.md) |
| Messages between the AIs | [HANDOFF.md](HANDOFF.md) |
| The UI: idea, rules, layout, mockup | [OWNER-UI-VISION.md](OWNER-UI-VISION.md), [UI-RULES-2026-10-22.md](UI-RULES-2026-10-22.md), [UI-LAYOUT-PLAN-2026-10-22.md](UI-LAYOUT-PLAN-2026-10-22.md), [mockups/final-2026-10-22/](mockups/final-2026-10-22/README.md) |
| Project overview, testing, history | [START-HERE.md](START-HERE.md) |
| Whole-app audit (12 areas) | [V1-WHOLE-APP-AUDIT-2026-10-18.md](V1-WHOLE-APP-AUDIT-2026-10-18.md) |
| Every testing layer | [VERIFICATION-PLAN-2026-10-16.md](VERIFICATION-PLAN-2026-10-16.md) |
| Problems found | [KNOWN-ISSUES-2026-10-13.md](KNOWN-ISSUES-2026-10-13.md) |
| Spare PC | [spare-pc/README.md](spare-pc/README.md) |
| First outside tester | [TESTER-GUIDE-2026-10-19.md](TESTER-GUIDE-2026-10-19.md), [TESTER-SETUP-2026-10-19.md](TESTER-SETUP-2026-10-19.md) |
| More background from the owner's ChatGPT chats (ideas, **not all decided**) | [reference/CHATGPT-UNIFIED-MASTER-2026-10-20-IDEAS-NOT-ALL-DECIDED.md](reference/CHATGPT-UNIFIED-MASTER-2026-10-20-IDEAS-NOT-ALL-DECIDED.md) |
| Why each change was made | `git log` |

## 11. Lessons already learned

- Check saved files, not messages.
- Run `npm test` before uploads; app tests alone are not enough.
- Don't run cloud tests for routine checks (they cost money and the free minutes ran out).
- Shell-quoted edits break on backslashes and `$`: write edit scripts to files.
- Don't commit before the tests finish.
- On the spare PC, start app runs through `schtasks /it` (there is no desktop over SSH); its Windows temp folder uses
  short 8.3 names.
- Keep the robot human-paced; a robot faster than a person creates false failures.
- Before designing anything the owner will see, look up the apps they named and reread their rules.
