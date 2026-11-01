# PDFix: how two agents work in this folder at the same time

Applies to Claude and Codex, and to any other agent added later. Set up October 13, 2026.

## The setup

- The project folder is a git repository on the `main` branch. Its history is stored on the local disk at `C:\Users\andre\pdfix-repo.git`, outside Google Drive, so Drive sync cannot damage it. The folder holds a small `.git` file that points there.
- Both agents work in the same folder and on the same branch. That means git cannot hide one agent's unsaved files from the other. The rules below are what keep the two apart.
- `node_modules`, `dist`, `releases`, `tmp` and test scratch folders are not tracked.

## Rule 1 — Stay in your lane

| Lane | Owner | Files |
| --- | --- | --- |
| Document editor | Claude | `src/document-*`, `src/rtf-codec.js`, `src/version-history.js`, `desktop/document-*`, `desktop/rich-document-*`, `tests/document-*`, `scripts/check-document-*` |
| App shell | Claude | `src/app.js`, `src/workspace-rooms.*`, `src/action-panel.js`, `src/interface-accessibility.*`, `index.html`, `scripts/check-workspace-*`, `scripts/check-app-smoke.mjs` |
| PDF reader | Codex | `src/pdf-reader*`, `src/pdf-search*`, `src/pdf-readable*`, `src/pdf-destination.js`, `src/reader-navigation.js`, `src/pdf-link-review.js`, `src/pdf-selection.js`, `tests/pdf-*`, `tests/desktop/pdf-reading.spec.js`, `tests/desktop/reader-navigation.spec.js`, `scripts/check-reader-*` |
| Drawing and Pages tools | Codex | The tools in the Workspaces **Drawing** and **Pages** rooms: takeoffs, sheet sets, compare, comments review, markup, Bates, batch, stamps, page boxes, print marks, thin lines, outline, organize, compress, and their `desktop/pdf-*` services and tests |
| Documents and More tools | Claude | The remaining tools in the **Documents** and **More tools** rooms: signing request, synchronized file, email/clipboard, table extraction, file search, slides, workbooks, PDF text/image edit, right-click tools, watched folders, fingerprint, scanner, health report, fields, fill and sign, protect/unlock, redaction, PDF to images, image to PDF, OCR |
| File conversion | Claude | Markdown, text, JSON/XML/YAML/CSV, DOCX and RTF to PDF (the editor's Export PDF and source mode: `src/source-preview.js`, `src/document-pdf-export.js`, `desktop/document-pdf.cjs`), DOCX/RTF/text between each other, image to PDF and PDF to images. PDF to editable document starts in the reader (Codex) and lands in the editor (Claude). |
| Shared files | Integrator (Claude) | `desktop/main.cjs`, `desktop/preload.cjs`, `desktop/file-store.cjs`, `package.json`, `package-lock.json`, `vite.config.js`, `playwright.config.js`, `.gitignore`, the master plan and tracker files in the project root |
| Text tools used by both | Whoever needs the change, committed alone | `src/spell-check-workspace.js`, `src/text-statistics-workspace.js`, `src/document-text-tools.js`, `desktop/file-availability.cjs` |

If a file is not listed, the owner is the lane whose feature it serves. If that is unclear, ask in your handoff file before editing.

## Rule 2 — Shared files

- Anyone may make a **small, additive** change to a shared file (for example one new handler, one new bridge function), but only when `git status` shows that file is clean, and it must be committed **alone, straight away**, with a message starting `shared:`.
- Anything larger in a shared file goes to the integrator: write what you need in your handoff file under "Requests for the integrator" and carry on with other work.
- Never reformat, reorder or tidy a shared file.

## Rule 3 — Git habits

Do:

- Start each work session with `git status --short` and `git log --oneline -8`. Files shown as modified that are not yours belong to the other agent mid-task: do not open them for editing.
- Commit small and often, **only your own files, by path**: `git add src/document-links.js tests/document-links.test.cjs` and then `git commit`.
- Sign your commits: `git commit --author="Claude <claude@agents.local>"` or `--author="Codex <codex@agents.local>"`. Start the message with your lane: `editor:`, `shell:`, `reader:`, `drawing:`, `pages:`, `tools:`, `tests:`, `docs:` or `shared:`.
- Commit before you stop, even work in progress (say so in the message), so the other agent can tell your files from its own.

Never, in this shared folder:

- `git add -A`, `git add .` or `git commit -a` (they sweep up the other agent's half-finished files).
- `git checkout <branch>`, `git switch`, `git stash`, `git reset --hard`, `git restore .`, `git clean`, `git rebase`, `git merge` or `git pull` (each of them rewrites files under the other agent).
- Create or switch branches. One folder, one branch: `main`.
- Edit or revert the other agent's commit. If it breaks something of yours, write it in your handoff file.

To undo your own mistake in one file: `git restore --source=HEAD -- path/to/your/file`.

## Rule 4 — Builds and running the app

- Build only with `node scripts/agent-build.mjs claude` (or `codex`). It takes a lock so two builds cannot overlap, waits if the other agent is building, and retries once if files changed mid-build.
- Never run `npm run build`, `npm start` or `npm run package:windows` directly.
- Hidden app checks (`scripts/check-*.mjs`) and unit tests may run at any time; each uses its own temporary profile. If a check fails right when the other agent rebuilt, run it once more before investigating.
- Do not leave an Electron window running. Checks must close what they open.
- `dist` is always a test build. The integrator makes the final build after both lanes are committed and quiet.
- Run every in-app check (Playwright specs, `scripts/check-*.mjs`, hidden app runs) through `node scripts/agent-run.mjs <agent> -- <command>`. It lets one agent's app checks run at a time, waits while a build is running, and forces hidden windows. `agent-build.mjs` in turn waits while the other agent's check is running. Unit tests (`node --test`) do not open the app and need no lock.

## Rule 5 — Handoffs

- Each agent keeps one handoff file: `docs/CLAUDE-HANDOFF-2026-10-12.md` and `docs/PDF-READER-PARALLEL-HANDOFF-2026-10-12.md`. Update it when you stop: what changed, what was verified and how, what was left alone, and any "Requests for the integrator".
- The whole-app list of known problems is `docs/KNOWN-ISSUES-2026-10-13.md`. When you fix or confirm an item, edit that line in the same commit as the fix.
- Report honestly: "opened", "tested in a browser harness", "tested in the built app" and "tested with real outside software" are different claims.

## Suggested order of work

Both lists run at the same time. Items in the two lists do not touch the same files.

**Claude (editor, shell, Documents and More tools, integrator)**

1. Fix the JSON import in `src/paper-sizes.js` so nine unit tests run again; sort the other failing tests in Claude's lanes into "fix code" and "fix test".
2. Check by hand in the app whether the four tools the smoke walk could not leave are really stuck; fix the shell side if so.
3. Bring the non-reader `tests/desktop/*.spec.js` files for Claude's lanes up to date.
4. File conversion: Markdown, text and data files to PDF, DOCX/RTF to PDF, image to PDF and PDF to images, each checked by reading the output back.
4a. Work through the Documents and More tools rooms one tool at a time with real files: open, use, save, read the output back, reopen.
5. Editor gaps: several open documents with tabs, a real Save decision, first-line and hanging indent.
6. Final coordinated build and source-manifest comparison when both lanes are quiet.

**Codex (reader, Drawing and Pages tools)**

1. Run the reader work in the built Electron app, not only the browser harness: open, search, outline and link jumps, keyboard, resize, close.
2. Update the reader tests in `tests/desktop/` that still use old button names (three are in `document-editor.spec.js`; edit only those three tests in that file).
3. Large PDFs and drawings: scrolling, jumps, zoom, search, memory.
4. Work through the Drawing and Pages rooms one tool at a time with real files, the same way.
5. Sort the failing unit tests in Codex's lanes (PDF operations, OCR, split, compression) once the JSON import fix is committed.
6. Readable-text gaps and exact highlighting from the reader handoff.

## If something goes wrong

- A file you need is modified by the other agent: leave it, note it in your handoff, do something else.
- The build lock seems stuck: it frees itself after ten minutes or when the building process is gone. Do not delete `tmp/build.lock` by hand while a build is running.
- You find the other agent's bug: write it in `docs/KNOWN-ISSUES-2026-10-13.md` and commit that file alone. Do not fix it in their files.
- Anything destructive, any dependency change, any architecture change: stop and ask the user.
