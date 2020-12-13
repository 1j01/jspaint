lang=$1
img_dir=/home/io/Downloads/Windowses/vdi-to-img
img_file=$img_dir/Win98-$lang.vdi.img
output_dir=/home/io/Downloads/Windowses/resources/$lang

if [ ! "$1" ] || [ ! "$2" ]; then
	echo "Two arguments required: a target language code (e.g. en), and a path to a VirtualBox .vdi file or folder of a mounted .img"
	exit 1
fi
if [ -d "$2" ]; then
	mount_dir=$2
elif [ -f "$2" ]; then
	vdi_file=$2
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
	echo "Showing .img file in folder; you have to mount it yourself, then replace the .vdi argument with the mounted folder."
	nautilus --browser "$img_file"
	exit 0
else
	echo "No file or directory at \"$2\"!"
	exit 1
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

rsync -av --exclude='HELP/' "/home/io/Downloads/Windowses/resources" "/home/io/VirtualBox VMs/Win10 Share"

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
