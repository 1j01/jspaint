import { TOOL_IDS, useShapeSettings, useTextBox, useTool } from "../context/AppContext";

// Line width options (matches original)
const LINE_WIDTHS = [1, 2, 3, 4, 5];

// Brush shapes and sizes - matches original $choose_brush
// 4 shapes × 3 sizes = 12 options arranged in 3 columns × 4 rows
type BrushShape = "circle" | "square" | "reverse_diagonal" | "diagonal";
const BRUSH_SHAPES: BrushShape[] = ["circle", "square", "reverse_diagonal", "diagonal"];
const CIRCULAR_BRUSH_SIZES = [7, 4, 1];
const OTHER_BRUSH_SIZES = [8, 5, 2];

interface BrushOption {
	shape: BrushShape;
	size: number;
}

// Generate all brush options (matches legacy tool-options.js)
const BRUSH_OPTIONS: BrushOption[] = BRUSH_SHAPES.flatMap((shape) => {
	const sizes = shape === "circle" ? CIRCULAR_BRUSH_SIZES : OTHER_BRUSH_SIZES;
	return sizes.map((size) => ({ shape, size }));
});

// Eraser size options - matches original
const ERASER_SIZES = [4, 6, 8, 10];

// Airbrush size options - matches original
const AIRBRUSH_SIZES = [9, 16, 24];

// Draw brush shape on canvas (matches legacy stamp_brush_canvas)
function drawBrushShape(
	ctx: CanvasRenderingContext2D,
	centerX: number,
	centerY: number,
	shape: BrushShape,
	size: number,
	color: string,
): void {
	ctx.fillStyle = color;

	switch (shape) {
		case "circle": {
			// Draw circular brush
			const radius = size / 2;
			for (let y = -Math.ceil(radius); y <= Math.ceil(radius); y++) {
				for (let x = -Math.ceil(radius); x <= Math.ceil(radius); x++) {
					if (x * x + y * y <= radius * radius) {
						ctx.fillRect(centerX + x, centerY + y, 1, 1);
					}
				}
			}
			break;
		}
		case "square": {
			// Draw square brush
			const halfSize = Math.floor(size / 2);
			ctx.fillRect(centerX - halfSize, centerY - halfSize, size, size);
			break;
		}
		case "reverse_diagonal": {
			// Draw reverse diagonal line (top-right to bottom-left: /)
			for (let i = 0; i < size; i++) {
				ctx.fillRect(centerX + Math.floor(size / 2) - i - 1, centerY - Math.floor(size / 2) + i, 1, 1);
			}
			break;
		}
		case "diagonal": {
			// Draw diagonal line (top-left to bottom-right: \)
			for (let i = 0; i < size; i++) {
				ctx.fillRect(centerX - Math.floor(size / 2) + i, centerY - Math.floor(size / 2) + i, 1, 1);
			}
			break;
		}
	}
}

interface ToolOptionsProps {
	className?: string;
}

export function ToolOptions({ className = "" }: ToolOptionsProps) {
	const { selectedToolId, brushSize, brushShape, eraserSize, setBrushSize, setBrushShape, setEraserSize } = useTool();
	const { fillStyle, lineWidth, setFillStyle, setLineWidth } = useShapeSettings();
	const { fontFamily, fontSize, fontBold, fontItalic, fontUnderline, setFontFamily, setFontSize, setFontStyle } =
		useTextBox();

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
	const showTextOptions = selectedToolId === TOOL_IDS.TEXT;

	// Render fill style options (matches $ChooseShapeStyle)
	// Original: 39x21 canvases in column layout
	const renderFillStyleOptions = () => (
		<div className="chooser choose-shape-style">
			{(["outline", "both", "fill"] as const).map((style) => {
				const isSelected = fillStyle === style;
				return (
					<div
						key={style}
						className="chooser-option"
						onClick={() => setFillStyle(style)}
						style={{ backgroundColor: isSelected ? "var(--Hilight, #000080)" : undefined }}
					>
						<canvas
							width={39}
							height={21}
							ref={(canvas) => {
								if (!canvas) return;
								const ctx = canvas.getContext("2d");
								if (!ctx) return;
								ctx.clearRect(0, 0, 39, 21);

								const b = 5; // border inset
								const fillColor = isSelected ? "#ffffff" : "#000000";
								const bgColor = "#808080";

								ctx.fillStyle = fillColor;

								// Draw based on style
								if (style === "outline" || style === "both") {
									// Outline rectangle
									ctx.fillRect(b, b, 39 - b * 2, 21 - b * 2);
								}

								// Inner area
								const innerB = b + 1;
								if (style === "both") {
									ctx.fillStyle = bgColor;
									ctx.fillRect(innerB, innerB, 39 - innerB * 2, 21 - innerB * 2);
								} else if (style === "outline") {
									ctx.clearRect(innerB, innerB, 39 - innerB * 2, 21 - innerB * 2);
								} else if (style === "fill") {
									ctx.fillStyle = bgColor;
									ctx.fillRect(b, b, 39 - b * 2, 21 - b * 2);
								}
							}}
						/>
					</div>
				);
			})}
		</div>
	);

	// Render line width options (matches $choose_stroke_size)
	// Original: 39x12 canvases in column layout
	const renderLineWidthOptions = () => (
		<div className="chooser choose-stroke-size">
			{LINE_WIDTHS.map((width) => {
				const isSelected = lineWidth === width;
				return (
					<div
						key={width}
						className="chooser-option"
						onClick={() => setLineWidth(width)}
						style={{ backgroundColor: isSelected ? "var(--Hilight, #000080)" : undefined }}
					>
						<canvas
							width={39}
							height={12}
							ref={(canvas) => {
								if (!canvas) return;
								const ctx = canvas.getContext("2d");
								if (!ctx) return;
								ctx.clearRect(0, 0, 39, 12);

								const b = 5; // border padding
								const centerY = (12 - width) / 2;
								ctx.fillStyle = isSelected ? "#ffffff" : "#000000";
								ctx.fillRect(b, Math.floor(centerY), 39 - b * 2, width);
							}}
						/>
					</div>
				);
			})}
		</div>
	);

	// Render brush options (matches $choose_brush)
	// Original: 10x10 canvases in 3 columns × 4 rows layout (12 options total)
	const renderBrushSizeOptions = () => (
		<div className="chooser choose-brush">
			{BRUSH_OPTIONS.map((option, index) => {
				const isSelected = brushSize === option.size && brushShape === option.shape;
				return (
					<div
						key={`${option.shape}-${option.size}-${index}`}
						className="chooser-option"
						onClick={() => {
							setBrushSize(option.size);
							setBrushShape(option.shape);
						}}
						style={{ backgroundColor: isSelected ? "var(--Hilight, #000080)" : undefined }}
					>
						<canvas
							width={10}
							height={10}
							ref={(canvas) => {
								if (!canvas) return;
								const ctx = canvas.getContext("2d");
								if (!ctx) return;
								ctx.clearRect(0, 0, 10, 10);

								const color = isSelected ? "#ffffff" : "#000000";
								drawBrushShape(ctx, 5, 5, option.shape, option.size, color);
							}}
						/>
					</div>
				);
			})}
		</div>
	);

	// Render eraser size options (matches $choose_eraser_size)
	// Original: 39x16 canvases in column layout
	const renderEraserSizeOptions = () => (
		<div className="chooser choose-eraser">
			{ERASER_SIZES.map((size) => {
				const isSelected = eraserSize === size;
				return (
					<div
						key={size}
						className="chooser-option"
						onClick={() => setEraserSize(size)}
						style={{ backgroundColor: isSelected ? "var(--Hilight, #000080)" : undefined }}
					>
						<canvas
							width={39}
							height={16}
							ref={(canvas) => {
								if (!canvas) return;
								const ctx = canvas.getContext("2d");
								if (!ctx) return;
								ctx.clearRect(0, 0, 39, 16);

								ctx.fillStyle = isSelected ? "#ffffff" : "#000000";
								const x = (39 - size) / 2;
								const y = (16 - size) / 2;
								ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
							}}
						/>
					</div>
				);
			})}
		</div>
	);

	// Render airbrush size options (matches $choose_airbrush_size)
	const renderAirbrushSizeOptions = () => (
		<div className="chooser choose-airbrush-size">
			{AIRBRUSH_SIZES.map((size, i) => {
				const isSelected = brushSize === size;
				const isBottom = i === 2;
				const shrink = isBottom ? 0 : 4;
				const w = 72 / 3 - shrink * 2;

				return (
					<div
						key={size}
						className="chooser-option"
						onClick={() => setBrushSize(size)}
						style={{
							backgroundColor: isSelected ? "var(--Hilight, #000080)" : "rgb(192, 192, 192)",
						}}
					>
						<canvas
							width={w}
							height={23}
							ref={(canvas) => {
								if (!canvas) return;
								const ctx = canvas.getContext("2d");
								if (!ctx) return;
								ctx.clearRect(0, 0, w, 23);

								// Draw spray pattern (simplified)
								ctx.fillStyle = isSelected ? "#ffffff" : "#000000";
								const centerX = w / 2;
								const centerY = 12;
								const radius = size / 3;

								for (let j = 0; j < size; j++) {
									const angle = (j / size) * Math.PI * 2;
									const r = radius * (0.5 + Math.random() * 0.5);
									const x = centerX + Math.cos(angle) * r;
									const y = centerY + Math.sin(angle) * r;
									ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
								}
								// Center dot
								ctx.fillRect(Math.floor(centerX), Math.floor(centerY), 1, 1);
							}}
						/>
					</div>
				);
			})}
		</div>
	);

	// Render text options
	const renderTextOptions = () => (
		<div className="chooser choose-text">
			<div className="text-option-row">
				<select
					value={fontFamily}
					onChange={(e) => setFontFamily(e.target.value)}
					className="font-family-select"
					aria-label="Font family"
					style={{ width: "100%", fontSize: "10px" }}
				>
					<option value="Arial">Arial</option>
					<option value="Times New Roman">Times</option>
					<option value="Courier New">Courier</option>
					<option value="Verdana">Verdana</option>
					<option value="Georgia">Georgia</option>
					<option value="Comic Sans MS">Comic</option>
				</select>
			</div>
			<div className="text-option-row">
				<select
					value={fontSize}
					onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
					className="font-size-select"
					aria-label="Font size"
					style={{ width: "100%", fontSize: "10px" }}
				>
					{[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72].map((size) => (
						<option key={size} value={size}>
							{size}
						</option>
					))}
				</select>
			</div>
			<div className="text-option-row text-style-buttons" style={{ display: "flex", justifyContent: "center" }}>
				<button
					className={`text-style-button ${fontBold ? "selected" : ""}`}
					onClick={() => setFontStyle({ bold: !fontBold })}
					title="Bold"
					aria-pressed={fontBold}
					style={{ fontWeight: "bold", padding: "2px 4px" }}
				>
					B
				</button>
				<button
					className={`text-style-button ${fontItalic ? "selected" : ""}`}
					onClick={() => setFontStyle({ italic: !fontItalic })}
					title="Italic"
					aria-pressed={fontItalic}
					style={{ fontStyle: "italic", padding: "2px 4px" }}
				>
					I
				</button>
				<button
					className={`text-style-button ${fontUnderline ? "selected" : ""}`}
					onClick={() => setFontStyle({ underline: !fontUnderline })}
					title="Underline"
					aria-pressed={fontUnderline}
					style={{ textDecoration: "underline", padding: "2px 4px" }}
				>
					U
				</button>
			</div>
		</div>
	);

	// If no options for current tool, render empty placeholder
	const hasOptions =
		showFillStyle || showLineWidth || showBrushSize || showEraserSize || showAirbrushSize || showTextOptions;

	// Always use tool-options class for proper legacy CSS styling
	return (
		<div className={`tool-options ${className}`} role="toolbar" aria-label="Tool options">
			{hasOptions && (
				<>
					{showFillStyle && renderFillStyleOptions()}
					{showLineWidth && renderLineWidthOptions()}
					{showBrushSize && renderBrushSizeOptions()}
					{showEraserSize && renderEraserSizeOptions()}
					{showAirbrushSize && renderAirbrushSizeOptions()}
					{showTextOptions && renderTextOptions()}
				</>
			)}
		</div>
	);
}

export default ToolOptions;
