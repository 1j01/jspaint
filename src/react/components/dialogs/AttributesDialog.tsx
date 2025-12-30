/**
 * Attributes dialog for changing canvas/image properties.
 */
import React, { useState, useEffect } from "react";
import { Dialog, DialogButtons } from "./Dialog";

export interface AttributesValues {
	width: number;
	height: number;
	units: "pixels" | "inches" | "cm";
	colorMode: "color" | "blackAndWhite";
	transparent: boolean;
}

export interface AttributesDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onApply: (values: AttributesValues) => void;
	currentWidth: number;
	currentHeight: number;
}

export function AttributesDialog({ isOpen, onClose, onApply, currentWidth, currentHeight }: AttributesDialogProps) {
	const [width, setWidth] = useState(currentWidth);
	const [height, setHeight] = useState(currentHeight);
	const [units, setUnits] = useState<"pixels" | "inches" | "cm">("pixels");
	const [colorMode, setColorMode] = useState<"color" | "blackAndWhite">("color");
	const [transparent, setTransparent] = useState(false);

	// Update dimensions when dialog opens with new values
	useEffect(() => {
		if (isOpen) {
			setWidth(currentWidth);
			setHeight(currentHeight);
		}
	}, [isOpen, currentWidth, currentHeight]);

	const handleOk = () => {
		onApply({
			width,
			height,
			units,
			colorMode,
			transparent,
		});
		onClose();
	};

	const handleDefault = () => {
		setWidth(640);
		setHeight(480);
		setUnits("pixels");
		setColorMode("color");
		setTransparent(false);
	};

	return (
		<Dialog title="Attributes" isOpen={isOpen} onClose={onClose} width={380}>
			<div className="attributes-content">
				<div className="attributes-row">
					<span className="attributes-label">File last saved:</span>
					<span>Not Available</span>
				</div>
				<div className="attributes-row">
					<span className="attributes-label">Size on disk:</span>
					<span>Not Available</span>
				</div>
				<div className="attributes-row">
					<span className="attributes-label">Resolution:</span>
					<span>72 x 72 dots per inch</span>
				</div>

				<fieldset style={{ marginTop: 10 }}>
					<div className="attributes-dimensions">
						<div>
							<label>Width:</label>
							<input
								type="number"
								value={width}
								onChange={(e) => setWidth(parseInt(e.target.value) || 1)}
								min={1}
								max={9999}
								style={{ width: 70 }}
							/>
						</div>
						<div>
							<label>Height:</label>
							<input
								type="number"
								value={height}
								onChange={(e) => setHeight(parseInt(e.target.value) || 1)}
								min={1}
								max={9999}
								style={{ width: 70 }}
							/>
						</div>
					</div>
				</fieldset>

				<fieldset style={{ marginTop: 10 }}>
					<legend>Units</legend>
					<label>
						<input
							type="radio"
							name="units"
							checked={units === "inches"}
							onChange={() => setUnits("inches")}
						/>
						Inches
					</label>
					<label>
						<input type="radio" name="units" checked={units === "cm"} onChange={() => setUnits("cm")} />
						Cm
					</label>
					<label>
						<input
							type="radio"
							name="units"
							checked={units === "pixels"}
							onChange={() => setUnits("pixels")}
						/>
						Pixels
					</label>
				</fieldset>

				<fieldset style={{ marginTop: 10 }}>
					<legend>Colors</legend>
					<label>
						<input
							type="radio"
							name="colorMode"
							checked={colorMode === "blackAndWhite"}
							onChange={() => setColorMode("blackAndWhite")}
						/>
						Black and white
					</label>
					<label>
						<input
							type="radio"
							name="colorMode"
							checked={colorMode === "color"}
							onChange={() => setColorMode("color")}
						/>
						Colors
					</label>
				</fieldset>

				<fieldset style={{ marginTop: 10 }}>
					<legend>Transparency</legend>
					<label>
						<input
							type="checkbox"
							checked={transparent}
							onChange={(e) => setTransparent(e.target.checked)}
						/>
						Use transparency
					</label>
				</fieldset>
			</div>
			<DialogButtons>
				<button onClick={handleOk}>OK</button>
				<button onClick={onClose}>Cancel</button>
				<button onClick={handleDefault}>Default</button>
			</DialogButtons>
		</Dialog>
	);
}

export default AttributesDialog;
