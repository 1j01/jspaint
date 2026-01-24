import { Dialog, DialogButtons } from "./Dialog";

interface HistoryDialogProps {
	isOpen: boolean;
	onClose: () => void;
	undoStack: ImageData[];
	redoStack: ImageData[];
	onGoToState: (index: number, isRedo: boolean) => void;
}

/**
 * Simplified History dialog
 * Shows undo/redo stack as a linear timeline
 */
export function HistoryDialog({
	isOpen,
	onClose,
	undoStack,
	redoStack,
	onGoToState,
}: HistoryDialogProps) {
	// Current state is between undo and redo stacks
	const currentIndex = undoStack.length;
	const totalStates = undoStack.length + 1 + redoStack.length;

	const handleJumpToState = (index: number) => {
		if (index < currentIndex) {
			// Jump backwards (undo)
			const stepsBack = currentIndex - index;
			for (let i = 0; i < stepsBack; i++) {
				onGoToState(undoStack.length - 1 - i, false);
			}
		} else if (index > currentIndex) {
			// Jump forwards (redo)
			const stepsForward = index - currentIndex;
			for (let i = 0; i < stepsForward; i++) {
				onGoToState(redoStack.length - 1 - i, true);
			}
		}
		onClose();
	};

	const renderStatePreview = (imageData: ImageData, index: number, isCurrent: boolean) => {
		// Create a thumbnail canvas
		const canvas = document.createElement("canvas");
		const maxSize = 64;
		const scale = Math.min(maxSize / imageData.width, maxSize / imageData.height, 1);
		canvas.width = Math.floor(imageData.width * scale);
		canvas.height = Math.floor(imageData.height * scale);
		const ctx = canvas.getContext("2d");
		if (ctx) {
			// Create temporary canvas with original data
			const tempCanvas = document.createElement("canvas");
			tempCanvas.width = imageData.width;
			tempCanvas.height = imageData.height;
			const tempCtx = tempCanvas.getContext("2d");
			if (tempCtx) {
				tempCtx.putImageData(imageData, 0, 0);
				ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
			}
		}
		const dataUrl = canvas.toDataURL();

		return (
			<div
				key={index}
				className={`history-state-preview ${isCurrent ? "current" : ""}`}
				onClick={() => !isCurrent && handleJumpToState(index)}
			>
				<div className="history-state-thumbnail inset-deep">
					<img
						src={dataUrl}
						alt={`State ${index}`}
						className="history-state-image"
					/>
				</div>
				<div className="history-state-info">
					<div className="history-state-name">
						{isCurrent ? "Current State" : `State ${index}`}
					</div>
					<div className="history-state-dimensions">
						{imageData.width} × {imageData.height}
					</div>
				</div>
			</div>
		);
	};

	return (
		<Dialog isOpen={isOpen} onClose={onClose} title="Document History" className="dialog-window history-linear-window">
			<div className="history-linear-content">
				<p className="history-linear-status">
					Click on a state to jump to that point in history. Current state: <strong>{currentIndex}</strong> of{" "}
					<strong>{totalStates - 1}</strong>
				</p>

				<div className="history-linear-list inset-deep">
					{totalStates === 1 ? (
						<p className="history-linear-empty">
							<em>No history available. Make some changes to see them here!</em>
						</p>
					) : (
						<>
							{/* Undo stack (past states) */}
							{undoStack.map((imageData, i) => renderStatePreview(imageData, i, false))}

							{/* Current state */}
							{undoStack.length > 0 &&
								renderStatePreview(undoStack[undoStack.length - 1], currentIndex, true)}

							{/* Redo stack (future states) */}
							{redoStack
								.slice()
								.reverse()
								.map((imageData, i) =>
									renderStatePreview(imageData, currentIndex + 1 + i, false),
								)}
						</>
					)}
				</div>

				<p className="history-linear-note">
					<strong>Note:</strong> This is a simplified linear history view. The full version supports branching
					history trees.
				</p>

				<DialogButtons>
					<button type="button" onClick={onClose}>Close</button>
				</DialogButtons>
			</div>
		</Dialog>
	);
}
