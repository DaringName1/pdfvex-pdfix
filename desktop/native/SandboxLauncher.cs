// PDFix trusted native broker. Document parsing happens only in the AppContainer child.
// Build with Framework64 csc, platform:x64. No runtime/compiler download is required.
using System;
using System.IO;
using System.Text;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Diagnostics;
using System.Security.Principal;
using System.Security.AccessControl;
using System.Runtime.InteropServices;
using Microsoft.Win32.SafeHandles;

internal static class SandboxLauncher {
    const int SetupFailure = 125, CleanupFailure = 126, LimitFailure = 124;
    const uint WAIT_OBJECT_0 = 0, WAIT_TIMEOUT = 258;
    const long Memory = 512L * 1024 * 1024;
    // Word and RTF editing jobs only: large photo documents need more room than other document jobs.
    const long WordMemory = 3072L * 1024 * 1024;
    enum JobProfile { Native, Document, Paged, Session, WordDocument }
    static string Stage = "preflight";
    static int NativeError;
    static readonly string[] RuntimeFiles = { "concrt140.dll", "msvcp140_1.dll", "msvcp140_2.dll", "msvcp140_atomic_wait.dll", "msvcp140_codecvt_ids.dll", "msvcp140.dll", "qpdf.exe", "qpdf30.dll", "vcruntime140_1.dll", "vcruntime140.dll" };
    static readonly string[] SessionRuntimeFiles = RuntimeFiles.Concat(new string[]{"PDFix.PagedSession.exe"}).ToArray();
    [StructLayout(LayoutKind.Sequential)] struct SECURITY_ATTRIBUTES { public int Length; public IntPtr Descriptor; [MarshalAs(UnmanagedType.Bool)] public bool Inherit; }
    [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)] struct STARTUPINFO { public int cb; public string Reserved, Desktop, Title; public uint X,Y,XSize,YSize,XCountChars,YCountChars,FillAttribute,Flags; public ushort ShowWindow,Reserved2Size; public IntPtr Reserved2,Input,Output,Error; }
    [StructLayout(LayoutKind.Sequential)] struct STARTUPINFOEX { public STARTUPINFO Startup; public IntPtr Attributes; }
    [StructLayout(LayoutKind.Sequential)] struct PROCESS_INFORMATION { public IntPtr Process,Thread; public uint ProcessId,ThreadId; }
    [StructLayout(LayoutKind.Sequential)] struct SECURITY_CAPABILITIES { public IntPtr Sid,Capabilities; public uint Count,Reserved; }
    [StructLayout(LayoutKind.Sequential)] struct BASIC_LIMIT { public long ProcessTime,JobTime; public uint Flags; public UIntPtr MinWorkingSet,MaxWorkingSet; public uint ActiveProcessLimit; public UIntPtr Affinity; public uint Priority,Scheduling; }
    [StructLayout(LayoutKind.Sequential)] struct IO_COUNTERS { public ulong ReadOperations,WriteOperations,OtherOperations,ReadBytes,WriteBytes,OtherBytes; }
    [StructLayout(LayoutKind.Sequential)] struct EXTENDED_LIMIT { public BASIC_LIMIT Basic; public IO_COUNTERS IO; public UIntPtr ProcessMemory,JobMemory,PeakProcessMemory,PeakJobMemory; }
    [DllImport("userenv.dll",CharSet=CharSet.Unicode)] static extern int CreateAppContainerProfile(string name,string display,string description,IntPtr capabilities,uint count,out IntPtr sid);
    [DllImport("userenv.dll",CharSet=CharSet.Unicode)] static extern int DeriveAppContainerSidFromAppContainerName(string name,out IntPtr sid);
    [DllImport("userenv.dll",CharSet=CharSet.Unicode)] static extern int DeleteAppContainerProfile(string name);
    [DllImport("advapi32.dll")] static extern IntPtr FreeSid(IntPtr sid);
    [DllImport("advapi32.dll")] static extern bool EqualSid(IntPtr first,IntPtr second);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool InitializeProcThreadAttributeList(IntPtr list,int count,uint flags,ref IntPtr size);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool UpdateProcThreadAttribute(IntPtr list,uint flags,IntPtr attribute,IntPtr value,IntPtr size,IntPtr previous,IntPtr returned);
    [DllImport("kernel32.dll")] static extern void DeleteProcThreadAttributeList(IntPtr list);
    [DllImport("kernel32.dll",SetLastError=true,CharSet=CharSet.Unicode)] static extern bool CreateProcessW(string application,StringBuilder command,IntPtr processSecurity,IntPtr threadSecurity,bool inherit,uint flags,IntPtr environment,string cwd,ref STARTUPINFOEX startup,out PROCESS_INFORMATION information);
    [DllImport("kernel32.dll",SetLastError=true,CharSet=CharSet.Unicode)] static extern bool SetDllDirectoryW(string directory);
    [DllImport("user32.dll")] static extern IntPtr GetProcessWindowStation();
    [DllImport("user32.dll")] static extern IntPtr GetThreadDesktop(uint threadId);
    [DllImport("kernel32.dll")] static extern uint GetCurrentThreadId();
    [DllImport("user32.dll",SetLastError=true)] static extern bool SetThreadDesktop(IntPtr desktop);
    [DllImport("user32.dll",SetLastError=true,CharSet=CharSet.Unicode)] static extern IntPtr CreateDesktopW(string name,IntPtr device,IntPtr mode,uint flags,uint access,ref SECURITY_ATTRIBUTES security);
    [DllImport("user32.dll",SetLastError=true)] static extern bool CloseDesktop(IntPtr desktop);
    [DllImport("user32.dll",SetLastError=true)] static extern bool GetUserObjectSecurity(IntPtr handle,ref uint information,[Out] byte[] descriptor,uint length,out uint needed);
    [DllImport("user32.dll",SetLastError=true)] static extern bool SetUserObjectSecurity(IntPtr handle,ref uint information,byte[] descriptor);
    [DllImport("user32.dll",SetLastError=true,CharSet=CharSet.Unicode)] static extern bool GetUserObjectInformationW(IntPtr handle,int information,StringBuilder value,uint length,out uint needed);
    [DllImport("kernel32.dll",SetLastError=true,CharSet=CharSet.Unicode)] static extern IntPtr CreateJobObjectW(IntPtr security,string name);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool SetInformationJobObject(IntPtr job,int info,ref EXTENDED_LIMIT limits,uint size);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool IsProcessInJob(IntPtr process,IntPtr job,out bool included);
    [DllImport("kernel32.dll")] static extern bool TerminateJobObject(IntPtr job,uint exit);
    [DllImport("kernel32.dll")] static extern bool TerminateProcess(IntPtr process,uint exit);
    [DllImport("kernel32.dll")] static extern uint ResumeThread(IntPtr thread);
    [DllImport("kernel32.dll")] static extern uint WaitForMultipleObjects(uint count,IntPtr[] handles,bool all,uint milliseconds);
    [DllImport("kernel32.dll")] static extern uint WaitForSingleObject(IntPtr handle,uint milliseconds);
    [DllImport("kernel32.dll")] static extern bool GetExitCodeProcess(IntPtr process,out uint exit);
    [DllImport("kernel32.dll")] static extern IntPtr OpenProcess(uint access,bool inherit,uint id);
    [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr handle);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool CreatePipe(out IntPtr read,out IntPtr write,ref SECURITY_ATTRIBUTES security,uint size);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool SetHandleInformation(IntPtr handle,uint mask,uint flags);
    [DllImport("advapi32.dll",SetLastError=true)] static extern bool OpenProcessToken(IntPtr process,uint access,out IntPtr token);
    [DllImport("advapi32.dll",SetLastError=true)] static extern bool GetTokenInformation(IntPtr token,int info,IntPtr buffer,int size,out int length);
    [DllImport("advapi32.dll",SetLastError=true,CharSet=CharSet.Unicode)] static extern bool ConvertStringSecurityDescriptorToSecurityDescriptorW(string sddl,uint revision,out IntPtr descriptor,out uint size);
    [DllImport("advapi32.dll",SetLastError=true)] static extern bool GetSecurityDescriptorSacl(IntPtr descriptor,out bool present,out IntPtr sacl,out bool defaulted);
    [DllImport("advapi32.dll",CharSet=CharSet.Unicode)] static extern uint SetNamedSecurityInfoW(string name,int type,uint information,IntPtr owner,IntPtr group,IntPtr dacl,IntPtr sacl);
    [DllImport("kernel32.dll")] static extern IntPtr LocalFree(IntPtr handle);

    static void Require(bool result) { if(!result) { NativeError=Marshal.GetLastWin32Error();throw new InvalidOperationException("Windows containment setup failed."); } }
    static void ReportFailure(string stage,int code) {
        // Fixed stage identifiers and numeric codes only: never log PDF contents or paths.
        Console.Error.WriteLine("PDFIX_SANDBOX:"+stage+":"+code.ToString(System.Globalization.CultureInfo.InvariantCulture));
    }
    const int StationRead = 0x00020002; // READ_CONTROL + read attributes; no clipboard or screen.
    static T StationAclTransaction<T>(Func<T> action) {
        // Multiple trusted brokers may run concurrently. Serialize their
        // read-modify-write operations so one job cannot erase another's ACE.
        string key="Local\\PDFix.StationAcl."+Process.GetCurrentProcess().SessionId+"."+WindowsIdentity.GetCurrent().User.Value;
        using(Mutex mutex=new Mutex(false,key)) {
            bool held=false;
            try {
                try {held=mutex.WaitOne(5000);}catch(AbandonedMutexException){held=true;}
                Require(held);return action();
            }finally{if(held)mutex.ReleaseMutex();}
        }
    }
    static RawSecurityDescriptor StationSecurity(IntPtr station) {
        uint info=4,needed;
        GetUserObjectSecurity(station,ref info,null,0,out needed);
        Require(needed>0&&needed<=65536);byte[] bytes=new byte[needed];
        Require(GetUserObjectSecurity(station,ref info,bytes,(uint)bytes.Length,out needed));
        RawSecurityDescriptor descriptor=new RawSecurityDescriptor(bytes,0);
        Require(descriptor.DiscretionaryAcl!=null);return descriptor;
    }
    static void WriteStationSecurity(IntPtr station,RawSecurityDescriptor descriptor) {
        byte[] bytes=new byte[descriptor.BinaryLength];descriptor.GetBinaryForm(bytes,0);uint info=4;
        Require(SetUserObjectSecurity(station,ref info,bytes));
    }
    static bool GrantStationRead(IntPtr station,SecurityIdentifier identity) {
        return StationAclTransaction(()=>{
        RawSecurityDescriptor descriptor=StationSecurity(station);
        foreach(GenericAce entry in descriptor.DiscretionaryAcl) {
            CommonAce ace=entry as CommonAce;
            if(ace!=null&&ace.AceQualifier==AceQualifier.AccessAllowed&&ace.SecurityIdentifier==identity&&(ace.AccessMask&StationRead)==StationRead)return false;
        }
        descriptor.DiscretionaryAcl.InsertAce(descriptor.DiscretionaryAcl.Count,new CommonAce(AceFlags.None,AceQualifier.AccessAllowed,StationRead,identity,false,null));
        WriteStationSecurity(station,descriptor);return true;
        });
    }
    static void RemoveStationRead(IntPtr station,SecurityIdentifier identity) {
        StationAclTransaction(()=>{
        // Remove only this exact per-session SID's newly inserted ACE. Never
        // restore an old whole ACL over another concurrent job's permissions.
        RawSecurityDescriptor descriptor=StationSecurity(station);
        bool removed=false;
        for(int index=descriptor.DiscretionaryAcl.Count-1;index>=0;index--) {
            CommonAce ace=descriptor.DiscretionaryAcl[index] as CommonAce;
            if(ace!=null&&ace.AceFlags==AceFlags.None&&ace.AceQualifier==AceQualifier.AccessAllowed&&ace.AccessMask==StationRead&&ace.SecurityIdentifier==identity){descriptor.DiscretionaryAcl.RemoveAce(index);removed=true;break;}
        }
        if(removed)WriteStationSecurity(station,descriptor);
        return true;
        });
    }
    static bool CleanupProfile(string profile) {
        // A broker killed during cancellation cannot run its finally block.
        // Session cleanup also removes the exact read-attributes ACE if left.
        IntPtr identity=IntPtr.Zero;
        try {
            Require(DeriveAppContainerSidFromAppContainerName(profile,out identity)>=0&&identity!=IntPtr.Zero);
            IntPtr station=GetProcessWindowStation();Require(station!=IntPtr.Zero);
            RemoveStationRead(station,new SecurityIdentifier(identity));return RemoveProfile(profile);
        }finally{if(identity!=IntPtr.Zero)FreeSid(identity);}
    }
    static IntPtr PrivateDesktop(string name,SecurityIdentifier identity) {
        IntPtr descriptor=IntPtr.Zero;uint size;
        SecurityIdentifier owner=WindowsIdentity.GetCurrent().User;Require(owner!=null);
        // The contained process gets only initialization rights on its private desktop.
        // It has no access to the user's default desktop.
        string sddl="D:P(A;;GA;;;"+owner.Value+")(A;;GA;;;SY)(A;;GA;;;BA)(A;;0x00020083;;;"+identity.Value+")S:(ML;;NW;;;LW)";
        try {
            Require(ConvertStringSecurityDescriptorToSecurityDescriptorW(sddl,1,out descriptor,out size));
            SECURITY_ATTRIBUTES security=new SECURITY_ATTRIBUTES();security.Length=Marshal.SizeOf(typeof(SECURITY_ATTRIBUTES));security.Descriptor=descriptor;
            IntPtr desktop=CreateDesktopW(name,IntPtr.Zero,IntPtr.Zero,0,0x000F01FF,ref security);
            Require(desktop!=IntPtr.Zero);return desktop;
        }finally{if(descriptor!=IntPtr.Zero)LocalFree(descriptor);}
    }
    static bool ValidProfile(string name) { return System.Text.RegularExpressions.Regex.IsMatch(name??"",@"\APDFix\.Job\.[a-f0-9]{32}\z"); }
    static bool RemoveProfile(string name) {
        int code=DeleteAppContainerProfile(name);
        return code>=0 || code==unchecked((int)0x80070002) || code==unchecked((int)0x80070003) || code==unchecked((int)0x80070490);
    }
    static void NoReparse(string name) {
        string full=Path.GetFullPath(name); string current=full;
        while(!String.IsNullOrEmpty(current)) {
            Require((File.GetAttributes(current)&FileAttributes.ReparsePoint)==0);
            string next=Path.GetDirectoryName(current); if(next==current)break; current=next;
        }
    }
    static void GrantDirectory(string name,SecurityIdentifier sid,FileSystemRights rights,bool inherit) {
        DirectorySecurity acl=Directory.GetAccessControl(name);
        acl.SetAccessRuleProtection(true,true);acl.PurgeAccessRules(sid);
        acl.AddAccessRule(new FileSystemAccessRule(sid,rights,inherit?InheritanceFlags.ContainerInherit|InheritanceFlags.ObjectInherit:InheritanceFlags.None,PropagationFlags.None,AccessControlType.Allow));
        Directory.SetAccessControl(name,acl);
    }
    static void GrantFile(string name,SecurityIdentifier sid,FileSystemRights rights) {
        FileSecurity acl=File.GetAccessControl(name);acl.SetAccessRuleProtection(true,true);acl.PurgeAccessRules(sid);
        acl.AddAccessRule(new FileSystemAccessRule(sid,rights,AccessControlType.Allow));File.SetAccessControl(name,acl);
    }
    static SecurityIdentifier[] DocumentOwners() {
        SecurityIdentifier owner=WindowsIdentity.GetCurrent().User;Require(owner!=null);
        return new SecurityIdentifier[]{owner,new SecurityIdentifier(WellKnownSidType.LocalSystemSid,null),new SecurityIdentifier(WellKnownSidType.BuiltinAdministratorsSid,null)};
    }
    static void GrantDocumentDirectory(string name,SecurityIdentifier sid) {
        // Replace inherited/package-wide grants inside document staging. Otherwise a parent
        // ALL APPLICATION PACKAGES write grant could defeat the intended read-only slots.
        DirectorySecurity acl=new DirectorySecurity();acl.SetAccessRuleProtection(true,false);
        foreach(SecurityIdentifier owner in DocumentOwners())acl.AddAccessRule(new FileSystemAccessRule(owner,FileSystemRights.FullControl,InheritanceFlags.ContainerInherit|InheritanceFlags.ObjectInherit,PropagationFlags.None,AccessControlType.Allow));
        acl.AddAccessRule(new FileSystemAccessRule(sid,FileSystemRights.ReadAndExecute,InheritanceFlags.ContainerInherit|InheritanceFlags.ObjectInherit,PropagationFlags.None,AccessControlType.Allow));
        Directory.SetAccessControl(name,acl);
    }
    static void GrantDocumentFile(string name,SecurityIdentifier sid,FileSystemRights rights) {
        FileSecurity acl=new FileSecurity();acl.SetAccessRuleProtection(true,false);
        foreach(SecurityIdentifier owner in DocumentOwners())acl.AddAccessRule(new FileSystemAccessRule(owner,FileSystemRights.FullControl,AccessControlType.Allow));
        acl.AddAccessRule(new FileSystemAccessRule(sid,rights,AccessControlType.Allow));
        File.SetAccessControl(name,acl);
    }
    static void LowLabel(string name) {
        IntPtr descriptor=IntPtr.Zero,sacl;uint size;bool present,defaulted;
        try {
            Require(ConvertStringSecurityDescriptorToSecurityDescriptorW("S:(ML;OICI;NW;;;LW)",1,out descriptor,out size));
            Require(GetSecurityDescriptorSacl(descriptor,out present,out sacl,out defaulted)&&present);
            uint code=SetNamedSecurityInfoW(name,1,0x10,IntPtr.Zero,IntPtr.Zero,IntPtr.Zero,sacl);
            if(code!=0){NativeError=(int)code;throw new InvalidOperationException("Mandatory integrity label failed.");}
        } finally {if(descriptor!=IntPtr.Zero)LocalFree(descriptor);}
    }
    static byte[] ReadArguments() {
        using(MemoryStream data=new MemoryStream()) {
            Stream input=Console.OpenStandardInput();byte[] buffer=new byte[1024];int count;
            while((count=input.Read(buffer,0,buffer.Length))!=0) {Require(data.Length+count<=16384);data.Write(buffer,0,count);}
            byte[] result=data.ToArray();Require(result.Length>0&&result[result.Length-1]==10&&!result.Contains((byte)0));return result;
        }
    }
    static byte[] Arguments(IntPtr parent) {
        // Parent death and a broker-input stall are bounded even before a child exists.
        Task<byte[]> read=Task.Run(()=>ReadArguments());Stopwatch clock=Stopwatch.StartNew();
        while(!read.IsCompleted) {
            Require(WaitForSingleObject(parent,0)==WAIT_TIMEOUT&&clock.ElapsedMilliseconds<5000);
            Thread.Sleep(25);
        }
        return read.Result;
    }
    static void CopyPipe(IntPtr pipe,Stream destination) {
        using(FileStream source=new FileStream(new SafeFileHandle(pipe,true),FileAccess.Read,8192,false)) {
            byte[] buffer=new byte[8192];long total=0;int count;
            while((count=source.Read(buffer,0,buffer.Length))>0) {
                total+=count;Require(total<=2L*1024*1024);destination.Write(buffer,0,count);
            }
            destination.Flush();
        }
    }
    static void WritePipe(IntPtr pipe,byte[] payload) {
        using(FileStream destination=new FileStream(new SafeFileHandle(pipe,true),FileAccess.Write,4096,false)) {
            destination.Write(payload,0,payload.Length);destination.Flush();
        }
    }
    static void AddAttribute(IntPtr list,long key,IntPtr value,int size) { Require(UpdateProcThreadAttribute(list,0,new IntPtr(key),value,new IntPtr(size),IntPtr.Zero,IntPtr.Zero)); }
    sealed class SessionControl {
        internal readonly object Gate=new object();
        internal bool Busy=true,Closing,Ready,Navigation;
        internal string Token="OPEN";internal int Page;
        internal long ActiveAt=Stopwatch.GetTimestamp(),IdleAt=Stopwatch.GetTimestamp();
        internal long Since(long at){return (Stopwatch.GetTimestamp()-at)*1000/Stopwatch.Frequency;}
        internal bool Expired(){lock(Gate){return Closing?Since(IdleAt)>5000:Busy?Since(ActiveAt)>115000:Since(IdleAt)>600000;}}
    }
    static string ProtocolLine(Stream input,int maximum) {
        StringBuilder line=new StringBuilder(maximum);
        for(;;){int value=input.ReadByte();if(value<0){Require(line.Length==0);return null;}
            if(value==10)return line.ToString();
            if(value==13){Require(input.ReadByte()==10);return line.ToString();}
            Require(value>=32&&value<=126&&line.Length<maximum);line.Append((char)value);
        }
    }
    static void SessionInput(IntPtr pipe,SessionControl control) {
        using(FileStream destination=new FileStream(new SafeFileHandle(pipe,true),FileAccess.Write,4096,false)) {
            Stream source=Console.OpenStandardInput();string header=ProtocolLine(source,128);Require(header=="PDFix.Paged.Session.v1");
            byte[] bytes=Encoding.ASCII.GetBytes(header+"\n");destination.Write(bytes,0,bytes.Length);destination.Flush();
            for(;;){string line=ProtocolLine(source,128);Require(line!=null);
                lock(control.Gate){
                    Require(!control.Busy&&control.Ready&&!control.Closing);
                    if(line=="CLOSE"){control.Closing=true;control.IdleAt=Stopwatch.GetTimestamp();}
                    else if(System.Text.RegularExpressions.Regex.IsMatch(line,@"\ANAV:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:(0|[1-9][0-9]{0,9})\z")){string[] nav=line.Split(':');int page;Require(Int32.TryParse(nav[2],out page)&&page>=0);control.Navigation=true;control.Token=nav[1];control.Page=page;control.Busy=true;control.ActiveAt=Stopwatch.GetTimestamp();}
                    else {
                        var match=System.Text.RegularExpressions.Regex.Match(line,@"\APAGE:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):([1-9][0-9]{0,9})\z");int number;
                        Require(match.Success&&Int32.TryParse(match.Groups[2].Value,out number)&&number>0);
                        control.Navigation=false;control.Token=match.Groups[1].Value;control.Page=Int32.Parse(match.Groups[2].Value);control.Busy=true;control.ActiveAt=Stopwatch.GetTimestamp();
                    }
                }
                bytes=Encoding.ASCII.GetBytes(line+"\n");destination.Write(bytes,0,bytes.Length);destination.Flush();if(line=="CLOSE")return;
            }
        }
    }
    static void SessionOutput(IntPtr pipe,Stream destination,SessionControl control,uint processId) {
        using(FileStream source=new FileStream(new SafeFileHandle(pipe,true),FileAccess.Read,4096,false)) {
            for(;;){string line=ProtocolLine(source,192);if(line==null)return;
                lock(control.Gate){
                    Require(control.Busy&&!control.Closing);
                    var ready=System.Text.RegularExpressions.Regex.Match(line,@"\APDFIX_PAGED:READY:([1-9][0-9]{0,9}):([1-9][0-9]{0,9})\z");
                    var page=System.Text.RegularExpressions.Regex.Match(line,@"\APDFIX_PAGED:PAGE:([0-9a-f-]{36}):([1-9][0-9]{0,9}):([1-9][0-9]{0,8}):([0-9]{1,16})\z");
                    var error=System.Text.RegularExpressions.Regex.Match(line,@"\APDFIX_PAGED:ERROR:(OPEN|[0-9a-f-]{36}):(LOADER|DLL_INIT|ENCRYPTED|PARSE|OUTPUT_LIMIT|PROTOCOL|MEMORY|SOURCE_CHANGED|INVALID_PAGE|OUTPUT)\z");
                    if(ready.Success){int count;uint pid;Require(control.Token=="OPEN"&&!control.Ready&&Int32.TryParse(ready.Groups[1].Value,out count)&&count>0&&UInt32.TryParse(ready.Groups[2].Value,out pid)&&pid==processId);control.Ready=true;}
                    else if(page.Success){long size,memory;int number;Require(!control.Navigation&&control.Ready&&page.Groups[1].Value==control.Token&&Int32.TryParse(page.Groups[2].Value,out number)&&number==control.Page&&Int64.TryParse(page.Groups[3].Value,out size)&&size>0&&size<=32L*1024*1024&&Int64.TryParse(page.Groups[4].Value,out memory)&&memory>0&&memory<Memory);}
                    else if(control.Navigation&&control.Ready){var nav=System.Text.RegularExpressions.Regex.Match(line,@"\APDFIX_PAGED:NAV:([0-9a-f-]{36}):([1-9][0-9]{0,7}):([0-9]{1,16})\z");long size,memory;Require(nav.Success&&nav.Groups[1].Value==control.Token&&Int64.TryParse(nav.Groups[2].Value,out size)&&size>0&&size<=2L*1024*1024&&Int64.TryParse(nav.Groups[3].Value,out memory)&&memory>0&&memory<Memory||error.Success&&error.Groups[1].Value==control.Token);}
                    else Require(error.Success&&error.Groups[1].Value==control.Token);
                    control.Busy=false;control.IdleAt=Stopwatch.GetTimestamp();
                }
                byte[] bytes=Encoding.ASCII.GetBytes(line+"\n");destination.Write(bytes,0,bytes.Length);destination.Flush();
            }
        }
    }
    static IntPtr StructPointer<T>(T value) {IntPtr pointer=Marshal.AllocHGlobal(Marshal.SizeOf(typeof(T)));Marshal.StructureToPtr(value,pointer,false);return pointer;}
    static IntPtr ChildEnvironment(string system,string folder,string runtime) {
        // Keep the Windows runtime profile locations on an explicit allowlist.
        // No user PATH, proxy, keys or parser options are inherited.
        // AppContainer still enforces which locations the child can access.
        // These paths grant no additional file permissions. TEMP remains private.
        string user=Environment.GetEnvironmentVariable("USERPROFILE"),local=Environment.GetEnvironmentVariable("LOCALAPPDATA"),roaming=Environment.GetEnvironmentVariable("APPDATA"),program=Environment.GetEnvironmentVariable("ProgramData");
        Require(new string[]{user,local,roaming,program}.All(value=>!String.IsNullOrEmpty(value)&&Path.IsPathRooted(value)));
        string[] entries={"APPDATA="+roaming,"LOCALAPPDATA="+local,"OPENSSL_CONF="+(File.Exists(Path.Combine(runtime,"openssl.cnf"))?Path.Combine(runtime,"openssl.cnf"):"NUL"),"PATH="+runtime+";"+Path.Combine(system,"System32"),"ProgramData="+program,"SystemDrive="+Path.GetPathRoot(system).TrimEnd('\\'),"SystemRoot="+system,"TEMP="+folder,"TMP="+folder,"USERPROFILE="+user,"WINDIR="+system};
        Array.Sort(entries,StringComparer.OrdinalIgnoreCase);
        foreach(string entry in entries)Require(entry.IndexOf('\0')<0);
        char[] block=(String.Join("\0",entries)+"\0\0").ToCharArray();
        IntPtr pointer=Marshal.AllocHGlobal(checked(block.Length*2));
        try {Marshal.Copy(block,0,pointer,block.Length);return pointer;}catch{Marshal.FreeHGlobal(pointer);throw;}
    }
    static IntPtr TokenInformation(IntPtr token,int kind) {
        int length;GetTokenInformation(token,kind,IntPtr.Zero,0,out length);
        Require(length>=4&&length<=4096);IntPtr buffer=Marshal.AllocHGlobal(length);
        try {Require(GetTokenInformation(token,kind,buffer,length,out length));return buffer;}
        catch {Marshal.FreeHGlobal(buffer);throw;}
    }
    static void CheckContained(IntPtr process,IntPtr job,IntPtr expectedSid) {
        bool included;Require(IsProcessInJob(process,job,out included)&&included);
        IntPtr token=IntPtr.Zero,flag=IntPtr.Zero,container=IntPtr.Zero,capabilityGroups=IntPtr.Zero;
        try {
            Require(OpenProcessToken(process,8,out token));flag=TokenInformation(token,29);
            Require(Marshal.ReadInt32(flag)==1);
            container=TokenInformation(token,31);IntPtr actualSid=Marshal.ReadIntPtr(container);
            Require(actualSid!=IntPtr.Zero&&EqualSid(actualSid,expectedSid));
            capabilityGroups=TokenInformation(token,30);
            // TOKEN_GROUPS begins with GroupCount. No network or other capability SID is allowed.
            Require(Marshal.ReadInt32(capabilityGroups)==0);
        } finally {
            if(token!=IntPtr.Zero)CloseHandle(token);
            foreach(IntPtr value in new IntPtr[]{flag,container,capabilityGroups})if(value!=IntPtr.Zero)Marshal.FreeHGlobal(value);
        }
    }
    static readonly string[] DocumentRuntimeFiles={"node.exe","engine.cjs","engine-manifest.json","openssl.cnf"};
    static readonly string[] DocumentJobFiles={"input.bin","request.json","output.bin","result.json","error.json",".pdfix-document-job.json",".pdfix-sandbox.json"};
    static bool DocumentFilesWithinLimit(string folder,bool word) {
        long total=0;string[] files=Directory.GetFiles(folder);if(files.Length!=DocumentJobFiles.Length)return false;
        foreach(string file in files) {
            NoReparse(file);string name=Path.GetFileName(file);if(!DocumentJobFiles.Contains(name))return false;
            // Broker envelope matches the fixed engine maxima; each operation still enforces its narrower request/source budget.
            long limit=name=="input.bin"?256L*1024*1024:name=="output.bin"?100L*1024*1024:name=="result.json"?(word?320L:32L)*1024*1024:name=="request.json"?(word?320L:36L)*1024*1024:4096;
            long size=new FileInfo(file).Length;if(size>limit)return false;total+=size;
        }
        if(total>(word?996L:424L)*1024*1024+12288)return false;
        string[] directories=Directory.GetDirectories(folder);if(directories.Length!=1||Path.GetFileName(directories[0])!="_sandbox-runtime")return false;
        NoReparse(directories[0]);if(Directory.GetDirectories(directories[0]).Length!=0)return false;
        string[] staged=Directory.GetFiles(directories[0]);if(staged.Length!=DocumentRuntimeFiles.Length)return false;
        foreach(string file in staged){NoReparse(file);if(!DocumentRuntimeFiles.Contains(Path.GetFileName(file)))return false;}
        return true;
    }
    static bool PagedFilesWithinLimit(string folder,bool session=false) {
        // FileInfo.Length is signed Int64. Never read or aggregate the disk-backed source.
        string[] permitted={"input.pdf","output.pdf",".pdfix-job.json",".pdfix-sandbox.json"};
        bool input=false,marker=false,sandbox=false;
        foreach(string file in Directory.EnumerateFiles(folder)) {
            NoReparse(file);string name=Path.GetFileName(file);if(!permitted.Contains(name))return false;
            long length=new FileInfo(file).Length;
            if(name=="input.pdf"){if(length<1)return false;input=true;}
            else if(length>(name=="output.pdf"?32L*1024*1024:512))return false;
            if(name==".pdfix-job.json")marker=true;if(name==".pdfix-sandbox.json")sandbox=true;
        }
        string[] directories=Directory.GetDirectories(folder);
        if(!input||!marker||!sandbox||directories.Length!=1||Path.GetFileName(directories[0])!="_sandbox-runtime")return false;
        NoReparse(directories[0]);if(Directory.GetDirectories(directories[0]).Length!=0)return false;
        string[] expected=session?SessionRuntimeFiles:RuntimeFiles;
        string[] staged=Directory.GetFiles(directories[0]);if(staged.Length!=expected.Length)return false;
        foreach(string file in staged){NoReparse(file);if(!expected.Contains(Path.GetFileName(file)))return false;}
        return true;
    }
    static bool FilesWithinLimit(string folder,JobProfile profile) {
        if(profile==JobProfile.Document||profile==JobProfile.WordDocument)return DocumentFilesWithinLimit(folder,profile==JobProfile.WordDocument);
        if(profile==JobProfile.Paged)return PagedFilesWithinLimit(folder);
        if(profile==JobProfile.Session)return PagedFilesWithinLimit(folder,true);
        // A watchdog rather than a disk quota. Reparse points and unexpected nesting stop the job.
        long bytes=0;int files=0;
        string[] permitted={"input.pdf","output.pdf","source-clear.pdf","edited-clear.pdf","output-clear.pdf",".pdfix-job.json",".pdfix-password-job.json",".pdfix-sandbox.json"};
        foreach(string file in Directory.EnumerateFiles(folder)) {
            NoReparse(file);string name=Path.GetFileName(file);long length=new FileInfo(file).Length;
            if(!permitted.Contains(name)||length>(name.EndsWith(".pdf")?100L*1024*1024:512))return false;
            bytes+=length;if(++files>permitted.Length||bytes>400L*1024*1024+1536)return false;
        }
        foreach(string directory in Directory.EnumerateDirectories(folder)) {
            NoReparse(directory);if(Path.GetFileName(directory)!="_sandbox-runtime"||Directory.GetDirectories(directory).Length!=0)return false;
            string[] staged=Directory.GetFiles(directory);if(staged.Length!=RuntimeFiles.Length)return false;
            foreach(string file in staged){NoReparse(file);if(!RuntimeFiles.Contains(Path.GetFileName(file)))return false;}
        }
        return true;
    }
    static int Run(string folder,string profile,uint parentId,JobProfile mode) {
        bool word=mode==JobProfile.WordDocument,document=mode==JobProfile.Document||word,session=mode==JobProfile.Session,paged=mode==JobProfile.Paged||session;
        NoReparse(folder);Require(System.Text.RegularExpressions.Regex.IsMatch(Path.GetFileName(folder),@"\Ajob-[A-Za-z0-9]{6}\z"));
        string runtime=Path.Combine(folder,"_sandbox-runtime"),exe=Path.Combine(runtime,document?"node.exe":session?"PDFix.PagedSession.exe":"qpdf.exe");
        NoReparse(runtime);Require(Directory.GetDirectories(runtime).Length==0);
        string[] expected=document?DocumentRuntimeFiles:session?SessionRuntimeFiles:RuntimeFiles;
        string[] actual=Directory.GetFiles(runtime);Require(actual.Length==expected.Length);if(document)Require(new FileInfo(Path.Combine(runtime,"openssl.cnf")).Length==0);
        foreach(string file in actual){NoReparse(file);Require(expected.Contains(Path.GetFileName(file))&&new FileInfo(file).Length<(document?128L:64L)*1024*1024);}
        byte[] payload=new byte[0];
        IntPtr sid=IntPtr.Zero,job=IntPtr.Zero,parent=IntPtr.Zero,attributes=IntPtr.Zero,capabilities=IntPtr.Zero,handles=IntPtr.Zero,jobList=IntPtr.Zero,childPolicy=IntPtr.Zero,environment=IntPtr.Zero;
        IntPtr inRead=IntPtr.Zero,inWrite=IntPtr.Zero,outRead=IntPtr.Zero,outWrite=IntPtr.Zero,errRead=IntPtr.Zero,errWrite=IntPtr.Zero;
        PROCESS_INFORMATION child=new PROCESS_INFORMATION();bool initialized=false;int result=SetupFailure;
        IntPtr station=IntPtr.Zero,desktop=IntPtr.Zero,originalDesktop=IntPtr.Zero;
        bool stationGranted=false;SecurityIdentifier desktopIdentity=null;string desktopPath=null;
        try {
            Stage="parent";
            parent=OpenProcess(0x00100000,false,parentId);Require(parent!=IntPtr.Zero&&WaitForSingleObject(parent,0)==WAIT_TIMEOUT);
            Stage="input";
            if(!session)payload=Arguments(parent);Require(FilesWithinLimit(folder,mode));
            if(document)Require(Encoding.UTF8.GetString(payload)=="PDFix.Document.Engine.v1\n");
            // Create the sole writable slot as broker, so the child cannot create arbitrary files.
            if(paged&&!File.Exists(Path.Combine(folder,"output.pdf"))) {
                using(FileStream slot=new FileStream(Path.Combine(folder,"output.pdf"),FileMode.CreateNew,FileAccess.Write,FileShare.None)){}
            }
            Stage="profile";
            int created=CreateAppContainerProfile(profile,"PDFix document job","Isolated PDFix PDF processing",IntPtr.Zero,0,out sid);
            if(created==unchecked((int)0x800700B7))created=DeriveAppContainerSidFromAppContainerName(profile,out sid);
            if(created<0){NativeError=created;throw new InvalidOperationException("AppContainer profile failed.");}
            Require(sid!=IntPtr.Zero);SecurityIdentifier identity=new SecurityIdentifier(sid);
            if(paged) {
                Stage="desktop";station=GetProcessWindowStation();Require(station!=IntPtr.Zero);
                originalDesktop=GetThreadDesktop(GetCurrentThreadId());Require(originalDesktop!=IntPtr.Zero);
                string desktopName="PDFix."+Guid.NewGuid().ToString("N"),stationName="PDFix."+Guid.NewGuid().ToString("N");desktopIdentity=identity;
                StringBuilder actualStation=new StringBuilder(512);uint stationLength;
                Require(GetUserObjectInformationW(station,2,actualStation,1024,out stationLength)&&stationLength<=1024);stationName=actualStation.ToString();
                desktop=PrivateDesktop(desktopName,identity);
                Require(SetThreadDesktop(originalDesktop));
                desktopPath=stationName+"\\"+desktopName;
                stationGranted=GrantStationRead(station,identity);
            }
            // Package SID has no network capabilities. Only this app-owned staging directory is granted.
            Stage="permissions";LowLabel(folder);
            if(document||paged){GrantDocumentDirectory(folder,identity);GrantDocumentDirectory(runtime,identity);foreach(string file in actual)GrantDocumentFile(file,identity,FileSystemRights.ReadAndExecute);}
            else {GrantDirectory(folder,identity,FileSystemRights.Modify,true);GrantDirectory(runtime,identity,FileSystemRights.ReadAndExecute,true);foreach(string file in actual)GrantFile(file,identity,FileSystemRights.ReadAndExecute);}
            foreach(string file in Directory.GetFiles(folder)) {
                NoReparse(file);
                string name=Path.GetFileName(file);
                if(document)GrantDocumentFile(file,identity,name=="output.bin"||name=="result.json"||name=="error.json"?FileSystemRights.Read|FileSystemRights.Write:FileSystemRights.Read);
                else if(paged){GrantDocumentFile(file,identity,name=="output.pdf"?FileSystemRights.Read|FileSystemRights.Write:FileSystemRights.Read);if(name=="output.pdf")LowLabel(file);}
                else if(name=="input.pdf"||name.StartsWith(".pdfix-"))GrantFile(file,identity,FileSystemRights.Read);
            }
            Stage="job";job=CreateJobObjectW(IntPtr.Zero,null);Require(job!=IntPtr.Zero);
            EXTENDED_LIMIT limits=new EXTENDED_LIMIT();limits.Basic.Flags=0x00002000|0x00000100|0x00000200|0x00000008|(session?0u:0x00000004u);
            limits.Basic.ActiveProcessLimit=1;limits.Basic.JobTime=(word?300L:120L)*10000000;limits.ProcessMemory=new UIntPtr((ulong)(word?WordMemory:Memory));limits.JobMemory=new UIntPtr((ulong)(word?WordMemory:Memory));
            Require(SetInformationJobObject(job,9,ref limits,(uint)Marshal.SizeOf(typeof(EXTENDED_LIMIT))));
            Stage="pipes";SECURITY_ATTRIBUTES sa=new SECURITY_ATTRIBUTES();sa.Length=Marshal.SizeOf(typeof(SECURITY_ATTRIBUTES));sa.Inherit=true;
            Require(CreatePipe(out inRead,out inWrite,ref sa,0));Require(CreatePipe(out outRead,out outWrite,ref sa,0));Require(CreatePipe(out errRead,out errWrite,ref sa,0));
            Require(SetHandleInformation(inWrite,1,0));Require(SetHandleInformation(outRead,1,0));Require(SetHandleInformation(errRead,1,0));
            Stage="attributes";IntPtr size=IntPtr.Zero;InitializeProcThreadAttributeList(IntPtr.Zero,4,0,ref size);Require(size.ToInt64()>0);
            attributes=Marshal.AllocHGlobal(size);Require(InitializeProcThreadAttributeList(attributes,4,0,ref size));initialized=true;
            SECURITY_CAPABILITIES caps=new SECURITY_CAPABILITIES();caps.Sid=sid;capabilities=StructPointer(caps);AddAttribute(attributes,0x00020009,capabilities,Marshal.SizeOf(typeof(SECURITY_CAPABILITIES)));
            handles=Marshal.AllocHGlobal(3*IntPtr.Size);Marshal.WriteIntPtr(handles,0,inRead);Marshal.WriteIntPtr(handles,IntPtr.Size,outWrite);Marshal.WriteIntPtr(handles,2*IntPtr.Size,errWrite);AddAttribute(attributes,0x00020002,handles,3*IntPtr.Size);
            jobList=Marshal.AllocHGlobal(IntPtr.Size);Marshal.WriteIntPtr(jobList,job);AddAttribute(attributes,0x0002000D,jobList,IntPtr.Size);
            childPolicy=Marshal.AllocHGlobal(4);Marshal.WriteInt32(childPolicy,1);AddAttribute(attributes,0x0002000E,childPolicy,4);
            string system=Environment.GetFolderPath(Environment.SpecialFolder.Windows);
            // No inherited keys, proxy settings, user PATH or QPDF options.
            Stage="environment";Require(!String.IsNullOrEmpty(system)&&Path.IsPathRooted(system));
            environment=ChildEnvironment(system,folder,runtime);
            // Windows propagates SetDllDirectory to a child at process creation.
            // The only added directory is the pinned, read-only runtime; never
            // search the user's working directory or inherited PATH.
            Stage="loader";Require(SetDllDirectoryW(runtime));
            STARTUPINFOEX startup=new STARTUPINFOEX();startup.Startup.cb=Marshal.SizeOf(typeof(STARTUPINFOEX));startup.Startup.Desktop=desktopPath;startup.Startup.Flags=0x100;startup.Startup.Input=inRead;startup.Startup.Output=outWrite;startup.Startup.Error=errWrite;startup.Attributes=attributes;
            // The broker already rejects reparse paths and pins this exact main
            // bundle. Avoid Node realpath traversal of ungranted ancestors (C:\)
            // during startup; do not add broader filesystem grants to the token.
            string command=document?"\""+exe+"\" "+(word?"--max-old-space-size=2048 --max-semi-space-size=64":"--max-old-space-size=256 --max-semi-space-size=32")+" --stack-size=4096 --no-addons --preserve-symlinks-main \""+Path.Combine(runtime,"engine.cjs")+"\"":session?"\""+exe+"\" \""+folder+"\"":"\""+exe+"\" @-";
            // No console host is needed: all three standard handles are pipes.
            // DETACHED_PROCESS avoids console initialization inside a one-process,
            // child-process-restricted AppContainer; CREATE_NO_WINDOW may still
            // initialize console infrastructure before the engine's entry point.
            Stage="launch";Require(CreateProcessW(exe,new StringBuilder(command),IntPtr.Zero,IntPtr.Zero,true,0x00080000|0x00000400|0x00000008|0x4,environment,paged?runtime:folder,ref startup,out child));
            // OS token and actual Job Object membership are checked while the process is still suspended.
            Stage="containment";CheckContained(child.Process,job,sid);
            Require(WaitForSingleObject(parent,0)==WAIT_TIMEOUT);
            CloseHandle(inRead);inRead=IntPtr.Zero;CloseHandle(outWrite);outWrite=IntPtr.Zero;CloseHandle(errWrite);errWrite=IntPtr.Zero;
            IntPtr output=outRead,error=errRead;outRead=errRead=IntPtr.Zero;
            SessionControl sessionControl=session?new SessionControl():null;
            Task stdout=Task.Run(()=>{if(session)SessionOutput(output,Console.OpenStandardOutput(),sessionControl,child.ProcessId);else CopyPipe(output,Console.OpenStandardOutput());}),stderr=Task.Run(()=>CopyPipe(error,Console.OpenStandardError()));
            Stopwatch running=Stopwatch.StartNew();
            Stage="execution";Require(ResumeThread(child.Thread)!=UInt32.MaxValue);
            IntPtr input=inWrite;inWrite=IntPtr.Zero;Task stdin=Task.Run(()=>{if(session)SessionInput(input,sessionControl);else WritePipe(input,payload);});
            // Pipe backpressure must never delay the wall-clock or parent-death watchdog.
            while(true) {
                    uint wait=WaitForMultipleObjects(2,new IntPtr[]{child.Process,parent},false,250u);
                if(wait==WAIT_OBJECT_0){uint exit;Require(GetExitCodeProcess(child.Process,out exit));result=(int)exit;break;}
                if(wait!=WAIT_TIMEOUT||(session?sessionControl.Expired():running.ElapsedMilliseconds>=(word?295000:115000))||stdout.IsFaulted||stderr.IsFaulted||stdin.IsFaulted||!FilesWithinLimit(folder,mode)){TerminateJobObject(job,LimitFailure);result=LimitFailure;break;}
            }
            TerminateJobObject(job,(uint)result);WaitForSingleObject(child.Process,5000);
            // A persistent request pump can still be waiting for the parent.
            // Child exit must be observable without waiting for parent stdin EOF.
            Require(Task.WaitAll(session?new Task[]{stdout,stderr}:new Task[]{stdin,stdout,stderr},5000));
        } catch(Exception error) {result=SetupFailure;ReportFailure(Stage,NativeError!=0?NativeError:error.HResult);}
        finally {
            Array.Clear(payload,0,payload.Length);
            if(job!=IntPtr.Zero)TerminateJobObject(job,(uint)SetupFailure);
            if(child.Process!=IntPtr.Zero){TerminateProcess(child.Process,SetupFailure);WaitForSingleObject(child.Process,5000);CloseHandle(child.Process);}if(child.Thread!=IntPtr.Zero)CloseHandle(child.Thread);
            try {if(stationGranted)RemoveStationRead(station,desktopIdentity);}
            catch(Exception error){result=CleanupFailure;ReportFailure("desktopcleanup",error.HResult);}
            try {if(desktop!=IntPtr.Zero){if(originalDesktop!=IntPtr.Zero)Require(SetThreadDesktop(originalDesktop));Require(CloseDesktop(desktop));}}
            catch(Exception error){result=CleanupFailure;ReportFailure("desktopcleanup",error.HResult);}
            foreach(IntPtr handle in new IntPtr[]{inRead,inWrite,outRead,outWrite,errRead,errWrite,parent,job})if(handle!=IntPtr.Zero)CloseHandle(handle);
            if(initialized)DeleteProcThreadAttributeList(attributes);
            foreach(IntPtr allocation in new IntPtr[]{attributes,capabilities,handles,jobList,childPolicy,environment})if(allocation!=IntPtr.Zero)Marshal.FreeHGlobal(allocation);
            if(sid!=IntPtr.Zero)FreeSid(sid);
            // Paged reading reuses the exact same private staging directory and SID.
            // Keep its profile until session cleanup, rather than delete/recreate per page.
            if(!paged&&!RemoveProfile(profile)){result=CleanupFailure;ReportFailure("cleanup",0);}
        }
        return result;
    }
    static int Main(string[] args) {
        try {
            if(args.Length==2&&args[0]=="--cleanup"&&ValidProfile(args[1])){Stage="desktopcleanup";return CleanupProfile(args[1])?0:CleanupFailure;}
            uint parent;
            if(args.Length==4&&args[0]=="--document"&&ValidProfile(args[2])&&UInt32.TryParse(args[3],out parent))return Run(Path.GetFullPath(args[1]),args[2],parent,JobProfile.Document);
            if(args.Length==4&&args[0]=="--document-word"&&ValidProfile(args[2])&&UInt32.TryParse(args[3],out parent))return Run(Path.GetFullPath(args[1]),args[2],parent,JobProfile.WordDocument);
            if(args.Length==4&&args[0]=="--paged"&&ValidProfile(args[2])&&UInt32.TryParse(args[3],out parent))return Run(Path.GetFullPath(args[1]),args[2],parent,JobProfile.Paged);
            if(args.Length==4&&args[0]=="--paged-session"&&ValidProfile(args[2])&&UInt32.TryParse(args[3],out parent))return Run(Path.GetFullPath(args[1]),args[2],parent,JobProfile.Session);
            if(args.Length!=3||!ValidProfile(args[1])||!UInt32.TryParse(args[2],out parent))return SetupFailure;
            return Run(Path.GetFullPath(args[0]),args[1],parent,JobProfile.Native);
        } catch(Exception error) {ReportFailure(Stage,NativeError!=0?NativeError:error.HResult);return SetupFailure;}
    }
}
