# Graphics recovery: integration for Claude

The owner approved option 2 on October 17. The implementation and main-PC checks are ready. This is **not yet in a combined release package**.

## Behavior

Normal launches keep hardware acceleration. A small native launcher watches its fixed `runtime/PDFix.exe`. After that process has exited abnormally, it offers one **Try again with simpler graphics** choice only if stderr contains the fatal graphics diagnostic and the app's startup marker is still intact. An exit code alone, screenshot failure or unrelated error is insufficient. Close is the default; Escape closes.

Accepting starts exactly one software-rendered child. Failure of that child never offers another restart. The next independent launch starts in normal mode again. No permanent graphics preference or security setting is changed.

Before a window finishes loading/shows, and before any trusted IPC callback, the app synchronously marks the session interactive. The launcher permanently refuses retries for such a session, even if it later crashes during saving. It never kills a live app. It preserves argument boundaries and the caller's working directory. A small native watcher remains while the app runs; it is not another Electron instance.

`graphics-startup-last.json` in the existing PDFix profile records the two possible modes, whether the interface became usable, exit codes, the choice and successful mode. It contains no filenames, document contents, arguments or raw logs. Test profiles receive their own receipt. Failure to update this diagnostic does not interrupt an already working app.

## Package changes needed from the integrator

1. The locked build now compiles `dist/native/graphics-startup/PDFix.exe` and its manifest. Verify its file/source hashes alongside the other native artifacts.
2. Put this launcher at the outer `app/PDFix.exe`. Put the entire existing Electron application under `app/runtime/`, including `runtime/PDFix.exe`, supporting DLLs and `runtime/resources/app`. The launcher accepts no alternate runtime path from arguments or environment.
3. Include both layers in the package inventory/checksums. Keep the public manifest launch, installer, shortcut and Open with executable as the outer `PDFix.exe`.
4. `WindowsContextTools` currently receives `process.execPath`, which will be the inner executable. Resolve it to the outer launcher for this packaged layout. Keep resources/app paths pointing to the actual inner resources. Review other registered entry points for the same distinction.
5. Run packaged startup, second-instance file handoff and Open with checks after integration. Do not upload or rebuild a final package while another check owns the run lock.

The package/installer/registration changes are larger shared work and were deliberately left for Claude under AGENT-WORKFLOW Rule 2. The additive main and Vite hooks were each committed alone, immediately.

## Evidence

- `node --test tests/pdf-graphics-startup.test.cjs tests/pdf-graphics-launcher.test.cjs`: 10/10 passing tests. The native test covers eight scenarios: normal success, argument round trip, accepted retry, both modes failing, decline, graphics failure after the interactive/save-possible marker, unrelated failure and invalid marker. Also tests path/token/mode/identity/hard-link refusal and direct-start compatibility.
- Locked hidden check `scripts/check-reader-graphics-retry.mjs`: two real built-app modes pass. Hardware acceleration is true normally, false after the accepted software retry; generated drawing text/artwork appears; all processes exit 0. Final hidden receipt: `C:/Users/andre/AppData/Local/Temp/pdfix-graphics-check-49MLGT/report.json`.
- Explicitly requested visible main-PC acceptance: two visible drawing windows, plus real native Retry and default Close controls. Native buttons are activated by the test timer and all windows close automatically. Four final PNGs personally inspected. Final receipt: `C:/Users/andre/AppData/Local/Temp/pdfix-graphics-check-YhEEy9/report.json`. Normal receipt records one child; retry receipt records the simulated fatal child plus one successful software child.
- Four existing hidden built-app reader regressions pass with the additive startup hooks: rendering/navigation/search, scan-only text, passwords/cancel and damaged-file recovery/print preparation.

The first fatal event is simulated by a test bootstrap, not by breaking the real GPU. The normal case uses the compiled production launcher. The accepted-retry case invokes the same production supervisor through a native test harness that supplies the choice; the real prompt is checked separately. This proves the recovery mechanism, not that software rendering fixes every real graphics failure. The spare PC, real user profile, documents and printer were untouched. Spare-PC signed-in-desktop acceptance remains Claude's after the robot finishes.

One build detected a concurrent source save and automatically retried successfully through agent-build. Initial hidden captures were stale Home frames; the final controller waits for painted frames and checks generated drawing text. Those earlier images are not drawing screenshot evidence.
