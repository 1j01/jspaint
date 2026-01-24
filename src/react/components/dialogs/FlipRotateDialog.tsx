/**
 * Flip/Rotate dialog for image transformations.
 * Windows 98 style with proper fieldset and radio button layout.
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
		<Dialog title="Flip and Rotate" isOpen={isOpen} onClose={onClose} width={280} className="dialog-window flip-and-rotate">
			<form className="dialog-form">
				<fieldset>
					<legend>Flip or rotate</legend>
					<div className="fieldset-body">
						<div className="radio-row">
							<input
								type="radio"
								id="flip-mode"
								name="mode"
								checked={mode === "flip"}
								onChange={() => setMode("flip")}
							/>
							<label htmlFor="flip-mode">Flip horizontal</label>
						</div>
						<div className="radio-group-nested">
							<div className="radio-row">
								<input
									type="radio"
									id="flip-horizontal"
									name="flipDir"
									checked={flipDirection === "horizontal"}
									onChange={() => {
										setMode("flip");
										setFlipDirection("horizontal");
									}}
									disabled={mode !== "flip"}
								/>
								<label htmlFor="flip-horizontal">Horizontally</label>
							</div>
							<div className="radio-row">
								<input
									type="radio"
									id="flip-vertical"
									name="flipDir"
									checked={flipDirection === "vertical"}
									onChange={() => {
										setMode("flip");
										setFlipDirection("vertical");
									}}
									disabled={mode !== "flip"}
								/>
								<label htmlFor="flip-vertical">Vertically</label>
							</div>
						</div>

						<div className="radio-row">
							<input
								type="radio"
								id="rotate-mode"
								name="mode"
								checked={mode === "rotate"}
								onChange={() => setMode("rotate")}
							/>
							<label htmlFor="rotate-mode">Rotate by angle</label>
						</div>
						<div className="radio-group-nested">
							<div className="radio-row">
								<input
									type="radio"
									id="rotate-90"
									name="angle"
									checked={rotateAngle === 90}
									onChange={() => {
										setMode("rotate");
										setRotateAngle(90);
									}}
									disabled={mode !== "rotate"}
								/>
								<label htmlFor="rotate-90">90°</label>
							</div>
							<div className="radio-row">
								<input
									type="radio"
									id="rotate-180"
									name="angle"
									checked={rotateAngle === 180}
									onChange={() => {
										setMode("rotate");
										setRotateAngle(180);
									}}
									disabled={mode !== "rotate"}
								/>
								<label htmlFor="rotate-180">180°</label>
							</div>
							<div className="radio-row">
								<input
									type="radio"
									id="rotate-270"
									name="angle"
									checked={rotateAngle === 270}
									onChange={() => {
										setMode("rotate");
										setRotateAngle(270);
									}}
									disabled={mode !== "rotate"}
								/>
								<label htmlFor="rotate-270">270°</label>
							</div>
						</div>
					</div>
				</fieldset>
				<DialogButtons>
					<button type="button" onClick={handleOk}>OK</button>
					<button type="button" onClick={onClose}>Cancel</button>
				</DialogButtons>
			</form>
		</Dialog>
	);
}

export default FlipRotateDialog;
