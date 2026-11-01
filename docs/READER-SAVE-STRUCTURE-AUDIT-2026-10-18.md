# Reader / Drawing / Pages: expanded structure evidence

October18 continuation of V1 audit area3. New test file: `tests/pdf-audit-save-routes.test.cjs`.
All21 cases pass. This adds evidence; no production feature or preservation behavior was changed by this increment.

Fixture: generated two-page PDF, existing FreeText appearance/private fields, visible text field/widget, field value42,
calculation action and AcroForm CO order, an actual attached file with exact decoded bytes, title metadata, empty
outline root and tagged-structure marker. It is deliberately **not** a PDF/UA conformance or real cryptographic
signature fixture. Source JavaScript is retained as data, never run by the tests.

Every successful writer result is saved to a new temporary file and reopened from disk with PDF-lib. Source objects
and encoded streams are compared by fingerprints except the exact fields the operation is allowed to change;
stream Length normalization is excluded, not stream payloads. Fields, CO, tag/attachment catalog references and
title are checked again; original bytes stay unchanged. Font/resource additions retain existing resource entries.
PDF.js independently checks visible generated text where applicable. Temporary test files are removed afterwards.

| Route | New proof | Explicit limits |
| --- | --- | --- |
| Preserving reorder | Source object/stream retention except root Kids/Count and leaf Parent; exact page identity reversal; attachments/tag objects/form/widget/calculations retained | Exact permutation only, not general merge/delete. Logical tag order is not changed or certified |
| Outline replacement | Only catalog Outlines changes; old source outline objects and unrelated structures retained | Simple generated outline; outside viewer/hierarchy complexity not certified |
| Page boxes | Only chosen page CropBox changes to exact rectangle; unrelated annotations and document structures exact | Crop can deliberately hide artwork; it is not redaction |
| Print marks | Only Contents/MediaBox/CropBox/optional TrimBox change; unrelated source graph including existing annotations exact | Page expansion explicitly selected; no physical printer or PDF/X acceptance |
| Thin-line repair | Only selected stream changes; exact changed width after independent reinspection, other objects/geometry retained | Selected changed stream is inspected separately, not claimed byte-identical; stream/program coverage remains bounded |
| Page numbers, Bates, header, footer, watermark, stamp | Six separate generated copies retain unrelated objects, existing page resources, attachments/tag/form data; PDF.js finds exact added text | Standard font/ASCII fixtures; no arbitrary custom-font or batch-queue acceptance |
| Takeoff PDF | New annotation list only; all other original objects retained; exact entry read from saved annotation and quantity recomputed from saved points/scale | Approximate point placement, no CAD or physical measurement acceptance |
| XFDF import | Appended selected note; unrelated source graph and structures exact; note literal independently read | Supported standard XML subset only, no Acrobat/Revu claim |
| Replacement sheet | Supported artwork replacement retains source comment objects, attachments and non-widget field calculations; PDF.js sees replacement artwork, not old active artwork | Tagged source and selected page containing widgets are refused, proven separately. Old artwork bytes remain retained, not redacted |
| Flattened markup | Existing annotations/forms/calculations/tags/attachments stay; added text is selectable in PDF.js | Tested text-box flatten, not every ink/shape/opacity combination |
| Lossless compression | Actual contained qpdf output written/reopened; exact decoded attachment, tag literal, CO link, field value/action and title retained; deliberately changed CO or tag data rejected | Qpdf may renumber/recompress objects, so semantic checks replace raw reference comparison. JPEG mode/batch interruption use separate existing tests |

Four refusal cases apply orphan signature, nested signature-field, ByteRange and certification markers to twelve
preserving/opening routes each (48 boundary assertions). These now also cover tag editing, repair, cleanup and portfolio creation. Each refuses for a signature/certification reason and leaves
source bytes unchanged. These prove fail-closed refusal, not certificate validity or incremental signed editing.
Fresh page-copy and markup nested-signature fixes from a4fa042 have their own tests too.

Layer distinction: most new cases call the real codec directly and inspect its written output. Compression additionally
executes the existing contained native engine. They do **not** exercise every renderer dialog, picker, publication
failure, batch variant, external PDF program or real signed document. Existing built-app checks/publication fault
tests are complementary; do not mark the entire V1 integrity area complete or assign a percentage from this file.

Reproduce: `node --test tests/pdf-audit-save-routes.test.cjs`. On Windows, the compression case needs the ordinary
permissions/native build used by existing compression tests. No real/private document, spare PC or network used.


## Reply/history continuation

Two additional cases bring the targeted route suite to23passing tests. Both append a Unicode reply to the
existing FreeText parent, once without status and once with Accepted/Review history. Each saved result is reopened
from disk and all original objects retained except the page's appended Annots list. Attachments, tags, visible
widget, field value/calculation action/order, parent appearance/private fields and original source bytes stay exact.
PDF.js independently confirms reply text, status, state model and appearance. The reference-format assertion
initially compared the audit's ref:9:0 key with PDF syntax9 0 R; corrected test expectation, not a product bug.
This closes the common-fixture gap for these two reply variations, not every status, PDF viewer or complex source.

## October20 expanded independent output checks

44route tests plus16fault/safety/Windows-lock tests pass (60total). Added editable/flattened checks for highlight, underline, note, text, ink, line, arrow, cloud and callout; source object/stream preservation, attachment bytes, tags, form value and calculation action/order, outline and unrelated annotations are independently read from saved files. Selective metadata cleanup and portfolio addition retain their declared unrelated payloads. Actual sandbox repair preserves those semantics, refuses a wrong source fingerprint and invalidates discarded output. PDF-lib may wrap unchanged source Contents references with exact q/Q streams; tests verify those wrappers and original inner references explicitly. Notes remain editable by policy. Evidence: docs/evidence/codex/ui-polish-2026-10-20/save-audit.txt. Production save policy unchanged; physical full disk/power loss and complete per-screen interruption coverage remain open.
