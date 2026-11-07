import {UnexpectedObjectTypeError,CorruptPageTreeError,PDFParsingError,PDFArrayIsNotRectangleError,MissingCatalogError} from 'pdf-lib';

export const damagedPdfMessage="This PDF's internal structure is damaged, so this tool can't change it. Your original is unchanged.";
// Only parser/structure failures are translated. Keep permission refusals,
// validation failures and independently verified output failures specific.
export async function withPdfStructureErrors(operation){
  try{return await operation();}catch(error){
    // pdf-lib's CommonJS ES5 build returns plain Error instances for its custom
    // errors. These exact parser messages also cover minified constructor names.
    const parserMessage=error instanceof Error&&(
      /^Expected instance of .+, but got instance of .+$/.test(error.message)||
      /^Attempted to convert PDFArray with \d+ elements to rectangle, but must have exactly 4 elements\.$/.test(error.message)||
      /^`ref` must be of type `PDFRef`, but was actually of type `[^\r\n]+`$/.test(error.message)||
      error instanceof RangeError&&error.message==='Maximum call stack size exceeded'
    );
    if(parserMessage||error instanceof UnexpectedObjectTypeError||error instanceof CorruptPageTreeError||error instanceof PDFParsingError||error instanceof PDFArrayIsNotRectangleError||error instanceof MissingCatalogError||error instanceof TypeError&&(/\b(?:Pages|traverse|ascend)\b.*is not a function/.test(error.message)||/Cannot read properties of (?:undefined|null) \(reading '(?:Pages|Kids|Parent)'\)/.test(error.message))){
      throw new Error(damagedPdfMessage,{cause:error});
    }
    throw error;
  }
}
