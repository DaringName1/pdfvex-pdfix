const MAX_EDGE=1600,MAX_PIXELS=2_560_000;
const node=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
export class DrawingOverlay{
  constructor(comparison){
    this.owner=comparison;this.alignment={x:0,y:0,scale:1,rotation:0};this.mode='off';this.opacity=.5;this.key=null;
    this.root=node('section');this.root.className='comparison-overlay';this.root.hidden=true;this.root.setAttribute('aria-label','Aligned drawing overlay');
    this.heading=node('p');this.heading.className='comparison-overlay-heading';this.heading.setAttribute('aria-live','polite');
    this.status=node('p');this.status.className='comparison-overlay-status';this.status.setAttribute('role','status');
    this.stage=node('div');this.stage.className='comparison-stage comparison-overlay-stage';this.stage.tabIndex=0;this.stage.setAttribute('aria-label','Visual drawing overlay');this.canvas=node('canvas');this.canvas.setAttribute('aria-label','Aligned drawing overlay artwork');this.stage.append(this.canvas);
    this.controls=node('div');this.controls.className='comparison-overlay-controls';
    const field=(title,input)=>{const label=node('label',title);label.append(input);this.controls.append(label);return input;};
    this.modeSelect=node('select');this.modeSelect.setAttribute('aria-label','Drawing overlay view');for(const [value,text]of [['off','Side-by-side only'],['transparent','Transparent overlay'],['colors','Two-color overlay']]){const option=node('option',text);option.value=value;this.modeSelect.append(option);}const modeLabel=node('label','Drawing overlay ');modeLabel.className='comparison-overlay-mode';modeLabel.append(this.modeSelect);comparison.dialog.querySelector('.comparison-controls').append(modeLabel);
    this.inputs={};for(const [key,title,min,max,step,value]of [['x','X offset (pt)',-2000,2000,.5,0],['y','Y offset (pt)',-2000,2000,.5,0],['scale','Compared scale (%)',25,400,.1,100],['rotation','Compared rotation (°)',-180,180,.1,0]]){
      const input=node('input');input.type='number';input.min=String(min);input.max=String(max);input.step=String(step);input.value=String(value);input.setAttribute('aria-label',title);this.inputs[key]=field(title,input);input.onchange=()=>this.updateAlignment();
    }
    this.alpha=node('input');this.alpha.type='range';this.alpha.min='10';this.alpha.max='90';this.alpha.step='5';this.alpha.value='50';this.alpha.setAttribute('aria-label','Compared overlay opacity');field('Compared opacity',this.alpha);this.alpha.oninput=()=>{this.opacity=Number(this.alpha.value)/100;this.draw();};
    this.reset=node('button','Reset alignment');this.reset.type='button';this.reset.className='secondary compact';this.reset.onclick=()=>{this.resetAlignment();this.draw();};this.controls.append(this.reset);
    const note=node('p','Visual review only. Cyan is the original and magenta is the compared page; overlapping ink becomes darker. Translation uses physical points from the upper-left, with positive X right and Y down. Scale and clockwise rotation use the compared page’s upper-left corner. These adjustments affect only this page-pair overlay; text and whole-document pixel checks retain their original physical page/page-plan comparisons.');note.className='comparison-overlay-note';
    this.root.append(this.heading,this.controls,this.status,this.stage,note);comparison.dialog.querySelector('.comparison-pages').after(this.root);
    this.modeSelect.onchange=()=>{this.mode=this.modeSelect.value;this.root.hidden=this.mode==='off';this.draw();};
  }
  resetAlignment(){this.alignment={x:0,y:0,scale:1,rotation:0};this.inputs.x.value=this.inputs.y.value=this.inputs.rotation.value='0';this.inputs.scale.value='100';}
  updateAlignment(){
    if(this.owner.closed||this.owner.checking||this.owner.dialog.dataset.ready!=='true')return;
    const values={};for(const [key,input]of Object.entries(this.inputs)){const value=Number(input.value);if(!input.value.trim()||!Number.isFinite(value)||value<Number(input.min)||value>Number(input.max)){this.status.textContent='Enter X/Y offsets between −2,000 and 2,000 pt, scale between 25% and 400%, and rotation between −180° and 180°. The previous alignment is retained.';return;}values[key]=key==='scale'?value/100:value;}
    this.alignment=values;this.draw();
  }
  setPair(pair){if(pair.key!==this.key){this.key=pair.key;this.resetAlignment();this.stage.scrollTop=this.stage.scrollLeft=0;}this.pair=pair;this.heading.textContent=`Original: ${pair.leftName} · physical page ${pair.leftNumber}${pair.leftLabel?` · label “${pair.leftLabel}”`:''} ↔ Compared: ${pair.rightName} · physical page ${pair.rightNumber}${pair.rightLabel?` · label “${pair.rightLabel}”`:''}`;this.draw();}
  invalidate(){this.pair=null;this.canvas.width=this.canvas.height=0;this.status.textContent='Waiting for the current page pair to finish rendering.';}
  draw(){
    if(this.owner.closed||this.mode==='off')return;
    if(!this.pair){this.status.textContent='Waiting for a rendered page pair.';return;}
    const {leftCanvas,rightCanvas,leftBase,rightBase,displayScale}=this.pair,{x,y,scale,rotation}=this.alignment;
    if(!leftCanvas.width||!rightCanvas.width)return;
    const angle=rotation*Math.PI/180,c=Math.cos(angle)*scale,s=Math.sin(angle)*scale;
    const corners=[[0,0],[rightBase.width,0],[rightBase.width,rightBase.height],[0,rightBase.height]].map(([px,py])=>[x+c*px-s*py,y+s*px+c*py]);
    const minX=Math.min(0,...corners.map(p=>p[0])),minY=Math.min(0,...corners.map(p=>p[1])),maxX=Math.max(leftBase.width,...corners.map(p=>p[0])),maxY=Math.max(leftBase.height,...corners.map(p=>p[1])),width=maxX-minX,height=maxY-minY;
    if(![width,height,minX,minY].every(Number.isFinite)||width<=0||height<=0){this.status.textContent='This alignment has unsupported page geometry.';return;}
    const ratio=Math.min(1,MAX_EDGE/Math.max(width,height)),cw=Math.max(1,Math.ceil(width*ratio)),ch=Math.max(1,Math.ceil(height*ratio));
    if(cw*ch>MAX_PIXELS){this.status.textContent='The overlay exceeds its raster limit.';return;}
    this.canvas.width=cw;this.canvas.height=ch;const cssScale=Math.min(displayScale,12000/Math.max(width,height));this.canvas.style.width=`${width*cssScale}px`;this.canvas.style.height=`${height*cssScale}px`;
    const ctx=this.canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,cw,ch);
    const paint=(canvas,base,color,transform)=>{
      let source=canvas,scratch=null;
      try{
        if(color){scratch=document.createElement('canvas');const tintRatio=Math.min(ratio,MAX_EDGE/Math.max(base.width,base.height));scratch.width=Math.max(1,Math.ceil(base.width*tintRatio));scratch.height=Math.max(1,Math.ceil(base.height*tintRatio));if(scratch.width*scratch.height>MAX_PIXELS)throw new Error('Tinted drawing exceeds its raster limit.');const sc=scratch.getContext('2d');sc.drawImage(canvas,0,0,scratch.width,scratch.height);const data=sc.getImageData(0,0,scratch.width,scratch.height);for(let i=0;i<data.data.length;i+=4){const luminance=(data.data[i]*.2126+data.data[i+1]*.7152+data.data[i+2]*.0722)/255,ink=(1-luminance)*data.data[i+3]/255;for(let channel=0;channel<3;channel++)data.data[i+channel]=Math.round(255-(255-color[channel])*ink);data.data[i+3]=255;}sc.putImageData(data,0,0);source=scratch;}
        ctx.save();ctx.setTransform(ratio,0,0,ratio,-minX*ratio,-minY*ratio);if(transform){ctx.transform(c,s,-s,c,x,y);ctx.globalCompositeOperation='multiply';ctx.globalAlpha=this.opacity;}
        ctx.drawImage(source,0,0,base.width,base.height);ctx.restore();
      }finally{if(scratch)scratch.width=scratch.height=0;}
    };
    try{paint(leftCanvas,leftBase,this.mode==='colors'?[0,145,190]:null,false);paint(rightCanvas,rightBase,this.mode==='colors'?[210,20,140]:null,true);this.status.textContent=`${this.mode==='colors'?'Cyan/magenta':'Transparent'} overlay at ${cw} × ${ch} review pixels. Compared: X ${x} pt, Y ${y} pt, ${(scale*100).toFixed(1)}%, ${rotation}°, ${Math.round(this.opacity*100)}% opacity.${cssScale<displayScale?' Overlay display zoom is capped for this expanded alignment.':''} New physical page pairs reset alignment.`;}catch(error){this.canvas.width=this.canvas.height=0;this.status.textContent=error.message||'The drawing overlay could not be composed.';}
  }
  dispose(){this.pair=null;this.canvas.width=this.canvas.height=0;this.root.remove();this.modeSelect.parentElement?.remove();}
}
