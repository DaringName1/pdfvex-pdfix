# Existing standard PDF callout editing — X1 increment

Status: standard-font bounded callout adapter implemented; unit, native built-app, independent saved-file robot and visual evidence below. This is a partial delivery of X1, not completion of rich-text/custom-font editing or release acceptance.

## Behavior

Review drawing comments → select a supported callout → Edit plain comment → stage the replacement → build the reviewed copy → compare original and rebuilt page → approve → save a new copy. Reopening displays the replacement body. Originals are never changed.

The existing appearance adapter now supports standard FreeTextCallout intent with explicit rectangle insets, two- or three-point leader lines, positive solid borders and black declared text. Supported endings are None, OpenArrow and ClosedArrow. It uses the existing declared standard font, size/alignment and supported background color. Text wraps inside the inset text box rather than the larger annotation rectangle. Rotated **pages** remain supported; rotated/translucent text boxes remain refused.

The annotation's original Rect, CL, RD, IT, LE, author, flags, private fields and all unrelated original objects/stream payloads stay unchanged. A new normal appearance and font object are added; only the edited annotation's Contents, M and AP fields may change. Source appearance objects stay intact. The result is reparsed natively, independently checked with PDF.js, shown side by side and reread from the actual saved file.

Malformed/outside/degenerate leader lines, tips/knees inside the text box, missing intent/insets, wrong attachment points, clipped arrows, hairline/unsupported borders, unsupported endings/colors/effects, locks, overflow, rich bodies and unsupported/custom fonts refuse the copy. There is no automatic destructive fallback to a flattened or plain replacement of rich content. Arbitrary annotations/formatting and proprietary Bluebeam appearances are not promised.

Geometry basis: [ISO 32000-1, Free text annotation dictionary, Table 174](https://developer.adobe.com/document-services/docs/assets/35e4369068f86065372c18787171a17e/PDF_ISO_32000-1.pdf). This adapter implements the bounded subset above; a standard reference does not certify arbitrary PDF compatibility.

## Checks and receipts

- Focused callout/FreeText/review-entry units: 37 pass, including 17 unsafe/unsupported callout variants, source byte/object preservation, 0/90/270-degree pages and independent appearance text extraction. Existing rich-text replies and standard review-state cases still pass.
- Two new desktop cases: successful native preview/save/reopen with independent object/geometry/glyph checks, and malformed attachment-point refusal with Save disabled/no published file/original unchanged. Initial run passes 2/2; final guard-only rebuilt repeat passes 2/2 again in 23.3 seconds.
- Final full unit suite: 355 passed, zero failed, one pre-existing jsdom-dependent editor test skipped (its app equivalent is recorded separately). This suite ran with normal Windows filesystem permissions. An earlier restricted-shell run had filesystem failures and stalled; only its positively identified Codex process tree was stopped before rerunning. No Claude process was stopped.
- Six comparison and two reply/style app cases pass with the plain-language result update and bounded comparison-open diagnostic helper. Two callout cases in that intermediate combined run were refused **before launch** by the source-snapshot fence after final native guards changed; rebuilt rather than bypassing the fence.
- Final robot action passes at 800x620 and 1366x820, each at 100%/150% interface text. It drives visible roles/names only, saves/reopens and verifies the saved PDF using inspectPdf, PDF.js annotations and pdf-lib source-object comparisons. No renderer success message is the verifier.
- All 16 final matrix screenshots personally inspected: staged changes, source-preview heading/state, rebuilt preview and saved result. At small sizes the dialog and individual page previews scroll; not every source-artwork area is visible in one capture. Internal object codes were removed from results, and technical confirmation wording changed to “Checked comment changes” and a plain explanation.
- Earlier exploratory receipts ALuUD0 (ambiguous robot status selector), ZLULIN, EydHyk, 0KstNG and v1gVaF were also inspected: 17 PNGs total. ALuUD0 saved successfully but its robot assertion matched three status elements; the final action filters by visible Saved text. These are not final-copy UI acceptance receipts.

Final matrix roots: JHZGCN (800/100%), 6c3GfX (800/150%), MZWBA1 (1366/100%), 1ta2Qj (1366/150%). All four reports and their 16 screenshots are preserved in [the Drive evidence directory](evidence/codex/) with checksums in [the manifest](evidence/codex/manifest.json). Each app closed with zero recorded page errors. These are generated fixtures in the hidden built app, not real outside-software, spare-PC or packaged acceptance.

## Robot integration for Claude

Import `reviewActions` from `scripts/user-robot/actions-codex-review.mjs` and append it when ready. The action contract is `{name,weight,run(page,ctx),verify(ctx)}`. It needs temporary `ctx.files`, `goHome`, `chooseFile`, `saveAs`; optional `capture` records screenshots. It generates its own PDF fixture using the committed test helper and never uses a personal drawing. No change was made to Claude's robot.mjs.

Local opt-in command (under the run lock): set PDFIX_ROBOT_REVIEW=1 and PDFIX_ROBOT_UI_CONFIG to 800,620,1 or another recorded configuration, then `node scripts/agent-run.mjs codex -- node scripts/check-reader-robot-actions.mjs`.

Cloud execution, next spare-PC action inclusion and exact release-package checks are still Claude's integration follow-up. Rich-text bodies and custom-font adaptation remain unfinished X1 work. No new workspace, Bluebeam expansion, dependency, physical print, production GPU/security setting or user's personal file was changed.
