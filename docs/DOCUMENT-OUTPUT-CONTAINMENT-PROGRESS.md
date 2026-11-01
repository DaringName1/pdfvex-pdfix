# Document PDF output containment

## Scope implemented

The main-process `DocumentPdfService` retains the hidden sandboxed BrowserWindow, local print HTML route, embedded-image decode checks, layout, rich header/footer bands, page numbers, and Chromium `printToPDF` creation. The PDF reopen check moves into the fixed `document-output-inspect` child operation. The main process does not import `pdf-lib` or parse generated PDF bytes on this route, and no unrestricted fallback exists.

The engine dispatch and containment allowlist now register that fixed operation with empty operation options. Main creation waits for the generic restart helper, renderer-loss recovery disposes the old service before replacement with its saved options, before-quit disposal starts termination, and the main/security status surfaces report the output-inspection service. These integration edits are provided by the root task.

`document-output-codec.cjs` opens generated output only in the contained child. Its inert inspection records version, source SHA-256, exact byte length, 1–500 pages, and one sequential MediaBox record per page. Every coordinate must be finite, MediaBox origins stay within ±10,000,000 pt, and widths/heights stay within 100–2000 pt. Input remains limited to 100 MiB.

`document-output-validation.cjs` validates exact object keys, exact source SHA-256/byte-length binding, page count, ordering, and all geometry without a PDF parser. The service validates child output through `ContainedServiceContext`; the document export checks the inspection again and hashes its retained print bytes again before returning a copy. The inherited broker validates its immutable request/result envelope, observes process exit, and cleans staging before output release.

## Cancellation and cleanup

The document service exposes saved constructor options, asynchronous status, cancel, and dispose for the main lifecycle/restart helper. Its document job remains active through render completion, inspection, and cleanup. Cancellation or the 60-second document deadline closes the hidden window and immediately starts contained verifier cancellation; release waits for that cancellation and the pending render pipeline to settle. Every awaited render step checks the job fence before starting subsequent work. Late bytes cannot start inspection or escape as a return value, and retained print buffers and discarded result copies are cleared. No replacement job can overlap a pending render or unsafe verifier.

Window destruction is checked with `isDestroyed`. Unobserved window cleanup, contained termination, or staging cleanup keeps the document service closed and makes disposal reject, preventing the generic restart helper from replacing an unsafe service. A canceled HTML route no longer exposes its job document; completed job HTML and byte references are cleared.

Empty rich band paragraphs now produce `<br>` even when the model contains styled runs whose texts are all empty, preserving blank paragraph spacing.

## Limits and verification

This is generated-output page/geometry inspection, not comprehensive PDF conformance, accessibility, text fidelity, security sanitization, or preservation validation. Chromium printing remains a sandboxed renderer operation. Other parser/writer routes are outside this change.

This pass uses source review, parser-import searches, whitespace/conflict-marker checks, and passing `node --check` syntax checks of all four implementation files only, as requested. The Git diff check was unavailable because this directory was not recognized as a Git worktree. No tests, application runtime, print/export acceptance, cancellation timing acceptance, or release build are run by this subtask. If Electron leaves a print/load promise unsettled after window destruction, the active slot remains occupied and cancellation/disposal waits; it does not release output or permit another export. Runtime acceptance and the final pinned engine deployment remain separate work.

## Parent compilation evidence

The parent combined build succeeded October 7 with 264 renderer modules and contained engine SHA-256 `63189581f2bd6c67dee0c126c465cee9575ecf374e27b8e2a29d5af2dfb98030`. All four changed output-containment CJS files passed source syntax checks as part of 36 changed-file checks. No engine job or runtime acceptance test was executed. The existing open app was kept running without restart.
