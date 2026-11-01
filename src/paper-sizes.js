import definitions from '../desktop/paper-sizes.json' with {type:'json'};

// Inch presets retain their exact inch values; ISO presets retain exact millimeters.
// All consumers convert once to PDF points (72 points per inch).
// Dimensions: https://ij.manual.canon/ij/webmanual/Manual/All/TM-305/EN/LBGA/lbga_tp000146.html/1000
export const PAPER_SIZES=Object.freeze(definitions.map(size=>Object.freeze({...size})));
export function paperSize(id){return PAPER_SIZES.find(size=>size.id===id)??null;}
export function paperPoints(id,orientation='portrait'){
 const size=paperSize(id);
 if(!size||!['portrait','landscape'].includes(orientation))throw new Error('Choose a supported paper size and orientation.');
 const factor=size.unit==='in'?72:72/25.4;
 const dimensions=[size.width*factor,size.height*factor];
 return orientation==='landscape'?dimensions.reverse():dimensions;
}
export function paperOptionLabel(size){return `${size.name} · ${size.width} × ${size.height} ${size.unit}`;}
