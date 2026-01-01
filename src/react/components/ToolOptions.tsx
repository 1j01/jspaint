import { useBrushSettings } from "../context/state/useBrushSettings";
import { useShapeSettings } from "../context/state/useShapeSettings";
import { useTool } from "../context/state/useTool";
import { useSettingsStore } from "../context/state/settingsStore";
import { TOOL_IDS } from "../context/state/types";
import { FillStyleOptions } from "./tooloptions/FillStyleOptions";
import { LineWidthOptions } from "./tooloptions/LineWidthOptions";
import { BrushSizeOptions } from "./tooloptions/BrushSizeOptions";
import { EraserSizeOptions } from "./tooloptions/EraserSizeOptions";
import { AirbrushSizeOptions } from "./tooloptions/AirbrushSizeOptions";
import { TransparencyModeOptions } from "./tooloptions/TransparencyModeOptions";

interface ToolOptionsProps {
	className?: string;
}

export function ToolOptions({ className = "" }: ToolOptionsProps) {
	const { selectedToolId } = useTool();
	const { brushSize, brushShape, eraserSize, airbrushSize, setBrushSize, setBrushShape, setEraserSize, setAirbrushSize } =
		useBrushSettings();
	const { fillStyle, lineWidth, setFillStyle, setLineWidth } = useShapeSettings();

	// Get drawOpaque and toggleDrawOpaque from settingsStore directly
	const drawOpaque = useSettingsStore((state) => state.drawOpaque);
	const toggleDrawOpaque = useSettingsStore((state) => state.toggleDrawOpaque);

	// Determine which options to show based on tool
	// Shape tools show fill style only (matches original $ChooseShapeStyle)
	const showFillStyle = [TOOL_IDS.RECTANGLE, TOOL_IDS.ELLIPSE, TOOL_IDS.ROUNDED_RECTANGLE, TOOL_IDS.POLYGON].includes(
		selectedToolId,
	);

	// Line/Curve tools show stroke size only (matches original $choose_stroke_size)
	const showLineWidth = [TOOL_IDS.LINE, TOOL_IDS.CURVE].includes(selectedToolId);

	const showBrushSize = selectedToolId === TOOL_IDS.BRUSH;
	const showEraserSize = selectedToolId === TOOL_IDS.ERASER;
	const showAirbrushSize = selectedToolId === TOOL_IDS.AIRBRUSH;

	// Transparency mode for Select and Text tools
	// Note: Text tool shows ONLY transparency mode here. Text formatting (font, size, bold, italic, underline)
	// is shown in the separate FontBoxWindow, matching the original MS Paint behavior.
	const showTransparencyMode = [TOOL_IDS.SELECT, TOOL_IDS.FREE_FORM_SELECT, TOOL_IDS.TEXT].includes(selectedToolId);

	// Handle brush change (size and shape together)
	const handleBrushChange = (size: number, shape: typeof brushShape) => {
		setBrushSize(size);
		setBrushShape(shape);
	};

	// If no options for current tool, render empty placeholder
	const hasOptions =
		showFillStyle || showLineWidth || showBrushSize || showEraserSize || showAirbrushSize || showTransparencyMode;

	// Always use tool-options class for proper legacy CSS styling
	return (
		<div className={`tool-options ${className}`} role="toolbar" aria-label="Tool options">
			{hasOptions && (
				<>
					{showFillStyle && <FillStyleOptions fillStyle={fillStyle} onFillStyleChange={setFillStyle} />}
					{showLineWidth && <LineWidthOptions lineWidth={lineWidth} onLineWidthChange={setLineWidth} />}
					{showBrushSize && (
						<BrushSizeOptions brushSize={brushSize} brushShape={brushShape} onBrushChange={handleBrushChange} />
					)}
					{showEraserSize && <EraserSizeOptions eraserSize={eraserSize} onEraserSizeChange={setEraserSize} />}
					{showAirbrushSize && <AirbrushSizeOptions airbrushSize={airbrushSize} onAirbrushSizeChange={setAirbrushSize} />}
					{showTransparencyMode && (
						<TransparencyModeOptions drawOpaque={drawOpaque} onToggleDrawOpaque={toggleDrawOpaque} />
					)}
				</>
			)}
		</div>
	);
}

export default ToolOptions;
