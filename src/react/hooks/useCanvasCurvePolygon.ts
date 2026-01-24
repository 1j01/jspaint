import { useCallback, useRef, RefObject } from "react";
import { useColors } from "../context/state/useColors";
import { useShapeSettings } from "../context/state/useShapeSettings";
import { useHistory } from "../context/state/useHistory";
import { TOOL_IDS } from "../context/state/types";
import { drawPolygon, Point, getShapeColors } from "../utils/drawingUtils";

export interface CurveState {
	points: Point[];
	previewImageData: ImageData | null;
	active: boolean;
	button: number; // Track which mouse button was used to start
}

export interface PolygonState {
	points: Point[];
	previewImageData: ImageData | null;
	active: boolean;
	button: number; // Track which mouse button was used to start
}

interface UseCanvasCurvePolygonProps {
	canvasRef: RefObject<HTMLCanvasElement | null>;
	getDrawColor: (button: number) => string;
}

/**
 * Hook for handling curve and polygon multi-click tools
 *
 * Manages multi-step drawing operations:
 * - Curve tool: 4 points (start, end, 2 control points) for Bezier curves
 * - Polygon tool: Unlimited points with double-click or right-click to close
 *
 * Curve workflow:
 * 1. Click 1: Set start point
 * 2. Click 2: Set end point (shows line preview)
 * 3. Click 3: First control point (shows quadratic curve)
 * 4. Click 4: Second control point -> commit Bezier curve
 *
 * Polygon workflow:
 * 1. Click points to add vertices
 * 2. Double-click, right-click, or click near start -> close and commit
 * 3. Shows live preview line to cursor during drawing
 *
 * @param {UseCanvasCurvePolygonProps} props - Hook configuration
 * @param {RefObject<HTMLCanvasElement | null>} props.canvasRef - Reference to the canvas element
 * @param {Function} props.getDrawColor - Function to get color based on mouse button
 * @returns {Object} Curve and polygon drawing functions and state
 *
 * @example
 * const curvePolygon = useCanvasCurvePolygon({ canvasRef, getDrawColor });
 * // Handle curve click
 * const stillDrawing = curvePolygon.handleCurveClick(x, y, button, ctx);
 * // Preview during move
 * if (curvePolygon.isCurveActive()) {
 *   curvePolygon.previewCurve(x, y, ctx);
 * }
 */
export function useCanvasCurvePolygon({ canvasRef, getDrawColor }: UseCanvasCurvePolygonProps) {
	const { secondaryColor } = useColors();
	const { fillStyle, lineWidth } = useShapeSettings();
	const { saveState } = useHistory();

	// Curve state
	const curveState = useRef<CurveState>({
		points: [],
		previewImageData: null,
		active: false,
		button: 0,
	});

	// Polygon state
	const polygonState = useRef<PolygonState>({
		points: [],
		previewImageData: null,
		active: false,
		button: 0,
	});

	// Track last click for double-click detection (time + position)
	const lastClickRef = useRef<{ x: number; y: number; time: number }>({
		x: -Infinity,
		y: -Infinity,
		time: -Infinity,
	});

	// Handle curve click
	const handleCurveClick = useCallback(
		(x: number, y: number, button: number, ctx: CanvasRenderingContext2D): boolean => {
			const canvas = canvasRef.current;
			if (!canvas) return false;

			const curve = curveState.current;
			const color = getDrawColor(button);

			// Detect double-click
			const now = Date.now();
			const dx = x - lastClickRef.current.x;
			const dy = y - lastClickRef.current.y;
			const dt = now - lastClickRef.current.time;
			const distance = Math.sqrt(dx * dx + dy * dy);
			const isDoubleClick = distance < 4 && dt < 250;

			if (!curve.active) {
				// First point - save canvas state
				curve.previewImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				curve.active = true;
				curve.button = button; // Store button for preview
				curve.points = [
					{ x, y },
					{ x, y },
				]; // Start + end point
				saveState(ctx.getImageData(0, 0, canvas.width, canvas.height));
				lastClickRef.current = { x, y, time: now };
				return true;
			} else if (curve.points.length < 4) {
				// Double-click commits the curve early (straight line if < 4 points)
				if (isDoubleClick && curve.points.length >= 2) {
					if (curve.previewImageData) {
						ctx.putImageData(curve.previewImageData, 0, 0);
					}
					// Draw line from start to end
					const p = curve.points;
					ctx.strokeStyle = color;
					ctx.lineWidth = lineWidth;
					ctx.beginPath();
					ctx.moveTo(p[0].x, p[0].y);
					ctx.lineTo(p[1].x, p[1].y);
					ctx.stroke();
					// Reset curve state
					curve.points = [];
					curve.active = false;
					curve.previewImageData = null;
					lastClickRef.current = { x: -Infinity, y: -Infinity, time: -Infinity };
					return false;
				}

				// Add control point
				curve.points.push({ x, y });
				lastClickRef.current = { x, y, time: now };

				if (curve.points.length === 4) {
					// Final point - commit the curve
					if (curve.previewImageData) {
						ctx.putImageData(curve.previewImageData, 0, 0);
					}
					// Draw final bezier curve
					const p = curve.points;
					ctx.strokeStyle = color;
					ctx.lineWidth = lineWidth;
					ctx.beginPath();
					ctx.moveTo(p[0].x, p[0].y);
					ctx.bezierCurveTo(p[2].x, p[2].y, p[3].x, p[3].y, p[1].x, p[1].y);
					ctx.stroke();
					// Reset curve state
					curve.points = [];
					curve.active = false;
					curve.previewImageData = null;
					lastClickRef.current = { x: -Infinity, y: -Infinity, time: -Infinity };
					return false;
				}
				return true;
			}
			return false;
		},
		[canvasRef, getDrawColor, lineWidth, saveState],
	);

	// Preview curve during mouse move
	const previewCurve = useCallback(
		(x: number, y: number, ctx: CanvasRenderingContext2D): void => {
			const curve = curveState.current;
			if (!curve.active || !curve.previewImageData || curve.points.length < 2) return;

			ctx.putImageData(curve.previewImageData, 0, 0);
			const p = curve.points;
			ctx.strokeStyle = getDrawColor(curve.button);
			ctx.lineWidth = lineWidth;
			ctx.beginPath();

			if (curve.points.length === 2) {
				// Just a line from start to end, following mouse for end point
				ctx.moveTo(p[0].x, p[0].y);
				ctx.lineTo(x, y);
				// Update the end point
				curve.points[1] = { x, y };
			} else if (curve.points.length === 3) {
				// One control point
				ctx.moveTo(p[0].x, p[0].y);
				ctx.quadraticCurveTo(x, y, p[1].x, p[1].y);
			}
			ctx.stroke();
		},
		[getDrawColor, lineWidth],
	);

	// Handle polygon click
	const handlePolygonClick = useCallback(
		(x: number, y: number, button: number, ctx: CanvasRenderingContext2D): boolean => {
			const canvas = canvasRef.current;
			if (!canvas) return false;

			const poly = polygonState.current;
			const color = getDrawColor(poly.active ? poly.button : button); // Use stored button if active

			// Detect double-click (same position within time window, like jQuery implementation)
			const now = Date.now();
			const dx = x - lastClickRef.current.x;
			const dy = y - lastClickRef.current.y;
			const dt = now - lastClickRef.current.time;
			const distance = Math.sqrt(dx * dx + dy * dy);
			const isDoubleClick = distance < 4 && dt < 250; // Match jQuery: distance < 4.1010101 and dt < 250

			if (!poly.active) {
				// First point - start a new polygon
				poly.previewImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				poly.active = true;
				poly.button = button; // Store button for preview
				poly.points = [{ x, y }];
				saveState(ctx.getImageData(0, 0, canvas.width, canvas.height));
				lastClickRef.current = { x, y, time: now };
				return true;
			} else {
				// Double-click or right-click closes the polygon
				if ((isDoubleClick || button === 2) && poly.points.length > 2) {
					// Close polygon - commit it
					if (poly.previewImageData) {
						ctx.putImageData(poly.previewImageData, 0, 0);
					}
					const { fillColor: shapeFillColor, strokeColor } = getShapeColors(fillStyle, color, secondaryColor);
					drawPolygon(ctx, poly.points, strokeColor, shapeFillColor, lineWidth, true);
					// Reset polygon state
					poly.points = [];
					poly.active = false;
					poly.previewImageData = null;
					lastClickRef.current = { x: -Infinity, y: -Infinity, time: -Infinity };
					return false;
				} else if (button === 2) {
					// Right-click with fewer than 3 points - cancel polygon
					if (poly.previewImageData) {
						ctx.putImageData(poly.previewImageData, 0, 0);
					}
					poly.points = [];
					poly.active = false;
					poly.previewImageData = null;
					lastClickRef.current = { x: -Infinity, y: -Infinity, time: -Infinity };
					return false;
				} else {
					// Check if clicking near the starting point (close polygon)
					const start = poly.points[0];
					const dist = Math.sqrt((x - start.x) ** 2 + (y - start.y) ** 2);
					if (dist < 10 && poly.points.length > 2) {
						// Close polygon - commit it
						if (poly.previewImageData) {
							ctx.putImageData(poly.previewImageData, 0, 0);
						}
						const { fillColor: shapeFillColor, strokeColor } = getShapeColors(fillStyle, color, secondaryColor);
						drawPolygon(ctx, poly.points, strokeColor, shapeFillColor, lineWidth, true);
						// Reset polygon state
						poly.points = [];
						poly.active = false;
						poly.previewImageData = null;
						lastClickRef.current = { x: -Infinity, y: -Infinity, time: -Infinity };
						return false;
					} else if (!isDoubleClick) {
						// Single click not near start - add a new point
						poly.points.push({ x, y });
						lastClickRef.current = { x, y, time: now };
						return true;
					}
				}
			}
			return false;
		},
		[canvasRef, getDrawColor, fillStyle, secondaryColor, lineWidth, saveState],
	);

	// Preview polygon during mouse move
	const previewPolygon = useCallback(
		(x: number, y: number, ctx: CanvasRenderingContext2D): void => {
			const poly = polygonState.current;
			if (!poly.active || !poly.previewImageData || poly.points.length === 0) return;

			ctx.putImageData(poly.previewImageData, 0, 0);
			// Draw polygon lines so far + line to current position
			const allPoints = [...poly.points, { x, y }];
			ctx.strokeStyle = getDrawColor(poly.button);
			ctx.lineWidth = lineWidth;
			ctx.beginPath();
			ctx.moveTo(allPoints[0].x, allPoints[0].y);
			for (let i = 1; i < allPoints.length; i++) {
				ctx.lineTo(allPoints[i].x, allPoints[i].y);
			}
			ctx.stroke();
		},
		[getDrawColor, lineWidth],
	);

	// Check if curve tool is active
	const isCurveActive = useCallback((): boolean => {
		return curveState.current.active;
	}, []);

	// Check if polygon tool is active
	const isPolygonActive = useCallback((): boolean => {
		return polygonState.current.active;
	}, []);

	// Reset curve state (for when switching tools)
	const resetCurve = useCallback((): void => {
		curveState.current = {
			points: [],
			previewImageData: null,
			active: false,
			button: 0,
		};
	}, []);

	// Reset polygon state (for when switching tools)
	const resetPolygon = useCallback((): void => {
		polygonState.current = {
			points: [],
			previewImageData: null,
			active: false,
			button: 0,
		};
	}, []);

	return {
		curveState,
		polygonState,
		handleCurveClick,
		previewCurve,
		handlePolygonClick,
		previewPolygon,
		isCurveActive,
		isPolygonActive,
		resetCurve,
		resetPolygon,
	};
}
