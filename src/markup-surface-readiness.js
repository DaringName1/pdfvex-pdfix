// Keep drawing tied to a completed viewport, including the gap before ResizeObserver runs.
export function markupSurfaceReady(reader,viewport){
 if(!reader?.paper||reader.paper.dataset.ready!=='true'||!viewport||!(viewport.width>0&&viewport.height>0))return false;
 if(!reader.fit)return true;const stage=reader.stage;if(!stage||stage.clientWidth!==reader.lastStageWidth)return false;return !reader.fitPage||stage.clientHeight===reader.lastStageHeight;
}
export function sameMarkupViewport(a,b){return !!a&&!!b&&Math.abs(a.width-b.width)<.001&&Math.abs(a.height-b.height)<.001&&Array.isArray(a.transform)&&Array.isArray(b.transform)&&a.transform.length===6&&b.transform.length===6&&a.transform.every((v,i)=>Math.abs(v-b.transform[i])<.000001);}
