import './print-imposition-controls.css';
import {printImposition} from './print-imposition.js';
const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
/** Root owns preview invalidation and raster limits. Attach once after the
 * existing print dialog's generic option input handlers are installed. */
export function printImpositionControls(dialog,{onChange=()=>{}}={}){
  const options=dialog.querySelector('.print-options');if(!options)throw new Error('Print options are unavailable.');
  const container=el('div');container.className='print-imposition-controls';const modeLabel=el('label','Pages per side'),mode=el('select');mode.dataset.imposition='';for(const[value,title]of[['single','1 page'],['two','2 pages · left to right'],['four','4 pages · row by row'],['booklet','Booklet · left binding']]){const option=el('option',title);option.value=value;mode.append(option);}modeLabel.append(mode);
  const gapLabel=el('label','Page gap · mm'),gap=el('input');Object.assign(gap,{type:'number',min:'0',max:'30',step:'1',value:'4'});gap.dataset.impositionGap='';gapLabel.append(gap);container.append(modeLabel,gapLabel);options.append(container);
  const notice=el('p');notice.className='print-imposition-notice';options.after(notice);const scale=dialog.querySelector('[data-scale]'),orientation=dialog.querySelector('[data-orientation]'),duplex=dialog.querySelector('[data-duplex]');
  function sync(){const imposed=mode.value!=='single',booklet=mode.value==='booklet';gapLabel.hidden=!imposed;if(imposed&&scale)scale.value='fit';if(scale){scale.querySelector('option[value="actual"]')?.toggleAttribute('disabled',imposed);}if(booklet){if(orientation)orientation.value='landscape';if(duplex)duplex.value='shortEdge';}notice.textContent=booklet?'Booklet reorders only the selected physical pages and adds blanks to a multiple of four. Front/back pairs are adjacent in the preview. Landscape paper and short-edge duplex are requested; verify driver flipping and orientation before printing. Unsaved edits are not included.':imposed?'Multiple pages fit into equal printable cells. Physical source-page order is retained; empty final cells stay blank. Actual-size printing is unavailable in this mode.':'One selected source page per printed side. Fit or actual size remains available.';}
  const change=()=>{sync();onChange();};mode.addEventListener('input',change);gap.addEventListener('input',change);
  // A later orientation/scale/duplex edit cannot silently defeat booklet geometry.
  const enforce=()=>{if(mode.value==='booklet'||mode.value!=='single'&&scale?.value!=='fit'){sync();onChange();}};
  orientation?.addEventListener('input',enforce);scale?.addEventListener('input',enforce);duplex?.addEventListener('input',enforce);sync();
  return {settings:()=>({imposition:mode.value,impositionGap:Number(gap.value)}),plan:settings=>printImposition({...settings,mode:mode.value,gap:Number(gap.value)}),dispose:()=>{mode.removeEventListener('input',change);gap.removeEventListener('input',change);orientation?.removeEventListener('input',enforce);scale?.removeEventListener('input',enforce);duplex?.removeEventListener('input',enforce);container.remove();notice.remove();}};
}
