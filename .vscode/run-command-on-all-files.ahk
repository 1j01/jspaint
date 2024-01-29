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
		WinActivate "ahk_exe Code.exe"
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
		if !RunCommandOnFile(target) {
			popup.Destroy()
			MsgBox "Processed " index " out of " targets.Length " files."  ; Shows after error message
			return
		}
	}

	popup.Destroy()
	MsgBox "Processed " targets.Length " files."
	return
}

RunCommandOnFile(target) {
	; Focus VS Code
	; Could make this more robust by doing this at multiple points, but it's meant to be a sort of "fire and forget" script.
	; OR, could use ControlSend to target the window regardless of focus, and wrap it all in a try/catch, that would be better.
	try {
		WinActivate "ahk_exe Code.exe"
	} catch TargetError as e {
		popup.Destroy()
		MsgBox "Could not find VS Code window. Please open it and try again.", appName, 0x10
		return false
	}

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

	return true
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