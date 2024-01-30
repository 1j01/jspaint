; This script runs on AutoHotkey v2.
;
; I tried the VS Code extension "Command on All Files" first: https://marketplace.visualstudio.com/items?itemName=rioj7.commandOnAllFiles
; but it didn't work with the "cSpell.addIssuesToDictionary" command.
; I think it was too fast, and the spell checker didn't have time to run.
;
; A better solution would be to:
; - Improve the "Command on All Files" extension:
;   - add delay options
;   - add a dry run mode, which I had to work around by setting it to a near-no-op command
;     - just listing the files would be a lot nicer than opening them all one by one
;   - unify file matching; you shouldn't have to specify a list of file extensions to include, it should be a glob like the exclusions
; Or:
; - Add a command to the cspell-cli to accept spellings
; Or:
; - Implement an external Node.js script using cspell's API (but that's less helpful than making a PR)

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
appName := "VS Code Automation"

popup := Gui(, appName)
popup.Opt("+AlwaysOnTop +Disabled -SysMenu +Owner")  ; +Owner avoids a taskbar button.
popup.Add("Text", , "`nPress Esc to stop the script.`n`n")
statusBar := popup.Add("StatusBar")

windowId := WinExist("ahk_exe Code.exe")

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

	; Focus VS Code before confirmation to avoid confusion between multiple VS Code windows
	try {
		WinActivate { Hwnd: windowId }
	} catch TargetError as e {
		MsgBox "Could not find VS Code window. Please open it and try again.", appName, 0x10
		return
	}

	; Ask for confirmation
	if MsgBox(beforeRunInfo "Found " targets.Length " files. Continue?", appName, 4) = "No" {
		if MsgBox("Copy file paths to clipboard?", appName, 4) = "Yes" {
			A_Clipboard := Join("`n", targets)
		}
		return
	}

	RunCommandOnFiles(targets)
}

RunCommandOnFiles(targets) {
	popup.Show("NoActivate")  ; NoActivate avoids deactivating the currently active window.

	for index, target in targets {
		statusBar.SetText(index "/" targets.Length)
		try {
			RunCommandOnFile(target)
		} catch TargetError as e {
			popup.Destroy()
			MsgBox "Lost VS Code window. Please open it and try again.`n`n" index " out of " targets.Length " files were processed.", appName, 0x10
			return
		}
	}

	popup.Destroy()
	MsgBox "Processed " targets.Length " files."
	return
}


SendToVSCode(keys) {
	; ControlSend(keys, , { Hwnd: windowId })
	WinActivate { Hwnd: windowId }
	Send keys
}

RunCommandOnFile(target) {
	; Open file in VS Code using Ctrl+P file switcher
	SendToVSCode "^p"
	Sleep 100
	SendToVSCode target
	Sleep 100
	SendToVSCode "{Enter}"
	Sleep delayBeforeCommand

	; Run command via F1 command palette
	SendToVSCode "{F1}"
	Sleep 100
	SendToVSCode command
	Sleep 100
	SendToVSCode "{Enter}"
	Sleep delayAfterCommand

	; Close the file (optional)
	if closeFileAfterCommand {
		SendToVSCode "^w"
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
ExitApp()