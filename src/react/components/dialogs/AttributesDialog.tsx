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
			<div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
				<div style={{ display: "flex", justifyContent: "space-between" }}>
					<span>File last saved:</span>
					<span>Not Available</span>
				</div>
				<div style={{ display: "flex", justifyContent: "space-between" }}>
					<span>Size on disk:</span>
					<span>Not Available</span>
				</div>
				<div style={{ display: "flex", justifyContent: "space-between" }}>
					<span>Resolution:</span>
					<span>72 x 72 dots per inch</span>
				</div>

				<fieldset style={{ marginTop: "6px" }}>
					<legend>Image</legend>
					<div style={{ display: "flex", gap: "12px" }}>
						<div>
							<label htmlFor="width-input">Width:</label>
							<input
								id="width-input"
								type="number"
								value={width}
								onChange={(e) => setWidth(parseInt(e.target.value) || 1)}
								min={1}
								max={9999}
								style={{ width: "70px", marginLeft: "4px" }}
							/>
						</div>
						<div>
							<label htmlFor="height-input">Height:</label>
							<input
								id="height-input"
								type="number"
								value={height}
								onChange={(e) => setHeight(parseInt(e.target.value) || 1)}
								min={1}
								max={9999}
								style={{ width: "70px", marginLeft: "4px" }}
							/>
						</div>
					</div>
				</fieldset>

				<fieldset style={{ marginTop: "6px" }}>
					<legend>Units</legend>
					<div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
						<div>
							<input
								type="radio"
								id="units-inches"
								name="units"
								checked={units === "inches"}
								onChange={() => setUnits("inches")}
							/>
							<label htmlFor="units-inches">Inches</label>
						</div>
						<div>
							<input
								type="radio"
								id="units-cm"
								name="units"
								checked={units === "cm"}
								onChange={() => setUnits("cm")}
							/>
							<label htmlFor="units-cm">Cm</label>
						</div>
						<div>
							<input
								type="radio"
								id="units-pixels"
								name="units"
								checked={units === "pixels"}
								onChange={() => setUnits("pixels")}
							/>
							<label htmlFor="units-pixels">Pixels</label>
						</div>
					</div>
				</fieldset>

				<fieldset style={{ marginTop: "6px" }}>
					<legend>Colors</legend>
					<div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
						<div>
							<input
								type="radio"
								id="color-bw"
								name="colorMode"
								checked={colorMode === "blackAndWhite"}
								onChange={() => setColorMode("blackAndWhite")}
							/>
							<label htmlFor="color-bw">Black and white</label>
						</div>
						<div>
							<input
								type="radio"
								id="color-color"
								name="colorMode"
								checked={colorMode === "color"}
								onChange={() => setColorMode("color")}
							/>
							<label htmlFor="color-color">Colors</label>
						</div>
					</div>
				</fieldset>

				<fieldset style={{ marginTop: "6px" }}>
					<legend>Transparency</legend>
					<div>
						<input
							type="checkbox"
							id="transparent-checkbox"
							checked={transparent}
							onChange={(e) => setTransparent(e.target.checked)}
						/>
						<label htmlFor="transparent-checkbox">Use transparency</label>
					</div>
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
