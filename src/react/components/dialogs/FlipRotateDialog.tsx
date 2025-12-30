/**
 * Flip/Rotate dialog for image transformations.
 */
import React, { useState } from "react";
import { Dialog, DialogButtons } from "./Dialog";

export type FlipRotateAction =
	| { type: "flipHorizontal" }
	| { type: "flipVertical" }
	| { type: "rotate"; degrees: number };

export interface FlipRotateDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onApply: (action: FlipRotateAction) => void;
}

export function FlipRotateDialog({ isOpen, onClose, onApply }: FlipRotateDialogProps) {
	const [mode, setMode] = useState<"flip" | "rotate">("flip");
	const [flipDirection, setFlipDirection] = useState<"horizontal" | "vertical">("horizontal");
	const [rotateAngle, setRotateAngle] = useState<90 | 180 | 270>(90);

	const handleOk = () => {
		if (mode === "flip") {
			onApply({ type: flipDirection === "horizontal" ? "flipHorizontal" : "flipVertical" });
		} else {
			onApply({ type: "rotate", degrees: rotateAngle });
		}
		onClose();
	};

	return (
		<Dialog title="Flip and Rotate" isOpen={isOpen} onClose={onClose} width={280}>
			<fieldset>
				<legend>Flip or rotate</legend>
				<div className="radio-group">
					<label>
						<input type="radio" name="mode" checked={mode === "flip"} onChange={() => setMode("flip")} />
						Flip horizontal
					</label>
					<div style={{ marginLeft: 20 }}>
						<label>
							<input
								type="radio"
								name="flipDir"
								checked={flipDirection === "horizontal"}
								onChange={() => {
									setMode("flip");
									setFlipDirection("horizontal");
								}}
								disabled={mode !== "flip"}
							/>
							Horizontally
						</label>
						<label>
							<input
								type="radio"
								name="flipDir"
								checked={flipDirection === "vertical"}
								onChange={() => {
									setMode("flip");
									setFlipDirection("vertical");
								}}
								disabled={mode !== "flip"}
							/>
							Vertically
						</label>
					</div>
				</div>
				<div className="radio-group" style={{ marginTop: 10 }}>
					<label>
						<input
							type="radio"
							name="mode"
							checked={mode === "rotate"}
							onChange={() => setMode("rotate")}
						/>
						Rotate by angle
					</label>
					<div style={{ marginLeft: 20 }}>
						<label>
							<input
								type="radio"
								name="angle"
								checked={rotateAngle === 90}
								onChange={() => {
									setMode("rotate");
									setRotateAngle(90);
								}}
								disabled={mode !== "rotate"}
							/>
							90°
						</label>
						<label>
							<input
								type="radio"
								name="angle"
								checked={rotateAngle === 180}
								onChange={() => {
									setMode("rotate");
									setRotateAngle(180);
								}}
								disabled={mode !== "rotate"}
							/>
							180°
						</label>
						<label>
							<input
								type="radio"
								name="angle"
								checked={rotateAngle === 270}
								onChange={() => {
									setMode("rotate");
									setRotateAngle(270);
								}}
								disabled={mode !== "rotate"}
							/>
							270°
						</label>
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

export default FlipRotateDialog;
