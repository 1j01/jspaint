/**
 * DialogManager - Centralized dialog rendering component
 * Extracted from App.tsx to reduce complexity
 */

import type { RefObject } from "react";
import {
	AboutDialog,
	AttributesDialog,
	CustomZoomDialog,
	EditColorsDialog,
	FlipRotateDialog,
	HistoryTreeDialog,
	ImgurUploadDialog,
	LoadFromUrlDialog,
	ManageStorageDialog,
	SaveAsDialog,
	StretchSkewDialog,
} from "./dialogs";
import type { AttributesValues } from "./dialogs/AttributesDialog";
import type { FlipRotateAction } from "./dialogs/FlipRotateDialog";
import type { StretchSkewValues } from "./dialogs/StretchSkewDialog";
import { FontBoxWindow } from "./FontBoxWindow";
import { HelpWindow } from "./help";
import { ThumbnailWindow } from "./ThumbnailWindow";
import type { DialogName } from "../context/state";
import type { HistoryNode } from "../context/state/historyStore";
import type { Selection, TextBoxState } from "../context/state";

interface DialogManagerProps {
	// Dialog visibility
	dialogs: Record<DialogName, boolean>;
	closeDialog: (name: DialogName) => void;

	// Dialog handlers
	handleFlipRotate: (action: FlipRotateAction) => void;
	handleStretchSkew: (values: StretchSkewValues) => void;
	handleAttributes: (values: AttributesValues) => void;
	handleLoadFromUrl: (url: string) => void;
	handleSaveAs: (filename: string, formatId: string) => void;
	handleColorSelect: (color: string, customColors: string[]) => void;
	handleHistoryNavigate: (nodeId: string) => void;

	// State for dialogs
	canvasWidth: number;
	canvasHeight: number;
	magnification: number;
	setMagnification: (mag: number) => void;
	primaryColor: string;
	customColors: string[];
	rootNode: HistoryNode | null;
	currentNode: HistoryNode | null;
	canvasRef: RefObject<HTMLCanvasElement>;

	// Font Box Window
	showFontBox: boolean;
	toggleTextToolbar: () => void;
	fontState: {
		family: string;
		size: number;
		bold: boolean;
		italic: boolean;
		underline: boolean;
		vertical: boolean;
	};
	handleFontChange: (fontState: {
		family: string;
		size: number;
		bold: boolean;
		italic: boolean;
		underline: boolean;
		vertical: boolean;
	}) => void;
	textBox: TextBoxState | null;

	// Thumbnail Window
	showThumbnail: boolean;
	toggleThumbnail: () => void;
}

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
