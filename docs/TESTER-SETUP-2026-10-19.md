# Putting the test version on your dad's PC (about 10 minutes)

Claude will name the folder to use on Sunday (under `releases`, a name like `PDFix-0.1.0-2026...-win-x64`).

## Simplest way: copy the folder (recommended)
1. Copy the whole release folder to a USB stick, or to a shared folder you can reach from his PC.
2. On his PC, copy it to **C:\PDFix** (create that folder). Keep everything inside together.
3. Open **C:\PDFix\app**, right-click **PDFix.exe**, choose **Show more options > Send to > Desktop (create shortcut)**
   (on Windows 10 it is directly under **Send to**). Rename the shortcut to **PDFix**.
4. Double-click the shortcut. If Windows says **"Windows protected your PC"**, click **More info** then
   **Run anyway** (the test version is not signed yet). This happens only the first time.
5. Open one of his drawings to check it works, then close PDFix.

Nothing else on his PC changes: no default apps, no right-click menu entries, nothing in the registry.

## Alternative: the installer
In the release folder, right-click **Install-PDFix.ps1** > **Run with PowerShell**. It installs for his Windows user
only, adds PDFix to the Start menu, and with `-DesktopShortcut` a desktop shortcut. Do **not** use
`-RegisterOpenWith` for this test. If Windows refuses to run the script (files copied from a USB stick or download
are sometimes blocked), use the simple way above instead.

## Removing it later
- Copied folder: delete **C:\PDFix** and the desktop shortcut.
- Installer: run the installed **Uninstall-PDFix.ps1**.

His files are never changed or removed: PDFix saves new copies, and his recovery drafts and settings stay in his
own app data until removed.

## Before you leave
- Show him **Settings & privacy > Save a problem report** (also F1, type "problem").
- Leave the printed [tester guide](TESTER-GUIDE-2026-10-19.md) next to the PC.
