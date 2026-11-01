# Large-PDF defensive source review

User authorized reviewing and fixing other potential problems around the current large-file failures. This pass reviewed the native staging/library path, paged service and renderer facade. It is not an exhaustive proof of correctness.

## Coded corrections

1. Output watchdog checks could finish after their command exited and call a stop handler after timers were already cleared. Finished jobs now reject late callbacks, and only one asynchronous output check may be pending at a time.
2. A synchronous error terminating a child from a timer/stream callback could escape that callback. It now closes the service conservatively and retains unsafe staging rather than throwing an uncaught callback exception.
3. A third rapid navigation request was rejected while two earlier requests were pending. The newest navigation intent now supersedes older work and waits for the bounded queue to drain before requesting its page.
4. Returning to a page whose request had already been superseded could reuse that canceled request. Deduplication now includes its navigation generation.
5. Navigation or closing during the final `getPage(1)` await could let a stale worker enter the cache. A final generation/closed check prevents adopting it and allows the existing finally block to destroy the worker.
6. Runtime pin verification read each entire packaged DLL and staged DLL into separate buffers on every page command. It now hashes each through a 128 KiB buffer and checks file/descriptor identity and timestamps before and after reading. Initial exclusive DLL copies are hash-verified after copying. Pinned checks are not skipped or cached; ancestry checks now also cover the engine and bin directories.
7. Snapshot/staging disk headroom was added as a Number before conversion to BigInt, allowing precision loss near safe-integer limits. Addition now occurs as BigInt.
8. Broker diagnostic stage parsing now applies only to the reserved setup/cleanup exit codes; ordinary qpdf output cannot alone masquerade as a broker setup failure.

## Verification and limits

Four changed JavaScript files passed source syntax checks. Compilation evidence follows below. No PDF, native engine, UI, device or performance tests were run. Source review does not confirm the previous Windows loader failure is resolved. The exact loader code and actual engineering drawing are still required for runtime acceptance. Existing 512 MiB/115-second parsing and 32 MiB working-page limits remain; unsupported paged features, encrypted documents and blueprint fidelity still require further work.

Compilation: npm run build exited 0, 328 modules; renderer index-CqmAL7Zd.js. Source snapshot 7f2fdef95e2f5ce0ef40ceab4d00958d9008cd55524aaa6020209576ab25ae6b; native broker d21282ad8c635170e43dedc9518c5b95f023a78805d2f6d10b36b4c47f8fc43e; native source de4239e82d497401d319b22b720ba8bd1780c9f1c1f8b955ca58731d58172b9e. Actual drawing/runtime acceptance remains pending.
