# PDFix project entry for a new agent

Before changing code, read docs/CODEX-RESUME.md and the newest entries in docs/HANDOFF.md. Then run git status --short and git log --oneline -8. This is a shared working folder with Claude: preserve unfinished changes and follow current ownership in HANDOFF. The resume file is a checkpoint; git and later handoffs can supersede it.

Current owner plan: docs/V1-PLAN.md (The two lists) and docs/TOOL-PLAN.md. Codex finishes everyday UI and the exact-commit Windows installer; Claude tests/fixes backend and currently takes Tier2 panels. No cloud/spare-PC use by Codex. Builds and app checks must use scripts/agent-build.mjs and scripts/agent-run.mjs; hidden windows/temp profiles. Put disposable runtimes and packages outside Google Drive.

Commit own explicit paths only with Codex <codex@agents.local>; never add all, switch branches, stash, reset, clean, merge, rebase or pull. Read docs/AGENT-WORKFLOW.md for mechanics; later owner decisions in current plan/HANDOFF supersede its historical ownership. Do not package unfinished WIP as accepted Beta or claim100% from unit tests. Installer permission does not authorize installation/uninstallation.
