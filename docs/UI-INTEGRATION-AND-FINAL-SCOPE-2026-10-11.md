# PDFix UI integration and complete scope — October 11, 2026

The final work order is [FINAL-IMPLEMENTATION-PLAN.md](../FINAL-IMPLEMENTATION-PLAN.md). The complete remaining-work register and machine ledger retain all 264 overlapping R/S/M/B/F/A/G/D traceability IDs, complete earlier planning text, original intake requests and the mockup. These IDs are not a count of independent features or a completion percentage. No earlier adopted feature or acceptance obligation is removed.

## Coded integration

- File/Home/Insert/Layout/Review creation toolbar with persistent quick formatting and PDF/DOCX exports, accessible tab navigation, recovery/editing holds and existing commands.
- Bounded scrolling expanded toolbar panels keep writing space available at smaller windows.
- Source comments inspect on opening; selected comment text, navigation/edit/reply actions and eligibility reasons are more visible. New comment routes to the real note workspace on the selected/current physical page.
- The existing Drawing review command is reused rather than adding a duplicate in another tool category.
- Custom document formatting now uses the actual `documentTextStyle` mark in the contained rich-document validator, matching editor/DOCX/RTF codecs.
- Native Node startup uses `--preserve-symlinks-main` for the already pinned, non-reparse main bundle. The actual failure was `EPERM lstat C:\` before the engine could start. The flag avoids that startup ancestry traversal; job-only ACLs, zero capabilities, contained token/job verification, resource limits, no-addons and no unrestricted fallback stay enforced. Broker source SHA-256: `588aa4dc3d73623fbdcf71b61f8c09ae5ea2a3691cd3fc46cdcba981d2183dbb`. [Node's primary CLI documentation](https://github.com/nodejs/node/blob/main/doc/api/cli.md#--preserve-symlinks-main).
- Comment bounds and zoom-region bounds transform all four corners through current PDF.js point conversion instead of the removed rectangle method. Rotated/cropped geometry retains source coordinates.
- Preview cleanup uses the owning PDF.js loading task rather than the removed document-proxy `destroy()` method. Root fixed review-edit cleanup; a coding subagent audited/repaired 29 calls in 11 other modules, keeping borrowed reader documents intact. [Lifecycle audit](PDFJS-LIFECYCLE-CODING-2026-10-11.md).

## Evidence and remaining checks

Focused hidden checks exposed and reproduced the startup, formatting, coordinate and cleanup failures above. Document creation, custom formatting, actual DOCX/PDF saves, minimum-window/main-screen checks, 150% UI text/contrast, PDF-only fullscreen restoration and a supported plain-comment edit/save have targeted evidence. Final rebuilt integration results are recorded in the inventory and the report linked below after completion.

The fixture is a known local PDF with a deliberately added standard Text annotation, not proof of Revu/private-format compatibility. Real Revu round trips, locked/rich/FreeText editing, replies/proprietary state, stylus pressure/palm rejection, expanded large-file editing, every other tool/input/error case, assistive technology, device/printing, clean-machine and security/corpus gates remain in the complete plan. Basic Ink remains partial groundwork for F67/R50.

No complete-product, all-features/all-files, universal size or beta-ready claim follows from these focused checks. The full UI/function matrix remains open outside declared tested cases.

## Final rebuilt checkpoint

Production build: 332 modules, renderer `index-C7qx_qDd.js`, stylesheet `index-CPcS76wh.css`; source snapshot SHA-256 `491864eba11484cdf8cfb27b8fa999f0b12398042634a7e45406b04651be12c4`. Native engine and broker were rebuilt with the declared style/startup changes. This is the on-disk build; the earlier visible desktop session was not restarted during consolidation.

[UI/function report](../tmp/ui-check-d7aad532-de00-4589-bdff-09b3c15a963b/report.json): all seven declared functional cases passed; zero renderer or contained-engine errors; fixture original unchanged. [Independent output readback](../tmp/ui-check-d7aad532-de00-4589-bdff-09b3c15a963b/independent-output-check.json) reopened both three-page outputs, confirming edited text and the added note on physical page 2; addition retained the original note. Representative screenshots were inspected.

The UI report's aggregate `pass` is **false**, because native Windows fullscreen made the temporary automation window visible (`hidden=false`). Do not call this a hidden-only pass. Future hidden-only automation must avoid native fullscreen that exposes a window, or separate that native check into an explicitly visible session. The seven functional cases and output evidence remain scoped passes.

[Current actual SW3 regression](../tmp/sw3-scrolling-28321a92-ac48-4b0e-b269-a8ed6ea543fe/report.json) passed hidden: forward/back wheel scrolling, middle/last-page jumps, selectable text, bounded live canvases, view switching and cleanup; no renderer errors. Total application RAM, rapid-scroll extremes and the full file/tool corpus remain unmeasured.

No complete feature area is certified 100% accepted. All unfinished coding, broader checks and future targets remain in the complete register.
