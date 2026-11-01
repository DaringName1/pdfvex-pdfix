// Fixed contained child only. No runtime/native paths are provided by the document.
const {preservingPdf:P}=require('./pdf-review-edit-codec.cjs');
const {hash}=require('./pdf-page-order-validation.cjs');
async function inspectWorkflowSource(bytes){const doc=await P.load(bytes),pageCount=doc.getPageCount();if(!Number.isInteger(pageCount)||pageCount<1||pageCount>500)throw new Error('Workflow definitions require a supported PDF with 1–500 pages.');return {sourceSha256:hash(bytes),pageCount};}
module.exports={inspectWorkflowSource};
