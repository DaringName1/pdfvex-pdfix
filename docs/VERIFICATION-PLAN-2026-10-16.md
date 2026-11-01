# PDFix verification plan — October 16, 2026

> October 18: the owner's 12-area audit in [V1 whole-app audit](V1-WHOLE-APP-AUDIT-2026-10-18.md) builds on this plan and is the current priority list.

Purpose: one place that lists every kind of checking PDFix needs before release, what already exists, what is
missing, and who does it, so nothing is forgotten. Nothing here is "done" because an agent says so: an item is done
only with a repeatable test or a recorded manual check, plus the output file where there is one.

Status words: **Exists** (working and used), **Partial** (some coverage, gaps named), **Missing**, **Needs user**.
Owners: **Claude** (shell, editor, converters, Documents / More tools, shared integration, builds, this plan),
**Codex** (reader, Drawing, Pages, graphics and memory), **User** (decisions, human testing, physical checks).

## Ground rules for both agents

1. No feature is finished because an AI says so. It needs a test that ran, or a recorded manual check, with the
   output file kept where there is one.
2. Never delete, skip or weaken a failing test to make it pass, and never change an expected result just to match
   current behaviour. If a test is truly out of date, say why in the commit message.
3. The agent that fixes a feature is not the only one that checks it: a second check (other agent, independent
   tool, or the user) confirms important fixes.
4. Critical tests use real files and the real app, not only mock objects.
5. Every bug fixed gets a regression test or check that would have caught it.
6. Failed checks stay visible in `docs/KNOWN-ISSUES-2026-10-13.md` until fixed.
7. Release needs the user's approval even when every automatic check passes.
8. One in-app check at a time on this PC (`scripts/agent-run.mjs`), builds only through `scripts/agent-build.mjs`.

## The four main layers

| # | Layer | What it catches | Status now | Gap to close | Owner |
| --- | --- | --- | --- | --- | --- |
| L1 | Automated code and in-app tests | Broken functions, regressions, file-handling bugs | **Exists, growing.** 70 unit test files, 35 desktop spec files, 73 hidden-app checks. **Since October 16 these run on a fresh Windows machine on GitHub** (private repo DaringName1/pdfix, `.github/workflows/test.yml`): build + unit tests + app smoke + document checks on every upload, full desktop suite nightly. Uploads go through `scripts/publish-github.mjs`, which leaves out `.github-publish-exclude` paths (the dad drawing) | A single local report tied to a commit (`verify-all`) | Claude (harness, uploads), both (tests in their lane) |
| L2 | AI computer-use tester ("acts like a user") | Problems that only show when tools are used together, in different orders, interrupted or cancelled | **Partial — first slice working (October 16).** `scripts/user-robot/robot.mjs`: hidden app, visible names and keyboard only, 14 everyday actions, seeded random but replayable runs, separate file verifier (`verify.mjs`), pair coverage map (`tmp/user-robot/coverage.json`). Not yet: screen-control version on the spare PC, Drawing/Pages actions | Grow actions to every tool; run on the spare PC with real screen control | Claude builds the harness; Codex adds reader/Drawing/Pages actions |
| L3 | Human testing | Confusing screens, missing features, real-world files | **Ready to start.** `docs/HUMAN-TEST-CHECKLIST.md` (23 tasks) | First round with the user and their dad, then 5–10 private beta testers | User |
| L4 | Crash and bug reporting | Problems after release that nobody reported | **Missing.** The app notices a renderer crash but nothing is saved for a report | Local crash log + "Report a problem" that gathers app version, steps and logs, sent only with permission and never the documents | Claude (needs User decision on how reports are sent) |

## The extra areas that are easy to miss

| # | Area | Status now | Gap to close | Owner | Priority |
| --- | --- | --- | --- | --- | --- |
| 1 | Compatibility: PDFix outputs open correctly in Acrobat, Chrome, Edge, Word | **Partial.** Outputs are re-read independently (PDF.js, pypdf, qpdf) and DOCX structure is checked (`scripts/check-docx-structure.mjs`). Acrobat is installed but its automation failed; no Word on this PC | Open a sample of every output type in Acrobat Reader, Chrome, Edge and real Word; record results | User for the manual opens; Claude/Codex prepare the files | Critical |
| 2 | Data integrity: no lost pages, fonts, forms, notes, signatures | **Partial.** Every save writes a new copy, re-reads it from disk and keeps the original unchanged; many round-trip checks | A written list of every save/export route with its integrity check (gate 1 in `RELIABILITY-PERFORMANCE-USABILITY-GATES.md`) and a real-file corpus | Both, per lane | Critical |
| 3 | Security: hostile PDFs, unsafe paths, native helpers, dependencies | **Partial.** Office/PDF processing runs in a Windows sandbox with no network; file paths and sizes are bounded (`docs/SECURITY-SANDBOX*.md`) | A focused review of Electron settings, every IPC handler and native helper; hostile-file fuzz set run in the sandbox; dependency vulnerability scan | Claude (shell/IPC/native), Codex (reader parsing) | Critical |
| 4 | Crash and recovery: unsaved work survives crashes, power loss, forced close | **Partial.** Recovery drafts, versions and quit checks exist and are tested for the editor | Kill-the-app tests for every tool with recovery, and a power-loss style test (kill during save) | Both, per lane | Critical |
| 5 | Performance and stress | **Partial.** 500-page and 81 MB Word checks; Codex's reader soak | Named hardware tier, numeric budgets, 300 MB drawing sets, many conversions in a row | Codex (reader), Claude (editor/converters) | High |
| 6 | Installation and update | **Missing.** Package builds and the packaged app is smoke-tested on this PC only | Clean Windows PC or VM install, uninstall, reinstall, offline use; later, upgrade from the previous version keeping settings and drafts | Claude; User provides a clean PC or VM | High |
| 7 | Accessibility | **Partial.** Keyboard and focus pass on every Claude-lane tool; Codex's reader focus fixes; 150% text checked | Screen reader (NVDA/Narrator) walk-through of core tasks; high-contrast mode | User or tester with a screen reader; both agents fix | High |
| 8 | Differential testing: PDFix results versus established engines | **Partial.** Outputs are re-read with PDF.js, pypdf and qpdf | Compare page images and text against a second renderer (for example PDFium) on the corpus; veraPDF where PDF/A or PDF/UA is claimed | Codex (reader output), Claude (converters) | High |
| 9 | Long-duration testing (hours of use) | **Partial.** 30-second to 2-minute soaks | Multi-hour open/edit/save/close loop watching memory and handles | Codex (A-R2 memory) with Claude's tools in the loop | High |
| 10 | Release and supply chain | **Partial.** Package has a dependency inventory and checksums; `THIRD-PARTY-NOTICES.md` is short | Licence review of every bundled dependency, font, OCR data and native tool (qpdf, Node runtime); a software bill of materials per release | Claude; User decides the app's own licence | High |
| 11 | Independent verification | **Partial.** Independent PDF re-reading in checks | Third reviewer pass (other agent or a fresh session) on each important fix; `docs/` claims checked against code before release | Both, crosswise | High |
| 12 | Privacy and offline | **Partial.** Reader blocks online requests; AI only to a local server; no telemetry exists | Run the core checklist with the network off; confirm no outbound connections during normal use; any future reporting is opt-in | Claude | High |
| 13 | Release-to-release upgrades | **Missing** (only one version so far) | When version 2 exists: upgrade over version 1 keeping settings, favourites, drafts, signatures | Claude | Later |

## The twelve "vibe-coding traps" and where each is handled

| Trap | Where it is handled |
| --- | --- |
| Looks finished but output is wrong | Ground rule 1; areas 2 and 8 |
| Two agents making incompatible code | Lanes and shared-file rules (`AGENT-WORKFLOW.md`), run/build locks, Claude as integrator, L1 on the combined build |
| Document corruption and silent data loss | Area 2; new-copy saving and disk re-read already in place |
| Security in file handling | Area 3 |
| Too many competing implementations | Architecture check below |
| Tests that check the wrong thing | Ground rules 2–4; area 11; this session already found and fixed stale tests that passed or failed for the wrong reason |
| Broken cross-tool workflows | L2 explorer; Codex's open → markup → organize → save → reopen workflow; Claude's editor → DOCX/RTF/PDF → reopen checks |
| Performance at real-world scale | Areas 5 and 9 |
| Hidden licensing problems | Area 10 |
| Only AI can maintain the code | Architecture and contributor guide below |
| Packaging behaves differently from development | Packaged-app smoke check (exists); area 6 |
| Too many features to find anything | Home/Workspaces ordering and plain-language pass (done October 15–16); L3 first-time users |

## Architecture and maintainability check (Claude, read-only first)

1. Map every way a file is loaded, saved, exported and recovered across workspaces; list duplicates and decide which
   to merge (only small, safe merges before beta).
2. Write `docs/ARCHITECTURE.md`: processes, IPC bridge, sandbox, file store, recovery, each workspace, and who owns what.
3. Write `CONTRIBUTING.md`: how to build, test (`agent-build`, `agent-run`, unit, desktop, checks), and the ground rules.
4. List the four unused bridge functions (A17) and either connect or remove them.

## L2 — the AI computer-use tester (design)

Goal: an AI that uses the packaged PDFix like a person, tries tools together in many orders, and saves proof.

- **Where it runs:** two parts. (a) A hidden "user robot" on the main PC through `scripts/agent-run.mjs` (no mouse takeover). (b) Real screen control ("computer use") on the user's spare Windows 10 Home PC over Tailscale, in a separate "PDFix Tester" Windows account with throw-away files only; it also covers Windows 10 and other graphics hardware (useful for A-R4).
- **How it acts:** Windows UI Automation / Playwright-for-Electron for clicks and typing, screenshots for what the
  accessibility tree cannot describe (pages, drawings).
- **What it checks after each step:** the output file with independent tools (page count, text, annotations, fields,
  images, hashes of the original), app state, error messages, and screenshots.
- **Coverage, in order:** every tool alone → every sensible pair of tools in both orders → realistic 3–10 step
  workflows → free exploration with cancels, undo/redo, switching tools with unsaved work, reopening, damaged inputs.
  (All orderings of 49 tools is impossible — three-step orders alone are over 110,000 — so pairs are complete and
  longer chains are chosen by risk.)
- **Records:** a coverage map (tool × tool: passed / failed / untested), and for each failure the exact steps,
  inputs, outputs, screenshots and logs, replayable after a fix.
- **First slice:** Open, Edit PDF text, Organize pages (merge), Convert to Word / editor, Save — find one real bug,
  reproduce it, confirm the fix by replay. Then grow.

## Four rules for the AI tester (from the October 16 review)

1. **Acts without knowing the implementation.** The robot finds controls only by what a person sees (button and
   menu names, labels, keyboard shortcuts). A control it cannot find by its visible name is a discoverability finding,
   not something to work around with internal selectors.
2. **Randomized but reproducible.** Every run has a seed; the same seed, or `--replay run-<seed>.json`, repeats the
   exact steps and choices so a failure can be replayed after the fix.
3. **Independent review of failures.** Each failure is classified by a second look (another agent or the user) as a
   product bug or an automation mistake before it is fixed; robot mistakes are fixed in the robot, never by changing
   the app to suit it.
4. **The tester and the verifier are separate.** The robot behaves like a customer; `verify.mjs` decides success from
   the saved files alone (opens them independently, checks the expected text, tables, bold, page counts and that
   originals are unchanged) and never trusts on-screen success messages.

## Release-blocking checklist

A green test count never overrides these. Any one open item blocks the next release stage.
- [ ] No open data-loss or file-corruption bug (any save, export, recovery or conversion route).
- [ ] No open security bug in file opening, the sandbox, IPC or native helpers.
- [ ] Crash recovery works for every tool that keeps a draft.
- [ ] Clean-machine install, first launch, uninstall pass (GitHub run + Windows Sandbox or spare PC).
- [ ] Outputs open correctly in Acrobat Reader, Chrome/Edge and Word (manual sample per output type).
- [ ] Human checklist done with no unexplained failure; printer measurement within 1 mm.
- [ ] Licence review complete; third-party notices complete.

## Release stages and gates

1. **Internal** — L1 green on the combined build, L2 first slice running, critical areas 1–4 have no open failures.
2. **Private beta (5–10 people)** — human checklist results reviewed; no known data-loss or security bug open.
3. **Public beta (20–30+)** — install/uninstall on clean PCs; crash reporting (opt-in) in place; licences reviewed.
4. **Stable** — critical workflows proven on the real-file corpus; remaining minor issues documented.
Experimental workspaces may ship labelled "beta" as long as the core PDF tools are dependable.

## Decisions needed from the user

1. A clean Windows PC or VM for install tests and the L2 tester (or permission to set up a VM).
2. How bug reports are sent once there are outside testers (email, a form, GitHub issues) — always opt-in.
3. PDFix's own licence (for example MIT, Apache-2.0 or GPL) before outside contributors join.
4. Whether to put the project on GitHub (enables automatic test runs on every change and issue tracking).
5. Who the first 5–10 beta testers are.

## Next actions (not started yet)

- Claude: architecture map + `ARCHITECTURE.md` / `CONTRIBUTING.md`; licence inventory; network-off check; a single
  `scripts/verify-all.mjs` that runs unit tests, desktop specs and key checks through the run lock and writes one
  report tied to the commit; then the L2 first slice. None of these run the app while Codex is using it.
- Codex: A-R4 graphics startup, A-R2 long-run memory, reader-side differential comparison, its lane's save-route list.
- User: start the human checklist; printer measurement; the five decisions above.
