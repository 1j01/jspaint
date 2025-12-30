import { useEffect, useState } from "react";
import { Dialog, DialogButtons } from "./Dialog";

interface StoredImage {
	key: string;
	thumbnail: string;
	timestamp: number;
}

interface ManageStorageDialogProps {
	isOpen: boolean;
	onClose: () => void;
}

/**
 * Simplified Storage Manager dialog
 * Shows locally stored images and allows deletion
 */
export function ManageStorageDialog({ isOpen, onClose }: ManageStorageDialogProps) {
	const [storedImages, setStoredImages] = useState<StoredImage[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (isOpen) {
			loadStoredImages();
		}
	}, [isOpen]);

	const loadStoredImages = () => {
		setLoading(true);
		const images: StoredImage[] = [];

		try {
			// Scan localStorage for image data
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key && key.startsWith("image#")) {
					const data = localStorage.getItem(key);
					if (data) {
						try {
							// Extract thumbnail (first 1000 chars of data URL for preview)
							images.push({
								key,
								thumbnail: data,
								timestamp: Date.now(), // In real version, store this with the image
							});
						} catch (err) {
							console.error(`Failed to load image ${key}:`, err);
						}
					}
				}
			}
			images.sort((a, b) => b.timestamp - a.timestamp);
		} catch (err) {
			console.error("Failed to access localStorage:", err);
		}

		setStoredImages(images);
		setLoading(false);
	};

	const handleRemove = (key: string) => {
		if (confirm(`Remove this image from local storage?`)) {
			try {
				localStorage.removeItem(key);
				setStoredImages(storedImages.filter((img) => img.key !== key));
			} catch (err) {
				alert(`Failed to remove image: ${err}`);
			}
		}
	};

	const handleClearAll = () => {
		if (confirm(`Remove all ${storedImages.length} stored images?`)) {
			try {
				storedImages.forEach((img) => localStorage.removeItem(img.key));
				setStoredImages([]);
			} catch (err) {
				alert(`Failed to clear storage: ${err}`);
			}
		}
	};

	return (
		<Dialog isOpen={isOpen} onClose={onClose} title="Manage Storage">
			<div style={{ maxWidth: "600px", maxHeight: "400px" }}>
				<p>
					<strong>Local Storage:</strong> Images saved locally in your browser. These are separate from files
					you've downloaded with <strong>File &gt; Save</strong>.
				</p>

				{loading && <p>Loading...</p>}

				{!loading && storedImages.length === 0 && (
					<p>
						<em>No stored images found.</em>
					</p>
				)}

				{!loading && storedImages.length > 0 && (
					<div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #ccc", padding: "5px" }}>
						<table style={{ width: "100%", borderCollapse: "collapse" }}>
							<tbody>
								{storedImages.map((img) => (
									<tr key={img.key} style={{ borderBottom: "1px solid #eee" }}>
										<td style={{ padding: "5px", width: "80px" }}>
											<div
												style={{
													width: "64px",
													height: "64px",
													border: "2px inset",
													overflow: "hidden",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
												}}
											>
												<img
													src={img.thumbnail}
													alt="Thumbnail"
													style={{
														maxWidth: "100%",
														maxHeight: "100%",
														imageRendering: "pixelated",
													}}
												/>
											</div>
										</td>
										<td style={{ padding: "5px" }}>
											<div>{img.key.replace("image#", "")}</div>
											<div style={{ fontSize: "0.9em", color: "#666" }}>
												Stored locally
											</div>
										</td>
										<td style={{ padding: "5px", width: "100px", textAlign: "right" }}>
											<button onClick={() => handleRemove(img.key)}>Remove</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				<p style={{ marginTop: "10px", fontSize: "0.9em", color: "#666" }}>
					Total: {storedImages.length} image(s)
				</p>

				<DialogButtons>
					<button onClick={handleClearAll} disabled={storedImages.length === 0}>
						Clear All
					</button>
					<button onClick={onClose}>Close</button>
				</DialogButtons>
			</div>
		</Dialog>
	);
}
