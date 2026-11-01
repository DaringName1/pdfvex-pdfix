# Monday package: Codex acceptance (October 18, 2026)

Package: releases/PDFix-0.1.0-20261018T212559026-02d0cdb2-win-x64, supplied by Claude.
Manifest SHA-256: ecc4b58ec80d60006fcacc5f5b1ea2c57e9bd91a452a098b523ba0db40dbe58f.
Outer launcher SHA-256: dab90b2b327b9733aec7e0c8fa5c5ae93059a51224c23751b75383aacf1a2b31.

## Exact package, actual app

scripts/check-reader-packaged-launch.mjs --package=<folder>, through agent-run, passes five checks:
- All 5,673 inventoried application files match their size/hash and the completion manifest.
- Open with's manifest and the installer target the public outer launcher. No registry/installation is performed.
- The unchanged outer launcher opens the packaged Electron app; a generated PDF opens through Review & open.
- A second outer-launcher instance queues another generated PDF into the existing app, opened through the same
  explicit review flow. Both document tabs remain available. The app does not silently switch documents.
- Generated input hashes remain unchanged; final normal-mode receipt has one interactive child and exit0;
  no page errors, forced termination or surviving owned processes.

Hidden temporary profile only. Loopback browser/main debugger connections control the check; the native requested-
file confirmation is substituted before clicking so no real confirmation needs a user. The package is unchanged.
Normal here names the launcher's normal path; standard hidden-test rendering itself disables acceleration, so this
check alone is not hardware-rendering acceptance. No physical printing or spare-PC operation occurred.

Final receipt: pdfix-packaged-reader-S8ewoH, preserved with two personally inspected PNGs in docs/evidence/codex.
An immediate earlier capture showed stale first-document artwork during handoff; the final host-side paint delay
shows the correct second drawing. Earlier checker errors were wrong installer/URL expectations and an unsubstituted
native confirmation; those receipts are failures, not passing evidence. The first URL-attachment failure required
termination of its captured two-process test tree; later checks close naturally. No other app was stopped.

## Exact launcher, simulated crash child

scripts/check-reader-packaged-graphics.mjs --package=<folder>, through agent-run, passes eight scenarios:
normal, argument round trip, accepted retry, decline, both attempts failing, fatal failure after the interactive
(save-possible) fence, unrelated failure, and invalid marker. Exact packaged launcher bytes are copied to generated
fixture folders; only the child is replaced with a bounded native simulator. Original package bytes are rechecked.

Real native Retry/Close/OK controls are enumerated and activated on a newly created non-input Windows desktop;
the user's desktop is never switched. Every private desktop closes. Accepted retry launches exactly two children,
decline one, failure in both modes never loops, and interactive/unrelated/invalid-marker failures never offer retry.
Argument boundaries including empty strings, quotes and trailing backslashes survive. No production setting changes.

Final receipt: pdfix-packaged-graphics-R1hEC5, preserved with hashes. All four private-desktop PrintWindow captures
were personally inspected and are black; they are NOT visual evidence. Native control labels/choices and receipts
are the evidence here. The real prompt's earlier explicitly authorized visible-main-PC proof remains separate in
GRAPHICS-RECOVERY-INTEGRATION-2026-10-17.md. A real driver crash, successful software rendering for every drawing,
installer execution/Windows registration and spare-PC acceptance are not claimed by these checks.

## Integrator request

ef9f3f4 / known issue A-CI1: installer icon lookup is runtimePDFix.exe instead of runtime/PDFix.exe. It falls back
to the correct outer executable, so launching works but the intended application icon is not chosen. Claude owns
this cosmetic fix. No new package, upload, registry edits, installer execution or spare-PC use by Codex.
