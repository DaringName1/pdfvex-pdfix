export function scanBlankMetrics(image,{tolerance='strict'}={}){
 if(!image||!Number.isInteger(image.width)||!Number.isInteger(image.height)||image.width<1||image.height<1||image.width*image.height>1_000_000||image.data?.length!==image.width*image.height*4||!['strict','faint'].includes(tolerance))throw new Error('Use a bounded full-page scan sample and a supported tolerance.');
 const pixels=image.width*image.height;let sum=0,dark=0,faint=0,minimum=255,edgeMarks=0,edgePixels=0;
 for(let index=0;index<pixels;index++){const offset=index*4,alpha=image.data[offset+3]/255,luminance=(image.data[offset]*.2126+image.data[offset+1]*.7152+image.data[offset+2]*.0722)*alpha+255*(1-alpha);sum+=luminance;minimum=Math.min(minimum,luminance);if(luminance<225)dark++;else if(luminance<250)faint++;const x=index%image.width,y=Math.floor(index/image.width);if(x<image.width*.03||x>=image.width*.97||y<image.height*.03||y>=image.height*.97){edgePixels++;if(luminance<250)edgeMarks++;}}
 const mean=sum/pixels,darkRatio=dark/pixels,faintRatio=faint/pixels,edgeRatio=edgeMarks/Math.max(1,edgePixels),candidate=tolerance==='strict'?mean>=254.5&&dark===0&&faintRatio<=.0005:mean>=252&&darkRatio<=.00005&&faintRatio<=.003,uncertain=dark>0||faint>0||mean<254.5;
 return {pixels,mean,darkPixels:dark,faintPixels:faint,darkRatio,faintRatio,edgeRatio,minimum,candidate,uncertain};
}
export function hasHiddenCrop(geometry){
 if(!geometry?.media||!geometry?.crop)return true;const keys=['x','y','width','height'];if(keys.some(key=>!Number.isFinite(geometry.media[key])||!Number.isFinite(geometry.crop[key])))return true;return keys.some(key=>Math.abs(geometry.media[key]-geometry.crop[key])>.01);
}
