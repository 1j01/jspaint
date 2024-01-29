; This script uses AutoHotkey v2
root := A_ScriptDir "\..\*"
ignoreFolders := [
	".git",
	".history",
	"node_modules",
	"lib",
	"out",
	"localization",
]
ignoreExtensions := [
	"png",
	"gif",
	"jpg",
	"jpeg",
	"svg",
	"cur",
	"ico",
	"icns",
	"wav",
]
command := "cSpell.addIssuesToDictionary"
beforeRunInfo := "This script is designed to add all spelling issues to the dictionary.`nTo use it to prune the dictionary of no-longer-needed words, you must empty the dictionary first.`n`nThis script will run the VS Code command '" command "' on all files in the directory '" root "'.`n`n"

IsIgnoredPath(path) {
	SplitPath path, &name, &dir, &ext, &name_no_ext, &drive
	for _, ignoreExtension in ignoreExtensions {
		if (StrLower(ext) = ignoreExtension) {
			return true
		}
	}

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

Automate() {
	targets := []
	; Loop through files (F) recursively (R)
	Loop Files, root, "FR"
	{
		if (IsIgnoredPath(A_LoopFileFullPath)) {
			continue
		}
		targets.Push(A_LoopFileFullPath)
	}

	if (targets.Length = 0) {
		MsgBox "No files found for pattern: " root
		return
	}

	; Focus VS Code
	WinActivate "ahk_exe Code.exe"

	; Ask for confirmation
	if MsgBox(beforeRunInfo "Found " targets.Length " files. Continue?", "VS Code Automation", 4) = "No" {
		if MsgBox("Copy file paths to clipboard?", "VS Code Automation", 4) = "Yes" {
			A_Clipboard := Join("`n", targets)
		}
		return
	}

	RunCommandOnFiles(targets)
}

RunCommandOnFiles(targets) {
	MyGui := NotifyEscapeHatch()
	SB := MyGui.Add("StatusBar")

	for index, target in targets {
		SB.SetText(index "/" targets.Length)
		RunCommandOnFile(target)
	}

	MyGui.Destroy()
	MsgBox "Processed " targets.Length " files."
	return
}

RunCommandOnFile(target) {
	; Open file in VS Code using Ctrl+P file switcher
	Send "^p"
	Sleep 100
	Send target
	Sleep 100
	Send "{Enter}"
	; Give enough time for spell checker to run
	Sleep 2000

	; Run command via F1 command palette
	Send "{F1}"
	Sleep 100
	Send command
	Sleep 100
	Send "{Enter}"
	; Give enough time for CSpell to update the dictionary
	Sleep 2000

	; Close the file (optional)
	; Send "^w"
}

Join(sep, items) {
	str := ""
	for index, item in items {
		str .= item . sep
	}
	return SubStr(str, 1, -StrLen(sep))
}

; Escape hatch
NotifyEscapeHatch() {
	MyGui := Gui(, "VS Code Automation")
	MyGui.Opt("+AlwaysOnTop +Disabled -SysMenu +Owner")  ; +Owner avoids a taskbar button.
	MyGui.Add("Text", , "`nPress Esc to stop the script.`n`n")
	MyGui.Show("NoActivate")  ; NoActivate avoids deactivating the currently active window.
	return MyGui
}
Esc:: {
	ExitApp
}

Automate()