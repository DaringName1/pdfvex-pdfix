# Owner screenshot: Markdown source covers preview

**Requests for Claude, editor lane.** Owner supplied a real-app screenshot of Markdown “Source and preview”
at 200% with the source area covering most of the preview. This is an explicit usability bug report, not a redesign.
Codex reproduced on generated Markdown in hidden built Electron and personally inspected both screenshots.
No private owner document was read. No editor/source-preview/document-zoom file was modified.

Reproduce:
```
node scripts/agent-run.mjs codex -- node scripts/check-reader-source-layout-audit.mjs
```
This diagnostic records the current defect, not a passing fixed-layout assertion. Generated fixture and profile
only; source unchanged, app closes. Final receipt BN4CKu, archived with two screenshots under
`docs/evidence/codex/markdown-layout-report/`.

At 1366x820:
- Fit width: source x242..1329, width1087; preview x797.5..1335. Overlap532px.
- 200%: source x242..1829, width1587; preview still x797.5..1335. Source also exceeds viewport by463px.
- Fit width status reports137% because it fits a210mm paper page to the entire canvas, not the source pane.

Cause from code:
- `src/document-zoom.js` DocumentZoom.sync always assigns paper width in mm and CSS zoom to `.editor-page`.
- `src/source-preview.css` gives that same element half of a split grid. Inline fixed width/zoom defeats it.
- `src/source-preview.js` setView changes layout without notifying the zoom controller.

Suggested bounded repair (Claude chooses implementation):
1. Separate source-text view scaling from physical-page scaling. A Markdown/CSV source is not an A4 sheet.
2. In source mode keep the editor box at its actual pane width, border-box, min-width0, with scrolling contained
   inside the source control. Apply chosen zoom to source font size rather than making the pane wider.
3. “Fit width” should fit the current source pane. Recompute on view-mode changes/resizes; do not fit full canvas
   then use that width inside half the canvas. Keep preview font and zoom behavior explicit/consistent.
4. Split grid columns should use bounded/min-width0 tracks; at narrow widths stack source/preview deliberately.
5. Preserve source bytes, selection, unsaved state and save/export behavior. Do not “fix” by cutting or editing text.

Acceptance: Markdown and CSV; Edit source, Preview and Split; Fit width and100/150/200%;1366x820 and800x620;
normal/150% interface text. No pane overlap, preview start visible, each long source line reachable through its
own scroll control, no unintended whole-window horizontal scroll. Check typing plus save/reopen exact source.
Look by eye at both panes and after switching/resize. Convert this reproduction into a regression after fixing.

Separate taskbar screenshot: the long full wordmark was tiny at16/32px. Codex now builds the Windows icon from
the existing document symbol, with no changes to the full in-app wordmark. See WINDOWS-BRANDING-FIX-2026-10-18.md.
Updated combined package/other-PC acceptance remains with Claude after the spare-PC run is free.
