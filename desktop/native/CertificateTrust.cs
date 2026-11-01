// Fixed offline trust adapter. No PDF parser, paths, URLs, private keys or writes
// to Windows certificate stores. CMS certificates are candidates, never anchors.
using System;
using System.IO;
using System.Text;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Web.Script.Serialization;

internal static class CertificateTrust {
    const int MaxInput=6*1024*1024;
    static IntPtr job;
    [StructLayout(LayoutKind.Sequential)] struct BasicLimit { public long ProcessTime,JobTime; public uint Flags; public UIntPtr MinWorkingSet,MaxWorkingSet; public uint ActiveProcessLimit; public UIntPtr Affinity; public uint Priority,Scheduling; }
    [StructLayout(LayoutKind.Sequential)] struct Counters { public ulong ReadOperations,WriteOperations,OtherOperations,ReadBytes,WriteBytes,OtherBytes; }
    [StructLayout(LayoutKind.Sequential)] struct ExtendedLimit { public BasicLimit Basic; public Counters IO; public UIntPtr ProcessMemory,JobMemory,PeakProcessMemory,PeakJobMemory; }
    [DllImport("kernel32.dll",SetLastError=true)] static extern IntPtr CreateJobObject(IntPtr attributes,string name);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool SetInformationJobObject(IntPtr handle,int info,ref ExtendedLimit limits,uint size);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool AssignProcessToJobObject(IntPtr handle,IntPtr process);
    [StructLayout(LayoutKind.Sequential)] struct TrustStatus { public uint Error,Info; }
    [StructLayout(LayoutKind.Sequential)] struct Usage { public uint Count; public IntPtr Identifiers; }
    [StructLayout(LayoutKind.Sequential)] struct UsageMatch { public uint Type; public Usage Usage; }
    [StructLayout(LayoutKind.Sequential)] struct ChainParameters { public uint Size; public UsageMatch RequestedUsage,RequestedIssuance; public uint Timeout; public int CheckFreshness; public uint Freshness; public IntPtr CacheResync,StrongSign; public uint StrongFlags; }
    [StructLayout(LayoutKind.Sequential)] struct ChainContext { public uint Size; public TrustStatus Trust; public uint Count; public IntPtr Chains; public uint LowerCount; public IntPtr Lower; public int FreshnessPresent; public uint Freshness,Flags; public Guid Id; }
    [StructLayout(LayoutKind.Sequential)] struct SimpleChain { public uint Size; public TrustStatus Trust; public uint Count; public IntPtr Elements,TrustList; public int FreshnessPresent; public uint Freshness; }
    [StructLayout(LayoutKind.Sequential)] struct ChainElement { public uint Size; public IntPtr Certificate; public TrustStatus Trust; public IntPtr Revocation,Issuance,Application,ExtendedError; }
    [StructLayout(LayoutKind.Sequential)] struct PolicyParameters { public uint Size,Flags; public IntPtr Extra; }
    [StructLayout(LayoutKind.Sequential)] struct PolicyStatus { public uint Size,Error; public int ChainIndex,ElementIndex; public IntPtr Extra; }
    [DllImport("crypt32.dll",SetLastError=true)] static extern IntPtr CertOpenStore(IntPtr provider,uint encoding,IntPtr crypt,uint flags,IntPtr parameters);
    [DllImport("crypt32.dll",SetLastError=true)] static extern bool CertCloseStore(IntPtr store,uint flags);
    [DllImport("crypt32.dll",SetLastError=true)] static extern bool CertAddCertificateContextToStore(IntPtr store,IntPtr certificate,uint disposition,IntPtr output);
    [DllImport("crypt32.dll",SetLastError=true)] static extern bool CertGetCertificateChain(IntPtr engine,IntPtr certificate,ref long time,IntPtr store,ref ChainParameters parameters,uint flags,IntPtr reserved,out IntPtr chain);
    [DllImport("crypt32.dll")] static extern void CertFreeCertificateChain(IntPtr chain);
    [DllImport("crypt32.dll",SetLastError=true)] static extern bool CertVerifyCertificateChainPolicy(IntPtr policy,IntPtr chain,ref PolicyParameters parameters,ref PolicyStatus status);
    static void Need(bool condition) { if(!condition)throw new InvalidOperationException("Offline certificate-chain inspection could not safely complete."); }
    static void Limit() {
        job=CreateJobObject(IntPtr.Zero,null);var limits=new ExtendedLimit();
        limits.Basic.Flags=0x2000|0x100|0x8|0x2; // kill-on-close, memory, one process, CPU time
        limits.Basic.ActiveProcessLimit=1;limits.Basic.ProcessTime=15L*10000000;limits.ProcessMemory=new UIntPtr(256UL*1024*1024);
        Need(job!=IntPtr.Zero&&SetInformationJobObject(job,9,ref limits,(uint)Marshal.SizeOf(limits))&&AssignProcessToJobObject(job,Process.GetCurrentProcess().Handle));
    }
    static T Structure<T>(IntPtr value) { Need(value!=IntPtr.Zero);return (T)Marshal.PtrToStructure(value,typeof(T)); }
    static string Hash(byte[] bytes) { using(var sha=SHA256.Create())return BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-","").ToLowerInvariant(); }
    static string Clean(string text) { var result=new StringBuilder();foreach(char c in text??""){if(result.Length>=2000)break;result.Append(c<32||c==127||c>=0x202A&&c<=0x202E||c>=0x2066&&c<=0x2069||Char.IsSurrogate(c)?' ':c);}return result.ToString(); }
    static string Date(DateTime time) { return time.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'",CultureInfo.InvariantCulture); }
    static string Hex(uint value) { return "0x"+value.ToString("X8",CultureInfo.InvariantCulture); }
    static Dictionary<string,object> Object(object value,params string[] keys) {
        var result=value as Dictionary<string,object>;Need(result!=null&&result.Count==keys.Length);foreach(string key in keys)Need(result.ContainsKey(key));return result;
    }
    static string StringValue(object value) { Need(value is string);return (string)value; }
    static bool Fingerprint(string value) { if(value.Length!=64)return false;foreach(char c in value)if(!(c>='0'&&c<='9'||c>='a'&&c<='f'))return false;return true; }
    static byte[] CertificateBytes(object value) {
        string encoded=StringValue(value);Need(encoded.Length>=4&&encoded.Length<=87384);byte[] bytes=Convert.FromBase64String(encoded);
        Need(bytes.Length>=2&&bytes.Length<=65536&&Convert.ToBase64String(bytes)==encoded&&bytes[0]==48);
        int header=2,length=bytes[1];if((length&128)!=0){int count=length&127;Need(count>=1&&count<=3&&bytes.Length>=2+count&&bytes[2]!=0);header+=count;length=0;for(int i=2;i<header;i++)length=length*256+bytes[i];Need(length>=128);}Need(header+length==bytes.Length);return bytes;
    }
    static HashSet<string> LocalRoots() {
        var roots=new HashSet<string>(StringComparer.Ordinal);
        foreach(StoreLocation location in new[]{StoreLocation.CurrentUser,StoreLocation.LocalMachine}){
            using(var store=new X509Store(StoreName.Root,location)){
                store.Open(OpenFlags.ReadOnly|OpenFlags.OpenExistingOnly);var certificates=store.Certificates;Need(certificates.Count<=20000);
                foreach(var certificate in certificates){try{roots.Add(Hash(certificate.RawData));}finally{certificate.Reset();}}
            }
        }
        return roots;
    }
    static object Inspect(Dictionary<string,object> request,HashSet<string> roots) {
        Need(request["index"] is int);int index=(int)request["index"];Need(index>=1&&index<=32);
        string fingerprint=StringValue(request["signerFingerprintSha256"]);Need(Fingerprint(fingerprint));
        var encoded=request["certificates"] as object[];Need(encoded!=null&&encoded.Length>=1&&encoded.Length<=32);
        var certificates=new List<X509Certificate2>();IntPtr store=IntPtr.Zero,context=IntPtr.Zero;int total=0;var seen=new HashSet<string>();
        try {
            foreach(object item in encoded){byte[] bytes=CertificateBytes(item);total+=bytes.Length;Need(total<=131072&&seen.Add(Hash(bytes))&&X509Certificate2.GetCertContentType(bytes)==X509ContentType.Cert);var certificate=new X509Certificate2(bytes);Need(Hash(certificate.RawData)==Hash(bytes));certificates.Add(certificate);}
            Need(Hash(certificates[0].RawData)==fingerprint);
            store=CertOpenStore(new IntPtr(2),0,IntPtr.Zero,0x2000,IntPtr.Zero);Need(store!=IntPtr.Zero); // NEW memory store only
            foreach(var certificate in certificates)Need(CertAddCertificateContextToStore(store,certificate.Handle,4,IntPtr.Zero));
            var parameters=new ChainParameters();parameters.Size=(uint)Marshal.SizeOf(parameters);parameters.Timeout=1;
            DateTime checkedAt=DateTime.UtcNow;long time=checkedAt.ToFileTimeUtc();
            // CACHE_ONLY covers CTLs/issuers/third-party roots; it does NOT cover
            // revocation, hence the separate cache-only bit. No revocation-check
            // flag is enabled. DISABLE_AIA and DISABLE_AUTH_ROOT_AUTO_UPDATE are
            // explicit even where cache-only overlaps. No peer trust flag.
            const uint flags=0x4|0x100|0x2000|0x80000000|0x10000;
            Need(CertGetCertificateChain(IntPtr.Zero,certificates[0].Handle,ref time,store,ref parameters,flags,IntPtr.Zero,out context));
            var chain=Structure<ChainContext>(context);Need(chain.Count==1); // CTL-linked chains not supported in this slice
            var simple=Structure<SimpleChain>(Marshal.ReadIntPtr(chain.Chains));Need(simple.Count>=1&&simple.Count<=32&&simple.TrustList==IntPtr.Zero);
            var elements=new List<object>();string rootFingerprint=null;bool datesValid=true;
            uint errors=chain.Trust.Error|simple.Trust.Error;
            for(int i=0;i<simple.Count;i++){
                var element=Structure<ChainElement>(Marshal.ReadIntPtr(simple.Elements,i*IntPtr.Size));errors|=element.Trust.Error;
                using(var certificate=new X509Certificate2(element.Certificate)){
                    string digest=Hash(certificate.RawData);if(i==0)Need(digest==fingerprint);if(i==simple.Count-1)rootFingerprint=digest;
                    datesValid=datesValid&&certificate.NotBefore.ToUniversalTime()<=checkedAt&&certificate.NotAfter.ToUniversalTime()>=checkedAt;
                    elements.Add(new {subject=Clean(certificate.Subject),issuer=Clean(certificate.Issuer),fingerprintSha256=digest,validFrom=Date(certificate.NotBefore),validTo=Date(certificate.NotAfter),errorStatus=Hex(element.Trust.Error)});
                }
            }
            var policy=new PolicyParameters();policy.Size=(uint)Marshal.SizeOf(policy); // no ignored chain errors
            var status=new PolicyStatus();status.Size=(uint)Marshal.SizeOf(status);
            Need(CertVerifyCertificateChainPolicy(new IntPtr(1),context,ref policy,ref status)); // BASE policy only, no usage-specific claim
            bool keyUsage=true;int keyUsageCount=0;
            foreach(X509Extension extension in certificates[0].Extensions)if(extension.Oid.Value=="2.5.29.15"){
                Need(++keyUsageCount==1);var usage=new X509KeyUsageExtension(extension,extension.Critical);
                keyUsage=(usage.KeyUsages&(X509KeyUsageFlags.DigitalSignature|X509KeyUsageFlags.NonRepudiation))!=0;
            }
            bool rootTrusted=roots.Contains(rootFingerprint),trusted=rootTrusted&&errors==0&&status.Error==0&&keyUsage&&datesValid;
            return new {index=index,trust=trusted?"trusted-offline-chain":"untrusted-chain",chainInspection=new {backend="windows-offline-base-chain-v1",checkedAt=Date(checkedAt),signerFingerprintSha256=fingerprint,rootInWindowsStore=rootTrusted,chainErrorStatus=Hex(errors),policyError=Hex(status.Error),keyUsage=keyUsage?"allowed":"disallowed",elements=elements}};
        }finally{if(context!=IntPtr.Zero)CertFreeCertificateChain(context);if(store!=IntPtr.Zero)CertCloseStore(store,0);foreach(var certificate in certificates)certificate.Reset();}
    }
    static byte[] Input() { using(var input=Console.OpenStandardInput())using(var output=new MemoryStream()){byte[] chunk=new byte[8192];int count;while((count=input.Read(chunk,0,chunk.Length))>0){Need(output.Length+count<=MaxInput);output.Write(chunk,0,count);}return output.ToArray();} }
    static int Main(string[] args) {
        var json=new JavaScriptSerializer();json.MaxJsonLength=MaxInput;json.RecursionLimit=20;
        try{
            Need(args.Length==1&&args[0]=="inspect-offline-v1");Limit();byte[] input=Input();
            var request=Object(json.DeserializeObject(new UTF8Encoding(false,true).GetString(input)),"version","operation","sourceSha256","signatures");
            Need(request["version"] is int&&(int)request["version"]==1&&StringValue(request["operation"])=="inspect-offline-v1");string source=StringValue(request["sourceSha256"]);Need(Fingerprint(source));
            var signatures=request["signatures"] as object[];Need(signatures!=null&&signatures.Length>=1&&signatures.Length<=32);
            var results=new List<object>();var seen=new HashSet<int>();var roots=LocalRoots();
            foreach(object item in signatures){var signature=Object(item,"index","signerFingerprintSha256","certificates");Need(signature["index"] is int&&seen.Add((int)signature["index"]));results.Add(Inspect(signature,roots));}
            string output=json.Serialize(new {version=1,operation="inspect-offline-v1",sourceSha256=source,requestSha256=Hash(input),results=results});Need(Encoding.UTF8.GetByteCount(output)<=1024*1024);Console.OutputEncoding=new UTF8Encoding(false);Console.WriteLine(output);return 0;
        }catch{Console.Error.WriteLine("Offline certificate-chain inspection unavailable.");return 1;}
    }
}
