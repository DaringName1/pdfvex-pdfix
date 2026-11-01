# Shared Text tool — October 21

Reader-side interface for plan 2.15. Claude owns inline content/form implementations (2.18). No writer, redaction-output or table-extraction model changes here.

## Entry points

- `reader.openTextTool(method?)`: returns a promise for the active session. Method ids: `click-to-type`, `edit-existing`, `text-box`. Default is Click to type when connected, otherwise Text box.
- `reader.registerTextMethod(method, activate)`: connects an implementation, returns an unregister function. Register before the method is first opened. Registration does not open it.
- `activate({reader, method, signal, previousSession})`: attach controls beside the existing main PDF. Return a session only after ready. Honor cancellation. It must not create another PDF reader or popup. `previousSession` is not permission to destroy another tool's draft.
- Session: `{optionsRoot, resume?, suspend?, onModeChange?, prepareDeparture?, dispose?, closed?}`. `optionsRoot` must be inside the reader root, outside the paper and outside any dialog. The common three-method selector moves into this container.
- `resume(context)` reactivates the existing method without discarding work. A maximum of one session per method is cached. A closed session is disposed and reopened on the next selection.
- `suspend({retainDraft:true})` stops gestures and hides the old options/overlay, retaining drafts. Do not call workspace departure or clear recovery when switching methods.
- `onModeChange('view'|'build')` stops editing in View and restores the same draft in Build. The host already hides the method selector.
- `prepareDeparture()` may flush recovery/refuse unsafe departure. Only implement it here if the reader does not already call that controller's departure hook.
- `dispose()` releases only resources this method owns. It must not dispose the reader. The shared controller calls all cached methods even when one cleanup fails.

Text box is connected to editable FreeText comments through the existing markup writer. Claude connected Click to type and Edit existing in d87a0f0. October22 integration check found switching to Text box leaves a suspended content host lease; see HANDOFF for reproduction and controller follow-up. There is no fallback to the old popup. Home and Edit Add text enter the same selector; the Comment Text box button selects its Text box method.

## Integration still needed from Claude

Connect Click to type / Edit existing in 2.18; route existing Fill and sign / Edit text entry points to the appropriate method. Remove duplicate content-text entries only when their image functionality remains accessible. Please give the canonical Text entry a shared registry name/id; Codex did not edit `src/tool-registry.js`. Current Home caption remains the approved Add text pending shared naming.

New robot `textActions` is opt-in and needs the matching package. Old Home action now expects this selector. Copy actions and package together. Do not enable Text actions on older packages.
