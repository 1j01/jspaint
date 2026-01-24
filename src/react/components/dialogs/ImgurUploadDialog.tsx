import { useState } from "react";
import { Dialog, DialogButtons } from "./Dialog";

interface ImgurUploadDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onUpload: () => void;
	imageDataUrl: string;
}

/**
 * Simplified Imgur upload dialog
 * Shows a preview and upload button
 */
export function ImgurUploadDialog({ isOpen, onClose, imageDataUrl }: ImgurUploadDialogProps) {
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleUpload = async () => {
		setUploading(true);
		setError(null);
		setUploadProgress(0);

		try {
			// Convert data URL to blob
			const response = await fetch(imageDataUrl);
			const blob = await response.blob();

			// Simulate upload progress (in real implementation, use XMLHttpRequest for progress)
			const progressInterval = setInterval(() => {
				setUploadProgress((prev) => Math.min(prev + 10, 90));
			}, 100);

			// Upload to Imgur
			// Note: You'll need to get a Client ID from https://api.imgur.com/oauth2/addclient
			// For now, this is a placeholder that shows the UI flow
			const formData = new FormData();
			formData.append("image", blob);

			// This would be the actual upload:
			// const uploadResponse = await fetch("https://api.imgur.com/3/image", {
			// 	method: "POST",
			// 	headers: {
			// 		Authorization: "Client-ID YOUR_CLIENT_ID_HERE",
			// 	},
			// 	body: formData,
			// });

			clearInterval(progressInterval);
			setUploadProgress(100);

			// For now, show a message that Imgur upload needs configuration
			setError(
				"Imgur upload requires API configuration. Please set up an Imgur Client ID to enable uploads.",
			);

			// In a real implementation:
			// const result = await uploadResponse.json();
			// if (result.success) {
			// 	setUploadedUrl(result.data.link);
			// } else {
			// 	setError(result.data.error || "Upload failed");
			// }
		} catch (err) {
			setError(err instanceof Error ? err.message : "Upload failed");
		} finally {
			setUploading(false);
		}
	};

	const handleClose = () => {
		setUploading(false);
		setUploadProgress(0);
		setUploadedUrl(null);
		setError(null);
		onClose();
	};

	return (
		<Dialog isOpen={isOpen} onClose={handleClose} title="Upload to Imgur" className="dialog-window imgur-upload-window">
			<div className="imgur-upload-content">
				{!uploading && !uploadedUrl && imageDataUrl && (
					<>
						<div className="imgur-preview-container inset-deep">
							<img
								src={imageDataUrl}
								alt="Preview"
								className="imgur-preview-image"
							/>
						</div>
						<p>Click Upload to share your image on Imgur.</p>
					</>
				)}

				{uploading && (
					<div className="imgur-uploading">
						<p>Uploading...</p>
						<div className="imgur-progress-container inset-deep">
							<div
								className="imgur-progress-bar"
								style={{ width: `${uploadProgress}%` }}
							/>
						</div>
						<p>{uploadProgress}%</p>
					</div>
				)}

				{uploadedUrl && (
					<div className="imgur-success">
						<p>Upload successful!</p>
						<p>
							Image URL:{" "}
							<a href={uploadedUrl} target="_blank" rel="noopener noreferrer">
								{uploadedUrl}
							</a>
						</p>
						<button
							type="button"
							onClick={() => {
								navigator.clipboard.writeText(uploadedUrl);
								alert("URL copied to clipboard!");
							}}
						>
							Copy URL
						</button>
					</div>
				)}

				{error && (
					<div className="imgur-error error-message">
						<p>Error: {error}</p>
					</div>
				)}

				<DialogButtons>
					{uploadedUrl ? (
						<button type="button" onClick={handleClose}>Close</button>
					) : uploading ? null : (
						<>
							<button type="button" onClick={handleUpload}>Upload</button>
							<button type="button" onClick={handleClose}>Cancel</button>
						</>
					)}
				</DialogButtons>
			</div>
		</Dialog>
	);
}
