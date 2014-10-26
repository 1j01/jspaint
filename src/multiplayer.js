
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
		// color components
		hue: ~~(Math.random() * 360),
		saturation: ~~(Math.random() * 50) + 50,
		lightness: ~~(Math.random() * 40) + 50,
	};
	
	// the main cursor color
	user.color = "hsla(" + user.hue + ", " + user.saturation + "%, " + user.lightness + "%, 1)";
	// not used
	user.color_transparent = "hsla(" + user.hue + ", " + user.saturation + "%, " + user.lightness + "%, 0.5)";
	// (@TODO) the color used in the toolbar indicating to other users it is selected by this user
	user.color_desaturated = "hsla(" + user.hue + ", " + ~~(user.saturation*0.4) + "%, " + user.lightness + "%, 0.8)";
	
	
	
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
		
		session.fb = Session.fb_root.child(session.id);
		session.fb_data = session.fb.child("data");
		session.fb_users = session.fb.child("users");
		if(user_id){
			session.fb_user = session.fb_users.child(user_id);
		}else{
			session.fb_user = session.fb_users.push();
			user_id = session.fb_user.name();
		}
		session.fb_user.onDisconnect().remove();
		session.fb_user.set(user);
		
		_fb_on(session.fb_users, "child_added", function(snap){
			
			// Is this you?
			if(snap.name() === user_id){
				// You already have a cursor.
				return;
			}
			
			// Get the Firebase reference for this user
			var fb_other_user = snap.ref();
			
			// The user of the cursor we'll be drawing
			var other_user = snap.val();
			
			// Draw the cursor
			var cursor_canvas = new Canvas(32, 32);
			var cursor_ctx = cursor_canvas.ctx;
			var img = new Image();
			img.onload = function(){
				cursor_ctx.fillStyle = other_user.color;
				cursor_ctx.fillRect(0, 0, cursor_canvas.width, cursor_canvas.height);
				cursor_ctx.globalCompositeOperation = "darker";
				cursor_ctx.drawImage(img, 0, 0);
				cursor_ctx.globalCompositeOperation = "destination-atop";
				cursor_ctx.drawImage(img, 0, 0);
			};
			img.src = "images/cursors/default.png";
			// @TODO: display other cursor types?
			// @TODO: display mouse button state?
			
			// Make the $cursor element
			var $cursor = $(cursor_canvas).addClass("user-cursor").appendTo($app);
			$cursor.css({
				display: "none",
				position: "absolute",
				zIndex: 500, // arbitrary; maybe too high
				pointerEvents: "none",
				transition: "opacity 0.5s",
			});
			
			// When the cursor data changes
			_fb_on(fb_other_user, "value", function(snap){
				other_user = snap.val();
				// If the user has left
				if(other_user == null){
					// Remove the $cursor
					$cursor.remove();
				}else{
					// Update the $cursor
					var canvas_rect = canvas.getBoundingClientRect();
					$cursor.css({
						display: "block",
						position: "absolute",
						left: canvas_rect.left + other_user.cursor.x,
						top: canvas_rect.top + other_user.cursor.y,
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
		
		// Any time we recieve the image data or the data changes...
		_fb_on(session.fb_data, "value", function(snap){
			debug("data update");
			
			var uri = snap.val();
			if(uri == null){
				sync();
			}else{
				previous_uri = uri;
				
				$G.triggerHandler("mouseup", "cancel");
				
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
			$G.one("mouseup.session-hook", sync);
		});
		
		$G.on("session-update.session-hook", function(){
			setTimeout(sync);
		});
		
		// Update the cursor status
		
		$G.on("mousemove.session-hook", function(e){
			var canvas_rect = canvas.getBoundingClientRect();
			session.fb_user.child("cursor").update({
				x: e.clientX - canvas_rect.left,
				y: e.clientY - canvas_rect.top,
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
		
		// Remove any $cursors
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
		var match = location.hash.match(/^#?session:([0-9a-f]+)$/i);
		if(match){
			var session_id = match[1];
			if(current_session && current_session.id === session_id){
				debug("hash changed to current session id?");
			}else{
				debug("hash changed, session id: "+session_id);
				end_current_session();
				debug("starting a new session");
				current_session = new Session(session_id);
			}
		}else{
			debug("hash changed, no session id");
			end_current_session();
		}
	}).triggerHandler("hashchange");
	
	// @TODO: Session GUI
	// @TODO: /#session:new to create a new session
})();
