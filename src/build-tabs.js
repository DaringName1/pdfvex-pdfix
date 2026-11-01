// Shared visible order; legacy keys keep existing tool controllers and drafts stable.
export const BUILD_TABS = Object.freeze([
  'File', 'Home', 'Insert', 'Edit', 'Review', 'Fill & Sign', 'Pages', 'View', 'Protect', 'Measure', 'Export'
]);
export const readerTabKey = name => name === 'Review' ? 'Comment' : name;
export const readerTabName = name => name === 'Comment' ? 'Review' : name;
export const documentTabKey = name => name === 'Pages' ? 'layout' : name.toLowerCase();
export const PDF_ONLY_TABS = Object.freeze(['Fill & Sign', 'Protect', 'Measure']);
