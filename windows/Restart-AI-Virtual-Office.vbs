Option Explicit
Dim shell, fso, folder, stopScript, launchScript
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
folder = fso.GetParentFolderName(WScript.ScriptFullName)
stopScript = fso.BuildPath(folder, "Stop-AI-Virtual-Office.vbs")
launchScript = fso.BuildPath(folder, "Launch-AI-Virtual-Office.vbs")
shell.Run "wscript.exe """ & stopScript & """ /quiet", 0, True
WScript.Sleep 1500
shell.Run "wscript.exe """ & launchScript & """", 0, False
