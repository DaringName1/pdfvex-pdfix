# Reader UI and matching robot checkpoint — October 19 evening

This follows `a76a22a`. The UI and `scripts/user-robot/actions-codex*.mjs` now use the same eight groups. Claude can copy the complete action set and re-enable the Codex lanes. This is local built-app evidence, not a new package or cloud acceptance.

## What changed

| Before | After |
| --- | --- |
| Drawing clicks could precede the rendered measurement surface | The tool waits for a rendered page; the action waits for stable visible geometry. Saved JSON quantities are independently recomputed. |
| Print was a narrow settings wall with the page below it | A bounded settings panel sits beside the page preview at both window sizes and text scales. |
| Changing pages-per-side or tiling only cleared the preview | Both request a new automatic preview, just like paper/orientation changes. |
| Large-text Compress controls overflowed; the page shrank to a strip | Settings scroll beside a usable page; controls fit without sideways scrolling. |
| A small comment proof repeatedly resized while its status wrapped | The proof has stable dimensions; navigation and one flat Preview options list remain available. |
| A test could mistake the reopening reader for the old menu | The helper waits for visible navigation before choosing the current or legacy route. XFDF then saves, imports and reopens successfully. |
| Process ownership followed parent PID alone | Creation times must also fit the parent-child relationship, so a recycled parent PID cannot adopt an older unrelated process. Forced cleanup still fails the check. |
| Template instructions incorrectly said applying never prepared a preview | Instructions now describe automatic preparation and a separate Save step. |

## Evidence

All generated receipts, screenshots and example outputs below are in `docs/evidence/codex/reader-ui-robot-followup/`.

| Screen / tool | Result | Independent evidence |
| --- | --- | --- |
| Reader/search/bookmark, markup, Pages rotate/delete/extract/combine | Passed in the earlier six-action session | `a76a22a` records `pdfix-codex-robot-5HkLlG`; saved page counts, rotation, text and annotations checked. |
| Drawing calibration / measurement / ledger review | Passed | `drawing-robot/report.json`; saved JSON source identity, reference points and 100 mm quantity recomputed; two screenshots personally viewed. |
| Eight toolbar groups / Find a tool | Passed | `toolbar-drag-robot/report.json`; traverses all groups, searches, checks Escape focus and saves an exact unchanged copy. |
| Thumbnail drag and saved arrangement | Passed | Same robot receipt; saved page identities, comment/link dictionaries and bookmark target checked. Screenshot personally viewed. |
| Pages thumbnails and saved result at 1366×820 / 800×620, 100% / 150% text | Passed with vertical scrolling | `pages-four-config/report.json`; canceled save and independent page/comment/link/outline/metadata retention. All eight screenshots personally viewed. The small large-text view requires scrolling to the optional output preview. |
| Complex preserving reorder | Passed for the generated fixture | `pages-complex/report.json`; actual attached stream, form value, calculation action/order and tag catalog objects retained, original unchanged. This is not PDF/UA or real signature validation. |
| Compress / numbers-stamps / Print four-configuration matrix | Passed | `live-previews/report.json`; saved compression size/text and numbering on both pages, automatic orientation and pages-per-side updates, canceled print stub and clean exit. All twelve screenshots personally viewed. |
| Number and stamp robot | Passed | `stamp-robot/report.json`; each of three saved pages contains its own number plus APPROVED. Four-concurrent-robot spare-PC load remains unverified. |
| Advanced editable markup proof / save / reopen / annotation print choices | Passed | `tests/desktop/markup.spec.js` first case; annotated and edited copies plus screenshot under `markup-preview/`. Saved field and foreign/source comments survive. |
| FreeText body / additive reply | Passed locally, two cases | `tests/desktop/drawing-freetext-reply.spec.js`; native saved-output/private-data/appearance assertions. No new cloud result. |
| XFDF export / linked Unicode import / reopen | Passed after test-helper race fix | `tests/desktop/drawing-xfdf.spec.js`; literal XML parsed independently; saved parent/reply/state and original private data checked. |
| Saved decoration style / sparse pages / restart | Passed locally | `drawing-review-styles.spec.js` first case; disk-backed template, unchanged unselected page stream and original note, saved numbers/header/footer/stamp reopened. |
| Focused units and save faults | 54 passed | `unit-checks.txt`: preservation, preview scheduling, keyboard, process ownership, staged publication, cancellation, real Windows locks, injected disk-full/missing folder, competing saves and child termination. |

One earlier matrix failed because a child required forced cleanup (`preview-exit-failure.json`). The receipt did not identify that child's type, so its precise cause is **unproven**. Ownership was subsequently hardened and richer failure diagnostics added; the final complete matrix exited cleanly. This does not close the historical graphics/launch-cascade issue by itself.

The template wording correction followed the twelve-image matrix; its saved-style restart regression passed afterwards. Earlier screenshots retain the old notice for traceability.

## Requests for Claude

- Copy all matching `actions-codex*.mjs`, including `actions-codex-extra.mjs`, rather than individual old helpers. The two new opt-in actions are named `reader: use all eight tool groups and Find a tool, save an unchanged copy` and `pages: drag a thumbnail and retain comments, links and bookmarks`.
- Keep edit-copy under Export in the shared tool registry; the reader already routes `onEditCopy` there. Use the existing callbacks for your in-place tools.
- Update your robot/editor/image print checks to automatic previews / Refresh preview. Continue the Home and All tools migration using the shared names.
- The shared toast still covers tabs/zoom while displayed; visible in the screenshots. It belongs to the shell.
- The new shared structure inventory's recursive field/outline/name-tree traversal needs visited-reference/depth/total-node guards before use on hostile input. Codex left this integrator-owned helper unchanged and did not count it as hostile-file evidence.
- Upload and obtain two clean full cloud runs, then build the clean committed package. Codex has not uploaded or used the spare PC.

## Still open

1. A-R2: the prior 94-minute normal-graphics memory gate failed. No new full soak completed here; no threshold relaxed or production graphics change.
2. Remaining robot breadth: Bates, print marks, thin lines, read aloud, layers, accessibility/tag reports, preflight, FDF, portfolio/attachments, cleaning/repair, certificates, geospatial, blank-page review and document workflow still need their own verified actions. Existing per-tool tests do not substitute for robot coverage.
3. Full hostile corpus, every save variation and real outside-viewer/physical-printer acceptance remain open, as recorded in the V1 audit.
4. UI refinements remain: prominent template library, crowded measurement settings and the smallest advanced comment proof. This checkpoint does not claim a complete fresh by-eye tour of every Drawing/Pages dialog.
5. Cloud/spare-PC acceptance and the combined release remain Claude's gates.
