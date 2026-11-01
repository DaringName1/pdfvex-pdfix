# PDFix — full future feature list

Updated **October 9, 2026**. Baseline adoption: October 4. This brings together the saved roadmap, original requirements, master list, useful additions, Bluebeam plan and the October 7 Acrobat replacement expansion (R41/A01–A25). It is part of the [complete status report](PDFIX-COMPLETE-STATUS-2026-10-04.md). Future rows overlap existing requirements and are not additional feature counts. Rows with coded groundwork still need the listed expansion and current testing. Evaluation items have no promised delivery date or claimed working integration.

Latest implementation batch: [seven major gaps coded and compiled](docs/MAJOR-GAP-CODING-2026-10-07.md); current runtime acceptance remains pending.

## Next usability and feature expansions

**Adopted into the product plan on October 4, 2026, at the user's request:** all F01–F42 rows below. This is the baseline future scope to complete, with continued work focused on implementation, debugging and acceptance. Further speculative feature growth is not the priority. The product plan preserves each item's current/later placement and the exclusions below.

| ID | Planned addition / expansion | Starting point and what remains |
| --- | --- | --- |
| F01 | PDF-only fullscreen | R40 artwork mode, auto-hiding exit, keyboard entry/navigation and previous-view restoration coded October 7; runtime/DPI/focus/transition acceptance pending. |
| F02 | Comfortable/compact reading appearance | Larger UI text/contrast controls are coded; Compact/Comfortable reading density coded October 7; consistent reader/dialog behavior and runtime acceptance remain. |
| F03 | Reliable selection on complex PDFs | Single-pointer rectangle selection with page/geometry cleanup and row/column/content-order copy previews is coded and compiled October 9. Complex layout, vertical/rotated writing and runtime acceptance remain. |
| F04 | More capable large-sheet navigation | Hand/pointer zoom plus zoom-to-region and session Previous/Next view history coded October 7. Synchronized navigation, DPI/monitor/very-large-drawing behavior and current acceptance remain. |
| F05 | More page selection/split recipes | Bookmark/range recipes and actual encoded file-size splitting integrated and compiled October 9. Size/work budgets and single-page refusals apply; current acceptance remains. |
| F06 | Broader page/object preservation | Current standard organizer and separate preserving reorder; preserve comments/forms/links/bookmarks/unknown data across more insert/delete/replace/combine operations. |
| F07 | Drag pages between PDFs | Chosen-source drag/copy, output reorder, reviewed insertion/source mapping, keyboard alternatives and undo/redo coded October 7. Broader object preservation and current acceptance remain. |
| F08 | Broader drawing comparison | Local text/dimension/artwork matching proposals, manual correction, reviewed counterpart mappings and unmatched-page handling coded October 7. High-resolution/sensitivity/alignment expansion and drawing-corpus acceptance remain. |
| F09 | Source/output comparison for more formats | Current PDF comparison; review actual document/office/image conversions and changed fonts/tables/page breaks against original content. |
| F10 | More complete document/PDF editing | New glyphs/fonts/shaping/reflow, wider original/nested PDF text/image cases, richer Word/slide layouts, rich/multi-section bands and source-preservation evidence. |
| F11 | Wider conversion and photo handling | Tested conversions with explicit preservation choices; original orientation, color profiles and metadata options, and clear lossy-output review. |
| F12 | Additional file decoders | Supported classic multipage TIFF including MH/Group 3/Group 4 fax decoding and reviewed page import is integrated and compiled October 9. Wider TIFF, HEIC/HEIF, legacy DOC/XLS/PPT and Apple Pages/Numbers/Keynote remain, with decoder/licensing/corpus acceptance. |
| F13 | Live Photo components | Recognize separately supplied still/motion assets and explicit exports; no fabricated missing motion component. Depends on decoder/metadata work. |
| F14 | Direct scanner/document-camera capture | Actual Windows device integration, multi-page acquisition/preview/order/rotate/remove/cancel and bounded security handling. |
| F15 | More OCR languages and better quality | Bundled/installed language selection, wider output fonts and mixed-language/poor-scan/handwriting limitations. Printed English is the current tested subset. |
| F16 | Better scan cleanup and uncertainty review | Current deskew/tone/blank/confidence code needs accuracy tests; expand low-resolution/faint/skew/crop/rotated sources and recoverable corrections. |
| F17 | Stronger table extraction | Reviewed CSV, source-bound correction drafts and contained literal XLSX export with exact cell readback are coded. Merged/irregular/rotated tables, automatic reconstruction and runtime/Excel acceptance remain. |
| F18 | Broader forms and signing assistance | Reviewed supported-page custom tab order, numbered widgets, undo/recovery and native output verification are coded and compiled October 9. Wider appearance fonts, tagged/mixed navigation, declarative/source logic and current runtime acceptance remain. |
| F19 | Certificate signature validation | Reviewed integrity/identity/trust results and edit warnings; visual signing and signature-presence reporting remain separate. |
| F20 | Wider third-party markup preservation | Broader annotations, appearances, reply/status/lock/provenance/unknown-data retention and actual round trips, especially dad's Revu drawings. |
| F21 | Broader review exchange and reusable tools | Supported native FDF comment import/export is integrated and compiled October 9 alongside XFDF/JSON/stamp/style code. Broader FDF/form data/appearance, BAX/BTX/private adapters and actual Revu interchange remain. |
| F22 | Richer sheet revision handling | October 11: reviewed native physical artwork replacement with exact-geometry original comment retention, donor comments and stable page/private graph preservation is coded; a contained known-pair output/reopen passed. Coordinate transforms, larger pairs, unsupported dependencies, metadata/relink expansion and actual Revu remain. |
| F23 | Bluebeam custom data and takeoff interoperability | Decode understood PDF-embedded custom columns/quantities without fabricating profile-only values; extend current PDFix takeoff metadata and unit/scale workflows. |
| F24 | Broader compression | Wider real image/filter/color/form files and reviewed optimization choices; current code does not promise existing-JPEG recompression/downsampling. |
| F25 | Vector-preserving redaction | Remove selected source text/image/objects while retaining unmarked vector artwork, with forensic proofs and recovery; current secure mode rebuilds image-only pages. |
| F26 | More complete sanitation/security coverage | Contained DOCX/RTF, bookmarks, decorations/Bates, attachment inspection/decoding, source-bound web destinations, literal table XLSX and supported batch PDF text routes are coded. Other native families, Chromium image/OCR/PDF decode, hidden structures and effective OS security acceptance remain. |
| F27 | More batch actions | Compression plus reviewed source-sealed PDF copy/rename and narrowly supported literal TXT queues are coded, with chosen new folders, keep-both names, individual results and cancellation. Wider conversions/combine/workflow batches and current acceptance remain. |
| F28 | Editable multi-step workflows | Native reorder/Bates with definitions/drafts, plus native combine → reorder/Bates continuation, integrated and compiled October 9. OCR/print/other stages, saved combined definitions, in-flight resume and runtime acceptance remain. |
| F29 | Complete health/accessibility inspection | Embedded/missing fonts, oversized images, broader print issues, actual tags/reading order/headings/link/form semantics and carefully scoped results. |
| F30 | Guided accessibility repair | Only reviewed repairs with validated semantics/results; tagging or OCR alone never establishes accessible output. |
| F31 | Windows local sharing | Share a newly exported local copy through Windows handoff, with a clear destination and no original mutation. |
| F32 | Finished Windows lifecycle | Branded/signed installer, clean-machine install/upgrade/uninstall, optional Open With/associations/default-reader flow, updates/rollback and user-data safety. |
| F33 | Final brand derivatives | Separate inspected executable/app icons, small/light/dark/monochrome variants, licensing/provenance; preserve the supplied master unchanged. |
| F34 | Broader selected-file AI | Real provider acceptance, image-capable context when consented, better citation/uncertainty handling and separately approved proposed edits; no automatic file tools. |
| F35 | Hermes / Harness / agent integrations | Hermes requires documented API/capability/authentication verification; Harness requires identifying the exact product. Generic provider code is not named integration proof. |

## October 9 user additions — free local features

All four are adopted planned implementation under R46's free-app rule. Details: [reading/writing/print plan](READING-WRITING-PRINT-PLAN.md).

| ID | Addition | Current starting point and remaining scope |
| --- | --- | --- |
| F43 | Virtual PDF printer | No PDFix virtual printer is implemented. Existing document export and physical-print preparation are separate features. Provide an optional PDFix Windows print destination for other applications, bounded local job capture, paper/orientation settings, review/import/save, cancellation and recovery; choose a free supported integration and complete signing/install/uninstall work. |
| F44 | Read aloud | No integrated document/PDF read-aloud controller is implemented. Free local text-to-speech, voice/language/speed controls, selected text/current page/document scopes, play/pause/resume/stop, highlighting/source navigation, bounded incremental reading and OCR/reading-order disclosures. |
| F45 | Word count and document statistics | The document editor currently displays a basic whitespace-based word count in src/document-editor.js. This does not implement the complete requested scope. Selection/page/document statistics for supported editor and PDF text; words/characters with and without spaces/paragraphs/pages; language-aware rules, explicit counted scope, cancellation and honest OCR/unsupported-content omissions. |
| F46 | Spell-checking | Desktop native spell-checking is currently disabled; source editor spell-checking is also disabled. No complete review/suggestion/personal-dictionary feature is implemented. Free local dictionary/native-engine integration, language selection, underlines/suggestions, replace/ignore/ignore-all/personal dictionary, undo/recovery and read-only PDF findings linked to supported editing; keep source/code fields opt-in. |

## Later candidates requiring service or standards evaluation

| ID | Candidate | Dependency / boundary |
| --- | --- | --- |
| F36 | Cloud/shared reviews and links | Identified service/account, authentication, selected destination/permissions, transfer consent/history and no implied public link. |
| F37 | Bluebeam Studio Sessions/Projects | Supported API/licensing/account/privacy evaluation; opening a local Revu PDF does not fetch session-only data or connect to Studio. |
| F38 | Online forms and response collection | Reviewed collection service, explicit submission destination, privacy/permission and response handling. Existing local form saving is separate. |
| F39 | External signature requests, tracking and templates | Evaluated service/authentication/consent and clear separation from visual signatures and certificate validation. |
| F40 | PDF/A, PDF/X and tagged-PDF validation/output | Reviewed standards engines/validators and actual corpus/compliance evidence; appearance/file extension is insufficient. |
| F41 | Bates numbering | Single-file numbering and continuous multi-file reviewed queue/report are integrated and compiled October 9. Persistent/global registry, existing-ID/artwork detection, wider fonts/limits and runtime acceptance remain. |
| F42 | Wider release acceptance | Full real-world/adversarial corpus, performance, accessibility, physical printing, clean-machine packaging, licensing/SBOM/provenance and independent security review. This is acceptance work rather than a new app feature. |

## Explicit initial-release exclusions

These remain recorded as initial-release staging. On October 7 the user adopted the full Acrobat comparison as A01–A25 in [ACROBAT-COMPETITIVE-PLAN.md](ACROBAT-COMPETITIVE-PLAN.md). Specialist capabilities below represented by A04/A06–A07/A15/A17–A20 are now later planned targets with engine/service/security gates, rather than permanently excluded scope. They are not automatically requirements for the first beta. Payment pipelines, unrelated presentation generation and CAD authoring remain outside this addition.

- Bulk signature/payment workflows.
- PDF portfolios and barcode fields.
- Advanced print-shop color management/trapping.
- Geospatial and 3D measurements.
- Embedded multimedia playback.
- Presentation/marketing generation; editing supported existing PPTX text is a different existing capability.
- CAD model editing and DWG-style formats; PDF drawing review remains in scope.

Source coverage: [roadmap](ROADMAP.md), [requirements](REQUIREMENTS.md), [master list](PDFix-Missing-Features-Master-List.md), [feature tracker](FEATURE-TRACKER.md) and [Bluebeam plan](BLUEBEAM-COMPATIBILITY-PLAN.md). Current implementation and evidence are in the complete status report, whose detailed rows take precedence over older roadmap statements that a now-coded feature is still entirely absent.

## Additional adopted future scope — Acrobat replacement, October 7

F01–F42 are retained unchanged as IDs. The entire new comparison is saved as 25 overlapping work packages in [the Acrobat replacement plan](ACROBAT-COMPETITIVE-PLAN.md) and included in [the complete planned catalog](PDFIX-ALL-PLANNED-FEATURES.md). R41 records adoption. None is marked newly coded or tested.

| Category | Added targets |
| --- | --- |
| Certificate signatures and services | A01–A04: validation/trust lists, token/SmartCard signing, durable evidence, routed/bulk requests and audit history. |
| Commercial printing | A05–A08: preflight, ICC/color conversion, plates/overprint/trapping and evaluated PDF/X editions. |
| Standards | A09–A10: evaluated PDF/A conversion/profiles and PDF/E support. |
| Accessibility | A11–A12: full tag-tree/reading-order remediation and detailed standards/requirement evidence. |
| Forms | A13–A16: XFA, separately gated contained logic, barcode fields and reviewed submissions. |
| Portfolios | A17: bounded navigation, previews, creation and extraction. |
| 3D/GIS/media | A18–A20: U3D/PRC, geospatial measurements and user-initiated contained media. |
| Enterprise policies | A21: authorized managed access, expiry/revocation and explicit offline policy. |
| Browser/mobile/platforms | A22–A24: link reviews, additional clients and phone reflow. |
| Difficult-file reliability | A25: legacy/malformed/giant/adversarial corpus and verified repair-to-copy. |

Core reliability, editing, comments, accessibility and containment retain priority. Current script restrictions and no-DRM-bypass rules remain. Current Adobe/legal claims in the supplied comparison need primary-source verification before use in product comparisons.

Latest biggest-gap coding continuation: [docs/BIGGEST-GAPS-CODING-2026-10-07.md](docs/BIGGEST-GAPS-CODING-2026-10-07.md). Literal table XLSX, batch PDF copy/rename/supported TXT and four additional native PDF containment families are coded; runtime acceptance remains pending.

## October 7 editing fidelity and feature catalog

The complete adopted planned scope is saved in [PDFIX-ALL-PLANNED-FEATURES.md](PDFIX-ALL-PLANNED-FEATURES.md), including every original requirement, master/Bluebeam row and F01–F42 future item. It is a plan, not a completion claim.

The latest source changes and compilation evidence are recorded in [Editing fidelity coding checkpoint](docs/EDITING-FIDELITY-CODING-2026-10-07.md): supported formatted document bands and DOCX import, original mapped-glyph proofs, manual table merge/split correction, contained form creation and initial-inspection cancellation. [Document PDF output containment](docs/DOCUMENT-OUTPUT-CONTAINMENT-PROGRESS.md) records the new generated-output check route. Runtime, corpus, effective security and release acceptance remain deferred/open. No broad master row is newly marked fully accepted.

## October 7 large PDF reading

[Large PDF opening](docs/LARGE-PDF-OPENING-PROGRESS.md) records the newly coded file-backed range route, memory/disk admission, visible slow-file/progress notices, source/cleanup guards and separate reading/whole-file tool capabilities. It supersedes the blanket 100 MiB opening limit for eligible PDFs. The current viewer budget is 1 GiB and 500 pages; per-operation editing/export limits remain. No actual-file performance, runtime or security acceptance is claimed.


Latest integrated source milestone: [October 8 coding checkpoint](docs/INTEGRATED-FEATURES-CODING-2026-10-08.md). Supported scanning/OCR/certificate integrity/tag-tree/portfolio/large-comment subsets are coded and compiled; broader scope and runtime acceptance remain.


## October 9 implementation update

[Saved integration and compilation record](docs/INTEGRATED-FEATURES-CODING-2026-10-09.md) records initial local certificate signing, offline base-chain inspection, initial tags/artifacts, geospatial coordinates/distances, measured size splitting and readable-text controls. 282 modules and native helpers compiled. Broad runtime/document/device/security acceptance remains pending; full adopted scope remains active. The running app was not restarted.


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


## October 9 local text/printing coding update

See [current compiled checkpoint](docs/LOCAL-TEXT-PRINT-CODING-2026-10-09.md) for F43–F46 / R42–R46: local read aloud, spelling, scoped statistics, optional Windows PDFix printer and local-only AI are integrated coded subsets. Compilation passed; runtime/output/performance/beta acceptance remains pending. Preserve all remaining full-scope work. The [three release priorities](docs/RELIABILITY-PERFORMANCE-USABILITY-GATES.md) govern integrity, large-file responsiveness and separate simple workspaces; none is certified passed.

## October 11 adopted additions — F47–F66

All 20 new targets are adopted, in the user's supplied priority order: F47 field detection; F48 local autofill; F49 field labels/types/tab order; F50 Windows right-click tools; F51 Office PDF shortcuts; F52 Edge extension; F53 synchronized-folder compatibility; F54 EML to PDF; F55 clipboard to PDF; F56 offline translation; F57 automatic bookmark suggestions; F58 explicitly selected-folder search; F59 smart naming; F60 approved watched folders; F61 CSV form mail merge; F62 signature handoff preparation; F63 SHA-256 verification; F64 production marks; F65 page-box editing; F66 thin-line inspection/repair.

[Required behavior, dependencies, permission boundaries and overlap mapping](FREE-ACROBAT-ADDITIONS-PLAN.md). Workspaces/viewing/editing remain first. These are planned expansions; existing hashes, crop, forms, selected-file search and related code do not finish the expanded targets. The free-app rule remains; earlier IDs and specialist scope are unchanged.

## October 11 final plan and digital-pen addition

| ID | Addition | Required behavior and current boundary |
| --- | --- | --- |
| F67 | Digital-pen handwriting and drawing on PDFs | R50: saved editable PDF Ink and standard appearances; pen/highlighter/color/width/opacity, supported pressure with honest fallback, palm rejection, explicit pen/touch/navigation modes, stroke selection/move/delete/erasing, Undo/Redo, zoom/rotation/crop coordinates, multi-page use and recoverable drafts. Preview and save a new copy, reopen to continue editing; flatten only by explicit choice. Basic existing Ink is groundwork; hardware and saved-output acceptance remain open. |

[Final consolidated work order](FINAL-IMPLEMENTATION-PLAN.md) preserves all earlier R/M/B/F/A/G/D scope and constraints. R49 adds familiar creation-toolbar organization, improved comment viewing/adding/eligible editing and the requested complete UI/function pass. The user's Store-app clarification defines digital-pen behavior without requiring an exact app identity. Future features remain in the final ledger even when they require a device, free licensed engine or external service evaluation.

