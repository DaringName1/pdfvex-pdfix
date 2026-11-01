# Size-based PDF splitting — F05

Saved source implements a real maximum encoded file-size rule alongside every-N, custom ranges and bookmarks. The user selects 0.25–100 MiB per file. The worker first builds the existing reviewed page-copy arrangement, then encodes candidate contiguous groups and measures the actual resulting bytes. Accepted files reuse those measured bytes; each physical output page appears exactly once and in order. It does not estimate file sizes from source bytes or silently divide a physical page.

If one physical page alone exceeds the maximum, the error identifies that output position and its actual encoded size. If the whole output already fits, the user is told to choose a smaller maximum for separate files. Shared resources may be repeated between parts; the combined output retains the existing 100 MiB budget. Group selection seeks fitting contiguous groups, without claiming maximal packing when PDF serialization sizes are not monotonic.

The worker limits encoding to 2,000 candidates and 1 GiB cumulative serialized bytes, inside the existing two-minute cancellable worker lifetime. Actual retained outputs are reopened for page count/geometry in the writer and use the existing independent split-preview pipeline and review checkbox before exclusive folder saving. Cancellation terminates the browser worker; original source bytes are untouched.

The new size settings persist in source-bound organizer recovery and named page workflows. Existing every/range workflows remain accepted. The existing page-copy limitations remain visible: forms/signatures are refused; annotations, links, bookmarks and document metadata are removed; crop hides content rather than securely redacting it. Broader object preservation remains F06 work.

Source syntax checks pass for the worker, implementation, UI and saved-recipe validation. Compilation and runtime/document/corpus acceptance for this addition are separate from the preceding 276-module milestone. No tests or fixture runs were performed.
