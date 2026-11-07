// PDF.js 6.3.289 can complete an empty/partial operator list before rejecting
// its stream error, and paint a failed image as blank. Guard those two paths
// in the build output only. Never edit node_modules or alter decoder limits.
import fs from 'node:fs/promises';

// Backport Mozilla PR 22365 (2d4949c1e7c912b3de286e009bc7c6cd742d63a3),
// Apache-2.0. The pinned 6.3.289 worker lacks these lexer progress checks.
export function guardPdfjsPostscriptProgress(source){
 const text=source.replace(/\r\n/g,'\n');
 const number='    const match = this._numberPattern.exec(this.data);\n    if (!match) {\n      return new Token(TOKEN.number, 0);\n    }\n    const number = parseFloat(match[0]);\n    if (!Number.isFinite(number)) {\n      return new Token(TOKEN.number, 0);\n    }\n    this.pos = this._numberPattern.lastIndex;\n    return new Token(TOKEN.number, number);';
 const operator='    const match = this._identifierPattern.exec(this.data);\n    if (!match) {\n      return new Token(TOKEN.number, 0);';
 for(const target of [number,operator])if(text.split(target).length!==2)throw new Error('PDF.js PostScript guard no longer matches the reviewed worker. Review before building.');
 return text.replace(number,'    const match = this._numberPattern.exec(this.data);\n    if (!match) {\n      this.pos++;\n      return new Token(TOKEN.number, 0);\n    }\n    const number = parseFloat(match[0]);\n    this.pos = this._numberPattern.lastIndex;\n    return new Token(TOKEN.number, Number.isFinite(number) ? number : 0);').replace(operator,'    const match = this._identifierPattern.exec(this.data);\n    if (!match) {\n      this.pos++;\n      return new Token(TOKEN.number, 0);');
}

export function guardPdfjsWorkerIsolation(source){
 const text=source.replace(/\r\n/g,'\n'),fallback='  #setupFakeWorker() {',cleanup='      await this._setupCapability.promise;\n      await this._transport?.destroy();';
 for(const target of [fallback,cleanup])if(text.split(target).length!==2)throw new Error('PDF.js worker isolation no longer matches the reviewed reader. Review before building.');
 return text.replace(fallback,fallback+'\n    if (!isNodeJS) { this.#capability.reject(new Error("The separate PDF reader could not start. Close this PDF and try again.")); return; }').replace(cleanup,`      let pdfixDestroyTimer;
      try {
        await Promise.race([
          (async () => { await this._setupCapability.promise; await this._transport?.destroy(); })(),
          new Promise(resolve => { pdfixDestroyTimer = setTimeout(() => { this._worker?.destroy(); this._transport?.messageHandler?.destroy(); resolve(); }, 2000); })
        ]);
      } finally { clearTimeout(pdfixDestroyTimer); }`);
}

// Backport overlapping tile folding from PDF.js v6.5.438 (Apache-2.0).
// The old canvas loop can exceed Number.MAX_SAFE_INTEGER on the UI thread.
export function guardPdfjsPatternWork(source){
  const text=source.replace(/\r\n/g,'\n');
  const steps='    xstep = Math.abs(xstep);\n    ystep = Math.abs(ystep);';
  const drawing=`      const ii = redrawHorizontally ? Math.floor(width / xstep) : 0;
      const jj = redrawVertically ? Math.floor(height / ystep) : 0;
      for (let i = 0; i <= ii; i++) {
        for (let j = 0; j <= jj; j++) {
          tmpCtx2.drawImage(image, xSize * i, ySize * j, xSize, ySize, 0, 0, xSize, ySize);
        }
      }`;
  for(const target of [steps,drawing]){
    if(text.split(target).length!==2)throw new Error('PDF.js tile guard no longer matches the reviewed reader. Review before building.');
  }
  return text.replace(steps,steps+`
    if (!Number.isFinite(xstep) || !Number.isFinite(ystep) || xstep === 0 || ystep === 0) {
      throw new Error("This PDF has a drawing pattern that cannot be shown.");
    }`).replace(drawing,`
      // Offsets beyond the rasterized tile contribute no pixels.
      const ii = redrawHorizontally ? Math.min(Math.floor(width / xstep), Math.ceil(image.width / xSize)) : 0;
      const jj = redrawVertically ? Math.min(Math.floor(height / ystep), Math.ceil(image.height / ySize)) : 0;
      let rowSource = image;
      let bandCanvas = null;
      if (redrawVertically) {
        bandCanvas = owner.canvasFactory.create(image.width, ySize);
        for (let j = jj; j >= 0; j--) {
          bandCanvas.context.drawImage(image, 0, ySize * j, image.width, ySize, 0, 0, image.width, ySize);
        }
        rowSource = bandCanvas.canvas;
      }
      for (let i = ii; i >= 0; i--) {
        tmpCtx2.drawImage(rowSource, xSize * i, 0, xSize, ySize, 0, 0, xSize, ySize);
      }
      if (bandCanvas) owner.canvasFactory.destroy(bandCanvas);`);
}

// The pinned worker allocates 2^inputs samples per interpolation. Upstream
// moved larger functions to a different algorithm. This backport fails closed
// for that unsupported case instead of showing a blank or dummy shading.
export function guardPdfjsSampledShading(source){
  const text=source.replace(/\r\n/g,'\n');
  const dimensions='    const inputSize = domain.length / 2;\n    const outputSize = range.length / 2;\n    const size = toNumberArray(dict.getArray("Size"));';
  const recoveries=[
    ['      if (ex instanceof MissingDataException) {\n        throw ex;\n      }\n      warn(ex);\n      return new DummyShading();','ex'],
    ['      if (this.options.ignoreErrors) {\n        warn(`parseShading - ignoring shading:', 'reason'],
    ['      if (this.options.ignoreErrors) {\n        warn(`getOperatorList - ignoring errors during', 'reason'],
  ];
  for(const target of [dimensions,...recoveries.map(([target])=>target)]){
    if(text.split(target).length!==2)throw new Error('PDF.js shading guard no longer matches the reviewed worker. Review before building.');
  }
  let guarded=text.replace(dimensions,dimensions+`
    if (!Number.isInteger(inputSize) || inputSize < 1 || inputSize > 8) {
      throw new FormatError("PDFIX_SAMPLED_SHADING_LIMIT");
    }`);
  for(const [target,error] of recoveries){
    guarded=guarded.replace(target,`      if (${error}?.message === "PDFIX_SAMPLED_SHADING_LIMIT") throw ${error};\n`+target);
  }
  return guarded;
}

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
export function pdfjsFailClosedPlugin(){return {name:'pdfix-pdfjs-fail-closed',enforce:'pre',async load(id){if(/\/pdfjs-dist\/(?:legacy\/)?build\/pdf\.worker\.mjs\?url$/.test(id.replaceAll('\\','/'))){const source=guardPdfjsSampledShading(guardPdfjsPostscriptProgress(guardPdfjsOptionalContent(await fs.readFile(id.slice(0,-4),'utf8')))),ref=this.emitFile({type:'asset',name:'pdf.worker.mjs',source});return 'export default import.meta.ROLLUP_FILE_URL_'+ref+';';}},transform(code,id){if(/\/pdfjs-dist\/(?:legacy\/)?build\/pdf\.mjs$/.test(id.replaceAll('\\','/')))return {code:guardPdfjsPatternWork(guardPdfjsWorkerIsolation(guardPdfjsErrors(code))),map:null};}};}
