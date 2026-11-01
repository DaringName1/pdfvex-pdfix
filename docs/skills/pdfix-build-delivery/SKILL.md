---
name: pdfix-build-delivery
description: Build or identify a PDFix Windows installer from an exact committed UI snapshot, deliver a uniquely named exe with provenance, or show the matching app screen. Use for PDFix build, installer, wrong-version and show-the-app requests; not ordinary UI development.
---

# PDFix build delivery

Use the PDFix project root as the working directory. Read docs/UI-CURRENT-START-HERE.md, newest docs/HANDOFF.md and git status/log before selecting a build. The shared project copy of this skill is under docs/skills/pdfix-build-delivery; keep installed copies synchronized when updating it.

## Do the requested action

- **Build only:** produce the requested exe. Do not add UI changes, repairs or broad test runs. Required compilation/package integrity checks remain. If the owner explicitly requests an unfinished snapshot, label it a preview; do not block delivery on unrelated acceptance work or call it final.
- **Show the app:** show the actual matching executable on the requested screen. For PDF Build, open the PDF and select Build before presenting it. An empty Word builder, old installed shortcut or screenshot is not an equivalent. Use temporary settings for a preview. Follow applicable computer-use rules; stop input when the owner stops screen control.
- **Install/uninstall:** separate actions requiring the owner's explicit request. Build permission alone does not authorize either. Honor later stop/no-change instructions and preserve documents/settings. Never cycle installations to work out which version is correct.

## Exact identity before claims

1. Record the selected full commit. Do not substitute whatever HEAD happens to be. Distinguish the latest code, a completed UI batch, a packaged build and the installed app. Uncommitted UI is absent from a clean-commit build.
2. Build a clean git archive using existing matching dependencies and the coordinated build scripts. Do not modify the shared checkout, install dependencies, fetch code or change GPU/security settings as a shortcut.
3. Use a date-and-commit filename. Never overwrite another artifact, including another build of the same version. Save the full commit, source-snapshot hash, executable hash and package ID beside it.
4. Report only demonstrated evidence. Compiled/package-integrity checked is not runtime-tested, installed, screenshot-matched, release-ready or 100% complete. Known failed tests stay disclosed in the handoff/receipt.
5. Deliver the actual file link promptly. Do not make the owner search tmp folders. Answer status questions briefly.

## Reusable build command

From the project root, through its shared run lock:

    node scripts/agent-run.mjs codex -- node docs/skills/pdfix-build-delivery/scripts/build-installer.mjs --commit <exact-commit> --date YYYY-MM-DD

The helper archives the commit, builds through agent-build, packages with existing native pins, compiles Setup, and publishes a unique exe/checksum/receipt in releases. It never installs, uninstalls or launches the app. Use --plan for a read-only source/dependency check. If a phase fails, inspect its named log and fix that cause; do not blindly regenerate or overwrite artifacts.

## When it looks wrong

Compare the actual executable/source identity and screen state with the existing reference first. If the reference is already in the project, do not ask the owner to resend your own screenshot. Ask for an owner screenshot only when their observed screen/reference is missing. Describe the difference; do not lecture about modes or claim correctness from a filename/version alone.

## Handoff

Record artifact path, selected commit, hashes, what was actually checked, open failures and whether installation happened in docs/HANDOFF.md. Codex owns Setup delivery; Claude independently reviews and reports. Give Claude docs/CLAUDE-BUILD-SKILL-UPDATE-2026-10-28.md when coordinating its companion skill.
