# Focused startup and memory investigation — October 16, 2026

User explicitly approved resuming only startup and long-session memory diagnostics after the earlier stop on automated checks. Reader/Drawing/Pages ownership remains unchanged. No production graphics/security flags, dependencies, architecture, installer or shared native sources changed.

## Startup evidence

`tmp/reader-startup-matrix-7D1GEF/report.json`: 18/18 native hidden launches pass renderer content/response, image capture and orderly shutdown. Six configurations, three rounds: acceleration-disabled/default-requested controls in hidden/offscreen variants, and unchanged built PDFix in standard hidden-test software mode and normal app graphics with showing suppressed. Every window stays hidden; all owned processes exit 0. All 54 captured frames were personally reviewed in six contact sheets.

This separates capture errors from renderer/GPU process exits. The earlier minimal default-graphics control failed `capturePage` immediately with `UnknownVizError` but exited 0; that is not itself proof of a startup crash. New captures use Electron's explicit stayHidden/stayAwake options and wait/heartbeat stages. Those differences are diagnostic controls, not a production workaround. Normal PDFix reports GPU compositing/canvas enabled; some minimal default-requested controls initially report software status, so their names do not prove hardware execution. The afternoon capture-timing comparison below later failed before capture. Prior 0x80000003 crash evidence and visible/other-driver acceptance are not erased by these passing hidden starts.

## Memory evidence — interrupted session, investigation remains open

First new soak stopped on a test expectation, not an app error: after leaving on page 162, the test expected reopening at page 163. Actual PDFix correctly displayed ready page 162. Receipt preserved: `C:/Users/andre/AppData/Local/Temp/pdfix-reader-closeout-HPKTlT/report.json`. It completed one five-minute phase; no app errors; original unchanged; all owned processes closed. Read-only OS receipt `tmp/reader-memory-os-2026-10-16.json` also observes root exit. Do not call this a complete 20-minute pass.

Corrected natural session: `C:/Users/andre/AppData/Local/Temp/pdfix-reader-closeout-qdADTJ/receipt.json`. On resuming October 16 afternoon, the process was gone and no final report existed; this was interrupted, not a completed pass. Four five-minute phases, cycling continuous/facing/page/continuous views; strides of 37 pages through the 163-page supplied PDF, actual remembered-page reopening, natural renderer/Electron memory and response sampling. No forced GC, heap tracking, heap snapshots or layout flush. The harness checks original and input copy hashes only on completion; this interrupted session never reached those checks. Independent read-only Windows process-tree sampling includes non-Electron descendants in `tmp/reader-memory-os-wide-2026-10-16.json`; sampling misses short-lived peaks and is not a total-peak guarantee. The sampled temporary-profile startup includes two PowerShell helpers, roughly 130 MiB combined, absent from Electron app metrics.

The partial receipt contains 36 samples over 17.35 minutes and 157 measured jumps. Electron private memory was 245 MiB initially, reached 1,129 MiB in these samples and ended at 1,044 MiB while a document was open; Home samples rose from 791 to 966 to 1,026 MiB. The separate OS sampler recorded 204 samples, a 1,572 MiB process-tree maximum and no observed exit before interruption. Jumps reached 11.1 seconds while the measured renderer heartbeat delay remained at most 6 ms. These totals do not prove a leak or a stable plateau. No final source-integrity or orderly-close claim is available for this interrupted run; the old root PID is absent now.

The previously queued three-minute Chromium memory-infra trace never produced a completed receipt. The capture-timing comparison was run in the afternoon: all nine controls crash before a receipt, as does the subsequent full eighteen-control matrix. See READER-CLEAN-WINDOWS-2026-10-16.md; these are actual process exits, not a screenshot-only failure. No production memory fix is justified yet by private-memory totals alone. Existing prototype-based heap checks remain separate; natural samples are not a no-leak proof.

## Remaining acceptance

Visible Windows starts, longer/more varied sessions, weaker PCs and real printer measurements still need their appropriate evidence. Existing package remains unchanged. Final results, any confirmed fix and integrator requests will be recorded in the reader handoff and A-R2/A-R4.


## Completed post-restart natural session — October 16 evening

C:/Users/andre/AppData/Local/Temp/pdfix-reader-closeout-oea0e1/report.json now completes: pass, exit 0, closed, all input-copy and original-source hash checks true. Normal app graphics with showing/background throttling suppressed; test-only in-process GPU setting explicitly unset. No forced GC, heap tracking, snapshots or layout flush. No GPU-exit/fatal-GPU messages appear in retained stderr. This establishes one successful post-restart session, not the cause of the earlier startup failures.

Four five-minute phases (continuous/facing/page/continuous), 1,231 seconds including Home settling, 43 samples and 187 measured jumps. Electron private baseline 235.8 MiB, sampled peak 1,138.5 MiB, final Home 953.2 MiB. Home cycle samples: 792.6, 978.7, 1,036.1 and 982.2 MiB. Final main/GPU/renderer private: 146.3/522.8/272.7 MiB; final renderer JS heap 9.1 MiB. Navigation median 1,030 ms, p95 3,046 ms, max 10,097 ms; measured heartbeat extra delay max 3 ms. Windows sampler records 239 samples, peak 1,442.2 MiB for the broader process tree and root exit observed. These are sampled private totals, not physical RAM totals or total-peak guarantees.

Read-only analysis: scripts/check-reader-memory-report.mjs, output tmp/reader-memory-postrestart-summary.json; refuses to promote partial receipts to completed/integrity-verified evidence. Its three tests are included in the existing *.test.cjs unit-test glob. Private/native memory retention remains open: totals fell at points and the final Home sample is below the third-cycle Home sample, but that does not establish a stable long-run plateau. The separate allocation trace is complete and reported below.


## Completed allocation trace — separate instrumented evidence

C:/Users/andre/AppData/Local/Temp/pdfix-reader-closeout-j6Rab2/report.json: pass, source/input hashes unchanged, exit 0, closed. Three one-minute read/close phases plus settling, 210.5 seconds of measured workload and 29 jumps. Canvas/GPU compositing/rasterization enabled; no child-process-gone events or app errors. Final Home renderer heap 4.6 MiB, 341 DOM nodes and 41 listeners; these are traced-run results and must not replace the natural session’s measurements. Tracing adds a utility process and can change collection/timings.

Trace JSON export completed within the outer session limit, but took substantially longer than the read workload. The JSON is 293,736,621 bytes; the 64-MiB trace-buffer setting is not a JSON file-size cap. No new tracing dependency was installed. Analysis streamed one event line at a time; raw trace stays local. Compact extraction: tmp/reader-memory-trace-summary-2026-10-16.json.

Six allocator dumps per main/renderer/GPU process are present. The final additional dump has totals-only records, not complete allocation records; absent allocations must not be interpreted as zero. Last complete allocation dump (0x5, during the active workload) reports renderer array-buffer partition 78.15 MiB, canvas 60.67 MiB and Blink heap 69.25 MiB; GPU allocator 188.83 MiB, including shared images 84.67 MiB and transfer memory 71.62 MiB, plus Skia GPU-resource accounting 50.31 MiB. These hierarchical/shared categories overlap, so do not sum them or equate them to Windows private totals. They identify buffer/canvas/compositor/native resource areas, not an object-retention path or a proven leak. No production memory workaround is justified from this alone.

After both runs, the recorded Electron process IDs are absent and the run lock is released. No physical print job sent. Next acceptance: repeat the natural workload on the spare PC and measure longer idle/reopen sessions; distinguish driver/allocator cache behavior from retained app objects before changing production graphics policy. A-R2 remains open for that high native/private-memory question.
