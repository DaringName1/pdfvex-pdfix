# PDFix sandbox, explained

For a drawing reviewer: PDFix processes a PDF in a separate, restricted Windows process. Think of it as a locked workroom. The large-file reader gives it a private copy of the drawing to read and one private page file to write. It requests no network capabilities, prevents child processes and limits memory and time. The viewer receives a prepared page instead of loading the entire drawing into RAM. These are coded controls; complete runtime isolation and drawing-fidelity acceptance remain pending.

The sandbox is not a setting your dad needs to enlarge or configure. It is part of PDFix. A startup failure means PDFix cannot start the restricted process, so it stops rather than running an unrestricted parser. It is distinct from the separate Windows Sandbox desktop application.

## Reported code 203

Windows code 203 (`ERROR_ENVVAR_NOT_FOUND`) means a required environment setting was not found. The reported stage was `launch`, before PDF parsing began. This is not evidence of an oversized PDF or an antivirus block. Which missing setting Windows attempted to resolve is not identified by that code.

Source inspection found the broker's sanitized environment omitted `USERPROFILE`, `LOCALAPPDATA`, `APPDATA`, `ProgramData` and `SystemDrive`. AppContainer startup uses Windows profile locations. The repair supplies this small, explicit Windows-location allowlist to the trusted broker without inheriting PATH, keys or unrelated environment settings. It does not grant the parser additional filesystem access.

The restricted child receives an explicitly sorted, double-null-terminated Unicode environment block. Child profile/temp settings point to its private staging folder, and Windows installation/drive settings are supplied explicitly. All containment checks and resource limits remain.

The paged error message now distinguishes code 203 from possible loader/security blocks. Actual opening of the user's drawing is required to determine whether these environment changes resolve the failure. No PDF/native/UI/performance tests were run during this coding pass.

References: [Microsoft error codes](https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--0-499-), [AppContainer startup](https://learn.microsoft.com/en-us/windows/win32/secauthz/implementing-an-appcontainer), [environment blocks](https://learn.microsoft.com/en-us/windows/win32/procthread/changing-environment-variables).

Compilation: three JavaScript syntax checks passed; npm run build exited 0, 328 modules. Source snapshot a908d971ebd49f4a78100dc3d066f101fd6d46383f2d977083153ac283d7a8ac; native broker 4412ea194bc6f7823f6beefa7462aa075b7aa00fe7e328833c556bc1180bc438; native source e87794d94545360d05811ec00e49bf7ab5b1253ea3e56606cf15a0f0fdb697f9. Actual drawing acceptance remains pending.
