# Reader memory investigation — October 19 evening

A-R2 remains open. The existing 94-minute normal-graphics run failed its unchanged acceptance limits. This continuation adds analysis and diagnostic instrumentation, not a production workaround.

## What the existing measurements show

Source: `docs/evidence/codex/pdfix-reader-soak-W9AiHQ.json`. Recalculation is preserved in `reader-memory-process-analysis-2026-10-19.json` beside it. These are the same old measurements, not a new long run. Slopes use the original four-cycle warmup exclusion and ordinary least squares.

| Process | First settled MiB | Last settled MiB | Slope after warmup, MiB/min |
| --- | ---: | ---: | ---: |
| Main app | 78.00 | 77.39 | 0.003 |
| Page renderer | 98.89 | 202.64 | 1.251 |
| Graphics | 295.34 | 316.96 | 0.612 |
| Utility | 11.62 | 11.51 | -0.001 |

Graphics allocation ranges from 132.50 to 426.34 MiB and drops substantially without a process restart. The renderer shows the more sustained rise. Its JavaScript heap grows much less than its private memory; connected page canvases return to zero after closing. These observations narrow the investigation, but do not prove an allocator, PDF.js, font or driver leak. The old process creation times also fit the captured tree; the new PID-reuse guard does not invalidate the earlier failed gate.

## New diagnostic

`check-reader-soak.mjs --smoke --normal-graphics --native-allocations` adds opt-in Chromium native allocation samples to the existing generated open/scroll/search/zoom/markup/save/reopen/Home workflow. It runs only under `agent-run`, in a temporary profile with hidden windows. No forced garbage collection, heap snapshot, production graphics setting, dependency or security change.

Samples retain at most 60 stacks, 24 frames per stack and 200 characters per frame; oversized/malformed results are refused. Two unit tests check the bounds and reject invalid profiles. Chromium's sampled estimates are not a measurement of all live native memory. Address-only stacks without symbols cannot identify a component.

The instrumented run cannot pass the acceptance gate: its report explicitly keeps `pass:false`. A short diagnostic may separately pass its workflow, saved-output, original-unchanged and cleanup checks. Only an uninstrumented 60–120 minute natural-session run can establish the plateau under the original limits.

## Address attribution follow-up

The bounded diagnostic now retains valid module load addresses and build identifiers and resolves sampled addresses to module-relative offsets. Four profiler unit cases pass, including the exact range boundaries, invalid range refusal and identity-text bounds. This prepares useful attribution for a future instrumented run; it does not retroactively identify the owner of the old samples or establish a leak fix. The current full 90-minute run is uninstrumented and keeps the original acceptance limits.

Next: compare the short profile with the renderer's private-memory movement, obtain useful component attribution, fix a confirmed retention path, then repeat the full uninstrumented gate. Do not reduce a threshold or disable graphics to make the result green.

## Recorded short-run result

`docs/evidence/codex/reader-native-allocation-smoke-2026-10-19.json`: two cycles in190seconds, normal graphics with hidden windows. Both independently verified markup outputs and the original source pass; no page/process errors; clean close; zero forced or surviving children. Settled total private memory589.07→633.65MiB, renderer81.97→83.24MiB, sampled estimates2.94→3.38MiB across46→53 stacks. Font/canvas counts return to0 after both closes. These are warmup samples with instrumentation overhead; no long-term slope or fix conclusion. The returned stacks contain addresses, not component names, so component attribution is still missing. Five focused memory-report/profiler unit cases pass. No production code changed by this continuation.

## Full current-build result: passed locally

The uninstrumented run started October19 at21:46 PDT and completed19cycles in5,519.406seconds (91.99minutes). Normal hardware acceleration stayed enabled, every window stayed hidden, every cycle independently checked its saved markup, and the original source stayed unchanged. No page/process failures, forced cleanup or surviving children. The run lock is released.

The original limits pass: after four warmup cycles the earlier/later medians are746.57/730.78MiB (−15.78MiB; allowance64MiB), slope0.604MiB/min (limit1), peak settled781.96MiB (limit2,048). Memory drops naturally at cycle9; no forced collection, heap snapshot, process restart or threshold change. This is one generated100-page workflow on this main PC, not a weaker-PC, arbitrary-file or driver guarantee. Earlier failed runs remain valid historical evidence; this pass does not identify a universal leak fix.

Raw receipt and immutable-runtime source identity are retained in `docs/evidence/codex/reader-memory-2026-10-19/`. The runtime source SHA-256 is `841e0f003f9ccea37fb7d77774702f64eede7e46d1a81c13edd9c1a704d51aab`. Claude's later commits are outside that captured build and need their own release checks.
