
(function(){
	
	var match = location.hash.match(/^#?session:([0-9a-f]+)$/i);
	if(match){
		var session_id = match[1];
		
		file_name = "[Loading "+session_id+"]";
		update_title();
		
		$.getScript("lib/firebase.js", function(){
			
			file_name = "["+session_id+"]";
			update_title();
		
			var fb_root = new Firebase("https://jspaint.firebaseio.com/");
			var fb_session = fb_root.child(session_id);
			var fb_data = fb_session.child("data");
			
			var previous_uri;
			var set_data = function(){
				var uri = canvas.toDataURL();
				if(previous_uri !== uri){
					//console.log("set data");
					fb_data.set(uri);
					previous_uri = uri;
				}else{
					//console.log("don't set data, it hasn't changed");
				}
			};
			
			// Hook into some functions and events that imply a change might have occured
			var toafc = this_ones_a_frame_changer;
			this_ones_a_frame_changer = function(){
				toafc();
				setTimeout(set_data);
			};
			var spd = Selection.prototype.destroy;
			Selection.prototype.destroy = function(){
				spd.apply(this, arguments);
				setTimeout(set_data);
			};
			$(".jspaint-canvas-area").on("mousedown", "*", function(){
				$(window).one("mouseup", set_data);
			});
			$canvas.on("user-resized", set_data);
			
			// Any time we recieve the data or the data changes...
			fb_data.on("value", function(snap){
				//console.log("data changed");
				var uri = snap.val();
				if(uri == null){
					set_data();
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
			
		});
	}
	
})();
