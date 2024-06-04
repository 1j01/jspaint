// @ts-check
// eslint-disable-next-line no-unused-vars
/* global file_name:writable */
/* global $app, $canvas_area, localize, magnification, main_canvas, main_ctx, redos, undos */
import { $DialogWindow } from "./$ToolWindow.js";
// import { localize } from "./app-localization.js";
import { change_url_param, get_uris, load_image_from_uri, open_from_image_info, redo, reset_file, show_error_message, show_resource_load_error_message, undo, undoable, update_title } from "./functions.js";
import { $G, debounce, get_help_folder_icon, image_data_match, is_discord_embed, make_canvas, to_canvas_coords } from "./helpers.js";
import { storage_quota_exceeded } from "./manage-storage.js";
import { showMessageBox } from "./msgbox.js";
import { localStore } from "./storage.js";

const log = (...args) => {
	window.console?.log(...args);
};

let localStorageAvailable = false;
try {
	localStorage._available = true;
	localStorageAvailable = localStorage._available;
	delete localStorage._available;
} catch (_error) { /* ignore */ }

// @TODO: keep other data in addition to the image data
// such as the file_name and other state
// (maybe even whether it's considered saved? idk about that)
// I could have the image in one storage slot and the state in another

const match_threshold = 1; // 1 is just enough for a workaround for Brave browser's farbling: https://github.com/1j01/jspaint/issues/184
const canvas_has_any_apparent_image_data = () =>
	main_canvas.ctx.getImageData(0, 0, main_canvas.width, main_canvas.height).data.some((v) => v > match_threshold);

let $recovery_window;
function show_recovery_window(no_longer_blank) {
	$recovery_window?.close();
	const $w = $recovery_window = $DialogWindow();
	$w.on("close", () => {
		$recovery_window = null;
	});
	$w.title("Recover Document");
	let backup_impossible = false;
	try { window.localStorage.getItem("bogus test key"); } catch (_error) { backup_impossible = true; }
	// TODO: get rid of this invasive dialog https://github.com/1j01/jspaint/issues/325
	// It appears when it shouldn't, in basic scenarios like Ctrl+A in a transparent document,
	// and it gets bigger once you edit the document, which feels... almost aggressive.
	// That said, I've made it more compact and delineated the expanded section with a horizontal rule,
	// so it doesn't feel as much like it's changed out from under you and you have to re-read it.
	$w.$main.append($(`
		<p>Woah! The canvas became empty.</p>
		<p>If this was on purpose, please ignore this message.</p>
		<p>
			If the canvas was cleared due to memory usage,<br>
			click Undo to recover the document.
		</p>
		<!--<p>Remember to save with <b>File > Save</b>!</p>-->
		${backup_impossible ?
			"<p><b>Note:</b> No automatic backup is possible unless you enable Cookies in your browser.</p>" :
			(
				no_longer_blank ?
					`<hr>
					<p style="opacity: 0.8; font-size: 0.9em;">
						Auto-save is paused while this dialog is open.
					</p>
					<p style="opacity: 0.8; font-size: 0.9em;">
						(See <b>File &gt; Manage Storage</b> to view backups.)
					</p>` :
					""
			)
		}
	`));

	const $undo = $w.$Button("Undo", () => {
		undo();
	});
	const $redo = $w.$Button("Redo", () => {
		redo();
	});
	const update_buttons_disabled = () => {
		$undo.prop("disabled", undos.length < 1);
		$redo.prop("disabled", redos.length < 1);
	};
	$G.on("session-update.session-hook", update_buttons_disabled);
	update_buttons_disabled();

	$w.$Button(localize("Close"), () => {
		$w.close();
	});
	$w.center();

	$w.find("button:enabled").focus();
}

let last_undos_length = undos.length;
function handle_data_loss() {
	const window_is_open = $recovery_window && !$recovery_window.closed;
	let save_paused = false;
	if (!canvas_has_any_apparent_image_data()) {
		if (!window_is_open) {
			show_recovery_window();
		}
		save_paused = true;
	} else if (window_is_open) {
		if (undos.length > last_undos_length) {
			show_recovery_window(true);
		}
		save_paused = true;
	}
	last_undos_length = undos.length;
	return save_paused;
}

class LocalSession {
	constructor(session_id) {
		this.id = session_id;
		const ls_key = `image#${session_id}`;
		log(`Local storage key: ${ls_key}`);
		// save image to storage
		this.save_image_to_storage_immediately = () => {
			const save_paused = handle_data_loss();
			if (save_paused) {
				return;
			}
			log(`Saving image to storage: ${ls_key}`);
			localStore.set(ls_key, main_canvas.toDataURL("image/png"), (err) => {
				if (err) {
					// @ts-ignore (quotaExceeded is added by storage.js)
					if (err.quotaExceeded) {
						storage_quota_exceeded();
					} else {
						// e.g. localStorage is disabled
						// (or there's some other error?)
						// @TODO: show warning with "Don't tell me again" type option
					}
				}
			});
		};
		this.save_image_to_storage_soon = debounce(this.save_image_to_storage_immediately, 100);
		localStore.get(ls_key, (err, uri) => {
			if (err) {
				if (localStorageAvailable) {
					show_error_message("Failed to retrieve image from local storage.", err);
				} else {
					// @TODO: DRY with storage manager message
					showMessageBox({
						message: "Please enable local storage in your browser's settings for local backup. It may be called Cookies, Storage, or Site Data.",
					});
				}
			} else if (uri) {
				load_image_from_uri(uri).then((info) => {
					open_from_image_info(info, null, null, true, true);
				}, (error) => {
					show_error_message("Failed to open image from local storage.", error);
				});
			} else {
				// no uri so lets save the blank canvas
				this.save_image_to_storage_soon();
			}
		});
		$G.on("session-update.session-hook", () => {
			this.save_image_to_storage_soon();
		});
	}
	end() {
		// Skip debounce and save immediately
		this.save_image_to_storage_soon.cancel();
		this.save_image_to_storage_immediately();
		// Remove session-related hooks
		$G.off(".session-hook");
	}
}


// The user ID is not persistent
// A person can enter a session multiple times,
// and is always given a new user ID
let user_id;
// @TODO: I could make the color persistent, though.
// You could still have multiple cursors and they would just be the same color.
// There could also be an option to change your color

// The data in this object is stored in the server when you enter a session
// It is (supposed to be) removed when you leave
const user = {
	// Cursor status
	cursor: {
		// cursor position in canvas coordinates
		x: 0,
		y: 0,
		// whether the user is elsewhere, such as in another tab
		away: true,
	},
	// Currently selected tool (@TODO)
	tool: localize("Pencil"),
	// Color components
	hue: ~~(Math.random() * 360),
	saturation: ~~(Math.random() * 50) + 50,
	lightness: ~~(Math.random() * 40) + 50,
};

// The main cursor color
user.color = `hsla(${user.hue}, ${user.saturation}%, ${user.lightness}%, 1)`;
// Unused
user.color_transparent = `hsla(${user.hue}, ${user.saturation}%, ${user.lightness}%, 0.5)`;
// (@TODO) The color (that may be) used in the toolbar indicating to other users it is selected by this user
user.color_desaturated = `hsla(${user.hue}, ${~~(user.saturation * 0.4)}%, ${user.lightness}%, 0.8)`;


// The image used for other people's cursors
const cursor_image = new Image();
cursor_image.src = "images/cursors/default.png";


class FirebaseSession {
	constructor(session_id) {
		this.id = session_id;
		this._fb_listeners = [];

		file_name = `[Loading ${this.id}]`;
		update_title();
		const on_firebase_loaded = () => {
			file_name = `[${this.id}]`;
			update_title();
			this.start();
		};
		if (!FirebaseSession.fb_root) {
			var script = document.createElement("script");
			script.addEventListener("load", () => {
				const config = {
					apiKey: "AIzaSyBgau8Vu9ZE8u_j0rp-Lc044gYTX5O3X9k",
					authDomain: "jspaint.firebaseapp.com",
					databaseURL: "https://jspaint.firebaseio.com",
					projectId: "firebase-jspaint",
					storageBucket: "",
					messagingSenderId: "63395010995",
				};
				firebase.initializeApp(config);
				FirebaseSession.fb_root = firebase.database().ref("/");
				on_firebase_loaded();
			});
			script.addEventListener("error", () => {
				show_error_message("Failed to load Firebase; the document will not load, and changes will not be saved.");
				file_name = `[Failed to load ${this.id}]`;
				update_title();
			});
			script.src = "lib/firebase.js";
			document.head.appendChild(script);
		} else {
			on_firebase_loaded();
		}
	}
	start() {
		// @TODO: how do you actually detect if it's failing???
		showMessageBox({
			messageHTML: `
				<p>The document may not load. Changes may not save.</p>
				<p>Multiuser sessions are public. There is no security.</p>
			`,
		});
		// "<p>The document may not load. Changes may not save. If it does save, it's public. There is no security.</p>"// +
		// "<p>I haven't found a way to detect Firebase quota limits being exceeded, " +
		// "so for now I'm showing this message regardless of whether it's working.</p>" +
		// "<p>If you're interested in using multiuser mode, please thumbs-up " +
		// "<a href='https://github.com/1j01/jspaint/issues/68'>this issue</a> to show interest, and/or subscribe for updates.</p>"

		// Wrap the Firebase API because they don't
		// provide a great way to clean up event listeners
		const _fb_on = (fb, event_type, callback, error_callback) => {
			this._fb_listeners.push({ fb, event_type, callback, error_callback });
			fb.on(event_type, callback, error_callback);
		};
		// Get Firebase references
		this.fb = FirebaseSession.fb_root.child(this.id);
		this.fb_data = this.fb.child("data");
		this.fb_users = this.fb.child("users");
		if (user_id) {
			this.fb_user = this.fb_users.child(user_id);
		} else {
			this.fb_user = this.fb_users.push();
			user_id = this.fb_user.key;
		}
		// Remove the user from the session when they disconnect
		this.fb_user.onDisconnect().remove();
		// Make the user present in the session
		this.fb_user.set(user);
		// @TODO: Execute the above two lines when .info/connected
		// For each existing and new user
		_fb_on(this.fb_users, "child_added", (snap) => {
			// Is this you?
			if (snap.key === user_id) {
				// You already have a cursor.
				return;
			}
			// Get the Firebase reference for this user
			const fb_other_user = snap.ref;
			// Get the user object stored on the server
			let other_user = snap.val();
			// @TODO: display other cursor types?
			// @TODO: display pointer button state?
			// @TODO: display selections
			const cursor_canvas = make_canvas(32, 32);
			// Make the cursor element
			const $cursor = $(cursor_canvas).addClass("user-cursor").appendTo($app);
			$cursor.css({
				display: "none",
				position: "absolute",
				left: 0,
				top: 0,
				opacity: 0,
				zIndex: 5, // @#: z-index
				pointerEvents: "none",
				transition: "opacity 0.5s",
			});
			// When the cursor data changes
			_fb_on(fb_other_user, "value", (snap) => {
				other_user = snap.val();
				// If the user has left
				if (other_user == null) {
					// Remove the cursor element
					$cursor.remove();
				} else {
					// Draw the cursor
					const draw_cursor = () => {
						cursor_canvas.width = cursor_image.width;
						cursor_canvas.height = cursor_image.height;
						const cursor_ctx = cursor_canvas.ctx;
						cursor_ctx.fillStyle = other_user.color;
						cursor_ctx.fillRect(0, 0, cursor_canvas.width, cursor_canvas.height);
						cursor_ctx.globalCompositeOperation = "multiply";
						cursor_ctx.drawImage(cursor_image, 0, 0);
						cursor_ctx.globalCompositeOperation = "destination-atop";
						cursor_ctx.drawImage(cursor_image, 0, 0);
					};
					if (cursor_image.complete) {
						draw_cursor();
					} else {
						$(cursor_image).one("load", draw_cursor);
					}
					// Update the cursor element
					const canvas_rect = window.canvas_bounding_client_rect;
					$cursor.css({
						display: "block",
						position: "absolute",
						left: canvas_rect.left + magnification * other_user.cursor.x,
						top: canvas_rect.top + magnification * other_user.cursor.y,
						opacity: 1 - other_user.cursor.away,
					});
				}
			});
		});
		let previous_uri;
		// let pointer_operations = []; // the multiplayer syncing stuff is a can of worms, so this is disabled
		this.write_canvas_to_database_immediately = () => {
			const save_paused = handle_data_loss();
			if (save_paused) {
				return;
			}
			// Sync the data from this client to the server (one-way)
			const uri = main_canvas.toDataURL();
			if (previous_uri !== uri) {
				// log("clear pointer operations to set data", pointer_operations);
				// pointer_operations = [];
				log("Write canvas data to Firebase");
				this.fb_data.set(uri);
				previous_uri = uri;
			} else {
				log("(Don't write canvas data to Firebase; it hasn't changed)");
			}
		};
		this.write_canvas_to_database_soon = debounce(this.write_canvas_to_database_immediately, 100);
		let ignore_session_update = false;
		$G.on("session-update.session-hook", () => {
			if (ignore_session_update) {
				log("(Ignore session-update from Sync Session undoable)");
				return;
			}
			this.write_canvas_to_database_soon();
		});
		// Any time we change or receive the image data
		_fb_on(this.fb_data, "value", (snap) => {
			log("Firebase data update");
			const uri = snap.val();
			if (uri == null) {
				// If there's no value at the data location, this is a new session
				// Sync the current data to it
				this.write_canvas_to_database_soon();
			} else {
				previous_uri = uri;
				// Load the new image data
				const img = new Image();
				img.onload = () => {
					// Cancel any in-progress pointer operations
					// if (pointer_operations.length) {
					// 	$G.triggerHandler("pointerup", "cancel");
					// }

					const test_canvas = make_canvas(img);
					const image_data_remote = test_canvas.ctx.getImageData(0, 0, test_canvas.width, test_canvas.height);
					const image_data_local = main_ctx.getImageData(0, 0, main_canvas.width, main_canvas.height);

					if (!image_data_match(image_data_remote, image_data_local, 5)) {
						ignore_session_update = true;
						undoable({
							name: "Sync Session",
							icon: get_help_folder_icon("p_database.png"),
						}, () => {
							// Write the image data to the canvas
							main_ctx.copy(img);
							$canvas_area.trigger("resize");
						});
						ignore_session_update = false;
					}

					// (transparency = has_any_transparency(main_ctx); here would not be ideal
					// Perhaps a better way of syncing transparency
					// and other options will be established)
					/*
					// Playback recorded in-progress pointer operations
					log("Playback", pointer_operations);

					for (const e of pointer_operations) {
						// Trigger the event at each place it is listened for
						$canvas.triggerHandler(e, ["synthetic"]);
						$G.triggerHandler(e, ["synthetic"]);
					}
					*/
				};
				img.src = uri;
			}
		}, (error) => {
			show_error_message("Failed to retrieve data from Firebase. The document will not load, and changes will not be saved.", error);
			file_name = `[Failed to load ${this.id}]`;
			update_title();
		});
		// Update the cursor status
		$G.on("pointermove.session-hook", (e) => {
			const m = to_canvas_coords(e);
			this.fb_user.child("cursor").update({
				x: m.x,
				y: m.y,
				away: false,
			});
		});
		$G.on("blur.session-hook", () => {
			this.fb_user.child("cursor").update({
				away: true,
			});
		});
		// @FIXME: the cursor can come back from "away" via a pointer event
		// while the window is blurred and stay there when the user goes away
		// maybe replace "away" with a timestamp of activity and then
		// clients can decide whether a given cursor should be visible

		/*
		const debug_event = (e, synthetic) => {
			// const label = synthetic ? "(synthetic)" : "(normal)";
			// window.console?.debug?.debug(e.type, label);
		};

		$canvas_area.on("pointerdown.session-hook", "*", (e, synthetic) => {
			debug_event(e, synthetic);
			if (synthetic) { return; }

			pointer_operations = [e];
			const pointermove = (e, synthetic) => {
				debug_event(e, synthetic);
				if (synthetic) { return; }

				pointer_operations.push(e);
			};
			$G.on("pointermove.session-hook", pointermove);
			$G.one("pointerup.session-hook", (e, synthetic) => {
				debug_event(e, synthetic);
				if (synthetic) { return; }

				$G.off("pointermove.session-hook", pointermove);
			});
		});
		*/
	}
	end() {
		// Skip debounce and save immediately
		this.write_canvas_to_database_soon.cancel();
		this.write_canvas_to_database_immediately();
		// Remove session-related hooks
		$G.off(".session-hook");
		// $canvas_area.off("pointerdown.session-hook");
		// Remove collected Firebase event listeners
		this._fb_listeners.forEach(({ fb, event_type, callback, _error_callback }) => {
			log(`Remove listener for ${fb.path.toString()} .on ${event_type}`);
			fb.off(event_type, callback);
		});
		this._fb_listeners.length = 0;
		// Remove the user from the session
		this.fb_user.remove();
		// Remove any cursor elements
		$app.find(".user-cursor").remove();
		// Reset to "untitled"
		reset_file();
	}
}

/**
 * fb_root is the root reference for the Firebase Realtime Database
 * @memberof FirebaseSession
 * @type {any} - @TODO: install types for Firebase or ditch Firebase
 */
FirebaseSession.fb_root = null;


// class WebSocketSession {
// 	constructor(session_id) {
// 		this.id = session_id;
// 		this._listeners = [];

// 		// this.ws = new WebSocket(`wss://${location.host}/api/sessions/${this.id}`);
// 		this.ws = new WebSocket(`ws://${location.host}/api/session`);

// 		file_name = `[${this.id}]`;
// 		update_title();
// 		this.start();
// 	}
// 	start() {
// 		this.ws.addEventListener("open", () => {
// 			this.ws.send(JSON.stringify({
// 				type: "join",
// 				user,
// 				session_id: this.id,
// 			}));
// 		});

// 		this.ws.addEventListener("message", e => {
// 			const data = JSON.parse(e.data);
// 			if (data.type === "image") {
// 				// TODO: transfer as binary data
// 				const img = new Image();
// 				img.onload = () => {
// 					undoable({
// 						name: "Sync Session",
// 						icon: get_help_folder_icon("p_database.png"),
// 					}, () => {
// 						main_ctx.copy(img);
// 						$canvas_area.trigger("resize");
// 					});
// 				};
// 				img.src = data.uri;
// 			} else if (data.type === "cursor") {
// 				const cursor_canvas = make_canvas(32, 32);
// 				const $cursor = $(cursor_canvas).addClass("user-cursor").appendTo($app);
// 				$cursor.css({
// 					display: "none",
// 					position: "absolute",
// 					left: 0,
// 					top: 0,
// 					opacity: 0,
// 					zIndex: 5, // @#: z-index
// 					pointerEvents: "none",
// 					transition: "opacity 0.5s",
// 				});
// 				const draw_cursor = () => {
// 					cursor_canvas.width = cursor_image.width;
// 					cursor_canvas.height = cursor_image.height;
// 					const cursor_ctx = cursor_canvas.ctx;
// 					cursor_ctx.fillStyle = data.color;
// 					cursor_ctx.fillRect(0, 0, cursor_canvas.width, cursor_canvas.height);
// 					cursor_ctx.globalCompositeOperation = "multiply";
// 					cursor_ctx.drawImage(cursor_image, 0, 0);
// 					cursor_ctx.globalCompositeOperation = "destination-atop";
// 					cursor_ctx.drawImage(cursor_image, 0, 0);
// 				};
// 				if (cursor_image.complete) {
// 					draw_cursor();
// 				}
// 				else {
// 					$(cursor_image).one("load", draw_cursor);
// 				}
// 				// Update the cursor element
// 				const canvas_rect = window.canvas_bounding_client_rect;
// 				$cursor.css({
// 					display: "block",
// 					position: "absolute",
// 					left: canvas_rect.left + magnification * data.x,
// 					top: canvas_rect.top + magnification * data.y,
// 					opacity: 1 - data.away,
// 				});
// 			} else {
// 				console.warn("Unknown message type", data.type);
// 			}
// 		});


// 		// // For each existing and new user
// 		// _fb_on(this.fb_users, "child_added", snap => {
// 		// 	// Is this you?
// 		// 	if (snap.key === user_id) {
// 		// 		// You already have a cursor.
// 		// 		return;
// 		// 	}
// 		// 	// Get the Firebase reference for this user
// 		// 	const fb_other_user = snap.ref;
// 		// 	// Get the user object stored on the server
// 		// 	let other_user = snap.val();
// 		// 	// @TODO: display other cursor types?
// 		// 	// @TODO: display pointer button state?
// 		// 	// @TODO: display selections
// 		// 	const cursor_canvas = make_canvas(32, 32);
// 		// 	// Make the cursor element
// 		// 	const $cursor = $(cursor_canvas).addClass("user-cursor").appendTo($app);
// 		// 	$cursor.css({
// 		// 		display: "none",
// 		// 		position: "absolute",
// 		// 		left: 0,
// 		// 		top: 0,
// 		// 		opacity: 0,
// 		// 		zIndex: 5, // @#: z-index
// 		// 		pointerEvents: "none",
// 		// 		transition: "opacity 0.5s",
// 		// 	});
// 		// 	// When the cursor data changes
// 		// 	_fb_on(fb_other_user, "value", snap => {
// 		// 		other_user = snap.val();
// 		// 		// If the user has left
// 		// 		if (other_user == null) {
// 		// 			// Remove the cursor element
// 		// 			$cursor.remove();
// 		// 		}
// 		// 		else {
// 		// 			// Draw the cursor
// 		// 			const draw_cursor = () => {
// 		// 				cursor_canvas.width = cursor_image.width;
// 		// 				cursor_canvas.height = cursor_image.height;
// 		// 				const cursor_ctx = cursor_canvas.ctx;
// 		// 				cursor_ctx.fillStyle = other_user.color;
// 		// 				cursor_ctx.fillRect(0, 0, cursor_canvas.width, cursor_canvas.height);
// 		// 				cursor_ctx.globalCompositeOperation = "multiply";
// 		// 				cursor_ctx.drawImage(cursor_image, 0, 0);
// 		// 				cursor_ctx.globalCompositeOperation = "destination-atop";
// 		// 				cursor_ctx.drawImage(cursor_image, 0, 0);
// 		// 			};
// 		// 			if (cursor_image.complete) {
// 		// 				draw_cursor();
// 		// 			}
// 		// 			else {
// 		// 				$(cursor_image).one("load", draw_cursor);
// 		// 			}
// 		// 			// Update the cursor element
// 		// 			const canvas_rect = window.canvas_bounding_client_rect;
// 		// $cursor.css({
// 		// 				display: "block",
// 		// 				position: "absolute",
// 		// 				left: canvas_rect.left + magnification * other_user.cursor.x,
// 		// 				top: canvas_rect.top + magnification * other_user.cursor.y,
// 		// 				opacity: 1 - other_user.cursor.away,
// 		// 			});
// 		// 		}
// 		// 	});
// 		// });
// 		// let previous_uri;
// 		// // let pointer_operations = []; // the multiplayer syncing stuff is a can of worms, so this is disabled
// 		// this.write_canvas_to_database_immediately = () => {
// 		// 	const save_paused = handle_data_loss();
// 		// 	if (save_paused) {
// 		// 		return;
// 		// 	}
// 		// 	// Sync the data from this client to the server (one-way)
// 		// 	const uri = main_canvas.toDataURL();
// 		// 	if (previous_uri !== uri) {
// 		// 		// log("clear pointer operations to set data", pointer_operations);
// 		// 		// pointer_operations = [];
// 		// 		log("Write canvas data to Firebase");
// 		// 		this.fb_data.set(uri);
// 		// 		previous_uri = uri;
// 		// 	}
// 		// 	else {
// 		// 		log("(Don't write canvas data to Firebase; it hasn't changed)");
// 		// 	}
// 		// };
// 		// this.write_canvas_to_database_soon = debounce(this.write_canvas_to_database_immediately, 100);
// 		// let ignore_session_update = false;
// 		// $G.on("session-update.session-hook", () => {
// 		// 	if (ignore_session_update) {
// 		// 		log("(Ignore session-update from Sync Session undoable)");
// 		// 		return;
// 		// 	}
// 		// 	this.write_canvas_to_database_soon();
// 		// });
// 		// // Any time we change or receive the image data
// 		// _fb_on(this.fb_data, "value", snap => {
// 		// 	log("Firebase data update");
// 		// 	const uri = snap.val();
// 		// 	if (uri == null) {
// 		// 		// If there's no value at the data location, this is a new session
// 		// 		// Sync the current data to it
// 		// 		this.write_canvas_to_database_soon();
// 		// 	}
// 		// 	else {
// 		// 		previous_uri = uri;
// 		// 		// Load the new image data
// 		// 		const img = new Image();
// 		// 		img.onload = () => {
// 		// 			// Cancel any in-progress pointer operations
// 		// 			// if (pointer_operations.length) {
// 		// 			// 	$G.triggerHandler("pointerup", "cancel");
// 		// 			// }

// 		// 			const test_canvas = make_canvas(img);
// 		// 			const image_data_remote = test_canvas.ctx.getImageData(0, 0, test_canvas.width, test_canvas.height);
// 		// 			const image_data_local = main_ctx.getImageData(0, 0, main_canvas.width, main_canvas.height);

// 		// 			if (!image_data_match(image_data_remote, image_data_local, 5)) {
// 		// 				ignore_session_update = true;
// 		// 				undoable({
// 		// 					name: "Sync Session",
// 		// 					icon: get_help_folder_icon("p_database.png"),
// 		// 				}, () => {
// 		// 					// Write the image data to the canvas
// 		// 					main_ctx.copy(img);
// 		// 					$canvas_area.trigger("resize");
// 		// 				});
// 		// 				ignore_session_update = false;
// 		// 			}
// 		// 		};
// 		// 		img.src = uri;
// 		// 	}
// 		// }, error => {
// 		// 	show_error_message("Failed to retrieve data from Firebase. The document will not load, and changes will not be saved.", error);
// 		// 	file_name = `[Failed to load ${this.id}]`;
// 		// 	update_title();
// 		// });
// 		// // Update the cursor status
// 		// $G.on("pointermove.session-hook", e => {
// 		// 	const m = to_canvas_coords(e);
// 		// 	this.fb_user.child("cursor").update({
// 		// 		x: m.x,
// 		// 		y: m.y,
// 		// 		away: false,
// 		// 	});
// 		// });
// 		// $G.on("blur.session-hook", () => {
// 		// 	this.fb_user.child("cursor").update({
// 		// 		away: true,
// 		// 	});
// 		// });
// 		// @FIXME: the cursor can come back from "away" via a pointer event
// 		// while the window is blurred and stay there when the user goes away
// 		// maybe replace "away" with a timestamp of activity and then
// 		// clients can decide whether a given cursor should be visible
// 	}
// 	end() {
// 		// Skip debounce and save immediately
// 		this.write_canvas_to_database_soon.cancel();
// 		this.write_canvas_to_database_immediately();
// 		// Remove session-related hooks
// 		$G.off(".session-hook");
// 		// $canvas_area.off("pointerdown.session-hook");
// 		// Remove collected Firebase event listeners
// 		this._fb_listeners.forEach(({ fb, event_type, callback, _error_callback }) => {
// 			log(`Remove listener for ${fb.path.toString()} .on ${event_type}`);
// 			fb.off(event_type, callback);
// 		});
// 		this._fb_listeners.length = 0;
// 		// Remove the user from the session
// 		this.fb_user.remove();
// 		// Remove any cursor elements
// 		$app.find(".user-cursor").remove();
// 		// Reset to "untitled"
// 		reset_file();
// 	}
// }


class RESTSession {
	constructor(session_id) {
		this.id = session_id;

		file_name = `[Loading ${this.id}]`;
		update_title();
		this.start();

		this._previous_uri = "";
		this._ignore_session_update = false;
		this._poll_tid = -1;
		this._poll_fetch_start_time = -1;
		this._last_write_time = -1;
	}
	async _write_canvas_to_server_immediately() {
		const save_paused = handle_data_loss();
		if (save_paused) {
			return;
		}
		// Sync the data from this client to the server (one-way)
		const uri = main_canvas.toDataURL();
		if (this._previous_uri !== uri) {
			// log("clear pointer operations to set data", pointer_operations);
			// pointer_operations = [];
			log("Write canvas data to server");
			this._previous_uri = uri;
			this._last_write_time = performance.now(); // not sure about this
			await fetch(`/api/rooms/${this.id}/data`, {
				method: "PUT",
				body: uri,
			});
			this._last_write_time = performance.now(); // not sure about this
		} else {
			log("(Don't write canvas data to server; it hasn't changed)");
		}
	}
	start() {
		this._write_canvas_to_server_soon = debounce(this._write_canvas_to_server_immediately, 100);
		$G.on("session-update.session-hook", () => {
			if (this._ignore_session_update) {
				log("(Ignore session-update from Sync Session undoable)");
				return;
			}
			this._write_canvas_to_server_soon();
			this._last_write_time = performance.now(); // not sure about this
		});
		// Poll for changes
		const poll = async () => {
			let received_image_data_uri;
			try {
				this._poll_fetch_start_time = performance.now();
				const response = await fetch(`/api/rooms/${this.id}/data`);
				if (response.status === 404) {
					// If the image data wasn't found, this is a new session
					received_image_data_uri = null;
				} else {
					received_image_data_uri = await response.text();
				}
			} catch (error) {
				show_error_message("Failed to load image document from the server.", error);
				file_name = `[Failed to load ${this.id}]`;
				update_title();
				return; // Uh, TODO: retry?
			}
			file_name = `[${this.id}]`;
			update_title();
			this.handle_data_snapshot(received_image_data_uri, this._poll_fetch_start_time);
			// @ts-ignore  (stupid @types/node interference, with their setTimeout typing)
			this._poll_tid = setTimeout(poll, 1000);
		};
		poll();
	}
	handle_data_snapshot(uri, start_time) {
		// Any time we change or receive the image data
		if (!uri) {
			// This is a new session; sync the current data to it
			this._write_canvas_to_server_soon();
			this._last_write_time = performance.now(); // not sure about this
		} else {
			this._previous_uri = uri;
			// Load the new image data
			const img = new Image();
			img.onload = () => {

				if (this._last_write_time > start_time) {
					// If the image data was written since we started fetching it,
					// ignore the likely-stale data.
					log("(Ignore stale image data)");
					return;
				}

				// Cancel any in-progress pointer operations
				// if (pointer_operations.length) {
				// 	$G.triggerHandler("pointerup", "cancel");
				// }

				const test_canvas = make_canvas(img);
				const image_data_remote = test_canvas.ctx.getImageData(0, 0, test_canvas.width, test_canvas.height);
				const image_data_local = main_ctx.getImageData(0, 0, main_canvas.width, main_canvas.height);

				if (!image_data_match(image_data_remote, image_data_local, 5)) {
					this._ignore_session_update = true;
					undoable({
						name: "Sync Session",
						icon: get_help_folder_icon("p_database.png"),
					}, () => {
						// Write the image data to the canvas
						main_ctx.copy(img);
						$canvas_area.trigger("resize");
					});
					this._ignore_session_update = false;
				}
			};
			img.onerror = () => {
				// uri is invalid, so it might be an error message or something; I'll include it in the expandible details.
				show_error_message("Failed to load image document from the server. Invalid image data.", uri);
			};
			img.src = uri;
		}
	}
	end() {
		// Stop polling
		clearTimeout(this._poll_tid);
		// Skip debounce and save immediately
		this._write_canvas_to_server_soon.cancel();
		this._write_canvas_to_server_immediately();
		// Remove session-related hooks
		$G.off(".session-hook");
		// Remove any cursor elements
		$app.find(".user-cursor").remove();
		// Reset to "untitled"
		reset_file();
	}
}


// Handle the starting, switching, and ending of sessions from the location.hash

let current_session;
const end_current_session = () => {
	if (current_session) {
		log("Ending current session");
		current_session.end();
		current_session = null;
	}
};
const generate_session_id = () => (Math.random() * (2 ** 32)).toString(16).replace(".", "");
const update_session_from_location_hash = () => {
	const session_match = location.hash.match(/^#?(?:.*,)?(session|local):(.*)$/i);
	const load_from_url_match = location.hash.match(/^#?(?:.*,)?(load):(.*)$/i);
	if (session_match) {
		const local = session_match[1].toLowerCase() === "local";
		const session_id = session_match[2];
		if (session_id === "") {
			log("Invalid session ID; session ID cannot be empty");
			end_current_session();
		} else if (!local && session_id.match(/[./[\]#$]/)) {
			log("Session ID is not a valid Firebase location; it cannot contain any of ./[]#$");
			end_current_session();
		} else if (!session_id.match(/[-0-9A-Za-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02af\u1d00-\u1d25\u1d62-\u1d65\u1d6b-\u1d77\u1d79-\u1d9a\u1e00-\u1eff\u2090-\u2094\u2184-\u2184\u2488-\u2490\u271d-\u271d\u2c60-\u2c7c\u2c7e-\u2c7f\ua722-\ua76f\ua771-\ua787\ua78b-\ua78c\ua7fb-\ua7ff\ufb00-\ufb06]+/)) {
			log("Invalid session ID; it must consist of 'alphanumeric-esque' characters");
			end_current_session();
		} else if (
			current_session && current_session.id === session_id &&
			local === (current_session instanceof LocalSession)
		) {
			log("Hash changed but the session ID and session type are the same");
		} else {
			// @TODO: Ask if you want to save before starting a new session
			end_current_session();
			let online_session_implementation = is_discord_embed ? "RESTSession" : "FirebaseSession";
			try {
				online_session_implementation = localStorage["online_session_implementation"] || online_session_implementation;
			} catch (_error) {
				// ignore, as this is only for development
			}
			if (local) {
				log(`Starting a new LocalSession, ID: ${session_id}`);
				current_session = new LocalSession(session_id);
			} else if (online_session_implementation === "RESTSession") {
				// log(`Starting a new WebSocketSession, ID: ${session_id}`);
				// current_session = new WebSocketSession(session_id);
				log(`Starting a new RESTSession, ID: ${session_id}`);
				current_session = new RESTSession(session_id);
			} else if (online_session_implementation === "FirebaseSession") {
				log(`Starting a new FirebaseSession, ID: ${session_id}`);
				current_session = new FirebaseSession(session_id);
			} else {
				show_error_message(`Invalid online session implementation '${online_session_implementation}'`);
				current_session = new LocalSession(session_id);
			}
		}
	} else if (load_from_url_match) {
		const url = decodeURIComponent(load_from_url_match[2]);

		const uris = get_uris(url);
		if (uris.length === 0) {
			show_error_message("Invalid URL to load (after #load: in the address bar). It must include a protocol (https:// or http://)");
			return;
		}

		log("Switching to new session from #load: URL (to #local: URL with session ID)");
		// Note: could use into_existing_session=false on open_from_image_info instead of creating the new session beforehand
		end_current_session();
		change_url_param("local", generate_session_id());

		load_image_from_uri(url).then((info) => {
			open_from_image_info(info, null, null, true, true);
		}, show_resource_load_error_message);

	} else {
		log("No session ID in hash");
		const old_hash = location.hash;
		end_current_session();
		change_url_param("local", generate_session_id(), { replace_history_state: true });
		log("After replaceState:", location.hash);
		if (old_hash === location.hash) {
			// e.g. on Wayback Machine
			show_error_message("Autosave is disabled. Failed to update URL to start session.");
		} else {
			update_session_from_location_hash();
		}
	}
};

$G.on("hashchange popstate change-url-params", (e) => {
	log(e.type, location.hash);
	update_session_from_location_hash();
});

const new_local_session = () => {
	end_current_session();
	log("Changing URL to start new session...");
	change_url_param("local", generate_session_id());
};

// @TODO: Session GUI
// @TODO: Indicate when the session ID is invalid
// @TODO: Indicate when the session switches

// @TODO: Indicate when there is no session!
// Probably in app.js so as to handle the possibility of sessions.js failing to load.


if (is_discord_embed) {
	// I'm using top level await WITHIN the discord-activity-client.js module,
	// but not here due to lack of support in the current browser version used for Cypress tests.
	// This async IIFE could be eliminated if Cypress was updated.
	(async () => {
		const { /*Discord,*/ discordSdk, newAuth, guildMember, handleExternalLinks, discordActivitySystemHooks } = await import("./discord-activity-client.js");
		// const { Events } = Discord;

		log("Discord SDK", discordSdk);
		log("New Auth:", newAuth);
		log("Guild Member", guildMember);

		// Handle external links
		handleExternalLinks();

		// Start session for the Discord Activity instance
		// (Would channelId be better?)
		log(`Starting session for Discord Activity instance ${discordSdk.instanceId}`);
		change_url_param("session", `discord-activity-${discordSdk.instanceId}`);

		// Apply system hooks
		Object.assign(window.systemHooks, discordActivitySystemHooks);

		// // Fetch
		// const participants = await discordSdk.commands.getInstanceConnectedParticipants();
		// console.log("Initial participants", participants);

		// // Subscribe
		// discordSdk.subscribe(Events.ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE, updateParticipants);
		// // Unsubscribe
		// discordSdk.unsubscribe(Events.ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE, updateParticipants);
	})();
} else {
	log("Initializing with location hash:", location.hash);
	update_session_from_location_hash();
}

// function updateParticipants(participants) {
// 	// Do something really cool
// 	console.log("Updated participants:", participants);
// }

export { new_local_session };
// Temporary globals until all dependent code is converted to ES Modules
window.new_local_session = new_local_session; // used by functions.js

