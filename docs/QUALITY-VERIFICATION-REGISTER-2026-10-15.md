# PDFix quality safeguards and verification register — October 15, 2026

User requirement: do not skip the risks and verification expectations in the [complete supplied reference](intake/QUALITY-AND-COMPUTER-USE-USER-REFERENCE-2026-10-15.md). This is a durable acceptance checklist, not a completed audit, an implemented autonomous tester, or a new testing-framework dependency. The source is preserved verbatim; its historical numbers, example results, suggested tools and embedded prompts are not fresh repository findings or automatically executed instructions.

## Current scope

Finish the main app and its agreed features first. The four future workspaces and broad UI reorganization come later. They must feel like one connected app, not four isolated products. Verify connected existing main-app workflows now; do not build future workspaces merely to test them. Bluebeam expansion and the 30 Add-ons remain deferred. A reliability safeguard does not become optional merely because workspace redesign is deferred.

## Three required evidence layers

1. Automated source, integration and document-output checks, including meaningful negative cases and independent output validation.
2. AI computer-use testing of the actual desktop app: observe the interface, click/type/scroll, exercise tools and connected tasks, save/close/reopen and verify results. Distinguish visible desktop interaction, hidden Electron automation, browser harnesses and mocked controls. Existing hidden native-controller results are useful but do not prove a complete autonomous visual explorer or physical desktop acceptance.
3. Human use: ordinary tasks, confusing UI, real files, different supported Windows machines and devices. Include actual printer and assistive-technology acceptance where applicable.

No claim that every possible sequence can be exhausted. Maintain four coverage categories: individual supported tools; compatible ordered pairs (both orders where meaningful); realistic longer workflows; exploratory unusual sequences, cancellation and interruptions. Mark impossible/inapplicable combinations with a reason. Prioritize opening, editing, saving, conversion, merge/split, forms, signing and redaction, including unsaved transitions and recovery.

## Evidence and failure rules

For each supported behavior/workflow record: stable ID; input fixture and expected outcome; tested commit plus source/build manifest and dirty-state provenance; app/OS/hardware/tool versions; executed steps and test command; result (untested, passing within stated scope, failing, blocked or not applicable with reason); logs/screenshots; original and output hashes and independent readback when applicable; limitations; defect/retest links; owner and reviewer. Keep fixture permissions and private data out of public reports. Retest relevant evidence after affected code changes; an old green run does not certify a later build.

Never silently delete, skip or weaken failed checks, or change expected outputs only to match broken code. Correct stale tests only with an explained behavior contract and a reviewed assertion diff. Distinguish environment failures from product failures while retaining both. Preserve failure artifacts and add meaningful regression coverage for repaired defects. AI may investigate and propose repairs; its assertion that a feature works is not evidence. Separate implementation authorship from independent checking/final review where possible, and record when that independence is absent. Human approval is required before public release.

## Risk register — retained from all 12 original traps

All rows require evidence reconciliation; none is certified passed by this document. Existing scoped evidence can be linked without restarting completed checks or replacing it with estimates.

| ID | Risk to check | Required proof / coordination |
| --- | --- | --- |
| Q01 | Illusion of completeness | Real input-to-output behavior; separate coded, opened, exercised and independently validated states. |
| Q02 | Concurrent-agent incompatibility | Explicit shared contracts, ownership, source-consistent builds and integration tests. Follow AGENT-WORKFLOW.md: same main checkout, exact-path commits, no new branches/stashes/merges in the shared folder. Generic isolated-branch advice in the reference does not supersede that rule. |
| Q03 | Corruption or silent loss | Save/reopen and independent visual/structural checks for pages, text, fonts, forms, annotations, links, layers and other claimed preservation; distinguish permitted transformation losses and signature invalidation. Recovery and interrupted/failed writes must preserve originals under each route's documented save policy. |
| Q04 | Unsafe untrusted-file handling | Electron permissions/isolation, narrow IPC, path/argument checks, native-helper containment and bounded hostile-file tests; security claims need executed evidence. |
| Q05 | Duplicate incompatible services | Audit loading, saving, history, dialogs and export ownership/contracts. Record actual duplication before proposing reuse; no unapproved architecture rewrite. |
| Q06 | Tests proving the wrong behavior | Independent fixtures/oracles, meaningful outputs, negative controls, assertion review and reproducible defects. |
| Q07 | Broken connected workflows | Existing tool transitions, ordering, save/reopen and unsaved-state behavior; later extend to future workspaces. |
| Q08 | Scale and performance collapse | Real large/scanned/image-heavy PDFs, named hardware, timings, responsiveness, repeated operation memory, cancellation and resource limits. A-R2 remains open. |
| Q09 | Licensing and redistribution | Dependency/bundled-engine/font inventory, SBOM or equivalent provenance, notices and redistribution review; unresolved licensing is not a software-test pass. |
| Q10 | Maintainability/AI dependency | Accurate architecture/module contracts, decision records, contributor setup and reproducible commands; review against source. |
| Q11 | Packaged/development differences | Actual installer/package on clean supported Windows, paths, native helpers, fonts, permissions, offline behavior and update/uninstall. Built source Electron is not installer proof. |
| Q12 | Feature overload | First-time human task completion, discovery, keyboard usability and document space; evaluate against the approved UI philosophy without starting deferred redesign. |

## Specialized coverage — retain all 13 additional areas

| ID | Area | Acceptance evidence still required |
| --- | --- | --- |
| X01 | Outside-reader compatibility | Open representative outputs in independent installed readers; label independent parser checks separately from real Acrobat/Edge/etc. use. |
| X02 | Data integrity | Check claimed structures, pages, appearances and signature policy, not only page count or successful open. |
| X03 | Security | Malicious/malformed corpus, IPC/filesystem/native helper boundaries and dependency findings; controlled disposable environment. |
| X04 | Crash and recovery | Interrupted save/conversion, crash/restart, shutdown, disk/permission failures and recovery of unsaved work. Real power-loss testing requires a safe separate setup. |
| X05 | Performance and stress | Repeated large-file/image operations, measured peaks/latencies, stale cancellation and long-run trends. |
| X06 | Installation and updates | Fresh install, native resources, failed install/update, uninstall and retained user data policy. |
| X07 | Accessibility | Keyboard/focus, screen reader, scaling/contrast and human observation; automated checks alone insufficient. |
| X08 | Differential validation | Independent PDF engines or standards validators appropriate to the claimed format; documented visual/semantic tolerances. No PDF/A or PDF/UA claim from ordinary reopen. |
| X09 | Long-duration operation | Hours of representative use with trends, hangs/crashes, cleanup and recovery, not only short smoke runs. |
| X10 | Release/supply chain | Reproducible provenance, pinned/dependency review, notices, final package contents/hashes and safe distribution. |
| X11 | Independent verification | Separate review of critical repairs and outputs where possible; document reviewer limitations and missing independence. No extra agent was launched by this intake. |
| X12 | Privacy and offline | Normal tasks offline; inspect unexpected network transfer; reports/telemetry need appropriate consent. No automatic upload of documents, logs or personal data. |
| X13 | Release-to-release migration | Upgrade real prior profiles/settings/drafts safely, retain backups and exercise failed-update recovery. |

## Release gates and reporting

Seven coordinated parts remain visible: automated code/integration checks; real-app AI exploration; human usability/beta testing; integrity/compatibility; security/privacy/dependencies; performance/stress/recovery; release validation and consent-based bug reporting. Bug reporting is a requirement to assess, not a claim that an upload service is implemented or authorized.

Public release requires executed critical workflows, no known unresolved document-corruption/data-loss or critical security defects, passing applicable regression checks with failures/skips explained, major connected workflow coverage, successful human tasks and clean-machine package evidence. Record and prioritize remaining minor defects. Stage internal, private beta, public beta and stable decisions according to actual evidence; suggested tester counts in the attachment are guidance, not sufficient release criteria. Do not advertise universal perfection or a misleading single completion percentage.

Existing [reliability gates](RELIABILITY-PERFORMANCE-USABILITY-GATES.md), [known issues](KNOWN-ISSUES-2026-10-13.md), [reader closeout](CODEX-MAIN-APP-CLOSEOUT-2026-10-15.md) and [UI baseline](UI-DESIGN-BASELINE-2026-10-15.md) are complementary. This checklist does not close their open gates. Historical 90%/15%/166-of-191/20-of-49 and 0-of-8 numbers in the reference are not current measurements and must not be reused as current readiness statistics.

## Requests for the integrator / next action

Link this register and preserved reference from the master trackers. Reconcile existing test runners/evidence into behavior-level records first; reuse the current stack rather than adding frameworks merely because the reference names them. Choose a small real-app connected workflow as the next proof, record its expected output, exercise it, independently inspect it, then expand risk-based coverage. Keep failures visible and nominate owners/reviewers for the open rows. Native desktop computer-use capability and a safe dedicated Windows test environment must be confirmed before promising an autonomous visual explorer; a browser panel is not a substitute for PDFix desktop acceptance.

No application, dependency, CI, architecture or automation changes were made by this intake. Claude's current shell/layout work was left untouched. This is saved scope and acceptance guidance, not a completed repository-level audit.
