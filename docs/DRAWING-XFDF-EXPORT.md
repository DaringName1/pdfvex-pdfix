# Reviewed XFDF drawing-comment export

Saved 2026-10-04. Source implementation milestone; no app/native-worker/runtime or Revu/Acrobat acceptance tests were launched.

## Available route

Workspaces → Review drawing comments → Inspect source comments → choose filters → Review XFDF export. This freezes the inspected source rows and physical pages. Build generates actual UTF-8 XML; per-annotation results are paginated in groups of 100, the complete native receipt and exact XML are available, and review confirmation plus every results page shown is required before saving. Cancel/discard/close keep the original PDF unchanged. A separate JSON receipt save retains all omission notes and the output SHA-256 after the dialog closes.

## Supported export subset

Native extraction maps Text, Line, Square, Circle, Polygon, PolyLine, Ink, Highlight, Underline, Squiggly and StrikeOut. Positive raw PDF rectangles and supported endpoints, vertices, ink gestures or QuadPoints are emitted, with literal plain Contents/author/subject and supported source dates, opacity, flags and border metadata. XML annotation page numbers are zero-based; the receipt retains physical pages starting at one. Source NM names are retained only when globally unique; missing/duplicate names receive disclosed deterministic source/reference identifiers. Reply links follow structural parents included in the supported subset, never inferred names. Cyclic/deeper-than-80 ancestry and groups are omitted; supported Text history state/model is emitted only with an included parent. Unknown line endings and nondefault UserUnit are unsupported.

Direct/shared instances, unsupported types/geometry/flags or literal XML values are listed as omitted. Source appearances, rich text, popup geometry, private/custom fields, layers, attachments, actions and measurement metadata are not carried over. Other viewers regenerate mapped artwork. Gray/RGB colors quantize to 8-bit RGB; CMYK/transparent/malformed colors and unmapped field names are disclosed. No source-file URL, DTD, external entities, appearance references, executable action or fabricated PDF trailer ID is emitted. Literal XML 1.0 values are escaped exactly, including CR/LF/TAB references; bad literal values omit the affected record without inserting replacement characters. If no selected annotation can be exported, nothing is saved; existing TXT/CSV/JSON metadata snapshot exports remain available.

## Boundaries and native save

The request contains exact inspected inventory SHA, ordered distinct keys and selected pages. Native reinspection checks the immutable PDF SHA and full inventory. Limits: 100 MiB PDF, 500 pages, 10,000 source annotations, 1 MiB request, 200,000 geometry coordinates, 8 MiB XML and canonical complete receipt. The XFDF route now runs only in the fixed Windows AppContainer/Job Object document-engine path: zero capability SIDs, one process, 512 MiB process/job memory, 115-second wall deadline, 256 MiB Node old-generation heap / 32 MiB semi-space / 4 MiB stack and 16 MiB individual / 64 MiB aggregate compressed-object decoding budgets. Input/request/runtime are read-only; only precreated output slots are writable. No worker-thread or direct-execution fallback remains for this route. The broker and hash-pinned engine/standalone Node runtime are packaged by the build. No engine or worker was run during this coding checkpoint; actual OS containment/security acceptance remains unverified.

Generated XML is independently parsed and matched against every mapped attribute, literal plain Contents and path child by native code. Renderer code independently checks UTF-8, output/selection/receipt hashes, selected source rows and parsed XML names/pages/plain text before exposing reviewed save. These verifier implementations are saved code, not executed compatibility evidence. The native service retains immutable output and detached report; renderer preview bytes cannot replace saved bytes. Source/session/token/generation are rechecked. Broker termination and owned profile/staging cleanup must be observed before output release and slot reuse; unobserved termination or cleanup failure keeps the XFDF service closed. Renderer departure awaits cancellation; native save picking prevents close. XFDF and receipt saves use exclusive new chosen filenames, exact extension and same-handle disk SHA verification. XFDF is export-only; it is not added to generic export IPC or openable formats.

## Remaining work

Full XFDF/FDF/BAX/BTX import/export, original appearance/private-state preservation, reusable-tool exchange, physical sheet replacement/comment transfer, original PDF permission/fidelity breadth and other document-worker OS containment and actual Revu/Acrobat/Windows sandbox acceptance remain open. Signature-bearing input can be inventoried read-only, without claiming certificate validity; encrypted input requires an owner-authorized decrypted copy. This subset advances B05/M04.06/M04.07 and does not finish those complete targets.

## Primary schema references

Independent implementation uses factual schema correspondence from these primary sources; vendor implementation code was not copied and no vendor SDK dependency was added.

- [ISO 19444-1:2019 overview](https://www.iso.org/standard/74272.html)
- [PDF.js Express XFDF annotation examples](https://pdfjs.express/documentation/annotation/xfdf)
- [iText XFDF attribute constants](https://api.itextpdf.com/iText/dotnet/7.2.4/classi_text_1_1_forms_1_1_xfdf_1_1_xfdf_constants.html)
- [Apryse Line annotation example](https://docs.apryse.com/documentation/web/guides/annotation/types/LineAnnotation/)
- [Apryse XFDF interoperability limits](https://docs.apryse.com/web/faq/annotation-xfdf-import)
- [Apryse vendor inklist/gesture example](https://community.apryse.com/t/how-to-avoid-annotationChanged-event-while-importing-existing-annotations-on-initial-webviewer-load/6459)
