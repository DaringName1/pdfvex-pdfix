// Starts a tool the way a person would on either layout: its Home card when Home has one, otherwise by name in
// All tools (Home keeps only starting jobs since October 20). `card` matches the Home card; `name` is the tool name.
export async function openTool(page,card,name){
 const home=page.getByRole('button',{name:card}).first();
 if(await home.isVisible().catch(()=>false))return home.click();
 await page.getByRole('button',{name:/^(Workspaces|All tools)$/}).click();await page.getByRole('searchbox',{name:'Find a tool across workspaces'}).fill(name);
 await page.locator('.workspace-room-grid button').filter({has:page.locator('h2',{hasText:name})}).first().click();
}
