<#
  Installs (or removes) auto-start for the publish watcher.
  Adds a shortcut to your Startup folder that launches scripts/autopublish-launcher.vbs
  hidden at login. No admin rights needed (per-user Startup folder).

    powershell -ExecutionPolicy Bypass -File scripts\install-autostart.ps1           # install
    powershell -ExecutionPolicy Bypass -File scripts\install-autostart.ps1 -Remove   # uninstall
#>
param([switch]$Remove)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$vbs       = Join-Path $scriptDir "autopublish-launcher.vbs"
$repoDir   = Split-Path -Parent $scriptDir
$startup   = [Environment]::GetFolderPath('Startup')
$lnk       = Join-Path $startup "EngineeringVault Auto-Publish.lnk"

if ($Remove) {
  if (Test-Path $lnk) { Remove-Item $lnk -Force; "Removed auto-start: $lnk" }
  else { "Nothing to remove (no shortcut at $lnk)" }
  return
}

if (-not (Test-Path $vbs)) { throw "Launcher not found: $vbs" }

$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut($lnk)
$sc.TargetPath       = "wscript.exe"
$sc.Arguments        = '"' + $vbs + '"'
$sc.WorkingDirectory = $repoDir
$sc.WindowStyle      = 7   # minimized
$sc.Description       = "Auto-publish EngineeringVault on publish:true changes"
$sc.Save()

"Auto-start installed:"
"  shortcut: $lnk"
"  runs:     $vbs  (hidden)"
""
"It starts at your next login. To start it right now without logging out:"
"  wscript `"$vbs`""
""
"Also enable Obsidian 'Open on system startup' so the watcher has Obsidian to talk to."
"Remove later with:  powershell -ExecutionPolicy Bypass -File scripts\install-autostart.ps1 -Remove"
