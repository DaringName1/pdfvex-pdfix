# PDFix Add-ons — first-update backlog

User intake: October 15, 2026. These 30 requested additions are deferred until the main app reaches human testing, alongside the separately deferred Bluebeam features and dedicated drawing workspace. They do not expand the current main-app closeout or authorize implementation now.

The current main-app scope, supported file formats and functionality requirements remain. Only Bluebeam-specific work was deferred from that existing scope. An overlapping item here does not silently move an existing main-app requirement into a later release; evaluate the newly requested increment separately.

“First update” is the intended release phase, not a promise that all 30 features plus Bluebeam form a small or single delivery. Keep every item in the backlog, preserve the user's priorities, and divide implementation into reviewable batches when this phase starts. Human-test bug fixes retain priority during that phase.

ADD-01–ADD-30 are local intake identifiers, not replacements for existing R/M/B/F/A requirements. No item is marked implemented or independently verified here. Competitor comparisons in the supplied request have not been verified; they are context, not acceptance evidence or instructions to copy another product.

## A. Scanning and image preparation

| ID | Feature | Requested behavior | Priority |
| --- | --- | --- | --- |
| ADD-01 | QR-code document splitting | Split scanned batches at QR-code separator pages. | High |
| ADD-02 | Duplex scan reordering | Reorder batches scanned with all fronts first and all backs afterward. | High |
| ADD-03 | Automatic photo separation | Detect and extract multiple photographs from one scanned page. | Medium |
| ADD-04 | Automatic page orientation | Detect and correct sideways or upside-down PDF pages using their content. | High |
| ADD-05 | Automatic whitespace cropping | Detect and crop excess blank margins automatically. | High |
| ADD-06 | PDF color inversion and replacement | Produce negative-color or custom high-contrast PDF copies beyond ordinary scan brightness/contrast cleanup. | Medium |

## B. PDF editing, conversion and organization

| ID | Feature | Requested behavior | Priority |
| --- | --- | --- | --- |
| ADD-07 | PDF-on-PDF overlay | Combine actual content from two PDFs into an output PDF, beyond comparison-only overlays. | High |
| ADD-08 | Continuous long-page PDF | Join multiple pages into one tall PDF page. | Medium |
| ADD-09 | Webpage and HTML-to-PDF | Capture websites or local HTML as PDFs; separate from the planned browser-extension handoff. | High |
| ADD-10 | PDF/eBook/comic conversion | Evaluate and implement supported PDF conversions involving EPUB, CBZ, CBR and related formats, with an explicit direction/support matrix. | Medium |
| ADD-11 | Additional graphics conversion | Add SVG/GIF conversion to and from the supported PDF/image workflows, with explicit direction support. | Medium |
| ADD-12 | Outlook MSG conversion | Convert .msg email files to PDF; preserve the distinction from existing/planned .eml handling. | Medium |
| ADD-13 | Original embedded-image extraction | Extract source PDF image objects instead of screenshots of rendered pages. | High |
| ADD-14 | PDF page grid splitting | Divide a page into separately saved PDF sections, beyond tiled printing. | Medium |
| ADD-15 | Editing existing PDF hyperlinks | Create, change and remove links inside existing PDFs; distinct from editor-document links. | High |
| ADD-16 | Embedded attachment management | Add and rename PDF attachments, extending safe viewing/extraction/removal. | Medium |
| ADD-17 | Dynamic-variable stamps | Support approved date, page-number, filename and other variables in stamps. | High |
| ADD-18 | Audio and attached-file comments | Attach recordings or files to PDF annotations. | Medium |
| ADD-19 | Rulers, grids, guides and snapping | Align PDF text, images and other supported objects precisely. | High |
| ADD-20 | Snapshot tool | Copy a selected PDF area as an image or reusable object. | High |
| ADD-21 | Presentation scrolling and transitions | Automatically scroll or advance PDF pages with selectable transitions. | Low |
| ADD-22 | Bookmark JSON import/export | Transfer an editable bookmark tree between files or tools. | Medium |
| ADD-23 | Command-line PDF operations | Expose approved local conversions and batch operations for user scripts. | Medium |

## C. AI and research tools

| ID | Feature | Requested behavior | Priority |
| --- | --- | --- | --- |
| ADD-24 | Mathematical formula recognition | Convert PDF equations into LaTeX or accessible MathML. | High for research |
| ADD-25 | AI-generated document discussions | Create an audio discussion explaining a PDF, beyond ordinary read-aloud. | Low |
| ADD-26 | Persistent PDF research collections | Group files with source-linked notes, saved research context and related outputs. | High |
| ADD-27 | Natural-language PDF operations | Request local PDF actions in plain English with explicit confirmation. | High |
| ADD-28 | AI-assisted diagram creation | Create diagrams from descriptions for insertion into documents. | Medium |
| ADD-29 | PDF study tools | Generate review questions, quizzes, flashcards and mind maps from selected PDF content. | Medium |
| ADD-30 | Reusable AI skills | Save user-approved AI task recipes for repeated document work. | Medium |

## Overlap review before implementation

- Scan/image cleanup and manual rotation/crop are existing areas; automatic detection, separator handling and photo segmentation are separate increments to assess.
- Existing drawing comparison overlays do not establish ADD-07 output-content composition.
- Existing image-to-PDF/PDF-to-image conversion does not establish original image-object extraction, all SVG/GIF directions or eBook/comic support.
- Existing email/document conversion and browser handoff plans do not establish MSG parsing or webpage capture.
- Existing PDF link navigation and document-editor links do not establish existing-PDF hyperlink editing.
- Existing attachment tools, stamps, region selection, outline editing and batch services may supply groundwork for ADD-16/17/19/20/22/23. Inspect actual commands and outputs before deciding whether an increment is missing, partial or already supported.
- Read-aloud, selected-file search, AI context, reusable drawing styles and portable drafts do not by themselves establish ADD-24–30.

This is an overlap checklist, not a new source audit or a claim that all 30 features are wholly absent.

## Entry and acceptance requirements

Start implementation after the main app reaches human testing and the two agents agree on file ownership for that batch. Preserve existing lane ownership until then; Bluebeam work stays separately tracked, not erased or counted as one of these 30 items.

For each item, record existing overlap, exact supported inputs/directions, intended output, known omissions, implementation owner and independent acceptance evidence. Respect unchanged originals, reviewed new-copy outputs, cancellation/recovery, bounded resources, native containment and the free-app requirement. Keep document content inert. No dependency, architecture, account, network or Windows-setting changes are authorized by this intake alone; follow the folder rules and existing user permissions when implementation begins. AI model/provider choices require evaluation and explicit data-transfer controls; no paid service or silent online fallback is assumed.

Automatic orientation/cropping/separation must offer review of uncertain or destructive-looking proposals. Preserve original resolution/color/metadata where the declared output supports it. Clearly disclose rasterization, animation loss, re-encoding, linked-resource omissions and format-specific limitations. Do not equate a visible preview with verified saved output.

## Requests for the integrator

Link this intake from the master plan and scope ledger once Claude's current dirty tracking files are committed. Reconcile existing IDs without double counting or deleting prior requirements. Mark the new increments deferred to the Add-ons/first-update phase, and retain the current main-app closeout scope. No master plan, ledger, app code, dependencies or build artifacts were changed for this intake.
