// PDF.js document proxies expose their owning loading task in current versions.
// Keep worker/network cleanup with that owner rather than a removed proxy method.
export function destroyPdfDocument(doc) {
  if (!doc) return Promise.resolve();
  const owner = doc.loadingTask;
  if (typeof owner?.destroy === 'function') return Promise.resolve().then(() => owner.destroy());
  if (typeof doc.destroy === 'function') return Promise.resolve().then(() => doc.destroy());
  return Promise.reject(new Error('The PDF preview has no supported cleanup owner.'));
}
