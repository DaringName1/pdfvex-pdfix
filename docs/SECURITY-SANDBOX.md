# PDFix Security Sandbox

Status: native broker source compiled with the latest changes. OS behavior and adversarial isolation checks remain deferred. This is not a completed security certification.

## Native PDF jobs

Compression and password processing run the pinned qpdf runtime through the native Windows broker. Launch fails closed if the broker, manifest, hashes, staging checks, AppContainer setup, token validation or Job Object setup fails. There is no direct unrestricted qpdf fallback.

The broker creates a per-job AppContainer with no requested capabilities, then checks the suspended child token for the exact expected AppContainer SID and zero capability SIDs. It verifies membership in the configured Job Object before allowing execution. No network capability is granted. Only three explicit pipe handles are inherited.

The app-owned job directory receives the job SID's modify grant. The immutable input and ownership markers receive read grants; the staged, hash-checked runtime receives read/execute grants. Reparse points in staging paths and their ancestors are rejected. The runtime is copied into the job folder so package engine ACLs are not expanded for individual jobs.

The Job Object has a one-process limit, a 512 MiB process and job memory limit, a 120-second CPU budget and kill-on-close. Child-process creation is restricted. A monotonic 115-second wall-clock watchdog runs concurrently with stdin forwarding; blocked password/argument pipes cannot hold up that watchdog. Parent-process termination is also monitored. Broker stdin must arrive within five seconds, remain under 16 KiB and contain no NUL byte. Secrets travel over stdin and are cleared from the broker's byte buffer after the job.

Broker forwarding caps each diagnostic pipe at 2 MiB; each engine applies its own narrower output bound. The staging watchdog allows only the known PDF and ownership files, rejects new directory trees, and stops a job if an individual PDF exceeds 100 MiB. Temporary-file cleanup deletes only explicitly recognized files and profiles. Cleanup failures remain visible rather than silently reporting success.

## Limits that remain

The staging watchdog is not an OS disk quota: a process can allocate disk space between observations. AppContainer storage also needs a future quota/containment review. An ordinary AppContainer retains Windows access to resources deliberately exposed to application packages; this is not a claim that every system file and registry key is inaccessible. A less-privileged AppContainer policy has not been implemented.

Node worker threads for PDF verification, redaction and Office decoding are responsiveness and memory boundaries, not separate OS security sandboxes. The Electron renderer uses its own Chromium sandbox and restricted IPC boundary. The native qpdf broker does not make every document decoder OS-isolated.

Source compilation is not evidence that Windows ACL propagation, token values, executable loading, cancellation, parent death or malicious-input containment work on supported systems. Hidden runtime checks, clean-machine packaging checks and independent security review remain release gates.

## Primary API references

- [Microsoft AppContainer implementation guide](https://learn.microsoft.com/en-us/windows/win32/secauthz/implementing-an-appcontainer)
- [Windows process/thread attributes](https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-updateprocthreadattribute)
- [Windows token information classes](https://learn.microsoft.com/en-us/windows/win32/api/winnt/ne-winnt-token_information_class)


## Root packaging and first adoption — 2026-10-04

The existing local standalone Windows x64 Node build runtime and its adjacent complete license are copied into vendor/document-node with exact SHA-256 pins. Vite compiles the fixed codec bundle and broker, packages runtime/engine manifests and bundled dependency/Node licenses. This is packaging compilation; no broker/engine was executed. The XFDF service now uses DocumentSandboxService exclusively, with source/token/generation and domain-result validation, immutable sealed XML/receipt saves, cancellation, and permanent close when termination or cleanup cannot be observed. The old standalone XFDF worker source is unused; there is no worker fallback in the active service. Settings shows fixed-document-package status separately. Other Office/review/takeoff/redaction routes still need adoption; full S00 remains open. Node provenance/clean-machine loading, OS grants/token/process/network/resource cancellation, compatibility and independent security acceptance remain deferred release gates.
