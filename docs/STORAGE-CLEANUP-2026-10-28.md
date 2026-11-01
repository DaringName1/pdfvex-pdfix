# PDFix development storage cleanup — October 28

The owner's Drive showed about 321 GB used. A metadata-only local inventory found **226.76 GB** in the PDFix project directories:

| Directory | Decimal GB | Finding |
| --- | ---: | --- |
| `.test-data` | 179.15 | 9,081 generated test directories; 1,622 reader-runtime snapshots |
| `tmp` | 32.79 | Historical build/review copies and scratch output |
| `releases` | 13.38 | Historical packages, Dad copies and current installer |
| Other directories | 1.44 | Dependencies, native tools, source and documentation |

Git ignore rules do **not** exclude these directories from Google Drive synchronization.

## Approved cleanup and result

The owner explicitly approved deleting **789 completed generated reader-runtime snapshots older than 24 hours**, listed in `tmp/storage-cleanup-proposal-2026-10-28.json`.

Every resolved absolute path was checked to be directly inside this project's `.test-data` directory, have the expected generated name and matching snapshot marker, be old enough, not be a linked directory, and not be referenced by a running process. All 789 were removed successfully, with **132,911,702,070 recorded bytes** (132.91 decimal GB), no deletion failures. A second pass confirmed none of the approved paths remained. Source, documents, personal samples, releases and installers were preserved.

The full inventory and local deletion receipt are `tmp/storage-inventory-2026-10-28.json` and `tmp/storage-cleanup-result-2026-10-28.json`.

## Preventing recurrence

`tests/helpers/reader-runtime.mjs` now creates snapshots in the operating system's temporary `pdfix-test-runtimes` folder, outside Drive. Failed captures are removed immediately. Each worker cleans only its own generated snapshots on exit; explicit release is also available. Dependency lookup uses a junction to the already-installed test dependencies, avoiding duplicate library trees, matching the previous project-ancestor lookup. Cleanup is tested to remove the junction without deleting the installed dependencies.

Verified: runtime mismatch/repair/immutability/location/release unit regression passes; a hidden built Electron app starts from the temporary cache and closes, after which its snapshot is absent. An initial startup attempt exposed missing dependency lookup outside the project; the junction correction passed the repeated smoke test. No production sandbox or GPU settings changed.

## Google Drive cloud status

The owner separately requested emptying Google Drive Trash. The Empty trash / Delete forever action was performed in the signed-in Drive browser, and **“Trash is empty”** was observed afterward. The displayed storage figure was still processing (316.15 GB at that observation); this is not proof that all 132.91 GB has already been deducted from cloud quota.

Cloud metadata showed the approved folders still online while local synchronization caught up. Direct deletion was limited strictly to matching approved folder names under the verified project `.test-data` parent. Some were permanently removed; the batch receipt is `tmp/cloud-cleanup-batch-36.json` (33 successful, 3 rate-limited; earlier interrupted batch outcomes are not fully journaled). Google then returned **403 userRateLimitExceeded**. Further direct delete requests were stopped. Do not bypass that limit or claim all cloud deletions/quota updates are complete. The normal Drive client still needs to finish syncing the approved local deletions.

## Rules for both agents

- Put disposable full source/build review copies and large generated fixtures outside Drive, using local OS temporary storage.
- Keep only bounded evidence and deliberate release deliverables in the shared project; the source and project notes remain shared.
- Do not delete the remaining recent/incomplete snapshots, scratch folders or release history under the first approval. They were outside its exact 789-folder scope.
- Do not bulk-empty Trash again without a new owner request; the October 28 request was completed.
- UI rich-Home work was interrupted by this storage incident and remains unverified WIP; do not package it as finished.

## Claude follow-up reported by the owner

Claude committed2f31988 (followed by tool-plan commits fa13b22/bff05c1), removed additional old scratch/release/test output under its own authorization, and reported roughly7GB remaining locally. That broader cleanup was not part of Codex's789folder deletion. Claude added age-based pruning and moved clean review copies to OS temp. The owner relayed completion, so the remaining Trash from that completed cleanup was submitted for emptying too. Cloud accounting remains pending; do not infer an exact quota decrease from local sizes.
