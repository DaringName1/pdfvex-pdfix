const MAX_BYTES=8*1024*1024;
const point=ref=>{
 const match=/^([A-Z]{1,3})([1-9][0-9]{0,6})$/.exec(ref??'');if(!match)throw new Error('Invalid CSV cell address.');
 let col=0;for(const letter of match[1])col=col*26+letter.charCodeAt(0)-64;const row=Number(match[2]);
 if(col>16384||row>1048576)throw new Error('CSV cell address exceeds worksheet dimensions.');return {row,col};
};
export function workbookCsv(cells,changes=[]){
 if(!Array.isArray(cells)||cells.length>100000||!Array.isArray(changes)||changes.length>5000)throw new Error('CSV source exceeds the supported cell limit.');
 const values=new Map();let maxRow=1,maxCol=1;
 for(const cell of [...cells,...changes]){
  if(!cell||typeof cell.value!=='string'||!cell.value.isWellFormed()||!['text','number','boolean'].includes(cell.type))throw new Error('Invalid CSV cell value.');
  const position=point(cell.ref);values.set(cell.ref,{...cell,...position});maxRow=Math.max(maxRow,position.row);maxCol=Math.max(maxCol,position.col);
 }
 if(maxRow*maxCol>1000000)throw new Error('CSV export is limited to one million cells, including blanks.');
 const encoder=new TextEncoder(),lines=[];let length=3; // UTF-8 BOM is part of the byte budget.
 for(let row=1;row<=maxRow;row++){
  const line=[];for(let col=1;col<=maxCol;col++){let n=col,letters='';while(n){n--;letters=String.fromCharCode(65+n%26)+letters;n=Math.floor(n/26);}const cell=values.get(letters+row);let value=cell?.value??'';
   if(cell?.type==='text'&&/^[\s]*[=+\-@]|^[\t\r\n]/.test(value))value="'"+value;
   line.push('"'+value.replaceAll('"','""')+'"');
  }
  const text=line.join(',');length+=encoder.encode(text).length+(row>1?2:0);
  if(length>MAX_BYTES)throw new Error('CSV output exceeds 8 MB.');lines.push(text);
 }
 return encoder.encode('\ufeff'+lines.join('\r\n'));
}
