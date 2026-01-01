/**
 * MessageBox Dialog Component
 *
 * Windows 98-style message box for confirmations and alerts.
 * Mimics the classic Windows MessageBox API with different button configurations.
 */

import React, { useCallback } from "react";
import { Dialog } from "./Dialog";
import "./MessageBoxDialog.css";

export type MessageBoxButtons = "ok" | "okCancel" | "yesNo" | "yesNoCancel";
export type MessageBoxIcon = "question" | "warning" | "error" | "information" | "none";
export type MessageBoxResult = "ok" | "cancel" | "yes" | "no";

interface MessageBoxDialogProps {
	isOpen: boolean;
	onClose: (result: MessageBoxResult) => void;
	title: string;
	message: string;
	buttons?: MessageBoxButtons;
	icon?: MessageBoxIcon;
	defaultButton?: MessageBoxResult;
}

/**
 * Get the icon symbol for the message box
 */
function getIconSymbol(icon: MessageBoxIcon): string {
	switch (icon) {
		case "question":
			return "?";
		case "warning":
			return "!";
		case "error":
			return "✕";
		case "information":
			return "ℹ";
		case "none":
		default:
			return "";
	}
}

/**
 * Get CSS class for the icon
 */
function getIconClass(icon: MessageBoxIcon): string {
	switch (icon) {
		case "question":
			return "messagebox-icon-question";
		case "warning":
			return "messagebox-icon-warning";
		case "error":
			return "messagebox-icon-error";
		case "information":
			return "messagebox-icon-information";
		case "none":
		default:
			return "";
	}
}

/**
 * Windows 98-style MessageBox Dialog
 *
 * Example usage:
 * ```tsx
 * <MessageBoxDialog
 *   isOpen={showConfirm}
 *   onClose={(result) => {
 *     if (result === "yes") {
 *       // User clicked Yes
 *     }
 *   }}
 *   title="Confirm"
 *   message="Are you sure you want to continue?"
 *   buttons="yesNo"
 *   icon="question"
 * />
 * ```
 */
export function MessageBoxDialog({
	isOpen,
	onClose,
	title,
	message,
	buttons = "ok",
	icon = "none",
	defaultButton,
}: MessageBoxDialogProps) {
	const handleClose = useCallback(
		(result: MessageBoxResult) => {
			onClose(result);
		},
		[onClose],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Escape") {
				// Escape key behavior depends on button configuration
				if (buttons === "okCancel" || buttons === "yesNoCancel") {
					handleClose("cancel");
				} else if (buttons === "yesNo") {
					handleClose("no");
				} else {
					handleClose("ok");
				}
			} else if (e.key === "Enter") {
				// Enter key presses the default button
				if (defaultButton) {
					handleClose(defaultButton);
				} else {
					// Default behavior based on button config
					if (buttons === "yesNo" || buttons === "yesNoCancel") {
						handleClose("yes");
					} else {
						handleClose("ok");
					}
				}
			}
		},
		[buttons, defaultButton, handleClose],
	);

	const iconSymbol = getIconSymbol(icon);
	const iconClass = getIconClass(icon);

	return (
		<Dialog
			isOpen={isOpen}
			onClose={() => handleClose("cancel")}
			title={title}
			width={380}
			height="auto"
			className="messagebox-dialog"
		>
			<div className="messagebox-content" onKeyDown={handleKeyDown}>
				<div className="messagebox-body">
					{iconSymbol && (
						<div className={`messagebox-icon ${iconClass}`} aria-hidden="true">
							{iconSymbol}
						</div>
					)}
					<div className="messagebox-message">{message}</div>
				</div>

				<div className="messagebox-buttons">
					{buttons === "ok" && (
						<button
							className="messagebox-button"
							onClick={() => handleClose("ok")}
							autoFocus={!defaultButton || defaultButton === "ok"}
						>
							OK
						</button>
					)}

					{buttons === "okCancel" && (
						<>
							<button
								className="messagebox-button"
								onClick={() => handleClose("ok")}
								autoFocus={!defaultButton || defaultButton === "ok"}
							>
								OK
							</button>
							<button
								className="messagebox-button"
								onClick={() => handleClose("cancel")}
								autoFocus={defaultButton === "cancel"}
							>
								Cancel
							</button>
						</>
					)}

					{buttons === "yesNo" && (
						<>
							<button
								className="messagebox-button"
								onClick={() => handleClose("yes")}
								autoFocus={!defaultButton || defaultButton === "yes"}
							>
								Yes
							</button>
							<button
								className="messagebox-button"
								onClick={() => handleClose("no")}
								autoFocus={defaultButton === "no"}
							>
								No
							</button>
						</>
					)}

					{buttons === "yesNoCancel" && (
						<>
							<button
								className="messagebox-button"
								onClick={() => handleClose("yes")}
								autoFocus={!defaultButton || defaultButton === "yes"}
							>
								Yes
							</button>
							<button
								className="messagebox-button"
								onClick={() => handleClose("no")}
								autoFocus={defaultButton === "no"}
							>
								No
							</button>
							<button
								className="messagebox-button"
								onClick={() => handleClose("cancel")}
								autoFocus={defaultButton === "cancel"}
							>
								Cancel
							</button>
						</>
					)}
				</div>
			</div>
		</Dialog>
	);
}
