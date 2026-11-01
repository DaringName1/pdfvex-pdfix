$ErrorActionPreference = 'Stop'
$installRoot = [IO.Path]::GetFullPath($PSScriptRoot)
$expectedParent = [IO.Path]::GetFullPath((Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'Programs\PDFix'))
if (-not ([IO.Path]::GetDirectoryName($installRoot)).Equals($expectedParent,[StringComparison]::OrdinalIgnoreCase)) { throw 'Only a recorded per-user PDFix install can be removed.' }
foreach ($rootPath in @($expectedParent,$installRoot)) { if (((Get-Item -LiteralPath $rootPath -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Linked install roots cannot be removed.' } }
$receiptPath = Join-Path $installRoot 'install-receipt.json'
$receipt = Get-Content -LiteralPath $receiptPath -Raw | ConvertFrom-Json
if ($receipt.version -ne 1 -or $receipt.appId -ne 'com.pdfix.documentworkspace' -or $receipt.installRoot -ne $installRoot -or $receipt.buildId -ne [IO.Path]::GetFileName($installRoot) -or @($receipt.files).Count -gt 60000) { throw 'The install receipt is invalid. Existing files were kept.' }
$directories = @{}; $retained = @()
foreach ($file in $receipt.files) {
 if ($file.path -match '[\x00-\x1f:]' -or $file.path.Contains('\') -or [IO.Path]::IsPathRooted($file.path) -or ($file.path.Split('/') | Where-Object { $_ -in @('', '.', '..') }) -or $file.sha256 -notmatch '^[a-f0-9]{64}$') { throw 'The receipt contains an unsafe path. Existing files were kept.' }
 $target = [IO.Path]::GetFullPath((Join-Path $installRoot $file.path.Replace('/','\')))
 if (-not $target.StartsWith($installRoot+'\',[StringComparison]::OrdinalIgnoreCase)) { throw 'Uninstall path leaves the recorded build.' }
 $current = $target
 while ($true) {
  if (Test-Path -LiteralPath $current) { if (((Get-Item -LiteralPath $current -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'A linked install path was retained.' } }
  if ($current -eq $installRoot) { break }
  $current = [IO.Path]::GetDirectoryName($current)
  if (-not $current.StartsWith($installRoot,[StringComparison]::OrdinalIgnoreCase)) { throw 'Invalid uninstall ancestry.' }
 }
 if (Test-Path -LiteralPath $target) {
  $item = Get-Item -LiteralPath $target
  if ($item.PSIsContainer -or $item.Length -ne $file.bytes -or (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLowerInvariant() -ne $file.sha256) { $retained += $file.path; continue }
  try { Remove-Item -LiteralPath $target -Force } catch { $retained += $file.path; continue }
 }
 $parent = [IO.Path]::GetDirectoryName($target)
 while ($parent -ne $installRoot) { $directories[$parent]=$true; $parent=[IO.Path]::GetDirectoryName($parent) }
}
foreach ($shortcut in $receipt.shortcuts) {
 if (Test-Path -LiteralPath $shortcut.path) {
  $allowed = @([Environment]::GetFolderPath('Programs'),[Environment]::GetFolderPath('Desktop'))
  if ([IO.Path]::GetDirectoryName($shortcut.path) -notin $allowed -or [IO.Path]::GetFileName($shortcut.path) -notin @('PDFix.lnk',('PDFix '+$receipt.buildId+'.lnk'))) { throw 'An unrecognized shortcut was retained.' }
  if ((Get-FileHash -LiteralPath $shortcut.path -Algorithm SHA256).Hash.ToLowerInvariant() -eq $shortcut.sha256) { Remove-Item -LiteralPath $shortcut.path -Force }
 }
}
foreach ($entry in $receipt.registry) {
 if ($entry.key -notmatch '^Software\\(?:Classes\\|PDFix\\|RegisteredApplications$|Microsoft\\Windows\\CurrentVersion\\Uninstall\\PDFix-)' -or $entry.key.Contains('..')) { throw 'An unrecognized registry entry was retained.' }
 $key = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($entry.key,$true)
 if ($null -eq $key) { continue }
 try { if ($key.GetValue($entry.name,$null) -eq $entry.value) { $key.DeleteValue($entry.name,$false) } } finally { $key.Dispose() }
}
# This build's own Apps entry is removed once it is empty, so no blank entries pile up after upgrades.
$appsEntry = 'Software\Microsoft\Windows\CurrentVersion\Uninstall\PDFix-'+$receipt.buildId
$key = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($appsEntry,$false)
if ($null -ne $key) { $empty = $key.ValueCount -eq 0 -and $key.SubKeyCount -eq 0; $key.Dispose(); if ($empty) { [Microsoft.Win32.Registry]::CurrentUser.DeleteSubKey($appsEntry,$false) } }
foreach ($directory in ($directories.Keys | Sort-Object Length -Descending)) { if ((Test-Path -LiteralPath $directory) -and @(Get-ChildItem -LiteralPath $directory -Force).Count -eq 0) { [IO.Directory]::Delete($directory,$false) } }
$manifestPath = Join-Path $installRoot 'package-manifest.json'
if ((Test-Path -LiteralPath $manifestPath) -and (Get-FileHash -LiteralPath $manifestPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $receipt.manifestSha256) { $retained += 'package-manifest.json' }
if ((Get-FileHash -LiteralPath $PSCommandPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $receipt.uninstallerSha256) { $retained += 'Uninstall-PDFix.ps1' }
if ($retained.Count) { $receipt.state='partly-removed'; $receipt | Add-Member -NotePropertyName retained -NotePropertyValue $retained -Force; $receipt | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $receiptPath -Encoding UTF8; Write-Warning ('Modified or busy files were kept: '+($retained -join ', ')) }
else { Remove-Item -LiteralPath $receiptPath -Force; if (Test-Path -LiteralPath $manifestPath) { Remove-Item -LiteralPath $manifestPath -Force }; Remove-Item -LiteralPath $PSCommandPath -Force; if (@(Get-ChildItem -LiteralPath $installRoot -Force).Count -eq 0) { [IO.Directory]::Delete($installRoot,$false) } }
Write-Output 'Recorded PDFix program files were removed where unchanged. Documents, other builds and local recovery/settings were retained.'
