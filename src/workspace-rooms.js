import './workspace-rooms.css';
import {TOOL_GROUPS,TOOLS,toolByName,toolMatches} from './tool-registry.js';
// All tools (owner-approved one-place layout, October 19): the same groups and names as the tool bar of an open PDF.
// Create comes first because this page is where work starts without an open file. Older names still find a tool.
const captions={create:'Start new work: documents, conversions, scans, spreadsheets, slides and folders.',view:'Open and read PDFs.',comment:'Highlights, notes, markups and review comments.',edit:'Change text and pictures in a PDF, or make a scan searchable.','fill-sign':'Fill in forms, sign, and create fillable fields or signing requests.',pages:'Arrange, number, stamp and outline pages.',protect:'Passwords, redaction and document checks.',measure:'Drawing measurements, revisions and sheet sets.',export:'Pictures, smaller files, tables and print-ready copies.'};
const groups=[TOOL_GROUPS.find(g=>g.id==='create'),...TOOL_GROUPS.filter(g=>g.id!=='create')];
const order=new Map(TOOLS.map((tool,index)=>[tool.id,index]));
export function renderWorkspaceRooms(main,entries,{element,icon}){
 const root=element('section',undefined,'workspace-rooms'),tabs=element('div',undefined,'workspace-room-tabs'),panel=element('section',undefined,'workspace-room-panel'),grid=element('div',undefined,'workspace-hub workspace-room-grid'),caption=element('p',undefined,'workspace-room-caption'),search=element('input'),empty=element('p','No matching tool. Try another name or clear the search.','workspace-room-empty');let selected='create';try{const saved=sessionStorage.getItem('pdfix.tool-group');if(groups.some(g=>g.id===saved))selected=saved;}catch{}
 const id='workspace-room-'+crypto.randomUUID();panel.id=id;panel.setAttribute('role','tabpanel');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Tool groups');
 const searchLabel=element('label','Find a tool');search.type='search';search.placeholder='Type a tool name, for example redact or sign';search.maxLength=120;search.setAttribute('aria-label','Find a tool across workspaces');searchLabel.append(search);searchLabel.className='workspace-room-search';
 // Every offered tool with its shared name and group; a tool missing from the shared list stays under Create.
 const tools=entries.map(([symbol,title,description,action])=>{const known=toolByName(title);return {symbol,title:known?.name??title,description,action,group:known?.group??'create',known,rank:known?order.get(known.id):Infinity};}).sort((a,b)=>a.rank-b.rank);
 const buttons=groups.map(group=>{const button=element('button',group.name);button.type='button';button.id=id+'-'+group.id;button.setAttribute('role','tab');button.setAttribute('aria-controls',id);button.onclick=()=>select(group.id);tabs.append(button);return button;});
 function select(group){selected=group;search.value='';try{sessionStorage.setItem('pdfix.tool-group',group);}catch{}paint();}
 tabs.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;const index=buttons.indexOf(document.activeElement);if(index<0)return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;select(groups[next].id);buttons[next].focus();};
 function paint(){const query=search.value.trim().toLocaleLowerCase();for(let i=0;i<buttons.length;i++){const active=groups[i].id===selected;buttons[i].setAttribute('aria-selected',String(active&&!query));buttons[i].tabIndex=active?0:-1;}panel.setAttribute('aria-labelledby',id+'-'+selected);grid.replaceChildren();caption.textContent=query?'Matching tools in every group':captions[selected];
  for(const tool of tools){const match=query?(tool.known&&toolMatches(tool.known,query))||`${tool.title} ${tool.description}`.toLocaleLowerCase().includes(query):tool.group===selected;if(!match)continue;
   const button=element('button');button.type='button';button.innerHTML=icon(tool.symbol);button.append(element('h2',tool.title),element('p',tool.description));if(query)button.append(element('small',groups.find(g=>g.id===tool.group).name));
   button.addEventListener('click',()=>{const toast=document.querySelector('#toast');if(toast){toast.hidden=true;try{if(toast.matches(':popover-open'))toast.hidePopover();}catch{}}tool.action();});grid.append(button);}
  empty.hidden=!!grid.childElementCount;
 }
 search.oninput=paint;panel.append(caption,grid,empty);root.append(tabs,searchLabel,panel);main.append(root);paint();return root;
}
