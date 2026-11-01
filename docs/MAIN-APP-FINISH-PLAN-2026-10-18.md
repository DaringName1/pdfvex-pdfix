# Finishing the main PDFix app: the plan (October 18, 2026)

Goal: a dependable main app for everyday document work (docs/GOAL-NOW-AND-FUTURE-2026-10-15.md). New workspaces,
Bluebeam and the 30 add-ons stay for later. This plan combines Codex's and Claude's lists, the reliability jobs,
every testing layer and the owner's decisions. Work is split evenly; each AI works only in its own lane
(docs/AGENT-WORKFLOW.md). Update the status column as items finish.

## How every item is finished ("done" means all of these)
1. **Built** in the owner's lane, with plain wording.
2. **Unit tests** for its logic (`npm test`), and **app tests** (`tests/desktop/*.spec.js`) for the main path and
   one failure/cancel path.
3. **A robot action** that does it like a person and checks the **saved file** independently (verify.mjs).
4. **By-eye screenshots** at 800×620 and 1366×820, normal and large text, opening and part-way states.
5. **Cloud run** passes after upload, and the next **spare-PC run** includes the new robot action.
6. Handoff, known issues and START-HERE section 8 updated in the same commit.

## Phase 0 - Monday package (Sunday October 18) - Claude, Codex helps
| Item | Who | Status |
| --- | --- | --- |
| Put the graphics retry in the package (launcher at `app/PDFix.exe`, Electron under `app/runtime/`, hashes, manifest, shortcuts and Open with pointing at the launcher) | Claude | to do |
| Check the packaged retry is safe (normal start, accepted retry, declined, no loop) | Codex | Local exact Monday package checks pass: actual reader/second-instance + eight isolated native crash scenarios; real driver failure/spare-PC acceptance separate. See PACKAGED-READER-ACCEPTANCE-2026-10-18.md |
| Spare PC: 24-hour run ends about 11 AM; read results, fix real bugs | Claude | running |
| Spare PC: install, desktop shortcut, open files, second-instance handoff, uninstall with the new package | Claude | to do |
| Fresh package -> next 24-hour run with the 43-action robot | Claude | to do |
| Two clean cloud runs in a row (Codex's slow-runner tests, any new failures) | both | to do |
| Owner's one-hour check (docs/SUNDAY-CHECK-2026-10-18.md), then the dad's package and guides | owner, Claude | to do |

## Phase 1 - settle what is really missing (Monday-Tuesday) - both, each for own lane
Compare the original feature plan and docs/KNOWN-ISSUES-2026-10-13.md with the real app, one feature at a time:
**done**, **unfinished**, **misleading** (looks finished but is not) or **later**. The owner approves the list.
Anything marked "later" is not built now. Output: a table added to this file.

### Phase 1: Codex lane audit — October 18, for owner review

This is the requested implementation/evidence classification, not a new scope approval or a fresh test run.
"Done" below means the named bounded behavior is built and has the cited local evidence; final package/cloud/
human acceptance remains separate. "Unfinished" names a real limit or outstanding acceptance. No item is marked
"misleading" without a current reproduced mismatch; old broken wording alone does not establish one today.
The audit draws on the original reader/printing/recovery requirements in FINAL-REMAINING-WORK-2026-10-11.md,
the actual room lists in src/workspace-rooms.js, reader menu/code and the dated evidence records linked below.

| Feature / requirement | Classification | Current implementation/evidence and remaining work |
| --- | --- | --- |
| Open/render PDF, page navigation, zoom, keyboard, labels, outline and internal links | Done within tested scope | Built-app generated and supplied-file checks; fresh-Windows and packaged gates remain X7/Phase 0 |
| Page, continuous, facing and readable views | Done within tested scope | Local regression/UI matrix; continuous rendering is bounded and huge files use page/on-demand mode |
| Find, F3, exact highlights and whole-file on-demand search | Done within tested scope | Source/native/app checks and exact fallback mapping; slow fresh-Windows readiness is X7, not absent search code |
| Complex readable layouts / semantic merged tables (X3) | Later | Existing manual columns/regions/tag order work within documented limits; broader automatic semantics after dad feedback |
| Read-aloud, count and spelling on ordinary PDFs | Unfinished | Existing menu/text tools, not missing from zero; full adopted reading-order/scanned behavior and audible acceptance need scoped proof; no sound in hidden tests |
| Large-file read-aloud/count/spelling (X2) | Later unless time allows | Currently disabled in on-demand mode; bounded progress/cancellation integration is a coding gap |
| Markup: highlights, underline, notes, text, ink, shapes and callouts; recovery/undo | Done within tested scope | Editable/flattened native save and independent reopen checks; one cloud save wait still needs latest confirmation |
| International markup text (X4) | Later | Notes support Unicode; text boxes/callouts have Western-font limits; broader font work after feedback |
| Pressure, stroke movement/style and partial erasing (X5) | Later for remaining gaps | Simulated pen/touch/mouse checks exist; real stylus/palm hardware proof remains unavailable |
| Review drawing comments, filter/export inventory, replies/history | Done within tested scope | Independent parent/thread/private-field preservation and saved recipe/reopen checks; source claims are not authenticity checks |
| Rich/custom-font/callout existing-comment body editing (X1) | Unfinished, now | Plain boxes and a bounded standard-font callout increment now have native app/unit/robot/visual proof; uniform rich paragraphs also now have local save/reopen/robot/visual proof; mixed layouts and custom fonts remain unfinished, with cloud/spare-PC acceptance pending. Preserve unsupported originals rather than silently flattening/replacing them |
| Standard FDF/XFDF comment exchange | Done within tested scope | Generated exchange/readback, linked replies and Unicode checks; proprietary exchange is not claimed |
| Compare drawing revisions | Done within tested scope | Reviewed matching, generated output and populated UI checks; arbitrary engineering alignment not certified |
| Drawing takeoffs / scale / length, area, perimeter / ledger / PDF | Done within tested scope | Six-unit calibrated geometry, JSON/CSV/PDF and recovery readback; physical ruler/real engineering validation separate |
| Drawing sheet sets / save and reload / sheet revision | Done within tested scope | Named library/readback, source seals and bounded reviewed fit/offset replacement; no arbitrary annotation-transform claim |
| Organize pages: rotate, move, delete, extract, combine, crop/resize | Done within tested scope | Native output/page geometry/text/source checks; cancellation/error/retry and saved-state UI verified locally |
| Split by adopted rules, reviewed output and exclusive folder save | Unfinished acceptance (X7) | Implemented; native/independent readback cases exist; fresh-Windows delayed-save/cancel regression needs confirmation. Interrupted folder without completion receipt is incomplete |
| Compress one PDF / compress several PDFs | Done within tested scope | Native output readback and failure/cancel/source preservation; arbitrary compression ratio or every PDF structure is not promised |
| Page numbers, headers/footers, watermark and reusable stamps | Done within tested scope | Selected-page content/style restart and preserved untouched-page checks |
| Bates numbering across PDFs | Unfinished acceptance (X7) | Sequence continuity/skipped-file and disk readback checks exist; slow native build/save waits need fresh-Windows confirmation |
| Edit PDF outline | Done within tested scope | Generated hierarchical output/native readback and by-eye/keyboard checks; no JavaScript bookmark execution |
| Edit PDF page boxes / print marks / thin-line repair | Done within tested scope | Each room tool used with saved copy/independent checks and responsive UI; not every possible setting/press workflow certified |
| Name/save unchanged copy; batch copy/rename/literal text export | Done within tested scope | Byte/hash or exact UTF-8 comparisons and reopen; originals unchanged |
| Print preparation and physical printing | Unfinished acceptance | Prepared output/settings/cancel checks exist; actual Epson ruler measurements and normal print jobs need user participation/approval |
| Reader-to-editor editable-document handoff | Done within tested scope | Bounded conversion bridge and editor-side integration checks; supported fidelity only, not arbitrary lossless PDF editing |
| Startup graphics retry (A-R4) | Unfinished package acceptance, now | Mechanism/unit/hidden and requested visible checks exist; Claude packaging now, Codex verifies exact packaged behavior when supplied |
| Long-session private memory (A-R2/X6), real large-file behavior | Unfinished, now | Full normal-GPU soak already running; synthetic speed matrix passed, real scan/weak-PC plateau still separate |
| Reader/Drawing/Pages accessible UI and tool transitions (X7) | Unfinished acceptance, now | Extensive personally viewed size/text and keyboard matrices exist; rare states, human/screen-reader and current package still separate |
| Bluebeam custom-column semantics, BAX/BTX and dedicated future workspaces | Later | Explicit owner deferral; raw preserved/read-only data is not proprietary compatibility |
| Thirty requested first-update Add-ons | Later | Explicit separate backlog; no scope expansion here |

Evidence: docs/PDF-READER-PARALLEL-HANDOFF-2026-10-12.md (dated detail/commits),
docs/CODEX-CONTINUATION-2026-10-18.md, docs/READER-BY-EYE-UI-2026-10-16.md,
docs/READER-SAVE-SAFETY-2026-10-17.md, docs/READER-SPEED-MATRIX-2026-10-18.md,
docs/READER-NATURAL-SOAK-2026-10-17.md, docs/GRAPHICS-RECOVERY-INTEGRATION-2026-10-17.md
and docs/evidence/codex/manifest.json. Features beyond the room lists remain subject to the complete original
scope ledger audit; this table does not assert every old F/A identifier is independently closed.

## Phase 1b - V1 whole-app audit (owner decision, October 18 evening)

Both agents audit their lanes against the 12 areas in [V1 whole-app audit](V1-WHOLE-APP-AUDIT-2026-10-18.md) and record evidence before starting more
features. Fixes for data loss, security or crashes found by the audit go first. New testing it adds: robot jobs
(long multi-step chains with a forced close and recovery), failure scenarios for every save route, a PDF structure
diff tool, the signed-PDF rule, a compatibility pack for Acrobat/Bluebeam/Office, hostile-file and offline checks,
and spare-PC install/update/remove. Phase 2 items are then re-ordered using the audit.

## Phase 2 - build and fix (from Monday, in parallel)
Sizes: S = under a day, M = one to two days, L = three days or more. Order is the suggested order.

**Owner decision (October 18): start only the "now" items before the dad's feedback.** Now: C1, C2, C3, C9 and
X1, X6, X7. After feedback: C6, C7, C8, X3, X4, X5. If time allows: C4, C5, X2. The dad's reports may reorder this.

### Claude (document editor, Documents and More tools, shell, packaging)
| # | Work | Size | Why |
| --- | --- | --- | --- |
| C1 | **Prove Excel and PowerPoint tools** (Edit a workbook, Edit slide text): make real sample files, test open/edit/save/reopen, fix what breaks, add robot actions | M | Never tried: no sample files existed |
| C2 | **Print straight from the document editor** (preview, paper, pages, printer dialog; same checks as PDF printing) | M | Everyone prints; today it needs an export first |
| C3 | **Pictures in documents**: drag to resize, crop, rotate, text wrap; WebP/BMP/GIF/TIFF pictures in | L | Common in everyday documents |
| C4 | **Fonts**: use fonts installed on the PC, kept in Word and PDF output | M | Word files look wrong with three families |
| C5 | **Table borders and shading**, including from pasted Word/web content | M | Tables lose their look |
| C6 | **Comments and track changes** in documents (read from Word, add, accept/reject, write back) | L | Word users rely on them |
| C7 | **Footnotes, columns, section breaks** | L | Longer documents |
| C8 | **Virtual PDF printer: automatic capture** of printed jobs | M | Today a manual multi-step process |
| C9 | Robot findings in the editor, tables, saving and recovery; converters, forms and redaction with real files | ongoing | Reliability |

**Claude status, October 18 evening:** C1 done (tests/desktop/office-tools.spec.js, robot actions "edit a workbook cell
and save a copy" and "edit slide text and save a copy"). C2 done (tests/desktop/document-print.spec.js). C3: turn, crop,
drag-to-resize and GIF/BMP/WebP done (tests/desktop/document-pictures.spec.js, tests/document-image-edit.test.cjs); text
wrap (needs Word/PDF/recovery writer changes) and TIFF pictures are not started.

### Codex (PDF reader, Drawing, Pages)
| # | Work | Size | Why |
| --- | --- | --- | --- |
| X1 | **Editing existing PDF comments**: rich text, custom fonts, callouts (standard PDF, not Bluebeam) | L | The dad's drawing review |
| X2 | **Read aloud, word count and spelling for very large PDFs**, with progress and cancel | M | Unavailable in large-file mode today |
| X3 | **Readable view for complicated pages**: tables, merged cells, captions, irregular columns | L | Everyday PDF reading |
| X4 | **International text in markup** (text boxes and callouts beyond Western fonts), kept on save and reopen | M | Non-English text |
| X5 | **Pen usability**: remaining interaction gaps (palm rejection needs a physical pen to prove) | M | Tablet users |
| X6 | **Long-session memory**: 90-minute soak (`agent-run --minutes=90`), fix confirmed growth | M | Hours-long sessions |
| X7 | Reader, search, markup, Drawing and Pages failures (local and cloud); large real PDFs; keyboard, error messages and populated screens in its tools | ongoing | Reliability |

Balance: Claude carries packaging and integration in Phase 0 plus C1-C9; Codex carries X1-X7 and helps verify the
package. X1 comes first because the dad reviews drawings; C1 first because it may be broken today.

## Phase 3 - testing that runs all the time
| Layer | When | Who |
| --- | --- | --- |
| Unit tests (`npm test`) | before every upload | the AI uploading |
| App tests in the cloud (full run) | after every upload, plus nightly | Claude uploads; each fixes own failures |
| Check scripts (77) | after a lane's feature lands; full sweep weekly | each for own lane |
| Robot on the main PC | after each new robot action (replay) | each for own actions |
| Spare PC 24-hour runs | continuously, new package and robot each run | Claude runs; failures go to the owning lane |
| Long-session memory soak | weekly and after reader/editor memory changes | Codex |
| Speed matrix (1,000 pages, huge pages, 200 MB) | weekly | Codex |
| By-eye UI pass | after any visible change | the changing AI |
| Owner's checks and printer ruler check | weekly | owner |
| Dad's real use and problem reports | from Monday | dad, triaged daily by Claude |

## Phase 4 - release gates (from the goal document, section 5)
- No known data loss, document corruption or critical security problem.
- Critical workflows verified in the built app and in the exact package; connected workflows open -> edit -> save
  -> close -> reopen checked independently.
- Two consecutive clean cloud runs; a clean spare-PC 24-hour run (failures explained).
- Successful human tasks (owner and dad), clean-machine install and uninstall.
- Stages: internal testing -> private beta -> wider beta -> stable, decided on evidence, not percentages.

## Decisions the owner still makes
Phase 1 list approval; app licence (GPL-3.0 suggested); beta testers; "Physical page"/"Cancel operation" wording;
code signing (paid certificate); whether notes naming the drawing may go to GitHub.
