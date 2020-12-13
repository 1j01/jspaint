lang=$1
img_dir=/home/io/Downloads/Windowses/vdi-to-img
img_file=$img_dir/Win98-$lang.vdi.img
output_dir=/home/io/Downloads/Windowses/resources/$lang

if [ ! "$1" ]; then
	echo "One argument required: a target language code (e.g. en)"
	exit 1
fi
if [ ! "$2" ]; then
	vdi_file="/home/io/VirtualBox VMs/Win98-$lang/Win98-$lang.vdi"
elif [ -d "$2" ]; then
	mount_dir=$2
elif [ -f "$2" ]; then
	vdi_file=$2
else
	echo "No file or directory at \"$2\"!"
	exit 1
fi
if [ ! "$mount_dir" ]; then
	if [ ! -d "$img_dir" ]; then
		mkdir -p "$img_dir"
	fi
	if [ ! -f "$img_file" ]; then
		echo "File \"$img_file\" does not exist yet..."
		# To avoid "VBoxManage: error: Cannot register the hard disk ... because a hard disk ... already exists",
		# copy the .vdi file and randomize the UUID.
		vdi_copy="$vdi_file-copy.vdi"
		echo "Copy .vdi file"
		cp "$vdi_file" "$vdi_copy"
		echo "Regenerate copied .vdi file's UUID"
		VBoxManage internalcommands sethduuid "$vdi_copy"
		echo "Convert .vdi to RAW .img"
		VBoxManage clonemedium disk "$vdi_copy" "$img_file" --format RAW
		rm "$vdi_copy"
		if [ ! -f "$img_file" ]; then
			echo "Failed to create \"$img_file\"!"
			exit 1
		fi
		echo "Created \"$img_file\""
	fi
	echo "Time to do some desktop automation!"
	sleep 3
	echo "Show .img file in folder"
	nautilus --browser "$img_file"
	echo "Waiting for window \"vdi-to-img\""
	xdotool search --sync --name "vdi-to-img" windowactivate --sync
	echo "Found window \"vdi-to-img\""
	sleep 5
	xdotool key --clearmodifiers Return
	sleep 1
	echo "Click on notification to go to mounted folder"
	echo "If the wrong notification is selected, quick, use the arrow keys!"
	xdotool key --clearmodifiers Super_L+v
	sleep 15 # time to select appropriate notification
	xdotool key --clearmodifiers Return
	sleep 0.5
	xdotool key --clearmodifiers Escape
	sleep 8
	# It's just called e.g. 341 MB Volume
	# echo "Waiting for window \"Win98-$lang.vdi\""
	# xdotool search --sync --name "Win98-$lang.vdi" windowactivate --sync
	# echo "Found window \"Win98-$lang.vdi\""
	# sleep 1
	echo "Copy path of mounted folder"
	xdotool key --clearmodifiers ctrl+l
	sleep 1
	old_clipboard=`xclip -selection clipboard -o`
	xdotool key --clearmodifiers ctrl+c
	sleep 0.5
	mount_dir=`xclip -selection clipboard -o`
	cat "$old_clipboard" | xclip -selection clipboard
	echo "(Restored clipboard text)"
	echo "Close mounted folder window"
	xdotool key --clearmodifiers alt+F4
	echo "Close vdi-to-img folder window"
	wmctrl -c "vdi-to-img"
	if [ ! -d "$mount_dir" ]; then
		echo "Failed to get path of mounted directory, or failed to mount. \"$mount_dir\" is not a directory."
		exit 1
	fi
fi
if [ ! -d "$output_dir" ]; then
	mkdir -p "$output_dir"
fi

echo "Using mount dir: \"$mount_dir\""

grab() {
	file_path=`find "$mount_dir" -iname "$1" | head -n 1`
	if [ -f "$file_path" ]; then
		printf "Copy \"$file_path\" -> \"$output_dir\" "
		cp "$file_path" "$output_dir"
		if [ $? = 0 ]; then
			printf " ✅\n"
		else
			printf " ❌\n"
		fi
	else
		printf "No file found for \"$1\" ❌\n"
	fi
}

grab_folder() {
	folder_path=`find "$mount_dir" -type d -iname "$1" | head -n 1`
	if [ -d "$folder_path" ]; then
		printf "Copy folder \"$folder_path\" -> \"$output_dir\" "
		cp -r "$folder_path" "$output_dir"
		if [ $? = 0 ]; then
			printf " ✅\n"
		else
			printf " ❌\n"
		fi
	else
		printf "No folder found for \"$1\" ❌\n"
	fi
}


grab_folder "Help" # "C:\\Windows\\Help"
grab "Notepad.exe" # "C:\\Windows\\Notepad.exe"
grab "Sndrec32.exe" # "C:\\Windows\\Sndrec32.exe"
grab "WinHelp.exe" # "C:\\Windows\\WinHelp.exe"
grab "WinHlp32.exe" # "C:\\Windows\\WinHlp32.exe"
grab "Explorer.exe" # "C:\\Windows\\Explorer.exe"
grab "Offline.htm" # "C:\\Windows\\Web\\Offline.htm"
# grab "iexplore.exe" # "C:\\Program Files\\Internet Explorer\\iexplore.exe" # contains no interesting strings
# grab "browseui.dll" # "C:\\Program Files\\Internet Explorer\\iexplore.exe" # contains no strings
grab "mspaint.exe" # "C:\\Program Files\\Accessories\\mspaint.exe"
grab "wordpad.exe" # "C:\\Program Files\\Accessories\\wordpad.exe"
grab "Write.exe" # "C:\\Windows\\Write.exe"

echo "Grabbed files, now copy them to the Windows 10 VM shared folder"
rsync -av --exclude='HELP/' "/home/io/Downloads/Windowses/resources" "/home/io/VirtualBox VMs/Win10 Share"

echo "Go to Windows 10 VM"
VBoxManage controlvm "Windows 10" resume
xdotool search --sync --name "Windows 10 (\(.*\) )?\[Running\]" windowactivate --sync
sleep 1
echo "Open Run dialog"
xdotool key --clearmodifiers --delay 20 Super_L+r
sleep 1
echo "Open Resource Tuner for the localized mspaint.exe"
xdotool type --delay 20 "C:\\Program Files (x86)\\Resource Tuner\\restuner.exe Z:\\resources\\$lang\\mspaint.exe"
sleep 0.3
xdotool key --clearmodifiers Return
sleep 10
echo "Open \"Save Multiple Resources At Once\" batch export dialog"
xdotool key --clearmodifiers --delay 20 ctrl+shift+m
sleep 2
echo "Settings should be already selected; Next"
xdotool key --clearmodifiers --delay 20 alt+n
sleep 2
echo "Enter output folder"
xdotool key --clearmodifiers --delay 20 Tab
sleep 0.2
xdotool key --clearmodifiers --delay 20 Tab
sleep 0.2
xdotool key --clearmodifiers --delay 20 Tab
sleep 0.2
# It will create these folders automatically :)
xdotool type "Z:\\extracted-resources\\$lang\\mspaint"
sleep 0.2
echo "Finish"
xdotool key --clearmodifiers Return
sleep 1
echo "Close Resource Tuner"
xdotool key --clearmodifiers alt+F4
sleep 1
echo "Pause the VM"
VBoxManage controlvm "Windows 10" pause

echo "Copy extracted strings out of the VM shared folder"
mkdir -p "/home/io/Projects/jspaint/localization/$lang"
cp -r "/home/io/VirtualBox VMs/Win10 Share/extracted-resources/$lang/mspaint/Dialog" "/home/io/Projects/jspaint/localization/$lang"
cp -r "/home/io/VirtualBox VMs/Win10 Share/extracted-resources/$lang/mspaint/Menu" "/home/io/Projects/jspaint/localization/$lang"
cp -r "/home/io/VirtualBox VMs/Win10 Share/extracted-resources/$lang/mspaint/String Table" "/home/io/Projects/jspaint/localization/$lang"
echo "Rebuild localization files in jspaint"
cd "/home/io/Projects/jspaint"
npm run update-localization
echo "DONE! Now just test the new language in jspaint and commit!"

# TODO: find where strings are stored for:
# - The Edit Colors dialog text
# - The Help viewer text
# - Minesweeper - is Games not part of Typical/Recommended installation?


# Script to open Paint and the Edit Colors dialog in a VM:
# echo "Alt-tab to and click on VM window to select it"
# xdotool selectwindow windowactivate --sync
# sleep 1
# xdotool key --clearmodifiers --delay 20 Super_L+r
# sleep 1
# xdotool type --delay 20 "C:\\Program Files\\Accessories\\Mspaint.exe"
# xdotool key --clearmodifiers Return
# sleep 1
# xdotool key --clearmodifiers --delay 20 alt+c
# xdotool key --clearmodifiers --delay 20 Return
# xdotool key --clearmodifiers --delay 20 alt+d
