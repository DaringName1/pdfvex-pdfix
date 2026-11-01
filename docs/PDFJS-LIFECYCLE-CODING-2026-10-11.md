# PDF.js proxy lifecycle repair — October 11, 2026

Installed PDF.js 6.3.289 document proxies have `loadingTask.destroy()` rather than a public proxy `destroy()`. Direct proxy cleanup could throw and prevent a preview/workspace from closing. This change routes audited PDFDocumentProxy cleanup through the root-owned `destroyPdfDocument` helper in `src/pdf-document-lifecycle.js`.

Each module imports `destroyPdfDocument` from `./pdf-document-lifecycle.js`. Only the confirmed proxy calls below changed. The existing await/catch/cleanup-array behavior, cancellation ordering, native token discard and source ownership remain in place.

| File | Confirmed proxy origin | Calls changed |
| --- | --- | ---: |
| `src/document-workflow-workspace.js` | Local `doc` from output loading task promise; `this.outputDoc` retains that proxy | 4 |
| `src/pdf-bookmark-workspace.js` | Local `doc` from `this.loadingTask.promise`; retained `this.previewDoc` | 4 |
| `src/pdf-combine-workspace.js` | `output` from local output loading task promise; `source.doc` from task returned by this workspace's `pdf(bytes)` | 3 |
| `src/pdf-comparison.js` | Stale local `doc` returned by Promise.race with the `pdfjs.getDocument` task promise | 1 |
| `src/pdf-decoration-workspace.js` | `this.docs` resolves original/output loading-task promises; cleanup iterates proxy `doc` | 1 |
| `src/pdf-fdf-import-workspace.js` | Local `doc` from this output loading task promise; retained `this.outputDoc` | 2 |
| `src/pdf-page-order-workspace.js` | Own `sourceDoc` from `this.sourceLoading.promise`; own outputDoc/local doc from output task promise | 4 |
| `src/pdf-sanitize-workspace.js` | `this.previewDoc` resolves this workspace's output loading-task promise | 4 |
| `src/pdf-tags-workspace.js` | Local `doc` from this loading-task promise; retained previewDoc captured for cleanup | 2 |
| `src/pdf-takeoff-workspace.js` | Local `doc` from this output loading task promise; retained `this.outputDoc` | 2 |
| `src/pdf-xfdf-import-workspace.js` | Local `doc` from this output loading task promise; retained `this.outputDoc` | 2 |

Total: 29 cleanup call sites across 11 modules.

## Ownership and retained cancellation

- FDF, XFDF and takeoff `sourceDoc` aliases the existing reader's document. No cleanup of those borrowed source documents was added.
- Page order creates its own source PDF through its `pdf(bytes)` method; its sourceDoc cleanup is therefore routed through the helper.
- Combine independently opens source bytes and owns each `source.doc`; source release still cleans only those owned documents.
- Comparison `this.tasks` contains loading tasks, including password and timeout cancellation. Their direct `task.destroy()` calls remain valid and unchanged.
- Loading-task destruction remains unchanged in every module (`loadingTask`, `sourceLoading`, `outputLoading`, decoration `loadingTasks`, combination `jobs`). Worker, render cancellation and unrelated editor APIs were not changed.
- Root owns lifecycle changes in the reader/review/navigation modules and the helper implementation. This repair does not edit those files.

## Verification

All 11 edited JavaScript modules passed `node --check`. A follow-up static audit listed every remaining `.destroy()` in these modules and confirmed they operate on loading tasks. No tests or production build were run by this agent, per root coordination.

Root's integration checks should exercise build, invalidate/rebuild, cancel, stale-completion handling, and close in the affected previews, confirming the original reader stays usable and dialogs close without PDFDocumentProxy `destroy` TypeErrors.
