# PDFix: start here before continuing work

> **New chat — October29:** read [CODEX-RESUME.md](CODEX-RESUME.md), then newest [HANDOFF.md](HANDOFF.md). This short checkpoint records current code ownership, committed work, known failed/passed checks and exact next actions through the new installer. Follow [V1-PLAN.md](V1-PLAN.md) / [TOOL-PLAN.md](TOOL-PLAN.md); older dates/percentages below are history. Installed app03752e4; no new installer yet.


This Drive project folder is the shared development record for the user, Claude, Codex and future agents. Updated October 18, 2026. Read the files themselves before acting: dated summaries are checkpoints, not live status.

## Read first

1. [Current Codex resume checkpoint](CODEX-RESUME.md) and newest [HANDOFF](HANDOFF.md).
2. git status --short / git log --oneline -8; respect the other agent's current files.
3. [Current V1 plan](V1-PLAN.md), bottom table, and relevant [Tool plan](TOOL-PLAN.md) entries.
4. [Agent workflow](AGENT-WORKFLOW.md) for mechanics; current owner/ownership decisions supersede its historical lane table.
5. Consult older handoffs only if the current checkpoint needs their evidence. The dated sections below are historical.

## Combined finish plan

Use [Claude's combined work tracker](MAIN-APP-FINISH-PLAN-2026-10-18.md) and [Codex's detailed scope/testing checklist](CODEX-MAIN-APP-ACCEPTANCE-PLAN-2026-10-18.md) for the latest requested sequence: scope audit, dad's test package, approved main-app coding, full verification matrix and release gates. It interprets the user's acceptance of the combined proposal as option C (agreed scope plus editor printing and picture resize/crop), while keeping ambiguous additional candidates subject to the audit/user decision. It does not mark the work completed.

## Goal and scope

Make the existing main app reliable and easy to use, with a drawing-focused test version for the user's dad on Monday October 19. Current work is debugging and acceptance, not a broad redesign. The eventual Documents & Publishing, Science & Data, Engineering and Research workspaces should feel like one connected application; they are for later. Bluebeam-specific expansion and the [30 Add-ons](ADD-ONS-FIRST-UPDATE-BACKLOG-2026-10-15.md) remain deferred. Keep ordinary PDF features and supported file-opening/conversion requirements in scope.

Codex owns reader/search/readable view, markup, Drawing and Pages. Claude owns editor, shell, Documents/More tools, converters, shared integration, publishing and final packages. Do not silently transfer ownership or infer that an older percentage means all acceptance has passed.

## Where to find the information

| Information | Location |
| --- | --- |
| Code, tests, build scripts and dependency definitions | `src/`, `desktop/`, `tests/`, `scripts/`, `package.json`, `package-lock.json` |
| Architecture and requirements | `../ARCHITECTURE.md`, `../REQUIREMENTS.md`, `../PRODUCT-PLAN.md`, `../FINAL-IMPLEMENTATION-PLAN.md` |
| Original saved request text and UI references | `intake/`, `reference/` |
| Scope ledger, history and feature status | `FINAL-SCOPE-LEDGER-2026-10-11.json`, `../FEATURE-TRACKER.md`, `../PHASE-LOG.md`, dated progress documents |
| Recent implementation/evidence/remaining work | Both handoffs, known issues, and the continuation snapshot linked above |
| Human testing, printing and setup | `HUMAN-TEST-CHECKLIST.md`, `SUNDAY-CHECK-2026-10-18.md`, `TESTER-GUIDE-2026-10-19.md`, `TESTER-SETUP-2026-10-19.md`, `PRINTER-ACCEPTANCE-2026-10-15.md` |
| Preserved generated-file Codex test receipts | `evidence/codex/`; see its manifest, not just folder presence |
| Portable Git-history backup | `../tmp/portable-history/`; ignored by Git, still physically inside the Drive project folder |

## What is outside this folder

The live Git database is deliberately outside Google Drive at `C:\Users\andre\pdfix-repo.git`; the root `.git` file points there. Do not move it or run two computers against that live database. A portable `.bundle` backup in `tmp/portable-history/` captures committed history at its recorded commit. It does not update automatically or include uncommitted files. The adjacent receipt records its checksum and restore instructions. Source files in this project remain the working copy.

Full AI chat transcripts and original attachment storage belong to their respective apps. This index, saved intake, handoffs and continuation notes preserve the development decisions and evidence needed to continue; they are not a claim that every chat message has been exported. No future agent should need private AI memory as the sole source of a project decision. Put new decisions and blockers in the shared documents.

Raw test screenshots, profiles, crash dumps and large generated fixtures can live in Windows Temp or ignored scratch folders. Important textual outcomes are in the handoffs and dated evidence documents. Selected generated-file receipts have been copied into `docs/evidence/codex`; their path strings are redacted, so use their scripts to reproduce instead of expecting old Temp paths to work. An active run is pending until its final receipt exists; archive it only after completion.

The user's real app settings, recovery drafts and versions live under their Windows app profile, not in source. Do not copy that profile, personal documents, secrets or credentials into a shared development archive. Do not inspect `pdfix information form owner/` under the current agent restrictions. Private drawing inputs are not GitHub fixtures.

## Continue safely

- All app checks: `node scripts/agent-run.mjs codex -- <command>` (or `claude`). Hidden windows and temporary profiles only unless explicitly authorized otherwise.
- Long soak: `node scripts/agent-run.mjs codex --minutes=90 -- node scripts/check-reader-soak.mjs --minutes=90 --normal-graphics`. Check the current lock first; do not launch another soak while one is active.
- Build: `node scripts/agent-build.mjs codex` (or `claude`). Claude makes combined release packages and uploads. Never change production GPU/security settings casually.
- No spare-PC use while Claude's 24-hour robot owns it (scheduled until October 18 about 11 AM). Later tests must run inside its signed-in desktop, not directly over SSH.
- Preserve the distinction between source/unit checks, browser harness, hidden built app, packaged app, visible human use and outside-software/device acceptance. Passing one does not prove the others.
- Commit only owned paths with the agreed author; update handoff and issue evidence. Read the workflow for prohibited Git operations.

## Shared record maintenance

Each agent maintains its own handoff and adds links here for new major records. Claude should add a current editor/shell/integrator continuation snapshot and any important receipts that exist only in its private chat or temporary folders. This is a request, not a claim that Claude has done so. Do not rewrite the other agent's history. Preserve failures, superseded claims and pending acceptance honestly, with dates and reproduction commands.

## Claude continuation snapshot (October 18, 14:45 Pacific)

- Claude's current state lives in [START-HERE section 8](START-HERE.md) and the latest entries of the [Claude handoff](CLAUDE-HANDOFF-2026-10-12.md); plan status is under the Claude table in [the finish plan](MAIN-APP-FINISH-PLAN-2026-10-18.md).
- Monday test package: `releases/PDFix-0.1.0-20261018T212559026-02d0cdb2-win-x64` (Claude b32b6ce, Codex acfabb5). Launcher starts in normal graphics; a 10-step robot session on the package passed.
- The spare PC is busy with 24-hour robot run 3 on that package until about October 19, 14:30 spare-PC time (tasks `PDFixDay3A/B`, results `C:PDFixTestesultsday3-summary.txt`). Do not start other app runs there before then without asking Claude.
- Codex's review (standard callout) and rich-text comment actions are now in the main robot and on the spare PC (its copies import the helpers from `tester-nexthelpers`).
- Cloud: full runs 39164946345 (3 failures: Claude layout and password-cancel timing, both fixed; Codex drawing-xfdf.spec.js:2 review box not found) and 39167653289 (running). Two clean runs in a row are still needed.

**V1 audit (owner decision, October 18 evening):** read [V1 whole-app audit](V1-WHOLE-APP-AUDIT-2026-10-18.md) before starting new feature work. Each agent audits its own lane against the 12 areas and records evidence there.
