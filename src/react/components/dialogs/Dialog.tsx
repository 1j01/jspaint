/**
 * Base dialog component that provides draggable window functionality.
 * Uses OS-GUI window styling to match the legacy application.
 * Renders as a floating window that can be dragged by the titlebar.
 */
import React, { useEffect, useRef, useCallback, ReactNode } from "react";
import { createPortal } from "react-dom";
import { useDraggable } from "../../hooks/useDraggable";

export interface DialogProps {
	title: string;
	isOpen: boolean;
	onClose: () => void;
	children: ReactNode;
	width?: number;
	height?: number;
	showCloseButton?: boolean;
	/** Optional icon to show in the titlebar */
	icon?: string;
	/** Whether to show a backdrop that dims the background */
	modal?: boolean;
}

export function Dialog({
	title,
	isOpen,
	onClose,
	children,
	width = 300,
	height,
	showCloseButton = true,
	icon,
	modal = false,
}: DialogProps) {
	const previousActiveElement = useRef<Element | null>(null);
	const contentRef = useRef<HTMLDivElement>(null);

	const { position, elementRef, handleProps, isDragging } = useDraggable({
		enabled: true,
	});

	// Handle escape key
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		},
		[onClose],
	);

	// Focus management and event listeners
	useEffect(() => {
		if (isOpen) {
			previousActiveElement.current = document.activeElement;
			// Focus the content area after a short delay to allow render
			requestAnimationFrame(() => {
				contentRef.current?.focus();
			});
			document.addEventListener("keydown", handleKeyDown);
		} else {
			document.removeEventListener("keydown", handleKeyDown);
			if (previousActiveElement.current instanceof HTMLElement) {
				previousActiveElement.current.focus();
			}
		}

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, handleKeyDown]);

	// Handle clicking backdrop to close (only for modal dialogs)
	const handleBackdropClick = useCallback(
		(e: React.MouseEvent) => {
			if (modal && e.target === e.currentTarget) {
				onClose();
			}
		},
		[modal, onClose],
	);

	// Bring window to front when clicked
	const handleWindowClick = useCallback(() => {
		// Could implement z-index management here for multiple windows
	}, []);

	if (!isOpen) {
		return null;
	}

	const windowStyle: React.CSSProperties = {
		position: "fixed",
		width,
		height,
		zIndex: 1000,
		...(position
			? {
					left: position.x,
					top: position.y,
				}
			: {
					// Center before position is calculated
					left: "50%",
					top: "50%",
					transform: "translate(-50%, -50%)",
				}),
	};

	const windowContent = (
		<div
			ref={elementRef}
			className={`window os-window focused dialog ${isDragging ? "dragging" : ""}`}
			style={windowStyle}
			role="dialog"
			aria-modal={modal}
			aria-labelledby="dialog-title"
			onClick={handleWindowClick}
		>
			<div className="window-titlebar" {...handleProps}>
				{icon && <img src={icon} width={16} height={16} draggable={false} alt="" />}
				<div className="window-title-area">
					<span className="window-title" id="dialog-title">
						{title}
					</span>
				</div>
				{showCloseButton && (
					<button
						className="window-close-button window-action-close window-button"
						aria-label="Close"
						onClick={onClose}
					>
						<span className="window-button-icon"></span>
					</button>
				)}
			</div>
			<div className="window-content" ref={contentRef} tabIndex={-1}>
				{children}
			</div>
		</div>
	);

	// Render with or without backdrop
	const dialog = modal ? (
		<div className="dialog-backdrop" onClick={handleBackdropClick}>
			{windowContent}
		</div>
	) : (
		windowContent
	);

	// Use portal to render at document body level
	return createPortal(dialog, document.body);
}

export interface DialogButtonsProps {
	children: ReactNode;
}

export function DialogButtons({ children }: DialogButtonsProps) {
	return <div className="dialog-buttons">{children}</div>;
}

export default Dialog;
