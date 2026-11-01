# Screens that are not simple to use yet

Started October 17, 2026 during the by-eye UI pass. These are not broken; they work, but a first-time
user would find them crowded, technical or confusing. The user asked to fix these **after the main app
is working**. Each entry says what is hard and a suggested direction. Add to this list; do not fix
these before the app works unless they block testing.

Lane: **C** = Claude (shell, Documents, More tools, editor, converters), **X** = Codex (reader, Drawing, Pages).

## Whole app

- **"Physical page" wording (C + X, about 35 files).** Shown wherever a page is named. Most people just
  say "page". Suggest "Page 3" everywhere, and "Page 3 (labelled iv)" only where page labels differ.
- **"Cancel operation" (13 tools).** Suggest "Cancel".
- **"Build ... preview" buttons** (Protect, Redact, PDF to images, others). "Build verified PDF preview"
  sounds technical. Suggest "Preview protected copy", "Preview redacted copy", "Preview images".
  Tests and the robot use these names, so change them together.
- **Two "I checked ..." boxes before saving** in several tools (Redact has two). Necessary for safety,
  but a lot of reading. Suggest one plain box per tool: "I checked the preview".
- **"Details and limits" sections** hold long technical text. Fine as hidden detail, but the text itself
  reads like developer notes in places.
- **Breadcrumb "Workspace > Home"** at the top: "Workspace" means nothing to a user. Suggest just the
  page name.
- **Large interface text on a small window:** the document editor's toolbars take most of the height.
  Capped the options panel tonight; a fuller fix would fold the toolbars into one row with a "More"
  button when space is short.
- **Sidebar at narrow widths** stays full width unless the user collapses it (deliberate). Consider
  collapsing it automatically below about 850 px.

- **"... recovery saved locally" messages** appear in several tools as their main status line. Changed
  in Fill and sign tonight ("Your changes are kept on this computer in case PDFix closes."); the other
  tools still use the technical wording.
- **"Obtain a fresh copy or check its extension"** (file-damaged message) is still used in image-codec.js,
  image-header.js, pdf-operations.js, pdf-reader.js and large-pdf-store.cjs; changed only in
  file-store.cjs tonight. Make them all match.
- **Preview panes inside tools are small.** Protect shows the verified copy at 18%; Fill and sign and
  Redact at 24-35% on small windows. A bigger default, or a "View larger" button, would help people
  actually check the preview they are asked to confirm.

## Claude lane (C)

- **Fill and sign (wording done Oct 18; layout still open):** three areas at once (buttons, page, side panel with autofill profiles, fields and
  placement). The side panel is long. Suggest steps: 1 fill fields, 2 add signature, 3 review and save.
  "CSV mail merge" belongs in a separate tool or a "More" menu. "Export supported field data" is
  unclear.
- **Redact a PDF (title and cleanup wording done Oct 18; layout still open):** many controls before anything happens (resolution, "Hidden-information cleanup
  only", three view tabs, three mark modes, text search, precise position, two checkboxes). The tool
  title differs on Home ("Hide private information"), in the room ("Redact a PDF") and in the dialog
  ("Redact private information"). Suggest one name and a simpler first view: "Mark areas" or "Find
  text", with the rest under "More options".
- **Create fillable fields:** "Delete saved recipe" ("recipe" means a saved layout of fields). The page
  preview is small and the field controls are below it.
- **Extract a table:** asks for row and column break percentages and Left / Top / Width / Height %.
  Suggest drawing the table area and dragging column lines on the page; keep numbers as an option.
  "Load correction draft" is unclear.
- **Prepare signing request:** position boxes in percentages ("Left %", "Top %", "Width %",
  "Height %"); "Location kind". Suggest click-and-drag on the page as the main way.
- **Image to PDF:** two rows of buttons above the picture (rotate, undo, reset, paper, orientation,
  margin, add pictures, page picker, move up/down, duplicate, remove, apply to all). Suggest grouping:
  "This picture" and "All pages".
- **Watched PDF folders:** the idea (watch a folder, act on new files) is advanced; "Suggest - approve
  each job" is unclear. Fine as an advanced tool, but needs a one-line example.
- **Virtual PDF printer:** repeats itself, and the status sentence ("No automatic file interception or
  silent default-printer change is performed") comes from desktop/native/VirtualPrinter.cs (native
  rebuild needed).
- **Edit PDF text and images (first line done Oct 18):** a long technical paragraph sits above "Build PDF preview" (glyph mappings, resource paths, split text arrays). Suggest one plain line ("Click text to change it, or Add text; then preview and save a copy") with the rest under Details.
- **Ask about files:** "Local OpenAI-compatible server", "Local API base URL", "Exact model ID". Only
  for people who already run a local AI program; suggest a short "How to set this up" link.
- **Search selected files:** "Results 1 of 1 - 0 matches" shows before any search; "No displayed
  matches." Suggest showing nothing until the first search.
- **Verify a file fingerprint:** "Import receipt", "Export verification receipt" - receipts need a
  one-line explanation.
- **Document editor, Layout tab:** page setup is a long form (paper, orientation, margins, each side,
  font, size, spacing, page numbers, number position, header and footer text and alignment). Suggest
  presets ("Letter, normal margins") with "Customize" for the rest.
- **Format support:** now plain, but still a long page; fine for now.

## Codex lane (X) - seen tonight, Codex is doing its own pass

- **Document health report:** technical rows ("Page unit scale: 1 (one unit = UserUnit / 72 inch)",
  "Saved page orientation", "Save details as JSON") and a "Run document health report" button inside the
  finished report.
- **PDF reader toolbar inside tools:** page box, zoom, "Fit width", "Tools & view", "Find in PDF" and
  "Print" all appear inside each tool's small preview; crowded at small sizes.
