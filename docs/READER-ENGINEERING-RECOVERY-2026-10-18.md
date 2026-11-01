# Reader, Drawing and Pages forced-close recovery

The generated 13-step hidden built-app job passes under agent-run. Receipt and personally inspected screenshots:
[evidence](evidence/codex/engineering-recovery/report.json), with exact generated inputs/outputs and SHA-256 manifest.

Run: node scripts/agent-run.mjs codex -- node scripts/check-reader-engineering-recovery.mjs

The job organizes and rotates three bare pages, saves and reopens, adds a note, calibrates a 100mm reference,
measures that same line, saves JSON and PDF takeoffs, performs a preserving reversal, adds an unsaved note,
waits for the actual local draft acknowledgement, terminates the captured Electron main process, then restarts
the same temporary profile. The recovered note is saved, inspected from disk and reopened in the app.

Independent PDF-lib inspection confirms three pages, rotations [0,0,90], both notes on their correct pages,
exact retained takeoff entry and ledger, and recomputed quantity 100.00000000000001mm. PDF.js confirms source
sheet order [3,1,2]. All earlier saved source hashes stay unchanged. No page errors. The terminated app's
captured children disappear without forced cleanup; normal closure of the recovered app also needs no force.

Three screenshots were personally viewed: before forced close, recovered draft, final reopened PDF. These
are one generated workflow at the check's default window size, not the whole two-size/large-text UI matrix.

## Limits and findings

- Recovery starts after a confirmed draft write. This is not interrupted-save, full-disk, power-loss or cross-lane
  editor/form/redaction recovery proof. Existing disk-fault units cover different, explicitly bounded cases.
- The first reorder uses the fresh-copy path on deliberately bare pages before adding review data. Later reorder
  uses preserving mode; this is not permission to fresh-copy arbitrary annotated or structured PDFs.
- After preserving reorder, older PDFix annotations remain visible and exact but may be classified non-editable
  because their retained positional metadata still names the earlier page. The dialog reports two existing
  non-editable annotations kept. A takeoff Contents string still says Physical page 1 after its sheet moves to3.
  This is an editing/reference-continuity limit; do not claim fully editable recovered measurement recipes.
  No private metadata was rewritten during this preservation audit.
- Measurement recomputation proves internal geometry/quantity consistency, not printer scale or CAD compatibility.
- Initial two attempts stopped Playwright's cmd wrapper rather than Electron main. The final check corrects this
  using process.pid plus captured process creation time/name. Earlier attempts are not the final crash evidence.
- No spare-PC, cloud, outside viewer, real signature or personal-file evidence is claimed. Claude owns integration.


## October18 — actual app termination mid-save

The same check with --mid-save passes14steps. In the test app only, the existing file writer is paused after
writing and flushing17bytes of the chosen generated destination's .pdfix-UUID.partial file. The final filename
does not exist. The actual captured Electron main process is then terminated; its children exit without force.
The same temporary profile reopens, recovers the exact acknowledged markup draft and saves a complete final PDF.
Independent PDF-lib/PDF.js checks confirm page order/rotations, notes, exact measurement entry and recomputed100mm;
all earlier source copies remain unchanged. No page errors, normal close leaves no owned processes.

The17byte .partial remains identifiable after process death and is never presented as a completed copy. It is
retained as interrupted-stage.bin in evidence/codex/engineering-mid-save with generated inputs/outputs, report,
SHA-256 manifest and3personally inspected screenshots. This proves this markup/native-copy publication path
under an injected mid-write pause plus actual process termination; not every save path, actual full disk, power
loss, SMB/USB disappearance, shared editor recovery or storage-controller durability. The prior statement that
no app kill-mid-save check exists is superseded only for this bounded case.

The first attempt failed before injection because dynamic import is unavailable in Playwright's main evaluation
context. The check now uses the running Electron's built-in module access; that attempt closed cleanly and is
not a product failure. No production writer, graphics, security or recovery code changed.
