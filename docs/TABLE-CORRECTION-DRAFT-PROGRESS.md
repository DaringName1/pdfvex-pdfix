# PDF table correction drafts — 2026-10-07

Status: implemented in source; syntax checked only. App, native picker, permission inspection, extraction and save/load runtime testing remain deferred at the user's request.

## Added scope

- The existing table extraction workspace can save a correction draft JSON copy and choose a previously saved draft for the exact original PDF.
- Version 1 persists the SHA-256 of the original source bytes, physical page, page-normalized rectangle, exact row and column edges, selectable/English OCR extraction mode, literal editable cells and boolean uncertainty markers.
- Drafts preserve work in progress. Saving a draft does not claim every cell has been reviewed. Loading clears review state and row visits; CSV export still requires visiting every row and explicitly confirming the cell review.
- Imported drafts restore page artwork and the saved grid/cells without triggering table extraction or OCR. No word geometry is persisted; changing the grid requires deliberately reading words or recognizing the scan before rebuilding.
- The source session ID is required for every native save/load call and checked against the current source object. The persistent identity uses the exact source hash so drafts survive closing and reopening the PDF.
- Native schema validation rejects unknown fields, malformed and sparse matrices, nonliteral/nonstring cell values, unsupported controls, invalid Unicode, nonfinite/unsorted grid cuts and invalid regions. Limits match the bounded table scope: 100 rows, 32 columns, 10,000 characters per cell, 500,000 total characters, physical pages 1–500 and a 2 MiB UTF-8 JSON maximum.
- Picker cancellation retains the current table and review state. Replacing dirty corrections requires a second explicit Load action. Invalid/source-mismatched drafts are rejected before mutating the displayed table.
- Native permission inspection follows the existing table CSV scope: encrypted PDFs require an owner-authorized unprotected copy. Session identity and source-byte SHA are rechecked before and after the picker.
- Saving delegates to the existing verified exclusive-copy writer; originals and existing filenames cannot be overwritten. No file contents or cells enter localStorage. Close/discard guards remain; editing geometry now marks a saved table dirty as well as stale.

## Native integration contract

`desktop/table-correction-draft.cjs` exports `createTableCorrectionDraftIO` and `validateTableCorrectionDraft`.

Instantiate the IO helper with:

```js
const tableDrafts=createTableCorrectionDraftIO({
  store,dialog,getWindow:()=>window,
  inspectSource:async(id,source)=>{
    if(securityRestart)await securityRestart;
    return pdfSecurity.inspect(id,source);
  }
});
```

Register `save-table-correction-draft` calling `tableDrafts.save(id,value)` and `pick-table-correction-draft` calling `tableDrafts.load(id)`. Wrap both in the existing `cleanupJob` source guard and `splitSaves` increment/try/finally decrement so closing the application cannot interrupt a native picker/save. Expose preload `saveTableCorrectionDraft(id,value)` and `pickTableCorrectionDraft(id)` using the corresponding channels. Save returns copy metadata or null; load returns `{name,draft}` or null. Renderer buttons remain disabled if these bridges are absent.

## Remaining adopted F17 scope

Persistent corrections are added for the existing bounded manual-grid CSV workflow. XLSX table export, merged-cell reconstruction, broad OCR languages and extraction accuracy improvements remain outside this implementation. No new dependencies were introduced.

## Validation performed

`node --check src/pdf-table-extraction-workspace.js` and `node --check desktop/table-correction-draft.cjs` passed. No new tests, app launches or runtime tool calls were performed for this feature.
