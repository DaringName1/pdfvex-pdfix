'use strict';
// Error messages that reach the screen in plain words. The document engine's own checks speak in technical terms
// ("The isolated output does not match its immutable source request."); a person only needs to know what happened to
// their file and what to do. The original wording is returned separately so it can go into the private problem
// report (with file paths removed), where it still helps find the cause.
const TECHNICAL=/\b(isolated|contained|containment|envelope|broker|AppContainer|validator|immutable|seal|staging|staged|structural|literal UTF-8|parser|serialized|receipt)\b/i;
const TOO_BIG=/\b(budget|exceeds|too large|limit)\b/i;
const CANCELED=/\bcancel(?:l)?ed\b/i;
const GENERIC='PDFix could not finish this safely, so nothing was saved and your original is unchanged. Try again; if it keeps happening, choose Settings, then Save a problem report.';
const LARGE='This document is too large or too complex for this tool. Nothing was saved and your original is unchanged.';
// Removes Windows file and network paths, so a problem report never carries file or folder names.
const scrubPaths=text=>String(text).replace(/[A-Za-z]:\\[^\s'"]+|\\\\[^\s'"]+/g,'<path>').slice(0,300);
function plainMessage(message){
  if(typeof message!=='string'||!TECHNICAL.test(message)||CANCELED.test(message))return {message,technical:null};
  return {message:TOO_BIG.test(message)?LARGE:GENERIC,technical:scrubPaths(message)};
}
module.exports={plainMessage,scrubPaths,GENERIC,LARGE};
