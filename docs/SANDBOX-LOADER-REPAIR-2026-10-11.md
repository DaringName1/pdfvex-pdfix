# Contained PDF engine loader repair

The user reported the runtime-dependency message after the Windows environment repair. That message combined three different Windows loader failures: missing/inaccessible DLL (`0xc0000135`), incompatible executable format (`0xc000007b`) and DLL initialization failure (`0xc0000142`). The reported text does not identify which occurred or name a failing DLL.

Static inspection of the bundled PE import tables found the direct qpdf/Visual C++ dependency chain represented in the packaged runtime; the remaining imported API sets/system DLLs are Windows components. The installed ucrtbase, kernel32 and Visual C++ runtime files were present. This does not prove runtime loadability or AppContainer access.

Implemented an explicit broker `SetDllDirectoryW` pointing at the pinned private runtime before process creation. The child receives a fixed PATH containing only that directory and Windows System32 rather than an inherited user PATH. Paged qpdf starts with its read-only runtime directory as the working directory; input/output argument paths remain absolute. Existing private file permissions, zero capability SIDs, token verification, job limits and original-file protection remain.

The paged error now distinguishes the three loader conditions and includes the exact hexadecimal Windows status. Another failure must retain that code before diagnosing a missing component, architecture mismatch or initialization problem.

This is a source-level repair candidate, not confirmed resolution. No PDF/native/UI/performance tests were run; source syntax and compilation only. The real drawing still needs opening acceptance.

Microsoft documents DLL search behavior and inheritance of a parent's SetDllDirectory configuration in [DLL search order](https://learn.microsoft.com/en-us/windows/win32/dlls/dynamic-link-library-search-order).

Compilation: two JavaScript syntax checks passed; npm run build exited 0, 328 modules. Source snapshot 28fd6596fea0896900c6d529b891666572065d048c2c666cce9e8892a684083f; native broker 8ecef876a99af1ff5534f3e7ee9bd83d9758451799cc35c475658b1a5fe7a24e; native source de4239e82d497401d319b22b720ba8bd1780c9f1c1f8b955ca58731d58172b9e. Runtime acceptance remains pending.
