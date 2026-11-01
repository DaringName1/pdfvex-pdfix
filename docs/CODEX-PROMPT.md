# Prompt for Codex

Copy everything below the line into Codex.

---

You are working on PDFix in `C:\Users\andre\My Drive\projects\pdf app` at the same time as another agent, Claude. Coding is authorized. Your job is the **PDF reader** and the tools in the Workspaces **Drawing** and **Pages** rooms. Claude has the document editor, the app shell, the Documents and More tools rooms, and is the integrator for shared files and the final build.

**Read these three files first, fully, before changing anything:**

1. `docs/AGENT-WORKFLOW.md` — the rules for sharing this folder. Follow them exactly.
2. `docs/KNOWN-ISSUES-2026-10-13.md` — what is known to be broken, failing, missing or unproven across the app.
3. `docs/CLAUDE-HANDOFF-2026-10-12.md` — what Claude changed, including the section "For Codex".

**What is new since your last session:**

- The folder is now a git repository on `main`. Its history lives outside Google Drive at `C:\Users\andre\pdfix-repo.git`. A baseline commit holds everything as of October 13, including your reader work.
- Builds go through a lock: `node scripts/agent-build.mjs codex`. Do not run `npm run build` directly.
- `app.quit()` now goes through the window's departure check before services shut down. A check that closes the app with unsaved state waits for that check.
- Shared text tools changed slightly: spell check re-lists findings after a replacement, a canceled spell check no longer blocks leaving, and Escape closes the statistics panel.

**The rules that matter most:**

- Start every session with `git status --short` and `git log --oneline -8`. A modified file that is not yours belongs to Claude mid-task. Do not edit it.
- Edit only files in your lanes (listed in `docs/AGENT-WORKFLOW.md`). For a small additive change to a shared file, make sure that file is clean in `git status`, change it, and commit it alone at once with a message starting `shared:`. For anything bigger, write a request in your handoff file and move on.
- Commit small and often, your own files only, by path: `git add <your files>` then `git commit --author="Codex <codex@agents.local>" -m "reader: ..."`. Commit before you stop, even unfinished work.
- Never use `git add -A`, `git add .`, `git commit -a`, `git checkout <branch>`, `git switch`, `git stash`, `git reset --hard`, `git restore .`, `git clean`, `git rebase`, `git merge` or `git pull` in this folder, and never create a branch. Each of those would change or sweep up Claude's files.
- Do not leave an app window running. Hidden checks and unit tests may run at any time.
- Anything destructive, any dependency change, any architecture change: stop and ask the user.

**Your work, in this order:**

1. Prove the reader in the built Electron app, not only the browser harness: open a PDF, read, search, jump from the outline and from links, use the keyboard, resize, close. Write a hidden check script for it in the style of `scripts/check-document-editing.mjs` (launch with `PDFIX_TEST_DATA` set to a temporary folder and `PDFIX_TEST_VISIBLE=0`, replace the file dialogs with the test file, close the app at the end with a timeout).
2. Update the reader tests in `tests/desktop/` that still look for old button names. Three are in `tests/desktop/document-editor.spec.js` (area selection and readable view): edit only those three tests in that file; the other four are Claude's and pass.
3. Large PDFs and drawings: sustained scrolling, jumps, zoom and search, with measured memory and responsiveness.
4. Go through the Drawing room and then the Pages room one tool at a time with real files: open, use, save a copy, read the output back independently, reopen. The smoke walk found that after **Drawing sheet sets**, **Review drawing comments**, **Inspect and repair thin lines** and **Edit the PDF outline** it could not get back to Home. Check each by hand first and record in `docs/KNOWN-ISSUES-2026-10-13.md` (item A3) whether it is a real trap.
5. After Claude commits the JSON import fix for `src/paper-sizes.js`, sort the failing unit tests in your lanes (PDF operations, OCR output, split output, compression) into "fix the code" and "fix the test", and fix them.
6. Then the open items in your own handoff: readable text for tables, captions and irregular columns, and exact character highlighting.

**How to report:** keep `docs/PDF-READER-PARALLEL-HANDOFF-2026-10-12.md` current. Say what changed, what you verified and how (keep "opened", "browser harness", "built app" and "real outside software" as separate claims), what you left alone, and any "Requests for the integrator". When you fix or confirm an item in `docs/KNOWN-ISSUES-2026-10-13.md`, update that line in the same commit.

Do not stop after the first item. Work down the list, verify each change in the built app, commit, and continue. If one item stops making progress after two or three different attempts, write down the blocker and move to the next.
