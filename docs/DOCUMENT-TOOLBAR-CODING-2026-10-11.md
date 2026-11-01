# Document toolbar implementation — October 11, 2026

Scope: the editable document/source workspace. No native APIs, security policy, dependencies, document schema, recovery formats, import codecs or export implementations changed.

## Files

- `src/document-toolbar.js`: new grouped toolbar controller. It reparents existing live DOM controls after all feature modules and recovery notice have mounted.
- `src/document-toolbar.css`: new compact toolbar styles, imported by the controller. Selectors are scoped to the new `.document-ribbon` to coexist with `polish.css` and existing feature styles.
- `src/document-editor.js`: mounts the controller; synchronizes undo/redo and heading state on document/selection changes; delegates editing locks; disposes the controller's notes observer.
- `src/document-formatting.js`: short labels, accessible formatting group, explicit clear/alignment synchronization.
- `src/document-editor.css`: unchanged.

## Command locations

- Persistent navigation: File, Home, Insert, Layout, Review. Source modes omit Insert. Primary Export DOCX and Export PDF remain visible at the right; source has PDF only.
- Persistent rich-text quick strip: Undo, Redo, paragraph style, bold, italic, underline, font, size, text color, clear text style, alignment. It scrolls horizontally at narrow widths instead of adding stacked rows.
- Home: bulleted and numbered lists. Source Home preserves text mode and gives a brief keyboard hint; Markdown/CSV source view controls stay in the quick strip.
- Insert: Page break, existing Table details, existing Image details. Their row/column insert, merge/split, cell-fill, column-grid, resize, alt-text, fit/remove and insertion cancellation controls remain their original DOM nodes and listeners.
- Layout: existing Page setup, including paper, orientation, margins, base font/size/spacing, page numbers and header/footer controls. Page setup is expanded when visiting this tab and can still be collapsed.
- Review: Find / replace, Spell check, Read aloud, Statistics. Existing find and statistics workspaces still appear independently when opened; footer Statistics remains available.
- File: Version history, Save text/source copy, Export RTF copy, existing format/import notes. Opening notes programmatically reveals File, so import errors remain visible.

Recovery alert, canvas, footer and zoom remain outside the ribbon. All existing recovery, undo, native copy exports and PDF preview/save paths are retained.

## State and accessibility

Tabs use `role="tablist"`, `role="tab"`, `aria-controls`, `aria-selected`, roving tab stops and labelled tab panels. Left/Right and Home/End move category focus and activate the tab. Native buttons, labels, summaries, selects and focus rings remain keyboard accessible.

`holdEditing` delegates to `DocumentToolbar.setLocked`: quick tools, navigation, non-insert panels and table controls become inert. Existing image controls disable their own editable fields and retain their Cancel insertion action. This avoids trapping an image operation after moving its previously independent controls into the ribbon. Layout/find locking and export button guards remain in place.

`DocumentToolbar.sync` disables unavailable undo/redo and updates the paragraph-style selector from the current heading. Formatting changes now synchronize on document updates as well as selection changes. Source controls remain separate from rich formatting. Scoped CSS restores source-preview CSV separator and layout selects that the old broad source-mode toolbar rule would otherwise hide after reparenting.

## Verification and root integration guidance

Completed syntax checks: `node --check src/document-editor.js`, `node --check src/document-formatting.js`, `node --check src/document-toolbar.js`.

Root owns the production build and integrated runtime/visual checks. No separate Electron/dev server launched by this implementation agent.

Useful selectors:

| Intent | Selector |
| --- | --- |
| Wait for editor | `[data-ready="true"]` on editor workspace |
| Ribbon | `.editor-toolbar.document-ribbon` |
| Activate category | `[role="tab"][data-document-tab="insert"]` (or file/home/layout/review) |
| Current panel | `[data-ribbon-panel="insert"]:not([hidden])` |
| Quick style | `select[aria-label="Paragraph style"]` |
| Quick text styling | `[data-text-font]`, `[data-text-size]`, `[data-text-color]`, `[data-text-align]` |
| Undo / redo | `[data-command="undo"]`, `[data-command="redo"]` |
| Primary exports | `.document-primary-exports [data-pdf]`, `[data-docx]` |
| Table / image tools | `.document-table-controls`, `.document-image-controls` in Insert |
| Page setup | `.document-layout-controls` in Layout |
| History / RTF / text | `.history-button`, `[data-rtf]`, `[data-text]` in File |
| Review actions | `[data-find-document]`, `[data-document-spelling]`, `[data-document-speech]`, `[data-document-statistics]` |

Runtime checks should cover typing, selecting and styling text; undo and redo; heading-selector state; a table insertion and undo; Layout margin/header/number updates; Find / replace; File/history; actual DOCX/PDF preview/reopen checks; recovery across close/reopen; source/Markdown/CSV modes; an image-insertion cancellation while editing is held; tab arrow navigation; narrow-width overflow and document canvas height. Existing feature tests that clicked hidden controls directly must activate the matching category first. Source rich controls are absent rather than visibly disabled.
