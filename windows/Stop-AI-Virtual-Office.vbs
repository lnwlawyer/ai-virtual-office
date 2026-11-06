Option Explicit
Dim shell, fso, root, svc, processes, proc, cmd, count, result
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
root = LCase(fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName)))
Set svc = GetObject("winmgmts:{impersonationLevel=impersonate}!\\.\root\cimv2")
Set processes = svc.ExecQuery("SELECT ProcessId, Name, CommandLine FROM Win32_Process WHERE Name = 'node.exe'")
count = 0
For Each proc In processes
  cmd = LCase("" & proc.CommandLine)
  If InStr(cmd, "chat-server.js") > 0 And InStr(cmd, root & "\local-bridge\chat-server.js") > 0 Then
    result = proc.Terminate()
    If result = 0 Then count = count + 1
  End If
Next
If WScript.Arguments.Count > 0 Then\n  If LCase(WScript.Arguments(0)) = "/quiet" Then WScript.Quit 0\nEnd If\nIf count = 0 Then
  MsgBox "No matching AI Virtual Office server was found. Other Node.js processes were not touched.", 64, "AI Virtual Office"
Else
  MsgBox "AI Virtual Office server stopped. You can reopen it from the Desktop shortcut.", 64, "AI Virtual Office"
End If
