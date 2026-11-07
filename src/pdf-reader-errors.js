import {isImageMemoryFailure,SCAN_MEMORY_MESSAGE} from './pdf-reader-image-policy.js';
export function readerErrorDetail(error){
 if(isImageMemoryFailure(error))return SCAN_MEMORY_MESSAGE;
 const detail=String(error?.message||'The PDF viewer could not finish.').replace(/[\x00-\x1f]/g,' ').slice(0,400);
 if(detail.includes('PDFIX_SAMPLED_SHADING_LIMIT'))return 'This PDF uses a drawing effect that PDFVEX cannot display. Your original is unchanged.';
 if(/^Invalid page request\.?$/i.test(detail))return 'No readable page was found at this position. Try getting a new copy. Your original is unchanged.';
 if(/unknown encryption method|unsupported (?:encryption|security handler)/i.test(detail))return 'This PDF uses password protection PDFix cannot open yet. Try an unlocked copy from the app that created it.';
 if(/pages? tree.*circular|circular.*pages? tree/i.test(detail))return 'This PDF has a damaged page list. Try Repair PDF to a copy, or get a new copy.';
 if(error?.name==='MissingPDFException')return 'The PDF is no longer available. Find the file and open it again.';
 if(error?.name==='UnexpectedResponseException')return 'The PDF could not be read. Try opening a local copy again.';
 if(['UnknownErrorException','TypeError','ReferenceError','FormatError','InvalidPDFException','XRefParseException'].includes(error?.name)||/invalid PDF structure|invalid XRef|bad XRef|failed to fetch.*worker|setting up fake worker|wasm.*(?:failed|error)/i.test(detail))return 'This PDF could not be displayed. Try Repair PDF to a copy, or get a new copy.';
 return detail;
}
