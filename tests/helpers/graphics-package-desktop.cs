using System;using System.IO;using System.Text;using System.Threading;using System.Collections.Generic;using System.Runtime.InteropServices;using System.Web.Script.Serialization;using System.Drawing;using System.Drawing.Imaging;
internal static class PackagedGraphicsDesktop {
 [StructLayout(LayoutKind.Sequential,CharSet=CharSet.Unicode)]struct STARTUPINFO{public int cb;public string reserved,desktop,title;public int x,y,xSize,ySize,xCount,yCount,fill,flags;public short show,reserved2;public IntPtr reservedPtr,input,output,error;}
 [StructLayout(LayoutKind.Sequential)]struct PROCESS_INFORMATION{public IntPtr process,thread;public int pid,tid;}
 [StructLayout(LayoutKind.Sequential)]struct RECT{public int left,top,right,bottom;}
 delegate bool EnumWindowsProc(IntPtr h,IntPtr l);
 [DllImport("user32.dll",CharSet=CharSet.Unicode,SetLastError=true)]static extern IntPtr CreateDesktop(string n,IntPtr d,IntPtr m,uint f,uint a,IntPtr s);
 [DllImport("user32.dll")]static extern bool CloseDesktop(IntPtr h);
 [DllImport("user32.dll")]static extern bool EnumDesktopWindows(IntPtr d,EnumWindowsProc p,IntPtr l);
 [DllImport("user32.dll")]static extern bool EnumChildWindows(IntPtr h,EnumWindowsProc p,IntPtr l);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)]static extern int GetWindowText(IntPtr h,StringBuilder b,int n);
 [DllImport("user32.dll")]static extern uint GetWindowThreadProcessId(IntPtr h,out uint pid);
 [DllImport("user32.dll")]static extern bool PostMessage(IntPtr h,uint m,IntPtr w,IntPtr l);
 [DllImport("user32.dll")]static extern bool GetWindowRect(IntPtr h,out RECT r);
 [DllImport("user32.dll")]static extern bool PrintWindow(IntPtr h,IntPtr dc,uint f);
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)]static extern bool CreateProcess(string a,StringBuilder c,IntPtr pa,IntPtr ta,bool inherit,uint flags,IntPtr env,string cwd,ref STARTUPINFO si,out PROCESS_INFORMATION pi);
 [DllImport("kernel32.dll")]static extern uint WaitForSingleObject(IntPtr h,uint ms);
 [DllImport("kernel32.dll")]static extern bool GetExitCodeProcess(IntPtr h,out uint code);
 [DllImport("kernel32.dll")]static extern bool CloseHandle(IntPtr h);
 [DllImport("kernel32.dll")]static extern bool TerminateProcess(IntPtr h,uint code);
 static string Text(IntPtr h){StringBuilder b=new StringBuilder(4096);GetWindowText(h,b,b.Capacity);return b.ToString();}
 static string Quote(string s){StringBuilder b=new StringBuilder("\"");int slash=0;foreach(char c in s){if(c=='\\'){slash++;continue;}if(c=='\"'){b.Append('\\',slash*2+1);b.Append(c);}else{b.Append('\\',slash);b.Append(c);}slash=0;}b.Append('\\',slash*2);return b.Append('"').ToString();}
 static int Main(string[] args){string desktopName="PDFixGraphicsTest"+Guid.NewGuid().ToString("N");IntPtr desk=CreateDesktop(desktopName,IntPtr.Zero,IntPtr.Zero,0,0x10000000,IntPtr.Zero);if(desk==IntPtr.Zero)throw new Exception("Could not create the private test desktop: "+Marshal.GetLastWin32Error());PROCESS_INFORMATION pi=new PROCESS_INFORMATION();List<object> dialogs=new List<object>();bool finished=false;try{
  STARTUPINFO si=new STARTUPINFO();si.cb=Marshal.SizeOf(si);si.desktop=desktopName; // No SwitchDesktop call: all prompts remain off the input desktop.
  string[] forwarded={"", "space value", "quote\"value", "C:\\path with space\\", "x\\\"y", "--editor", "C:\\a b\\drawing.pdf"};StringBuilder cmd=new StringBuilder(Quote(args[0]));foreach(string s in forwarded)cmd.Append(" "+Quote(s));
  if(!CreateProcess(args[0],cmd,IntPtr.Zero,IntPtr.Zero,false,0x08000000,IntPtr.Zero,Path.GetDirectoryName(args[0]),ref si,out pi))throw new Exception("Test launcher failed: "+Marshal.GetLastWin32Error());CloseHandle(pi.thread);pi.thread=IntPtr.Zero;
  DateTime until=DateTime.UtcNow.AddSeconds(40);HashSet<string> handled=new HashSet<string>();
  while(WaitForSingleObject(pi.process,50)==258){if(DateTime.UtcNow>until)throw new Exception("Packaged launcher test exceeded its deadline.");EnumDesktopWindows(desk,(window,l)=>{uint pid;GetWindowThreadProcessId(window,out pid);if(pid!=pi.pid||Text(window)!="PDFix could not open")return true;List<string> names=new List<string>();IntPtr button=IntPtr.Zero;bool retry=false;EnumChildWindows(window,(child,z)=>{string text=Text(child);if(text.Length>0)names.Add(text);if(text=="Try again with simpler graphics")retry=true;return true;},IntPtr.Zero);string choice=retry?(args[1]=="decline"?"Close":"Try again with simpler graphics"):"OK";EnumChildWindows(window,(child,z)=>{string text=Text(child);if(text==choice||choice=="OK"&&text=="&OK")button=child;return true;},IntPtr.Zero);string identity=window.ToInt64()+":"+choice;if(button!=IntPtr.Zero&&handled.Add(identity)){string png=Path.Combine(args[2],"prompt-"+dialogs.Count+".png");bool captured=false;RECT rect;if(GetWindowRect(window,out rect)&&rect.right>rect.left&&rect.bottom>rect.top&&rect.right-rect.left<1600&&rect.bottom-rect.top<1200){using(Bitmap bitmap=new Bitmap(rect.right-rect.left,rect.bottom-rect.top)){using(Graphics g=Graphics.FromImage(bitmap)){IntPtr dc=g.GetHdc();try{captured=PrintWindow(window,dc,0);}finally{g.ReleaseHdc(dc);}}bitmap.Save(png,ImageFormat.Png);}}dialogs.Add(new{title=Text(window),controls=names,choice=choice,screenshot=png,captured=captured,privateDesktop=true});PostMessage(button,0x00F5,IntPtr.Zero,IntPtr.Zero);}return true;},IntPtr.Zero);}
  uint exit;GetExitCodeProcess(pi.process,out exit);finished=true;if(!CloseDesktop(desk))throw new Exception("Test desktop did not close.");desk=IntPtr.Zero;Console.WriteLine(new JavaScriptSerializer().Serialize(new{exit=exit,dialogs=dialogs,privateDesktop=true,desktopClosed=true}));return 0;
 }finally{if(pi.process!=IntPtr.Zero){if(!finished){TerminateProcess(pi.process,99);WaitForSingleObject(pi.process,5000);}CloseHandle(pi.process);}if(desk!=IntPtr.Zero)CloseDesktop(desk);}}
}
