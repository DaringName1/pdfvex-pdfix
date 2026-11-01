# PDFix free Acrobat additions — adopted October 11, 2026

All 20 user-supplied items below are adopted implementation targets. Preserve earlier R01–R46, F01–F46, master, Bluebeam and A01–A25 scope. R47 adopts this addition; R48 defines explicit folder grants. F47–F66 are stable IDs in the same order as the user's list. Overlap with existing work is an expansion, not another independent completed feature.

The user prioritizes **Workspaces, PDF viewing and PDF editing**. Finish the separate Drawing, Document and Pages rooms, clear navigation between them, PDF-only fullscreen, collapsed panels, large-file viewing/search and supported original-content editing. Keep creation/export easy to find. New tools belong inside their relevant room or contextual menu, without adding persistent banners or crowding the page.

PDFix stays free: no required paid API/subscription, payment links or paid unlocks. Prefer local, offline, redistributable free components with reviewed licenses. "$0" means no PDFix feature charge; it does not promise that Microsoft Office, a cloud provider, optional hardware or operating-system distribution/signing services are free. Office shortcuts can use software already installed by the user; maintain free local alternatives. Cloud folders use the user's existing synchronized folders, without purchasing or silently configuring a cloud service. Optional translation models require license, download-size and hardware disclosure.

## Adopted feature list

| User priority | ID | Feature | Required behavior | Existing overlap / destination |
| --- | --- | --- | --- | --- |
| 1 | F47 | Automatic form-field detection | Detect candidate blank text fields, checkboxes, dates and signature areas on digital and scanned forms. Show confidence, geometry and editable suggestions before creating fields. | R13 / F18; Forms room; scans depend on bounded OCR/layout analysis. |
| 2 | F48 | Smart form autofill | Store names, addresses and reusable values locally; explicitly choose a profile and review proposed values before applying. Edit/delete profiles and exclude passwords/private keys. | Forms room; protected local storage and user-selected matching. |
| 3 | F49 | Automatic form-field labeling | Suggest names, accessible labels, field type and tab order using nearby text; review ambiguous matches and permit correction. | R13 / F18 / F30; form builder and keyboard-order tools. |
| 4 | F50 | Windows right-click PDF tools | Optional context-menu actions to open, convert, compress or merge selected files. Route to the appropriate reviewed PDFix workspace, preserving selected-file permissions. | F32 / R28; Windows installation/removal and safe argument handling. |
| 5 | F51 | Microsoft Word, Excel and PowerPoint shortcuts | Free local export shortcuts and evaluated direct Office integration where compatible. Explicitly declare installed-Office requirements and supported output fidelity. | R16–R20 / F10 / F32; no bundled or required paid Office license. |
| 6 | F52 | Microsoft Edge browser extension | User-triggered handoff of a PDF or web page to PDFix, with exact URL/source and destination review. Use a bounded local native-messaging path; no automatic browsing/history collection. | F32 / A22; optional extension/native host installation and removal. |
| 7 | F53 | Cloud-folder compatibility | Work with Google Drive, OneDrive and Dropbox folders already synchronized on the PC. Handle placeholders, hydration, offline errors, locks, changed sources and provider hardlinks while keeping staging local. | R01/R03/R04/R05; all open/save workflows; no implicit cloud grants or sync guarantees. |
| 8 | F54 | Email-to-PDF conversion | Convert standard .eml messages to PDF, retaining supported headers/body and an explicit attachment inventory. Preserve supported attachments through reviewed output where feasible; declare omissions. | F10 / A17; bounded MIME decoding, inert HTML and no remote images/scripts. |
| 9 | F55 | PDF from clipboard | Create a PDF from explicitly pasted text, images or screenshots, with editable arrangement, page settings and reviewed output. | Document/Images rooms; inspect clipboard only after a user action and bound bytes/pixels. |
| 10 | F56 | Offline PDF translation | Translate permitted extracted/OCR text through optional local models. Show original/translation with physical-page references, language/model identity and uncertain layout/order. Save a separate copy. | Reading/Document rooms; free licensed local models, cancel/resource limits; no silent online fallback. |
| 11 | F57 | Automatic bookmark generation | Detect candidate headings and suggest bookmark hierarchy/destinations. Review and edit suggestions before writing a preserved copy. | F06 / M07.05; outline tools and OCR uncertainty. |
| 12 | F58 | Search across PDF folders | Search hundreds of PDFs in explicitly selected local folders without opening them individually. Show scope, recursive choice, progress, partial results and page/file references. | M07.02 / R48; bounded local index/search, changed-file handling, cancel and index removal. |
| 13 | F59 | Smart file naming | Suggest filenames from titles, dates or OCR metadata. Show the reason and editable proposal; sanitize Windows names and use exclusive save/keep-both rules. | R05 / M02.08; no automatic original renaming. |
| 14 | F60 | Watched-folder automation | Watch only explicitly granted folders and suggest or execute approved recipes when stable files arrive. Persist consent, pause/revoke controls, receipts and recovery. | F27/F28 / R48; avoid output loops, duplicate jobs and partially synchronized/locked sources. |
| 15 | F61 | CSV mail merge | Map local CSV headers to supported PDF form fields, review rows/results, then generate separate documents with safe names, bounded queues and per-row errors. | F18/F27/F28; standard bounded CSV, no spreadsheet macros or network submissions. |
| 16 | F62 | Signature request preparation | Prepare reviewed signing/date/initial locations and an email handoff artifact. The user sends the request; no hosted tracking or inferred cryptographic signing. | F39 / A04; distinguish preparation, visual signatures and certificate signatures. |
| 17 | F63 | PDF fingerprint verification | Compute SHA-256 of selected files, compare expected values/earlier receipts, and export verification records. Clearly distinguish file change from signer authenticity. | File-details hashes/source seals exist; add explicit compare/import/export verification workflow. |
| 18 | F64 | Print-production marks | Add reviewed crop, bleed and registration marks to supported layouts, with units, offset, bounds and ink/color choices. Preserve original artwork in a new copy. | F29/F40 / A05–A08; no claim that marks alone create bleed or establish PDF/X/color compliance. |
| 19 | F65 | Detailed PDF page-box editor | Inspect/edit MediaBox, CropBox, TrimBox, BleedBox and ArtBox, including explicit/inherited/default values, units, rotation and selected-page application. Compare/review before saving. | R33 / A05; existing crop/box inspection is partial; clipping is not redaction. |
| 20 | F66 | Thin-line inspection and repair | Identify very thin vector strokes with page/object locations and effective physical widths. Offer explicit selected fixes and before/after review, preserving unaffected artwork and original files. | F29 / A05–A07; account for transforms/UserUnit/zero-width strokes; disclose unsupported patterns/forms/appearance cases. |

## Permission and data rules

R48 extends the previous individually selected-file boundary only through an explicit selected-folder grant. Let users choose recursion, operation/indexing purpose, persistence and included file types. Show the expanded scope and permit revocation and index/history removal. Reparse points, symbolic links, junctions and cloud placeholders must never silently expand access outside the selected grant. Shell/Edge input is an open request, not unlimited file/network authority. Watched folders require a separately approved recipe and output destination; selecting a folder for search does not authorize edits or automation.

Retain immutable source snapshots, new-copy outputs, independent output inspection, exclusive saving, cancellation, source binding, recovery, native containment and inert document content. Do not relax hardlink/containment checks to accommodate synchronized folders; stage owned snapshots outside cloud-synced paths.

Local autofill and indexes can contain sensitive data. Provide clear deletion/export settings, local access controls and protected storage where applicable; avoid passwords, document contents and secrets in diagnostics. Clipboard/camera/browser/email operations are user initiated.

## Work order and honest status

1. Core Workspaces, viewer and original PDF editor gaps stay first; integrate relevant field/outline/page-box tools into those rooms.
2. Forms F47–F49/F61 and clipboard F55; then folder compatibility/search/naming F53/F58/F59.
3. Optional Windows/Office/Edge handoffs F50–F52 and watched recipes F60.
4. Email/signature preparation/fingerprint F54/F62/F63; local translation F56 after a free model is selected.
5. Print marks/page boxes/thin-line tools F64–F66 with geometry and preservation checks.

This adoption adds scope, not implementation. Existing overlaps remain partial and keep their historical evidence; no F47–F66 target is newly coded, tested or release-ready by this document. The complete original list is represented in order above. Track all 20 individually and reconcile overlapping R/M/B/F/A work rather than adding their counts. Acrobat feature parity remains a target, not an established current capability. Do not assume a vendor's current features, licensing or private interoperability from the supplied comparison; research official interfaces when implementation needs them.

