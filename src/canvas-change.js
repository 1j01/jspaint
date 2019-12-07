
(() => {
	
	const may_be_changed = () => {
		window.console && console.log("change may have occured");
		$canvas.triggerHandler("change");
	};
	
	const debug_event = (e, synthetic) => {
		// const label = synthetic ? "(synthetic)" : "(normal)";
		// window.console && console.debug && console.debug(e.type, label);
	};
	
	// Hook into some events that imply a change might have occured
	
	$canvas_area.on("user-resized.ugly-hook", may_be_changed);
	
	$canvas_area.on("pointerdown.ugly-hook", "*", (e, synthetic) => {
		debug_event(e, synthetic);
		if(synthetic){ return; }
		
		const immediate_action = selected_tools.some((tool)=> tool.name === "Fill");
		if(immediate_action){
			// A change might occur immediately
			may_be_changed();
		}else{
			// Changes may occur when you release
			pointer_operations = [e];
			const pointermove = (e, synthetic) => {
				debug_event(e, synthetic);
				if(synthetic){ return; }
				
				pointer_operations.push(e);
			};
			$G.on("pointermove.ugly-hook", pointermove);
			$G.one("pointerup.ugly-hook", (e, synthetic) => {
				debug_event(e, synthetic);
				if(synthetic){ return; }
				
				$G.off("pointermove.ugly-hook", pointermove);
				
				may_be_changed();
			});
		}
	});

	$G.on("session-update.ugly-hook", () => {
		setTimeout(may_be_changed);
	});

})();
