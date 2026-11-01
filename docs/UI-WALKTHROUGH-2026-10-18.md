# UI walkthrough by eye — October 18, 2026 (evening)

Claude went through the app at 1440×900 with a one-page PDF (`tests/fixtures/robot-parts-table.pdf`) and a new
document, looked at every screenshot (Home, the four Workspaces rooms, the reader and both of its menus, Edit PDF
text, Mark up, Fill and sign, Fix or combine pages, and the editor's tabs), and counted how deep tools are.
The owner's direction: **many more previews, adding text must be easy, and tools must not sit in a drop-down inside
a drop-down that then opens a separate page.** Part of the [V1 audit](V1-WHOLE-APP-AUDIT-2026-10-18.md) UI and
workflow pass. This is a list for planning, not yet a build order; the owner adds their own items.

Lane: **C** = Claude (Home, shell, Workspaces, editor, Documents and More tools: Fill and sign, Edit PDF text,
Redact, forms…). **X** = Codex (reader, its menus, Mark up, Drawing, Pages).

## 1. Tools are buried (the owner's main point)

| # | What I saw | Why it hurts | Better way (Acrobat, Bluebeam, others or ours) | Lane |
| --- | --- | --- | --- | --- |
| 1.1 | In an open PDF, the toolbar has only page arrows, zoom, Fit width, **Tools & view**, Find, Print. No tool is visible on the page. | You cannot see how to add text, highlight, comment or sign without opening menus | A **tool bar of the everyday tools always visible** above the page: Select, Add text, Highlight, Note, Draw, Shapes, Stamp, Sign, Measure, Redact. Acrobat's quick tools and Bluebeam's markup bar do this | X |
| 1.2 | **Tools & view** holds **7 collapsed groups and about 60 tools** (counted). Add text, Mark up, Fill and sign and Organize pages are inside groups | Menu → group → item → a separate window: three levels before you can work | Keep only rare tools in a menu, as one flat, searchable list (type to filter). Everyday tools move to the bar in 1.1 | X |
| 1.3 | A second menu, **PDF tools** (top right), has 5 more items (Security report, Certificate signatures, Edit PDF text & images, Edit a text document copy, Make scan searchable) | Two menus with overlapping jobs; it is not clear which has what | One place for tools. "Edit PDF text & images" belongs in the bar (Add text) | X, C |
| 1.4 | The same tools are also on Home cards, in four Workspaces rooms (39 cards) and in the reader menus | Three different maps of the same tools | Home: the few starting jobs. Inside a file: tools on the bar. Workspaces: a catalogue with search, not a second way to start every job | C |
| 1.5 | Many reader menu items are plain words, some are boxed buttons, some greyed text (Fit page, Copy page text, Save page) in the same list | Hard to scan; unclear what is clickable | One consistent style; icons plus words | X |

## 2. Each tool is a separate window with its own small copy of the page

| # | What I saw | Why it hurts | Better way | Lane |
| --- | --- | --- | --- | --- |
| 2.1 | Edit PDF text, Mark up, Fill and sign, Fix pages each open a **large window on top of the PDF** with their own page viewer at 55–62% size | You leave the page you were reading; the page is smaller; zoom and page position are lost; only one tool at a time | **Tools work on the open page itself** (a mode of the reader), with a side panel for options, like Acrobat's Edit and Bluebeam's markup | X (reader), C (Fill and sign, Edit text) |
| 2.2 | Every tool ends with **Preview → tick a review box → Save**, and Edit PDF text needs **Build PDF preview** before anything can be saved | Many extra steps for a small change | Show the change **live on the page** as you make it; Save makes the copy. Keep a final check only where something is permanent (Redact, signatures, passwords) | Both |
| 2.3 | Tool windows show long safety paragraphs at the top (for example Fix pages: "annotations, links, bookmarks and metadata are removed…") | Text before the work; and in that case it is a real **data loss** (see 6.1) | Fix the cause so the warning is not needed; otherwise one short line with "details" | X, C |

## 3. More previews (the owner's point)

| # | What I saw | Better way | Lane |
| --- | --- | --- | --- |
| 3.1 | **Fix or combine pages shows no page pictures**: each page is a text row ("Page 1 · Parts table.pdf · 0° · 215.9 × 279.4 mm") with ↑ ↓ ⟳ + × buttons | A **grid of page thumbnails** you drag to reorder, rotate on hover, select many, drag pages in from another file | X |
| 3.2 | Home cards and Recently opened show icons only | Thumbnails of recent files; hovering a card shows what the tool does with a small picture | C |
| 3.3 | Tools show what will happen only after "Preview" | Live preview on the page (2.2); before saving, a side-by-side before/after where useful (compress, redact, page numbers) | Both |
| 3.4 | Workspaces cards are large text boxes (only 9 visible per screen) | Smaller cards with an icon and one line; preview on hover | C |

## 4. Adding text must be easy (the owner's point)

Today, to add a line of text to a PDF: Home → **Edit PDF text and images** (or reader → PDF tools → Edit PDF text &
images, or Tools & view → Forms and editing → Add text and images) → a separate window → **Add text** → type in a side
panel → drag to place → **Build PDF preview** → tick → save. In Mark up, a text note means choosing it from the
**Tool** drop-down first. In Fill and sign, text is a "visual placement": Content drop-down → Method drop-down → Text box.

| # | Better way | Lane |
| --- | --- | --- |
| 4.1 | One **Add text** button always on the reader bar (1.1). Click it, click on the page, type **directly on the page**, drag the box, change size and colour in a small floating bar. Same as Acrobat's "Add text" and Bluebeam's text box | X with C |
| 4.2 | Clicking existing PDF text in edit mode puts the cursor **into that text on the page**, not into a list in a side panel ("Original text on this page") | C (Edit PDF text) |
| 4.3 | Fill and sign: click anywhere on the page and type (Acrobat "Fill & Sign" style); fields found in the form are highlighted on the page to click into | C |
| 4.4 | In Mark up, the text box, note, callout and arrow are buttons, not entries in a Tool drop-down | X |

## 5. Drag and drop (inventory to finish)

Works today: a file onto Home ("Drop a file here"); pages between PDFs in the Fix pages tool ("Copy or drag pages from
chosen PDFs"); placing added text and images by dragging.
Missing or not seen: files onto a tool card or into an open tool; dropping a picture onto a document or a PDF page;
reordering page thumbnails by dragging (3.1); dragging files onto Combine; dragging stamps, signatures and saved
markup tools onto the page; dragging sheets into a sheet set; dragging a tab out to compare side by side.

## 6. Problems found on the way

| # | What | Lane |
| --- | --- | --- |
| 6.1 | **Fix or combine pages removes existing annotations, links, bookmarks and metadata** from the new copy, and refuses forms/signatures (stated in its own banner). This is a data-integrity gap for the V1 audit (area 3): reordering pages should keep comments and bookmarks. The "Preserve comments / links: reorder original" button suggests a second path exists; the default should keep them | X |
| 6.2 | The **"Opened Parts table.pdf…" message stayed on screen** through several later screens (still showing in the editor), covering the document name box | C |
| 6.3 | Mark up opens with three rows of settings (ink width, opacity, highlighter opacity, ink pressure, eraser radius, saved drawing tools) before any tool button | X |
| 6.4 | Fill and sign's side panel opens on "Local autofill profiles", "Save signature for reuse" and storage notes when the form has no fields; the page is the smaller part | C |
| 6.5 | Fit width is shown as plain green text next to boxed buttons; "Find in PDF" looks like a label, not a button | X |

## Suggested order (for the owner to decide)

1. Reader tool bar with the everyday tools (1.1), and Add text on the page (4.1). These two change the feel the most.
2. Tools work on the open page instead of separate windows (2.1), starting with Add text, Mark up and Fill and sign.
3. Page thumbnails with drag in Fix pages (3.1) and keeping comments/bookmarks (6.1).
4. Live preview instead of Preview buttons (2.2).
5. Flatten and search the remaining menus (1.2–1.4), Home and Workspaces thumbnails (3.2, 3.4), drag-and-drop list (5).

Screenshots of this walkthrough were saved locally in `tmp/ui-walk/` (not committed).

## 7. Second pass: each tool in Documents and More tools (Claude's lane), and others

Thirteen more tools opened with the same sample files and looked at by eye.

| # | Tool | What I saw | Better way | Lane |
| --- | --- | --- | --- | --- |
| 7.1 | **Edit a workbook** | Not a spreadsheet you type into: you pick a cell, type in a separate **Value** box and click **Apply value**. A long yellow warning sits above the grid | Type straight into cells like Excel (Enter moves down, Tab moves right), paste ranges, Undo; the warning becomes one short line | C |
| 7.2 | **Extract a table** | The table area is typed as Left/Top/Width/Height **percent**; rows and columns are typed numbers; the default box covers the whole page and its grid does not match the table even though the table has visible lines | Detect the table automatically (it has ruled lines), let people drag the box and drag the row and column lines, show the extracted cells live | C |
| 7.3 | **Create fillable fields** | Field position is "PDF coordinates, origin lower-left, 72 points per inch"; at 900 px tall the window's bottom buttons (Preview) are cut off | Draw the box on the page (it already allows dragging; hide the numbers under "Exact position"); keep the action buttons always visible | C |
| 7.4 | **Redact** | Two buttons that sound alike (**Mark region** and **Add a region**), a dpi setting first, two checkboxes to tick, Build preview, then Save | One "Mark area" tool plus "Find text to hide", marks shown on the page; one confirmation before saving (redaction is permanent, so keep one) | C |
| 7.5 | **Protect or unlock** | Six password boxes and an Action drop-down shown at once; "opening password" and "owner password" are jargon. Behind the window, the PDF disappeared and the page showed only the sentence "Use the password workspace to review and save a new protected or unprotected copy." | Two simple choices: "Require a password to open" and "Stop printing, copying or editing". Keep the PDF visible behind the window | C |
| 7.6 | **Compress** | Nothing about size until **Build compressed preview** | Show the current size and an estimate for each choice straight away; one click to save | X (Pages room) |
| 7.7 | **PDF to images** | No picture until **Build image previews** | Show the page thumbnails to pick at once | C |
| 7.8 | **Image to PDF** | Good big preview. The settings row is crowded and wraps (Reset / Page / Orientation run into each other under the message) | Group page settings in a side panel; drag pictures to reorder (today ↑ ↓ buttons) | C |
| 7.9 | **Page numbers and stamps** | A wall of warnings ("single-line ASCII", "XFA", "certificate signatures"), placeholders like `{page} of {total}`, and no page preview on the first screen | A page preview that updates as you type, with presets ("Page 1 of 10", "Bates", "Draft" watermark); warnings only when they apply | X (Pages room) |
| 7.10 | **Document health report** | A developer table (SHA-256, UserUnit, PDF.js, MediaBox); it says "1 thing to look at" without showing which thing first | Lead with the result in plain words ("1 thing to check: …") and hide technical rows under "Details" | C |
| 7.11 | **Create from email or clipboard** | The two modes (Email message / Clipboard text) look like ordinary buttons, so it is not clear which is chosen | Tabs or a clear selected state; drag a saved email onto the window | C |
| 7.12 | **Search selected files** | "Details and limits" appears twice; "Results 1 of 1 · 0 matches" before any search | One details section; show nothing until a search runs; drag files or a folder onto it | C |
| 7.13 | **Virtual PDF printer** | Mostly paragraphs; installing needs a checkbox first | Short steps with one Install button; the explanation under "How it works" | C |
| 7.14 | **Workspaces search** | While searching, the **Drawing** room tab still looks selected although results come from every room | Show "Results from all rooms" and no tab selected | C |

**Patterns across tools (both lanes):**
- **Developer words leak into the screens:** PDF.js, UserUnit, MediaBox, XFA, ASCII, SHA-256, "physical page", "PDF coordinates". These belong under "Details" or should go.
- **Long safety paragraphs before the work.** Most tools open with two to four sentences of limits. One plain line, with "Details" for the rest.
- **"Build … preview" buttons everywhere** (compress, images, redact, protect, edit text, page numbers, fields). The owner wants more previews: show them automatically and keep them up to date.
- **Review checkboxes before Save** on almost every tool. Keep one only where the result is permanent or risky (redaction, passwords, signing).
- **Messages sit at the top centre** over the toolbar (fixed tonight to close after 8 seconds; before, they could stay). They still cover controls while shown (7.8); a corner position would cover less.

**Fixed tonight:** messages now close after 8 seconds (they used to stay on screen until replaced; see 6.2).

## 8. Third pass: Drawing and Pages tools, side pages, editor, smaller window

| # | Where | What I saw | Better way | Lane |
| --- | --- | --- | --- | --- |
| 8.1 | **Editor** | The document is one endless sheet with no page edges; at Fit width it looks like a web page. Page breaks show only in Export PDF → Preview | A page view with page edges and gaps (Word's Print Layout), 100% by default, Fit width as an option | C |
| 8.2 | **Editor** | Two save buttons: **Save original copy** (title bar) and **Save** (ribbon), plus Export DOCX and Export PDF | One Save (and Save as…); exports grouped under File or one Export button | C |
| 8.3 | **Editor** | Find / replace sits under the Review tab | Keep Ctrl+F and also a Find button on Home | C |
| 8.4 | **Print** (reader and editor) | Settings first; the preview appears only after **Prepare preview**, then a tick, then the Windows dialog | Show the preview straight away and update it as settings change; one Print button | X (shared print preparation) |
| 8.5 | **Review drawing comments** | Opens under the page and shrinks it to a strip; three rows of filters before any comment | Comments in a side panel beside the page; filters folded under one Filter button | X |
| 8.6 | **Takeoffs, Outline, Bates, Signing request** | Long paragraphs of limits; positions typed as percentages; Bates in a narrow window where title and buttons crowd | One plain line plus Details; place things by clicking or dragging on the page | X (takeoffs, outline, Bates), C (signing request) |
| 8.7 | **Sheet sets** | Sheets listed as "1, 2, 3" with Move up / Move down and no thumbnails | Thumbnails with drag to reorder; titles read from the drawing's title block where possible | X |
| 8.8 | **Ask about files** | Needs a server address and an "exact model ID" before anything works | Detect a local AI program automatically; show a simple "not set up" state with one Set up button | C |
| 8.9 | **Files** | Only a list of opened files; no thumbnails, sorting or filter | Thumbnails, sort by name/date/type, filter box | C |
| 8.10 | **Smaller window (1280×720)** | Messages cover the reader's zoom and Tools buttons; Fill and sign shows the page at 47% | Messages away from toolbars; tools working on the page (2.1) fixes the small page | Both |
| 8.11 | **Actions (Ctrl+Shift+P)** | Already a searchable list of 102 actions: a good base for the flat tool list in 1.2, but hard to find (a plain "Actions" button) | Make it the "All tools" search, and show it from the reader's tool bar | C |

## 9. Approved layout: one place for everything (owner approved October 19)

**The owner's view (October 18): the UI is usable but where things are makes no sense.** The cause: the same tools
live in five places, each grouped differently: Home cards (12), Workspaces rooms (39 cards in Drawing / Documents /
Pages / More tools), the reader's **Tools & view** menu (7 groups, about 60 items), the separate **PDF tools** menu,
and the Actions list (102 entries). The same tool can have three different names. Proposal, used by Acrobat
("All tools" plus a tool bar) and Bluebeam (tool bars by job):

1. **Home is only for starting:** drop or open a file, recent files with thumbnails, and about six starting jobs
   (New document, Combine files, Scan, Image to PDF, Compare two files, Search files).
2. **Once a file is open, all its tools are in one tool bar above the page, grouped by job, same order every time:**
   **View** (zoom, pages panel, search, rotate view) · **Comment** (highlight, note, text box, draw, shapes, stamps,
   comments list) · **Edit** (add text, edit text, images, links) · **Fill & Sign** · **Pages** (thumbnails: drag,
   rotate, delete, insert, split, page numbers, crop) · **Protect** (redact, password, clean hidden data) ·
   **Measure** (drawings: scale, measure, takeoffs, compare revisions, sheet sets) · **Export** (Word, images,
   compress, print). Choosing a group shows its tools as buttons; options appear in a side panel; the page stays.
3. **One search box, "Find a tool"** (the Actions list, Ctrl+K), in the tool bar and on Home.
4. **Workspaces becomes "All tools":** the same eight groups, same names, as a catalogue with search; nothing
   else to learn.
5. **One name per tool everywhere** (Home, tool bar, search, help).
6. Remove the **PDF tools** menu and the **Tools & view** groups once everything is in the tool bar.
7. Word, Excel and PowerPoint files keep their Word-like ribbon (File, Home, Insert, Layout, Review), which already
   works this way.

Lanes: Claude builds Home, All tools, search and the shared names list; Codex builds the reader tool bar and moves
its tools into the groups; tools in Claude's lane (Fill & Sign, Edit text, Redact, Protect, Export) plug into it.

## 10. Owner decision, October 20: work like Acrobat, Word and Google Docs

- **Open PDF (Codex): a Home group first, like Acrobat's quick tools.** When a PDF opens, the first group is **Home**
  with the 8-10 most-used tools as large buttons: Select, Highlight, Add comment, Add text, Draw, Fill and sign,
  Organize pages, Find, Print, Save a copy. The eight groups stay beside it for everything else; rarely used View
  tools (read aloud, word count, tag tree and similar) move under a More button.
- **Document editor (Claude), like Word and Google Docs:** pages shown as pages (page view, not one endless sheet),
  one Save (Save as / exports under File, like Word), Find always one click away (Ctrl+F and a Find button on the
  Home tab), and the Home tab keeps the most-used formatting, as today.
- **Home page:** stays like Acrobat's start page: open a file, the main starting jobs, recent files, All tools.

## 11. Found during the V1 audit tests (October 20)

- **Conversion notes are hidden.** After "Open as formatted document" (Markdown or CSV), what changed — for example
  "2 images stayed text labels" — is only under File > Format & import notes, and the editor opens on Home. Show a
  short message on open ("Converted - 2 notes, see File") or open the notes the first time. For the UI pass (section 2).
