# Codex continuation snapshot — October 18, 2026

Read [AI-START-HERE](AI-START-HERE.md), the workflow and both handoffs before changing source. This snapshot consolidates Codex knowledge from the current conversation; the detailed chronology and commands are in [the reader handoff](PDF-READER-PARALLEL-HANDOFF-2026-10-12.md).

## Current checkpoint

Latest Codex implementation/diagnostic commit before this archive: `c2f0391`. This is not a combined release identifier. Run status and cloud results below are dated observations, not automatically updated claims.

- Full normal-graphics hidden memory soak started October 18 at 00:50 PDT. Command uses `--minutes=90` on both wrapper and script. Lock started `2026-10-18T07:50:27.816Z`, expires `09:30:27.816Z`. Receipt will be `C:/Users/andre/AppData/Local/Temp/pdfix-reader-soak-PRvz6j/report.json`. Final report was not yet present at this documentation checkpoint; no pass claimed. Do not start a second copy or rebuild under the running app.
- Cloud run `39107338420` in private repo `DaringName1/pdfix` completed successfully, observed October 18. Two successive clean full runs remain the gate. Codex must not upload or dispatch runs; Claude coordinates them.
- Graphics option 2 was explicitly approved. Retry implementation is committed and checked; package integration and packaged acceptance remain Claude's work, described below. It is not an unimplemented feature in Codex's lane.
- Claude reports the eight additional robot actions are wired into its 43-action robot and pass. Codex independently checked its own eight-action batch before integration. The spare-PC 24-hour run remains Claude's reservation until about Sunday 11 AM.

## What changed and why

| Commits / record | Change and evidence |
| --- | --- |
| `6f3c91c`, `ca283db`, `5c6afdd`, `6237120` | Approved bounded graphics retry. Normal acceleration first; one offered software retry only after a confirmed startup graphics crash; no restart once interactive/save-capable, no loops. Ten unit/native cases and hidden normal/software app checks pass; explicitly requested visible main-PC prompt/drawing checks completed and screenshots viewed. Fatal crash was simulated, not a real driver fault. See GRAPHICS-RECOVERY-INTEGRATION-2026-10-17.md. |
| `c29d8bc` | Save-safety audit and fault tests; staged library output read back from disk. See READER-SAVE-SAFETY-2026-10-17.md. |
| `4551943` | Eight extra robot actions with independently inspected saved output: decorations, compression, outline, boxes, replies, print preparation, compare and sheet sets. See ROBOT-CODEX-EXTRA-ACTIONS-2026-10-17.md. |
| `67807ef` | Supplied local drawing checked through eight workflows and follow-ups, originals unchanged. One-page sample has no selectable text or annotations. Counts/timings only in shared notes; real private PDF artifacts remain local. See LOCAL-DRAWING-ACCEPTANCE-2026-10-17.md. |
| `2dca4da` | Drawing review test waits for actual ready state, retains output assertions and attaches failure diagnostics. Repeated/delayed local checks pass; that spec passed two successive cloud runs. |
| `4edd56b` | Keyboard focus fixes for outline/measurement/comments. Forty-four initial/revealed states pass across size/text configurations. Not every data-dependent branch. |
| `b4c6024` | Large-file synthetic speed and wheel matrix. All configured limits pass; no speculative production workaround. See READER-SPEED-MATRIX-2026-10-18.md. |
| `1ed5ce1` | Markup saving/cancellation messages agree with state, singular counts fixed; cloud tests wait for actual save completion before independent disk assertions. Eight cases and delayed-save controls pass locally. |
| `6f5df67` | Compact markup/Pages output preview controls; Find now opens a previously hidden panel; Close/Escape restore stage focus. Four size/text configurations and 16 reader/markup/Pages regressions pass. All captured screenshots personally viewed. Main/source markup controls retain their existing arrangement. |
| `5ddbb59` | Apparent stale thumbnail checked: sole current/aria-current page is correct. Shared button color transition explains the screenshot. Regression assertions added, no speculative production change. |
| `1be2164`, `c2f0391` | Normal-GPU hidden memory runner, crash-reset rejection, supported long-lease admission. Eight unit cases pass. Short normal-GPU workflow passed; full run is pending. |
| `17ab813` | Pages persistent saved/canceled/error/edited-plan states fixed. Actual unavailable destination, cancellation, retry, 103-character filename, independent PDF readback and unchanged original tested. Five Pages cases pass; final focused check also passes. All 13 captured PNGs viewed. |

Older reader/search/paged-native/outline/markup/converter work is recorded in the reader handoff and older dated progress documents. This recent table does not replace that history or claim to inventory every code change.

## Evidence and its limits

Synthetic local matrix: 1,000 text/vector pages opens in 2,231 ms and whole-file search takes 84,514 ms; three 200-inch pages open in 233 ms; a 211.5 MiB referenced-raster PDF opens in 864 ms. Sampled owned private memory is 568 / 483 / 859 MiB respectively. Wheel response p95 is about 18 ms in hidden software test mode. Generated rasters are not a real photo-rich scan, OCR proof, weak-PC benchmark or physical-display FPS measurement.

Normal-GPU hidden smoke: two cycles in 235.404 seconds; private memory 566.15 then 637.13 MiB, no recorded process crash, independent saved markup readback, unchanged source and clean descendants. This is not a demonstrated plateau. Full memory rule: at least an hour/eight cycles, exclude warmup, settled growth bounded by max(64 MiB, 5%), slope at most 1 MiB/minute and settled private floor below 2 GiB. Crashes, missing diagnostics or unclean exit reject acceptance. No forced GC or production memory workaround.

Selected generated-file receipt copies and a manifest live in `evidence/codex/`. They are supporting records, not fresh test executions. Private drawing outputs/profiles are excluded. Some original screenshot paths in historical notes are temporary and may expire; the by-eye findings are preserved in the handoff.

## Remaining work

1. Inspect the full soak's final receipt; record outcome and process cleanup. Investigate actual continuing growth if it fails. Preserve the completed receipt in Drive.
2. Obtain two successive clean fresh-Windows full suites after Claude uploads current commits. Diagnose only owned failures; do not mask errors as slowness.
3. Claude integrates native outer graphics launcher and inner Electron runtime, inventories/hashes both, fixes launch/registration paths and verifies the packaged retry. See GRAPHICS-RECOVERY-INTEGRATION-2026-10-17.md. Main-PC diagnostic checks do not prove the combined package.
4. Remaining rare populated/error/keyboard branches and human bug reports in reader/Drawing/Pages; no blanket every-state UI claim.
5. Real scan/photographic large-corpus and weaker-machine memory acceptance. Physical printer calibration and human/screen-reader testing remain separate. Nothing has been physically printed by Codex.

Health-report wording/layout belongs to Claude under AGENT-WORKFLOW even though an older simplicity list assigns it differently. Broad "Physical page" renaming needs the user's wording decision. Do not resume Bluebeam expansion, new workspace redesign or the 30 Add-ons as part of this reliability closeout.

## Important machine and coordination lessons

- The main-PC GPU driver has intermittently crashed at startup; a later screenshot failure alone is not sufficient evidence for retry. Do not weaken containment/security or permanently disable acceleration.
- AppContainer jobs launched directly over spare-PC SSH failed without an interactive desktop. Claude's signed-in desktop scheduled-task run passed. Later spare-PC app tests must use that desktop (`schtasks /it`), not plain SSH.
- Every app check and build uses its wrapper. Do not rebuild during your own app run: agent-build waits for the other agent's run, but same-agent overlap still requires discipline.
- The old 60-minute lock blocked honest long-session evidence; Claude's `4ab0b8c` supports duration plus ten minutes in both wrappers. Do not edit active lock receipts to extend them yourself.
- New documentation must distinguish local units, browser, hidden built app, package, visible user and outside-device evidence. A release folder's presence does not prove it includes the latest commits.
- All durable decisions should be in this folder. No private Codex memory is required to continue this lane. Full chat transcript export is a separate application capability, not claimed here.
