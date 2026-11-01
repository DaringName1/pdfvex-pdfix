// Usage: node scripts/pdf-structure-diff.mjs before.pdf after.pdf [--json]
// Lists every difference in what the two PDFs carry beside page artwork (pages, comments, form fields and
// calculations, bookmarks, attachments, signatures, tags, document details, scripts). Exit code 1 when they differ.
import fs from 'node:fs/promises';import {createRequire} from 'node:module';
const {compareStructure}=createRequire(import.meta.url)('../tests/helpers/pdf-structure.cjs');
const [before,after]=process.argv.slice(2).filter(a=>!a.startsWith('--'));if(!before||!after){console.error('Usage: node scripts/pdf-structure-diff.mjs before.pdf after.pdf [--json]');process.exit(2);}
const result=await compareStructure(await fs.readFile(before),await fs.readFile(after));
if(process.argv.includes('--json'))console.log(JSON.stringify(result,null,1));else console.log(result.unexpected.length?result.unexpected.join('\n'):'No structural differences.');
process.exit(result.unexpected.length?1:0);
