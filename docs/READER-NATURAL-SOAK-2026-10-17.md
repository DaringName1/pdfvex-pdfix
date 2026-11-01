# Natural reader lifecycle memory check

The local runner is `scripts/check-reader-soak.mjs`. It uses one hidden built-app session and a temporary profile. Each cycle opens a generated 100-page text PDF, scrolls to **every** page and waits for its render, searches, zooms, runs the saved-and-reopened markup action with independent PDF verification, closes the reader, waits 20 seconds at Home and records memory. It never forces garbage collection or takes a heap snapshot. All files and receipts stay in a local temporary folder.

Recordings include Windows private bytes for the owned process tree and per-process Electron metrics (Browser/main, Tab/renderer and GPU where present). Graphics mode is recorded; a software-graphics run does not establish normal GPU memory behavior. This generated text corpus is not a substitute for a large scanned drawing.

## Commands

Short workflow validation, **not** a memory acceptance pass:

`node scripts/agent-run.mjs codex -- node scripts/check-reader-soak.mjs --smoke`

Full local run, after the integrator supplies a supported longer lease in **both** shared wrappers:

`node scripts/agent-run.mjs codex --minutes=90 -- node scripts/check-reader-soak.mjs --minutes=90 --normal-graphics`

Both wrappers now honor the declared expiry (Claude commit 4ab0b8c). Declare the duration on both commands. The runner requires an original reservation of duration plus ten minutes, acquired at most one minute earlier; this allows command startup while retaining at least nine extra minutes. A regression test rejects short, old or absent reservations. Do not bypass the lock or silently extend its file. A scheduled task on the spare PC must run the same command from this project folder inside the signed-in desktop (`/it`), never directly inside SSH; the spare PC remains reserved for Claude's current robot.

## Pass rule and rationale

At least 60 minutes and eight completed cycles are required. Exclude the first 20% of cycles (at least two) as warmup. Compare the earlier and later halves of the remaining settled Home samples: later median may rise by at most the greater of 64 MiB or 5%. Linear growth may not exceed 1 MiB/minute; no settled sample may exceed 2 GiB. These are local regression limits: 64 MiB/5% tolerates cache and allocator noise, the slope rejects persistent growth even within a loose median allowance, and 2 GiB retains useful headroom on ordinary PCs. They are deliberately not a universal low-memory guarantee or proof that no leak exists.

No errors, unchanged source bytes, successful independent saved-mark readback, clean app close and no forced descendant termination are also required. A short smoke receipt always has memory `pass: false`, even when its workflow succeeds. Seven unit cases exercise warmup, continuing growth, short duration, invalid receipts, insufficient cycles and an excessive flat memory floor, process crashes and missing process diagnostics.

Status: full-duration normal-graphics run completed 18 cycles in 94.04 minutes. Workflow/integrity/cleanup passed, but the preset plateau gate FAILED. See the completed result below. Eight unit cases pass, including lease timing.

## Normal-graphics validation — October 18

Use `--smoke --normal-graphics` for the short workflow or `--minutes=90 --normal-graphics` for the full run after lease coordination. A temporary test bootstrap suppresses window show/focus methods before loading the captured app runtime and disables background throttling. Its child selects the existing normal-graphics app path (instead of the standard test path that disables hardware acceleration). Visibility is checked at each memory sample and any show event fails the workflow, even if immediately hidden again. No production GPU/security setting or shared desktop source is changed.

A built-app normal-graphics smoke completed two cycles in 235.404 seconds, with GPU compositing and hardware acceleration enabled, all windows hidden, saved markup independently read back, source unchanged and clean app/descendant exit. Settled owned private memory was 566.15 then 637.13 MiB; that increase is not a demonstrated plateau. There were no recorded process failures. Receipt: local temporary `pdfix-reader-soak-9wfTqr/report.json`. This mode is slower than offscreen software tests; hidden Playwright timing is not a visible-window performance benchmark.

GPU/renderer crashes or failed page loads now reject a memory workflow, since process replacement can reset counters and falsely resemble a plateau. Missing diagnostics also fail closed. Seven unit cases pass; the new event filter independently accepts the completed normal-run receipt with zero process failures. The full 90-minute command was tried through agent-run and correctly refused before creating a profile or opening an app: the extended lease is still unavailable. Ten extra lease minutes cover startup, the existing five-minute watchdog tail and cleanup. The actual hour-long memory gate remains open.

## Completed full run — October 18

The extended lease and timing admission fix permitted the full normal-GPU run: 18 cycles, 5,642,668 ms (94.04 minutes). Hardware acceleration and GPU compositing enabled; all windows hidden; no page errors or recorded child/renderer process failures. All original bytes unchanged; each markup saved file independently verified/reopened. App closed cleanly with no forced or surviving owned descendants. No forced collection or GPU restart. Generated 100-page text corpus, not the real drawing or a weak-PC run.

The unchanged preset memory gate FAILS: exclude four warmup cycles; earlier settled-private median 666.55 MiB, later 736.13 MiB, increase 69.58 MiB versus 64 MiB allowance. Slope 0.937 MiB/minute is below its 1 MiB/minute threshold; peak settled private 834.71 MiB is below 2 GiB. Passing the slope/ceiling does not override the failed median rule. Overall pass=false, workflowPass=true. Do not increase the allowance after observing this result.

Process samples narrow the next investigation: Browser stays roughly 74-83 MiB and Utility about 12 MiB (Electron counters); GPU private repeatedly rises around 300-410 MiB then falls to 130-184 MiB without a crash; renderer/Tab private grows about 103 to 201 MiB. Summed Electron counters and the independently sampled Windows tree are different measurements/times, so do not expect these components to sum exactly to the Windows total. Periodic GPU release does not establish renderer stability or a proven JS leak. Next: measure natural renderer heap/DOM/canvas alongside private bytes to distinguish retained objects from allocator/canvas caches before a production fix. No speculative cache flush, forced GC, permanent software graphics or security change added.

Original Temp receipt: pdfix-reader-soak-PRvz6j/report.json. Sanitized full copy is preserved under docs/evidence/codex with source/copy SHA-256 in the manifest. Older blocked/pending statements above are historical and superseded by this completed failure. A-R2 remains open.

## Follow-up allocation counters — October 18

The diagnostic now records Runtime.getHeapUsage and Memory.getDOMCounters with each memory sample, plus live document canvas count/pixels. It never requests garbage collection, leak-detection preparation or pressure/cache purging. The existing private-memory gate is unchanged. These counters describe the attached renderer; they do not measure every native allocator or prove detached-object absence. Protocol references: https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#method-getHeapUsage and https://chromedevtools.github.io/devtools-protocol/tot/Memory/#method-getDOMCounters.

Normal-GPU hidden smoke validates the added counters: two cycles in about235seconds, all workflows/source readback/cleanup pass, no errors/process failures, no forced/surviving descendants. Settled private memory561.83->644.76MiB while sampled JS used heap8.35->8.07MB (decimal), backing storage about2.93MB, DOM nodes2817->2687, listeners444->447, documents2, connected canvas count/pixels0. This short case suggests private growth is not mirrored by a similar immediate JS-heap increase; it does not identify the long-run cause or establish a plateau. Smoke pass=false remains deliberate for memory acceptance. The full94-minute failed gate is not superseded.

Receipt pdfix-reader-soak-1jM0Yo/report.json is preserved in docs/evidence/codex with hashes. Eight memory/lease source tests pass. A new full instrumented session should wait for a quiet coordinated window after package checks; do not block Claude's immediate app work with an unannounced repeat hour. No production memory/GPU/security setting changed.

## Full allocation-counter result — October 18 (audit)

The instrumented normal-graphics run finished 18 cycles/94.03 minutes and released its run lock. Overall FAIL,
workflowPass=true, original unchanged, clean close, zero forced/surviving owned processes and no recorded process
failures. Gate unchanged: later median747.41MiB versus666.97MiB, growth80.44MiB versus64 allowance;
slope1.872MiB/min exceeds1; peak838.97MiB stays under2048. Neither passing ceiling nor completed workflows
establish a plateau. Receipt W9AiHQ is archived with source/copy hashes in docs/evidence/codex/manifest.json.

Natural renderer counters, first to last settled sample: JS used8,077,164->9,650,040 bytes;
embedder7,819,288->18,944,096; backing2,938,531->2,939,882; documents2->2; DOM2681->2737;
listeners443->457; connected canvas count/pixels0 throughout settled endpoints. Electron renderer private
101268->207508KiB; Browser79960->79340KiB, Utility11896->11788KiB; GPU302432->324572KiB with larger
in-between oscillations. These differently timed counters do not reconcile exactly to Windows tree totals.
A read-only loopback status probe during the first long cycle confirmed progress; no GC or state change.

The evidence narrows investigation toward native/embedder allocations in addition to small JS/DOM retention;
it does not identify the responsible code or justify a production cache/GPU workaround. A-R2 remains open.
No third 90-minute repeat is started without a coordinated quiet window. Source/unit audit continues.