# Bounded multipage TIFF decoder progress

The TIFF path now has a real TIFF 6 directory parser and strip decoder in `desktop/tiff-codec.cjs`, parent receipt/framing checks in `desktop/tiff-validation.cjs`, a source-bound contained service in `desktop/tiff-service.cjs`, and a page-selection workspace in `src/tiff-workspace.js` and `.css`. Shared routing, IPC and contained engine dispatch are integrated by the parent workstream.

## Supported subset

- Classic TIFF 6, either endian, multiple linked image directories, orientation 1–8 normalized into page PNG pixels.
- Unsigned grayscale (WhiteIsZero/BlackIsZero) and palette pages with 1, 4 or 8 bits per sample; chunky RGB with 8 bits per channel.
- Uncompressed strips, PackBits, TIFF LZW with the TIFF early code-width transition, and zlib Deflate tags 8/32946. Horizontal predictor 2 is accepted for supported 8-bit LZW/Deflate strips.
- Actual RGB PNG encoding using Node's bundled zlib and PNG chunk CRCs, without a paid engine or newly installed dependency.

BigTIFF, tiles, separate-plane samples, alpha/extra samples, signed/float samples, higher bit depths, fax/CCITT and JPEG compression, CMYK/YCbCr/Lab and other photometric modes are explicitly unsupported. Unsupported directories remain visible with a reason and cannot be selected for output. This is a subset decoder, not a claim of complete TIFF support or visual/color equivalence. Color profiles, physical resolution and metadata are omitted. Output remains image-only without OCR text.

## Containment and bounds

Only fixed `tiff-inspect` and `tiff-page` operations are used. The codec has no filesystem or network access interface and accepts byte arrays with an optional abort signal. The service requires an already retained source ID, TIFF extension, byte array and matching SHA-256 fingerprint; it does not accept renderer file paths. There is no direct decoder fallback in the parent or renderer. The native contained runtime must be rebuilt and verified before these operations can run.

Input is limited to 100 MiB, 100 directories, 1,024 entries per directory, 100,000 values per interpreted tag, 16,384 strips per page, 8,192 pixels per dimension, 16 million decoded pixels per page and 64 million supported pixels across the inventory. Each strip is decompressed into an exact declared row budget, with at most 64 MiB decoded page bytes. PNG output is at most 32 MiB per page. A 30-second codec deadline supplements the native broker's wall-clock/termination limits. Cancellation clears retained inspection and PNG copies, awaits the active job and observed broker cleanup, and throws on an unsafe termination or cleanup failure. The workspace preserves a cancellation failure as a departure guard; the service stays closed.

The parent validates exact inert report keys, source SHA-256, page index, orientation-normalized dimensions, output SHA-256/length and PNG signature, chunk sequence and CRCs before retaining a decoded copy. No PNG decompression occurs in these parent checks. Preview uses only the verified PNG in the renderer. A bounded LRU retains at most ten PNG pages, 100 MiB and 64 million pixels. Selected output must be revalidated against the current source and operation token; cached pages are cleared/zeroed on discard and disposal.

## Integration contract

`new TiffWorkspace(root, file, {announce, beforeImport, onImported, setGuard, services})` exposes `open`, `prepareDeparture`, `releaseDeparture`, and `dispose`. Default services are `window.pdfix`. Required methods are `tiffInspect(id, token)`, `tiffPage(id, token, pageIndex)`, `tiffImport(id, token, pageIndices)`, `tiffCancel(id, token)` and `tiffDiscard(id, token)`.

`TiffService.inspect(id, source, token)` returns `{token, report}`. `page(id, source, token, index)` returns `{token, bytes, report}` with native-binary PNG bytes. `output(id, source, token, indices)` returns `{token, sourceSha256, pages: [{bytes, report}]}` in requested output order. Import should touch/decode each selected page in order immediately before `output`, then save exclusive PNG copies through the existing scanner/image source pipeline, retaining the original TIFF. Import receives one to ten distinct indices and stays within the existing image collection's pixel and byte budgets.

Each page must be previewed and explicitly checked for artwork/orientation before adding it. Selection can be reordered or removed. Import transfers the selected PNG copies into the existing image workspace, whose PDF preview and save review remain necessary. A canceled import retains the TIFF selection. Source-page review is temporary and does not substitute for PDF layout review.

## Verification limits

All new JavaScript files were checked with `node --check`. No runtime decoder execution, TIFF fixtures, newly written tests, UI tests, native/device tests or PDF tests were run, following the task constraint. Decoder correctness, image fidelity, cancellation and end-to-end import remain unverified at runtime. The parent workstream performs the permitted compilation/build checks after routing is integrated.

The implementation was read against the primary [TIFF 6.0 specification](https://image-js.github.io/tiff/media/TIFF6.pdf), including strip organization, orientation, PackBits, LZW and horizontal prediction. [LibTIFF's coverage reference](https://libtiff.gitlab.io/libtiff/specification/coverage.html) helps identify broader TIFF modes that this subset does not claim.
