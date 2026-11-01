using System;
using System.IO;
using System.Drawing;
using System.Collections.Generic;
using System.Runtime.InteropServices;
class PdfixIconResource {
 delegate bool EnumName(IntPtr module,IntPtr type,IntPtr name,IntPtr data);
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)]static extern IntPtr LoadLibraryEx(string file,IntPtr reserved,uint flags);
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)]static extern bool EnumResourceNames(IntPtr module,IntPtr type,EnumName callback,IntPtr data);
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)]static extern IntPtr FindResource(IntPtr module,IntPtr name,IntPtr type);
 [DllImport("kernel32.dll")]static extern uint SizeofResource(IntPtr module,IntPtr resource);
 [DllImport("kernel32.dll")]static extern IntPtr LoadResource(IntPtr module,IntPtr resource);
 [DllImport("kernel32.dll")]static extern IntPtr LockResource(IntPtr resource);
 [DllImport("kernel32.dll")]static extern bool FreeLibrary(IntPtr module);
 static byte[] Read(IntPtr module,IntPtr name,int type){IntPtr resource=FindResource(module,name,new IntPtr(type));if(resource==IntPtr.Zero)throw new Exception("Missing icon resource");uint length=SizeofResource(module,resource);if(length<1||length>1048576)throw new Exception("Icon resource exceeds bound");byte[] bytes=new byte[length];Marshal.Copy(LockResource(LoadResource(module,resource)),bytes,0,(int)length);return bytes;}
 public static int Main(string[] args){
  IntPtr module=IntPtr.Zero;
  try{
   byte[] ico=File.ReadAllBytes(args[1]);int count=BitConverter.ToUInt16(ico,4);if(count<1||count>32||ico.Length>1048576)throw new Exception("Invalid source icon");
   module=LoadLibraryEx(args[0],IntPtr.Zero,0x22);if(module==IntPtr.Zero)throw new Exception("Cannot read executable resources");
   List<IntPtr> groups=new List<IntPtr>();EnumName callback=delegate(IntPtr m,IntPtr t,IntPtr name,IntPtr data){groups.Add(name);return true;};
   if(!EnumResourceNames(module,new IntPtr(14),callback,IntPtr.Zero)||groups.Count!=1)throw new Exception("Expected one launcher icon group");
   byte[] group=Read(module,groups[0],14);if(group.Length!=6+count*14||BitConverter.ToUInt16(group,4)!=count)throw new Exception("Icon size count changed");
   for(int i=0;i<count;i++){
    int source=6+i*16,target=6+i*14,length=BitConverter.ToInt32(ico,source+8),offset=BitConverter.ToInt32(ico,source+12);
    if(length<1||offset<6+count*16||offset>ico.Length-length)throw new Exception("Invalid source image range");
    for(int j=0;j<12;j++)if(group[target+j]!=ico[source+j])throw new Exception("Icon directory differs");
    byte[] embedded=Read(module,new IntPtr(BitConverter.ToUInt16(group,target+12)),3);if(embedded.Length!=length)throw new Exception("Icon payload size differs");
    for(int j=0;j<length;j++)if(embedded[j]!=ico[offset+j])throw new Exception("Icon pixels differ");
    using(MemoryStream png=new MemoryStream(embedded))using(Bitmap bitmap=new Bitmap(png)){
     int minX=bitmap.Width,minY=bitmap.Height,maxX=0,maxY=0;
     for(int y=0;y<bitmap.Height;y++)for(int x=0;x<bitmap.Width;x++)if(bitmap.GetPixel(x,y).A>32){minX=Math.Min(minX,x);minY=Math.Min(minY,y);maxX=Math.Max(maxX,x);maxY=Math.Max(maxY,y);}
     if(maxY-minY+1<bitmap.Height*.75||maxX-minX+1<bitmap.Width*.5)throw new Exception("Small app icon has excessive empty space or a tiny wordmark");
    }
   }
   Console.WriteLine("{\"pass\":true,\"sizes\":"+count+",\"exactEmbeddedPayloads\":true}");return 0;
  }catch(Exception e){Console.Error.WriteLine(e.Message);return 1;}finally{if(module!=IntPtr.Zero)FreeLibrary(module);}
 }
}
