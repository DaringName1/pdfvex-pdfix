# PDFix reading, writing and virtual printing additions

Adopted 2026-10-09 at the user's request. F43–F46 and R42–R45 extend the full existing scope without renumbering F01–F42 or R01–R41. R46 records the user's free-app constraint. Planned implementation is separate from coded, tested and release-ready status.

## Free-app requirement (R46)

PDFix is a free app. These additions must work with free, locally available or freely redistributable components, with no paid API, required subscription, purchase/upgrade links or paid feature unlock. Do not route document text/audio/print jobs to a remote provider. Choose compatible licenses and disclose attribution. Optional downloads/installations must be explicit and free. Preserve this rule when evaluating the rest of the adopted plan: pursue free supported integrations and record any target that cannot be delivered under it instead of quietly adding a paid dependency. Historical provider/service suggestions do not authorize paid integrations.

## F43 / R42 — Virtual PDF printer

Add an optional PDFix Windows print destination so a user can print from another application into a PDF, review it in PDFix and save/import a new copy. Offer supported paper size/orientation/resolution and disclose any rasterization, font or metadata loss. Keep text/vector content where the selected free integration supports it. Print jobs are explicit, bounded, local and cancelable; concurrent jobs need a queue and useful errors. Protect spool/intermediate files and clean them after cancellation; recover incomplete jobs without treating them as completed PDFs. Preserve originals and the originating application's print permissions.

This is a real operating-system printer integration, not merely another export button. Choose a free supported printer/driver/capture design and record signing, administrator consent, installer, upgrade and uninstall prerequisites. Installation is optional, and default-printer changes are never silent. Existing physical-print preview and document PDF export do not satisfy this requirement. The user requested planning; no printer is installed by this addition.

## F44 / R43 — Read aloud

Use free local text-to-speech voices/engines. Provide play, pause, resume and stop, voice/language/rate controls, and selected text/current page/whole supported document scopes. Follow spoken content with highlighting and page navigation where word boundaries are available; otherwise disclose the coarser highlighting. Preserve the document and respect extraction/copy permissions. Never start playback automatically. Stop and release speech when switching files or closing the app.

Prefer the reviewed logical/tagged reading order; expose the existing text-order controls for ambiguous columns. Scanned pages require local OCR first and must disclose uncertainty. Avoid loading or synthesizing an entire giant PDF at once: extract and speak bounded chunks, with responsive cancellation and hardware-friendly resource limits. Missing local voices or unsupported languages need useful explanations and free options.

Whisper is speech recognition (audio to text), so it cannot synthesize read-aloud audio. Its name is recorded as the user's suggestion, with the correct engine role. No Whisper/API provider, cloud TTS or paid service is adopted for read aloud. Local Whisper would only be relevant to a separately requested future dictation/transcription feature.

## F45 / R44 — Word count

Expand the existing basic editor counter into explicit selection/page/document statistics for supported editor content and PDF extracted text. Show words, characters including/excluding spaces, paragraphs and page count where meaningful. Declare the chosen scope, language/counting rules and whether headers, footers, tables, annotations or hidden text are included. Do not count raw JSON/XML/code syntax or omitted import content as visible prose without an explicit mode. OCR counts are estimates of recognized text and should expose omissions/uncertainty. Use cancellable incremental PDF extraction and preserve extraction permissions; report unavailable content rather than a false complete count. The current whitespace counter is a coded starting point, not completion evidence.

## F46 / R45 — Spell-checking

Use a free local spelling engine/dictionary with language selection, misspelling underlines, suggestions, Replace, Ignore, Ignore all and a user-managed personal dictionary. User-approved replacements participate in Undo and recovery. Never silently change document text or send it to a server. Personal dictionaries stay local and can be edited/cleared. Technical drawing identifiers, names and mixed languages should be easy to ignore.

Enable review in editable document text, form/comment text and supported PDF text editing. Read-only PDFs may report findings linked to their page/text location; replacing original PDF text still requires the existing permission/font/geometry capabilities and explicit output review. Source/code editors and exact XML/JSON/receipt fields remain opt-in or excluded. Dictionary/licensing integration, resource limits and offline behavior remain to implement; toggling a browser flag alone does not complete this feature.

## Status

All four now have integrated coded subsets. See [October 9 compiled checkpoint](docs/LOCAL-TEXT-PRINT-CODING-2026-10-09.md) for exact implementation and remaining gaps. Runtime tests, printer installation/inspection, audio playback and dictionary enumeration remain deferred. No paid integration or payment link is adopted. Compilation is not full acceptance.
