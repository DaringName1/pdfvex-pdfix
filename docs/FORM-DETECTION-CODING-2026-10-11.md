# Form detection and labeling coding — October 11, 2026

Scope: substantial partial coding for F47/F49, integrated inside the existing **Create fillable fields** builder. This is implementation evidence, not full adopted-feature acceptance or release certification.

## Coded behavior

- `src/form-detection-model.js` performs actual PDF.js 6 packed DrawOPS analysis, including save/restore and affine transforms, straight closed rectangles, joined four-edge boxes and horizontal writing lines. It uses source text bounds and printed underscore runs, including `Name ____` inside a single text item. Candidate rectangles remain in source PDF coordinates; the existing reader viewport draws them correctly for the displayed rotation/crop.
- Blank, near-square boxes become checkbox suggestions; larger blank rectangles and writing lines become text suggestions. Nearby date/DOB/birth and signature/initial labels suggest their respective area types. Existing widgets, confirmed new widgets, populated text regions and intersecting/duplicate proposals are excluded. Scan candidates also undergo bounded interior-ink sampling to avoid treating marked boxes or written answers as blank.
- Nearby text supplies editable tooltips and unique safe field names. The panel exposes heuristic confidence, unlabeled/ambiguous matches, other nearby labels, proposed type, coordinates, font size and suggested top-to-bottom/left-to-right order. Confidence is an estimate, not a calibrated probability.
- Detection is user-triggered for the displayed page or an explicitly entered range. No proposal is selected or added automatically. Selection and editing clear the review confirmation. Batch addition requires explicit review, distinct reviewed order and the existing `validateBuilderFields` contract. It adds ordinary supported builder fields in the chosen creation order, with one undo step and the existing source-bound draft recovery.
- **Date and signature areas currently create ordinary empty text fields**. They do not install date formatting/validation, digital signature widgets, signing, certificates or cryptographic behavior. Labels are existing builder tooltips; this does not create PDF accessibility structure tags.
- Opt-in scan analysis renders local artwork, detects dark straight outlines/underlines and uses the existing local `OcrSession` for pages without selectable text. A user-selectable bundled English/Spanish/French/German/Portuguese/Italian language feeds label bounds and uncertainty. Searchable scans with no vector paths can use raster geometry plus their existing OCR text layer without running OCR again. The source is not modified or made searchable by this action.
- Suggested order controls appended new-field creation order. The UI directs users to the existing Forms keyboard-order tool after saving; it does not claim guaranteed viewer tab behavior or write a new `/Tabs` recipe through the form-builder codec.
- Existing signed/encrypted/XFA/protection refusal, source-fingerprint checking, strict overlap/field limits, preview/reopen verification, review confirmation, new-copy writer, recovery, undo/redo and departure guards remain in the original builder flow. No main/preload bridge dependency was added. Detection is stopped on departure and OCR/render work is canceled; unconfirmed suggestions are ephemeral.

## Explicit bounds

20 selected pages; 100 suggestions per job; 15,000 extracted text items per page; 100,000 vector operators; 250,000 packed path values; 4,000 primitives; joined-box search restricted to at most 800 horizontal and 800 vertical lines and 200 joined boxes. Raster analysis permits four million pixels, a maximum dimension of 8,192 and 2,000 detected runs per direction, with bounded interior sampling. PDF.js loading/text/vector/raster awaits have a 30-second proposal deadline. OCR retains its existing two-minute-per-request termination. Per-page failures and truncated analysis are shown and successful earlier pages remain reviewable.

These analysis budgets apply after PDF.js extraction. They do not impose a new hard memory/process cap on PDF.js parsing or immediately terminate a shared PDF.js worker when an extraction deadline/cancel occurs; eventual results are ignored. Native source inspection and writer containment remain unchanged.

## Remaining implementation and acceptance

- More complete detection of curved/rounded/dashed/faint/broken/skewed artwork, non-axis-aligned fields, circles/radio groups, invisible optional content, complex clipping, font glyph outlines and unusual form layouts. Clipped vector paths are explicitly skipped. OCR text direction and row/column reading order need broader language/layout handling.
- Scanned-form detection is now coded for straight dark boxes and lines plus local OCR labels, but needs real scan corpus checks, OCR assets/runtime verification, deskew/noise/lighting improvements, handwritten/marked-state robustness, multilingual label semantics and reliable splitting of OCR labels that span a checkbox and text. Printed Latin-script keywords currently drive date/signature type guesses.
- Calibrated confidence, semantic label grouping, richer document-aware reading/tab-order suggestions, date/initial/signature-specific field semantics, and structured PDF accessibility tagging remain open.
- Independent end-to-end checks of detected-field placement, editing/selection, scan cancellation, recovery/undo, source protection, preserved original, output field semantics and supported actual tab order remain pending. No full build, UI sweep, production PDF corpus run or broad compatibility claim was made by this work.

## Verification performed

- `node --check` passed for `src/form-detection-model.js`, `src/form-detection-panel.js` and the modified `src/form-builder-workspace.js`.
- One narrow inline model smoke used a packed PDF.js 6 rectangle buffer, a nearby date label, a populated box, a same-item printed `Name ____` blank, and a synthetic scanned square. It passed box decoding, date-type suggestion, existing builder validation, occupied-text rejection, underline label extraction and raster-checkbox inference. It exposed and fixed a false positive where a populated box's top edge was incorrectly re-proposed as an underline. This is model-level synthetic evidence only.

Files authored: the model, panel, panel CSS, this record, and targeted integration edits in `src/form-builder-workspace.js`. No edits to `src/form-workspace.js`, app/main/preload or shared feature-status files.
