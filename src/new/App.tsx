import React, { ErrorInfo, Component as ReactComponent, ReactNode, useMemo } from "react";
import { Canvas } from "../react/components/Canvas";
import { ColorBox } from "../react/components/ColorBox";
import { DEFAULT_STATUS_TEXT, Frame } from "../react/components/Frame";
import { Tool, ToolBox } from "../react/components/ToolBox";
import { ToolOptions } from "../react/components/ToolOptions";
import {
	AppProvider,
	TOOL_IDS,
	useApp,
	useClipboard,
	useColors,
	useCursorPosition,
	useHistory,
	useSelection,
	useTool,
} from "../react/context/AppContext";

interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

// Error boundary to catch rendering errors
class ErrorBoundary extends ReactComponent<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}
	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}
	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
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

const TOOLBOX_ITEMS: Tool[] = [
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
	const { cursorPosition } = useCursorPosition();
	const { selection, clearSelection } = useSelection();
	const { copy, cut, paste, hasClipboard } = useClipboard();

	const [hoveredTool, setHoveredTool] = React.useState<Tool | null>(null);

	const activeTool = useMemo(
		() => TOOLBOX_ITEMS.find((tool) => tool.id === selectedToolId) ?? TOOLBOX_ITEMS[6],
		[selectedToolId],
	);

	const statusMessage = hoveredTool?.description ?? activeTool?.description ?? DEFAULT_STATUS_TEXT;

	// Handle keyboard shortcuts
	React.useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Don't handle shortcuts if typing in a text input
			const target = e.target as HTMLElement;
			if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
				// Allow Escape to exit text input
				if (e.key === "Escape") {
					target.blur();
				}
				return;
			}

			// Modifier key detection (Ctrl on Windows/Linux, Cmd on Mac)
			const isMod = e.ctrlKey || e.metaKey;

			// Ctrl/Cmd+Z for undo
			if (isMod && e.key === "z" && !e.shiftKey) {
				e.preventDefault();
				if (canUndo) undo();
				return;
			}

			// Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z for redo
			if (
				(isMod && e.key === "y") ||
				(isMod && e.shiftKey && e.key === "z") ||
				(isMod && e.shiftKey && e.key === "Z")
			) {
				e.preventDefault();
				if (canRedo) redo();
				return;
			}

			// Ctrl/Cmd+A for select all
			if (isMod && e.key === "a") {
				e.preventDefault();
				setTool(TOOL_IDS.SELECT);
				// TODO: Implement select all functionality in canvas
				return;
			}

			// Ctrl/Cmd+C for copy
			if (isMod && e.key === "c") {
				if (selection) {
					e.preventDefault();
					copy();
				}
				return;
			}

			// Ctrl/Cmd+X for cut
			if (isMod && e.key === "x") {
				if (selection) {
					e.preventDefault();
					cut();
					clearSelection();
				}
				return;
			}

			// Ctrl/Cmd+V for paste
			if (isMod && e.key === "v") {
				if (hasClipboard) {
					e.preventDefault();
					paste();
				}
				return;
			}

			// Delete or Backspace to clear selection
			if (e.key === "Delete" || e.key === "Backspace") {
				if (selection) {
					e.preventDefault();
					// TODO: Clear selection - delete selected area
				}
				return;
			}

			// Escape to cancel current operation / deselect
			if (e.key === "Escape") {
				e.preventDefault();
				// Clear any active selection
				// Note: This will be wired up when useSelection provides clearSelection
				return;
			}

			// Tool shortcuts (single keys)
			if (!isMod && !e.shiftKey && !e.altKey) {
				switch (e.key.toLowerCase()) {
					case "p":
						setTool(TOOL_IDS.PENCIL);
						break;
					case "b":
						setTool(TOOL_IDS.BRUSH);
						break;
					case "e":
						setTool(TOOL_IDS.ERASER);
						break;
					case "f":
						setTool(TOOL_IDS.FILL);
						break;
					case "k":
						setTool(TOOL_IDS.PICK_COLOR);
						break;
					case "l":
						setTool(TOOL_IDS.LINE);
						break;
					case "r":
						setTool(TOOL_IDS.RECTANGLE);
						break;
					case "o":
						setTool(TOOL_IDS.ELLIPSE);
						break;
					case "s":
						setTool(TOOL_IDS.SELECT);
						break;
					case "a":
						setTool(TOOL_IDS.AIRBRUSH);
						break;
					case "t":
						setTool(TOOL_IDS.TEXT);
						break;
					case "m":
						setTool(TOOL_IDS.MAGNIFIER);
						break;
					case "c":
						setTool(TOOL_IDS.CURVE);
						break;
					case "g":
						setTool(TOOL_IDS.POLYGON);
						break;
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [canUndo, canRedo, undo, redo, setTool, selection, copy, cut, paste, hasClipboard, clearSelection]);

	// Format cursor position for status bar
	const positionText = cursorPosition ? `${cursorPosition.x}, ${cursorPosition.y}` : "";

	// Format selection or canvas size for status bar
	const sizeText = selection
		? `${Math.abs(selection.width)}x${Math.abs(selection.height)}`
		: `${state.canvasWidth}x${state.canvasHeight}`;

	// Get MENU_DIVIDER from global scope (set by os-gui)
	const MENU_DIVIDER = (globalThis as typeof globalThis & { MENU_DIVIDER: symbol }).MENU_DIVIDER;

	// Build dynamic menu with working actions
	const menu = useMemo(
		() => ({
			"&File": [
				{
					label: "&New",
					shortcutLabel: "Ctrl+N",
					ariaKeyShortcuts: "Control+N",
					description: "Create a new image.",
					action: () => {
						// TODO: Clear canvas and reset state
						console.info("[React] File > New");
					},
				},
				MENU_DIVIDER,
				{
					label: "E&xit",
					description: "Close the application.",
					disabled: true,
					action: () => {},
				},
			],
			"&Edit": [
				{
					label: "&Undo",
					shortcutLabel: "Ctrl+Z",
					ariaKeyShortcuts: "Control+Z",
					disabled: !canUndo,
					description: canUndo ? "Undo the last action." : "Nothing to undo.",
					action: () => {
						if (canUndo) undo();
					},
				},
				{
					label: "&Redo",
					shortcutLabel: "Ctrl+Y",
					ariaKeyShortcuts: "Control+Y",
					disabled: !canRedo,
					description: canRedo ? "Redo the last undone action." : "Nothing to redo.",
					action: () => {
						if (canRedo) redo();
					},
				},
				MENU_DIVIDER,
				{
					label: "Cu&t",
					shortcutLabel: "Ctrl+X",
					ariaKeyShortcuts: "Control+X",
					disabled: !selection,
					description: "Cut the selection to clipboard.",
					action: () => {
						if (selection) {
							cut();
							clearSelection();
						}
					},
				},
				{
					label: "&Copy",
					shortcutLabel: "Ctrl+C",
					ariaKeyShortcuts: "Control+C",
					disabled: !selection,
					description: "Copy the selection to clipboard.",
					action: () => {
						if (selection) copy();
					},
				},
				{
					label: "&Paste",
					shortcutLabel: "Ctrl+V",
					ariaKeyShortcuts: "Control+V",
					disabled: !hasClipboard,
					description: "Paste from clipboard.",
					action: () => {
						if (hasClipboard) paste();
					},
				},
				MENU_DIVIDER,
				{
					label: "Select &All",
					shortcutLabel: "Ctrl+A",
					ariaKeyShortcuts: "Control+A",
					description: "Select the entire canvas.",
					action: () => {
						setTool(TOOL_IDS.SELECT);
						// TODO: Implement select all
					},
				},
			],
			"&View": [
				{
					label: "&Zoom",
					submenu: [
						{
							label: "100%",
							action: () => console.info("[React] View > Zoom 100%"),
						},
						{
							label: "200%",
							action: () => console.info("[React] View > Zoom 200%"),
						},
						{
							label: "400%",
							action: () => console.info("[React] View > Zoom 400%"),
						},
					],
				},
			],
			"&Help": [
				{
					label: "&About MCPaint",
					description: "About this React version of MCPaint.",
					action: () => {
						alert(
							"MCPaint - React Preview\n\nA pixel-perfect MS Paint clone built with React.\n\nSee MIGRATE.md for implementation progress.",
						);
					},
				},
			],
		}),
		[
			canUndo,
			canRedo,
			undo,
			redo,
			selection,
			hasClipboard,
			copy,
			cut,
			paste,
			clearSelection,
			setTool,
			MENU_DIVIDER,
		],
	);

	return (
		<Frame
			menu={menu}
			leftContent={
				<ToolBox
					tools={TOOLBOX_ITEMS}
					selectedToolIds={[selectedToolId]}
					onSelectionChange={(toolIds) => setTool(toolIds[0])}
					onHoverChange={setHoveredTool}
				>
					<ToolOptions />
				</ToolBox>
			}
			bottomContent={
				<ColorBox
					palette={palette}
					initialPrimary={primaryColor}
					initialSecondary={secondaryColor}
					onPrimaryChange={setPrimaryColor}
					onSecondaryChange={setSecondaryColor}
				/>
			}
			canvasContent={<Canvas />}
			statusText={statusMessage}
			statusPosition={positionText}
			statusSize={sizeText}
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
