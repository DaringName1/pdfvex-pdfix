# PDF accessibility source audit progress

Implementation added 2026-10-09 toward A12 / F29 / F30. The audit is a source-specific structural review aid. It does not declare PDF/UA, WCAG or Section 508 compliance or blanket accessibility acceptance.

## Source and containment contract

- `PdfAccessibilityAuditService.inspect(sourceId, source, token)` validates the opened PDF fingerprint, accepts a UUID operation token, and invokes the fixed contained `accessibility-audit-inspect` operation. The service supports cancellation, discard and disposal through the existing contained-service lifecycle.
- The codec accepts at most 100 MiB and 500 physical pages. Traversal is bounded to 100,000 indirect objects, 300,000 graph steps, 80 graph levels, 10,000 page annotations and 15,000 findings. Existing tag inspection supplies its stricter structure and stream budgets (2,000 tags / 20,000 relationships / 48 tag levels).
- Every report binds source bytes and source SHA-256, rules version `2026.10.1`, and a report SHA-256. Findings identify physical page references, structure-node references where applicable, dictionary paths and object SHA-256 evidence. Direct dictionaries use the precise parent path instead of inventing an indirect reference.
- The main-process validator accepts only a fixed inert shape, bounded Unicode text, known categories/rule IDs, consistent counts/pages, exact required-human-check definitions, the expected source identity and a recomputed report seal. Renderer evidence is inserted as text, never executable HTML or an action from the PDF.
- The canonical report is capped at 295,000 JSON value nodes and 100 levels, reserving space below the contained broker's 300,000-node result-envelope budget. Report byte size is capped at 12 MiB. Sources exceeding the receipt budget fail with an explicit report-budget error.

## Implemented structural observations

- Information dictionary title; the explicit viewer display-title preference; catalog and structure-element language syntax. XMP metadata is explicitly outside the interpreted scope.
- Real structure tree, stored child sequence, RoleMap resolution and cycles, structure parent consistency and ParentTree/MCID/OBJR ownership via the existing source tag inventory. Unsupported existing tag structures remain unsupported in the audit.
- Numbered heading sequence and generic H headings; skipped levels require review because structural numbering alone does not establish document meaning.
- Figure alternative/replacement text presence, with semantic equivalence left to the reviewer.
- Table/header/data-cell ancestors, TH presence, header Scope, explicit byte-string Headers IDs, and IDTree identity/ordering/range checks. Explicit header references must identify a TH in the same Table. Class, multi-owner and revisioned table attributes remain unsupported.
- Actual page Link/Widget annotation dictionaries, verified OBJR membership under Link/Form ancestors where the complete tree is supported, explicit link label candidates, and widget alternate names through bounded field-parent chains. Technical field names are not accepted as an accessible-label pass.
- Required manual checks for visual meaning, logical/keyboard reading order, content coverage, assistive-technology behavior and applicable standard/version selection.

## Reader workspace contract

`PdfAccessibilityAuditWorkspace(reader, ui)` calls `inspectPdfAccessibilityAudit(fileId, token)`, `cancelPdfAccessibilityAudit(fileId, token)` and `discardPdfAccessibilityAudit(fileId, token)`. It offers category/page/search filtering, bounded finding pages, explicit source evidence, source-page jumps and `ui.openTags(nodeId)` routing. Tag routing closes the audit before invoking the supplied callback. `prepareDeparture()` closes/cancels outstanding work and calls `ui.onClosed` after successful cleanup.

The renderer separates fail, review, unsupported and observed. Observed records dictionary facts, not semantic or standards acceptance. The source-page action moves the reader to the physical page and presents the audit beside it.

The main process may attach an opaque `exportToken` to the bridge inspection result. The renderer's Save audit evidence action calls `savePdfAccessibilityAuditReport(fileId, exportToken)`; it supplies no arbitrary bytes or reconstructed report. The main-only export registry binds retained validated JSON to the exact opened source. Saving holds the editor guard and blocks departure until it finishes.

## Open acceptance and limitations

Content-stream coverage, artifact classification, visual text extraction/OCR quality, color/contrast, semantic heading correctness, meaningful alternative descriptions, implicit table associations, dynamic form behavior, full AcroForm field-tree coverage and screen-reader/viewer interaction require further review. Encrypted, malformed, oversized or unsupported structures return an unsupported finding or a contained-job failure instead of an invented success. Standards mappings are intentionally marked unverified for every rule.

Validation for this change is limited to JavaScript syntax checks, as requested. No runtime PDF/document execution, UI exercise, test execution or test files were used. Behavioral, accessibility and containment acceptance remain pending.


Root integration and compilation completed with 288 modules. Main/preload/contained engine/reader/action palette/lifecycle and source-bound report export are wired. No runtime/document/UI/security/standards acceptance was run. See [compiled checkpoint](PREFLIGHT-FORMS-CODING-2026-10-09.md).
