# Search-all / later launch cascade — October 17, 2026

Status: confirmed cloud graphics abort; strengthened test teardown and resource receipts. Root trigger and two fresh-Windows confirmations remain open. No production GPU/security setting changed, no upload and no spare-PC access.

## Cloud evidence

Read full logs and downloaded full-reports for runs 39015538648 and 39030515039, both published head cc94c8bc55f345c448cdce1be5dc56722396fb12. Their first failed page-search trace attachments show repeated GPU-process exits -2147483645 (0x80000003), followed by “GPU process isn't usable. Goodbye.” Electron exits before firstWindow, rather than merely waiting too long. Later recovery/redaction/split launches fail within seconds. Search-all itself reports success; nightly search took 140,029 ms and the entire case about 2.5 minutes.

This establishes the immediate graphics failure in both inspected cloud runs. It does **not** establish an orphaned parser, a leak or a driver defect as its trigger. The owner reports the cascade in three of the last five runs; only these two were newly inspected here. Increasing first-window timeouts does not address this abort.

Local evidence paths: tmp/cloud-39015538648.log, tmp/cloud-39030515039.log, tmp/cascade-39015538648 and tmp/cascade-39030515039. In each first page-search trace.zip, the reader-startup-native-diagnostics attachment retains the GPU stderr. These are private local test artifacts, not uploaded by Codex.

The two cloud wording failures still show the old expected sentences. Current comparison and changed-ink assertions were already corrected in 3ce2abd, with a complete two-file 10/10 local pass. No second source correction is needed; the published run's assertions were old. Do not infer local Git ancestry from the published hash: the publication history is separate.

## Teardown gap and correction

Previously search-all called closeReaderApp immediately after its last assertion. Electron quit initiates asynchronous service disposal, but this test never awaited the paged-reader release, checked its staging folders, observed descendants exiting or verified a subsequent clean-profile start. A passing search assertion therefore did not demonstrate a clean handoff to later tests.

Now the test:

1. Records the opened paged-source IDs while preserving the real handler and all search/page-boundary/highlight/source assertions.
2. Awaits the existing releasePagedPdf bridge for those IDs before quitting, with a bounded cleanup deadline; requires zero remaining job-* folders.
3. Captures the app-rooted Windows process tree, process creation identities, private/working-set bytes, handle counts and available physical/virtual memory at Home, after Stop, after completion and after release. No unrelated process command lines or document content are collected.
4. Waits for all captured descendants, including renderer/GPU/broker/parser, to disappear. If necessary, a test-only fallback stops only captured descendants whose PID, executable name and creation time still match; a reused PID is refused. A forced cleanup is recorded and makes this test fail rather than silently pass.
5. Starts a fresh-profile app and requires Home to appear, closes it and observes its descendants too. The final attached report passes only after workload, cleanup **and** this probe pass. A probe failure remains attributed to search-all.
6. Attaches the complete receipt even for a passing test, so the next full-reports artifact includes measurements. Read-only window-station desktop counts/permission-size/hash receipts additionally distinguish desktop/permission drift from process-memory growth. They do not switch desktops or change any permissions. Diagnostic-read failure is recorded, not treated as proof of zero objects.

This is an explicit test cleanup correction and a way to identify the remaining trigger in the cloud, not a production graphics fallback or a claim that the cascade is fixed.

## Local verification

- Initial seven-case sequence passes search-all, its fresh-profile probe, page-only search, tagged reading and all four splitting cases. W3vTlN/report.json shows parser/broker present while searching, absent after release, no remaining staged job folders and no captured surviving processes; no forced termination. Sampled tree private memory: 278 MiB at Home, 541 MiB at first stopped search, 442 MiB at completion, 406 MiB after release. Sampling is not a peak/no-leak proof.
- Repeated seven-case sequence passes 14/14. YnDWJn and MOke0Q receipts show clean release, no forced cleanup and successful fresh-profile probes. Search times 42.35 and 42.42 seconds. Final read-only desktop receipts and bounded-finally changes were added subsequently and get their own final run; do not claim these earlier receipts contain them.
- Four process-ownership unit tests pass: tree/grandchildren selection, PID/name/creation-time mismatch refusal, actual Windows refusal of a nonmatching live PID, and stopping/observing a disposable child created by that test. No process-name-wide termination.
- First broader attempt: 26/29 pass; three reader cases were blocked before app launch by the private-runtime source/build mismatch guard after concurrent desktop edits. Receipt 5XP5yw retains the original capture error. This is not the GPU cascade; recovery/redaction/splitting still launched. Cleanup assertions now preserve the original error when no app launched. Rebuilt through the lock and reran reader-first immediately.
- Final reader-first sequence: **19/19 pass** (2.8 minutes): search-all plus fresh-start probe, page-only search, tagged reading, five recovery, seven redaction and four splitting cases. TYcGdm/report.json: search 59,345 ms; paged release completes, no job folders, no surviving/forced processes, clean-profile Home probe opens/closes. Total desktops 1→2→1, window-station permission entries 17→18→17, original permission hash restored. No claim of reproducing the cloud abort locally.
- The initial named-private-desktop counter had a Unicode callback marshalling error: its active pdfixDesktops field was zero despite a total desktop increase. Corrected the test-only callback. Separate positive control YHzuFa/report.json proves named PDFix desktops 0→1→0, total desktops 1→2→1, permission entries 17→18→17 and exact original permission hash after release; app closed with no captured remaining/forced processes. Use this corrected counter in future cloud receipts; do not interpret the older active zero as absence of a desktop.
- Read-only reporting also records native PDFix processes outside the captured tree, for diagnosis of earlier-test leftovers. They never enter this test's cleanup targets. Verified separately against the current controller; no unowned process was stopped.

## For Claude

Upload the committed test changes only after the active run finishes, as usual. Keep full-reports artifacts even if search-all passes. Look for reader-search-all-resource-cleanup: remaining native job folders, surviving/forced processes, virtual-memory availability, permission hashes/private-desktop counts and the fresh-start probe. Require two clean fresh-Windows runs before closing A-R14/A-R4. No production fallback should be enabled from this test change alone.

Shared desktop sources, engine/broker isolation, sandbox limits, app shell/editor/converters, the owner's folder and the spare-PC robot were left alone. Claude's concurrent contained-service/document-service edits were not staged or changed here.
