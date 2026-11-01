# Continuous multi-file Bates numbering

Implemented native service, renderer workspace, IPC/native pickers, command finder and workspace-hub entry. Actual numbering uses the existing contained decoration writer; file page counts come from contained source inspection. No source PDF parser or renderer-produced PDF input is added in the parent.

Select 1–10 immutable original snapshots totaling at most 96 MiB. Each source can contain 1–500 physical pages. Arrange file order and apply exact ASCII prefix/suffix, start/fixed numeric digits, standard font, position, color, opacity and inset. Select up to 100 distinct physical pages per file, in explicit numbering order. Nonselected pages remain in each output.

Only the next queued original can build. Its native retained bytes and fingerprint supply the writer. Receipts bind the source, exact per-page identifier sequence, page count and final output hash. Actual original and numbered copies open with PDF.js and are shown side by side; every output page must be viewed and explicit placement/identifier review confirmed before saving.

Choose one new folder under a native-picked parent. Files are saved exclusively with keep-both names and verified by the existing FileStore. Numbering advances only after a verified save returns; skipped, failed and canceled originals consume no numbers. The session report records source fingerprints, statuses, exact assigned page/number/text mappings, output hashes and saved paths. Native-owned JSON report export binds the current report before and after the save picker. It does not accept a renderer report payload.

Processing cancellation awaits the contained writer and closes the service on unsafe termination/cleanup. Crash/shutdown disposal awaits writer/inspector completion before clearing retained originals. Preview tasks are destroyed/awaited and a departure guard stays until cleanup completes. Saved copies are never rolled back or silently overwritten.

Remaining: persistent/resumable queues and global durable identifier registry; detection of identifiers already present in arbitrary originals; automatic source-artwork collision detection; numbering more than 100 selected pages in one operation; wider fonts/Unicode and multi-folder policies. Current session state is memory-only; export its report before closing. Signed, protected and unsupported structures can be refused by the existing preserving writer. No runtime/PDF/UI/disk/cancellation/performance tests or fixtures ran. Syntax and integration compilation only.
