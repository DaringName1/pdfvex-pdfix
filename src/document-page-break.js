import {Node,mergeAttributes} from '@tiptap/core';
export const DocumentPageBreak=Node.create({
 name:'pageBreak',group:'block',atom:true,selectable:true,priority:1000,
 parseHTML(){return [{tag:'hr[data-pdfix-page-break="true"]'}];},
 renderHTML({HTMLAttributes}){return ['hr',mergeAttributes(HTMLAttributes,{'data-pdfix-page-break':'true',class:'document-page-break','aria-label':'Page break'})];},
 addCommands(){return {insertPageBreak:()=>({commands})=>commands.insertContent([{type:'pageBreak'},{type:'paragraph'}])};},
 addKeyboardShortcuts(){return {'Mod-Enter':()=>this.editor.commands.insertPageBreak()};}
});
