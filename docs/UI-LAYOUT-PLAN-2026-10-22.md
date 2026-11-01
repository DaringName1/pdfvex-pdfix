# PDFix layout and tab plan (owner, October 22, 2026)

The owner approved the look in the mockup on October 22: the document editor screen (screen 4) is the
model, and every PDF screen uses the same parts. This file says what each part is called, what goes on
every tab, and which tools sit in a drop-down. It builds on [UI-DIRECTION-2026-10-21.md](UI-DIRECTION-2026-10-21.md). Every owner UI rule in one list: [UI-RULES-2026-10-22.md](UI-RULES-2026-10-22.md).
The work items are SHARED-PLAN 2.30 to 2.34.

## 1. The parts of the window (use these names)

From top to bottom:

1. **Side rail**: the thin column of icons on the far left (Home, Files, Favorites, All tools, Ask about files).
2. **Top bar**: Back, the file name, unsaved dot, Actions.
3. **File tabs**: one tab per open file, with its type (PDF, DOCX) and a close ×.
4. **Tab bar**: the one mode button (Quick edit ▾ / View / Build, UI-RULES section 4), then the tab names (Home, View, Comment, ...), then
   *Find a tool*, then the one or two main buttons on the right (Save a copy, Print).
5. **Toolbar**: the row under the tab bar. A few named groups of icon buttons; each group has its name and ▾
   under it (section 3). Changes with the tab.
6. **Page area**: the document.
7. **Options panel**: opens on the right when a tool is picked; × or Escape closes it. Nothing there when no tool is open.
8. **Status bar**: page, zoom, the tool in use, what is selected, saved or not.

## 2. The three modes for a PDF

| Mode | What it is for | Tab bar | Toolbar |
|---|---|---|---|
| View | Just reading | Switch only, plus Find, Pages, Print, full screen (screen 2, owner: keep as is) | none |
| Quick edit | Sign, fill, mark up. The PDF's own text and pictures cannot be changed here | Switch plus Save a copy, Share, Print | One toolbar, no tabs (section 4) |
| Build | Change the PDF itself, every tool | Switch, the nine tabs, Find a tool, Save a copy, Print | One per tab (section 3) |

Owner decisions on record: **PDFs open in Quick edit** (October 22, replacing View); switch to View to just look.
New and Word documents open in Build. In Quick edit and Build you can click anywhere on the page to type and drag things
to move them; pictures and files can be dropped onto the page (UI-RULES section 7).

## 3. Build tabs

Owner rules (October 22; final mockup = the "Final" page of the mockup):

- **The whole app keeps every tool it has.** None is removed; the Word editor keeps all its tools.
- **Groups, like Fusion and Word.** Each tab's toolbar is a few groups (usually 3, at most 4). A group shows its
  most-used tools as icon buttons with a short name under each, and the group's name with ▾ under the group
  (FILE ▾, CREATE ▾, TEXT ▾). A tab must never look cluttered.
- **The group's drop-down lists every tool in that group**: the ones on the toolbar first, then the rarely used ones
  under a "Less used" line. Every tool is already there; nobody adds tools themselves.
- **Look**: like the document editor's toolbar today. Plain buttons, no box around a button or a group, a thin line
  between groups, the picked tool in light green. Undo and Redo sit in the top bar next to the file name.
- When the window is narrow, the group keeps its name and ▾; buttons that do not fit stay reachable in the drop-down.
- Picking a tool opens its options in the Options panel. Nothing opens a second window with a copy of the PDF.

- **Names are not fixed (owner).** Tab, group and tool names in this plan are the clearest found so far; use a clearer
  one whenever there is one, and keep one name per tool everywhere (src/tool-registry.js).
- **Borrowed from Acrobat (the main inspiration), how it works, not its look:**
  - every tool is also in the one All tools list (PDFix: All tools in the side rail);
  - Find, Save a copy, Print and Share always sit top right;
  - a slim bar of panels on the right edge: page thumbnails, bookmarks, comments, attachments, layers. Each opens
    beside the page and closes again; the Options panel opens to the left of that bar.
  - Not borrowed: Acrobat's floating quick-tools bar over the page (Quick edit mode does that job).
- **Home stays as it is** (owner): the mockup's Home and the app's Home today.

"Today" names the tool that already exists in the app (tool id from src/tool-registry.js or the toolbar).

### Home
- **FILE ▾**: Open, Save a copy, Print; less used: Share
- **CREATE ▾**: New document, Combine files, Convert; less used: Image to PDF, Scan to PDF, From email or clipboard
- **AUTOMATE ▾**: Watched folders; less used: Virtual PDF printer, Synchronized file, Search selected files
- Today: open-document, native-combine, image-to-pdf, scan, email, new-document, watched-folders, virtual-printer, synchronized, search-files.

### View
- **ZOOM AND TURN ▾**: Fit page, Fit width, Rotate view
- **GO TO ▾**: Thumbnails, Bookmarks, Find
- **READ ▾**: Read aloud; less used: Copy text, Spell check, Word count
- **DOCUMENT ▾**: Details; less used: Sheet label, Accessibility check, Inspector, Tags
- Today: fit-page, rotate-view, thumbnails, bookmark, read-aloud, details, inspector, tags, sheet-label, copy, spell-check, accessibility-audit, text-statistics. Notes moves to Comment.

### Comment
- **MARK WORDS ▾**: Highlight, Underline, Strike out
- **NOTES AND STAMPS ▾**: Note, Text box, Stamp; less used: Callout
- **DRAW ▾**: Draw, Shapes
- **REVIEW ▾**: Review comments; less used: Comment summary, Notes
- Today: markup (all marks), review-comments, annotation-summary, notes.

### Edit
- **TEXT ▾**: Text, Make searchable; less used: Edit as a Word document
- **PICTURES ▾**: Image; less used: Crop page
- **SELECT AND LINK ▾**: Select, Link
- Today: edit-content (Text tool with Click to type / Edit existing / Text box), links, ocr, edit-copy. Crop page is new.

### Fill & Sign
- **FILL ▾**: Fill form, Date, Check mark; less used: Export form data, Import form data
- **SIGN ▾**: Sign, Initials; less used: Certificate signature
- **SET UP FORMS ▾**: Create fillable fields, Ask others to sign
- Today: forms (fill-sign), signature-request, create-forms, certificate-sign, fdf-export, fdf-import.

### Pages
- **ORGANIZE ▾**: Organize, Insert, Delete, Rotate; less used: Remove blank pages
- **SPLIT AND EXTRACT ▾**: Extract, Split
- **NUMBERING ▾**: Page numbers; less used: Bates numbering
- **OUTLINE AND BOXES ▾**: Outline; less used: Page boxes, Page workflow
- Today: pages (organize), decorate (page numbers and stamps), bates, edit-outline, page-boxes, blank-pages, document-workflow. Insert, Delete, Rotate, Extract and Split open Organize at that action.

### Protect
- **SECURE ▾**: Password, Redact, Remove hidden data
- **CHECK ▾**: Security report, Document health; less used: Certificate signatures, Verify fingerprint, Repair
- Today: protect (three choices), redact, sanitize, security report, health-check, fingerprint, certificates, repair.

### Measure
- **MEASURE ▾**: Distance, Area, Perimeter, Count
- **SCALE AND MAPS ▾**: Set scale; less used: Map coordinates
- **COMPARE ▾**: Compare revisions, Sheet sets; less used: Fix thin lines
- Today: takeoffs (measure drawing), compare, sheet-set, geospatial, thin-lines.

### Export
- **SAVE AS ▾**: Word, Pictures, Table to Excel
- **SIZE AND COPIES ▾**: Compress, Save a named copy; less used: Compress several PDFs, Copy or rename many files
- **PRINT AND ARCHIVE ▾**: Printer marks; less used: Attachments, Preflight, Portfolio
- Today: edit-copy, export-images, table-extraction, compress, smart-name, compress-batch, batch-copy, print-marks, preflight, attachments, portfolio.

## 4. Quick edit toolbar (no tabs)

- **MARK ▾**: Highlight, Draw, Shapes, Comment; less used: Underline, Strike out, Text box, Callout
- **TYPE ▾**: Type on page
- **SIGN ▾**: Sign, Fill form, Stamp, Date; less used: Initials
- Right end text: "Need to change the PDF itself? Switch to Build."
- The tools are the same ones as in Comment and Fill & Sign; only the place is different.

## 5. Document editor (Word documents)

Owner, October 22: **keep every tool the editor has today.** Nothing on its toolbar is removed or moved into a drop-down.
It stays as today and as screen 4: tab bar with File · Home · Insert · Layout · Review, the Name box, Save,
Export DOCX, Export PDF, Print. Home keeps both toolbar rows:

- Row 1: Undo, Redo, paragraph style, Bold, Italic, Underline, Strike, superscript, subscript, highlight, font, size, color, Clear style, the four alignments.
- Row 2: Bullets, Numbering, Decrease and Increase indent, Line spacing, Space before, Space after, First line, Right indent, Find.

The 8-button limit in section 3 is for the PDF Build tabs only. In the editor a drop-down is used only for a tool added later
that does not fit. Only the look changes: the same grouped small buttons and spacing as screen 4.
The Picture panel shows only while a picture is selected (2.24).

## 6. Who builds what

- Codex (PDF reader and its toolbar): sections 2 to 4 (SHARED-PLAN 2.30, 2.31, 2.33).
- Claude: the shared category drop-down (2.32), the editor (section 5, 2.34),
  and moving Claude-lane tools into their tabs.
- The mockup: https://claude.ai/artifact/9Up2cNtgo9GvpmNpNoJqjZ (owner's account; screens 2 to 16).
