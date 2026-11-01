# Paged engine initialization: private desktop repair

The user reported the exact Windows status `0xc0000142` after the prior environment and DLL-search changes. This is DLL initialization failure. It is not proof of a missing DLL or a damaged PDF, and the status alone does not identify the failing module.

Static import inspection found USER32 among qpdf30.dll's imports. A legacy console executable can still require Windows desktop objects to initialize USER32. The previous paged broker used the default desktop without explicitly establishing package-SID access. Desktop-object access is therefore a repair hypothesis, not a confirmed runtime diagnosis.

## Implemented

- Paged processing creates a uniquely named, hidden desktop with an explicit private DACL and low integrity label. The owning user/System/Administrators retain control; the exact session package SID may read/write private objects and create private windows. It gets no hook, journal, desktop-switch or ACL-edit rights on this desktop.
- The child startup structure selects that private desktop. Its package SID receives only READ_CONTROL and WINSTA_READATTRIBUTES on the existing window station; no station clipboard/screen/create-desktop/global-atom permissions are added. No permissions on the visible desktop are changed. Creating a separately named window station was avoided because Windows documents an administrator requirement for named stations.
- The broker restores its original thread desktop and closes the private desktop after child termination. It removes only the exact per-session station ACE it inserted, leaving concurrent jobs' ACL entries intact. Session cleanup also removes an exact matching station ACE if broker cancellation prevented the normal finally block.
- Setup/cleanup failures have separate `desktop` and `desktopcleanup` stages. Existing read-only source/runtime slots, single writable output, process/memory/time limits, zero capability verification and no-unrestricted-fallback policy remain.

No PDF/native/UI/performance tests were run. JavaScript syntax and C# compilation are the verification scope. Actual drawing opening and isolation/cancellation/cleanup acceptance remain pending. A successful build does not establish that USER32 caused the original error or that this repair resolves it. Other DLL initialization causes remain possible.

Microsoft references: [desktop access rights](https://learn.microsoft.com/en-us/windows/win32/winstation/desktop-security-and-access-rights), [window station rights](https://learn.microsoft.com/en-us/windows/win32/winstation/window-station-security-and-access-rights), [CreateDesktop](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createdesktopw), [CreateWindowStation](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createwindowstationw).

Compilation: two JavaScript syntax checks passed; C# broker compiled; npm run build exited 0, 328 modules. Source snapshot a079d6976fde7e7e1077565f206ba4c7e0e5173816b57fd7bc1cb5fea3d556d9; native broker 13d0878ce088dbcfb1d13aeb2b9e86842c77f181363c2a8625c8fd013f616ed3; native source f25b5d33bd2a48f94cb2e9a124f23fcc09599fa886a8d79c861fff43916963b8. Runtime acceptance remains pending.
