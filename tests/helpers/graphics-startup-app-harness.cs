using System;
using System.Drawing;
using System.IO;
using System.Windows.Forms;
using System.Web.Script.Serialization;
internal static class GraphicsAppHarness {
 [STAThread] internal static int Main(string[] args){
  if(args[0]=="prompt"||args[0]=="prompt-close"){
   Application.EnableVisualStyles();using(Timer timer=new Timer()){timer.Interval=600;timer.Tick+=(sender,e)=>{if(Application.OpenForms.Count==0)return;Form form=Application.OpenForms[0];using(Bitmap image=new Bitmap(form.Width,form.Height)){form.DrawToBitmap(image,new Rectangle(Point.Empty,image.Size));image.Save(args[1]);}timer.Stop();if(args[0]=="prompt-close")form.AcceptButton.PerformClick();else foreach(Control control in form.Controls){Button button=control as Button;if(button!=null&&button.Text=="Try again with simpler graphics")button.PerformClick();}};timer.Start();bool accepted=GraphicsStartup.AskRetry();return accepted==(args[0]=="prompt")?0:1;}
  }
  int asks=0;GraphicsReceipt latest=null;
  int exit=GraphicsStartup.Run(args[0],new[]{args[1]},()=>{asks++;return true;},message=>{throw new Exception(message);},receipt=>{latest=receipt;});
  File.WriteAllText(args[2],new JavaScriptSerializer().Serialize(new{asks=asks,exit=exit,receipt=latest}));return exit;
 }
}
