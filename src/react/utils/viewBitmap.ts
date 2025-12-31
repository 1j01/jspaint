/**
 * View Bitmap functionality
 * Displays the canvas in fullscreen mode, matching the legacy MS Paint behavior.
 * Exit with any key press, mouse click, or by exiting fullscreen.
 */

let cleanupBitmapView = () => {};

/**
 * Display the canvas in fullscreen mode with proper exit handling
 * @param canvas The canvas element to display
 */
export function viewBitmap(canvas: HTMLCanvasElement): void {
	// Cleanup any existing bitmap view
	cleanupBitmapView();

	// Create fullscreen overlay
	const bitmapViewDiv = document.createElement("div");
	bitmapViewDiv.classList.add("bitmap-view", "inset-deep");
	document.body.appendChild(bitmapViewDiv);

	// Style the overlay
	Object.assign(bitmapViewDiv.style, {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		position: "fixed",
		top: "0",
		left: "0",
		width: "100%",
		height: "100%",
		zIndex: "9999",
		background: "var(--Background)",
	});

	// Request fullscreen with vendor prefix support
	if (bitmapViewDiv.requestFullscreen) {
		bitmapViewDiv.requestFullscreen().catch((err) => {
			// console.warn("Fullscreen request failed:", err);
		});
	} else if ((bitmapViewDiv as any).webkitRequestFullscreen) {
		(bitmapViewDiv as any).webkitRequestFullscreen();
	}

	let blobUrl: string | undefined;
	let gotFullscreen = false;

	// Poll for fullscreen state changes (Chrome workaround)
	// In Chrome, if the page is already fullscreen, and you requestFullscreen,
	// hitting Esc will change document.fullscreenElement without triggering the fullscreenchange event!
	const pollInterval = setInterval(() => {
		const isFullscreen =
			document.fullscreenElement === bitmapViewDiv ||
			(document as any).webkitFullscreenElement === bitmapViewDiv;

		if (isFullscreen) {
			gotFullscreen = true;
		} else if (gotFullscreen) {
			cleanup();
		}
	}, 100);

	// Cleanup function
	const cleanup = () => {
		document.removeEventListener("fullscreenchange", onFullscreenChange);
		document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
		document.removeEventListener("keydown", onKeyDown);
		document.removeEventListener("mousedown", onMouseDown);

		// Delay context menu removal to cancel the context menu if right-clicking to exit
		setTimeout(() => {
			document.removeEventListener("contextmenu", onContextMenu);
		}, 100);

		// Revoke blob URL
		if (blobUrl) {
			URL.revokeObjectURL(blobUrl);
		}

		clearInterval(pollInterval);

		// Exit fullscreen if still in it
		const isFullscreen =
			document.fullscreenElement === bitmapViewDiv ||
			(document as any).webkitFullscreenElement === bitmapViewDiv;

		if (isFullscreen) {
			if (document.exitFullscreen) {
				document.exitFullscreen().catch(() => {}); // Avoid warning in Firefox
			} else if ((document as any).webkitExitFullscreen) {
				(document as any).webkitExitFullscreen();
			}
		}

		// Remove the overlay
		bitmapViewDiv.remove();

		// Reset cleanup function
		cleanupBitmapView = () => {};
	};

	// Set the cleanup function so it can be called externally
	cleanupBitmapView = cleanup;

	// Event handlers
	function onFullscreenChange() {
		const isFullscreen =
			document.fullscreenElement === bitmapViewDiv ||
			(document as any).webkitFullscreenElement === bitmapViewDiv;

		if (!isFullscreen) {
			cleanup();
		}
	}

	let repeatingF = false;

	function onKeyDown(event: KeyboardEvent) {
		// Handle Ctrl+F double-tap to prevent re-opening
		repeatingF = repeatingF || (event.repeat && (event.key === "f" || event.key === "F"));
		if (event.repeat) {
			return;
		}
		if (repeatingF && (event.key === "f" || event.key === "F")) {
			repeatingF = false;
			return; // Chrome sends an F keydown with repeat=false if you release Ctrl before F
		}

		// Prevent toggling View Bitmap on while toggling off with Ctrl+F+F
		event.preventDefault();

		// Note: in mspaint, Esc is the only key that DOESN'T close the bitmap view,
		// but it also doesn't do anything else. We'll exit on any key for simplicity.
		cleanup();
	}

	function onMouseDown(_event: MouseEvent) {
		// Note: in mspaint, only left click exits View Bitmap mode.
		// Right click can show a useless context menu.
		// We exit on any click for simplicity.
		cleanup();
	}

	function onContextMenu(event: Event) {
		event.preventDefault();
		cleanup();
	}

	// Add event listeners
	document.addEventListener("fullscreenchange", onFullscreenChange, { once: true });
	document.addEventListener("webkitfullscreenchange", onFullscreenChange, { once: true });
	document.addEventListener("keydown", onKeyDown);
	document.addEventListener("mousedown", onMouseDown);
	document.addEventListener("contextmenu", onContextMenu);

	// Convert canvas to blob and display
	// @TODO: include selection in the bitmap (like the legacy implementation mentions)
	canvas.toBlob((blob) => {
		if (!blob) {
			// console.error("Failed to create blob from canvas");
			cleanup();
			return;
		}

		blobUrl = URL.createObjectURL(blob);
		const img = document.createElement("img");
		img.src = blobUrl;
		img.style.imageRendering = "pixelated"; // Preserve pixel art look
		bitmapViewDiv.appendChild(img);
	}, "image/png");
}
