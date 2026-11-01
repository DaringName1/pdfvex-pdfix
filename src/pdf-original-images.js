import {PDFDocument,PDFName,PDFDict,PDFRawStream,PDFNumber,PDFBool,PDFRef,PDFObjectCopier,pushGraphicsState,popGraphicsState,concatTransformationMatrix,drawObject} from 'pdf-lib';
import {imageDigest,supportedForm,replaceImagesOnPaths,assertImageCopyBudget} from './pdf-original-image-path.js';
const n=PDFName.of,MAX_NODES=20000,MAX_FORMS=1000,MAX_DEPTH=8;
const ordered=objects=>objects.entries().sort(([a],[b])=>a.decodeText()<b.decodeText()?-1:a.decodeText()>b.decodeText()?1:0);
function supportedImage(doc,stream){
  if(!(stream instanceof PDFRawStream)||stream.dict.lookupMaybe(n('Subtype'),PDFName)?.decodeText()!=='Image')return null;
  if(stream.dict.lookupMaybe(n('ImageMask'),PDFBool)?.asBoolean()||['F','FFilter','FDecodeParms','Mask','Alternates','OPI','OC'].some(key=>stream.dict.get(n(key))))throw new Error('Masked, external or alternate image artwork');
  const softMask=stream.dict.get(n('SMask'));if(softMask&&doc.context.lookup(softMask)?.toString()!=='/None')throw new Error('Image soft masks need a separate preservation adapter');const inData=stream.dict.lookupMaybe(n('SMaskInData'),PDFNumber);if(inData&&inData.asNumber()!==0)throw new Error('Embedded alpha mask');
  const width=stream.dict.lookup(n('Width'),PDFNumber).asNumber(),height=stream.dict.lookup(n('Height'),PDFNumber).asNumber();if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>8192||height>8192||width*height>16_000_000)throw new Error('Image dimensions exceed limits');return {width,height};
}
export async function originalImages(doc,sourceSha256){
  if(!/^[a-f0-9]{64}$/.test(sourceSha256??''))throw new Error('Original image paths need the exact source PDF identity.');const images=[];let limited=false,nodes=0,forms=0,formBytes=0;
  const visit=async(page,objects,resources,path,indices,active)=>{
    if(path.length>MAX_DEPTH||objects.entries().length>MAX_NODES)throw new Error('Nested image path limits');const pending=[];
    for(const [index,[name,ref]]of ordered(objects).entries()){
      if(++nodes>MAX_NODES)throw new Error('Image resource node limit');const label=name.decodeText();if(!label||label.length>200||/[\x00-\x1f\x7f]/.test(label))throw new Error('Unsupported image resource name');const nextPath=[...path,label],nextIndices=[...indices,index],stream=doc.context.lookup(ref);
      const dimensions=supportedImage(doc,stream);if(dimensions){if(!(ref instanceof PDFRef))throw new Error('Nested image streams need indirect identities');const identity=await imageDigest(new TextEncoder().encode(JSON.stringify({sourceSha256,page,path:nextPath,ref:ref.toString()})));pending.push({id:'pdfix-original-image-'+page+'-'+nextIndices[0]+'-n-'+identity,page,name:label,path:nextPath,width:dimensions.width,height:dimensions.height,ref,resources,nested:true});continue;}
      if(!(stream instanceof PDFRawStream)||stream.dict.lookupMaybe(n('Subtype'),PDFName)?.decodeText()!=='Form')continue;
      if(!(ref instanceof PDFRef)||active.has(stream))throw new Error('Direct or cyclic Form identity');if(++forms>MAX_FORMS||stream.contents.length>16*1024*1024||(formBytes+=stream.contents.length)>64*1024*1024)throw new Error('Form copy budget');const nested=supportedForm(doc,stream);if(!nested.objects)continue;const nextActive=new Set(active);nextActive.add(stream);pending.push(...await visit(page,nested.objects,nested.resources,nextPath,nextIndices,nextActive));if(pending.length>2000)throw new Error('Nested image count limit');
    }return pending;
  };
  for(let page=0;page<doc.getPageCount();page++){
    let resources,objects;try{resources=doc.getPage(page).node.Resources();objects=resources?.lookupMaybe(n('XObject'),PDFDict);}catch{limited=true;continue;}if(!objects)continue;if(objects.entries().length>MAX_NODES){limited=true;continue;}
    for(const [index,[name,ref]]of ordered(objects).entries()){
      if(images.length>=2000||nodes>=MAX_NODES){limited=true;break;}nodes++;try{if(!name.decodeText()||name.decodeText().length>200||/[\x00-\x1f\x7f]/.test(name.decodeText()))throw new Error('Unsupported root resource name');const stream=doc.context.lookup(ref),dimensions=supportedImage(doc,stream);if(dimensions){if(!(ref instanceof PDFRef))throw new Error('Direct image stream identity');images.push({id:'pdfix-original-image-'+page+'-'+index,page,name:name.decodeText(),path:[name.decodeText()],width:dimensions.width,height:dimensions.height,ref,resources,nested:false});continue;}
        if(!(stream instanceof PDFRawStream)||stream.dict.lookupMaybe(n('Subtype'),PDFName)?.decodeText()!=='Form')continue;if(!(ref instanceof PDFRef))throw new Error('Direct Form identity');if(++forms>MAX_FORMS||stream.contents.length>16*1024*1024||(formBytes+=stream.contents.length)>64*1024*1024)throw new Error('Form copy budget');const form=supportedForm(doc,stream);if(!form.objects)continue;
        const nested=await visit(page,form.objects,form.resources,[name.decodeText()],[index],new Set([stream]));if(images.length+nested.length>2000)throw new Error('Image count limit');images.push(...nested);
      }catch{limited=true;}
    }
  }return {images,limited};
}
export const replaceOriginalImages=replaceImagesOnPaths;
export async function originalImagePreview(doc,id,sourceSha256){
  const image=(await originalImages(doc,sourceSha256)).images.find(item=>item.id===id);if(!image)throw new Error('This original image resource path is unsupported.');const colors=image.resources?.lookupMaybe(n('ColorSpace'),PDFDict);assertImageCopyBudget(doc,[image.ref,...(colors?[colors]:[])]);const preview=await PDFDocument.create(),copier=PDFObjectCopier.for(doc.context,preview.context),copy=copier.copy(image.ref),ref=copy instanceof PDFRawStream?preview.context.register(copy):copy,scale=Math.min(400/image.width,300/image.height),width=image.width*scale,height=image.height*scale,page=preview.addPage([width,height]),resources=preview.context.obj({XObject:{Original:ref}});
  if(colors)resources.set(n('ColorSpace'),copier.copy(colors));page.node.set(n('Resources'),resources);page.pushOperators(pushGraphicsState(),concatTransformationMatrix(width,0,0,height,0,0),drawObject('Original'),popGraphicsState());const bytes=await preview.save();if(bytes.length>32*1024*1024)throw new Error('This original image is too large for its thumbnail. Review it on the full page.');return {bytes,width,height,path:[...image.path],sourceSha256};
}
