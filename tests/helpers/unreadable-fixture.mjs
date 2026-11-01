export function unreadableFixture(kind){
 const content='BT /F1 18 Tf 20 80 Td (Generated malformed fixture) Tj ET';
 const objects=['<< /Type /Catalog /Pages 2 0 R >>',kind==='cycle'?'<< /Type /Pages /Kids [2 0 R 3 0 R] /Count 2 >>':'<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',`<< /Length ${content.length} >>\nstream\n${content}\nendstream`,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
 if(kind==='encryption')objects.push('<< /Filter /NotARealHandler /V 99 /R 99 /Length 4096 /O (x) /U (y) /P -1 >>');
 let output='%PDF-1.7\n',offsets=[];for(const[index,body]of objects.entries()){offsets.push(Buffer.byteLength(output));output+=`${index+1} 0 obj\n${body}\nendobj\n`;}
 const start=Buffer.byteLength(output);output+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('');output+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R ${kind==='encryption'?'/Encrypt 6 0 R /ID [<00> <00>] ':''}>>\nstartxref\n${start}\n%%EOF\n`;return Buffer.from(output);
}
