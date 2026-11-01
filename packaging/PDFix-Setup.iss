; PDFix-Setup.exe: what people use to install PDFix (owner, October 27, 2026). The zip with "Install PDFix.cmd" is
; kept for testing only. Built by scripts/make-setup-exe.mjs from a finished Windows package:
;   node scripts/make-setup-exe.mjs --package releases/PDFix-<build>-win-x64
; Same promises as the zip installer: installs for the current Windows user only (no admin), never touches documents
; or settings (%APPDATA%\pdfix-document-workspace), replaces older versions on upgrade, and the uninstaller removes
; only the program. Settings and documents stay for a later reinstall.

#ifndef SourceDir
  #error Build with scripts/make-setup-exe.mjs (SourceDir is the package's app folder).
#endif
#ifndef AppVersion
  #error Build with scripts/make-setup-exe.mjs (AppVersion missing).
#endif
#ifndef BuildId
  #error Build with scripts/make-setup-exe.mjs (BuildId missing).
#endif
#ifndef OutputDir
  #define OutputDir "."
#endif
#ifndef IconFile
  #error Build with scripts/make-setup-exe.mjs (IconFile missing).
#endif

[Setup]
AppId=PDFix.DocumentWorkspace
AppName=PDFix
AppVersion={#AppVersion}
AppVerName=PDFix {#AppVersion}
AppPublisher=PDFix
VersionInfoVersion={#AppVersion}
VersionInfoDescription=PDFix Setup
VersionInfoProductName=PDFix
; Per-user install in %LOCALAPPDATA%\Programs\PDFix, the same place the zip installer used. No admin prompt.
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=
DefaultDirName={userpf}\PDFix
DisableDirPage=yes
DisableProgramGroupPage=yes
UsePreviousAppDir=no
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0
; PDFix open while installing: Windows' Restart Manager asks to close it; nothing is replaced while it runs.
CloseApplications=yes
RestartApplications=no
CloseApplicationsFilter=*.exe,*.dll,*.pak,*.cjs,*.js
OutputDir={#OutputDir}
OutputBaseFilename=PDFix-Setup-{#AppVersion}
SetupIconFile={#IconFile}
UninstallDisplayIcon={app}\PDFix.exe
UninstallDisplayName=PDFix
WizardStyle=modern
Compression=lzma2/max
SolidCompression=yes
LZMAUseSeparateProcess=yes
ShowLanguageDialog=auto

[Languages]
Name: "en"; MessagesFile: "compiler:Default.isl"
Name: "es"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[InstallDelete]
; An upgrade replaces the whole program folder content, so no files from the older version are left behind.
; Only PDFix's own program parts; documents and settings are elsewhere.
Type: filesandordirs; Name: "{app}\runtime"
Type: files; Name: "{app}\PDFix.exe"

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{userprograms}\PDFix"; Filename: "{app}\PDFix.exe"; WorkingDir: "{app}"; Comment: "PDFix document workspace"
Name: "{userdesktop}\PDFix"; Filename: "{app}\PDFix.exe"; WorkingDir: "{app}"; Comment: "PDFix document workspace"; Tasks: desktopicon

[Run]
Filename: "{app}\PDFix.exe"; Description: "{cm:LaunchProgram,PDFix}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
; Program folders the program itself may create next to its files. Never %APPDATA% (settings) or documents.
Type: dirifempty; Name: "{app}\runtime"
Type: dirifempty; Name: "{app}"

[Code]
// Test builds installed from the zip live in %LOCALAPPDATA%\Programs\PDFix\<build id>\ with their own uninstaller.
// Before installing, remove them with that uninstaller (it removes only its recorded, unchanged program files,
// shortcuts and Apps entry, and keeps documents and settings), so there is one PDFix and one set of icons.
procedure RemoveZipInstalledBuilds();
var
  FindRec: TFindRec;
  Root, Folder, Uninstaller, EntryKey: String;
  ResultCode: Integer;
begin
  Root := ExpandConstant('{userpf}\PDFix');
  if FindFirst(Root + '\*', FindRec) then
  try
    repeat
      if (FindRec.Attributes and FILE_ATTRIBUTE_DIRECTORY <> 0) and (FindRec.Name <> '.') and (FindRec.Name <> '..') and (FindRec.Name <> 'runtime') then
      begin
        Folder := Root + '\' + FindRec.Name;
        Uninstaller := Folder + '\Uninstall-PDFix.ps1';
        if FileExists(Uninstaller) and FileExists(Folder + '\install-receipt.json') then
        begin
          // Run from the parent folder: Windows won't remove a folder a program is running in.
          Exec(ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe'), '-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "' + Uninstaller + '"', Root, SW_HIDE, ewWaitUntilTerminated, ResultCode);
          RemoveDir(Folder); // only succeeds when the uninstaller left it empty
          Log('Removed zip-installed PDFix ' + FindRec.Name + ' (exit ' + IntToStr(ResultCode) + ', folder left: ' + IntToStr(Ord(DirExists(Folder))) + ')');
          // Uninstallers from before October 28 leave an empty Apps entry behind.
          EntryKey := 'Software\Microsoft\Windows\CurrentVersion\Uninstall\PDFix-' + FindRec.Name;
          RegDeleteKeyIfEmpty(HKEY_CURRENT_USER, EntryKey);
        end;
      end;
    until not FindNext(FindRec);
  finally
    FindClose(FindRec);
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssInstall then RemoveZipInstalledBuilds();
end;
