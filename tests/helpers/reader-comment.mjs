import {expect} from '@playwright/test';
import {readerTools} from './reader-desktop.mjs';

const names={read:'Select',highlight:'Highlight',underline:'Underline',note:'Note',text:'Text box',ink:'Freehand',line:'Line',arrow:'Arrow',cloud:'Cloud',callout:'Callout',move:'Move',erase:'Remove ink','partial-erase':'Erase ink'};
export async function openComments(page){
 await readerTools(page,'View');await page.getByRole('button',{name:'Fit page',exact:true}).click();
 await readerTools(page,'Comment');
 await expect(page.getByRole('toolbar',{name:'Comment tools',exact:true}).getByRole('button',{name:'Select',exact:true})).toBeEnabled({timeout:process.env.CI?120000:60000});
 return page.getByRole('region',{name:'PDF comment options',exact:true});
}
export async function selectCommentTool(page,kind){
 if(!names[kind])throw Error('Unknown comment tool: '+kind);
 const toolbar=page.getByRole('toolbar',{name:'Comment tools',exact:true}),direct=toolbar.getByRole('button',{name:names[kind],exact:true});
 if(await direct.isVisible())return direct.click();
 const group=({underline:'Mark words',callout:'Notes and stamps',line:'Draw',arrow:'Draw',cloud:'Draw',erase:'Review','partial-erase':'Review'})[kind];if(!group)throw Error('Comment control is not visible: '+names[kind]);
 await toolbar.getByRole('button',{name:group+' tools menu',exact:true}).press('ArrowDown');await page.getByRole('menu',{name:group+' tools',exact:true}).getByRole('menuitem',{name:names[kind],exact:true}).click();
}
export async function savedDrawingTools(page){
 const summary=page.locator('summary').filter({hasText:/^Saved drawing tools$/});
 if(!await summary.evaluate(node=>node.parentElement.open))await summary.click();
}
