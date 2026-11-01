# Development and private-beta readiness

Updated 2026-10-04. The user's full feature objective and saved master list remain active.

The conversational estimate of 65% feature coding complete / 35% remaining is a rough planning judgment, not a weighted audit, measured score or release-readiness percentage. The master tracker has 71 broad acceptance targets, plus Security Sandbox and Bluebeam additions. Many have implemented subsets; their full acceptance checkboxes remain open. An unchecked broad target does not mean its entire implementation is absent.

Six substantial remaining work areas are broader document/PDF editing fidelity; Bluebeam/drawing interoperability; remaining native sandbox adoption and isolation acceptance; additional formats/scanning/OCR; batch and multi-file workflows; and Windows packaging/accessibility/release polish. Exact boundaries are in MASTER-GAP-TRACKER.md, FEATURE-TRACKER.md and the per-feature progress documents.

Current coding advances include inline document images, nested PDF image/text editing, preserved editable table column grids, contained Office/comment/takeoff processing, search across deliberately selected files, authored document headers/footers, reviewed batch compression, supported XFDF import and contained structural PDF reporting/cleanup. Source implementation, validation code, syntax checks and compilation are separate evidence from executed runtime verification.

A limited private beta is a narrower release milestone than the full product objective. Before describing a build as beta-ready, it needs actual launch/open/edit/export/reopen/recovery checks, original preservation, cancellation/error handling, effective Windows sandbox boundaries and a review of the supported-format limits. Wider formats and later candidates can continue after a carefully scoped beta, while staying on the full product plan. Runtime tests remain deferred under the user's coding-first instruction; this note authorizes no testing, installation, distribution or publication.


Latest saved source also adds reviewed table/scan-region extraction to CSV, a scoped document health report, and rotated/non-unit text-layer geometry corrections. A local Windows development package was created from an earlier 240-module snapshot; it does not contain those later changes. Current source compilation is newer. This advances implementation without satisfying the remaining private-beta runtime gates.


The current app was visibly opened for the user on October 4, and the user reported good appearance plus substantial debugging needs and missing PDF-only fullscreen. This is initial preview feedback, not feature/regression or beta acceptance. The current complete status and future work are saved in [whole-scope inventory](../PDFIX-COMPLETE-STATUS-2026-10-04.md) and [future list](../PDFIX-FUTURE-FEATURES.md); R40 captures PDF-only fullscreen. The inventory was prepared from source/logs without new runtime tests.
