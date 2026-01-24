/**
 * Stretch/Skew dialog for image transformations.
 * Windows 98 Paint style dialog with transform icons.
 */
import React, { useState } from "react";
import { Dialog, DialogButtons } from "./Dialog";

export interface StretchSkewValues {
	stretchHorizontal: number;
	stretchVertical: number;
	skewHorizontal: number;
	skewVertical: number;
}

export interface StretchSkewDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onApply: (values: StretchSkewValues) => void;
}

/**
 * Row component for stretch/skew inputs with icon
 */
interface TransformRowProps {
	iconSrc: string;
	label: string;
	value: number;
	onChange: (value: number) => void;
	unit: string;
	min: number;
	max: number;
	defaultValue: number;
}

function TransformRow({ iconSrc, label, value, onChange, unit, min, max, defaultValue }: TransformRowProps) {
	return (
		<tr>
			<td>
				<img
					src={iconSrc}
					width={32}
					height={32}
					alt=""
					style={{ marginRight: "20px" }}
				/>
			</td>
			<td>
				<label>{label}</label>
			</td>
			<td>
				<input
					type="number"
					className="no-spinner inset-deep"
					value={value}
					onChange={(e) => onChange(parseInt(e.target.value) || defaultValue)}
					min={min}
					max={max}
					style={{ width: "40px" }}
				/>
			</td>
			<td>{unit}</td>
		</tr>
	);
}

export function StretchSkewDialog({ isOpen, onClose, onApply }: StretchSkewDialogProps) {
	const [stretchHorizontal, setStretchHorizontal] = useState(100);
	const [stretchVertical, setStretchVertical] = useState(100);
	const [skewHorizontal, setSkewHorizontal] = useState(0);
	const [skewVertical, setSkewVertical] = useState(0);

	const handleOk = () => {
		onApply({
			stretchHorizontal,
			stretchVertical,
			skewHorizontal,
			skewVertical,
		});
		onClose();
	};

	return (
		<Dialog title="Stretch and Skew" isOpen={isOpen} onClose={onClose} className="dialog-window stretch-and-skew">
			<form className="dialog-form">
				<div>
					<fieldset>
						<legend>Stretch</legend>
						<table>
							<tbody>
								<TransformRow
									iconSrc="/images/transforms/stretch-x.png"
									label="Horizontal:"
									value={stretchHorizontal}
									onChange={setStretchHorizontal}
									unit="%"
									min={1}
									max={5000}
									defaultValue={100}
								/>
								<TransformRow
									iconSrc="/images/transforms/stretch-y.png"
									label="Vertical:"
									value={stretchVertical}
									onChange={setStretchVertical}
									unit="%"
									min={1}
									max={5000}
									defaultValue={100}
								/>
							</tbody>
						</table>
					</fieldset>
					<fieldset>
						<legend>Skew</legend>
						<table>
							<tbody>
								<TransformRow
									iconSrc="/images/transforms/skew-x.png"
									label="Horizontal:"
									value={skewHorizontal}
									onChange={setSkewHorizontal}
									unit="Degrees"
									min={-90}
									max={90}
									defaultValue={0}
								/>
								<TransformRow
									iconSrc="/images/transforms/skew-y.png"
									label="Vertical:"
									value={skewVertical}
									onChange={setSkewVertical}
									unit="Degrees"
									min={-90}
									max={90}
									defaultValue={0}
								/>
							</tbody>
						</table>
					</fieldset>
				</div>
				<DialogButtons>
					<button type="button" onClick={handleOk}>OK</button>
					<button type="button" onClick={onClose}>Cancel</button>
				</DialogButtons>
			</form>
		</Dialog>
	);
}

export default StretchSkewDialog;
