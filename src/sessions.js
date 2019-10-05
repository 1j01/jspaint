
(function(){

	var log = function(){
		if(typeof console !== "undefined"){
			console.log.apply(console, arguments);
		}
	};

	var localStorageAvailable = false;
	try {
		localStorage._available = true;
		localStorageAvailable = localStorage._available;
		delete localStorage._available;
	// eslint-disable-next-line no-empty
	} catch (e) {}

	// @TODO: keep other data in addition to the image data
	// such as the file_name and other state
	// (maybe even whether it's considered saved? idk about that)
	// I could have the image in one storage slot and the state in another

	var LocalSession = function(session_id){
		var lsid = "image#" + session_id;
		log("local storage id: " + lsid);

		// save image to storage
		var save_image_to_storage = function(){
			storage.set(lsid, canvas.toDataURL("image/png"), function(err){
				if(err){
					if(err.quotaExceeded){
						storage_quota_exceeded();
					}else{
						// e.g. localStorage is disabled
						// (or there's some other error?)
						// TODO: show warning with "Don't tell me again" type option
					}
				}
			});
		}

		storage.get(lsid, function(err, uri){
			if(err){
				if (localStorageAvailable) {
					show_error_message("Failed to retrieve image from local storage:", err);
				} else {
					// TODO: DRY with storage manager message
					show_error_message("Please enable local storage in your browser's settings for local backup. It's may be called Cookies, Storage, or Site Data.");
				}
			}else if(uri){
				open_from_URI(uri, function(err){
					if(err){
						return show_error_message("Failed to open image from local storage:", err);
					}
					saved = false; // it may be safe, sure, but you haven't "Saved" it
				});
			} else {
				// no uri so lets save the blank canvas
				save_image_to_storage();
			}
		});

		$canvas.on("change.session-hook", save_image_to_storage);

	};
	LocalSession.prototype.end = function(){
		// Remove session-related hooks
		$app.find("*").off(".session-hook");
		$G.off(".session-hook");
	};


	// The user id is not persistent
	// A person can enter a session multiple times,
	// and is always given a new user id
	var user_id;
	// @TODO: I could make the color persistent, though.
	// You could still have multiple cursors and they would just be the same color.
	// There could also be an option to change your color

	// The data in this object is stored in the server when you enter a session
	// It is (supposed to be) removed when you leave
	var user = {
		// Cursor status
		cursor: {
			// cursor position in canvas coordinates
			x: 0, y: 0,
			// whether the user is elsewhere, such as in another tab
			away: true,
		},
		// Currently selected tool (@TODO)
		tool: "Pencil",
		// Color components
		hue: ~~(Math.random() * 360),
		saturation: ~~(Math.random() * 50) + 50,
		lightness: ~~(Math.random() * 40) + 50,
	};

	// The main cursor color
	user.color = "hsla(" + user.hue + ", " + user.saturation + "%, " + user.lightness + "%, 1)";
	// Unused
	user.color_transparent = "hsla(" + user.hue + ", " + user.saturation + "%, " + user.lightness + "%, 0.5)";
	// (@TODO) The color used in the toolbar indicating to other users it is selected by this user
	user.color_desaturated = "hsla(" + user.hue + ", " + ~~(user.saturation*0.4) + "%, " + user.lightness + "%, 0.8)";


	// The image used for other people's cursors
	var cursor_image = new Image();
	cursor_image.src = "images/cursors/default.png";


	var FireSession = function(session_id){
		var session = this;
		session.id = session_id;

		file_name = "[Loading "+session.id+"]";
		update_title();

		var on_firebase_loaded = function(){
			file_name = "["+session.id+"]";
			update_title();

			session.start();
		};
		if(!FireSession.fb_root){
			$.getScript("lib/firebase.js")
				.done(function(){

					var config = {
						apiKey: "AIzaSyBgau8Vu9ZE8u_j0rp-Lc044gYTX5O3X9k",
						authDomain: "jspaint.firebaseapp.com",
						databaseURL: "https://jspaint.firebaseio.com",
						projectId: "firebase-jspaint",
						storageBucket: "",
						messagingSenderId: "63395010995"
					};
					firebase.initializeApp(config);

					FireSession.fb_root = firebase.database().ref("/");
					on_firebase_loaded();
				})
				.fail(function(){
					show_error_message("Failed to load Firebase; the document will not load, and changes will not be saved.");
					file_name = "[Failed to load "+session.id+"]";
					update_title();
				});
		}else{
			on_firebase_loaded();
		}
	};

	FireSession.prototype.start = function(){
		var session = this;

		// TODO: how do you actually detect if it's failing???

		var $w = $FormWindow().title("Warning").addClass("dialogue-window");
		$w.$main.html(
			"<p>The document may not load. Changes may not save.</p>" +
			"<p>Multiuser sessions are public. There is no security.</p>"

			// "<p>The document may not load. Changes may not save. If it does save, it's public. There is no security.</p>"// +
			// "<p>I haven't found a way to detect Firebase quota limits being exceeded, " +
			// "so for now I'm showing this message regardless of whether it's working.</p>" +
			// "<p>If you're interested in using multiuser mode, please thumbs-up " +
			// "<a href='https://github.com/1j01/jspaint/issues/68'>this issue</a> to show interest, and/or subscribe for updates.</p>"
		);
		$w.$main.css({maxWidth: "500px"});
		$w.$Button("OK", function(){
			$w.close();
		});
		$w.center();
		
		// Wrap the Firebase API because they don't
		// provide a great way to clean up event listeners
		session._fb_listeners = [];
		var _fb_on = function(fb, event_type, callback, error_callback){
			session._fb_listeners.push({fb, event_type, callback, error_callback});
			fb.on(event_type, callback, error_callback);
		};

		// Get Firebase references
		session.fb = FireSession.fb_root.child(session.id);
		session.fb_data = session.fb.child("data");
		session.fb_users = session.fb.child("users");
		if(user_id){
			session.fb_user = session.fb_users.child(user_id);
		}else{
			session.fb_user = session.fb_users.push();
			user_id = session.fb_user.key;
		}

		// Remove the user from the session when they disconnect
		session.fb_user.onDisconnect().remove();
		// Make the user present in the session
		session.fb_user.set(user);
		// @TODO: Execute the above two lines when .info/connected

		// For each existing and new user
		_fb_on(session.fb_users, "child_added", function(snap){

			// Is this you?
			if(snap.key === user_id){
				// You already have a cursor.
				return;
			}

			// Get the Firebase reference for this user
			var fb_other_user = snap.ref;

			// Get the user object stored on the server
			var other_user = snap.val();

			// @TODO: display other cursor types?
			// @TODO: display pointer button state?
			// @TODO: display selections

			var cursor_canvas = new Canvas(32, 32);

			// Make the cursor element
			var $cursor = $(cursor_canvas).addClass("user-cursor").appendTo($app);
			$cursor.css({
				display: "none",
				position: "absolute",
				left: 0,
				top: 0,
				opacity: 0,
				zIndex: 500, // arbitrary; maybe too high
				pointerEvents: "none",
				transition: "opacity 0.5s",
			});

			// When the cursor data changes
			_fb_on(fb_other_user, "value", function(snap){
				other_user = snap.val();
				// If the user has left
				if(other_user == null){
					// Remove the cursor element
					$cursor.remove();
				}else{
					// Draw the cursor
					var draw_cursor = function(){
						cursor_canvas.width = cursor_image.width;
						cursor_canvas.height = cursor_image.height;
						var cctx = cursor_canvas.ctx;
						cctx.fillStyle = other_user.color;
						cctx.fillRect(0, 0, cursor_canvas.width, cursor_canvas.height);
						cctx.globalCompositeOperation = "darker";
						cctx.drawImage(cursor_image, 0, 0);
						cctx.globalCompositeOperation = "destination-atop";
						cctx.drawImage(cursor_image, 0, 0);
					};

					if(cursor_image.complete){
						draw_cursor();
					}else{
						$(cursor_image).one("load", draw_cursor);
					}

					// Update the cursor element
					var canvas_rect = canvas.getBoundingClientRect();
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

		var previous_uri;
		pointer_operations = [];

		var sync = function(){
			// Sync the data from this client to the server (one-way)
			var uri = canvas.toDataURL();
			if(previous_uri !== uri){
				log("clear pointer operations to set data", pointer_operations);
				pointer_operations = [];
				log("set data");
				session.fb_data.set(uri);
				previous_uri = uri;
			}else{
				log("don't set data; it hasn't changed");
			}
		};

		$canvas.on("change.session-hook", sync);

		// Any time we change or recieve the image data
		_fb_on(session.fb_data, "value", function(snap){
			log("data update");

			var uri = snap.val();
			if(uri == null){
				// If there's no value at the data location, this is a new session
				// Sync the current data to it
				sync();
			}else{
				previous_uri = uri;

				saved = true; // hopefully

				// Load the new image data
				var img = new Image();
				img.onload = function(){
					// Cancel any in-progress pointer operations
					if(pointer_operations.length){
						$G.triggerHandler("pointerup", "cancel");
					}

					// Write the image data to the canvas
					ctx.copy(img);
					$canvas_area.trigger("resize");
					// (detect_transparency() here would not be ideal
					// Perhaps a better way of syncing transparency
					// and other options will be established)

					// Playback recorded in-progress pointer operations
					window.console && console.log("playback", pointer_operations);
					for(var i=0; i<pointer_operations.length; i++){
						var e = pointer_operations[i];
						// Trigger the event at each place it is listened for
						$canvas.triggerHandler(e, ["synthetic"]);
						$G.triggerHandler(e, ["synthetic"]);
					}
				};
				img.src = uri;
			}
		}, function(error){
			show_error_message("Failed to retrieve data from Firebase. The document will not load, and changes will not be saved.", error);
			file_name = "[Failed to load "+session.id+"]";
			update_title();
		});

		// Update the cursor status

		$G.on("pointermove.session-hook", function(e){
			var m = e2c(e);
			session.fb_user.child("cursor").update({
				x: m.x,
				y: m.y,
				away: false,
			});
		});

		$G.on("blur.session-hook", function(e){
			session.fb_user.child("cursor").update({
				away: true,
			});
		});

		// @FIXME: the cursor can come back from "away" via a pointer event
		// while the window is blurred and stay there when the user goes away
		// maybe replace "away" with a timestamp of activity and then
		// clients can decide whether a given cursor should be visible
	};

	FireSession.prototype.end = function(){
		var session = this;

		// Remove session-related hooks
		$app.find("*").off(".session-hook");
		$G.off(".session-hook");

		// Remove collected Firebase event listeners
		session._fb_listeners.forEach(({fb, event_type, callback, error_callback})=> {
			log("remove listener for " + fb.path.toString() + " .on " + event_type);
			fb.off(event_type, callback);
		});
		session._fb_listeners.length = 0;

		// Remove the user from the session
		session.fb_user.remove();

		// Remove any cursor elements
		$app.find(".user-cursor").remove();

		// Reset to "untitled"
		reset_file();
	};

	// Handle the starting, switching, and ending of sessions from the location.hash

	var current_session;
	var end_current_session = function(){
		if(current_session){
			log("ending current session");
			current_session.end();
			current_session = null;
		}
	};
	var generate_session_id = function(){
		return (Math.random()*Math.pow(2, 32)).toString(16).replace(".", "");
	};
	var update_session_from_location_hash = function(e){
		// TODO: should #load: be separate from #session:/#local:,
		// and be able to load *into* a session, rather than just start one?
		// well I guess loading into a session wouldn't be that helpful if it makes a new image anyways
		// but it would be useful for collaborative sessions if collaborative sessions actually worked well enough to be useful
		// well, but you can paste images too, so you could just do that
		var session_match = location.hash.match(/^#?(session|local):(.*)$/i);
		var load_from_url_match = location.hash.match(/^#?(load):(.*)$/i);
		if(session_match){
			var local = session_match[1] === "local";
			var session_id = session_match[2];
			if(session_id === ""){
				log("invalid session id; session id cannot be empty");
				end_current_session();
			}else if(!local && session_id.match(/[./[\]#$]/)){
				log("session id is not a valid Firebase location; it cannot contain any of ./[]#$");
				end_current_session();
			}else if(!session_id.match(/[-0-9A-Za-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02af\u1d00-\u1d25\u1d62-\u1d65\u1d6b-\u1d77\u1d79-\u1d9a\u1e00-\u1eff\u2090-\u2094\u2184-\u2184\u2488-\u2490\u271d-\u271d\u2c60-\u2c7c\u2c7e-\u2c7f\ua722-\ua76f\ua771-\ua787\ua78b-\ua78c\ua7fb-\ua7ff\ufb00-\ufb06]+/)){
				log("invalid session id; it must consist of 'alphanumeric-esque' character");
				end_current_session();
			}else if(current_session && current_session.id === session_id){
				// @TODO: Handle switching between local and collaborative sessions of the same id
				log("hash changed but the session id is the same");
			}else{
				// @TODO: Ask if you want to save before starting a new session
				end_current_session();
				if(local){
					log("starting a new local session, id: "+session_id);
					current_session = new LocalSession(session_id);
				}else{
					log("starting a new Firebase session, id: "+session_id);
					current_session = new FireSession(session_id);
				}
			}
		}else if(load_from_url_match){
			var url = decodeURIComponent(load_from_url_match[2]);
			var hash_loading_url_from = location.hash;

			var uris = get_URIs(url);
			if (uris.length === 0) {
				show_error_message("Invalid URL to load (after #load: in the address bar). It must include a protocol (https:// or http://)");
				return;
			}
			end_current_session();

			// TODO: fix loading duplicately, from popstate and hashchange
			open_from_URI(url, function(err){
				if(err){
					show_resource_load_error_message();
				}
				// TODO: saved = false;?
				// NOTE: the following is intended to run regardless of error (as opposed to returning if there's an error)
				// FIXME: race condition (make the timeout long and try to fix it with a flag or something )
				setTimeout(function(){
					// NOTE: this "change" event doesn't *guarantee* there was a change :/
					// let alone that there was a user interaction with the currently loaded document
					// that is, it also triggers for session changes, which I'm trying to avoid here
					$canvas.one("change", function(){
						if(location.hash === hash_loading_url_from){
							log("switching to new session from #load: URL because of user interaction");
							end_current_session();
							var new_session_id = generate_session_id();
							location.hash = "local:" + new_session_id;
						}
					});
				}, 100);
			});

		}else{
			log("no session id in hash");
			end_current_session();
			var new_session_id = generate_session_id();
			history.replaceState(null, document.title, "#local:" + new_session_id);
			log("after replaceState", location.hash);
			update_session_from_location_hash();
		}
	};

	$G.on("hashchange popstate", function(e){
		log(e.type, location.hash);
		update_session_from_location_hash();
	});
	log("init with location hash", location.hash);
	update_session_from_location_hash();

	// @TODO: Session GUI
	// @TODO: Indicate when the session id is invalid
	// @TODO: Indicate when the session switches

	// @TODO: Indicate when there is no session!
	// Probably in app.js so as to handle the possibility of sessions.js failing to load.
})();
