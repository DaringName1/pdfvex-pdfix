const MAX=2*1024*1024;
export function parseCsv(text,delimiter=','){
 if(typeof text!=='string'||text.length>MAX||![';',',','\t'].includes(delimiter))throw new Error('CSV preview supports up to 2 MB and comma, semicolon or tab separators.');
 const rows=[];let row=[],field='',quoted=false,afterQuote=false,start=true,cells=0;
 const cell=()=>{if(++cells>100000||row.length>=500||field.length>100000)throw new Error('CSV preview supports 100,000 cells, 500 columns and 100,000 characters per cell.');row.push(field);field='';start=true;afterQuote=false;};
 const end=()=>{cell();rows.push(row);row=[];if(rows.length>20000)throw new Error('CSV preview supports up to 20,000 rows.');};
 for(let i=0;i<text.length;i++){
  const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;afterQuote=true;}}else field+=c;}
  else if(c==='"'){if(!start||afterQuote)throw new Error('A CSV quote occurs inside an unquoted field. Correct the source or choose another separator.');quoted=true;start=false;}
  else if(c===delimiter)cell();else if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;end();}
  else{if(afterQuote)throw new Error('Characters follow a closed CSV quote. Correct the source or choose another separator.');field+=c;start=false;}
  if(field.length>100000)throw new Error('A CSV cell exceeds the 100,000-character preview limit.');
 }
 if(quoted)throw new Error('A quoted CSV field is unfinished. Correct the source before previewing.');
 if(row.length||field.length||afterQuote||text.length&&!/[\r\n]$/.test(text))end();
 return {kind:'csv',rows,cells,columns:rows.reduce((n,row)=>Math.max(n,row.length),0)};
}
export function parseMarkdown(text){
 if(typeof text!=='string'||text.length>MAX)throw new Error('Markdown preview supports up to 2 MB.');
 const lines=text.replace(/\r\n?/g,'\n').split('\n');if(lines.length>50000)throw new Error('Markdown preview supports up to 50,000 source lines.');
 const blocks=[];let paragraph=[],paragraphLength=0,fence=null,code=[];
 const add=block=>{if(blocks.length>=10000)throw new Error('Markdown preview supports up to 10,000 blocks.');blocks.push(block);};
 const flush=()=>{if(paragraph.length){add({type:'p',text:paragraph.join('\n')});paragraph=[];paragraphLength=0;}};
 for(let i=0;i<lines.length;i++){
  const line=lines[i];if(line.length>100000)throw new Error('A Markdown line exceeds the preview limit.');
  const boundary=/^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
  if(fence){if(boundary&&boundary[1][0]===fence[0]&&boundary[1].length>=fence.length&&!boundary[2].trim()){add({type:'pre',text:code.join('\n')});fence=null;code=[];}else code.push(line);continue;}
  if(boundary){flush();fence=boundary[1];continue;}
  if(!line.trim()){flush();continue;}
  const heading=/^ {0,3}(#{1,6})\s+(.*)$/.exec(line);if(heading){flush();add({type:'h'+heading[1].length,text:heading[2].replace(/\s+#+\s*$/,'')});continue;}
  if(/^ {0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)){flush();add({type:'hr'});continue;}
  const quote=/^ {0,3}> ?(.*)$/.exec(line);if(quote){flush();add({type:'quote',text:quote[1]});continue;}
  const item=/^\s{0,12}(?:([-+*])|([0-9]{1,9})[.)])\s+(.*)$/.exec(line);if(item){flush();const task=/^\[([ xX])\]\s+(.*)$/.exec(item[3]);add({type:'item',ordered:!!item[2],number:item[2],text:task?task[2]:item[3],task:task?task[1]!==' ':null,depth:Math.min(4,Math.floor((line.length-line.trimStart().length)/2))});continue;}
  // A deliberately supported table subset. Pipes inside code/escapes are not interpreted specially.
  if(line.includes('|')&&i+1<lines.length&&/^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[i+1])){
   flush();const split=value=>value.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(v=>v.trim());
   const rows=[split(line)];i++;while(i+1<lines.length&&lines[i+1].trim()&&lines[i+1].includes('|')){rows.push(split(lines[++i]));if(rows.length>1000)throw new Error('A Markdown table exceeds 1,000 rows.');}
   if(rows.some(row=>row.length>100))throw new Error('A Markdown table exceeds 100 columns.');add({type:'table',rows});continue;
  }
  paragraph.push(line);paragraphLength+=line.length;if(paragraphLength>100000)throw new Error('A Markdown paragraph exceeds the preview limit.');
 }
 flush();if(fence)add({type:'pre',text:code.join('\n')});
 return {kind:'markdown',blocks};
}
