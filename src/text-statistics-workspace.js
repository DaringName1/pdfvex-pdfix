import {emptyTextStatistics, addTextStatistics} from './text-statistics.js';
import './text-statistics-workspace.css';

const number = value => new Intl.NumberFormat().format(value);
const statLine = (label, value) => `${label}: ${value == null ? 'Unavailable' : number(value)}`;

/**
 * Generic local statistics panel. `getScope(id, {signal, options})` returns
 * {chunks: AsyncIterable<string|{text, paragraphs?}>, pageCount?,
 *  pageCountLabel?, notes?}. Each chunk must be a complete semantic text unit.
 * The provider owns selection/page/document extraction and any omitted content.
 */
export class TextStatisticsWorkspace {
  constructor(host, {scopes, getScope, locale, title = 'Text statistics', options = []} = {}) {
    if (!Array.isArray(scopes) || !scopes.length || typeof getScope !== 'function') throw new TypeError('Statistics scopes and getScope are required.');
    this.getScope = getScope;
    this.locale = locale;
    this.closed = false;
    this.generation = 0;
    this.root = document.createElement('section');
    this.root.className = 'text-statistics-workspace';
    this.root.hidden = true;
    this.root.setAttribute('aria-label', title);
    const heading = document.createElement('h2'); heading.textContent = title;
    const close = document.createElement('button'); close.type = 'button'; close.className = 'text-statistics-close'; close.textContent = 'Close'; close.onclick = () => this.hide();
    // Escape inside the panel closes it, like its Close button.
    this.root.addEventListener('keydown', event => { if (event.key !== 'Escape' || this.root.hidden) return; event.preventDefault(); event.stopPropagation(); this.hide(); });
    const controls = document.createElement('div'); controls.className = 'text-statistics-controls';
    const scopeLabel = document.createElement('label'); scopeLabel.textContent = 'Scope ';
    this.scope = document.createElement('select'); this.scope.setAttribute('aria-label', 'Statistics scope');
    for (const scope of scopes) { const item = document.createElement('option'); item.value = scope.id; item.textContent = scope.label; this.scope.append(item); }
    scopeLabel.append(this.scope); controls.append(scopeLabel);
    this.optionInputs = new Map();
    for (const option of options) { const label = document.createElement('label'); const input = document.createElement('input'); input.type = 'checkbox'; input.checked = !!option.checked; input.dataset.statisticsOption = option.id; label.append(input, document.createTextNode(' ' + option.label)); controls.append(label); this.optionInputs.set(option.id, input); input.onchange = () => this.refresh(); }
    const refresh = document.createElement('button'); refresh.type = 'button'; refresh.textContent = 'Refresh'; refresh.onclick = () => this.refresh(); controls.append(refresh);
    this.scope.onchange = () => this.refresh();
    this.status = document.createElement('p'); this.status.className = 'text-statistics-status'; this.status.setAttribute('role', 'status'); this.status.setAttribute('aria-live', 'polite');
    this.results = document.createElement('dl'); this.results.className = 'text-statistics-results';
    this.notes = document.createElement('p'); this.notes.className = 'text-statistics-notes';
    this.root.append(heading, close, controls, this.status, this.results, this.notes);
    host.append(this.root);
  }
  show(scope) { if (this.closed) return; if (scope && [...this.scope.options].some(item => item.value === scope)) this.scope.value = scope; this.root.hidden = false; this.refresh(); }
  hide() { this.root.hidden = true; this.cancel(); }
  cancel() { this.generation++; this.controller?.abort(); this.controller = null; }
  invalidate() { if (!this.root.hidden) this.refresh(); }
  optionValues() { return Object.fromEntries([...this.optionInputs].map(([key, input]) => [key, input.checked])); }
  render(stats, meta = {}, partial = false) {
    const rows = [statLine('Words', stats.words), statLine('Characters (with spaces)', stats.characters), statLine('Characters (without spaces)', stats.charactersNoSpaces), statLine('Paragraphs', stats.paragraphs), statLine(meta.pageCountLabel || 'Pages', meta.pageCount)];
    this.results.replaceChildren();
    for (const row of rows) { const at = row.indexOf(': '); const dt = document.createElement('dt'); dt.textContent = row.slice(0, at); const dd = document.createElement('dd'); dd.textContent = row.slice(at + 2); this.results.append(dt, dd); }
    this.status.textContent = partial ? `Counting… ${number(stats.units)} text units processed` : `${number(stats.units)} text units counted. Words: ${stats.wordMethod}; characters: ${stats.characterMethod}.`;
    this.notes.textContent = (meta.notes || []).join(' ');
  }
  async refresh() {
    if (this.closed || this.root.hidden) return;
    this.cancel();
    const generation = this.generation;
    const controller = new AbortController(); this.controller = controller;
    this.status.textContent = 'Preparing text…'; this.results.replaceChildren(); this.notes.textContent = '';
    try {
      const meta = await this.getScope(this.scope.value, {signal: controller.signal, options: this.optionValues()});
      if (generation !== this.generation || controller.signal.aborted) return;
      if (!meta?.chunks || typeof meta.chunks[Symbol.asyncIterator] !== 'function') throw new TypeError('Statistics scope must provide an async chunk iterator.');
      const stats = emptyTextStatistics(); this.render(stats, meta, true);
      for await (const chunk of meta.chunks) {
        if (generation !== this.generation || controller.signal.aborted) return;
        const unit = typeof chunk === 'string' ? {text: chunk} : chunk;
        await addTextStatistics(stats, unit.text, {locale: this.locale, paragraphs: unit.paragraphs, signal: controller.signal});
        if (generation !== this.generation || controller.signal.aborted) return;
        this.render(stats, meta, true);
      }
      this.render(stats, meta, false);
    } catch (error) {
      if (generation === this.generation && !controller.signal.aborted) this.status.textContent = error?.message || 'Statistics could not be counted.';
    } finally { if (this.controller === controller) this.controller = null; }
  }
  dispose() { if (this.closed) return; this.closed = true; this.cancel(); this.root.remove(); }
}
