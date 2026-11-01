# Local form autofill coding — October 11, 2026

F48 is integrated in **Fill and Sign → Local autofill profiles**. This is implemented groundwork for the full adopted target; broader UI/form-output and compatibility checks remain open.

## Coded behavior

- Create, edit, reload, remove and explicitly clear local profiles. Each has a name and labeled reusable text values. Existing supported values can be copied into the profile editor only after a user action and saved only through Save profile.
- Store the complete profile library encrypted through Electron safeStorage's available OS provider. No plaintext fallback; Linux's basic-text provider is rejected. Main-process IPC is authorized through the existing application-origin gate. Browser storage is not used for profiles.
- Handle both current asynchronous decrypt return objects (`result`) and legacy synchronous string returns. The installed Electron declarations establish this API shape; the initial focused check exposed and led to correction of the asynchronous-result mismatch.
- Bounded library: 50 profiles, 100 entries each, 80-character profile names, 120-character labels, 2,000-character values, 256 KiB plaintext JSON and 512 KiB encrypted envelope. Reject duplicate entry labels, invalid IDs/shapes and explicit password/private-key/access-credential labels. Writes use exclusive temporary files, fsync and rename; linked target/temporary files are refused. Explicit Clear deletes the library and recognized encrypted interrupted-write files without touching documents.
- An explicitly selected profile proposes label/alias matches against nonsensitive, editable, supported fields. Ambiguities require manual mapping. Show current/proposed values; existing nonblank values are not preselected for replacement. Per-field length, one-line, checkbox and supported option checks precede application.
- Apply selected reviewed values as one undoable form edit, invalidating stale output and retaining the existing native preview/approval/new-copy save path. Changing form values invalidates mappings. Sensitive/protected fields remain excluded. Applied values enter the existing form-recovery draft, whose unencrypted local storage is disclosed in the panel.

## Remaining scope

Full UI/keyboard/scale/departure and actual PDF-output round trips, malformed/corrupt/locked/disk-full/permission-denied storage cases, crash/concurrent external modification handling, wider label/language/choice semantics, secure unsaved profile-edit recovery and OS key-rotation/account-migration behavior require further implementation or checks. The current profile editor explicitly requires Save profile; it has no draft recovery. No automatic filling, password capture, signature generation or cryptographic identity claim is made.

The focused batch report and final build are recorded in [the batch checkpoint](FEATURE-BATCH-FORMS-REVISIONS-2026-10-11.md). Backend storage/matching evidence does not establish the complete UI or full F48 acceptance.
