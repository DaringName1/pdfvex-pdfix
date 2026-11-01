// Run from the PDFix root through scripts/agent-run.mjs. No install or app launch.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash, randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {parseArgs} from 'node:util';

const {values} = parseArgs({options: {
  commit: {type: 'string'}, date: {type: 'string'}, plan: {type: 'boolean', default: false},
}});
if (!/^[a-f0-9]{7,40}$/i.test(values.commit || '')) throw Error('Supply an exact commit hash with --commit.');
const root = process.cwd();
const metadata = JSON.parse(fs.readFileSync(path.join(root, 'package.json')));
if (metadata.name !== 'pdfix-document-workspace') throw Error('Run from the PDFix project root.');
const git = args => execFileSync('git', args, {cwd: root, encoding: 'utf8', windowsHide: true}).trim();
const commit = git(['rev-parse', '--verify', values.commit + '^{commit}']);
const lockBytes = execFileSync('git', ['show', commit + ':package-lock.json'], {cwd: root, maxBuffer: 16 << 20, windowsHide: true});
if (!lockBytes.equals(fs.readFileSync(path.join(root, 'package-lock.json')))) {
  throw Error('The selected commit needs different dependencies. Do not change the shared node_modules; prepare matching dependencies separately.');
}
if (!fs.existsSync(path.join(root, 'node_modules', 'electron', 'dist', 'electron.exe'))) throw Error('The existing Windows Electron runtime is unavailable.');
const date = values.date || new Intl.DateTimeFormat('en-CA', {year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(date).toISOString().slice(0,10) !== date) throw Error('Use a valid --date YYYY-MM-DD.');
const short = commit.slice(0,7), releaseRoot = path.join(root, 'releases');
const plan = {commit, date, outputDirectory: releaseRoot, installs: false, launches: false, dependencyChange: false};
if (values.plan) {
  console.log(JSON.stringify({...plan, readOnly: true}, null, 2));
} else {
  const lockPath = path.join(root, 'tmp', 'app-run.lock');
  let holder; try { holder = JSON.parse(fs.readFileSync(lockPath)); } catch {}
  if (holder?.agent !== 'codex' || !Number.isInteger(holder.pid)) throw Error('Run this helper through scripts/agent-run.mjs codex.');
  try { process.kill(holder.pid, 0); } catch { throw Error('The shared run-lock owner is no longer running.'); }
  fs.mkdirSync(path.join(root, 'tmp'), {recursive: true});
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'pdfix-delivery-' + date + '-' + short + '-'));
  const source = path.join(stage, 'source'), archive = path.join(stage, 'source.tar');
  fs.mkdirSync(source);
  execFileSync('git', ['archive', '--format=tar', '--output=' + archive, commit], {cwd:root, windowsHide:true});
  execFileSync('tar', ['-xf', archive, '-C', source], {windowsHide:true});
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(source, 'node_modules'), 'junction');
  const run = (name, args) => {
    const log = path.join(stage, name + '.log'), fd = fs.openSync(log, 'wx');
    console.log('Starting ' + name + '. Log: ' + log);
    try { execFileSync(process.execPath, args, {cwd:source, stdio:['ignore',fd,fd], windowsHide:true}); }
    catch (error) { throw Error(name + ' failed. Read ' + log, {cause:error}); }
    finally { fs.closeSync(fd); }
    console.log('Finished ' + name);
    return fs.readFileSync(log, 'utf8');
  };
  run('build', ['scripts/agent-build.mjs', 'codex']);
  const packaged = JSON.parse(run('package', ['scripts/build-windows-package.mjs']));
  const setup = JSON.parse(run('setup', ['scripts/make-setup-exe.mjs', '--package', packaged.output]));
  if (!/^[a-f0-9]{64}$/.test(setup.sha256)) throw Error('Compiler receipt has no valid executable hash.');
  const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  if (hash(setup.setup) !== setup.sha256) throw Error('Compiled Setup changed before delivery.');
  fs.mkdirSync(releaseRoot, {recursive:true});
  let name = 'PDFix-Setup-' + date + '-' + short + '.exe';
  if ([name,name+'.sha256.txt',name+'.build.json'].some(n=>fs.existsSync(path.join(releaseRoot,n)))) {
    name = 'PDFix-Setup-' + date + '-' + short + '-' + Date.now() + '-' + randomBytes(3).toString('hex') + '.exe';
  }
  const target = path.join(releaseRoot, name), partial = target + '.partial-' + randomBytes(8).toString('hex');
  fs.copyFileSync(setup.setup, partial, fs.constants.COPYFILE_EXCL);
  if (hash(partial) !== setup.sha256) throw Error('Delivery copy failed verification; only the named partial file was created.');
  // Exclusive publication: never replace another build. Keep partials on failure for diagnosis.
  fs.copyFileSync(partial, target, fs.constants.COPYFILE_EXCL);
  if (hash(target) !== setup.sha256) throw Error('Published installer failed hash verification. Do not deliver it.');
  fs.unlinkSync(partial);
  const receipt = {...plan, installer:target, sha256:setup.sha256, bytes:fs.statSync(target).size,
    sourceSnapshot:JSON.parse(fs.readFileSync(path.join(source,'dist','build-source-manifest.json'))).sha256,
    package:packaged.output, buildId:packaged.buildId, scope:'Build artifact only; no runtime, install or release-acceptance claim.',
    created:new Date().toISOString()};
  fs.writeFileSync(target + '.sha256.txt', setup.sha256 + '  ' + name + '\r\n', {flag:'wx'});
  fs.writeFileSync(target + '.build.json', JSON.stringify(receipt,null,2) + '\n', {flag:'wx'});
  fs.writeFileSync(path.join(stage,'completed.json'), JSON.stringify(receipt,null,2) + '\n', {flag:'wx'});
  console.log(JSON.stringify(receipt,null,2));
}
