import {reviewablePdfUrl} from './pdf-link-review.js';

const MAX_PAGES=500,MAX_ISSUES=1000,MAX_LINKS=4000,MAX_DESTINATIONS=1000;
const literal=value=>String(value??'').replace(/[\p{Cc}\p{Cf}\p{Cs}]/gu,char=>'\\u'+char.charCodeAt(0).toString(16).padStart(4,'0')).slice(0,400);

// Reader observations only: no URL fetches, image decoding, repair or safety verdict.
export async function inspectPdfHealth({doc,copyAllowed,geometry,read,check,onProgress,report}){
  const started=performance.now(),destinations=new Map(),groups=new Map();
  if(!Number.isInteger(doc.numPages)||doc.numPages<1||doc.numPages>MAX_PAGES)throw new Error('Health inspection supports up to 500 physical pages.');
  Object.assign(report,{version:1,state:'running',checkedPages:0,totalPages:doc.numPages,issues:[],omittedIssues:0,counts:{geometryRead:0,textRead:0,pagesWithoutText:0,links:0,internalLinksResolved:0,webAddressesRecognized:0,pagesWithStructure:0,structureRead:0,formFields:0},sizeGroups:[],scope:'Opened-snapshot reader observations: visible geometry, permitted selectable text, link destinations, tag presence and declared form labels. A completed inspection is not a healthy-document verdict.',notChecked:['Embedded or missing font programs, font rendering and shaping','Image pixel dimensions, image size or compression quality','External website availability; websites are never contacted','Tag correctness, reading order, headings, contrast or accessibility compliance','Certificate signature validity, malware or effective OS isolation','MediaBox/TrimBox/BleedBox prepress validation or physical-printer compatibility'],limits:[]});
  const issue=(page,code,message)=>{if(report.issues.length<MAX_ISSUES)report.issues.push({page,code,message:literal(message)});else report.omittedIssues++;};
  const alive=()=>{check();if(performance.now()-started>120000)throw new Error('The health inspection exceeded its 120-second reading budget.');};
  const destination=async raw=>{
    if(typeof raw==='string'&&(raw.length>1024||/[\p{Cc}\p{Cf}\p{Cs}]/u.test(raw)))return false;
    const key=typeof raw==='string'?'name:'+raw:null;
    if(key&&destinations.has(key))return destinations.get(key);
    if(destinations.size>=MAX_DESTINATIONS)throw new Error('The named-destination lookup budget was reached.');
    if(key)destinations.set(key,false);
    let value;
    try{
      const dest=typeof raw==='string'?await read(doc.getDestination(raw)):raw;alive();
      if(!Array.isArray(dest)||dest.length<2||dest.length>10)return false;
      const first=dest[0];let index;
      if(Number.isInteger(first))index=first;
      else if(first&&Number.isSafeInteger(first.num)&&first.num>0&&first.num<=2147483647&&Number.isInteger(first.gen)&&first.gen>=0&&first.gen<=65535)index=await read(doc.getPageIndex(first));
      alive();value=Number.isInteger(index)&&index>=0&&index<doc.numPages;
    }catch(error){alive();value=false;}
    if(key)destinations.set(key,value);return value;
  };
  try{
    for(let number=1;number<=doc.numPages;number++){
      alive();const page=await read(doc.getPage(number));alive();
      try{
        const value=geometry(page),key=value.savedDisplayWidthPoints.toFixed(1)+'x'+value.savedDisplayHeightPoints.toFixed(1);
        const group=groups.get(key)||{widthPoints:value.savedDisplayWidthPoints,heightPoints:value.savedDisplayHeightPoints,count:0,firstPage:number};group.count++;groups.set(key,group);report.counts.geometryRead++;
        if(value.userUnit!==1)issue(number,'nonstandard-page-unit','Page uses UserUnit '+value.userUnit+'; physical dimensions include that scaling.');
        if(value.savedPageRotation)issue(number,'saved-rotation','Saved page rotation is '+value.savedPageRotation+' degrees.');
        if(value.widthPoints>14400||value.heightPoints>14400)issue(number,'large-visible-page','Visible page exceeds 200 inches in at least one direction. Review the intended printer and page scale.');
      }catch(error){issue(number,'geometry-unavailable',error.message);}
      if(copyAllowed){
        const stream=page.streamTextContent(),reader=stream.getReader();let items=0,characters=0,replacement=false,missingStyle=false;const fonts=new Set(),styles=new Set();
        try{
          for(;;){alive();const chunk=await read(reader.read());alive();if(chunk.done)break;
            const value=chunk.value;if(!Array.isArray(value?.items)||!value.styles||typeof value.styles!=='object')throw new Error('Unsupported streamed text data.');
            const names=Object.keys(value.styles);if(names.length+styles.size>2000)throw new Error('Page text style budget exceeded.');for(const name of names)styles.add(name);
            for(const item of value.items){if(typeof item?.str!=='string')continue;items++;characters+=item.str.length;
              if(items>20000||characters>200000)throw new Error('Page text exceeds 20,000 items or 200,000 characters.');
              if(item.str.includes('\uFFFD'))replacement=true;
              if(typeof item.fontName==='string')fonts.add(item.fontName);else if(item.str.trim())missingStyle=true;
              if(item.transform&&!Array.isArray(item.transform)||Array.isArray(item.transform)&&(item.transform.length!==6||!item.transform.every(Number.isFinite)))throw new Error('Unsupported text positioning.');
            }
          }
          report.counts.textRead++;if(!characters){report.counts.pagesWithoutText++;issue(number,'no-selectable-text','No selectable text found. This alone cannot distinguish a scan, blank page or drawing.');}
          if(replacement)issue(number,'replacement-characters','Selectable text contains replacement characters; review copied text and search results.');
          if(missingStyle||[...fonts].some(name=>!styles.has(name)))issue(number,'text-font-metadata','Some selectable text has no matching reader font metadata. Embedded font availability was not checked.');
        }catch(error){alive();issue(number,'text-incomplete',error.message);}
        finally{try{await read(reader.cancel().catch(()=>{}));}finally{reader.releaseLock();}}
      }
      try{
        alive();const annotations=await read(page.getAnnotations({intent:'display'}));alive();if(!Array.isArray(annotations)||annotations.length>5000)throw new Error('Page annotations exceed the 5,000-item budget.');
        let unresolved=0,unsupported=0,unlabeled=0;
        for(const annotation of annotations){alive();
          if(annotation?.subtype==='Widget'){report.counts.formFields++;if(!String(annotation.alternativeText??'').trim())unlabeled++;}
          if(annotation?.subtype!=='Link')continue;if(++report.counts.links>MAX_LINKS)throw new Error('Document links exceed the 4,000-link budget.');
          if(annotation.actions||annotation.action||annotation.attachment||annotation.attachmentId||annotation.setOCGState||annotation.resetForm){unsupported++;continue;}
          if(annotation.dest!==undefined&&annotation.dest!==null){if(await destination(annotation.dest))report.counts.internalLinksResolved++;else unresolved++;}
          else {const address=typeof annotation.unsafeUrl==='string'?annotation.unsafeUrl:annotation.url;if(reviewablePdfUrl(address).ok)report.counts.webAddressesRecognized++;else unsupported++;}
        }
        if(unresolved)issue(number,'unresolved-internal-link',unresolved+' internal link destinations could not be resolved to an existing page. They may be broken or unsupported.');
        if(unsupported)issue(number,'unsupported-link-action',unsupported+' link actions or addresses are outside this reader inspection. No action was run.');
        if(unlabeled)issue(number,'form-alternative-label',unlabeled+' form widgets have no reader-reported alternative label. Other visible labels may exist; accessibility was not validated.');
      }catch(error){alive();issue(number,'links-incomplete',error.message);}
      try{alive();const tree=await read(page.getStructTree());alive();report.counts.structureRead++;if(tree)report.counts.pagesWithStructure++;}
      catch(error){alive();issue(number,'structure-incomplete',error.message);}
      report.checkedPages=number;report.sizeGroups=[...groups.values()];onProgress(number,doc.numPages);
    }
    report.state='complete';
    if(groups.size>1)issue(null,'mixed-visible-sizes',groups.size+' visible size/orientation groups found, rounded to 0.1 point. Check print scaling for mixed drawings.');
    if(report.counts.structureRead===doc.numPages&&report.counts.pagesWithStructure===0)issue(null,'no-page-structure','No page structure trees were reported. Searchable text and OCR do not establish accessible tagging.');
    if(!copyAllowed)report.limits.push('Text inspection was skipped because copying permission is restricted or unknown.');
  }catch(error){report.state='incomplete';report.limits.push(literal(error.message));throw error;}
  finally{report.sizeGroups=[...groups.values()];report.finishedAt=new Date().toISOString();}
  return report;
}
