// Windows CurrentUser/My RSA adapter. Enumeration never acquires private keys.
// Only sign-v1 opens a provider handle, after explicit user certificate selection.
using System;
using System.IO;
using System.Text;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Web.Script.Serialization;
internal static class CertificateSigning {
    static IntPtr job;
    [StructLayout(LayoutKind.Sequential)] struct BasicLimit { public long ProcessTime,JobTime; public uint Flags; public UIntPtr MinWorkingSet,MaxWorkingSet; public uint ActiveProcessLimit; public UIntPtr Affinity; public uint Priority,Scheduling; }
    [StructLayout(LayoutKind.Sequential)] struct Counters { public ulong ReadOperations,WriteOperations,OtherOperations,ReadBytes,WriteBytes,OtherBytes; }
    [StructLayout(LayoutKind.Sequential)] struct ExtendedLimit { public BasicLimit Basic; public Counters IO; public UIntPtr ProcessMemory,JobMemory,PeakProcessMemory,PeakJobMemory; }
    [DllImport("kernel32.dll",SetLastError=true)] static extern IntPtr CreateJobObject(IntPtr attributes,string name);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool SetInformationJobObject(IntPtr handle,int info,ref ExtendedLimit limits,uint size);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool AssignProcessToJobObject(IntPtr handle,IntPtr process);
    [StructLayout(LayoutKind.Sequential)] struct ProviderInfo { public IntPtr Container,Provider; public uint Type,Flags,ParameterCount; public IntPtr Parameters; public uint KeySpec; }
    [StructLayout(LayoutKind.Sequential,CharSet=CharSet.Unicode)] struct PaddingInfo { [MarshalAs(UnmanagedType.LPWStr)] public string Algorithm; }
    [DllImport("crypt32.dll",SetLastError=true)] static extern bool CertGetCertificateContextProperty(IntPtr certificate,uint property,IntPtr data,ref uint size);
    [DllImport("crypt32.dll",SetLastError=true)] static extern bool CryptAcquireCertificatePrivateKey(IntPtr certificate,uint flags,IntPtr parameters,out IntPtr key,out uint keySpec,out bool free);
    [DllImport("ncrypt.dll")] static extern int NCryptSignHash(IntPtr key,ref PaddingInfo padding,byte[] hash,int hashLength,byte[] signature,int capacity,out int size,uint flags);
    [DllImport("ncrypt.dll")] static extern int NCryptFreeObject(IntPtr key);
    [DllImport("advapi32.dll",SetLastError=true)] static extern bool CryptCreateHash(IntPtr provider,uint algorithm,IntPtr key,uint flags,out IntPtr hash);
    [DllImport("advapi32.dll",SetLastError=true)] static extern bool CryptSetHashParam(IntPtr hash,uint parameter,byte[] data,uint flags);
    [DllImport("advapi32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern bool CryptSignHashW(IntPtr hash,uint keySpec,string description,uint flags,byte[] signature,ref uint size);
    [DllImport("advapi32.dll")] static extern bool CryptDestroyHash(IntPtr hash);
    [DllImport("advapi32.dll")] static extern bool CryptReleaseContext(IntPtr provider,uint flags);
    static void Need(bool value,string message="Windows certificate signing could not safely complete.") { if(!value)throw new InvalidOperationException(message); }
    static void Limit(){job=CreateJobObject(IntPtr.Zero,null);var limits=new ExtendedLimit();limits.Basic.Flags=0x2000|0x100|0x8|0x2;limits.Basic.ActiveProcessLimit=1;limits.Basic.ProcessTime=20L*10000000;limits.ProcessMemory=new UIntPtr(256UL*1024*1024);Need(job!=IntPtr.Zero&&SetInformationJobObject(job,9,ref limits,(uint)Marshal.SizeOf(limits))&&AssignProcessToJobObject(job,Process.GetCurrentProcess().Handle));}
    static byte[] Digest(byte[] bytes){using(var sha=SHA256.Create())return sha.ComputeHash(bytes);}
    static string Hash(byte[] bytes){return BitConverter.ToString(Digest(bytes)).Replace("-","").ToLowerInvariant();}
    static string Clean(string text){var result=new StringBuilder();foreach(char c in text??""){if(result.Length>=2000)break;result.Append(c<32||c==127||c>=0x202A&&c<=0x202E||c>=0x2066&&c<=0x2069||Char.IsSurrogate(c)?' ':c);}return result.ToString();}
    static string Date(DateTime time){return time.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'",CultureInfo.InvariantCulture);}
    static Dictionary<string,object> Object(object value,params string[] keys){var result=value as Dictionary<string,object>;Need(result!=null&&result.Count==keys.Length);foreach(string key in keys)Need(result.ContainsKey(key));return result;}
    static string Text(object value){Need(value is string);return (string)value;}
    static string Fingerprint(object value){string result=Text(value);Need(result.Length==64);foreach(char c in result)Need(c>='0'&&c<='9'||c>='a'&&c<='f');return result;}
    static byte[] Hex(string value){Need(value.Length%2==0);var bytes=new byte[value.Length/2];for(int i=0;i<bytes.Length;i++)bytes[i]=Byte.Parse(value.Substring(i*2,2),NumberStyles.HexNumber,CultureInfo.InvariantCulture);return bytes;}
    static string Provider(X509Certificate2 certificate){uint size=0;Need(CertGetCertificateContextProperty(certificate.Handle,2,IntPtr.Zero,ref size)&&size>0&&size<=65536);IntPtr buffer=Marshal.AllocHGlobal((int)size);try{Need(CertGetCertificateContextProperty(certificate.Handle,2,buffer,ref size));var info=(ProviderInfo)Marshal.PtrToStructure(buffer,typeof(ProviderInfo));return Clean(Marshal.PtrToStringUni(info.Provider));}finally{Marshal.FreeHGlobal(buffer);}}
    static bool Usage(X509Certificate2 certificate){int count=0;bool permitted=true;foreach(X509Extension extension in certificate.Extensions)if(extension.Oid.Value=="2.5.29.15"){Need(++count==1);var usage=new X509KeyUsageExtension(extension,extension.Critical);permitted=(usage.KeyUsages&(X509KeyUsageFlags.DigitalSignature|X509KeyUsageFlags.NonRepudiation))!=0;}return permitted;}
    static object Details(X509Certificate2 certificate){
        Need(certificate.HasPrivateKey&&certificate.PublicKey.Oid.Value=="1.2.840.113549.1.1.1");int bits=certificate.PublicKey.Key.KeySize;Need(bits>=2048&&bits<=8192&&certificate.RawData.Length<=65536);
        DateTime now=DateTime.UtcNow;bool eligible=Usage(certificate)&&certificate.NotBefore.ToUniversalTime()<=now&&certificate.NotAfter.ToUniversalTime()>=now;
        string reason=eligible?"Certificate dates and signing key usage permit this operation; provider access will be checked only when signing.":"Certificate is outside its validity dates or its key usage does not permit signing.";
        return new {id=Hash(certificate.RawData),subject=Clean(certificate.Subject),issuer=Clean(certificate.Issuer),serial=Clean(certificate.SerialNumber),validFrom=Date(certificate.NotBefore),validTo=Date(certificate.NotAfter),keyType="RSA PKCS#1 v1.5 / SHA-256",keyBits=bits,provider=Provider(certificate),store="Windows CurrentUser/My",eligible=eligible,reason=reason,certificateDer=Convert.ToBase64String(certificate.RawData)};
    }
    static object List(){var result=new List<object>();int total=0;using(var store=new X509Store(StoreName.My,StoreLocation.CurrentUser)){store.Open(OpenFlags.ReadOnly|OpenFlags.OpenExistingOnly);var certificates=store.Certificates;Need(certificates.Count<=2000);foreach(var certificate in certificates){try{if(!certificate.HasPrivateKey||certificate.PublicKey.Oid.Value!="1.2.840.113549.1.1.1")continue;object details;try{details=Details(certificate);}catch{continue;}total+=certificate.RawData.Length;Need(result.Count<100&&total<=1024*1024,"The Windows signing certificate inventory exceeds its limit.");result.Add(details);}finally{certificate.Reset();}}}return new {certificates=result};}
    static object Sign(Dictionary<string,object> request){
        string id=Fingerprint(request["certificateId"]),content=Fingerprint(request["contentSha256"]);Fingerprint(request["sourceSha256"]);Fingerprint(request["preparedSha256"]);
        byte[] attributes=Hex("314b301806092a864886f70d010903310b06092a864886f70d010701302f06092a864886f70d01090431220420"+content);Need(Convert.ToBase64String(attributes)==Text(request["signedAttributes"]));
        string provider=Text(request["provider"]);Need(provider.Length<=2000);
        using(var store=new X509Store(StoreName.My,StoreLocation.CurrentUser)){
            store.Open(OpenFlags.ReadOnly|OpenFlags.OpenExistingOnly);var certificates=store.Certificates;X509Certificate2 chosen=null;
            try{
                Need(certificates.Count<=2000);foreach(var certificate in certificates)if(Hash(certificate.RawData)==id){Need(chosen==null,"The selected certificate is ambiguous.");chosen=certificate;}Need(chosen!=null,"The selected certificate is no longer available.");
                object details=Details(chosen);DateTime now=DateTime.UtcNow;Need(Usage(chosen)&&chosen.NotBefore.ToUniversalTime()<=now&&chosen.NotAfter.ToUniversalTime()>=now,"The selected certificate is outside its validity dates or signing key usage.");Need(Provider(chosen)==provider,"The selected private-key provider changed. Review the certificate again.");
                IntPtr key=IntPtr.Zero,hash=IntPtr.Zero;uint keySpec=0;bool free=false;byte[] signature=null;
                try{
                    // ALLOW_NCRYPT | COMPARE_KEY | NO_HEALING. No silent flag:
                    // this branch is reached only by an explicit Sign click.
                    Need(CryptAcquireCertificatePrivateKey(chosen.Handle,0x10000|0x4|0x8,IntPtr.Zero,out key,out keySpec,out free),"The selected Windows key provider could not open the private key, or the PIN request was canceled.");
                    byte[] digest=Digest(attributes);
                    if(keySpec==0xffffffff){var padding=new PaddingInfo();padding.Algorithm="SHA256";int size;Need(NCryptSignHash(key,ref padding,digest,digest.Length,null,0,out size,2)==0&&size>=256&&size<=1024);signature=new byte[size];Need(NCryptSignHash(key,ref padding,digest,digest.Length,signature,signature.Length,out size,2)==0&&size==signature.Length,"The Windows CNG provider did not complete RSA signing.");}
                    else{Need(keySpec==1||keySpec==2);Need(CryptCreateHash(key,0x800c,IntPtr.Zero,0,out hash)&&CryptSetHashParam(hash,2,digest,0));uint size=0;Need(CryptSignHashW(hash,keySpec,null,0,null,ref size)&&size>=256&&size<=1024);signature=new byte[size];Need(CryptSignHashW(hash,keySpec,null,0,signature,ref size)&&size==signature.Length,"The Windows CryptoAPI provider did not complete RSA signing.");Array.Reverse(signature);}
                    using(var publicKey=(RSACryptoServiceProvider)chosen.PublicKey.Key)Need(publicKey.VerifyData(attributes,CryptoConfig.MapNameToOID("SHA256"),signature),"The provider signature did not match the selected certificate.");
                    return new {certificate=details,signature=Convert.ToBase64String(signature),signedAttributes=Convert.ToBase64String(attributes),sourceSha256=request["sourceSha256"],preparedSha256=request["preparedSha256"],contentSha256=content};
                }finally{if(hash!=IntPtr.Zero)CryptDestroyHash(hash);if(free&&key!=IntPtr.Zero){if(keySpec==0xffffffff)NCryptFreeObject(key);else CryptReleaseContext(key,0);}}
            }finally{foreach(var certificate in certificates)certificate.Reset();}
        }
    }
    static byte[] Input(){using(var input=Console.OpenStandardInput())using(var output=new MemoryStream()){byte[] chunk=new byte[4096];int count;while((count=input.Read(chunk,0,chunk.Length))>0){Need(output.Length+count<=16384);output.Write(chunk,0,count);}return output.ToArray();}}
    [STAThread] static int Main(string[] args){var json=new JavaScriptSerializer();json.MaxJsonLength=2*1024*1024;json.RecursionLimit=20;try{Need(args.Length==1&&(args[0]=="list-v1"||args[0]=="sign-v1"));Limit();byte[] input=Input();var value=json.DeserializeObject(new UTF8Encoding(false,true).GetString(input));Dictionary<string,object> request;object result;
        if(args[0]=="list-v1"){request=Object(value,"version","operation");Need(request["version"] is int&&(int)request["version"]==1&&Text(request["operation"])=="list-v1");result=List();}
        else{request=Object(value,"version","operation","certificateId","provider","sourceSha256","preparedSha256","contentSha256","signedAttributes");Need(request["version"] is int&&(int)request["version"]==1&&Text(request["operation"])=="sign-v1");result=Sign(request);}
        string output=json.Serialize(new {version=1,operation=args[0],requestSha256=Hash(input),result=result});Need(Encoding.UTF8.GetByteCount(output)<=2*1024*1024);Console.OutputEncoding=new UTF8Encoding(false);Console.WriteLine(output);return 0;
    }catch(Exception error){Console.OutputEncoding=new UTF8Encoding(false);Console.WriteLine(json.Serialize(new {error=Clean(error.Message)}));return 1;}}
}
