/**
 * DialogManager - Centralized dialog rendering component
 * Manages all application dialogs in a single location to reduce App.tsx complexity.
 * Handles dialog visibility, props passing, and callback routing.
 */

import type { RefObject } from "react";
import { AboutDialog } from "./dialogs/AboutDialog";
import { AttributesDialog } from "./dialogs/AttributesDialog";
import { CustomZoomDialog } from "./dialogs/CustomZoomDialog";
import { EditColorsDialog } from "./dialogs/EditColorsDialog";
import { FlipRotateDialog } from "./dialogs/FlipRotateDialog";
import { HistoryTreeDialog } from "./dialogs/HistoryTreeDialog";
import { ImgurUploadDialog } from "./dialogs/ImgurUploadDialog";
import { LoadFromUrlDialog } from "./dialogs/LoadFromUrlDialog";
import { ManageStorageDialog } from "./dialogs/ManageStorageDialog";
import { SaveAsDialog } from "./dialogs/SaveAsDialog";
import { StretchSkewDialog } from "./dialogs/StretchSkewDialog";
import type { AttributesValues } from "./dialogs/AttributesDialog";
import type { FlipRotateAction } from "./dialogs/FlipRotateDialog";
import type { StretchSkewValues } from "./dialogs/StretchSkewDialog";
import { FontBoxWindow } from "./FontBoxWindow";
import { HelpWindow } from "./help/HelpWindow";
import { ThumbnailWindow } from "./ThumbnailWindow";
import type { DialogName } from "../context/state/uiStore";
import type { HistoryNode } from "../context/state/historyStore";
import type { Selection, TextBoxState } from "../context/state/types";

/**
 * Props for DialogManager component
 */
interface DialogManagerProps {
	/** Dialog visibility states (record of dialog name to boolean) */
	dialogs: Record<DialogName, boolean>;
	/** Callback to close a dialog by name */
	closeDialog: (name: DialogName) => void;

	/** Callback when Flip/Rotate dialog submits */
	handleFlipRotate: (action: FlipRotateAction) => void;
	/** Callback when Stretch/Skew dialog submits */
	handleStretchSkew: (values: StretchSkewValues) => void;
	/** Callback when Attributes dialog submits */
	handleAttributes: (values: AttributesValues) => void;
	/** Callback when Load From URL dialog submits */
	handleLoadFromUrl: (url: string) => void;
	/** Callback when Save As dialog submits */
	handleSaveAs: (filename: string, formatId: string) => void;
	/** Callback when color is selected/edited */
	handleColorSelect: (color: string, customColors: string[]) => void;
	/** Callback when history tree node is navigated to */
	handleHistoryNavigate: (nodeId: string) => void;

	/** Current canvas width in pixels */
	canvasWidth: number;
	/** Current canvas height in pixels */
	canvasHeight: number;
	/** Current magnification level (1 = 100%, 2 = 200%, etc.) */
	magnification: number;
	/** Callback to set magnification */
	setMagnification: (mag: number) => void;
	/** Primary/foreground color */
	primaryColor: string;
	/** Custom colors array for Edit Colors dialog */
	customColors: string[];
	/** Root node of history tree */
	rootNode: HistoryNode | null;
	/** Current node in history tree */
	currentNode: HistoryNode | null;
	/** Reference to main canvas element */
	canvasRef: RefObject<HTMLCanvasElement>;

	/** Whether font box window is visible (for text tool) */
	showFontBox: boolean;
	/** Callback to toggle text toolbar */
	toggleTextToolbar: () => void;
	/** Font state for text tool */
	fontState: {
		family: string;
		size: number;
		bold: boolean;
		italic: boolean;
		underline: boolean;
		vertical: boolean;
	};
	/** Callback when font state changes */
	handleFontChange: (fontState: {
		family: string;
		size: number;
		bold: boolean;
		italic: boolean;
		underline: boolean;
		vertical: boolean;
	}) => void;
	/** Current text box state (null if no text box active) */
	textBox: TextBoxState | null;

	/** Whether thumbnail window is visible */
	showThumbnail: boolean;
	/** Callback to toggle thumbnail window */
	toggleThumbnail: () => void;
}

/**
 * DialogManager component - Central dialog orchestrator
 * Renders all application dialogs based on visibility state.
 * Extracted from App.tsx to improve code organization and reduce complexity.
 *
 * Manages:
 * - Image transformation dialogs (Flip/Rotate, Stretch/Skew, Attributes)
 * - File operation dialogs (Load From URL, Save As)
 * - Color editor dialog
 * - History dialogs (linear and tree-based)
 * - Special windows (Help, FontBox, Thumbnail, Imgur Upload, Manage Storage)
 * - About dialog
 *
 * All dialogs are conditionally rendered based on the `dialogs` record.
 * Callbacks are passed through to parent (App.tsx) for state mutations.
 *
 * @param {DialogManagerProps} props - Component props
 * @returns {JSX.Element} Collection of dialog components (only visible ones render)
 *
 * @example
 * <DialogManager
 *   dialogs={{ about: true, flipRotate: false, ... }}
 *   closeDialog={(name) => setDialogOpen(name, false)}
 *   handleFlipRotate={(action) => applyFlipRotate(action)}
 *   {...otherProps}
 * />
 */
export function DialogManager(props: DialogManagerProps) {
	const {
		dialogs,
		closeDialog,
		handleFlipRotate,
		handleStretchSkew,
		handleAttributes,
		handleLoadFromUrl,
		handleSaveAs,
		handleColorSelect,
		handleHistoryNavigate,
		canvasWidth,
		canvasHeight,
		magnification,
		setMagnification,
		primaryColor,
		customColors,
		rootNode,
		currentNode,
		canvasRef,
		showFontBox,
		toggleTextToolbar,
		fontState,
		handleFontChange,
		textBox,
		showThumbnail,
		toggleThumbnail,
	} = props;

	return (
		<>
			{/* Main Dialogs */}
			<AboutDialog isOpen={dialogs.about} onClose={() => closeDialog("about")} />
			<FlipRotateDialog
				isOpen={dialogs.flipRotate}
				onClose={() => closeDialog("flipRotate")}
				onApply={handleFlipRotate}
			/>
			<StretchSkewDialog
				isOpen={dialogs.stretchSkew}
				onClose={() => closeDialog("stretchSkew")}
				onApply={handleStretchSkew}
			/>
			<AttributesDialog
				isOpen={dialogs.attributes}
				onClose={() => closeDialog("attributes")}
				onApply={handleAttributes}
				currentWidth={canvasWidth}
				currentHeight={canvasHeight}
			/>
			<CustomZoomDialog
				isOpen={dialogs.customZoom}
				onClose={() => closeDialog("customZoom")}
				onApply={setMagnification}
				currentMagnification={magnification}
			/>
			<LoadFromUrlDialog
				isOpen={dialogs.loadFromUrl}
				onClose={() => closeDialog("loadFromUrl")}
				onLoad={handleLoadFromUrl}
			/>
			<SaveAsDialog
				isOpen={dialogs.saveAs}
				onClose={() => closeDialog("saveAs")}
				onSave={handleSaveAs}
				currentFilename="untitled.png"
			/>
			<EditColorsDialog
				isOpen={dialogs.editColors}
				onClose={() => closeDialog("editColors")}
				initialColor={primaryColor}
				customColors={customColors}
				onColorSelect={handleColorSelect}
			/>
			<HelpWindow isOpen={dialogs.helpTopics} onClose={() => closeDialog("helpTopics")} />
			<ImgurUploadDialog
				isOpen={dialogs.imgurUpload}
				onClose={() => closeDialog("imgurUpload")}
				onUpload={() => {}}
				imageDataUrl={canvasRef.current?.toDataURL("image/png") || ""}
			/>
			<ManageStorageDialog
				isOpen={dialogs.manageStorage}
				onClose={() => closeDialog("manageStorage")}
			/>
			<HistoryTreeDialog
				isOpen={dialogs.history}
				onClose={() => closeDialog("history")}
				rootNode={rootNode}
				currentNode={currentNode}
				onNavigateToNode={handleHistoryNavigate}
			/>

			{/* Floating Font Box Window for Text Tool */}
			<FontBoxWindow
				isOpen={showFontBox}
				onClose={toggleTextToolbar}
				fontState={fontState}
				onFontChange={handleFontChange}
				textBoxRect={textBox}
				magnification={magnification}
			/>

			{/* Thumbnail Window */}
			<ThumbnailWindow visible={showThumbnail} onClose={toggleThumbnail} canvasRef={canvasRef} />
		</>
	);
}
