export function historyEntryType(entry){return entry.type==='backup'?'Saved file':entry.type==='earlier'?'Before this file changed · read-only':'Edit version';}
export function canRestoreHistoryEntry(entry,draft,sourceMode){return !!entry&&entry.type==='version'&&!entry.readOnly&&!!draft&&draft.kind===(sourceMode?'source':'rich');}
