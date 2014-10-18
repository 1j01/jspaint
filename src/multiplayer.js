
(function(){
	
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
		
		var previous_uri;
		session.set_data = function(){
			var uri = canvas.toDataURL();
			if(previous_uri !== uri){
				// console.log("set data");
				session.fb_data.set(uri);
				previous_uri = uri;
			}else{
				// console.log("don't set data, it hasn't changed");
			}
		};
		
		// Any time we recieve the data or the data changes...
		session.fb_data.on("value", session.fb_data_on_value = function(snap){
			// console.log("data changed");
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
				
				//TODO: playback recorded mouse operations here
			}
		});
		
		
		// Hook into some events that imply a change might have occured
		
		var sync = function(){
			session.set_data();
		};
		
		$canvas.on("user-resized.session-hook", sync);
		
		$(".jspaint-canvas-area").on("mousedown.session-hook", "*", function(){
			$(window).one("mouseup", sync);
		});
		
		$G.on("session-update.session-hook", function(){
			setTimeout(sync);
		});
	};
	
	
	Session.prototype.end = function(){
		$("*").off(".session-hook");
		session.fb_data.off("value", session.fb_data_on_value);
		
		file_name = "untitled";
		update_title();
	};
	
	var session;
	var end_session = function(){
		if(session){
			// console.log("ending current session");
			session.end();
			session = null;
		}
	};
	$(window).on("hashchange", function(){
		var match = location.hash.match(/^#?session:([0-9a-f]+)$/i);
		if(match){
			var session_id = match[1];
			if(session && session.id === session_id){
				// console.log("hash changed to current session id?");
			}else{
				// console.log("hash changed, session id: "+session_id);
				end_session();
				session = new Session(session_id);
			}
		}else{
			// console.log("hash changed, no session id");
			end_session();
		}
	}).triggerHandler("hashchange");
	
})();
