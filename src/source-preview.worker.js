import {parseCsv,parseMarkdown} from './source-preview-codec.js';
self.onmessage=({data})=>{try{self.postMessage({value:data.kind==='csv'?parseCsv(data.text,data.delimiter):parseMarkdown(data.text)});}catch(error){self.postMessage({error:error.message});}};
