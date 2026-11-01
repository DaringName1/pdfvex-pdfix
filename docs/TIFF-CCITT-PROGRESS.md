# TIFF CCITT decoder progress

The existing contained TIFF path now decodes fax strips through the new `desktop/tiff-ccitt-codec.cjs` helper. `desktop/tiff-codec.cjs` calls it only for compression tags 2, 3 and 4. Existing grayscale, palette, RGB, PackBits, LZW, Deflate and orientation functionality remains available.

## Implemented fax modes

- Compression 2: Modified Huffman alternating white/black runs, terminating/makeup codewords, extended makeup lengths, initial zero white run, and byte alignment between rows.
- Compression 3: Group 3 1D and mixed 1D/2D rows, EOL markers and line-mode tags, strip-local reference rows and T4Options EOL byte fill. Every mixed strip starts with a 1D row.
- Compression 4: Group 4 2D pass, horizontal and vertical offsets −3 through +3, an initial all-white reference row for every strip, contiguous row codes and a required EOFB marker.
- FillOrder 1 and 2 are applied to compressed input bits. Output is normalized to MSB-first packed bilevel pixels. Existing TIFF photometric handling preserves WhiteIsZero and reverses the decoded white/black meaning for BlackIsZero; the existing orientation transform then produces the RGB page PNG.

Fax input requires one unsigned 1-bit sample, grayscale photometric 0 or 1, and predictor 1. T4Options 0, 1, 4 and 5 are accepted. T6Options must be 0. Uncompressed fax extensions, reserved option bits and reserved 2D extension modes are explicitly refused. Invalid codewords, premature endings, excessive or nonadvancing runs, out-of-range changing elements and extra encoded row data cause errors; the decoder does not repair or guess missing rows.

Group 3 TIFF strips may end after the declared rows with byte padding, a final EOL, a complete six-marker RTC, or a final EOL followed by complete RTC. Mixed endings require RTC tags to indicate 1D. Group 4 strips must contain the full EOFB marker and at most seven zero padding bits. Modified Huffman row padding is ignored as specified, and extra bytes after the final row are refused. These ending rules can reject nonconforming fax TIFFs that other viewers attempt to repair.

## Interface and bounds

The helper exposes `decodeCcittStrip(input, {width, rows, compression, fillOrder, t4Options, t6Options, check})` and returns exactly `ceil(width / 8) * rows` packed bytes. It has no filesystem, network, UI, native driver or path interface. No renderer or parent decoder fallback was added.

Existing service and page report contracts are unchanged. The parent inspection validator accepts tags 2/3/4 only with 1-bit grayscale metadata. The service still returns source/token-bound binary PNG pages and independently validates their dimensions, framing, byte lengths and hashes before retaining them. Source fingerprints, original files, cancellation, observed cleanup and the reviewed image/PDF output workflow stay in place.

The existing 100 MiB input, 8,192 pixels per dimension, 16 million page pixels, 64 million collection pixels, 64 MiB page decompression and 32 MiB PNG output budgets remain. Each fax row permits at most `3 * width + 128` code/mode operations; each run permits at most `ceil(width / 64) + 1` makeup/terminating codewords. Huffman codes are bounded to 13 bits and 2D mode prefixes to seven bits. EOL zero fill is limited to 4,096 bits; Group 3 trailing markers are limited to 256 bits and seven markers. Reference-row lookup uses bounded binary search over at most one changing element per pixel. Deadline/cancel callbacks run each row and every 1,024 consumed bits. A 30-second helper deadline supplements the full TIFF job deadline and native containment limits. Failed decoded output is zeroed before release.

## Verification status

The helper, TIFF codec, validation and service passed `node --check`. Source-only checks confirmed the literal codeword table counts (64 white and 64 black terminating words, 27 white and 27 black makeup words, 13 shared makeup words), binary lengths and prefix-free run tables. No TIFF/parser execution, fixtures, new tests, runtime/UI/native/device/PDF tests or image-fidelity comparisons were performed, per the task constraint. Runtime correctness and compatibility remain unverified. The native bundle must be rebuilt so its existing TIFF operation dispatch includes the helper dependency.

Primary references read during implementation: [TIFF 6.0](https://image-js.github.io/tiff/media/TIFF6.pdf), [ITU-T T.4 (07/1996)](https://www.itu.int/rec/dologin_pub.asp?id=T-REC-T.4-199607-S%21%21PDF-E&lang=e&type=items), [ITU-T T.6 (11/1988)](https://www.itu.int/rec/dologin_pub.asp?id=T-REC-T.6-198811-I%21%21PDF-E&lang=e&type=items), and the normative one-dimensional code tables reproduced in [RFC 804](https://www.rfc-editor.org/rfc/rfc804.txt). Codewords are numeric format data; the decoder implementation is local code rather than an imported fax engine.
