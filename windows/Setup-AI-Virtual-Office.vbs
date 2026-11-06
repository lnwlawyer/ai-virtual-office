Option Explicit
Dim shell, fso, root, command, code, desktop, startup, link, answer
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
If Not fso.FileExists(fso.BuildPath(root, "package.json")) Then
  MsgBox "Project files not found.", 16, "AI Virtual Office"
  WScript.Quit 1
End If
code = shell.Run("cmd.exe /d /s /c ""node --version >nul 2>&1 && npm.cmd --version >nul 2>&1""", 0, True)
If code <> 0 Then
  MsgBox "Install Node.js LTS first, then double-click this setup file again.", 48, "AI Virtual Office"
  WScript.Quit 1
End If
code = shell.Run("cmd.exe /d /s /c ""cd /d """ & root & """ && npm.cmd ci && npm.cmd run build:local""", 0, True)
If code <> 0 Then
  MsgBox "Installation failed. Verify internet connection and npm dependencies.", 16, "AI Virtual Office"
  WScript.Quit 1
End If
desktop = shell.SpecialFolders("Desktop")
Set link = shell.CreateShortcut(fso.BuildPath(desktop, "AI Virtual Office.lnk"))
link.TargetPath = shell.ExpandEnvironmentStrings("%SystemRoot%") & "\System32\wscript.exe"
link.Arguments = """" & fso.BuildPath(root, "windows\Launch-AI-Virtual-Office.vbs") & """"
link.WorkingDirectory = root
link.Description = "Open AI Virtual Office without PowerShell"
link.Save
answer = MsgBox("Setup completed. Start automatically when signing in to Windows?", 36, "AI Virtual Office")
startup = shell.SpecialFolders("Startup")
If answer = 6 Then
  Set link = shell.CreateShortcut(fso.BuildPath(startup, "AI Virtual Office.lnk"))
  link.TargetPath = shell.ExpandEnvironmentStrings("%SystemRoot%") & "\System32\wscript.exe"
  link.Arguments = """" & fso.BuildPath(root, "windows\Launch-AI-Virtual-Office.vbs") & """"
  link.WorkingDirectory = root
  link.Save
Else
  If fso.FileExists(fso.BuildPath(startup, "AI Virtual Office.lnk")) Then fso.DeleteFile fso.BuildPath(startup, "AI Virtual Office.lnk"), True
End If
MsgBox "Desktop shortcut created. Double-click AI Virtual Office to start.", 64, "AI Virtual Office"
