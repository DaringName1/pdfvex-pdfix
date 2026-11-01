# Complete the ordinary-copy UI rule for batch tools

Owner W1 decision: ordinary copy saves have no review checkbox; preserve previews, native output checks and exclusive copies. Redact and Remove hidden data keep their confirmation.

Three batch routes still require a native payload field asserting human review: desktop/batch-bates-service.cjs, batch-compression.cjs and batch-document-actions.cjs. Merely hiding the checkbox and sending reviewed:true would claim a review the person did not make. These native files normally belong to Claude's backend lane, so Codex requests this bounded integration change.

Proposed change: save still requires the existing session/source/job token plus an exact object containing sha256, matching the prepared output's hash. Remove only the reviewed boolean requirement. UI Save is enabled only after the native-prepared result is reopened and a real preview (or decoded text) is ready. No fake checked checkbox and no automatic human acknowledgement.

Keep unchanged: immutable source grants, token ownership/lifetime, prepared output identity, output hash, current-source checks, independent PDF/text checking, destination validation, write-to-temp/disk verification, exclusive publication, keep-both collision handling, cancellation and cleanup. No sandbox, GPU, executable, permission or dependency changes. No changes to signatures, redaction, hidden-data or certificate authorization.

Files: the three native modules above, their existing native tests; batch-bates-workspace.js, batch-compression-workspace.js, batch-document-actions-workspace.js; matching UI specs and Codex robot/check callers. Scheduling, seeds, counts and reporting in the main robot stay unchanged.

Verification: existing unit tests must continue refusing absent/wrong hashes and stale source/job tokens. Use generated real PDFs in the built app: preview, cancel/save, independently read the output; Bates continues across files and skip consumes no numbers; compression retains source text/geometry; literal UTF-8 text and copy outputs match their expected bytes. Inspect screenshots at both sizes and150%text. Claude independently reviews the committed integration.
