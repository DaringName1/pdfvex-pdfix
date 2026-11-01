// Inert paragraph layout shared by the editor, the contained validator and the DOCX/RTF/PDF writers.
// Indent is counted in half-inch steps; line spacing is either the document default (null) or a listed multiple;
// space before/after is either the document default (null) or a listed number of points.
const MAX_INDENT=8,INDENT_TWIPS=720,INDENT_INCHES=0.5,LINE_SPACINGS=[1,1.15,1.5,2],PARAGRAPH_SPACES=[0,6,12,18,24],FIRST_LINES=['first','hanging'],MAX_RIGHT_INDENT=4;
// First line: "first" indents the first line half an inch further; "hanging" indents every other line half an inch,
// so the first line hangs out. Both are measured from the paragraph's own indent. Right indent is 0 to 4 half-inch steps.
function validParagraphFormat(attrs){
 const indent=attrs?.indent??0,lineSpacing=attrs?.lineSpacing??null,spaceBefore=attrs?.spaceBefore??null,spaceAfter=attrs?.spaceAfter??null,firstLine=attrs?.firstLine??null,rightIndent=attrs?.rightIndent??0;
 if(!Number.isInteger(indent)||indent<0||indent>MAX_INDENT||lineSpacing!==null&&!LINE_SPACINGS.includes(lineSpacing)||[spaceBefore,spaceAfter].some(space=>space!==null&&!PARAGRAPH_SPACES.includes(space))||firstLine!==null&&!FIRST_LINES.includes(firstLine)||!Number.isInteger(rightIndent)||rightIndent<0||rightIndent>MAX_RIGHT_INDENT)throw new Error('Choose a paragraph indent from 0 to 8 steps and listed line and paragraph spacing.');
 return {indent,lineSpacing,spaceBefore,spaceAfter,firstLine,rightIndent};
}
// Left and first-line offsets in half-inch steps, as every writer needs them.
function paragraphOffsets(format){const hanging=format.firstLine==='hanging'?1:0;return {left:format.indent+hanging,firstLine:format.firstLine==='first'?1:hanging?-1:0,right:format.rightIndent??0};}
module.exports={MAX_INDENT,MAX_RIGHT_INDENT,INDENT_TWIPS,INDENT_INCHES,LINE_SPACINGS,PARAGRAPH_SPACES,FIRST_LINES,validParagraphFormat,paragraphOffsets};
