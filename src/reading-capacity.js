export function readingCapacity(parent) {
  const section = document.createElement('section');
  section.className = 'info-card reading-capacity';
  section.setAttribute('aria-labelledby', 'reading-capacity-title');
  const heading = document.createElement('h2');
  heading.id = 'reading-capacity-title';
  heading.textContent = 'PDF reading capacity';
  const intro = document.createElement('p');
  intro.textContent = 'A current estimate from this computer’s memory, processor, and graphics status.';
  const details = document.createElement('p');
  details.setAttribute('aria-live', 'polite');
  details.textContent = 'Reading computer information…';
  const estimate = document.createElement('p');
  estimate.className = 'reading-capacity-estimate';
  const caveat = document.createElement('p');
  caveat.textContent = 'This is an estimate, not a speed guarantee. PDF complexity, graphics, other apps, and current workload affect responsiveness.';
  const refresh = document.createElement('button');
  refresh.type = 'button';
  refresh.className = 'secondary compact';
  refresh.textContent = 'Refresh estimate';

  const render = async () => {
    refresh.disabled = true;
    details.textContent = 'Reading computer information…';
    try {
      if(!section.isConnected)return;
      if (typeof window.pdfix?.readingCapacity !== 'function') throw new Error('Computer capacity information is unavailable in this app session.');
      const report = await window.pdfix.readingCapacity();
      if(!section.isConnected)return;
      const graphics = report.graphics && Object.keys(report.graphics).length
        ? Object.entries(report.graphics).map(([key, value]) => `${key}: ${value}`).join(' · ')
        : 'Graphics status unavailable';
      details.textContent = `Memory: ${report.availableMiB} MiB available of ${report.totalMiB} MiB · Processor: ${report.cpuModel} · ${report.logicalCores} logical cores · Graphics: ${graphics}`;
      estimate.textContent = `Estimated full-document viewer budget: ${report.estimatedPdfMiB} MiB, with up to ${report.pageLimit} pages before switching modes. PDFs above the memory or page budget can use disk-backed, page-at-a-time reading; this estimate is not a maximum file size. That mode needs two temporary disk copies and remains limited by page complexity and the contained parser’s memory/time budget. Whole-file editing tools support up to ${report.wholeFileToolMiB} MiB. Low-memory reading reduces preview and background work.`;
    } catch (error) {
      details.textContent = error?.message || 'Computer capacity information could not be read.';
      estimate.textContent = '';
    } finally {
      refresh.disabled = false;
    }
  };

  refresh.addEventListener('click', render);
  section.append(heading, intro, details, estimate, caveat, refresh);
  parent.append(section);
  render();
  return section;
}
