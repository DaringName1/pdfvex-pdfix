export function mayEditPdf(reader,kind){return reader.editPermissions?reader.editPermissions[kind]===true:reader.copyAllowed!==false;}
export function assertPdfEditPermission(reader,kind){
 if(!reader?.doc||mayEditPdf(reader,kind))return;
 throw new Error(kind==='form'?'This PDF does not allow filling form fields. Your original is unchanged.':kind==='markup'?'This PDF does not allow comments or drawing. Your original is unchanged.':'This PDF does not allow adding text or filling form fields. Your original is unchanged.');
}
