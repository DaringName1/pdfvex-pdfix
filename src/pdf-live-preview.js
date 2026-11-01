// At most one debounced request. Native/reader generation checks remain the
// authority for accepting a finished preview; closing never schedules a retry.
export class PdfLivePreview{
 constructor(owner,build){this.owner=owner;this.build=build;this.version=0;}
 schedule(){clearTimeout(this.timer);const version=++this.version;const attempt=()=>{if(this.owner.closed||version!==this.version)return;if(this.owner.busy||this.owner.saving||this.owner.printing){this.timer=setTimeout(attempt,200);return;}this.timer=null;Promise.resolve().then(()=>this.build()).catch(error=>{if(!this.owner.closed)this.owner.announce?.(error.message,true);});};this.timer=setTimeout(attempt,350);}
 cancel(){this.version++;clearTimeout(this.timer);this.timer=null;}
}
