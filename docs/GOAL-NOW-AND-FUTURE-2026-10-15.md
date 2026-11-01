# PDFix — agreed goal, current work and future plans

Confirmed with the user on October 15, 2026. This is a summary of the recent decisions, not a fresh audit of every feature or release approval.

## 1. Our goal

Build a dependable, fast, easy-to-use main PDFix app for everyday document work: open supported files (including supported pictures), read/search, create/edit documents, organize pages, convert, annotate, use forms/signatures, save/export and print. Verify the supported behavior and disclose format/size/preservation limits. Protect user files and recovery data. No promise of literal perfection or every file type.

The design principle is: **one clean, document-centered app with powerful connected tools that appear when needed.** Keep the document central, use plain language and familiar controls, and avoid clutter, forced AI, login walls for ordinary local work, advertising or upgrade pressure. Core PDF work remains free.

## 2. What we work on now

1. Finish and prove the agreed main-app features and supported file workflows. Fix confirmed defects before expanding scope.
2. Reconcile existing evidence with the current source/build. Code present, a tool opening, compilation and a test pass are different levels of evidence.
3. Test connected workflows, not just individual tools: open → edit/annotate → organize/convert → save → close → reopen → independently validate. Check permitted transformations and losses rather than assuming every operation preserves every PDF structure.
4. Investigate outstanding performance/memory and graphics/startup problems. The reader closeout contains scoped passes, not universal release acceptance.
5. Run human/visible desktop/device acceptance and clean-machine package tests, then fix the resulting problems in the assigned lanes.
6. Integrate a consistent combined build and make release decisions against evidence from that build. A past combined build does not certify later dirty edits.

Do not start a broad workspace redesign or all future features during this closeout. Small usability fixes that make current features work remain appropriate.

## 3. Who owns the work

| Agent | Current responsibility |
| --- | --- |
| Codex | Reader, search, readable view, general PDF markup and assigned Drawing/Pages tools; scoped correctness, performance and regression evidence. |
| Claude | Document editor, shell/navigation, Documents/More tools, converters, shared integration and final combined build. |
| Both, within ownership | Preserve shared contracts; test connected main-app workflows, keep defects/evidence visible and coordinate fixes without overwriting the other agent. |
| Human testers | Real document tasks, confusing interactions, physical printing, supported-machine differences and accessibility/output acceptance that automation cannot establish alone. |

Ownership is defined by AGENT-WORKFLOW.md, not by the proposed future workspace labels. Claude's latest full remaining-work status must be checked in its own handoff; this summary does not certify that lane complete or claim Claude has acknowledged new notes.

## 4. Testing we must not skip

Use all three layers: automated code/integration checks; AI computer use of the actual desktop app; human testing. Record each separately. Existing hidden Electron checks are not proof of an autonomous visible desktop explorer. Browser harnesses are not desktop acceptance.

Cover individual tools, compatible ordered pairs, realistic longer workflows and exploratory unusual sequences. Include cancellation, repeated operations, unsaved switches, undo/redo, failure and recovery. Exhausting every imaginable sequence is impossible; track risk-based coverage and missing cases honestly.

The full [quality register](QUALITY-VERIFICATION-REGISTER-2026-10-15.md) preserves all **12 development traps** and **13 specialized test areas**. Its checks include:

- Original/output integrity, safe saves, supported structure preservation, signing/redaction correctness and independent reopen.
- Security of untrusted files, native helpers, IPC and filesystem boundaries; privacy, offline operation and consent for any reports or uploads.
- Crash/recovery, cancelled/interrupted operations, permissions/disk failures and repeated large-file responsiveness/memory.
- Outside-reader compatibility, independent/differential output validation, accessibility and long-duration use.
- Actual installer/package testing, clean Windows, upgrades/migrations/failed-update recovery and release provenance.
- Dependency/bundled-font/tool licensing, supply chain, maintainable architecture and shared-service consistency.
- First-time human usability and connected workflow success, rather than feature counts.

Each result needs reproducible steps, expected outcomes, input/output artifacts where relevant, tested source/build provenance, status, limitations and defect/retest links. Keep failures/skips visible. Do not weaken assertions merely to obtain green tests. Use independent checks/review where possible; disclose missing independence. No new test framework, autonomous service, VM or extra AI reviewer was implemented by saving these requirements.

## 5. What counts as ready

Public release needs verified critical workflows, no known unresolved document-corruption/data-loss or critical security defects, applicable regression checks passing with exceptions explained, major connected workflows exercised, successful human tasks and clean-machine package evidence. Document remaining minor issues and limitations. Human approval precedes public release.

Use staged internal testing → private beta → wider beta → stable decisions based on results. Do not use an old percentage, number of buttons, tester headcount or AI assurance as release proof. A main-app lane coding closeout is not whole-app readiness.

## 6. UI plans — later, with a consistent philosophy

The approved future task groupings are **Documents & Publishing** (default), **Science & Data**, **Engineering** and **Research**. They must feel like **one connected app**, working with the same files and reusable controls, not four separate programs. They describe future emphasis, not four interfaces to implement now.

Exact placements, labels, groups and panel arrangements stay flexible. Improve them for clear usability reasons, especially real user-testing evidence. Before broad rearrangement, prepare a coordinated mockup and task-flow/tool mapping so the changes are concrete and reviewable. Keep specialist tools contextual and advanced components loaded only when needed.

## 7. Deferred expansion

- Bluebeam-specific compatibility/advanced engineering work and its dedicated workspace remain set aside while the main app is finished and tested.
- All **30 Add-ons** remain in the [first-update backlog](ADD-ONS-FIRST-UPDATE-BACKLOG-2026-10-15.md), intended for later consideration around the human-testing/update phase. Human-test defects retain priority. This is not a promise to ship all 30 plus Bluebeam in a single small update.
- The broader Science/Data, Engineering and Research ideas remain future scope with their own implementation and acceptance work; naming a workspace does not build its capabilities.
- Existing agreed main-app features are not silently deferred just because a future add-on overlaps them. Future expansion must preserve main-app reliability, startup speed and simplicity.

## 8. Immediate next coordination

The integrator should link this summary, the UI baseline and quality register from the master plan; reconcile current evidence and assign outstanding gates. Then choose and execute the next highest-risk existing main-app workflow, independently inspect its output, record any defect and verify the repair. Keep work in the assigned lanes. Broad UI/workspace work and specialist expansion stay later.

## Checked source records

- [Approved UI baseline](UI-DESIGN-BASELINE-2026-10-15.md) and its full supplied reference.
- [Quality verification register](QUALITY-VERIFICATION-REGISTER-2026-10-15.md) and its full supplied reference.
- [Reader closeout and open gates](CODEX-MAIN-APP-CLOSEOUT-2026-10-15.md), [known issues](KNOWN-ISSUES-2026-10-13.md), existing [reliability gates](RELIABILITY-PERFORMANCE-USABILITY-GATES.md), [agent workflow](AGENT-WORKFLOW.md), [Claude handoff](CLAUDE-HANDOFF-2026-10-12.md) and [Codex handoff](PDF-READER-PARALLEL-HANDOFF-2026-10-12.md).

The newly reattached quality reference was compared byte-for-byte by SHA-256 with the saved reference; they match. The register retains Q01–Q12 and X01–X13, and the Add-ons backlog retains ADD-01–ADD-30. This verifies preservation and consistency of the planning records; it does not mean all risks were audited, all app tests rerun or every gate passed today. Old figures in the supplied conversation are historical, not current readiness metrics.
