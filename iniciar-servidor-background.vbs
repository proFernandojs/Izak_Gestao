Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

root = fso.GetParentFolderName(WScript.ScriptFullName)
logFile = root & "\server\server-autostart.log"
cmd = "cmd /c cd /d """ & root & "\server"" && node server.js >> """ & logFile & """ 2>&1"

shell.Run cmd, 0, False
