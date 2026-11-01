import {chooseDocumentMode} from '../../scripts/user-robot/document-mode.mjs';
import {ownedReceipt,drainOwned,stopOwned} from './reader-process-tree.mjs';
import {expect} from '@playwright/test';
export async function readerTools(page,group='View',tool){
 const tabs=page.getByRole('tablist',{name:'PDF tool groups',exact:true}),details=page.locator('.document-area .reader-view-options');
 // Reopening a saved file replaces the reader asynchronously. Wait for the
 // visible navigation, rather than treating a momentary absence as legacy UI.
 await expect.poll(async()=>{await chooseDocumentMode(page,'build');return await tabs.isVisible()||await details.locator('summary').first().isVisible();},{timeout:process.env.CI?120000:60000}).toBe(true);
 if(await tabs.isVisible()){await tabs.getByRole('tab',{name:group==='Comment'?'Review':group,exact:true}).click();if(group==='View'){const more=page.getByRole('button',{name:'More',exact:true});if(await more.isVisible()&&!await more.evaluate(n=>n.parentElement.open))await more.click();}if(tool)await page.getByRole('searchbox',{name:'Filter tools',exact:true}).fill(tool);return;}
 if(!await details.evaluate(n=>n.open))await details.locator('summary').first().click();
 for(const group of await details.locator('.pdf-tool-group').all())if(!await group.evaluate(n=>n.open))await group.locator('summary').click();
}
export async function readerPage(page,number){
 const input=page.getByRole('spinbutton',{name:'Page number',exact:true});await input.fill(String(number));await input.press('Tab');
 const mode=await page.locator('.document-area .reading-view').inputValue();
 const target=['continuous','facing'].includes(mode)?page.locator(`.document-area .pdf-multi-slot[data-page="${number}"]`):page.locator('.document-area .pdf-paper').first();
 await expect(target).toHaveAttribute('data-page',String(number),{timeout:process.env.CI?120000:60000});
 await expect(target).toHaveAttribute('data-ready','true',{timeout:process.env.CI?120000:60000});
}
export async function closeReaderApp(app){
 if(!app)return;let timer;const owned=process.platform==='win32'?(await ownedReceipt(app)).processes:[];
 try{await Promise.race([app.close(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Hidden reader app did not close in 15 seconds')),15000);})]);}
 catch(error){if(process.platform==='win32'){const current=(await ownedReceipt(app)).processes;const receipt=[...owned,...current];await stopOwned(receipt);const cleanup=await drainOwned(receipt);if(cleanup.remaining.length)throw new AggregateError([error,new Error('Owned reader processes remained after cleanup')]);}else app.process().kill();throw error;}finally{clearTimeout(timer);}
 if(process.platform==='win32'){const cleanup=await drainOwned(owned);app.readerCleanup={owned,...cleanup};if(cleanup.remaining.length||cleanup.forced.length)throw new Error('Reader close required forced cleanup of its owned processes: '+JSON.stringify(owned.filter(row=>cleanup.forced.includes(row.pid))));}
}
