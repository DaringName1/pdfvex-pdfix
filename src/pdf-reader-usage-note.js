export function showReaderUsageRightsNote(panel,info){
  if(!info?.usageRightsRemoved||panel.querySelector('[data-reader-usage-rights]'))return;
  const note=panel.ownerDocument.createElement('p');note.dataset.readerUsageRights='';note.textContent="Adobe Reader's extra form features are removed in the copy; your answers are kept.";(panel.querySelector('.reader-options-body')||panel).prepend(note);
}
