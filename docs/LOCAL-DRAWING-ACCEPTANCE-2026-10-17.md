# Local drawing acceptance — October 17

Tested the supplied local sample without changing its original bytes. Its name, content, screenshots and derived files are not included in this document or committed. No upload or spare-PC transfer was performed.

This sample is one page, approximately 77 KiB. It is useful everyday-workflow evidence, not a substitute for the large-drawing memory/speed matrix or a professional drawing-scale check.

| Task | Result |
| --- | --- |
| Open, scroll, page jump, zoom | Passed in hidden built Electron; first exercise 712 ms, follow-up 906 ms including navigation/zoom. These are combined task times, not isolated first-paint measurements. |
| Find | Correctly reports no selectable text. A searchable copy/OCR is needed; the visible lettering alone does not make a PDF searchable. Dad's guide now explains the next step. |
| Markup | Added a note, reviewed/saved a copy, independently read the saved annotation and page count, reopened. Passed. |
| Comments | Inspected the saved drawing and found the exact added note. Passed. |
| Scale and distance | Confirmed an exercise reference between two chosen points, repeated the distance and independently recomputed the saved JSON quantity as 100 mm. This tests mechanics, **not the drawing's real engineering scale**. |
| Printing | Prepared the current sheet and enabled the Windows-dialog button after review; stopped before opening that dialog or sending any job. Passed. Physical scale/output still needs the user's ruler/printer check. |
| Sheet sets | Saved the set, independently read its profile JSON, reviewed/reloaded it and checked the page count. Passed. |
| Comparison | Compared the original first page against the locally saved annotated revision; 898 differing review pixels reported. Same geometry, manually paired page; this is not automatic revision alignment certification. |

Both runs passed all eight tasks, with no page errors/online requests and unchanged original bytes. Both app sessions closed. The first seven screenshots and the two corrected follow-up screenshots were personally inspected; images stay local.

By-eye fixes: `1 prepared sides` becomes `1 prepared side`; `Source pages 1` becomes `Source page 1`; `1–1 of 1 sheets` becomes `1–1 of 1 sheet`. No layout redesign or new drawing capability was added. Crowded preview controls and technical measurement text remain on the agreed later simplicity list.

Reproduction: `node scripts/agent-run.mjs codex -- node scripts/check-reader-local-drawing.mjs`. Uses the supplied sample folder by default or an explicit local PDF path. Source is opened directly; only app staging and reviewed derived outputs are written locally. Receipts: `C:/Users/andre/AppData/Local/Temp/pdfix-local-drawing-rDpEWy/report.json` and `C:/Users/andre/AppData/Local/Temp/pdfix-local-drawing-7AEuYD/report.json`. Do not upload these scratch directories; they contain local drawing outputs/screenshots.
