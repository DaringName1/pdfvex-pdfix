# Reader one-place UI integration — October 19, 2026

Owner approval: UI-WALKTHROUGH-2026-10-18.md section9. Codex is implementing the reader toolbar, Comment, Pages and live previews in that order. This supersedes the prior UI freeze for this approved work only. Bluebeam and add-ons stay deferred.

## Requests for Claude

- Please fetch the spare-PC run3 robot failure logs for numbering/stamping seeds31072,31107,71179,31194,31255,31434,51219,51236,31470 and Pages readiness failures. Do not stop its reserved run. Codex has not accessed the spare PC.
- Please provide the shared tool-name list/module export contract. The reader currently retains existing button names and action IDs so native callbacks and safety checks stay intact. Its eight group names/order are exactly View, Comment, Edit, Fill & Sign, Pages, Protect, Measure, Export.
- New reader module: src/pdf-reader-toolstrip.js. Existing callbacks onExportImages, onEditContent, onForms, onCreateForms, onRedact, onCompress, onOrganize, onSheetSet, onCompare remain the plug-in entry points. Please keep these callable while making your tools in-place.
- The reader moves actual shell PDF-tools buttons into its groups (security report/certificates to Protect, OCR/content to Edit, text document copy to Export), retaining existing callback/permission state, then removes the obsolete shell menu. Edit-content duplicate is collapsed to one control. Please stop constructing that menu once equivalent callbacks are supplied directly.
- Missing direct reader callback needed: onProtect for the existing password workspace; onFindTool for the shared Ctrl+K/Actions search; named shared registry for tool captions. Expose these instead of introducing another menu. Existing reader search currently filters its own available controls and is transitional until shared search integration.
- Old app checks/robot actions that click Tools & view or collapsed group summaries require migration to the eight real tabs. Codex will migrate its own helpers/actions; please migrate your check-integrated-ui path to Comment > Review drawing comments. Main reader no longer has a visible legacy menu; private compact preview readers temporarily retain their compact controls until converted.

## Increment status

1. Eight groups, buttons, side options, search, shell-menu relocation: implemented; first hidden built-app four-configuration output test passes. Screenshot review caught a large-text short-window problem; fix undergoing verification. Not a final UI acceptance claim.
2. Comment in place/direct tools/on-page typing: next.
3. Page thumbnails/drag/preserving default reorder: next.
4. Automatic Compress/decoration/Print previews: next.

No source changes to Claude's tools, shell or shared desktop files by this increment. No production GPU/security settings changed. A-R2 memory remains open; prior FreeText wording/XFDF wait fixes still need fresh cloud confirmation after Claude upload.


Update: the shared registry is now consumed directly, and hasToolStrip plus onProtect/onFindTool/onSecurityReport/
onCertificates/onOcr/onEditCopy are implemented on the reader side. Please commit registry with your shell work.
Source callbacks stay yours; query forwarding onFindTool(query) and any missing rare-tool captions stay requested.
Core Comment typing now has4configuration save/cancel proof plus saved-text re-edit/header save; stamps and source
review still use their existing surfaces pending the remaining UI steps. Robot/tests migration is ongoing.


## October19 matching UI/robot checkpoint (A: urgent integration)

Reader/Comment/Pages robot navigation now uses the eight tabs and direct Comment buttons; Pages tasks use the inline Organize PDF pages region. Extract opens Page options first. Page saves wait for completed disk verification, not just file existence. Review/rich/mixed-text tasks use Comment. Export's editable-text-copy callback is explicitly placed under Export to match the existing shell robot/password check; the shared registry currently calls its group Edit, so Claude should move that registry entry to Export. Callback captions and all other grouping use the shared registry.

| Item | Evidence / honest status |
| --- | --- |
| Reader + markup + Pages rotate/delete/extract/combine robot tasks | Six pass in one hidden built-app session; each saved file independently checked. Receipt pdfix-codex-robot-5HkLlG. |
| Drawing robot | Menu migration matches; first run exposed a click before measurement readiness. Button now waits for rendered Page view and driver uses Fit page. Follow-up app proof pending the shared run lock. |
| Thumbnail drag / preserving default reorder | Four size/text configurations pass, including canceled save; original page object references, comment/link objects, outline target and metadata independently retained. Eight screenshots personally viewed. Generated evidence in docs/evidence/codex/one-place-pages. Badge placement/lazy-image screenshot timing subsequently improved; final new capture pending. |
| Automatic Compress / numbering / Print | All three update automatically at four configurations; compressed/numbered saved PDFs independently reopened; canceled print uses a recording stub, no physical printing. Twelve screenshots viewed in docs/evidence/codex/live-previews. By-eye follow-up: Print preview is below settings, and Compress preview is tiny at800x620/150%; these are not visual acceptance passes. |
| Existing source comments / FreeText / XFDF / recovery | Four affected built-app regressions pass. Closing inline Comment now clears its temporary input lock; the old lock made later tools unclickable. |
| Advanced five-mark proof preview | One existing regression still fails from a measured201/215px height oscillation (horizontal scrollbar track). A bounded preview track fix is implemented; rerun pending the shared run lock. Do not report a full desktop-suite pass. |

Next: finish matching Drawing/robot confirmation, final thumbnail captures, advanced-preview repeat; then improve Print/Compress small-window layout, flatten private preview menus, and add the requested robot coverage. A-R2 remains failed/open. No new90-minute soak, spare-PC access, cloud upload, real printing or release package performed. Claude's clean-copy build and two consecutive cloud runs remain separate gates. Broader V1 save/hostile-file audit stays open; earlier generated fault evidence remains valid for its stated routes.

Requests for Claude: copy the complete matching actions-codex*.mjs set with this UI checkpoint, not an older isolated helper; migrate robot.mjs/document-print.spec.js/images.spec.js from Prepare preview to Refresh preview (previews now start automatically). Please move edit-copy in the shared registry to Export. Existing Home/All tools routes must open the current reader before calling tools if they should use the in-place mode. Source shell/shared desktop code was left alone.


## October19 evening — matching robots and preview follow-up

The core seven reader/markup/Pages/Drawing actions now have built-app saved-output proof with the eight-group UI. The urgent matching checkpoint is a76a22a; copy the complete actions-codex*.mjs set. Two more opt-in actions cover all eight groups/Find a tool and thumbnail drag with retained comments/links/bookmark destination. Print and Compress now put settings beside the preview; print imposition changes refresh automatically; private previews have one flat options list. The advanced five-mark proof regression and XFDF reopen now pass.

Detailed per-screen status, before/after list, generated outputs and limitations: [READER-UI-ROBOT-CHECKPOINT-2026-10-19.md](READER-UI-ROBOT-CHECKPOINT-2026-10-19.md).54focused unit/save-fault cases pass. Four-configuration live-preview and thumbnail checks pass; all their final PNGs personally viewed. One preceding preview run needed forced process cleanup and remains recorded as failed; the complete final run exited cleanly. Cleanup ownership now also rejects pre-existing processes with a recycled parent PID. No cloud/spare-PC/package/physical-print acceptance claimed.

A-R2 remains failed/open; no new full soak or graphics setting change. Remaining broad robot coverage and audit cases are listed in the checkpoint. Requests for Claude: shared registry edit-copy under Export; copy current full action set; migrate your preview names; move the shell toast away from controls; bound recursive shared structure inventories before hostile-file use; upload and obtain two clean cloud runs. Spare PC untouched.


## October20: Home quick tools and matching coverage

Home/More toolbar ready for integration: all ten approved Home entries call existing tools; source Find/Print and Save callback retain permissions. More closes after tool selection; layers/dialogs restore visible focus. Registry unchanged. Home IDs for Claude: read, highlight, note, edit-content, ink, fill-sign, organize, find, print, save-copy.

Evidence: docs/evidence/codex/home-coverage-2026-10-20/. All18new actions pass at both sizes,60keyboard states pass, four toolbar configurations pass; units474pass/1skip. Migrated desktop33/34, corrected old outline route then focused3/3paged outline/search pass. No cloud/spare acceptance claimed. New18actions promoted into additionalActions; core7 unchanged. Copy complete actions-codex*.mjs set.

Final capture-by-capture visual review remains pending; limits in READER-REMAINING-PROGRESS-2026-10-20.md. Shared toast obscures top controls at800/150 (request for Claude). Area-selection disappearance reproduced in2/3reader rectangle tests and is next. No spare-PC use, upload, printing, real signing or production graphics/security change.
