# Graphics startup: decision for the owner

**October 17 decision:** the owner approved option 2, an explicit one-time software-graphics retry. Implementation and main-PC hidden/visible checks are ready; combined packaging and spare-PC acceptance remain with Claude. See [integration and evidence](GRAPHICS-RECOVERY-INTEGRATION-2026-10-17.md).

PDFix has sometimes failed before its first window appears on the main Windows 11 PC. The recorded failure is in the graphics process. Restarting that PC was followed by successful PDF reading and checks. We have not proved what caused it or that restarting permanently fixes it.

## What we know

- Main PC: Windows 11 Pro 26200, NVIDIA RTX 5070 Ti, recorded driver 32.0.16.1656. Logs contain repeated graphics-process exits (`0x80000003`) and “GPU process isn't usable”. Small Electron test apps also failed during the affected period, including tests with acceleration disabled. This makes a graphics/Windows session problem plausible; it does not establish a driver defect or rule out PDFix contributing.
- Frequency: intermittent periods, not a measured percentage of everyday starts. One hidden matrix passed all 18 starts; a later affected period failed nine timing controls and all 18 matrix controls. Those repeated starts share the same machine/session and are not independent user incidents. After the reported restart, a normal-graphics 20-minute PDF session and 14 targeted tests completed successfully. The successful session has no recorded fatal graphics exits.
- Fresh Windows cloud: the first failed launch immediately after search-all in both 39015538648 and 39030515039 now has retained stderr proving repeated graphics exits 0x80000003 and a fatal graphics abort before a window. Later launches cascade. The owner reports this sequence in three of the last five runs; only these two were newly inspected. This broadens the issue beyond the main PC's specific NVIDIA card. It still does not prove an orphan, leak or driver defect as the trigger, or identify the cause of every earlier failed launch. See [launch-cascade evidence and cleanup correction](READER-LAUNCH-CASCADE-2026-10-17.md).
- Spare Windows 10 PC: Claude reports successful signed-in-desktop robot runs. No matching graphics incident has been established there. Sandbox failures when launched directly over SSH are a separate problem.
- Screenshot-only `UnknownVizError` with an otherwise healthy process is separate from an app startup crash. The hidden fullscreen check exposing a window is also separate.

Evidence and retained receipts: [startup and memory investigation](READER-STARTUP-MEMORY-2026-10-16.md), [fresh-Windows investigation](READER-CLEAN-WINDOWS-2026-10-16.md). These are hidden-app checks; visible everyday startup reliability still needs human evidence.

## Choices

| Choice | Benefit | Cost / limitation |
| --- | --- | --- |
| Keep current graphics behavior and show a clear recovery message | Preserves fast drawing and scrolling; smallest change | A bad graphics session may still prevent opening. An external startup watchdog would be needed if the app dies before it can show the message. |
| Offer one “Try again using software graphics” restart after a confirmed graphics failure | Lets the person recover without permanently slowing PDFix; records which mode worked | Needs bounded restart handling, recovery checks and visible testing. Software rendering may use more CPU and make large drawings slower. It may still fail: some software controls failed in the affected session. |
| Automatically make one software-graphics restart after a confirmed failure | Less effort for the person | Can conceal a recurring fault or surprise the person with slower rendering. Must never loop, restart during a save, or bypass recovery/security checks. The watchdog needs to survive an early app exit. |
| Always disable acceleration | Consistent setting and simpler selection | Potentially slower scrolling/zoom; no evidence this fixes the observed failure. Not recommended. |

## Recommendation

Keep normal acceleration as the default. If the owner approves implementation, add a clearly explained, one-time software-graphics retry after a **confirmed** graphics startup failure, with a restart limit and a small diagnostic receipt. Start with an explicit choice rather than a silent permanent change. Test both modes in a visible window on the main PC and on the spare PC's signed-in desktop before release. Keep hardware mode for sessions that start normally.

Do not reduce the sandbox or other security settings. Do not add a GPU switch merely because a screenshot failed. The owner has approved the explicit retry. The new launcher applies software graphics only to that one chosen child; normal starts remain accelerated. Package integration and real-failure acceptance remain pending, so A-R4 is not closed.
