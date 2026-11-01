// A suggested basename only: never a path or an instruction to rename a source.
function preferredCopyBase(value, extension){
 if(value===undefined)return undefined;
 if(typeof value!=='string'||value.length>110)throw new Error('Use a copy name of at most 100 characters.');
 let base=value.trim();const suffix='.'+extension;if(base.toLowerCase().endsWith(suffix.toLowerCase()))base=base.slice(0,-suffix.length);
 if(!base||base.length>100||/[<>:"/\\|?*\x00-\x1f\x7f]/.test(base)||/[. ]$/.test(base)||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(base))throw new Error('Use a file name without folder separators or Windows reserved characters.');
 return base;
}
module.exports={preferredCopyBase};
