# Bates queues, combined workflows, TIFF fax and tag semantics — October 9, 2026

Integrated source and compilation milestone. No runtime/UI/PDF/TIFF/device/engine/security/performance tests, fixtures or new tests ran. No app launch/restart or installer build. Entire adopted scope remains active; no broad feature is newly accepted.

| Addition | Integrated implementation | Remaining implementation |
| --- | --- | --- |
| Multi-file Bates (F41/F27) | Native-selected immutable queue, per-file ranges, editable file order/style, continuous numbers committed only after verified saves, paired actual-page review, native new-folder saving, per-file errors/retry/skip and native identifier report. | Persistent queue/global registry, existing-ID/artwork detection, more than 100 selected pages per file and wider fonts. |
| Combined editable workflow (F28/F06/F07) | Native combination consumes trusted originals then chains editable reorder/Bates in either order, sealed intermediate/final bytes, complete source-to-final mapping, page/annotation/form/link/bookmark review and token-only native save. | Other OCR/print/general stages, durable combined definitions/in-flight resume, broader partial/duplicate/semantic PDF merging. |
| TIFF fax (F12) | Actual bounded CCITT MH/Group 3/Group 4 strip decoding, FillOrder/T4/T6 handling and existing oriented RGB PNG import. | JPEG/tiles/BigTIFF/wider color/depth/profile metadata and broader decoders. |
| Existing tag semantics (F30/A11) | Author/remove supported header IDs and rebuild IDTree, same-table header associations, Scope/spans/complete grid consistency, ListNumbering and printable leaf Form properties; reviewed preserving output and awaited cleanup. | Automatic inference, tree element insertion/move/split/merge, irregular/class/revision/namespace structures, interactive forms and semantic/standards acceptance. |

## Compilation

- 18 distinct integration files passed Node syntax checks; the final Bates fail-closed and native picker concurrency edits were checked again.
- npm run build exited 0; 308 renderer modules and fixed native helpers/document engine compiled.
- Renderer: index-By5vz7GJ.js; CSS: index-CYT7qmSe.css.
- Source snapshot SHA-256: ecbaddfd39a901260383c314c9b52edade7dc8e95d90b7910026e2fc66b76f69.
- Document engine SHA-256: 8e367351159e495981fe056a8e4941aa9f3f5a6916f9a27035fcfa80b95ac2f0, 3,549,657 bytes.
- Sandbox SHA-256: 5be85430fe3fa3e84a275cf19e7212380b84cbd4cff1ba0660e7f7692dd764bd.
- Existing Vite large-chunk warning remains; performance acceptance is pending.

Details: [Bates](BATCH-BATES-PROGRESS.md), [combine workflows](COMBINE-WORKFLOW-PROGRESS.md), [TIFF fax](TIFF-CCITT-PROGRESS.md), [tag semantics](TAG-TABLE-SEMANTICS-PROGRESS.md).
