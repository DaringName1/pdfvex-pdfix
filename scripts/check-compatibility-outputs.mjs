// Compatibility checks for PDFix-made files, independent of PDFix's own writer:
//  1. qpdf --check (strict structure), with the robot's test password for the protected file;
//  2. Microsoft Edge's PDF engine (PDFium, not PDFix's pdf.js) renders page 1: screenshot + share of non-white pixels;
//  3. content: expected words via pdf.js text, form fields, and for the redacted file the removed word must be absent
//     from the text AND from every decompressed byte of the file (qpdf --qdf --decode-level=all);
//  4. Office files parsed as packages (document text, workbook formula, slide text).
// Usage: COMPAT_DIR=releases/compatibility-check-YYYY-MM-DD node scripts/check-compatibility-outputs.mjs (after: ROBOT_KEEP_FILES=<folder outside Google Drive> node scripts/user-robot/robot.mjs --replay scripts/user-robot/compat-replay.json)
import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {inspectPdf, inspectDocx, inspectXlsx, inspectPptx, pdfFieldNames} from './user-robot/verify.mjs';
const dir = path.resolve(process.env.COMPAT_DIR), shots = path.join(dir, '_edge-screenshots'); await fs.mkdir(shots, {recursive: true});
const qpdf = path.resolve('dist/native/qpdf/bin/qpdf.exe'), password = 'Robot-pass-7101-8';
const expect = {
  'copy-4.pdf': {text: ['Robot note 7101-1']}, 'header-6.pdf': {text: ['Robot header 7101-6']}, 'picture-9.pdf': {}, 'protected-8.pdf': {protected: true},
  'signed-10.pdf': {}, 'fillable-11.pdf': {fields: 1}, 'to-sign-12.pdf': {}, 'searchable-16.pdf': {text: ['Replace the oil every 5']},
  'edited-17.pdf': {}, 'redacted-18.pdf': {absent: 'welcome'}
};
const results = [];
const browser = await chromium.launch({channel: 'msedge', headless: false, args: ['--window-position=-2400,-2400']});
const page = await browser.newPage({viewport: {width: 1000, height: 1300}}), probe = await browser.newPage();
for (const name of (await fs.readdir(dir)).sort()) {
  const file = path.join(dir, name), lower = name.toLowerCase(), row = {name, checks: [], problems: []};
  if (lower.endsWith('.pdf')) {
    const e = expect[name] || {};
    const args = e.protected ? ['--password=' + password, '--check', file] : ['--check', file];
    try { const out = execFileSync(qpdf, args, {encoding: 'utf8'}); row.checks.push(/No syntax or stream encoding errors/.test(out) ? 'qpdf: no errors' : 'qpdf: ran'); if (/WARNING/i.test(out)) row.problems.push('qpdf warnings'); }
    catch (err) { const code = err.status; if (code === 3) row.problems.push('qpdf: warnings'); else row.problems.push('qpdf failed (exit ' + code + ')'); }
    if (e.protected) {
      try { execFileSync(qpdf, ['--check', file], {encoding: 'utf8'}); row.problems.push('opened WITHOUT a password'); }
      catch (err) { row.checks.push('refuses without password (exit ' + err.status + ')'); }
    } else {
      const info = await inspectPdf(file);
      if (!info.ok) row.problems.push('pdf.js: ' + info.problem); else row.checks.push(`pdf.js: ${info.pages} pages`);
      const flat = (info.text || '').replace(/\s+/g, ' ');
      for (const t of e.text || []) flat.includes(t) ? row.checks.push(`text "${t}" present`) : row.problems.push(`text "${t}" missing`);
      if (e.fields) { const names = await pdfFieldNames(file); names.length >= e.fields ? row.checks.push(`${names.length} form field(s)`) : row.problems.push('form field missing'); }
      if (e.absent) {
        if (flat.toLowerCase().includes(e.absent)) row.problems.push(`redacted word still in extracted text`); else row.checks.push(`"${e.absent}" absent from text`);
        const qdf = path.join(dir, '_tmp-qdf.pdf');
        execFileSync(qpdf, ['--qdf', '--object-streams=disable', '--decode-level=all', file, qdf]);
        const raw = (await fs.readFile(qdf)).toString('latin1').toLowerCase(); await fs.rm(qdf);
        raw.includes(e.absent) ? row.problems.push('redacted word found in decompressed file bytes') : row.checks.push(`"${e.absent}" absent from all decompressed bytes`);
      }
      // Edge's PDF engine: render and measure ink on the screenshot.
      await page.goto('file:///' + file.split(path.sep).join('/')); await page.waitForTimeout(3500);
      const shot = path.join(shots, name.replace(/\.pdf$/i, '.png')); const buf = await page.screenshot({path: shot});
      const ink = await probe.evaluate(async (b64) => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data; let dark = 0, n = 0; for (let i = 0; i < d.length; i += 4 * 13) { n++; if (d[i] + d[i + 1] + d[i + 2] < 450) dark++; } return dark / n * 100; }, buf.toString('base64'));
      ink > 0.03 ? row.checks.push(`Edge renders (ink ${ink.toFixed(1)}%)`) : row.problems.push(`Edge render looks blank (ink ${ink.toFixed(2)}%)`);
    }
  } else if (lower.endsWith('.docx')) {
    const d = await inspectDocx(file); d.ok ? row.checks.push(`Word package ok: ${d.text.length} chars, ${d.images} pictures, ${d.tables} tables`) : row.problems.push(d.problem);
  } else if (lower.endsWith('.xlsx')) {
    const x = await inspectXlsx(file); if (!x.ok) row.problems.push(x.problem); else { row.checks.push(`${x.sheets} sheets`); x.cells.D2?.formula ? row.checks.push(`D2 formula =${x.cells.D2.formula}`) : row.problems.push('D2 formula missing'); }
  } else if (lower.endsWith('.pptx')) {
    const p = await inspectPptx(file); p.ok ? row.checks.push(`${p.slides} slides`) : row.problems.push(p.problem);
  } else if (lower.endsWith('.rtf')) {
    const t = await fs.readFile(file, 'latin1'); t.startsWith('{\\rtf1') ? row.checks.push('RTF header ok') : row.problems.push('not RTF');
  } else if (lower.endsWith('.csv')) {
    const t = await fs.readFile(file, 'utf8'); /Part.*Qty/i.test(t.split(/\r?\n/)[0]) ? row.checks.push('CSV header Part, Qty') : row.problems.push('unexpected CSV header');
  } else if (lower.endsWith('.png')) {
    const b = await fs.readFile(file); b.subarray(1, 4).toString() === 'PNG' ? row.checks.push('PNG ok, ' + b.length + ' bytes') : row.problems.push('not PNG');
  } else continue;
  results.push(row);
}
await browser.close();
for (const r of results) console.log((r.problems.length ? 'PROBLEM ' : 'ok      ') + r.name.padEnd(18) + (r.problems.length ? r.problems.join('; ') + ' || ' : '') + r.checks.join('; '));
await fs.writeFile(path.join(dir, '_automated-checks.json'), JSON.stringify(results, null, 1));
