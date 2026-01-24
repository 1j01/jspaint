/**
 * Attributes dialog for changing canvas/image properties.
 * Windows 98 Paint style dialog.
 */
import React, { useState, useEffect } from "react";
import { Dialog, DialogButtons } from "./Dialog";
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from "../../constants/canvas";

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
		setWidth(DEFAULT_CANVAS_WIDTH);
		setHeight(DEFAULT_CANVAS_HEIGHT);
		setUnits("pixels");
		setColorMode("color");
		setTransparent(false);
	};

	return (
		<Dialog title="Attributes" isOpen={isOpen} onClose={onClose} className="dialog-window attributes-window">
			<form className="dialog-form">
				<div>
					{/* File info table */}
					<table>
						<tbody>
							<tr>
								<td>File last saved:</td>
								<td>Not Available</td>
							</tr>
							<tr>
								<td>Size on disk:</td>
								<td>Not Available</td>
							</tr>
							<tr>
								<td>Resolution:</td>
								<td style={{ direction: "ltr" }}>72 x 72 dots per inch</td>
							</tr>
						</tbody>
					</table>

					{/* Width and Height inputs - directly in labels, not in fieldsets */}
					<label>
						Width:
						<input
							type="number"
							className="no-spinner inset-deep"
							value={width}
							onChange={(e) => setWidth(parseInt(e.target.value) || 1)}
							min={1}
							max={9999}
							style={{ width: "40px" }}
						/>
					</label>
					<label>
						Height:
						<input
							type="number"
							className="no-spinner inset-deep"
							value={height}
							onChange={(e) => setHeight(parseInt(e.target.value) || 1)}
							min={1}
							max={9999}
							style={{ width: "40px" }}
						/>
					</label>

					<fieldset>
						<legend>Units</legend>
						<div className="fieldset-body">
							<div className="radio-field">
								<input
									type="radio"
									id="unit-in"
									name="units"
									checked={units === "inches"}
									onChange={() => setUnits("inches")}
								/>
								<label htmlFor="unit-in">Inches</label>
							</div>
							<div className="radio-field">
								<input
									type="radio"
									id="unit-cm"
									name="units"
									checked={units === "cm"}
									onChange={() => setUnits("cm")}
								/>
								<label htmlFor="unit-cm">Cm</label>
							</div>
							<div className="radio-field">
								<input
									type="radio"
									id="unit-px"
									name="units"
									checked={units === "pixels"}
									onChange={() => setUnits("pixels")}
								/>
								<label htmlFor="unit-px">Pixels</label>
							</div>
						</div>
					</fieldset>

					<fieldset>
						<legend>Colors</legend>
						<div className="fieldset-body">
							<div className="radio-field">
								<input
									type="radio"
									id="attribute-monochrome"
									name="colors"
									checked={colorMode === "blackAndWhite"}
									onChange={() => setColorMode("blackAndWhite")}
								/>
								<label htmlFor="attribute-monochrome">Black and white</label>
							</div>
							<div className="radio-field">
								<input
									type="radio"
									id="attribute-polychrome"
									name="colors"
									checked={colorMode === "color"}
									onChange={() => setColorMode("color")}
								/>
								<label htmlFor="attribute-polychrome">Colors</label>
							</div>
						</div>
					</fieldset>

					<fieldset>
						<legend>Transparency</legend>
						<div className="fieldset-body">
							<div className="radio-field">
								<input
									type="radio"
									id="attribute-transparent"
									name="transparency"
									checked={transparent === true}
									onChange={() => setTransparent(true)}
								/>
								<label htmlFor="attribute-transparent">Transparent</label>
							</div>
							<div className="radio-field">
								<input
									type="radio"
									id="attribute-opaque"
									name="transparency"
									checked={transparent === false}
									onChange={() => setTransparent(false)}
								/>
								<label htmlFor="attribute-opaque">Opaque</label>
							</div>
						</div>
					</fieldset>
				</div>

				<DialogButtons>
					<button type="button" onClick={handleOk}>OK</button>
					<button type="button" onClick={onClose}>Cancel</button>
					<button type="button" onClick={handleDefault}>Default</button>
				</DialogButtons>
			</form>
		</Dialog>
	);
}

export default AttributesDialog;
