
(function(){
	
	var debug = function(text){
		if(console){
			console.log(text);
		}
	};
	
	
	
	// @TODO: persist user id and color with localStorage
	
	var user_id;
	
	var user = {
		// Cursor status
		cursor: {
			// cursor position in canvas coordinates
			x: 0, y: 0,
			// whether the user is elsewhere, for example in another tab
			away: true,
		},
		// Currently selected tool (@TODO)
		tool: "Pencil",
		// color components
		hue: ~~(Math.random() * 360),
		saturation: ~~(Math.random() * 50) + 50,
		lightness: ~~(Math.random() * 50) + 50,
	};
	
	// the main cursor color
	user.color = "hsla(" + user.hue + ", " + user.saturation + "%, " + user.lightness + "%, 1)";
	// not used
	user.color_transparent = "hsla(" + user.hue + ", " + user.saturation + "%, " + user.lightness + "%, 0.5)";
	// the color used in the toolbar indicating to other users it is selected by this user
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
		
		session.fb_users.on("child_added", session.fb_users_on_child_added = function(snap){
			
			// Is this you?
			if(snap.name() === user_id){
				// You already have a cursor.
				return;
			}
			
			// The user of the cursor we'll be drawing
			var other_user = snap.val();
			
			// Draw the cursor
			var cursor_canvas = E("canvas");
			cursor_canvas.width = 32;
			cursor_canvas.height = 32;
			var cursor_ctx = cursor_canvas.getContext("2d");
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
			
			// Make the $cursor element
			var $cursor = $(cursor_canvas).addClass("user-cursor").appendTo($app);
			$cursor.css({
				display: "none",
				position: "absolute",
				zIndex: 500,
				pointerEvents: "none",
				transition: "opacity 0.5s",
			});
			
			// @FIXME: This listener leaks and wreaks
			snap.ref().on("value", function(snap){
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
		session.set_data = function(){
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
		session.fb_data.on("value", session.fb_data_on_value = function(snap){
			debug("data changed");
			
			var uri = snap.val();
			if(uri == null){
				session.set_data();
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
		
		var sync = function(){
			session.set_data();
		};
		
		$canvas.on("user-resized.session-hook", sync);
		
		$(".jspaint-canvas-area").on("mousedown.session-hook", "*", function(){
			$G.one("mouseup", sync);
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
		
		$G.on("blur", function(e){
			session.fb_user.child("cursor").update({
				away: true,
			});
		});
		
		// @FIXME: the cursor can come back from "away" via a mouse event
		// while the window is blurred and stay there when the user goes away
	};
	
	Session.prototype.end = function(){
		$("*").off(".session-hook");
		$(window).off(".session-hook");
		session.fb_data.off("value", session.fb_data_on_value);
		session.fb_users.off("child_added", session.fb_users_on_child_added);
		session.fb_user.remove();
		$app.find(".user-cursor").remove();
		
		file_name = "untitled";
		update_title();
	};
	
	var session;
	var end_session = function(){
		if(session){
			debug("ending current session");
			session.end();
			session = null;
		}
	};
	$(window).on("hashchange", function(){
		var match = location.hash.match(/^#?session:([0-9a-f]+)$/i);
		if(match){
			var session_id = match[1];
			if(session && session.id === session_id){
				debug("hash changed to current session id?");
			}else{
				debug("hash changed, session id: "+session_id);
				end_session();
				debug("starting a new session");
				session = new Session(session_id);
			}
		}else{
			debug("hash changed, no session id");
			end_session();
		}
	}).triggerHandler("hashchange");
	
	// @TODO: Session GUI
	// @TODO: /#session:new to create a new session
})();
