
(function(){
	
	var debug = function(text){
		if(typeof console !== "undefined"){
			console.log(text);
		}
	};
	
	// @TODO: keep other data in addition to the image data
	// such as the file_name and other state
	// (maybe even whether it's considered saved? idk about that)
	// I could have the image in one storage slot and the state in another
	
	var LocalSession = function(session_id){
		var lsid = "image#" + session_id;
		debug("local storage id: " + lsid);
		
		storage.get(lsid, function(err, uri){
			if(err){
				show_error_message("Failed to retrieve image from local storage:", err);
			}else if(uri){
				open_from_URI(uri, function(err){
					if(err){
						return show_error_message("Failed to open image from local storage:", err);
					}
					saved = false; // it may be safe, sure, but you haven't "Saved" it
				});
			}
		});
		
		$canvas.on("change.session-hook", function(){
			storage.set(lsid, canvas.toDataURL("image/png"), function(err){
				if(err){
					if(err.quotaExceeded){
						storage_quota_exceeded();
					}else{
						// e.g. localStorage is disabled
						// (or there's some other error?)
					}
				}
			});
		});
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
					FireSession.fb_root = new Firebase("https://jspaint.firebaseio.com/");
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
		
		// Wrap the Firebase API because they don't
		// provide a great way to clean up event listeners
		session._fb_listeners = [];
		var _fb_on = function(fb, event_type, callback){
			session._fb_listeners.push([fb, event_type, callback]);
			fb.on(event_type, callback);
		};
		
		// Get Firebase references
		session.fb = FireSession.fb_root.child(session.id);
		session.fb_data = session.fb.child("data");
		session.fb_users = session.fb.child("users");
		if(user_id){
			session.fb_user = session.fb_users.child(user_id);
		}else{
			session.fb_user = session.fb_users.push();
			user_id = session.fb_user.name();
		}
		
		// Remove the user from the session when they disconnect
		session.fb_user.onDisconnect().remove();
		// Make the user present in the session
		session.fb_user.set(user);
		// @TODO: Execute the above two lines when .info/connected
		
		// For each existing and new user
		_fb_on(session.fb_users, "child_added", function(snap){
			
			// Is this you?
			if(snap.name() === user_id){
				// You already have a cursor.
				return;
			}
			
			// Get the Firebase reference for this user
			var fb_other_user = snap.ref();
			
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
		var pointer_operations = [];
		
		var sync = function(){
			// Sync the data from this client to the server (one-way)
			var uri = canvas.toDataURL();
			if(previous_uri !== uri){
				debug(["clear pointer operations to set data", pointer_operations]);
				pointer_operations = [];
				debug("set data");
				session.fb_data.set(uri);
				previous_uri = uri;
			}else{
				debug("don't set data; it hasn't changed");
			}
		};
		
		$canvas.on("change.session-hook", sync);
		
		// Any time we change or recieve the image data
		_fb_on(session.fb_data, "value", function(snap){
			debug("data update");
			
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
		var _;
		while(_ = session._fb_listeners.pop()){
			debug("remove listener for " + _[0].path.toString() + " .on " + _[1]);
			_[0].off(_[1], _[2]);
		}
		
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
			debug("ending current session");
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
				debug("invalid session id; session id cannot be empty");
				end_current_session();
			}else if(!local && session_id.match(/[\.\/\[\]#$]/)){
				debug("session id is not a valid Firebase location; it cannot contain any of ./[]#$");
				end_current_session();
			}else if(!session_id.match(/[\-0-9A-Za-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02af\u1d00-\u1d25\u1d62-\u1d65\u1d6b-\u1d77\u1d79-\u1d9a\u1e00-\u1eff\u2090-\u2094\u2184-\u2184\u2488-\u2490\u271d-\u271d\u2c60-\u2c7c\u2c7e-\u2c7f\ua722-\ua76f\ua771-\ua787\ua78b-\ua78c\ua7fb-\ua7ff\ufb00-\ufb06]+/)){
				debug("invalid session id; it must consist of 'alphanumeric-esque' character");
				end_current_session();
			}else if(current_session && current_session.id === session_id){
				// @TODO: Handle switching between local and collaborative sessions of the same id
				debug("hash changed but the session id is the same");
			}else{
				// @TODO: Ask if you want to save before starting a new session
				end_current_session();
				if(local){
					debug("starting a new local session, id: "+session_id);
					current_session = new LocalSession(session_id);
				}else{
					debug("starting a new Firebase session, id: "+session_id);
					current_session = new FireSession(session_id);
				}
			}
		}else if(load_from_url_match){
			var url = decodeURIComponent(load_from_url_match[2]);
			var hash_loading_url_from = location.hash;
			
			end_current_session();

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
							debug("switching to new session from #load: URL because of user interaction");
							end_current_session();
							var new_session_id = generate_session_id();
							location.hash = "local:" + new_session_id;
						}
					});
				}, 100);
			});

		}else{
			debug("no session id in hash");
			end_current_session();
			var new_session_id = generate_session_id();
			history.replaceState(null, document.title, "#local:" + new_session_id);
		}
	};
	
	$G.on("hashchange popstate", function(e){
		window.console && console.log(e.type, location.hash);
		update_session_from_location_hash();
	});
	window.console && console.log("init with location hash", location.hash);
	update_session_from_location_hash();
	
	// @TODO: Session GUI
	// @TODO: Indicate when the session id is invalid
	// @TODO: Indicate when the session switches
})();
