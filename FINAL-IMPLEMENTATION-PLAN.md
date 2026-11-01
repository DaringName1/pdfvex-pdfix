# PDFix final consolidated implementation plan — October 11, 2026

This is the single work-order document for the complete adopted scope. It reorganizes earlier plans; it does not remove their requirements. Later user instructions govern conflicts with historical plans: PDFix is the adopted name/logo; all features stay free under R46; R48 authorizes explicitly granted folders; A01–A25 adopt the specialist expansion; and R49 authorizes the requested hidden UI/function pass. Existing specifications, dependencies, preservation rules and acceptance gates remain represented within that authorized scope. Do not count overlapping R/M/B/F/A/G/D IDs as separate completed features, or interpret an older "initial-release exclusion" as deleting later adopted A01–A25 work.

## Delivery order

| Order | Workstream | Remaining implementation |
| --- | --- | --- |
| 1 | Workspaces and clear UI | Finish clean Drawing, Document and Pages rooms, intuitive navigation/return, task discovery, collapsible/resizable panels, contrast, keyboard/focus/accessibility and responsive layouts. Avoid persistent banners and crowded headers. |
| 2 | PDF viewing | Complete smooth bounded large-file reading, selection, search, outlines/destinations/layers, readable text, page modes, zoom/pan/history, fullscreen, page labels and comment navigation across supported sources. Actual SW3 opening/scrolling has targeted evidence; its full-tool gaps remain. |
| 3 | PDF editing | Expand permitted original text/font/image/object edits and preservation, shapes/annotations, form values, metadata, page geometry, undo/recovery and original/output review. Unsupported complex layouts cannot be claimed editable merely by adding text over them. |
| 4 | PDF creation and document editor | Word/Google Docs/DocHub-inspired compact tool categories, clear writing/formatting/insert/layout/review/file paths, tables/images/header/footer/page setup, PDF/DOCX/RTF export, images/scans/clipboard/email to PDF and safe new-copy saving. Keep actual commands integrated. |
| 5 | Bluebeam drawing review | Open/search/jump to existing comments; add notes/replies, edit eligible comments, report locked/unsupported data, preserve foreign appearances/threads/states/identities. Complete revision replacement/comment carry-forward, custom data, reusable tools, takeoffs and exchange. Revu interoperation needs actual authorized fixtures. |
| 6 | Remaining full adopted feature scope | Finish every remaining security, conversion, OCR/scanner/camera, batch/workflow, form, accessibility, printing/prepress, certificate, free local integration, Windows, browser/mobile and specialist item in the scope ledger. Preserve every future and Acrobat addition; external prerequisites do not erase scope. |
| 7 | Digital-pen drawing on PDFs | Complete F67/R50 below as the final feature family in the requested order, with saved editable PDF ink, pen-focused interaction and original preservation. |
| 8 | Full UI/function debugging and release checks | Exercise every implemented command and route, fix confirmed defects, verify outputs independently, and record unimplemented/unsupported/dependency-blocked paths explicitly. Finish applicable security, corpus, recovery, accessibility, performance and installation gates before broad working/release-ready claims. |

## Core document toolbar — R49

Use familiar organization rather than copying another product's brand or implying feature parity. File, Home, Insert, Layout and Review categories expose existing commands. Keep frequent text formatting, Undo/Redo and PDF export discoverable; use contextual and overflow controls instead of many persistent rows. Preserve selection while applying styles, operation-specific editing holds, native Save dialogs, draft recovery and supported source/code modes. Table/image/page setup/headers/footers/spelling/read-aloud/statistics remain integrated.

October 11 implementation: a compact tabbed toolbar is coded, with persistent basic formatting and PDF/DOCX export, keyboard tab navigation and source-mode handling. Current build/UI evidence is recorded separately after execution; coding alone is not a complete Word/Docs editor or full-layout fidelity.

## Bluebeam comments — R39/B01–B12 and R49

- Open drawings and display saved markups plus a searchable source-comment panel. Show literal author/subject/text/dates/state, missing parent/group warnings and selected-page location without inferring proprietary meanings.
- New comment opens the actual note tool on the selected comment's physical page or the current drawing page. Add annotations only after a deliberate placement and text entry; preview and save an inspected new PDF copy.
- Edit eligible existing plain comment text and add replies/review history. Keep locked/read-only/grouped/rich/unsupported bodies intact and show visible reasons. New PDFix markups use their owning editor; imported fields are not relabeled as PDFix-owned.
- Retain unknown objects, appearance streams, private data, replies, grouping and identities unless a reviewed operation explicitly changes supported content. Preserve originals and disclose flattening/loss.
- Broaden FreeText and other foreign geometry/appearance edits only with a preserving codec; remove current size limitations through bounded contained routes instead of uncontained fallback.
- Complete physical sheet replacement and reviewed comment carry-forward, Bluebeam custom columns/quantities, BAX/BTX/private adapters and free supported Studio evaluation. Local PDF review is not a Studio connection.
- Validate real Revu round trips before claiming Bluebeam compatibility. The user's earlier converted drawing sample has unknown origin/annotation coverage and is not sufficient proof.

## Digital pen and handwriting — F67/R50

The user clarified the Microsoft Store reference as writing/drawing directly on PDFs with a digital pen and saving the marks. Exact store-app identity is no longer required for this functional scope.

Required: user-selected pen/highlighter/color/thickness/opacity, responsive stylus strokes, supported pressure handling and explicit fallback on unsupported hardware, palm rejection while a pen is active, predictable pen/touch/mouse navigation modes, stroke selection/move/delete and reviewed erasing, Undo/Redo, shapes/ruler where supported, zoom/pan and rotated/cropped coordinates, multi-page drawing and recoverable local drafts. Save editable PDF Ink/standard annotation appearances to a reviewed new copy, reopen to continue editing, and offer explicit flattening separately. Existing PDFix basic Ink/line/arrow/cloud/callout code is groundwork, not completion of the pen workstream. No handwriting-recognition or exact stylus guarantee is inferred from saved ink.

## Complete scope, without omissions

Retain **R01–R50, S00, all 71 original M-rows, B01–B12, F01–F67, A01–A25**, and the older **G01–G16/D01–D22** checklists embedded in requirements/product plans. Retain privacy, recovery, integrity, permissions, sandbox, branding/free-app and release invariants alongside user-facing tools.

The machine-readable [scope ledger](docs/FINAL-SCOPE-LEDGER-2026-10-11.json) contains each stable ID and all authoritative source references, plus original requirement statements and source hashes. The human-readable [remaining-work register](docs/FINAL-REMAINING-WORK-2026-10-11.md) lists every current inventory row's coded scope and remaining work, all F47–F67 additions and A01–A25 specialist requirements. Do not discard a target because it appears in several sources or has a compiled partial implementation.

Authoritative earlier scope stays in REQUIREMENTS.md, PRODUCT-PLAN.md, ROADMAP.md, PDFIX-ALL-PLANNED-FEATURES.md, PDFIX-FUTURE-FEATURES.md, PDFix-Missing-Features-Master-List.md, MASTER-GAP-TRACKER.md, BLUEBEAM-COMPATIBILITY-PLAN.md, ACROBAT-COMPETITIVE-PLAN.md, FREE-ACROBAT-ADDITIONS-PLAN.md and READING-WRITING-PRINT-PLAN.md. Architecture, format support, decisions, feature/phase records, original intake records and linked preservation/security/performance/printing documents supply implementation boundaries and evidence. Historical checklists are not current acceptance proof.

## How completion is recorded

| Status | Meaning and current record |
| --- | --- |
| 100% of required acceptance complete | No broad feature area is certified at this level. This also does not promise software can never crash or encounter an unsupported file. |
| Coded, broader checks pending | Existing implemented subsets retain their exact scope; compiled code does not establish full output, hardware, security or file compatibility. |
| Tested for declared cases | Current document-toolbar/export, standard-comment edit/add, main-screen/layout and viewer-mode cases have scoped evidence. Actual SW3 scrolling passed hidden. The native fullscreen UI run exposed its temporary window, so that aggregate hidden-only result did not pass. See the dated integration checkpoint and inventory. |
| Still needs coding or acceptance | Every remaining part of existing tools, all adopted future/specialist additions, device/service prerequisites and release gates stay in the complete remaining-work register. |

[Current integration evidence](docs/UI-INTEGRATION-AND-FINAL-SCOPE-2026-10-11.md) records the exact build and results. The register preserves earlier evidence alongside remaining work instead of treating any whole feature as finished because one case passed.

## UI and function check requirements

Build a command-to-check matrix covering every currently integrated action and each applicable input/output path. Status is one of unstarted, partial coded, compiled, current runtime pass for a declared case, failed, prerequisite blocked, or full required acceptance passed. A disabled button/placeholder/disconnected module does not count as implementation. Unknown evidence is pending, not passed.

Check Home/Files/Workspaces/settings/help, all rooms and editors, every toolbar/tab/menu/dialog, source/format boundaries, selected-file/folder grants, empty/error/loading/canceled/recovered states, keyboard/focus/tab order, screen-reader labels, contrast, 100/125/150% text, minimum/normal/large windows, fullscreen/restore, touch/stylus and high-DPI/multiple monitors. Inspect page area, clipping/overflow, visible disabled reasons and concise status. Capture representative screenshots and fix confirmed defects.

For each writer: confirm unchanged originals, exact reviewed output, new-copy/exclusive saving, independent reopen, retention/omission rules, source-change protection, cancel/recovery/disk-full/permission-denied handling. For drawing/pen/comment tools: confirm coordinates, rotation/crop/UserUnit, selection, saved appearances/threads and quantities. For native routes: effective containment/no network/job grants/process and resource limits, termination and cleanup. For large files: sustained scroll/jumps/zoom/search, bounded caches/render work and measured total RAM/responsiveness.

External hardware/services/platforms require their actual device/account/clean-machine checks. Never label these passed from a local screenshot or compiler. A targeted UI sweep is useful current evidence, but does not establish that every adopted feature exists or every operation works on all files.

## Execution rules

Keep planning concise after this consolidation. Implement biggest gaps in separate modules; use coordinated subagents for substantial independent coding, then one integration/build. Keep useful updates tied to completed work. Latest user request authorizes UI/function debugging; keep automation windows hidden as previously requested and preserve the live desktop session's work. Tests should cover actual behavior, not only mirror code. Fix confirmed defects, maintain all records, and do not mark the complete goal achieved while any adopted implementation or required gate is missing.

