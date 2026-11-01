# Windows desktop and taskbar branding — October 18

Owner request: the logo must work for everyone, including another computer and reopening after unpinning.
This explicitly requested branding repair is separate from the audit's feature freeze.

Implemented:
- Startup launcher embeds all seven images from `public/brand/pdfix.ico`; compilation records/checks its SHA.
- Package assembly checks the source icon SHA matches the launcher manifest.
- Installer shortcuts use the inventory-verified packaged `.ico`, rather than the unbranded launcher/runtime icon.
- Main window uses the Windows `.ico`. Packaged windows declare PDFix app ID, icon, display name and a quoted
  relaunch command pointing at the outer launcher. Unpinning does not change the executable/window branding.
- Development and unsupported runtime layouts are not given an incorrect packaged relaunch command. Failure to
  set cosmetic shell properties does not crash startup. Graphics retry/save fences and security remain unchanged.

Shared files were clean when edited. Small requested branding changes were committed individually immediately:
`15b8cbd` main startup, `27417f4` installer, `a17fd6a` package verifier. No editor changes were included.

Evidence:
- `tests/pdf-window-branding.test.cjs`: quoted launcher, identity/icon, unsupported paths, fail-safe behavior.
- `tests/pdf-launcher-icon.test.cjs`: read actual PE RT_GROUP_ICON/RT_ICON resources as data, compare all seven
  encoded icon payloads with source, plus icon-manifest hash. No executable resource editing in the test.
- Existing `tests/pdf-graphics-launcher.test.cjs`: eight normal/retry/decline/no-loop/save-fence scenarios pass.
- `scripts/check-reader-branding.mjs --package=<integrator package>` runs through agent-run. It clones the existing
  runtime in Temp and overlays current main/helper and built launcher; **not a new release**. Actual packaged mode
  and hidden window confirmed. Native SHGetPropertyStoreForWindow reads actual relaunch/icon/display/app-ID values;
  all match. Existing package source hashes remain unchanged. App closes cleanly, no page errors.
- Receipt: `docs/evidence/codex/packaged-window-branding.json`. No user documents or private drawing used.

Windows property definitions: [RelaunchCommand](https://learn.microsoft.com/en-us/windows/win32/properties/props-system-appusermodel-relaunchcommand)
and [RelaunchIconResource](https://learn.microsoft.com/en-us/windows/win32/properties/props-system-appusermodel-relaunchiconresource).
Electron API was checked against the installed pinned runtime's `electron.d.ts` AppDetailsOptions/setAppDetails.

Still required: Claude's next combined installer/package, installed-package acceptance, and the spare-PC visual
check after its reserved robot run (approximately October 19 14:30). Do not modify the active spare-PC installation.
The owner's current desktop/Start-menu/pinned shortcut correction is local and still points at the older package.
No claim that that installed executable or the running spare-PC version already contains these source fixes.
Windows may retain an old pinned icon until the old shortcut is replaced; the updated app advertises the correct
icon and relaunch target for new pins. Installer does not force-pin apps or change users' existing taskbar choices.

Earlier work remains open: A-R2 natural private-memory growth, remaining save-route structure fixtures,
chained forced-close recovery, broad hostile corpus/outside-viewer/device acceptance and two consecutive clean
cloud runs. Custom font adapter is approved but deferred under audit priority; no add-ons/workspaces added.

## Owner follow-up: the tiny wordmark

Owner's taskbar screenshot shows the full wordmark scaled into a small square. It is too short/thin to read.
The Windows.ico now uses ONLY the existing document symbol, not the letters. No new brand or AI redraw:
build-pdfix-windows-icon.mjs compiles pdfix-icon-artwork.cs, isolates the existing alpha-bounded document at
184,188/362x434 from1920x819 pdfix-logo.png, fits it with5% padding, and writes seven transparent PNG icon sizes
plus pdfix-app.png. The full in-app wordmark file is unchanged. Builder and source live in the project.
Current.ico SHA256:f56dba9f0390093b42bcfefaa746a549bb76d17cfb1f733732826fc5ae4cf113.

Personally inspected512px output; native resource test additionally requires each icon to fill at least75% of its
height and50% of width, avoiding the previous tiny-wordmark regression. Seven exact launcher payloads pass.
Latest real packaged-overlay receipt is hfeaO9 (archived), with the new icon copied into the private test runtime;
original release remains unchanged. All388unit tests pass, one skip (389total).

Owner's main-PC desktop/Start-menu shortcut icons were updated to a SHA-named copy of the new icon in local
PDFix/branding; installation receipt shortcut hashes updated. No matching pinned shortcut remained at that moment;
no new pin was forced and no running app was restarted. The old running app still needs the updated combined
package to acquire its new window icon/properties. Spare PC and personal documents untouched.

Owner also reported Markdown source covering the preview: reproduced in built app at Fit width and200%, source
unchanged. The exact editor-lane request is CLAUDE-MARKDOWN-LAYOUT-REQUEST-2026-10-18.md; not fixed by icon changes.
Regression qualification: initial full run388pass/1skip. A later full repeat had387pass/1fail/1skip: compression's
second output check could not start its AppContainer sandbox, correctly publishing no copy. Isolated full compression
suite then passes10/10. This is an intermittent existing sandbox-start symptom, not evidence of an icon regression
or grounds to weaken sandbox checks. Logs retained in tmp/codex-branding-unit-final.log; confirmation run pending.
Quiet full confirmation passes388/389 with one skip, zero failures. Prior intermittent failure remains recorded; this does not establish two clean cloud runs or resolve its cause.
