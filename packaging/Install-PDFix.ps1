param([switch]$RegisterOpenWith,[switch]$DesktopShortcut,[switch]$NoStartMenu)
$ErrorActionPreference = 'Stop'
$packageRoot = [IO.Path]::GetFullPath($PSScriptRoot)
$productId = 'com.pdfix.documentworkspace'
function Read-Json([string]$Filename) { Get-Content -LiteralPath $Filename -Raw | ConvertFrom-Json }
function Hash-File([string]$Filename) { (Get-FileHash -LiteralPath $Filename -Algorithm SHA256).Hash.ToLowerInvariant() }
function Child-Path([string]$Root,[string]$Relative) {
 if ([string]::IsNullOrWhiteSpace($Relative) -or [IO.Path]::IsPathRooted($Relative) -or $Relative.Contains(':') -or $Relative.Contains('\') -or $Relative -match '[\x00-\x1f]' -or ($Relative.Split('/') | Where-Object { $_ -in @('', '.', '..') })) { throw 'Invalid package-relative path.' }
 $full = [IO.Path]::GetFullPath([IO.Path]::Combine($Root,$Relative.Replace('/',[IO.Path]::DirectorySeparatorChar)))
 if (-not $full.StartsWith($Root.TrimEnd('\')+'\',[StringComparison]::OrdinalIgnoreCase)) { throw 'Package path leaves its root.' }
 return $full
}
function No-Links([string]$Root,[string]$Filename) {
 $current = $Filename
 while ($true) {
  $item = Get-Item -LiteralPath $current -Force
  if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Linked package/install paths are unsupported.' }
  if ($current.Equals($Root,[StringComparison]::OrdinalIgnoreCase)) { break }
  $parent = [IO.Path]::GetDirectoryName($current)
  if ([string]::IsNullOrEmpty($parent) -or -not $current.StartsWith($Root,[StringComparison]::OrdinalIgnoreCase)) { throw 'Invalid package/install ancestry.' }
  $current = $parent
 }
}
$manifestPath = Join-Path $packageRoot 'package-manifest.json'
$checksums = Read-Json (Join-Path $packageRoot 'package-checksums.json')
$complete = Read-Json (Join-Path $packageRoot 'PACKAGE-COMPLETE.json')
$manifestHash = Hash-File $manifestPath
if ($manifestHash -ne $checksums.manifestSha256 -or $manifestHash -ne $complete.manifestSha256) { throw 'Package inventory changed or packaging is incomplete.' }
$manifest = Read-Json $manifestPath
if ($manifest.version -ne 1 -or $manifest.kind -ne 'PDFix.WindowsPackage.v1' -or $manifest.appId -ne $productId -or $manifest.platform -ne 'win32-x64' -or $manifest.buildId -notmatch '^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?-\d+T\d+-[a-f0-9]{8}$' -or $manifest.launch -ne 'PDFix.exe' -or @($manifest.files).Count -lt 1 -or @($manifest.files).Count -gt 60000 -or -not [Environment]::Is64BitOperatingSystem) { throw 'This is not a supported completed Windows x64 PDFix package.' }
$sourceRoot = [IO.Path]::GetFullPath((Join-Path $packageRoot 'app'))
$programsRoot = [IO.Path]::GetFullPath((Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'Programs'))
$pdfixRoot = [IO.Path]::GetFullPath((Join-Path $programsRoot 'PDFix'))
$installRoot = [IO.Path]::GetFullPath((Join-Path $pdfixRoot $manifest.buildId))
if (-not $installRoot.StartsWith($pdfixRoot+'\',[StringComparison]::OrdinalIgnoreCase) -or (Test-Path -LiteralPath $installRoot)) { throw 'Choose a newly built package; an existing installed build is never overwritten.' }
$seen = @{}; [long]$total = 0
foreach ($file in $manifest.files) {
 if ($file.sha256 -notmatch '^[a-f0-9]{64}$' -or $file.bytes -lt 0 -or $file.bytes -gt 5GB -or $seen.ContainsKey($file.path.ToLowerInvariant())) { throw 'Invalid package file inventory.' }
 $seen[$file.path.ToLowerInvariant()] = $true
 $source = Child-Path $sourceRoot $file.path
 No-Links $sourceRoot $source
 $info = Get-Item -LiteralPath $source
 if ($info.PSIsContainer -or $info.Length -ne $file.bytes -or (Hash-File $source) -ne $file.sha256) { throw ('Package file changed: '+$file.path) }
 $total += $file.bytes
 if ($total -gt 5GB) { throw 'Package exceeds the install byte budget.' }
}
if (-not $seen.ContainsKey('pdfix.exe') -or $total -ne $manifest.totalBytes) { throw 'Package executable or byte inventory is incomplete.' }
$uninstallerSource = Join-Path $packageRoot 'Uninstall-PDFix.ps1'
if ((Hash-File $uninstallerSource) -ne $checksums.uninstallerSha256) { throw 'Package uninstaller changed.' }
New-Item -ItemType Directory -Path $programsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $pdfixRoot -Force | Out-Null
No-Links $programsRoot $pdfixRoot
# An open PDFix keeps its files in use, so an older version couldn't be removed cleanly. Ask first, change nothing.
$running = @(Get-Process -Name PDFix -ErrorAction SilentlyContinue | Where-Object { $_.Path -and $_.Path.StartsWith($pdfixRoot+'\',[StringComparison]::OrdinalIgnoreCase) })
if ($running.Count) { throw 'PDFix is open. Close PDFix (save your work first), then run Install PDFix again. Nothing was changed.' }
New-Item -ItemType Directory -Path $installRoot | Out-Null
$receipt = [ordered]@{ version=1; appId=$productId; buildId=$manifest.buildId; manifestSha256=$manifestHash; uninstallerSha256=$checksums.uninstallerSha256; installRoot=$installRoot; files=$manifest.files; shortcuts=@(); registry=@(); state='installing'; created=[DateTime]::UtcNow.ToString('o') }
$receiptPath = Join-Path $installRoot 'install-receipt.json'
$manifestTarget = Join-Path $installRoot 'package-manifest.json'
try {
 [IO.File]::Copy($manifestPath,$manifestTarget,$false)
 [IO.File]::Copy($uninstallerSource,(Join-Path $installRoot 'Uninstall-PDFix.ps1'),$false)
 $receipt | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $receiptPath -Encoding UTF8
 foreach ($file in $manifest.files) {
  $source = Child-Path $sourceRoot $file.path
  $destination = Child-Path $installRoot $file.path
  $parent = [IO.Path]::GetDirectoryName($destination)
  New-Item -ItemType Directory -Path $parent -Force | Out-Null
  No-Links $installRoot $parent
  [IO.File]::Copy($source,$destination,$false)
  if ((Hash-File $destination) -ne $file.sha256) { throw ('Installed copy failed verification: '+$file.path) }
  # Windows warned once when the person ran this installer from the download, and every file has just been checked
  # against the package inventory. Like other installers, the installed copy doesn't carry the download mark, so
  # Windows doesn't warn again each time PDFix starts. The package folder itself keeps its mark.
  Remove-Item -LiteralPath $destination -Stream Zone.Identifier -ErrorAction SilentlyContinue
 }
 foreach ($copied in @($manifestTarget,(Join-Path $installRoot 'Uninstall-PDFix.ps1'))) { Remove-Item -LiteralPath $copied -Stream Zone.Identifier -ErrorAction SilentlyContinue }
 # Upgrade: the new version is fully copied and checked, so remove older versions with their own uninstallers.
 # Those remove only their recorded, unchanged program files, shortcuts and entries; documents and settings stay.
 # Then the plain "PDFix" icons below point at this version. If an older version can't be removed, this
 # version still works and gets its own build-named icon.
 foreach ($older in @(Get-ChildItem -LiteralPath $pdfixRoot -Directory -ErrorAction SilentlyContinue | Where-Object { -not $_.FullName.Equals($installRoot,[StringComparison]::OrdinalIgnoreCase) })) {
  $olderUninstall = Join-Path $older.FullName 'Uninstall-PDFix.ps1'
  if (-not (Test-Path -LiteralPath $olderUninstall) -or -not (Test-Path -LiteralPath (Join-Path $older.FullName 'install-receipt.json'))) { continue }
  try { & $olderUninstall | Out-Null; Write-Output ('Removed the older PDFix '+$older.Name+'.') } catch { Write-Warning ('The older PDFix '+$older.Name+' was kept: '+$_.Exception.Message) }
  # Uninstallers from before October 28 leave their Apps entry behind once it is empty; remove only that empty entry.
  $olderEntry = 'Software\Microsoft\Windows\CurrentVersion\Uninstall\PDFix-'+$older.Name
  $entryKey = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($olderEntry,$false)
  if ($null -ne $entryKey) { $entryEmpty = $entryKey.ValueCount -eq 0 -and $entryKey.SubKeyCount -eq 0; $entryKey.Dispose(); if ($entryEmpty) { [Microsoft.Win32.Registry]::CurrentUser.DeleteSubKey($olderEntry,$false) } }
 }
 $exe = Join-Path $installRoot 'PDFix.exe'
 $uninstall = Join-Path $installRoot 'Uninstall-PDFix.ps1'
 $shell = New-Object -ComObject WScript.Shell
 $shortcutFolders = @()
 if (-not $NoStartMenu) { $shortcutFolders += [Environment]::GetFolderPath('Programs') }
 if ($DesktopShortcut) { $shortcutFolders += [Environment]::GetFolderPath('Desktop') }
 foreach ($folder in $shortcutFolders) {
  # Plain 'PDFix' when that name is free; otherwise (another build installed) the build-specific name.
  $shortcutPath = Join-Path $folder 'PDFix.lnk'
  if (Test-Path -LiteralPath $shortcutPath) { $shortcutPath = Join-Path $folder ('PDFix '+$manifest.buildId+'.lnk') }
  if (Test-Path -LiteralPath $shortcutPath) { throw 'An unrelated shortcut already uses the install name.' }
  $shortcut = $shell.CreateShortcut($shortcutPath); $shortcut.TargetPath=$exe; $shortcut.WorkingDirectory=$installRoot; $shortcut.Description='PDFix document workspace'; $shortcut.IconLocation=(Join-Path $installRoot 'runtime\resources\app\dist\brand\pdfix.ico')+',0'; $shortcut.Save()
  $receipt.shortcuts += [ordered]@{ path=$shortcutPath; target=$exe; sha256=(Hash-File $shortcutPath) }
 }
 $entries = @([ordered]@{key=('Software\Microsoft\Windows\CurrentVersion\Uninstall\PDFix-'+$manifest.buildId);name='DisplayName';value=('PDFix '+$manifest.appVersion)},[ordered]@{key=('Software\Microsoft\Windows\CurrentVersion\Uninstall\PDFix-'+$manifest.buildId);name='DisplayVersion';value=$manifest.appVersion},[ordered]@{key=('Software\Microsoft\Windows\CurrentVersion\Uninstall\PDFix-'+$manifest.buildId);name='InstallLocation';value=$installRoot},[ordered]@{key=('Software\Microsoft\Windows\CurrentVersion\Uninstall\PDFix-'+$manifest.buildId);name='UninstallString';value=('powershell.exe -NoProfile -File "'+$uninstall+'"')})
 if ($RegisterOpenWith) {
  $associationPath=Join-Path $packageRoot 'open-with-manifest.json'
  if ((Hash-File $associationPath) -ne $checksums.associationSha256) { throw 'Optional Open With registration data changed.' }
  $association = Read-Json $associationPath
  foreach ($entry in $association.entries) { $entries += [ordered]@{key=$entry.key;name=$entry.name;value=$entry.value.Replace('__PDFIX_EXECUTABLE__',$exe)} }
 }
 foreach ($entry in $entries) {
  if ($entry.key -notmatch '^Software\\(?:Classes\\|PDFix\\|RegisteredApplications$|Microsoft\\Windows\\CurrentVersion\\Uninstall\\PDFix-)' -or $entry.key.Contains('..') -or $entry.name -match '[\x00-\x1f]' -or $entry.value -match '[\x00-\x1f]') { throw 'Invalid PDFix registry manifest.' }
  $key = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey($entry.key)
  try { $previous=$key.GetValue($entry.name,$null); if ($null -ne $previous -and $previous -ne $entry.value) { Write-Warning ('An existing Open With/installation value was kept: '+$entry.key+' '+$entry.name); continue }; $key.SetValue($entry.name,$entry.value,[Microsoft.Win32.RegistryValueKind]::String); $receipt.registry += $entry } finally { $key.Dispose() }
 }
 $receipt.state='installed'
 $receipt | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $receiptPath -Encoding UTF8
 Write-Output ('Installed PDFix at '+$installRoot+'. Documents and recovery/settings were retained. No default app was changed. No application was launched.')
} catch {
 $receipt.state='incomplete'; $receipt.error=$_.Exception.Message
 $receipt | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $receiptPath -Encoding UTF8
 throw ('Installation stopped. The incomplete build is recorded at '+$installRoot+'. Use its uninstaller after reviewing the receipt. '+$_.Exception.Message)
}
