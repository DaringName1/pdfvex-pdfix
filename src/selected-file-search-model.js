// Match normalized whitespace while retaining exact UTF-16 source offsets.
export function searchTextMatches(raw,query,{caseSensitive=false,wholeWord=false,limit=2000}={}){
 if(typeof raw!=='string'||raw.length>2*1024*1024||typeof query!=='string'||!query.trim()||query.length>200||!Number.isInteger(limit)||limit<0||limit>2000)throw new Error('Use a phrase of 1–200 characters within the bounded text source.');
 const normalize=text=>text.replace(/\s+/gu,' ').trim(),needle=caseSensitive?normalize(query):normalize(query).toLowerCase();let text='',offset=0,pending=null;const starts=[],ends=[];
 for(const character of raw){const end=offset+character.length;if(/\s/u.test(character)){if(text)pending=pending?{start:pending.start,end}:{start:offset,end};}else{if(pending){text+=' ';starts.push(pending.start);ends.push(pending.end);pending=null;}const value=caseSensitive?character:character.toLowerCase();text+=value;for(let index=0;index<value.length;index++){starts.push(offset);ends.push(end);}}offset=end;}
 const word=character=>!!character&&/[\p{L}\p{N}\p{M}_]/u.test(character),matches=[];let at=0,capped=false;
 while((at=text.indexOf(needle,at))!==-1){const end=at+needle.length,start=starts[at],last=ends[end-1];const before=Array.from(raw.slice(Math.max(0,start-2),start)).at(-1),after=Array.from(raw.slice(last,last+2))[0];if(!wholeWord||!word(before)&&!word(after)){if(matches.length>=limit){capped=true;break;}matches.push({start,end:last,excerpt:raw.slice(Math.max(0,start-90),Math.min(raw.length,last+130)),literal:raw.slice(start,last)});}at=end;}
 return {matches,capped};
}
export function searchLineIndex(text){const starts=[0];for(let index=0;index<text.length;index++)if(text[index]==='\r'||text[index]==='\n'){if(text[index]==='\r'&&text[index+1]==='\n')index++;starts.push(index+1);}return offset=>{let lo=0,hi=starts.length;while(lo<hi){const mid=(lo+hi)>>>1;if(starts[mid]<=offset)lo=mid+1;else hi=mid;}return Math.max(1,lo);};}
