import { useCallback, useRef, RefObject } from "react";
import { TOOL_IDS, useColors, useShapeSettings, useHistory } from "../context/state";
import { drawPolygon, Point } from "../utils/drawingUtils";

export interface CurveState {
	points: Point[];
	previewImageData: ImageData | null;
	active: boolean;
}

export interface PolygonState {
	points: Point[];
	previewImageData: ImageData | null;
	active: boolean;
}

interface UseCanvasCurvePolygonProps {
	canvasRef: RefObject<HTMLCanvasElement | null>;
	getDrawColor: (button: number) => string;
}

/**
 * Hook for handling curve and polygon multi-click tools
 */
export function useCanvasCurvePolygon({ canvasRef, getDrawColor }: UseCanvasCurvePolygonProps) {
	const { primaryColor, secondaryColor } = useColors();
	const { fillStyle, lineWidth } = useShapeSettings();
	const { saveState } = useHistory();

	// Curve state
	const curveState = useRef<CurveState>({
		points: [],
		previewImageData: null,
		active: false,
	});

	// Polygon state
	const polygonState = useRef<PolygonState>({
		points: [],
		previewImageData: null,
		active: false,
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

			if (!curve.active) {
				// First point - save canvas state
				curve.previewImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				curve.active = true;
				curve.points = [
					{ x, y },
					{ x, y },
				]; // Start + end point
				saveState();
				return true;
			} else if (curve.points.length < 4) {
				// Add control point
				curve.points.push({ x, y });
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
			ctx.strokeStyle = primaryColor;
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
		[primaryColor, lineWidth],
	);

	// Handle polygon click
	const handlePolygonClick = useCallback(
		(x: number, y: number, button: number, ctx: CanvasRenderingContext2D): boolean => {
			const canvas = canvasRef.current;
			if (!canvas) return false;

			const poly = polygonState.current;
			const color = getDrawColor(0); // Always use primary color for stroke

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
				poly.points = [{ x, y }];
				saveState();
				lastClickRef.current = { x, y, time: now };
				return true;
			} else {
				// Double-click or right-click closes the polygon
				if ((isDoubleClick || button === 2) && poly.points.length > 2) {
					// Close polygon - commit it
					if (poly.previewImageData) {
						ctx.putImageData(poly.previewImageData, 0, 0);
					}
					const shapeFillColor = fillStyle === "fill" || fillStyle === "both" ? secondaryColor : null;
					const strokeColor = fillStyle === "fill" ? null : color;
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
						const shapeFillColor = fillStyle === "fill" || fillStyle === "both" ? secondaryColor : null;
						const strokeColor = fillStyle === "fill" ? null : color;
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
			ctx.strokeStyle = primaryColor;
			ctx.lineWidth = lineWidth;
			ctx.beginPath();
			ctx.moveTo(allPoints[0].x, allPoints[0].y);
			for (let i = 1; i < allPoints.length; i++) {
				ctx.lineTo(allPoints[i].x, allPoints[i].y);
			}
			ctx.stroke();
		},
		[primaryColor, lineWidth],
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
		};
	}, []);

	// Reset polygon state (for when switching tools)
	const resetPolygon = useCallback((): void => {
		polygonState.current = {
			points: [],
			previewImageData: null,
			active: false,
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
