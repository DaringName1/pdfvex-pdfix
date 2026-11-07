export const pdfTextLanguageMessage="This language isn't supported yet. Use English or Spanish.";

const unsupported=/[^\x20-\x7e\t\n\r\u00a0ÁÉÍÓÚÜÑáéíóúüñ¿¡ªº«»‘’“”–—…•·€£¢©®™°±×÷§]/u;
export const supportsPdfText=text=>!unsupported.test(text);

function insertedRange(previous,value){
  let start=0,end=0;
  while(start<previous.length&&start<value.length&&previous[start]===value[start])start++;
  while(end<previous.length-start&&end<value.length-start&&previous.at(-end-1)===value.at(-end-1))end++;
  return {start,text:value.slice(start,value.length-end)};
}

export const supportsPdfTextEdit=(previous,value)=>supportsPdfText(insertedRange(previous,value).text);

export function guardPdfTextInput(element,announce){
  const refuse=(event,text)=>{
    if(!text||supportsPdfText(text)||!event.cancelable)return;
    event.preventDefault();
    event.stopPropagation();
    announce(pdfTextLanguageMessage,true);
  };
  let previous=element.value;
  element.addEventListener('beforeinput',event=>{
    previous=element.value;
    refuse(event,event.data??event.dataTransfer?.getData('text/plain'));
  },true);
  element.addEventListener('paste',event=>refuse(event,event.clipboardData?.getData('text/plain')),true);
  element.addEventListener('drop',event=>refuse(event,event.dataTransfer?.getData('text/plain')),true);
  if(typeof previous==='string'){
    element.addEventListener('focus',()=>{previous=element.value;});
    element.addEventListener('input',event=>{
      const value=element.value;
      const {start,text}=insertedRange(previous,value);
      if(supportsPdfText(text)){previous=value;return;}
      event.stopImmediatePropagation();
      element.value=previous;
      element.setSelectionRange(start,start);
      announce(pdfTextLanguageMessage,true);
    },true);
  }
}
