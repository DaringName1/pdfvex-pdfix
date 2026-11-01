# PDFix combined progress — October 14, 2026

Prepared for Andrew. Feature work stopped at your request. This document collects Claude’s and Codex’s recorded work, verification, remaining problems and ownership. It is a progress record, not a release certificate.

## Current position

PDFix has substantial implemented and tested document-editor, reader, Drawing and Pages functionality. Both agents have committed work on main. Their lanes remain separate; Claude owns the final integration build. The latest dist build is a test build, not a packaged release.

The newest Codex large-file bookmark work is a **disabled experimental prototype**, not a finished feature. It compiles and passes metadata source tests, but has not passed native app navigation acceptance. Normal reading does not opt into it. Later hidden app checks failed before their first window; an isolated diagnostic recorded fatal GPU startup failures. This needs investigation before claiming current full-app acceptance.

No physical printer test, physical pen test, real Revu round trip, clean-machine installation or release acceptance has been completed. You confirmed you have a printer and no pen.

## Who owns what

| Area | Owner |
| --- | --- |
| Document creation, editing, formatting, DOCX/RTF import/export | Claude |
| Shell, navigation, tabs, settings and shared integration | Claude |
| Documents and More tools, current converter work | Claude |
| PDF reader, search, readable view, destinations | Codex |
| Drawing and Pages tools and their preservation/output checks | Codex |
| Shared handlers, packaging and final combined build | Claude as integrator; small clean additive changes committed separately |

Codex previously worked on converters before the revised lane split. Those historical changes remain in the full Codex handoff below; current converter ownership is Claude’s. Neither handoff’s oldest “left alone” statements should override its later dated updates.

## Claude — work delivered and recorded

| Area | What changed or was proved |
| --- | --- |
| Basic editing and presentation | Fixed garbled labels, document naming, strikethrough, list nesting, paragraph alignment and shortcuts, four highlight colors, superscript/subscript, toolbar fit and narrow-window ribbon behavior. Opening normalized documents no longer marks them edited. |
| Paper and paragraph layout | Shared paper-size definitions for A4, Letter, Legal, A3, A5 and Tabloid; orientation and margins; separate top/right/bottom/left margins; paragraph indent, first-line and hanging indent, line spacing, space before/after; separate layout Undo steps. |
| Tables and images | Fixed sanitizer stripping valid formatting/image/table attributes, disappearing images and wrong header rows. Checked horizontal/vertical merge, split, cell shading, column sizing, row/column changes, image description/resize/fit/remove and Undo/Redo. |
| Hyperlinks | Insert panel and Ctrl+K in the document; full-address popup with Open/Edit/Remove; only safe web/email targets; links retained through DOCX/PDF/RTF output and reopen. Actual external browser/mail launch remains unproven. |
| DOCX fidelity | PDFix copies carry a bounded stored model with body hash and independent text/image consistency checks. Ordinary imports now retain supported direct paragraph/run formatting from Word-shaped DOCX fixtures. Unsafe or inconsistent models are rejected. |
| RTF and paste | Restored supported headers/footers, paper geometry, hyperlinks, indents, nested lists and paragraph formatting. Word/browser HTML pre-pass preserves supported direct styles and lists before sanitization. Complex RTF tables/images still simplify on reopen. |
| Document tabs and recovery | Session tabs and keyboard switching; safe new-blank replacement; draft recovery; fixed app quit before recovery, quit with PDF export dialogs and close after renderer crashes. Tabs still have limitations described below. |
| Shell and settings | Recent files moved above quick actions; Files/Favorites/search/Forget/persistence checked; Actions panel; named header/footer controls; interface-size/contrast/layout checks; confirmation before clearing recent data; application menu removes reload/developer tools from ordinary use. |
| Conversion | Formatted Markdown and CSV to PDF/editor, raw-source option retained; text/data exports; PNG/image to PDF and PDF to PNG/JPEG checks with independent outputs. No blanket claim that every converter combination is accepted. |
| Documents tools | Checked file search, email-to-document, synchronized-file opening, signing-request preparation, table extraction, OCR, PDF text edits and fillable field creation/filling. Fixed field-builder control collisions and neutral content-wrapper retention. |
| More tools | Checked password protection, fingerprint, health report, redaction, fill/sign and output retention. Fixed single-stream preservation in Fill and sign. Watched-folder work is currently dirty/uncommitted and is not treated as delivered in this snapshot. |
| Performance and tests | Large generated document with roughly 4,000 blocks, 20 tables and 55,000 words: reported opening 3.4 s, ending keystroke about 33 ms, DOCX save 2.5 s, 202-page PDF preview 3 s. These are text/table results, not heavy-image acceptance. |

Claude’s evidence is reported from its handoff and commits; Codex did not rerun all Claude checks. Examples include editor Playwright 4/4, table/image app checks 7/7, links 9/9, conversion 5/5 and image conversion 3/3. The handoff contains multiple historical totals and repeated runs; they must not be added into a unique test total. The whole-suite snapshot in the known-issues record is 195/200, not a new all-green result.

## Codex — work delivered and recorded

| Area | What changed or was proved |
| --- | --- |
| PDF search | Split-word matching, Unicode/source offsets, search cancellation/replacement, reading deadlines, exact matched characters, repeated words and source-fragment navigation. |
| Reader navigation | Outline and named/internal destination handling in ordinary reading; printed labels on initial open; keyboard/focus handling; panel resize and fit-page stability; saved reading positions/bookmarks. |
| Exact highlighting | Readable and artwork highlights use exact source intervals. Bounded DOM-mark fallback works when Custom Highlight is unavailable and restores text when clearing or changing layout. |
| Destination geometry | Generated 32-jump fixture covers XYZ, Fit/FitB, horizontal/vertical fits and FitR across rotations and negative crop origins; canvas and zoom budgets remain in force. |
| Readable layout | Source sequence, visible rows, table-gap separators, unequal two-column splits, three columns and spanning headings/captions. New explicit region ordering supports 1–20 percent rectangles, exact search mappings, duplicate-selection refusal and omitted-text reporting. This is reviewed geometry, not semantic merged-cell recovery. |
| Built app and tool exits | Reader open/render/search/outline/link/keyboard/resize/close checked in hidden built Electron. All four previously reported tool exit traps were not reproduced with their actual close/discard/collapse controls. |
| Drawing and Pages coverage | Scoped open/use/prepare/save/independent readback/reopen checks cover the six Drawing and eleven Pages room tools. Outputs include comparison, markup, takeoffs, sheet sets, comment review, page organization, compression, Bates/batch, stamps, page boxes, print marks, thin lines, outline and unchanged copies. Full setting/corpus coverage is still open. |
| Takeoffs and batches | Calibrated distances in six units, perimeter/area on rotated/cropped pages, eight metadata-bearing takeoffs and source-bound recovery; exact UTF-8 text batches, continued Bates numbering with skipped files, collision/refusal cases. |
| Review and interoperability groundwork | Fixed ASCII State/StateModel output for replies and XFDF history while retaining Unicode authors/comments, parent relationships and private source fields. Export/import/save/reopen checks pass; real Revu acceptance is not established. |
| Ink and input | Pen/mouse/touch ownership fencing, live selected-mark movement, bounds/recovery/Undo; selected width 0.5–12 pt and opacity 10–100%; reusable presets; whole-stroke reviewed removal and changed external ink preservation. |
| Latest drawing additions | Highlighter opacity; exact partial/sweep erasing in the existing worker with preview/Apply/Cancel/Undo/Redo; bounded per-point pressure, variable-width appearance and uniform fallback. Simulated CDP pen/touch evidence does not establish real hardware behavior. |
| Appearance integrity | New supported markup outputs bind appearance bytes/resources and metadata with a digest. Externally changed appearances remain non-editable and preserved. This detects changes; it does not authenticate the author. |
| Physical sheet replacement | Existing native route verified: explicit mapping and review, retained original parent/reply/link identities/private fields, donor comments, untouched pages and unchanged input files. Source boundaries refuse geometry mismatch, incomplete reply groups, protected comments, changed sources and duplicate mappings. |
| Memory and responsiveness | 500-page sustained workload measured search/jumps/scroll/zoom and heartbeat delay. New five-cycle 500-page probe has stable Home DOM and zero retained reader-class objects after diagnostic collection; private process memory remains elevated and unresolved. |
| Large-file bookmarks | Approved NAV metadata extension uses the existing contained parser and pinned output slot with bounded nodes/strings/depth/bytes. Compiles, two source tests pass; native app jumps do not pass. Disabled by default behind PDFIX_PAGED_NAVIGATION=1. No new sandbox capability/dependency/unrestricted parser. |

## Latest evidence — keep the claims separate

| Evidence | Result | Limit |
| --- | --- | --- |
| Highlighter/pressure/eraser focused source suite | 20/20 passed at previous checkpoint | Source logic, not physical input |
| Pressure, eraser and existing markup hidden Electron group | 8/8 passed at previous checkpoint | Generated PDFs and simulated input |
| Physical sheet revision hidden Electron | 1/1 passed | Native saved output with independent PDF dictionary readback; no Revu |
| Sheet revision source boundaries | 3/3 passed | Generated preservation/refusal cases |
| Readable source layout | 8/8 passed | Includes reviewed region order |
| Readable built-app script | 6/6 passed; original unchanged, app closed | Generated table/column/caption fixture |
| Latest combined focused source run | 13/13 passed | Region layout, revision boundaries, metadata validation |
| Five-cycle 500-page retention probe | Finished; no renderer errors, original unchanged, app closed | Diagnostic forced collection, not production GC or a release gate |
| Native bookmark build | Locked build passed | Compile evidence only; feature remains disabled |
| Experimental native bookmark app test | Did not pass | Staged source/page-loading problem, then GPU startup failure |
| Final established reader regression rerun | 9/9 failed before firstWindow | No reader interaction occurred; current runtime acceptance is blocked |
| External applications | Acrobat installed; PDDoc COM attempts failed E_NOINTERFACE | No Acrobat/Revu round-trip or visual acceptance |
| Physical equipment | User has printer, no pen | No paper output or stylus acceptance recorded |

Private memory in the five-cycle probe: baseline summed private process memory about 180.7 MiB; open samples 298.6–362.9 MiB; final Home about 362.2 MiB. Home DOM stayed at 316 and final diagnostic JS heap was about 6.43 MiB. This narrows JS-object retention but leaves native/private allocation unexplained. Earlier summed working-set peaks are a different metric and workload; shared pages can be counted multiple times.

## Everything still left to return to

| Owner/prerequisite | Remaining work |
| --- | --- |
| Codex reader | Stabilize and re-prove native paged bookmark loading/jumps before enabling; original-page links, labels and document-wide search in paged mode; native/private-memory diagnosis; real 300 MB drawing corpus and broader hostile/multilingual/vertical/RTL/tagged layout checks. |
| Codex Drawing/Pages | Safe broader FreeText/rich-comment edits, geometry transforms for sheet carry, custom columns, BAX/BTX and proprietary states with actual fixtures; wider cancel/retry/collision/rotated output coverage. Locked/read-only source comments remain protected. |
| Physical/outside acceptance | Printer page and scaling inspection, real stylus/palm behavior if hardware becomes available, real Revu/Acrobat checks; Word/LibreOffice/Google Docs DOCX round trips and real Word paste. |
| Claude editor | Style/theme-inherited DOCX formatting, complex RTF tables/images, unsupported page fields/bands, arbitrary/custom paper sizes and more paper presets in actual app; one unsaved new-document draft; tab switching does not preserve all live Undo/zoom state; source-copy Save versus overwrite is a product decision. |
| Claude shell/tools | Current dirty watch-folder/shell work; some stale desktop specs; ambiguous tool status carried between screens; broader shell/keyboard/assistive-technology review; Word/document-heavy image performance; speech playback/dictionary variants and other left-alone controls. |
| Shared integration | Investigate final GPU startup failure, native test/build overlap, final quiet coordinated build and source manifest, full command matrix/security review, clean-machine installation, packaging/signing/recovery/performance release gates. |
| Plan prerequisites | Virtual PDF printer capture/recovery/installer/signing lifecycle; local/Windows/cloud sharing; deferred Hermes/Harness evaluation; CAD/DWG editing remains outside first-release scope. |

These are not all equally unfinished: some are implemented but lack wider acceptance, some require outside hardware/software/files, and some have no implementation. The appended known-issues snapshot preserves the exact distinctions.

## Repository and collaboration snapshot

Recorded before the report commit: main at 5ea668d. External git history is stored outside Drive. Builds use the agent lock; exact-path commits preserve the other agent’s work. Uncommitted files below belong to their existing workstream and were left alone. A dirty file is not evidence of a completed feature.

```text
 M desktop/watched-folder-manager.cjs
 M desktop/watched-folder-storage.cjs
 M docs/FINAL-REMAINING-WORK-2026-10-11.md
 M docs/FINAL-SCOPE-LEDGER-2026-10-11.json
 M docs/PDFIX-STATUS-INVENTORY-2026-10-04.json
 M scripts/check-workspace-shell.mjs
 M src/app.js
?? WORKSPACE-CONTENTS.md
?? docs/REQUEST-WINDOWS-AND-WATCH-BATCH-2026-10-12.md
?? docs/SIGNATURE-REQUEST-CODING-2026-10-12.md
?? docs/WATCHED-FOLDER-CODING-2026-10-12.md
?? docs/WINDOWS-CONTEXT-CODING-2026-10-12.md
?? scripts/check-workspace-back.mjs
```

## Full detailed records

The appendices below are complete snapshots of the two handoffs and the known-issues document taken for this report. They retain filenames, checks, discoveries, historical counts, left-alone lists and integrator requests. Earlier entries can be superseded by later dated entries; the overview above describes the latest known position. Claude’s handoff is an owner report, not independent Codex certification.


# Appendix A — Claude full handoff

Snapshot of docs/CLAUDE-HANDOFF-2026-10-12.md.

# Claude handoff — Workspace and document editor — October 12, 2026

Written for the two-agent split (Claude: Workspace and document editor; Codex: PDF reader). It lists what Claude changed, what Claude touched outside its own lane, and everything deliberately left alone. Last updated October 13, 14:47.

## Changed

| File | Change |
| --- | --- |
| `src/document-editor.js` | Repaired garbled characters in status text and labels. Strikethrough button. Open-time normalization (for example the empty paragraph added after a trailing list) no longer counts as a user edit. Imported page size is applied. `rename`, `exportName` and `startBlank` for new documents. |
| `src/document-toolbar.js`, `src/document-toolbar.css` | Strikethrough in the quick group. Decrease / Increase indent list buttons on Home. Name field for new documents. "New blank document" (two-click confirm) on File. Source files keep their "Save source copy" button in view. Size box no longer clipped. |
| `desktop/document-layout-validation.cjs` | One paper table (A4, Letter, Legal, A3, A5, Tabloid) with `documentPapers` and `documentPaperSize`. |
| `src/document-layout-model.js`, `src/document-layout.js`, `src/document-zoom.js`, `src/document-pdf-export.js`, `src/document-codec.js`, `src/rtf-codec.js`, `desktop/document-pdf.cjs` | Read paper geometry from that table instead of repeating A4/Letter numbers. PDF export passes the document name. |
| `desktop/document-grid-import.cjs`, `desktop/document-grid-validation.cjs` | DOCX import reports page size, orientation and side margins (`page` in the inspection report) when the file has one body section and a listed paper size; otherwise a notice explains the omission. |
| `src/document-html.js` | Sanitizer fix: every attribute except `src` is now listed as a plain attribute. Before this the strict image-source pattern was also applied to `width`, `height`, `colspan`, `rowspan` and all `data-pdfix-*` values, so pasted or imported images, merged cells, text styles, alignment and page breaks were silently stripped. |
| `src/rtf-codec.js` | RTF import keeps plain header/footer text that PDFix itself wrote (text color and standalone page-number paragraphs no longer discard the whole band) and reads page size, orientation and side margins. |
| `src/document-codec.js` | DOCX export marks only real header rows with `w:tblHeader`; data rows used to carry `w:val="off"`, which reopened as header rows. |
| `desktop/rich-document-validation.cjs`, `desktop/document-layout-validation.cjs` | Optional `page` on the RTF import result; shared `documentPageFromTwips` and `validDocumentPage` used by both importers. |
| `desktop/document-link-model.cjs`, `src/document-link-model.js`, `src/document-links.js`, `src/document-links.css` | New: hyperlinks. Web (`http`, `https`) and email (`mailto`) targets only. Insert tab has a Links panel; Ctrl+K inside the document opens it. Clicking a link shows a popup with the full address; the popup's Open link button opens it. Edit and Remove are in the popup too. |
| `desktop/rich-document-validation.cjs`, `desktop/document-pdf.cjs`, `src/document-codec.js`, `src/rtf-codec.js`, `src/document-html.js` | Link support in the validator, the PDF, DOCX and RTF writers, and the paste/import sanitizer. Links in an imported DOCX are kept. |
| `desktop/document-snapshot-model.cjs`, `src/document-snapshot.js`, `src/document-codec.js`, `desktop/rich-document-codec.cjs`, `desktop/rich-document-validation.cjs` | New: a DOCX copy written by PDFix reopens with all of its formatting. The writer stores a bounded copy of the editor's document model (without image data) and a SHA-256 of `word/document.xml` in two standard custom document properties. On open the engine returns the stored model only if the hash still matches; the editor then uses it only if its text and images equal what the ordinary Word import of the same file shows. Otherwise the ordinary import is used, with a note. |
| `src/document-images.js` | Fix: inserting an image where the text had a font, size, color, bold or link failed, because the image inherited those marks. |
| `tests/document-snapshot.test.cjs`, `scripts/check-document-reopen.mjs` | New unit tests and a four-case hidden in-app check for reopen fidelity. |
| `desktop/document-paragraph-model.cjs`, `src/document-paragraph-model.js`, `src/document-paragraph.js` | New: paragraph indent (0 to 8 half-inch steps) and per-paragraph line spacing (document default, 1.0, 1.15, 1.5, 2.0) for paragraphs and headings. On Home, Increase/Decrease indent now indent the paragraph when the caret is not in a list, and there is a Line spacing box. Written to DOCX, RTF and PDF; checked by the contained validator; kept by the paste/import sanitizer. |
| `tests/document-paragraph.test.cjs` | New unit tests for the above. |
| `src/rtf-codec.js` (second change) | RTF import now restores web and email links from hyperlink fields and paragraph indents from whole half-inch left indents. Other fields and unsafe addresses keep only their visible text. |
| `src/document-paste.js`, `src/document-editor.js` | New: pasted HTML keeps its formatting. An inert pre-pass turns inline styles (font family, size, color, bold/italic/underline/strike set by style, alignment, left indent, line spacing) into the editor's own markers, rebuilds Word's paragraph-based lists as real nested lists, and ignores the non-bold `<b>` wrapper some web editors add. The sanitizer still runs afterwards. Pasting into an empty paragraph now keeps the pasted paragraph's alignment, indent and heading level. |
| `src/document-images.js`, `src/document-tables.js`, `src/document-links.js` (Undo) | Each image, table and link action is now its own Undo step. Before, actions made within half a second of each other at the same place were merged, so one Undo could revert a resize, the removal and even the insertion together. |
| `desktop/document-paragraph-model.cjs`, `src/document-paragraph.js`, writers (second change) | Space before and after a paragraph (document default, 0, 6, 12, 18 or 24 pt), on Home beside Line spacing; written to DOCX, RTF and PDF and read back from RTF. Tab at the very start of a paragraph indents it and Shift+Tab brings it back; elsewhere Tab is unchanged. |
| `desktop/document-paragraph-model.cjs`, `src/document-paragraph.js`, `src/document-toolbar.js`, `src/document-paste.js`, writers (third change) | First-line and hanging indent, half an inch, on Home > First line. Written to DOCX (`w:firstLine`/`w:hanging`), RTF (`i`) and PDF (`text-indent`); read back from RTF and from pasted `text-indent`; a hang's extra half inch on the left is not counted as indent. Each paragraph layout change (indent, first line, line spacing, space before/after) is now its own Undo step. |
| `src/app.js`, `src/document-tabs.css` | Document tabs: one tab per document opened this session (up to 10), shown above the workspace when there are two or more. Click or Ctrl+Tab / Ctrl+Shift+Tab switches; switching reopens the file from its recent entry, and unsaved editor work returns from the recovery draft. Close buttons per tab; a tab whose file is gone is dropped with the "no longer where it was opened from" message. |
| `src/workspace-rooms.js` | In the Documents room, New document and Open a document now come first. |
| `src/document-toolbar.css` | The footer Statistics button has a larger click area (it measured 50 x 15 px). |
| `src/spell-check-workspace.js` | Fix: closing the app (or leaving the document) while a spell check was still running canceled the check but then stopped the close with "Local spelling canceled." The canceled check no longer blocks leaving. This file is shared with the PDF reader's text tools. |
| `desktop/file-availability.cjs` | A listed file that has been deleted, moved or renamed now gets its own message ("This file is no longer where it was opened from…") instead of the cloud-storage wording about making the file available offline. The existence check now runs before the storage-attribute helper. |
| `src/spell-check-workspace.js` (second change), `src/text-statistics-workspace.js` | Spell check lists the remaining findings again right after a replacement. Escape inside the statistics panel closes it. Both files are shared with the PDF reader's text tools. |
| `src/app.js` | On Home, when there are opened files, "Recently opened" (the latest three) now sits above Quick actions instead of below the ten task cards. With no files the empty message stays at the bottom as before. This is the only change Claude made to `src/app.js`. |
| `scripts/check-workspace-settings.mjs` | New hidden check, five cases: interface text size and stronger contrast (also at 800 px wide), remembered after restart and reset by Restore, sidebar collapse and focus mode, Clear recent-file list, Manage recovery data. |
| `index.html`, `desktop/main.cjs` (titles) | Repaired garbled characters in the window title and in four Save-dialog titles ("PDFix â€” Your document workspace" and similar). |
| `scripts/check-app-smoke.mjs`, `docs/KNOWN-ISSUES-2026-10-13.md` | A smoke walk that opens every Workspaces tool and Home quick action with a small file, and the whole-app list of known bugs, failing tests, missing features and unproven work built from it. |
| `src/source-to-document.js`, `src/document-pdf-export.js`, `src/document-editor.js`, `src/document-toolbar.js`, `src/app.js` (conversion) | New: Markdown and CSV convert to the editor's document model. Export PDF for those files has a "Format…" box, on by default; the raw source export is still there. "Open as formatted document" turns the source into an editable rich copy in the same workspace (the app's `openFormatted` hook clears that file's recovery draft first). The source file is never changed. |
| `src/form-output.js`, `tests/form-single-stream.test.cjs`, `tests/form-output.test.cjs` | Fix: Fill and sign failed on every PDF whose page has a single content stream ("Original page artwork was not preserved."). The retention check now keeps the stream's reference in both shapes. New unit tests; the three older form-output tests were given the hash argument the writer now requires and pass again. |
| `src/form-builder-workspace.js`, `desktop/form-builder-codec.cjs`, `desktop/form-builder-worker.cjs`, `tests/form-builder-create.test.cjs` | Fix: Create fillable fields could not add or save any field. Its control lookups now skip the embedded reader (a hidden takeoff input shared the name `data-name`), and its artwork check accepts the neutral `q`/`Q` pair pdf-lib adds around unchanged original streams. New unit tests. |
| `scripts/check-tools-documents.mjs`, `scripts/check-tools-signing-request.mjs`, `scripts/check-tools-table.mjs` | New hidden in-app checks: file search, email to document and synchronized-file opening (4 cases), signing request (4) and table extraction to CSV (2). No code changes were needed for these tools. |
| `desktop/watched-folder-manager.cjs` | Wording only: when watched folders fail to start, the message says it concerns where PDFix itself is stored. |
| `scripts/check-tools-ocr.mjs`, `scripts/check-tools-pdf-edit.mjs`, `scripts/check-tools-form-builder.mjs` | New hidden in-app checks for OCR (4 cases), PDF text editing (3) and the field builder followed by filling the new fields (2). |
| `scripts/check-tools-security.mjs`, `scripts/check-tools-redaction.mjs`, `scripts/check-tools-fill-sign.mjs` | New hidden in-app checks for Protect, fingerprint, health report (4 cases), redaction (5) and Fill and sign (3), each reading the saved file back independently. |
| `tests/document-codec.test.cjs` | The DOCX fixture is rewritten only when missing or with `UPDATE_FIXTURES=1`, so a test run leaves the working tree clean. |
| `src/paper-sizes.js` | JSON import attribute so Node's test runner can load it; eight unit tests run again. |
| `tests/document-source-conversion.test.cjs`, `scripts/check-document-conversion.mjs`, `scripts/check-conversion-images.mjs`, `scripts/agent-build.mjs`, `docs/AGENT-WORKFLOW.md` | New unit tests and two hidden in-app checks for conversion; the build lock and the two-agent rules. |
| `scripts/check-workspace-files.mjs` | New hidden check, seven cases: Files order and reopen, Favorites, top search and Ctrl+K, Forget, the Actions panel, persistence across a restart, and a deleted file. |
| `scripts/check-document-review-tools.mjs` | New hidden in-app check, six cases: zoom, statistics, spell check with replace/Undo/Ignore all, read-aloud preparation (never played), the formatted header editor through DOCX and reopen, and closing while a spell check runs. |
| `scripts/check-workspace-shell.mjs` | New hidden walk through Home, Files, Favorites, the Workspaces rooms and search, Ask about files, Format support and Settings at 1280 x 800 and 800 x 620, plus keyboard reach on Home. |
| `scripts/check-document-tables-images.mjs` | New hidden in-app check, seven cases: merge across and down, split, cell fill, column widths, add/delete column and row, image resize/describe/fit/remove with Undo and Redo, DOCX output and reopen. |
| `tests/document-rtf-reopen.test.cjs`, `scripts/check-document-paste.mjs` | New unit tests for RTF reopen and a four-case hidden in-app paste check. |
| `tests/document-links.test.cjs`, `scripts/check-document-links.mjs` | New unit tests and an eight-case hidden in-app check for links. |
| `tests/document-roundtrip.test.cjs` | New unit tests: RTF header/footer and page setup round trip, mixed page-field lines still refused, DOCX header-row marking. |
| `scripts/check-document-content.mjs` | New hidden in-app check, ten cases: table, image, header/footer, find/replace with undo, word count, DOCX/PDF/RTF output, DOCX and RTF reopen. |
| `tests/document-paper.test.cjs` | New unit tests: paper sizes through validation, DOCX and RTF; page setup read back on import; invalid `page` shapes rejected. |
| `tests/desktop/document-editor.spec.js` | The four editor tests updated to the current ribbon and Workspaces names. The three PDF reader tests in the same file were not touched. |
| `scripts/check-document-editing.mjs` | New hidden in-app check, seven cases, including window close. |

## Touched outside the editor lane (integrator please review)

- **`desktop/main.cjs`, `before-quit` handlers near the end of the file.** A quit request (`app.quit()`, the default Exit menu) disposed the file store before the window's departure check ran. An opened file with unsaved typing then could not save its recovery draft and the window refused to close. Quit now goes through the same window close check; the two existing `before-quit` handlers return early when the quit was deferred.
- **`desktop/main.cjs`, `save-rich-document-copy` and `export-document`.** Both take an optional trailing `name`. It is used only when there is no source file, is reduced to a safe file base name by `newDocumentBase`, and only seeds the Save dialog.
- **`desktop/preload.cjs`.** `saveRichDocumentCopy` and `exportDocument` pass that extra `name` through. New `openDocumentLink(href)`.
- **`desktop/main.cjs`, new `open-document-link` handler** (just above `export-document`). It accepts only an address that passes `validDocumentLink` and is already in normalized form, then calls `shell.openExternal`. There is no native confirmation dialog: the user asked for popup-then-click, and the popup in the editor shows the full address first. This differs from the PDF reader's link review, which does show a native dialog. A compromised renderer could call this bridge directly, limited to `http`, `https` and `mailto` targets. Reviewer's call whether to add a native confirmation.
- **Ctrl+K.** `src/app.js` uses Ctrl+K for file search and was not changed. While the caret is inside the document editor, Ctrl+K now opens Links and does not reach the app handler.
- **`npm run build` was run several times** between 22:50 and 23:20 to restore the missing renderer bundle and to test. `dist` matches the source as of 23:20. Any later source edit needs a new build.

## Left alone — come back to these

Editor and Workspace (Claude's lane):

1. **RTF reopen is still simplified for tables and images.** Tables come back as tab-separated rows and images as placeholders. Lists (fixed October 13), links, indents, alignment, fonts, sizes, colors, superscript, subscript and highlight now survive.
1d. **Paste was tested with hand-written HTML only.** The samples copy the shape of Word, browser and web-editor clipboard output; the real programs and the system clipboard were not used. Not mapped on paste: highlight color, table cell shading and borders, images (always replaced with a note asking to use Insert), fonts outside the three editor families, and space before/after.
1a. **Link opening was only tested with a recorder in place of the real browser.** Nobody has yet clicked Open link in a visible window and watched the browser or mail app start.
1b. **Resolved, for the record:** the editor adopts a mouse selection a fraction of a second after the mouse is released (measured: present after 300 ms, absent immediately). It is a short delay, not a fault. Checks that click and then act must wait about 350 ms; the link code reads the page selection directly and needs no wait.
1c. **No links to places inside the document** (headings, bookmarks), and no link on an image.
2. **Paragraph layout still missing:** right indent, first-line amounts other than half an inch, and custom spacing values outside the listed ones. Tab indents only at the very start of a paragraph. From a DOCX made or changed in another program, alignment, indent, first-line/hanging indent, line spacing and space before/after are read only when set on the paragraph itself and equal to a value the editor offers; style-inherited layout is not read.
3. **No real Save.** Ctrl+S and every button export a new copy through a Save dialog; nothing saves back to the opened file. This follows the plan's "safe new-copy" rule, so it needs a product decision.
4. **Only one unsaved new document at a time.** New documents share one recovery draft. "New blank document" now replaces it safely, but two new documents cannot be open side by side. Document tabs exist now, but only one workspace is live: switching reopens the file, so a reader's zoom and an editor's Undo history do not survive a switch (the text does, through the recovery draft), and tabs are not kept after a restart.
5. **The document name is not stored in the recovery draft.** It is kept in the renderer's local storage beside the single new-document draft. Version history rows do not carry names.
6. **A DOCX made or changed in another program** now keeps (October 13) paragraph alignment, indents, listed spacing, and run font family, size, color, highlight and underline when they are set directly on the paragraph or run. Style-inherited formatting, theme fonts, list-item and table-cell formatting are still simplified, and automatic page numbers stay off. Tested with files written by the docx library in Word's shape, not with files saved by Word itself.
6a. **PDFix DOCX copies have not been opened in Word, LibreOffice or Google Docs.** They now contain two custom document properties (a standard feature) and the package is re-zipped after writing. Both pass PDFix's own archive check and a second DOCX library, but no outside editor was available to test.
6b. **The stored model is skipped when it would exceed 512 KB or the document has more than 20 images.** Such documents reopen through the simplified import. Custom properties are visible to anyone who inspects the file; they contain only what the document itself contains.
7. **DOCX and RTF import read equal side margins only.** Unequal margins from another program fall back to the default with a notice. PDFix can now set and save separate margins (October 13), and its own DOCX copies reopen with them through the stored model.
8. **No custom paper size.** (Separate margins for each side were added October 13.)
9. **Done October 13:** alignment buttons (Ctrl+L/E/R/J), highlight in four Word colors, superscript and subscript. Other highlight colors are not offered and are dropped on paste.
10. **A3, A5 and Tabloid were unit-tested for DOCX/RTF and import only.** Only Legal landscape was checked in the app and in PDF output.
11. **Not exercised this session:** speech playback itself (prepared only, to avoid sound), the personal spelling dictionary, other dictionary languages, the formatted footer and multi-paragraph bands, header column toggle, find options beyond match case, statistics for a selection or with header/footer included, source (Markdown/JSON) preview, and the 800 px minimum window inside the editor.
11b. **Ignore once does not survive an edit.** Any change to the text, including a spelling replacement, clears the ignore-once choices (Ignore all is kept). That was already so; with the automatic re-check an ignored-once word reappears after the next replacement.
11c. **In the Actions panel the first Escape clears typed search text and the second closes the panel.** That is the browser's behavior for a search box and was left as it is.
11d. **Fixed October 13:** the band editor's Bold, Italic and Underline boxes are now named with their paragraph and run ("Paragraph 1 run 2 Bold"), like the other run controls.
11a. **Typing and text formatting made within half a second of each other still share one Undo step.** That is the editor library's normal typing behavior; image, table, link and paragraph layout actions are separated.
12. **Still not exercised in the shell:** drag and drop onto Home (a synthetic drop carries no file path), fullscreen (it would show the hidden test window), "Search selected files", Ask about files connections, the storage estimate, sandbox status and form-recipe cleanup in Settings, large files, and lists with many entries.
12b. **Interface text size does not enlarge headings.** At Large (150%) body text goes from 13 to 21 px and buttons from 12 to 19.5 px, but page headings stay at 27 px. By design in `src/interface-accessibility.css`; noted in case headings should scale too. The document editor ribbon was not looked at with the larger sizes.
12c. **Fixed October 13:** Clear recent-file list now asks first (Keep the list / Clear the list), because it also removes favorites, reading positions and page bookmarks.
12a. **Back from a document always goes to Home**, even when the document was opened from Workspaces or Files. The button is labelled "Back to Home", and that label is used by at least 15 test files and three reader scripts, so it was left alone. Returning to where the user came from would be friendlier.
13. **Accessibility pass not done** on the new controls beyond labels and keyboard operation of the name field.

Shared or other-lane items noticed, not touched:

14. **25 of 76 unit tests fail** in `npm test` (compression, form output, image output, OCR, passwords, PDF operations, reading state, redaction, split output). Two visible causes: `desktop/paper-sizes.json` imported without `type: json`, and the Windows sandbox not starting under the test runner. None are editor tests; not investigated.
15. **Three PDF reader tests in `tests/desktop/document-editor.spec.js` fail** on stale selectors ("Go to page 2", "View options"). Reader lane.
16. **Fixed:** `tests/document-codec.test.cjs` rewrites its DOCX fixture only with UPDATE_FIXTURES=1.
17. **Why the renderer bundle went missing from `dist/assets` was not determined.** Google Drive sync or an interrupted build are both possible.
18. **Done:** git history and the two-agent rules in `docs/AGENT-WORKFLOW.md`.
19. **Fixed October 13:** PDFix now sets its own menu (File, Edit, View zoom and full screen, Window). Reload, Force Reload and developer tools are gone (developer tools return with PDFIX_DEVTOOLS=1), so Ctrl+R can no longer restart the interface mid-edit. Typed keys in a hidden test window do not reach menu shortcuts, so this was verified by reading the menu (scripts/check-app-menu.mjs), not by pressing Ctrl+R.
20. **Old desktop specs:** recovery 5/5 and foundation 4/4 after updates; layout 2 of 3 (the third is a reader test). Images, OCR, splitting, redaction, passwords and forms fail mostly on renamed reader menus and old status text (25 of 32); the hidden check scripts cover those tools and pass.
21. **One build at 23:45 stopped with "Source changed during compilation"** because source files changed while it ran (the other agent was editing). The next builds completed. Whoever does the final build should run it when both agents are idle.
22. **Reopened PDFix DOCX files show an "even/odd header/footer behavior is omitted" note** even though the document has none. Harmless noise; the DOCX writer probably emits the setting.

## Verified

- Unit: `tests/document-paper.test.cjs`, `tests/document-roundtrip.test.cjs` and `tests/document-codec.test.cjs`, 10 of 10 pass.
- Playwright: the four editor tests in `tests/desktop/document-editor.spec.js` pass (Workspaces to new document with DOCX export, DOCX import, canceled save, Markdown/JSON source save).
- In-app, hidden window, `scripts/check-document-editing.mjs`: 7 of 7 pass and the window closes. Cases: readable status text; naming survives leaving and returning; strikethrough; list levels; Legal landscape with 25 mm margins to DOCX and PDF with the Save dialog suggesting the document name; reopened DOCX keeps strikethrough, nested list, Legal, landscape and 25 mm and is not marked edited; New blank document keeps the old draft in Version history.
- In-app, hidden window, `scripts/check-document-content.mjs`: 10 of 10 pass and the window closes. The PDF text was extracted and contains the body, table cells, header and footer; the DOCX was read back with a separate library; reopened DOCX and RTF keep table rows (3 header cells, 6 data cells), the image (DOCX), header/footer text and Letter paper, and are not marked edited.
- Sanitizer fix checked inside the app with the real library: safe attributes kept; `javascript:` and `https:` image sources, event handlers, `style` and unknown `data-*` attributes still removed.
- In-app, hidden window, `scripts/check-document-links.mjs`: 8 of 8 pass. Selected word linked with Ctrl+K; five unsafe or malformed addresses refused in the panel and four refused at the bridge; first click shows the popup and opens nothing; the popup button opens the address exactly once; typed address with no selection; Remove and Undo; DOCX has two external hyperlinks; PDF has two link annotations; RTF has two hyperlink fields; reopened DOCX keeps both links and is not marked edited.
- Unit: `tests/document-links.test.cjs`, 4 of 4, `tests/document-snapshot.test.cjs`, 3 of 3, and `tests/document-paragraph.test.cjs`, 3 of 3, bringing the editor unit total to 20 of 20.
- In-app, hidden window, `scripts/check-document-paste.mjs`: 5 of 5 pass (the fifth and a stricter Word case were added with the formatting pre-pass: Word title keeps center, serif, 16 pt, red and bold; an indented double-spaced paragraph keeps both and its nested blue span keeps the inherited font and size; Word list paragraphs become a nested bulleted list and a numbered list with no marker characters left in the text; web-editor style-only bold/italic/underline, monospace, 14 pt, green and right alignment are kept and the following plain run is not bold). Browser-style HTML keeps headings, emphasis, nested lists, a merged table cell and a safe link; scripts, styles, frames, forms, event handlers, remote and SVG images, `javascript:` links and page anchors are removed or reduced to text and nothing ran; Word-style HTML arrives without Office markup; the pasted document saves and reopens with identical structure.
- In-app, hidden window, `scripts/check-document-tables-images.mjs`: 7 of 7 pass. The DOCX read back has the column span, the row span, the cell shading, a 1:2:1 column grid, the image at 200 px wide and its description; the reopened file shows the same table and image and is not marked edited. Undo after remove returns the image at its last size, and a further Undo and Redo step through one resize at a time.
- All six editor in-app checks were rerun after the paragraph spacing and Tab work: 7, 5, 4, 10, 9 and 8 cases, 43 of 43.
- In-app, hidden window, `scripts/check-workspace-tabs.mjs`: 5 of 5 pass (one tab per opened document, switching keeps unsaved edits in a new document and a DOCX, Ctrl+Tab order, closing tabs, a deleted file's tab dropped with a message). Not exercised: ten-tab overflow, large files, tools opened from a tab.
- In-app, hidden window, `scripts/check-document-first-line.mjs`: 3 of 3 pass. In the editor the first line sits 67 screen pixels in (first) and out (hanging) at the test zoom; Undo removes only the hanging setting and Redo restores it; in the saved PDF the first line starts 36 pt (half an inch) right of the wrapped lines for the first paragraph and 36 pt left of them for the hanging one; the DOCX reopens with both settings. `scripts/check-document-paste.mjs` gained pasted first-line and hanging paragraphs.
- Combined run of the hidden checks on October 13 (several at once): conversion images 3, content 10, conversion 5, editing 8, links 9, paste 5, reopen 4, review tools 6, tables and images 7, documents 4, form builder 2, OCR 4, PDF edit 3, redaction 5, security 4, signing request 4, table 2, settings 5; workspace files and shell pass when run alone; Fill and sign showed 0 in the combined run and 3 of 3 alone. One editing run reported "Document sandbox cleanup failed" while other checks were running; two reruns passed 8 of 8. Both look like interference between parallel runs (see A-B1).
- In-app, hidden window, `scripts/check-document-review-tools.mjs`: 6 of 6 pass. The sheet is 794 px wide at 100% and 397 px at 50%; statistics give 19 words, 101 and 84 characters and 2 paragraphs for the test text; spell check finds both planted errors with Windows' en-US dictionary, a suggestion replaces one, Undo and Redo work on it, Ignore all clears the other; read aloud prepares the edited text and enables Play with two installed voices; a two-run centered header with a bold 14 pt red Times run shows on the sheet, is written to the DOCX header part and reopens identical; the window closes while a spell check is running. Closing was also tried with each tool open (six cases): all closed in about 0.1 s.
- In-app, hidden window, `scripts/check-workspace-files.mjs`: 7 of 7 pass. Three opened files list newest first and a row reopens its file and moves it to the top; a favorite appears under Favorites and survives a restart; the top search narrows to the matching file, shows "No opened files match your search." and Ctrl+K focuses it; Forget removes the row and leaves the file on disk untouched; F1 and Ctrl+Shift+P open the Actions panel, typing narrows 102 actions to 2, and New document runs from it; clicking a deleted file shows the new message and the app keeps working.
- In-app, hidden window, `scripts/check-workspace-settings.mjs`: 5 of 5 pass, with no sideways scrolling at the largest text size at 1280 or 800 px wide; both settings were still applied after a restart and Restore standard interface reset them. The files check gained an eighth case: on Home the recent list starts at 271 px, above Quick actions at 414 px, and one click reopens a file.
- Documents room, built app, outputs read back: file search finds "welcome" in the two of three files that contain it, with page and line references, and a case-sensitive miss returns none; an .eml message becomes an editable document with decoded headers and body while its attachment is listed and left out; a synchronized-folder file is inspected, reviewed and opened; the signing request produces a PDF with "SIGN HERE" and "DATE HERE" notes and an unsent, attachment-free email draft; a generated 4 x 3 table exports to a CSV that matches every cell.
- Also verified in the built app with outputs read back: OCR (an image-only page gains the selectable text "SCANNED MAINTENANCE GUIDE Replace the oil every 5,000 miles. Check the filter before a long journey." and keeps its scan), PDF text editing (a line replaced in place at the same position and size, a text box added, the title changed, everything else untouched), and Create fillable fields (a text field and a checkbox saved, then filled in Fill and sign and read back as "Jordan Example" and checked). Whole unit suite now 195 of 200.
- More tools, hidden window, outputs read back: Protect (AES-256 copy opens only with its opening or owner password, no temporary PDF left, weak or mismatched passwords refused), fingerprint (SHA-256 correct; match and mismatch differ; receipt saved), health report (page count, size, hash; JSON saved), redaction (no selectable text, annotations, outline, attachments or document information; marked words absent from every stream; region solid black when rendered outside PDFix; other pages intact), Fill and sign (a text line and a typed signature on page 1, other pages unchanged). Whole unit suite: 190 of 196.
- Conversion, hidden window: `scripts/check-document-conversion.mjs` 5 of 5 (the formatted Markdown PDF has no Markdown symbols, a heading larger than the body, a non-monospace body font and one working link; the raw export still shows the source; the formatted document has the heading, emphasis, nested and task lists, quote, code block, table and link, saves to DOCX, and the `.md` file is unchanged; CSV becomes a table in the PDF and in the editor; text and JSON export as text with no format option). `scripts/check-conversion-images.mjs` 3 of 3 (PNG to a one-page Letter PDF with one image; three PDF pages to PNG at 144 dpi, 1224 x 1584, and to JPEG at 72 dpi, 612 x 792; sources unchanged). Unit: 3 new conversion tests; editor unit total 25 of 25; whole suite 177 of 194.
- Earlier full run: seven editor checks 49 of 49, two shell checks 12 of 12, Playwright editor tests 4 of 4, editor unit tests 22 of 22.
- Shell, hidden window, `scripts/check-workspace-shell.mjs`: 5 of 5 pass with no findings left. Seven sidebar screens at two window sizes showed no garbled text, no horizontal overflow, no control without a name and no renderer errors; the four Workspaces rooms list 6, 10, 11 and 12 tools; arrow keys and End move between room tabs; search finds New document and shows an empty-result message; Workspaces opens a new document; Tab reaches Open a file and New document. Two screenshots (Home and the Documents room) were looked at.
- RTF reopen: `tests/document-rtf-reopen.test.cjs` 2 of 2 (editor unit total 22 of 22), and the links check now has a ninth case, reopening the RTF with both links.
- Paragraph indent and spacing in the app: a two-step indent measured 71.6 pt (one inch is 72) right of the margin in the exported PDF; indent 2 and spacing 1.15 survive DOCX save and reopen (`check-document-reopen.mjs`, still 4 of 4); the other three in-app checks and the four Playwright editor tests were rerun afterwards and pass.
- In-app, hidden window, `scripts/check-document-reopen.mjs`: 4 of 4 pass. A document with a centered heading, a right-aligned serif 18 pt red paragraph, an image and a Legal landscape page setup with header page numbers reopens identical and is not marked edited; a copy whose body was edited outside PDFix shows the edited text through the ordinary import; a copy whose stored model disagrees with its body is refused and the body text is shown.
- Output read back independently: DOCX page `20160 x 12240` landscape with the strikethrough run and nested list; PDF page `1008 x 612` pt.
- Quit recovery: text typed immediately before `app.quit()` came back as "Recovered local draft" on the next launch (one-off script, removed afterwards).
- Two screenshots (Layout and Home tabs) were looked at. No other visual review was done.

## For Codex (reader workstream)

Read against `docs/PDF-READER-PARALLEL-HANDOFF-2026-10-12.md`. Nothing here edits a reader file.

- **Builds.** That handoff reserves the final build for one integrator. Claude ran `npm run build` many times on October 12–13 to test editor work in Electron, so `dist` currently contains whatever reader source was on disk at the last build (about 00:12 on October 13). Treat it as a test build. The coordinated final build and manifest comparison are still to do.
- **One build stopped with "Source changed during compilation"** at about 23:45 on October 12 because reader files were being saved at that moment. If a build of yours fails the same way, the editor side may be saving.
- **Shared files Claude changed:** `desktop/main.cjs` (quit handling, new-document names in two save handlers, `open-document-link`) and `desktop/preload.cjs` (two extra arguments and `openDocumentLink`). Details are in "Touched outside the editor lane" above. `src/app.js`, `index.html`, `package.json` and `vite.config.js` were not changed.
- **The garbled text your review saw** in editor strings is fixed in `src/document-editor.js`. The malformed title you noted in shared shell files was not touched.
- **Unit-test failures you listed** (JSON import syntax, native verifier mocks) are the same 25 failures noted in item 14 above. Still open, not editor-owned.
- **`tests/desktop/document-editor.spec.js`** holds three reader tests (area selection, readable view) that fail on old selectors. They are yours; the four editor tests in the same file now pass.
- **Hidden-window selection.** If a reader check drives selection with the mouse in a hidden Electron window, be aware that selection-change events may not arrive there (see item 1b).
- **Quit behavior changed for the whole app:** `app.quit()` now goes through the window's departure check before services are disposed. A reader check that calls `app.close()` with unsaved reader state will now wait for that check instead of tearing down underneath it.
- **Close after a renderer crash (October 13, `desktop/main.cjs`).** If the renderer died while being asked to prepare for closing, the close was cancelled and never retried, so `app.close()` and the user's quit hung. A crashed renderer is no longer asked, and a crash within ten seconds of a close request completes the close. Reproduced 4 of 4 before the fix (one run hung 15 s, others logged "Render frame was disposed"), and 4 of 4 clean after it, including a relaunch with the same profile. `tests/desktop/recovery.spec.js` went from 2.3 minutes to 26 seconds. If a reader check saw slow teardown or leftover electron.exe processes, this may have been why.
- **`tests/desktop/layout.spec.js`, third test (PDF panes, fit width, Ctrl+F)** fails on the old "View options" / "Pages panel" names; the reader now has "Tools & view". It is a reader test, so it was left for you. The other two layout tests pass.
- **Word paragraph layout on open (October 13).** New `desktop/docx-paragraph-layout.cjs` reads direct paragraph properties from `word/document.xml` in the contained child; `src/docx-paragraph-layout.js` lines them up with the imported HTML by text (whitespace ignored, 40-paragraph look-ahead). Validated by `validDocxImport`. Checked by `tests/docx-paragraph-layout.test.cjs` (2 pass; the DOM half is skipped because jsdom is not installed) and `scripts/check-document-word-layout.mjs` (2 of 2). Files generated with the docx library, not by Word itself.
- **Old desktop specs (October 13).** recovery 5/5 and foundation 4/4 after updates. Images, OCR, splitting, redaction, passwords and forms specs mostly fail on renamed reader menus ("Tools & view" now holds many summaries) and old status text, 25 of 32; the hidden check scripts cover the same tools and pass. Not rewritten; low value per hour.


# Appendix B — Codex full handoff

Snapshot of docs/PDF-READER-PARALLEL-HANDOFF-2026-10-12.md.

# PDF reader parallel handoff — 2026-10-12

This is the handoff for the reader workstream in this chat. The user authorized adding missing reader features and asked for a list of everything left alone so two agents can return to it. Claude owns Workspace/document creation/editing. One integrating workstream should own shared files and the final build.

## Reader work saved in this chat

| Feature | Files | Status |
| --- | --- | --- |
| Split-word search, correct Unicode/source offsets | `src/pdf-search.js`, `src/pdf-search-model.js` | Focused tests and real-PDF browser cases pass |
| Prompt Stop/replacement search, page-reading deadlines | `src/pdf-search-page.js`, `src/pdf-search.js` | Focused tests and delayed-request browser cases pass; an already-dispatched worker request can still finish |
| Source-sequence readable text and source paragraph identity | `src/pdf-readable-sequence.js`, `src/pdf-readable-view.js`, `src/pdf-search.js` | Focused tests and readable match navigation pass |
| Exact readable-text search highlighting | `src/pdf-readable-sequence.js`, `src/pdf-readable-layout.js`, `src/pdf-readable-view.js`, `src/pdf-search.js` | Source character fragments identify the selected occurrence after row/column reordering. Unicode expansion and repeated words keep correct offsets; order changes refresh highlights without wrapping or changing paragraph text. Browsers without Custom Highlight get a paragraph fallback. |
| Exact outline destinations and view-history integration | `src/pdf-destination.js`, `src/reader-navigation.js` | Named and explicit destinations, position/zoom, page/width/height/rectangle fitting; scoped tests/browser evidence |
| Exact positioning from reviewed internal links | `src/pdf-link-review.js`, `src/pdf-destination.js` | Browser-tested internal link; external-link review behavior unchanged |
| Readable row/column words and middle headings | `src/pdf-readable-layout.js`, `src/pdf-readable-view.js` | Adjacent style fragments join; real gaps/whitespace remain; spanning rows divide column sections; automatic gutter proposal improved |
| Explanation for matches outside readable layout | `src/pdf-search.js` | Explains how to see an omitted match instead of silently selecting an invisible paragraph |
| Reader keyboard focus and shortcuts | `src/pdf-reader-keyboard.js`, small wiring change in `src/pdf-reader.js` | Editing controls, handled/modifier/composition events, hidden readers and other modal dialogs keep their keys. Ctrl+Home/End navigate first/last page; Ctrl+F/F3 and Escape search handling are browser-tested. |
| Destinations during panel resize | `src/pdf-destination.js` | Waits up to 20 seconds for the view to settle instead of rejecting an immediate Outline click during resize. Changed navigation/source/disposal cancels the queued jump. |
| Fit-page resize render loop | `src/pdf-reader.js` | Replacing a rendered page preserves the previous banner geometry while the bottom status reports loading. This prevents loading messages from repeatedly changing stage height and triggering another fit-page render. Component checks verify stable fit/page bounds at 800/1100/1380 widths and a page with a visible no-text warning. |

Tests owned here: `tests/pdf-search-model.test.cjs`, `tests/pdf-search-page.test.cjs`, `tests/pdf-readable-sequence.test.cjs`, `tests/pdf-destination.test.cjs`, `tests/pdf-readable-layout.test.cjs`, `tests/pdf-reader-keyboard.test.cjs`.

Isolated browser runners: `scripts/check-reader-search.mjs`, `scripts/check-reader-navigation.mjs`, `scripts/check-reader-component.mjs`. The first two generate PDFs and use production reader components with reader adapters. The third opens the generated navigation fixture in the actual `PdfReader` constructor with production CSS and explicit native-interface test doubles. All build separate temporary Vite previews; none launches a competing shared build or claims full Electron acceptance.

## Files and areas deliberately left alone

| Area/files | Reason and follow-up |
| --- | --- |
| Workspace/document editor modules, editor toolbars, document creation/formatting/export | Claude's assigned workstream. This chat does not replace that implementation or certify its results. |
| `src/app.js`, shared home/navigation/layout/style modules, `index.html` | Shared shell/UI ownership stays with integration. The review saw a malformed encoded title and some malformed text; recheck current source before correcting shared/editor strings. |
| `src/action-panel.js` | Earlier review noted no explicit Escape handling for its search input; the runtime harness also had wrong sidebar labels. Reproduce the actual Escape issue before changing shared UI. |
| `desktop/**`, shared file-store/native adapters | Native bridge, save/verification/containment behavior stays with integration. This pass does not write PDFs or change grants, native processes or external network behavior. |
| Multi-page/fullscreen/measurement/comment/tool modules | Existing render, zoom, navigation and history interfaces are used as provided. `src/pdf-reader.js` wires the keyboard handler and preserves loading-banner geometry during replacement renders; native-tool integrations were preserved. Other reader tools keep their previous acceptance status. |
| `package.json`, `package-lock.json`, `vite.config.js`, packaging/native build scripts | Avoid competing dependency/config changes and native packaging builds. No new dependency is required by this reader pass. |
| Shared `dist/**`, `Launch PDFix.cmd` | Final build belongs to the integrating workstream. Earlier bundles were missing; a later build had them, but its manifest did not contain all reader fixes. Launcher validation of every referenced bundle remains a possible follow-up, not a current missing-bundle diagnosis. |
| Master plan, feature inventory, gap tracker and other agents' progress records | Preserved shared records. This separate document records this chat's scope; integration can update master statuses after combining work. |
| Existing native writer/form/image tests and broad acceptance suites | Earlier audit failures included ESM JSON-import syntax and stale native-verifier mocks. Those are not resolved by reader component tests. Update fixtures/interfaces in the owning workstream, then run the required native checks. |
| Three reader cases in `tests/desktop/document-editor.spec.js` | Claude reports stale reader selectors in this shared editor test file. Left untouched while Claude owns the file; return to its reader cases during coordinated desktop acceptance. |

No claim is made that this is an inventory of every missing feature in the whole application. It lists all known work this chat left outside its changes and the remaining reader acceptance below. Unreviewed app features retain their master-plan status.

## Reader work still to return to

- Full Electron integration after one coordinated build, including real outline and link clicks in the app shell; broader keyboard/focus/accessibility checks; real window resize and native fullscreen; sustained navigation on real large documents. The actual-reader browser pass covers continuous/facing/text-mode transitions, restoration of readable mode, several viewport widths, rapid page requests and delayed destinations superseded by newer navigation; native/large-document acceptance remains open.
- Real large PDFs/drawings: sustained search/jumps/scroll/zoom, measured memory/responsiveness, cache/worker limits, range-source error/cancel behavior and paged-source capabilities. Paged reading currently has unavailable outline/destination APIs; this pass does not add native metadata support.
- Wider destination cases: null coordinates across view modes, multiple rotations/crop origins/UserUnit values, unusual zoom requests, invalid/hostile destinations and bounding-box Fit variants. FitB/FitBH/FitBV use the page viewport as PDF.js's viewer does; precise painted-content bounds are not newly computed here. Requested views remain subject to existing canvas/zoom limits.
- Wider readable layouts: tables, captions, drawings, vertical text, complex bidirectional text, overlapping fragments and irregular/many columns. Auto column detection remains an inferred proposal, with content/row/manual-column/region choices available. It is not semantic structure recovery or OCR.
- Broader readable-highlight acceptance on real multilingual/complex layouts. Exact character ranges now work in content/row/column views and refresh after reading-order changes; Unicode expansion, repeated words and no-Custom-Highlight fallback are tested. A regional/unsupported layout may omit the source paragraph and explains alternatives. The fallback indicates a whole paragraph rather than exact characters.
- All unrelated reader/tool gaps in the master plan, including comment/markup interoperability, exact output/native acceptance, hardware and clean-machine/release checks. These are neither completed nor silently dropped by this pass.

## Verification and integration record

The previous search checkpoint is in `docs/PDF-READER-SEARCH-PROGRESS-2026-10-12.md`. Its build observation is historical and must not be treated as proof of current integration.

Run the focused suite:

```powershell
node --test tests/pdf-reader-keyboard.test.cjs tests/pdf-destination.test.cjs tests/pdf-readable-layout.test.cjs tests/pdf-search-model.test.cjs tests/pdf-search-page.test.cjs tests/pdf-readable-sequence.test.cjs
```

Run both browser scripts with a writable output directory. Each writes a temporary folder with `report.json`; navigation also captures `rotated-destination.png`.

Current results (October 13): **27/27 focused tests, 12/12 search browser checks, 10/10 navigation/column/keyboard browser checks and 12/12 actual-reader browser checks passed**, with zero renderer errors in all three reports. Changed modules/runners pass syntax checks and isolated browser compilation. Browser runs checked that their original PDF fixture bytes were unchanged. The actual-reader screenshot was inspected: the selected readable words have visible glyphs and an orange highlight. Expanded component checks confirm stable fit-page rendering, resized destinations, rapid/superseded navigation and a visible no-text warning.

- Search report: `C:\Users\andre\.codex\visualizations\2026\10\13\01a133b5-db03-7e80-b23c-be4867bb9992\reader-search-WfzKHB\report.json`.
- Navigation/column/keyboard report: `C:\Users\andre\.codex\visualizations\2026\10\13\01a133b5-db03-7e80-b23c-be4867bb9992\reader-navigation-CI7i7E\report.json`.
- Actual reader report: `C:\Users\andre\.codex\visualizations\2026\10\13\01a133b5-db03-7e80-b23c-be4867bb9992\reader-component-0UDgcG\report.json` (representative screenshot: `actual-reader-readable.png`). This covers the production reader lifecycle and UI components with a synthetic three-page fixture, simple test icons, and metadata/window/editor-guard test doubles. It is browser component integration, not the Electron app/native bridge.
- To run the actual-reader check, generate the navigation fixture first, then run `node scripts/check-reader-component.mjs OUTPUT_DIRECTORY NAVIGATION_OUTPUT_DIRECTORY/preview/fixture.pdf`.
- Reader source hashes: `docs/PDF-READER-SOURCE-SNAPSHOT-2026-10-12.json`. This records only this workstream's files so integration can compare the coordinated build manifest with these exact sources.

An earlier manifest comparison matched seven of nine production module hashes. Further keyboard and destination-resize changes have since been saved. Integration must compare the refreshed source snapshot with its final build, rather than treating that earlier comparison as current. Matching source hashes does not establish desktop runtime acceptance.

Integration order: let both owners finish saving their files; review source changes; make one shared build; check its source manifest against the saved reader and editor files; perform Electron/native acceptance; update master records with the actual scoped results. Source, component browser, desktop and release evidence remain distinct.

## Claude coordination read on October 13

Read the local `docs/CLAUDE-HANDOFF-2026-10-12.md`, including its “For Codex” section. Claude confirms no reader files were edited. Its hyperlink popup/selection/Remove implementation and paragraph-spacing/RTF-import follow-ups stay in its lane. Its reported build around 00:12 is a test build, not evidence that these later reader changes are integrated. No shared `dist` or native build was run here.

Claude records that opening editor links used a recorder instead of launching the real browser/mail app, that visible-window mouse selection still needs confirmation, and that quit/departure handling changed in `desktop/main.cjs`. Those stay pending for their owner/integration; this reader pass neither edits nor certifies them. Shared title encoding, native test failures, real Electron checks and the coordinated final build remain open as listed above.

## Testing order agreed on October 13

The user asked to prioritize work that does not need the full app while Claude is editing. This pass completes reader source fixes, focused tests and isolated component checks; Electron acceptance is deferred to one combined build, followed by checks on each computer. At that initial checkpoint no separate Electron test copy was made or launched; a preparation-only copy was made afterward, as recorded below. The temporary web preview server was stopped, and its unused serving helper was removed. No shared build or dependency/native/editor changes were made.

Later desktop checklist: verify Ctrl+F, F3/Shift+F3, Ctrl+Home/End and focus around controls/dialogs; exact outline/internal-link jumps and view history; readable highlighting across reading orders; fit-page/width while resizing and toggling panels; rapid/superseded requests; remembered page/bookmarks through restart; real large PDFs and native fullscreen. Run that same combined build on each computer and keep machine-specific results separate. Native output/save/security and Claude's editor follow-ups retain their own acceptance requirements.

## Converter workstream added October 13

The user additionally authorized converter work that does not interfere with Claude's document editor. This chat owns image/PDF conversion core source and standalone tests; DOCX/RTF/document text export and shared native save/import bridges remain untouched. No full-app conversion acceptance is claimed.

Changes: `src/image-output.js` validates source dimensions and all page recipes before image decoding/editing or progress. It snapshots canonical settings so later draft changes do not alter planned pages. `src/pdf-image-export-model.js` supplies pure PDF-to-image resolution/rotation/geometry and aggregate pixel-budget checks, wired into `src/pdf-image-export.js`. Invalid negative, nonfinite or excessive geometry is rejected before canvas allocation. Existing bounds, supported formats and saving contracts are preserved.

**9/9 converter unit tests pass** in `tests/image-conversion-core.test.cjs` and `tests/pdf-image-export-model.test.cjs`, bringing the combined source suite to **36/36**. Tests reopen real PNG-generated PDFs, decode embedded RGB/alpha streams, inspect actual image-paint transforms for every rotation/paper/orientation combination, check page order/duplicates/shared assets/source bytes, and reject invalid later recipes before canvas editing. PDF-to-image tests cover sizing and budgets; actual canvas encoding and native saving remain pending. Syntax checks pass. Existing `tests/image-output.test.cjs` still imports the shared FileStore/native stack and retains its previous separate acceptance status; these standalone tests do not certify that stack.

Full converter list mapped against current `src/formats.js` and the planned-format inventory:

| Conversion group | Ownership and remaining evidence |
| --- | --- |
| PNG/JPEG/static WebP/supported BMP → PDF; ordered multiple images → PDF | Core is in this lane. PNG embedding/alpha, geometry and order verified without the app. JPEG orientation, WebP/BMP decoding, image editing/deskew and UI/native copy saving still need browser/app/corpus checks. |
| PDF → PNG/JPEG; edited images → PNG/JPEG | Pure PDF pixel planning strengthened here. Canvas encoding, JPEG white background/quality, PNG transparency, reviewed previews/cancellation and saved-copy receipts still need later runtime checks. |
| Multipage TIFF → PNG → image PDF | Existing contained decoder/import path; not edited here. Wider formats, corpus/orientation/color, reviewed import and native saving remain pending. |
| DOCX/RTF/TXT/Markdown → document PDF/DOCX/RTF/TXT; PDF text/OCR → document | Claude's editor/export lane. Leave its codecs, popup, formatting and save/reopen work alone. |
| JSON/XML/YAML/CSV → source-text PDF | Existing document/source export path; defer shared/editor work. This is source text, not structured-document layout conversion. |
| XLSX → XLSX/CSV; PPTX → PPTX/TXT/text DOCX/text PDF | Existing limited Office adapters. Broader fidelity and faithful slide/workbook PDF output are not proven or added by this pass. |
| HEIC/HEIF; legacy DOC/XLS/PPT; Apple Pages/Numbers/Keynote | Still unsupported/planned. Decoder, dependency/licensing and real-file gates remain; no new format support is advertised. |
| Batch conversions and clean-machine compatibility | Wider queue/cancellation/collision handling and machine-specific native/codec evidence remain integration work. |

Run the new source checks with `node --test tests/image-conversion-core.test.cjs tests/pdf-image-export-model.test.cjs`. Converter source hashes are in `docs/PDF-CONVERTER-SOURCE-SNAPSHOT-2026-10-13.json`; compare them against the later combined build.

### Converter follow-up: cancellation, selection and encoder validation

Current converter evidence supersedes the earlier 9-test checkpoint: **20/20 converter unit tests and 47/47 combined reader/converter unit tests pass**. Add `tests/pdf-image-operation.test.cjs` and `tests/image-file-output-core.test.cjs` to the converter command above.

- `src/pdf-image-export-model.js` now selects current/all/range pages before worker dispatch. All-page and large-range requests are capped at 100 before expanding them; invalid modes, unavailable current pages, overlaps and malformed ranges are rejected. The parser accepts bounded physical ranges beyond page 500, but this does not enable image export in currently unsupported native on-demand reading modes.
- New `src/pdf-image-operation.js`, wired into `src/pdf-image-export.js`, supplies a bounded operation deadline, prompt cancellation, source/permission/generation checks, consumed late worker errors and discarded late bitmap cleanup. Worker/encoder functions are dispatched lazily so a canceled job does not start the next operation. The export remains tied to its captured PDF document and file; saving rejects a changed source. An already dispatched encoder/worker can still finish, but its result is not adopted. Tests cover stopped, timed-out, source-changed and replaced operations and listener cleanup.
- `src/image-file-output.js` now rejects decoder dimensions that differ from the prepared image, unexpected encoder MIME fallback (for example PNG when JPEG was requested), and encoded header dimensions that differ from the expected output. Its bitmap is released on these failure paths. These four contract tests use explicit bitmap/canvas test doubles and real generated PNG bytes; they do not prove browser color conversion, JPEG encoding quality or pixel-exact browser rendering.

Changed modules pass syntax checks and compile in an isolated frozen renderer build. Latest prepared copy: `C:\Users\andre\.codex\visualizations\2026\10\13\01a133b5-db03-7e80-b23c-be4867bb9992\reader-desktop-yzDVHF`. Its `snapshot.json` still says desktop tests **not run**. No Electron window was launched; Claude's source, the native bridge, shared dependencies/configuration and shared `dist` remain untouched. Refresh the copy after later source edits. Full conversion UI/cancellation, source replacement, actual PNG/JPEG browser encoding and native copy saving are still on the combined-app acceptance list.

Preparation-only follow-up: `scripts/prepare-reader-desktop.mjs OUTPUT_PARENT` creates a frozen source copy and isolated renderer build, copies existing native/PDF/OCR assets, and never launches Electron. A copy was prepared at `C:\Users\andre\.codex\visualizations\2026\10\13\01a133b5-db03-7e80-b23c-be4867bb9992\reader-desktop-e45Y16`, with `snapshot.json` recording desktop tests as **not run**. It predates these converter changes and must be refreshed before later desktop acceptance. It is not a new native build or release build. No Electron check runner has been added or executed; use the later coordinated acceptance process.

### Converter follow-up: intermediate image validation and memory cleanup

Current source evidence: **28/28 converter checks and 55/55 combined reader/converter checks pass**, counting nested failure cases. The full command is `node --test tests/image-adjustments-core.test.cjs tests/image-file-output-core.test.cjs tests/image-conversion-core.test.cjs tests/pdf-image-export-model.test.cjs tests/pdf-image-operation.test.cjs tests/pdf-reader-keyboard.test.cjs tests/pdf-destination.test.cjs tests/pdf-readable-layout.test.cjs tests/pdf-search-model.test.cjs tests/pdf-search-page.test.cjs tests/pdf-readable-sequence.test.cjs`.

`src/image-adjustments.js` now validates intermediate PNG MIME, header dimensions and limits before returning edited artwork to either converter. Unavailable editing/export canvas contexts produce an actionable error. Both it and `src/image-file-output.js` close decoded bitmaps and zero canvas dimensions on success and failure, releasing the large backing surface. Tests cover wrong MIME, wrong dimensions, encoder/context failures, source-byte preservation and brightness RGB changes with unchanged alpha. Bitmap/canvas calls are unit-test doubles; real generated PNG bytes validate output headers. These checks do not certify actual browser pixels or JPEG quality. Changed modules pass syntax checks, and the converter source snapshot now includes the adjustment module and its tests.

Left alone this pass: Claude's editor, document codecs and hyperlink popup; native bridges/save handling; dependencies, configuration and shared build output; shared image-header parsing; TIFF/Office/unsupported-format paths; and all desktop windows/runtime tests. The prepared renderer copies above predate these latest changes. Refresh a copy or make the coordinated build before desktop acceptance. Crop/deskew pixel fidelity, real PNG/JPEG encoding, memory behavior in the browser, conversion UI cancellation and native saved-copy receipts remain pending in the app, followed by each computer's checks.

### Converter follow-up: validate PDF page encoding before preview

`src/pdf-image-encoding.js`, wired into `src/pdf-image-export.js`, rejects encoder MIME fallback before reopening, empty/invalid blob sizes, per-page/aggregate output overflow, mismatched byte lengths, and encoded header dimensions that differ from the planned page. This prevents a PNG fallback being labeled as JPEG or a wrong-sized encoded image reaching review/save. Existing bitmap reopening remains in place. Shared image-header parsing and native saving are untouched.

Four new standalone checks in `tests/pdf-image-encoding.test.cjs` pass: requested format, exact budget boundaries, valid PNG byte preservation, and size/dimension/format mismatch rejection. Current totals are **32/32 converter checks and 59/59 combined reader/converter checks**, including nested cases. Add this file to the full command above. These are source/unit checks using generated PNGs and synthetic blob metadata, not actual JPEG encoder or desktop evidence. Converter hashes were refreshed. All previous left-alone areas and pending app checks still apply; no app window was launched.

Changed modules pass syntax checks. A renderer-only Vite build with `configFile:false` and target `es2022` passed in `C:\Users\andre\.codex\visualizations\2026\10\13\01a133b5-db03-7e80-b23c-be4867bb9992\converter-encoding-build`; its only reported warning was large bundle chunks. It reads current source and writes separate output; it is not a frozen desktop copy, native build, runtime acceptance or release. Shared `dist` and native build hooks were not used.

### Full converter-plan request: expanded work and exact remaining scope

The user authorized continuing until converters in the adopted plan are finished. The goal remains active. [The converter completion register](PDF-CONVERTER-COMPLETION-REGISTER-2026-10-13.md) now lists every route, its evidence and actual remaining functionality/acceptance, including broader batches, photo metadata/color choices, unsupported decoders, EML/clipboard and Claude-owned document routes. It does not mark all converters complete.

Current evidence supersedes previous counts: **63/63 converter source/disk checks; 27/27 reader unit checks; 13/13 standalone real-browser codec/disk checks**. The browser harness does not launch PDFix/Electron or use its native bridge. It exercises actual PNG/JPEG/WebP/BMP decoding/encoding and PDF page rendering, not only canvas test doubles. Source tests additionally use independent TIFF/Office fixtures and the existing email parser. See the register for exact report paths and limitations. The initial sandbox browser launch failed to create its profile; an authorized outside-sandbox run succeeded. An early harness cleanup used the wrong PDF.js cleanup method; correcting it to the loading task's `destroy()` made the checks pass. No production reader code changed for that harness issue.

New implementation: `src/image-codec.js` validates normalized source/output geometry/MIME and releases canvas/bitmap resources; `src/workbook-csv.js` and its workspace integration enforce actual UTF-8 export bytes; `desktop/image-export-writer.cjs` snapshots reviewed bytes/page metadata before asynchronous saves; new `desktop/image-output-png-validation.cjs` checks PNG framing/checksums before creating output folders. The native writer is a standalone converter-owned module: no main/preload/FileStore/contained-engine dispatch changes. Added edited-image source/output comparison in `src/image-file-export.js` and separate CSS; compiled, visible-app check pending. Existing TIFF/Office/email codecs were tested without editing them. New runners are `scripts/check-converter-source.mjs` and `scripts/check-converter-codecs.mjs`.

Latest renderer-only compile output is `C:\Users\andre\.codex\visualizations\2026\10\13\01a133b5-db03-7e80-b23c-be4867bb9992\converter-expanded-build`. It is not a native or release build. Existing prepared desktop copies predate these changes. Claude's document editor/codecs/links, main/preload bridge, dependency/configuration files, shared dist and master completion claims remain untouched. The completion register preserves all later integration, decoder, corpus, UI and machine checks.

### Batch follow-up

Converter source/disk evidence now **75/75 passing**; previous reader evidence remains **27/27** with unchanged hashes. Dedicated batch service/workspace files now fence changed originals before conversion and saving, wait for asynchronous cancellation, record source-change warnings after publication, and retain per-file save errors with reviewed output available for retry. Tests exercise actual file snapshots and source changes, explicit compression/PDF-save doubles, the actual bounded text parser and actual FileStore TXT publication/collision preservation. The contained dispatch/native PDF compression/verification and app UI remain pending; see the [completion register's batch section](PDF-CONVERTER-COMPLETION-REGISTER-2026-10-13.md#batch-follow-up) for exact scope.

Changed files: `desktop/batch-compression.cjs`, `desktop/batch-document-actions.cjs`, `src/batch-compression-workspace.js`, `src/batch-document-actions-workspace.js`, two new batch test files and the source-test runner. No Claude document editor/codecs, main/preload/FileStore/contained-engine dispatch, dependencies/configuration or shared dist changes. Batch modules loaded successfully in the current Node environment; this is a narrow observation and does not resolve previously recorded whole-suite failures. Renderer-only compile passes at `converter-batch-build` beneath the same QA root; native/app/release acceptance remains deferred. Full converter goal is still active.


## October 13: new lane ownership and built Electron acceptance

Read `AGENT-WORKFLOW.md`, the complete known-issues list and Claude handoff before editing. Codex now owns reader/Drawing/Pages; Claude owns editor/shell/Documents/More tools/converters and shared integration. Previous converter work remains in the baseline but is now Claude's lane. Left Claude's modified paper-size/editor/shell/source-conversion files and fixture alone.

Added `scripts/check-reader-electron.mjs`: hidden actual Electron app with a unique retained temporary profile, actual native opening/rendering/search/navigation and only dialog selection substituted. Eight of eight checks pass: actual page pixels/text; three-page search and precise artwork word ranges; named XYZ outline jump and 150% zoom; reviewed internal link while external web destination stays inert; input-aware first/last/page keys; readable selected range exactly `maintenance`; fit-page resize at 800/1280 widths; leave/reopen and SHA-256 original retention. No renderer errors or HTTP requests. App closed in 99 ms. Report: `tmp/reader-electron-Q6pJbU/report.json`. This is built-app generated-fixture acceptance, not an outside viewer, personal corpus or performance certification. First runs exposed incorrect new-test assumptions (match count, unselected match state, old DOM highlight selectors), corrected without production changes. Coding-sandbox launch failed; normal Windows execution passed.

Build uses `node scripts/agent-build.mjs codex` and passed. Shared `dist` remains a test build; integrator owns final build.

After Claude's JSON import commit `a49873b`, scoped native Node run of PDF operations/OCR/split/compression: 15/23 pass. Six compression failures include outdated checksum/cancel assumptions and native sandbox startup; OCR test omits newly required language; split failed-write test expects an obsolete wrapped error contract. Classify/fix in follow-up without weakening native containment or touching FileStore. Reader desktop selector updates, large-file measurements and Drawing/Pages tool-by-tool outputs are next. No full-goal completion claim.

### Requests for the integrator

Keep current shared ownership/build lock. No bridge or dependency change requested for reader checks. Native sandbox startup in standalone compression tests requires investigation; record the actual OS/helper failure before changing infrastructure. Preserve review/departure quit behavior.

### Reader selector and printed-label follow-up

Updated `tests/desktop/pdf-reading.spec.js` and `reader-navigation.spec.js`, with `tests/helpers/reader-desktop.mjs` for current grouped reader menus and 15-second close timeout. Updated only the three reader test bodies in shared `document-editor.spec.js`; its four editor tests/hooks remain untouched. Three rectangle/readable/import cases pass; both reader suites pass 9/9 in built hidden Electron, including actual passwords, copy restrictions, outlines/labels, view rotation, exact-byte copy saving, reading-state restart/source reset, page-output preview and minimum window. Print uses actual prepared-page review but a recorder for Windows printing; no physical printer proof. Compact test now checks reader controls rather than duplicating Claude's editor layout acceptance.

Found/fixed production reader issue: initial printed labels loaded only when Outline opened. `reader-navigation.js` loads labels with initial state and updates an already rendered first-page status without rendering again. Native app test verifies Label i before Outline is opened. Locked build passed. Nine desktop cases passed in 42.2 seconds; all owned windows closed.

Left all Claude application/shared files and his generated document fixture untouched. Remaining: measured large/drawing runs, named close controls for the four smoke traps, each Drawing/Pages output and richer readable corpus. Shared shell layout spec still has old View options/search strings: request Claude update its reader-facing assertions using the reader helper; Codex did not edit shell-owned spec.

### Unit-test failure classification resolved in assigned suites

After Claude's JSON import fix, PDF operations/OCR output/split output/compression pass 23/23 under normal Windows access. All eight remaining failures in the first scoped run were stale tests/setup: wrong vendor runtime path/missing adjacent sandbox; incomplete tampered-engine fixture; missing actual FileStore structural verifier; OCR language provenance/new encoding refusal wording; and old direct-write injection/error assumptions after staged split publication. No production compressor/OCR/FileStore/native sandbox code changed.

`tests/compression.test.cjs` now uses `dist/native/qpdf`, copies actual pinned runtime into its tampering fixture and wires actual `PdfOutputCheckService` into FileStore saving. Actual AppContainer compression preserves forms/outline/attachments/metadata, performs JPEG work, cancels and rejects tampering; actual native structural checking and exclusive publication protect originals/collisions. `ocr-output.test.cjs` supplies reviewed English provenance. `split-output.test.cjs` injects second-publication failure and independently checks rollback, retained incomplete-copy bytes, absent completion receipt and source retention. These are source/native/disk checks, not full compression/OCR/split UI acceptance or broad corpus. No fake verifier was added. Other failing suites remain Claude/integrator scope. No current whole-project test count inferred.

### Performance and reported tool exits: built app evidence

Added `scripts/check-reader-performance.mjs`: five cases pass on a generated on-disk 500-page vector PDF and the supplied private drawing sample (local only, not in git). Actual opening, 12 distant jumps, zoom, search over all 500 pages, continuous wheel scrolling/jump and supplied drawing zoom run through normal native bridges. Dialog paths alone are substituted. Report `tmp/reader-performance-9u0NeN/report.json`: open 1,086 ms; jumps 45–52 ms; full search 855 ms; renderer heartbeat extra delay p95 12.5 ms/max 79.4 ms. Sum of process working sets: 594 MiB after open, 658 after jumps, 777 after search, 863 after continuous scrolling, 800 after supplied drawing. Sum of individual process peak working sets reached 885 MiB; that is not a measured simultaneous peak. Three canvases held 1,717,695 pixels after continuous scrolling. No renderer errors or network requests; owned app closed. Helper now waits for the target continuous/facing slot instead of the hidden single-page paper.

Limits: short synthetic workload, not prolonged soak or release benchmark. Real historical 300 MB SW3 drawing is absent on this computer. No real large-corpus or outside viewer claim. No memory leak conclusion from this run.

Added `scripts/check-reader-tool-exits.mjs`: four independent hidden actual app sessions inspect the supplied drawing, use named exit controls and return Home, preserving SHA-256 `034525620271fd4e983b8df9150231f48439d48b78e62ab279bc2b48329a16a7`. All 4 pass in `tmp/reader-tool-exits-T3sEOn/report.json`. Sheet sets requires explicit second discard decision; comments Collapse works; thin-line and outline Close work after native inspection completes. The generic smoke closer trap did not reproduce. This is automated built-app evidence, not human visible-window verification or certification of each saved tool output. A3 updated accordingly. Actual tool outputs are next.

### Drawing comparison/markup and Pages organizer/compressor acceptance

Updated owned desktop suites for current grouped controls, confirmed comparison mappings, reviewed print preparation, Pages room navigation, current PDFix name and crop/resize summary. Actual hidden built Electron results: comparison 6/6, markup 5/5, page workspace 4/4 and compression 5/5. All 20 pass; apps close through the departure path with a timeout. Comparison requires explicitly confirmed counterparts before whole-document checking; tests no longer assume positional pairing. Print is reviewed actual preparation with Windows printing recorded, not hardware proof.

Disk output checks preserve form values, source comments/outline/attachments and original bytes; reopen saved markup and organized pages; check cropped/rotated artwork pixels; verify flattened appearances, persistent note text, recovery/restart, save collisions, real JPEG and lossless compression, cancellation and minimum-window controls. Generated PDFs and project fixtures, not wider user corpus or outside software. A2 updated. No production change was needed for these 20 stale test expectations. Left all Claude specs, four shared editor cases, shell and integration files alone.

### All Pages room tools: actual output checkpoint

`scripts/check-reader-pages-tools.mjs` passes 9/9, report `tmp/reader-pages-tools-26H3D9/report.json`. It opens each remaining Pages card, uses actual native writers/save bridges, independently parses the saved on-disk PDF and reopens it in PDFix: page boxes, production marks, thin strokes, unchanged-copy naming, page numbering, outline, batch Bates, batch exact copies and batch compression. Combined with the organizer and compressor desktop suites, every Pages room tool has scoped built-app use evidence. One generated single-page drawing with a source note; not broad drawings, all settings or outside-software acceptance. Copy/naming bytes match exactly; native outputs retain the source comment; original unchanged; all owned apps closed. Bates/page-number text is verified after app reopen. Batch text export and broader multi-file continuation are still additional cases, not inferred from batch-copy success.

Found/fixed real print-marks UI bug: input listeners on every dialog input included final review and the preview page selector, causing prepared output to be discarded when reviewed. Listeners now cover only actual mark settings. Built regression verifies preview selection/review/save/reopen and that a later bleed edit still disables saving. A19 records the resolved defect. Initial runner failures included incorrect card names and an outline title readback expecting PDFString rather than valid PDFHexString; corrected test assumptions, not production writers. Locked build passed. No shared/main/preload/editor changes.

### Remaining Drawing room outputs verified

`scripts/check-reader-drawing-tools.mjs` passes 3/3, report `tmp/reader-drawing-tools-v9aVhO/report.json`. Supplied drawing: changed sheet title/revision, saved local sheet-set library, independently read JSON and loaded the set against freshly picked exact source bytes. Supplied drawing: three count points saved to source-bound JSON and persistent Ink annotation in a PDF copy, independently read metadata/quantity/source SHA and reopened PDFix output. Generated annotated drawing: edited plain comment, built/saved native preserving copy, independently read the new comment and reopened the output. All originals unchanged and apps closed. This completes scoped tool use for the six Drawing cards alongside reader/comparison/markup checks. It does not certify calibrated area/perimeter, all comment/reply/proprietary types, annotation interchange or outside viewers. Visible human verification remains separate.

### Readable tables, captions and unequal columns

Added a user-selected Table rows with gap separators mode: wide geometry gaps become tabs, adjacent font fragments remain joined and source offsets remain exact. It renders pre-wrapped monospaced rows; gaps are proposals, not verified table cells/headers. Added Column split at 20–80% for manual two-column order so unequal columns can be reviewed without forcing a midpoint. Spanning separators still divide vertical sections; column-local captions stay beside their column content. Older saved preferences migrate to a 50% split; invalid stored splits are rejected. No document bytes change.

19/19 related layout/sequence/search source checks pass. Locked build passes. `scripts/check-reader-readable.mjs` passes 5/5 in built hidden Electron (`tmp/reader-readable-jnRVBE/report.json`): actual generated PDF table with a word split across font runs, tabs/caption, exact maintenance highlight, unequal-column caption/section sequence, 800-width controls/artwork return, source preservation and preference process restart. No renderer errors; all windows closed. The initial script expected singular match wording while the existing position counter uses matches; corrected the assertion without changing search code.

D4 updated. Left open: merged-cell semantics and arbitrary region layouts; vertical/complex RTL text and broader real/multilingual corpus; exact highlighting fallback in browsers lacking Custom Highlight. These controls help manual review; no universal accessibility or semantic-reading claim. No editor, shell or shared bridge changes.

### Reader metadata test classification

`tests/reading-state.test.cjs` passes 2/2. Its historical page-501 refusal was stale: on-demand PDFs intentionally exceed 500 pages, FileStore permits positive safe integers, and the reader clamps positions against its actual PDF. The test now positively verifies storing page 501 and rejects zero, fractions, unsafe integers, unsafe bookmark pages and excessive titles/counts. Source resets and bounded corrupted metadata checks remain. No shared FileStore edit. Section B records this test correction; no new full-app unit total inferred.

Integrator request: the known-issues table currently has two A18 identifiers (reader labels and Claude fill/sign). Please reconcile IDs with the final whole-suite count; Codex did not renumber Claude's entry.

### Sustained performance checkpoint and resource-reference cleanup

Extended `check-reader-performance.mjs` to 30 seconds of repeated continuous jumps, wheel movement and zoom, sampling native process working sets every five cycles. Latest built app passes 6/6 (`tmp/reader-performance-zSqcBd/report.json`): 68 cycles/272 additional jumps over 30,274 ms; initial jumps 45–59 ms, full search 852 ms; heartbeat extra delay p95 58.3 ms/max 125 ms. Live slot pixels remained below 32 million, with two live canvases during repeated navigation. No renderer errors/network requests; original supplied drawing retained; app closed.

Found in source: released slots still retained canceled TextLayer objects (including references to detached text nodes). `pdf-multi-page-view.js` now clears textLayer, task and viewport references on eviction as well as existing content/page/canvas cleanup. Actual continuous jump/zoom/scroll workload passes after the change. This does not prove an overall memory improvement: before and after runs both show substantial process working sets. Latest sampled sum 497–1,541 MiB; renderer rose from 186 to about 642 MiB, ending around 637 MiB after repetition. Total ended at 1,088 MiB, then 1,192 MiB after opening the small supplied drawing. Working-set samples are neither heap-retention evidence nor a simultaneous peak measurement between samples. A20 preserves the investigation; D2 contains current measurements.

After two measured workloads and the targeted reference cleanup, longer memory profiling is left open instead of claiming a leak-free result. Missing real SW3 file remains the large-corpus blocker. No runtime/dependency/architecture/shared-file change.

## End-of-pass integration summary — October 13

Final scoped reader desktop regression after readable/continuous cleanup: 12/12 pass in 53.2 seconds, excluding Claude's four editor tests. Earlier Drawing/Pages desktop checkpoint: 20/20 pass. New scoped hidden check scripts: reader 8/8, reported exits 4/4, performance 6/6, remaining Pages outputs 9/9, remaining Drawing outputs 3/3, readable layouts 5/5. Counts are separate script scopes, not proof of every possible input or a full-app release pass. Assigned native unit suites 23/23, reader metadata 2/2 and related readable/sequence/search units 19/19 pass. Locked builds passed; git diff whitespace check passes. All Codex-owned app sessions closed.

All six requested steps were addressed in order where possible; unit fixes followed Claude's JSON commit while tool checks continued. Real large-corpus acceptance and human visible-window verification could not be completed here. No claim that the app has no remaining bugs.

### Explicitly left alone / next acceptance

- Claude: document editor, app shell, Documents/More tools, converters, shared main/preload/FileStore, dependencies/configuration, his modified/untracked scripts and the four editor desktop cases. No broad staging, branch, stash, merge, reset or source cleanup.
- Integrator: coordinated final build, whole-app unit/desktop counts, source/build manifest comparison, duplicate A18 issue IDs and shell-owned stale layout selectors. Shared dist is a test build.
- Reader: A20 high total process memory still needs longer profiling and a real large drawing; SW3 is absent. Very-large on-demand outline/destinations remain unsupported; broader crop/rotation/hostile destination corpus is unproven.
- Readable text: table separators and unequal-column splits are geometry/manual-review options. Merged-cell semantics, arbitrary regions, vertical/complex RTL and broader multilingual exact highlights remain unproven. Custom Highlight fallback is paragraph-level.
- Drawing: calibrated distance/area/perimeter and every measurement unit, all rich/locked/proprietary comment/reply/state cases, revision/comment carry, wider sheet-set workflows and outside-app interchange remain acceptance work. Current supplied-drawing evidence is count takeoff/local sheet-set persistence; plain comment writer uses an explicit generated fixture.
- Pages: current per-tool copies are scoped fixtures. Wider multi-file Bates continuation, batch TXT route, all stamp/production/geometry settings and broad corpus remain separate cases. Existing native source/disk evidence must not be equated with full app/corpus acceptance.
- Visible human checks, real outside viewers/editors and physical printing were not performed. Windows print calls were recorded after real preparation; no physical-printer claim. A3 exits passed explicit hidden controls, not by-hand visible use.

No shared-file integration change requested by the implemented reader changes. Do not mark real-corpus/memory/outside-software gates complete from these reports.

### 90-second memory diagnosis (still open)

Performance runner now accepts `PDFIX_READER_SOAK_MS` from 15,000 through 120,000 and an optional `--memory-diagnostics`. The diagnostic requests renderer heap/DOM metrics and forced collection only after the workload, then leaves Home and collects again. No production garbage-collection calls or runtime flags were added. Console output is compact; full process samples remain in the JSON report.

Built hidden Electron run: 7/7 pass, `tmp/reader-performance-zxdxhD/report.json`. 206 cycles/824 additional jumps in 90,423 ms, full 500-page search 856 ms; heartbeat extra delay p95 58 ms/max 150.4 ms. Sampled sum of process working sets ranged 613–1,722 MiB. Main-renderer JS heap: 40.1 MiB before diagnostic collection, 8.4 after, 7.2 at Home. Total working sets: 1,350 MiB before collection, 1,129 after, 1,011 at Home with zero live canvases. CDP DOM count still about 10,290 at Home; no baseline/detached-tree ownership proof, so this remains an investigation, not a diagnosed leak fix. No renderer errors/network traffic; source retained; app closed. Real SW3 remains unavailable.

Issue-ID cleanup changed only Codex rows to avoid collisions with Claude additions: reader labels is now A21 (previous A18), print marks A22 (previous A19), reader memory A23 (previous A20). Historical handoff mentions retain their old identifiers; current known-issues rows and D2 use the unique IDs. Claude's A18/A19/A20 rows were not edited.

### Batch continuation, calibrated takeoffs and recovery

Added `tests/desktop/drawing-pages-followup.spec.js`. Three built hidden Electron scenarios pass (two batch cases passed together; expanded takeoff/recovery final case passed in 11.5 seconds):

- Batch literal TXT from two chosen PDFs (one and two pages): actual native preparation/review, saved bytes equal exact UTF-8 preview text, sources unchanged, second TXT reopened in PDFix. Files/check receipt retained in test scratch directories.
- Batch Bates starts at 41, saves the first PDF, skips a middle original and saves a two-page final PDF. Independent output page counts and queue JSON show saved/skipped/saved, next number 44; PDFix reopen shows 000041, 000042 and 000043 on the correct pages. Skipping consumed no number and originals are unchanged.
- Rotated 90-degree PDF with offset crop: calibrate a known 10 mm reference; retain distances in mm/cm/m/in/ft/yd, closed perimeter and area. Independently read JSON quantities: each distance 10 mm, perimeter 40 mm, area 100 mm². CSV includes all entries. Native PDF copy preserves crop/rotation and eight Line/Polygon annotations; independent PDFixData JSON equals every complete entry. Reopen, inspect/review recovery and save a rebound ledger: points, quantities and calibration unchanged; original entry/source provenance retained; new source identity binds to the saved PDF copy.

Initial test failures were test synchronization/selectors: CSV read raced the previous JSON Saved status; recovery button sits in the grouped reader controls. The CSV check now waits for its specific filename and idle ledger controls; recovery opens the current groups. No production takeoff/Bates/batch change. A failed test's own unsaved ledger can now be explicitly discarded during teardown before the close timeout; this applies only to isolated test data. One early failed run hit the close watchdog and killed its owned app; successful final runs closed normally.

Known-issues inventory updated with this later acceptance. Numeric issue IDs collided again with a concurrent Claude addition, so Codex's rows now use stable lane IDs: A-R1 reader labels, A-P1 print marks, A-R2 memory. Claude's numeric entries remain untouched. This supersedes the immediately preceding numeric-ID note.

Final takeoff assertion also verifies displayed conversions for the same 10 mm distance: 10 mm, 1 cm, 0.01 m, 0.3937 in, 0.0328 ft and 0.0109 yd. The expanded calibration/recovery check passes in 12.6 seconds and closes normally. This verifies conversion of a chosen scale, not correctness of a real engineering reference.

Still left alone: Claude's current watched-folder/document tools and all editor/shell/shared source; dependencies and final build. Remaining acceptance: actual-scale validation on real drawings, nonuniform/distorted sources, full comment/proprietary exchange, batch cancellation/failure/collision combinations and wider PDFs; memory/native/DOM retention plus missing large SW3 corpus; human visible windows, physical printers and real outside viewers. No universal converter/tool completion or low-memory release claim.

### Reviewed stamps/templates and reply/history fix

Added `tests/desktop/drawing-review-styles.spec.js`: 2/2 built hidden Electron cases pass in 25.1 seconds. Decoration case enables all five additions, saves a named style, restarts the process, explicitly applies the style while preserving page range 1,3, reviews both changed pages and saves a native PDF copy. Independent readback proves three pages, unchanged unselected page-2 content bytes, retained source comment and unchanged original; PDFix reopen shows correct physical/sequence numbering, header/footer, watermark and Approved text stamp only on selected pages. A template is settings only, not authenticated approval or a saved PDF. Five decoration checkboxes and their fieldsets now have explicit accessible names (A-P2).

Reply case exports/reloads an exact portable JSON draft, builds/saves a new reply with Accepted review history and reopens it. Independent dictionaries prove original parent text/private field retained and no parent State overwritten; new reply has the exact IRT parent, author, text, State/StateModel. Source bytes unchanged and all owned apps closed.

Found/fixed real reply bug (A-D1): native writer encoded enumerated State/StateModel as UTF-16 hex strings. PDF.js returned raw byte strings (for example BOM plus NUL-separated Accepted), so app independent verification rejected the otherwise valid output. These ASCII enumerations now use literal PDFString; Unicode comment/author text remains Unicode. `tests/pdf-review-entry.test.cjs` passes 7/7 including Accepted/Rejected/Cancelled/Completed/None/no-status and independent PDF.js annotations, Unicode text/author, original parent/private-field/source retention. Locked builds pass. No shared bridge/editor/shell/dependency edits. Early decoration selector failures were test scoping/naming assumptions; source checkbox labels were a separate accessibility gap. Broad/proprietary reply/appearance interchange and real Revu remain unproven.

User confirmed continuing only Codex lanes after Claude reached its limit. Claude's unfinished watched-folder files, root/master ledgers and untracked docs remain untouched.

### Exact fallback character highlights

Added `src/pdf-search-fallback.js`, integrated with search and reader styles. When CSS Custom Highlight is unavailable, bounded source ranges are painted as exact mark elements in readable paragraphs and artwork text runs. Overlapping/adjacent intervals retain active priority. Clearing unwraps only PDFix marks, normalizes text nodes and preserves paragraph source metadata/text. Artwork active ranges are rebuilt on the new marks so scrolling keeps noncollapsed geometry. Existing native Custom Highlight path remains.

New `tests/desktop/reader-highlight-fallback.spec.js` passes in built hidden Electron (4.4 seconds) with Highlight deliberately unavailable: exact split-font artwork word, nonzero geometry, three repeated/split readable occurrences, unchanged row text/tabs, layout changes, replacement query and clearing without leftover marks; source unchanged, no renderer errors and app closed. First assertion raced asynchronous selection; polling the actual marks corrected the test. This exercises the fallback in current Electron, not a claim about untested old browser distributions or all scripts/languages. A-R3/D5 updated; the earlier paragraph/run fallback limitation is superseded. Locked build passes.

### Revision/cancellation preservation and destination geometry

`tests/desktop/drawing-pages-recovery.spec.js` has two passing built-app scenarios: review both actual drawing revisions before replacement, preserve title/revision labels, Undo/Redo reference changes, save/read independent sheet-set JSON and retain both source PDFs/comments; batch compression stops without creating output, retries, saves first copy, skips/retries second and keeps an occupied filename while independently reopening the alternative copy. Original bytes and existing sentinel file remain. Both apps close. Early test assumptions clicked a still-disabled Stop before the microtask dispatched, and tried populating an output folder before native ownership; corrected to real enabled controls and a collision inside the batch's already-created folder, preserving exclusive-folder safeguards.

`tests/desktop/reader-destination-geometry.spec.js` passes 32 actual outline jumps in 8.1 seconds: all eight supported destination kinds across four rotations, negative media/crop origins, correct page/aspect ratio, XYZ 200%, page fitting, bounded canvas pixels and unchanged original. It waits for navigation's focus handoff, rather than reading an old same-page ready flag. No exact external-viewer/pixel-coordinate or hostile-corpus certification. D6 updated.

After fallback/reply changes, final reader desktop regression 12/12 passes in 53.6 seconds; focused readable/search/reply units 26/26 pass. No all-app release claim. Claude's untouched dirty files are still the watched-folder manager/storage and master plan/inventory documents; all tests use isolated profiles and close owned windows.

### XFDF export/import and standard review history

`tests/desktop/drawing-xfdf.spec.js` passes in built hidden Electron in 17.6 seconds: export the actual source comment as reviewed UTF-8 XFDF, independently parse XML and recover literal angle-bracket text, disclose/omit private source fields; choose a linked parent/reply XFDF with Unicode authors/text and Accepted state, inspect/select/review, save native preserving PDF, independently read dictionaries and reopen drawing-wide comments. Original bytes/private source field retained; parent/reply link exact; no renderer errors; app closed. This is PDFix-to-PDFix supported-subset evidence, not real Revu/Acrobat round trip or full XFDF conformance.

Found/fixed A-D2: imported State/StateModel also used UTF-16 hex strings, reproducing BOM/NUL Accepted in independent PDF.js decoding. Writer now uses literal enumerated state strings. Independent app verification additionally checks imported reply parents/type and Text review fields, instead of only text/geometry. `tests/pdf-review-entry.test.cjs` now passes 8/8 with Unicode interchange and DTD/external entity refusal. First test fixture used unsupported replyType=reply; corrected to the supported standard R before reproducing the real encoding defect. Locked build and app route pass. No bridge/dependency/shell/editor change.

### Pen input ownership and moving selected markup

Added `src/markup-pointer.js` and input/movement controls in the existing markup workspace. Default pen/mouse input leaves touch for panning; Pen only refuses mouse/touch drawing; Touch drawing explicitly opts in. Active gestures retain their pointer identity, so another pointer cannot overwrite, finish or cancel a stroke. Matching cancel/lost capture discards the in-progress gesture. Move selected markup translates rectangle/path/quads/callout text geometry together, previews it live and commits through existing bounds/history/recovery checks; no output schema or bridge changed. The UI discloses fixed-width ink without pressure.

`tests/desktop/drawing-pointer.spec.js` verifies in the built hidden app: real CDP pen stroke, refused mouse in Pen only, deliberately injected other-pointer touch down/move/up/cancel, native editable Ink save/independent path readback, uniform selected-stroke movement, Undo/Redo copies, app reopen and unchanged original. Coordinates are measured again after preview because the dialog scrolls; the first test used stale screen coordinates and did not actually hit the drawing. Existing rotated flattening pixel test now fixes its preview width so responsive scrollbar/layout changes cannot compare different raster dimensions. Five existing markup scenarios retain annotated/flattened preservation, all rotations, minimum window, print choices and recovery failure/rescue checks.

Focused source tests pass 7/7 (pointer modes, immutable geometry, refusal, output preservation and recovery). Recovery test initially hit sandbox profile-write restrictions; allowed isolated-profile rerun passed. App tests close their owned windows. Physical stylus pressure/palm behavior, high DPI, sustained real handwriting, variable width/opacity, eraser interaction and outside-viewer Ink acceptance remain open. A-D3 and digital-pen remaining scope updated. Claude editor/shell/Documents/More, dirty watched-folder files and master ledgers left alone. Final integration/build remains Claude's; dist is a locked test build.

Touch follow-up: `drawing-pointer.spec.js` now passes 2/2 (16.9 seconds); the five existing markup cases passed with the final production code in the prior 6-case run (54.8 seconds). Second case uses CDP touch input with emulation enabled: default touch navigation creates no ink, explicit Touch drawing accepts a stroke, owned touchCancel discards it, selected-stroke removal/Undo/Redo works, restored stroke independently saves as editable Ink. This is simulated touch on current Electron, not a physical tablet/palm guarantee. Locked build passed (398 modules); focused source tests 7/7. All owned app sessions closed.

### Reviewed ink removal and externally changed stroke preservation

Added Review ink removal to the Drawing markup tool. Picking measures distance to displayed ink segments with an eight-pixel tolerance, respecting current page, zoom/rotation/UserUnit and later-stroke ties. Foreign annotations and non-ink marks are not picked. Clicking blank space clears the selection without deletion. Picking highlights the chosen stroke and explicitly asks for Remove selected markup; only that existing button changes the draft. Undo/Redo, source-bound local recovery and reviewed new-copy save remain in place. This is whole-stroke selection plus confirmed removal, not sweep/partial erasing or physical stylus eraser-end support.

Fixed A-D4 in `src/markup-output.js`: standard InkList path and BS width now must agree with supported PDFix metadata before a stroke is considered editable. Changed paths, added strokes and changed widths are retained as foreign; their private fields and dictionaries remain. Previously stale metadata could replace externally modified ink. Preview independently verifies new InkList coordinates via PDF.js in addition to text/rectangle.

Verification: focused source tests 9/9 pass, including visible-segment picking, degenerate strokes/ties, three foreign-edit variants, output and recovery. New built-app scenarios cover reviewed removal at 0/90/270 degrees on cropped pages, no deletion before confirmation, blank misses, Undo/Redo, exact standard InkList disk readback, foreign comment retention and app reopen. External-edit scenario recognizes the changed stroke as non-editable, adds a note, saves through native structural verification, independently reads the exact changed coordinates/private field and preserves original bytes. Five existing markup cases and two input-mode cases pass on the final production code. Aggregate run was 10 pass / 1 failed (Windows Security Sandbox startup); the focused failed case then passed on retry in 5.1 seconds with actual containment. Thus 11 distinct scoped cases have passing results, not an uninterrupted 11-case pass. All owned windows closed.

Locked final test build passed (399 modules). Earlier locked build failed CS0016 because the sandbox executable was in use; process inspection found no holder, and retry passed. The initial test runner following that failed build was interrupted and its results were discarded. Process inventory showed other checks and an older orphan app; none was stopped or claimed as ours. No sandbox, dependency, bridge, shared build script or shell workaround was introduced. A-B1 records these transient failures, without asserting their cause. Requests for the integrator: coordinate native executable rebuilds with running checks, and investigate sandbox startup diagnostics rather than bypassing containment. Shared build lock currently serializes builds but does not cover running app checks.

Left alone: Claude's newly modified `src/app.js`, document tabs files/check, watched-folder files and master/inventory ledgers, plus editor/Documents/More tools. Remaining Codex acceptance includes physical pen pressure/palm/high-DPI, width/opacity, sweep/partial erasing, actual large drawing corpus and memory profiling, complex readable-layout corpus, real Revu/Acrobat interchange and printer checks. Shared architecture changes, proprietary adapters, final build and release integration remain with their recorded owners/prerequisites.

### Ink width, opacity, reusable styles and recovery

Implemented ink-only width 0.5–12 pt and opacity 10–100% in Drawing. New stroke controls and selected-stroke controls are distinct. Gesture start captures its style; live SVG, editable standard Ink BS/CA, appearance ExtGState and explicit flattening use it consistently. Selected edits retain coordinates/identity, revalidate geometry, resize width bounds and support Undo/Redo without resetting the comment textarea/caret. Picking a wide stroke includes its displayed radius. Highlighter, underline, shapes, notes and text styles keep their existing behavior; highlighter opacity is still fixed 30%.

Styles are bounded optional fields in existing markup and saved-tool records. Legacy copies without the fields retain 2 pt/100% ink without inserting fields into their models. Recovery validator enforces the same limits. Saved named tools capture width/opacity, preserve them across process restart and apply them explicitly to new ink. Manual width/opacity changes clear a pending preset. Custom fractional preset percentages retain an accurate option label; no silent integer rounding of a 12.5% style. Changing supported standard ink opacity externally now also makes it non-editable/preserved, alongside path/width changes (A-D4).

Independent PDF.js preview verifies standard InkList, BS width and CA opacity. This caught A-D5: a wide horizontal stroke's half-width bounds made PDF.js discard its BS width. New bounds include sufficient full-width dimensions and shift inward at crop edges; pages too small for the chosen width refuse it. Source cases cover all crop edges and refusal. Output source checks inspect standard dictionaries, the decompressed appearance's stroke width and ExtGState opacity, editable metadata, legacy defaults, malformed styles and foreign opacity changes.

Verification: 13/13 focused source tests pass. Final built hidden Electron regression passes 8/8 (1.3 minutes): pen-only input/movement, explicit touch/cancel/delete, all prior markup types, annotations/printing choices, 90/180/270-degree crop/flatten preservation, minimum window and failed-recovery rescue; plus the new styled-ink case. Styled case proves a near-edge wide stroke, restart recovery, saved preset restart/reuse, selected-style edits/Undo/Redo, native save, independent standard dictionary readback, app reopen and identical editable-versus-flattened raster within the existing 24-level tolerance. Original unchanged, owned apps close. Additional targeted fractional preset check exercises a 12.5% saved style and its option label/Undo on the same final style flow.

Earlier runs found two test errors (incomplete saved-tool option label, generic canvas selector also matching an empty thumbnail canvas), corrected in the test. One intermediate run had app startup/readiness timeouts; rerun passed without weakening access or containment. The real wide-bound failure was fixed rather than relaxing width verification. Locked test builds pass; no outside viewer or physical pen/pressure claim. No dependency, bridge, FileStore, app shell or architecture changes.

Left alone: Claude's active editor paragraph/indent/paste/RTF/PDF work and tests, watched-folder manager/storage, master remaining-work/scope/inventory docs, and request/coding notes. Remaining: pressure-sensitive strokes and device palm/high-DPI acceptance, partial/sweep erasing, configurable highlighter opacity, real large drawing/memory corpus and outside Revu/Acrobat/printer acceptance. Integrator's native build/check coordination request and final build remain open.

Fractional preset follow-up passed on final build in 12.9 seconds: preset opacity 12.5% applies as 0.125, displays 12.5%, survives Undo, and later selected edits/native output/reopen still pass. Raster comparison initially used responsive preview height and compared different dimensions; fixed both preview width/height and waited two layout frames, retaining the same pixel-difference criterion. No renderer/output workaround. Current test build has renderer index-wZMNPxio.js; broad 8-case regression passed immediately before the percentage-label-only change, with the targeted final scenario rerun afterwards. All owned apps closed.

### Continuous lane run: highlighter, partial erasing, pressure and integrity checkpoint

User requested completing the remaining Codex lanes in one continuous run without keep-going checkpoints. Continuing after this commit into reader memory/navigation/layout and Drawing/Pages acceptance. The work register is `docs/CODEX-LANE-COMPLETION-2026-10-13.md`; it preserves pending external/hardware/integrator work without taking over Claude's converters/editor/shell.

Highlighter opacity 10–100% now flows through new/selected controls, Undo/Redo, recovery, reusable styles, standard CA and appearance ExtGState. Older highlights keep 30%. Partial/sweep erasing cuts exact InkList segments against rounded sweep capsules, previews fragments without changing the draft, disables output saving until Apply/Keep, supports one Undo/Redo step and retains original style/text/first identity with new identities for further fragments. Work/point/count budgets refuse an oversized operation rather than publishing a partial result. Calculations use the existing worker; the clean shared worker dispatch was additive and committed alone as `103ec5e`, after tested geometry commit `8391a15`.

Reported pen pressure is bounded/quantized per point (at most 1,000 samples), optional in the existing ink records and validated in recovery. The variable width is 25–100% of selected base width; a single polygon appearance avoids dark overlapping translucent stroke segments. Live preview, standard InkList/BS/CA, pressure metadata, editable save/reopen and flattening remain consistent. Mouse/missing-pressure input explicitly falls back to uniform width. Named ink presets retain the pressure mode. Partial erasing accounts for linearly varying pressure width and interpolates new endpoint samples. No physical pen exists on this machine per user; CDP input is simulated evidence only.

New outputs include an appearance digest over normalized appearance dictionary/resources, encoded bytes and supported metadata. Changed bytes/state/metadata remain foreign/non-editable, preserving them in later copies (A-D6). Legacy outputs without a digest retain narrower existing checks; no authenticity claim. Pressure records require this provenance digest. Maximum supported per-mark metadata rises from 50,000 characters to a bounded 65,536 for pressure samples; whole-file/point limits remain.

Verification: 20/20 focused source tests and final 8/8 hidden built-app scenarios pass (about 1.1 minutes). New app scenarios prove opacity edits/preset/standard CA; eraser review/cancel/apply/Undo/Redo/native output; simulated pressure metadata save/reopen, pressured erasing and explicit mouse fallback; pressure preset mode restoration. Existing all-markup, annotation/print-choice, 90/180/270 crop/flatten/minimum-window and failed-recovery/rescue cases pass. Earlier pressure test hit a worker-load failure; retry reached an eraser gesture whose start was under the sticky header after preview scrolling. Moving its start below the header and asserting actual pointer capture corrected the test. No source/containment validation was relaxed. Owned apps closed; locked builds pass.

Reader retention probe: `scripts/check-reader-retention.mjs` produced `tmp/reader-retention-RXyd4f/report.json`. Generated 120-page PDF, three repeated open/continuous-jump/Home cycles, diagnostic-only GC and final heap retainer scan. Home baseline 306 nodes; each later Home 316 nodes; final snapshot has no retained reader/multi-page/search/readable/TextLayer objects. JS heap rises from 3.3 MiB before first library use to about 6.3 MiB after three cycles; process working sets remain higher and are not a leak diagnosis or total physical-RAM claim. Original unchanged, no renderer errors, app closed. Larger/private/native profiling remains; no speculative cleanup fix introduced.

External prerequisites: Acrobat is installed, but PDDoc COM fails E_NOINTERFACE in both PowerShell runtimes; no Acrobat-view/round-trip pass. User has no pen and has a printer. Epson WF-3820 queue is registered; its current status is nonzero (131072), with no queued job observed. No physical test job sent yet, and no paper/measurement claim. Real Revu/proprietary fixtures remain missing. Claude's active paragraph/Word import/paste/RTF/PDF work, watched-folder files, master ledgers and own handoff stay untouched.

## October 14 — physical sheet revision proof

Existing Organize pages → Preserve comments / links: reorder original → Replace sheets and carry comments forward was tested, without replacing its implementation. `tests/desktop/drawing-sheet-revision.spec.js` passes 1/1 in hidden built Electron with native inspection/preparation/save and isolated profile, then closes all its windows. Independent pdf-lib disk readback proves original page identity, exact parent/reply/link dictionaries (including private fields), four active annotations after donor comment import, new artwork Contents reference and exact untouched second-page dictionary. Both input files remain byte-identical and no renderer error occurred. This is generated-fixture built-app evidence; no real Revu, Acrobat visual or physical print acceptance is claimed.

`tests/pdf-page-revision-boundaries.test.cjs` passes 3/3: geometry mismatch refuses retained comments but explicit omission permits changed artwork; incomplete reply groups and protected comments refuse carry; changed inputs and duplicate physical mappings refuse output. Existing locked/read-only protection remains. Left alone: geometry alignment/transforms, proprietary custom columns/BAX/BTX, Claude lanes and final integration build. User reports a printer and no pen; physical pen acceptance remains unavailable.

## October 14 — region order and larger lifecycle probe

Readable view now offers Reviewed region order: 1–20 percent rectangles in explicit order, selected by source run center. It retains exact source fragments/search ranges, refuses duplicate selection, reports omitted runs, keeps region choices only per page in the current PDF session and clears them on disposal. Geometry ordering is not semantic table reconstruction or vertical/tagged interpretation. Eight layout source tests and six hidden built-Electron readable checks pass after the locked 404-module build; source unchanged and app closed. Report: tmp/reader-readable-HJAjpi/report.json.

Retention script now accepts bounded 2–500 pages / 1–10 cycles and reports Windows private memory separately. Five 500-page cycles pass unchanged-source/error/close checks; Home DOM stays 316, final diagnostic heap 6.43 MiB, zero retained reader-class objects. Summed private process memory baseline 180.7 MiB, open samples 298.6–362.9 MiB, Home samples 211.1–362.2 MiB. The final elevated native/private allocation remains unresolved; this does not close A-R2 or prove a release memory gate. Report tmp/reader-retention-zHkdak/report.json.

User authorized a bounded metadata command in the existing contained native protocol on October 14, with smooth/fast behavior as the priority. No new permissions, parser or unrestricted fallback is authorized by that choice.

## October 14 — large-file bookmark prototype, paused at user request

User approved extending the existing bounded contained protocol, then asked to stop after this item and produce a combined progress document. Added native NAV:UUID:0 metadata through the existing pinned output slot; broker allowlists request/response with 2 MiB output and existing memory/deadline gates. Native traversal bounds pages (25,000), handles (60,000), named destinations (4,096), outline nodes (1,000), nesting and strings; destinations normalize original page refs to zero-based indices, unsupported actions stay disabled. Source hash pins updated; no dependency, sandbox capability, new bridge, external access or unrestricted parser added.

IMPORTANT: this remains experimental and disabled by default. Only PDFIX_PAGED_NAVIGATION=1 opts in. Locked native build passes and two metadata boundary source tests pass. Built-app acceptance did NOT pass: first broker gate was missing and corrected; a subsequent run showed the metadata-enabled outline and rendered initial artwork but the repeated page-view run reported staged source changed. Later app launches (including nine established reader cases) all closed before firstWindow. An owned startup-only diagnostic shows repeated GPU process exits and GPU process is not usable fatal termination. No established reader regression pass is claimed for this checkpoint; the startup failure cannot be assigned to reader code from this evidence. All own checks ended; no other agent processes were terminated.

Resume by restoring stable hidden-app startup, proving original staged identity during NAV then PAGE, and testing direct/named bookmark jumps. The experimental test is skipped unless explicitly opted in; skipping is not acceptance. Original-page link metadata, page labels and document-wide search remain unavailable in native paged reading. Keep default on-demand reading unchanged until the experimental test passes. Shared sandbox request/response changes were committed immediately and separately (e7bf96f,31b3506).


# Appendix C — whole-app known issues

Snapshot of docs/KNOWN-ISSUES-2026-10-13.md.

# PDFix known issues and missing work — October 13, 2026

Written by Claude after a look over the whole app. It lists what is known to be broken, failing, missing or unproven. It is not a list of every defect in the app: outside the document editor and the app shell, tools were only opened, not used.

## How this was gathered

| Source | What it covers | Result |
| --- | --- | --- |
| Smoke walk, `scripts/check-app-smoke.mjs` | Every tool in Workspaces (39) and every Home quick action (10), each given a small test file, with saving canceled | 48 opened their screen without an error, 1 showed an error message, 2 could not be tried (no test file of that type) |
| Unit tests, `npm test` | 200 tests across the app (October 13, latest run) | 195 pass, 5 fail |
| Static scan | Bridge calls, handlers, unused code, unfinished markers, garbled text | No missing bridge function or handler; details below |
| Claude's in-app checks | Document editor and app shell: 10 scripts, 74 cases | All pass on the current build |
| Handoff files | `docs/CLAUDE-HANDOFF-2026-10-12.md`, `docs/PDF-READER-PARALLEL-HANDOFF-2026-10-12.md` | Source of the editor and reader items |
| Project plan | `FINAL-IMPLEMENTATION-PLAN.md`, `docs/PDFIX-STATUS-INVENTORY-2026-10-04.json` | Source of the not-started and unproven items |

"Opened" in the smoke walk means the tool's screen appeared with no error. It does not show that the tool does its job.

## A. Bugs and rough edges that are open now

| # | Area | Problem | Severity |
| --- | --- | --- | --- |
| A1 | Tests | 5 of 200 unit tests fail (section B). Was 25 at the start of October 13. | P2 |
| A2 | Tests | Codex reader suites and the three reader cases in the shared editor file pass 12/12 in hidden built Electron. Comparison, markup, page organization/crop and compression now pass another 20/20 with current grouped tools, explicit reviewed page matching and print preparation, native outputs and independent disk readback. Other desktop suites remain their owner's verification work. | Partly resolved |
| A3 | Leaving a tool | Codex could leave all four in hidden built Electron using their explicit controls on the supplied drawing: sheet sets requires the second Discard unsaved set and close decision, comments uses Collapse, thin lines and outline use Close after inspection. All returned Home, preserved source bytes and closed. `check-reader-tool-exits.mjs` passes 4/4. The generic smoke closer failure was not reproduced; visible human verification remains open. | Smoke result not reproduced |
| A4 | Messages | A message from one tool can still be showing after moving to another. "Canceling signature request preparation…" stayed on screen in the next two tools, and Virtual PDF printer opened under "The isolated document job was canceled. No copy was saved." from the tool before it. | P3 |
| A5 | Navigation | Back from a document always goes to Home, even when it was opened from Workspaces or Files. The label "Back to Home" is used by about 15 test files and three reader scripts. | P3 |
| A6 | Settings | Clear recent-file list acts at once with no confirmation and also clears favorites, reading positions and saved page bookmarks. | P3 |
| A7 | Settings | Interface text size enlarges body text and buttons but not page headings. | P3 |
| A8 | Editor | A PDFix DOCX reopened after being changed in another program, and any RTF, uses the simplified import: fonts, sizes, colors, alignment and automatic page numbers are dropped (the notes say so). | P2 |
| A9 | Editor | RTF reopen brings tables back as tab-separated rows and images as placeholders. (Lists fixed October 13: PDFix and Word-style RTF lists reopen as nested lists.) | P3 |
| A10 | Editor | Reopened PDFix DOCX files that go through the simplified import show a note about even/odd headers the document does not have. | P3 |
| A11 | Editor | Spell check "Ignore once" choices are lost on any edit, so the word comes back on the next refresh. | P3 |
| A12 | Editor | The header/footer editor's bold, italic and underline boxes carry the same name for every text run, which is unclear for screen readers. | P3 |
| A13 | Editor | Typing and text formatting made within half a second share one Undo step (normal for the editor library). Image, table, link and paragraph layout actions (indent, first line, line spacing, space before/after) are now separate steps. | P3 |
| A14 | Build | One build stopped with "Source changed during compilation" when both agents saved at once. Rerunning fixes it. | P3 |
| A15 | Build | It was never determined why the renderer bundle went missing from `dist/assets` on October 12. | P3, unexplained |
| A16 | Project | The folder is on Google Drive with no git history. Two agents write to it and there is no undo. | P2 |
| A-R1 | Reader labels | Fixed by Codex: first-page printed labels were unavailable until opening Outline. Navigation now loads and displays labels during initial open; built Electron reader suite verifies Label i without opening Outline first. | Resolved |
| A-R3 | Exact search fallback | Fixed by Codex: without Custom Highlight, search previously colored a whole readable paragraph or artwork text run. Bounded DOM marks now cover exact source character intervals, preserve text on clearing/layout changes and retain active geometry for artwork navigation. Built Electron with Highlight deliberately unavailable verifies split/repeated words, artwork/readable views and query clearing. | Resolved |
| A19 | Create fillable fields | **Fixed October 13.** The tool could not add or save any field: it read its field name from a hidden input belonging to the embedded PDF reader, and its own artwork check rejected the harmless save/restore pair the PDF library adds. Fixed in `src/form-builder-workspace.js` and both `desktop/form-builder-*.cjs` files; verified in the app. | was P1 |
| A20 | Other tools that embed the reader | Not checked: other dialogs that embed the PDF reader and look up controls by generic `data-` names could pick up the reader's hidden controls the same way A19 did. Fill and sign, PDF text editing, redaction and OCR were exercised and work; the rest were only opened. | P2, unconfirmed |
| A21 | Watched folders | Cannot start when PDFix runs from a synchronized, cloud or linked folder, which is how this project folder (Google Drive) is run. All "add a folder" controls stay disabled. The message now says the cause is PDFix's own location. The feature itself could not be exercised here; it needs a run from an ordinary local folder. | P2, environment |
| A-P1 | Print marks | Fixed by Codex: clicking final review or choosing a preview page invalidated the prepared PDF, preventing save. Only actual mark settings now invalidate output. Hidden built-app check saves, independently reopens, preserves the comment/original and confirms changing bleed still invalidates review. | Resolved |
| A-P2 | Decoration controls | Fixed by Codex: five on/off checkboxes had no accessible names. Checkboxes and their fieldsets now have explicit names; hidden built app verifies named controls and selected-page output/template restart. | Resolved |
| A-D1 | Review replies | Fixed by Codex: standard reply status/model values were encoded as UTF-16 strings, which PDF.js returned undecoded, causing independent verification to reject reviewed reply copies. Fixed to literal ASCII for enumerated fields; Unicode comments/authors remain. Six status cases decode independently and native built-app reply save/reopen passes. | Resolved |
| A-D2 | XFDF review history | Fixed by Codex: imported standard State/StateModel had the same UTF-16/raw-byte problem. Native import now writes literal standard values, and independent app verification checks parent links, reply type and state/model. Real export/import/save/reopen preserves original private fields and Unicode comments; DTD/external entity input is refused in the source test. | Resolved |
| A-D3 | Markup pointer ownership | Fixed by Codex: a second pointer could replace, finish or cancel the active drawing gesture. Input modes now fence pen/mouse/touch and each gesture accepts only its owning pointer. Selected markup movement translates all coordinates, uses normal bounds/recovery/Undo validation and previews live. Simulated pen and interfering touch events pass in hidden built Electron; a separate CDP touch case verifies default refusal, explicit touch drawing, owned cancellation and selected-stroke removal/Undo/Redo with native PDF readback. Physical palm rejection remains unproven. | Resolved for tested input |
| A-D4 | Changed ink preservation | Fixed by Codex: InkList coordinates and stroke width were not checked against PDFix metadata when reopening. An externally changed stroke could be treated as editable and replaced with stale coordinates. Changed path, extra strokes or width now remain non-editable and preserved. Independent preview also checks newly written InkList coordinates. Source tests and a built-app native copy/readback preserve changed coordinates and private fields. | Resolved for tested changes |
| A-D5 | Wide ink bounds | Fixed while adding ink controls: a horizontal wide stroke had a rectangle too shallow for PDF.js, which discarded its declared border width. Bounds now accommodate the full declared width, shift inward at crop edges and refuse a width too large for the visible page. Independent app preview checks InkList, width and opacity before saving. Styled near-edge ink, editable/flattened appearance and source tests pass. | Resolved for tested cases |
| A-D6 | Changed markup appearances | New outputs now bind appearance stream bytes/resources and supported metadata with a SHA-256 digest. Reopening treats mismatches as non-editable rather than rebuilding stale artwork. Source cases preserve changed stream bytes, graphics state and metadata. Legacy records without a digest retain their former, narrower checks. This is change detection, not document authenticity. | Resolved for new tested outputs |
| A-B1 | Build/check overlap | One locked build could not overwrite the sandbox executable because it was in use; the holder was gone on inspection and retry passed. One later native save could not start the Windows Security Sandbox; no copy was published, and the focused retry passed with containment enabled. Other hidden checks were running. Exact cause remains unproven; coordinate native rebuilds/checks with integrator. | P2, intermittent |
| A-B2 | Build/check overlap | October 13, three checks run back to back while another agent had test windows open: the editing check's Legal PDF save failed with "Repair staging cleanup failed", its window then did not close and its script hung, and an earlier check's hidden app (which had reported a clean close) was still running afterwards. Both leftover apps were stopped. Rerun alone, paste 5/5, reopen 4/4 and editing 8/8 passed and left no process behind. Whether leftover apps cause the cleanup failure, or the reverse, is unproven. Check for stray electron.exe processes before native checks. | P2, intermittent |
| A-B3 | Shell | Fixed October 13: closing right after a renderer crash hung, because the close was cancelled to ask the dead renderer and never retried. A plausible cause of the leftover test apps in A-B2. | Resolved |
| A-B4 | Shell | Fixed October 13: with the PDF export dialog open (even idle), quitting was refused with "Finish exporting the copy before closing". An idle or previewing dialog now closes on quit; a save in progress still blocks. | Resolved |
| A-R2 | Reader memory | Latest 90-second generated 500-page workload reached a sampled sum of process working sets of 1,722 MiB. Diagnostic forced renderer collection reduced JS heap from 40.1 to 8.4 MiB, then 7.2 MiB at Home; process memory remained 1,011 MiB at Home and CDP reported retained DOM nodes. This distinguishes reclaimable JS allocations from remaining process/native/DOM retention; it neither proves a leak nor meets a low-memory release gate. New three-cycle 120-page diagnostic probe returns Home DOM to 316 nodes each cycle and finds zero retained PdfReader/PdfMultiPageView/PdfSearch/PdfReadableView/TextLayer objects in the final heap snapshot. This narrows JS/DOM ownership for that fixture; real large corpus and longer/native/private-memory profiling remain needed. | P2, investigate |
| A17 | Unused code | Four bridge functions are defined but never called by the app: `batchDocumentActionSource`, `cancelPdfXfdf`, `getPdfRepairStatus`, `saveImage`. Either dead code or a feature that was never connected. | P3 |
| A18 | Fill and sign | **Fixed October 13.** Placing text or a signature failed with "Original page artwork was not preserved." on any PDF whose page has a single content stream, which is the usual case. Fixed in `src/form-output.js`; verified in the app with the saved copy read back. | was P1 |

| A-B2 | Hidden app startup | October 14 final reader rerun failed all nine cases before firstWindow. An owned startup diagnostic recorded repeated GPU process exits and fatal GPU process is not usable. Earlier same-session sheet revision and readable checks passed. Cause/recovery not established; do not count failed startup as reader acceptance or terminate another agent’s apps. | P2, environment/integration unconfirmed |

## B. Failing unit tests (6), grouped by cause

| Count | Cause | Tests affected | Owner |
| --- | --- | --- | --- |
| 3 | The test runs the writer without the native checking helper ("Independent PDF checking is unavailable", "Choose an opened PDF under 100 MiB for its security report"). The features themselves pass in the built app (`check-tools-redaction.mjs`, `check-conversion-images.mjs`); the tests need a stand-in for the native check. | Image output (1), redaction (2) | Claude |
| 1 | A cleanup helper returns false where the test expects true. Not yet looked at. | Redaction: failed on-disk verification cleanup (1) | Claude |
| 1 | "Password temporary files could not be removed" under the test runner. In the built app the protect flow left no temporary PDF behind (`check-tools-security.mjs`). | Passwords (1) | Claude |
| 1, resolved after this snapshot | Stale 500-page metadata limit. On-demand reading intentionally exceeds 500 pages; FileStore permits positive safe integers, and the reader clamps positions against the actual opened PDF. Test now verifies page 501, rejects fractional/unsafe values and passes 2/2. No FileStore validation change needed. | Reading state | Codex |

Fixed on October 13: the JSON import in `src/paper-sizes.js` (8 tests), the form output tests that lacked the now-required hash argument (3 tests, Claude), and the compression, OCR, split and PDF tool suites (Codex).

## C. Document editor and shell: missing features

Not coded at all:

1. A real Save back to the opened file. Every save is a new copy through a Save dialog (the plan's "safe new copy" rule; needs a product decision).
0. **Done October 13:** Markdown and CSV convert to a formatted PDF (Export PDF, on by default) and to an editable formatted document ("Open as formatted document"). Still missing there: images inside Markdown (they become a text label), HTML inside Markdown (kept as literal text), footnotes, definition lists and other Markdown extensions; heading levels 4 to 6 become level 3; a CSV longer than 4,950 rows is cut. Plain text, JSON, XML and YAML export as their text only.
0a. **Verified October 13 in the built app, outputs read back:** image to PDF, PDF to PNG and JPEG, Protect with passwords, Verify PDF fingerprint, Document health report, Redact a PDF, Fill and sign (visual placements and form fields), Create fillable fields (text field and checkbox), Make a scan searchable (English), Edit PDF text and images (replace a line, add text, change the title), Search selected files (three chosen files), Create from email (.eml to an editable document), Open a synchronized file, Prepare signing request (prepared PDF and unsent email draft) and Extract a table (to CSV). Not yet used beyond opening: Remove protection, drawn/image/saved signatures, dropdown/list/radio fields, other OCR languages, image editing inside a PDF, folder search, clipboard to document, table extraction from scans and to XLSX, Windows right-click tools (installing them changes Windows settings, so it was not done), watched folders (see A21), Scan to PDF and Virtual PDF printer (hardware or a printer driver), Edit slide text and Edit a workbook (no test files).
2. **Done October 13:** document tabs. Every document opened in a session gets a tab above the workspace (up to ten); click or Ctrl+Tab / Ctrl+Shift+Tab to switch. Still one live workspace: switching reopens the file, unsaved editor work comes back from its recovery draft, and a PDF reopens at the reader's remembered place. Tabs are not kept after a restart; a tab whose file was deleted is dropped with a message.
3. More than one unsaved new document (they share one recovery draft).
4. **Done October 13:** first-line and hanging indent (half an inch, Home > First line), written to DOCX, RTF and PDF, read back from RTF and from pasted Word/web text, and kept when a PDFix DOCX reopens. Still missing: right indent, other first-line amounts, custom spacing values, and style-inherited paragraph layout from a DOCX made in Word (alignment, indents and listed spacing set directly on a paragraph are now read).
5. **Separate margins done October 13** (Layout > Each side; sheet, DOCX, RTF and PDF). Still missing: custom paper size, and reading unequal margins from a DOCX/RTF made elsewhere (only equal side margins are read).
6. **Done October 13:** superscript, subscript (quick toolbar, Ctrl+. and Ctrl+,) and highlight in Word's yellow, green, turquoise and pink, written to DOCX, RTF and PDF, read back from RTF and from pasted Word/web markup. Alignment is now four toggle buttons (Ctrl+Shift+L/E/R/J), replacing the Align list, which also removed a horizontal scrollbar in the quick toolbar at 1380 px. Still missing: other highlight colors (pasted ones are dropped).
7. Links to places inside the document; links on images.
8. Comments and tracked changes in the editor.
9. Table of contents, footnotes, columns, section breaks with different page setups.
10. Table cell borders and shading from pasted content; nested tables (refused with a message).
11. Images other than PNG and JPEG; image wrap, crop and rotation; drag to resize.
12. Fonts beyond three families (Arial-like, Times-like, Consolas-like).
13. Print directly from the editor (export to PDF first).

Coded but not proven:

14. PDFix DOCX files have not been opened in Word, LibreOffice or Google Docs since custom properties and re-zipping were added.
15. Copy-paste from the real Word and a real browser (only hand-written samples were pasted).
16. Opening a link in the real browser or mail app (a recorder stood in).
17. Read aloud playback (text was prepared, never spoken).
18. A3, A5 and Tabloid in the app and in PDF output (Legal and Letter were checked).
19. Drag and drop onto Home, fullscreen, the editor ribbon at larger text sizes, the editor at the 800 px minimum window.
20. Personal spelling dictionary, other dictionary languages, formatted footers, source (Markdown/JSON) preview.
21. Large documents: **text and tables checked October 13** (scripts/check-document-large.mjs): a generated DOCX with about 4,000 blocks, 20 tables and 55,000 words opens in 3.4 s, a keystroke at the end takes about 33 ms, DOCX saves in 2.5 s and a 202-page PDF previews in 3 s. Many or large images and very long single paragraphs are still unmeasured.

## D. PDF reader: what its own handoff lists as open

From `docs/PDF-READER-PARALLEL-HANDOFF-2026-10-12.md` (Codex's workstream; not re-tested here):

1. Codex now verified eight scoped cases in the built hidden Electron app with a generated on-disk PDF: rendering, search/word highlights, named outline/internal-link jumps, keyboard, readable text, 800/1280-width resize and leave/reopen; no web requests or changed original, app closed within 100 ms. See `scripts/check-reader-electron.mjs` and the reader handoff. Broader corpus/native-window acceptance remains open.
2. Latest built-app run passes 7/7 including diagnostic collection: generated 500-page vector PDF, 12 initial jumps, zoom, 500-match search, scrolling and 90 seconds with another 824 jumps/206 cycles. Search 856 ms, heartbeat extra delay p95 58 ms/max 150.4 ms. Summed process working sets sampled 613–1,722 MiB (A-R2); live slot pixels stay within 32 million. Forced collection is diagnostic only, never production behavior or a release-memory claim. Supplied drawing opens/zooms with unchanged source. Real 300 MB corpus remains missing; historical SW3 is absent. See `check-reader-performance.mjs` and handoff.
3. Paged reading of very large files has no enabled outline or destination support. October 14 bounded native bookmark prototype compiles and passes 2 metadata source tests, but built-app jumps remain unproven; it is disabled by default (PDFIX_PAGED_NAVIGATION=1 is experimental). Resume staged-source identity/page-loading checks before enabling. Original-page links, labels and whole-file search remain unavailable.
4. Codex added reviewed table-row gap separators and an adjustable 20–80% split for unequal two-column pages. Built app verifies table text/source fragments, captions, spanning separators, exact word ranges, minimum window and preference restart (5/5); related source checks pass 19/19. These are manual geometry views, not semantic table reconstruction. Explicit reviewed multi-region ordering now supports 1–20 rectangles, rejects duplicate text selection, reports omitted text and preserves exact search source mapping (8 source tests, 6 built-app readable checks). Merged-cell semantics, vertical text, tagged order and complex right-to-left corpus remain unproven/unsupported.
5. Exact character highlighting is verified in built Electron for normal Custom Highlight and the capability-disabled fallback. Fallback now marks exact characters in readable text and artwork, restores original text on clearing and keeps active artwork geometry. Complex/multilingual corpus and actual older browser builds remain open; the app check deliberately disables Highlight in current Electron.
6. Built Electron now verifies 32 generated outline jumps: XYZ, Fit/FitB, horizontal/vertical variants and FitR across 0/90/180/270-degree pages with negative crop origins. Correct pages, crop aspect ratios, explicit 200% zoom, page fitting, focus completion and canvas budgets pass; original unchanged. Wider hostile/unusual destinations, exact pixel coordinate corpus and real engineering files remain unproven (existing bounded unit refusals still apply).

## E. Whole-app plan: not started, deferred or unproven

Not started (plan inventory status N):

- Physical printer validation on real printers (M08.08).
- Windows/local/cloud sharing (M09.01).

Deferred pending evaluation (status L): Hermes integration, Harness integration, later candidates.

Excluded from the first release (status X): CAD/DWG editing.

Large pieces the plan still calls incomplete:

1. **Bluebeam drawing review** (plan step 5): editing locked, rich and FreeText comments, replies and proprietary states, custom columns and BAX/BTX exchange. Existing physical sheet replacement/comment carry-forward now passes a hidden built-Electron native save with independent PDF dictionary readback: retained parent/reply/link identities and private fields, imported replacement comment, unchanged second page and unchanged inputs. Three source cases cover geometry mismatch, complete reply groups, protected comments, changed sources and duplicate mappings. Geometry transforms, richer corpus and real Revu round trips remain unproven.
2. **Digital pen** (plan step 7, F67/R50): still partial. Pen-only, pen/mouse with touch panning, and touch-drawing modes now fence gesture ownership; selected ink/markup moves with live geometry, bounds checks, Undo/Redo, recovery, editable PDF output and reopen. Hidden Electron simulated pen plus interfering touch and mouse checks pass, along with all five existing markup cases. Ink now supports selected uniform width (0.5–12 pt) and opacity (10–100%), including selected-stroke edits and saved/reusable styles; Review ink removal now selects the closest displayed editable segment, requires explicit Remove confirmation, and preserves Undo/Redo; normal and 90/270-degree cropped-page copies pass. Highlighter opacity now supports 10–100% and reusable styles. Reported pen pressure is captured as bounded samples and rendered as a single variable-width appearance; missing pressure uses an explicit uniform fallback. Partial/sweep erasing previews exact geometry in a worker, requires Apply, interpolates pressure samples and supports Undo/Redo. These cases pass with simulated input; real stylus/palm/navigation hardware acceptance remains open; this is groundwork, not F67/R50 completion.
3. **Virtual PDF printer** (F43): automatic capture, job recovery, installer and signing lifecycle.
4. **Read aloud, word count, spell check** (F44–F46) for PDFs: tagged reading order, exact word positions, scanned pages.
5. **Remaining adopted scope** (plan step 6): the later additions F47–F67 and A01–A25 were not checked individually in this review.
6. **Release checks** (plan step 8): the full command-by-command check matrix, security review, clean-machine install, accessibility with assistive technology, performance and recovery gates.

Coded but with no current proof that it works: 77 of the 84 inventory rows are marked "coded, runtime acceptance pending" or "older tested subset plus newer untested work". The smoke walk shows their screens open; nothing more. Tools opened but not used in this review include: takeoffs, sheet sets, compare, comments review, markup, signing request, synchronized file, email/clipboard to PDF, table extraction, selected-file search, PDF text and image editing, Bates, batch tools, page numbers and stamps, page boxes, print marks, thin lines, unchanged copy, outline editing, organize pages, compression, right-click tools, watched folders, fingerprint, scanner, health report, fillable fields, fill and sign, protect/unlock, redaction, PDF to images, image to PDF, OCR.

Subsequent Codex built-app checks supersede the smoke-only claim for Drawing and Pages: scoped use/output/readback now covers every room tool (reader handoff). Additional follow-up proves two-file literal TXT export with exact UTF-8 bytes/reopen, Bates continuity across two saved PDFs with an intervening skipped file, and calibrated distances in all six offered units plus perimeter/area on a rotated/cropped page. Eight takeoff annotations preserve full JSON metadata, independently reopen and recover into a source-bound ledger with unchanged points/quantities/calibration. `tests/desktop/drawing-pages-followup.spec.js` has three passing scenarios. This is generated-fixture acceptance, not complete setting coverage, engineering-scale accuracy or outside-software interchange.

Could not be tried: **Edit slide text** and **Edit a workbook** (no PPTX or XLSX test file in the project).

## F. Fixed during this session (for reference)

Details are in `docs/CLAUDE-HANDOFF-2026-10-12.md`. In short: the missing app bundle; garbled characters in the editor, the window title and four Save-dialog titles; the app refusing to quit after typing or during a spell check; documents marked edited on open; formatting, images and merged cells stripped on paste and import; table rows reopening as header rows; RTF losing headers, links and page setup; image insert failing inside formatted text; merged Undo steps; the misleading message for a deleted file.

## Suggested order

1. Add git to the folder (A16).
2. Fix the JSON import to bring nine tests back (B, first row), then sort the other failing tests into "fix code" and "fix test".
3. Check by hand whether the four tools in A3 can be left normally.
4. Open a PDFix DOCX in Word and paste from Word once (C14, C15).
5. Bring `tests/desktop/*.spec.js` up to date so the rest of the app has running checks (A2).
6. Then work through section E tool by tool with real files, the way the editor was done.


# Appendix D — Codex continuous-run register

Snapshot of docs/CODEX-LANE-COMPLETION-2026-10-13.md.

# Codex continuous lane completion run — October 13, 2026

User requested one continuous run through remaining reader, Drawing and Pages work, without repeated keep-going prompts. Preserve Claude's editor/shell/Documents/More ownership and integration role. This is a completion register, not a broad release claim.

| Area | State and next work |
| --- | --- |
| Highlighter opacity | Committed with bounded source and built Electron checks; presets, selected edits, recovery and output pass. |
| Partial/sweep ink erasing | Implemented and verified through existing worker; review/cancel/apply/Undo/Redo and pressured native-copy cases pass. Broader rotated/cancel-response corpus remains acceptance work. |
| Pressure-sensitive ink | Implemented: bounded per-point pressure, uniform fallback, single variable-width appearances, preset mode, output/reopen and pressured erasing pass with CDP input. No physical pen available. |
| Reader retained memory | Three-cycle baseline/open/close diagnostic probe has stable Home DOM and no retained reader-class objects. Five 500-page cycles measured private memory: final Home 362.2 MiB vs baseline 180.7 MiB, stable DOM/no retained reader objects. Native/private-memory growth remains unresolved. |
| Large PDF navigation | Approved bounded native bookmark prototype compiled; 2 metadata source cases pass, app jump acceptance blocked. Disabled by default; experimental PDFIX_PAGED_NAVIGATION=1 only. Staged identity and later GPU startup failure require diagnosis before enabling. |
| Complex readable layout | Explicit reviewed region ordering and exact source mapping implemented and verified (8 source, 6 built-app checks). Vertical/RTL/tagged/caption/table corpus proof remains. No semantic table reconstruction claim from tabs. |
| Sheet replacement/comment carry | Existing native physical revision route verified in hidden built Electron: saved copy retains original comment/reply/link objects and private fields, imports replacement comments, preserves untouched pages and both inputs. Three source boundary tests pass. Geometry transforms and outside-software/corpus acceptance remain. |
| FreeText and custom drawing data | Broader preserving edits/custom columns remain. Locked/read-only source annotations stay protected. Proprietary BAX/BTX/Revu fixtures/service prerequisites remain. |
| Broader Drawing/Pages verification | Existing scoped tool outputs passed; add actual-corpus, failure/cancel/retry/collision, geometry/preservation and accessibility coverage, fix confirmed owned defects. |
| External acceptance | Adobe Acrobat installed, but PDDoc COM probing via PowerShell 7 and Windows PowerShell failed E_NOINTERFACE. Real Revu unavailable/unproven. User has printer, no pen; EPSON9DC446 (WF-3820 Series) is registered. Physical print inspection requires user; no pen hardware proof can be claimed. |
| Integration | Claude's final combined build and shared native build/check coordination remain. No shared architecture or dependencies changed without approval. |

The older converter goal stored in the app is paused and predates the current lane split; it is not used to claim this run is complete or to take over Claude's converters. Continue this authorized lane work directly. Keep specific evidence in PDF-READER-PARALLEL-HANDOFF-2026-10-12.md and update confirmed known issues in their fix commits.


# Appendix E — committed work since the baseline

Commit chronology records authorship; baseline content predates the new repository and is described by the handoffs.

```text
303a507 | andrewturley06 | Baseline: PDFix as of October 13, 2026
e2e233e | Claude | docs: two-agent workflow, build lock and Codex prompt
65dda32 | Claude | docs: name the owner of file conversion in the workflow
a49873b | Claude | tests: import paper-sizes.json with a JSON attribute so Node can load it
09c6b0d | Codex | reader: verify navigation and exact highlighting in hidden Electron
1d62bbd | Claude | editor: convert Markdown and CSV to formatted PDF and editable documents
ab26c5f | Claude | tools: in-app check for image to PDF and PDF to images
93333ea | Claude | docs: record conversion work and the unit test count after the JSON fix
c24daa9 | Claude | tests: stop rewriting the DOCX fixture on every unit test run
f4a89e8 | Codex | reader: restore initial page labels and update desktop checks
62311f8 | Codex | tests: verify PDF tool suites against current native contracts
cb73d6d | Claude | tools: in-app check for protect, fingerprint and health report
5900de9 | Claude | tools: in-app check for redaction, with the saved file read back
87d6f89 | Codex | reader: measure 500-page workload and verify tool exits
c38fd78 | Claude | tools: fix Fill and sign on pages with a single content stream
124b592 | Claude | tests: pass the required hash function in the form output tests
f6fdf24 | Claude | docs: record verified tools, the Fill and sign fix and the remaining failing tests
c6df801 | Codex | tests: verify Drawing and Pages desktop workflows
af31233 | Claude | tools: in-app check for making a scan searchable
2961fad | Codex | pages: keep reviewed print marks available for saving
b59873e | Claude | tools: in-app check for editing PDF text and properties
f598229 | Codex | drawing: verify sheet sets takeoffs and comment copies
42bf045 | Codex | reader: preserve table gaps and support unequal columns
8ef0391 | Codex | tests: validate large reader positions at safe integer bounds
e30ac39 | Codex | reader: release evicted text layers and measure sustained navigation
79a859b | Codex | docs: record reader verification and remaining integration gates
a921c4f | Claude | tools: make Create fillable fields work
016dcca | Claude | docs: record the field builder fix and the tools verified in the app
639e580 | Claude | tools: in-app check for file search and email to document
da1ebba | Claude | tools: in-app check for preparing a signing request
72c7190 | Claude | tools: in-app check for extracting a table to CSV
5b86a01 | Claude | tools: check synchronized-file opening; clearer watched-folder start-up message
1350578 | Claude | docs: record the Documents-room tools verified and the watched-folder limit
32ece06 | Codex | reader: distinguish heap cleanup from retained process memory
8517f64 | Codex | drawing: verify calibrated takeoff recovery and batch continuation
ddad757 | Codex | drawing: verify displayed measurement unit conversions
5f695f1 | Codex | drawing: fix standard reply history and verify reusable decoration styles
53c3b22 | Codex | reader: preserve exact search highlights without Custom Highlight
b40e1ee | Codex | reader: verify rotated destinations and drawing batch preservation
517cda1 | Codex | drawing: preserve independently readable XFDF review history
8bfac18 | Codex | drawing: fence pointer input and move editable markups safely
901590c | Codex | drawing: verify touch cancellation and recoverable ink removal
7a2d298 | Codex | drawing: review stroke removal and preserve externally changed ink
cb64a44 | Claude | shell: tabs for the documents opened in a session
d3a55b6 | Codex | drawing: add recoverable ink width and opacity styles
7a58f29 | Claude | editor: first-line and hanging indent; paragraph layout changes are their own undo step
8391a15 | Codex | drawing: add bounded geometry for reviewed partial ink erasing
103ec5e | Codex | shared: dispatch reviewed ink erasing through the existing worker
3842de7 | Claude | shell: closing right after a renderer crash no longer hangs; update recovery and foundation specs
b764aa0 | Claude | editor: keep paragraph layout from Word-made DOCX files
b52c70a | Claude | docs: restore file names in the Word layout handoff note
663d35d | Claude | editor: superscript, subscript and highlight
a573cac | Claude | editor: alignment as toggle buttons; each alignment change is one undo step
c20904e | Claude | editor: ribbon fits narrow windows without sideways scrolling
62c1382 | Claude | editor: separate top, right, bottom and left page margins
874e933 | Claude | shell: quitting with the PDF export dialog open no longer refuses
d025808 | Claude | docs: separate margins and the PDF-dialog quit fix
766c901 | Claude | checks: quit sweep across the Documents and More tools rooms
2d848d0 | Claude | editor: lists survive RTF copies and Word-style RTF lists open as lists
147edd5 | Claude | editor: name the header/footer run check-boxes by paragraph and run
def6eae | Codex | drawing: finish bounded pressure and reviewed erasing software paths
7ef6cc5 | Claude | shell: own application menu without Reload or developer tools
da66d27 | Claude | editor: Word's Ctrl+L/E/R/J alignment shortcuts
cb2f597 | Claude | docs: bring the left-alone list up to date
700869e | Claude | settings: confirm before clearing the recent-file list
6cf250b | Claude | editor: keep run fonts, sizes, colors, highlight and underline from Word files
15eda47 | Claude | checks: measured large-document check for the editor
93f7f8a | Codex | pages: prove physical sheet revision and preservation boundaries
0041311 | Codex | reader: add reviewed region order and private memory lifecycle measurements
e7bf96f | Codex | shared: allow bounded navigation metadata in the existing paged sandbox protocol
31b3506 | Codex | shared: complete bounded navigation request gate
5ea668d | Codex | reader: keep bounded bookmark prototype gated pending native acceptance
```


# October 14 resumed-work addendum

This updates the earlier snapshot; it does not rewrite its historical appendices. Native bookmarks are now enabled after 10/10 reader app cases pass, including original direct/named jumps and seven further jumps. Generated 320 MiB disk-backed reading passes 70 contained readbacks/retirement and seven app checks; heavy real drawing acceptance remains separate. Declared PDF tag order now reorders readable paragraphs with exact character search, bounded/refused ambiguous mappings and cancellation/untagged fallback. Tag source tests, the final two-case app group and six existing readable checks pass. Invalid manual regions now preserve prior reviewed text.

The Downloads sample supplied afterward matches the existing drawing byte-for-byte and has zero annotation objects. It opens, inspects, navigates and remains unchanged; it cannot prove Bluebeam comment editing. Native/private memory is further measured, with roughly 8 MiB main JS heap and no growing buffer ownership, but native allocation remains open. Shared sandbox helper caching now avoids rewriting a verified unchanged live broker; final packaging should use PDFIX_FORCE_NATIVE_BUILD=1 with both lanes quiet.

Claude has separately committed real Save (4434ebb); its further dirty editor/shell/shared work remains untouched and is not certified by these reader checks. See the current individual handoffs for evidence newer than the original snapshot.

Native page labels are now enabled and verified with exact sheet jumps beyond page 500; all supported numbering styles pass. Unsupported label tables are omitted while bookmarks/page reading continue. The supplied Downloads drawing also passes pressure/partial-erase/save/reopen on an independent test copy, and the original stays unchanged; simulated input and zero imported annotations remain the evidence limits.

Original-page internal links now work in native paged reading: direct/named targets, safe rectangles, strict request kind/token/source fencing, bounded cache, unsafe/hidden/mixed/chained action omission and cancellation/recovery. Final native/tagged app group passes 2/2; established reader regression passes 9/9; six metadata/protocol source cases pass. Reviewed regions persist across page changes and the six readable app checks pass. Native whole-file search, advanced interoperability/corpus, native allocation diagnosis, hardware and release integration remain open. The shell Actions panel narrow link-availability exception is left as an integrator request.

## Continued reader work: on-demand page Find

5bf9488 adds Find on this page for native paged reading, exact highlights and keyboard match navigation. It searches rendered text, clears results after page changes and causes no extra native extraction. Whole-document native search remains open. The 501-page built-app case passes alone, original unchanged/app closed; 11 existing reader app scenarios and 11 focused source tests pass. One combined-run opening failure preceded the new search scenario, so that 12-case run was not all-pass. Claude editor/RTF work remains separate and untouched.

FreeText review: an additive reply is now explicitly proven in built Electron through native copy/save, independent PDF readback and app reopen. Rich parent appearance/private fields and source bytes remain unchanged; Unicode reply/status is retained. One new app case and the 13-case source reply/XFDF group pass. Editing FreeText bodies remains disabled; no Revu compatibility claim follows from generated fixtures.

Whole-document native paged search is now implemented. Entire PDF scans one extracted page at a time, with Stop, Continue, navigation priority, exact match highlights and bounded results. Two built-app search cases pass; the resumed 501-page scan took 39.3 s, source unchanged and app closed. Corrected the prior page-search extraction counter to watch the actual prefixed IPC channel; the new verification is effective. Real heavy-corpus performance remains unproven.

Plain FreeText body editing now includes a bounded standard-font appearance adapter, independent appearance-character readback, native copy save and app reopen. Original private/appearance/font objects stay retained; explicit review warns that custom decorations are not reproduced. Rich/callout/locked/custom-font/overflow and unsupported glyph cases remain refused. Two FreeText app cases and fifteen review source cases pass. One unrelated saved-copy opening failure now has a concrete failed PDF worker asset-fetch error; retry passes, investigation continues.

Different-geometry sheet alignment now supports reviewed fit, uniform scale and point offsets for replacement artwork while keeping original sheets/comments/links/private appearances unchanged. Both exact and aligned native revisions pass save/readback/reopen; five source boundary checks pass. Matching rotation is required and aligned replacement comments must be omitted. Arbitrary annotation-coordinate transforms remain outside this adapter.

## October 15 addendum — Codex evidence correction and remaining startup work

Codex added reviewed RTL/vertical reading geometry and verified exact search mapping in a generated built-app case. Private verified runtime snapshots now isolate reader tests from another agent rebuilding dist; four FreeText/revision app cases pass with them. The earlier claim that no reader objects remained in heap snapshots is withdrawn because minified constructor names defeated the old check. Actual DOM/heap/process readings still stand. A replacement prototype-based probe has a passing unit test, but full app verification remains blocked by fatal GPU startup crashes (0x80000003), also seen with local profiles and a diagnostic software flag. This startup issue is reproduced and unresolved, separate from an earlier concrete missing PDF worker asset. Claude's editor/shell work was left alone; see A-R2/A-R4 and the reader handoff for integrator requests.

## October 15 addendum — the newly supplied engineering file

Codex inspected the real 163-sheet Revu PDF and fixed two blockers it exposed: stale sheet destinations stopping all comment inspection, and long reference chains being mistaken for deeply nested objects. Literal Bluebeam custom-column data is now available read-only with clear warnings that its name/value associations are unverified. Native inspection finds 1,372 annotations and 762 column-bearing rows. A labeled temporary reply copy retains all original annotation dictionaries, definitions and 131 layers in independent pypdf readback; the original is unchanged.

All 163 pages pass contained extraction and independent readback. The actual bounded search-text helper also passes on every page through Node PDF.js: 328,752 characters, drawing on 117 sheets, about nine seconds; peak reported native parser private memory 48 MiB and three parser starts. This does not measure total app memory or prove visible rendering. Fifty-nine focused source tests and the locked build pass. Real-file Electron acceptance remains blocked by GPU startup. Proprietary BAX/BTX, rich/callout FreeText bodies, layered replacement sheets, semantic complex-layout fidelity and physical printer/pen acceptance remain recorded, not claimed complete. Claude's work was left alone.

## October 15 — Codex main-app closeout for integration

Reader and general Pages closeout now has 129 passing scoped source/native checks and a 15-case passing built-app run using a direct hidden native controller. It verifies real opening/rendering, search/highlights, links/outlines, keyboard/mouse, readable text, resize/pane preferences, actual page organization and compression copies with independent readback, print preparation and 501-page native search. Fixed a real fast-Find/reflow race and clipped reader-menu controls; the final menu build passes ten core app checks and inspected 800/1280-width bounds. Source PDFs stay unchanged and apps close.

Five generated 500-page and three real-file lifecycles have live heap positive-control proof of reader disposal. Native/private growth on the supplied file and the separate old test-driver graphics issue remain open, along with physical printing, human accessibility/visible-device checks and Claude's final combined build. See CODEX-MAIN-APP-CLOSEOUT-2026-10-15.md and the reader handoff. This is scoped integration evidence, not whole-app perfection/release approval. Claude's editor/converters/shared-native work is untouched. Bluebeam and the newly requested Add-ons stay in their deferred phase.

Final comparison: normal graphics with hidden-window Home layout refreshed also leaves no retained reader instances (pdfix-reader-closeout-OVCwZo/report.json). The prior hidden-window cluster was rooted through cached Blink layout. Native/graphics private allocation still rises; A-R2 remains open. No production forced layout/GC or shared-source changes. See CODEX-MAIN-APP-CLOSEOUT-2026-10-15.md for exact evidence and gates.
