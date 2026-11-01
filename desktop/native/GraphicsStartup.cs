// This trusted launcher never reads documents, kills processes, or changes security.
// It only supervises its fixed sibling runtime until orderly exit, with ONE opt-in retry.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;

internal sealed class GraphicsAttempt {
 public string mode; public bool interactive; public int? exitCode;
 public bool confirmedGraphicsFailure;
}
internal sealed class GraphicsReceipt {
 public int version=1; public string startedAt=DateTime.UtcNow.ToString("o");
 public List<GraphicsAttempt> attempts=new List<GraphicsAttempt>();
 public string decision="not-needed",successfulMode=null,finishedAt=null;
}
internal static class GraphicsPolicy {
 internal static bool MayOffer(int attempt,bool exited,int exitCode,bool interactive,bool starting,bool fatal) {
  return attempt==0 && exited && exitCode!=0 && !interactive && starting && fatal;
 }
 // Windows CreateProcess quoting, including trailing backslashes and empty arguments.
 internal static string Quote(string text) {
  StringBuilder b=new StringBuilder("\""); int slash=0;
  foreach(char c in text){if(c=='\\'){slash++;continue;}if(c=='"'){b.Append('\\',slash*2+1);b.Append(c);}else{b.Append('\\',slash);b.Append(c);}slash=0;}
  b.Append('\\',slash*2);return b.Append('"').ToString();
 }
}
internal static class GraphicsStartup {
 internal const string TokenEnv="PDFIX_GRAPHICS_TOKEN",ModeEnv="PDFIX_GRAPHICS_MODE",StateEnv="PDFIX_GRAPHICS_STATE";
 internal static bool AskRetry() {
  using(Form form=new Form()){
   form.Text="PDFix could not open";form.StartPosition=FormStartPosition.CenterScreen;
   form.FormBorderStyle=FormBorderStyle.FixedDialog;form.MaximizeBox=false;form.MinimizeBox=false;
   form.AutoScaleMode=AutoScaleMode.Dpi;form.ClientSize=new System.Drawing.Size(540,205);
   Label text=new Label();text.Text="PDFix could not start its graphics.\r\n\r\nTry once with simpler graphics? Large drawings may scroll more slowly. This change lasts only for this launch.";
   text.SetBounds(20,18,500,115);form.Controls.Add(text);
   Button retry=new Button();retry.Text="Try again with simpler graphics";retry.SetBounds(20,150,320,36);retry.DialogResult=DialogResult.Yes;form.Controls.Add(retry);
   Button close=new Button();close.Text="Close";close.SetBounds(365,150,145,36);close.DialogResult=DialogResult.No;form.Controls.Add(close);
   form.AcceptButton=close;form.CancelButton=close;form.Shown+=(sender,e)=>close.Focus();
   return form.ShowDialog()==DialogResult.Yes;
  }
 }
 internal static void SaveReceipt(GraphicsReceipt receipt,string directory) {
  // One bounded latest receipt; no file paths, arguments, document content or raw logs.
  Directory.CreateDirectory(directory);
  string target=Path.Combine(directory,"graphics-startup-last.json"),temporary=Path.Combine(directory,"graphics-startup-"+Guid.NewGuid().ToString("N")+".partial");
  try {
   byte[] bytes=Encoding.UTF8.GetBytes(new JavaScriptSerializer().Serialize(receipt));
   using(FileStream file=new FileStream(temporary,FileMode.CreateNew,FileAccess.Write,FileShare.None)){file.Write(bytes,0,bytes.Length);file.Flush(true);}
   if(File.Exists(target))File.Replace(temporary,target,null);else File.Move(temporary,target);
  } finally {if(File.Exists(temporary))File.Delete(temporary);}
 }
 internal static string ReadState(string file) {
  try{FileInfo info=new FileInfo(file);if(!info.Exists||info.Length>160||(info.Attributes&FileAttributes.ReparsePoint)!=0)return "invalid";return File.ReadAllText(file);}catch{return "invalid";}
 }
 internal static int Run(string executable,string[] args,Func<bool> ask,Action<string> failed,Action<GraphicsReceipt> save) {
  GraphicsReceipt receipt=new GraphicsReceipt();
  for(int attempt=0;attempt<2;attempt++) {
   string mode=attempt==0?"normal":"software",token=Guid.NewGuid().ToString("N"),directory=Path.Combine(Path.GetTempPath(),"pdfix-graphics-startup-"+token),state=Path.Combine(directory,"state");
   Directory.CreateDirectory(directory);File.WriteAllText(state,token+":starting:"+mode,new UTF8Encoding(false));
   GraphicsAttempt result=new GraphicsAttempt();result.mode=mode;receipt.attempts.Add(result);
   try {
    ProcessStartInfo start=new ProcessStartInfo(executable);start.UseShellExecute=false;start.CreateNoWindow=true;start.WorkingDirectory=Environment.CurrentDirectory;
    start.Arguments=String.Join(" ",Array.ConvertAll(args,GraphicsPolicy.Quote));start.RedirectStandardError=true;
    start.EnvironmentVariables[TokenEnv]=token;start.EnvironmentVariables[ModeEnv]=mode;start.EnvironmentVariables[StateEnv]=state;
    // An inherited Node-mode flag would run a different program instead of PDFix.
    start.EnvironmentVariables.Remove("ELECTRON_RUN_AS_NODE");
    using(Process child=new Process())using(ManualResetEvent stderrEnded=new ManualResetEvent(false)){
     child.StartInfo=start;int fatal=0;
     child.ErrorDataReceived+=(sender,e)=>{if(e.Data==null){try{stderrEnded.Set();}catch(ObjectDisposedException){}return;}if(e.Data.Contains("GPU process isn't usable. Goodbye.")||e.Data.Contains("GPU process isn’t usable. Goodbye."))Interlocked.Exchange(ref fatal,1);};
     child.Start();child.BeginErrorReadLine();
     // Keep a small native watcher, never a second Electron window/process.
     while(!child.WaitForExit(250)){
      if(!result.interactive&&ReadState(state)==token+":interactive:"+mode){result.interactive=true;receipt.successfulMode=mode;try{save(receipt);}catch{/* Receipt failure must not interrupt working documents. */}}
     }
     // A descendant holding stderr open must not strand this launcher after exit.
     if(!stderrEnded.WaitOne(2000))try{child.CancelErrorRead();}catch(InvalidOperationException){}result.exitCode=child.ExitCode;result.confirmedGraphicsFailure=Interlocked.CompareExchange(ref fatal,0,0)!=0;
     string last=ReadState(state);result.interactive|=last==token+":interactive:"+mode;
     if(result.interactive)receipt.successfulMode=mode;
     bool offer=GraphicsPolicy.MayOffer(attempt,true,child.ExitCode,result.interactive,last==token+":starting:"+mode,result.confirmedGraphicsFailure);
     try{save(receipt);}catch{}
     if(offer){receipt.decision="declined";if(ask()){receipt.decision="accepted";try{save(receipt);}catch{};continue;}}
     else if(attempt==1&&!result.interactive&&child.ExitCode!=0)failed("PDFix still could not open. Note the time and report it. No further restart will be attempted.");
     receipt.finishedAt=DateTime.UtcNow.ToString("o");try{save(receipt);}catch{}return child.ExitCode;
    }
   } finally {try{File.Delete(state);Directory.Delete(directory);}catch{/* Only this launch's two generated paths; no recursive cleanup. */}}
  }
  return 1;
 }
 [STAThread] internal static int Main(string[] args) {
  try{
   Application.EnableVisualStyles();
   string executable=Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"runtime","PDFix.exe");
   if(!File.Exists(executable)||(File.GetAttributes(executable)&FileAttributes.ReparsePoint)!=0)throw new IOException("Keep the complete PDFix application folder together, including its runtime folder.");
   string testProfile=Environment.GetEnvironmentVariable("PDFIX_TEST_DATA");
   string receipts=String.IsNullOrEmpty(testProfile)?Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),"pdfix-document-workspace"):Path.GetFullPath(testProfile);
   return Run(executable,args,AskRetry,message=>MessageBox.Show(message,"PDFix could not open",MessageBoxButtons.OK,MessageBoxIcon.Warning),receipt=>SaveReceipt(receipt,receipts));
  }catch(Exception){MessageBox.Show("PDFix could not start. Keep its complete application folder together and try again. If it still fails, note the time and report it.","PDFix could not open",MessageBoxButtons.OK,MessageBoxIcon.Warning);return 1;}
 }
}
