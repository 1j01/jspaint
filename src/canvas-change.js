
(function(){
	
	var may_be_changed = function(){
		window.console && console.log("change may have occured");
		$canvas.triggerHandler("change");
	};
	
	var debug = (...args)=> {
		window.console && console.debug && console.debug(...args);
	};
	var debug_event = function(e, synthetic){
		// var label = synthetic ? "(synthetic)" : "(normal)";
		// debug(e.type, label);
	};
	
	// Hook into some events that imply a change might have occured
	
	$canvas.on("user-resized.ugly-hook", may_be_changed);
	
	$canvas_area.on("pointerdown.ugly-hook", "*", function(e, synthetic){
		debug_event(e, synthetic);
		if(synthetic){ return; }
		
		// If you're using the fill tool, basically
		var immediate_action = selected_tools.some((tool)=>
			tool.pointerdown && !tool.pointermove && !tool.paint && !tool.cancel && !tool.passive
		)
		// selection tools, eyedropper, magnifier
		var purely_passive = selected_tools.every((tool)=>
			tool.passive === true // can be a function (for polygon tool) but here we want only always passive tools
		);
		if(immediate_action){
			// A change might occur immediately
			may_be_changed();
		}else{
			// Changes may occur when you release
			pointer_operations = [];
			if (!purely_passive) {
				pointer_operations.push(e);
				var pointermove = function(e, synthetic){
					debug_event(e, synthetic);
					if(synthetic){ return; }
					
					pointer_operations.push(e);
				};
				$G.on("pointermove.ugly-hook", pointermove);
			}
			$G.one("pointerup.ugly-hook", function(e, synthetic){
				debug_event(e, synthetic);
				if(synthetic){ return; }

				debug(`clear ${pointer_operations.length} events of user gesture`);
				pointer_operations = [];
				
				$G.off("pointermove.ugly-hook", pointermove);
				
				may_be_changed();
			});
		}
	});

	$G.on("session-update.ugly-hook", function(){
		setTimeout(may_be_changed);
	});

}());
