import layoutModel from '../desktop/document-layout-validation.cjs';
export const defaultDocumentLayout=layoutModel.defaultDocumentLayout;
export const documentLayout=layoutModel.validDocumentLayout;
export const documentPageMargins=layoutModel.documentPageMargins;
export const sideMargins=layoutModel.sideMargins;
export const documentPapers=layoutModel.documentPapers;
export const documentPaperSize=layoutModel.documentPaperSize;
export const documentPageFromTwips=layoutModel.documentPageFromTwips;
// Listed papers, then a custom size whose width and height are set in Page setup.
export const documentPaperOptions=()=>Object.entries(layoutModel.documentPapers).map(([value,paper])=>`<option value="${value}">${paper.label}</option>`).join('')+'<option value="custom">Custom size…</option>';
