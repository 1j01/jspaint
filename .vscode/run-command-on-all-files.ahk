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
delayBeforeCommand := 2000 ; Give enough time for spell checker to run
delayAfterCommand := 2000 ; Give enough time for CSpell to update the dictionary
closeFileAfterCommand := false

IsIgnoredPath(path) {
	SplitPath path, &name, &dir, &ext, &nameNoExt, &drive
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
	loop files, root, "FR"
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
	try {
		WinActivate "ahk_exe Code.exe"
	} catch TargetError as e {
		MsgBox "Could not find VS Code window. Please open it and try again."
		return
	}

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
	popup := Gui(, "VS Code Automation")
	popup.Opt("+AlwaysOnTop +Disabled -SysMenu +Owner")  ; +Owner avoids a taskbar button.
	popup.Add("Text", , "`nPress Esc to stop the script.`n`n")
	statusBar := popup.Add("StatusBar")
	popup.Show("NoActivate")  ; NoActivate avoids deactivating the currently active window.

	for index, target in targets {
		statusBar.SetText(index "/" targets.Length)
		RunCommandOnFile(target)
	}

	popup.Destroy()
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
	Sleep delayBeforeCommand

	; Run command via F1 command palette
	Send "{F1}"
	Sleep 100
	Send command
	Sleep 100
	Send "{Enter}"
	Sleep delayAfterCommand

	; Close the file (optional)
	if closeFileAfterCommand {
		Send "^w"
	}
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

Automate()