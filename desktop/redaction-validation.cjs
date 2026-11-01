function validRedactionDraft(draft){
 if(!draft||draft.kind!=='redaction'||draft.version!==1||!draft.settings||![144,180,216].includes(draft.settings.dpi)||typeof draft.settings.cleanupOnly!=='boolean'||!Array.isArray(draft.marks)||draft.marks.length>500)throw new Error('Unsupported redaction recovery.');const ids=new Set();
 for(const mark of draft.marks){if(!mark||typeof mark.id!=='string'||!/^pdfix-redact-[0-9a-f-]{36}$/i.test(mark.id)||ids.has(mark.id)||!Number.isInteger(mark.page)||mark.page<0||mark.page>=100||!Array.isArray(mark.rect)||mark.rect.length!==4||!mark.rect.every(v=>Number.isFinite(v)&&Math.abs(v)<=1e7)||mark.rect[2]-mark.rect[0]<.5||mark.rect[3]-mark.rect[1]<.5)throw new Error('Invalid redaction recovery region.');ids.add(mark.id);}
 if(Object.keys(draft).some(k=>!['kind','version','settings','marks'].includes(k))||Object.keys(draft.settings).some(k=>!['dpi','cleanupOnly'].includes(k))||draft.marks.some(mark=>Object.keys(mark).some(k=>!['id','page','rect'].includes(k))))throw new Error('Unexpected redaction recovery data.');return draft;
}
module.exports={validRedactionDraft};
