# Final UI mockup (owner approved, October 22, 2026)

This is the owner's final mockup, saved here so Codex can see it without the owner's mockup site.
The rules behind it are in [../../UI-RULES-2026-10-22.md](../../UI-RULES-2026-10-22.md) (the rules list wins if anything here
looks different), and the tool-by-tool layout is in [../../UI-LAYOUT-PLAN-2026-10-22.md](../../UI-LAYOUT-PLAN-2026-10-22.md).

- Each `.png` is a picture of one screen at 1366 x 820.
- Each `.html` opens in any browser (double-click it). C, D and B and F1-F9 are clickable: the one mode button, the tabs,
  each group's drop-down, picking a tool (its options open on the right), clicking anywhere on the page to type,
  dragging the stamp and photo, and dropping a file onto the page. Nothing is saved.
- `dc-local.js` is the small helper that makes the `.html` files run outside the mockup site. It is not app code.
- The logo comes from `public/brand/`; colours are the app's own (`src/style.css`: #3d7868, #eaf3ec, #315f4d, #e3eae5).

| Screen | What it shows |
|---|---|
| [A-home](A-home.png) | Home, keep as it is |
| [B-quick-edit](B-quick-edit.png) | Quick edit: PDFs open here. The one mode button is shown open. Click anywhere to type, drag to move |
| [C-view](C-view.png) | View: just looking |
| [D-build-edit-text](D-build-edit-text.png) | Build, Edit tab, Text tool with its options panel |
| [G-side-panel-highlight](G-side-panel-highlight.png) | The side panel, same layout for every tool (Highlight), with Save as my default |
| [H1](H1-docs-style-toolbar-build.png), [H2](H2-docs-style-toolbar-quick-edit.png) | The slim Google Docs-style toolbar: used on short screens and by "Hide names". The main look is D and F1–F9 |
| [E-word-editor](E-word-editor.png) | Word document editor (keeps every tool) |
| [F1](F1-build-home-tab.png) to [F9](F9-build-export-tab.png) | Every Build tab, with its first group's drop-down open |

What to copy from it (how it works and is laid out; keep the app's own code and components):

1. One mode button (Quick edit / View / Build) with a short list, instead of separate buttons.
2. Tab bar: mode button, tab names, Find a tool, then Find, Save a copy, Print, Share at the top right.
3. Toolbar: a few named groups of icon buttons with a short name under each; the group name with ▾ under the group opens
   every tool in that group, rarely used ones under "Less used". No boxes around buttons or groups; thin lines between groups.
4. Options panel on the right for the picked tool; a slim bar of panel icons on the right edge.
5. Undo and Redo next to the file name.
6. Every tool works the moment it is picked: mouse on the page, Enter finishes, Esc stops; the side panel is the same for every tool and has Save as my default (UI-RULES section 7).
7. Type anywhere on the page (click with a text tool, double-click otherwise); drag things to move them; drop pictures and files onto the page.
