root := A_ScriptDir "\..\*"
ignoreFolders := [
	".git",
	".history",
	"node_modules",
	"lib",
	"out",
	"images",
	"localization",
	"cypress",
	"help",
]
command := "cSpell.addIssuesToDictionary"

IsIgnoredPath(path) {
	parts := StrSplit(path, "\")
	for index, part in parts {
		for _, ignoreFolder in ignoreFolders {
			if (part = ignoreFolder) {
				return true
			}
		}
	}
	return false
}

RunCommandOnFiles() {
	; Focus VS Code
	WinActivate "ahk_exe Code.exe"
	; Loop through files (F) recursively (R)
	processed := []
	Loop Files, root, "FR"
	{
		; Skip if the file should be ignored
		if (IsIgnoredPath(A_LoopFileFullPath)) {
			continue
		}

		; Open file in VS Code using Ctrl+P file switcher
		Send "^p"
		Sleep 100
		Send A_LoopFileFullPath
		Sleep 100
		Send "{Enter}"
		Sleep 1000

		; Run command via F1 command palette
		Send "{F1}"
		Sleep 100
		Send command
		Sleep 100
		Send "{Enter}"
		Sleep 1000

		; Close the file
		Send "^w"
		Sleep 100

		processed.Push(A_LoopFileFullPath)
	}

	if (processed.Length = 0) {
		MsgBox "No files found for pattern: " root
		return
	}
	MsgBox "Processed " processed.Length " files."
	; MsgBox "Processed " processed.Length " files:`n" Join("`n", processed)
	; A_Clipboard := Join("`n", processed)
	return
}

Join(sep, items) {
	str := ""
	for index, item in items {
		str .= item . sep
	}
	return SubStr(str, 1, -StrLen(sep))
}

; Escape hatch
Esc:: {
	ExitApp
}

RunCommandOnFiles()