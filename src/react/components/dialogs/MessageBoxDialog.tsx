/**
 * MessageBox Dialog Component
 *
 * Windows 98-style message box for confirmations and alerts.
 * Mimics the classic Windows MessageBox API with different button configurations.
 */

import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
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
 * Get the icon image filename for the message box
 * Matches legacy msgbox.js implementation
 * Uses absolute path from root to work from /new/ directory
 */
function getIconImage(icon: MessageBoxIcon): string {
	switch (icon) {
		case "question":
			return "/images/info-32x32-8bpp.png"; // Use info icon for questions
		case "warning":
			return "/images/warning-32x32-8bpp.png";
		case "error":
			return "/images/error-32x32-8bpp.png";
		case "information":
			return "/images/info-32x32-8bpp.png";
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
	const { t } = useTranslation();

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

	const iconImage = getIconImage(icon);

	return (
		<Dialog
			isOpen={isOpen}
			onClose={() => handleClose("cancel")}
			title={title}
			width={400}
			className="dialog-window messagebox-dialog"
		>
			<div className="messagebox-content" onKeyDown={handleKeyDown}>
				<div className="messagebox-body">
					{iconImage && (
						<img
							src={iconImage}
							width={32}
							height={32}
							className="messagebox-icon"
							alt=""
							aria-hidden="true"
						/>
					)}
					<div className="messagebox-message">{message}</div>
				</div>

				<div className="messagebox-buttons">
					{buttons === "ok" && (
						<button
							type="button"
							className={defaultButton === "ok" ? "default" : ""}
							onClick={() => handleClose("ok")}
							autoFocus={!defaultButton || defaultButton === "ok"}
						>
							{t("OK")}
						</button>
					)}

					{buttons === "okCancel" && (
						<>
							<button
								type="button"
								className={defaultButton === "ok" ? "default" : ""}
								onClick={() => handleClose("ok")}
								autoFocus={!defaultButton || defaultButton === "ok"}
							>
								{t("OK")}
							</button>
							<button
								type="button"
								className={defaultButton === "cancel" ? "default" : ""}
								onClick={() => handleClose("cancel")}
								autoFocus={defaultButton === "cancel"}
							>
								{t("Cancel")}
							</button>
						</>
					)}

					{buttons === "yesNo" && (
						<>
							<button
								type="button"
								className={defaultButton === "yes" || !defaultButton ? "default" : ""}
								onClick={() => handleClose("yes")}
								autoFocus={!defaultButton || defaultButton === "yes"}
							>
								{t("Yes")}
							</button>
							<button
								type="button"
								className={defaultButton === "no" ? "default" : ""}
								onClick={() => handleClose("no")}
								autoFocus={defaultButton === "no"}
							>
								{t("No")}
							</button>
						</>
					)}

					{buttons === "yesNoCancel" && (
						<>
							<button
								type="button"
								className={defaultButton === "yes" || !defaultButton ? "default" : ""}
								onClick={() => handleClose("yes")}
								autoFocus={!defaultButton || defaultButton === "yes"}
							>
								{t("Yes")}
							</button>
							<button
								type="button"
								className={defaultButton === "no" ? "default" : ""}
								onClick={() => handleClose("no")}
								autoFocus={defaultButton === "no"}
							>
								{t("No")}
							</button>
							<button
								type="button"
								className={defaultButton === "cancel" ? "default" : ""}
								onClick={() => handleClose("cancel")}
								autoFocus={defaultButton === "cancel"}
							>
								{t("Cancel")}
							</button>
						</>
					)}
				</div>
			</div>
		</Dialog>
	);
}
