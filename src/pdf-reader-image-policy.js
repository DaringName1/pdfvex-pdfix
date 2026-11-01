// Input decoding and output canvas are separate budgets (owner, October 22).
export const READER_IMAGE_PIXELS=100_000_000;
export const READER_CANVAS_PIXELS=16_000_000;
export const SCAN_MEMORY_MESSAGE='This scan could not be displayed with the available memory. Your original is unchanged.';
export const readerImageOptions=()=>({maxImageSize:READER_IMAGE_PIXELS,canvasMaxAreaInBytes:READER_CANVAS_PIXELS*4,stopAtErrors:true});
export function readerCanvasContext(canvas){const context=canvas.getContext('2d');if(!context)throw new Error('PDFIX_IMAGE_DECODE_FAILED');return context;}
export function isImageMemoryFailure(error){return /PDFIX_IMAGE_DECODE_FAILED|Image exceeded maximum allowed size|out of memory|allocation failed|invalid (?:array buffer|typed array) length|cannot allocate|array buffer allocation|canvas.*(?:memory|size)|NS_ERROR_FAILURE/i.test(String(error?.message||error));}
