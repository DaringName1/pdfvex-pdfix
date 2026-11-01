# PDF Home formatting: remaining writer integration

The shared Build tabs are UI work. Full Home formatting also needs real PDF output support: the current added-text model (`src/pdf-content-model.js`) and writer (`src/pdf-content-output.js`) accept only plain text, three regular font families, size and colour. Existing rich-comment editing preserves a bounded subset of an existing annotation; it cannot supply all new-text paragraph controls.

Proposed bounded change, for owner approval because the content writer belongs to Claude:

- Extend the existing added-text draft, validation, recovery and writer together; no new IPC command, process, dependency or security setting.
- Keep old plain additions compatible. Add bounded rich paragraphs/runs with explicit allowed formatting, rejecting unknown fields and excessive content.
- Support the approved Home controls for new text: font variants, emphasis, decorations, scripts, colour/highlight, paragraph styles, lists, indents, line/paragraph spacing and alignment. Never claim an existing PDF text run supports formatting that its font proof does not permit.
- Render the same validated model on the page and in the saved PDF; preserve original PDF objects and existing signed/protected-file refusals.
- Verify text and appearance from saved output, recovery, overflow refusal, cancel, originals, and four UI layouts. Add matching robot coverage before delivery.

Until that writer is connected, do not replace functional controls with enabled decorative formatting buttons or describe PDF Home as finished. Claude can implement the writer contract, or the owner can authorize Codex to make this narrow cross-lane addition.
