import { _electron as electron } from '@playwright/test';
import {closeReaderApp} from './reader-desktop.mjs';

// Capture the actual Electron/native failure, rather than only a page-count timeout.
// Fixtures and diagnostics stay in the test profile; no production flags change.
export async function launchReader(options, info) {
  const app = await electron.launch({...options, timeout: process.env.CI ? 90000 : 30000});
  let stderr = '';
  app.process().stderr?.on('data', chunk => { stderr = (stderr + chunk).slice(-32768); });
  app.readerStderr = () => stderr;
  try {
    await app.evaluate(({app, BrowserWindow}) => {
      const events = globalThis.readerDiagnosticEvents = [];
      const record = value => { events.push({...value, at: Date.now()}); if(events.length > 100) events.shift(); };
      app.on('child-process-gone', (_event, details) => record({event:'child-process-gone', ...details}));
      const watch = win => {
        win.webContents.on('render-process-gone', (_event, details) => record({event:'render-process-gone', ...details}));
        win.webContents.on('did-fail-load', (_event, code, description) => record({event:'did-fail-load', code, description}));
      };
      BrowserWindow.getAllWindows().forEach(watch);
      app.on('browser-window-created', (_event, win) => watch(win));
    });
    // firstWindow has its own timeout; test/config timeouts do not extend it.
    const page = await app.firstWindow({timeout: process.env.CI ? 90000 : 30000});
    const renderer = [];
    page.on('pageerror', error => { renderer.push(error.message); if(renderer.length > 50) renderer.shift(); });
    page.on('console', message => { if(message.type()==='error'){renderer.push(message.text().slice(0,2000));if(renderer.length>50)renderer.shift();} });
    app.readerRendererErrors = renderer;
    // Handlers are registered later than BrowserWindow creation during startup.
    await page.waitForLoadState('domcontentloaded');
    await app.evaluate(({ipcMain}) => {
      const record = value => { const events=globalThis.readerDiagnosticEvents; events.push({...value, at:Date.now()}); if(events.length>100)events.shift(); };
      for(const channel of ['pdfix:open-paged-pdf', 'pdfix:read-paged-pdf', 'pdfix:save-copy', 'pdfix:save-split', 'pdfix:save-markup', 'pdfix:save-page-plan', 'pdfix:inspect-pdf-review', 'pdfix:cancel-pdf-review', 'pdfix:build-batch-bates', 'pdfix:save-batch-bates', 'pdfix:save-batch-bates-report', 'pdfix:build-pdf-review-edits', 'pdfix:save-pdf-review-edits', 'pdfix:build-pdf-xfdf', 'pdfix:cancel-pdf-xfdf', 'pdfix:save-pdf-xfdf', 'pdfix:pick-pdf-xfdf', 'pdfix:inspect-pdf-xfdf-import', 'pdfix:build-pdf-xfdf-import', 'pdfix:cancel-pdf-xfdf-import', 'pdfix:save-pdf-xfdf-import']) {
        const handler = ipcMain._invokeHandlers.get(channel);
        if(!handler) continue;
        ipcMain.removeHandler(channel);
        ipcMain.handle(channel, async (...args) => {
          const started = Date.now();
          record({event:'native-request', channel});
          try {
            const result = await handler(...args);
            record({event:'native-response', channel, elapsedMs:Date.now()-started, ok:result?.ok, canceled:result?.ok===true&&result.value===null, error:result?.ok===false?result.error:undefined});
            return result;
          } catch(error) { record({event:'native-rejection', channel, message:error.message}); throw error; }
        });
      }
    });
    if(process.env.PDFIX_TEST_READER_CPU_RATE){
      const rate=Number(process.env.PDFIX_TEST_READER_CPU_RATE);
      if(!Number.isFinite(rate)||rate<1||rate>20)throw new Error('Reader test CPU rate must be between 1 and 20.');
      const session=await page.context().newCDPSession(page);
      await session.send('Emulation.setCPUThrottlingRate',{rate});
    }
    return app;
  } catch(error) {
    await attachReaderFailure(app, info, error);
    await closeReaderApp(app).catch(() => {});
    throw error;
  }
}

export async function attachReaderFailure(app, info, failure) {
  if(!app || (!failure && info.status === info.expectedStatus)) return;
  const main = await Promise.race([
    app.evaluate(({BrowserWindow}) => ({events:globalThis.readerDiagnosticEvents, dialogs:globalThis.readerDialogEvents, windows:BrowserWindow.getAllWindows().map(win => ({url:win.webContents.getURL(), crashed:win.webContents.isCrashed(), visible:win.isVisible()}))})).catch(error => ({error:error.message})),
    new Promise(resolve => { const timer=setTimeout(() => resolve({error:'Main-process diagnostics timed out'}), 3000); timer.unref(); })
  ]);
  await info.attach('reader-startup-native-diagnostics', {body:Buffer.from(JSON.stringify({failure:failure?.message, ...main, rendererErrors:app.readerRendererErrors, stderr:app.readerStderr?.()},null,2)), contentType:'application/json'});
  const page = app.windows()[0];
  if(page) {
    const state=await page.locator('body').innerText({timeout:3000}).catch(error => error.message);
    await info.attach('reader-failure-screen-text', {body:Buffer.from(state.slice(0,16000)),contentType:'text/plain'});
    const image=await page.screenshot({timeout:3000}).catch(() => null);
    if(image)await info.attach('reader-failure-screen', {body:image,contentType:'image/png'});
  }
}
