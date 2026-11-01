# Read-only OS sampling of one already-running, owned diagnostic process tree.
# Does not launch, drive, close or change the app. Stop on exit or PID reuse.
param(
    [Parameter(Mandatory=$true)][int]$RootProcessId,
    [Parameter(Mandatory=$true)][string]$OutputPath,
    [int]$DurationSeconds=1500
)
$ErrorActionPreference='Stop'
if($DurationSeconds -lt 1 -or $DurationSeconds -gt 3600){throw 'Use 1-3600 seconds.'}
$taskRoot=Get-Process -Id $RootProcessId
$taskStartTicks=$taskRoot.StartTime.Ticks
$taskRoot.Dispose()
$samples=[System.Collections.Generic.List[object]]::new()
$record=[ordered]@{scope='Sampled Windows private/working-set memory for one diagnostic root and its current descendants; short-lived peaks between polls may be missed';rootPid=$RootProcessId;rootStartTicks=$taskStartTicks;samples=$samples;closed=$false}
$started=[DateTime]::UtcNow
$absoluteOutput=[IO.Path]::GetFullPath($OutputPath)
[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($absoluteOutput))|Out-Null
while(([DateTime]::UtcNow-$started).TotalSeconds -lt $DurationSeconds){
    $rootNow=Get-Process -Id $RootProcessId -ErrorAction SilentlyContinue
    if(!$rootNow){$record.closed=$true;break}
    $same=$rootNow.StartTime.Ticks -eq $taskStartTicks
    $rootNow.Dispose()
    if(!$same){$record.closed=$true;$record.pidReused=$true;break}
    $all=Get-Process
    try{
        $rows=foreach($process in $all){
            try{
                $parent=$process.Parent
                $parentId=if($parent){$parent.Id}else{0}
                if($parent){$parent.Dispose()}
                [pscustomobject]@{pid=$process.Id;parentPid=$parentId;name=$process.ProcessName;privateBytes=$process.PrivateMemorySize64;workingSetBytes=$process.WorkingSet64;cpuSeconds=$process.CPU}
            }catch{ }
        }
        $owned=[System.Collections.Generic.HashSet[int]]::new()
        [void]$owned.Add($RootProcessId)
        do{
            $changed=$false
            foreach($row in $rows){if($owned.Contains($row.parentPid) -and $owned.Add($row.pid)){$changed=$true}}
        }while($changed)
        $selected=@($rows|Where-Object {$owned.Contains($_.pid)})
        $samples.Add([pscustomobject]@{utc=[DateTime]::UtcNow.ToString('o');elapsedSeconds=([DateTime]::UtcNow-$started).TotalSeconds;processes=$selected;totalPrivateBytes=($selected|Measure-Object privateBytes -Sum).Sum;totalWorkingSetBytes=($selected|Measure-Object workingSetBytes -Sum).Sum})
        [IO.File]::WriteAllText($absoluteOutput,($record|ConvertTo-Json -Depth 8))
    }finally{foreach($process in $all){$process.Dispose()}}
    Start-Sleep -Seconds 5
}
$record.elapsedSeconds=([DateTime]::UtcNow-$started).TotalSeconds
[IO.File]::WriteAllText($absoluteOutput,($record|ConvertTo-Json -Depth 8))
Write-Output "OS memory receipt: $absoluteOutput; samples: $($samples.Count); owned root exited: $($record.closed)"
