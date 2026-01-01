import { TOOL_IDS } from "../context/state/types";
import type { Tool } from "../components/ToolBox";

/**
 * Tool definitions for the ToolBox
 *
 * Defines all 16 tools available in MS Paint with their:
 * - ID (from TOOL_IDS constant)
 * - Display name
 * - Description (shown in status bar on hover)
 * - Icon index (position in the tool icons sprite)
 */
export const TOOLBOX_ITEMS: Tool[] = [
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
