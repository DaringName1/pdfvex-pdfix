const {test}=require('node:test');
const assert=require('node:assert/strict');
const layout=import('../src/pdf-readable-layout.js');
const page={rotate:0,getViewport:()=>({width:600,convertToViewportPoint:(x,y)=>[x,800-y]})};
const run=(str,x,y,width=40)=>({str,width,height:12,dir:'ltr',transform:[12,0,0,12,x,y]});

test('table gaps preserve adjacent fragments and exact search source offsets',async()=>{
 const {pdfReadableText}=await layout,content={items:[run('main',40,700,30),run('tenance',70,700,50),run('2',200,700,10),run('Ready',400,700,40),run('Caption below table',40,640,180)]};
 const result=pdfReadableText(content,page,'table');assert.deepEqual(result.output,['maintenance\t2\tReady','Caption below table']);assert.deepEqual(result.sourceRuns,[[0,1,2,3],[4]]);
 for(let i=0;i<result.output.length;i++)for(const fragment of result.sourceFragments[i])assert.equal(result.output[i].slice(fragment.start,fragment.start+fragment.text.length),fragment.text);
});

test('manual unequal column split keeps captions and spanning separators between sections',async()=>{
 const {pdfReadableText}=await layout,content={items:[run('Right upper',220,730,320),run('Left upper',40,730,100),run('Left caption',40,710,100),run('Right lower',220,600,320),run('Left lower',40,600,100),run('Spanning separator',40,650,500)]};
 const result=pdfReadableText(content,page,'two',30);assert.deepEqual(result.output,['Left upper','Left caption','Right upper','Spanning separator','Left lower','Right lower']);assert.equal(result.sourceRuns.flat().length,content.items.length);
 assert.throws(()=>pdfReadableText(content,page,'two',NaN),/column split/);assert.throws(()=>pdfReadableText(content,page,'two',90),/column split/);
});

test('visible rows join adjacent font fragments and retain geometric or explicit word gaps',async()=>{
 const {pdfReadableText}=await layout;
 const content={items:[run('main',40,700,30),run('tenance',70,700,50),run('review',145,700,40),run('thin',40,660,30),{str:'\u2009'},run('space',70,660,30)]};
 const result=pdfReadableText(content,page,'rows');
 assert.deepEqual(result.output,['maintenance review','thin space']);
 assert.deepEqual(result.sourceRuns,[[0,1,2],[3,5]]);
 assert.deepEqual(result.sourceFragments[0],[{run:0,start:0,text:'main'},{run:1,start:4,text:'tenance'},{run:2,start:12,text:'review'}]);
});

test('two-column reading keeps a middle spanning heading between its sections',async()=>{
 const {pdfReadableText}=await layout;
 // Source order deliberately differs from visual order.
 const content={items:[run('Right upper',350,720,90),run('Left upper',40,720,90),run('Section heading',200,650,220),run('Right lower',350,580,90),run('Left lower',40,580,90)]};
 const result=pdfReadableText(content,page,'two');
 assert.deepEqual(result.output,['Left upper','Right upper','Section heading','Left lower','Right lower']);
 assert.deepEqual(result.sourceRuns,[[1],[0],[2],[4],[3]]);
 for(let index=0;index<result.output.length;index++)for(const fragment of result.sourceFragments[index])assert.equal(result.output[index].slice(fragment.start,fragment.start+fragment.text.length),fragment.text);
});

test('three columns and left/right regional views preserve source identities',async()=>{
 const {pdfReadableText}=await layout;
 const content={items:[run('Third',440,700),run('Second',240,700),run('First',40,700)]};
 assert.deepEqual(pdfReadableText(content,page,'three').output,['First','Second','Third']);
 assert.deepEqual(pdfReadableText(content,page,'left').sourceRuns,[[2,1]]);
 assert.deepEqual(pdfReadableText(content,page,'right').sourceRuns,[[0]]);
});

test('RTL runs join adjacent fragments in visual reading direction',async()=>{
 const {pdfReadableText}=await layout;
 const content={items:[{...run('אב',100,700,20),dir:'rtl'},{...run('גד',80,700,20),dir:'rtl'}]};
 assert.deepEqual(pdfReadableText(content,page,'rows').output,['אבגד']);
});

test('reviewed right-to-left columns keep spanning captions between sections',async()=>{
 const {pdfReadableText}=await layout,content={items:[run('Right upper',350,720,90),run('Left upper',40,720,90),run('Caption',200,650,220),run('Right lower',350,580,90),run('Left lower',40,580,90)]};
 const result=pdfReadableText(content,page,'two-rtl');assert.deepEqual(result.output,['Right upper','Left upper','Caption','Right lower','Left lower']);assert.deepEqual(result.sourceRuns,[[0],[1],[2],[3],[4]]);
 const three=pdfReadableText({items:[run('L',40,700),run('M',240,700),run('R',440,700)]},page,'three-rtl');assert.deepEqual(three.output,['R','M','L']);
});

test('reviewed vertical columns keep top-to-bottom source character mappings',async()=>{
 const {pdfReadableText}=await layout,content={items:[{...run('左下',40,600,20),dir:'ttb'},{...run('右上',350,700,20),dir:'ttb'},{...run('左上',40,700,20),dir:'ttb'},{...run('右下',350,600,20),dir:'ttb'}]};
 const result=pdfReadableText(content,page,'vertical');assert.deepEqual(result.output,['右上 右下','左上 左下']);assert.deepEqual(result.sourceRuns,[[1,3],[2,0]]);
 for(let i=0;i<result.output.length;i++)for(const fragment of result.sourceFragments[i])assert.equal(result.output[i].slice(fragment.start,fragment.start+fragment.text.length),fragment.text);
});

test('automatic columns avoid treating the edge of a spanning heading as the gutter',async()=>{
 const {pdfReadableText}=await layout,items=[];
 for(const [section,y] of [['upper',730],['lower',550]])for(let i=0;i<4;i++)items.push(run('left '+section+' '+i,40,y-i*25,160),run('right '+section+' '+i,350,y-i*25,90));
 items.push(run('Middle section',220,620,125));
 const result=pdfReadableText({items},page,'auto');
 assert.equal(result.output[8],'Middle section');assert.equal(result.output[9],'left lower 0');
});

test('reviewed regions order captions and irregular blocks without duplicate source runs',async()=>{
 const {pdfReadableText,readableRegions}=await layout,p={...page,getViewport:()=>({...page.getViewport(),height:800})},content={items:[run('Right caption',350,700,90),run('Left body',40,700,90),run('Lower table',40,300,90)]};
 const boxes=readableRegions('50 0 100 40\n0 0 50 40\n0 40 100 100'),result=pdfReadableText(content,p,'regions',50,boxes);assert.deepEqual(result.output,['Right caption','Left body','Lower table']);assert.deepEqual(result.sourceRuns,[[0],[1],[2]]);assert.equal(result.omitted,false);
 const partial=pdfReadableText(content,p,'regions',50,[[0,0,50,40]]);assert.equal(partial.omitted,true);assert.match(partial.method,/2 text runs/);assert.throws(()=>pdfReadableText(content,p,'regions',50,[[0,0,100,100],[0,0,50,40]]),/more than once/);assert.throws(()=>readableRegions('20 0 10 100'),/left < right/);
 for(let i=0;i<result.output.length;i++)for(const f of result.sourceFragments[i])assert.equal(result.output[i].slice(f.start,f.start+f.text.length),f.text);
});
