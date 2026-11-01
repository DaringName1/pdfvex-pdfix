# PDFix tool plan: every tool, most used first

One plan for every tool (owner, October 28, 2026). It replaces docs/TOOL-WORKFLOW-PLAN-2026-10-28.md and
docs/TOOL-BY-TOOL-PLAN-2026-10-28.md.

Owner's words: "the UI is good but each tool workflow is not"; "make a plan for each tool and do not leave a thing
out"; "the cancel button is not greyed out, it works all the time"; "make them easy and super easy to understand";
"whatever is the standard is the thing, and if there are other ways to do it, have them in the drop-down on the
right"; "work from most used to less used".

**Who does what:** Claude tests every tool, writes what is wrong, adds robot checks and fixes saving and back-end
problems. Codex fixes screens and steps. The owner decides anything marked **owner**. Tests always run on a clean
copy of a committed version, outside Google Drive.

**Where the button lists come from:** a click-through of committed 5d6c6ff that opened every tool on every Build tab,
every Quick edit tool, every Home and All tools card and the new-document editor, recording every control, which were
greyed out and why, and how you could get out. Plus every button label in each tool's code, so buttons that only
appear at later steps are included. *Not yet clicked automatically:* the new-document Insert, Edit, Review, Pages,
View and Export tabs (the run was stopped), Print and Read aloud (need a hand check).

---

## Part 0. Keeping files safe — what PDFix promises (most important)

Owner: "the most important ... all the tools working and not losing files." Every tool in Part 4 must keep every
promise below. A promise counts as kept only when a test proves it on the current build.

**Status key:** **Proven** = a test checks it today · **Partly** = proven for some tools only · **Not tested** = the
app may do it, nothing proves it · **Missing** = the app does not do it yet.

| # | PDFix promises… | What that means in practice | Status (October 28) |
|---|---|---|---|
| S1 | **Your original file is never changed.** | Every tool saves a new copy. The original's bytes are the same after any tool, save, crash or cancel. | **Proven** for the main save routes (original-unchanged checks in the app tests and robot). Check every Part 4 tool. |
| S2 | **A saved copy is complete or not there at all.** | Written to a temporary file first, checked by reading it back from disk, then given its name. Never a half-written file with your chosen name. | **Proven** for the common save route; check every tool's own save. |
| S3 | **Saving never replaces another file by accident.** | A name that already exists gets a new suggested name or a clear "Replace?" question. | **Proven** (copy naming, October 28 work). |
| S4 | **Unsaved work is kept while you work.** | A recovery draft is written automatically as you work, on this PC only. | **Partly:** documents, Mark up, Organize pages, Fill and sign, Redact, Edit text. Check each Tier 1–2 tool. |
| S5 | **A crash or power cut never loses your work.** | Next start offers it back: "Continue … / Discard". | **Partly:** documents (robot crash job passes, Oct 29), Edit text, Redact, signing requests, spreadsheets, slides, Mark up. Type on page fixed Oct 29 (d861adf): typing not yet placed comes back at the same spot. Home additions, Draw and Comment come back (Home shows a notice; Draw/Comment only once the tool is reopened). Fill form and Sign still to test (blocked by W2/W5). |
| S6 | **A crash *during* a save never damages anything.** | Original intact, no broken copy left under the final name, recovery draft intact. | **Partly:** proven for Mark up and Organize pages (app killed mid-save); Quick edit Highlight → Save a copy killed at 6 moments (0–3 s) on a 120-page PDF, Oct 29: original identical, copy absent or complete, no leftovers, unsaved highlight still recoverable. Code check Oct 29: every save to a place the person chose goes through stage → verify → rename (verified-output.cjs via file-store, split-writer, page-workflows, sheet-sets, watched folders); only the problem report text is written directly. Fill and sign, Redact, Compress, Edit text, Protect, OCR, Page numbers, Export and documents still to prove. |
| S7 | **Leaving with unsaved work always asks.** | Closing the tool, file or app, switching tool/mode, or going Home asks once: Keep editing / Discard. | **Partly:** not every tool asks yet (rule R12). |
| S8 | **Problems while saving never lose work.** | Full disk, read-only folder, file locked by another program, network or cloud folder gone, USB stick pulled: a plain message, the work stays open, you can save somewhere else. | **Partly:** locked files and read-only cases proven; full disk, vanished network/cloud folder and pulled USB stick still to prove. |
| S9 | **Someone else changing the file is noticed.** | If the file changes on disk while open (another program, a sync), PDFix says so before saving and never mixes the two. | **Partly:** saved-copy changes are refused (October 28); check open-file changes and sync folders. |
| S10 | **Cloud files are complete before opening.** | OneDrive / Google Drive / Dropbox files that are only placeholders are fully downloaded first, or PDFix says so. | **Partly:** the synchronized-file tool checks this; check normal Open on those folders. |
| S11 | **Two windows can't damage the same file.** | Opening the same file twice is either refused or both stay safe. | **Not tested.** |
| S12 | **Updating PDFix keeps everything.** | Installing a new version over the old one keeps recovery drafts, saved signatures, settings, recent files and pinned files. | **Not tested.** |
| S13 | **Uninstalling asks about your data.** | Uninstall removes the app; it says where drafts and signatures are kept and whether they are removed. | Uninstall proven clean on the spare PC; the question to the user is **Missing**. |
| S14 | **Saved files work in other apps.** | PDFix-made PDFs open correctly in Adobe Acrobat Reader, Edge, Chrome; Word/Excel/PowerPoint files open in Office. | **Not tested by a person.** Rebuild the compatibility folder (scripts/check-compatibility-outputs.mjs after a robot replay), owner opens each file. |
| S15 | **Signed PDFs are protected.** | Changing a PDF that has a digital signature warns that the signature will no longer be valid, and never changes the signed original. | **Partly:** editing tools refuse signed sources; check every tool and the wording. |
| S16 | **Too-big or damaged files are refused clearly.** | A file PDFix can't handle gets a plain message before any work starts, never a half-finished copy. | **Partly:** size limits and damaged-file refusals proven for the reader; check each tool. |
| S17 | **Documents keep their history.** | Version history lets you go back to an earlier version of a document. | Works (Version history); Esc doesn't close it (X7). |
| S18 | **Your private data stays on this PC and can be cleared.** | Drafts, signatures and recent files are stored locally only; Settings can clear them (asking first). | **Proven** (no uploads; internet-off runs). Drafts are not encrypted — said in Settings. |
| S19 | **An open file stays open until you close it.** | Going Home, to Files, All tools or Settings never closes an open file. Every open file has a tab that is always visible (also on Home, also with only one file), next to a Home tab, like Acrobat and web browsers. Clicking the tab returns to exactly where you were: same page, zoom, mode, tool and unsaved work, without reopening. Only the tab's × closes it, asking first if there is unsaved work. If a file can't be shown again (moved, deleted), the tab stays and says so with "Find it" / "Close tab", never vanishing silently. Optional: on the next start, offer to reopen the files that were open. | **Missing.** Today (5d6c6ff, src/app.js): going Home disposes the reader, so coming back reopens the file from the recent list and loses the page, zoom and tool; the tab row shows only in the file view and only with 2+ files, so with one file or from Home there is no way back except Recently opened; a tab whose reopen fails (file moved, recent list cleared, very large files released on leaving) is dropped without a word. |
**How every tool is checked for file safety** (added to the Part 3 tests for each Part 4 tool):
1. Original byte-for-byte unchanged after: save, cancel at every step, crash before save, crash during save.
2. Kill the app in the middle of saving → restart → original intact, no broken copy, work offered back.
3. Kill the app with unsaved work → restart → "Continue" brings back exactly what was there.
4. Save to a full disk, a read-only folder and a locked file → plain message, work still open, saving elsewhere works.
5. The saved copy reopens in PDFix and in at least one other app (Edge for PDFs; Office reader for Office files).

**Order:** S6 and S5 for the Tier 1 tools first (Type, Highlight, Comment, Draw, Sign, Fill, Save a copy), then S12
(update keeps everything), then S14 (compatibility folder for the owner), then S8 and S11, then the Tier 2 tools.

## Part 1. Rules every tool must follow

A tool is finished only when all of these are true.

| # | Rule | How it is checked |
|---|---|---|
| R1 | **Cancel is never greyed out.** While a job runs it stops it and nothing is written. When nothing runs it closes the tool. If there is unsaved work it asks once: Keep editing / Discard. | Cancel at every step: before, during and after the job. |
| R2 | **Esc does what Cancel does** in every panel, menu and dialog. | Esc at every step. |
| R3 | **Always a way out:** an × in the tool's corner, and clicking another tab or tool. Never stuck. | Leave each tool by ×, Esc, Cancel, another tab. |
| R4 | **One tool panel at a time.** Opening a tool closes the previous tool's panel (asking first if it has unsaved work). | Open tools one after another. |
| R5 | **The button does the standard job; other ways are in its ▾** (split button, owner decision). | Every button in Part 4. |
| R6 | **One name for one job, everywhere** (Quick edit, Build, Home, All tools, Find a tool). Same name, icon and place. | Name check script. |
| R7 | **Same panel layout for every tool:** title + one line saying what it does → numbered steps (1 Choose → 2 Check → 3 Save) → only what this step needs → "More options" closed → bottom bar: Cancel (left) · green button named for the result (right). | Look at each tool. |
| R8 | **Steps top to bottom in order;** Save last, never above things you still need to do. | Hand walk. |
| R9 | **Tell people what to do where they are looking:** "Click where you want to type" next to the pointer; pointer changes per tool; hover shows what can be clicked; empty states say the next step. | Hand walk. |
| R10 | **Every action shows on the page straight away** (no "Build preview" step to see your own change), and finished actions show a short message with **Undo**. | Hand walk. |
| R11 | **Everything a tool adds can be deleted:** click it → Delete key or a visible bin. Ctrl+Z / Ctrl+Y and the header arrows undo every change. | Add, delete, undo, redo each item. |
| R12 | **No lost work:** leaving a tool, switching tab/mode or closing the file with changes asks once. A crash brings work back. | Leave mid-way each way. |
| R13 | **Saving is always the same:** Save a copy → name → receipt (Continue with this copy / Show in folder / Keep working on the original). The original never changes. | Save, then compare the original byte for byte. |
| R14 | **Greyed buttons say why** and what to do. No dead buttons. | Button sweep reads every greyed reason. |
| R15 | **Plain words;** no technical terms ("operation", "contained", "staged", "physical page", "recipe", "provenance", "flatten", "build preview"). Each tool has a small "?" with three short lines. | Read every label. |
| R16 | **Safe by default:** only risky actions (redact, delete all, clear, remove password, discard) are red and ask once. Good defaults so most people press only the green button. Last choices remembered (colour, pen, signature, font). | Hand walk. |
| R17 | **Errors once, in plain words, next to the tool,** saying what to do. | Force each error. |
| R18 | **Keyboard and small windows:** Tab reaches everything with a focus ring; nothing cut off at 1366×820, 800×620 and 150% text. | Keyboard walk, screenshots. |
| R19 | **Fast:** opens in under 2 seconds; long jobs show "x of y" and a working Stop. | Timed on the spare PC. |
| R20 | **Advanced tools are labelled advanced** so they don't look like things everyone must learn. | Look at each tab. |

## Part 2. Problems found everywhere (fix once for all tools)

| # | Problem today (5d6c6ff) | Rule |
|---|---|---|
| X1 | **Cancel is greyed out until a job runs**: Fill and sign, Mark up (every Quick edit mark tool), Make a scan searchable, Create fillable fields, Review possible blank pages, PDF layers, Name and save unchanged copy, Scan to PDF (Discard), Search selected files (Stop), Compress several PDFs, Batch copy (Stop processing), Verify fingerprint. | R1 |
| X2 | **Panels from earlier tools stay open.** Redact opened squeezed between leftover Saved pages, Find and "Notes on this page" panels; Organize pages opened beside a Fill and sign panel; Rotate view stayed on in Protect and Export. | R4 |
| X3 | **Greyed buttons with no reason:** Preview annotated copy, Use for next mark, Add at this location, Delete selected profile, Save decorated PDF copy, Sign this PDF, Build cleanup preview and many more. | R14 |
| X4 | **Too many controls for simple jobs:** Quick edit Type on page / Sign / Date / Initials / Fill form open the full Fill and sign panel (55 controls: autofill profiles, field calculations, keyboard tab order, CSV mail merge). | R7 |
| X5 | **Save above unfinished steps:** Fill and sign shows Preview / Save form answers above the signature controls. | R8 |
| X6 | **Technical words** on many panels. | R15 |
| X7 | **Esc doesn't close:** Settings, Version history (documents), All tools, Ask about files, Format support. | R2 |
| X8 | **No visible Close:** Edit a text document copy, New document and Open a document have only the small ← arrow. All tools windows (Scan, batch tools, watched folders, fingerprint…) have only a tiny ×. | R3 |
| X9 | **Same job, many names** (table below). | R6 |
| X10 | **Typed numbers instead of drawing on the page:** signing request locations (%), table extraction (%), field builder (Left/Bottom/Width/Height), redaction position (%), page boxes (coordinates). | R9 |
| X11 | **Other tools' buttons repeated inside panels:** Create fillable fields and Drawing sheet sets show a "Preview options" list repeating about 40 other tools. | R7 |

**Same job, many names today → one name (R6):**

| Job | Names today | One name |
|---|---|---|
| Sticky note | Comment, Add comment, Note | **Comment** |
| Pen | Draw, Freehand | **Draw** |
| Words on a page | Type on page, Add text, Text box, Click to type, Edit PDF text and images | **Type** (new words), **Edit text** (change words) |
| Save | Save a copy, Save PDF copy, Save filled / annotated / redacted / compressed / decorated / verified PDF copy, Save this copy, Save pages | **Save a copy** (the receipt says "filled", "redacted"…) |
| Join PDFs | Organize → Add another PDF; Combine PDF originals | **Combine PDFs** |
| Sign | Sign, Fill and sign, Sign with a Windows certificate, Prepare signing request | **Sign**, **Ask others to sign**, **Digital ID signature** |
| Cancel | Cancel, Cancel operation / creation / processing / scan / copying / calculation, Stop processing | **Cancel** (and **Stop** only while a job runs) |
| Close | ×, Close, Close markup workspace, Close fill and sign, Close page workspace… | **×** ("Close" on hover) |
| Preview | Build PDF preview, Build verified PDF preview, Build clean copy to review, Build workflow preview, Preview filled copy, Refresh preview | **Preview**, or automatic |

## Part 3. How every tool is tested

For each tool in Part 4, on a clean copy of the newest committed version:

1. **Hand walk of the most common job** with a realistic file (worksheet, form, scan, drawing): count clicks against
   Acrobat Reader, note every "what now?", screenshot each step.
2. **Button sweep:** every button listed is pressed at every step; anything that does nothing, errors, or leaves the
   screen stuck is a finding.
3. **Cancel sweep:** Cancel, Esc and × at every "Cancel at" point; switching tab, mode and file mid-way. After each:
   original byte-for-byte unchanged, no stray file, app still usable.
4. **Delete sweep:** add every item under "Delete", remove each with the Delete key and the visible bin, then Undo
   and Redo.
5. **Easy-to-understand checks:** 5-second test (from the title and first line, can a person say what it does?);
   same layout (R7); one name (R6).
6. **Scorecard row** in docs/TOOL-WORKFLOW-SCORECARD.md: R1–R20 pass/fail, clicks vs Acrobat Reader, problems, who
   fixes, commit tested.
7. **Robot task** for each fixed tool (main job + cancel + delete) so the overnight robot keeps checking it.
8. After beta (owner's after-beta plan): first-time people walk the top 20 tools with no help.

Findings go to Codex (screens) or Claude (saving/back end) the same day, in batches of 3–4 tools, in Part 4's order.

## Part 4. Every tool, most used first

Each entry: **Click** (standard job) · **▾** (other ways) · **Job** (most common use, checked first) · **Needs** ·
**Buttons today** (*greyed* = greyed out) · **Cancel at** · **Delete** · **Today** (problems now).

### Tier 1 — every day (school worksheets, forms, reading)

#### 1. Open and read a PDF
- **Click:** Open a file · **▾:** Recent files · Open from a cloud folder · Open several.
- **Job:** Open → scroll → zoom → go to a page → close.
- **Needs:** opens in under 2 s; page number box; zoom −/+ and Fit width; Pages panel; remembers the last page.
- **Buttons today:** Open a file, Browse files, drop zone, Recently opened, View all; reader: Page box, ‹ ›, zoom −/+,
  Fit width, Mode, side panels (Pages, Outline, Saved, Search, Comments, Tool options).
- **Needs:** S19 — the file stays open in its tab when you go Home or to another page; its tab is always visible.
- **Cancel at:** Windows picker. **Today:** opening works; getting back to an open file often doesn't (S19 Missing).

#### 2. Find in PDF (Ctrl+F)
- **Click:** Find in this file · **▾:** Search several files · Find and replace (documents).
- **Job:** Ctrl+F → type → Enter → next match → Shift+F3 previous → Esc.
- **Buttons today:** search box, Search PDF, Previous / Next match (*greyed* until a search, with reasons), Stop
  search, Continue search.
- **Needs:** on a scan with no text, say so and offer Make searchable. **Today (Oct 29, e99ef03):** works; on a page with no text it says so and offers Make scan searchable. Says "1 matches" (should be "1 match").

#### 3. Save a copy (Ctrl+S)
- **Click:** Save the PDF · **▾:** Save as Word · pictures · text · smaller · unchanged copy with a new name.
- **Job:** Save a copy → suggested name in the same folder → Save → receipt.
- **Needs:** never overwrites the original; the name never clashes; Cancel in the Windows box returns quietly; when a
  tool has unsaved work, the header button saves that work and says so.
- **Buttons today:** Save a copy (header), Save PDF copy (File tab), receipt: Continue with this copy, Show in folder,
  Keep working on the original.
- **Cancel at:** Windows save box, during save. **Today:** works; when the saved file was changed elsewhere the
  message shows twice and Continue stays offered (sent to Codex).

#### 4. Print (Ctrl+P)
- **Click:** Print · **▾:** With comments · Page range · Booklet / poster / tiles · Print-production marks.
- **Job:** Print → preview (printer, copies, range, fit) → Print → Windows print box.
- **Buttons (code):** Open Windows print dialog, Refresh preview, Stop preparation, ×; imposition and tiling options.
- **Cancel at:** print panel, preparation (Stop), Windows print box. **Today (Oct 29, ba81bca):** Pages / Scale / Copies + More options, no review tick, preview includes highlights, × works. Left: main button says "Open Windows print dialog" (say Print); Refresh preview is the same green as Print (make it plain); footer "0 blank cells. Review every side" is jargon.

#### 5. Type (Type on page / Add text)
- **Click:** click the page and type · **▾:** Text box with border · Callout · Edit existing text.
- **Job:** Type → click next to a question → type → click the next spot → type → Save a copy. Target: first letter
  within 3 clicks of opening the file.
- **Needs:** a typing box right where you click (no big side panel); small bar above it: font, size, colour, B/I/U,
  bin; drag to move, corner to resize; click later to change; Enter = new line; Esc finishes the box; Delete (when
  selected) removes it; works directly in form fields; remembers the last font and size.
- **Buttons today:** Quick edit "Type on page" opens the full Fill and sign panel (Placement kind, Signature method,
  Placement text, Add at this location *greyed*…); Build "Add text" opens a Text chooser (Click to type / Edit
  existing / Text box) **and** the Edit PDF text panel at once.
- **Cancel at:** typing (Esc), before save, Windows save box, during save. **Delete:** each text box; several at once.
- **Today:** X1, X4, X5; two panels at once.

#### 6. Highlight
- **Click:** highlight words by dragging · **▾:** Underline · Strikethrough · Highlight an area (scans).
- **Job:** Highlight → drag over words → repeat → Save a copy.
- **Needs:** colour choice in a small bar (5 colours + last used); stays on until another tool; click a highlight to
  select it; Delete removes it.
- **Buttons today (Mark up panel):** × Close markup workspace, New markup color, Reset to saved PDF, Highlighter
  opacity, Saved drawing tools (Use for next mark *greyed*, Save tool style, Delete selected tool *greyed*, Clear
  next-mark style *greyed*, Export library text copy *greyed*, Clear all saved tools), Drawing and recovery details,
  Flatten visual marks, Preview annotated copy *greyed*, Cancel operation *greyed*, Keep this tool on, Save as my
  default, Reset tool default.
- **Cancel at:** mid-drag, before save, during save. **Delete:** each highlight.
- **Today:** X1, X3; saved tools, opacity, flatten and recovery details belong under More options.

#### 7. Comment (sticky note)
- **Click:** sticky note · **▾:** Comment on selected words · Callout · Comments list.
- **Job:** Comment → click the page → type → click away → Save a copy.
- **Needs:** note opens where you clicked with the cursor in it; Esc keeps the text; empty notes vanish; click the
  icon to read/change; bin in the note.
- **Buttons today:** the Mark up panel (as Highlight). **Cancel at:** note editor, before save, during save.
- **Delete:** each note. **Today:** X1, X3; message says "Click the drawing" on ordinary pages.

#### 8. Draw
- **Click:** pen · **▾:** Line · Arrow · Rectangle · Circle · Cloud · Eraser.
- **Job:** Draw → circle or tick → Save a copy.
- **Needs:** colour and width in the small bar; eraser in the same place (today Remove ink / Erase ink are only on the
  Review tab); pen pressure; Ctrl+Z removes the last stroke.
- **Buttons today:** Mark up panel + Drawing input, ink width, ink opacity, Ink pressure.
- **Cancel at:** mid-stroke, before save, during save. **Delete:** each stroke, part of a stroke, all ink on a page.
- **Today:** X1, X3; no eraser in Quick edit.

#### 9. Sign (with Initials and Date in its ▾)
- **Click:** your signature · **▾:** Initials · Date · Digital ID signature · Ask others to sign.
- **Job:** first time: draw or type once, "Remember it" → click where it goes → drag/resize → Save a copy. Later:
  Sign → click → done. Date: click → today's date.
- **Needs:** a small signature box (Draw / Type / Picture tabs, Clear, Use) instead of the Fill and sign panel; saved
  signature used automatically; delete saved signatures in the same box.
- **Buttons today:** Fill and sign panel: Placement kind, Signature method (Type/Draw/Image/Saved), Draw signature,
  Clear drawing, Choose signature image, Saved signature, Delete selected signature, Delete all saved signatures,
  Signature save name, Save signature for reuse, Find possible places on this page, Add at this location *greyed*.
- **Cancel at:** signature box, placing, before save, during save. **Delete:** each placed signature/initials/date;
  saved signatures. **Today:** X1, X4, X5.

#### 10. Fill a form (Fill and sign)
- **Click:** go to the first empty field · **▾:** Next empty field · Clear all answers · Autofill from a profile ·
  Save answers as a file · CSV mail merge.
- **Job:** open a form → type in each field (Tab to the next) → tick boxes → Sign → Save a copy.
- **Needs:** steps in order: 1 Fill · 2 Sign / Initials / Date · 3 Save; field labels, not raw names
  ("student.name"); before saving, list empty required fields with "Go to".
- **Buttons today (55–64):** × Close fill and sign, CSV mail merge, Next blank field, Reset edits (looks greyed),
  Local autofill profiles (Reload, profile name, value label/text, Remove value, New profile, Use current supported
  values, Add reusable value, Save profile, Delete selected profile *greyed*, Allow deleting all, Delete all profiles
  *greyed*, Review suggested values *greyed*, Apply selected values *greyed*), each field, Add a visual placement
  (as Sign), Reviewed field calculations (target, calculation, inputs, order, decimals, blanks, Add rule, Review
  current results *greyed*, I checked… *greyed*, Apply reviewed values *greyed*), Reviewed keyboard tab order (page,
  order, Move earlier *greyed*, Move later, I reviewed…, Apply reviewed order, Keep original page order), Undo, Redo,
  Preview filled copy, Save form answers as a file, Cancel operation *greyed*, Compare with original, Save filled
  copy, Retry recovery.
- **Cancel at:** in a field, signature box, placing, preview, before save, save box, during save.
- **Delete:** each typed answer, each placement, saved signatures, autofill profiles and values.
- **Today:** X1, X3, X4, X5.

#### 11. Select and copy
- **Click:** select text and marks · **▾:** Hand tool · Select an area (copy as picture) · Copy page text.
- **Job:** drag over words → Ctrl+C → paste elsewhere.
- **Needs:** "Copied" message; works across lines and columns. **Today (Oct 29):** Select + Ctrl+C copies the exact line; still no "Copied" message.

#### 12. Undo / Redo (header, every tool)
- **Click:** undo / redo · **▾:** history list.
- **Needs:** works for every change in every tool. **Today (Oct 29):** after a Highlight, Ctrl+Z / Ctrl+Y and the Undo / Redo buttons all work and update
  correctly. Still greyed until a tool with history is open; the 800×620 / 150% test failure was sent to Codex.

### Tier 2 — every week (pages, documents, sharing)

**Claude review, Oct 30 (clean copy, hidden, saved files read back):**
- Finding tools: Filter tools / Find a tool now understand everyday words (split, merge, password, PDF to Word, PDF to
  JPG, PDF to Excel, header, watermark, Bates, OCR, reduce file size, black out…): 14/14 reach the right tool (c207186).
  Still: "merge" does not reach Combine PDF originals (not in the shared tool list).
- 13 Organize: page buttons in words (Rotate / Duplicate / Remove, ← →), plain recovery text (bc8ed62). Esc does not
  close it (X2, Codex). No drag-and-drop of pages.
- 14 Combine: plain words, Choose PDFs → Preview combined PDF → Save combined PDF; technical notes, page order and Bates
  folded (ce190dc). Joined 2 PDFs → 5 pages in order, originals unchanged.
- 16 Compress: plain messages; says when a PDF is already small (ef0a38f). Compress tests 5/5.
- 17 Pictures to PDF: several pictures chosen at once are all added (was first only) (c0f2b37).
- 19 Edit text: clear, Cancel works. 22 PDF to Word works but adds "Source page N" headings (page-break change
  reverted: PDF to Word currently does not open at all on 3aac269 — regression sent to Codex). PDF to pictures fine.
  PDF to Excel asks rows / columns / break % up front (hard; not changed yet).
- 20 Password: clear choices; still "Build verified PDF preview" + "Save verified PDF copy" and "Current password"
  shown for unprotected PDFs (tests depend on names; Codex).
- 23 Redact: "Your marks" (f2531d0). Esc does not close it; panels stack (X2, Codex).
- 24 Make searchable: plain explanation (0a8e86d); Cancel greyed (X1, Codex).
- 25 Page numbers: All pages by default (was current page only), plain page choices, Before/After, saved styles moved
  below (4a997fc).

#### 13. Organize pages
- **Click:** thumbnails to move, turn, delete · **▾:** Split into files · Extract pages · Keep odd/even/range ·
  Duplicate · Reorder keeping comments and links · Remove blank pages · Crop.
- **Job:** drag a page to move it → turn → × to delete → Save a copy.
- **Needs:** drag and drop first; select several pages (Shift/Ctrl) and act on all; Delete key; Undo/Redo visible.
- **Buttons today (58):** × Close page workspace, Add another PDF, Reset page list (looks greyed), Undo, Redo, Split
  into files, Page options and copy details, Preserve comments / links: reorder original, Saved page workflows (name,
  Save current workflow; code: Review & load, Delete workflow), Keep a page range (range, Keep selected pages, Odd
  pages, Even pages), Copy or drag pages from chosen PDFs (Choose source PDF, source tray, Previous / Next source pages
  *greyed*, source pages, Insert before output page, Review insertion, Cancel selection; code: Confirm arrangement
  change, Cancel staged change, Move), per page: Move, Crop / resize, Move up (*greyed* on page 1), Move down
  (*greyed* on the last page), Rotate, Duplicate, Remove. Code: Preview new copy, Compare with originals, Save pages,
  Save this copy, Cancel operation, crop editor (Apply to this page, Apply to all output pages, Reset crop and
  resize), Retry recovery, Start a fresh arrangement; Split: Read bookmark groups, Build split previews, Compare with
  originals, Save split PDFs, Cancel operation.
- **Cancel at:** mid-drag, source picker, split, before save, during save. **Delete:** each page (with Undo), added
  pages, saved workflows. **Today:** X2, X6 ("physical page", "output page", "staged change").

#### 14. Combine PDFs
- **Click:** add PDFs and join them in order · **▾:** Combine keeping comments and links · Insert pages from a file.
- **Job:** Combine → choose PDFs → drag into order → Save a copy.
- **Buttons today:** Organize "Add another PDF"; separate Combine PDF originals: Choose source PDFs, Inspect sources
  again *greyed*, Prepare combined copy *greyed*, Close, page map and continuation options *greyed*; code: Move up/down,
  Remove, Reverse current physical pages, Next/Previous page, Cancel processing, Save reviewed combined copy.
- **Needs:** one Combine button; the two current ways become its ▾. **Delete:** each file from the list.

#### 15. New document (Word-style editor)
- **Click:** blank document · **▾:** From email · From clipboard · Open a document.
- **Job:** type a title and paragraphs → Heading 1 → bold → bulleted list → picture → Save (Word) → Export PDF.
- **Needs:** cursor ready in the page; Ctrl+B/I/U/Z/Y/S/P/F; buttons show their state; pictures dragged, resized,
  deleted on the page; Tab moves between table cells; closing with changes asks once; recovery on Home ("Continue
  Untitled document" / Discard).
- **Header today:** Back to Home, Rename (double-click), Undo/Redo (*greyed* with reasons), Mode, Save, Export DOCX,
  Export PDF, Print. Tabs: File, Home, Insert, Edit, Review, Pages, View, Export; Fill & Sign, Protect, Measure
  *greyed* ("available on PDFs. Export a PDF copy first.") — add a button that does it.
- **Home today:** Paragraph style, Bold, Italic, Underline, Strikethrough, Superscript, Subscript, Highlight colour,
  Font, Size, Colour, Clear style, Align ×4, Bulleted list, Numbered list, Decrease indent (*greyed* with reason),
  Increase indent, Spacing menu, Find.
- **File today:** Version history (Close, How history is kept, Version name, Save current version, list, Copy preview
  text, Save selected file as a copy, Restore selected version), Save text copy, Export RTF copy, New blank document.
- **Other tabs (code; automatic click-through still to do):** Insert picture (Fit, Turn left/right, Apply crop, Apply
  size / description, Remove image, Cancel insertion), Insert table (Equal columns, Apply column widths, Apply fill,
  Clear fill), Link (Apply, Open, Edit, Remove), Page break, Find / replace (Replace, Replace all, Undo replacement,
  ↑ ↓, ×), Spell check (Check, Ignore once, Ignore all, Add to dictionary, Cancel), Read aloud, Statistics, Reset page
  setup, Export PDF (Preview PDF, Save PDF copy, Cancel creation, ×).
- **Cancel at:** picture picker and options, table, link box, find/replace, version history, export preview, save box,
  closing with changes. **Delete:** text, picture, table rows/columns, link, page break, versions.
- **Today:** X7 (Version history ignores Esc), X8 (only the ← arrow).

#### 16. Compress
- **Click:** balanced · **▾:** Smallest · Best quality · Compress several PDFs.
- **Job:** Compress → see size before/after → Save a copy.
- **Buttons today:** Save compressed PDF, × Close compression workspace, Compression mode, Refresh preview, Compare
  quality with original, Limits and preserved content; code: Cancel operation.
- **Cancel at:** during compression (Cancel must work), save box.

#### 17. Pictures to PDF (Image to PDF)
- **Click:** choose pictures → one PDF · **▾:** Multi-page TIFF · Edit a picture and save PNG/JPEG.
- **Job:** choose photos → drag into order → turn/crop → Save a copy.
- **Buttons (code):** Add more pictures, Apply page setup to all, Duplicate page, Remove page, ↑ ↓, Rotate left/right,
  crop, Undo, Redo, Reset, Preview PDF, Save PDF copy, Cancel operation, Export edited image, Hide source preview,
  Retry recovery, Start a fresh collection; TIFF: Preview page, Add previewed page, Inspect again, Cancel decoding,
  Review selected images and create PDF.
- **Cancel at:** picker, before save, during save. **Delete:** each picture. **Today:** only a tiny × (X8).

#### 18. Scan to PDF
- **Click:** scan a page · **▾:** scan settings.
- **Job:** choose scanner → Scan page → repeat → put in order → Save a copy.
- **Buttons today:** Scanner, Refresh devices, Source, Resolution, Color, Scan page *greyed*, Review images and create
  PDF *greyed*, Discard captured pages *greyed*, Details, Device access; code: Cancel capture.
- **Needs:** "No scanner found" with what to do; Cancel that closes. **Delete:** each scanned page.
- **Today:** X1, X8.

#### 19. Edit text (Edit PDF text and images)
- **Click:** click words on the page to change them · **▾:** Edit pictures · Add text · Add picture.
- **Job:** click a word → type the change → click away → Save a copy; click a picture → move / resize / replace.
- **Needs:** editing on the page, not in a side list; keeps the font as close as possible and says when it can't;
  each change listed with "Undo this change".
- **Buttons today:** Text chooser (Click to type / Edit existing / Text box), × Close PDF content editor, Add text,
  Add image, Document properties (title, author, subject, keywords, creator, Revert property changes *greyed* — move
  to File), the page's text lines, How editing works, Build PDF preview *greyed*. Code: Duplicate, Remove addition,
  Revert this text change, Discard additions, Undo, Redo, Compare with original, Cancel operation, Save edited PDF,
  Retry recovery, Choose replacement image, Restore original image.
- **Cancel at:** typing, preview, before save, save box. **Delete:** each addition; each change (Revert); each
  replaced image (Restore). **Today:** two panels at once; X2.

#### 20. Password (Protect or unlock)
- **Click:** password to open · **▾:** Limit printing/copying/editing · Remove password.
- **Job:** type and confirm a password → Save a copy. Unlock: type the password → Save a copy.
- **Buttons today:** × Close password workspace, Passwords and permissions, Password action, Existing owner password,
  Password to open / Limit printing… / Both, New opening password, Confirm opening password, Details and limits,
  Build verified PDF preview, Save verified PDF copy *greyed*; code: Cancel operation, Compare with original, Open
  saved unprotected copy.
- **Needs:** show/hide eye; "a lost password can't be recovered"; preview automatic or named "Check".
- **Cancel at:** typing, before save, during save, save box.

#### 21. Stamp
- **Click:** stamp mark (Approved, Draft, Confidential…) · **▾:** Custom text · Picture · Date stamp · Page numbers ·
  Header & footer · Watermark.
- **Job:** Stamp → choose → click the page → move / resize → Save a copy.
- **Today:** the Review-tab Stamp opens Page numbers and stamps; owner decided it must place a stamp mark (R5).
- **Delete:** each stamp.

#### 22. Export (PDF to pictures, Word, text, table)
- **Click:** pages as pictures · **▾:** Word · Text · Table to Excel / CSV.
- **Pictures today:** builds a preview straight away (settings locked meanwhile; **Cancel works** — the pattern to
  copy): × Close, Details, Pages, Format, Resolution, Transparent paper, Include comments, Include view rotation,
  Build image previews, Cancel, Save image copies.
- **Table today:** Close, Page, Load page, Load correction draft, Rows, Columns, Row/Column breaks %, Left/Top/Width/
  Height %, Read selectable words, Recognize selected scan, Suggest rows and columns *greyed*, Rebuild table *greyed*;
  code: merge/split cells, Save reviewed CSV/XLSX, Save correction draft, Cancel XLSX preparation, Cancel processing.
- **Needs:** drag a box round the table (X10). **Delete:** table rows/columns before saving.

#### 23. Redact
- **Click:** mark words or areas to hide, then save a clean copy · **▾:** Find and redact a word everywhere · Remove
  hidden information only.
- **Job:** Find and mark this text (or draw a box) → check → Save redacted copy (tick "I checked").
- **Buttons today:** Save redacted copy (header), × Close, How the clean copy works, Redaction resolution, Clean hidden
  information without regions, Original with pending marks, Verified redacted preview *greyed*, Compare pages
  *greyed*, Draw a box, Select text, Add a box, Show text under marks, Text to mark, Find and mark this text, Precise
  position (left/top/width/height %, Apply position), Remove selected region *greyed*, Build clean copy to review
  *greyed (reason given)*, I checked all redacted pages, Save redacted PDF *greyed*; code: Undo, Redo, Discard local
  region edits, Cancel operation, Retry recovery.
- **Needs:** one warning that every page becomes a picture; marks clickable and deletable on the page.
- **Cancel at:** marking, before the clean copy, during it, save box. **Delete:** each mark; all marks.
- **Today:** X2, X3, X10.

#### 24. Make searchable (OCR)
- **Click:** recognise text on scanned pages · **▾:** Check unsure words · Export recognised text.
- **Job:** Start → progress → Next uncertain line → Save a copy → Find now works.
- **Buttons today:** × Close OCR workspace, OCR language, Start local OCR, Cancel operation *greyed*; code: Next
  uncertain line, Preview searchable copy, Compare with original, Export reviewed text, Export OCR line inventory
  CSV, Edit reviewed text in a document, Save searchable copy.
- **Cancel at:** before start, during OCR, checking, save box. **Today:** X1, X6.

#### 25. Page numbers & headers
- **Click:** page numbers · **▾:** Header & footer · Watermark · Bates numbering · Bates across several PDFs · Saved
  styles.
- **Job:** Page numbers → position → see it on the page → Save a copy.
- **Buttons today (27):** saved templates (5 buttons, all *greyed*), Pages, font, inset, Page numbers / Bates, Number
  format, Size, Color, Opacity, Position, Numbering mode, Sequence starts at, Header, Footer, Text watermark,
  Reusable text stamp, details, Refresh preview *greyed*, Cancel, Save decorated PDF copy *greyed*, Close.
- **Needs:** live preview while changing settings. **Delete:** each decoration; saved styles.

#### 26. View tools
- **Fit page** ▾ Fit width · Actual size · Zoom to region. **Rotate view** ▾ Turn left · Reset (and show "View
  rotated" with a Reset button — today it silently stays on). **Hand tool.** **Previous / Next view** (*greyed* with
  reasons until you move) ▾ Return to previous view. **Pages panel** ▾ Bookmarks · Saved pages · Go to sheet label.
  **Reading view** ▾ Selection mode. **Show PDF only** (Esc exits). **Comments on page** ▾ Show/hide comments ·
  Include comments in print.
- **Read aloud** ▾ Read from here · Voice and speed (code: Prepare text, Play, Pause, Resume, Stop, Continue reading,
  Refresh voices) — hand check (sound).
- **Word count** ▾ Copy page text (Close, scope, Refresh). **Spelling** ▾ Personal dictionary (Close, scope, language,
  Check text, Reset ignored words, Save dictionary, Clear this language; code: Ignore once, Ignore all, Add to
  dictionary).
- **Each:** one click, Esc/× closes, no panel left behind (X2).

#### 27. Comments list and transfer
- **Comments list** (was Review drawing comments) ▾ Filter · Reply · Mark done · Saved filters. Today (27): Mark up a
  PDF, Export annotation summary, New comment, Collapse, Inspect pages, Inspect source comments, Review TXT/CSV/JSON
  export, Review XFDF export, Review XFDF import, Filter, Search, Author, Page, Type, State, Sort, Saved filter, Name,
  Apply *greyed*, Save as new filter, Delete saved filter *greyed*, each comment, Previous/Next 100 *greyed*, Return to
  previous drawing view. **Needs:** click a comment → page jumps there; reply; delete.
- **Export comments** (was Export annotation summary) ▾ as FDF · XFDF · TXT/CSV/JSON. Today: pages, Build summary,
  Save text copy *greyed*, Close.
- **Import comments** (was Import FDF comments) ▾ from XFDF · load a review draft. Today: Choose FDF comments,
  Prepare… *greyed*, Close.
- **Delete:** each comment; saved filters.

### Tier 3 — sometimes

#### 28. Bookmarks (Edit the PDF outline)
- **Click:** edit bookmarks · **▾:** Suggest from headings.
- **Buttons today:** first/last page, Find heading proposals, Add selected to outline *greyed*, Add top-level section,
  Build bookmark preview, Close, Save PDF copy *greyed*; code: Add child, Indent, Outdent, ↑ ↓, Remove branch, Undo,
  Redo, Cancel processing. **Delete:** each bookmark.

#### 29. Ask others to sign (Prepare signing request)
- **Click:** mark where others sign · **▾:** Save email draft.
- **Buttons today:** Recipient name, email, subject, message, Physical page, Location kind, Left/Top/Width/Height %,
  Add location, Show placement page, I understand…, Build prepared PDF preview *greyed*, Save prepared PDF copy
  *greyed*, Save email draft (.eml) *greyed*, Close; code: Edit, Remove, Cancel location edit, Next, Previous, Cancel
  preparation.
- **Needs:** click the page to place (X10). **Delete:** each location.

#### 30. Create form fields
- **Click:** detect fields automatically · **▾:** Add a field by drawing · Field calculations · Keyboard order ·
  Detect on scans.
- **Buttons today (47):** × Close field builder, Details and limits, Remove all new fields, Delete saved recipe, a
  repeated "Preview options" list of ~25 View tools (X11), Detect fields and suggest labels, First / Last page,
  Analyze scanned artwork, Scan language *greyed*, Detect displayed page, Detect page range, Type, Unique field name,
  Label, Required, Read-only, Text size, Left, Bottom, Width, Height, Add reviewed field, Preview fillable copy
  *greyed*, Cancel creation *greyed*; code: Undo, Redo, Remove field / group, Remove button, Stop detection, Select
  all suggestions, Clear selection, Add selected reviewed fields, Retry saving recipe.
- **Needs:** draw fields on the page (X10). **Delete:** each field; all new fields; saved recipe.
- **Today:** X1, X3, X6, X10, X11.

#### 31. Remove blank pages (Review possible blank pages)
- **Buttons today:** × Close, Original physical pages, Tolerance, Find proposals, Cancel scan *greyed*, Return
  individually reviewed selection *greyed*; code: Inspect actual full page. **Today:** X1, X6.

#### 32. Search files (Search selected files)
- **Click:** search several PDFs and documents · **▾:** Search a folder.
- **Buttons today:** Choose files, Choose PDF folder, Search, Stop *greyed*, Next/Previous results, Clear search and
  forget files, ×. **Today:** X1, X8.

#### 33. Compare revisions
- **Click:** side by side · **▾:** Overlay · Match pages.
- **Today:** opens the Windows picker straight away ("Choose a PDF to compare") — say first what it does. Then: +, −,
  Fit page, ‹ ›, Unlock, Check all page pairs, Cancel check, Cancel; matching: Suggest page matches, Review pair, Use
  reviewed matches, Restore page-plan matches, Cancel matching, Next/Previous rows.

#### 34. Spreadsheet and Slides (Edit a workbook / Edit slide text)
- **Spreadsheet** ▾ Export sheet CSV: Apply value, Cancel input, Find next, Go, Next/Previous rows and columns, Undo,
  Redo, Revert cell, Retry recovery, Save XLSX copy.
- **Slides** ▾ Export text as Word / PDF: Apply text, Cancel input, Find next, Hide slides, Next, Previous, Undo,
  Redo, Revert run, Retry recovery, Save PPTX copy, Text DOCX, Text PDF, Text copy.

#### 35. Clean hidden data and check the file
- **Clean hidden data** (was Clean PDF data): 5 tick boxes with counts, Build cleanup preview *greyed*, Save cleaned
  PDF copy *greyed*, Close — greyed with no reason (X3).
- **Check the file** ▾ Security report · Certificate signatures · Verify fingerprint · Repair a damaged PDF.
  Health report: Previous/Next *greyed*, Refresh, Check all page sizes, Run document health report, Save details as
  JSON, Close. Security report: Save report as text, Close. Certificate signatures: Close. Repair: Close, Inspect
  original *greyed*, Build reviewed repair preview *greyed*, Cancel operation, Technical check details, I reviewed…
  *greyed*, Save verified repair copy *greyed* — nothing can be started (hand check).
- **Verify fingerprint:** Choose file and calculate, Cancel calculation *greyed*, Compare, Clear, Export / Import
  receipt, ×.

#### 36. Digital ID signature (Sign with a Windows certificate)
- **Buttons today:** certificate list, Reason, Location, I reviewed…, Refresh certificates, Sign this PDF *greyed, no
  reason*, Close; code: Preview exact signed artwork, Save signed PDF copy, Cancel operation.
- **Needs:** "No Digital ID found" with what to do. **Cancel at:** PIN prompt, signing, save box.

#### 37. Document properties, file details, version history
- File tab: Document properties ▾ File details · Security report. File details: Refresh, Check all page sizes, Run
  document health report, Save details as JSON, Close.

#### 37b. Links
- **Click:** link selected text or an area · **▾:** Review page links · Remove all links.
- **Buttons today:** Links on page N (filter, Close); code: Open link, Edit, Remove, Apply link, Show link.
- **Needs:** click a link to test it, change where it goes, remove it. **Delete:** each link.

#### 38. Create from email or clipboard
- Choose a saved email, Clipboard text / screenshot, Paste clipboard now, Move up/down, Remove, Create editable
  document, Cancel preparation, Close. **Today:** X8.

#### 39. Several PDFs at once (Batch copy/rename/export text, Bates across PDFs, Compress several)
- Choose PDFs, New folder name, Choose output parent, settings, Process next PDF *greyed*, Stop processing *greyed*,
  Save queue report *greyed*, Skip, Retry, Move up, Save copy and continue, Discard preview and skip, ×.
- **Today:** X1, X8 (tiny ×).

#### 40. Attachments, layers, cloud files
- **Attachments** (was Review embedded files): Save selected embedded file *greyed*, Close.
- **Layers:** × Close PDF layers, Restore document defaults *greyed*, Cancel layer changes *greyed* (X1).
- **Cloud file** (Open a synchronized file): Choose a file, Open this file, ×.

### Tier 4 — drawings and specialist (labelled advanced, R20)

#### 41. Measure and takeoffs
- **Click:** set scale, then measure · **▾:** Area · Perimeter · Count · Angle · Takeoff list.
- **Buttons today (21):** × Close drawing measurements, tool, units, Clear points *greyed*, Finish measurement
  *greyed*, Recalibrate, Known reference length, I checked…, Confirm scale *greyed*, Takeoff list, entry name, group,
  I checked…, Add finished measurement *greyed*, Undo ledger change *greyed*, Review/save JSON ledger, Review/save CSV
  *greyed*, Load ledger, Save takeoffs into PDF copy *greyed*, Recover takeoffs, How measurements work.
- **Delete:** each point, measurement and list entry.

#### 42. Sheet sets and sheet revisions
- **Sheet sets (82 controls):** source, page, Choose another PDF source, Add this sheet, Add all pages, Close, Previous
  sheet *greyed*, Next sheet, per sheet: title, revision, Move up/down, Review revision replacement, Remove from set;
  plus a repeated list of ~40 other tools (X11). Code: Save named set, Delete saved set, Undo, Redo, Confirm
  replacement, Keep existing reference.
- **Replace sheets** (sheet revision): Choose replacement PDF, Add explicit sheet mapping, Remove mapping, Prepare
  reviewed revision copy, Cancel processing, Close sheet revision, save.

#### 43. Map coordinates and distances
- page, viewport, mode, Go to page, x/y *greyed*, Add page coordinate *greyed*, Undo point, latitude, longitude,
  Calculate *greyed*, Close.

#### 44. Thin lines
- threshold, Inspect strokes, minimum, Prepare selected repairs *greyed*, Close, Previous/Next 100 *greyed*.

#### 45. Crop and page boxes
- Crop / resize (from Organize). Page boxes (advanced): limits, page, units, Box to edit, pages, Left/Bottom/Right/Top,
  Inspect original again, Queue box on selected pages, Queue inherited/default reset, Clear queued edits, Prepare
  preserving copy *greyed*, Close. **Needs:** drag the box on the page (X10).

#### 46. Print production (marks and preflight)
- **Marks:** pages, units, bleed ×4, offset, width, colour, crop/bleed/registration, I understand…, Details, Build
  preview *greyed*, Save *greyed*, Close. **Preflight:** profile, Inspect, Save inspection report, Close, filters,
  Previous/Next *greyed*.

#### 47. Portfolio
- search, layout, Choose files to include, Add selected source *greyed*, view, Build portfolio copy, Close; code:
  Remove, ↑ ↓, Preview embedded PDF, Review file for extraction, View metadata, Cancel processing, Save reviewed copy.

#### 48. Editable PDF workflow
- 29 controls: workflow name, saved workflows (Save, Load *greyed*, Delete *greyed*, Recover draft *greyed*, Clear
  recovery draft *greyed*), Add page reorder *greyed*, Add Bates numbering *greyed*, Move up *greyed*, Move down,
  Remove, page order and numbering fields, Build workflow preview, Close. **Owner:** keep as advanced or hide.

#### 49. Accessibility
- **Accessibility check** (audit, 20 controls): findings list, filters, Previous/Next findings *greyed*, Rerun source
  audit, Open tag workspace, Save audit evidence, Close. **Tag tree:** RoleMap/ParentTree, Structure tree root, page,
  Only tags on this page, Build reviewed tag copy *greyed*, Close.

#### 50. Watched folders, PDF printer, right-click tools, Ask about files
- **Watched folders:** Choose source and output folders, Approve folder workflow, Discard proposal, Skip this job,
  Refresh status, Save receipts as JSON, Next/Previous receipts, ×.
- **Print to PDF from other apps** (Virtual PDF printer): explanation page.
- **Right-click tools:** Add / Remove right-click tools, Refresh, Dismiss selected requests, × — **agents never press
  Add (owner rule); check only that it explains itself.**
- **Ask about files** (local AI): Ollama / LM Studio, connection name, type, URL, model, Save connection, Remove
  connection, question, pasted excerpt, Choose saved source context, Add pasted excerpt, Clear context, Review request
  (*greyed*, no reason — say "Add a connection first"), Cancel request, Clear transfer history. X7.

### Around the tools — Home, sidebar and Settings
- **Home:** Open a file, New document, Browse files, drop zone, Continue / Discard unsaved documents, Quick actions
  (New document, Fill and sign, Organize pages, Scan to PDF, Image to PDF, Compare drawing revisions, Search selected
  files, All tools), Recently opened, View all. Cards needing a file open the picker with a title saying what to
  pick.
- **Sidebar:** Home, Files, Favorites, All tools, Ask about files, Format support, Settings & privacy, Collapse
  sidebar. Header: Find an opened file (Ctrl+K), Find a tool (Esc closes; greyed actions need hover reasons), Focus
  mode, Fullscreen.
- **Settings (17):** More about this, Save a problem report, Recent-file previews, Reset all marking defaults,
  Document spacing, Interface text size, Stronger interface contrast, Restore standard interface, Refresh estimate,
  Review form-recipe cleanup, Refresh sandbox status, Clear recent-file list, Manage recovery data. Anything that
  deletes asks first. X7.
- **Panels inside other tools** (tested with their parent): CSV mail merge, autofill, field calculations, tab order,
  field detection (Fill / Create form fields) · crop editor, page tray, split (Organize) · saved drawing tools (Draw) ·
  decoration templates (Page numbers) · takeoff ledger and recovery (Measure) · comment review edits, XFDF (Comments
  list) · sheet revision (Sheet sets) · OCR unsure-line review · print preview, imposition, tiling (Print) · version
  history (documents) · recovery drafts (Home).

## Part 4b. Pop-up "subpages" → onto the main editing page (owner, October 30)

Owner: "99 percent should be on the main page of editing." Rule: a tool that works on the open PDF opens in the side
panel beside the page; the page itself is the preview; one Save that checks by itself; advanced under More options;
× and Esc close it without closing the PDF. Code search (`showModal()` in src) found about 80 windows. Status on
main at 62bb925 plus branch `claude/form-fields-on-page` (lands in the first update after Beta 1).

**Already on the main page (9):** Fill and sign / Type / Sign, Mark up (Highlight, Comment, Draw), Edit text and
images, Organize pages, Compress, Redact, Extract a table, Comments list, PDF Home typing.

**Move onto the main page, most used first** (each: Claude converts and tests unless noted):
1. Print (Prepare and review printing) — Codex reworked it Oct 29; agree with Codex first.
2. Combine PDFs (keep comments and links) — pdf-combine-workspace.js.
3. Create fillable fields — **done on branch** (1516277): fields drawn on the real page, panel beside it.
4. Password (Protect or unlock) — password-workspace.js.
5. Page numbers, headers, watermark, stamps, Bates — pdf-decoration-workspace.js.
6. PDF to pictures — pdf-image-export.js.
7. Make searchable (OCR) — ocr-workspace.js.
8. Split into separate PDFs — split-workspace.js.
9. Crop and resize page — page-geometry-editor.js (opens over Organize pages).
10. Bookmarks (Edit the document outline) — pdf-bookmark-workspace.js.
11. Review possible blank pages — scan-blank-review.js.
12. Ask others to sign (Prepare signature request) — signature-request-workspace.js.
13. Compare PDFs — pdf-comparison.js (needs two PDFs side by side; may stay a full view).
14. Clean up PDF, Security report, Repair, File details, Attachments, Links — pdf-sanitize / pdf-security-report /
    pdf-repair / pdf-file-details / pdf-attachments / pdf-link-review.
15. Drawing tools (Tier 4): reorder keeping comments, replace sheets, thin lines, takeoffs, page boxes, print marks,
    geospatial, portfolio, accessibility tags/audit, preflight, certificate signing, FDF/XFDF import/export.

**Fine as small windows (not subpages):** yes/no questions (unsaved work, clear recent files), "This PDF needs a
password", Find a tool, editing one takeoff entry, Settings (privacy, version history).

**Not editing one PDF (own page in the app, not the editor):** Search files, Watched folders, Batch tools (Bates
across PDFs, Compress several, Batch copies), Create from email/clipboard, Open a synchronized file, Virtual printer,
Windows right-click tools, Scan to PDF, CSV mail merge, AI questions.

## Part 5. Codex first — the biggest wins

0. File safety (Part 0): **S19 open files stay open with always-visible tabs (Home tab + one tab per file; going Home never closes a file)**; every tool asks before leaving with unsaved work (S7), warns before changing a signed PDF
   (S15); Claude proves S5, S6, S8, S11, S12 and S14 in the same order and fixes saving/recovery problems directly.

1. X1: Cancel never greyed (one shared rule for every tool panel).
2. X2: opening a tool closes the previous tool's panel.
3. R5 split buttons, starting with Tier 1: Type, Highlight, Draw, Comment, Sign, Stamp, Save a copy, Print.
4. X4 + X5: Type / Sign / Date / Fill form get small on-page controls; Fill and sign in order (fill → sign → save).
5. X9: one name per job.
6. X3: every greyed button gets a reason. X7 + X8: Esc and a visible ×/Close everywhere.
7. X10 + X11: draw on the page instead of typing numbers; remove repeated tool lists from panels.

Claude tests in Part 4's order, 3–4 tools per batch, and sends each batch's findings the same day.

## Part 6. Today's tool names → plan entry

Every tool name in the app today (Build ribbons, Quick edit, Find a tool, All tools, src/tool-registry.js) that is
not already written above, with the Part 4 entry that covers it. A name-check script compares this file with the code
so no tool is left out.

| Name in the app today | Plan entry |
|---|---|
| Mark up a PDF | 6–8 Highlight / Comment / Draw |
| Notes and stamps | 7 Comment, 21 Stamp |
| Bates numbering across PDFs | 25 Page numbers & headers ▾, 39 Several PDFs |
| Edit PDF page boxes | 45 Crop and page boxes |
| Protect or unlock a PDF | 20 Password |
| Redact a PDF | 23 Redact |
| Redact PDF | 23 Redact |
| Verify PDF fingerprint | 35 Check the file |
| Drawing takeoffs | 41 Measure |
| Measure drawing and takeoffs | 41 Measure |
| PDF to images | 22 Export |
| Export PDF pages as PNG/JPEG | 22 Export |
| Compress a PDF | 16 Compress |
| Compress PDF | 16 Compress |
| Extract a table | 22 Export (Table) |
| Batch copy, rename or export text | 39 Several PDFs |
| Inspect and repair thin lines | 44 Thin lines |
| Watched-folder workflows | 50 |
| Windows right-click PDF tools | 50 (never install) |
| Review page links | 37b Links |
| Review PDF page links | 37b Links |
| Export FDF comments | 27 Export comments |
| Export drawing comments as FDF | 27 Export comments |
| Import drawing comments from FDF | 27 Import comments |
| Print preflight | 46 Print production |
| Inspect print preflight | 46 |
| PDF portfolio | 47 Portfolio |
| Review PDF portfolio | 47 |
| Repair PDF to a copy | 35 Check the file |
| Repair PDF to a reviewed copy | 35 |
| Show PDF only in fullscreen | 26 View (Show PDF only) |
| PDF artwork fullscreen | 26 View (Show PDF only) |
| Search panel | 2 Find, 26 View |
| Review spelling | 26 View (Spelling) |
| Review PDF spelling | 26 |
| Check document spelling | 15 New document (Review) |
| Accessibility tag tree | 49 Accessibility |
| Accessibility audit | 49 |
| Inspect accessibility findings | 49 |
| Review PDF tags and reading order | 49 |
| Open All tools | Home and sidebar |
| Format support and limits | Home and sidebar |
| Collapse or expand sidebar | Home and sidebar |
| Toggle focus mode | Header |
| Toggle fullscreen | Header |
| PDF security report | 35 Check the file |
| Inspect certificate signatures | 35 |
| Read PDF aloud | 26 View (Read aloud) |
| Read document aloud | 15 New document (Review) |
| PDF word count | 26 View (Word count) |
| Combine selected PDF originals | 14 Combine PDFs |
| Edit and run a PDF workflow | 48 Workflow |
| Add print-production marks | 46 |
| Name and save unchanged PDF copy | 3 Save a copy ▾ / 22 Export |
| Map geographic coordinates and distances | 43 |
| Sign PDF with a Windows certificate | 36 Digital ID signature |
| Show PDF layers | 40 Layers |
| Review possible blank scan pages | 31 Remove blank pages |
| Review embedded PDF files | 40 Attachments |
| PDF file details | 37 |
| PDF document health report | 35 |
| Go to PDF sheet label | 26 View (Pages panel ▾) |
| Manage drawing sheet sets | 42 |
| Compare PDF drawings | 33 Compare |
| Review drawing comments and replies | 27 Comments list |
| Edit PDF document outline | 28 Bookmarks |
| Add PDF page numbers, Bates, watermarks and stamps | 25 |
| Next PDF page | 1 Open and read |
| Previous PDF page | 1 |
| Zoom PDF to region | 26 View |
| Previous PDF view | 26 |
| Next PDF view | 26 |
| Fit PDF page | 26 |
| Fit PDF width | 26 |
| Rotate PDF view | 26 |
| Copy PDF page text | 11 Select and copy |
| Print PDF | 4 Print |
| Save PDF page bookmark | 26 View (Saved pages) |
| Organize PDF pages | 13 |
| Edit PDF text, images and properties | 19 Edit text |
| Fill and sign PDF | 10 Fill a form |
| Create fillable PDF fields | 30 Create form fields |
| Save presentation copy | 34 Slides |
| Export presentation text DOCX | 34 |
| Export presentation text PDF | 34 |
| Find presentation text | 34 |
| Save workbook copy | 34 Spreadsheet |
| Export current sheet CSV | 34 |
| Find workbook cell text | 34 |
| Preview Markdown or CSV table | 15 New document ▾ Open a document |
| Show source and preview | 15 |
| Find and replace document text | 15 |
| Save text/source copy | 15 |
| Export document PDF | 15 |
| Export DOCX copy | 15 |
| Insert document page break | 15 |
| Undo document edit | 12 Undo / Redo |
| Redo document edit | 12 |
| Rotate image left | 17 Pictures to PDF |
| Rotate image right | 17 |
| Preview image collection PDF | 17 |
| Export edited PNG/JPEG | 17 |
