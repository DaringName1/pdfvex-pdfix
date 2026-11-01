using System;using System.IO;using System.Threading;using System.Web.Script.Serialization;
internal static class PackagedGraphicsChild {
 static int Main(string[] args){string mode=Environment.GetEnvironmentVariable("PDFIX_GRAPHICS_MODE"),scenario=Environment.GetEnvironmentVariable("PDFIX_PACKAGE_CASE"),root=Environment.GetEnvironmentVariable("PDFIX_PACKAGE_CASE_ROOT"),state=Environment.GetEnvironmentVariable("PDFIX_GRAPHICS_STATE"),token=Environment.GetEnvironmentVariable("PDFIX_GRAPHICS_TOKEN");
  File.AppendAllText(Path.Combine(root,"attempts.jsonl"),new JavaScriptSerializer().Serialize(new{mode=mode,args=args})+"\n");
  if(scenario=="normal"||scenario=="arguments"||scenario=="after-save"||scenario=="retry"&&mode=="software"){File.WriteAllText(state,token+":interactive:"+mode);Thread.Sleep(350);if(scenario!="after-save")return 0;}
  if(scenario=="invalid")File.WriteAllText(state,"invalid");
  if(scenario!="other")Console.Error.WriteLine("[FATAL:gpu_data_manager_impl_private.cc] GPU process isn't usable. Goodbye.");return 37;
 }
}
