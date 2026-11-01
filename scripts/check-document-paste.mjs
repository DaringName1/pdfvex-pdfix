// Hidden, scoped check of pasting HTML into the document editor: what is kept, what is dropped, and that nothing active survives.
// The clipboard content is synthetic HTML shaped like browser and Word output; real applications were not used.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import mammoth from 'mammoth';
const output=path.resolve('tmp/document-paste-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Doc-'));
await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,checks:[],errors:[],failures:[],scope:'Scoped paste checks with synthetic browser-like and Word-like HTML; not a test with the real applications or the system clipboard.'};
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message});try{await page.screenshot({path:path.join(output,'failure-'+report.failures.length+'.png')});}catch{}}}
const paste=html=>page.evaluate(html=>{const data=new DataTransfer();data.setData('text/html',html);data.setData('text/plain','plain fallback');const view=document.querySelector('.ProseMirror');view.focus();view.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));},html);
const BROWSER=`<meta charset="utf-8"><h1 style="color:red" onclick="window.pasteHit=1">Web heading</h1>
<p class="x">Bold <strong>strong</strong>, <em>emphasis</em>, <u>under</u>, <s>struck</s> and a <a href="https://example.com/page" target="_blank" onclick="window.pasteHit=2">web link</a>, a <a href="javascript:window.pasteHit=3">script link</a> and a <a href="#section">page anchor</a>.</p>
<ul><li>First<ul><li>Nested</li></ul></li><li>Second</li></ul><ol><li>One</li><li>Two</li></ol>
<table><tr><th colspan="2">Merged header</th></tr><tr><td>A</td><td>B</td></tr></table>
<p>Image: <img src="https://example.com/tracker.png" onerror="window.pasteHit=4" width="10" height="10"><img src="data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9IndpbmRvdy5wYXN0ZUhpdD01Ij48L3N2Zz4="></p>
<script>window.pasteHit=6</script><style>p{display:none}</style><iframe src="https://example.com"></iframe><form><input value="field"></form><p>After blocked content.</p>`;
const WORD=`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><style><!-- p.MsoNormal{margin:0cm;font-family:"Calibri"} --></style><!--[if gte mso 9]><xml><w:WordDocument><w:View>Normal</w:View></w:WordDocument></xml><![endif]--></head><body lang=EN-US>
<!--StartFragment--><p class=MsoNormal align=center style='text-align:center'><b><span style='font-size:16.0pt;font-family:"Times New Roman",serif;color:#C00000'>Word title<o:p></o:p></span></b></p>
<p class=MsoNormal style='text-indent:36.0pt'>First line pasted<o:p></o:p></p>
<p class=MsoNormal style='margin-left:72.0pt;text-indent:-36.0pt'>Hanging pasted<o:p></o:p></p>
<p class=MsoNormal style='margin-left:36.0pt;line-height:200%'><span style='font-size:11.0pt;font-family:"Calibri",sans-serif'>Indented <span style='color:#0070C0'>blue</span> text<o:p></o:p></span></p>
<p class=MsoListParagraphCxSpFirst style='text-indent:-18.0pt;mso-list:l0 level1 lfo1'><![if !supportLists]><span style='font-family:Symbol'><span style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;</span></span></span><![endif]>Word bullet<o:p></o:p></p>
<p class=MsoListParagraphCxSpMiddle style='margin-left:72.0pt;text-indent:-18.0pt;mso-list:l0 level2 lfo1'><![if !supportLists]><span style='font-family:"Courier New"'><span style='mso-list:Ignore'>o<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;</span></span></span><![endif]>Nested bullet<o:p></o:p></p>
<p class=MsoListParagraphCxSpLast style='text-indent:-18.0pt;mso-list:l0 level1 lfo1'><![if !supportLists]><span style='font-family:Symbol'><span style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;</span></span></span><![endif]>Last bullet<o:p></o:p></p>
<p class=MsoListParagraph style='text-indent:-18.0pt;mso-list:l1 level1 lfo2'><![if !supportLists]><span style='mso-list:Ignore'>1.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;</span></span><![endif]>Numbered one<o:p></o:p></p>
<p class=MsoNormal>Plain <i>italic</i> <a href="mailto:someone@example.com">mail link</a><o:p>&nbsp;</o:p></p><!--EndFragment--></body></html>`;
const WEBEDITOR=`<meta charset='utf-8'><b style="font-weight:normal;" id="docs-internal-guid-1"><p dir="ltr" style="line-height:1.15;text-align:right;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:14pt;font-family:'Courier New',monospace;color:rgb(0, 128, 0);font-weight:700;font-style:italic;text-decoration:underline;">Styled by a web editor</span><span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000;"> plain tail</span></p></b>`;
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});
 await app.evaluate(({shell})=>{global.pdfixCheckOpened=[];shell.openExternal=async url=>{global.pdfixCheckOpened.push(url);};});
 page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 const editor=page.getByRole('textbox',{name:'Editable document'});
 await page.getByRole('button',{name:'New document',exact:true}).click();await editor.waitFor();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:30000});
 await check('browser-style HTML keeps structure, emphasis, lists, merged cells and safe links',async()=>{
  await paste(BROWSER);await expect(editor.locator('h1')).toHaveText('Web heading');report.browserHtml=(await editor.innerHTML()).replace(/\s+/g,' ').slice(0,2600);
  for(const [selector,text] of [['strong','strong'],['em','emphasis'],['u','under'],['s','struck'],['ul ul li','Nested'],['ol li >> nth=1','Two'],['table th','Merged header'],['table td >> nth=1','B']])await expect(editor.locator(selector)).toHaveText(text);
  await expect(editor.locator('table th')).toHaveAttribute('colspan','2');
  await expect(editor.locator('a.document-link')).toHaveCount(2);await expect(editor.locator('a.document-link').first()).toHaveAttribute('href','https://example.com/page');await expect(editor.locator('a.document-link').first()).toHaveText('web link');await expect(editor.locator('a.document-link').nth(1)).toHaveAttribute('href','#section');await expect(editor.locator('a.document-link').nth(1)).toHaveText('page anchor');
  await expect(editor).toContainText('script link');await expect(editor).toContainText('page anchor');await expect(editor).toContainText('After blocked content.');await expect(page.locator('.draft-status')).toHaveText('Recovery draft saved locally',{timeout:10000});
 });
 await check('nothing active or remote survives the paste',async()=>{
  const state=await page.evaluate(()=>{const view=document.querySelector('.ProseMirror');return {hit:window.pasteHit??null,remote:[...view.querySelectorAll('img')].map(image=>image.getAttribute('src')??'').filter(src=>!src.startsWith('data:image/png')&&src!==''),blocked:view.querySelectorAll('script,style,iframe,form,input,object,embed,svg').length,handlers:[...view.querySelectorAll('*')].flatMap(node=>[...node.attributes].map(attribute=>attribute.name)).filter(name=>name.startsWith('on')),inline:[...view.querySelectorAll('[style]')].map(node=>node.getAttribute('style')).filter(style=>/color:\s*red|display/.test(style)),targets:[...view.querySelectorAll('a')].map(link=>link.getAttribute('href'))};});
  report.safety=state;if(state.hit!==null||state.remote.length||state.blocked||state.handlers.length||state.inline.length||state.targets.some(href=>!/^(https:\/\/example\.com\/page|#section)$/.test(href)))throw new Error('Unsafe paste result: '+JSON.stringify(state));
  await expect(editor).toContainText('[Image omitted: use Insert picture]');if((await app.evaluate(()=>global.pdfixCheckOpened)).length)throw new Error('A link was opened by pasting.');
 });
 await check('Word-style HTML keeps its formatting and becomes real lists, without Office markup',async()=>{
  await editor.press('Control+End');await editor.press('Enter');await paste(WORD);
  const title=editor.locator('p[data-pdfix-align="center"]').filter({hasText:'Word title'});await expect(title).toHaveCount(1);await expect(title.locator('strong')).toHaveText('Word title');
  const titleStyle=await title.locator('span[data-pdfix-text-style]').evaluate(span=>({...span.dataset}));if(titleStyle.pdfixFont!=='serif'||titleStyle.pdfixSize!=='16'||titleStyle.pdfixColor!=='#c00000')throw new Error('Title style is '+JSON.stringify(titleStyle));
  const indented=editor.locator('p[data-pdfix-indent="1"]').filter({hasText:'Indented blue text'});await expect(indented).toHaveText('Indented blue text');await expect(indented).toHaveAttribute('data-pdfix-line','2');
  const firstPasted=editor.locator('p').filter({hasText:'First line pasted'}),hangPasted=editor.locator('p').filter({hasText:'Hanging pasted'});await expect(firstPasted).toHaveAttribute('data-pdfix-first-line','first');await expect(firstPasted).not.toHaveAttribute('data-pdfix-indent',/./);await expect(hangPasted).toHaveAttribute('data-pdfix-first-line','hanging');await expect(hangPasted).toHaveAttribute('data-pdfix-indent','1');
  const blue=await indented.locator('span[data-pdfix-color="#0070c0"]').evaluate(span=>({text:span.textContent,...span.dataset}));if(blue.text!=='blue'||blue.pdfixFont!=='sans'||blue.pdfixSize!=='11')throw new Error('Nested span lost its inherited font or size: '+JSON.stringify(blue));
  const list=editor.locator('ul').filter({hasText:'Word bullet'}).first();await expect(list.locator(':scope > li')).toHaveCount(2);await expect(list.locator(':scope > li').first().locator('ul li')).toHaveText('Nested bullet');await expect(list.locator(':scope > li').nth(1)).toHaveText('Last bullet');
  await expect(editor.locator('ol li').filter({hasText:'Numbered one'})).toHaveCount(1);await expect(editor.locator('a.document-link[href="mailto:someone@example.com"]')).toHaveText('mail link');await expect(editor.locator('em').filter({hasText:'italic'})).toHaveCount(1);
  const text=await editor.textContent();report.wordText=text.slice(-170);for(const leak of ['WordDocument','MsoNormal','supportLists','StartFragment','font-family','mso-','·','1.Numbered','oNested'])if(text.includes(leak))throw new Error('Office markup or a list marker leaked into the text: '+leak);
 });
 await check('web-editor HTML with style-only bold, italic and underline keeps them, with font, size, color and alignment',async()=>{
  await editor.press('Control+End');await editor.press('Enter');await paste(WEBEDITOR);const line=editor.locator('p[data-pdfix-align="right"]').filter({hasText:'Styled by a web editor'});await expect(line).toHaveCount(1);await expect(line).toHaveAttribute('data-pdfix-line','1.15');
  const styled=line.locator('span[data-pdfix-text-style]').first(),data=await styled.evaluate(span=>({...span.dataset}));if(data.pdfixFont!=='mono'||data.pdfixSize!=='14'||data.pdfixColor!=='#008000')throw new Error('Style is '+JSON.stringify(data));
  for(const tag of ['strong','em','u'])await expect(line.locator(tag).filter({hasText:'Styled by a web editor'})).toHaveCount(1);
  await expect(line.locator('strong').filter({hasText:'plain tail'})).toHaveCount(0);await page.screenshot({path:path.join(output,'pasted.png')});
 });
 await check('the pasted document saves as DOCX and reopens with the same structure',async()=>{
  const docx=path.join(profile,'pasted.docx');await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},docx);await page.getByRole('button',{name:'Export DOCX',exact:true}).click();await expect(page.locator('#toast')).toContainText('Saved pasted.docx',{timeout:45000});
  const html=(await mammoth.convertToHtml({buffer:await fs.readFile(docx)})).value;report.docxHtml=html.slice(0,900);for(const part of ['Web heading','<a href="https://example.com/page">web link</a>','colspan="2"','Nested','Word title','<a href="mailto:someone@example.com">mail link</a>','Nested bullet','Styled by a web editor'])if(!html.includes(part))throw new Error('DOCX copy is missing '+part);
  const before=(await editor.innerHTML()).replace(/\s+/g,' ');await page.getByRole('button',{name:'Home',exact:true}).click();await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},docx);await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:45000});
  await expect(page.locator('.editor-warning')).toContainText('Reopened a document saved by PDFix');const after=(await editor.innerHTML()).replace(/\s+/g,' ');if(after!==before)throw new Error('Reopened structure differs.\nBefore: '+before.slice(0,600)+'\nAfter: '+after.slice(0,600));
 });
}catch(error){report.error=error.message;try{await page?.screenshot({path:path.join(output,'failure.png')});}catch{}}
finally{if(app){const pid=app.process().pid,closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),15000))]);if(!closed){report.failures.push({name:'window closes after the checks',error:'The window did not close within 15 seconds.'});try{process.kill(pid);}catch{}}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));process.exit(report.pass?0:1);
