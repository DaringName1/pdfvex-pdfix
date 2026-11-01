# Large-scan lower-detail fallback proposal

**SUPERSEDED for beta, owner October22:** no Windows renderer before beta. Raise input cap100million now and show the exact on-page memory refusal on oversize/render-memory failure. Native lower-detail proposal is deferred after beta (SHARED-PLAN2.36). Earlier approval-pending wording below is historical proposal text.

Owner approved 100 million input pixels on October 22 with two conditions: lower-detail display + plain message above the cap or on memory pressure; Claude tests the private drawing locally and a generated large scan on the spare PC before beta. Approval does not mean those tests have passed.

## Why a second rendering path is needed

PDF.js rejects an oversized embedded image before it resizes the output canvas. Lowering zoom or the canvas limit alone does not recover the image. Its current worker can omit the image silently even with stopAtErrors. The existing contained qpdf helper extracts PDF pages but does not paint them. Do not lift the production cap until this fallback is working.

## Proposed implementation (architecture approval pending)

Use the Windows-provided Windows.Data.Pdf renderer in a new fixed helper, inside the existing AppContainer/Job Object model. No downloadable renderer/library, network access or unrestricted parser. Microsoft documents a bounded destination size in PdfPageRenderOptions and RenderToStreamAsync. Compatibility/isolation of this API inside our actual AppContainer must be demonstrated; a compile or an unrestricted test does not prove that.

- New native source/build helper, pinned source + binary manifest; stage only the selected original PDF (or an existing extracted page in paged mode), fixed request and fixed PNG output. No general commands, arbitrary paths or process launching.
- Maximum input100MiB, output4million pixels /4096px per edge /20MiB encoded, one request at a time. Keep the existing512MiB process and115second watchdog; do not increase or disable them. Explicit cancellation on page navigation, close and renderer loss; stale results discarded.
- Reader detects oversized image declarations using contained inspection; size/memory failure invokes the fixed lower-detail request once. Both successful lower-detail result and refusal carry a plain, persistent page message. Render allocation failures retry smaller output once, never loop.
- Validate PNG signature, dimensions, output length and original-source hash before displaying. Preview is transient, never substituted into saved PDFs. Existing original/annotation saving remains unchanged.
- Message when successful: This scan is shown at lower detail to save memory. Your original is unchanged. If both bounded renderers fail: This scan could not be displayed with the available memory. Your original is unchanged. Close other documents and try again. Never label white/partial artwork as a complete successful page.
- Shared integration: desktop/native-sandbox.cjs + broker profile, desktop/main.cjs/preload.cjs (Claude currently editing main shell UI app.js, leave it alone); build script and reader/image policy modules. Coordinate shared changes with Claude.

## Acceptance checks

Generated1M/20M/80M and >100M scans, one-bit/colour/JPEG, rotated/cropped pages, mixed text plus image, genuine blank page; actual artwork pixel checks. Inject allocation failure, helper memory limit, timeout, cancellation and stale page result. Verify navigation/markup save/reopen and exact original bytes; every preview must stay under output bounds. Check blocked-network/file access and owned-process cleanup. Screenshots personally reviewed at both sizes/150%. Real memory exhaustion may kill a renderer; recovery path needs separate testing and must not interfere with unsaved work.

Claude must test the private owner's drawing LOCALLY without adding it or a screenshot of its content to git, then generated large scans on spare PC before beta. Codex does not use the spare PC or upload private inputs.

Sources: https://learn.microsoft.com/en-us/uwp/api/windows.data.pdf.pdfpage.rendertostreamasync and https://learn.microsoft.com/en-us/uwp/api/windows.data.pdf.pdfpagerenderoptions
