# Reader, Drawing and Pages save-safety audit — October 17, 2026

Scope: source review of the paths below, targeted disk fault tests and generated-file built-app workflows. This is not power-loss certification or proof for every destination filesystem. Shared publication/store/main-process files were inspected, not edited.

## Publication rules

`desktop/verified-output.cjs` stages with an exclusive new file, flushes it, rereads its bytes and checks its hash. New copies are published with an exclusive hard link, so an existing name cannot be overwritten; the published file is reread too. Unsupported destinations fail instead of using an unsafe overwrite fallback. Cleanup removes only the file identity created by this operation. Cancellation checks bracket staging/publication.

`desktop/file-store.cjs` additionally checks source/session identity, extension and reviewed bytes, refuses original/recent-source paths, and checks generated PDF structure before publication. Exact unchanged copies keep their bytes; they are not rewritten merely to pass a structural check. Large retained-source copies stream through the verified staging path.

## Save paths

“Yes” in the table is a source-audit result unless the evidence column explicitly says built app. “Stage/readback” means complete bytes reread from disk before the final name is published or the internal library is replaced.

| Path | Temporary first / disk readback | Final publication | Original / cancellation / failure | Evidence and limits |
| --- | --- | --- | --- | --- |
| Reader Save a copy; unchanged/named PDF copy | Yes, normal or streamed stage | Exclusive new name, then readback | Original paths refused; canceled picker returns before writing; failed/canceled publication cleans owned files | Exact reader copy hash verified in the seven-action built-app run. Stream cancellation and collision fault tests pass. |
| Markup, including flattened copy | Yes, store publisher after reviewed annotation output | Exclusive new name | Source unchanged; no in-place PDF overwrite; canceled/failed save uses shared publisher cleanup | Built app adds highlight/note, saves, reopens and checks note; independent annotation/text readback. All original and temporary-input hashes checked. |
| Organize: rotate/delete/extract/combine/crop/resize | Yes, store publisher after output review | Exclusive new name | Original source paths refused; cancel/failure keeps originals | Four separate built-app actions verify pages, rotation, retained/deleted text and unchanged inputs. Crop/resize had prior generated pixel/geometry checks; no new claim for all geometry settings. |
| Split files | All PDFs and receipt staged and verified first | Exclusive new folder; individual parts published; completion receipt last | Normal handled failure/cancellation rolls back only owned files; existing folders untouched | Source audit plus prior splitting tests. Whole directory is **not** a crash-atomic transaction: power loss may leave a subset without its completion receipt. Treat such a folder as incomplete. |
| Single/batch compression | Yes, store publisher after verified compression output | Exclusive new name / bounded keep-both names | Originals kept; batch cancellation may leave already completed, valid copies; never call these incomplete bytes | Source audit; prior compression tests. Compression workspace scratch inputs/outputs are separate from final saves. |
| Page numbers/stamps/Bates, outline, page boxes, print marks, thin-line repair | Yes, reviewed sealed output through store publisher | Exclusive new name | Source/token checked again after picker; original paths refused; cancellation writes no final copy | Source audit of handlers and publisher. Earlier per-tool built checks exist; this audit did not repeat every setting. |
| Drawing comments/replies and comment exchange/recipes; takeoff JSON/CSV/PDF; batch text/copy outputs | Yes, appropriate text/PDF output routed through store publisher | Exclusive new name / bounded keep-both batch names | Original paths protected; recipes/data are saved copies, not implicit edits to the original PDF | Source audit; built-app measurement ledger is independently parsed and quantity recomputed from saved points. No outside-software interchange claim. |
| Named page workflow library | **Fixed here:** verified staging helper now flushes and rereads before rename | Same-directory rename replaces only PDFix's internal library after explicit save/delete | Drawing/PDF sources never overwritten. Failed staged read keeps old library; failed cleanup is reported | Fault-injection test forces staged read failure, checks flush/read attempted, old bytes retained and no temporary file; subsequent valid persist reopens. Built app saves both named libraries at 800×620 / 150%; independent disk JSON readback passes, no .partial files remain (oyfcHV/report.json). |
| Named sheet-set library | **Fixed here:** verified staging helper now flushes and rereads before rename | Same-directory rename; existing loaded-library fingerprint check retained | Sources never overwritten. Failed staged read keeps old library; failed cleanup is reported | Same fault test and valid reopen as page workflows. Built app saves both named libraries at 800×620 / 150%; independent disk JSON readback passes, no .partial files remain (oyfcHV/report.json). |
| Browser preferences, draft settings, named styles | Browser/profile storage rather than exported PDF publication | Outside file-copy publisher | Not an original-PDF overwrite | Not claimed to have filesystem staging semantics. Recovery/local library durability is separate from final PDF-copy safety. |

## Fault evidence

`node --test tests/pdf-save-safety.test.cjs`: seven passing tests with normal Windows filesystem permissions. Cases: final filename appears after verified staging; collision preserves existing file; cancellation after staging; staged-byte corruption removes the new publication; canceled retained-source stream; failed staged read preserves each of the two internal libraries. No new dependency or shared publisher change.

## Honest limits

- “Leaves no partial file” holds for tested handled failures/cancellations when the filesystem permits cleanup. If the OS refuses cleanup or another program replaces a file, PDFix reports the retained artifact and does not delete somebody else's file. A process crash/power loss can leave a staging artifact. Do not promise otherwise.
- Internal library rename is a single-file replacement, not a journaled backup. Disk failure after a successful rename cannot be undone by a byte-check test. The original document remains separate.
- The existing editor-only replace-in-place path is Claude's lane; this audit did not change or certify it.
- Real printer output, remote-desktop sandbox behavior and outside PDF software remain separate acceptance evidence.

## October18 V1 audit extension

New tests/pdf-save-faults.test.cjs adds six passing boundary checks using real generated PDFs: injected ENOSPC
after17bytes, injected sharing failure, actual disappeared destination directory, cancel immediately after hard-link
publication, two concurrent writers (one independently reopened winner), and a real child process killed after a
17-byte staged write. Handled failures preserve source bytes and clean owned artifacts. Killed child leaves a
recognizable .partial but no final copy; app drawing recovery is not inferred from publisher safety.

Tests/pdf-audit-preservation.test.cjs adds two full-object before/after checks for markup and comment edits:
attachment encoded bytes, tag objects, form values and CO/calculation actions, outline and metadata survive.
Markup's PDF-library normalization appends only independently decoded q/Q wrappers around unchanged original
content references; the fixture checks this exact exception. These are structural fixtures, not PDF/UA conformity.

Remaining gaps and the explicit per-route signature/structure matrix are in V1-WHOLE-APP-AUDIT-2026-10-18.md.
No real full-disk, NT sharing handle, USB/SMB disconnect, whole-app kill-mid-save recovery or power-loss guarantee.
Shared verified-output.cjs/file-store.cjs were inspected, not changed by Codex.
October18 continuation:21additional route-structure cases pass; see READER-SAVE-STRUCTURE-AUDIT-2026-10-18.md.
They save codec/native results and independently inspect disk files, including attachments/tags/form calculations.
These complement the publisher fault tests; they do not prove crash durability for every UI save path.

### October18 — real Windows exclusive file locks

New tests/pdf-save-windows-locks.test.cjs passes3cases using a separate hidden PowerShell process with an actual
FileShare.None handle (no mocked filesystem call): locked existing destination; locked retained-stream source;
locked verified stage. Existing destination/source bytes remain exact and reopen independently. The first two
cases leave no stage/final copy. When Windows also blocks cleanup of the owned stage, the publisher returns PARTIAL
and names the artifact instead of claiming success or deleting another process's file. After releasing the lock,
the test checks retained staged bytes; any possible final link must contain the complete staged PDF and be named
in the error. Owned lock-holder processes release and exit normally.

These are real local NT sharing-handle boundary checks of the shared publisher used by reader/Drawing/Pages,
not the renderer message, remote SMB/USB loss, full disk, app kill-mid-save or power failure. No shared publisher
code changed. They supersede the earlier NT-lock-unverified statement only for these explicit local cases.


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

## October20 expanded independent output checks

44route tests plus16fault/safety/Windows-lock tests pass (60total). Added editable/flattened checks for highlight, underline, note, text, ink, line, arrow, cloud and callout; source object/stream preservation, attachment bytes, tags, form value and calculation action/order, outline and unrelated annotations are independently read from saved files. Selective metadata cleanup and portfolio addition retain their declared unrelated payloads. Actual sandbox repair preserves those semantics, refuses a wrong source fingerprint and invalidates discarded output. PDF-lib may wrap unchanged source Contents references with exact q/Q streams; tests verify those wrappers and original inner references explicitly. Notes remain editable by policy. Evidence: docs/evidence/codex/ui-polish-2026-10-20/save-audit.txt. Production save policy unchanged; physical full disk/power loss and complete per-screen interruption coverage remain open.

Codex October20 preserving Pages recovery:5step hidden built-app check passes after interrupting actual save at17flushed staging bytes and killing owned app main. Same-profile recovery restores order3,1,2; saved page identities, exact annotation/private field, internal link and bookmark objects/destinations and original bytes independently verified. Two screenshots viewed. No final partial PDF published; identifiable17byte staging artifact may remain after forced death. No power-loss or all-route guarantee. Evidence: docs/evidence/codex/pages-save-recovery-2026-10-20/.
