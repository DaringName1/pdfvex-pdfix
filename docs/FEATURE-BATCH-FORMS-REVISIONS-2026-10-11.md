# PDFix forms, bookmarks and drawing revisions — October 11, 2026

This implementation batch advances five adopted feature areas without changing the complete scope or creating another plan. The active implementation goal prioritizes coding with brief checks; broad UI, corpus, hardware, performance and acceptance testing remain for the later debugging phase. The previous goal turn produced and saved the complete scope; this turn changes app code and integrates functional tools.

| Target | Coded integration | Remaining scope |
| --- | --- | --- |
| F47 automatic form detection | Bounded digital vectors/text plus optional local OCR and scan-line geometry; editable reviewed field proposals feed the existing actual builder. | Broader scan/vector/layout recognition, robust semantic fields, bounded shared-worker parsing and output/corpus acceptance. |
| F49 automatic labels/order | Nearby labels, date/signature hints, editable types/names/tooltips/geometry/confidence and explicit proposal order. | Date/signature-widget semantics, document-aware reading/tab order, accessibility tags and multilingual/corpus quality. |
| F48 smart autofill | OS-protected local profile management, explicit mapping/review and one-step undo in Fill and Sign. | Wider UI/output/storage/language cases, profile edit recovery and OS migration/key rotation. |
| F57 bookmark generation | Bounded page-range heading analysis, running-header filtering, editable hierarchy/title/page proposals and undoable acceptance in the outline editor. Geometric gaps retain spaces between separate text items. | OCR/semantic/column-aware headings, calibrated quality and wider corpus/performance checks. |
| F22/B08 revision carry-forward | Real contained physical sheet replacement, selected exact-geometry source comments and donor comments, graph/private/appearance preservation, stable source pages, independent preview and reviewed new-copy saving. | Geometry transforms, large pairs beyond the current 100 MiB/500-page bounds, page/catalog dependencies, locked/proprietary adapters and actual Revu round trips. |

Subagents owned separate substantial modules for detection, bookmarks and revision; root owned autofill, native dispatch/IPC/saving/lifecycle integration and one coordinated check. Relevant records: [detection](FORM-DETECTION-CODING-2026-10-11.md), [autofill](FORM-AUTOFILL-CODING-2026-10-11.md), [bookmarks](BOOKMARK-PROPOSALS-CODING-2026-10-11.md), [revision](REVISION-CARRY-FORWARD-CODING-2026-10-11.md).

## Verification boundaries

Changed modules passed brief syntax checks. Detection had one synthetic model smoke. The coordinated production build and targeted real OS profile/contained known-revision-pair report are recorded below after final completion. An initial profile reopening failure was fixed by reading the asynchronous safeStorage decrypt result correctly; it was not bypassed through plaintext storage.

The focused writer check verifies source preservation, carried/imported note contents and private data, stable page references, independent output reopen and clean contained completion with no unrestricted fallback. It is not a full UI walkthrough, scan corpus, appearance pixel comparison, Revu interoperability, all-files/all-features or release-ready certificate. All incomplete coding and deferred verification remain tracked.

## Final batch evidence

Production build passed: 342 modules, renderer `index-DuE7RNow.js`, CSS `index-C2e1cHdV.css`. Current source matches built snapshot `70d15cf6c98ac48277cadc761cd7095585f698ad80be79c2b57d9259861ed8a6`. Native bundle SHA-256 `54e88d4bc8017d38e1cc10add96d17a985dfbc514a51d6f1cc47e3ec27c5efa8`; broker source pin and fixed AppContainer/no-fallback policy remain enforced. The earlier visible desktop session was not restarted.

[Focused hidden report](../tmp/form-revision-batch-966033a4-5608-47b5-aa7c-68e2f78f6a05/report.json) passed all three declared cases. Real OS-protected profile plaintext was absent on disk; create/reopen/update/remove/clear and encrypted interrupted-file cleanup passed. Known-pair revision independently reopened: source and donor notes plus exact private values retained, unmapped source sheet preserved, original page IDs stable and original fixture hashes unchanged. Contained completion observed; zero active/process-wide jobs and no unrestricted fallback. No new broad feature acceptance is claimed.
