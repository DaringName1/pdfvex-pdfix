// Trusted device adapter, not a document parser sandbox. Windows WIA/driver codecs
// execute with the user's device access. The app never supplies document commands.
using System;
using System.IO;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Web.Script.Serialization;
using System.Diagnostics;

internal static class ScannerCapture {
    const string Bmp="{B96B3CAB-0728-11D3-9D7B-0000F81EF32E}", Png="{B96B3CAF-0728-11D3-9D7B-0000F81EF32E}";
    const string Flatbed="{FB607B1F-43F3-488B-855B-FB703EC342A6}", Feeder="{FE131934-F84C-42AD-8DA4-6129CDDD7288}";
    static IntPtr job;
    [StructLayout(LayoutKind.Sequential)] struct BASIC_LIMIT { public long ProcessTime,JobTime; public uint Flags; public UIntPtr MinWorkingSet,MaxWorkingSet; public uint ActiveProcessLimit; public UIntPtr Affinity; public uint Priority,Scheduling; }
    [StructLayout(LayoutKind.Sequential)] struct IO_COUNTERS { public ulong ReadOperations,WriteOperations,OtherOperations,ReadBytes,WriteBytes,OtherBytes; }
    [StructLayout(LayoutKind.Sequential)] struct EXTENDED_LIMIT { public BASIC_LIMIT Basic; public IO_COUNTERS IO; public UIntPtr ProcessMemory,JobMemory,PeakProcessMemory,PeakJobMemory; }
    [DllImport("kernel32.dll",SetLastError=true)] static extern IntPtr CreateJobObject(IntPtr attributes,string name);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool SetInformationJobObject(IntPtr handle,int info,ref EXTENDED_LIMIT limits,uint size);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool AssignProcessToJobObject(IntPtr handle,IntPtr process);
    static void Limit() {
        job=CreateJobObject(IntPtr.Zero,null);var limits=new EXTENDED_LIMIT();
        limits.Basic.Flags=0x2000|0x100|0x8; // kill on job close, process memory, one process
        limits.Basic.ActiveProcessLimit=1;limits.ProcessMemory=new UIntPtr(768UL*1024*1024);
        if(job==IntPtr.Zero||!SetInformationJobObject(job,9,ref limits,(uint)Marshal.SizeOf(limits))||!AssignProcessToJobObject(job,Process.GetCurrentProcess().Handle))throw new InvalidOperationException("Scanner helper resource limits could not be established.");
    }
    static dynamic Com(string name) {var type=Type.GetTypeFromProgID(name);if(type==null)throw new InvalidOperationException("Windows WIA is unavailable. Install the scanner's WIA driver.");return Activator.CreateInstance(type);}
    static void Release(object value) {if(value!=null&&Marshal.IsComObject(value))Marshal.FinalReleaseComObject(value);}
    static dynamic Property(dynamic target,int id) {foreach(dynamic p in target.Properties){if((int)p.PropertyID==id)return p;Release(p);}return null;}
    static object Read(dynamic target,int id) {dynamic p=Property(target,id);if(p==null)return null;try{return p.Value;}finally{Release(p);}}
    static bool Set(dynamic target,int id,int value,bool required) {dynamic p=Property(target,id);if(p==null){if(required)throw new InvalidOperationException("The WIA driver does not expose the requested scan setting.");return false;}try{p.Value=value;if(Convert.ToInt32(p.Value)!=value)throw new InvalidOperationException("The WIA driver changed the requested scan setting. Choose a supported setting.");return true;}finally{Release(p);}}
    static string Text(object value,int length) {string text=Convert.ToString(value)??"";if(text.Length>length)text=text.Substring(0,length);return text.Replace("\0","");}
    static object Devices(dynamic manager) {var devices=new List<object>();foreach(dynamic info in manager.DeviceInfos){try{if((int)info.Type==1){if(devices.Count>=100)throw new InvalidOperationException("Too many WIA scanners are registered.");devices.Add(new {id=Text(info.DeviceID,2048),name=Text(Read(info,7),256),manufacturer=Text(Read(info,3),256)});}}finally{Release(info);}}return new {devices=devices,backend="Windows WIA"};}
    static dynamic Connect(dynamic manager,string id) {foreach(dynamic info in manager.DeviceInfos){try{if((int)info.Type==1&&(string)info.DeviceID==id)return info.Connect();}finally{Release(info);}}throw new InvalidOperationException("The selected scanner is no longer available. Refresh devices and check its WIA driver and connection.");}
    static dynamic Source(dynamic device,bool feeder) {
        string wanted=feeder?Feeder:Flatbed;dynamic fallback=null;
        foreach(dynamic item in device.Items){string category=Convert.ToString(Read(item,4125));if(String.Equals(category,wanted,StringComparison.OrdinalIgnoreCase)){Release(fallback);return item;}if(fallback==null)fallback=item;else Release(item);}
        if(fallback==null)throw new InvalidOperationException("This WIA scanner has no capture item.");
        // WIA Automation may expose a legacy root/one-child scanner tree.
        if(Read(device,3088)!=null){Set(device,3088,feeder?1:2,true);return fallback;}
        if(!feeder&&String.IsNullOrEmpty(Convert.ToString(Read(fallback,4125))))return fallback;
        Release(fallback);throw new InvalidOperationException(feeder?"The WIA driver does not expose a document feeder. Use flatbed capture or the vendor's supported driver.":"The WIA driver does not expose a flatbed source. Choose document feeder.");
    }
    static void DirectoryCheck(string directory) {
        string current=Path.GetFullPath(directory);if(!Directory.Exists(current))throw new InvalidOperationException("Scanner staging directory is missing.");
        while(!String.IsNullOrEmpty(current)){if((File.GetAttributes(current)&FileAttributes.ReparsePoint)!=0)throw new InvalidOperationException("Linked scanner staging paths are unsupported.");string next=Path.GetDirectoryName(current);if(next==current)break;current=next;}
        if(Directory.GetFileSystemEntries(directory).Length!=0)throw new InvalidOperationException("Scanner staging directory must be empty.");
    }
    static object Capture(dynamic manager,string[] args) {
        if(args.Length!=7)throw new InvalidOperationException("Invalid scanner request.");
        string directory=Path.GetFullPath(args[1]),id=args[2],source=args[3],color=args[6];int maxPages,dpi;
        if(id.Length<1||id.Length>2048||(source!="flatbed"&&source!="feeder")||!Int32.TryParse(args[4],out maxPages)||maxPages<1||maxPages>10||!Int32.TryParse(args[5],out dpi)||(dpi!=150&&dpi!=300&&dpi!=600)||(color!="color"&&color!="gray"&&color!="bw"))throw new InvalidOperationException("Invalid scanner settings.");
        if(source=="flatbed"&&maxPages!=1)throw new InvalidOperationException("Flatbed capture acquires one page at a time.");DirectoryCheck(directory);
        dynamic device=null,item=null,dialog=null;var pages=new List<object>();long totalBytes=0,totalPixels=0;string completion=source=="flatbed"?"single-page":"page-limit";
        try {
            device=Connect(manager,id);item=Source(device,source=="feeder");
            // On a WIA 2 feeder, select simplex and exactly one page per transfer.
            if(source=="feeder"){
                if(String.Equals(Convert.ToString(Read(item,4125)),Feeder,StringComparison.OrdinalIgnoreCase)){Set(item,3088,32,true);Set(item,3096,1,true);} // WIA 2 FRONT_ONLY
                else Set(device,3096,1,true); // Legacy root FEEDER selected by Source
            }
            Set(item,6146,color=="color"?1:color=="gray"?2:4,true);Set(item,6147,dpi,true);Set(item,6148,dpi,true);
            dialog=Com("WIA.CommonDialog");
            for(int index=0;index<maxPages;index++) {
                dynamic image=null,process=null,png=null;
                try {
                    // Feeder transfer uses the direct method so PAPER_EMPTY returns
                    // to the bounded loop rather than a native error UI asking for more paper.
                    try{image=source=="feeder"?item.Transfer(Bmp):dialog.ShowTransfer(item,Bmp,true);}catch(COMException error){if((uint)error.ErrorCode==0x80210003&&pages.Count>0&&source=="feeder"){completion="feeder-empty";break;}throw;}
                    if(image==null)throw new OperationCanceledException("Scanner capture cancelled.");
                    int width=(int)image.Width,height=(int)image.Height;
                    if(width<1||height<1||width>8192||height>8192||(long)width*height>16000000||(int)image.FrameCount!=1||totalPixels+(long)width*height>64000000)throw new InvalidOperationException("Captured images exceed the page or collection pixel limit. Use a lower resolution or a smaller batch.");
                    process=Com("WIA.ImageProcess");process.Filters.Add(process.FilterInfos["Convert"].FilterID);process.Filters[1].Properties["FormatID"].Value=Png;png=process.Apply(image);
                    if(!String.Equals((string)png.FormatID,Png,StringComparison.OrdinalIgnoreCase)||(int)png.Width!=width||(int)png.Height!=height||(int)png.FrameCount!=1)throw new InvalidOperationException("Windows could not normalize the captured page to PNG.");
                    string name="scan-"+(index+1).ToString("D3")+".png",filename=Path.Combine(directory,name);if(File.Exists(filename))throw new InvalidOperationException("A scanner output already exists.");png.SaveFile(filename);
                    long bytes=new FileInfo(filename).Length;if(bytes<1||bytes>32L*1024*1024||totalBytes+bytes>100L*1024*1024)throw new InvalidOperationException("Captured images exceed the page or collection byte limit. Use a lower resolution or a smaller batch.");totalBytes+=bytes;totalPixels+=(long)width*height;
                    pages.Add(new {name=name,byteLength=bytes,width=width,height=height,dpi=dpi});
                } finally {Release(png);Release(process);Release(image);}
            }
            return new {pages=pages,completion=completion};
        } finally {Release(dialog);Release(item);Release(device);}
    }
    static string ErrorMessage(Exception error) {
        var com=error as COMException;if(com==null)return error.Message;
        switch((uint)com.ErrorCode){case 0x80210003:return "The document feeder is empty. Load paper and retry.";case 0x80210002:return "The scanner paper is jammed. Clear the jam and retry.";case 0x80210006:case 0x8021000D:return "The scanner is busy or locked. Finish the other scan and retry.";case 0x80210005:case 0x8021000A:return "The scanner is offline or disconnected. Check power, connection and its WIA driver.";case 0x80210015:return "The scanner returned no device. Check its connection and WIA driver.";case 0x80210016:return "The scanner cover is open. Close it and retry.";case 0x80210020:return "The feeder reported multiple sheets. Separate the paper and retry.";case 0x800704C7:case 0x80004004:return "Scanner capture cancelled.";default:return "Windows WIA could not complete capture (0x"+((uint)com.ErrorCode).ToString("X8")+"). Check the scanner and its WIA driver.";}
    }
    [STAThread] static int Main(string[] args) {
        dynamic manager=null;var json=new JavaScriptSerializer();json.MaxJsonLength=262144;
        try{Limit();manager=Com("WIA.DeviceManager");object result;if(args.Length==1&&args[0]=="list")result=Devices(manager);else if(args.Length>0&&args[0]=="capture")result=Capture(manager,args);else throw new InvalidOperationException("Invalid scanner operation.");Console.WriteLine(json.Serialize(new {ok=true,result=result}));return 0;}
        catch(Exception error){Console.WriteLine(json.Serialize(new {ok=false,error=ErrorMessage(error)}));return 1;}
        finally{Release(manager);}
    }
}
