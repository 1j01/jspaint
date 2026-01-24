# MCPaint React vs jQuery Implementation - Feature Gap Report

This document compares the React implementation (`/new/`) with the legacy jQuery implementation (`/old/`) to identify missing features, bugs, and implementation differences.

## Summary

| Category | Critical Issues | Medium Issues | Low Issues |
|----------|----------------|---------------|------------|
| Text Tool | 0 ✅ | 1 | 2 |
| Selection Tools | 0 ✅ | 1 | 2 |
| Shape Tools | 0 ✅ | 0 ✅ | 4 |
| Drawing Tools | 0 ✅ | 0 ✅ | 3 |
| **Total** | **0** ✅ | **2** | **11** |

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

## Medium Issues

### Text Tool

#### ~~6. Underline Preview/Commit Inconsistency~~ ✅ FIXED
**Location:** `src/react/components/CanvasTextBox.tsx` and `src/react/hooks/useCanvasTextBox.ts`

Both preview and commit now use `ctx.fillRect()` for underline rendering, ensuring visual consistency between preview and final result.

#### ~~7. Minimum Text Box Size Too Large~~ ✅ FIXED
**Location:** `src/react/hooks/useCanvasTextBox.ts`

Text box minimum size is now 20x10 pixels (was reported as 50x20), which is reasonable for single character input.

#### 8. Vertical Text Hidden in Textarea
Vertical text uses `color: transparent` to hide textarea content, but this prevents selection highlighting from showing.

### Selection Tools

#### 9. No Transparent Selection Mode
**jQuery feature missing in React**

jQuery supports `tool_transparent_mode` that treats background color as transparent within selections. React has no equivalent.

```javascript
// jQuery implementation (OnCanvasSelection.js):
if (tool_transparent_mode) {
    // Pixels matching background become transparent
}
```

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

## Low Issues

### Text Tool

#### 16. Text Rendering Architecture Difference
- **jQuery:** Uses SVG `foreignObject` + Image technique - preserves browser text rendering
- **React:** Uses `canvas.fillText()` directly - manual line/character iteration

jQuery approach is more robust for complex text layouts.

#### ~~17. Missing Font Fallback~~ ✅ FIXED
React now validates font availability when fonts finish loading. Falls back to Liberation Sans → Arial → first available font, matching jQuery $FontBox.js behavior. Implemented in `FontBoxWindow.tsx`.

### Selection Tools

#### ~~18. Free-Form Selection Bounds Rounding~~ ✅ FIXED
Fixed asymmetric rounding. Now uses `Math.floor(min)` + `Math.ceil(max)` consistently in both `useFreeFormSelection.ts` and `useRectangularSelection.ts` for complete pixel coverage without 1-pixel shifts.

#### 19. Selection Clipboard Not Persisted
Clipboard cleared on page refresh. Expected behavior but worth noting.

#### ~~20. Debug Logging Left In~~ ✅ FIXED
Debug `console.log()` statements have been removed from `useMenuActions.ts` and `useKeyboardShortcuts.ts`.

### Shape Tools

#### ~~21. Click-to-Close Threshold Fixed~~ ✅ FIXED
**Location:** `src/react/hooks/useCanvasCurvePolygon.ts` line 252

10px threshold for polygon close-on-click now scales with magnification. Uses `10 / magnification` so the threshold feels consistent in screen pixels at any zoom level.

#### 22. Double-Click Detection Simplistic
Uses Euclidean distance with fixed timing. Could create false positives.

#### 23. Rectangle vs Ellipse Visual Inconsistency
Rectangle uses filled rectangles for sharp edges. Ellipse uses canvas stroke (anti-aliased). Intentional but creates visual inconsistency.

#### 24. Curve Early-Exit Draws Line
Double-click before 4 points draws straight line, not current curve state.

#### 25. Preview Update Performance
Full canvas `getImageData()` on every preview move. Could be slow on large canvases.

### Drawing Tools

#### ~~26. Flood Fill Tolerance Hard-Coded~~ ✅ DOCUMENTED
**Location:** `src/react/utils/drawingUtils.ts` line 164

Color tolerance of 2 is fixed, not configurable. This is intentional: classic MS Paint uses exact pixel matching (tolerance=0), but browser canvas rendering can introduce sub-pixel color differences from anti-aliasing or JPEG compression artifacts. The small tolerance prevents unexpected fill boundaries while matching MS Paint's behavior of having no tolerance UI. Documented in JSDoc.

#### 27. Flood Fill Memory Usage
Loads entire canvas ImageData into memory. Could cause issues on large canvases.

#### ~~28. Color Picker Debug Logging~~ ✅ FIXED
No debug logging in color picker code. All debug console.log statements have been removed from React codebase.

#### 29. Magnifier Behavior Difference
- **React:** Discrete zoom levels (1, 2, 4, 6, 8) with left-click in/right-click out
- **jQuery:** Toggle between 1x and previous magnification level

Both are valid but different from each other.

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

### Medium Priority
1. Add transparent selection mode (Feature Request)
2. ~~Fix curve/polygon preview to respect mouse button~~ ✅ DONE
3. ~~Implement Shift-key proportional constraints for shapes~~ ✅ DONE
4. ~~Auto-commit selection on tool change~~ ✅ DONE

### Low Priority
1. ~~Remove debug console.log statements~~ ✅ DONE
2. Optimize flood fill for large canvases
3. Consider SVG foreignObject approach for text (more robust)
4. Add magnification scaling to polygon close threshold

---

## Testing Gaps

The following features lack dedicated tests:
- Brush shapes (circle, square, diagonal)
- Airbrush continuous effect timing
- Flood fill edge cases (tolerance, boundaries)
- Color picker alpha preservation
- Eraser with non-white secondary color
- Text tool vertical rendering
- Selection transparency mode
- Clipboard cut/copy/paste operations
