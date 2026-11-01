import {MARKUP_KINDS,MARKUP_COLORS,inkStyle,highlightOpacity} from './markup-model.js';
import './markup-tool-library.css';
export const MARKUP_TOOL_STORAGE_KEY='pdfix-markup-tools-v1';
const MAX_BYTES=64*1024,MAX_TOOLS=20;
const label={highlight:'Highlight',underline:'Underline',note:'Note',text:'Text box',ink:'Drawing',line:'Line',arrow:'Arrow',cloud:'Revision cloud',callout:'Callout'};
const bytes=value=>new TextEncoder().encode(value).length;
const nameKey=value=>value.normalize('NFKC').toLocaleLowerCase('en-US');
const el=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
const button=(text,action,className='secondary compact')=>{const node=el('button',text,className);node.type='button';node.onclick=action;return node;};
function validateTool(tool){
  if(!tool||typeof tool!=='object'||Array.isArray(tool)||Object.keys(tool).some(key=>!['name','kind','color','fontSize','text','inkWidth','inkOpacity','highlightOpacity','inkPressureMode'].includes(key))||typeof tool.name!=='string'||!tool.name.trim()||tool.name!==tool.name.trim()||tool.name.length>60||/[\u0000-\u001f\u007f]/.test(tool.name)||!MARKUP_KINDS.includes(tool.kind)||!Object.hasOwn(MARKUP_COLORS,tool.color)||!Number.isFinite(tool.fontSize)||tool.fontSize<8||tool.fontSize>48||typeof tool.text!=='string'||tool.text.length>2000)throw new Error('A saved drawing tool has invalid settings.');
  const value={name:tool.name,kind:tool.kind,color:tool.color,fontSize:tool.fontSize,text:tool.text};if(tool.kind==='ink'){inkStyle(tool);if(Object.hasOwn(tool,'inkPressureMode')){if(!['fixed','reported'].includes(tool.inkPressureMode))throw new Error('Unsupported ink pressure mode.');value.inkPressureMode=tool.inkPressureMode;}for(const key of ['inkWidth','inkOpacity'])if(Object.hasOwn(tool,key))value[key]=tool[key];}else if(Object.hasOwn(tool,'inkWidth')||Object.hasOwn(tool,'inkOpacity')||Object.hasOwn(tool,'inkPressureMode'))throw new Error('Only ink tools have ink width and opacity.');if(tool.kind==='highlight'){highlightOpacity(tool);if(Object.hasOwn(tool,'highlightOpacity'))value.highlightOpacity=tool.highlightOpacity;}else if(Object.hasOwn(tool,'highlightOpacity'))throw new Error('Only a highlight tool has highlighter opacity.');return value;
}
function decode(raw){
  if(raw===null)return [];
  if(bytes(raw)>MAX_BYTES)throw new Error('Saved drawing tools exceed the 64 KB limit.');
  let value;try{value=JSON.parse(raw);}catch{throw new Error('Saved drawing tools could not be read.');}
  if(!value||value.version!==1||!Array.isArray(value.tools)||value.tools.length>MAX_TOOLS||Object.keys(value).some(key=>!['version','tools'].includes(key)))throw new Error('Saved drawing-tool library has an unsupported format.');
  const names=new Set();return value.tools.map(tool=>{const checked=validateTool(tool),key=nameKey(checked.name);if(names.has(key))throw new Error('Saved drawing-tool names are duplicated.');names.add(key);return checked;});
}
export function attachMarkupToolLibrary(workspace){
  const w=workspace,root=el('section',undefined,'markup-tool-library'),heading=el('strong','Saved drawing tools'),row=el('div',undefined,'markup-library-row'),select=el('select');select.setAttribute('aria-label','Saved drawing tool');
  const status=el('p',undefined,'markup-library-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const notice=el('p','Names and default comments are stored unencrypted in this desktop profile. No cloud sync. Saved tools contain style and text only; no page, position or drawing coordinates.','markup-library-notice');
  let tools=[],rawSeen=null,readError='',pendingStyle=null,closed=false,child=null;
  function feedback(message,error=false){status.textContent=message;if(error)w.announce(message,true);}
  function load(){try{rawSeen=localStorage.getItem(MARKUP_TOOL_STORAGE_KEY);tools=decode(rawSeen);readError='';}catch(error){tools=[];readError=error.message;}}
  function render(){
    const previous=select.value;select.replaceChildren();const empty=el('option',tools.length?'Choose a saved tool':'No saved tools');empty.value='';select.append(empty);
    tools.forEach((tool,index)=>{const option=el('option',`${tool.name} — ${label[tool.kind]}`);option.value=String(index);select.append(option);});select.value=previous;
    if(select.selectedIndex<0)select.value='';refresh();
  }
  function locked(){return !!(closed||w.busy||w.saving||w.departing||!w.ready);}
  function refresh(){
    const unavailable=locked(),selected=select.value!=='';select.disabled=unavailable||!!readError;
    apply.disabled=unavailable||!!readError||!selected;save.disabled=unavailable||!!readError||tools.length>=MAX_TOOLS;remove.disabled=unavailable||!!readError||!selected;
    clear.disabled=unavailable;exportButton.disabled=unavailable||rawSeen===null;cancelStyle.disabled=unavailable||!pendingStyle;
    if(readError){status.textContent=`${readError} Applying or saving tools is disabled. Export a recovery text copy, then clear this library to start again.`;root.dataset.broken='true';}else delete root.dataset.broken;
  }
  function write(next){
    const raw=JSON.stringify({version:1,tools:next.map(validateTool)});if(next.length>MAX_TOOLS||bytes(raw)>MAX_BYTES)throw new Error('Keep at most 20 tools and 64 KB of saved settings.');
    if(localStorage.getItem(MARKUP_TOOL_STORAGE_KEY)!==rawSeen){load();render();throw new Error('The drawing-tool library changed in another window. Review the refreshed list and try again.');}
    localStorage.setItem(MARKUP_TOOL_STORAGE_KEY,raw);rawSeen=raw;tools=next.map(validateTool);readError='';render();
  }
  function openDialog(title,description){
    if(locked()||child)return null;
    const dialog=el('dialog',undefined,'markup-tool-dialog');dialog.append(el('h2',title),el('p',description));const form=el('form');form.method='dialog';dialog.append(form);document.body.append(dialog);child=dialog;
    dialog.addEventListener('close',()=>{dialog.remove();if(child===dialog)child=null;});dialog.showModal();return {dialog,form};
  }
  function confirmation(title,description,confirmLabel,action){
    const ui=openDialog(title,description);if(!ui)return;const {dialog,form}=ui,actions=el('div',undefined,'markup-library-row');actions.append(button('Keep / cancel',()=>dialog.close()),button(confirmLabel,()=>{try{action();dialog.close();}catch(error){feedback(error.message,true);}},'primary'));form.append(actions);actions.firstElementChild.focus();form.addEventListener('submit',e=>e.preventDefault());
  }
  const apply=button('Use for next mark',()=>{
    if(locked()||readError||select.value==='')return;
    const tool=tools[Number(select.value)];if(!tool)return;
    pendingStyle={...tool};w.dialog.querySelector('[aria-label="Markup tool"]').value=tool.kind;w.dialog.querySelector('[aria-label="New markup color"]').value=tool.color;if(tool.kind==='ink'){w.setInkControls('New',inkStyle(tool));w.pressureMode.value=tool.inkPressureMode??'fixed';}if(tool.kind==='highlight')w.setHighlightControl('New',highlightOpacity(tool));w.renderMarks();
    feedback(`Next ${label[tool.kind].toLowerCase()} uses “${tool.name}”: ${tool.color}, ${tool.kind==='ink'?inkStyle(tool).width+' pt ink, '+Number((inkStyle(tool).opacity*100).toFixed(6))+'% opacity, '+(tool.inkPressureMode==='reported'?'reported pressure':'uniform width'):tool.kind==='highlight'?Number((highlightOpacity(tool)*100).toFixed(6))+'% opacity':tool.fontSize+' pt'}${tool.text?' and its saved comment':''}. Draw its position on the page. Existing marks stay as they are.`);refresh();
  });
  const cancelStyle=button('Clear next-mark style',()=>{pendingStyle=null;feedback('Next-mark style cleared. New marks use the current tool and color, 12 pt, an empty comment and current ink width/opacity.');refresh();},'text-button');
  const save=button('Save tool style',()=>{
    if(locked()||readError||tools.length>=MAX_TOOLS)return;
    const selected=w.marks.find(mark=>mark.id===w.selected),kind=selected?.kind||w.tool;if(!MARKUP_KINDS.includes(kind)){feedback('Choose a drawing tool or select an editable markup to save a style.',true);return;}
    const seed=selected||pendingStyle||{kind,color:w.dialog.querySelector('[aria-label="New markup color"]').value,fontSize:12,text:'',...(kind==='ink'?{inkWidth:Number(w.newInkWidth.value),inkOpacity:Number(w.newInkOpacity.value),inkPressureMode:w.pressureMode.value}:kind==='highlight'?{highlightOpacity:Number(w.newHighlightOpacity.value)}:{})};
    const ui=openDialog('Save a reusable drawing tool','Review the style and default comment before saving. Page locations and coordinates are excluded.');if(!ui)return;const {dialog,form}=ui;
    const field=(title,input)=>{const wrapper=el('label',title);wrapper.append(input);form.append(wrapper);return input;};
    const name=field('Tool name',el('input'));name.type='text';name.maxLength=60;name.required=true;name.setAttribute('aria-label','Saved tool name');
    const type=field('Tool kind',el('select'));type.setAttribute('aria-label','Saved tool kind');MARKUP_KINDS.forEach(value=>{const option=el('option',label[value]);option.value=value;type.append(option);});type.value=kind;
    const color=field('Color',el('select'));color.setAttribute('aria-label','Saved tool color');Object.keys(MARKUP_COLORS).forEach(value=>{const option=el('option',value[0].toUpperCase()+value.slice(1));option.value=value;color.append(option);});color.value=seed.color;
    const size=field('Text size (8–48 pt)',el('input'));size.type='number';size.min='8';size.max='48';size.step='any';size.value=String(seed.fontSize);size.required=true;size.setAttribute('aria-label','Saved tool text size');
    const inkWidth=field('Ink width (0.5–12 pt)',el('input'));inkWidth.type='number';inkWidth.min='.5';inkWidth.max='12';inkWidth.step='any';inkWidth.value=String(seed.kind==='ink'?inkStyle(seed).width:2);inkWidth.setAttribute('aria-label','Saved tool ink width');
    const inkOpacity=field('Ink opacity (10–100%)',el('input'));inkOpacity.type='number';inkOpacity.min='10';inkOpacity.max='100';inkOpacity.step='any';inkOpacity.value=String(seed.kind==='ink'?inkStyle(seed).opacity*100:100);inkOpacity.setAttribute('aria-label','Saved tool ink opacity');const showInk=()=>{inkWidth.parentElement.hidden=inkOpacity.parentElement.hidden=type.value!=='ink';};const highOpacity=field('Highlighter opacity (10–100%)',el('input'));highOpacity.type='number';highOpacity.min='10';highOpacity.max='100';highOpacity.step='any';highOpacity.value=String(seed.kind==='highlight'?highlightOpacity(seed)*100:30);highOpacity.setAttribute('aria-label','Saved tool highlighter opacity');const showStyles=()=>{showInk();highOpacity.parentElement.hidden=type.value!=='highlight';};type.onchange=showStyles;showStyles();
    const pressure=field('Ink pressure',el('select'));pressure.setAttribute('aria-label','Saved tool ink pressure');for(const [value,title]of [['fixed','Uniform width'],['reported','Use reported pen pressure']]){const option=el('option',title);option.value=value;pressure.append(option);}pressure.value=seed.inkPressure?'reported':seed.inkPressureMode??'fixed';pressure.parentElement.hidden=type.value!=='ink';const originalStyles=type.onchange;type.onchange=()=>{originalStyles();pressure.parentElement.hidden=type.value!=='ink';};
    const text=field('Default comment / text',el('textarea'));text.maxLength=2000;text.value=seed.text;text.setAttribute('aria-label','Saved tool default comment');
    const error=el('p');error.setAttribute('role','alert');form.append(error);
    const actions=el('div',undefined,'markup-library-row');actions.append(button('Cancel',()=>dialog.close()));const submit=el('button','Save named tool','primary');submit.type='submit';actions.append(submit);form.append(actions);
    form.addEventListener('submit',e=>{e.preventDefault();try{const tool=validateTool({name:name.value.trim(),kind:type.value,color:color.value,fontSize:Number(size.value),text:text.value,...(type.value==='ink'?{inkWidth:Number(inkWidth.value),inkOpacity:Number(inkOpacity.value)/100,inkPressureMode:pressure.value}:type.value==='highlight'?{highlightOpacity:Number(highOpacity.value)/100}:{})});if(tools.some(item=>nameKey(item.name)===nameKey(tool.name)))throw new Error('Use a unique tool name. Delete the older named tool explicitly if you want to replace it.');write([...tools,tool]);select.value=String(tools.length-1);refresh();feedback(`Saved “${tool.name}” locally. Choose Use for next mark to place it.`);dialog.close();}catch(issue){error.textContent=issue.message;}});name.focus();
  });
  const remove=button('Delete selected tool',()=>{
    if(locked()||readError||select.value==='')return;const index=Number(select.value),tool=tools[index];if(!tool)return;
    confirmation('Delete saved drawing tool?',`Delete “${tool.name}” from this desktop profile? Existing document markups remain. This cannot be undone.`, 'Delete tool',()=>{write(tools.filter((_,i)=>i!==index));if(pendingStyle?.name===tool.name)pendingStyle=null;feedback(`Deleted “${tool.name}”.`);refresh();});
  });
  const clear=button('Clear all saved tools',()=>confirmation('Clear this drawing-tool library?','Remove only PDFix’s saved drawing-tool names, styles and default comments from this desktop profile. Existing PDF annotations, document recovery and other settings remain. Clearing cannot be undone.','Clear saved tools',()=>{
    if(localStorage.getItem(MARKUP_TOOL_STORAGE_KEY)!==rawSeen){load();render();throw new Error('Saved tools changed in another window. Review the refreshed library before clearing.');}
    localStorage.removeItem(MARKUP_TOOL_STORAGE_KEY);rawSeen=null;tools=[];readError='';pendingStyle=null;render();feedback('Saved drawing tools cleared. You can create a new library.');
  }),'text-button');
  const exportButton=button('Export library text copy',async()=>{
    if(locked()||rawSeen===null)return;
    if(bytes(rawSeen)>MAX_BYTES){feedback('This stored library exceeds 64 KB and cannot be exported here. Clear this library explicitly to recover; no oversized data was saved.',true);return;}
    w.saving=true;w.guard();w.controls();refresh();
    try{const result=await window.pdfix.exportDocument(w.file.id,'txt',new TextEncoder().encode(rawSeen));feedback(result?`Saved library JSON as a text copy: ${result.name}. This does not change saved tools or the PDF.`:'Export canceled. Saved tools remain.');}catch(error){feedback(error.message,true);}finally{w.saving=false;w.guard();w.controls();refresh();}
  });
  row.append(select,apply,save,remove,cancelStyle,exportButton,clear);root.append(heading,row,status,notice);w.dialog.querySelector('.markup-tools').after(root);
  select.onchange=()=>refresh();const toolSelect=w.dialog.querySelector('[aria-label="Markup tool"]'),colorSelect=w.dialog.querySelector('[aria-label="New markup color"]');
  const manualChange=()=>{if(pendingStyle){pendingStyle=null;feedback('Changed tool settings. The saved next-mark style was cleared.');refresh();}};toolSelect.addEventListener('change',manualChange);colorSelect.addEventListener('change',manualChange);w.newInkWidth.addEventListener('change',manualChange);w.newInkOpacity.addEventListener('change',manualChange);w.newHighlightOpacity.addEventListener('change',manualChange);w.pressureMode.addEventListener('change',manualChange);
  const storageChange=e=>{if(e.key!==MARKUP_TOOL_STORAGE_KEY&&e.key!==null)return;load();pendingStyle=null;render();feedback(readError||'Saved drawing tools refreshed after a change in another window.',!!readError);};window.addEventListener('storage',storageChange);
  load();render();if(!readError)feedback('Save a selected markup’s style, or choose a tool to create a named preset.');
  return {refresh,peekStyle(kind,color){return !readError&&pendingStyle?.kind===kind&&pendingStyle.color===color?{fontSize:pendingStyle.fontSize,text:pendingStyle.text}:null;},consumeStyle(){if(pendingStyle){const name=pendingStyle.name;pendingStyle=null;feedback(`Used “${name}”. Select it again to place another mark.`);refresh();}},dispose(){closed=true;child?.close();root.remove();toolSelect.removeEventListener('change',manualChange);colorSelect.removeEventListener('change',manualChange);w.newInkWidth.removeEventListener('change',manualChange);w.newInkOpacity.removeEventListener('change',manualChange);w.newHighlightOpacity.removeEventListener('change',manualChange);w.pressureMode.removeEventListener('change',manualChange);window.removeEventListener('storage',storageChange);}};
}
