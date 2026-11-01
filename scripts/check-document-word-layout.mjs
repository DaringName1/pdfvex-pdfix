// Hidden, scoped check that paragraph layout set directly in a Word-style DOCX (no PDFix snapshot) survives opening:
// alignment, indent, first-line and hanging indent, line spacing and space before/after, with the Home controls following.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import * as docx from 'docx';
const output=path.resolve('tmp/document-word-layout-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-WordLayout-'));
await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,checks:[],errors:[],failures:[],scope:'One DOCX generated with the docx library in the shape Word writes (direct paragraph properties). A file saved by Word itself, style-inherited spacing and section layouts were not exercised.'};
const {Document,Packer,Paragraph,TextRun,AlignmentType,HeadingLevel}=docx,p=(text,options={})=>new Paragraph({...options,children:[new TextRun(text)]});
const file=path.join(profile,'Word layout.docx');
await fs.writeFile(file,await Packer.toBuffer(new Document({sections:[{children:[
 new Paragraph({heading:HeadingLevel.HEADING_1,alignment:AlignmentType.CENTER,children:[new TextRun('Centred title')]}),
 p('Plain body text'),new Paragraph({heading:HeadingLevel.HEADING_4,children:[new TextRun('Fourth level heading')]}),p('Indented once',{indent:{left:720}}),p('First line in',{indent:{firstLine:720}}),p('Hanging reference',{indent:{left:1440,hanging:720}}),
 p('Justified and spaced',{alignment:AlignmentType.JUSTIFIED,spacing:{before:240,after:120,line:360}}),p('A list item',{bullet:{level:0}}),new Paragraph({children:[new TextRun('Styled: '),new TextRun({text:'red serif',font:'Times New Roman',size:28,color:'C00000'}),new TextRun(' then '),new TextRun({text:'marked',highlight:'yellow',underline:{}}),new TextRun({text:' code',font:'Consolas'})]}),
 new Paragraph({bullet:{level:0},children:[new TextRun('List with '),new TextRun({text:'green words',color:'00B050'})]}),
 new docx.Table({rows:[new docx.TableRow({children:[new docx.TableCell({children:[new Paragraph({children:[new TextRun('Cell with '),new TextRun({text:'serif text',font:'Georgia',size:24})]})]}),new docx.TableCell({children:[new Paragraph('Plain cell')]})]})]})]}]})));
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message});try{await page.screenshot({path:path.join(output,'failure-'+report.failures.length+'.png')});}catch{}}}
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});
 page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 const editor=page.getByRole('textbox',{name:'Editable document'}),block=text=>editor.locator('p,h1').filter({hasText:text}).first();
 await check('a Word-style DOCX opens with its paragraph layout',async()=>{
  await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file);await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:45000});
  report.blocks=await editor.locator('p,h1').evaluateAll(list=>list.map(node=>({text:node.textContent.slice(0,30),...node.dataset})));
  await expect(block('Centred title')).toHaveAttribute('data-pdfix-align','center');await expect(block('Indented once')).toHaveAttribute('data-pdfix-indent','1');await expect(block('First line in')).toHaveAttribute('data-pdfix-first-line','first');
  await expect(block('Hanging reference')).toHaveAttribute('data-pdfix-first-line','hanging');await expect(block('Hanging reference')).toHaveAttribute('data-pdfix-indent','1');
  const spaced=block('Justified and spaced');await expect(spaced).toHaveAttribute('data-pdfix-align','justify');await expect(spaced).toHaveAttribute('data-pdfix-line','1.5');await expect(spaced).toHaveAttribute('data-pdfix-space-before','12');await expect(spaced).toHaveAttribute('data-pdfix-space-after','6');
  for(const plain of ['Plain body text','A list item'])for(const name of ['data-pdfix-indent','data-pdfix-first-line','data-pdfix-line'])await expect(editor.locator('p').filter({hasText:plain}).first()).not.toHaveAttribute(name,/./);
  await expect(page.locator('.draft-status')).not.toContainText('Saving');report.edited=await page.locator('.document-title').textContent();await page.screenshot({path:path.join(output,'opened.png')});
 });
 await check('run fonts, sizes, colors, highlight and underline from Word are kept',async()=>{
  const styled=editor.locator('p').filter({hasText:'Styled:'});report.styledHtml=await styled.evaluate(p=>p.innerHTML.slice(0,800));
  const red=styled.locator('span[data-pdfix-text-style]').filter({hasText:'red serif'});await expect(red).toHaveAttribute('data-pdfix-font','serif');await expect(red).toHaveAttribute('data-pdfix-size','14');await expect(red).toHaveAttribute('data-pdfix-color','#c00000');
  await expect(styled.locator('mark[data-pdfix-highlight="yellow"]')).toHaveText('marked');await expect(styled.locator('u')).toHaveText('marked');await expect(styled.locator('span[data-pdfix-font="mono"]')).toHaveText(' code');
  await expect(styled.locator('span[data-pdfix-text-style]').filter({hasText:'then'})).toHaveCount(0);
  // List items and table cells keep run formatting too.
  await expect(editor.locator('li span[data-pdfix-color="#00b050"]')).toHaveText('green words');await expect(editor.locator('td span[data-pdfix-font="serif"]')).toHaveText('serif text');await expect(editor.locator('td span[data-pdfix-font="serif"]')).toHaveAttribute('data-pdfix-size','12');
 });
 await check('a Word heading 4 opens as a heading 4 and Heading 6 can be chosen',async()=>{
  await expect(editor.locator('h4')).toHaveText('Fourth level heading');await editor.locator('h4').click();await page.waitForTimeout(300);await expect(page.getByRole('combobox',{name:'Paragraph style'})).toHaveValue('4');
  await page.getByRole('combobox',{name:'Paragraph style'}).selectOption('6');await expect(editor.locator('h6')).toHaveText('Fourth level heading');await editor.press('Control+z');await expect(editor.locator('h4')).toHaveText('Fourth level heading');
 });
 await check('the Home controls show the opened paragraph\'s layout',async()=>{
  await page.getByRole('tablist',{name:'Document tool categories'}).getByRole('tab',{name:'Home',exact:true}).click();
  await block('Hanging reference').click();await page.waitForTimeout(400);await expect(page.getByRole('combobox',{name:'Paragraph first line'})).toHaveValue('hanging');
  await block('Justified and spaced').click();await page.waitForTimeout(400);await expect(page.getByRole('combobox',{name:'Paragraph line spacing'})).toHaveValue('1.5');await expect(page.getByRole('combobox',{name:'Paragraph space before'})).toHaveValue('12');await expect(page.getByRole('button',{name:'Justify',exact:true})).toHaveAttribute('aria-pressed','true');
 });
 await check('a Word file with an unlisted page size and unequal margins opens with them',async()=>{
  const odd=path.join(profile,'Odd page.docx'),mm=value=>Math.round(value*1440/25.4);
  await fs.writeFile(odd,await Packer.toBuffer(new Document({sections:[{properties:{page:{size:{width:mm(150),height:mm(200)},margin:{top:mm(30),right:mm(15),bottom:mm(12),left:mm(25)}}},children:[p('Odd page body')]}]})));
  await page.getByRole('button',{name:'Home',exact:true}).first().click();await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},odd);await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:45000});
  await page.getByRole('tablist',{name:'Document tool categories'}).getByRole('tab',{name:'Pages',exact:true}).click();const details=page.locator('.document-layout-controls');if(await details.evaluate(d=>d.tagName==='DETAILS'&&!d.open))await details.locator('summary').click();
  await expect(page.locator('[data-layout="paper"]')).toHaveValue('custom');await expect(page.getByRole('spinbutton',{name:'Width (mm)'})).toHaveValue('150');await expect(page.getByRole('checkbox',{name:'Each side'})).toBeChecked();await expect(page.getByRole('spinbutton',{name:'Left margin (mm)',exact:true})).toHaveValue('25');await expect(page.getByRole('spinbutton',{name:'Right margin (mm)',exact:true})).toHaveValue('15');
 });
}catch(error){report.error=error.message;try{await page?.screenshot({path:path.join(output,'failure.png')});}catch{}}
finally{if(app){const pid=app.process().pid,closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),15000))]);if(!closed){report.failures.push({name:'window closes after the checks',error:'The window did not close within 15 seconds.'});try{process.kill(pid);}catch{}}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));process.exit(report.pass?0:1);
