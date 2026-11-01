# Native broker size-envelope alignment — October 9, 2026

Source correction; runtime isolation and performance acceptance remain pending.

The fixed document engine and parent already allow a 256 MiB staged source only for file-backed comment inventory and a 36 MiB request only for portfolio creation. The Windows broker watchdog previously imposed 100 MiB on every input and 12 MiB on every request, contradicting those adopted operation contracts and refusing their larger staged files before child processing.

The broker now applies the encompassing maxima: input 256 MiB, output 100 MiB, result 32 MiB and request 36 MiB, with the corresponding 424 MiB aggregate plus three 4 KiB metadata/error envelopes. Parent and fixed engine retain all narrower per-operation budgets and strict operation allowlists. The form-fill build budget remains 3 MiB; ordinary requests remain 2 MiB and FDF/XFDF import requests 12 MiB. This does not expand individual operations beyond their existing contracts or establish that maximum-size sources fit memory.

Exact known file sets, no-reparse checks, read-only source/request/runtime ACLs, zero capability SIDs, 512 MiB Job Object memory, 256 MiB Node heap, single child process, timeout, parent-death and observed cleanup behavior remain in source. The file checks are a watchdog rather than a disk quota. Maximum-size documents can still hit the existing engine memory/time limits and need real-file acceptance later.

No helper execution, document test, UI test, performance run or installer build was performed. Native compilation is included in the next integrated build checkpoint.
