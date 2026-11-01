# PDFix workflow test matrix (release readiness audit, October 25, 2026)

Audit only. Each row is a whole task a real person does, with what must be true afterwards and what has actually been
tested. "Tested" means an automated check **read the saved file** (not just the success message), unless it says otherwise.

Coverage words:
- **Tested** — passed on a development build on or after October 22
- **Tested (old)** — last passed October 17–21, before the new toolbar/modes; re-run needed
- **Partly** — some steps or some outcomes checked
- **Not tested**
- **Human** — needs a person (real device, other program, judgment)

Evidence:
- robot task names from `scripts/user-robot/` (results in `tmp/user-robot/run-*.json`)
- specs from `tests/desktop/`

## A. Everyday single workflows

> **Update, October 25 evening:** all 31 robot tasks that last ran before October 22 were rerun on commit 2487a21
> and **all 31 pass**. 21 ran alone; 10 needed a setup step first (an open document or a saved Word copy). Results are
> in `tmp/robot-try-each.json`, `tmp/robot-try-with-setup.json` and `tmp/robot-forced.json`. So every row marked "Verified before
> UI change" or "Tested (old)" below now also passed on the new UI. Rows that are still Unverified are unchanged.

| # | Workflow | Expected outcome | Coverage | Evidence / gap |
|---|---|---|---|---|
| A1 | Open a PDF → read → find a word → jump | Correct page and highlight; original file unchanged | Tested | robot "reader: search, jump, zoom and bookmark" |
| A2 | Open → print | The Windows print dialog gets the right pages and size; printed scale 100% | Partly / **Human** | Print preparation tested; **no physical print ever** |
| A3 | Open → highlight + note → save → reopen | Comments are still there and editable; other content unchanged | Tested | robot "reader: grouped Comment toolbar saves a persistent note and line" |
| A4 | Same file opened in Acrobat Reader / Foxit | Comments visible, no repair prompt | **Not tested** (only Edge's Adobe engine) | B2; needs the owner to install or approve the readers |
| A5 | Fill a form → sign (typed) → save → reopen | Field values and signature picture kept; no other change | Tested | robot "sign a PDF with a typed name", spec forms |
| A6 | Sign with a certificate → open in Acrobat | Acrobat shows a valid signature | **Not tested** | Certificate signing has no runtime acceptance |
| A7 | Combine PDFs → reorder → save | All pages in the chosen order; bookmarks and links kept | Tested (old) | robot "pages: combine and save", "drag a thumbnail and retain comments, links and bookmarks" (10-20) |
| A8 | Extract / split pages | New file has exactly the chosen pages | Tested (old) / Tested | robot "pages: extract and save" (10-20); spec splitting |
| A9 | Delete / rotate pages → save | Pages gone or turned; deleted content not in the file | Tested | robot delete (10-24), grouped rotate (10-24, 1/2) |
| A10 | Compress for email | Smaller file, every page still looks the same | **Broken (tests)** | A2: robot 0/2, Codex working |
| A11 | Redact a word everywhere → save → verify | Word gone from text, pixels and file bytes | Tested | robot "hide a word with Redact", redaction-byte check |
| A12 | Scan (paper) → PDF | Pages from the scanner, readable | **Not tested / Human** | no scanner ever connected |
| A13 | Scanned PDF → make searchable → search → copy text | Text found and copied correctly | Tested (English) | robot "make a scanned PDF searchable"; other 5 languages not tested |
| A14 | Word → PDF | PDF looks like the document | Tested | robot "export PDF copy" |
| A15 | PDF → editable Word copy → open in Word | Opens in Word, text and layout reasonable | Partly | robot "turn the PDF into an editable copy" (10-20); **never opened in real Word** |
| A16 | Protect with a password → reopen | Password asked; limits applied | Tested | robot "protect a PDF with a password" |
| A17 | Remove a password (with the password) | Unprotected copy, content identical | Tested | robot "remove the password…" (10-22) |
| A18 | Fix a typo in PDF text | Only that text changes; font looks right | Tested | robot "change and add text in a PDF" |
| A19 | Drawing: calibrate → measure → export list | Measurements correct at the calibrated scale | Tested (old) | robot "drawing: calibrate, measure and save ledger" (10-20) |
| A20 | Compare two drawing revisions | Differences shown; sources unchanged | Tested (old) | robot 4/5 (10-20) |
| A21 | Page numbers / Bates on every page | Every page numbered, nothing else moved | Tested (old) / Partly | robot "number and stamp every page" (10-20); Bates batch had spare-PC failures (run 3) |
| A22 | Extract a table to Excel | Cells match the page | Tested | robot "extract a table…", "reader: extract a table on the main page" |
| A23 | Make a fillable form | Fields work in PDFix and other readers | Partly | PDFix tested; other readers not |
| A24 | Prepare for someone else to sign | Signature place marked; file otherwise unchanged | Tested | robot "signing request" |
| A25 | Pictures → one PDF | One page per picture, right orientation | Tested | robot "make a PDF from a picture" (one picture; several pictures not robot-tested) |
| A26 | Write a document with a table and picture → PDF | Matches the editor | Tested | robot "insert a table", "insert a picture…" |
| A27 | Email (.eml/.msg) or clipboard → document | Text and pictures arrive | Tested | robot clipboard (10-24), email (10-20) |
| A28 | Edit a spreadsheet cell / slide text | Only that cell/text changes; opens in Excel/PowerPoint | Partly | robot passes; **never opened in Excel/PowerPoint** |
| A29 | Read aloud | Speech plays the right text | **Not tested / Human** | text prepared, never spoken |
| A30 | Open PDFix from a PDF in Explorer (Open with / default app) | PDFix opens that file | **Not tested** | the install never registers Open with in tests (project rule) |

## B. Combinations (tools in a row on one file)

| # | Chain | Expected | Coverage |
|---|---|---|---|
| B1 | Markup → redact → save | Redaction also removes comments on the redacted area; other comments kept | **Not tested** as a chain |
| B2 | Fill form → protect → reopen with password | Values kept, password required | **Not tested** as a chain |
| B3 | OCR → redact a found word | The word is gone from the OCR text layer too | **Not tested** |
| B4 | Combine → page numbers → compress | Numbers on all pages; still smaller | **Not tested** (compress broken in tests) |
| B5 | Edit text → sign → save → edit again | Second edit refused or warns if a certificate signature exists | Partly (refusal tested with synthetic signatures) |
| B6 | Rotate → markup → save → reopen | Comments at the right place on the turned page | Partly (spec reader-destination-geometry; markup scale fix A-D9) |
| B7 | Word document → PDF → Fill and sign | Works like any PDF | **Not tested** as a chain |
| B8 | Ten or more steps across tools with a restart in the middle | Everything kept | **Not tested** (test 14) |

## C. Interruptions and recovery

| # | Case | Expected | Coverage |
|---|---|---|---|
| C1 | PDFix killed while signing → reopen | Draft back; finish and save | Tested (robot crash job, 10-24) |
| C2 | Killed while writing a report / editing a spreadsheet | Draft back | Tested (10-24 / 10-20) |
| C3 | Killed mid-save | The original is intact; no half-written file | Tested (spec process-kill-recovery; unit save faults) |
| C4 | Killed during the new on-page Compress / Redact / table save | Same as C3 | **Not tested** (test 5) |
| C5 | Killed during a sandbox job → restart | Temporary copies removed | Tested (fixed 10-25, unit + real app run) |
| C6 | Disk full, file locked by another program, folder removed while saving | Clear message; original intact | Tested (unit save-fault suites) |
| C7 | Source file changed by another program while open | PDFix notices; no silent overwrite | Tested (unit: source fingerprints; robot "save over") |
| C8 | Windows sleep / log off during a job | Recovers | **Not tested** |
| C9 | Power cut (true sudden loss, not a process kill) | Original intact | **Not tested** (process kill is the closest proof) |
| C10 | Close PDFix with unsaved work | Asks first | Tested (specs, check-tools-quit) |

## D. Unusual files and situations

| # | Case | Expected | Coverage |
|---|---|---|---|
| D1 | 18 hostile/damaged PDFs (loops, bombs, JavaScript, attached .exe) | Refuse or open safely; nothing runs; no network | Tested (10-25) |
| D2 | Real 163-sheet Bluebeam drawing set | Opens, comments kept | Tested (older, Codex) |
| D3 | The dad's real drawing | All 3 pages render | Tested locally (10-25; private file, never committed) |
| D4 | PDF signed by Acrobat (real signature) | Modifying tools refuse | **Not tested** (test 11) |
| D5 | PDF made by Word, Chrome "Print to PDF", a phone scanner app | Opens and saves normally | Partly (fixtures are mostly generated) |
| D6 | Very long file names, non-English names, network/OneDrive folders | Opens and saves | Partly (short-name and sync tests; network share not tested) |
| D7 | PDFix itself run from a cloud-synced folder | Watched folders refuse with a message | Tested (known limit A21) |
| D8 | PDFix run from inside a temporary folder (e.g. opening the zip without extracting) | Should work or say "extract first" | **Fails**: spare-PC note says Word/PDF copies cannot be saved ("Document sandbox cleanup failed") |
| D9 | 150% text size, 800 × 620 window | Everything reachable | Partly (screenshot checks; new UI still changing) |
| D10 | Keyboard only | Every tool usable | Partly (keyboard walk checks; new toolbar has keyboard menus tested in 3 tabs) |
| D11 | Screen reader (Narrator / NVDA) | Controls announced | **Not tested** (test 13) |
| D12 | Upgrade: install a newer build over an older one | Settings, drafts and documents kept; one shortcut | **Not tested** (test 7) |
| D13 | Clean PC, downloaded GitHub zip, SmartScreen | Installs and runs | **Not tested** with a downloaded zip (spare-PC install used copied folders) |

## E. What a person must test (cannot be automated here)

1. Physical printing at 100% (ruler check, `docs/PRINTER-ACCEPTANCE-2026-10-15.md`).
2. A real scanner.
3. Read aloud with speakers.
4. Opening outputs in Acrobat Reader, Foxit, Word, Excel and PowerPoint.
5. First-time use by the dad and friends: can they find Save, Sign, Print without help?
6. Screen reader.
7. Downloading the GitHub zip on a clean PC and getting past SmartScreen.

## F. Totals

From the 30 everyday workflows in section A:
- 20 Tested (the 5 "Tested (old)" rows were re-verified on 10-25)
- 0 Tested (old)
- 4 Partly
- 1 Broken in tests
- 5 Not tested or human-only

Some rows mix two words; the counts use the first one. From the 8 chains in section B, none is tested end to end as a chain.


## G. The 12 priority workflows (owner, October 26), compared with Acrobat, Foxit, Nitro and Smallpdf

"Whole task tested" means one automated run did every step and checked the final saved file. The other columns are
the gaps to close.

| # | Workflow | Whole task tested? | Steps covered separately | Gap | Rank | Owner |
|---|---|---|---|---|---|---|
| 1 | Open → edit → save → close → reopen | Yes (robot "change and add text", reopen checks) | — | Packaged build; outside readers | P0 (package) | Claude |
| 2 | Fill a form → sign → save → share | Fill+sign+save yes | Share: no target | Share (P2); outside readers (P0) | P0/P2 | Claude |
| 3 | Combine → rearrange → save | Yes (combine; drag thumbnails keep comments, links and bookmarks) | — | Combine with forms/attachments in the inputs | P1 | Claude |
| 4 | Extract, split, rotate, crop, delete | Yes, each | — | As one chain | P1 | Claude |
| 5 | PDF → Word and back, keeping formatting | Partly (editable copy; Word → PDF) | Fidelity measured only inside PDFix | Open in real Word; round-trip comparison | P1 | Owner (Word) + Claude |
| 6 | Compress keeping acceptable quality | Yes (10-26) | Quality judged by a pixel check | Real large scans and drawings | P1 | Claude |
| 7 | Highlight → comment → reply → save | Yes (markup, review reply, reopen) | — | Reopen in Acrobat or Foxit | P0 (S1) | Claude |
| 8 | Scan → OCR → search → edit | OCR → search yes | No real scanner; edit after OCR not chained | Real scanner; non-English | P2 | Human / Claude |
| 9 | Create fillable form → complete → save | Create yes; fill yes | Not chained | Chain, plus filling in Acrobat | P1 | Claude |
| 10 | Redact → verify removal | Yes (text, pixels and file bytes checked) | — | Redact after OCR and markup (chain) | P1 | Claude |
| 11 | Print and export with accurate layout | Export yes; print preparation yes | Never printed | Physical print at 100% | P1 | Owner |
| 12 | Batch across several documents | Batch compress yes (10-26); batch actions (10-20) | Bates numbering flaky on the spare PC (run 3) | Rerun Bates on the new UI | P1 | Claude |

**Acceptance for every row:** the whole task runs as one robot job and `verify.mjs` confirms the final file (content
kept, changes present, original unchanged). For P0 rows, the same file is also checked in Acrobat Reader and Foxit.

## H. Realistic combinations by user group (robot jobs to add after the beta, AI-human goals in AI-HUMAN-TESTING-PLAN.md)

| Group | Combination | Must be true |
|---|---|---|
| Student | Open lecture PDF → highlight → note → export pages 3–5 → print | Notes and highlights in the extract; print preview right |
| Teacher | Word worksheet → PDF → add fillable fields → save → fill as a student | Fields work after reopening |
| Office worker | Fill form → sign → compress → continue with saved copy → protect with password | Signature and fields survive compress and protection |
| Administrator | Batch: compress 10 PDFs → Bates number → combine | Numbers continuous; sources unchanged |
| Researcher | Scan → OCR → search → extract a table → Excel | Table cells match the page |
| Engineer | Open drawing set → calibrate → measure → comment with reply → compare with revision → save | Measurements and comments survive; revision differences shown |
