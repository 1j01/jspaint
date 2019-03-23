/*
 *                 Author:
 *                      Vignesh Natarajan (a) Viki
 *                      https://vikilabs.org
 */

/* Import object named 'app' from electron module */
const {app} = require('electron')

/* Import object named 'BrowserWindow' from electron package */
const {BrowserWindow} = require('electron')

/* Global windows object */
var win = {}
var developer_mode = false;
//developer_mode = true;

/* Called during the following scenarios
 *		-> When close button (x) is pressed 
 *		-> When right click and quit option is selected in Mac OSX 
 *		-> When Quit is called from Electron Menu [Menu Bar]
 *	    -> When CMD+Q is pressed in Mac OSX
 *
 * In simple terms, This function will be called when the application 
 * is closed by any means [all close scenarios]
 */
function register_app_close_action(){
    /* If application/browser window is closed */
	win.on('closed', 
			() => 
			{	
			console.log("application close called")
			/* Dereference Window Object */
			/* Delete all window elements */
			win = null
			}
		  )
}

function create_window(){
	/* Create Browser Window of size 800x600 */
	win = new BrowserWindow({ width: 800, height: 600 })
}

function load_page(){
	/* Load index.html in the newly created window */
	win.loadFile('index.html')
}

function enable_developer_mode(){
	win.webContents.openDevTools()
}

/* initialize application */
function app_init() {
	create_window()
	load_page()

	if(developer_mode == true){
		enable_developer_mode();
	}

	register_app_close_action();
}

/* Specify what to do when electron is initialized and ready.
 * Control comes here when the application is freshly launched
 */
function register_electron_launch_action(){
	console.log("electron fresh launch called")
	app.on('ready', app_init)
}

/* Specify what to do when electron close button [x] is pressed
 */
function register_electorn_close_action(){
	app.on('window-all-closed', () => {
			console.log("electron close called")
			/* Do not quit application for mac os. In mac os applications and 
			* its menu bar to stay active until the user quits explicitly with 
			* Cmd + Q
			* 'darwin' = 'mac-os'
			*/

			if (process.platform !== 'darwin') {
				app.quit()
			}
	})
}

/* Applicable only for macOS. Application is relaunched from Dock.
 *
 * Specify what to do when application icon is clicked from dock after
 * closing the application.
 *
 * In Mac, The application icon stays in the dock and active even after closing  * the application
 */
function register_electron_active_action(){
	app.on('activate', () => {
		console.log("electron activate called")
		if (win === null) {
			app_init()
		}
	})
}

function main(){
	register_electron_launch_action()
	register_electorn_close_action()
	register_electron_active_action()
}

main()
