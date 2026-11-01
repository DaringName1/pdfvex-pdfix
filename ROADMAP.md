# Ordered roadmap

**October 7 Acrobat expansion:** the full user comparison is adopted as R41/A01–A25 in [ACROBAT-COMPETITIVE-PLAN.md](ACROBAT-COMPETITIVE-PLAN.md). Core file reliability, selection/editing, drawing comments, recovery, accessibility and containment stay first. Certificate services, specialist print/standards/forms/containers, 3D/GIS/media, managed policies and platform clients follow their engine/service/security dependencies. Historical first-release exclusions do not remove these new later targets from the full plan. F01–F42 remain in scope, and this addition establishes no new completion percentage or release date.

**Current whole-scope status (October 4):** [complete feature/debug/testing inventory](PDFIX-COMPLETE-STATUS-2026-10-04.md) and [full future list](PDFIX-FUTURE-FEATURES.md). These distinguish older executed tests from newer untested code and unfinished acceptance; older entries below are historical checkpoints. New R40 requires PDF-only fullscreen.


Status is maintained in PHASE-LOG.md. No phase advances until its gate passes. Planned features are not advertised as working.

User-directed order adjustment: after the verified foundation/reader/page operations, the user explicitly prioritized a visible Word/Google Docs inspired editing workspace and robust selection. The subsequent common-image preview/PDF slice is also pulled forward, with its own preservation/recovery gates and remaining multi-image/codec work. Phase 4's basic editor/DOCX import/export and local recovery were pulled forward as a separate tested slice. Phase 3 remains incomplete; this does not mark Phase 4 or the product complete. Basic local English OCR, correction review and verified searchable output are now implemented; a broad quality corpus and remaining PDF fixes are next.

| Phase | Work | Depends on | Completion gate |
| --- | --- | --- | --- |
| 1 Foundation | Native shell; mockup-inspired home; picker/drop; bounded file opening; recent/favorites/filter; support matrix; new-copy safety | Product/architecture docs | Native launch, actual-file picker/drop/reopen tests, malicious/oversized/stale errors, original-preservation tests, build |
| 2 PDF reading | Pages/thumbnails; selection; page navigation; zoom/fit; text search; print; password and scan hints | Phase 1 | Multi-page actual PDF renders; text search/page refs; print preparation all pages; correct/incorrect password; damaged PDF; worker/resource checks |
| 3 PDF fixes | Page order/rotate/extract/combine/split; annotations/forms/signature; local OCR and correction; preview compression; verified redaction; password protection; copy save | Phase 2 | Reopen outputs; OCR expected terms/positions on scan corpus; redaction extraction/object/image tests; compression quality/size checks; no original writes; memory/cancellation |
| 4 Documents/images | TXT/MD/data preview/edit; familiar rich editor for suitable formats; PNG/JPEG/WebP; TIFF/HEIC evaluation; DOCX/RTF imports; office preview/conversion | Phase 3 | Real fixture corpus; round trips; explicit fidelity warnings; original hash unchanged; recovery |
| 5 AI connections | Separate model/agent setup; endpoint validation/test; discovery; Windows secure secrets; selected context/consent; cited answers; Hermes; generic adapter | Phase 4 | Mock local/remote endpoints exercise consent denial/approval, removal, secret persistence; no unselected content or arbitrary agent writes; real integration only with available user connection |
| 6 Compatibility/polish | Legacy/Apple format feasibility; accessibility; installer; recovery; usability | Phase 5 | Clean Windows install/uninstall; keyboard/screen-reader review; corpus-derived support matrix; no unsupported claims |
| 7 Release readiness | Security/licensing; signing; installation guide; verified matrix; performance regression checks | Phase 6 | Security review, notices/SBOM, clean-machine test, documented support; signing/publishing credentials supplied if distribution requested |

## Expanded requirement sequencing

All additions and acceptance targets are defined in `REQUIREMENTS.md`; `FEATURE-TRACKER.md` reconciles their status and useful additions; they supplement existing gates rather than replacing them.

1. **Work protection now (R01–R05):** bounded local version history, preview/restore with a checkpoint of the current state, recovery after process termination, safe departure when autosave fails, and separate history/recovery cleanup. These are now implemented in the scoped editor; compare PHASE-LOG.md for verification and bounds. This strengthens the already user-prioritized editor slice and is a dependency for recoverable fixes.
2. **Reader improvements (R06–R10, R31–R32):** native window/pane controls and compact layouts; document outline/page labels, personal bookmarks/last-read position and fit-page/view rotation; scoped two-PDF/source-output comparison is implemented with manual alignment for arbitrary page reorders and automatic page-plan alignment for organizer output. Remaining: additional page layouts; safe link/attachment routing; broader comparison/alignment corpus; print ranges/paper/orientation/preview. Ship each tested slice without relabeling the entire phase.
3. **Finish PDF fixes (R11–R15, R21, R29, R33–R36):** broaden implemented crop/resize fixtures, broaden implemented every-N/custom-group splitting and add page-plan recovery, supported PDF text/image edits, broaden the implemented supported forms/confirmed visual-signature workflow (tab order/fonts/calculations/corpus), and add PDF creation; broaden the OCR corpus/languages and scan cleanup; then annotation-preserving edits, broader form/visual-signature verification, broader implemented compression corpus/native resource hardening, broader implemented clean-image redaction verification, vector-preserving redaction, broader implemented password-protection/removal compatibility and integration of authorized unprotected copies with other writers. PDF comparison supports review; batch jobs only queue verified operations.
4. **Documents/images/fidelity (R16–R20):** expand tested adapters to BMP/TIFF/HEIC/Office/RTF as feasible, preservation choices and source/output comparisons. Evaluate Live Photo components and PDF/A/tagged output behind explicit engine/validator gates. Do not promise difficult formats or standards before verification.
5. **AI (R24–R27):** per-request scoped consent, endpoint/upstream and billing disclosure, secure secrets/test/removal, citations, injection resistance, image capability/uncertainty and content-free transfer records. Proposed edits require separate approval.
6. **Polish/release (R22, R23, R28–R30):** accessibility review of every workflow, Windows sharing and opt-in integration/default-reader setup, installer/uninstaller/upgrade tests, separate logo derivatives, expanded real-file/security/licensing corpus. Cloud sharing remains explicit and optional.

## Adopted future backlog — October 4, 2026

The user has added the entire [F01–F42 future list](PDFIX-FUTURE-FEATURES.md) to the product plan. Its placement is recorded in [PRODUCT-PLAN.md](PRODUCT-PLAN.md). Treat it and the existing requirements/master/Sandbox/Bluebeam scope as the baseline to complete; focus on implementation, debugging and acceptance rather than adding speculative features. Further product additions come from the user's direction. Necessary fixes and dependencies remain in scope.

Reader/fullscreen work comes first, followed by the existing drawing/comment priorities and unfinished feature/acceptance gates. Future service/standards evaluations retain their prerequisites and later staging; first-release exclusions remain unchanged. Exact current evidence is in the [complete status report](PDFIX-COMPLETE-STATUS-2026-10-04.md).

## Format evaluation order

PDF -> text/data -> browser-native images -> DOCX/RTF -> XLSX/PPTX -> TIFF/HEIC -> legacy Office -> Apple iWork. Office/Apple containers must be inspected for bounded ZIP extraction, macros, external relationships, hidden content and compression bombs.

## Exit/checkpoint policy

At a tool/session limit, finish verification of current changes, leave `npm start` runnable, and record an exact unfinished gate and next command. Missing a decoder/credential does not justify fake UI/results. Routine reversible choices need no approval. Paid services, destructive actions and owner-only credentials pause only the dependent work.

## Security Sandbox priority and complete master-list intake

R37 is pulled forward: implement Windows AppContainer containment for qpdf compression/password jobs and renderer restrictions, then expose honest security status. OS containment requires later hidden runtime verification; a compile does not establish isolation. R38 and MASTER-GAP-TRACKER.md retain every master-list item, including later candidates and initial-release exclusions, within the existing ordered phases. The complete source is preserved as PDFix-Missing-Features-Master-List.md.


## Bluebeam/Revu priority — 2026-10-03

R39 joins the existing review/drawing workstreams. First implement B01–B05: visible existing markups, searchable sheet-linked list, supported replies/states/locks, preservation and comment reports. Next B06–B10 add drawing-review tools, revisions and sheet sets. B11–B12 follow for custom data and takeoffs. Studio and proprietary BAX/BTX support need separate evaluation. See [BLUEBEAM-COMPATIBILITY-PLAN.md](BLUEBEAM-COMPATIBILITY-PLAN.md); existing reader annotation support is not full Bluebeam acceptance.


## October 9 user additions — free printing and reading/writing tools

Adopt F43–F46 / R42–R45: virtual PDF printer, local read aloud, expanded word count and spell-checking. R46 requires PDFix to stay free, with no required paid APIs/subscriptions, feature unlocks or purchase/upgrade links. These features use free local components; Whisper is not a speech-synthesis engine. The existing basic editor word counter is only a starting point. See [detailed scope and dependencies](READING-WRITING-PRINT-PLAN.md). No new code, tests, installs or paid integrations are claimed. Prior adopted scope remains, with provider/engine choices subject to the free-app requirement.

## Top release gates — reliability, scale, and clear workspaces (October 9, 2026)

Before beta, execute the [acceptance matrix](docs/RELIABILITY-PERFORMANCE-USABILITY-GATES.md): fail-closed, original-preserving save/sign/split/redact and blueprint outputs with independent reopen and validation; measured 500-page/300 MB navigation on realistic hardware with bounded visible-page work; and task studies for separate Drawing, Document, and Pages workspaces. Define numeric performance targets and drawing tolerances from measurements before claiming a pass. “Never corrupt” and “100% bug-free” are goals, not guarantees; compilation does not close runtime gates. All rows remain pending while the user-requested coding pass defers runtime testing. Existing full scope and the free-app rule remain unchanged.

## October 11 priority and adopted free-tool scope

Put the Workspaces, PDF viewer and original-content editor gaps first. Integrate automatic field/outline suggestions and page geometry tools within those rooms without increasing persistent toolbar clutter.

Adopt all F47–F66 / R47 additions in [FREE-ACROBAT-ADDITIONS-PLAN.md](FREE-ACROBAT-ADDITIONS-PLAN.md). R48 introduces explicit selected-folder grants for folder search and separately approved watchers; earlier selected-file behavior remains the default until these routes are implemented. Follow the detailed work order, preserve original/Sandbox/recovery rules and keep features free. This is saved scope, not completed implementation or acceptance.



## October 11 complete scope consolidation

[Final implementation plan](FINAL-IMPLEMENTATION-PLAN.md) sets the current order: Workspaces → PDF viewing → PDF editing → PDF creation/document toolbar → Bluebeam comments/review → remaining complete adopted scope → digital-pen drawing → full UI/function and release acceptance. The [complete remaining-work register](docs/FINAL-REMAINING-WORK-2026-10-11.md) and [source-preserving scope ledger](docs/FINAL-SCOPE-LEDGER-2026-10-11.json) retain R01–R50, S00, all 71 M rows, B01–B12, F01–F67, A01–A25 and G01–G16/D01–D22. Every earlier specification, dependency, preservation/security/free-app rule and applicable acceptance gate remains represented. Later adopted specialist targets supersede only their historical staging exclusions; unrelated excluded scope is retained as a boundary.

R49 records the familiar creation toolbar, comment viewing/adding/eligible editing and requested full UI/function pass. R50/F67 records digital-pen PDF handwriting and saved editable ink. Existing basic ink and newly coded toolbar/comment controls do not complete the broader targets. Current checks are scoped evidence; no blanket all-features/all-files or release-ready claim is made.
