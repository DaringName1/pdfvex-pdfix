function printSettings(value){
 if(value===undefined)return {silent:false,printBackground:true};
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==6||Object.keys(value).some(key=>!['sourceID','widthMm','heightMm','copies','duplex','color'].includes(key))||value.sourceID!==null&&(typeof value.sourceID!=='string'||!/^[-0-9a-f]{36}$/i.test(value.sourceID))||![value.widthMm,value.heightMm].every(number=>typeof number==='number'&&Number.isFinite(number)&&number>=10&&number<=2000)||!Number.isInteger(value.copies)||value.copies<1||value.copies>99||!['simplex','longEdge','shortEdge'].includes(value.duplex)||typeof value.color!=='boolean')throw new Error('Choose valid reviewed paper, copies, duplex and color settings.');
 // Electron custom paper sizes use microns. Prepared HTML has the exact same sheet dimensions.
 return {silent:false,printBackground:true,pageSize:{width:Math.round(value.widthMm*1000),height:Math.round(value.heightMm*1000)},landscape:false,margins:{marginType:'none'},scaleFactor:100,copies:value.copies,duplexMode:value.duplex,color:value.color};
}
module.exports={printSettings};
