# Reader cloud readiness follow-up — October 18

Run 39107338420 passed the full workflow. Run 39109191417 then failed initial comparison PDF readiness (no .pdf-paper within 30 seconds) and Claude's password-cancellation case. Run 39127085332 failed only Claude's scan-only forms case, waiting for Next blank field. These outcomes do not satisfy two consecutive full clean runs and do not validate newer local code. No workflow/upload was dispatched by Codex.

The original requested Bates, paged search, split, 270-degree markup and review-style cases all pass in the newest inspected suite. Local completion-based wait candidates from cea7abe also pass all 18 relevant hidden built-app cases in two minutes; independent saved-file checks remain. This is stronger local evidence, not proof that cloud delays have a single root cause.

Comparison used direct electron.launch and a 30-second default expectation for its initial page. It now uses the existing bounded diagnostic launch helper, captures native/renderer failures and waits up to 120 seconds on CI / 60 locally for the actual rendered page. No fixed sleep, retry, expected result change, production timeout or security setting was added. All six comparison cases pass locally, alongside two reply/style cases. All five captured comparison PNGs were personally inspected (normal/minimum, combined, password dialog, image-only difference). The failed artifact download yielded no cloud screenshots; no visual claim is made for that failed cloud state.

Cloud logs stay in tmp/cloud-39109191417-failed.log and tmp/cloud-39127085332-failed.log. If comparison still fails, its new diagnostics should establish whether opening was refused, still pending or crashed; the longer wait alone does not resolve that question. Claude handles uploads and the next two consecutive full confirmations. No real passwords, private drawings, spare-PC session or physical print used.

Latest audit:39164946345 fails XFDF export while the actual dialog remains actively extracting/parsing at30s (error-context inspected); layout/password cases are Claude's.39167653289 passes XFDF and both new callout/uniform-rich specs, but an older FreeText body spec still expects the old help wording. Its assertion is corrected to the actual visible text-box explanation; saved-file/appearance/object assertions stay unchanged. The other latest failure is Claude's picture drag case. Total latest121pass/2fail/2skip. New test-only candidates still need local app checks after the owned memory lease and Claude upload/two consecutive clean cloud runs.

October18 local resolution: the corrected FreeText pair and XFDF export/import pass3/3 in hidden built Electron.
XFDF now waits up to120s on CI/60 locally for the real reviewed XML/import result and completed save, captures
native acknowledgments, closes active dialogs before app teardown, and retains independent XML/thread/private
object/source assertions. No label change or production timeout was needed. Artifact downloads did contain
error-context/trace files: use rg --files --no-ignore for ignored tmp folders. Earlier searches missed those;
there were no usable cloud screencast frames in the inspected trace. Two full clean cloud runs remain pending.