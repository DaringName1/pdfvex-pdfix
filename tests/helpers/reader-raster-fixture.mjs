import fs from 'node:fs/promises';
// Four referenced full-page RGB images, not trailing padding/unused streams.
// Synthetic raster diagrams plus a generated text overlay; not a real scan/OCR proof.
export async function rasterFixture(file){
 const width=4200,height=4400,pages=4,handle=await fs.open(file,'wx'),offsets=[0];let offset=0;
 const put=async data=>{const b=typeof data==='string'?Buffer.from(data,'ascii'):data;let done=0;while(done<b.length){const r=await handle.write(b,done,b.length-done,null);if(!r.bytesWritten)throw Error('Raster fixture write stopped.');done+=r.bytesWritten;offset+=r.bytesWritten;}};
 const obj=async(n,s)=>{offsets[n]=offset;await put(`${n} 0 obj\n${s}\nendobj\n`);};
 try{
  await put('%PDF-1.7\n');await obj(1,'<< /Type /Catalog /Pages 2 0 R >>');await obj(2,`<< /Type /Pages /Count 4 /Kids [${[0,1,2,3].map(i=>`${4+i*3} 0 R`).join(' ')}] >>`);await obj(3,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  for(let i=0;i<pages;i++){
   const p=4+i*3,content=`q 612 0 0 792 0 0 cm /Raster Do Q\nBT /F1 12 Tf 40 760 Td (Raster needle page ${i+1}) Tj ET\n`;
   await obj(p,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> /XObject << /Raster ${p+2} 0 R >> >> /Contents ${p+1} 0 R >>`);
   await obj(p+1,`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}endstream`);
   offsets[p+2]=offset;await put(`${p+2} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Length ${width*height*3} >>\nstream\n`);
   const row=Buffer.alloc(width*3,250),blank=Buffer.alloc(width*3,250),line=Buffer.alloc(width*3,250);line.fill(35,300,(width-100)*3);
   for(let y=0;y<height;y++){blank.copy(row);if(y>200&&y<height-200){for(let x=100;x<width-100;x+=500)row.fill(35,x*3,x*3+9);if(y%400<3)line.copy(row);if(y>600+i*200&&y<1000+i*200)row.fill(120,1600*3,2100*3);}await put(row);}
   await put('\nendstream\nendobj\n');
  }
  const xref=offset;await put('xref\n0 16\n0000000000 65535 f \n');for(let i=1;i<=15;i++)await put(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);await put(`trailer\n<< /Size 16 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
 }finally{await handle.close();}
 const bytes=(await fs.stat(file)).size;if(bytes<=200*1048576)throw Error('Referenced raster fixture must exceed 200 MiB.');return {bytes,pages,width,height,scope:'Four uncompressed referenced raster diagrams, synthetic text overlay; not real scan/OCR evidence'};
}
