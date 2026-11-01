# Email and clipboard creation coding — 2026-10-11

F54 and F55 add a reviewed creation dialog which hands editable content to the existing Document editor through `onCreateDocument({title, initialContent, importWarning})`. Page setup, text/image arrangement and reviewed PDF export use the existing document pipeline. The dialog closes and invokes `onClosed` before handing off content. This is coding evidence, not a release or UI certification.

## F54: bounded EML creation

The native `importEmailMessage()` entry selects one local `.eml`, retains an immutable source snapshot outside the renderer and invokes `email-message-read` in the contained document engine. `EmailMessageService` refuses missing snapshots, files over 10 MiB or fingerprint mismatches. There is no alternate uncontained parser. The returned report is checked for source hash, exact shape and bounded sizes before renderer handoff.

Supported MIME behavior:

- From, To, Cc, Bcc, Date, Subject, Reply-To and Message-ID; folded headers and RFC 2047 B/Q encoded words.
- Multipart boundaries, up to 200 MIME parts and 12 levels. `multipart/alternative` prefers available plain text. Other supported multipart bodies are combined with separators.
- 7bit, 8bit, binary, strict base64 and quoted-printable decoding. Header blocks are limited to 64 KiB each and 256 KiB overall; decoded aggregate content is limited to 10 MiB. Body parts and combined body are limited to 1 MiB.
- UTF-8, ASCII, ISO-8859-1/Latin-1 (decoded using the web-compatible Windows-1252 mapping), Windows-1252 and UTF-16LE/BE. Unsupported charset body parts are explicitly omitted with a warning; encoded headers retain literal text when decoding fails.
- Simple `filename`, `name` and nonsegmented RFC 2231 extended filename parameters. Encoded or unsupported extended names carry a warning; segmented filename parameters are not reconstructed.
- Text/plain and a small inert HTML formatting vocabulary. Source attributes, URLs, scripts, styles, links, tables, SVG and remote/inline images are stripped or simplified. No HTML source is executed and no remote image retrieval occurs. Image positions become visible omission markers. The editor applies its existing DOMPurify sanitizer again.

Every detected nonbody MIME part/attachment is listed with name, MIME type, decoded byte count when available and an explicit omission reason. Unknown decoded sizes are displayed as unavailable. Multipart attachments are inventoried as single omitted attachments; embedded `message/rfc822`, signed/encrypted bodies, calendar items and arbitrary file types are not opened or decoded recursively. All attachment bytes are omitted from the created document and PDF. Attachment preservation, extraction, embedded attachment PDF output and signature authenticity checks are not implemented in this route.

The created document contains supported headers/body plus the attachment inventory and omission reasons. It preserves editable content, not original email typography, CSS, tables, threading metadata or client-specific layout. Truncated/ambiguous MIME, malformed transfer encoding in a body and excessive resource use fail closed. Source path/content are not sent to network services.

## F55: explicit clipboard creation

`readCreationClipboard()` is invoked only by the Paste clipboard now button. It provides at most 1 MiB UTF-8 plain text and a static PNG image up to 5 MiB/4 million pixels. Text and image can be included in the same explicit paste. No polling or browser clipboard permission fallback is used. HTML, file references and other clipboard formats are omitted.

The dialog permits up to 20 items, editable text, image descriptions, reordering and removal. It shows decoded image dimensions and any pixel reduction notice. Images pass through the existing bounded image worker and become the existing `documentImage` inline PNG schema, with 512 KiB normalized assets, up to 20 images and 12 million aggregate pixels. Worker preparation can be canceled; failed preparation does not partially append clipboard items. Clipboard source bytes are cleared after image preparation. The arranged rich document is limited to 1.6 MB before handoff.

Review acknowledgement is reset when content/order changes. The next step opens the ordinary Document editor for further editing, image size/alignment, margins/orientation and export review. No automatic PDF saving occurs. This route does not retain clipboard file formats, rich clipboard styling, vector assets or floating image placement.

## Validation scope

Only one focused syntax/model check was requested for these additions. No application build, native contained process launch, Windows clipboard interaction, PDF export or broad UI sweep is claimed by this coding note. Native dialog snapshot/clipboard and app registration are owned by the main integration changes; the files here implement the contained MIME operation/service and review/handoff dialog.
