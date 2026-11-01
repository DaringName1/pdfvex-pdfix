# Drawing comments UI — 2026-10-11

## Scope and routes

The connected UI lives in `src/pdf-review-panel.js` and `src/pdf-review-panel.css`. There is no second comment store or simulated save path.

Opening **Review comments** / **Review drawing comments** shows the panel and loads its chosen source-page inventory automatically when no inventory is loaded. **Inspect source comments** still explicitly refreshes the source snapshot. Search, source author, physical page, type, literal state/model, sort, named local filters and the existing paged lists remain available.

Selecting a source annotation reads its full available plain text and opens its physical page through the existing `PdfMarkupNavigation.locate` callback. **Show on drawing** repeats that navigation; **Zoom to comment bounds** uses the same callback with `{zoom:true}`. Missing bounds fall back to the physical page, with visible explanatory text. The selected parent/reply/group entry starts expanded. Other thread entries can be opened or selected. Technical identity, flags, colors and preservation metadata remain available under **Source metadata and preservation limits**.

The panel heading contains **New comment**, including before an inventory exists or when filters have no matches. It calls:

```js
reader.action('markup', {
  initialTool: 'note',
  initialPage: selectedSourceComment?.page || reader.pageNumber
})
```

The coordinated reader/app/MarkupWorkspace implementation forwards these initial options into the existing note workspace. A selected source comment's physical page takes precedence; otherwise the current drawing page is used. The real note workspace owns note placement, source/recovery checks, preview and PDF-copy saving. The original source inventory does not claim to contain unsaved marks or changes made to a separate saved copy.

**Edit plain comment** and **Add reply / review entry** open the existing `PdfReviewEditWorkspace` for the selected annotation and mode. Its real flow remains: stage changes, build a new PDF copy, verify the native-reopened annotation results with the independent PDF reader, view every changed physical page, approve the exact result and save a copy. Existing portable draft, undo/redo and explicit discard safeguards remain in that workspace.

## Editing limits

Eligibility is still calculated by `reviewEditEligibility`; the panel now displays each action's reason next to its disabled button and connects it with `aria-describedby`. It does not infer editable bodies from a visible appearance or Bluebeam provenance.

- Supported existing plain bodies: Text, Highlight, Underline, Squiggly, StrikeOut, Ink, Square, Circle, Polygon, PolyLine, Line, Stamp and Caret, subject to unique indirect identity and source protection checks.
- Existing rich-text and FreeText bodies stay read-only. Eligible unique FreeText annotations may receive additive replies.
- Read-only, locked body, shared/direct identity, group-member body and PDFix-managed metadata restrictions retain the existing model's meaning. Reply eligibility is independent of body-edit eligibility; a locked body can still support an additive reply when the model/native checks permit it.
- The native edit workspace may still reject signed, certified, encrypted, XFA or otherwise unsupported PDFs and unsupported reply placement geometry. An enabled button means the annotation can be submitted to those checks.
- New notes and existing source-comment edits currently require the whole-file reader for PDFs under 100 MiB. Large-PDF inventories remain read-only. Copy permission is required. New comment additionally requires the reader's real markup callback.
- Inspection, exports, review editors and markup opening disable conflicting panel actions. New comment also rejects another open dialog. Panel actions never silently discard a staged or unstaged review draft.

## Verification and hidden UI check instructions

Agent verification: `node --check src/pdf-review-panel.js` passed. Coordinated build, desktop tests and visual checking are owned by the root agent; this document does not claim they passed.

Use the project's existing hidden Electron/Playwright harness and supported review fixtures. Keep testing in a hidden window and do not write original fixtures or save copies without the harness's temporary destination.

1. Open a PDF fixture with a plain Text/markup comment, reply/group relations and an unsupported or protected body. Open **Review comments** and wait for automatic inventory results without clicking Inspect. Verify list text, filters, author and thread contents. Click a row and verify its actual physical page and temporary drawing-location outline.
2. Verify **Show on drawing**, **Zoom to comment bounds** and return-view behavior. A no-rectangle fixture must still navigate to its physical page and show the fallback explanation. Expand source metadata and check the existing color/identity/flag fields remain readable.
3. Verify enabled plain Edit opens the existing editor in `comment` mode with the source contents. Stage a bounded text edit, build, inspect all changed-page previews and exact reopened contents, then use the existing approved save-copy path. Cancel a draft with unstaged/staged text and confirm the existing explicit-discard/keep behavior.
4. Verify Reply opens `reply` mode and requires a declared author. Confirm the parent identity is retained in exact native-reopened results. Verify rich/FreeText/locked-body reasons remain visible and body-edit buttons remain disabled. Only enable replies where existing eligibility permits them.
5. Click New comment with a source row selected and verify the real markup workspace opens on that row's physical page with **Add note** selected. Repeat with no selected row and verify the current drawing page. Place a note, enter text, preview the real annotated copy and exercise the existing save/cancel and local-recovery protections. Reopen a saved temporary copy to inspect its added source annotation.
6. Verify New comment is disabled for large/paged sources, lost copy permission or missing markup callback. Verify conflicting actions remain disabled during inspection/export/editor opening; another open dialog must prevent New comment programmatically as well.
7. Check a smaller viewport, keyboard focus, Escape/collapse, heading visibility while the panel scrolls, per-action accessible descriptions and long Unicode source/comment text. Do not assume plain-text inventory fully represents source rich text or a proprietary appearance.

Sources were frozen after the scoped UI changes and syntax check. No native engine, reader/app routing source, paid dependency or original source PDF was changed by this agent.
