
(function(){
	
	var debug = function(text){
		if(console){
			console.log(text);
		}
	};
	
	
	// The user id is not persistent
	// A person can enter a session multiple times,
	// and is always given a new user id
	var user_id;
	// I could make the color persistent, though.
	// You could still have multiple cursors and they would just be the same color.
	// (@TODO)
	
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
	
	
	var Session = function(session_id){
		var session = this;
		session.id = session_id;
		
		file_name = "[Loading "+session.id+"]";
		update_title();
		
		var on_firebase_loaded = function(){
			file_name = "["+session.id+"]";
			update_title();
			
			session.start();
		};
		if(!Session.fb_root){
			$.getScript("lib/firebase.js", function(){
				Session.fb_root = new Firebase("https://jspaint.firebaseio.com/");
				on_firebase_loaded();
			});
		}else{
			on_firebase_loaded();
		}
	};
	
	Session.prototype.start = function(){
		var session = this;
		
		// Wrap the Firebase API because they don't
		// provide a great way to clean up event listeners
		session._fb_listeners = [];
		var _fb_on = function(fb, event_type, callback){
			session._fb_listeners.push([fb, event_type, callback]);
			fb.on(event_type, callback);
		};
		
		// Get Firebase references
		session.fb = Session.fb_root.child(session.id);
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
			// @TODO: display mouse button state?
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
					var z = +($canvas.css("zoom") || 1);
					$cursor.css({
						display: "block",
						position: "absolute",
						left: canvas_rect.left + z * other_user.cursor.x,
						top: canvas_rect.top + z * other_user.cursor.y,
						opacity: 1 - other_user.cursor.away,
					});
				}
			});
		});
		
		var previous_uri;
		var sync = function(){
			// Sync the data from this client to the server (one-way)
			var uri = canvas.toDataURL();
			if(previous_uri !== uri){
				debug("set data");
				session.fb_data.set(uri);
				previous_uri = uri;
			}else{
				debug("don't set data; it hasn't changed");
			}
		};
		
		// Any time we change or recieve the image data
		_fb_on(session.fb_data, "value", function(snap){
			debug("data update");
			
			var uri = snap.val();
			// Is there a value at this session's data location?
			if(uri == null){
				// This is a new session
				// Sync the current data to it
				sync();
			}else{
				previous_uri = uri;
				
				// Cancel any in-progress mouse operations
				$G.triggerHandler("mouseup", "cancel");
				
				// Write the image data to the canvas
				var img = new Image();
				img.onload = function(){
					canvas.width = img.naturalWidth;
					canvas.height = img.naturalHeight;
					
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					ctx.drawImage(img, 0, 0);
					
					$canvas_area.trigger("resize");
				};
				img.src = uri;
				
				// @TODO: playback recorded in-progress mouse operations here
			}
		});
		
		
		// Hook into some events that imply a change might have occured
		
		$canvas.on("user-resized.session-hook", sync);
		
		$(".jspaint-canvas-area").on("mousedown.session-hook", "*", function(){
			// If you're using the fill tool
			if(selected_tool.name.match(/Fill/)){
				// Sync immediately
				sync();
			}else{
				// Sync on mouseup
				$G.one("mouseup.session-hook", sync);
			}
		});
		
		$G.on("session-update.session-hook", function(){
			setTimeout(sync);
		});
		
		// Update the cursor status
		
		$G.on("mousemove.session-hook", function(e){
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
		
		// @FIXME: the cursor can come back from "away" via a mouse event
		// while the window is blurred and stay there when the user goes away
	};
	
	Session.prototype.end = function(){
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
		
		// Reset the file name
		file_name = "untitled";
		update_title();
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
	$G.on("hashchange", function(){
		var match = location.hash.match(/^#?session:(.*)$/i);
		if(match){
			var session_id = match[1];
			// @TODO: URL to create a new session: /#session: and/or /#session:new
			if(session_id === ""){
				debug("session id is empty (not a valid location)");
				end_current_session();
			}else if(session_id.match(/[\.\/\[\]$]/)){
				debug("session id is not a valid location");
				end_current_session();
			}else if(session_id.match(/[\-0-9A-Za-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02af\u1d00-\u1d25\u1d62-\u1d65\u1d6b-\u1d77\u1d79-\u1d9a\u1e00-\u1eff\u2090-\u2094\u2184-\u2184\u2488-\u2490\u271d-\u271d\u2c60-\u2c7c\u2c7e-\u2c7f\ua722-\ua76f\ua771-\ua787\ua78b-\ua78c\ua7fb-\ua7ff\ufb00-\ufb06]+/)){
				if(current_session && current_session.id === session_id){
					debug("hash changed to current session id?");
				}else{
					// @TODO: Ask about saving before starting a new session 
					end_current_session();
					debug("starting a new session, id: "+session_id+"");
					current_session = new Session(session_id);
				}
			}else{
				debug("invalid session id");
				end_current_session();
			}
		}else{
			debug("no session id in hash");
			end_current_session();
		}
	}).triggerHandler("hashchange");
	
	// @TODO: Session GUI
	// @TODO: Show the user when the session id is invalid
	// @TODO: Show the user when the session changes
})();
