
(function(){
	
	var may_be_changed = function(){
		window.console && console.log("change may have occured");
		$canvas.triggerHandler("change");
	};
	
	var debug_event = function(e, synthetic){
		// var label = synthetic ? "(synthetic)" : "(normal)";
		// window.console && console.debug && console.debug(e.type, label);
	};
	
	// Hook into some events that imply a change might have occured
	
	$canvas.on("user-resized.ugly-hook", may_be_changed);
	
	$canvas_area.on("pointerdown.ugly-hook", "*", function(e, synthetic){
		debug_event(e, synthetic);
		if(synthetic){ return; }
		
		// If you're using the fill tool
		if(selected_tool.name.match(/Fill/)){
			// A change might occur immediately
			may_be_changed();
		}else{
			// Changes may occur when you release
			pointer_operations = [e];
			var pointermove = function(e, synthetic){
				debug_event(e, synthetic);
				if(synthetic){ return; }
				
				pointer_operations.push(e);
			};
			$G.on("pointermove.ugly-hook", pointermove);
			$G.one("pointerup.ugly-hook", function(e, synthetic){
				debug_event(e, synthetic);
				if(synthetic){ return; }
				
				$G.off("pointermove.ugly-hook", pointermove);
				
				may_be_changed();
			});
		}
	});

	$G.on("session-update.ugly-hook", function(){
		setTimeout(may_be_changed);
	});

}());
