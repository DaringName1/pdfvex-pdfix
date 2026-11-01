// Deterministic Windows asset packaging: crop the existing document mark, never
// redraw the logo or change the full in-app wordmark.
using System;
using System.IO;
using System.Drawing;
using System.Drawing.Imaging;
using System.Drawing.Drawing2D;
class PdfixIconArtwork {
 static int Main(string[] args){
  using(Bitmap source=new Bitmap(args[0])){
   if(source.Width!=1920||source.Height!=819)throw new Exception("Brand artwork dimensions changed; review the document crop.");
   int left=580,top=source.Height,right=0,bottom=0;
   // The document mark ends before x580; the P starts after x600.
   for(int y=0;y<source.Height;y++)for(int x=0;x<580;x++)if(source.GetPixel(x,y).A>16){left=Math.Min(left,x);right=Math.Max(right,x);top=Math.Min(top,y);bottom=Math.Max(bottom,y);}
   if(right-left<250||bottom-top<300||right>=580)throw new Exception("Could not isolate the existing document mark.");
   Rectangle crop=new Rectangle(left,top,right-left+1,bottom-top+1);
   int[] sizes={16,24,32,48,64,128,256};byte[][] payloads=new byte[sizes.Length][];
   for(int i=0;i<sizes.Length+1;i++){
    int size=i==sizes.Length?512:sizes[i];
    using(Bitmap bitmap=new Bitmap(size,size,PixelFormat.Format32bppArgb)){
     using(Graphics graphics=Graphics.FromImage(bitmap)){
      graphics.Clear(Color.Transparent);graphics.CompositingMode=CompositingMode.SourceCopy;graphics.CompositingQuality=CompositingQuality.HighQuality;graphics.InterpolationMode=InterpolationMode.HighQualityBicubic;graphics.PixelOffsetMode=PixelOffsetMode.HighQuality;
      float pad=size/20f,scale=Math.Min((size-pad*2)/crop.Width,(size-pad*2)/crop.Height),width=crop.Width*scale,height=crop.Height*scale;
      graphics.DrawImage(source,new RectangleF((size-width)/2,(size-height)/2,width,height),crop,GraphicsUnit.Pixel);
     }
     using(MemoryStream png=new MemoryStream()){bitmap.Save(png,ImageFormat.Png);if(i==sizes.Length)File.WriteAllBytes(args[2],png.ToArray());else payloads[i]=png.ToArray();}
    }
   }
   using(BinaryWriter writer=new BinaryWriter(File.Open(args[1],FileMode.Create,FileAccess.Write))){
    writer.Write((ushort)0);writer.Write((ushort)1);writer.Write((ushort)sizes.Length);int offset=6+16*sizes.Length;
    for(int i=0;i<sizes.Length;i++){writer.Write((byte)(sizes[i]==256?0:sizes[i]));writer.Write((byte)(sizes[i]==256?0:sizes[i]));writer.Write((byte)0);writer.Write((byte)0);writer.Write((ushort)1);writer.Write((ushort)32);writer.Write(payloads[i].Length);writer.Write(offset);offset+=payloads[i].Length;}
    foreach(byte[] png in payloads)writer.Write(png);
   }
   Console.WriteLine("Document-mark icon built from existing artwork: "+crop+"; seven sizes, transparent background.");return 0;
  }
 }
}
