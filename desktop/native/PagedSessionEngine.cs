// Document parser: run only in the broker's capability-free AppContainer and Job.
// One retained qpdf source; a fresh output qpdf object for each requested page.
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Diagnostics;
using System.Globalization;
using System.Runtime.InteropServices;
using Microsoft.Win32.SafeHandles;

internal static class PagedSessionEngine {
    const long OutputLimit = 32L * 1024 * 1024;
    const long MemoryLimit = 480L * 1024 * 1024;
    const uint LoadLibrarySearchDllLoadDir = 0x100, LoadLibrarySearchSystem32 = 0x800;
    const uint FileFlagOpenReparsePoint = 0x200000, FileAttributeReparsePoint = 0x400, FileAttributeDirectory = 0x10;
    const uint FileFlagBackupSemantics = 0x02000000, FileReadAttributes = 0x80;
    const uint OpenedNameInNtNamespace = 0x8 | 0x2;
    const uint GenericRead = 0x80000000, GenericWrite = 0x40000000, FileShareRead = 1, OpenExisting = 3;
    static readonly CultureInfo Invariant = CultureInfo.InvariantCulture;
    static string Request = "OPEN";
    static string Stage = "START";
    static StreamWriter Reply, Diagnostic;
    static int DiagnosticCount;

    sealed class Failure : Exception {
        internal readonly string Code;
        internal Failure(string code) { Code = code; }
    }
    [StructLayout(LayoutKind.Sequential)] struct FileInformation {
        internal uint Attributes;
        internal System.Runtime.InteropServices.ComTypes.FILETIME Created, Accessed, Written;
        internal uint Volume, SizeHigh, SizeLow, Links, IndexHigh, IndexLow;
    }
    [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)] static extern IntPtr LoadLibraryExW(string path, IntPtr file, uint flags);
    [DllImport("kernel32.dll", CharSet=CharSet.Ansi, ExactSpelling=true)] static extern IntPtr GetProcAddress(IntPtr module, string name);
    [DllImport("kernel32.dll")] static extern bool FreeLibrary(IntPtr module);
    [DllImport("kernel32.dll")] static extern IntPtr GetCurrentProcess();
    [DllImport("kernel32.dll")] static extern bool IsProcessInJob(IntPtr process, IntPtr job, out bool included);
    [DllImport("advapi32.dll", SetLastError=true)] static extern bool OpenProcessToken(IntPtr process, uint access, out IntPtr token);
    [DllImport("advapi32.dll", SetLastError=true)] static extern bool GetTokenInformation(IntPtr token, int info, out int value, int size, out int needed);
    [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr handle);
    [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)] static extern SafeFileHandle CreateFileW(string path, uint access, uint share, IntPtr security, uint creation, uint flags, IntPtr template);
    [DllImport("kernel32.dll", SetLastError=true)] static extern bool GetFileInformationByHandle(SafeFileHandle file, out FileInformation information);
    [DllImport("kernel32.dll")] static extern uint GetFileType(SafeFileHandle file);
    [DllImport("kernel32.dll", SetLastError=true)] static extern bool SetStdHandle(int which, IntPtr handle);
    [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)] static extern uint GetFinalPathNameByHandleW(SafeFileHandle file, StringBuilder path, uint size, uint flags);

    [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate IntPtr Init();
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate void Cleanup(ref IntPtr q);
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate void VoidQ(IntPtr q);
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate void SetInt(IntPtr q, int value);
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate int IntQ(IntPtr q);
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate IntPtr PtrQ(IntPtr q);
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate UIntPtr SizeQ(IntPtr q);
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate int Read(IntPtr q, IntPtr path, IntPtr password);
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate uint Page(IntPtr q, UIntPtr index);
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate int AddPage(IntPtr q, IntPtr source, uint page, int first);
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate void Release(IntPtr q, uint page);
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate int GlobalSet(int parameter, uint value);
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate int ErrorCode(IntPtr q, IntPtr error);

    sealed class Api : IDisposable {
        IntPtr Library;
        internal Init New;
        internal Cleanup Delete;
        internal VoidQ Silence;
        internal SetInt SuppressWarnings, Recovery, StreamMode, DecodeLevel, ObjectMode;
        internal IntQ HasError, Empty, Encrypted, PageCount, InitWriteMemory, Write;
        internal PtrQ Buffer;
        internal PtrQ Error;
        internal ErrorCode GetErrorCode;
        internal SizeQ BufferLength, StringLength;
        internal Read Open;
        internal Page GetPage;
        internal AddPage Add;
        internal Release ReleasePage;
        internal GlobalSet Limit;
        internal T Bind<T>(string name) where T : class {
            IntPtr pointer = GetProcAddress(Library, name);
            Require(pointer != IntPtr.Zero, "DLL_INIT");
            return Marshal.GetDelegateForFunctionPointer(pointer, typeof(T)) as T;
        }
        internal Api(string file) {
            Library = LoadLibraryExW(file, IntPtr.Zero, LoadLibrarySearchDllLoadDir | LoadLibrarySearchSystem32);
            Require(Library != IntPtr.Zero, "LOADER");
            try {
                New=Bind<Init>("qpdf_init"); Delete=Bind<Cleanup>("qpdf_cleanup");
                Silence=Bind<VoidQ>("qpdf_silence_errors"); SuppressWarnings=Bind<SetInt>("qpdf_set_suppress_warnings");
                Recovery=Bind<SetInt>("qpdf_set_attempt_recovery"); HasError=Bind<IntQ>("qpdf_has_error");
                Error=Bind<PtrQ>("qpdf_get_error"); GetErrorCode=Bind<ErrorCode>("qpdf_get_error_code");
                Empty=Bind<IntQ>("qpdf_empty_pdf"); Encrypted=Bind<IntQ>("qpdf_is_encrypted"); PageCount=Bind<IntQ>("qpdf_get_num_pages");
                Open=Bind<Read>("qpdf_read"); GetPage=Bind<Page>("qpdf_get_page_n"); Add=Bind<AddPage>("qpdf_add_page");
                ReleasePage=Bind<Release>("qpdf_oh_release"); InitWriteMemory=Bind<IntQ>("qpdf_init_write_memory");
                Write=Bind<IntQ>("qpdf_write"); Buffer=Bind<PtrQ>("qpdf_get_buffer"); BufferLength=Bind<SizeQ>("qpdf_get_buffer_length"); StringLength=Bind<SizeQ>("qpdf_get_last_string_length");
                StreamMode=Bind<SetInt>("qpdf_set_stream_data_mode"); DecodeLevel=Bind<SetInt>("qpdf_set_decode_level");
                ObjectMode=Bind<SetInt>("qpdf_set_object_stream_mode"); Limit=Bind<GlobalSet>("qpdf_global_set_uint32");
            } catch { Dispose(); throw; }
        }
        internal void Check(IntPtr q, string code) {
            if(HasError(q)==0)return;
            IntPtr error=Error(q); Require(HasError(q)==0 && error!=IntPtr.Zero,code);
            int number=GetErrorCode(q,error); Require(HasError(q)==0,code);
            ReportDiagnostic("API",number);
            // Numeric qpdf_e_password only: never obtain PDF-derived error text.
            throw new Failure(number==4?"ENCRYPTED":code);
        }
        internal void Status(IntPtr q, int status, string code) { Check(q, code); Require((status & 2)==0, code); }
        internal IntPtr Create() {
            IntPtr q=New(); Require(q!=IntPtr.Zero, "MEMORY");
            try { Check(q,"DLL_INIT"); Silence(q); Check(q,"DLL_INIT"); SuppressWarnings(q,1); Check(q,"DLL_INIT"); return q; }
            catch { Delete(ref q); throw; }
        }
        internal void ConfigureLimits() {
            // Constants are from the pinned qpdf 12.4.2 Constants.h. Global calls
            // have their own result and do not attach errors to a qpdf_data.
            SetLimit(0x12000,64); SetLimit(0x13000,256); SetLimit(0x13001,64);
            SetLimit(0x13002,1000000); SetLimit(0x13003,5000); SetLimit(0x14000,25);
            SetLimit(0x14020,(uint)OutputLimit); SetLimit(0x14021,128);
            SetLimit(0x14030,(uint)OutputLimit); SetLimit(0x14040,(uint)OutputLimit);
            SetLimit(0x14050,(uint)OutputLimit); SetLimit(0x14060,(uint)OutputLimit);
        }
        void SetLimit(int parameter, uint value) { int result=Limit(parameter,value); Require(result>=0 && result<=0xffff,"DLL_INIT"); }
        public void Dispose() { if(Library!=IntPtr.Zero) { FreeLibrary(Library); Library=IntPtr.Zero; } }
    }

    [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate uint RootQ(IntPtr q);
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate int IntOH(IntPtr q,uint h);
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate double NumberOH(IntPtr q,uint h);
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate IntPtr StringOH(IntPtr q,uint h);
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate uint KeyOH(IntPtr q,uint h,IntPtr key);
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate uint ItemOH(IntPtr q,uint h,int index);
    sealed class Navigation {
        readonly Api api; readonly IntPtr q; readonly int count;
        readonly HashSet<uint> handles=new HashSet<uint>();
        readonly Dictionary<string,int> pages=new Dictionary<string,int>();
        readonly Dictionary<string,uint> names=new Dictionary<string,uint>();
        readonly HashSet<string> ambiguous=new HashSet<string>();
        readonly HashSet<string> visited=new HashSet<string>();
        readonly IntOH IsArray,IsDict,IsString,IsName,IsNumber,IsNull,Length,Id,Gen;
        readonly NumberOH Numeric; readonly StringOH Utf8,Name; readonly KeyOH Key; readonly ItemOH Item; readonly RootQ Root,Null;
        int nodes; bool truncated;
        internal Navigation(Api a,IntPtr source,int pageCount){api=a;q=source;count=pageCount;
            IsArray=a.Bind<IntOH>("qpdf_oh_is_array");IsDict=a.Bind<IntOH>("qpdf_oh_is_dictionary");IsString=a.Bind<IntOH>("qpdf_oh_is_string");IsName=a.Bind<IntOH>("qpdf_oh_is_name");IsNumber=a.Bind<IntOH>("qpdf_oh_is_number");IsNull=a.Bind<IntOH>("qpdf_oh_is_null");Length=a.Bind<IntOH>("qpdf_oh_get_array_n_items");Id=a.Bind<IntOH>("qpdf_oh_get_object_id");Gen=a.Bind<IntOH>("qpdf_oh_get_generation");Numeric=a.Bind<NumberOH>("qpdf_oh_get_numeric_value");Utf8=a.Bind<StringOH>("qpdf_oh_get_utf8_value");Name=a.Bind<StringOH>("qpdf_oh_get_name");Key=a.Bind<KeyOH>("qpdf_oh_get_key");Item=a.Bind<ItemOH>("qpdf_oh_get_array_item");Root=a.Bind<RootQ>("qpdf_get_root");Null=a.Bind<RootQ>("qpdf_oh_new_null");
        }
        uint Hold(uint h){Require(handles.Count<60000,"OUTPUT_LIMIT");handles.Add(h);return h;}
        uint Get(uint h,string key){if(IsDict(q,h)==0)return Hold(Null(q));byte[] b=Encoding.UTF8.GetBytes(key+"\0");IntPtr p=Marshal.AllocHGlobal(b.Length);try{Marshal.Copy(b,0,p,b.Length);return Hold(Key(q,h,p));}finally{Marshal.FreeHGlobal(p);}}
        uint At(uint h,int i){return Hold(Item(q,h,i));}
        string Ref(uint h){return Id(q,h).ToString(Invariant)+":"+Gen(q,h).ToString(Invariant);}
        string Text(uint h){IntPtr p;if(IsString(q,h)!=0)p=Utf8(q,h);else if(IsName(q,h)!=0)p=Name(q,h);else return null;ulong n=api.StringLength(q).ToUInt64();if(p==IntPtr.Zero||n>4096){truncated=true;return null;}byte[] bytes=new byte[(int)n];Marshal.Copy(p,bytes,0,bytes.Length);string s=new UTF8Encoding(false,true).GetString(bytes);if(s.IndexOf('\0')>=0){truncated=true;return null;}return IsName(q,h)!=0&&s.StartsWith("/")?s.Substring(1):s;}
        static string Quote(string s){if(s==null)return "null";StringBuilder b=new StringBuilder("\"");foreach(char c in s){if(c=='"'||c=='\\')b.Append('\\').Append(c);else if(c<32||Char.IsSurrogate(c))b.Append("\\u").Append(((int)c).ToString("x4",Invariant));else b.Append(c);}return b.Append('"').ToString();}
        void Names(uint h,int depth){if(IsDict(q,h)==0)return;if(depth>16||names.Count>=4096){truncated=true;return;}string id=Ref(h);if(Id(q,h)>0&&!visited.Add("names:"+id)){truncated=true;return;}uint pairs=Get(h,"/Names");if(IsArray(q,pairs)!=0){int n=Length(q,pairs);if(n>8192){truncated=true;n=8192;}for(int i=0;i+1<n;i+=2){string name=Text(At(pairs,i));if(name==null)continue;if(names.ContainsKey(name)){ambiguous.Add(name);continue;}names.Add(name,At(pairs,i+1));}}uint kids=Get(h,"/Kids");if(IsArray(q,kids)!=0){int n=Length(q,kids);if(n>256){truncated=true;n=256;}for(int i=0;i<n;i++)Names(At(kids,i),depth+1);}}
        string Destination(uint h,int depth){if(depth>8){truncated=true;return "null";}if(IsDict(q,h)!=0)return Destination(Get(h,"/D"),depth+1);if(IsString(q,h)!=0||IsName(q,h)!=0){string name=Text(h);uint dest;if(name==null||ambiguous.Contains(name))return "null";if(names.TryGetValue(name,out dest))return Destination(dest,depth+1);uint root=Hold(Root(q)),old=Get(root,"/Dests");if(IsDict(q,old)!=0)return Destination(Get(old,"/"+name),depth+1);return "null";}
            if(IsArray(q,h)==0)return "null";int n=Length(q,h);if(n<2||n>6)return "null";uint target=At(h,0);int page;if(IsDict(q,target)==0||Id(q,target)<=0||!pages.TryGetValue(Ref(target),out page)||ambiguous.Contains("page:"+Ref(target)))return "null";string kind=Text(At(h,1));int args=kind=="XYZ"?3:kind=="FitR"?4:kind=="FitH"||kind=="FitBH"||kind=="FitV"||kind=="FitBV"?1:kind=="Fit"||kind=="FitB"?0:-1;if(args<0||n!=args+2)return "null";StringBuilder b=new StringBuilder("[").Append(page).Append(',').Append(Quote(kind));for(int i=2;i<n;i++){uint value=At(h,i);if(IsNull(q,value)!=0){if(kind=="FitR")return "null";b.Append(",null");continue;}if(IsNumber(q,value)==0)return "null";double number=Numeric(q,value);if(Double.IsNaN(number)||Double.IsInfinity(number)||Math.Abs(number)>100000000||kind=="XYZ"&&i==4&&(number<0||number>64))return "null";b.Append(',').Append(number.ToString("R",Invariant));}return b.Append(']').ToString();
        }
        sealed class LabelRule {internal string Prefix,Style;internal int Start;}
        void LabelTree(uint h,int depth,SortedDictionary<int,LabelRule> rules,ref int visits,ref bool valid){
            if(!valid)return;
            if(IsDict(q,h)==0||depth>16||++visits>4000){valid=false;return;}
            if(Id(q,h)>0&&!visited.Add("labels:"+Ref(h))){valid=false;return;}
            uint nums=Get(h,"/Nums");
            if(IsArray(q,nums)!=0){int n=Length(q,nums);if(n>4000||n%2!=0){valid=false;return;}for(int i=0;i<n;i+=2){
                uint index=At(nums,i),rule=At(nums,i+1);if(IsNumber(q,index)==0||IsDict(q,rule)==0){valid=false;return;}
                double number=Numeric(q,index);if(Double.IsNaN(number)||Double.IsInfinity(number)||number!=Math.Floor(number)||number<0||number>=count||rules.ContainsKey((int)number)){valid=false;return;}
                uint style=Get(rule,"/S"),prefix=Get(rule,"/P"),start=Get(rule,"/St");string s=IsNull(q,style)!=0?"":Text(style),p=IsNull(q,prefix)!=0?"":Text(prefix);double first=IsNull(q,start)!=0?1:IsNumber(q,start)!=0?Numeric(q,start):Double.NaN;
                if(IsNull(q,style)==0&&IsName(q,style)==0||s==null||!(s==""||s=="D"||s=="R"||s=="r"||s=="A"||s=="a")||p==null||p.Length>256||IsNull(q,prefix)==0&&IsString(q,prefix)==0||Double.IsNaN(first)||Double.IsInfinity(first)||first!=Math.Floor(first)||first<1||first>1000000){valid=false;return;}
                rules.Add((int)number,new LabelRule{Prefix=p,Style=s,Start=(int)first});
            }}else if(IsNull(q,nums)==0){valid=false;return;}
            uint kids=Get(h,"/Kids");if(IsArray(q,kids)!=0){int n=Length(q,kids);if(n>256){valid=false;return;}for(int i=0;i<n;i++)LabelTree(At(kids,i),depth+1,rules,ref visits,ref valid);}else if(IsNull(q,kids)==0)valid=false;
        }
        static string LabelNumber(int value,string style){
            if(style=="")return "";if(style=="D")return value.ToString(Invariant);
            if(style=="A"||style=="a"){int repeat=(value-1)/26+1;if(repeat>256)return null;return new String((char)((style=="A"?'A':'a')+(value-1)%26),repeat);}
            if(value>3999)return null;int[] amounts={1000,900,500,400,100,90,50,40,10,9,5,4,1};string[] symbols={"M","CM","D","CD","C","XC","L","XL","X","IX","V","IV","I"};StringBuilder b=new StringBuilder();for(int i=0;i<amounts.Length;i++)while(value>=amounts[i]){b.Append(symbols[i]);value-=amounts[i];}return style=="r"?b.ToString().ToLowerInvariant():b.ToString();
        }
        string Labels(uint root){
            uint tree=Get(root,"/PageLabels");if(IsNull(q,tree)!=0)return "null";
            SortedDictionary<int,LabelRule> rules=new SortedDictionary<int,LabelRule>();bool valid=true;int visits=0;LabelTree(tree,0,rules,ref visits,ref valid);
            if(!valid||!rules.ContainsKey(0)){truncated=true;return "null";}
            List<KeyValuePair<int,LabelRule>> rows=new List<KeyValuePair<int,LabelRule>>(rules);StringBuilder result=new StringBuilder("[");int range=0,characters=0;
            for(int i=0;i<count;i++){while(range+1<rows.Count&&rows[range+1].Key<=i)range++;LabelRule rule=rows[range].Value;string number=LabelNumber(rule.Start+i-rows[range].Key,rule.Style);if(number==null){truncated=true;return "null";}string label=rule.Prefix+number;if((characters+=Encoding.UTF8.GetByteCount(label))>1048576){truncated=true;return "null";}if(i>0)result.Append(',');result.Append(Quote(label));if(result.Length>1048576){truncated=true;return "null";}}
            return result.Append(']').ToString();
        }

        string ActionDestination(uint dictionary){uint dest=Get(dictionary,"/Dest"),action=Get(dictionary,"/A");if(IsNull(q,Get(dictionary,"/AA"))==0)return "null";if(IsNull(q,action)!=0)return Destination(dest,0);if(IsDict(q,action)==0||IsNull(q,dest)==0||Text(Get(action,"/S"))!="GoTo"||IsNull(q,Get(action,"/Next"))==0)return "null";return Destination(Get(action,"/D"),0);}
        string Outline(uint first,int depth){StringBuilder b=new StringBuilder("[");uint h=first;bool comma=false;while(IsDict(q,h)!=0){if(depth>20||nodes++>=1000){truncated=true;break;}string id=Ref(h);if(Id(q,h)<=0||!visited.Add("outline:"+id)){truncated=true;break;}string title=Text(Get(h,"/Title")),dest=ActionDestination(h);if(comma)b.Append(',');comma=true;b.Append("{\"title\":").Append(Quote(title??"Untitled bookmark")).Append(",\"dest\":").Append(dest).Append(",\"items\":").Append(Outline(Get(h,"/First"),depth+1)).Append('}');h=Get(h,"/Next");}return b.Append(']').ToString();}
        string Links(int physical){
            uint page=Hold(api.GetPage(q,new UIntPtr((uint)(physical-1)))),array=Get(page,"/Annots");StringBuilder rows=new StringBuilder("[");bool comma=false;
            if(IsArray(q,array)!=0){int n=Length(q,array);if(n>1000){truncated=true;n=1000;}for(int i=0;i<n;i++){
                uint annotation=At(array,i);if(IsDict(q,annotation)==0||Text(Get(annotation,"/Subtype"))!="Link")continue;
                uint flag=Get(annotation,"/F");double flags=IsNull(q,flag)!=0?0:IsNumber(q,flag)!=0?Numeric(q,flag):Double.NaN;
                if(Double.IsNaN(flags)||Double.IsInfinity(flags)||flags<0||flags>Int32.MaxValue||flags!=Math.Floor(flags)){truncated=true;continue;}if(((int)flags&(1|2|32))!=0)continue;
                uint rect=Get(annotation,"/Rect");if(IsArray(q,rect)==0||Length(q,rect)!=4){truncated=true;continue;}double[] box=new double[4];bool valid=true;for(int j=0;j<4;j++){uint v=At(rect,j);if(IsNumber(q,v)==0){valid=false;break;}box[j]=Numeric(q,v);if(Double.IsNaN(box[j])||Double.IsInfinity(box[j])||Math.Abs(box[j])>100000000)valid=false;}if(!valid||box[2]<=box[0]||box[3]<=box[1]){truncated=true;continue;}
                string dest=ActionDestination(annotation);if(dest=="null"){truncated=true;continue;}
                if(comma)rows.Append(',');comma=true;rows.Append("{\"id\":").Append(Quote("native-page-"+physical+"-link-"+i)).Append(",\"subtype\":\"Link\",\"rect\":[");for(int j=0;j<4;j++){if(j>0)rows.Append(',');rows.Append(box[j].ToString("R",Invariant));}rows.Append("],\"annotationFlags\":").Append(((int)flags).ToString(Invariant)).Append(",\"dest\":").Append(dest).Append('}');
            }}else if(IsNull(q,array)==0)truncated=true;
            return "{\"version\":1,\"page\":"+physical.ToString(Invariant)+",\"links\":"+rows.Append(']').ToString()+",\"truncated\":"+(truncated?"true":"false")+"}";
        }
        internal byte[] Read(int requestedPage){try{
            if(count>25000){truncated=true;return Encoding.UTF8.GetBytes(requestedPage==0?"{\"version\":1,\"outline\":[],\"truncated\":true}":"{\"version\":1,\"page\":"+requestedPage+",\"links\":[],\"truncated\":true}");}
            for(int i=0;i<count;i++){uint page=Hold(api.GetPage(q,new UIntPtr((uint)i)));string id=Ref(page);if(pages.ContainsKey(id))ambiguous.Add("page:"+id);else pages.Add(id,i);}
            uint root=Hold(Root(q));Names(Get(Get(root,"/Names"),"/Dests"),0);string json;
            if(requestedPage>0)json=Links(requestedPage);else{string outline=Outline(Get(Get(root,"/Outlines"),"/First"),0),labels=Labels(root);json="{\"version\":1,\"outline\":"+outline+",\"labels\":"+labels+",\"truncated\":"+(truncated?"true":"false")+"}";}
            api.Check(q,"PARSE");byte[] result=Encoding.UTF8.GetBytes(json);Require(result.Length<=2*1024*1024,"OUTPUT_LIMIT");return result;
        }finally{foreach(uint h in handles)api.ReleasePage(q,h);api.Check(q,"PARSE");}}

    }

    static void Require(bool value, string code) { if(!value)throw new Failure(code); }
    static void ReportDiagnostic(string kind, int number) {
        // Only fixed stage identifiers and numeric codes. Never retrieve native
        // error messages, PDF strings, filenames, or exception messages.
        if(Diagnostic==null || DiagnosticCount++>=2)return;
        try { Diagnostic.WriteLine("PDFIX_PAGED_"+kind+":"+Stage+":"+number.ToString(Invariant)); }
        catch { }
    }
    static void CheckContainment() {
        bool inJob; IntPtr token=IntPtr.Zero; int contained,needed;
        Require(IsProcessInJob(GetCurrentProcess(),IntPtr.Zero,out inJob) && inJob,"LOADER");
        try {
            Require(OpenProcessToken(GetCurrentProcess(),8,out token),"LOADER");
            Require(GetTokenInformation(token,29,out contained,4,out needed) && needed==4 && contained==1,"LOADER");
        } finally { if(token!=IntPtr.Zero)CloseHandle(token); }
    }
    static void NoReparse(string path, string boundary) {
        // The broker verifies ancestors before applying capability-free ACLs.
        // The child may inspect only its staged tree; ancestor attribute queries
        // are intentionally denied by AppContainer and are not parser work.
        for(string current=path; !String.IsNullOrEmpty(current); current=Path.GetDirectoryName(current)) {
            Require((File.GetAttributes(current)&FileAttributes.ReparsePoint)==0,"SOURCE_CHANGED");
            if(String.Equals(current,boundary,StringComparison.OrdinalIgnoreCase))return;
        }
        throw new Failure("SOURCE_CHANGED");
    }
    static FileInformation FileIdentity(SafeFileHandle file, string context) {
        FileInformation info=new FileInformation();
        Stage=context+"_ID_HANDLE"; Require(!file.IsInvalid,"SOURCE_CHANGED");
        Stage=context+"_ID_TYPE"; Require(GetFileType(file)==1,"SOURCE_CHANGED");
        Stage=context+"_ID_INFO"; Require(GetFileInformationByHandle(file,out info),"SOURCE_CHANGED");
        Stage=context+"_ID_REPARSE";
        if((info.Attributes&FileAttributeReparsePoint)!=0) { ReportFileDiagnostic(context,info); throw new Failure("SOURCE_CHANGED"); }
        Stage=context+"_ID_DIRECTORY";
        if((info.Attributes&FileAttributeDirectory)!=0) { ReportFileDiagnostic(context,info); throw new Failure("SOURCE_CHANGED"); }
        Stage=context+"_ID_LINKS";
        if(info.Links!=1) { ReportFileDiagnostic(context,info); throw new Failure("SOURCE_CHANGED"); }
        return info;
    }
    static void ReportFileDiagnostic(string context, FileInformation info) {
        if(Diagnostic==null || DiagnosticCount++>=2)return;
        try { Diagnostic.WriteLine("PDFIX_PAGED_FILE:"+context+":"+info.Attributes.ToString(Invariant)+":"+info.Links.ToString(Invariant)); }
        catch { }
    }
    static bool SameIdentity(FileInformation a, FileInformation b) {
        return a.Volume==b.Volume && a.IndexHigh==b.IndexHigh && a.IndexLow==b.IndexLow;
    }
    static string HandleName(SafeFileHandle handle, string context) {
        StringBuilder resolved=new StringBuilder(32768);
        Stage=context+"_FINAL_PATH";
        // DOS-volume translation can require Mount Manager access denied to an
        // AppContainer. Bind opened handles in the NT namespace instead, without
        // granting access to ancestors or a second drive/device namespace.
        uint size=GetFinalPathNameByHandleW(handle,resolved,(uint)resolved.Capacity,OpenedNameInNtNamespace);
        Require(size>0 && size<resolved.Capacity,"SOURCE_CHANGED");
        string name=resolved.ToString();
        Require(name.StartsWith("\\Device\\",StringComparison.OrdinalIgnoreCase),"SOURCE_CHANGED");
        return name;
    }
    static SafeFileHandle PinDirectory(string folder) {
        Stage="DIRECTORY_PIN";
        SafeFileHandle handle=CreateFileW(folder,FileReadAttributes,3,IntPtr.Zero,OpenExisting,FileFlagOpenReparsePoint|FileFlagBackupSemantics,IntPtr.Zero);
        try {
            FileInformation info=new FileInformation();
            Require(!handle.IsInvalid && GetFileInformationByHandle(handle,out info),"SOURCE_CHANGED");
            Require((info.Attributes&FileAttributeDirectory)!=0 && (info.Attributes&FileAttributeReparsePoint)==0,"SOURCE_CHANGED");
            return handle;
        } catch { handle.Dispose(); throw; }
    }
    static FileStream PinFile(string path, bool write, string directoryName) {
        Stage=write?"OUTPUT_PIN":"INPUT_PIN";
        SafeFileHandle handle=CreateFileW(path,GenericRead|(write?GenericWrite:0),FileShareRead,IntPtr.Zero,OpenExisting,FileFlagOpenReparsePoint,IntPtr.Zero);
        try {
            Require(!handle.IsInvalid,"SOURCE_CHANGED");
            FileIdentity(handle,write?"OUTPUT":"INPUT");
            string resolved=HandleName(handle,write?"OUTPUT":"INPUT");
            Stage=write?"OUTPUT_FINAL_MATCH":"INPUT_FINAL_MATCH";
            Require(String.Equals(resolved,directoryName+"\\"+Path.GetFileName(path),StringComparison.OrdinalIgnoreCase),"SOURCE_CHANGED");
            return new FileStream(handle,write?FileAccess.ReadWrite:FileAccess.Read,65536,false);
        } catch { handle.Dispose(); throw; }
    }
    static string ReadCommand(Stream input) {
        StringBuilder text=new StringBuilder(128);
        while(true) {
            int value=input.ReadByte();
            if(value<0) { Require(text.Length==0,"PROTOCOL"); return null; }
            if(value==10)return text.ToString();
            // Accept CRLF, but reject embedded CR, all non-ASCII and controls.
            if(value==13) { Require(input.ReadByte()==10,"PROTOCOL"); return text.ToString(); }
            Require(value>=32 && value<=126 && text.Length<128,"PROTOCOL"); text.Append((char)value);
        }
    }
    static int ParseCommand(string command, int count) {
        Require(command!=null,"PROTOCOL");
        string[] parts=command.Split(':'); Guid id; int page;
        Require(parts.Length==3 && parts[0]=="PAGE" && parts[1].Length==36 && Guid.TryParseExact(parts[1],"D",out id),"PROTOCOL");
        Request=parts[1].ToLowerInvariant();
        Require(parts[2].Length>0 && parts[2].Length<=10 && parts[2][0]>='1' && parts[2][0]<='9',"PROTOCOL");
        foreach(char c in parts[2])Require(c>='0' && c<='9',"PROTOCOL");
        Require(Int32.TryParse(parts[2],NumberStyles.None,Invariant,out page) && page>0 && page<=count,"INVALID_PAGE");
        return page;
    }
    static long PrivateBytes() {
        Stage="MEMORY";
        using(Process process=Process.GetCurrentProcess()) { process.Refresh(); long bytes=process.PrivateMemorySize64; Require(bytes>0 && bytes<MemoryLimit,"MEMORY"); return bytes; }
    }
    static long Extract(Api api, IntPtr source, int page, FileStream output, FileInformation original) {
        IntPtr destination=IntPtr.Zero; uint handle=0;
        try {
            PrivateBytes(); Require(SameIdentity(original,FileIdentity(output.SafeFileHandle,"OUTPUT")),"SOURCE_CHANGED");
            output.SetLength(0); output.Position=0;
            destination=api.Create(); api.Status(destination,api.Empty(destination),"PARSE");
            handle=api.GetPage(source,new UIntPtr((uint)(page-1))); api.Check(source,"PARSE"); Require(handle!=0,"PARSE");
            int addStatus=api.Add(destination,source,handle,0); api.Check(source,"PARSE"); api.Status(destination,addStatus,"PARSE");
            api.ReleasePage(source,handle); api.Check(source,"PARSE"); handle=0;
            api.Status(destination,api.InitWriteMemory(destination),"OUTPUT");
            api.StreamMode(destination,1); api.Check(destination,"OUTPUT"); // qpdf_s_preserve
            api.DecodeLevel(destination,0); api.Check(destination,"OUTPUT"); // qpdf_dl_none
            api.ObjectMode(destination,0); api.Check(destination,"OUTPUT"); // qpdf_o_disable
            api.Status(destination,api.Write(destination),"OUTPUT"); api.Check(source,"PARSE");
            ulong length=api.BufferLength(destination).ToUInt64(); api.Check(destination,"OUTPUT");
            Require(length>0 && length<=(ulong)OutputLimit,"OUTPUT_LIMIT");
            IntPtr buffer=api.Buffer(destination); api.Check(destination,"OUTPUT"); Require(buffer!=IntPtr.Zero,"OUTPUT");
            byte[] chunk=new byte[65536]; long offset=0;
            while(offset<(long)length) {
                int size=(int)Math.Min(chunk.Length,(long)length-offset);
                Marshal.Copy(new IntPtr(buffer.ToInt64()+offset),chunk,0,size); output.Write(chunk,0,size); offset+=size;
            }
            output.Flush(true); Require(output.Length==(long)length && SameIdentity(original,FileIdentity(output.SafeFileHandle,"OUTPUT")),"SOURCE_CHANGED");
            return (long)length;
        } finally {
            // Errors terminate the process; no uncertain source state is reused.
            if(handle!=0) { api.ReleasePage(source,handle); api.Check(source,"PARSE"); }
            if(destination!=IntPtr.Zero)api.Delete(ref destination);
        }
    }
    static int Run(string[] args) {
        Stage="CONTAINMENT";
        Require(args.Length==1,"PROTOCOL"); CheckContainment();
        Stage="PATH";
        string folder=Path.GetFullPath(args[0]);
        Require(Path.IsPathRooted(args[0]) && String.Equals(args[0],folder,StringComparison.OrdinalIgnoreCase) && folder.Length>3 && folder[1]==':' && folder[2]=='\\',"PROTOCOL");
        NoReparse(folder,folder); Require((File.GetAttributes(folder)&FileAttributes.Directory)!=0,"SOURCE_CHANGED");
        string inputPath=Path.Combine(folder,"input.pdf"), outputPath=Path.Combine(folder,"output.pdf");
        string runtime=Path.Combine(folder,"_sandbox-runtime"), library=Path.Combine(runtime,"qpdf30.dll");
        NoReparse(library,folder);
        using(Stream commands=Console.OpenStandardInput()) {
            Stage="HANDSHAKE";
            Require(ReadCommand(commands)=="PDFix.Paged.Session.v1","PROTOCOL");
            Stage="FILE_OPEN";
            using(SafeFileHandle directory=PinDirectory(folder)) {
            string directoryName=HandleName(directory,"DIRECTORY").TrimEnd('\\');
            using(FileStream input=PinFile(inputPath,false,directoryName))
            using(FileStream output=PinFile(outputPath,true,directoryName))
            using(Api api=new Api(library)) {
                FileInformation inputIdentity=FileIdentity(input.SafeFileHandle,"INPUT"), outputIdentity=FileIdentity(output.SafeFileHandle,"OUTPUT");
                Stage="SLOT_IDENTITY";
                Require(!SameIdentity(inputIdentity,outputIdentity),"SOURCE_CHANGED");
                // The broker owns and reuses this precreated slot after a canceled
                // session. Its pinned identity is validated before any truncation.
                Stage="SLOT_RESET"; output.SetLength(0); output.Position=0;
                Require(output.Length==0 && SameIdentity(outputIdentity,FileIdentity(output.SafeFileHandle,"OUTPUT")),"SOURCE_CHANGED");
                Stage="LIMITS"; api.ConfigureLimits(); IntPtr source=IntPtr.Zero, utf8=IntPtr.Zero;
                try {
                    Stage="INIT";
                    source=api.Create(); api.Recovery(source,0); api.Check(source,"PARSE");
                    byte[] pathBytes=new UTF8Encoding(false,true).GetBytes(inputPath+"\0");
                    utf8=Marshal.AllocHGlobal(pathBytes.Length); Marshal.Copy(pathBytes,0,utf8,pathBytes.Length);
                    Stage="READ"; api.Status(source,api.Open(source,utf8,IntPtr.Zero),"PARSE");
                    Marshal.FreeHGlobal(utf8); utf8=IntPtr.Zero;
                    Stage="ENCRYPTED"; int encrypted=api.Encrypted(source); api.Check(source,"PARSE"); Require(encrypted==0,"ENCRYPTED");
                    Stage="PAGECOUNT"; int count=api.PageCount(source); api.Check(source,"PARSE"); Require(count>0,"PARSE");
                    PrivateBytes(); Reply.WriteLine("PDFIX_PAGED:READY:"+count.ToString(Invariant)+":"+Process.GetCurrentProcess().Id.ToString(Invariant));
                    while(true) {
                        Request="OPEN"; string command=ReadCommand(commands);
                        if(command=="CLOSE" || command==null)return 0;
                        Stage="PAGE";
                        if(command.StartsWith("NAV:")) {
                            string[] parts=command.Split(':');Guid token;Require(parts.Length==3&&Guid.TryParseExact(parts[1],"D",out token),"PROTOCOL");Request=parts[1].ToLowerInvariant();int navPage;Require(Int32.TryParse(parts[2],NumberStyles.None,Invariant,out navPage)&&navPage>=0&&navPage<=count,"INVALID_PAGE");
                            Require(SameIdentity(inputIdentity,FileIdentity(input.SafeFileHandle,"INPUT"))&&SameIdentity(outputIdentity,FileIdentity(output.SafeFileHandle,"OUTPUT")),"SOURCE_CHANGED");
                            byte[] nav=new Navigation(api,source,count).Read(navPage);output.SetLength(0);output.Position=0;output.Write(nav,0,nav.Length);output.Flush(true);
                            Reply.WriteLine("PDFIX_PAGED:NAV:"+Request+":"+nav.Length.ToString(Invariant)+":"+PrivateBytes().ToString(Invariant));continue;
                        }
                        int page=ParseCommand(command,count);
                        Require(SameIdentity(inputIdentity,FileIdentity(input.SafeFileHandle,"INPUT")),"SOURCE_CHANGED");
                        long bytes=Extract(api,source,page,output,outputIdentity);
                        Reply.WriteLine("PDFIX_PAGED:PAGE:"+Request+":"+page.ToString(Invariant)+":"+bytes.ToString(Invariant)+":"+PrivateBytes().ToString(Invariant));
                    }
                } finally { if(utf8!=IntPtr.Zero)Marshal.FreeHGlobal(utf8); if(source!=IntPtr.Zero)api.Delete(ref source); }
            }
            }
        }
    }
    static int Main(string[] args) {
        Console.SetError(TextWriter.Null);
        // Retain only this controlled writer to the inherited diagnostic pipe.
        // An AppContainer cannot necessarily open the NUL device. Detach the
        // native standard-error handle before loading any parser DLL instead;
        // no extra device/file permission or unrestricted parser is needed.
        try { Diagnostic=new StreamWriter(Console.OpenStandardError(),new UTF8Encoding(false,true),1024); Diagnostic.AutoFlush=true; Diagnostic.NewLine="\n"; }
        catch { Diagnostic=null; }
        try {
            Reply=new StreamWriter(Console.OpenStandardOutput(),new UTF8Encoding(false,true),1024); Reply.AutoFlush=true; Reply.NewLine="\n";
            try {
                Stage="STDERR";
                Require(SetStdHandle(-12,IntPtr.Zero),"LOADER");
                return Run(args);
            }
            catch(Failure error) { ReportDiagnostic("REJECT",Marshal.GetLastWin32Error()); Reply.WriteLine("PDFIX_PAGED:ERROR:"+Request+":"+error.Code); return 1; }
            catch(OutOfMemoryException) { Reply.WriteLine("PDFIX_PAGED:ERROR:"+Request+":MEMORY"); return 1; }
            catch(Exception error) { ReportDiagnostic("HOST",error.HResult); Reply.WriteLine("PDFIX_PAGED:ERROR:"+Request+":PARSE"); return 1; }
        } catch { return 1; }
    }
}
