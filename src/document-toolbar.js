import {installDocumentHomeGroups} from './document-home-groups.js';
import {decorateDocumentTiles} from './document-ribbon-tiles.js';
import {BUILD_TABS,documentTabKey,PDF_ONLY_TABS} from './build-tabs.js';
import {installDraftTitleRename} from './document-title-rename.js';
import {installDocumentSpacingMenu} from './document-spacing-menu.js';
import {installDocumentObjectOptions} from './document-object-options.js';
import {installHeaderHistory} from './header-history.js';
import {installSourceTextHistory} from './source-text-history.js';
import './header-history.css';
import {installCompactDocumentToolbar} from './document-compact-toolbar.js';
import './document-toolbar.css';
import {LINE_SPACINGS, PARAGRAPH_SPACES, currentParagraphFormat} from './document-paragraph.js';
import {formattedSourceKind} from './source-to-document.js';
import {HIGHLIGHTS, currentHighlight} from './document-marks.js';

let toolbarSequence = 0;
const node = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

// Reparent the live controls only after every document feature has mounted.
// Their listeners, editor selection and recovery/export paths stay intact.
// A short "what this does" for every control that does not already explain itself, shown on hover.
const HINTS = new Map(Object.entries({
  'Export DOCX': 'Save a Word copy of this document. The file you opened is not changed.',
  'Export PDF': 'Preview the pages, then save a PDF copy.',
  'Print': 'Preview the pages, then print them (Ctrl+P).',
  'Bulleted list': 'Start or end a bulleted list (Ctrl+Shift+8).',
  'Numbered list': 'Start or end a numbered list (Ctrl+Shift+7).',
  'Selected text font': 'Font for the selected text.',
  'Selected text size': 'Text size for the selected text.',
  'Paragraph style': 'Make the paragraph a heading or normal text. Headings appear in a table of contents.',
  'Paragraph line spacing': 'Space between the lines of this paragraph.',
  'Paragraph space before': 'Extra space above this paragraph.',
  'Paragraph space after': 'Extra space below this paragraph.',
  'Paragraph first line': 'Indent the first line, or hang it out for numbered or labelled paragraphs.',
  'Paragraph right indent': 'Bring the right edge of this paragraph in.',
  'Table': 'Insert a table, or change the one the cursor is in.',
  'Insert table': 'Insert a table with the rows and columns chosen here.',
  'Row above': 'Add a row above the cursor.', 'Row below': 'Add a row below the cursor.',
  'Column left': 'Add a column to the left of the cursor.', 'Column right': 'Add a column to the right of the cursor.',
  'Delete row': 'Delete the row the cursor is in.', 'Delete column': 'Delete the column the cursor is in.',
  'Merge cells': 'Join the selected cells into one. Drag across cells to select them first.',
  'Split cell': 'Split a merged cell back into separate cells.',
  'Header row': 'Make the first row a heading row.', 'Header column': 'Make the first column a heading column.',
  'Delete table': 'Delete the whole table the cursor is in.',
  'Apply column widths': 'Use the column widths typed here.', 'Equal columns': 'Make every column the same width.',
  'Apply fill': 'Shade the selected cells with the chosen colour.', 'Clear fill': 'Remove shading from the selected cells.',
  'Picture': 'Insert a picture, or change the selected one.',
  'Insert picture': 'Choose a PNG, JPEG, GIF, BMP or WebP picture to place at the cursor.',
  'Turn left': 'Turn the selected picture a quarter turn to the left.', 'Turn right': 'Turn the selected picture a quarter turn to the right.',
  'Apply crop': 'Trim the typed percentages from the edges of the selected picture.',
  'Apply size / description': 'Use the width, height and description typed here for the selected picture.',
  'Fit image': 'Make the selected picture fit the page width.', 'Remove image': 'Delete the selected picture.',
  'Links': 'Link the selected text to a web page, an email address or a heading in this document.',
  'Apply link': 'Link the selected text to the address or heading chosen here.',
  'Show link': 'Show where the link at the cursor goes before opening it.', 'Remove link': 'Remove the link but keep the text.',
  'Page break': 'Start a new page at the cursor.',
  'Page setup': 'Paper size, margins, font, spacing, headers, footers and page numbers.',
  'Reset page setup': 'Go back to A4, 20 mm margins and the standard font.',
  'Format header': 'Header with several lines, fonts, sizes and colours.', 'Format footer': 'Footer with several lines, fonts, sizes and colours.',
  'Find / replace': 'Find words in the document and replace them (Ctrl+F).',
  'Spell check': 'Check spelling and choose corrections one by one.',
  'Read aloud': 'Hear the document or the selected text read out.',
  'Statistics': 'Words, characters, paragraphs and pages.',
  'Version history': 'See earlier versions of this document and restore one.',
  'Save text copy': 'Save the words only, as a plain .txt file.',
  'Export RTF copy': 'Save an RTF copy that older word processors can open.'
}));
function addHints(root) {
  for (const control of root.querySelectorAll('button, summary, select')) {
    if (control.title) continue;
    const hint = HINTS.get((control.getAttribute('aria-label') || control.textContent || '').trim());
    if (hint) control.title = hint;
  }
}
export class DocumentToolbar {
  constructor(workspace) {
    this.workspace = workspace;
    this.root = workspace.root.querySelector('.editor-toolbar');
    this.root.classList.add('document-ribbon');
    this.root.setAttribute('role', 'region');
    this.root.setAttribute('aria-label', workspace.sourceMode ? 'Source document tools' : 'Document tools');
    const initial = [...this.root.children];
    const style = this.root.querySelector('select[aria-label="Paragraph style"]');
    const commands = Object.fromEntries([...this.root.querySelectorAll('[data-command]')].map(button => [button.dataset.command, button]));
    const exports = this.root.querySelector('.editor-exports');
    const find = this.root.querySelector('[data-find-document]');
    const spell = this.root.querySelector('[data-document-spelling]');
    const speech = this.root.querySelector('[data-document-speech]');
    const pageBreak = this.root.querySelector('[data-page-break]');
    const notes = workspace.root.querySelector('.editor-import-notes');
    const sourceControls = workspace.root.querySelector('.source-view-controls');
    const prefix = `document-ribbon-${++toolbarSequence}`;

    this.navigation = node('div', 'document-ribbon-navigation');
    this.tabs = node('div', 'document-ribbon-tabs');
    this.tabs.setAttribute('role', 'tablist');
    this.tabs.setAttribute('aria-label', 'Document tool categories');
    this.navigation.append(this.tabs);
    this.titleRename=installDraftTitleRename(workspace);
    this.quick = node('div', 'document-quick-controls');
    this.quick.setAttribute('role', 'toolbar');
    this.quick.setAttribute('aria-label', workspace.sourceMode ? 'Source editing controls' : 'Quick text formatting');
    this.panels = node('div', 'document-ribbon-panels');
    this.root.replaceChildren(this.navigation, this.quick, this.panels);
    this.tabButtons = [];
    this.panelByName = new Map();
    for (const name of workspace.sourceMode ? ['File', 'Home', 'Layout', 'Review'] : BUILD_TABS) {
      const key = documentTabKey(name);
      const button = node('button', 'document-ribbon-tab', name);
      button.type = 'button';
      button.id = `${prefix}-${key}-tab`;
      button.dataset.documentTab = key;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', `${prefix}-${key}-panel`);
      if (!workspace.sourceMode && PDF_ONLY_TABS.includes(name)) { button.disabled=true; button.title=name==='Measure'?'Measurements are available on PDFs. Export a PDF copy first.':name+' is available on PDFs. Export a PDF copy first.'; }
      button.onclick = () => this.select(key);
      button.onkeydown = event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const available=this.tabButtons.filter(tab=>!tab.disabled),index=available.indexOf(button);
        const next=event.key==='Home'?0:event.key==='End'?available.length-1:(index+(event.key==='ArrowRight'?1:-1)+available.length)%available.length;
        const target=available[next];
        this.select(target.dataset.documentTab);
        target.focus();
      };
      this.tabButtons.push(button);
      this.tabs.append(button);
      const panel = node('section', 'document-command-panel');
      panel.id = `${prefix}-${key}-panel`;
      panel.dataset.ribbonPanel = key;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', button.id);
      this.panels.append(panel);
      this.panelByName.set(key, panel);
    }
    const group = (parent, title, controls) => {
      const container = node('div', 'document-command-group');
      container.setAttribute('role', 'group');
      container.setAttribute('aria-label', title);
      container.append(...controls.filter(Boolean));
      parent.append(container);
      return container;
    };
    if (!workspace.sourceMode) {
      commands.undo.textContent = '↶'; commands.redo.textContent = '↷';
      commands.undo.title = 'Undo (Ctrl+Z)'; commands.redo.title = 'Redo (Ctrl+Y)';
      commands.bold.title = 'Bold (Ctrl+B)'; commands.italic.title = 'Italic (Ctrl+I)'; commands.underline.title = 'Underline (Ctrl+U)'; commands.strike.title = 'Strikethrough (Ctrl+Shift+S)'; commands.superscript.title = 'Superscript (Ctrl+.)'; commands.subscript.title = 'Subscript (Ctrl+,)';
      this.highlight = node('select', 'document-highlight');
      this.highlight.setAttribute('aria-label', 'Highlight color'); this.highlight.title = 'Highlight the selected text';
      this.highlight.append(new Option('No highlight', ''), ...Object.entries(HIGHLIGHTS).map(([value, item]) => new Option(item.label + ' highlight', value)));
      this.highlight.onchange = () => { workspace.editor.chain().focus().setDocumentHighlight(this.highlight.value || null).run(); workspace.formatState(); };
      commands.bulletList.textContent = '• Bullets'; commands.orderedList.textContent = '1. Numbering';
      group(this.quick, 'History', [commands.undo, commands.redo]);
      group(this.quick, 'Paragraph style and emphasis', [style, commands.bold, commands.italic, commands.underline, commands.strike, commands.superscript, commands.subscript, this.highlight]);
      this.quick.append(workspace.formatting.root);
      // List levels use the editor's own list commands, so Tab / Shift+Tab and these buttons agree.
      this.listLevel = {};
      for (const [name, label, command, title, delta] of [['outdent', 'Decrease indent', 'liftListItem', 'Move a list item out one level (Shift+Tab) or a paragraph left half an inch', -1], ['indent', 'Increase indent', 'sinkListItem', 'Move a list item in one level (Tab) or a paragraph right half an inch', 1]]) {
        const button = node('button', undefined, label);
        button.dataset.listLevel = name;
        button.title = title;
        button.onmousedown = event => event.preventDefault();
        // In a list the buttons change the list level; elsewhere they indent the paragraph itself.
        button.onclick = () => { const editor = workspace.editor; if (editor.can()[command]('listItem')) editor.chain().focus()[command]('listItem').run(); else editor.chain().focus().changeDocumentIndent(delta).run(); workspace.formatState(); };
        button.dataset.indentDelta = String(delta);
        this.listLevel[command] = button;
      }
      group(this.panelByName.get('home'), 'Lists and indent', [commands.bulletList, commands.orderedList, this.listLevel.liftListItem, this.listLevel.sinkListItem]);
      const spacingLabel = node('label', 'document-line-spacing', 'Line spacing ');
      this.lineSpacing = node('select');
      this.lineSpacing.setAttribute('aria-label', 'Paragraph line spacing');
      this.lineSpacing.append(new Option('Document default', ''), ...LINE_SPACINGS.map(value => new Option(value.toFixed(value === 1.15 ? 2 : 1), String(value))));
      this.lineSpacing.onchange = () => { workspace.editor.chain().focus().setDocumentLineSpacing(this.lineSpacing.value ? Number(this.lineSpacing.value) : null).run(); workspace.formatState(); };
      spacingLabel.append(this.lineSpacing);
      this.paragraphSpace = {};
      const spaceLabels = [];
      for (const [name, text, command] of [['spaceBefore', 'Space before ', 'setDocumentSpaceBefore'], ['spaceAfter', 'Space after ', 'setDocumentSpaceAfter']]) {
        const label = node('label', 'document-line-spacing', text), select = node('select');
        select.setAttribute('aria-label', 'Paragraph ' + text.trim().toLowerCase());
        select.append(new Option('Default', ''), ...PARAGRAPH_SPACES.map(value => new Option(value + ' pt', String(value))));
        select.onchange = () => { workspace.editor.chain().focus()[command](select.value === '' ? null : Number(select.value)).run(); workspace.formatState(); };
        label.append(select); spaceLabels.push(label); this.paragraphSpace[name] = select;
      }
      const firstLabel = node('label', 'document-line-spacing', 'First line ');
      this.firstLine = node('select');
      this.firstLine.setAttribute('aria-label', 'Paragraph first line');
      this.firstLine.append(new Option('None', ''), new Option('Indent first line', 'first'), new Option('Hanging', 'hanging'));
      this.firstLine.onchange = () => { workspace.editor.chain().focus().setDocumentFirstLine(this.firstLine.value || null).run(); workspace.formatState(); };
      firstLabel.append(this.firstLine);
      const rightLabel = node('label', 'document-line-spacing', 'Right indent ');
      this.rightIndent = node('select');
      this.rightIndent.setAttribute('aria-label', 'Paragraph right indent');
      this.rightIndent.append(...['None', '0.5 in', '1 in', '1.5 in', '2 in'].map((label, steps) => new Option(label, String(steps))));
      this.rightIndent.onchange = () => { workspace.editor.chain().focus().setDocumentRightIndent(Number(this.rightIndent.value)).run(); workspace.formatState(); };
      rightLabel.append(this.rightIndent);
      group(this.panelByName.get('home'), 'Paragraph spacing', [spacingLabel, ...spaceLabels, firstLabel, rightLabel]);
      // Find is one click away on Home, as in Word and Google Docs (Ctrl+F also works); Review keeps Find / replace.
      if (find) { const homeFind = node('button', 'secondary compact', 'Find'); homeFind.type = 'button'; homeFind.title = 'Find words in this document (Ctrl+F).'; homeFind.onmousedown = event => event.preventDefault(); homeFind.onclick = () => find.click(); group(this.panelByName.get('home'), 'Find', [homeFind]); }
      const hint = node('span', 'document-ribbon-hint', 'Select text to format · ' + (workspace.canSaveInPlace() || workspace.file.isNew ? 'Ctrl+S saves' : 'Ctrl+S saves a copy'));
      this.panelByName.get('home').append(hint);
      const insert = this.panelByName.get('insert');
      // The things people insert most (table, picture, link) come first.
      insert.append(workspace.tables.root, workspace.images.root, workspace.links.root);
      // Page break and Table of contents look like the Table / Image / Links buttons beside them.
      pageBreak.classList.add('document-insert-button');
      group(insert, 'Page break', [pageBreak]);
      const contents = node('button', 'document-insert-button', 'Table of contents');
      contents.type = 'button'; contents.title = 'Insert a list of the headings, each linking to its heading';
      contents.onmousedown = event => event.preventDefault(); contents.onclick = () => workspace.links.insertContents();
      group(insert, 'Contents', [contents]);
      // These small menus expand in the active panel, away from the writing area.
      workspace.tables.root.querySelector('summary').textContent = 'Table';
      workspace.images.root.querySelector('summary').textContent = 'Picture';
    } else {
      if (sourceControls) this.quick.append(sourceControls);
      else this.quick.append(node('span', 'document-ribbon-hint', 'Edit source text · ' + (workspace.canSaveInPlace() ? 'Ctrl+S saves' : 'Ctrl+S saves a copy')));
      this.panelByName.get('home').append(node('span', 'document-ribbon-hint', 'Source text is preserved. Use Review to find, replace or read text.'));
    }

    // Keep primary exports in view, while less-used copy formats live in File.
    const primaryExports = node('div', 'editor-exports document-primary-exports');
    const pdf = exports.querySelector('[data-pdf]');
    const docx = exports.querySelector('[data-docx]');
    pdf.textContent = 'Export PDF'; pdf.className = 'primary compact';
    if (!workspace.sourceMode) { docx.textContent = 'Export DOCX'; docx.className = 'secondary compact'; primaryExports.append(docx); }
    // A source file's own format is its main save, so it stays in view beside Export PDF.
    else {
      const text = exports.querySelector('[data-text]'); text.className = 'secondary compact'; primaryExports.append(text);
      if (formattedSourceKind(workspace.file.ext) && workspace.openFormatted) {
        const formatted = node('button', 'secondary compact', 'Open as formatted document');
        formatted.dataset.openFormatted = '';
        formatted.title = 'Turn this source into an editable document with headings, lists and tables. The source file stays as it is.';
        formatted.onclick = () => workspace.openAsFormatted();
        primaryExports.prepend(formatted);
      }
    }
    primaryExports.append(pdf);
    const print = exports.querySelector('[data-print]');
    if (print) { print.className = 'secondary compact'; primaryExports.append(print); }
    // Save goes back to the opened file; the exports above stay as copies.
    if (workspace.canSaveInPlace() || workspace.file.isNew && !workspace.sourceMode) {
      const save = node('button', 'primary compact', 'Save');
      save.dataset.saveInPlace = ''; save.title = workspace.file.isNew ? 'Save a DOCX copy (Ctrl+S), then choose Continue with this copy to save back to it.' : 'Save over ' + workspace.file.name + ' (Ctrl+S). The previous version is kept as a backup.';
      save.onclick = () => workspace.saveInPlace();
      pdf.className = 'secondary compact'; primaryExports.prepend(save);
    }
    this.navigation.append(primaryExports);
    if (workspace.file.isNew && !workspace.sourceMode) {
      // Two clicks: the first arms the button so a draft is never replaced by accident.
      const blank = node('button', 'secondary compact', 'New blank document');
      blank.dataset.startBlank = '';
      blank.title = 'Replace this draft with a blank document. The current draft stays in Version history.';
      const disarm = () => { clearTimeout(this.blankTimer); blank.textContent = 'New blank document'; delete blank.dataset.armed; };
      blank.onclick = () => {
        if (!blank.dataset.armed && workspace.getText().trim()) { blank.dataset.armed = 'true'; blank.textContent = 'Confirm: start blank'; this.blankTimer = setTimeout(disarm, 6000); return; }
        disarm(); workspace.startBlank();
      };
      blank.onblur = disarm;
      exports.append(blank);
    }
    // Like Word's File menu: an unchanged copy of the opened file lives here, not as a second Save button at the top.
    if (workspace.file.id && !workspace.file.isNew) {
      const original = node('button', 'secondary compact', 'Save a copy of the original');
      original.title = 'Save the file exactly as it was opened, without your edits, under a new name.';
      original.onclick = async () => { try { const result = await window.pdfix.saveCopy(workspace.file.id,undefined,workspace.file.copyName); if (result) workspace.announce(`Saved ${result.name}. Original unchanged.`); } catch (error) { workspace.announce(error.message, true); } };
      exports.append(original);
    }
    this.panelByName.get('file').append(exports, notes);
    exports.classList.add('document-copy-exports');
    workspace.layoutControls.root.open = !!workspace.sourceMode;
    this.panelByName.get('layout').append(workspace.layoutControls.root);
    group(this.panelByName.get('review'), 'Proofing and search', [find, spell, speech]);
    const stats = node('button', 'text-button', 'Statistics');
    stats.type = 'button';
    stats.dataset.documentStatistics = '';
    stats.onclick = () => workspace.statistics.button.click();
    this.panelByName.get('review').append(stats);
    if (!workspace.sourceMode) {
      const action=(tab,name,run)=>{const button=node('button','secondary compact document-insert-button',name);button.type='button';button.title=name;button.onmousedown=event=>event.preventDefault();button.onclick=run;group(this.panelByName.get(tab),name,[button]);};
      action('edit','Select all',()=>workspace.editor.chain().focus().selectAll().run());
      action('edit','Find / replace',()=>find?.click());
      action('view','Fit width',()=>workspace.zoom.set('fit'));
      action('view','Actual size',()=>workspace.zoom.set(100));
      action('view','Read without editing',()=>workspace.modeControls?.set('view'));
      this.exportControls=[docx,pdf].map(button=>{const anchor=document.createComment('primary export');button.before(anchor);return {button,anchor};});
      this.exportPanel=group(this.panelByName.get('export'),'Save a copy',[]);
    }
    // Remove only unclaimed initial separators / source-only rich commands.
    for (const element of initial) if (!this.root.contains(element)) element.remove();
    this.root.querySelectorAll('button').forEach(button => { button.type = 'button'; });
    addHints(this.root);
    this.notesObserver = new MutationObserver(() => { if (notes.open) this.select('file'); });
    this.notesObserver.observe(notes, {attributes: true, attributeFilter: ['open']});
    if(!workspace.sourceMode){const content=node('div','document-ribbon-content');this.root.append(content);content.append(this.quick,this.panels);decorateDocumentTiles(this);}
    this.select(notes.open ? 'file' : 'home');
    this.spacingMenu=installDocumentSpacingMenu(this);this.homeGroups=installDocumentHomeGroups(this);this.compactControls=installCompactDocumentToolbar(this);this.objectOptions=installDocumentObjectOptions(workspace);
    if(workspace.sourceMode)this.nativeHistory=installSourceTextHistory(workspace);
    this.headerHistory=installHeaderHistory({root:workspace.root,header:workspace.root.ownerDocument.querySelector('.file-header'),mode:()=>workspace.interactionMode||'build',sources:()=>this.nativeHistory?.sources||['undo','redo'].map(name=>this.root.querySelector('[data-command='+name+']'))});
  }

  select(name) {
    if (!this.panelByName.has(name) || this.tabButtons.find(button=>button.dataset.documentTab===name)?.disabled) return;
    for(const {button,anchor}of this.exportControls||[]) { if(name==='export')this.exportPanel.append(button);else anchor.after(button); }
    decorateDocumentTiles(this);
    this.activeTab = name;
    this.root.dataset.documentTab = name;
    for (const button of this.tabButtons) {
      const active = button.dataset.documentTab === name;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    }
    for (const [key, panel] of this.panelByName) panel.hidden = key !== name;
  }

  setLocked(hold) {
    this.navigation.inert = hold;
    this.quick.inert = hold;
    for (const [name, panel] of this.panelByName) {
      // Image insertion has a working Cancel action while editing is held.
      panel.inert = hold && name !== 'insert';
    }
    if (this.workspace.tables?.root) this.workspace.tables.root.inert = hold;
    if (this.workspace.links?.root) this.workspace.links.root.inert = hold;
    const pageBreak = this.root.querySelector('[data-page-break]');
    if (pageBreak) pageBreak.disabled = hold;
  }

  sync() {
    const editor = this.workspace.editor;
    if (!editor) return;
    for (const name of ['undo', 'redo']) this.root.querySelector(`[data-command="${name}"]`).disabled = !editor.can()[name]();
    for (const [command, button] of Object.entries(this.listLevel ?? {})) button.disabled = !editor.can()[command]('listItem') && !editor.can().changeDocumentIndent(Number(button.dataset.indentDelta));
    if (this.lineSpacing) { const format = currentParagraphFormat(editor); this.lineSpacing.disabled = !format; if (document.activeElement !== this.lineSpacing) this.lineSpacing.value = format?.lineSpacing ? String(format.lineSpacing) : ''; if (this.rightIndent) { this.rightIndent.disabled = !format; if (document.activeElement !== this.rightIndent) this.rightIndent.value = String(format?.rightIndent ?? 0); } if (this.firstLine) { this.firstLine.disabled = !format; if (document.activeElement !== this.firstLine) this.firstLine.value = format?.firstLine ?? ''; } for (const [name, select] of Object.entries(this.paragraphSpace)) { select.disabled = !format; if (document.activeElement !== select) select.value = format && format[name] !== null ? String(format[name]) : ''; } }
    const style = this.root.querySelector('select[aria-label="Paragraph style"]');
    if (this.highlight && document.activeElement !== this.highlight) this.highlight.value = currentHighlight(editor);
    style.value = String(editor.isActive('heading') ? editor.getAttributes('heading').level : 0);
  }

  syncName() { if (this.nameInput) { this.nameInput.value = this.workspace.file.name; this.nameInput.title = this.workspace.file.name; } }

  dispose() { this.titleRename?.dispose();this.homeGroups?.dispose();this.spacingMenu?.dispose();this.headerHistory?.dispose();this.nativeHistory?.dispose();this.objectOptions?.dispose();this.compactControls?.dispose(); clearTimeout(this.blankTimer); this.notesObserver?.disconnect(); }
}
