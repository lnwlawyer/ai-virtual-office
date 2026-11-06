Option Explicit
Dim shell, fso, root, cmd, http, i, ready, url
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
url = "http://127.0.0.1:8787/office/"
ready = False
On Error Resume Next
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
http.open "GET", "http://127.0.0.1:8787/api/providers", False
http.setTimeouts 500, 500, 500, 500
http.send
ready = (http.status = 200)
Err.Clear
On Error GoTo 0
If Not ready Then
  If Not fso.FolderExists(fso.BuildPath(root, "node_modules")) Then
    MsgBox "AI Virtual Office is not installed. Double-click Setup-AI-Virtual-Office.vbs first.", 48, "AI Virtual Office"
    WScript.Quit 1
  End If
  cmd = "cmd.exe /d /s /c ""cd /d """ & root & """ && npm.cmd run chat:local"""
  shell.Run cmd, 0, False
  For i = 1 To 90
    WScript.Sleep 1000
    On Error Resume Next
    Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    http.setTimeouts 500, 500, 500, 500
    http.open "GET", "http://127.0.0.1:8787/api/providers", False
    http.send
    ready = (http.status = 200)
    Err.Clear
    On Error GoTo 0
    If ready Then Exit For
  Next
End If
If ready Then
  shell.Run url, 1, False
Else
  MsgBox "Unable to start AI Virtual Office. Check Node.js, Ollama, or port 8787.", 48, "AI Virtual Office"
End If
