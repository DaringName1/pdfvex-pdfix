# PDFix — Acrobat replacement targets

Adopted October 7, 2026, at the user's request. Goal: make PDFix a dependable, easier alternative for everyday documents and professional drawing review, then expand to specialist workflows. Replacement readiness requires working file compatibility, useful editing, reliable comments, responsive navigation and trustworthy saved outputs.

This plan captures all ten categories from the supplied comparison. The original text is preserved in [the intake record](docs/ACROBAT-COMPARISON-USER-INPUT-2026-10-07.txt). It is user-provided planning input, not a verified description of current Adobe products, licensing, standards support or legal outcomes. Verify such claims against current primary documentation when choosing an engine or publishing a comparison.

**Status:** all A01–A25 targets remain adopted work. The [October 8 coding checkpoint](docs/INTEGRATED-FEATURES-CODING-2026-10-08.md) records A01/A11/A17 subsets; the [October 9 checkpoint](docs/INTEGRATED-FEATURES-CODING-2026-10-09.md) adds integrated, compiled subsets of A01, A02, A11, A19 and desktop readable-text work toward A24. Their broader requirements and runtime acceptance remain open; the unchecked targets below are not completion claims. Existing related code has the narrower status in the current feature inventory. A IDs identify work packages and overlap R/M/B/F targets; their counts must not be added as independent features. F01–F42 keep their existing IDs.

## Order and delivery gates

1. **Core replacement priorities:** finish large-file reliability, usable selection, editing/conversion fidelity, drawing comments and preservation, recovery, printing and containment. Prioritize A01, A11–A12 and A25 alongside the existing reader, editor, Bluebeam and F42 work. A large file opening once is insufficient evidence of smooth navigation or safe output.
2. **Professional document expansion:** certificate signing/trust and durable evidence (A02–A04), preflight/color/standards (A05–A10), broader forms (A13–A16), portfolios (A17) and browser review (A22). Select engines/providers and define supported subsets before product capability claims.
3. **Specialist and platform expansion:** contained active-form compatibility (A14), 3D/GIS/media (A18–A20), managed rights (A21), additional platforms and phone reflow (A23–A24). These need separate decoder, service, licensing, privacy, security and real-file acceptance.

This is the expanded full plan, not a promise that every specialist integration ships in the first beta. Each target gets its own implementation and acceptance record. No paid service, public sharing or distribution is activated by adopting this plan. Coding continues under the user's current source-first workflow; runtime/debugging work is scheduled separately.

## 1. Certificate signatures and signature services

- [ ] **A01 — Certificate validation and trust.** Expand F19/M01.04 to cryptographic integrity, signer identity, certificate chain, timestamp and revocation results. Evaluate authorized AATL/EUTL or other appropriate trust sources, update provenance and offline behavior. Show valid/invalid/unverifiable separately from trusted/untrusted/unknown; never infer validity from a visible mark.
- [ ] **A02 — Certificate signing and certification.** Add user-selected certificate signing, hardware-token/SmartCard and Windows certificate-store integration where supported. Review certification permissions, multiple signatures, incremental updates and edit-invalidation warnings. Private keys remain with the authorized key provider; verify outputs independently. This moves certified signing into later adopted scope beyond the original first-release exclusion.
- [ ] **A03 — Durable signature evidence.** Evaluate timestamp authorities and supported long-term validation profiles, certificate/revocation evidence retention and verification after expiry or offline use. Define exactly what evidence is retained and what cannot be established. Legal eligibility depends on the chosen workflow and jurisdiction and must be reviewed before related product claims.
- [ ] **A04 — Routed signature requests and audit history.** Expand F39 to templates, ordered/parallel recipients, recipient tracking, reminders, supported identity challenges such as email/SMS OTP, bulk requests and cancellation. Specify tamper-evident event records, document identity and downloadable evidence. Identify the provider, costs, authentication, consent, retention and data destination before integration. Visual signing, local certificate signing and remote requests remain separate workflows. Payment pipelines are not added by this intake.

## 2. Commercial printing, prepress and color

- [ ] **A05 — Preflight inspection and reviewed fixes.** Evaluate a contained commercial-grade engine for syntax, fonts, image resolution, transparency, page boxes, output intent and printer-specific rules. Provide versioned profiles, item/page locations, detailed reports, suggested fixes and source/output review. Report unsupported checks and preserve originals. (F29, F40; M10.01.)
- [ ] **A06 — Color-profile conversion.** Review ICC profiles, device-independent color, RGB/CMYK/spot-color handling and explicit output intents. Preview changes, disclose color loss, preserve supported objects and validate conversions against a print corpus. Engine/profile licensing and distribution are prerequisites. (F40; expands M10.02's first-release boundary.)
- [ ] **A07 — Separations, overprint and trapping.** Add supported CMYK and spot-color plate previews, overprint simulation, ink coverage and reviewed dot-gain/trapping controls or profiles. State monitor/proof limitations and prove output with representative commercial-print files and physical printing. Advanced print-production work is later adopted scope.
- [ ] **A08 — PDF/X validation and output.** Expand F40 to evaluated PDF/X editions, including the supplied X-1a, X-3, X-4 and X-6 targets. Offer only editions actually supported by the reviewed engine/validator. Report standard/version, passed and failed rules, repair choices and output verification; appearance or extension is insufficient proof.

## 3. Archival and engineering standards

- [ ] **A09 — PDF/A conversion and validation.** Expand F40/M10.01 to selected PDF/A profiles, including the supplied A-1b, A-2b and A-3u targets. Review font embedding, ICC/output intents, metadata, attachments, transparency and unsupported content; explain changes and validate each saved output independently. Arbitrary input conversion is not guaranteed.
- [ ] **A10 — PDF/E feasibility and support.** Evaluate engineering-document standard editions and their decoder/validator requirements. Define supported engineering content, conversion limits, reports and real-file evidence before advertising compliance. This records the PDF/E heading in the intake even though its detailed comparison primarily describes PDF/A.

## 4. Full accessibility remediation

- [ ] **A11 — Tag-tree and reading-order workspace.** Expand F30/M08.01–02 to direct tag-tree editing, logical reading-order review, headings, lists, links, artifacts, alt text, form labels and table header/cell associations. Support bulk artifact operations, keyboard access, undo/recovery, source-page navigation and semantic output review. OCR text is separate from document accessibility.
- [ ] **A12 — Accessibility audits and evidence.** Expand F29–F30 to detailed PDF/UA, relevant WCAG and Section 508 requirement mappings, rule versions, evidence locations and repair guidance. Distinguish automated findings from required manual checks. Validate with assistive technology and representative users before claiming accessible output; a checker pass alone is insufficient.

## 5. Advanced forms and active content compatibility

- [ ] **A13 — XFA compatibility.** Evaluate static and dynamic XFA layouts, reflow, data binding, field appearances, input/export and print fidelity with government and other representative forms. Detect unsupported content and explain usable alternatives. Select a licensed, contained engine and verify limits; current AcroForm support is not XFA support. (F18; later expansion of M04.)
- [ ] **A14 — Isolated form-logic compatibility.** Inventory form calculations, validation, formatting and button actions. Prefer narrowly supported declarative calculations; evaluate a dedicated contained compatibility runtime only for required features. Document-origin code must have no ambient file, process or network access, with resource bounds and effective isolation proof. General PDF script/macro execution remains disabled in current and first-release readers. Later compatibility is explicitly gated on a separate reviewed design and does not relax S00 or R08.
- [ ] **A15 — 2D barcode form fields.** Evaluate supported symbologies, live encoding of selected field values, field creation/filling, capacity/error handling and print/scan round trips. Show what data is encoded and review decoder/encoder licensing. This moves barcode fields into later adopted scope.
- [ ] **A16 — Reviewed form submissions.** Expand F38/M04.03 to explicit endpoint submissions and authenticated approved database/service connectors. Show the exact destination and payload, request consent, protect credentials, record success/failure and support offline export. Document actions cannot silently contact a server or database. (F38; R03/R27.)

## 6. Portfolios and document containers

- [ ] **A17 — PDF portfolio navigation and creation.** Add an inert inventory, searchable grid/list navigation, supported previews, extraction and creation/reordering of selected contents. Preserve names/metadata where supported and report unsupported layouts. Apply attachment size/count/decompression limits, traversal protection and contained decoders. Embedded Office, CAD or media content needs its own supported capability; never auto-run extracted files. Interactive 3D portfolio presentation is a separate renderer evaluation within this target. (M10.02; S00/R08.)

## 7. 3D, geospatial and embedded media

- [ ] **A18 — Interactive 3D PDF.** Evaluate U3D/PRC decoding, rotation, assembly visibility, cross-sections and calibrated geometry measurements with explicit units. Review licensing, GPU/resource budgets and containment. Embedded model viewing and measuring do not imply CAD authoring. (M10.02; separate from M03.12.)
- [ ] **A19 — Geospatial PDF.** Inspect coordinate reference systems, georegistration, latitude/longitude and map measurements. Show unit/projection/precision and calibration limits, support layers where meaningful and verify against known reference maps. Local PDF measurements do not establish accurate GIS coordinates. (M10.02.)
- [ ] **A20 — Embedded multimedia.** Evaluate user-initiated audio/video playback with inert inventory, codec support, licensing, bounded decode and cancellation. No automatic playback, remote retrieval or script/plugin execution. Rich-media actions require separately reviewed supported behavior. (M10.02; S00.)

## 8. Managed enterprise document access

- [ ] **A21 — Policy-managed access.** Evaluate an authenticated managed-document service with centrally administered access, expiry, revocation, print permissions, audit history and explicit offline policy. Report that revocation controls supported clients and cannot recall screenshots or unrestricted copies. Show service destination, identity and retention. Adobe/AEM policy-file interoperability requires supported API/licensing evaluation; never bypass another system's DRM. Password encryption is a separate existing feature. (M10.02; service/security evaluation.)

## 9. Browser, desktop and mobile reach

- [ ] **A22 — Browser shared reviews.** Expand F36 to authenticated or explicitly permissioned link review with no desktop install, drawing/page locations, comment threads, sync/conflict handling, invitations, expiry/revocation and exports. Review browser support for Mac, Chromebook, phones and PCs; show upload destination and permissions before sharing. Keep anonymous/public links deliberate, scoped and revocable. (F36; R22/R27; B01–B05.)
- [ ] **A23 — Additional platform clients.** Add feasibility and delivery plans for Mac and iOS/Android reading/review clients, plus a Chromebook/browser path. Preserve source/comment identity, permissions, sync/recovery and format boundaries; retain Windows-first development priority. Phone/tablet gestures, accessibility, offline support, secure storage and distribution need their own acceptance.
- [ ] **A24 — Phone-friendly reading and reflow.** Add evaluated text reflow, responsive layout, adjustable type, navigation and accessible reading for mobile documents. Preserve page/source references and flag uncertain order, tables, columns and drawings. Let users return to exact page artwork; do not silently turn reflowed content into an edited original. OCR/reflow fidelity needs a real-file corpus.

## 10. Wild and damaged PDFs

- [ ] **A25 — Robust opening, repair and honest failure.** Make F42's corpus explicit for legacy/PostScript-derived, malformed, truncated, mixed-generator, unusual-font/image, encrypted, giant and adversarial PDFs. Add bounded cancellable diagnostics, useful error causes and reviewed repair-to-copy where supported. Measure opening/navigation/selection/memory responsiveness across hardware profiles and verify repairs preserve supported content. Never silently call a partially rendered document complete or raise limits without resource evidence. (R06–R09/R29; F04/F29/F42; S00.)

## Acceptance and scope reconciliation

Every A target needs a selected engine/service where applicable, a declared supported subset, implementation evidence, original-preservation and cancellation/resource behavior, and current runtime/corpus/security/output acceptance before being labeled done. Compliance and signature claims require reviewed independent evidence. This intake adds no implementation, benchmarks, test passes or release-date promises.

Previously excluded specialist capabilities are now **adopted later targets** where A02/A04/A06–A07/A13–A15/A17–A21/A23–A24 cover them. Their historical initial-release exclusions remain visible to explain staging, rather than being interpreted as permanent rejection. Unrestricted agents, DRM bypass, arbitrary uncontained macros, payment pipelines, a complete office suite and unrelated presentation/marketing generation remain outside this addition.

Canonical scope links: [product plan](PRODUCT-PLAN.md), [complete planned catalog](PDFIX-ALL-PLANNED-FEATURES.md), [future list](PDFIX-FUTURE-FEATURES.md), [requirements](REQUIREMENTS.md), [roadmap](ROADMAP.md) and [current status](PDFIX-COMPLETE-STATUS-2026-10-04.md).


## October 9 preflight, audit and form calculation update

[Integrated coding and compilation record](docs/PREFLIGHT-FORMS-CODING-2026-10-09.md) adds practical print profiles, structural accessibility findings, source-bound JSON evidence exports and reviewed user-authored form calculations. 288 modules compiled. These are partial implementations toward A05/A12/A14 and overlapping F18/F29/F30/F40. Broader specialist engines, standards mappings, source-logic compatibility and runtime acceptance remain open. The full adopted scope is unchanged.


## October 9 repair, forms and selection coding update

[Integrated coding and compilation record](docs/REPAIR-FORMS-SELECTION-CODING-2026-10-09.md) adds contained existing form filling/visual placements with native sealed saving, bounded supported qpdf repair-to-copy and rectangle-selection pointer/page lifetime plus row/column preview controls. 292 modules compiled; current runtime acceptance remains pending. Repair requires a complete independently inspected baseline and preserves supported content; broader damaged-file recovery and complex selection layouts remain open. No broad feature is newly accepted, and the full adopted scope remains unchanged.


## October 9 form order, FDF and editable workflows

[Integrated coding and compilation record](docs/FORMS-FDF-WORKFLOWS-CODING-2026-10-09.md) adds reviewed supported-page form keyboard order, native FDF comment import/export, editable native page-reorder/Bates sequences and broker-envelope alignment with existing bounded source/request contracts. 301 modules compiled. Broader form/appearance/interchange coverage, combine/OCR/print workflow steps, durable recovery and current runtime/security/performance acceptance remain. No broad row is newly accepted; the full adopted scope is unchanged.


## October 9 native combination, TIFF and workflow library

[Integrated coding and compilation record](docs/COMBINE-TIFF-WORKFLOWS-CODING-2026-10-09.md) adds standalone native full-source PDF combination with supported comments/forms/bookmarks/destinations, supported classic multipage TIFF decoding and reviewed page import, and named reorder/Bates definitions with exact-source editable draft recovery. 306 modules compiled. Partial/duplicate PDF selection, wider graph and TIFF modes, combine/OCR/print runner stages, durable in-flight resume and runtime/security/fidelity acceptance remain open. Restoring settings never restores output approval. No broad row is newly accepted; the full adopted scope stays active.


## October 9 Bates, combined workflows, TIFF fax and tag semantics

[Integrated coding and compilation record](docs/BATES-COMBINE-TIFF-TAGS-CODING-2026-10-09.md) adds continuous multi-file Bates numbering with reviewed saves/identifier reports, native combine → editable reorder/Bates continuations, real CCITT fax TIFF decoding and reviewed existing table/list/printable-form tag semantics. 308 modules compiled. Persistent queues/global identifier registries, other workflow stages, broader PDF/TIFF/tree compatibility and runtime/security/fidelity/standards acceptance remain. No broad row is newly accepted; the full adopted scope stays active.


## October 9 user additions — free printing and reading/writing tools

Adopt F43–F46 / R42–R45: virtual PDF printer, local read aloud, expanded word count and spell-checking. R46 requires PDFix to stay free, with no required paid APIs/subscriptions, feature unlocks or purchase/upgrade links. These features use free local components; Whisper is not a speech-synthesis engine. The existing basic editor word counter is only a starting point. See [detailed scope and dependencies](READING-WRITING-PRINT-PLAN.md). No new code, tests, installs or paid integrations are claimed. Prior adopted scope remains, with provider/engine choices subject to the free-app requirement.


## October 9 local text/printing coding update

See [current compiled checkpoint](docs/LOCAL-TEXT-PRINT-CODING-2026-10-09.md) for F43–F46 / R42–R46: local read aloud, spelling, scoped statistics, optional Windows PDFix printer and local-only AI are integrated coded subsets. Compilation passed; runtime/output/performance/beta acceptance remains pending. Preserve all remaining full-scope work. The [three release priorities](docs/RELIABILITY-PERFORMANCE-USABILITY-GATES.md) govern integrity, large-file responsiveness and separate simple workspaces; none is certified passed.

## October 11 — additional free local replacement tools

The user adopted 20 further targets, F47–F66 / R47, and prioritized Workspaces, PDF viewing and PDF editing. [FREE-ACROBAT-ADDITIONS-PLAN.md](FREE-ACROBAT-ADDITIONS-PLAN.md) preserves the complete ordered list, including form automation, Windows/Office/Edge handoffs, synchronized and explicitly granted folders, EML/clipboard creation, offline translation, bookmark/naming automation, mail merge/signature handoff, fingerprint checks and print geometry/stroke tools. R48 defines scoped folder access. These overlap existing A/R/M/F targets and are not 20 additional independent completions.

R46 applies to every choice: PDFix remains free without paid unlocks or payment links. Existing third-party accounts/software remain external prerequisites where applicable; no paid service is silently introduced. Full Acrobat replacement remains an adopted objective, not a verified current parity claim. No code or test result is added by this intake.



## October 11 complete scope consolidation

[Final implementation plan](FINAL-IMPLEMENTATION-PLAN.md) sets the current order: Workspaces → PDF viewing → PDF editing → PDF creation/document toolbar → Bluebeam comments/review → remaining complete adopted scope → digital-pen drawing → full UI/function and release acceptance. The [complete remaining-work register](docs/FINAL-REMAINING-WORK-2026-10-11.md) and [source-preserving scope ledger](docs/FINAL-SCOPE-LEDGER-2026-10-11.json) retain R01–R50, S00, all 71 M rows, B01–B12, F01–F67, A01–A25 and G01–G16/D01–D22. Every earlier specification, dependency, preservation/security/free-app rule and applicable acceptance gate remains represented. Later adopted specialist targets supersede only their historical staging exclusions; unrelated excluded scope is retained as a boundary.

R49 records the familiar creation toolbar, comment viewing/adding/eligible editing and requested full UI/function pass. R50/F67 records digital-pen PDF handwriting and saved editable ink. Existing basic ink and newly coded toolbar/comment controls do not complete the broader targets. Current checks are scoped evidence; no blanket all-features/all-files or release-ready claim is made.
