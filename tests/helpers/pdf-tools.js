import {chooseDocumentMode} from '../../scripts/user-robot/document-mode.mjs';
// Opens where an open PDF's tools are: the older "PDF tools" menu or, with the reader's tool bar (owner-approved
// one-place layout), the named group tab (View, Comment, Edit, Fill & Sign, Pages, Protect, Measure, Export).
import {expect} from '@playwright/test';
export async function showPdfTools(page,group){
 const old=page.locator('.workspace-tools summary'),tabs=page.getByRole('tablist',{name:'PDF tool groups'});
 await expect.poll(async()=>{await chooseDocumentMode(page,'build');return await old.isVisible()||await tabs.isVisible();},{timeout:process.env.CI?120000:60000}).toBe(true);
 if(await old.isVisible().catch(()=>false))return old.click();
 await tabs.getByRole('tab',{name:group==='Comment'?'Review':group,exact:true}).click();
}
