/**
 * Load From URL dialog for loading images from the web.
 */
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogButtons } from "./Dialog";

export interface LoadFromUrlDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onLoad: (url: string) => void;
}

export function LoadFromUrlDialog({ isOpen, onClose, onLoad }: LoadFromUrlDialogProps) {
	const { t } = useTranslation();
	const [url, setUrl] = useState("");
	const [error, setError] = useState<string | null>(null);

	const handleOk = () => {
		if (!url.trim()) {
			setError(t("Please enter a URL."));
			return;
		}

		// Basic URL validation
		try {
			new URL(url);
		} catch {
			setError(t("Please enter a valid URL."));
			return;
		}

		setError(null);
		onLoad(url);
		onClose();
	};

	const handleClose = () => {
		setUrl("");
		setError(null);
		onClose();
	};

	return (
		<Dialog title={t("Load From URL")} isOpen={isOpen} onClose={handleClose} width={400} className="dialog-window load-from-url-window">
			<form className="dialog-form">
				<div className="input-group">
					<label htmlFor="url-input">{t("Enter the URL of the image to load:")}</label>
					<input
						id="url-input"
						type="url"
						className="inset-deep"
						value={url}
						onChange={(e) => {
							setUrl(e.target.value);
							setError(null);
						}}
						placeholder="https://example.com/image.png"
						autoFocus
					/>
					{error && (
						<div className="error-message">
							{error}
						</div>
					)}
				</div>
				<DialogButtons>
					<button type="button" onClick={handleOk}>{t("OK")}</button>
					<button type="button" onClick={handleClose}>{t("Cancel")}</button>
				</DialogButtons>
			</form>
		</Dialog>
	);
}

export default LoadFromUrlDialog;
