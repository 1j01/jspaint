/**
 * Custom Zoom dialog for setting magnification level.
 */
import React, { useState } from "react";
import { Dialog, DialogButtons } from "./Dialog";

export interface CustomZoomDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onApply: (magnification: number) => void;
	currentMagnification: number;
}

export function CustomZoomDialog({ isOpen, onClose, onApply, currentMagnification }: CustomZoomDialogProps) {
	const [selectedZoom, setSelectedZoom] = useState(currentMagnification * 100);
	const [customZoom, setCustomZoom] = useState(currentMagnification * 100);
	const [useCustom, setUseCustom] = useState(false);

	const presetZooms = [100, 200, 400, 600, 800];

	const handleOk = () => {
		const zoomValue = useCustom ? customZoom : selectedZoom;
		onApply(zoomValue / 100);
		onClose();
	};

	return (
		<Dialog title="Custom Zoom" isOpen={isOpen} onClose={onClose} width={250}>
			<fieldset>
				<legend>Zoom to</legend>
				<div className="zoom-options">
					{presetZooms.map((zoom) => (
						<label key={zoom}>
							<input
								type="radio"
								name="zoom"
								checked={!useCustom && selectedZoom === zoom}
								onChange={() => {
									setSelectedZoom(zoom);
									setUseCustom(false);
								}}
							/>
							{zoom}%
						</label>
					))}
					<div className="custom-zoom-row">
						<label>
							<input type="radio" name="zoom" checked={useCustom} onChange={() => setUseCustom(true)} />
							Custom:
						</label>
						<input
							type="number"
							value={customZoom}
							onChange={(e) => {
								setCustomZoom(parseInt(e.target.value) || 100);
								setUseCustom(true);
							}}
							min={1}
							max={8000}
							style={{ width: 60 }}
						/>
						%
					</div>
				</div>
			</fieldset>
			<DialogButtons>
				<button onClick={handleOk}>OK</button>
				<button onClick={onClose}>Cancel</button>
			</DialogButtons>
		</Dialog>
	);
}

export default CustomZoomDialog;
