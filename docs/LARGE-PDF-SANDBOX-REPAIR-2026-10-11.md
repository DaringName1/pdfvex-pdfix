# Large-PDF sandbox repair — October 11, 2026

User reported: “The Windows Security Sandbox stopped this job. No unrestricted fallback was used. Rebuild or repair PDFix.” The old message covered both setup and profile-cleanup failures and discarded the broker's diagnostics. It does not establish which Windows operation failed on the user's machine.

## Implemented

- The paged broker explicitly sets the precreated writable output file's low integrity label after its restricted ACL. The input and runtime stay read-only. This removes dependence on directory-label propagation to an existing file.
- A paged reading session retains its private AppContainer profile between encryption checks, page-count queries and page extraction. Its owned session cleanup still deletes the profile. This avoids deleting and recreating a Windows profile for every command. Existing non-paged job lifecycle is unchanged.
- Broker failures report fixed stage identifiers and numeric Windows/HRESULT codes, without source paths or document contents. Paged reading retains bounded stderr and displays these diagnostics with actionable guidance instead of the generic repair message. Checks still fail closed; there is no unrestricted fallback.
- Windows memory-allocation and runtime-loader exit codes get separate messages. Other engine exits now include the numeric exit code and explain possible damage, unsupported structure or parser complexity without asserting a diagnosis.

These changes address source-level lifecycle and permission risks. Neither is confirmed as the cause of the reported stop. The new failure stage and code are required if it persists.

## Large-file boundaries

Existing disk-backed snapshots, source fingerprints, cancellation, serialized extraction, bounded page workers, free-space checks, parent-death containment and output-size checks remain. File size alone does not guarantee successful opening: temporary storage requires two disk copies, parsing still has a 512 MiB/115-second budget and one prepared page has a 32 MiB limit. Encrypted inputs and several whole-document tools remain unsupported in paged mode. Blueprint geometry, annotations and raster fidelity need acceptance on the real engineering drawing.

No PDF, native runtime, UI, device or performance tests were run. JavaScript syntax and compilation are the verification scope for this pass. Actual opening of the user's drawing remains pending.

Compilation: two JavaScript source syntax checks passed; npm run build exited 0, 328 modules. Source snapshot ffc0f228ab00f6062547b9170df0bfbf29a84305b10004df0e5d41aae04e8095; native broker d69e81da109117a1b813f89a4da3ce54a224b02121991440f3803759252e3de5; native source 75155f36de5158b3bea47d149df5c1221fc07fc5000d3c4ac5ca2cc41f4069cc. Runtime acceptance remains pending.
