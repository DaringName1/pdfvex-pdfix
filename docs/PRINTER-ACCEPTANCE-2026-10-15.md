# Epson WF-3820 — physical print acceptance

Status: prepared, not physically printed or measured. No Windows print dialog or spool job was triggered by preparing this file.

Use [the one-page Letter calibration PDF](../output/pdf/pdfix-printer-calibration-letter.pdf). It contains a 100 mm ruler, a 4 inch ruler and a 50 × 50 mm square. The PDF page is independently checked as 612 × 792 points (US Letter); its rendered page was visually inspected. This establishes file geometry, not printer accuracy.

1. Put US Letter paper in the Epson WF-3820. Open the calibration PDF in PDFix and choose Print.
2. In PDFix preparation, choose **page 1**, **Letter**, **Portrait**, **Actual size · 100%**, **8 mm margin**, one copy and **One side**. Keep booklet, tiling and multiple-pages-per-sheet modes off. The test marks are inside the margins.
3. Prepare the preview and inspect the whole sheet. Confirm the review checkbox. Only when you are ready to consume paper/ink, choose **Open Windows print dialog**.
4. In Windows/Epson settings choose the WF-3820, Letter, portrait, single-sided and actual size/100%. Disable Fit, Shrink, Scale to fit and borderless expansion. Check the driver's preview for unexpected scaling. Confirm Print yourself.
5. With a physical ruler, measure between the centers of the first and last marks: metric ruler **100 mm**; inch ruler **4 inches**. Measure the square's width and height: **50 mm** each. Optional diagonals: approximately **70.71 mm** each. Check that all text/marks are present and readable.
6. Record driver/settings, dimensions and whether anything is clipped or skewed. Report deviations over 1 mm for investigation; that is a practical diagnostic threshold, not an engineering precision guarantee. Recheck both applications' scaling before changing PDFix.

Record:

| Item | Observed |
| --- | --- |
| PDFix build/package | |
| Printer name / driver version | |
| Paper and scaling settings | |
| Metric ruler (expected 100 mm) | |
| Inch ruler (expected 4 inches) | |
| Square width / height (expected 50 / 50 mm) | |
| Missing marks, clipping, skew or other problems | |

The user must inspect and measure the physical paper. A screenshot, prepared print preview, spool acknowledgement or independently parsed PDF does not close this gate. Do not send a physical print job without the user's go-ahead.
