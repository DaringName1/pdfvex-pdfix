export function safePdfFilename(value){
 let stem=String(value??'').normalize('NFKC').replace(/\.pdf$/i,'').replace(/[<>:"/\\|?*\p{Cc}\p{Cf}\p{Cs}]/gu,'-').replace(/\s+/g,' ').replace(/^[. ]+|[. ]+$/g,'').slice(0,150).replace(/[. ]+$/,'');
 if(!stem.isWellFormed())stem=stem.slice(0,-1);if(!stem)stem='Document';if(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(stem))stem='_'+stem;return stem+'.pdf';
}
function title(value){return String(value??'').replace(/[\p{Cc}\p{Cf}\p{Cs}]/gu,' ').replace(/\s+/g,' ').trim().slice(0,200);}
function isoDate(value){const match=String(value??'').match(/\b((?:19|20)\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/);if(!match)return null;const [year,month,day]=match.slice(1).map(Number),date=new Date(Date.UTC(year,month-1,day));return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day?`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`:null;}
export function suggestPdfFilenames({name='',metadataTitle='',pageText='',physicalPage=1}={}){
 const proposals=[],seen=new Set(),add=(value,reason)=>{const filename=safePdfFilename(value),key=filename.toLocaleLowerCase();if(!seen.has(key)){seen.add(key);proposals.push({filename,reason});}};
 const metadata=title(metadataTitle);if(metadata&&!/^(untitled|document|new document|microsoft word)(?:\s|$)/i.test(metadata))add(metadata,'Document Title metadata; review it because metadata can be stale.');
 const text=String(pageText??'').slice(0,32000),lines=text.split(/\r?\n/).map(title).filter(line=>line.length>=6&&line.length<=120),heading=lines.find(line=>/[\p{L}]/u.test(line)&&!/^\d+[\s.,/-]*$/.test(line)),date=isoDate(text);
 if(heading)add(heading,`First useful extracted line on physical page ${physicalPage}; reading order and heading detection are estimates.`);
 const stem=metadata||heading||String(name).replace(/\.pdf$/i,'');if(date)add(stem+' '+date,`Unambiguous year-month-day text detected on physical page ${physicalPage}; confirm the date belongs to this document.`);
 add(String(name).replace(/\.pdf$/i,'')+'-copy','Original filename with a copy suffix; the original is never renamed.');return proposals.slice(0,4);
}
