$ErrorActionPreference = 'Stop'
# Read-only diagnostics of the caller's window station. No desktop switching,
# permission changes, profile removal or GPU settings.
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Security.AccessControl;
using System.Security.Cryptography;
public static class ReaderDesktopResources {
 [DllImport("user32.dll")] static extern IntPtr GetProcessWindowStation();
 [DllImport("user32.dll", SetLastError=true)] static extern bool GetUserObjectSecurity(IntPtr h, ref uint flags, byte[] bytes, uint length, out uint needed);
 delegate bool DesktopCallback([MarshalAs(UnmanagedType.LPWStr)] string name, IntPtr state);
 [DllImport("user32.dll", CharSet=CharSet.Unicode, SetLastError=true)] static extern bool EnumDesktopsW(IntPtr station, DesktopCallback callback, IntPtr state);
 public sealed class Result { public int sessionId, desktops, pdfixDesktops, aclBytes, aceCount; public string aclSha256; }
 public static Result Read() {
  var r=new Result();r.sessionId=System.Diagnostics.Process.GetCurrentProcess().SessionId;
  IntPtr station=GetProcessWindowStation();if(station==IntPtr.Zero)throw new Exception("Window station unavailable");
  DesktopCallback callback=(name,state)=>{r.desktops++;if(name.StartsWith("PDFix.",StringComparison.Ordinal))r.pdfixDesktops++;return true;};
  if(!EnumDesktopsW(station,callback,IntPtr.Zero))throw new Exception("Desktop enumeration failed: "+Marshal.GetLastWin32Error());
  uint flags=4,needed;GetUserObjectSecurity(station,ref flags,null,0,out needed);if(needed==0||needed>65536)throw new Exception("Window-station security size unavailable");
  byte[] bytes=new byte[needed];if(!GetUserObjectSecurity(station,ref flags,bytes,(uint)bytes.Length,out needed))throw new Exception("Window-station security read failed");
  r.aclBytes=bytes.Length;r.aceCount=new RawSecurityDescriptor(bytes,0).DiscretionaryAcl.Count;
  using(var sha=SHA256.Create())r.aclSha256=BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-","").ToLowerInvariant();
  return r;
 }
}
'@
[ReaderDesktopResources]::Read() | ConvertTo-Json -Compress
