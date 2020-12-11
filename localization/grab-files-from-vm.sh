
# VBoxManage clonehd '/home/io/VirtualBox VMs/Win98-ru/Win98-ru.vdi' Win98-ru.iso --format RAW
# sudo mkdir /media/iso
# sudo mount -o loop -t iso9660 /path/to/file.iso /media/iso

lang=$1
input_dir=$2
output_dir=/home/io/Downloads/Windowses/resources/$lang

if [ ! "$input_dir" ] || [ ! "$output_dir" ]; then
	echo "Two arguments required: a target language code (e.g. en), and a path to a windows installation (e.g. mounted iso file converted from a vdi file)."
	exit 1
fi
if [ ! -d "$input_dir" ]; then
	echo "Directory \"$input_dir\" does not exist!"
	exit 1
fi
if [ ! -d "$output_dir" ]; then
	mkdir -p "$output_dir"
fi

grab() {
	file_path=`find "$input_dir" -iname "$1" | head -n 1`
	printf "Copy \"$file_path\" -> \"$output_dir\""
	cp "$file_path" "$output_dir"
	# echo "Copied \"$file_path\" to \"$output_dir\""
	printf " ✅\n"
}

grab_folder() {
	folder_path=`find "$input_dir" -type d -iname "$1" | head -n 1`
	# mkdir -p "$output_dir/$1"
	printf "Copy folder \"$folder_path\" -> \"$output_dir\""
	cp -r "$folder_path" "$output_dir"
	# echo "Copied folder \"$folder_path\" to \"$output_dir\""
	printf " ✅\n"
}


grab_folder "Help"
grab "Notepad.exe"
grab "Sndrec32.exe"
grab "WinHelp.exe"
grab "WinHlp32.exe"
grab "Explorer.exe"
grab "Offline.htm"
grab "iexplore.exe"
grab "mspaint.exe"
grab "wordpad.exe"
grab "Write.exe"

# grab "C:\\Windows\\Help"
# grab "C:\\Windows\\Notepad.exe"
# grab "C:\\Windows\\Sndrec32.exe"
# grab "C:\\Windows\\WinHelp.exe"
# grab "C:\\Windows\\WinHlp32.exe"
# grab "C:\\Windows\\Explorer.exe"
# grab "C:\\Windows\\Web\\Offline.htm"
# grab "C:\\Program Files\\Internet Explorer\\iexplore.exe"
# grab "C:\\Program Files\\Accessories\\mspaint.exe"
# grab "C:\\Program Files\\Accessories\\wordpad.exe"
# grab "C:\\Windows\\Write.exe"
# - 3D Pipes grab "C:\\Windows\\System\\3D*.scr"?
# - The Edit Colors dialog text
# - The Help viewer text
# - Minesweeper - is Games not part of Typical/Recommended installation?


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
