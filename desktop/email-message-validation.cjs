const plain=value=>value&&Object.getPrototypeOf(value)===Object.prototype;
const keys=(value,names)=>plain(value)&&Object.keys(value).sort().join(',')===names;
const text=(value,max)=>typeof value==='string'&&value.length<=max&&value.isWellFormed()&&!/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value);
function validEmailMessageReport(value,sourceSha256){
 const fail=()=>{throw new Error('Invalid contained email message report.');};
 if(!keys(value,'attachments,body,headers,sourceSha256,title,version,warnings')||value.version!==1||!/^([a-f0-9]{64})$/.test(value.sourceSha256)||sourceSha256&&value.sourceSha256!==sourceSha256||!text(value.title,150)||Buffer.byteLength(JSON.stringify(value))>1600000)fail();
 if(!Array.isArray(value.headers)||value.headers.length>8||value.headers.some(item=>!keys(item,'name,value')||!['from','to','cc','bcc','date','subject','reply-to','message-id'].includes(item.name)||!text(item.value,2000)))fail();
 if(!keys(value.body,'content,kind')||!['text','html'].includes(value.body.kind)||!text(value.body.content,1024*1024)||Buffer.byteLength(value.body.content)>1024*1024)fail();
 if(value.body.kind==='html'&&/<(?!\/?(?:p|h[123]|strong|b|em|i|u|s|ul|ol|li|br|blockquote|pre|code|hr)>)/i.test(value.body.content))fail();
 if(!Array.isArray(value.attachments)||value.attachments.length>200||value.attachments.some(item=>!keys(item,'mime,name,omitted,reason,size')||!text(item.name,300)||!text(item.mime,200)||!text(item.reason,300)||item.omitted!==true||item.size!==null&&(!Number.isSafeInteger(item.size)||item.size<0||item.size>10*1024*1024)))fail();
 if(!Array.isArray(value.warnings)||value.warnings.length>20||value.warnings.some(note=>!text(note,1000)))fail();return value;
}
module.exports={validEmailMessageReport};
