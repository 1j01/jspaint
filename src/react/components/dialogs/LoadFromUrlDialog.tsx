/**
 * Load From URL dialog for loading images from the web.
 */
import React, { useState } from "react";
import { Dialog, DialogButtons } from "./Dialog";

export interface LoadFromUrlDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onLoad: (url: string) => void;
}

export function LoadFromUrlDialog({ isOpen, onClose, onLoad }: LoadFromUrlDialogProps) {
	const [url, setUrl] = useState("");
	const [error, setError] = useState<string | null>(null);

	const handleOk = () => {
		if (!url.trim()) {
			setError("Please enter a URL.");
			return;
		}

		// Basic URL validation
		try {
			new URL(url);
		} catch {
			setError("Please enter a valid URL.");
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
		<Dialog title="Load From URL" isOpen={isOpen} onClose={handleClose} width={400}>
			<div className="load-url-content">
				<label htmlFor="url-input">Enter the URL of the image to load:</label>
				<input
					id="url-input"
					type="url"
					value={url}
					onChange={(e) => {
						setUrl(e.target.value);
						setError(null);
					}}
					placeholder="https://example.com/image.png"
					style={{ width: "100%", marginTop: 8 }}
					autoFocus
				/>
				{error && (
					<div className="error-message" style={{ color: "red", marginTop: 4 }}>
						{error}
					</div>
				)}
			</div>
			<DialogButtons>
				<button onClick={handleOk}>OK</button>
				<button onClick={handleClose}>Cancel</button>
			</DialogButtons>
		</Dialog>
	);
}

export default LoadFromUrlDialog;
