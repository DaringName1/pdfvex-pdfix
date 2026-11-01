// The picture rules live in one place, shared with the main process and the contained engine.
import imageModel from '../desktop/document-image-validation.cjs';
export const {DOCUMENT_IMAGE_LIMIT,SOURCE_TYPES,rasterHeader,sourceHeader,imageDataBytes,pngDataBytes,validateDocumentImage,validateDocumentImages}=imageModel;
