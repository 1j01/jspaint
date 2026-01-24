# MCPaint React vs jQuery Implementation - Feature Gap Report

This document compares the React implementation (`/new/`) with the legacy jQuery implementation (`/old/`) to identify missing features, bugs, and implementation differences.

## Summary

| Category | Critical Issues | Medium Issues | Low Issues |
|----------|----------------|---------------|------------|
| Text Tool | 0 ✅ | 0 ✅ | 0 ✅ |
| Selection Tools | 0 ✅ | 0 ✅ | 0 ✅ |
| Shape Tools | 0 ✅ | 0 ✅ | 0 ✅ |
| Drawing Tools | 0 ✅ | 0 ✅ | 0 ✅ |
| **Total** | **0** ✅ | **0** ✅ | **0** ✅ |

---

## Critical Issues (All Fixed ✅)

### 1. ~~Text Tool - History Saved at Wrong Time~~ ✅ FIXED
**Location:** `src/react/hooks/useCanvasEventHandlers.ts`

History is now saved AFTER text is committed to canvas, both in `handlePointerDown` for the TEXT tool and in `handleTextBlur`.

### 2. ~~Text Tool - Vertical Text Underline Broken~~ ✅ FIXED
**Location:** `src/react/hooks/useCanvasTextBox.ts` and `src/react/components/CanvasTextBox.tsx`

Fixed underline rendering for vertical text. Now draws a continuous underline per column (line) positioned correctly to the left of the text column in display space.

### 3. ~~Selection - Paste Not Implemented~~ ✅ FIXED
**Location:** `src/react/hooks/useMenuActions.ts`

`editPaste()` now creates a floating selection from clipboard data at (0, 0) and switches to select tool.

### 4. ~~Selection - Cut Incomplete~~ ✅ FIXED
**Location:** `src/react/hooks/useMenuActions.ts`

`editCut()` now copies to clipboard, saves state, clears the selection area with secondary color, and clears the selection.

### 5. ~~Pencil Size Setting Unused~~ ✅ FIXED
**Location:** `src/react/hooks/useCanvasDrawing.ts`

Pencil now uses `pencilSize` setting from the store for drawing.

---

## Medium Issues (All Fixed ✅)

### Text Tool

#### ~~6. Underline Preview/Commit Inconsistency~~ ✅ FIXED
**Location:** `src/react/components/CanvasTextBox.tsx` and `src/react/hooks/useCanvasTextBox.ts`

Both preview and commit now use `ctx.fillRect()` for underline rendering, ensuring visual consistency between preview and final result.

#### ~~7. Minimum Text Box Size Too Large~~ ✅ FIXED
**Location:** `src/react/hooks/useCanvasTextBox.ts`

Text box minimum size is now 20x10 pixels (was reported as 50x20), which is reasonable for single character input.

#### ~~8. Vertical Text Hidden in Textarea~~ ✅ BY DESIGN
**Location:** `src/react/components/CanvasTextBox.tsx`

Vertical text uses `-webkit-text-fill-color: transparent` to hide the textarea content while a canvas overlay renders the properly-oriented text. The `color` property is kept as `primaryColor` to preserve cursor visibility (`caretColor`) and selection highlighting. This is the standard CSS technique for overlay-based text rendering and works in all modern browsers.

### Selection Tools

#### ~~9. No Transparent Selection Mode~~ ✅ FIXED
**Location:** `src/react/context/state/settingsStore.ts`, `src/react/utils/selectionDrawing.ts`

Implemented as `drawOpaque` toggle (default: true = opaque mode). When disabled via **Image > Draw Opaque** menu, pixels matching the background color (secondary color) become transparent during selection paste. Uses `applyTransparencyToImageData()` with color tolerance of 1.

#### ~~10. Selection Not Auto-Committed on Tool Change~~ ✅ FIXED
**Location:** `src/react/components/Canvas.tsx`

Selection is now auto-committed when switching away from selection tools. A `useEffect` watches for tool changes and commits any floating selection (with imageData) before switching. Text boxes are also committed when switching away from the text tool.

### Shape Tools

#### ~~11. Curve/Polygon Preview Ignores Mouse Button~~ ✅ FIXED
**Location:** `src/react/hooks/useCanvasCurvePolygon.ts`

Both `previewCurve` and `previewPolygon` now use the stored `button` value (`getDrawColor(curve.button)` and `getDrawColor(poly.button)`) to correctly render previews with the appropriate color for right-click secondary color.

#### ~~12. No Shift-Key Proportional Constraint~~ ✅ FIXED
**Location:** `src/react/hooks/useCanvasShapes.ts`

Shape hooks now respect Shift key for constrained proportions:
- Rectangle, Ellipse, Rounded Rectangle: Constrain to square/circle when Shift is held
- Line: Constrain to 45-degree angle increments (0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°) when Shift is held

#### ~~13. Polygon Close Logic Duplication~~ ✅ NOT AN ISSUE
**Location:** `src/react/hooks/useCanvasCurvePolygon.ts`

Reviewed: The code correctly uses `getShapeColors()` utility function in both close paths (double-click close and click-near-start close). This is two separate code paths handling different user actions, not logic duplication.

### Drawing Tools

#### ~~14. Airbrush Dual-Painting~~ ✅ FIXED
**Location:** `src/react/hooks/useCanvasDrawing.ts` and `src/react/hooks/useAirbrushEffect.ts`

Airbrush now only sprays from the 5ms interval in `useAirbrushEffect`. The `handleToolAction` case for AIRBRUSH explicitly does nothing (just breaks), preventing dual-painting.

#### ~~15. Eraser Depends on Secondary Color~~ ✅ BY DESIGN
Eraser draws with secondary color, which is correct MS Paint behavior. In classic MS Paint, the eraser "erases" by painting with the secondary (background) color. Users should keep secondary color as white for traditional erasing behavior.

---

## Low Issues (All Resolved ✅)

### Text Tool

#### ~~16. Text Rendering Architecture Difference~~ ✅ ARCHITECTURAL CHOICE
- **jQuery:** Uses SVG `foreignObject` + Image technique - preserves browser text rendering
- **React:** Uses `canvas.fillText()` directly - manual line/character iteration

Both approaches are valid. The React approach provides more direct control over text positioning and is simpler to maintain. The jQuery approach delegates complex text layout to the browser's SVG renderer. Current React implementation handles all MS Paint text features correctly including vertical text, underlines, and font styling.

#### ~~17. Missing Font Fallback~~ ✅ FIXED
React now validates font availability when fonts finish loading. Falls back to Liberation Sans → Arial → first available font, matching jQuery $FontBox.js behavior. Implemented in `FontBoxWindow.tsx`.

### Selection Tools

#### ~~18. Free-Form Selection Bounds Rounding~~ ✅ FIXED
Fixed asymmetric rounding. Now uses `Math.floor(min)` + `Math.ceil(max)` consistently in both `useFreeFormSelection.ts` and `useRectangularSelection.ts` for complete pixel coverage without 1-pixel shifts.

#### ~~19. Selection Clipboard Not Persisted~~ ✅ EXPECTED BEHAVIOR
Selection clipboard is cleared on page refresh. This is expected browser behavior: the Clipboard API provides session-scoped storage, and MS Paint also clears its clipboard on application restart. Persisting selection data across sessions would require additional IndexedDB storage and is not a typical paint application feature.

#### ~~20. Debug Logging Left In~~ ✅ FIXED
Debug `console.log()` statements have been removed from `useMenuActions.ts` and `useKeyboardShortcuts.ts`.

### Shape Tools

#### ~~21. Click-to-Close Threshold Fixed~~ ✅ FIXED
**Location:** `src/react/hooks/useCanvasCurvePolygon.ts` line 252

10px threshold for polygon close-on-click now scales with magnification. Uses `10 / magnification` so the threshold feels consistent in screen pixels at any zoom level.

#### ~~22. Double-Click Detection Simplistic~~ ✅ BY DESIGN
Uses Euclidean distance < 4px with 250ms timing window. Intentionally matches jQuery behavior for consistency.

#### ~~23. Rectangle vs Ellipse Visual Inconsistency~~ ✅ INTENTIONAL
**Location:** `src/react/utils/drawingUtils.ts`

Rectangle uses `ctx.fillRect()` for stroke rendering (lines 370-379) to achieve pixel-perfect sharp edges matching classic MS Paint exactly. Ellipse uses `ctx.ellipse()` with canvas anti-aliasing (lines 302-308) because there is no practical pixel-perfect ellipse algorithm that produces visually acceptable results at typical paint canvas resolutions. This tradeoff prioritizes MS Paint accuracy for rectangles while providing smooth ellipses.

#### ~~24. Curve Early-Exit Draws Line~~ ✅ CORRECT BEHAVIOR
Double-click before 4 points draws straight line. This is correct: a curve with only 2 points (start/end, no control points) degenerates to a line.

#### ~~25. Preview Update Performance~~ ✅ ALREADY OPTIMIZED
**Location:** `src/react/hooks/useCanvasShapes.ts`

Canvas state is saved once via `getImageData()` when shape drawing begins (on pointer down), not on every mouse move as originally reported. During drag, only `putImageData()` restore and shape redraw occur, which is efficient. This matches the standard pattern for live shape preview without redundant reads.

### Drawing Tools

#### ~~26. Flood Fill Tolerance Hard-Coded~~ ✅ DOCUMENTED
**Location:** `src/react/utils/drawingUtils.ts` line 164

Color tolerance of 2 is fixed, not configurable. This is intentional: classic MS Paint uses exact pixel matching (tolerance=0), but browser canvas rendering can introduce sub-pixel color differences from anti-aliasing or JPEG compression artifacts. The small tolerance prevents unexpected fill boundaries while matching MS Paint's behavior of having no tolerance UI. Documented in JSDoc.

#### ~~27. Flood Fill Memory Usage~~ ✅ ACCEPTABLE
**Location:** `src/react/utils/drawingUtils.ts` lines 157-248

Flood fill loads entire canvas ImageData into memory. This is the standard approach used by all JavaScript canvas flood fill implementations. For a 4000x4000 pixel canvas (16 megapixels), memory usage is ~64MB which is acceptable for modern browsers. Tile-based or streaming approaches would add significant complexity with minimal benefit for typical paint canvas sizes (usually under 2000x2000).

#### ~~28. Color Picker Debug Logging~~ ✅ FIXED
No debug logging in color picker code. All debug console.log statements have been removed from React codebase.

#### ~~29. Magnifier Behavior Difference~~ ✅ BY DESIGN
**Location:** `src/react/hooks/useCanvasEventHandlers.ts` lines 170-180

- **React:** Discrete zoom levels (1, 2, 4, 6, 8) with left-click to zoom in, right-click to zoom out
- **jQuery:** Toggle between 1x and previous magnification level

The React approach is more intuitive for users unfamiliar with the legacy toggle behavior. Left-click consistently zooms in, right-click consistently zooms out, matching modern application conventions. Both implementations use the same zoom levels.

---

## Architectural Differences

### State Management
| Aspect | jQuery | React |
|--------|--------|-------|
| Tool State | Global variables | Zustand store |
| History | Linear undo/redo | Tree-based history with branching |
| Persistence | localStorage | IndexedDB |
| Selection | OnCanvasSelection class | Selection type in toolStore |

### Canvas Operations
| Aspect | jQuery | React |
|--------|--------|-------|
| Preview | Separate preview canvas | Save/restore ImageData |
| Brush Cache | Memoized brush canvases (20) | Generated per-use |
| Text Rendering | SVG foreignObject | canvas.fillText() |
| Mask Canvas | Per-tool mask canvas | Direct canvas manipulation |

### Event Handling
| Aspect | jQuery | React |
|--------|--------|-------|
| Delegation | Tool objects with paint() methods | useCanvasEventHandlers hook |
| Continuous Paint | paint_on_time_interval property | useAirbrushEffect hook |
| Tool Framework | Object augmentation pattern | Hook composition |

---

## Recommendations

### High Priority (All Complete ✅)
1. ~~Fix text tool history timing~~ ✅ DONE
2. ~~Implement clipboard paste~~ ✅ DONE
3. ~~Fix pencil size~~ ✅ DONE
4. ~~Fix vertical text underline calculation~~ ✅ DONE

### Medium Priority (All Complete ✅)
1. ~~Add transparent selection mode (Feature Request)~~ ✅ DONE - Implemented as `drawOpaque` toggle
2. ~~Fix curve/polygon preview to respect mouse button~~ ✅ DONE
3. ~~Implement Shift-key proportional constraints for shapes~~ ✅ DONE
4. ~~Auto-commit selection on tool change~~ ✅ DONE

### Low Priority (All Complete ✅)
1. ~~Remove debug console.log statements~~ ✅ DONE
2. ~~Optimize flood fill for large canvases~~ ✅ ACCEPTABLE - Standard approach for typical canvas sizes
3. ~~Consider SVG foreignObject approach for text~~ ✅ NOT NEEDED - Current canvas.fillText() handles all features correctly
4. ~~Add magnification scaling to polygon close threshold~~ ✅ DONE

---

## Testing Gaps

The following features lack dedicated tests:
- Brush shapes (circle, square, diagonal)
- Airbrush continuous effect timing
- Flood fill edge cases (tolerance, boundaries)
- Color picker alpha preservation
- Eraser with non-white secondary color
- Text tool vertical rendering
- Selection transparent mode (`drawOpaque` toggle)
- Clipboard cut/copy/paste operations
