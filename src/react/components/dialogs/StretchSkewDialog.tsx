/**
 * Stretch/Skew dialog for image transformations.
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
		<Dialog title="Stretch and Skew" isOpen={isOpen} onClose={onClose} width={320} className="dialog-window stretch-skew-window">
			<form className="dialog-form">
				<fieldset>
					<legend>Stretch</legend>
					<table className="dialog-table">
						<tbody>
							<tr>
								<td>Horizontal:</td>
								<td>
									<input
										type="number"
										className="inset-deep"
										value={stretchHorizontal}
										onChange={(e) => setStretchHorizontal(parseInt(e.target.value) || 100)}
										min={1}
										max={500}
									/>
									%
								</td>
							</tr>
							<tr>
								<td>Vertical:</td>
								<td>
									<input
										type="number"
										className="inset-deep"
										value={stretchVertical}
										onChange={(e) => setStretchVertical(parseInt(e.target.value) || 100)}
										min={1}
										max={500}
									/>
									%
								</td>
							</tr>
						</tbody>
					</table>
				</fieldset>
				<fieldset>
					<legend>Skew</legend>
					<table className="dialog-table">
						<tbody>
							<tr>
								<td>Horizontal:</td>
								<td>
									<input
										type="number"
										className="inset-deep"
										value={skewHorizontal}
										onChange={(e) => setSkewHorizontal(parseInt(e.target.value) || 0)}
										min={-89}
										max={89}
									/>
									Degrees
								</td>
							</tr>
							<tr>
								<td>Vertical:</td>
								<td>
									<input
										type="number"
										className="inset-deep"
										value={skewVertical}
										onChange={(e) => setSkewVertical(parseInt(e.target.value) || 0)}
										min={-89}
										max={89}
									/>
									Degrees
								</td>
							</tr>
						</tbody>
					</table>
				</fieldset>
				<DialogButtons>
					<button type="button" onClick={handleOk}>OK</button>
					<button type="button" onClick={onClose}>Cancel</button>
				</DialogButtons>
			</form>
		</Dialog>
	);
}

export default StretchSkewDialog;
