import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../context/state/settingsStore";
import { TOOL_IDS, type ToolId } from "../context/state/types";
import { useBrushSettings } from "../context/state/useBrushSettings";
import { useShapeSettings } from "../context/state/useShapeSettings";
import { useTool } from "../context/state/useTool";
import { AirbrushSizeOptions } from "./tooloptions/AirbrushSizeOptions";
import { BrushSizeOptions } from "./tooloptions/BrushSizeOptions";
import { EraserSizeOptions } from "./tooloptions/EraserSizeOptions";
import { FillStyleOptions } from "./tooloptions/FillStyleOptions";
import { LineWidthOptions } from "./tooloptions/LineWidthOptions";
import { TransparencyModeOptions } from "./tooloptions/TransparencyModeOptions";

/**
 * Props for ToolOptions component
 */
interface ToolOptionsProps {
  /** Additional CSS class name */
  className?: string;
}

/**
 * ToolOptions component - Tool-specific settings panel
 * Renders context-sensitive options based on currently selected tool.
 * Displays below the tool grid in the ToolBox component.
 *
 * Options by tool:
 * - Shape tools (Rectangle, Ellipse, Rounded Rectangle, Polygon): Fill style (outline/filled/outlined)
 * - Line/Curve tools: Line width (1-5px)
 * - Brush: Brush size and shape (circle/square)
 * - Eraser: Eraser size (4 sizes)
 * - Airbrush: Spray radius (3 sizes)
 * - Select/Free-Form Select/Text: Transparency mode (opaque/transparent background)
 *
 * @param {ToolOptionsProps} props - Component props
 * @returns {JSX.Element} Tool options panel with context-sensitive controls
 *
 * @example
 * <ToolBox tools={TOOLBOX_ITEMS} selectedToolIds={["rectangle"]}>
 *   <ToolOptions />
 * </ToolBox>
 */
export function ToolOptions({ className = "" }: ToolOptionsProps) {
  const { t } = useTranslation();
  const { selectedToolId } = useTool();
  const {
    brushSize,
    brushShape,
    eraserSize,
    airbrushSize,
    setBrushSize,
    setBrushShape,
    setEraserSize,
    setAirbrushSize,
  } = useBrushSettings();
  const { fillStyle, lineWidth, setFillStyle, setLineWidth } = useShapeSettings();

  // Get drawOpaque and toggleDrawOpaque from settingsStore directly
  const drawOpaque = useSettingsStore((state) => state.drawOpaque);
  const toggleDrawOpaque = useSettingsStore((state) => state.toggleDrawOpaque);

  // Determine which options to show based on tool
  // Shape tools show fill style only (matches original $ChooseShapeStyle)
  const fillStyleTools: readonly ToolId[] = [
    TOOL_IDS.RECTANGLE,
    TOOL_IDS.ELLIPSE,
    TOOL_IDS.ROUNDED_RECTANGLE,
    TOOL_IDS.POLYGON,
  ];
  const showFillStyle = fillStyleTools.includes(selectedToolId);

  // Line/Curve tools show stroke size only (matches original $choose_stroke_size)
  const lineWidthTools: readonly ToolId[] = [TOOL_IDS.LINE, TOOL_IDS.CURVE];
  const showLineWidth = lineWidthTools.includes(selectedToolId);

  const showBrushSize = selectedToolId === TOOL_IDS.BRUSH;
  const showEraserSize = selectedToolId === TOOL_IDS.ERASER;
  const showAirbrushSize = selectedToolId === TOOL_IDS.AIRBRUSH;

  // Transparency mode for Select and Text tools
  // Note: Text tool shows ONLY transparency mode here. Text formatting (font, size, bold, italic, underline)
  // is shown in the separate FontBoxWindow, matching the original MS Paint behavior.
  const transparencyTools: readonly ToolId[] = [TOOL_IDS.SELECT, TOOL_IDS.FREE_FORM_SELECT, TOOL_IDS.TEXT];
  const showTransparencyMode = transparencyTools.includes(selectedToolId);

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
    <div className={`tool-options ${className}`} role="toolbar" aria-label={t("Tool options")}>
      {hasOptions && (
        <>
          {showFillStyle && <FillStyleOptions fillStyle={fillStyle} onFillStyleChange={setFillStyle} />}
          {showLineWidth && <LineWidthOptions lineWidth={lineWidth} onLineWidthChange={setLineWidth} />}
          {showBrushSize && (
            <BrushSizeOptions brushSize={brushSize} brushShape={brushShape} onBrushChange={handleBrushChange} />
          )}
          {showEraserSize && <EraserSizeOptions eraserSize={eraserSize} onEraserSizeChange={setEraserSize} />}
          {showAirbrushSize && (
            <AirbrushSizeOptions airbrushSize={airbrushSize} onAirbrushSizeChange={setAirbrushSize} />
          )}
          {showTransparencyMode && (
            <TransparencyModeOptions drawOpaque={drawOpaque} onToggleDrawOpaque={toggleDrawOpaque} />
          )}
        </>
      )}
    </div>
  );
}

export default ToolOptions;
