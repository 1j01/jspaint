# This is a script to automate creating a VirtualBox VM and setting up Windows 98 within it
# in order to grab files from numerous localized versions of Windows 98 to gather up strings
# and jumpstart localization of jspaint.
# A better idea would have been to use an unattended answer file (msbatch.inf).
# I knew there would be sysadmin type ways of doing this, but I went this route I guess because I thought it was cool.
# It's a lot of work tho, and way less reliable.

lang=$1
target_os_iso=$2
vm_name="Win98-${lang}"
already_got_image=false
if [ ! "$lang" ] || [ ! "$target_os_iso" ]; then
	echo "Two arguments required: a target language code (e.g. en), and a path to an iso file."
	exit 1
fi
if [ ! -f "$target_os_iso" ]; then
	echo "File \"$target_os_iso\" does not exist!"
	exit 1
fi

window_id=
wait_for_window(){
	local window_name=$1
	echo "Waiting for \"$window_name\" window"
	# "--sync" in this case means wait for results before exiting
	window_id=`xdotool search --sync --onlyvisible --name "$window_name"`
	echo "Found \"$window_name\" window"
	xdotool search --name "$window_name" windowactivate --sync
}

wait_for_window "Oracle VM VirtualBox Manager"
sleep 1
if [ "$already_got_image" != true ]; then
	echo "Let's make a VM..."
	xdotool key --clearmodifiers --delay 20 ctrl+n
	wait_for_window "Create Virtual Machine"
	xdotool type --delay 20 "$vm_name"
	sleep 1
	echo "Create!"
	xdotool key --clearmodifiers --delay 20 Return
	echo "Create hard disk"
	echo "Select Size slider"
	sleep 0.5
	xdotool key --clearmodifiers --delay 20 alt+s
	echo "Set it to lowest possible, to get MB units"
	sleep 0.5
	xdotool key --clearmodifiers --delay 20 Home
	echo "Select Size text input"
	sleep 0.5
	xdotool key --clearmodifiers --delay 20 Tab
	sleep 0.5
	echo "Set size to 300 MB"
	xdotool type --delay 20 "300"
	sleep 1
	echo "Choose fixed size hard disk image"
	xdotool key --clearmodifiers --delay 20 alt+f
	sleep 0.5
	xdotool key --clearmodifiers --delay 20 Return
	# echo "Waiting for VM to be created (sometimes it's fast, sometimes it takes a while)"
	# TODO: wait for popup windows to close instead of doing a fixed sleep
	# sleep 20
	echo "Waiting for VM to be created (popups to close)"
	xdotool search --name "Oracle VM VirtualBox Manager" windowactivate --sync
fi

sleep 2
echo "Launch the VM!"
xdotool key --clearmodifiers --delay 20 Return
sleep 5

boot_into_setup(){
	echo "Select 2. Boot From CD ROM"
	# typing a 2 in this particular screen is INCREDIBLY FINNICKY
	# maybe the key is down and up too fast and I need to find how to separately trigger press and release
	# xdotool key --delay 200 222222222222222222222222
	# xdotool search --sync --name "$vm_name \[Running\] - Oracle VM VirtualBox" windowactivate --sync key --clearmodifiers --delay 20 2
	# could try xdotool type
	# Down + Return works tho
	xdotool key --clearmodifiers --delay 20 Down
	sleep 0.5
	xdotool key --clearmodifiers --delay 20 Return
	sleep 2
	if [ "$lang" = "he" ]; then
		echo "Select 2. Start Localized Windows 98 Setup from CD ROM"
		xdotool key --clearmodifiers --delay 20 2
	else
		echo "Select 1. Start Windows 98 Setup from CD ROM"
		xdotool key --clearmodifiers --delay 20 1
	fi
	sleep 0.5
	xdotool key --clearmodifiers --delay 20 Return
}

if [ "$already_got_image" != true ]; then
	wait_for_window "Select start-up disk"
	echo "Select iso file..."
	xdotool key --clearmodifiers --delay 20 Tab
	sleep 1
	xdotool key --clearmodifiers --delay 20 space
	sleep 4
	# there is no way to add a new iso via the keyboard
	wait_for_window "Optical Disk Selector"
	xdotool mousemove --window "$window_id" 25 50
	sleep 0.5
	xdotool click 1
	wait_for_window "Please choose a virtual optical disk"
	xdotool key --clearmodifiers --delay 20 ctrl+l
	sleep 0.5
	xdotool type --delay 20 "${target_os_iso}"
	sleep 2
	echo "Open"
	xdotool key --clearmodifiers --delay 20 Return
	sleep 2
	echo "Choose"
	xdotool key --clearmodifiers --delay 20 Return
	sleep 2
	echo "Start"
	xdotool key --clearmodifiers --delay 20 Return
	sleep 2
fi

sleep 2
wait_for_window "$vm_name \[Running\] - Oracle VM VirtualBox"
boot_into_setup
sleep 9

echo "Welcome to Setup - Set up Windows now"
xdotool key --clearmodifiers --delay 20 Return
sleep 2
echo "No, do not use large disk support"
xdotool key --clearmodifiers --delay 20 Return
sleep 2
echo "Setup will restart your computer now - Continue"
xdotool key --clearmodifiers --delay 20 Return
sleep 3
boot_into_setup
sleep 9
echo "Setup is now going to perform a routine check on your system. - Continue"
xdotool key --clearmodifiers --delay 20 Return
sleep 8
echo "Welcome to Windows 98 Setup. (GUI) - Continue"
xdotool key --clearmodifiers --delay 20 Return
sleep 8
echo "Select Directory (C:\\Windows\\) - Next"
xdotool key --clearmodifiers --delay 20 Return
sleep 5
echo "Setup Options (Typical) - Next"
xdotool key --clearmodifiers --delay 20 Return
sleep 5
echo "Windows Components (Install the most common components (Recommended) - Next"
xdotool key --clearmodifiers --delay 20 Return

sleep 5
echo "Computer name"
xdotool key --clearmodifiers --delay 20 alt+shift # switch language input
sleep 0.5
xdotool type --delay 20 "VM"
sleep 0.5
xdotool key --clearmodifiers --delay 20 Return
sleep 5
echo "Establishing Your Location - Next"
xdotool key --clearmodifiers --delay 20 Return
sleep 1
echo "Start Copying Files - Next"
xdotool key --clearmodifiers --delay 20 Return

echo "(It should be copying files.)"
sleep 20
echo "(This might take a while...)"
sleep 100
echo "(It better be almost done, or already done...)"
sleep 10

# make sure you haven't wandered off
wait_for_window "$vm_name \[Running\] - Oracle VM VirtualBox"
sleep 2

echo "Username"
# computer has restarted at this point, so switch the language input again
xdotool key --clearmodifiers --delay 20 alt+shift
sleep 0.5
xdotool type --delay 20 "User"
sleep 0.5
xdotool key --clearmodifiers --delay 20 Return
sleep 1
echo "Accept agreement"
xdotool key --clearmodifiers --delay 20 Tab
sleep 1
xdotool key --clearmodifiers --delay 20 Return
sleep 1
echo "Product key"
# Attempt 1: Type the key directly
# Doesn't work with non-English language because it types e.g. Cyrillic instead
# xdotool type --delay 20 "B8MFRCFTGQC9PBWVHG3J3R3YW"
# but there's a built-in special keyboard for entering the product key, so we can use that

# Attempt 2: Tab thru the on-screen keyboard to enter the product key like a combination lock.
# Doesn't work because pressing a button focuses an input, and tabbing to the buttons means focusing either the first or last input which will then recieve the text when buttons are pressed.
# It's not meant to be used via the keyboard.

# echo "Enable product key on-screen keyboard"
# sleep 1
# xdotool key --delay 20 Tab
# sleep 0.02
# xdotool key --delay 20 Tab
# sleep 0.02
# xdotool key --delay 20 Tab
# sleep 0.02
# xdotool key --delay 20 Tab
# sleep 0.02
# xdotool key --delay 20 Tab
# sleep 0.02
# xdotool key --delay 20 space
# sleep 1
# xdotool key --delay 20 space
# sleep 1
# xdotool key --delay 20 Return
# sleep 1

# JavaScript code to generate shell code for tabbing:
# (()=> {
# let buttons = "BCDFGHJKMPQRTVWXY2346789";
# let tab_index = -5;
# let product_key = "B8MFR - CFTGQ - C9PBW - VHG3J - 3R3YW".replace(/[\s-]/g, "");
# let tab_indexes = product_key.split("").map((char)=> buttons.indexOf(char));
# let shell_code = `echo "Enter product key (${product_key})"\n`;
# for (let i=0; i<tab_indexes.length; i++) {
# 	while (tab_indexes[i] < tab_index) {
# 		tab_index -= 1;
# 		shell_code += "xdotool key --delay 20 shift+Tab\n";
# 	}
# 	while (tab_indexes[i] > tab_index) {
# 		tab_index += 1;
# 		shell_code += "xdotool key --delay 20 Tab\n";
# 	}
# 	shell_code += "xdotool key --delay 20 space\n";
# }
# return shell_code
# })();

# Attempt 3: click buttons with the mouse.
# Doesn't work because of how VirtualBox takes control of the mouse.
# It works fine with just mosuemove and not click, but with click,
# xdotool gets confused and clicks in the wrong spots.
# This behavior can be altered but afaik not fixed by using mousedown/mouseup instead of click.

# echo "Enable product key on-screen keyboard"
# sleep 1
# xdotool key --delay 20 Tab
# sleep 0.02
# xdotool key --delay 20 Tab
# sleep 0.02
# xdotool key --delay 20 Tab
# sleep 0.02
# xdotool key --delay 20 Tab
# sleep 0.02
# xdotool key --delay 20 Tab
# sleep 0.02
# xdotool key --delay 20 space
# sleep 1
# xdotool key --delay 20 space
# sleep 1
# xdotool key --delay 20 Return
# sleep 1

# JavaScript code to generate shell code for mouse clicking:
# (()=> {
# let button_rows = [
# 	["B", "C", "D", "F", "G", "H", "J", "K", "M", "P", "Q", "R"],
# 	["T", "V", "W", "X", "Y", "2", "3", "4", "6", "7", "8", "9"],
# ];
# // let product_key = "B8MFR - CFTGQ - C9PBW - VHG3J - 3R3YW".replace(/[\s-]/g, "");
# let product_key = "BCDFGHJKMPQRTVWXY2346789"; // for testing
# let shell_code = `echo "Enter product key (${product_key})"\n`;
# for (let i=0; i<product_key.length; i++) {
# 	for (let y=0; y<button_rows.length; y++) {
# 		let x = button_rows[y].indexOf(product_key[i]);
# 		if (x !== -1) {
# 			let mx = 230 + x * 26;
# 			let my = 270 + y * 24;
# 			shell_code += `
# xdotool mousemove --window $window_id ${mx} ${my}
# sleep 0.5
# xdotool click 1`;
# 		}
# 	}
# }
# return shell_code
# })();

# Other ideas:
# - Use an unattended answers file (msbatch.inf) instead of all this scripting
# - Use a different program for desktop automation in order to send clicks properly
#   - Be sure to test clicking in the VM before converting any of this script!
# - See if there's a setting or keyboard shortcut to switch keyboard layouts within Windows 98 setup

# echo ""
# echo "Can't enter product key. You have to do the most tedious part yourself."
# echo ""
# echo "Product key: B8MFR - CFTGQ - C9PBW - VHG3J - 3R3YW"
# echo ""
# exit

# Attempt 4.
# Switch language inputs before typing normally.
# Actually, applied this (alt+shift) to the earlier input.
# The computer has not restarted since typing the User name,
# so don't switch language inputs again.
echo "Enter product key (B8MFR - CFTGQ - C9PBW - VHG3J - 3R3YW)"
sleep 0.5
xdotool type --delay 20 "B8MFRCFTGQC9PBWVHG3J3R3YW"

# One liner to enter a key in case you need to try several keys or retype the key:
# xdotool search --sync --name "Win98-ja \[Running\] - Oracle VM VirtualBox" windowactivate --sync type --delay 20 "K4HVDQ9TJ96CRX9C9G68RQ2D3"
# xdotool search --sync --name " \[Running\] - Oracle VM VirtualBox" windowactivate --sync type --delay 20 "B8MFRCFTGQC9PBWVHG3J3R3YW"

sleep 0.5
xdotool key --clearmodifiers --delay 20 Return
sleep 1
echo "Finish (almost done, just Time Zone left after this...)"
xdotool key --clearmodifiers --delay 20 Return
sleep 200
echo "Time Zone"
xdotool key --clearmodifiers --delay 20 Return
sleep 1
echo "All done here! Did it work? I hope it worked!"
