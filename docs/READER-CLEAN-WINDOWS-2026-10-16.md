# Reader, Drawing and Pages — fresh Windows investigation

## Latest: run 38993362771 (101 passed, 7 failed)

Three paged-reader traces now contain a structured native OPEN refusal: CHANGED, “The staged PDF source changed. Reopen the source.” These return in 1,262 / 1,307 / 1,424 ms with no renderer error. This is distinct from the earlier pre-handshake exit 1 and is not resolved by longer waits. The fourth owned failure is reader-tagged-order's separate 30-second firstWindow timeout. Markup, drawing styles and splitting are no longer in this run's failing set.

Candidate production correction: the native helper pins the existing staged job directory and compares its input/output handles in the NT namespace, using FILE_NAME_OPENED | VOLUME_NAME_NT. This avoids DOS-volume translation inside the AppContainer. Existing disk-file, single-link, no-reparse, identity, source-integrity and output-slot checks remain. The broker canonicalizes the staging directory with no-link checks before and after. No sandbox grant, GPU setting, dependency or shared launcher change. CI logs may expose at most two strictly filtered stage/numeric diagnostic lines; no arbitrary native stderr or PDF text is forwarded.

This mechanism is consistent with the [reported AppContainer DOS-path lookup failure](https://github.com/microsoft/STL/issues/6286); [Microsoft documents the path namespace flags](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfinalpathnamebyhandlew). It is a candidate explanation, not a confirmed reproduction of the cloud restriction. A real local 8.3 alias worked even before the NT-namespace correction, so alias spelling alone is not established as the cause. The new short-path check is explicitly a compatibility check, not a positive root-cause reproduction.

Verification after locked build:

- 11 focused staging/protocol/navigation/search unit checks pass, including junction rejection and changed-input refusal.
- Real 8.3 alias and canonical staging both open a generated 501-page file and independently read back pages 1 and 501; source unchanged, services closed. Receipt: C:/Users/andre/AppData/Local/Temp/PDFix long staged path regression-vlcFG2/report.json.
- Valid/malformed native privacy checks pass (stderr-LYFFir); 70-page extraction and parser retirement/readback pass (native-0zrYQG). Both close and preserve sources.
- Six targeted hidden built Electron suites pass 14/14 in two minutes with CI timing and no in-process GPU workaround. Entire-PDF resumed scan: 38.8 seconds, search-all-PeM6my/report.json.
- reader-tagged-order now uses the existing launchReader helper's bounded CI startup and failure attachments. Its exact tagged-order/search assertions pass (1/1). First restricted attempt failed before launch; retry with normal process-launch permissions passes. This does not establish a new GPU failure.

Fresh-Windows verification remains required. Claude: upload this reader batch and run all four reader specs, then the complete suite. Earlier evidence below is historical, not the current failing set.

Source evidence: private GitHub run 38873399074, head 5c0fb608b80f37cb360a8d0c5d6c2dbb0956b8eb, October 16. Full desktop result 93 passed / 15 failed / 2 skipped. Logs and full-reports downloaded read-only under tmp/github-windows-38873399074*. Local passing checks do not prove these fresh-machine failures resolved.

| Case | Cloud evidence | Change / present status |
| --- | --- | --- |
| reader-paged-search | Page count stays / — for 60 seconds | Native OPEN deadline is already 120 seconds. CI check now allows 140 seconds, with process/native/renderer diagnostics. Local baseline passes; fresh Windows confirmation pending. |
| reader-paged-outline | Same 60-second page-count failure | Same bounded timing correction and diagnostics. Updated hidden built-app test passes; cloud root cause remains unproved. |
| reader-paged-search-all | firstWindow times out after 30 seconds | Give firstWindow its own 90-second CI deadline; a test/config deadline does not extend it. Attach startup evidence. Updated local test passes, final full scan 37.2 seconds; cloud confirmation pending. |
| markup: all tools | Four rows instead of five; ink absent, other four retained | Wait for drawing-surface actionability and rendered-page readiness; check each gesture independently. Updated local case passes in 8.2 seconds. Cloud confirmation pending; no production gesture fix inferred. |
| drawing-review-styles: decoration | Summary empty after 5 seconds; snapshot shows native preview still busy | Claude’s ead976d CI default is now 30 seconds. Both local cases pass with it; no duplicate timeout patch. Cloud confirmation pending. |
| splitting: automatic split | BeforeEach page not rendered within 5 seconds | Same CI default correction. All four baseline local cases pass. Updated rerun later cannot launch due to A-R4, before splitting runs. |

All six files generate PDFs using pdf-lib and temporary profiles. None depends on samples/dad-drawing-review or another private document. Checks use the app-run lock and hidden windows. Build uses agent-build. Existing output assertions, independent saved-PDF readback and source-integrity checks remain in place. There are no new retries, skipped failures, removed assertions or production GPU/security changes.

## Verification and new blocker

Baseline six-file run after locked rebuild: **14/14 pass**, two minutes. Updated run: **9 pass / 5 fail**. Passing: both decoration/reply cases, all five markup cases, paged outline, entire-PDF search. Failure begins at the next app launch: new diagnostic attachment records repeated GPU-process exits **0x80000003**, then **GPU process isn't usable. Goodbye.** Splitting's four failures are likewise before a window exists. A subsequent five-case retry reproduces these startup failures. This is a local startup blocker, not evidence that splitting output regressed.

Native comparison receipts:

- tmp/reader-startup-matrix-S2IsNe/report.json: nine timing controls all crash before completing a renderer receipt.
- tmp/reader-startup-matrix-Pd8hir/report.json: all eighteen controls crash, including minimal/software/offscreen/default-graphics and built PDFix controls. Root exit code 2147483651; stderr has GPU exits and in some cases persistent-cache sharing errors. No claim that those sharing errors are the cause.
- Earlier tmp/reader-startup-matrix-7D1GEF/report.json still records 18/18 successful starts and 54 visually reviewed frames. Later failures supersede any claim of current startup reliability, rather than erasing the earlier evidence.

The failure-path attachment itself is verified: retained reader trace contains JSON with the real process stderr when main-process inspection is unavailable after exit. No new screenshot exists for a process that dies before creating its window. No owned Electron process remained after the checks. Available disk space exceeds 1 TiB; recent Windows application event query returned no matching crash event. Do not equate the local GPU finding with the cloud page-count failures without new cloud evidence.

## Next gate

Claude uploads the commits, reruns these six files on fresh Windows, then the full suite. If paged opening still fails, inspect reader-startup-native-diagnostics and reader-failure-screen attachments in the retained trace: pending native request, returned native error, renderer error, process exit and missing window are distinct. Production GPU or security policy changes require coordination. A-R2 memory investigation remains open; the previous 17-minute receipt is interrupted and no replacement memory run was attempted after repeat startup failures. Printer acceptance still requires a real measured page; nothing was spooled.


## Follow-up: run 38983836383 and reader helper correction

The new run completes with 98 passed / 10 failed / 2 skipped. Markup and both drawing-review-style cases pass. All three paged-reader diagnostics show a live, non-crashed renderer and a native OPEN response with exit 1 after 339 ms, 6,547 ms and 350 ms. These are native startup failures, not 140-second work or renderer timeouts. One splitting case fails at its first-render beforeEach assertion after 30 seconds; the other splitting cases pass. Claude owns the other failures. The captured page-opening failure screenshot was personally reviewed: the interface and error banner render, with / — and no PDF artwork.

PagedSessionEngine.cs still attempted CreateFileW(NUL) before initializing its protocol writer, outside its structured error handler. On a machine that refuses that device open, this code can exit 1 without a handshake or diagnostic. The helper now detaches the native stderr handle instead of opening a device. The controlled diagnostic writer retains the inherited pipe; managed error output and explicit qpdf silence/suppress-warning settings remain. Early failures now reach the structured handler. No new file/device permission, dependency, sandbox exception or GPU flag. Source pin reviewed and updated; locked build compiles. This removes a concrete startup failure path consistent with the cloud evidence; fresh-Windows confirmation is still required.

Verified after the change:

- Contained native valid PDF: open, extract and independent pdf-lib readback. Malformed generated input: structured PARSE refusal, only fixed stage/numeric diagnostic lines, no raw private sentinel, unchanged sources, orderly service cleanup. Receipt C:/Users/andre/AppData/Local/Temp/pdfix-reader-stderr-Y2Saac/report.json.
- Contained 70-page native run: all output pages independently reopened, two parser starts including retirement/restart, original unchanged, service closed. Receipt C:/Users/andre/AppData/Local/Temp/pdfix-reader-native-sG6O4x/report.json.
- Hidden built Electron six-file suite: 14/14 pass in 2.1 minutes, including both search scopes, all outline/link jumps, all markup cases, both drawing-style cases and all four splitting cases. Entire-PDF resumed scan 40.3 seconds, receipt C:/Users/andre/AppData/Local/Temp/pdfix-search-all-SfKM7N/report.json. Test-only in-process GPU switch unset.
- Eleven focused protocol/navigation/search/memory-report unit checks pass. Memory-report checks now use .test.cjs so npm test includes them.

Splitting uses the same bounded startup/native/renderer/text/screenshot failure attachments now; console error capture added. No splitting production fix is claimed without the missing cloud evidence. Integrator: upload and rerun the three paged tests and splitting, then the full suite. Do not substitute this local success for fresh-machine confirmation.

## Two-run gate and next cloud failures

Read both full-suite logs and retained trace attachments. Run 38995241174 is 97 passed / 11 failed / 2 skipped; run 38998234834 has completed with 102 passed / 6 failed / 2 skipped. GitHub commit messages identify local source e2e1d8a and b5005ed respectively: neither includes native-path correction 90d20f0. All six paged-reader OPEN diagnostics return structured CHANGED in 1,312–1,631 ms, live renderer, no renderer errors. They are no longer unexplained native exit 1. These runs neither validate nor disprove 90d20f0.

| Owned case | 38995241174 | 38998234834 | Present action; acceptance gate |
| --- | --- | --- | --- |
| Paged outline | Failed: native CHANGED, 1,366 ms | Failed: native CHANGED, 1,631 ms | Upload 90d20f0; zero cloud runs of that fix yet |
| Entire-PDF search | Failed: native CHANGED, 1,394 ms | Failed: native CHANGED, 1,312 ms | Same; preserve stop/resume/extraction/output assertions |
| Page-only search | Failed: native CHANGED, 1,383 ms | Failed: native CHANGED, 1,356 ms | Same; no timing-only claim |
| Markup all tools | Failed waiting for Saved removed-note.pdf; last status Verified 4 editable annotations; teardown also timed out | Passed | Saving/renderer/native diagnostics added; cloud save cause unproven |
| Markup recovery | Failed on restart firstWindow 30 seconds | Passed | Both launches now use existing bounded reader helper; failure attachments added |
| Crop boundary/vector resize | Failed waiting 30 seconds for review details; snapshot still building with output reader / — | Passed in 7.6 seconds | Bounded 90-second CI completion assertion; native/renderer/failure screenshot evidence added, pixel/source assertions retained |
| Splitting automatic save | Passed in 7.4 seconds | Failed: Saving canceled after deferred picker was released | Safe test-picker decision and save IPC result diagnostics added; not claimed fixed |

User requires two cloud passes before calling an intermittent test fixed. For this new batch, all affected cases remain pending that gate. Existing one-off passes do not close it. The test helper now records bounded save-copy/save-split/recovery requests and acknowledgments, whether a save returned null, and safe test-dialog decisions. It still records startup/native/renderer failures and a screenshot when possible. No document payload is logged. An opt-in test-only CDP renderer CPU rate (1–20) allows slower-CPU reproduction without occupying every CPU or changing production graphics/security settings. It does not throttle native helpers or reproduce the whole cloud machine.

### Separately reproduced markup geometry bug

New generated built-app cases apply nonuniform CSS scale (.75, .6) to a normal and cropped/rotated page, draw a line and save the copy. Before the production correction, independent PDF annotation readback differs from expected source coordinates by 20 points (normal) and 54.4 points (rotated) at the first failing coordinate. This is a real screen/viewport conversion bug; it is not established as the cause of the older cloud save failure, which occurred after preview and saving began.

Markup now converts pointer coordinates by the measured screen rectangle's width/height relative to the PDF.js viewport. Text rectangle selection converts the drag into screen units for measurement, then converts measured word rectangles back to viewport units before building PDF quads. This preserves source coordinates and word selection even when displayed size differs. Unit checks include nonuniform scale, enlarged bounds, clamping and unavailable geometry. Built-app regressions independently verify line coordinates, selected words, unchanged originals and rotated source geometry.
### Stress verification and bookmark/refit correction

First sixfold-throttled baseline: all 13 existing markup/page-workspace/splitting tests pass. After the markup correction, the extended six-file run passes 17 cases, including both new scale regressions, all seven markup cases, all four page-workspace cases, both search scopes and all four splitting cases. Its outline case fails after successful native OPEN: clicking Direct last sheet leaves physical page 1. Diagnostic receipt copied to tmp/reader-outline-cpu6-failure.json and screenshot tmp/reader-outline-cpu6-failure.png, personally inspected. This is a new frontend stress failure, distinct from cloud CHANGED.

The destination helper requested target page geometry before waiting for the current fit render. In on-demand mode, another render of the current page can supersede that extraction. It now waits for the current view to settle before requesting the destination page, retaining the later stability/current-intent/source checks. A unit regression ensures extraction never begins during an unsettled refit; disposal/new navigation cancellation still pass. Locked rebuild and the identical throttled outline case repeated twice pass (17.7 and 16.8 seconds). Six further built-app destination/navigation regressions pass, including 32 destination view/rotation combinations, negative crop origins, exact XYZ zoom, bounded canvas pixels, saved positions and minimum layout. Fourteen relevant pointer/destination unit checks pass. No new retry or weaker assertion was added to the failing outline case.

Final evidence is 17/18 in the initial stress suite, followed by 2/2 corrected outline stress cases and 6/6 related regressions. It is not one uninterrupted 18/18 suite after the last correction. All owned app sessions close; no production GPU/security changes. Renderer throttling is test-only; native helper performance and cloud acceptance remain separate. Nine screenshots from the extended passing markup/crop/split cases were personally inspected, in addition to the failing outline screenshot. The corrected scale tests also prove saved coordinates and word selection through independent PDF readback; no claim of manual spare-PC operation.

Claude must upload 90d20f0 plus this batch and obtain two passing cloud runs for each affected case. Cloud save cancellation still needs those new dialog/IPC diagnostics if it recurs. A-R2/A-R4 remain open; this scoped batch neither proves a memory plateau nor identifies the intermittent GPU crash cause.