const {PDFArray,PDFRef,PDFName,PDFNumber,PDFNull}=require('pdf-lib');
// Some exported/combined drawings retain links to sheets no longer present.
// Keep that exact inactive reference, without treating other dangling objects
// as trustworthy or attempting to repair/reassign a destination.
function danglingDestination(value,context){
 if(!(value instanceof PDFArray)||value.size()<2||value.size()>6||!(value.get(0) instanceof PDFRef)||!(value.get(1) instanceof PDFName))return false;
 const count={XYZ:5,Fit:2,FitB:2,FitH:3,FitV:3,FitBH:3,FitBV:3,FitR:6}[value.get(1).decodeText()];if(value.size()!==count||context.lookup(value.get(0))!==undefined)return false;
 for(let i=2;i<value.size();i++){const n=value.get(i);if(n!==PDFNull&&(!(n instanceof PDFNumber)||!Number.isFinite(n.asNumber())||Math.abs(n.asNumber())>1e15))return false;}return true;
}
module.exports={danglingDestination};
