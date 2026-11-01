# PDFix original PDF editing fidelity — saved implementation

Updated 2026-10-04. This records code that is saved, not completed runtime acceptance.

## Embedded source-font text editing

The original-text editor now understands a bounded subset of embedded-font `ToUnicode` CMaps. This removes the previous blanket exclusion of PDFs whose original text uses embedded fonts, including many ordinary downloaded and Word-exported PDFs.

Supported source font shapes:

- Embedded simple `Type1` and `TrueType` fonts with one-byte declarative `ToUnicode` maps.
- Embedded `Type0` fonts using horizontal `Identity-H`, exactly one `CIDFontType0` or `CIDFontType2` descendant and a two-byte declarative `ToUnicode` map.
- Existing unembedded standard Type1 Western-font support remains available.
- `beginbfchar`, direct `beginbfrange`, array `beginbfrange`, fixed-width codespaces, valid BMP scalars and valid UTF-16 surrogate pairs.
- Individual string operands inside multipart `TJ` arrays. Original numeric spacing adjustments and the rest of each array remain byte-for-byte unchanged in the decoded content stream.

Replacement text reuses the original source font resource, size and character-code bytes. It does not paint over old text or substitute a visually similar font. A character must already have been decoded in a supported string using that same source font. When several source codes map to the same character, the current run's original code takes precedence; an ambiguous character absent from that run is refused. New glyphs are not synthesized. A missing, ambiguous or unavailable character prevents preview construction with a concrete explanation.

Ligatures and other mappings to multiple Unicode characters stay unmapped. Their affected strings are ineligible; supported mappings and other strings in the same font remain usable. This slice does not implement text shaping, bidirectional layout, paragraph reflow or font-file modification. A mapped character is not a guarantee that arbitrary rearrangements of complex-script glyphs will preserve shaping. The user must review the output layout.

The font name and observed-character count appear in the editor. Replacement runs retain original stable page/stream/byte-offset identities, so existing recovery and undo formats need no migration or new IPC route.

## Preservation and bounds

The replacement stream starts with a clone of the original stream dictionary. Its compression filter, decode parameters and derived length are replaced as required for the new payload; other dictionary fields remain. Only selected string token spans change. Shared original content-stream objects remain retained, and only the selected page's content reference points to the new stream. External-file content streams are refused.

Before changing text, the writer fingerprints each selected source font and its complete referenced object graph, including font descriptors, mappings and encoded font-program bytes. After saving and reopening the output, the same page font resource must produce the same SHA-256 proof. Stream `Length` is excluded as a writer-derived field, while actual encoded bytes, dictionary keys, references and values remain part of the proof. A changed or missing source font refuses the output.

Bounds include 1 MiB per decoded CMap, 8 MiB aggregate CMap bytes, 200 source fonts, 16,384 mappings per font, 65,536 usable mappings across fonts, 64 codespace ranges, 200,000 lexical tokens per CMap and bounded range expansion. Existing content-stream limits remain 8 MiB each, 64 MiB aggregate, 2,000 candidate strings and 200 staged text changes. Font preservation graphs are capped at 20,000 nodes, depth 32, 2,000 references and 100 MiB of encoded streams per proof. Existing 100 MiB / 500-page source and page geometry limits remain enforced.

Encrypted/protected, certified, digitally signed and dynamic XFA sources continue to be refused by the content writer. Originals are unchanged; editing saves a new reviewed copy. Replaced original streams remain in the PDF object graph, so this is editing and is not a permanent redaction operation.

## Remaining large gaps

- Text in nested Form XObjects, marked-content spans carrying replacement semantics, vertical/custom/inherited CMaps, Type3 fonts and source fonts without supported ToUnicode maps.
- Glyph embedding, Unicode shaping, font changes on original runs, kerning-aware paragraph reflow and direct font/size changes.
- Nested Form XObject image replacement and broader color/profile/transparency preservation acceptance.
- Full preservation proof for every unrelated original object. This slice proves the selected font graph and retains the existing geometry/output-readback checks; it does not claim complete PDF object preservation acceptance.
- Full permission-aware editing of every supported authorized document format remains a product requirement, not a completed claim from this slice.

## Verification status and later runtime gates

Targeted `node --check` passed for the saved source modules. No app, worker, browser or native runtime test was launched; the user's testing pause is respected. Root owns the final combined Vite compile.

When runtime testing resumes, use hidden/offscreen fixtures covering simple embedded TrueType, CFF/Type1, Identity-H CID fonts, mixed supported and ligature mappings, surrogate-pair glyphs, array/range CMaps, escaped literal/hex source strings, multipart TJ spacing, duplicate Unicode mappings, shared fonts and shared page content. Check independent text extraction, glyph appearance, spacing, untouched font-program bytes, page geometry, other pages and recovery. Exercise malformed/oversized maps, external streams, missing glyphs, ambiguous codes and protected/signed source refusals. Complex-script rearrangements and nested forms need their own implementation before broad fidelity acceptance.

## Implementation files and source grounding

- `src/pdf-original-font-map.js`: independent bounded declarative parser and observed-glyph encoder.
- `src/pdf-original-font-proof.js`: source-font graph fingerprint and encoded-program checks.
- `src/pdf-original-text.js`: original font discovery, individual TJ operands and actual token replacements.
- `src/pdf-content-output.js`: source font inventory and pre-save/reopened preservation gate.
- `src/pdf-content-workspace.js`: supported-font descriptions and observed repertoire count.

The CMap operators, destination UTF-16 interpretation and horizontal Identity-H distinction were checked against the installed primary PDF.js implementation at `node_modules/pdfjs-dist/build/pdf.worker.mjs` (`parseBfChar`, `parseBfRange`, `parseCodespaceRange`, `parseCMap`, `readToUnicode`). The parser and preservation helper above were independently written for this application's intentionally narrower edit boundary; no external SDK or executable PostScript was introduced. The stream cloning/compression behavior was checked in the installed `pdf-lib` `PDFContext`, `PDFRawStream` and dictionary code.
