using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Web.Script.Serialization;
[StructLayout(LayoutKind.Sequential)]struct PropertyKey {public Guid format;public uint id;}
[StructLayout(LayoutKind.Explicit,Size=24)]struct PropertyValue {[FieldOffset(0)]public ushort type;[FieldOffset(8)]public IntPtr text;}
[ComImport,Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]interface PropertyStore {
 [PreserveSig]int GetCount(out uint count);
 [PreserveSig]int GetAt(uint index,out PropertyKey key);
 [PreserveSig]int GetValue(ref PropertyKey key,out PropertyValue value);
 [PreserveSig]int SetValue(ref PropertyKey key,ref PropertyValue value);
 [PreserveSig]int Commit();
}
class PdfixWindowProperties {
 [DllImport("shell32.dll",PreserveSig=true)]static extern int SHGetPropertyStoreForWindow(IntPtr hwnd,ref Guid iid,[MarshalAs(UnmanagedType.Interface)]out PropertyStore store);
 [DllImport("ole32.dll")]static extern int PropVariantClear(ref PropertyValue value);
 static int Main(string[] args){
  PropertyStore store=null;
  try{
   Guid iid=new Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99");Marshal.ThrowExceptionForHR(SHGetPropertyStoreForWindow(new IntPtr(long.Parse(args[0])),ref iid,out store));
   Dictionary<string,string> values=new Dictionary<string,string>();
   foreach(uint id in new uint[]{2,3,4,5}){
    PropertyKey key=new PropertyKey{format=new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3"),id=id};PropertyValue value;
    Marshal.ThrowExceptionForHR(store.GetValue(ref key,out value));
    try{values[id.ToString()]=value.type==31?Marshal.PtrToStringUni(value.text):null;}finally{PropVariantClear(ref value);}
   }
   Console.WriteLine(new JavaScriptSerializer().Serialize(values));return 0;
  }catch(Exception error){Console.Error.WriteLine(error.Message);return 1;}finally{if(store!=null)Marshal.FinalReleaseComObject(store);}
 }
}
