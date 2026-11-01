export function thinLineDraft(report,selection,widthPt){
 if(!report||!Array.isArray(report.strokes)||!Number.isFinite(widthPt)||widthPt<.01||widthPt>20)throw new Error('Choose a replacement minimum from 0.01 to 20 physical points.');
 const ids=new Set(selection);if(!ids.size||ids.size>200)throw new Error('Select 1–200 supported thin strokes.');const changes=[];
 for(const id of ids){const row=report.strokes.find(s=>s.id===id);if(!row?.repairable||!(widthPt>row.minimumPt))throw new Error('Every selected stroke must support repair and increase in minimum width.');changes.push({id,widthPt});}
 return {version:1,inspectionSha256:report.inspectionSha256,thresholdPt:report.thresholdPt,changes};
}
export function thinLineWidth(row){return row.hairline?'Hairline · device-dependent width':row.minimumPt===null?'Unresolved transform':Math.abs(row.minimumPt-row.maximumPt)<1e-7?row.minimumPt.toFixed(4)+' pt':row.minimumPt.toFixed(4)+'–'+row.maximumPt.toFixed(4)+' pt (directional bounds)';}
