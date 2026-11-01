// PDF.js 6.3.289 can complete an empty/partial operator list before rejecting
// its stream error, and paint a failed image as blank. Guard those two paths
// in the build output only. Never edit node_modules or alter decoder limits.
import fs from 'node:fs/promises';

// An unresolved named marked-content property has no usable visibility rule.
// PDF.js already displays content whose layer is unknown. Do the same for this
// missing dictionary, instead of dereferencing undefined. Defined OCG/OCMD rules
// and all image/stream errors still take their original paths.
export function guardPdfjsOptionalContent(source){
 const text=source.replace(/\r\n/g,'\n');
 const named='    const properties = resources.get("Properties");\n    optionalContent = properties.get(contentProperties.name);';
 const type='  const optionalContentType = optionalContent.get("Type")?.name;';
 for(const target of [named,type])if(text.split(target).length!==2)throw new Error('PDF.js layer guard no longer matches the reviewed worker. Review before building.');
 return text.replace(named,'    const properties = resources.get("Properties");\n    if (properties === undefined || properties === null) { warn("Layer properties are missing; showing marked content."); return null; }\n    optionalContent = properties.get(contentProperties.name);').replace(type,'  if (optionalContent === undefined || optionalContent === null) { warn("Named layer properties are missing; showing marked content."); return null; }\n'+type);
}
export function guardPdfjsErrors(source) {
  const stream = '        if (intentState.operatorList) {\n          intentState.operatorList.lastChunk = true;';
  const missing = '      warn("Dependent image isn\'t ready yet");\n      return;';
  const renderState='    const intentState = this._intentStates.getOrInsertComputed(cacheKey, makeObj);';
  const normalized=source.replace(/\r\n/g,'\n');
  for (const [text,count] of [[stream,1],[missing,2],[renderState,1]]) if(normalized.split(text).length!==count+1) throw new Error('PDF.js error guard no longer matches the reviewed reader. Review before building.');
  return normalized.replace(stream,`        // Reject before notifying completion: otherwise lastChunk resolves first.
        intentState.pdfixFailure = reason;
        intentState.opListReadCapability?.reject(reason);
        for (const renderTask of intentState.renderTasks || []) {
          renderTask.cancel?.(reason);
        }
${stream}`).replaceAll(missing,'      throw new Error("PDFIX_IMAGE_DECODE_FAILED");').replace(renderState,renderState+'\n    if (intentState.pdfixFailure) throw intentState.pdfixFailure;');
}
export function pdfjsFailClosedPlugin(){return {name:'pdfix-pdfjs-fail-closed',enforce:'pre',async load(id){if(/\/pdfjs-dist\/(?:legacy\/)?build\/pdf\.worker\.mjs\?url$/.test(id.replaceAll('\\','/'))){const source=guardPdfjsOptionalContent(await fs.readFile(id.slice(0,-4),'utf8')),ref=this.emitFile({type:'asset',name:'pdf.worker.mjs',source});return 'export default import.meta.ROLLUP_FILE_URL_'+ref+';';}},transform(code,id){if(/\/pdfjs-dist\/(?:legacy\/)?build\/pdf\.mjs$/.test(id.replaceAll('\\','/')))return {code:guardPdfjsErrors(code),map:null};}};}
