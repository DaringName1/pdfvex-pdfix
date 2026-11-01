import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OCR_LANGUAGES } from '../src/ocr-languages.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(root, 'dist', 'ocr-assets');
const dataRoot = path.join(root, 'node_modules', '@tesseract.js-data');

const coreOutput = path.join(outputRoot, 'core');
await fs.mkdir(coreOutput, { recursive: true });
for (const [source, target] of [
  ['tesseract.js/dist/worker.min.js', 'worker.min.js'],
  ['tesseract.js/dist/worker.min.js.LICENSE.txt', 'worker.min.js.LICENSE.txt'],
  ['tesseract.js/LICENSE.md', 'Tesseract.js-LICENSE.md'],
  ['tesseract.js-core/LICENSE', 'Tesseract-core-LICENSE.txt'],
  ['tesseract.js-core/LICENSE', 'Tesseract-training-data-Apache-2.0.txt'],
]) await fs.copyFile(path.join(root, 'node_modules', source), path.join(outputRoot, target));
for (const file of await fs.readdir(path.join(root, 'node_modules', 'tesseract.js-core'))) {
  if (file.endsWith('.wasm') || file.endsWith('.wasm.js')) await fs.copyFile(path.join(root, 'node_modules', 'tesseract.js-core', file), path.join(coreOutput, file));
}

const manifest = {
  packageLicense: 'MIT (per official @tesseract.js-data package metadata)',
  trainingDataUpstreamLicense: 'Apache-2.0 (per upstream Tesseract tessdata repositories)',
  languages: [],
};
for (const { code, name } of OCR_LANGUAGES) {
  const packageRoot = path.join(dataRoot, code);
  const metadata = JSON.parse(await fs.readFile(path.join(packageRoot, 'package.json'), 'utf8'));
  if (metadata.name !== `@tesseract.js-data/${code}` || metadata.version !== '1.0.0' || metadata.license !== 'MIT') {
    throw new Error(`Unexpected language data package metadata for ${code}.`);
  }
  const source = path.join(packageRoot, '4.0.0_best_int', `${code}.traineddata.gz`);
  const destination = `${code}.traineddata.gz`;
  await fs.copyFile(source, path.join(outputRoot, destination));
  manifest.languages.push({ code, name, package: metadata.name, packageVersion: metadata.version, license: metadata.license, file: destination });
}
await fs.writeFile(path.join(outputRoot, 'languages.json'), `${JSON.stringify(manifest, null, 2)}\n`);
