# Rotated and non-unit text selection — 2026-10-04

Source inspection found two alignment defects: PDF.js supplies text-layer spans in unrotated coordinates and sets data-main-rotation, but PDFix's reduced stylesheet omitted the required 90/180/270-degree container transforms; CSS total scale also ignored page UserUnit. Both could separate selection rectangles from rendered artwork.

The reduced, attributed stylesheet now contains the installed PDF.js rotation transforms and explicit scale-round defaults. Single-page, continuous/facing and table-extraction views set total scale to viewport.scale multiplied by viewport.userUnit. Multi-page geometry retains the source UserUnit and stops forcing rotated text layers to the canvas's swapped dimensions; PDF.js sets their unrotated dimensions. Ordinary standard-unit pages retain their existing scale.

Table preview text failures now retain their explanation and cancel owned text layout while leaving local region OCR available. These are source-based fixes for concrete geometry omissions, not evidence that every PDF selects correctly. Font shaping, vertical/RTL text, unusual clipping, reading order, complex layouts and real-file selection acceptance remain open. No runtime tests were performed.
