// Size budgets for editable documents, shared by the editor, the contained import/export engine, recovery and the
// PDF writer. Chosen so a large photo report opens, edits and saves without hitting a limit (user decision, October
// 14: "as big as it needs to be"); each value stays bounded so memory and disk use cannot grow without end.
const MB=1024*1024;
module.exports=Object.freeze({
 WORD_IMPORT_BYTES:100*MB,          // a DOCX or RTF opened for editing; the same as the app's opening limit
 IMAGE_SOURCE_BYTES:40*MB,          // one picture as inserted or embedded, before it is prepared
 IMAGE_SOURCE_PIXELS:60_000_000,    // a 60-megapixel camera picture still opens
 IMAGE_SOURCE_SIDE:16384,
 IMAGE_STORED_BYTES:4*MB,           // one prepared picture inside the document
 IMAGE_STORED_SIDE:2400,            // prepared pictures keep at most this many pixels on their long side
 IMAGE_COUNT:500,                   // pictures in one document
 IMAGE_TOTAL_PIXELS:2_500_000_000,  // all prepared pictures together (500 at full prepared size)
 IMPORT_IMAGE_TOTAL_BYTES:600*MB,   // all pictures embedded in one Word file, before preparing
 DOCUMENT_BYTES:256*MB,             // the editable document with its pictures: recovery drafts, copies, PDF input
 DOCUMENT_TEXT:64*MB,               // characters of text
 DOCUMENT_NODES:200_000,            // paragraphs, runs, cells and pictures together
 TABLE_ROWS:1000,                   // rows in one table (columns stay at 32, the page width)
 TABLE_CELLS:32_000,                // grid cells in one table
 TABLE_TOTAL_CELLS:200_000,         // grid cells in all tables together
 TABLE_COUNT:1000,                  // tables in one document
 HTML_BYTES:400*MB,                 // imported or pasted HTML including picture data
 RTF_OUTPUT_BYTES:100*MB,           // RTF writes pictures as hex, about twice their size; the same as the copy limit
 // The contained engine runs Word/RTF reading and writing (and the DOCX table-grid pass) with its own larger budget:
 // 3 GB of memory, a 2 GB script heap and five minutes. Every other contained job keeps the small 512 MB budget.
 WORD_OPERATIONS:Object.freeze(['rich-docx-read','rich-rtf-read','rich-docx-write','rich-rtf-write','document-table-grids']),
 WORD_REQUEST_BYTES:320*MB,         // the editable document sent for writing, with its pictures
 WORD_RESULT_BYTES:320*MB,          // the imported document returned from reading, with its pictures
 WORD_EMBEDDED_BYTES:200*MB,        // pictures returned by one import
 WORD_JOB_SECONDS:295,
 DOCX_EXPANDED_BYTES:400*MB,        // a Word file's parts after unzipping (zip-bomb guard)
 DOCX_PART_BYTES:128*MB,            // one unzipped part, such as the main text or one picture
 RECOVERY_TOTAL_BYTES:2048*MB,      // all recovery drafts together, and all version files together
 HISTORY_BYTES:512*MB               // one document's saved versions; the oldest are dropped to fit
});
