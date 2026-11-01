import {reviewInkErasure} from './markup-ink-eraser.js';
import {imageFileOutput} from './image-file-output.js';
import {normalizeImage} from './image-codec.js';
import {imagePdf,imagePagesPdf} from './image-output.js';
import { inspectPdf, organizePdf, splitPdf } from './pdf-operations.js';
import {splitPdfBySize} from './pdf-size-split.js';
import { searchablePdf } from './ocr-output.js';
import { inspectMarkupPdf, markedPdf } from './markup-output.js';
import {inspectRedactionSource} from './redaction-output.js';
import {inspectContentPdf,contentPdf,previewOriginalImage} from './pdf-content-output.js';
self.onmessage=async({data})=>{
  try{
    const progress=progress=>self.postMessage({kind:'progress',progress});
    const value=data.action==='markup-erase-review'?reviewInkErasure(data.marks,data.page,data.trail,data.radius,data.pages):data.action==='image-file'?await imageFileOutput(data.image,data.settings,data.ext,data.quality):data.action==='image-pages-pdf'?await imagePagesPdf(data.images,data.pages,progress):data.action==='original-image-preview'?await previewOriginalImage(data.bytes,data.id):data.action==='content-inspect'?await inspectContentPdf(data.bytes):data.action==='content'?await contentPdf(data.bytes,data.draft,progress):data.action==='redaction-inspect'?await inspectRedactionSource(data.bytes):data.action==='split-size'?await splitPdfBySize(data.sources,data.plan,data.maximumBytes,progress):data.action==='split'?await splitPdf(data.sources,data.plan,data.groups,progress):data.action==='image-inspect'?await normalizeImage(data.bytes,data.ext):data.action==='image-pdf'?await imagePdf(data.image,data.settings):data.action==='inspect'?await inspectPdf(data.bytes):data.action==='ocr'?await searchablePdf(data.bytes,data.recognized,progress):data.action==='markup-inspect'?await inspectMarkupPdf(data.bytes):data.action==='markup'?await markedPdf(data.bytes,data.marks,data.flatten,progress):data.action==='organize'?await organizePdf(data.sources,data.plan,progress):(()=>{throw new Error('Unknown PDF operation.');})();
    self.postMessage({kind:'result',value},value.bytes?[value.bytes.buffer]:value.parts?.map(p=>p.bytes.buffer)??[]);
  }catch(error){self.postMessage({kind:'error',message:error.message});}
};
