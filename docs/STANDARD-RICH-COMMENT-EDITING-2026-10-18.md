# Existing formatted PDF comments: first safe increment (October 18, 2026)

This is part of X1, not completion of all rich-text/custom-font editing. Standard callout editing landed in
233506e. This increment edits the body of one uniformly styled FreeText paragraph using a supported standard
font, without dropping its rich-text structure. It is not a formatting toolbar or arbitrary rich-text editor.

## What is supported

A bounded inert XHTML body with one paragraph and one chain of spans, with matching plain Contents text.
Helvetica/Arial, Times/Times New Roman and Courier/Courier New declarations must agree with the source's
standard font, size, weight, slant, alignment and gray/RGB color. Supported style declarations are retained.
The existing FreeText appearance adapter still validates font resources, geometry, border and character fit.
A supported standard callout uses the same previously checked geometry rules.

Editing updates Contents, modification date, the selected normal appearance and that selected comment's RC
rich-text field. The rich-text tree is serialized with escaped literal replacement text; a structure/style
seal is checked before and after. Every other original object and retained annotation field is checked on
independent reopen by the writer. Old appearance objects remain intact; the original source is not overwritten.
The optional inventory capability is advisory: the native writer re-reads and revalidates the source itself.

Mixed runs/paragraphs, custom or embedded fonts, default rich styles, unsupported decorations, stale plain/rich
text, unsafe XML, excessive input, unsupported characters, locks and overflow remain refused. No flattening or
font substitution fallback is used. XML declarations/entities that can fetch content, scripts and active
attributes are not accepted. The XML parser is an existing dependency; no dependency or sandbox change was made.

## Checks and their limits

- Full unit suite: 361 pass, zero fail, one existing skip (362 tests). Six new units include literal escaping,
  malformed/active XML and style refusal, source/model/native output validation, retained-object equality and
  PDF.js appearance-text readback. Related callout/FreeText cases also pass.
- Built hidden Electron app, through agent-run: six cases pass in 56.2 seconds across drawing-richtext,
  drawing-callout and drawing-review-styles. Rich main path saves/reopens with independent source hash, page,
  artwork, rich field, annotation appearance text and original-object checks. Unsupported rich formatting is
  disabled, creates no output and leaves the original byte-identical. All apps close; no captured page errors.
- Robot: actions-codex-richtext.mjs exports richTextActions. Its verifier compares the saved rich field directly
  with the generated fixture's expected replacement (not a production-parser verdict), and independently reads
  the PDF and original object graph. It is opt-in in check-reader-robot-actions.mjs via PDFIX_ROBOT_RICHTEXT=1.
- Final by-eye matrix: BK70Id (800/100%), yDWe0Z (800/150%), Glv0fI (1366/100%), nz4Epi (1366/150%).
  All four saved-file actions pass with zero page errors and clean close. All 24 final screenshots were personally
  inspected and archived under docs/evidence/codex/richtext-ui; receipts and hashes are in its parent manifest.
  Opening instructions now fit a short explanation, with the full limits under Editing limits and draft files.
  Each action checks Enter to expand and Space to collapse, before editing and saving. Earlier 24 screenshots
  revealed the dense policy text; the final generated fixture declares its yellow background explicitly.
  This is proof for these captured states, not every PDF or outside viewer.
- PDF.js's separate Node annotation extractor prints an XFA rich-text parsing warning on this generated fixture;
  its plain comment and normal-appearance text checks pass. No browser page error occurred. That warning is not
  proof of arbitrary outside-reader rich-text compatibility; real outside-software acceptance is not claimed.

Cloud upload/two clean runs, Claude's spare-PC inclusion and exact-package acceptance remain pending. Custom
fonts and mixed formatting remain X1 work. Long-session private memory remains A-R2/X6; this change does not
claim to fix it.

## For Claude

Import richTextActions from scripts/user-robot/actions-codex-richtext.mjs into your robot only when ready.
Include tests/helpers/review-richtext.cjs and review-freetext.cjs with the source robot runner. The context
contract is the same as reviewActions: files, goHome, chooseFile, saveAs, optional capture. No changes were made
to robot.mjs, your UI/editor files, production graphics settings, package layout, or the spare PC.
