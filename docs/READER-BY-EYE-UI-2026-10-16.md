# Reader, Drawing and Pages by-eye UI review — October 16, 2026

Status: initial tour and two rebuilt-app follow-ups personally reviewed; confirmed fixes ready for integration. Remaining visual branches are listed below. This is not whole-app completion.

Evidence: `tmp/reader-ui-ez8J60/report.json`, 279 real hidden built-Electron screenshots, individually inspected (001–279). Generated disposable three-page PDF; four configurations: 800×620 and 1366×820, each at 100% and Settings 150% text. Original unchanged, all four app sessions closed, no page/console errors recorded. No physical printing. Automated capture/geometry notes are supporting evidence, not visual approval.

The geometry detector flagged Read aloud versus the underlying page-3 thumbnail in screenshot 033. By eye this is the intentional menu overlay over artwork/thumbnails, not two visible menu controls colliding. Keep this raw flag rather than claiming the machine report was all green.

## Screen evidence

Each row covers only the named captured state, not every possible input/error. Original screenshot numbers below locate the baseline; follow-up receipts below locate corrected states.

| Screen/state | Configurations captured and viewed | Status | Screenshot numbers |
| --- | --- | --- | --- |
| Reader single | 4/4 | Passed for captured state | 001, 070, 138, 210 |
| Reader continuous | 4/4 | Passed for captured state | 002, 071, 139, 211 |
| Reader facing | 4/4 | Passed for captured state | 003, 072, 140, 212 |
| Reader text | 4/4 | Passed for captured state | 004, 073, 141, 213 |
| Reader page | 4/4 | Passed for captured state | 005, 074, 142, 214 |
| Tools and view expanded | 4/4 | Passed for captured state | 006, 075, 143, 215 |
| Find and F3 | 4/4 | Passed for captured state | 007, 076, 144, 216 |
| Navigation pages | 4/4 | Passed for captured state | 008, 077, 145, 217 |
| Navigation outline | 4/4 | Passed after fix for captured state | 009, 078, 146, 218 |
| Navigation saved | 4/4 | Passed after fix for captured state | 010, 079, 147, 219 |
| Sheet label jump | 4/4 | Passed after fix for captured state | 011, 080, 148, 220 |
| Page notes panel | 4/4 | Passed for captured state | 012, 081, 149, 221 |
| Page link review | 4/4 | Passed for captured state | 013, 082, 150, 222 |
| Print preparation | 4/4 | Passed for captured state | 014, 083, 151, 223 |
| Print four options | 4/4 | Passed for captured state | 015, 084, 152, 224 |
| Print booklet options | 4/4 | Passed for captured state | 016, 085, 153, 225 |
| Prepared print sheets | 4/4 | Passed for captured state | 017, 086, 154, 226 |
| Mark up a drawing | 4/4 | Passed after fix for captured state | 018, 087, 155, 227 |
| Mark up a drawing expanded | 4/4 | Passed after fix for captured state | 019, 088, 156, 228 |
| Mark up a drawing lower controls | 4/4 | Passed after fix for captured state | 020, 089, 157, 229 |
| Review drawing comments | 4/4 | Passed after fix for captured state | 021, 090, 158, 230 |
| Selected drawing comment | 4/4 | Passed after fix for captured state | 022, 091, 159, 231 |
| Plain comment editor | 4/4 | Passed after fix for captured state | 023, 092, 160, 232 |
| Comment export preview | 4/4 | Passed after fix for captured state | 024, 093, 161, 233 |
| XFDF export review | 4/4 | Passed after fix for captured state | 025, 094, 162, 234 |
| XFDF import review | 4/4 | Passed for captured state | 026, 095, 163, 235 |
| Compare drawing revisions | 4/4 | Passed after fix for captured state | 027, 096, 164, 236 |
| Compare drawing revisions expanded | 4/4 | Passed after fix for captured state | 028, 097, 165, 237 |
| Compare drawing revisions lower controls | 4/4 | Passed after fix for captured state | 029, 098, 166, 238 |
| Drawing takeoffs | 4/4 | Passed for captured state | 030, 099, 167, 239 |
| Drawing sheet sets | 4/4 | Passed after fix for captured state | 031, 100, 168, 240 |
| Drawing sheet sets expanded | 4/4 | Passed after fix for captured state | 032, 101, 169, 241 |
| Drawing sheet sets lower controls | 4/4 | Passed after fix for captured state | 033, 102, 170, 242 |
| Organize pages | 4/4 | Passed after fix for captured state | 034, 103, 171, 243 |
| Crop and resize dialog | 4/4 | Passed for captured state | 035, 104, 172, 244 |
| Crop custom paper | 4/4 | Passed for captured state | 036, 105, 173, 245 |
| Split every settings | 4/4 | Passed for captured state | 037, 106, 174, 246 |
| Split ranges settings | 4/4 | Passed for captured state | 038, 107, 175, 247 |
| Split bookmarks settings | 4/4 | Passed for captured state | 039, 108, 176, 248 |
| Split size settings | 4/4 | Passed after fix for captured state | 040, 109, 177, 249 |
| Preserving reorder custom-label refusal | 4/4 | Passed for captured state | 041, 110, 178, 250 |
| Organize pages expanded | 4/4 | Passed after fix for captured state | 042, 111, 179, 251 |
| Organize pages lower controls | 4/4 | Passed after fix for captured state | 043, 112, 180, 252 |
| Compress a PDF | 4/4 | Passed for captured state | 044, 113, 181, 253 |
| Compress a PDF expanded | 4/4 | Passed for captured state | 045, 114, 182, 254 |
| Page numbers and stamps | 4/4 | Passed after fix for captured state | 046, 115, 183, 255 |
| Page numbers and stamps expanded | 4/4 | Passed after fix for captured state | 047, 116, 184, 256 |
| Page numbers and stamps lower controls | 4/4 | Passed after fix for captured state | 048, 117, 185, 257 |
| Edit the PDF outline | 4/4 | Passed after fix for captured state | 049, 118, 186, 258 |
| Edit the PDF outline expanded | 4/4 | Passed after fix for captured state | 050, 119, 187, 259 |
| Edit the PDF outline lower controls | 4/4 | Passed after fix for captured state | 051, 120, 188, 260 |
| Name and save unchanged copy | 4/4 | Passed for captured state | 052, 121, 189, 261 |
| Name and save unchanged copy expanded | 4/4 | Passed for captured state | 053, 122, 190, 262 |
| Compress several PDFs | 4/4 | Passed for captured state | 054, 123, 192, 263 |
| Compress several PDFs expanded | 4/4 | Passed for captured state | 055, 124, 193, 264 |
| Batch copy, rename or export text | 4/4 | Passed for captured state | 056, 125, 195, 266 |
| Batch copy, rename or export text expanded | 4/4 | Passed for captured state | 057, 126, 196, 267 |
| Bates numbering across PDFs | 4/4 | Passed after fix for captured state | 058, 127, 198, 268 |
| Bates numbering across PDFs expanded | 4/4 | Passed after fix for captured state | 059, 128, 199, 269 |
| Bates numbering across PDFs lower controls | 4/4 | Passed after fix for captured state | 060, 129, 200, 270 |
| Edit PDF page boxes | 4/4 | Passed for captured state | 061, 130, 201, 271 |
| Edit PDF page boxes expanded | 4/4 | Passed for captured state | 062, 131, 202, 272 |
| Edit PDF page boxes lower controls | 4/4 | Passed for captured state | 063, 132, 203, 273 |
| Print-production marks | 4/4 | Passed after fix for captured state | 064, 133, 204, 274 |
| Print-production marks expanded | 4/4 | Passed after fix for captured state | 065, 134, 205, 275 |
| Print-production marks lower controls | 3/4 | Passed after fix for captured state | 066, 206, 276 |
| Inspect and repair thin lines | 4/4 | Passed after fix for captured state | 067, 135, 207, 277 |
| Inspect and repair thin lines expanded | 4/4 | Passed after fix for captured state | 068, 136, 208, 278 |
| Inspect and repair thin lines lower controls | 4/4 | Passed after fix for captured state | 069, 137, 209, 279 |
| Name and save unchanged copy lower controls | 1/4 | Passed for captured state | 191 |
| Compress several PDFs lower controls | 2/4 | Passed for captured state | 194, 265 |
| Batch copy, rename or export text lower controls | 1/4 | Passed for captured state | 197 |

## Before → after (rebuilt-app screenshots personally checked)

- Sheet sets: blank Source PDF selection → the first actual filename selected; existing valid choice kept.
- Markup, outline, sheet-label Find and comment exports: singular counts with plural nouns → correct singular/plural wording. The first-tour sheet-label/XFDF/export header fixes are already visible.
- Navigation at 150%: Outline broken across letters → tabs wrap as complete labels.
- Expanded Tools and view: words split inside narrow button columns → full-width options wrap between words.
- Page-number/stamp and print-mark options: selected values clipped in narrow columns → responsive wider fields and intended dialog width.
- Comment editor: narrow Change list and internal ref:7:0 header → responsive editor width and plain page/type heading.
- Thin lines: default object/stream/operator/CTM dump → collapsed Technical stroke details, with plain initial instruction. No technical evidence removed.
- Print preparation: Raster quality / Duplex request / Color request → Print quality / Print sides / Print in color (already personally seen in all four configurations).
- Page-box origin: explicit at ref4:0 → Set on this page (already personally seen); actual box names retained.
- Compare: mapping/heuristic jargon → pair corresponding pages and estimates; no matching behavior changed.
- Size splitting: encoded/worker wording → maximum file size and plain limits; no budgets changed.
- Bates: clipped placeholder used as the only visible page-range explanation → visible Physical pages to number label and short example; position values use normal capitalization.
- Organize: empty annotation arrays counted as affected pages → only nonempty arrays counted; 7/7 focused page-operation units pass including direct/indirect empty arrays. Unknown malformed entries stay conservatively counted.

## Reinspection receipts

- `tmp/reader-ui-hOB8J8/report.json`: 309 recorded states, 103 actual PNG screenshots, all 103 personally viewed. Four size/text configurations. Confirmed sheet selector, annotation warning, counts, comment editor, page-box/print wording, Bates and other changed controls. Raw geometry report retains the same intentional menu-over-thumbnail overlap flag; no renderer/console errors or tool failures, source unchanged, sessions closed.
- `tmp/reader-ui-DcPIMf/report.json`: final 149 recorded states, 45 actual PNG screenshots, all 45 personally viewed. Four configurations, rebuilt final menu/nav/comment/decorations/thin-line changes. Page number placeholders fully visible, Change dropdown readable, Line 1 replaces internal stroke ID, menu words no longer split mid-word. Report passes with no geometry findings, no renderer/console errors, unchanged source and all sessions closed. Uncaptured records have screenshot:null and are not claimed as visually inspected.
- Total personally inspected: 427 actual images across these three tours. Private snapshots of the built Electron app, not a release package, outside-software check or physical print.

## Requests for Claude

- Shell toast covers the lower reader/comments controls while displayed (e.g. screenshots 159 and 231, especially 150% text). Consider a dismiss button or reserving message space. Shell files remain untouched.
- No spare-PC access this session. Claude reports the remote sandbox robot failed when started directly over SSH but passed 24/24 when started in the signed-in desktop through an interactive scheduled task (`schtasks /create ... /it`, then `/run`). Preserve that launch requirement for future spare-PC evidence; this is Claude-reported evidence.

## Remaining visual states and user opinion

- Untested in this new tour: every possible malformed-file/error message, populated takeoff ledger lower controls, replacement-sheet confirmation, portable comment recipe replacement, newly built preview/save/cancellation dialogs for each tool. Earlier workflow tests do not replace this by-eye review. Supplemental captures remain needed.
- The comments/markup safety explanations are dense at 150%. Optional later usability decision: short summary plus an expandable full explanation. No redesign or removal of restrictions was undertaken. No user decision blocks the current fixes.
- Cloud two-run gate, robot action execution, 1–2-hour memory soak, GPU decision note, save audit, large-file performance and full keyboard walk remain separate open work.


## October 17 — populated and saved-result follow-up

Two complete four-configuration matrices, 32 images each, personally viewed individually. First matrix: aoCqpW (800/100), 99XJCh (1366/100), PnN6Vs (800/150), l2Hw7B (1366/150). Corrected matrix: vQJYwa, 3FTFbt, kJLNOK, S4E8Re in the same order. All folders are under C:/Users/andre/AppData/Local/Temp/pdfix-codex-robot-. Every matrix run passes seven output-verified actions, no page errors and closes its app. Generated source/input hashes unchanged. No outside PDF software or printer involved.

| Screen/state | Configurations personally viewed | Result |
| --- | --- | --- |
| Annotated-copy preview with highlight and note | 4/4, before and after | Passed captured state |
| Saved annotation reopened and note selected | 4/4, before and after | Passed captured state; note body and both annotation types independently verified |
| Rotated page-copy preview | 4/4, before and after | Fixed sticky heading hiding review/save controls at small size; measured heading height now reserves scroll space |
| Deleted-page copy preview | 4/4, before and after | Passed after scroll-space correction; output text/page count independently verified |
| Extracted one-page copy preview | 4/4, before and after | Fixed “1 pages” to “1 page”; save stays visible; extracted text independently verified |
| Combined four-page copy preview | 4/4, before and after | Passed after scroll-space correction; added PDF text/page count independently verified |
| Populated takeoff ledger | 4/4, before and after | Fixed “1 entries” to “1 entry”; saved points/source and 100 mm quantity independently recomputed |
| Takeoff JSON save review | 4/4, before and after | Fixed distance splitting across letters; intended dialog width restored, type kept whole, table honors large text |
| Saved page workflow row | 800×620 / 150% | Final xflHyO screenshot personally viewed: “3 output pages · 1 source PDF”, readable load/delete controls |
| Saved sheet-set row | 800×620 / 150% | Final xflHyO screenshot personally viewed: “3 sheets · 1 source PDF”, readable load/delete controls |

Final exact rebuild receipts: oyfcHV has seven actions plus independently reread libraries and four personally viewed screenshots; xflHyO has the same passing actions/libraries plus two personally viewed saved-row screenshots after singular-wording correction. No partial library files remain. The library readback correction is c29d8bc; presentation/robot follow-up is the next commit. The original 427-shot review is separate; these new matrices add 64 fully inspected images, with six final targeted captures.

Remaining visual branches: malformed-file variants, replacement-sheet confirmation, portable recipe replacement and the other tools' newly prepared output/save/cancellation states still need explicit by-eye coverage. Populated ledger and markup/organize saved-result branches above are no longer untested. Do not interpret a verifier pass as visual approval for an uncaptured state.

For Claude: at 800 px after opening many PDFs, tabs can shrink to close glyphs with no readable filename (aoCqpW/drawing-populated-ledger.png). Shell/tab sizing left alone. New top toast allows clicks through and no longer covers the bottom controls, but temporarily obscures the upper toolbar at 800/150%; this is a separate visual tradeoff, not a claim the earlier lower-control fix failed.


## October20 final Home/More coverage review

Personally inspected all18toolbar captures,22large-action captures,22small-action captures and8keyboard captures in home-coverage-2026-10-20. Captured controls render and generated outputs independently verify; this is not universal visual acceptance.

| Screen/tool state | Result / remaining observation |
| --- | --- |
| Home / View, all4configurations | Passed captured Home ten-button layout and collapsed More; shared toast still overlaps top controls at small/large-text (Claude request). |
| Comment, all4configurations | Readable/direct buttons; at800/150 two nested tool-strip scroll areas hide lower tools until scrolled. Usability improvement remains. |
| Edit / Fill & Sign / Protect / Measure / Export, large default | Passed captured entry layout; these are entry-point checks, not every connected Claude tool. |
| Pages loaded thumbnails | Passed captured loaded state; preview/save controls require vertical scrolling. |
| Print / layers / read-aloud preparation / named copy | Captured states reviewed; no physical print/audio acceptance. |
| Accessibility audit / preflight | Captured states readable; technical introduction/receipts are too dense. Search field fixed. |
| Attachments / FDF export/import / portfolio | Outputs pass; excessive technical prose and singular count wording remain. No external interchange claim. |
| Geographic point | Crash fixed/output passes; visible coordinate/reference labels need improvement (placeholders truncate). |
| Certificate approval boundary | Passed captured unsigned/unapproved state only; no real key/signature selected. |
| Cleanup / repair | Saved outputs pass; healthy repair proof is too small with unused space. |
| Print marks / thin lines | Paired proofs inspected; final thin-line review checkbox and Save are separated. |
| Initial tag tree | Generated tree/readback passes; dense nested review areas remain. |
| Blank-page review / saved pages | Generated removal saved/read back; proposal has singular grammar error; proof is small. |
| Reorder + Bates workflow | Reordered output/comments/IDs verified; review checkbox visually centered below its paragraph needs alignment. |
| Area selection after resize | Selection text and new highlight remain aligned;3built-app regressions and5unit cases pass. |

No readiness-score change. Broader save-error/hostile/external acceptance remains open.


Final drawing guide: three default and three final800/150captures personally viewed. Failed small capture showed artwork squeezed to20pixels by three panels; final small capture shows usable drawing after temporary pane folding, with restored panels verified on close. Nested proof panes now start hidden. Remaining: Comment toolbar has nested vertical scrolling at800/150; shared toast and tab-name crowding remain Claude requests. Tests passing do not make those layouts ideal.


## October20: visual polish and expanded save evidence

Built hidden-app checks pass: five independently verified native actions at1366x820/100% and800x620/150%; four toolbar configurations;60keyboard states; both Sheet-set departure/save cases. Personally reviewed all44screenshots (16native,18toolbar,8keyboard,2sheets). Evidence: docs/evidence/codex/ui-polish-2026-10-20/. Repair proof fills its frame (page height>200px asserted); geographic inputs have visible labels; singular counts corrected; saved sheet sets clear stale unsaved warnings. Comment controls use one bounded scrolling region with sticky group tabs.

Still imperfect: small150% layouts with all panes open need considerable scrolling; shared top toast overlaps header (Claude request); technical FDF/portfolio/outline copy remains long. Keyboard reachability passes, not every layout is polished.

Save audit:44route cases plus16failure/safety/Windows-lock cases =60/60pass. Nine markup kinds independently reopened in editable and flattened modes (notes stay editable); encoded original content, attachments, tags, field value/calculation, outline and unrelated annotations checked within each route policy. Added metadata cleanup, portfolio attachment and real sandbox repair, including wrong-fingerprint refusal and discarded-output invalidation. No production codec change needed. Physical full disk/power loss, every UI interruption route, real certificates and outside-viewer acceptance remain unverified.

Cloud39491483690: build/unit/smoke job passes, desktop pending; excludes latest changes. Claude uploads and obtains two clean full runs. Real-corpus performance/memory checks continue separately. No spare PC, uploads, physical printing or production graphics changes.
