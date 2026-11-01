# PDFix: detailed main-app scope and acceptance checklist

Written October 18, 2026, America/Los_Angeles. Owners: Claude, Codex and the user. This supplements Claude's MAIN-APP-FINISH-PLAN-2026-10-18.md with detailed scope and acceptance criteria. It is not a second assignment/status tracker or a claim that tasks are finished. If task IDs differ, use Claude's plan as the execution tracker and this checklist for acceptance.

## Goal and agreed boundary

Finish a dependable main PDFix app for everyday PDF/document work. Treat the user's "OK, make a plan" following recommendation C as selecting **C**: finish the agreed main-app scope, plus direct document-editor printing and picture resizing/cropping. If the user intended another option, change this scope record before implementing the disputed extras. No other candidate feature is automatically approved by its presence in a problem list.

The intended Monday October 19 delivery is a **limited test package for the user's dad**, not a promise that every main-app gap or public-release gate will be completed by Monday. Do not ship a known data-loss or security problem to meet a date. The user decides whether documented limitations are acceptable for a private test.

Future workspace redesign, Bluebeam-specific expansion and the 30 Add-ons stay deferred. The approved UI philosophy still guides current usability fixes: one clean document-centered app, connected tools, plain language and progressive disclosure. No broad navigation redesign in this phase.

## Sources and precedence

Read [the workflow](AGENT-WORKFLOW.md), [START-HERE](START-HERE.md), [both](CLAUDE-HANDOFF-2026-10-12.md) [handoffs](PDF-READER-PARALLEL-HANDOFF-2026-10-12.md), [known issues](KNOWN-ISSUES-2026-10-13.md), [verification plan](VERIFICATION-PLAN-2026-10-16.md), [original implementation plan](../FINAL-IMPLEMENTATION-PLAN.md), [scope ledger](FINAL-SCOPE-LEDGER-2026-10-11.json), [remaining scope/provenance](FINAL-REMAINING-WORK-2026-10-11.md), [UI baseline](UI-DESIGN-BASELINE-2026-10-15.md) and [deferred Add-ons](ADD-ONS-FIRST-UPDATE-BACKLOG-2026-10-15.md).

Later explicit user decisions supersede older plans. Code and current evidence settle what exists, not a stale "missing" row. A listed feature is not automatically an agreed requirement. Preserve conflicting evidence and resolve it in the scope audit. This plan supplements those records rather than erasing their history. Do not reuse old percentages as present completion estimates.

## Ownership and coordination

| Owner | Work |
| --- | --- |
| Claude | Editor, Home/navigation, Documents and More tools, converters, shared desktop integration, installer/packaging, uploads, cloud dispatch, robot harness and spare-PC coordination |
| Codex | PDF reader/search/readable view, markup, Drawing and Pages, reader parsing/output checks, memory/speed, graphics mechanism and help verifying integration |
| User | Scope choices beyond C, real printer measurements, real ordinary tasks, permission for physical printing/external effects, private-test/public-release acceptance |

Keep the existing file lanes. Claude integrates shared changes. Each agent commits only its own paths, updates its handoff and relevant issue in the fix commit, and records a regression check. No upload by Codex. Changes to dependencies, architecture, destructive operations or production security settings need the existing approval process; this plan does not override it.

Code work may proceed independently, but local app checks and builds are serialized through `agent-run` / `agent-build`. A long local robot/soak holds the lock; nobody launches a second check or rebuilds underneath it, including the same agent. Cloud runs can continue while local coding proceeds, but their evidence applies to the uploaded commit. Wait before uploading if it would cancel an active run. Spare-PC reservations are respected; signed-in desktop scheduled tasks only, not direct SSH app launches.

## Stage 1 — establish the actual main-app gap list

Both agents audit their own lane; Claude merges the result. Read the implementation of every adopted feature and its current acceptance evidence. Cover root requirements/feature trackers, R/M/F/A scope identifiers and later explicit user decisions, not merely the newest candidate lists. Deduplicate overlapping IDs without dropping the original requirement.

Create one shared ledger with these fields for every requirement: ID, requested behavior, source/decision, owner, UI entry point, code path, scope (main app / later / unresolved), implementation (built / partial / absent), evidence (unproven / local / fresh Windows / package / human), limitation, next action, acceptance check, commit and evidence path. An existing feature can be built and still unproven. An absent feature can be deferred rather than a current blocker.

Audit the following disputed candidates explicitly:

| Candidate | Starting point and decision rule |
| --- | --- |
| Direct editor print | Included by option C; Claude checks existing export/print preparation reuse before adding another pipeline |
| Picture resize and crop | Included by C; define drag/numeric resize, aspect ratio, crop preview/reset, undo, save/reopen/export fidelity |
| Picture rotation/wrapping/other types | Audit original agreement; not silently included by "resize and crop" |
| Installed fonts, comments/track changes, borders/shading, footnotes/columns/sections | Claude establishes which behavior was adopted versus later candidate; no blanket authorization to build the entire list |
| Workbook and slide tools | Existing tools needing current evidence; create generated XLSX/PPTX fixtures rather than waiting for personal samples; verify whether old "never tried" statements are still current |
| PDF read-aloud/count/spelling | Code and menu entries already exist; large-file on-demand mode disables these. Audit required whole-file/selection/tagged-order/scanned behavior; do not label the whole feature absent |
| Pen | Pressure, editing, partial erasing and save/reopen code already exist; identify coding gaps separately from unavailable physical stylus/palm evidence |
| Readable tables/columns and standard comment editing | Existing bounded support with named limits; audit exact agreed behavior and remaining standard-PDF gaps; exclude proprietary Bluebeam expansion |
| Automatic virtual-printer capture | Audit the original printer requirement and its installer/security lifecycle; no driver deployment is implied by this plan |

Publish the actual ledger for user review. Already agreed requirements and C's two extras need no repeated feature permission; genuinely ambiguous or additional scope needs a concrete user decision. Continue undisputed fixes while decisions are pending. No blanket rebuild of working features.

## Stage 2 — secure the immediate test package

| ID | Owner | Action | Completion evidence |
| --- | --- | --- | --- |
| P1 | Claude, Codex reviews | Integrate the approved outer graphics launcher and inner Electron runtime; inventory/hash both; keep shortcuts, installer and Open with pointing at the proper entry point | Packaged normal startup, one eligible retry, default Close, no loop, no retry once interactive/save-capable; clean process exit; [integration record](GRAPHICS-RECOVERY-INTEGRATION-2026-10-17.md) |
| P2 | Claude | Read the reserved 24-hour spare-PC robot outcome; replay failures and classify robot error versus real app bug | Exact seeds/steps, retained failure evidence, fixes plus passing replay; session count alone is not coverage |
| P3 | Claude | Install/copy, shortcut, file open, offline launch, uninstall and reinstall on the spare PC once available | Record Windows version/package hash, standard-user behavior, intact personal files and retained settings/drafts where intended; no surprise default-app changes |
| P4 | Both | Close current launch/save/recovery defects and obtain required cloud confirmation | Two consecutive full fresh-Windows runs pass without retries hiding failures, skips or weakened expectations; record each commit and job result |
| P5 | Claude | Build one quiet combined package and run its connected smoke workflows | Source/commit manifest, checksums, package path, result receipt and known-limitations list tied to that exact package |
| P6 | User | Use the Sunday checklist and approve a private test for dad | Printing/drawing tasks recorded, no unresolved data-loss/security blocker, guide matches package; user approval |

One full cloud run, 39107338420, was observed successful before this plan. That is not two consecutive passes, nor evidence that subsequently added features are checked. The graphics mechanism is already committed; integration is still a separate gate. Do not claim the Monday package is ready merely because these tasks are listed.

## Stage 3 — finish approved coding and targeted fixes

Priority: data loss/security/startup > broken ordinary task > incomplete agreed feature > usability. For every task: reproduce or define acceptance, implement a bounded change, check saved output independently, inspect relevant screens, commit, then continue. Do not churn unrelated code while a diagnostic runs.

| ID | Owner | Work package | Required result |
| --- | --- | --- | --- |
| C1 | Claude | Direct editor printing | Print from the editor without manually exporting first; current unsaved edits included; correct page size/orientation/ranges/scaling and preview; cancellation/quit safe; document remains intact and unmodified by printing |
| C2 | Claude | Picture resizing and cropping | Visible accessible controls, aspect-ratio behavior and crop/reset; undo/redo; correct DOCX/reopen/PDF output; original image/source untouched; unsupported RTF behavior disclosed instead of silently dropped |
| C3 | Claude | Editor correctness and recovery | Resolve robot-confirmed lost typing/caret/table/save issues, source changes and recovery conflicts; check huge documents/images against recorded budgets |
| C4 | Claude | Workbook/slides and converters | Generated and real permitted samples; edit/save/reopen; independent ZIP/XML/content and PDF/image inspection; preserve unrelated workbook/slide contents and originals; unsupported features reported |
| C5 | Claude | Forms, signing, redaction, OCR and other adopted tools | Complete confirmed gaps from audit; preserve fields/values where promised; redaction removes intended data, not just paints over it; OCR keeps artwork and reports recognition limits |
| X1 | Codex | Reader/search/readable view | Fix confirmed normal and on-demand failures; full search/cancellation/navigation/labels/links; close agreed layout/text-tool gaps identified by audit without promising arbitrary semantic reconstruction |
| X2 | Codex | Markup, standard drawing review and Pages | Complete agreed standard-PDF gaps; preserve annotations/private fields where promised; accurate crop/rotation/page operations and calibration; source unchanged, outputs verified independently |
| X3 | Codex | Memory and large files | Finish full normal-graphics soak and diagnose any failure; real permitted scan corpus and weaker-PC check remain separate from generated speed matrix |
| X4 | Codex | Accessibility/usability in owned tools | Remaining populated/error/keyboard branches; clear messages; no clipped controls at required sizes; focus restoration and tool-to-tool cleanup |
| A1 | Both, own lanes | Other agreed gaps found by Stage 1 | Add a separately scoped row with source, acceptance and owner before building; obtain user decision only where scope is genuinely new/ambiguous |

The long soak begun October 18 at 00:50 PDT is pending until its final report is inspected. Do not count a partial session as a 90-minute pass. Follow [the memory protocol](READER-NATURAL-SOAK-2026-10-17.md), including process-crash rejection, natural settling and clean descendant exit.

## Stage 4 — complete test matrix

Do these checks at the appropriate milestone, not an expensive whole-app rerun after every text edit. Focused tests follow each fix; combined checks follow each integration batch; final gates run after the feature freeze. Existing passing evidence is reusable only for unchanged relevant code/build/hardware conditions.

| Layer / risk | Required checks | Owner and evidence |
| --- | --- | --- |
| Unit/contract | Relevant units, bounds, invalid inputs, parser limits, cancellation and deterministic geometry; full unit suite before integrated upload | Both; command, counts, commit; no mirrored-implementation-only evidence |
| Real built app | Existing desktop suite plus targeted checks for each changed feature; names/roles and real completion signals; attach diagnostics on failure | Both under agent-run; generated fixture available in cloud |
| Independent output | Read bytes from disk using a separate parser/renderer; counts/order/rotation/boxes/text/images/links/annotations/form values and unchanged unrelated content | Both; parser/renderer named; writer and its own success message do not serve as sole proof |
| Save safety | Every save/export route: staged write, disk validation, safe publish/authorized replacement, existing-target refusal or correct backup, no source change unless explicitly requested, no partial files | Both; extend [Codex audit](READER-SAVE-SAFETY-2026-10-17.md) and Claude route audit |
| Save/recovery faults | Cancel picker, inaccessible destination, exhausted space simulated in isolated test storage where feasible, source changed externally, close during checking, synthetic test crash during save/recovery | Both; temporary test data only; no interruption of a real user save; original/draft recoverable, cleanup verified |
| Connected workflows | PDF open → find → markup → organize → save → reopen; document type → picture → format → save DOCX/RTF → reopen → PDF/print; image/scan → PDF/OCR → find → save/reopen | Both; saved-file verification at every boundary, not only final toast |
| Visual by eye | All changed screens plus omitted states: empty/loading/populated/saved/canceled/error; 800x620 and 1366x820, 100% and 150% interface text; menus/dialogs and long names | Each lane; personally inspect every captured image; ledger of passed/fixed/blocked/untested with paths |
| Keyboard/accessibility | Tab order/reachability, visible focus, Enter/Space, Escape and focus return; reading order, labels, high contrast; Narrator/NVDA core-task check | Both; automation is distinct from actual assistive-technology/human evidence |
| Stress/memory | Full 60–120-minute normal-graphics reader soak; process-tree private bytes, no crash resets, steady plateau; 1,000 pages, 200 MB+ referenced raster and very large page size; document typing/save stress | Codex reader, Claude editor/converters; named PC/graphics mode and numeric budgets; generated raster is not photographic/OCR proof |
| Robot/exploration | Seeded replayable visible-name actions, tool transitions, cancellation, repeated edits and saved result readback; coverage map to every adopted tool and meaningful action pairs | Claude harness, both actions; 24-hour outcome and shortest reproducible failures; hidden robot is not visible screen-control/human acceptance |
| Fresh Windows | Full units/build/app jobs, independent generated fixtures, no private sample dependency; two consecutive successful full workflows after final changes | Claude uploads/dispatches, both fix own failures; record exact heads and full job results, not only selected desktop cases |
| Packaged installation | Exact distributed package, clean standard-user install/copy, first launch, shortcut/Open with where opted in, second-instance handoff, quit/reopen, uninstall/reinstall, offline operation | Claude on spare desktop when free; retain logs/hash and limitations; folder-copy smoke does not prove installer |
| Security/privacy | Review Electron/IPC/path handling, contained readers, malformed/hostile fixtures, oversized/deep inputs, outbound network behavior, embedded actions/attachments and report redaction | Claude shared/shell, Codex own parsers; generated malicious fixtures inside sandbox; no security weakening to pass tests; reports never upload documents automatically |
| Compatibility | Open representative saved PDF in installed independent software; DOCX/RTF/XLSX/PPTX in applicable real office software where available; compare appearance and editability | Agents prepare samples; user/tester supplies outside apps where unavailable; missing software remains explicitly blocked |
| Physical printing | Calibration page: 100 mm and 4-inch rulers, 50x50 mm square; actual size on Epson WF-3820; then ordinary PDF and editor output with expected page count/orientation | User follows [printer steps](PRINTER-ACCEPTANCE-2026-10-15.md); record measured values/scaling; no physical job sent without permission |
| Release/supply chain | Inventory/hashes, dependency/native/font/OCR licensing review, documented app licence decision, signing status, correct notices and private-fixture exclusions | Claude/user; unsigned private test and signed public release are separate decisions; signing does not by itself promise no Windows warning |
| Human acceptance | Existing 23-task checklist, drawing-focused Sunday check and dad's guide; record task/file/result/confusion/slowness and package version | User/dad; fixes return to the owning lane and get a regression check |

Audio playback stays off in automated/hidden runs. Validate speech preparation, ordering, stop/resume and cancel programmatically; actual audible acceptance needs the user's explicit permission. Do not read/store the user's real passwords; generated test credentials and isolated fixtures only. Printing, registration and external-app launches respect their existing authorization boundaries.

## Stage 5 — decide when it is finished

**A feature is complete** when the adopted behavior is implemented, reachable and understandable; saved output is independently correct; failures/cancellation preserve data; regression checks pass; relevant screenshots are viewed; limitations and evidence are recorded. A button existing is not completion. A human-only check awaiting equipment is blocked, not passed.

**The dad test package is acceptable** only when the intended drawing/read/markup/save/reopen/print preparation workflows pass in the exact package; no known critical data-loss/security/startup blocker remains; fallback and installer/copy path are checked; unresolved limitations are plainly listed; and the user approves. Do not silently present it as a finished public release.

**The main app is finished for this scope** when the audit has no unresolved in-scope absent/partial feature without an explicit user-approved limitation, all critical release checks pass, two consecutive full cloud workflows pass on the frozen candidate, real human/device results are recorded or their limited-release exceptions accepted, and the exact package has traceable manifests/results. Later features stay in their backlog. Public release additionally needs licence/distribution/signing decisions and the applicable compatibility/security/installation gates closed.

No skip, enlarged timeout or retry makes a defect disappear. Waits must track real ready/done signals with bounded diagnostics. A justified obsolete expectation may be corrected with recorded evidence. Any change after freeze requires the affected checks again; changes to startup/save/security/packaging require a new final candidate and relevant broad confirmation.

## Reporting and next actions

Use stable task IDs above. Each update: task, owner, status, change/commit, tests and output verification, screenshot review, remaining blocker and next action. Keep known issues current; link receipts in the shared Drive folder. Never use percentages without an audited denominator.

1. Claude acknowledges scope C, creates/merges the feature ledger, integrates graphics, then takes workbook/slides and editor printing/pictures in bounded batches.
2. Codex inspects the active memory run when complete, audits reader/Drawing/Pages requirements, fixes confirmed failures and takes the highest-priority agreed coding gap from that ledger.
3. Both keep cloud/robot results tied to their tested commit, preserve failure seeds and share integration requests through their handoffs. [Start here](AI-START-HERE.md) links the continuation/evidence archive.
4. User reviews only unresolved scope decisions and the final concrete test package, then performs printer/everyday tasks. No repeated "keep going" is needed for already authorized tasks; agents proceed through their owned list and report real blockers.

This document does not assert that Claude has read or accepted its assignments yet. The user relays it, or Claude reads the shared folder. No source feature, app test, installer, upload or physical print was executed by writing this plan.
