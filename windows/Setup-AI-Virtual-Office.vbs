Option Explicit
Dim shell, fso, root, command, code, desktop, startup, link, answer, logPath, cmdPath, script, installCommand
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
logPath = fso.BuildPath(root, "ai-office-setup.log")
cmdPath = fso.BuildPath(root, "ai-office-setup.cmd")
If fso.FileExists(fso.BuildPath(root, "package-lock.json")) Then
  installCommand = "npm.cmd ci --no-audit --no-fund"
Else
  installCommand = "npm.cmd install --no-audit --no-fund"
End If
Set script = fso.CreateTextFile(cmdPath, True, False)
script.WriteLine "@echo off"
script.WriteLine "cd /d """ & root & """"
script.WriteLine "echo Installing AI Virtual Office..."
script.WriteLine installCommand & " > """ & logPath & """ 2>&1"
script.WriteLine "if errorlevel 1 exit /b 10"
script.WriteLine "npm.cmd run build:local >> """ & logPath & """ 2>&1"
script.WriteLine "if errorlevel 1 exit /b 20"
script.WriteLine "exit /b 0"
script.Close
code = shell.Run("cmd.exe /d /c """ & cmdPath & """", 0, True)
On Error Resume Next
fso.DeleteFile cmdPath, True
On Error GoTo 0
If code <> 0 Then
  If code = 10 Then
    MsgBox "Dependency installation failed. See ai-office-setup.log in the project folder.", 16, "AI Virtual Office"
  ElseIf code = 20 Then
    MsgBox "Web build failed. See ai-office-setup.log in the project folder.", 16, "AI Virtual Office"
  Else
    MsgBox "Setup failed (code " & code & "). See ai-office-setup.log in the project folder.", 16, "AI Virtual Office"
  End If
  shell.Run "notepad.exe """ & logPath & """", 1, False
  WScript.Quit 1
End If
desktop = shell.SpecialFolders("Desktop")
Set link = shell.CreateShortcut(fso.BuildPath(desktop, "AI Virtual Office.lnk"))
link.TargetPath = shell.ExpandEnvironmentStrings("%SystemRoot%") & "\System32\wscript.exe"
link.Arguments = """" & fso.BuildPath(root, "windows\Launch-AI-Virtual-Office.vbs") & """"
link.WorkingDirectory = root
link.Description = "Open AI Virtual Office without PowerShell"
link.Save
Set link = shell.CreateShortcut(fso.BuildPath(desktop, "Stop AI Virtual Office.lnk"))
link.TargetPath = shell.ExpandEnvironmentStrings("%SystemRoot%") & "\\System32\\wscript.exe"
link.Arguments = """" & fso.BuildPath(root, "windows\\Stop-AI-Virtual-Office.vbs") & """"
link.WorkingDirectory = root
link.Description = "Stop only the AI Virtual Office local server"
link.Save
Set link = shell.CreateShortcut(fso.BuildPath(desktop, "Restart AI Virtual Office.lnk"))
link.TargetPath = shell.ExpandEnvironmentStrings("%SystemRoot%") & "\\System32\\wscript.exe"
link.Arguments = """" & fso.BuildPath(root, "windows\\Restart-AI-Virtual-Office.vbs") & """"
link.WorkingDirectory = root
link.Description = "Restart AI Virtual Office without PowerShell"
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
