import React, { useMemo, Component as ReactComponent } from "react";
import { Frame, ColorBox, ToolBox, Canvas } from "../react/components/index.js";
import { AppProvider, useApp, useColors, useTool, useHistory, TOOL_IDS } from "../react/context/AppContext.jsx";
import { DEFAULT_STATUS_TEXT } from "../react/components/Frame.jsx";

// Error boundary to catch rendering errors
class ErrorBoundary extends ReactComponent {
	constructor(props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	componentDidCatch(error, errorInfo) {
		console.error("React Error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div style={{ padding: 20, color: "red", background: "white" }}>
					<h2>Something went wrong:</h2>
					<pre>{this.state.error?.message}</pre>
					<pre>{this.state.error?.stack}</pre>
				</div>
			);
		}
		return this.props.children;
	}
}

const TOOLBOX_ITEMS = [
	{
		id: TOOL_IDS.FREE_FORM_SELECT,
		name: "Free-Form Select",
		description: "Selects a free-form part of the picture to move, copy, or edit.",
		iconIndex: 0,
	},
	{
		id: TOOL_IDS.SELECT,
		name: "Select",
		description: "Selects a rectangular part of the picture to move, copy, or edit.",
		iconIndex: 1,
	},
	{
		id: TOOL_IDS.ERASER,
		name: "Eraser",
		description: "Erases a portion of the picture, using the selected eraser shape.",
		iconIndex: 2,
	},
	{
		id: TOOL_IDS.FILL,
		name: "Fill With Color",
		description: "Fills an area with the selected drawing color.",
		iconIndex: 3,
	},
	{
		id: TOOL_IDS.PICK_COLOR,
		name: "Pick Color",
		description: "Picks up a color from the picture for drawing.",
		iconIndex: 4,
	},
	{
		id: TOOL_IDS.MAGNIFIER,
		name: "Magnifier",
		description: "Changes the magnification.",
		iconIndex: 5,
	},
	{
		id: TOOL_IDS.PENCIL,
		name: "Pencil",
		description: "Draws a free-form line one pixel wide.",
		iconIndex: 6,
	},
	{
		id: TOOL_IDS.BRUSH,
		name: "Brush",
		description: "Draws using a brush with the selected shape and size.",
		iconIndex: 7,
	},
	{
		id: TOOL_IDS.AIRBRUSH,
		name: "Airbrush",
		description: "Draws using an airbrush of the selected size.",
		iconIndex: 8,
	},
	{
		id: TOOL_IDS.TEXT,
		name: "Text",
		description: "Inserts text into the picture.",
		iconIndex: 9,
	},
	{
		id: TOOL_IDS.LINE,
		name: "Line",
		description: "Draws a straight line with the selected line width.",
		iconIndex: 10,
	},
	{
		id: TOOL_IDS.CURVE,
		name: "Curve",
		description: "Draws a curved line with the selected line width.",
		iconIndex: 11,
	},
	{
		id: TOOL_IDS.RECTANGLE,
		name: "Rectangle",
		description: "Draws a rectangle with the selected fill style.",
		iconIndex: 12,
	},
	{
		id: TOOL_IDS.POLYGON,
		name: "Polygon",
		description: "Draws a polygon with the selected fill style.",
		iconIndex: 13,
	},
	{
		id: TOOL_IDS.ELLIPSE,
		name: "Ellipse",
		description: "Draws an ellipse with the selected fill style.",
		iconIndex: 14,
	},
	{
		id: TOOL_IDS.ROUNDED_RECTANGLE,
		name: "Rounded Rectangle",
		description: "Draws a rounded rectangle with the selected fill style.",
		iconIndex: 15,
	},
];

function AppContent() {
	const { state } = useApp();
	const { primaryColor, secondaryColor, palette, setPrimaryColor, setSecondaryColor } = useColors();
	const { selectedToolId, setTool } = useTool();
	const { canUndo, canRedo, undo, redo } = useHistory();

	const [hoveredTool, setHoveredTool] = React.useState(null);

	const activeTool = useMemo(
		() => TOOLBOX_ITEMS.find((tool) => tool.id === selectedToolId) ?? TOOLBOX_ITEMS[6],
		[selectedToolId],
	);

	const statusMessage = hoveredTool?.description ?? activeTool?.description ?? DEFAULT_STATUS_TEXT;

	// Handle keyboard shortcuts
	React.useEffect(() => {
		const handleKeyDown = (e) => {
			// Ctrl+Z for undo
			if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
				e.preventDefault();
				if (canUndo) undo();
			}
			// Ctrl+Y or Ctrl+Shift+Z for redo
			if ((e.ctrlKey && e.key === "y") || (e.ctrlKey && e.shiftKey && e.key === "z")) {
				e.preventDefault();
				if (canRedo) redo();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [canUndo, canRedo, undo, redo]);

	return (
		<Frame
			leftContent={(
				<ToolBox
					tools={TOOLBOX_ITEMS}
					selectedToolIds={[selectedToolId]}
					onSelectionChange={(toolIds) => setTool(toolIds[0])}
					onHoverChange={setHoveredTool}
				/>
			)}
			bottomContent={(
				<ColorBox
					palette={palette}
					initialPrimary={primaryColor}
					initialSecondary={secondaryColor}
					onPrimaryChange={setPrimaryColor}
					onSecondaryChange={setSecondaryColor}
				/>
			)}
			canvasContent={<Canvas />}
			statusText={statusMessage}
			statusPosition={`${state.canvasWidth}x${state.canvasHeight}`}
			statusSize={canUndo ? "Undo available" : ""}
		/>
	);
}

export function App() {
	return (
		<ErrorBoundary>
			<AppProvider>
				<AppContent />
			</AppProvider>
		</ErrorBoundary>
	);
}

export default App;
