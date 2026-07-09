' Launches the auto-publish watcher hidden (no console window).
' Path-agnostic: it derives the repo location from its own folder, so it keeps working
' if you move or re-clone the repo. Used by install-autostart.ps1 (runs at login).
Option Explicit
Dim fso, sh, scriptDir, repoDir, cmd
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh  = CreateObject("WScript.Shell")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)   ' ...\scripts
repoDir   = fso.GetParentFolderName(scriptDir)                ' repo root
sh.CurrentDirectory = repoDir
cmd = "cmd /c node " & Chr(34) & fso.BuildPath(scriptDir, "watch-publish.mjs") & Chr(34) & _
      " >> " & Chr(34) & fso.BuildPath(scriptDir, "watch-publish.log") & Chr(34) & " 2>&1"
sh.Run cmd, 0, False   ' 0 = hidden window, False = don't wait
