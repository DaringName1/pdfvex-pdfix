# V1 whole-app audit: the 12 qualities between the features — October 18, 2026

**Owner decision (October 18, evening):** this audit is part of version 1. Before more features are built, Claude and
Codex audit the real code and tests against these 12 areas, record what already works **with evidence**, and list
what is unverified. Feature work after the dad's feedback is chosen from this audit, not only from feature lists.

This document does not replace [the verification plan](VERIFICATION-PLAN-2026-10-16.md) (its four layers and 13
easy-to-miss areas) or [the quality register](QUALITY-VERIFICATION-REGISTER-2026-10-15.md). It reorganizes that
work around the owner's 12 areas and adds what was missing: **long multi-step workflows, signature preservation,
shared-folder conflicts, standards, IT deployment, switching from Adobe, and a readiness score.**

## Rules for the audit (both agents)

1. **Check the output, not the message.** A step passes only when the saved file is inspected independently
   (structure, text, objects), never because PDFix said "Saved". Redaction: the words must be gone from the file,
   not just covered.
2. **Before-and-after structure comparison** for every save route: pages, annotations, form fields and
   calculations, bookmarks, attachments, signatures, tags, metadata and anything unrelated to the edit must be
   unchanged unless the user chose to change it.
3. **"Not verified" is a valid answer.** Each area starts at 0% verified. Something already in the code counts only
   once a test or recorded check proves it. Say plainly what was not checked.
4. Each agent audits its own lane (lanes in [AGENT-WORKFLOW](AGENT-WORKFLOW.md)); Claude merges the results here.
5. No new features during the audit except fixes for data loss, security or crashes it finds.

## The 12 areas

Status key: **Evidence** = proven by named tests/checks; **Partial** = some routes proven; **Unverified** = code may
exist, no proof; **Deferred** = the owner has postponed it (named below). Each starts at 0% until the audit fills it in.

| # | Area | What must be true | What already exists (to be checked, not assumed) | Known or likely gaps | Lead | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Complete workflows | A person finishes a whole job without awkward manual steps | Robot (47 actions, pairs tracked, saved files verified); app specs per tool; Codex open → markup → organize → save → reopen | **No long chains** (10+ steps across tools with restart and recovery in the middle); robot draws pairs, not jobs | Claude (robot), Codex (reader/drawing chains) | Critical |
| 2 | Interoperability | Saved files open correctly in Acrobat, Bluebeam, Chrome, Edge, Word, Excel, PowerPoint | Outputs re-read with PDF.js, pypdf, qpdf; DOCX checked with mammoth; XLSX/PPTX read back | **Never opened in Acrobat, Bluebeam or Microsoft Office.** Needs the owner's PC or a test PC with those apps | Claude (method), both (files) | Critical |
| 3 | Data integrity | Nothing is silently changed, lost or corrupted | New-copy saving, disk re-read, original-unchanged hashes in many tests | **No before/after structure diff across all save routes.** **No warning found that editing a signed PDF breaks its signature** (to confirm). Attachments, tags and form calculations not checked on every route | Both, per lane | Critical |
| 4 | Failure recovery | Crash, power loss, interrupted save, full disk, lost network drive never destroy work or the original | Recovery drafts and versions; recovery.spec; forced-quit checks; disk-budget errors for large PDFs | **Not tested:** power-cut mid-save (kill during write), full disk on save, network drive vanishing, a file locked by another program, two PDFix windows saving the same file | Claude (shell, editor, save), Codex (reader, drawing) | Critical |
| 5 | Security and privacy | Hostile files contained; no unwanted uploads; no unauthorized access | Windows sandbox with no network for document engines; contained readers; reader blocks online requests; no telemetry | Hostile-file corpus (fuzzing), dependency audit, offline run of the full checklist, outbound-network watch during the robot | Claude (shared), Codex (reader) | Critical |
| 6 | Performance at scale | Huge drawings, thousands of pages, hundreds of files | 500-page and 81 MB Word checks; reader speed matrix and soak | **Reader memory gate fails** (A-R2, Codex). Hundreds-of-files batch, 1,000-page and 300 MB drawing sets not proven | Codex (reader), Claude (batch, editor) | High |
| 7 | Team collaboration | Share, review, lock, synchronize without losing changes | Synchronized-file and watched-folder tools; XFDF comment exchange | **Bluebeam-style shared Projects/Sessions are deferred by the owner.** For v1: verify the single-user-on-a-shared-folder cases (someone else changed or locked the file, conflicting saves, offline then back) | Claude | High (engineering) |
| 8 | Deployment and IT | Easy install, update, configure, remove | Package with checksums and inventory; per-user installer and uninstaller; packaged-launcher smoke | **Spare-PC install/uninstall not done yet** (Phase 0 P3). No update path, no silent install or company settings | Claude | High (business) |
| 9 | Accessibility and standards | Assistive technology works; applicable PDF standards met | Keyboard/focus pass; accessibility audit and tag tools; preflight | **No screen-reader test (NVDA/Narrator).** PDF/A, PDF/UA, PDF/X output claims not validated with an external validator (veraPDF) | Claude (method), both | High |
| 10 | Migration and switching | A company leaves Adobe without rebuilding its process | FDF/XFDF import/export, form data exchange | Not studied: Acrobat stamps and tool sets, signatures/certificates, action wizards, Bluebeam markup lists and tool chests. Deferred items listed, not built | Both (list only in v1) | High |
| 11 | Discoverability and usability | New users find and understand tools without training | Plain-language UI passes; Home/Workspaces ordering; [simplicity notes](UI-SIMPLICITY-NOTES-2026-10-17.md); tester guide | First real users: the dad's test (October 19) and owner checks. Findings feed this area | Claude (shell), Codex (reader) | High |
| 12 | Long-term maintainability | Updates improve without breaking existing behavior | 365 unit tests, 41 app spec files, 88 check scripts, cloud full runs, lanes and locks | Cloud not yet two clean runs in a row; **no update-over-previous-version test**; tests that check the wrong thing still appear (fixed when found) | Claude (integration) | High |

## Five test levels, applied to every area

| Level | Purpose | Example | Where it lives |
| --- | --- | --- | --- |
| 1. Unit | One function | Picture header limits | `tests/*.test.cjs` |
| 2. Integration | Connected parts | The editor saves what the reader opens | `tests/desktop/*.spec.js`, `scripts/check-*.mjs` |
| 3. Workflow | A whole real job | Convert → edit → sign → export → reopen | Robot sessions; **new: robot "jobs" (below)** |
| 4. Stress and failure | Reliability under trouble | Kill PDFix during a save, full disk, drive removed | **New: failure scenarios (below)** |
| 5. Compatibility | Acceptance by other software | Open the saved file in Acrobat/Bluebeam/Office | **New: compatibility pack (below)** |

Every level checks the saved output independently.

## New work this audit adds

**A. Robot jobs (Claude, area 1).** Besides random pairs, the robot runs fixed multi-step jobs that end in one file
checked in depth. First jobs:
1. Engineering set: open a multi-page PDF → rotate and reorder pages → add markups and a measurement → search and
   redact a word → fill a form field → save to a folder → force-close PDFix → restart → recover → save → verify
   every change is in the final file and the redacted word is gone from it.
2. Office paperwork: Word file → edit, table, picture (turn/crop) → export PDF → sign it → protect it → reopen.
3. Spreadsheet and slides: edit, save copies, convert to PDF, combine with a drawing, add page numbers.
(The network-disconnect and synchronize steps wait for area 7's shared-folder checks.)

**B. Failure scenarios (Claude for shell/editor/save routes, Codex for reader/drawing).** For each save route: kill
the process mid-write, fill the disk, make the target read-only or locked by another program, remove the folder
(USB or network), and save the same file from two windows. Pass = original intact, no half-written file presented as
good, a plain message, and work recoverable.

**C. Structure diff tool (Claude builds, both use, area 3).** A script that lists a PDF's pages, annotations, fields
and their calculations, bookmarks, attachments, signatures, tags and metadata, and reports every difference between
two files. Every save test then says which differences are expected.

**D. Signed-PDF rule (area 3).** Confirm what each tool does to a digitally signed PDF. PDFix must warn before any
change that breaks a signature and keep signatures when only allowed changes (incremental form fill, comments) are
made where possible.

**E. Compatibility pack (area 2).** A folder of outputs from every tool plus a checklist. Opened in Acrobat Reader,
Bluebeam (if available), Chrome, Edge and Microsoft Office on a PC that has them, results recorded per file. Also run
veraPDF on PDF/A and PDF/UA outputs.

**F. Hostile-file and offline checks (area 5).** A corpus of damaged and hostile PDFs/Office files through every
opener (must refuse or contain, never crash or hang). Run the robot with the network cable off and watch for any
outbound connection.

**G. Install, update and remove (area 8).** Spare PC: copy and installer routes, standard user, uninstall,
reinstall, personal files untouched; later, installing version 2 over version 1.

## Readiness score

The score counts only **independently verified** work, per category, for one target: replacing Acrobat for an
individual. A separate engineering score (adds collaboration, measurement accuracy, project handling, business
deployment) is for later, when replacing Bluebeam becomes the target.

| Category | Areas | Weight | Verified now |
| --- | --- | --- | --- |
| Feature correctness | tools work as described | 20% | 0% (audit fills in) |
| Complete workflows | 1, 11 | 20% | 0% |
| File integrity and compatibility | 2, 3, 9 (standards) | 25% | 0% |
| Security and recovery | 4, 5 | 20% | 0% |
| Performance and usability | 6, 8, 9 (accessibility), 12 | 15% | 0% |
| **Weighted readiness** | | | **0%, until the audit records evidence** |

Rule for filling it in: a category's percentage is the share of its checklist items that have a named, passing,
output-checking test or recorded check on the current build. Write the evidence next to each item.

## UI and workflow design pass (owner, October 18 evening)

**The owner's view: the UI is not done.** It is improving, but it needs many changes, much more drag and drop, and
other improvements the owner will list. Both agents' UI checks so far were mostly "is anything broken or oddly worded"
(screenshots looked at by eye), not "is this the easiest way to do the whole job". That second kind of check has
barely been done by Claude or Codex, and it belongs together with area 1 (complete workflows) and area 11 (usability).

Not started yet, on purpose: the owner will give the full list when it is time (after the dad's feedback and the
first audit results). When it starts:

1. **Walk whole jobs, not screens.** For each common job (read and mark up a drawing set, fill and sign a form,
   edit a Word file and send a PDF, combine and reorder pages, redact, convert), each agent does it by eye in its
   lane and counts the clicks, dialogs, scrolling and places a person has to look. Note every awkward step.
2. **Drag and drop everywhere a person would expect it:** files onto Home and onto tools, pages between files and
   within a file, pictures into documents, files onto Combine, markups and stamps onto pages, sheets into sets.
   Make an inventory of where it works today and where it is missing.
3. First pass done: [UI walkthrough, October 18](UI-WALKTHROUGH-2026-10-18.md) (tools buried three levels deep, every tool a separate window, no page thumbnails, adding text takes about eight steps).
4. **The owner's list** goes here first, item by item, with who owns each one.
5. Compare with how Acrobat, Bluebeam and other PDF and office apps do the same job (for example Foxit, PDF-XChange, Drawboard, Preview on Mac, Word, Google Docs). **Owner rule: use the best way, not Adobe's way.** If another app does a job more simply, copy that approach; if we can think of a better way than any of them, do that. PDFix must never be harder than Acrobat for an everyday task. Copy the idea and the workflow, not their code, artwork or exact branding.
6. Existing notes to merge: [UI simplicity notes](UI-SIMPLICITY-NOTES-2026-10-17.md),
   [UI design baseline](UI-DESIGN-BASELINE-2026-10-15.md).

Owners: Claude for Home, shell, Documents and More tools and the editor; Codex for the reader, markup, Drawing and
Pages. The robot's job tests (A above) are built from the same jobs, so the walkthrough and the tests share one list.

## Order

1. **Now (before public release):** areas 3, 4, 5, 1 and 2: data integrity, save and recovery, security, core
   workflows, compatibility.
2. **During early testing (dad and community):** 6, 11, 9, accessibility, varied real documents, 8.
3. **Before calling PDFix a Bluebeam alternative:** 7 (shared projects, concurrency, offline sync), drawing
   measurement accuracy, business deployment, 10.
4. **As it grows:** enterprise support, security audits, stronger release process, documented reliability.

## Audit output (to fill in)

Each agent adds, per area in its lane: what was checked (files read, tests run), evidence links, what is proven,
what is unverified, and bugs found. Claude merges these into the table above and updates the readiness score.

### Codex lane: October 18 evidence audit

Scope: reader, markup, Drawing, Pages, graphics and memory. This is a bounded evidence inventory, not a declaration
that version 1 is complete. No readiness percentage is assigned here; Claude merges the checklist and score.
The latest feature freeze takes priority: custom-font adapter approved by the owner, implementation paused;
mixed-style comment work already on disk is a work in progress, not a release-completion claim.

Fresh verification: locked build succeeds; full unit suite 384 passed, zero failed, one skipped (385 total). `pdf-save-faults`, `pdf-save-safety`, `pdf-operations` and
`markup-output` pass 27/27. Three FreeText/XFDF hidden Electron cases pass with independent saved-file assertions;
seven pre-audit mixed-comment/Pages app cases pass. Markup/Pages regressions pass14/14 after correcting one test to include its intentionally hidden Save control. The generated active-content opener check also passes, as does the connected workflow with independent saved-note/page-order verification.
The existing package installed below predates today's audit fixes. Do not confuse source tests with that package.

| Area | Code and output-checking evidence examined | Proven within this evidence | Unverified / defects / follow-up |
| --- | --- | --- | --- |
| 1 Complete workflows | `scripts/check-reader-connected.mjs`, `scripts/user-robot/actions-codex*.mjs`; app `markup.spec.js`, `page-workspace.spec.js`; unit `markup-recovery.test.cjs` | Fresh connected check passes and independently reopens markup plus preserving reorder (audit-connected-workflow.json). Local app tests verify saved content/rotation and isolated markup restart recovery. | No single forced-close chain yet combines rotation, reorder, markups, measurement, recovery and final structure comparison. Claude's cross-lane engineering job remains required; actions/pairs are not equivalent. |
| 2 Interoperability | `pdf-review-freetext.test.cjs`, `pdf-review-rich-runs.test.cjs`, `drawing-xfdf.spec.js`, `compression.test.cjs`; PDF.js annotation/AP text, pdf-lib objects and contained checker | Generated standard comments/replies and reviewed XFDF independently decode; saved copies reopen in the app. Compression verifier detects altered text/fields/metadata/images. | Not opened in Acrobat, Bluebeam or Office; no real custom-font interchange acceptance. A parser passing does not establish another app's rendering. |
| 3 Data integrity | `src/pdf-operations.js`, `src/markup-output.js`, `desktop/pdf-review-edit-codec.cjs`, `compression-inspect.cjs`, `file-store.cjs`; `pdf-audit-preservation.test.cjs` and route table below | New full-object before/after tests preserve attachments/encoded streams, structural tag objects, form values/calculation order/actions, bookmarks and metadata for markup and comment body edit. Existing compression graph verifier compares unrelated data. | **Found/fixed:** Pages admitted signature objects outside AcroForm and silently discarded attachments/tags. It now refuses those sources. Markup missed nested direct signature markers; now refuses them. Genuine signed/certified mutation is refused, not incrementally signed or cryptographically validated. Every remaining save route still needs its explicit structure matrix. |
| 4 Failure recovery | `verified-output.cjs`, `split-writer.cjs`, `page-workflows.cjs`, `sheet-sets.cjs`; `pdf-save-faults.test.cjs`, `pdf-save-safety.test.cjs`, `split-output.test.cjs` | Real Windows exclusive publication/collision; injected ENOSPC after partial write, sharing failure, canceled publication; actual missing destination; simultaneous competing copies; real child killed during staging. Original bytes stay intact; handled cases clean owned files; competing winner independently reopens. | Kill test leaves a recognizable `.partial`, never a completed filename. Not OS power loss, real full-volume exhaustion, SMB/USB loss or actual NT sharing lock. Full app killed mid-save plus recoverable drawing draft across every route remains open. Split crash can leave a subset without completion receipt. |
| 5 Security/privacy | `pdf-review-worker.cjs`, `pdf-review-edit-codec.cjs`, `compression-inspect.cjs`, bounded paged service/protocol, `pdf-link-review.js`; tests `pdf-paged-protocol`, `pdf-paged-staging`, `pdf-review-richtext`, `pdf-review-rich-runs`, `compression`, `markup-output`; app `reader-hostile-audit.spec.js` | Tested malformed/protected inputs, bounds, unsafe XML/style rejection, signature refusal and original-source preservation. reader-hostile-audit.spec.js passes generated OpenAction/AA JavaScript, Launch link and HTML-like note text through reader/markup/Pages; no observed renderer HTTP request or external-app call; fresh page output independently strips the actions/annotations. Existing review/decode jobs use contained services; no unrestricted fallback added. | Not a hostile corpus through every opener, fuzzing, independent penetration test, offline full workflow or outbound-network capture. A worker is not itself an OS sandbox. Retained original JavaScript is preserved, not sanitized or executed by these tests. |
| 6 Performance | `check-reader-soak.mjs`, `reader-memory-plateau.mjs`, `pdf-reader-memory-report.test.cjs`; [full allocation receipt](evidence/codex/pdfix-reader-soak-W9AiHQ.json) | 18 cycles/94.03 minutes, normal graphics, all source/save/reopen checks, clean exit, no surviving/forced children or process failures. Natural counters recorded, no forced collection. | **A-R2 fails:** later private median +80.44 MiB versus 64; slope 1.872 MiB/min versus 1. Not stable. JS heap +1.57 MB, embedder +11.12 MB, renderer native/private also rises; this does not identify a leak's owner. Real 300 MB scanned sets and hundreds-file batch gates remain separate. |
| 7 Shared folders | `verified-output.cjs`; simultaneous-publication test, XFDF output assertions | Two attempted copies to one name produce one complete file and a safe refusal; neither source overwritten. XML imports preserve Unicode replies/private source data within supported subset. | No real shared-folder offline/reconnect/conflict acceptance. Projects/Sessions deferred. Claude owns synchronized-file/conflict UI. |
| 8 Deployment | [exact package check](PACKAGED-READER-ACCEPTANCE-2026-10-18.md); installer read, actual owner's per-user install and shortcut receipt | Monday package inventory verified, outer launcher and second-instance file handoff tested. Owner-requested install completed; desktop and Start-menu shortcuts point to existing outer launcher. Documents/settings retained, no default association changed. | Install is on the main PC, not spare-PC uninstall/reinstall or update-over-old proof. Cosmetic installer icon path A-CI1 belongs to Claude. Installed package lacks today's source changes. |
| 9 Accessibility/standards | Existing reader keyboard tests, readable tags/layout tests, dialog focus helper; exact refusal for tagged fresh copies | Tested keyboard/model cases and bounded readable extraction. Existing tags are preserved by the new markup/comment structural test; fresh-catalog copies refuse rather than discard them. | A structural marker fixture is not valid PDF/UA. No Narrator/NVDA, veraPDF PDF/A/PDF/UA or PDF/X validation. No universal accessibility claim. |
| 10 Migration | XFDF export/import test and comparison with explicit export notices; comment object-preservation tests | Literal selected standard comments/reply links round-trip in the tested subset. Unsupported/private export data is explicitly omitted while original PDF is untouched. | No Acrobat stamp/action wizard/certificate migration or Bluebeam tool chest/custom-column compatibility claim; proprietary expansion deferred. |
| 11 Usability | Prior dated reader UI matrix and tester guide; `page-workspace.spec.js` four refusal-state screenshots personally inspected at800x620 | Existing screen checks and narrow current dialogs have recorded local evidence; unsafe output choices now explain why no copy can be created. | Dad's feedback, physical printer ruler measurement and a new-user discoverability study remain outstanding. No redesign/new workspaces added. |
| 12 Maintainability | `AGENT-WORKFLOW.md`, bounded runtime snapshots, source/receipt hashes, unit suite and fresh-Windows failure artifacts | Own-path commits/locks and generated fixtures maintained. FreeText stale wording fixed in 2911b8c; XFDF waits for actual reviewed XML, with bounded native diagnostics instead of fixed sleeps. | Two consecutive clean full cloud runs still required after Claude upload. No upload/dispatch here. Approved font dependency is deferred until audit work permits feature resumption. |

#### Structure audit by save family

Shared staging/publication source review is [READER-SAVE-SAFETY-2026-10-17.md](READER-SAVE-SAFETY-2026-10-17.md).
It is not a substitute for the per-route content checks below. “Preserved objects” includes encoded stream bytes;
it does not certify behavior in another viewer or the validity of pre-existing tags/signatures/actions.

| Save family | Signature handling in code | Structure proof / missing proof |
| --- | --- | --- |
| Reader unchanged Save a copy (normal/large retained stream) | Byte-for-byte copy, no rewrite; does not validate signature | Source/output SHA match in existing reader robot and retained-stream tests. Exact byte preservation includes all structures, conditional on successful identity/hash checks. |
| Markup editable / flatten | Refuses signature/permission markers, including nested direct dictionaries after this fix | Editable copy now has full source-object comparison except declared Annots and checked q/Q content wrappers; exact source streams kept, attachment/form/CO/tag fixtures retained. Existing flatten tests check text/foreign annotations; full tags/attachment/calculation matrix for flatten remains unverified. |
| Existing comment body / additive reply/history | Bounded graph refuses signed/certified/XFA source | New body full-object fixture passes; existing reply tests compare original dictionary/AP/resources/private data and Unicode parent links. Full complex form/tag fixture for every reply variant still pending. |
| Fresh organize/crop/resize/combine/extract and split | AcroForm refused; expanded signature/attachment/tag refusal added | Pages/geometry/text/original hashes verified. Annotations/links/bookmarks/metadata removal is an existing explicit UI choice. Attached files and tags were not disclosed: now refuse instead of dropping them. Unsupported form calculations cannot enter this path. |
| Preserving reorder / replacement sheets | Code uses preserving codec graph and source-object fingerprints; signature sources refused | Existing connected reorder and revision-boundary checks; not a new full attachments/tags/calculations fixture on both paths. Replacement geometry and destination rules are bounded. |
| Compression single/batch | Full graph refuses signed/certified/XFA | `compression.test.cjs` proves forms, field values, links, outlines, metadata, attachments and rejects unwanted graph changes. Explicit CO/tag fixture and interrupted batch acceptance remain unverified. Lossy mode intentionally changes eligible image data only. |
| Page numbers/stamps/Bates | Preserving codec plus reviewed native result; signature constraints in owning codec | Existing tool tests/readback; no complete fixture matrix for attachments/tags/CO on every decoration/export variation in this audit. |
| Outline editing, page boxes, print marks, thin-line repair | Owning bounded preserving graphs refuse unsupported signature/certification cases | Existing object/geometry/tool assertions; full common structure fixture per route still pending. Do not count this whole family complete. |
| Takeoff PDF / JSON / CSV and recovered measurements | PDF writer uses preserving load/graph and exact source ledger; data exports do not rewrite PDF | Quantities recomputed, source hashes and supported annotation round-trip checked by robot/tests. Full PDF structure matrix and forced-close combined job remain unverified. |
| XFDF export/import | Export never rewrites source; import uses bounded preserving graph | App test independently parses literal XML, Unicode thread state, retained private data and original bytes. Full tag/form/attachment fixture and third-party acceptance pending. |
| Libraries / drafts / recipes / text outputs | No signed-PDF rewrite when saving JSON/CSV/settings | Internal sheet/workflow failed-stage tests preserve old JSON. These are not proofs of document recovery after abrupt app death. |

Requests for Claude: merge evidence without raising scores for unverified routes; use the planned shared structure-diff
tool for the remaining route fixtures; coordinate the long engineering recovery job across lanes. Run lock is released
after the 94-minute soak. FreeText wording fixed; XFDF completion wait passes locally; upload and two clean full cloud
runs remain yours. Spare PC untouched (reserved until approximately October19 14:30).

### Codex continuation — save-route structure fixtures

READER-SAVE-STRUCTURE-AUDIT-2026-10-18.md and tests/pdf-audit-save-routes.test.cjs add21passing cases (most direct
codec plus actual disk reopen; compression also contained native). They cover preserving reorder, outline, boxes,
print marks, thin lines, six decoration modes, takeoff PDF, XFDF import, supported replacement sheets and flattened
text markup. Actual attachments/tag objects/form fields/widgets/calculation order/actions stay, except explicitly
chosen changes. Replacement refuses tag-dependent sources and selected widget pages.32signature-marker boundary
assertions refuse eight opener/preserving routes; no real certificate/incremental-signature acceptance claim.

This supersedes the earlier missing-common-fixture statements for these bounded cases, not for every UI setting,
batch route, JPEG variation, real signature, outside viewer or PDF standard. Full route/exception/limitation table
is in that dated evidence doc. No production code changed; readiness merge remains with Claude.
### Codex continuation — chained engineering recovery

The generated13-step hidden built-app check-reader-engineering-recovery.mjs passes rotate/reorder, markup,
calibrated measurement, preserving reorder, acknowledged draft, actual Electron-main forced termination, same-profile
recovery, save and independent output readback. Exact page order [3,1,2], rotations [0,0,90], both notes and original
measurement entry/100mm recomputation pass; earlier files unchanged, no errors or surviving captured children.
Three screenshots personally inspected. Evidence/limits: READER-ENGINEERING-RECOVERY-2026-10-18.md. This supersedes
missing chained proof only for this bounded Codex-lane workflow, not kill mid-save/power loss or Claude's cross-lane job.
Older annotations can become non-editable after reorder and takeoff text keeps its earlier page reference: A-D-AUDIT2.
No readiness score assigned by Codex.


Codex reply/history continuation: targeted route suite now23/23. Two additional Unicode reply cases (no status;
Accepted/Review) retain all source objects except appended page Annots, including actual attachment/tag/widget/
calculation data. Disk reopen plus PDF.js independently verifies new reply/status/appearance. See the save-structure
audit's continuation; other review states and outside-viewer behavior remain separate.


### October18 — font-resource instrumentation

Added read-only FontFaceSet counts (faces/families/loading) and stylesheet counts to the existing reader soak
samples. No font names/paths, forced GC, heap snapshot, cache purge or production graphics setting change.
A normal-graphics hidden smoke completes two cycles/235seconds with source unchanged, independent markup readback,
no process/page failures and clean exit (zero forced or surviving owned processes). In both cycles, open state
records1font/1family/2stylesheets/26connected canvases; closed state records0fonts/0families/1stylesheet/0canvases.
This rules out accumulation in those live counters over these two cycles only. Native caches/off-DOM objects and
long-session ownership remain unproven. Private bytes rise566.96to634.68MiB; the two warmup cycles cannot establish
a plateau. The unchanged duration gate correctly returns eligible:false/pass:false. The smoke exit0 certifies
workflow/instrumentation only; A-R2 stays open after the earlier two failed full soaks.
Evidence: docs/evidence/codex/reader-font-resource-smoke.json plus hashes. Run lock released; no app left running.


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


### October18 — reader-only diagnostic and real-lock suite confirmation

The soak now accepts --reader-only only together with --smoke; normal/full runs still require markup saved-file
verification and the unchanged memory limits. Two reader-only normal-graphics cycles/137seconds pass workflow,
source-unchanged and clean-exit checks, with no captured process/page failures. Settled private memory475.71then
536.80MiB; embedder7,461,320then8,218,112bytes. Both closes have0live fonts/canvases,1stylesheet. No markup save was
performed or claimed. Evidence: reader-only-memory-smoke.json and hashes under docs/evidence/codex.

Growth during reader-only warmup means the short-term symptom does not require a markup save, but does not
identify a leak/owner or establish a plateau. This is not a controlled same-runtime A/B study, not a performance
pass, and does not supersede the two failed full soaks. No speculative production fix, GC or GPU change.

Full unit confirmation after the two reply cases and three actual Windows sharing-lock cases:414pass/1skip
(415total), log tmp/codex-native-lock-unit.log. The skipped pre-existing case is not newly marked passing.


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


### October18 — malformed-input refusal and next-job recovery

New scripts/check-reader-damaged-recovery.mjs passes4generated cases in one hidden built-app session under
agent-run: empty input, text with .pdf ending, PDF header without objects, catalog without page tree. Each gets
a plain refusal in104–261ms; the two parser failures reach PDF unavailable, not just a stale toast. After EACH
failure, a valid PDF opens, an unchanged copy saves, independent PDF-lib readback verifies geometry/page count
and exact SHA, and the copy reopens with expected text. Original good and bad files remain unchanged.
No uncaught page errors, observed renderer HTTP requests, shell-open attempts, forced cleanup or surviving
captured app processes. This is a four-file generated boundary corpus, not fuzzing, all-tool/native coverage,
OS-level outbound capture, denial-of-service certification or a real hostile-file collection.

All4error screenshots personally viewed; generated fixtures/copies/report/hash manifest preserved under
docs/evidence/codex/damaged-reader-recovery. Reader failure state remains usable and messages provide a next step.
Requests for Claude: transient shared toast overlays Home's heading and the reader toolbar in these screenshots.
That visual placement is a shell/design issue; listed for the current UI work, not modified during this audit.
No new production bug or production code change from these cases. No spare-PC use or upload.


## October19 — approved one-place reader toolbar, first increment

View, Comment, Edit, Fill & Sign, Pages, Protect, Measure, Export now appear in that fixed order above an open
PDF. Existing tools are buttons; view/selection settings sit alongside the page. The visible Tools & view menu
and PDF tools shell menu are gone in the main reader. Original shell button callbacks/large-file restrictions
are retained by moving the actual controls; duplicate Edit content is reduced to one. Private preview readers
temporarily retain compact menus. Find a tool filters the available controls; shared search/name integration
is requested from Claude in READER-ONE-PLACE-INTEGRATION-2026-10-19.md.

check-reader-one-place.mjs passes all8groups, source unchanged, actual markup save and independent disk annotation
readback at1366x820/800x620 and100/150% text. Search clear/Escape and arrow-key tab focus pass. Initial screenshot
review caught the short-window large-text controls pushing the page away; corrected with bounded scrolling tools
and a minimum page-height assertion. All14final PNGs personally viewed, report/output PDFs/hashes archived in
docs/evidence/codex/one-place-toolbar. Shared toast still covers tabs briefly: request for Claude remains.

This is the toolbar increment, not a claim that all underlying dialogs are already in-place. Comment, Pages
thumbnails/preservation, live previews and old test/robot navigation migration follow. No spare-PC use or upload.
Requests for Claude: fetch run3 failing robot seeds; supply shared names/search and onProtect entry point; migrate
check-integrated-ui's old Drawing review menu click. Existing source callbacks for your tools remain callable.


## October19 — Comment on the open page and direct text entry

Selecting Comment opens editing on the existing reader page with options beside it, rather than a modal and
second source viewer. Highlight, Underline, Note, Text box, Draw, Line, Arrow, Cloud, Callout, Move and ink-erasing
are direct buttons; the old internal tool selector is hidden. Ink/highlighter settings are contextual; saved
styles and long drawing/recovery details are folded. Stamp still opens the existing decoration workflow (step4).
Source-comment review still uses its existing separate panel; moving that panel fully beside the page remains.

Click Text box, click on the PDF and type directly. Default black is validated by both model and recovery and
persists as PDF FreeText. Escape finishes editing. Save comments and Ctrl+S use the existing independent build/
verification/publication pipeline; common header Save also includes edited comments. Ordinary save does not leave
a second preview pane. Explicit flatten still requires the separate preview/save review. Managed existing
markups use their stripped baseline while editing, restoring the original reader document on exit to avoid
drawing the old appearance beneath edited text. Source bytes never overwritten. Edit also has Add text shortcut.

check-reader-comment-in-place.mjs passes4window/text configurations: live typing, focus, no fit-width sideways
scroll, canceled save, black saved annotation, original unchanged, clean overlay removal. It additionally reopens
the saved text, edits it in place and saves through the header: exactly1updated FreeText survives; the prior saved
file remains unchanged. All5final screenshots personally viewed; generated outputs/report/hashes preserved in
docs/evidence/codex/comment-in-place. The first check found an unsupported viewport-rectangle method; fixed with
the existing supported point conversion. A subsequent by-eye stale fit-width issue was fixed by awaiting the
reader render before enabling Comment tools. No page errors in final checks. Full units416pass/1skip (417total),
including the independent black-text/recovery round trip and Claude's shared registry test.

Reader now consumes Claude's TOOL_GROUPS/TOOLS/toolByName registry and hasToolStrip integration contract. Existing
onProtect/onFindTool/onSecurityReport/onCertificates/onOcr/onEditCopy callbacks are accepted; main Edit duplicate
is removed. Find a tool filters canonical names/aliases and Enter invokes shared search. Please forward the query
in onFindTool and commit the shared registry before upload. Tests/robot navigation migration remains in progress;
no full app/cloud/package pass claimed. Requests/evidence from spare-PC run3 fetched by Claude, source untouched.


## October19 matching UI/robot checkpoint (A: urgent integration)

Reader/Comment/Pages robot navigation now uses the eight tabs and direct Comment buttons; Pages tasks use the inline Organize PDF pages region. Extract opens Page options first. Page saves wait for completed disk verification, not just file existence. Review/rich/mixed-text tasks use Comment. Export's editable-text-copy callback is explicitly placed under Export to match the existing shell robot/password check; the shared registry currently calls its group Edit, so Claude should move that registry entry to Export. Callback captions and all other grouping use the shared registry.

| Item | Evidence / honest status |
| --- | --- |
| Reader + markup + Pages rotate/delete/extract/combine robot tasks | Six pass in one hidden built-app session; each saved file independently checked. Receipt pdfix-codex-robot-5HkLlG. |
| Drawing robot | Menu migration matches; first run exposed a click before measurement readiness. Button now waits for rendered Page view and driver uses Fit page. Follow-up app proof pending the shared run lock. |
| Thumbnail drag / preserving default reorder | Four size/text configurations pass, including canceled save; original page object references, comment/link objects, outline target and metadata independently retained. Eight screenshots personally viewed. Generated evidence in docs/evidence/codex/one-place-pages. Badge placement/lazy-image screenshot timing subsequently improved; final new capture pending. |
| Automatic Compress / numbering / Print | All three update automatically at four configurations; compressed/numbered saved PDFs independently reopened; canceled print uses a recording stub, no physical printing. Twelve screenshots viewed in docs/evidence/codex/live-previews. By-eye follow-up: Print preview is below settings, and Compress preview is tiny at800x620/150%; these are not visual acceptance passes. |
| Existing source comments / FreeText / XFDF / recovery | Four affected built-app regressions pass. Closing inline Comment now clears its temporary input lock; the old lock made later tools unclickable. |
| Advanced five-mark proof preview | One existing regression still fails from a measured201/215px height oscillation (horizontal scrollbar track). A bounded preview track fix is implemented; rerun pending the shared run lock. Do not report a full desktop-suite pass. |

Next: finish matching Drawing/robot confirmation, final thumbnail captures, advanced-preview repeat; then improve Print/Compress small-window layout, flatten private preview menus, and add the requested robot coverage. A-R2 remains failed/open. No new90-minute soak, spare-PC access, cloud upload, real printing or release package performed. Claude's clean-copy build and two consecutive cloud runs remain separate gates. Broader V1 save/hostile-file audit stays open; earlier generated fault evidence remains valid for its stated routes.

Requests for Claude: copy the complete matching actions-codex*.mjs set with this UI checkpoint, not an older isolated helper; migrate robot.mjs/document-print.spec.js/images.spec.js from Prepare preview to Refresh preview (previews now start automatically). Please move edit-copy in the shared registry to Export. Existing Home/All tools routes must open the current reader before calling tools if they should use the in-place mode. Source shell/shared desktop code was left alone.

### Claude lane: October 19 evidence audit (area 4, failure recovery)

| Check | Evidence | Result |
| --- | --- | --- |
| New copies: disk full, locked or vanished target, two saves at once, crash while staging | Codex's `tests/pdf-save-faults.test.cjs`, `tests/pdf-save-windows-locks.test.cjs` (shared `desktop/verified-output.cjs`, used by every Claude-lane copy too) | Proven |
| Save over the opened file (editor Save / Ctrl+S): file open in Word (read sharing), fully locked file, disk full while writing, folder removed, two saves at once | `tests/save-in-place-faults.test.cjs` (real Windows locks from another process) | Proven after a fix: a fully locked file was reported as "no longer where it was opened"; now "open or locked in another program" |
| Recovery drafts written atomically; a failed write keeps the previous draft | `tests/recovery.test.cjs` (existing) | Proven |
| PDFix ended suddenly (taskkill /T /F) while saving a Word copy, and while saving over the opened file | `tests/desktop/process-kill-recovery.spec.js` | Proven after a fix: no partial file is ever left; the opened file is the old or new version; **the typed work was safe on disk but Home no longer offered it** (the unsaved-documents list lived only in browser storage). The main process now keeps that list on disk (`tests/new-document-index.test.cjs`) |
| PDFix ended suddenly: spreadsheet typing, Fill and sign save, editor PDF export, Edit PDF text additions, Redact boxes | `tests/desktop/process-kill-recovery.spec.js` (7 cases, repeated) | Proven: no partial file; originals untouched; edits, placements, additions and boxes come back after restart |
| PDFix ended suddenly after changing slide text (October 20) | `tests/desktop/process-kill-recovery.spec.js` (8 cases) | Proven: the slide file is untouched and the change comes back |
| PDFix ended suddenly while preparing a signing request (October 20) | `tests/desktop/process-kill-recovery.spec.js` (10 cases), `tests/signature-request-recovery.test.cjs` | Proven after a fix: the tool kept no recovery at all; details and locations now come back after a crash and are cleared once the prepared copy is saved |
| Still to do in area 4 | A kill during Codex-lane saves (Codex) | Not yet checked |

### Claude lane: October 19 evidence audit (area 3, data integrity)

New shared tool: `tests/helpers/pdf-structure.cjs` and `node scripts/pdf-structure-diff.mjs before.pdf after.pdf`
list pages, comments, form fields and calculations, bookmarks, attachments, signatures, tags, document details and
scripts, and report every difference (`tests/pdf-structure.test.cjs` proves it catches a lost calculation, bookmark
and attachment). Source used: `tests/helpers/rich-pdf.cjs` (calculated form, comment, bookmark, attachment, tags).

| Save route | Evidence | Result |
| --- | --- | --- |
| Fill and sign (field value) | `tests/save-structure-claude-lane.test.cjs` | Proven: only the changed value differs |
| Create fillable fields | same | Proven: only the new field and its widget are added; existing annotations unchanged and in order |
| Protect then unlock | same | Proven after a fix: PDFs with an attached file were refused (the safety check compared how a name was spelled); now protected and unlocked with every object kept |
| Signing request (October 20) | same | Proven: only the signing location is added |
| Edit PDF text (October 20) | same, through the real writer `src/pdf-content-output.js` | Proven: added text is written; fields, calculations, comments, bookmarks, attachments and tags are unchanged |
| Redact (October 20) | same, through the real writer `src/redaction-output.js` | Proven as designed: same pages and sizes; every hidden part (fields, comments, bookmarks, attachments, tags, document details) is removed on purpose |
| Fill and sign with a typed signature placed (October 20) | same | Proven: the signature is page drawing only; nothing else changes |
| Not needed | Image to PDF and editor PDF export make new PDFs, so there is nothing earlier to keep | - |


### Codex October19 evening — UI route integration and repeated preservation evidence

See [reader UI/robot checkpoint](READER-UI-ROBOT-CHECKPOINT-2026-10-19.md) and evidence/codex/reader-ui-robot-followup. Area1: matching seven core actions plus two opt-in toolbar/drag actions and numbering/stamp action independently inspect their saved files. Area3: built-app default thumbnail permutation now proves form value/calculation action/order, attached stream, tag catalog objects, note/link objects and outline target retained; original unchanged. Area4: focused stage/cancel/corruption/competing-save/Windows-lock tests pass again. Areas9/11: four-size/text preview and thumbnail matrices pass, personally inspected screenshots; private options flattened and nested-reader Print tested. Area12: helper reopen race fixed and process ownership rejects children older than a recycled parent PID; one earlier forced-exit receipt remains failed, final matrix clean.54focused units pass.

No new outside-software, certificate-signature/standards, hostile corpus, spare-PC or cloud acceptance. Area6/A-R2 remains failed after the earlier full soak. No score assigned. Shared structure-diff helper recursion needs bounded traversal before hostile-input use; requested from Claude, left unchanged. Broader route variations and robot tools remain explicit in the checkpoint.


### October19 memory continuation

UI/robot follow-up committed as83b8c6b. A-R2 analysis of the existing94-minute receipt separates a steady main process (78.00→77.39MiB) from sustained renderer growth (98.89→202.64MiB;1.251MiB/min after warmup) and bursty graphics allocation. New opt-in native sampling smoke completes2cycles/190seconds with saved-output/source checks, no page/process errors, clean exit and no forced/surviving children. Connected canvases/fonts return to0; sampled estimates and address-only stacks do not identify a component. This is not a plateau pass. No production workaround, forced collection, threshold change or GPU/security change. Details: [READER-MEMORY-INVESTIGATION-2026-10-19.md](READER-MEMORY-INVESTIGATION-2026-10-19.md); raw generated receipt and prior-process analysis preserved in docs/evidence/codex. Five focused memory-report/profiler units pass. Run lock released; no spare-PC access.

### Claude lane: October 19 evidence audit (area 5, hostile files)

| Opener | Evidence | Result |
| --- | --- | --- |
| Excel and PowerPoint packages (`desktop/office-archive.cjs`, workbook and slide readers) | `tests/office-hostile-files.test.cjs`: not-a-ZIP, truncated, empty, 60 MB; zip bomb lying about its size; 40 MB expansion; 2,100 parts; `..`, absolute, backslash, drive paths; macros and embedded programs; duplicate parts; billion-laughs entities; UTF-16; 200,000-deep nesting; cells past Excel limits; 600,000 cells | Proven: each refused or bounded within seconds |
| Saved emails (`desktop/email-message-codec.cjs`) | `tests/email-hostile-files.test.cjs` plus existing `tests/email-conversion-core.test.cjs` (active HTML, remote URLs, malformed transfer data): 500 nested multiparts, 20,000 parts, 9 MB header line, 7 MB base64 attachment, 11 MB message | Proven |
| Shared PDF structure inventory (test helper) | `tests/pdf-structure.test.cjs`: looping bookmarks, field kids and tag trees | Proven bounded (Codex review point) |
| Word and RTF (`desktop/rich-document-codec.cjs`, run inside the contained engine with no network) | `tests/word-hostile-files.test.cjs`: Word zip bomb, DOCTYPE entities, an external picture link to a file on this computer (never read); RTF 100,000 nested groups, a binary block claiming 2 GB, 101 MB, not RTF; plain files still import | Proven |
| Markdown pictures (`desktop/markdown-image-reader.cjs`, moved out of main.cjs on October 20) | `tests/markdown-hostile-files.test.cjs`: `..` and encoded escapes, drive and network paths, web and file addresses, a junction leading out of the folder, a fake PNG, an SVG, a folder, a 5 MB+ file; app check `tests/desktop/markdown-pictures.spec.js` | Proven after a hardening: drive/network paths hidden by encoding refused, and the read itself is capped at 5 MB |
| TIFF (`desktop/tiff-codec.cjs`) | `tests/tiff-hostile-files.test.cjs`: wrong header, truncated, directories outside the file, 100,000 px pages, strips outside the file, 4 GB byte counts, an 80 MB deflate bomb in a 3 x 2 page, 102 pages, 65,535 entries | Proven: each refused in milliseconds for the right reason |
| PNG and JPEG headers (`desktop/document-image-validation.cjs`) | `tests/picture-hostile-files.test.cjs`: lying sizes, data after the end, animated PNG, missing data, chunks past the end, 200,001 chunks, 12-bit and lossless JPEG, segments past the end, marker floods, 41 MB | Proven |
| Broken picture data behind a valid header (decoded in the editor) | `tests/desktop/document-pictures.spec.js`: PNG with undecodable data, JPEG with a garbage scan, GIF with broken image data, a cut-short BMP | Proven: each refused with "The source image could not be decoded", nothing placed; a good picture and typing still work |

### Claude lane: October 20 evidence (area 5, no unwanted uploads: works with the internet off)

| Check | Evidence | Result |
| --- | --- | --- |
| The app never tries to reach another computer, and every robot task works offline | `ROBOT_OFFLINE=1` robot mode (names cannot be looked up, no proxy answers, every attempt from a window or the main process is recorded); `ROBOT_OFFLINE_SELFTEST=1` proves the record catches attempts | Proven: 3 runs, 72/72 steps ok, 0 attempts. Pages also block outside requests (`connect-src 'self'`) before the app's request filter |
# Codex area6 continuation — October19 late evening

The current immutable built-runtime source841e0f003f9ccea37fb7d77774702f64eede7e46d1a81c13edd9c1a704d51aab passes the uninstrumented normal-graphics memory gate:19cycles/91.99minutes, local generated100-page scroll/search/zoom/close plus independently checked markup save/reopen each cycle. Original unchanged; windows hidden; no page/process failures or forced/surviving children. Earlier/later settled medians746.57/730.78MiB, slope0.604MiB/min, peak781.96MiB, original limits unchanged. Receipt and runtime identity in docs/evidence/codex/reader-memory-2026-10-19. This is local generated-workflow evidence, not real-corpus/weaker-PC/driver acceptance or proof of a universal leak fix; older failed receipts remain valid. No score assigned.
## Codex area3 continuation — signed-source refusal breadth

`tests/pdf-audit-save-routes.test.cjs`:23cases pass; four generated signature/certification markers across12routes now yield48refusal/source-unchanged assertions. Tags, repair, cleanup and portfolio creation are newly included. Existing saved-output structure/readback cases continue to pass. This is fail-closed refusal evidence, not certificate validity, provider signing or outside-viewer acceptance. No production policy changed and no readiness score assigned.


## Codex October20 — remaining tool integrity/crash findings

Cleanup trailing-object xref Size prevented a valid save; fixed fresh-writer high-water mark and tested actual strict qpdf checking with no recovery/warnings. Original objects are not renumbered. Repair preview missing UI helpers and geographic point/index crashes fixed with actual-method unit regressions and built-app independent output checks. Accessibility audit filter search now remains usable at the small size.28targeted unit cases pass; saved cleanup/healthy repair/map outputs and source hashes pass. Screenshots personally viewed. Evidence: docs/evidence/codex/reader-remaining-2026-10-20 and reader handoff. This does not prove damaged-file recovery, geographic accuracy, external viewers or broad hostile corpus. No readiness score assigned.


### Codex October20 continuation evidence (score unchanged)

Home-coverage evidence: four toolbar configurations,60keyboard states and18actions at both sizes with saved-output readback; units474pass/1skip. Generated outputs cover native tags/thin-lines/geographic/FDF/portfolio/attachments/cleanup/healthy-repair/page-Bates paths. Real certificates, sound, printing, outside viewers, damaged-file recovery and full hostile corpus remain unverified. Final large capture-by-capture review pending. These additions do not prove all audit areas or change Claude's readiness score.


### Codex October20 reader reflow/entry follow-up

Areas1/9/11/12: reproduced disappearing selected-area text (two failures); three built Electron rectangle tests and five actual-method units now verify stable text after350ms/resize and invalidation across page/doc/rotation/permission changes. No PDF bytes are written by this selection change. Guide saves annotations independently read by pdf-lib and recomputes a100mm takeoff;6/6default rehearsal,6/6final800/150rehearsal. Narrow markup now temporarily folds search/navigation, restores on close and leaves saved preferences intact; proof panes are isolated (two additional real-method units). Final full units484pass/1skip/0fail. All70toolbar/action/keyboard images plus six guide captures and selection screenshot personally reviewed. Known small-toolbar scrolling, dense technical prose and shell toast/tab issues remain listed, not passed off as perfect. No new claims for security, power-loss/full-disk, outside viewers, real certificates or printer acceptance; score unchanged. Evidence: selection-reflow and home-coverage directories.


Codex October20 follow-up: sheet-departure evidence proves clean original-sheet close, refusal of an unsaved title edit, actual named-library save/readback and subsequent clean app close. Both original hashes unchanged; two screenshots viewed. Three final rectangle regressions pass after rebuild. No new crash-durability/external acceptance claim or score change.

### Audit output: Codex October20 expansion
44route cases plus16failure/safety/Windows-lock cases =60/60pass. Nine markup kinds independently reopened in editable and flattened modes (notes stay editable); encoded original content, attachments, tags, field value/calculation, outline and unrelated annotations checked within each route policy. Added metadata cleanup, portfolio attachment and real sandbox repair, including wrong-fingerprint refusal and discarded-output invalidation. No production codec change needed. Physical full disk/power loss, every UI interruption route, real certificates and outside-viewer acceptance remain unverified.

Codex October20 connected recovery repeat:14/14current-menu steps pass. Actual main process killed after17flushed staging bytes before publication; exact unsaved note recovered after restart. Final PDF independently verifies reversed page order/rotations, retained notes and calibrated100mm measurement; sealed originals unchanged. Three screenshots personally reviewed. Partial staging artifact remains identifiable (not a published final PDF); no broad claim of startup debris cleanup or every save route. Evidence: docs/evidence/codex/engineering-recovery-2026-10-20/.

Codex October20 preserving Pages recovery:5step hidden built-app check passes after interrupting actual save at17flushed staging bytes and killing owned app main. Same-profile recovery restores order3,1,2; saved page identities, exact annotation/private field, internal link and bookmark objects/destinations and original bytes independently verified. Two screenshots viewed. No final partial PDF published; identifiable17byte staging artifact may remain after forced death. No power-loss or all-route guarantee. Evidence: docs/evidence/codex/pages-save-recovery-2026-10-20/.

Codex October20 batch coverage: four opt-in actions pass at both sizes (8 workflows), independently checking every saved copy/text/compressed PDF and per-page Bates identifiers with a skipped input; six negative-verifier units pass. All20 screenshots reviewed. Confirmed open UI defects: narrow batch preview dialogs, duplicated Bates ordinals, singular page grammar and technical compression copy (SHARED-PLAN2.13). Captured runtime0d84bac2 only; pending Claude multi-file context wiring, no cloud/spare/external acceptance or readiness-score change. Evidence: docs/evidence/codex/batch-robot-2026-10-20/.

Codex October20 batch UI follow-up: SHARED-PLAN2.13 fixed locally (scoped wider dialogs, one Bates ordinal, singular page and plain compression message). Eight workflows/6verifier units pass;20screenshots reviewed. Tall-preview scrolling and shared toast overlap remain; small compression screenshots do not certify whole-artwork visibility. Source bae17c82 captured build, no new release/cloud/external or readiness-score claim. Evidence: docs/evidence/codex/batch-ui-2026-10-20/.

October21 Codex2.11 partial: five-pixel horizontal overflow reproduced in sheet-set preview options at800/150 and fixed by wrapping label/choice. Sheet sets and numbering now pass10clipping-aware screenshot states across both sizes (all viewed) and4matching saved-output actions. Numbering captures wait for actual preview completion. Prior apparent overlaps included off-scroll controls; no visible overlap reproduced in these two tools. Review comments/inline Organize, heavy vertical scrolling, cloud/spare/external acceptance remain open; score unchanged. Evidence: docs/evidence/codex/proof-menu-2026-10-21/.

Codex October21 Build/View: six mode/navigation app cases + exact unsaved-note saved-output robot at both sizes pass; native page/scale/selection and rotated draft saved geometry checked, six screenshots viewed. Presentation mode does not publish or clear drafts. Shared sandbox unit failure retained despite isolated retry pass; Word/editor integration/full desktop repeat/physical acceptance remain open, score unchanged. Evidence build-view-2026-10-21/.

### Audit output: Codex October21 inline table UI

CSV/XLSX route after UI-only migration: tests/desktop/reader-inline-table.spec.js invokes the actual exported table robot at three layouts, every12cells match saved CSV and parsed XLSX package, no formulas; PDF source hash unchanged. Canceled CSV saves no copy and retains checked table; View/Build retains it. Existing rectangle/grid drag test passes. Five ownership/column units;12screenshots viewed; standalone robot clean close. Evidence inline-table-2026-10-21/. Writers/model unchanged; not a new all-route crash/full-disk/OCR/signature certificate. No readiness score change.

### Audit output: Codex October22 inline Redact

UI-only migration retains redaction-output verifier/save model. 19units/11built-app cases: actual robot saves and reads exact canonical clean structure/black mask, original unchanged; early header save refused; canceled save retains proof; clean search/print preparation isolated from original. Synthetic certification marker refused safely; no real certificate validation claim. Ten screenshots viewed at both sizes/150%; scrolling/toast limitations open. Evidence inline-redact-2026-10-22/. App All-tools callback/legacy robot integration and full-suite repeat pending. No new all-route crash/full-disk/power-loss/cloud or outside-viewer acceptance; readiness score unchanged.

October22 Codex2.11: Review comments filter drawer was never enabled because panel mounts before toolstrip flag. Root-reader condition now matches toolbar installation; drawer/labels/buttons wrap, sticky header no longer overlays content.57screen states/3configs pass,21final screenshots+2robot captures viewed; exact saved reply/reopen passes. Organize checker waits actual controls and opens options. Heavy150%scroll/toast remains2.12. Evidence comment-pages-layout-2026-10-22/.

October22 full local repeat:159cases152pass/6Claude failures/1hidden-fullscreen skip; all Codex suite cases pass, search-all45.958s and cleanup/fresh launch pass. Evidence full-inline-desktop-2026-10-22/. NEW OPEN A-R-IMAGE1:20million-pixel scan image silently omitted (white canvas, ready/Opened/no error);1million-pixel control black. Same output canvas bounds. Synthetic app and parser/pixel receipts reproduced; owner private drawing not examined/copied, same cause not confirmed. No memory/security limit raised. Existing suite misses this defect; large-scan compatibility is NOT proven.

### Codex supplemental evidence - October22: scan input/render failure

A-R-IMAGE1 input cap100million; canvas16million unchanged. scan-cap-2026-10-22 evidence: generated19.8M/80M artwork pixel checks;110M on-page refusal in single/continuous/facing; injected canvas allocation refusal/retry; unchanged2page saved copy independently parsed and identical SHA256/bytes.3layout actual robot replays,18screens personally inspected. Real owner drawing/local and generated spare-PC checks pending Claude. No renderer process fatal-OOM or long-session memory acceptance claimed. New Windows renderer deferred after beta. Build guard prevents PDF.js failed-image/stream operations from reporting blank success, retained on repeated view rendering. Private source never inspected/copied/uploaded.
