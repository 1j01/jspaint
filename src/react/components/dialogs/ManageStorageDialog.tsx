import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
	const { t } = useTranslation();
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
					let data = localStorage.getItem(key);
					if (data) {
						try {
							// In legacy storage, values are JSON.stringify()'d; decode quoted strings.
							if (data[0] === '"') {
								const parsed = JSON.parse(data);
								if (typeof parsed === "string") {
									data = parsed;
								}
							}
							// Only keep entries that look like data URLs to avoid broken previews.
							if (!/^data:image\//i.test(data)) {
								continue;
							}

							images.push({
								key,
								thumbnail: data,
								timestamp: Date.now(), // In real version, store this with the image
							});
						} catch (err) {
							// console.error(`Failed to load image ${key}:`, err);
						}
					}
				}
			}
			images.sort((a, b) => b.timestamp - a.timestamp);
		} catch (err) {
			// console.error("Failed to access localStorage:", err);
		}

		setStoredImages(images);
		setLoading(false);
	};

	const handleRemove = (key: string) => {
		if (confirm(t("Remove this image from local storage?"))) {
			try {
				localStorage.removeItem(key);
				setStoredImages(storedImages.filter((img) => img.key !== key));
			} catch (err) {
				alert(t("Failed to remove image:") + ` ${err}`);
			}
		}
	};

	const handleClearAll = () => {
		if (confirm(t("Remove all {{count}} stored images?", { count: storedImages.length }))) {
			try {
				storedImages.forEach((img) => localStorage.removeItem(img.key));
				setStoredImages([]);
			} catch (err) {
				alert(t("Failed to clear storage:") + ` ${err}`);
			}
		}
	};

	return (
		<Dialog isOpen={isOpen} onClose={onClose} title={t("Manage Storage")} className="dialog-window manage-storage-window">
			<div className="manage-storage-content">
				<p className="manage-storage-description">
					<strong>{t("Local Storage:")}</strong> {t("Images saved locally in your browser. These are separate from files you've downloaded with")} <strong>{t("File > Save")}</strong>.
				</p>

				{loading && <p className="manage-storage-loading">{t("Loading...")}</p>}

				{!loading && storedImages.length === 0 && (
					<p className="manage-storage-empty">
						<em>{t("No stored images found.")}</em>
					</p>
				)}

				{!loading && storedImages.length > 0 && (
					<div className="manage-storage-list inset-deep">
						<table className="manage-storage-table">
							<tbody>
								{storedImages.map((img) => (
									<tr key={img.key} className="manage-storage-row">
										<td className="manage-storage-thumbnail-cell">
											<div className="manage-storage-thumbnail inset-deep">
												<img
													src={img.thumbnail}
													alt={t("Thumbnail")}
													className="manage-storage-image"
												/>
											</div>
										</td>
										<td className="manage-storage-info-cell">
											<div className="manage-storage-name">{img.key.replace("image#", "")}</div>
											<div className="manage-storage-meta">
												{t("Stored locally")}
											</div>
										</td>
										<td className="manage-storage-action-cell">
											<button type="button" onClick={() => handleRemove(img.key)}>{t("Remove")}</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				<p className="manage-storage-total">
					{t("Total:")} {storedImages.length} {t("image(s)")}
				</p>

				<DialogButtons>
					<button type="button" onClick={handleClearAll} disabled={storedImages.length === 0}>
						{t("Clear All")}
					</button>
					<button type="button" onClick={onClose}>{t("Close")}</button>
				</DialogButtons>
			</div>
		</Dialog>
	);
}
