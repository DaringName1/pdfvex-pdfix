# Combine and editable continuation progress

The preserving combination workspace now supports an actual native combination followed by editable page-reorder and Bates steps. The native orchestration service is `desktop/pdf-combine-workflow-service.cjs`; continuation controls, receipt validation and final-source mapping live in the existing `src/pdf-combine-workspace.js`, `src/pdf-combine-model.js` and stylesheet. Main/preload route wiring is owned by the integration change.

## Native trust and execution

`PdfCombineWorkflowService.build(sessionId, trustedSources, token, {combine, steps})` accepts the same native-retained original snapshots as standalone combination, an exact inspected combination map, and one or two existing raw reorder/Bates step definitions. Sources are not supplied by renderer bytes or paths. The service calls `PdfCombineService`, retrieves its sealed native output internally, closes that stage, and supplies that exact output as the trusted source for `DocumentWorkflowService`. The existing preserving reorder and decoration codecs run inside their fixed contained engine routes; there is no new unrestricted parser or renderer reconstruction route.

The final seal binds original per-source metadata/hashes, combination selection/hash and object manifests, expanded editable settings, ordered continuation receipts, exact input/output SHA-256 at every stage, final original-page/object mappings, final bytes and a canonical whole-receipt SHA-256. Saving asks the native owner for `output(sessionId, trustedSources, token)` and never accepts bytes from the renderer. The service rechecks retained source fingerprints, receipt hashes, ordered stage hashes, page mappings and the precise Bates identifier sequence before releasing a copy to the native save route.

Each stage closes before its successor starts. Intermediate preview copies and stage seals are zeroed after use. Cancel/discard invalidate the matching final seal, cancel the active owning stage, await the complete orchestration promise and observed contained cleanup, and stay closed if cleanup fails. Disposal awaits the same completion boundary. A new build always starts from the retained originals, including when the user edits or reorders continuation steps.

## Editable user flow

The standalone combination flow is unchanged when no continuation cards are added. Users may add one reorder and one Bates card, edit settings, move either card up/down, or remove it. Reorder accepts a complete permutation of up to 500 current physical pages and provides a reverse action; identity reorder is rejected before processing. Bates uses the existing standard-font, position, size, color, opacity, inset, ASCII prefix/suffix, start/digit and up-to-100-current-pages contract.

The final source map composes combination and reorder. Bates page ownership is composed at the point where its step runs: moving numbering before/after reorder can assign the same identifiers to different originals. The final PDF is independently opened with PDF.js and compared to the correctly mapped original pages for geometry, annotations, widget values/namespaces, local link destinations and grouped bookmark hierarchy/targets. Expected Bates strings are checked in text extracted from their final mapped pages and shown in the page-review status.

Actual originals and final output render side by side. Every final page must be viewed and the continuation order, Bates identifiers/possible overlap, source mapping and preservation limits acknowledged before the token-only final save is enabled. Edits invalidate the output and review evidence. Asynchronous hash/load boundaries and generation fences prevent cancelled builds from installing a stale preview; close waits for native and preview cleanup before releasing the editor guard.

## Remaining scope and evidence

Combination retains its explicit full-source-only and unsupported-structure refusals; partial extraction/duplication and broader semantic merging remain unfinished. Continuations currently support one reorder and one Bates step, using the existing shared workflow service contract. No general-purpose arbitrary operation graph, automatic collision detection for Bates already present in originals, page-artwork collision proof, sanitation, certification or proprietary PDF application fidelity claim is added. Saved combined workflow definitions/recovery are outside this slice.

Only source inspection and `node --check` were performed. No tests, PDF parsing/execution, runtime/UI/native/device validation, fixtures or new tests were run. Product PDF.js and native reopen verification described above is implemented behavior, not executed acceptance evidence. Root integration compilation follows source freeze.
