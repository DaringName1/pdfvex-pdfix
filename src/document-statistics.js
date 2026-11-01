import {TextStatisticsWorkspace} from './text-statistics-workspace.js';
import {emptyTextStatistics, addTextStatistics} from './text-statistics.js';
import {documentBandText} from './document-band-model.js';

const sourceNote = 'Source syntax may contain words that are not prose. Check “Count source as prose” to include it.';
const editorPageNote = 'The editor scrolls as one sheet; exported page count depends on final layout and is unavailable here.';

function bodyUnits(doc, from = 0, to = doc.content.size) {
  const units = [];
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return;
    const start = Math.max(from, pos + 1), end = Math.min(to, pos + node.nodeSize - 1);
    if (end <= start) return false;
    const text = node.textBetween(start - pos - 1, end - pos - 1, '\n', '');
    units.push({text, paragraphs: text.trim() ? 1 : 0});
    return false;
  });
  return units;
}

function bandText(layout, location) {
  return layout[location + 'Band'] ? documentBandText(layout[location + 'Band']) : layout[location + 'Text'] || '';
}

export class DocumentStatistics {
  constructor(editor) {
    this.editor = editor;
    this.footer = editor.root.querySelector('.word-count');
    this.button = document.createElement('button');
    this.button.type = 'button'; this.button.className = 'text-statistics-footer-button';
    this.button.textContent = 'Statistics';
    this.footer.after(this.button);
    this.workspace = new TextStatisticsWorkspace(editor.root, {
      title: 'Document statistics',
      scopes: [{id: 'selection', label: 'Selection'}, {id: 'document', label: 'Document'}],
      options: editor.sourceMode
        ? [{id: 'sourceAsProse', label: 'Count source as prose'}]
        : [{id: 'includeBands', label: 'Include header and footer once'}],
      getScope: (scope, context) => this.getScope(scope, context)
    });
    editor.root.querySelector('.editor-toolbar').after(this.workspace.root);
    this.button.onclick = () => this.workspace.show('document');
    this.controller = null;
  }
  getScope(scope, {signal, options = {}} = {}) {
    const editor = this.editor;
    if (editor.disposed || editor.departing) throw new Error('Document statistics are unavailable while leaving.');
    if (editor.sourceMode && !options.sourceAsProse) throw new Error(sourceNote);
    const revision = editor.revision;
    let units, selectionEmpty = false;
    if (editor.sourceMode) {
      const text = editor.input.value;
      const from = scope === 'selection' ? editor.input.selectionStart : 0;
      const to = scope === 'selection' ? editor.input.selectionEnd : text.length;
      selectionEmpty = scope === 'selection' && from === to;
      const selected = text.slice(from, to);
      units = selected ? [{text: selected, paragraphs: selected.split(/\r\n|\r|\n|\f/u).filter(line => line.trim()).length}] : [];
    } else {
      const {doc, selection} = editor.editor.state;
      const from = scope === 'selection' ? selection.from : 0;
      const to = scope === 'selection' ? selection.to : doc.content.size;
      selectionEmpty = scope === 'selection' && from === to;
      units = bodyUnits(doc, from, to);
      if (scope === 'document' && options.includeBands) {
        for (const location of ['header', 'footer']) {
          const text = bandText(editor.layout, location);
          if (text) units.push({text, paragraphs: text.split(/\r\n|\r|\n/u).filter(line => line.trim()).length});
        }
      }
    }
    if (scope === 'document' && !units.length) units.push({text: '', paragraphs: 0});
    const notes = [editorPageNote];
    if (selectionEmpty) notes.unshift('No body text is selected. Select text, then refresh.');
    if (!editor.sourceMode) notes.push(options.includeBands && scope === 'document' ? 'Header and footer text is counted once, regardless of exported pages.' : 'Header and footer text is excluded.');
    notes.push('Images and other non-text objects are excluded; text inside editable table cells is included.');
    const chunks = (async function* () {
      for (const unit of units) {
        if (signal?.aborted || editor.revision !== revision) throw new Error('Document changed during counting. Refresh statistics.');
        yield unit;
      }
      if (editor.revision !== revision) throw new Error('Document changed during counting. Refresh statistics.');
    })();
    return {chunks, pageCount: 1, pageCountLabel: 'Editor sheets', notes};
  }
  changed() {
    this.workspace.invalidate();
    if (this.editor.sourceMode) { this.footer.textContent = 'Source text'; return; }
    clearTimeout(this.timer);
    this.controller?.abort();
    this.footer.textContent = 'Counting words…';
    this.timer = setTimeout(() => this.updateFooter(), 160);
  }
  async updateFooter() {
    if (this.editor.disposed || this.editor.departing) return;
    const controller = new AbortController(); this.controller = controller;
    try {
      const {chunks} = this.getScope('document', {signal: controller.signal});
      const stats = emptyTextStatistics();
      for await (const unit of chunks) await addTextStatistics(stats, unit.text, {paragraphs: unit.paragraphs, signal: controller.signal});
      if (!controller.signal.aborted && this.controller === controller) this.footer.textContent = `${new Intl.NumberFormat().format(stats.words)} words`;
    } catch (error) {
      if (!controller.signal.aborted && this.controller === controller) this.footer.textContent = 'Word count unavailable';
    }
  }
  dispose() { clearTimeout(this.timer); this.controller?.abort(); this.workspace.dispose(); this.button.remove(); }
}
