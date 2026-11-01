# Copy-save review rollout — October27

Owner W1: no review checkbox for ordinary copy saves. Keep previews and native/output/disk verification, Saved and Continue with this copy. Redaction and hidden-data removal retain one confirmation. Password saves need the safe-password reminder. Actual authorization (certificate signing, calculation rules, importing/replacing content, batch destination/overwrite consent) must be assessed separately; this is not permission to weaken security.

## Current batch

- Fill and sign: extra copy-review checkbox removed; native verified token, source match, preview page count and disk-save checks retained. Built app/save/cancel checks pass; final header-Find replay recorded in batch evidence.
- Protect/unlock: extra copy-review tick removed, output readiness still required; protected-save receipt reminder added. Four-layout independent saved-password/cancel robot replays plus existing password specs pass. Owner-approved seven main-robot checkbox callers migrated in a2f9f29; focused replay9/9 passed.
- Single-file compression: quality tick removed in lossless and JPEG modes; checked-preview readiness, settings invalidation and native output verification preserved. Five app cases and three exact-output/cancel robot layouts pass.
- Other tools below are inventoried, not declared complete. Some are actual consent or non-save checks and should stay. No global W1-complete claim.

## Remaining literal review labels in source

| File | Literal label(s) | Status |
|---|---|---|
| compression-workspace.js | I checked the compressed PDF quality | Removed in this batch; checked preview still required |
| image-workspace.js | I checked the image and page layout | Removed; native checked-output readiness and saved-file validation retained |
| ocr-workspace.js | I reviewed the recognized text | Removed; native checked-output readiness and saved-file validation retained |
| pdf-content-workspace.js | I checked added text and images | Removed; native checked-output readiness and saved-file validation retained |
| redaction-workspace.js | I checked all redacted pages and marked regions | KEEP: owner-required privacy confirmation |
| split-workspace.js | I checked the split groups and preview | Removed; native checked-output readiness and saved-file validation retained |
| tiff-workspace.js | I checked this decoded TIFF page | Pending purpose review and caller migration |

This literal scan is only a starting point: programmatically generated labels and unnamed inputs also need review (for example Page numbers and stamps). Review each save route and matching test/robot before changing it.

## Wider source inventory (purpose still to inspect)

- `batch-bates-workspace.js`
- `batch-compression-workspace.js`
- `batch-document-actions-workspace.js`
- `cloud-file-workspace.js`
- `document-pdf-export.js`
- `document-workflow-workspace.js`
- `drawing-measurements.js`
- `email-clipboard-workspace.js`
- `form-builder-workspace.js`
- `form-calculation-panel.js`
- `form-data-export.js`
- `form-detection-panel.js`
- `form-mail-merge-workspace.js`
- `form-tab-order-panel.js`
- `image-file-export.js`
- `image-workspace.js`
- `ocr-workspace.js`
- `pdf-attachments.js`
- `pdf-bookmark-workspace.js`
- `pdf-certificate-signing-workspace.js`
- `pdf-combine-workspace.js`
- `pdf-comparison-matching.js`
- `pdf-content-workspace.js`
- `pdf-decoration-workspace.js`
- `pdf-fdf-workspace.js`
- `pdf-image-export.js`
- `pdf-link-review.js`
- `pdf-page-box-workspace.js`
- `pdf-page-order-workspace.js`
- `pdf-page-revision-workspace.js`
- `pdf-portfolio-workspace.js`
- `pdf-print-marks-workspace.js`
- `pdf-print-workspace.js`
- `pdf-reader-redaction-host.js`
- `pdf-repair-workspace.js`
- `pdf-review-edit-workspace.js`
- `pdf-review-panel.js`
- `pdf-sanitize-workspace.js`
- `pdf-table-extraction-workspace.js`
- `pdf-tags-workspace.js`
- `pdf-takeoff-workspace.js`
- `pdf-thin-line-workspace.js`
- `pdf-xfdf-export-workspace.js`
- `presentation-workspace.js`
- `redaction-workspace.js`
- `sheet-set-workspace.js`
- `signature-request-workspace.js`
- `smart-file-name-workspace.js`
- `split-workspace.js`
- `takeoff-ledger.js`
- `takeoff-recovery-review.js`
- `tiff-workspace.js`
- `virtual-printer-workspace.js`
- `watched-folder-workspace.js`
- `workbook-workspace.js`

The inventory includes non-save consent such as certificate identity approval, importing records, calculation rules and external links. Those must not be removed automatically. Redaction and hidden-data-removal confirmations stay. Current implementation batch changes only Fill/sign, Protect/unlock and single-file compression.

## Second UI batch, October27

Removed only redundant final-copy review gates in image-to-PDF, OCR, added PDF content, Word/source PDF export, splitting, page numbers/stamps, outline editing and unchanged-copy naming. Actual settings remain, including replacing an existing outline. Native engines, hashes, source seals, authorization and disk checks unchanged. Page numbers still require a successfully rendered prepared preview.

Document export and image-to-PDF now give the preview the main area and scroll settings beside it; image output defaults to one full preview with Show source preview available. Cancellation retains the checked preview and enables retry.

Main robot seven-step caller migration is separately committed a2f9f29; no scheduling/seeds/count/reporting changed. Redact and Remove hidden data confirmations untouched. Wider inventory remains open; this is not global W1 completion.

## October28 committed coverage and retained consent

Additional ordinary-copy UI routes are committed in f5d0bba and9debe7f: page boxes, thin lines, print marks, preserving combine/reorder, revision output, comment editing, document workflows, workbook/slides, image outputs, FDF/XFDF export, takeoff PDF, tags, repair, portfolio and signing-request PDF/email copies. Three batch contracts are separately owner-approved0a46837; exact prepared output hashes replace human-reviewed flags. Native security/source/disk checking remains. Evidence and precise counts are indexed in UI-CURRENT-START-HERE.

| Remaining acknowledgement | Purpose / reason it stays |
|---|---|
| Redact and Remove hidden data | Owner-required privacy confirmation |
| Certificate signing | Explicit use of a signing identity; not ordinary-copy review |
| FDF/XFDF imports and reference replacement | Approves foreign records, exact mappings/geometry and source claims before applying them |
| Attachment/portfolio-entry extraction | Explicitly releases untrusted embedded bytes; portfolio construction no longer has the redundant tick |
| Calibration, calculated results and takeoff quantity/recipe adoption | Approves entered measurement/calculation choices; takeoff-PDF final-copy tick removed |
| Initial tag classification | Approves meaning, exclusions and reading order; tag-output final-copy tick removed |
| Repair risk | Acknowledges missing content may remain missing; repair-output final-copy tick removed |
| Signing placement notes | Explains notes are not completed signatures/interactive fields; prepared-PDF/email final tick removed |
| TIFF decoded-page selection | Input artwork/orientation selection before importing pages, not a final PDF-copy save |
| Watched-folder recipe/destination and form-mail-merge mappings | Grants repeated operations or mapped values, not a final individual copy-review tick |
| External link and physical print confirmation | Opens another application or sends a physical job; neither is a copy save |

This table distinguishes consent from obsolete save gates; it does not certify every path in the whole app. Independent route review and final suite still apply. Do not manufacture reviewed:true or auto-check hidden human consent.
