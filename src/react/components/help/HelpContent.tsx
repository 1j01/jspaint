/**
 * Content iframe component for the Help window.
 * Displays help pages in an isolated iframe.
 */
import React, { useRef, useEffect, useCallback } from "react";

export interface HelpContentProps {
	/** URL to display */
	src: string;
	/** Base path for help files */
	basePath: string;
	/** Callback when iframe loads */
	onLoad?: (url: string) => void;
	/** Ref to the parent window for focus handling */
	windowRef?: React.RefObject<HTMLDivElement | null>;
}

export function HelpContent({
	src,
	basePath,
	onLoad,
	windowRef,
}: HelpContentProps) {
	const iframeRef = useRef<HTMLIFrameElement>(null);

	// Construct full URL
	const fullSrc = src.startsWith("http") ? src : `${basePath}/${src}`;

	// Handle iframe load event
	const handleLoad = useCallback(() => {
		if (!iframeRef.current) return;

		try {
			const iframe = iframeRef.current;
			const url = iframe.contentWindow?.location.href;
			if (url) {
				onLoad?.(url);
			}

			// Apply theme to iframe content if possible
			if (iframe.contentDocument?.documentElement) {
				const computedStyle = getComputedStyle(document.documentElement);
				const cssVars = [
					"--ButtonFace",
					"--ButtonText",
					"--ButtonHilight",
					"--ButtonShadow",
					"--Window",
					"--WindowText",
				];

				for (const varName of cssVars) {
					const value = computedStyle.getPropertyValue(varName);
					if (value) {
						iframe.contentDocument.documentElement.style.setProperty(
							varName,
							value,
						);
					}
				}
			}
		} catch {
			// Cross-origin iframe - can't access content
			// This is expected for external URLs
		}
	}, [onLoad]);

	// Delegate pointer events from window to iframe
	useEffect(() => {
		const iframe = iframeRef.current;
		if (!iframe) return;

		const handlePointerUp = () => {
			try {
				if (iframe.contentWindow) {
					const event = new MouseEvent("mouseup", {
						button: 0,
					});
					iframe.contentWindow.dispatchEvent(event);
				}
			} catch {
				// Cross-origin - ignore
			}
		};

		window.addEventListener("mouseup", handlePointerUp);
		window.addEventListener("blur", handlePointerUp);

		return () => {
			window.removeEventListener("mouseup", handlePointerUp);
			window.removeEventListener("blur", handlePointerUp);
		};
	}, []);

	// Handle clicks inside iframe to focus the window
	useEffect(() => {
		const iframe = iframeRef.current;
		if (!iframe) return;

		const setupIframeClickHandler = () => {
			try {
				const contentWindow = iframe.contentWindow;
				if (!contentWindow) return;

				const handleClick = () => {
					windowRef?.current?.focus();
				};

				contentWindow.addEventListener("pointerdown", handleClick);
				contentWindow.addEventListener("click", handleClick);
			} catch {
				// Cross-origin - ignore
			}
		};

		// Set up handler on load
		iframe.addEventListener("load", setupIframeClickHandler);

		return () => {
			iframe.removeEventListener("load", setupIframeClickHandler);
		};
	}, [windowRef]);

	return (
		<iframe
			ref={iframeRef}
			className="help-content-iframe inset-deep"
			src={fullSrc}
			onLoad={handleLoad}
			title="Help Content"
			name="help-frame"
			sandbox="allow-same-origin allow-scripts allow-forms allow-pointer-lock allow-modals allow-popups"
		/>
	);
}

export default HelpContent;
