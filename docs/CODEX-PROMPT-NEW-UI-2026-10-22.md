# Prompt for Codex: build the new PDFix UI (owner, October 22, 2026; latest version)

The owner pastes the text below to Codex. It replaces any earlier version of this prompt.

---

Codex, this replaces my earlier message about the new UI. The owner has approved the final PDFix UI and given you the job
of building it. Claude now mainly tests, fixes and plans. You are doing more of the code work, including parts that used to
be Claude's (the Word editor's toolbar and side panel, Home previews and the Files screen).

**Read these first, in this order:**
1. `docs/OWNER-UI-VISION.md`: the owner's idea, what they like and dislike, and the mistakes already made.
2. `docs/UI-RULES-2026-10-22.md`: every UI rule. It wins over every other document.
3. `docs/UI-LAYOUT-PLAN-2026-10-22.md`: which tool goes in which tab and group, with today's tool ids.
4. `docs/mockups/final-2026-10-22/README.md`: the approved mockup. Look at every `.png` and open the `.html` files in a
   browser to click through them.
5. `docs/SHARED-PLAN.md`: the new division of work (top), your items, and Claude's section 6.
6. `docs/OWNER-PROJECT-GUIDE.md`: everything else (privacy, testing, releases, how the owner works).

**What to build, in this order** (first finish and commit your current 2.14–2.16 work):

1. **Blank-page bug (A-R-IMAGE1).** Very large scanned pictures (about 20 million pixels) are silently left out, so the
   owner's dad's older drawing opens as a white page. Fix this first; it is the most visible bug for the first tester.
2. **One mode button and Quick edit (2.31).** One button shows the current mode (Quick edit ▾ / View / Build) and opens a
   short list with one line per mode; Ctrl+Shift+E still switches. **PDFs open in Quick edit** (change
   `initialDocumentMode`). Quick edit signs, fills and marks up; the PDF's own text cannot change. Its tools are the
   **same tools** as in the Comment and Fill & Sign tabs, never copies. Word documents use the same button with View and Build.
3. **Window parts (2.30).** Undo and Redo next to the file name; Find, Save a copy, Print and Share always at the top right;
   a slim panel bar on the right edge (thumbnails, bookmarks, comments, attachments, layers), each opening beside the page.
4. **Tool groups (2.32, 2.33).** Each Build tab gets 3–4 named groups of tools (UI-LAYOUT-PLAN section 3). The group's name
   with ▾ sits **under the group** (like Fusion), and its drop-down lists **every** tool in the group, the rarely used ones
   last under "Less used". **No tool is removed and nobody adds tools themselves.** Names are not fixed: use a clearer one
   when there is one.
5. **Toolbar look (UI-RULES section 2, rules 2–9).**
   - The **main look is Word/Fusion**: icons with their names under them, as in mockup D and F1–F9. This is the default.
   - Plain buttons with no box around a button or group, thin lines between groups, the picked tool in light green, the
     app's own colours, logo and icons.
   - **Small Google Docs-style buttons** for things used all the time (Undo, Redo, Zoom, Find, Print): a small icon with its
     name on hover, no box.
   - **Short screens** (about 800 px tall or less, such as 1366×768 laptops) fold the toolbar to the slim Docs-style row
     (mockup H1, H2). "Show names / Hide names" at the end of the toolbar also switches by hand.
6. **Tools work at once; one side panel for every tool (2.35, UI-RULES section 7).** Pick a tool, use the mouse on the page,
   Enter finishes, Esc stops; marking tools stay on until Esc. The Options panel looks the same for every tool: name and ×,
   one line on how to use it, HOW (its ways of working), SETTINGS (2–3), More settings folded away; at the bottom Keep this
   tool on, **Save as my default**, Reset, and one action button only when the tool needs one. Each person's tool defaults
   are saved and listed in Settings. Section 7 lists what each tool's default does.
7. **Working on the page like a document (UI-RULES section 8).** With Text or Type on page picked, click anywhere and type;
   with any other tool or none, double-click to type; a single click never makes a text box by itself. Drag text, pictures,
   stamps, signatures and notes to move them; drop pictures and files onto the page; Undo takes it back; nothing moves in View.
8. **The Word editor (2.34)** gets the same parts: the mode button, the same toolbar look with **every tool it has today**,
   groups, and the same side panel (Picture settings only while a picture is selected).
9. **Home and Files (2.19, 2.7):** recent-file previews (setting Off / Show when I hover (default) / Always) and pinned files;
   Files thumbnails and drag and drop. Keep Home's look as it is.
10. Then 2.24, 2.26, 2.27 (settings beside the selected thing, status bar, Undo the same everywhere); 2.28 and 2.29 after
    the beta.

**Target:** items 1–8 before the October 30 beta; 9 if there is time.

**How to work:**
- SHARED-PLAN rules: no cloud runs; tests and robot tasks updated in the same commit as each UI change (rule 1); commit only
  your own files with your author line; build with `node scripts/agent-build.mjs codex`; run the app with
  `node scripts/agent-run.mjs codex`.
- You may now change the editor, shell and Home files these items need. **Before each item, write in HANDOFF.md which files
  you will work in**; Claude stays out of them until you say you are done. Claude is finishing 2.18 in
  `src/form-workspace.js`, `src/form-workspace.css` and their tests first; leave those to Claude.
- After each item: look at real screenshots at normal size and at a small laptop size, go through the checklist at the end
  of OWNER-UI-VISION.md, and write "done / what to check / files" in HANDOFF.md so Claude can review it, run the robot and
  the spare PC on it, and fix what turns up.
- If a rule seems wrong or two rules clash, ask the owner in plain words; never change the rules yourself.
- Borrow how other apps work, never their look; keep the PDFix look.
