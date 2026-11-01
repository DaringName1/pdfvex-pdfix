# UI direction — owner, October 21, 2026

**Keep how PDFix looks now.** The owner likes the current look (colours, style, feel). This is about how PDFix
should *work*. Judge every UI change against these rules; do not restyle the app.

## Rules

- **Simple for beginners, powerful for professionals.** Common tools are easy to find; advanced tools are
  discoverable without clutter.
- **One tool, one identity.** One name and one home group per tool (`src/tool-registry.js`). Menus, shortcuts,
  Home and search all open the **same** tool behaviour, never a second editor.
- **Direct editing on the document.**
  - Tools work on the open document.
  - No pop-up window that holds a second small copy of the document.
  - No chains of dialogs, and no modal dialogs for simple operations.
- **Tools with methods.** One tool offers its ways of working, each with a short description of what will happen:
  - Text: Click to type / Edit existing / Text box
  - Select: text / object / area
  - Draw: line / connected lines / freehand / shapes. Independent lines never join on their own.
  - Measure: distance / area / angle / perimeter / count
  - Image: insert / replace / crop
  - Table: insert / edit / extract
- **Build and View.** A clear switch.
  - View hides editing controls for reading and reviewing.
  - The same document stays open, with page, zoom, selection and unsaved edits kept.
  - Fullscreen is separate.
- **Tabs plus optional projects.** Normal tabs for everyday work; project groups for related files are optional and
  come later.
- **Panels are optional, resizable and closable.** Closing a panel never removes access to its function.
- **Home stays small and useful.**
  - Open, New, recent files with previews, and pinned files.
  - A few common tasks, and search for files, tools and help.
  - No big dashboard of cards.
- **Workspaces later.** Four connected workspaces share one PDF core and are not separate apps:
  - Documents & Publishing
  - Science & Data
  - Engineering
  - Research
- **Plain, clear wording.**
  - Visible focus, selection, active-tool and loading states.
  - Keyboard shortcuts.
  - Works on small laptop screens.
- **No forced AI, accounts, ads or paywalls.** AI is optional (local or user-chosen) and is never a permanent sidebar.

## Rejected

Whatever the source, PDFix should not have:

- a giant toolbar of equally weighted icons
- floating toolbars over the page
- a dashboard of colourful cards
- separate full-screen editors for related tools
- duplicate tools with different names
- toolbars that move around
- deep nested menus
- copying the look of Acrobat, Word, Fusion or Bluebeam

## Order to the October 30 beta

The owner's split is recorded in [SHARED-PLAN.md](SHARED-PLAN.md), items 2.14 to 2.20.

1. Tools work on the main document (no second copy in a pop-up).
2. One Text tool with methods.
3. Build / View switch.
4. Home: recent files with previews, and pinned files.
5. Protect with three choices: password to open, limits only, or both.

**After the beta:**

- projects
- the Science & Data and Research workspaces
- saved presets and custom toolbars
- the larger command search
- saved layouts

## Owner answers (October 21)

1. **Opening mode** (changed October 22: PDFs now open in **Quick edit**, see UI-RULES-2026-10-22.md): PDFs open in **View**; new documents and Word files open in **Build**. One click switches.
2. **Recent-file previews on Home:** a setting with three choices: Off / Show when I hover / Always. The default is
   **Show when I hover**.
3. **Beta 1 goes to** the owner's dad, people the owner knows, and later people who find it on GitHub.
   - The repository stays private until the owner decides.
   - Code signing (to avoid the Windows "protected your PC" warning) will be decided before any public release.
4. **Cloud runs:** the owner decides near beta 1.
5. **Acrobat/Office compatibility check:** the owner does the free part (Edge, office.com) last. It does not block
   building.
