// Inert character marks beyond bold/italic/underline/strike, shared by the editor, the contained validator and the
// DOCX/RTF/PDF writers. Highlight colors are Word's own highlighter colors so a DOCX shows the same highlight.
const HIGHLIGHTS={yellow:{label:'Yellow',hex:'#ffff00',word:'yellow'},green:{label:'Green',hex:'#00ff00',word:'green'},turquoise:{label:'Turquoise',hex:'#00ffff',word:'cyan'},pink:{label:'Pink',hex:'#ff00ff',word:'magenta'}};
const SCRIPT_MARKS=['superscript','subscript'];
function validHighlight(color){if(typeof color!=='string'||!Object.hasOwn(HIGHLIGHTS,color))throw new Error('Choose a listed highlight color.');return color;}
// The highlight whose color matches, for readers that only have a color value (RTF color tables, pasted styles).
function highlightFromHex(hex){const value=String(hex??'').toLowerCase();return Object.keys(HIGHLIGHTS).find(name=>HIGHLIGHTS[name].hex===value)??null;}
module.exports={HIGHLIGHTS,SCRIPT_MARKS,validHighlight,highlightFromHex};
