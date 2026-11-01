using System;
using System.IO;
using System.Threading;
using System.Web.Script.Serialization;
internal static class GraphicsHarness {
 internal static int Main(string[] args){
  if(args[0]=="child"){
   string scenario=args[1],mode=Environment.GetEnvironmentVariable(GraphicsStartup.ModeEnv),state=Environment.GetEnvironmentVariable(GraphicsStartup.StateEnv),token=Environment.GetEnvironmentVariable(GraphicsStartup.TokenEnv);
   if(scenario=="arguments"){
    string[] expected={"", "space value", "quote\"value", "C:\\path with space\\", "x\\\"y", "--editor", "C:\\a b\\drawing.pdf"};
    if(args.Length!=expected.Length+2)return 44;for(int i=0;i<expected.Length;i++)if(args[i+2]!=expected[i])return 45;
   }
   if(scenario=="normal"||scenario=="arguments"||scenario=="after-save"||scenario=="retry"&&mode=="software"){
    File.WriteAllText(state,token+":interactive:"+mode);Thread.Sleep(300);
    if(scenario!="after-save")return 0;
   }
   if(scenario=="invalid")File.WriteAllText(state,"invalid");
   if(scenario!="other")Console.Error.WriteLine("[FATAL:gpu_data_manager_impl_private.cc] GPU process isn't usable. Goodbye.");
   return 37;
  }
  int asks=0,failures=0;GraphicsReceipt latest=null;
  string[] forwarded=args[0]=="arguments"?new[]{"child",args[0],"", "space value", "quote\"value", "C:\\path with space\\", "x\\\"y", "--editor", "C:\\a b\\drawing.pdf"}:new[]{"child",args[0]};
  int exit=GraphicsStartup.Run(System.Reflection.Assembly.GetExecutingAssembly().Location,forwarded,()=>{asks++;return args[0]!="decline";},message=>{failures++;},receipt=>{latest=new JavaScriptSerializer().Deserialize<GraphicsReceipt>(new JavaScriptSerializer().Serialize(receipt));});
  Console.WriteLine(new JavaScriptSerializer().Serialize(new{asks=asks,failures=failures,exit=exit,receipt=latest}));return 0;
 }
}
