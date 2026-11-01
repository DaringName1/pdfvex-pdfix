// Fixed local text adapter. No document paths, downloads, dictionary registration,
// Add/AutoCorrect calls, or writes to Windows dictionaries.
using System;
using System.IO;
using System.Text;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.ComTypes;
using System.Security.Cryptography;
using System.Threading;
using System.Web.Script.Serialization;

internal static class LocalSpelling {
    const int MaxInput=800000,MaxText=100000,MaxFindings=400,MaxSuggestions=8;
    [ComImport,Guid("8E018A9D-2415-4677-BF08-794EA61F94BB"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface ISpellCheckerFactory {
        void SupportedLanguages(out IEnumString value);
        void IsSupported([MarshalAs(UnmanagedType.LPWStr)] string language,[MarshalAs(UnmanagedType.Bool)] out bool value);
        void CreateSpellChecker([MarshalAs(UnmanagedType.LPWStr)] string language,out ISpellChecker value);
    }
    // Only the first three vtable slots are needed. Omitting later methods makes
    // dictionary mutation unavailable to this adapter.
    [ComImport,Guid("B6FD0B71-E2BC-4653-8D05-F197E412770B"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface ISpellChecker {
        void LanguageTag([MarshalAs(UnmanagedType.LPWStr)] out string value);
        void Check([MarshalAs(UnmanagedType.LPWStr)] string text,out IEnumSpellingError value);
        void Suggest([MarshalAs(UnmanagedType.LPWStr)] string word,out IEnumString value);
    }
    [ComImport,Guid("803E3BD4-2828-4410-8290-418D1D73C762"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IEnumSpellingError { [PreserveSig] int Next(out ISpellingError value); }
    [ComImport,Guid("B7C82D61-FBE8-4B47-9B27-6C0D2E0DE0A3"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface ISpellingError {
        void StartIndex(out uint value);void Length(out uint value);void CorrectiveAction(out int value);
        void Replacement([MarshalAs(UnmanagedType.LPWStr)] out string value);
    }
    [StructLayout(LayoutKind.Sequential)] struct BasicLimit { public long ProcessTime,JobTime;public uint Flags;public UIntPtr MinWorkingSet,MaxWorkingSet;public uint ActiveProcessLimit;public UIntPtr Affinity;public uint Priority,Scheduling; }
    [StructLayout(LayoutKind.Sequential)] struct Counters { public ulong ReadOperations,WriteOperations,OtherOperations,ReadBytes,WriteBytes,OtherBytes; }
    [StructLayout(LayoutKind.Sequential)] struct ExtendedLimit { public BasicLimit Basic;public Counters IO;public UIntPtr ProcessMemory,JobMemory,PeakProcessMemory,PeakJobMemory; }
    [StructLayout(LayoutKind.Sequential)] struct ProcessBasic { public IntPtr Reserved1,Peb,Reserved2,Reserved3,Id,ParentId; }
    [DllImport("kernel32.dll",SetLastError=true)] static extern IntPtr CreateJobObject(IntPtr attributes,string name);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool SetInformationJobObject(IntPtr handle,int info,ref ExtendedLimit limits,uint size);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool AssignProcessToJobObject(IntPtr handle,IntPtr process);
    [DllImport("kernel32.dll",SetLastError=true)] static extern IntPtr OpenProcess(uint access,bool inherit,int pid);
    [DllImport("kernel32.dll")] static extern uint WaitForSingleObject(IntPtr handle,uint milliseconds);
    [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr handle);
    [DllImport("ntdll.dll")] static extern int NtQueryInformationProcess(IntPtr process,int info,out ProcessBasic basic,uint size,out uint returned);
    static void Need(bool value) { if(!value)throw new InvalidOperationException("Invalid local spelling request or Windows provider response."); }
    static void Release(object value) { if(value!=null&&Marshal.IsComObject(value))Marshal.FinalReleaseComObject(value); }
    static string Hash(byte[] bytes) { using(var sha=SHA256.Create())return BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-","").ToLowerInvariant(); }
    static Dictionary<string,object> Object(object value,params string[] keys) {
        var result=value as Dictionary<string,object>;Need(result!=null&&result.Count==keys.Length);foreach(string key in keys)Need(result.ContainsKey(key));return result;
    }
    static bool Tag(string text) { if(text==null||text.Length<2||text.Length>64)return false;foreach(char c in text)if(!(c>='A'&&c<='Z'||c>='a'&&c<='z'||c>='0'&&c<='9'||c=='-'))return false;return true; }
    static bool Text(string text,int maximum,bool empty) {
        if(text==null||text.Length>maximum||!empty&&text.Length==0)return false;
        for(int i=0;i<text.Length;i++){char c=text[i];if(c=='\0')return false;if(Char.IsHighSurrogate(c)){if(i+1>=text.Length||!Char.IsLowSurrogate(text[++i]))return false;}else if(Char.IsLowSurrogate(c))return false;}return true;
    }
    static List<string> Strings(IEnumString values,int maximum,int length) {
        var result=new List<string>();IntPtr fetched=Marshal.AllocCoTaskMem(4);
        try { for(int i=0;i<maximum;i++){var row=new string[1];Marshal.WriteInt32(fetched,0);int hr=values.Next(1,row,fetched);if(hr<0)Marshal.ThrowExceptionForHR(hr);if(Marshal.ReadInt32(fetched)==0)break;Need(Text(row[0],length,false));if(!result.Contains(row[0]))result.Add(row[0]);if(hr==1)break;}return result; }
        finally { Marshal.FreeCoTaskMem(fetched);Release(values); }
    }
    static object Languages(ISpellCheckerFactory factory) {
        IEnumString values;factory.SupportedLanguages(out values);Need(values!=null);var rows=new List<object>();
        foreach(string tag in Strings(values,256,64)){Need(Tag(tag));string label=tag;try{label=CultureInfo.GetCultureInfo(tag).DisplayName;}catch(CultureNotFoundException){}rows.Add(new {tag=tag,label=label});}
        return new {languages=rows,provider="windows-local",notice="Uses installed Windows dictionaries locally. No subscription, download or network request. Languages without an installed spell checker are unavailable."};
    }
    static object Check(ISpellCheckerFactory factory,Dictionary<string,object> request) {
        string language=request["language"] as string,text=request["text"] as string;Need(Tag(language)&&Text(text,MaxText,true));bool supported;factory.IsSupported(language,out supported);
        if(!supported)throw new NotSupportedException("This language has no installed Windows spell checker. Choose an available language. PDFix does not download dictionaries.");
        ISpellChecker checker=null;IEnumSpellingError errors=null;
        try {
            factory.CreateSpellChecker(language,out checker);Need(checker!=null);checker.Check(text,out errors);Need(errors!=null);var findings=new List<object>();bool truncated=false;int previousEnd=0;
            for(int i=0;i<=MaxFindings;i++){
                ISpellingError error=null;int hr=errors.Next(out error);if(hr<0)Marshal.ThrowExceptionForHR(hr);if(error==null)break;
                try {
                    if(i==MaxFindings){truncated=true;break;}uint start,length;int action;error.StartIndex(out start);error.Length(out length);error.CorrectiveAction(out action);
                    Need(start<=(uint)text.Length&&length>0&&length<=(uint)text.Length-start&&start>=(uint)previousEnd&&action>=0&&action<=3);previousEnd=(int)(start+length);if(action==0||length>128)continue;
                    string word=text.Substring((int)start,(int)length);Need(Text(word,128,false));var suggestions=new List<string>();
                    if(action==1){IEnumString values;checker.Suggest(word,out values);Need(values!=null);suggestions=Strings(values,MaxSuggestions,128);}
                    else if(action==2){string replacement;error.Replacement(out replacement);Need(Text(replacement,128,true));suggestions.Add(replacement);}
                    else suggestions.Add("");
                    findings.Add(new {start=(int)start,length=(int)length,word=word,action=action==1?"suggest":action==2?"replace":"delete",suggestions=suggestions});
                } finally {Release(error);}
                if(hr==1)break;
            }
            return new {language=language,findings=findings,truncated=truncated,provider="windows-local"};
        } finally {Release(errors);Release(checker);}
    }
    // Bind parent monitoring to the actual spawning process, then keep its handle
    // (PID reuse cannot detach this watcher). COM state stays on the STA thread.
    static IntPtr Parent(int expected) {
        ProcessBasic basic;uint returned;Need(NtQueryInformationProcess(Process.GetCurrentProcess().Handle,0,out basic,(uint)Marshal.SizeOf(typeof(ProcessBasic)),out returned)==0&&basic.ParentId.ToInt64()==expected);
        IntPtr parent=OpenProcess(0x00100000,false,expected);Need(parent!=IntPtr.Zero&&WaitForSingleObject(parent,0)==258);
        var thread=new Thread(delegate(){WaitForSingleObject(parent,0xffffffff);Environment.Exit(3);});thread.IsBackground=true;thread.Start();return parent;
    }
    [STAThread] static int Main(string[] args) {
        var json=new JavaScriptSerializer();json.MaxJsonLength=MaxInput;json.RecursionLimit=8;ISpellCheckerFactory factory=null;IntPtr job=IntPtr.Zero,parent=IntPtr.Zero;string requestHash="";
        try {
            int parentId=0;Need(args.Length==2&&args[0]=="local-spelling-v1"&&Int32.TryParse(args[1],out parentId));parent=Parent(parentId);
            job=CreateJobObject(IntPtr.Zero,null);var limit=new ExtendedLimit();limit.Basic.Flags=0x2000|0x100|0x8|0x2;limit.Basic.ActiveProcessLimit=1;limit.Basic.ProcessTime=10L*10000000;limit.ProcessMemory=new UIntPtr(256UL*1024*1024);
            Need(job!=IntPtr.Zero&&SetInformationJobObject(job,9,ref limit,(uint)Marshal.SizeOf(limit))&&AssignProcessToJobObject(job,Process.GetCurrentProcess().Handle));
            byte[] bytes;using(var stream=Console.OpenStandardInput())using(var output=new MemoryStream()){var block=new byte[8192];int count;while((count=stream.Read(block,0,block.Length))>0){Need(output.Length+count<=MaxInput);output.Write(block,0,count);}bytes=output.ToArray();}
            requestHash=Hash(bytes);string input=new UTF8Encoding(false,true).GetString(bytes);var parsed=json.DeserializeObject(input) as Dictionary<string,object>;Need(parsed!=null&&parsed.ContainsKey("operation"));string operation=parsed["operation"] as string;
            var request=operation=="languages"?Object(parsed,"version","operation"):Object(parsed,"version","operation","language","text");Need(request["version"] is int&&(int)request["version"]==1&&(operation=="languages"||operation=="check"));
            factory=(ISpellCheckerFactory)Activator.CreateInstance(Type.GetTypeFromCLSID(new Guid("7AB36653-1796-484B-BDFA-E74F1DB7C1DC"),true));
            object result=operation=="languages"?Languages(factory):Check(factory,request);Console.OutputEncoding=new UTF8Encoding(false);Console.Write(json.Serialize(new {version=1,requestSha256=requestHash,ok=true,result=result}));return 0;
        } catch(Exception error) {
            string message=error is NotSupportedException?error.Message:error is COMException?"Windows could not complete local spell checking. Choose an installed language or retry with a smaller text selection.":"The local spelling helper could not complete this request.";
            Console.OutputEncoding=new UTF8Encoding(false);Console.Write(json.Serialize(new {version=1,requestSha256=requestHash,ok=false,error=message}));return 1;
        } finally {Release(factory);if(parent!=IntPtr.Zero)CloseHandle(parent);/* Closing a kill-on-close job ends this process; leave it for process exit. */}
    }
}
