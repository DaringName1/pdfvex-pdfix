# PDFix feature inventory (release readiness audit, October 25, 2026)

Audit only: no code was changed. Written by Claude from the code, the test files and their recorded results.
Codex's UI work is about half done (owner's estimate), so every UI statement here describes a moving target.

> **Update, October 26** (commit 11ff352, clean copy; see [MASTER-IMPROVEMENT-PLAN-2026-10-26.md](MASTER-IMPROVEMENT-PLAN-2026-10-26.md) sections A–B):
> - **Compress is now Verified:** 9/9 app tests and the robot task pass.
> - Quick edit exists, and PDFs open in it.
> - Full suite 191 pass, 0 real failures.
> - Counts: 52 verified, 12 unverified, 3 partial, 0 failing (development builds).
> - **No row is verified on a packaged build with the new UI, or in Acrobat Reader or Foxit.**

## How to read the status

| Status | Meaning in this file |
|---|---|
| **Verified** | Implemented, and an automated check that **reads the saved output** passed on a development build on or after October 22 (the new-UI period), or a dedicated test of the logic passes today and the app route passed recently |
| **Verified before UI change** | Same kind of proof, but the last pass was October 17–21, before Codex's toolbar/mode changes. The route probably still works; it must be re-run |
| **Unverified** | Code exists and screens open, but there's no current output check, or the only evidence is the coding agent's own progress note, or the real-world part (a real scanner, a printer, another program) was never tried |
| **Partial** | Part of the planned behaviour is missing |
| **Broken** | A current test fails |
| **Not implemented** | Planned, no code |

**Development build vs packaged build.** All "Verified" results below are from **development builds** (`dist/` run
through Electron). Packaged builds were last tested October 19–21 (spare-PC robot runs 3–6, about 2,500 sessions,
99% clean on run 3; install/uninstall on package `d207b695`). **No packaged build containing the new UI has been tested.**

Evidence sources:
- robot = `tmp/user-robot/run-*.json`, 85 local sessions summarised in `tmp/robot-summary.txt` (task, passes/runs, last run date)
- spec = `tests/desktop/*.spec.js`; unit = `tests/*.test.cjs`
- check = `scripts/check-*.mjs`

Date format: "pass 10-24" = last robot pass October 24.

> **Update, October 25 evening:** all 31 robot tasks that last ran before October 22 were rerun on commit 2487a21
> and **all 31 pass**. 21 ran alone; 10 needed a setup step first (an open document or a saved Word copy). Results are
> in `tmp/robot-try-each.json`, `tmp/robot-try-with-setup.json` and `tmp/robot-forced.json`. So every row marked "Verified before
> UI change" or "Tested (old)" below now also passed on the new UI. Rows that are still Unverified are unchanged.

## 1. Core: open, view, save, recover

| Feature | Status | Evidence | Notes / gaps |
|---|---|---|---|
| Open PDF (normal) | Verified | robot "open the sample PDF" 34/34; spec pdf-reading; hostile corpus 18/18 (10-25) | |
| Open damaged / hostile PDF safely | Verified | `scripts/check-hostile-pdfs.mjs` 18/18 (10-25); spec reader-hostile-audit, reader-unavailable | Fixed corpus, no fuzzing; raw engine wording in 2 messages |
| Open encrypted PDF (password) | Verified | spec passwords; robot "remove the password" 4/4 (10-22) | |
| Large PDFs (163-sheet real drawing set, generated 500 pages) | Verified (older) | check-reader-real-paged, reader-large-file; KNOWN-ISSUES A-R7 | Long-session memory A-R2 only partly closed |
| Real engineering drawing pages | Verified | spec reader-real-engineering (fixed 10-25, A1, 10/10 by Claude) | |
| Large scans (up to 100 MP) | Unverified | robot "reader: large scans paint…" 1/3, latest pass 10-25 | A4: flaky, Codex investigating |
| Navigation: pages, zoom, search, bookmarks | Verified | robot "reader: search, jump, zoom and bookmark" 8/8 (10-24); spec reader-navigation | **reader-paged-search and reader-paged-search-all fail 10-25**: they look for a "Find on this page" button that moved to the top-right "Find in PDF"; likely test-only (Codex, rule 1) |
| Readable / reading view, tagged order | Verified | specs reader-reading-view, reader-tagged-order | |
| Text selection and copy | Verified | spec document-editor:25 (A3 fixed 10-25) | Box selection boundary was cutting text until 10-25 |
| Save a copy (new file) | Verified | unit pdf-save-faults, pdf-save-safety, pdf-save-windows-locks; robot "reader: name and save a byte-identical PDF copy" (10-24) | Full disk, locked files, vanished folders, two saves at once |
| Save over the original (with previous version kept) | Verified | unit save-in-place-faults, file-store-save-in-place | |
| Crash recovery of unsaved work | Verified | spec process-kill-recovery (10 cases); robot crash jobs (sign, report, spreadsheet) pass 10-24 / 10-20 | Kill during the **new on-page** Compress/Redact/table saves not tested (test 5) |
| Leftover temporary files after a crash | Verified | unit contained-staging-sweep (10-25); fixed in 087e22b | Fixed today; 4 GB of leftovers were found |
| Document tabs, Home, recent files | Verified before UI change | robot "go Home" 11/11 (10-20) | Home previews/pinned (2.19) not implemented |
| Version history (restore) | Verified before UI change | robot "editor: keep a version… restore it" 2/2 (10-21) | |
| Undo / redo | Partial | robot "undo then redo" 9/9 (10-18, editor only) | Same behaviour in every tool (2.27) not done; per-tool coverage uneven |
| Settings & privacy, version shown | Verified | spec settings-version (10-24) | |
| Print (Windows print dialog) | Unverified | robot "reader: prepare print sheets…" 7/7 (10-24), "editor: print through print preparation" 4/4 (10-20) | Robot stops before the Windows dialog. **Nothing was ever physically printed** (`docs/PRINTER-ACCEPTANCE-2026-10-15.md`: "prepared, not physically printed") |

## 2. The 41 tools in the tool registry (`src/tool-registry.js`)

### View, Comment
| Tool | Status | Evidence | Notes |
|---|---|---|---|
| Read a PDF | Verified | see section 1 | |
| Mark up (highlight, note, line, ink, shapes) | Verified | robot "reader: grouped Comment toolbar saves a persistent note and line" (10-24); "markup: highlight, note, save and reopen" (10-20); specs drawing-* (14 specs) pass 10-25; **markup.spec:19 fails 10-25** (looks for Print in the old place; likely test-only) | Never opened in Acrobat/Foxit apps (only Edge's Adobe engine) |
| Review drawing comments (Bluebeam-style replies, callouts, rich text, XFDF) | Verified | robot callout 7/7, mixed comment 1/1 (10-24); specs drawing-xfdf, drawing-richtext | "refuse a cross-style replacement" 1/3 (A4, flaky) |

### Edit
| Tool | Status | Evidence | Notes |
|---|---|---|---|
| Edit PDF text and images | Verified | robot "change and add text in a PDF" 14/14 (10-24); spec edit-text-on-page | |
| One Text tool (click to type / edit / text box) | Partial | robot "reader: type a Text box on the main page" (10-24); spec reader-text-methods | 2.15 still "doing" (Codex) |
| Make a scan searchable (OCR, 6 languages) | Verified | robot 11/11 (10-24); spec ocr; unit ocr-output | Only English tested with real text; other 5 languages unverified |
| Edit a text document copy (PDF → editable) | Verified before UI change | robot "turn the PDF into an editable copy" 11/12 (10-20) | |

### Fill & Sign
| Tool | Status | Evidence | Notes |
|---|---|---|---|
| Fill and sign (type, click to place, signature) | Verified | robot "sign a PDF with a typed name" 12/12 (10-24); specs forms, fill-sign-click-type | Signing places a picture of a name, **not a certificate signature** |
| Create fillable fields | Verified | robot "add a fillable text box" 17/17 (10-24); unit form-builder-create | |
| Prepare signing request | Verified | robot 10/10 (10-24) | |
| Certificate (digital) signing with a Windows certificate | Unverified | code `desktop/pdf-certificate-signing-service.cjs`; Codex opt-in robot task exists | `docs/CERTIFICATE-SIGNING-PROGRESS.md`: "runtime acceptance pending"; never checked in Acrobat |
| Signed PDFs: refuse to break a signature | Verified | unit pdf-audit-save-routes (48 assertions) | Only synthetic signatures; real signed PDF not tried (test 11) |

### Pages
| Tool | Status | Evidence | Notes |
|---|---|---|---|
| Organize: rotate, delete, extract, reorder, combine | Verified (most) | robot delete 4/4 (10-24), grouped rotate/save 1/2 (10-24); rotate 5/6, extract 4/4, combine 6/6, drag thumbnail 4/4 (10-20) | Rotate/extract/combine: verified before UI change |
| Page numbers and stamps | Verified before UI change | robot 2/2 (10-20) | |
| Bates numbering across PDFs | Unverified | Codex batch robot tasks (`actions-codex-batch.mjs`); spare-PC run 3 had 9 failures in numbering/stamp task | |
| Edit the PDF outline | Verified before UI change | robot 2/2 (10-20) | |
| Page boxes (crop) | Verified | robot "change a crop box" 5/6 (10-24) | |
| Split | Verified | spec splitting; unit split-output | |

### Protect
| Tool | Status | Evidence | Notes |
|---|---|---|---|
| Protect with password / limits / both; unlock | Verified | robot 15/15 (10-24); spec protect-choices, passwords | |
| Redact | Verified | robot "hide a word with Redact" 13/13, "redact on the main page" (10-24); specs redaction, reader-inline-redact; redaction-byte check in `check-compatibility-outputs.mjs` | |
| Remove hidden data (sanitize) | Verified | robot "reader: clean selected private structures" (10-24) | |
| Document health report | Verified before UI change | robot 5/5 (10-20) | |
| Verify PDF fingerprint | Verified before UI change | robot 3/3 (10-20) | |
| Accessibility audit, print preflight | Unverified | Codex opt-in tasks in `actions-codex-remaining.mjs`; no recent recorded run | Say "no conformance claimed" |

### Measure (drawings)
| Tool | Status | Evidence | Notes |
|---|---|---|---|
| Drawing takeoffs (calibrate, measure, ledger) | Verified before UI change | robot 5/5 (10-20) | Separate Distance/Area/Count tools (2.23) not implemented, after beta |
| Compare drawing revisions | Verified before UI change | robot 4/5 (10-20); spec comparison | |
| Drawing sheet sets | Verified before UI change | robot 3/3 (10-20) | |
| Geospatial coordinates | Unverified | unit pdf-geospatial-display; Codex task | |

### Export
| Tool | Status | Evidence | Notes |
|---|---|---|---|
| PDF to images | Verified | robot "save a PDF page as a picture" 11/11 (10-24) | |
| Compress a PDF | Verified (10-26) | 9/9 app tests (compression.spec, compression-inline.spec, batch stop/retry) and the robot task "export: grouped tools compress a real PDF…" pass on 11ff352 | Was failing 10-24 (A2); quality judged by pixel check, not yet on real large scans |
| Compress several PDFs | Unverified | Codex batch tasks (10-20 evidence in HANDOFF) | |
| Extract a table (CSV/XLSX) | Verified | robot 7/7 + main-page task (10-24); spec reader-inline-table | |
| Name and save unchanged copy | Verified | robot (10-24) | |
| Batch copy, rename or export text | Unverified | Codex batch tasks (10-20) | |
| Print-production marks | Verified | robot "prepare print sheets" 7/7 (10-24) | No physical print |
| Inspect and repair thin lines | Unverified | check-reader-* scripts; no recent robot task | |
| Export PDF copy / Word copy (from editor) | Verified | robot 16/16 and 28/29 (10-24) | Word copies never opened in real Word (only package structure checked) |

### Create (no open PDF needed)
| Tool | Status | Evidence | Notes |
|---|---|---|---|
| New document (Word-like editor) | Verified | robot 41/41, "type a sentence" 38/39, tables 19/19, bold 13/13 (10-24) | Comments/tracked changes, footnotes, columns not implemented (KNOWN-ISSUES C8–C9) |
| Open a document (DOCX, RTF, Markdown, CSV, text) | Verified | robot "open the sample Word file" 31/31 (10-24); unit document-* (20 files) | DOCX changed in other apps reopens simplified (KNOWN-ISSUES A8) |
| Image to PDF | Verified | robot 6/6 (10-24); unit image-* | |
| Scan to PDF (Windows scanner) | Unverified | code `desktop/scanner-service.cjs` | `docs/SCANNER-CAPTURE-PROGRESS.md`: no scanner, UI or runtime test was ever run |
| Create from email or clipboard | Verified | robot clipboard 2/2 (10-24), email 3/3 (10-20) | |
| Edit a workbook | Verified | robot 14/15 (10-24) | Never opened in real Excel |
| Edit slide text | Verified | robot 7/11, all failures 10-18 (resolved) | Never opened in real PowerPoint |
| Search selected files | Verified before UI change | robot 4/4 (10-20) | |
| Open a synchronized file | Verified | robot 2/2 (10-24) | |
| Watched-folder workflows | Partial | robot 2/2 (10-21) | Refuses to run when PDFix itself sits in a cloud-synced folder (KNOWN-ISSUES A21) |
| Virtual PDF printer | Unverified | code + `PDFix.VirtualPrinter.exe`; spare-PC run 3 Escape fix | Printer install/capture lifecycle never accepted (KNOWN-ISSUES E3) |
| Windows right-click PDF tools | Unverified | `desktop/windows-context-tools.cjs` | Never installed on purpose (project rule); untested in real Explorer |

### Editor extras
| Feature | Status | Evidence |
|---|---|---|
| Pictures, links, headers, RTF export, paper sizes | Verified | robot tasks pass 10-24; check-document-paper-sizes |
| Spell check | Verified before UI change | robot 1/1 (10-21) |
| Word count | Unverified | unit/scripts only |
| Read aloud | Unverified | robot "prepare… without playing audio" (10-24); **never spoken** |

## 3. Planned but not implemented (or deferred)

| Item | Source | Status |
|---|---|---|
| Quick edit mode, one mode button, grouped toolbar, side panel with "Save as my default" (2.30–2.35) | SHARED-PLAN; UI-RULES-2026-10-22 | Partial, Codex doing (~50% by owner's estimate) |
| Home previews and pinned files (2.19), Files thumbnails/drag (2.7) | SHARED-PLAN | Not implemented |
| Status bar (2.26), panels reopen with tools (2.25), Select tool choices (2.21) | SHARED-PLAN | Not implemented (planned for beta) |
| Draw tool choices (2.22), Measure tools (2.23), Image tool (2.28), Table tool (2.29) | SHARED-PLAN | Not implemented (after beta) |
| Auto-update / update notice | RELEASE-AUDIT Report 4 | Not implemented (no network by design) |
| macOS | owner decision 10-23 | Not implemented (after beta) |
| Paid workspaces and their offline licence | owner: postponed | Not implemented (no licence code exists) |
| Sharing (Windows/local/cloud, M09.01) | KNOWN-ISSUES E | Not implemented |
| Editor comments, tracked changes, footnotes, columns, more fonts, direct print | KNOWN-ISSUES C | Not implemented |
| Safe changes to signed PDFs (incremental save) | RELEASE-AUDIT R4.7 | Not implemented (refused instead) |
| Bluebeam-specific workspace, 30 add-ons | FINAL-SCOPE-LEDGER deferred | Deferred by owner |

## 4. Counts (and how they were made)

Rows counted in sections 1 and 2 (67 user-visible capabilities; the editor-extras table and the planned list are not
in these counts). Counted from this file with a script, not by hand.

| Status | Rows | Share |
|---|---|---|
| Verified (on or after 10-22, dev build) | 51 | 76% |
| Verified before UI change (10-17 to 10-21) | 0 (all 11 re-verified 10-25) | — |
| Unverified | 12 | 18% |
| Partial | 3 | 4% |
| Broken (tests) | 1 | 1% |

Plus section 3: about 20 planned items not implemented, most of them UI work for the beta (2.19–2.35) or deferred after it.

**Uncertainty.** These counts depend on how features are grouped; a different grouping moves them by several points.
The older plan ledger (`docs/FINAL-SCOPE-LEDGER-2026-10-11.json`, 264 requirement items) was never re-scored after
October 11, and its own rule says not to infer completion from code. So no percentage here should be quoted as precise.
