const {validDocumentBand,documentBandHeight,sideMargins}=require('./document-band-model.cjs');
const defaultDocumentLayout=(source=false)=>({paper:'a4',landscape:false,margin:20,font:source?'mono':'sans',size:12,lineHeight:1.5,pageNumbers:true,headerText:'',footerText:'',headerAlign:'left',footerAlign:'left',pageNumberPlacement:'footer',pageNumberAlign:'center',headerBand:null,footerBand:null});
// Portrait width/height in millimetres. Every writer and preview reads paper geometry from here.
const documentPapers={a4:{label:'A4',size:[210,297]},letter:{label:'Letter',size:[215.9,279.4]},legal:{label:'Legal',size:[215.9,355.6]},a3:{label:'A3',size:[297,420]},a5:{label:'A5',size:[148,210]},tabloid:{label:'Tabloid',size:[279.4,431.8]}};
// A custom paper is width x height in millimetres (portrait as entered), each 50 to 600.
const validCustomSize=size=>Array.isArray(size)&&size.length===2&&size.every(value=>Number.isFinite(value)&&value>=50&&value<=600);
function documentPaperSize(layout){if(layout?.paper==='custom'&&validCustomSize(layout.customSize)){const size=[...layout.customSize];if(layout.landscape)size.reverse();return size;}const paper=Object.hasOwn(documentPapers,layout?.paper)?documentPapers[layout.paper]:documentPapers.a4,size=[...paper.size];if(layout?.landscape)size.reverse();return size;}
// Shared by the DOCX and RTF importers. A declared page becomes its listed paper, or a custom paper when it is 50 to
// 600 mm. Margins inside 5 to 50 mm become the single margin when left and right are equal, separate margins when
// they differ (and all four are in range).
function documentPageFromTwips(width,height,left,right,top,bottom){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)return null;
 const twips=mm=>Math.round(mm*1440/25.4),short=Math.min(width,height),long=Math.max(width,height),paper=Object.keys(documentPapers).find(key=>Math.abs(twips(documentPapers[key].size[0])-short)<=30&&Math.abs(twips(documentPapers[key].size[1])-long)<=30);
 const toMm=value=>Math.round(value/1440*25.4*10)/10,customSize=[toMm(short),toMm(long)];
 if(!paper&&!validCustomSize(customSize))return null;const page={paper:paper??'custom',...(paper?{}:{customSize}),landscape:width>height,margin:20};let margins='missing';
 const sides=[top,right,bottom,left],inRange=value=>Number.isInteger(value)&&value>0&&value/1440*25.4>=5&&value/1440*25.4<=50;
 if(Number.isInteger(left)&&Number.isInteger(right)&&left>0&&right>0){const mm=Math.round((left+right)/2/1440*25.4);
  // Top and bottom alone are not a signal: PDFix and Word both widen them for header/footer bands.
  if(sides.every(inRange)&&Math.abs(left-right)>30){page.margin=Math.min(50,Math.max(5,mm));page.sides={top:Math.round(top/1440*25.4),right:Math.round(right/1440*25.4),bottom:Math.round(bottom/1440*25.4),left:Math.round(left/1440*25.4)};margins='imported';}
  else if(Math.abs(left-right)>30||mm<5||mm>50)margins='unsupported';else{page.margin=mm;margins='imported';}}
 return {page,margins};
}
function validDocumentPage(page){const keys=page&&Object.getPrototypeOf(page)===Object.prototype?Object.keys(page):[];if(!['landscape','margin','paper'].every(key=>keys.includes(key))||keys.some(key=>!['landscape','margin','paper','customSize','sides'].includes(key))||typeof page.landscape!=='boolean'||!Number.isInteger(page.margin)||page.margin<5||page.margin>50)throw new Error('Invalid imported page setup.');try{validDocumentLayout({...defaultDocumentLayout(),...page});}catch{throw new Error('Invalid imported page setup.');}return page;}
const fields=['paper','landscape','margin','font','size','lineHeight','pageNumbers','headerText','footerText','headerAlign','footerAlign','pageNumberPlacement','pageNumberAlign','headerBand','footerBand','sides','customSize'];
const SIDES=['bottom','left','right','top'];
// Separate margins are optional: absent or null means the single margin applies to every side.
function validSides(sides){if(sides===undefined||sides===null)return null;if(Object.getPrototypeOf(sides)!==Object.prototype||Object.keys(sides).sort().join(',')!==SIDES.join(',')||SIDES.some(side=>!Number.isInteger(sides[side])||sides[side]<5||sides[side]>50))throw new Error('Choose each page margin from 5 to 50 mm.');return {top:sides.top,right:sides.right,bottom:sides.bottom,left:sides.left};}
function documentLayout(value){
 if(!value||Object.keys(value).some(key=>!fields.includes(key))||typeof value.paper!=='string'||!Object.hasOwn(documentPapers,value.paper)&&!(value.paper==='custom'&&validCustomSize(value.customSize))||typeof value.landscape!=='boolean'||!Number.isFinite(value.margin)||value.margin<5||value.margin>50||!['sans','serif','mono'].includes(value.font)||!Number.isFinite(value.size)||value.size<10||value.size>24||!Number.isFinite(value.lineHeight)||value.lineHeight<1.2||value.lineHeight>2||typeof value.pageNumbers!=='boolean')throw new Error('Choose a listed paper size, margins from 5 to 50 mm, text from 10 to 24 pt and spacing from 1.2 to 2.0.');
 const result={...defaultDocumentLayout(),...value};if(result.paper==='custom')result.customSize=result.customSize.map(value=>Math.round(value*10)/10);else delete result.customSize;if(Object.hasOwn(value,'sides')){result.sides=validSides(value.sides);if(!result.sides)delete result.sides;}if(documentPaperSize(result)[0]-sideMargins(result).left-sideMargins(result).right<50)throw new Error('The side margins leave less than 50 mm for text. Reduce them.');result.headerBand=validDocumentBand(result.headerBand);result.footerBand=validDocumentBand(result.footerBand);for(const key of ['headerText','footerText']){const text=result[key];if(typeof text!=='string'||text.length>120||text.split('\n').length>2||/[\x00-\x09\x0b-\x1f\x7f-\x9f]/.test(text)||Array.from(text).some(char=>{const cp=char.codePointAt(0);return cp>=0xd800&&cp<=0xdfff||cp===0xfffe||cp===0xffff;}))throw new Error('Header/footer text supports up to 120 characters and two lines, without control characters.');}
 if(!['left','center','right'].includes(result.headerAlign)||!['left','center','right'].includes(result.footerAlign)||!['left','center','right'].includes(result.pageNumberAlign)||!['header','footer'].includes(result.pageNumberPlacement))throw new Error('Choose a supported header/footer alignment and page-number location.');const dimensions=documentPaperSize(result);if(documentBandHeight(result,'header',dimensions[0])+documentBandHeight(result,'footer',dimensions[0])>dimensions[1]-50)throw new Error('Header/footer bands leave less than 50 mm for body content. Reduce their text, size or margins.');return result;
}
function documentPageMargins(value){
 const layout=documentLayout(value),dimensions=documentPaperSize(layout);const top=documentBandHeight(layout,'header',dimensions[0]),bottom=documentBandHeight(layout,'footer',dimensions[0]);
 if(top+bottom>dimensions[1]-50)throw new Error('Header/footer bands leave less than 50 mm for body content. Reduce their text, size or margins.');const sides=sideMargins(layout);return {top,bottom,left:sides.left,right:sides.right,header:4,footer:4};
}

const validDocumentLayout=documentLayout;
module.exports={validDocumentLayout,documentPageMargins,sideMargins,defaultDocumentLayout,documentPapers,documentPaperSize,documentPageFromTwips,validDocumentPage};
