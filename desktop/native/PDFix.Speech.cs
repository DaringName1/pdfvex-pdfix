// Bounded plain-text Windows SAPI adapter. No document paths, SSML, URLs,
// shell commands, voice downloads or cloud speech APIs are accepted.
using System;
using System.Text;
using System.Collections.Generic;
using System.Collections.Concurrent;
using System.Diagnostics;
using System.Globalization;
using System.Runtime.InteropServices;
using System.Security.Principal;
using System.Speech.Synthesis;
using System.Threading;
using System.Web.Script.Serialization;

internal static class LocalSpeech {
    const int MaxLine=1400000,MaxChars=200000,MaxChunks=128;
    static readonly object outputLock=new object();
    static readonly JavaScriptSerializer json=new JavaScriptSerializer {MaxJsonLength=MaxLine,RecursionLimit=10};
    static readonly BlockingCollection<Action> actions=new BlockingCollection<Action>(64);
    static string token,session;
    static IntPtr job;
    static long lastHeartbeat=Stopwatch.GetTimestamp();
    static bool running=true,started=false,paused=false;
    static SpeechSynthesizer synth;
    static Prompt current;
    static string[] chunks;
    static int chunkIndex;
    static int outputBytes,events;
    [StructLayout(LayoutKind.Sequential)] struct BasicLimit { public long ProcessTime,JobTime;public uint Flags;public UIntPtr MinWorkingSet,MaxWorkingSet;public uint ActiveProcessLimit;public UIntPtr Affinity;public uint Priority,Scheduling; }
    [StructLayout(LayoutKind.Sequential)] struct Counters { public ulong ReadOperations,WriteOperations,OtherOperations,ReadBytes,WriteBytes,OtherBytes; }
    [StructLayout(LayoutKind.Sequential)] struct ExtendedLimit { public BasicLimit Basic;public Counters IO;public UIntPtr ProcessMemory,JobMemory,PeakProcessMemory,PeakJobMemory; }
    [DllImport("kernel32.dll",SetLastError=true)] static extern IntPtr CreateJobObject(IntPtr attributes,string name);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool SetInformationJobObject(IntPtr handle,int info,ref ExtendedLimit limits,uint size);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool AssignProcessToJobObject(IntPtr handle,IntPtr process);
    static void Need(bool condition) { if(!condition)throw new InvalidOperationException("Invalid local speech request."); }
    static void Limit() {
        job=CreateJobObject(IntPtr.Zero,null);var limits=new ExtendedLimit();
        limits.Basic.Flags=0x2000|0x100|0x8|0x2;
        limits.Basic.ActiveProcessLimit=1;limits.Basic.ProcessTime=120L*10000000;limits.ProcessMemory=new UIntPtr(256UL*1024*1024);
        Need(job!=IntPtr.Zero&&SetInformationJobObject(job,9,ref limits,(uint)Marshal.SizeOf(limits))&&AssignProcessToJobObject(job,Process.GetCurrentProcess().Handle));
    }
    static bool Id(string value,int length) { if(value==null||value.Length!=length)return false;foreach(char c in value)if(!(c>='0'&&c<='9'||c>='a'&&c<='f'||c=='-'))return false;return true; }
    static Dictionary<string,object> Object(object value,params string[] keys) {
        var result=value as Dictionary<string,object>;Need(result!=null&&result.Count==keys.Length);foreach(string key in keys)Need(result.ContainsKey(key));return result;
    }
    static string Text(object value,int maximum) { Need(value is string);string text=(string)value;Need(text.Length<=maximum&&text.IndexOf('\0')<0);return text; }
    static string Clean(string value,int maximum) { var result=new StringBuilder();foreach(char c in value??""){if(result.Length>=maximum)break;result.Append(c<32||c==127?' ':c);}return result.ToString(); }
    static void Emit(string type,Dictionary<string,object> fields) {
        lock(outputLock){
            fields["version"]=1;fields["token"]=token;fields["sessionId"]=session;fields["type"]=type;
            string line=json.Serialize(fields);outputBytes+=Encoding.UTF8.GetByteCount(line)+1;
            if(line.Length>131072||outputBytes>24*1024*1024||++events>100000)Environment.Exit(3);
            Console.WriteLine(line);Console.Out.Flush();
        }
    }
    static void Event(string type) { Emit(type,new Dictionary<string,object>()); }
    static void Queue(Action action) { if(!actions.TryAdd(action))Environment.Exit(3); }
    static string ReadLine() {
        var line=new StringBuilder();int next;
        while((next=Console.In.Read())>=0){if(next=='\n')return line.ToString();Need(next!='\r'&&line.Length<MaxLine);line.Append((char)next);}
        Need(line.Length==0);return null;
    }
    static void ReadCommands() {
        try{int count=0;string line;while((line=ReadLine())!=null){Need(++count<=20000);var request=json.DeserializeObject(line) as Dictionary<string,object>;Need(request!=null&&request.ContainsKey("command"));string command=Text(request["command"],16);
            Object(request,command=="start"?new[]{"token","sessionId","command","chunks","voice","rate"}:new[]{"token","sessionId","command"});
            Need(Text(request["token"],64)==token&&Text(request["sessionId"],36)==session);
            Need(command=="start"||command=="pause"||command=="resume"||command=="stop"||command=="heartbeat");
            if(command=="heartbeat"){Interlocked.Exchange(ref lastHeartbeat,Stopwatch.GetTimestamp());continue;}
            Queue(delegate { Command(command,request); });
        }Queue(delegate {running=false;});}catch{Environment.Exit(3);}
    }
    static void SpeakChunk() {
        lock(outputLock){
            if(chunkIndex>=chunks.Length){running=false;Event("completed");return;}
            // Constructing Prompt from text explicitly avoids interpreting text as SSML.
            current=new Prompt(chunks[chunkIndex],SynthesisTextFormat.Text);
            Emit("chunk",new Dictionary<string,object>{{"chunkIndex",chunkIndex}});synth.SpeakAsync(current);
        }
    }
    static void Command(string command,Dictionary<string,object> request) {
        if(command=="stop"){lock(outputLock){running=false;Event("stopped");}return;}
        if(command=="start"){
            Need(!started);var values=request["chunks"] as object[];Need(values!=null&&values.Length>=1&&values.Length<=MaxChunks);chunks=new string[values.Length];int total=0;
            for(int i=0;i<values.Length;i++){chunks[i]=Text(values[i],4096);Need(!String.IsNullOrWhiteSpace(chunks[i]));total+=chunks[i].Length;Need(total<=MaxChars);}
            string voice=Text(request["voice"],256);Need(voice.Length>0);bool installed=false;foreach(var item in synth.GetInstalledVoices())if(item.Enabled&&item.VoiceInfo.Name==voice)installed=true;Need(installed);
            Need(request["rate"] is int);int rate=(int)request["rate"];Need(rate>=-10&&rate<=10);synth.SelectVoice(voice);synth.Rate=rate;synth.SetOutputToDefaultAudioDevice();started=true;Event("started");SpeakChunk();return;
        }
        Need(started);
        if(command=="pause"){if(!paused){synth.Pause();paused=true;}Event("paused");}
        if(command=="resume"){if(paused){synth.Resume();paused=false;}Event("resumed");}
    }
    static int Main(string[] args) {
        Mutex mutex=null;bool held=false;System.Threading.Timer watchdog=null;Process parent=null;
        try {
            Need(args.Length==4&&(args[0]=="voices-v1"||args[0]=="session-v1")&&Id(args[2],64)&&Id(args[3],36));token=args[2];session=args[3];int pid;Need(Int32.TryParse(args[1],out pid)&&pid>0&&pid!=Process.GetCurrentProcess().Id);
            parent=Process.GetProcessById(pid);long parentStarted=parent.StartTime.ToUniversalTime().Ticks;var lifetime=Stopwatch.StartNew();Limit();
            Console.InputEncoding=new UTF8Encoding(false,true);Console.OutputEncoding=new UTF8Encoding(false);
            watchdog=new System.Threading.Timer(delegate {try{parent.Refresh();if(parent.HasExited||parent.StartTime.ToUniversalTime().Ticks!=parentStarted||lifetime.Elapsed.TotalHours>=2||(Stopwatch.GetTimestamp()-Interlocked.Read(ref lastHeartbeat))/(double)Stopwatch.Frequency>15)Environment.Exit(4);}catch{Environment.Exit(4);}},null,1000,1000);
            synth=new SpeechSynthesizer();
            if(args[0]=="voices-v1"){
                var voices=new List<object>();foreach(var item in synth.GetInstalledVoices()){if(!item.Enabled)continue;Need(voices.Count<128);var info=item.VoiceInfo;Need(info.Name.Length>0&&info.Name.Length<=256&&info.Name.IndexOf('\0')<0);voices.Add(new {id=info.Name,name=Clean(info.Name,256),language=info.Culture.Name});}
                Emit("voices",new Dictionary<string,object>{{"voices",voices},{"backend","Windows System.Speech (installed SAPI voices)"}});return 0;
            }
            mutex=new Mutex(false,"Local\\PDFix.LocalSpeech.v1."+WindowsIdentity.GetCurrent().User.Value);
            try{held=mutex.WaitOne(0);}catch(AbandonedMutexException){held=true;}Need(held);
            synth.SpeakProgress+=delegate(object sender,SpeakProgressEventArgs e){lock(outputLock){if(!running||e.Prompt!=current)return;int index=chunkIndex;if(chunks==null||index>=chunks.Length||e.CharacterPosition<0||e.CharacterCount<1||e.CharacterPosition+e.CharacterCount>chunks[index].Length)return;Emit("progress",new Dictionary<string,object>{{"chunkIndex",index},{"start",e.CharacterPosition},{"length",e.CharacterCount}});}};
            synth.SpeakCompleted+=delegate(object sender,SpeakCompletedEventArgs e){if(!running)return;Prompt completed=e.Prompt;bool cancelled=e.Cancelled;Exception error=e.Error;Queue(delegate {lock(outputLock){if(!running||completed!=current)return;if(error!=null)throw new InvalidOperationException("Windows could not synthesize the selected text.");if(cancelled){running=false;Event("stopped");return;}chunkIndex++;SpeakChunk();}});};
            Event("ready");new Thread(ReadCommands){IsBackground=true}.Start();while(running){Action action;if(actions.TryTake(out action,1000))action();}return 0;
        }catch{try{Emit("error",new Dictionary<string,object>{{"message","Local Windows speech could not complete. Check installed voices and your audio device, then retry."}});}catch{}return 1;}
        finally{if(synth!=null){try{synth.SpeakAsyncCancelAll();synth.Dispose();}catch{}}if(watchdog!=null)watchdog.Dispose();if(held)mutex.ReleaseMutex();if(mutex!=null)mutex.Dispose();if(parent!=null)parent.Dispose();}
    }
}
