const {validateRichText}=require('./content-rich-model.cjs');
function validContentDraft(draft){
  const fail=()=>{throw new Error('PDF content recovery is invalid or exceeds its limits.');};
  const keys=(value,allowed)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(key=>allowed.includes(key));
  if(!keys(draft,['kind','version','objects','assets','replacements','imageReplacements','metadata'])||draft.kind!=='pdf-content'||draft.version!==1||!Array.isArray(draft.objects)||draft.objects.length>200||!Array.isArray(draft.assets)||draft.assets.length>20||Buffer.byteLength(JSON.stringify(draft))>2*1024*1024)fail();
  const metadata=draft.metadata??{};if(!keys(metadata,['title','author','subject','keywords','creator'])||Object.values(metadata).some(value=>typeof value!=='string'||value.length>2000||/[\x00-\x1f\x7f]/.test(value)))fail();
  const replacements=draft.replacements??[],changed=new Set();if(!Array.isArray(replacements)||replacements.length>200)fail();for(const edit of replacements){if(!keys(edit,['id','text'])||typeof edit.id!=='string'||!/^pdfix-original-\d{1,3}-\d{1,5}-\d{1,8}(?:-n-[a-f0-9]{64})?$/.test(edit.id)||changed.has(edit.id)||typeof edit.text!=='string'||edit.text.length>2000||/[\x00-\x1f\x7f]/.test(edit.text))fail();changed.add(edit.id);}
  const assets=new Set(),ids=new Set();
  for(const asset of draft.assets){
    if(!keys(asset,['id','name','data','width','height'])||typeof asset.id!=='string'||!/^pdfix-image-[a-f0-9-]{36}$/.test(asset.id)||assets.has(asset.id)||typeof asset.name!=='string'||asset.name.length>200||typeof asset.data!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(asset.data))fail();
    const bytes=Buffer.from(asset.data.slice(22),'base64');if(bytes.length<33||!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||bytes.toString('ascii',12,16)!=='IHDR'||bytes.readUInt32BE(16)!==asset.width||bytes.readUInt32BE(20)!==asset.height||!Number.isInteger(asset.width)||!Number.isInteger(asset.height)||asset.width<1||asset.height<1||asset.width>8192||asset.height>8192||asset.width*asset.height>16_000_000)fail();assets.add(asset.id);
  }
  const imageChanges=draft.imageReplacements??[],imageIds=new Set();if(!Array.isArray(imageChanges)||imageChanges.length>200)fail();for(const change of imageChanges){if(!keys(change,['id','asset'])||typeof change.id!=='string'||!/^pdfix-original-image-\d{1,3}-\d{1,5}(?:-n-[a-f0-9]{64})?$/.test(change.id)||imageIds.has(change.id)||!assets.has(change.asset))fail();imageIds.add(change.id);}
  for(const item of draft.objects){
    if(!keys(item,['id','type','page','left','top','width','height','text','font','size','color','asset','richText'])||typeof item.id!=='string'||!/^pdfix-content-[a-f0-9-]{36}$/.test(item.id)||ids.has(item.id)||!['text','image'].includes(item.type)||!Number.isInteger(item.page)||item.page<0||item.page>499||!['left','top','width','height'].every(key=>typeof item[key]==='number'&&Number.isFinite(item[key]))||item.left<0||item.top<0||item.width<.1||item.height<.1||item.left+item.width>100.00001||item.top+item.height>100.00001)fail();ids.add(item.id);
    if(item.richText!==undefined){if(item.type!=='text')fail();validateRichText(item.richText,item.text);}
    if(item.type==='image'&&!assets.has(item.asset))fail();
    if(item.type==='text'&&(typeof item.text!=='string'||!item.text.trim()&&!item.richText||item.text.length>2000||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(item.text)||!['sans','serif','mono'].includes(item.font)||typeof item.size!=='number'||!Number.isFinite(item.size)||item.size<6||item.size>96||typeof item.color!=='string'||!/^#[a-f0-9]{6}$/i.test(item.color)))fail();
  }return draft;
}
module.exports={validContentDraft};
