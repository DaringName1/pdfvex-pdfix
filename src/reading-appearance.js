import './reading-appearance.css';

const KEY='pdfix-reading-density';
export function initializeReadingAppearance(){
  let density='compact';try{if(localStorage.getItem(KEY)==='comfortable')density='comfortable';}catch{}
  document.body.dataset.readingDensity=density;
}
export function readingAppearanceControls(parent,{announce}){
  const heading=document.createElement('h2');heading.textContent='Document spacing';
  const row=document.createElement('label');row.className='reading-density-setting';row.append(document.createTextNode('Reader and editor spacing '));
  const select=document.createElement('select');select.setAttribute('aria-label','Document spacing');
  for(const [value,label]of [['compact','Compact — more room for the paper'],['comfortable','Comfortable — larger controls']]){const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option);}
  select.value=document.body.dataset.readingDensity==='comfortable'?'comfortable':'compact';
  select.onchange=()=>{const density=select.value==='comfortable'?'comfortable':'compact';document.body.dataset.readingDensity=density;try{localStorage.setItem(KEY,density);}catch{announce('Document spacing changed for this session. This device could not save the preference.',true);}};
  row.append(select);parent.append(heading,row);
}
