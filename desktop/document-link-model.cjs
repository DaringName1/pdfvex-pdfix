// Inert link-target validation shared by the document editor, its writers and the open-link bridge.
// Only web and email targets are links; everything else stays plain text.
const MAX_LINK=2000;
const fail=()=>{throw new Error('Use a web address (https:// or http://) or an email address up to 2,000 characters.');};
function validDocumentLink(value){
 if(typeof value!=='string'||!value||value.length>MAX_LINK||/[\s\x00-\x1f\x7f"<>\\^`{|}]/.test(value))fail();
 let url;try{url=new URL(value);}catch{fail();}
 if(url.protocol==='mailto:'){let address;try{address=decodeURIComponent(url.pathname);}catch{fail();}if(!/^[^@\s,;]+@[^@\s,;]+\.[^@\s,;]+$/.test(address))fail();}
 else if(!['http:','https:'].includes(url.protocol)||!url.hostname||url.username||url.password)fail();
 if(url.href.length>MAX_LINK)fail();return url.href;
}
// What a person types: a bare domain becomes https, a bare address becomes mailto.
function documentLinkFromInput(value){
 const text=typeof value==='string'?value.trim():'';if(!text)fail();
 if(/^[a-z][a-z0-9+.-]*:/i.test(text))return validDocumentLink(text);
 if(/^[^@\s/]+@[^@\s/]+\.[^@\s/]+$/.test(text))return validDocumentLink('mailto:'+text);
 if(/^[^\s/.]+(\.[^\s/.]+)+([/?#]\S*)?$/.test(text))return validDocumentLink('https://'+text);
 fail();
}
// Links to a heading in the same document: '#' and an anchor name a heading carries (Word bookmark names fit too).
// Only the editor and its writers accept these; opening a link in the browser still takes web and email targets only.
const ANCHOR=/^[A-Za-z_][A-Za-z0-9_.-]{0,39}$/;
function validDocumentAnchor(value){if(typeof value!=='string'||!ANCHOR.test(value))throw new Error('A heading link needs a valid heading anchor.');return value;}
function validLinkTarget(value){return typeof value==='string'&&value.startsWith('#')?'#'+validDocumentAnchor(value.slice(1)):validDocumentLink(value);}
const isInternalLink=value=>typeof value==='string'&&value.startsWith('#');
module.exports={validDocumentLink,documentLinkFromInput,validDocumentAnchor,validLinkTarget,isInternalLink,MAX_LINK};
