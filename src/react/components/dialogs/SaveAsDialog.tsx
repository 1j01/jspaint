import { useCallback, useState } from "react";
import { IMAGE_FORMATS, getFileExtension, getFormatByExtension } from "../../utils/imageFormats";
import { Dialog, DialogButtons } from "./Dialog";

interface SaveAsDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (filename: string, formatId: string) => void;
	currentFilename?: string;
}

/**
 * Save As dialog for saving canvas to various image formats
 */
export function SaveAsDialog({
	isOpen,
	onClose,
	onSave,
	currentFilename = "untitled.png",
}: SaveAsDialogProps) {
	// Extract base name and current format from filename
	const getBaseNameAndFormat = (filename: string) => {
		const ext = getFileExtension(filename);
		const format = getFormatByExtension(ext);
		const baseName = filename.replace(/\.[^.]+$/, "");
		return { baseName, formatId: format?.formatID || "png" };
	};

	const { baseName: initialBaseName, formatId: initialFormat } = getBaseNameAndFormat(currentFilename);

	const [baseName, setBaseName] = useState(initialBaseName);
	const [selectedFormat, setSelectedFormat] = useState(initialFormat);

	// Get the full filename with extension
	const getFullFilename = useCallback(() => {
		const format = IMAGE_FORMATS.find((f) => f.formatID === selectedFormat);
		const extension = format?.extensions[0] || "png";
		return `${baseName}.${extension}`;
	}, [baseName, selectedFormat]);

	const handleSave = useCallback(() => {
		if (!baseName.trim()) return;
		onSave(getFullFilename(), selectedFormat);
		onClose();
	}, [baseName, selectedFormat, getFullFilename, onSave, onClose]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter") {
				handleSave();
			} else if (e.key === "Escape") {
				onClose();
			}
		},
		[handleSave, onClose],
	);

	return (
		<Dialog
			title="Save As"
			isOpen={isOpen}
			onClose={onClose}
			width={400}
		>
			<div className="save-as-dialog" style={{ padding: "8px" }}>
				<div style={{ marginBottom: "12px" }}>
					<label style={{ display: "block", marginBottom: "4px" }}>File name:</label>
					<input
						type="text"
						value={baseName}
						onChange={(e) => setBaseName(e.target.value)}
						onKeyDown={handleKeyDown}
						autoFocus
						style={{
							width: "100%",
							padding: "4px",
							boxSizing: "border-box",
						}}
					/>
				</div>

				<div style={{ marginBottom: "12px" }}>
					<label style={{ display: "block", marginBottom: "4px" }}>Save as type:</label>
					<select
						value={selectedFormat}
						onChange={(e) => setSelectedFormat(e.target.value)}
						style={{
							width: "100%",
							padding: "4px",
							boxSizing: "border-box",
						}}
					>
						{IMAGE_FORMATS.map((format) => (
							<option key={format.formatID} value={format.formatID}>
								{format.name} (*.{format.extensions[0]})
							</option>
						))}
					</select>
				</div>

				<div style={{ fontSize: "12px", color: "#666", marginBottom: "12px" }}>
					Full filename: <strong>{getFullFilename()}</strong>
				</div>

				<DialogButtons>
					<button onClick={handleSave} disabled={!baseName.trim()}>
						Save
					</button>
					<button onClick={onClose}>Cancel</button>
				</DialogButtons>
			</div>
		</Dialog>
	);
}

export default SaveAsDialog;
