// Puts the paragraph layout and run formatting read from a Word body back onto the imported HTML. Paragraphs are lined
// up by their text, in order, so a paragraph the import dropped or merged only skips its own layout instead of
// shifting the rest.
const LOOKAHEAD=40,TEXT_KEY=120;
const DATA={textAlign:'data-pdfix-align',indent:'data-pdfix-indent',firstLine:'data-pdfix-first-line',lineSpacing:'data-pdfix-line',spaceBefore:'data-pdfix-space-before',spaceAfter:'data-pdfix-space-after',rightIndent:'data-pdfix-right-indent'};
const key=text=>text.replace(/\s+/g,'').slice(0,TEXT_KEY);
// Run ranges count characters other than tabs and line breaks. Each text node is split where the run changes and the styled parts are
// wrapped in the editor's own text-style and highlight markers. A paragraph whose character count differs from the
// Word runs (fields, text boxes, anything the import changed) is left as imported.
function applyRuns(element,runs,own=()=>true){
  const doc=element.ownerDocument,walker=doc.createTreeWalker(element,4),nodes=[];while(walker.nextNode())if(own(walker.currentNode))nodes.push(walker.currentNode);
  const total=nodes.reduce((sum,node)=>sum+node.data.replace(/[\t\r\n]/g,'').length,0);if(total!==runs.reduce((sum,run)=>sum+run.n,0))return false;
  const ends=[];let sum=0;for(const run of runs)ends.push(sum+=run.n);
  let count=0,segment=0;
  for(const node of nodes){
    const pieces=[];let current=null,text='';
    // Tabs and line breaks are not counted (they are not run text in Word) and stay with the run around them.
    for(const char of node.data){const counted=!/[\t\r\n]/.test(char);if(counted)while(count>=ends[segment])segment++;if(counted)count++;if(current!==null&&segment!==current){pieces.push([current,text]);text='';}current=segment;text+=char;}
    if(text)pieces.push([current,text]);
    if(pieces.every(([index])=>!Object.keys(runs[index].style).length))continue;
    const fragment=doc.createDocumentFragment();
    for(const [index,part] of pieces){
      const style=runs[index].style;let wrapped=doc.createTextNode(part);
      // Separate elements: the editor reads one formatting marker per element.
      if(style.highlight){const span=doc.createElement('span');span.setAttribute('data-pdfix-highlight',style.highlight);span.append(wrapped);wrapped=span;}
      if(style.font||style.size||style.color){const span=doc.createElement('span');span.setAttribute('data-pdfix-text-style','true');if(style.font)span.setAttribute('data-pdfix-font',style.font);if(style.size)span.setAttribute('data-pdfix-size',String(style.size));if(style.color)span.setAttribute('data-pdfix-color',style.color);span.append(wrapped);wrapped=span;}
      fragment.append(wrapped);
    }
    node.replaceWith(fragment);
  }
  return true;
}
// Word marks a heading a link points to with an empty bookmark inside it; that name becomes the heading's anchor so
// Word's internal links (a table of contents, cross-references) keep working.
export function wordHeadingAnchors(html){
  if(!/<a [^>]*id=/i.test(html))return html;const parsed=new DOMParser().parseFromString(html,'text/html');
  for(const bookmark of parsed.body.querySelectorAll('a[id]')){const heading=bookmark.closest('h1,h2,h3,h4,h5,h6'),name=bookmark.getAttribute('id');if(heading&&!heading.dataset.pdfixAnchor&&/^[A-Za-z_][A-Za-z0-9_.-]{0,39}$/.test(name))heading.setAttribute('data-pdfix-anchor',name);if(!bookmark.getAttribute('href'))bookmark.replaceWith(...bookmark.childNodes);}
  return parsed.body.innerHTML;
}
export function applyDocxParagraphs(html,paragraphs){
  if(!Array.isArray(paragraphs)||!paragraphs.length)return {html,applied:0,styled:0};
  const parsed=new DOMParser().parseFromString(html,'text/html');let next=0,applied=0,styled=0;
  for(const element of parsed.body.querySelectorAll('p,h1,h2,h3,h4,h5,h6,li')){
    // A list item's own text is the text outside any list nested in it; one holding paragraphs is matched through them.
    const item=element.tagName==='LI';if(item&&element.querySelector(':scope > p'))continue;
    const own=item?node=>node.parentElement?.closest('li')===element:()=>true,inner=item||!!element.closest('li,td,th');
    const walker=parsed.createTreeWalker(element,4);let content='';while(walker.nextNode())if(own(walker.currentNode))content+=walker.currentNode.data;
    const text=key(content);if(!text)continue;
    const end=Math.min(paragraphs.length,next+LOOKAHEAD);let found=-1;for(let index=next;index<end;index++)if(paragraphs[index].text===text){found=index;break;}
    if(found<0)continue;next=found+1;const {attrs,runs}=paragraphs[found];let used=false;
    if(!inner)for(const [name,attribute] of Object.entries(DATA))if(attrs[name]!==undefined&&attrs[name]!==null){element.setAttribute(attribute,String(attrs[name]));used=true;}
    if(used)applied++;if(runs&&applyRuns(element,runs,own))styled++;
  }
  return {html:parsed.body.innerHTML,applied,styled};
}
