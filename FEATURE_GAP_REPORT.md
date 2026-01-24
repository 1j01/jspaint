# MCPaint React vs jQuery Implementation - Feature Gap Report

This document compares the React implementation (`/new/`) with the legacy jQuery implementation (`/old/`) to identify missing features, bugs, and implementation differences.

## Summary

| Category | Critical Issues | Medium Issues | Low Issues |
|----------|----------------|---------------|------------|
| Text Tool | 2 | 3 | 2 |
| Selection Tools | 2 | 2 | 3 |
| Shape Tools | 0 | 3 | 5 |
| Drawing Tools | 1 | 2 | 4 |
| **Total** | **5** | **10** | **14** |

---

## Critical Issues

### 1. Text Tool - History Saved at Wrong Time
**Location:** `src/react/hooks/useCanvasTextBox.ts`

The React implementation saves history state when the text box is **created**, not when text is **committed** to canvas. This breaks undo/redo behavior.

**Expected:** History saved after text is finalized to canvas
**Actual:** History saved when text box opens (empty state)

**Impact:** Undo after typing text reverts to empty text box state, not previous canvas state.

### 2. Text Tool - Vertical Text Underline Broken
**Location:** `src/react/hooks/useCanvasTextBox.ts` lines 168-174

Underline for vertical text renders outside the text box due to incorrect coordinate calculation.

```typescript
// Current (broken):
const underlineX = textX + metrics.actualBoundingBoxAscent + 2;
// Should calculate based on vertical character position
```

### 3. Selection - Paste Not Implemented
**Location:** `src/react/hooks/useMenuActions.ts` lines 179-181

`editPaste()` calls `paste()` but doesn't create a floating selection from clipboard data.

```typescript
// Current:
editPaste: () => { paste(); } // Returns ImageData but doesn't use it

// jQuery version creates selection:
const selection = new OnCanvasSelection(x, y, image.width, image.height, image);
```

### 4. Selection - Cut Incomplete
**Location:** `src/react/hooks/useClipboard.ts` lines 38-43

`cut()` copies to clipboard but doesn't clear the selection from canvas.

### 5. Pencil Size Setting Unused
**Location:** `src/react/hooks/useCanvasDrawing.ts` line 215

Pencil always draws at 1 pixel despite `pencilSize` setting existing in the store.

```typescript
// Current (ignores setting):
drawLine(ctx, prevX, prevY, x, y, color, 1);

// Should be:
drawLine(ctx, prevX, prevY, x, y, color, pencilSize);
```

---

## Medium Issues

### Text Tool

#### 6. Underline Preview/Commit Inconsistency
**Location:** `src/react/components/CanvasTextBox.tsx` vs `src/react/hooks/useCanvasTextBox.ts`

Preview uses `ctx.stroke()` (line-based) while commit uses `ctx.fillRect()` (filled rectangle). Visual mismatch between preview and result.

#### 7. Minimum Text Box Size Too Large
Text box minimum size is 50x20 pixels, which is too large for single character input.

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

#### 10. Selection Not Auto-Committed on Tool Change
When user switches tools, floating selection remains. jQuery auto-commits selection when switching away.

### Shape Tools

#### 11. Curve/Polygon Preview Ignores Mouse Button
**Location:** `src/react/hooks/useCanvasCurvePolygon.ts` lines 172, 282

Preview always uses primary color. Should respect `getDrawColor(button)` for right-click secondary color.

#### 12. No Shift-Key Proportional Constraint
Neither shape hooks respect Shift key for constrained proportions (square rectangle, circle ellipse, 45-degree lines).

#### 13. Polygon Close Logic Duplication
**Location:** `src/react/hooks/useCanvasCurvePolygon.ts` lines 251-252 vs 224

Duplicates `getShapeColors()` logic instead of calling the utility function.

### Drawing Tools

#### 14. Airbrush Dual-Painting
**Location:** `src/react/hooks/useAirbrushEffect.ts`

Airbrush sprays both on mouse move AND from 5ms interval simultaneously, creating denser coverage than intended.

#### 15. Eraser Depends on Secondary Color
Eraser draws with secondary color, not true pixel deletion. If secondary color is non-white, eraser paints instead of erases. No validation or warning.

---

## Low Issues

### Text Tool

#### 16. Text Rendering Architecture Difference
- **jQuery:** Uses SVG `foreignObject` + Image technique - preserves browser text rendering
- **React:** Uses `canvas.fillText()` directly - manual line/character iteration

jQuery approach is more robust for complex text layouts.

#### 17. Missing Font Fallback
React doesn't handle font loading failures. jQuery has fallback mechanisms.

### Selection Tools

#### 18. Free-Form Selection Bounds Rounding
Uses asymmetric rounding (`Math.floor` for min, `Math.round` for dimensions) which could cause 1-pixel shifts.

#### 19. Selection Clipboard Not Persisted
Clipboard cleared on page refresh. Expected behavior but worth noting.

#### 20. Debug Logging Left In
**Location:** `src/react/utils/selectionDrawing.ts` line 17, `src/react/hooks/useSelectionAnimation.ts` line 71

`console.log()` statements should be removed.

### Shape Tools

#### 21. Click-to-Close Threshold Fixed
**Location:** `src/react/hooks/useCanvasCurvePolygon.ts` line 246

10px threshold for polygon close-on-click. Doesn't scale with magnification.

#### 22. Double-Click Detection Simplistic
Uses Euclidean distance with fixed timing. Could create false positives.

#### 23. Rectangle vs Ellipse Visual Inconsistency
Rectangle uses filled rectangles for sharp edges. Ellipse uses canvas stroke (anti-aliased). Intentional but creates visual inconsistency.

#### 24. Curve Early-Exit Draws Line
Double-click before 4 points draws straight line, not current curve state.

#### 25. Preview Update Performance
Full canvas `getImageData()` on every preview move. Could be slow on large canvases.

### Drawing Tools

#### 26. Flood Fill Tolerance Hard-Coded
**Location:** `src/react/utils/drawingUtils.ts` line 164

Color tolerance of 2 is fixed, not configurable. Some Paint applications allow adjustment.

#### 27. Flood Fill Memory Usage
Loads entire canvas ImageData into memory. Could cause issues on large canvases.

#### 28. Color Picker Debug Logging
**Location:** `src/react/hooks/useCanvasDrawing.ts` lines 253-270

Extensive console.log statements on every color pick should be removed.

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

### High Priority
1. Fix text tool history timing - save state after text commit, not on text box creation
2. Implement clipboard paste - create floating selection from clipboard data
3. Fix pencil size - use `pencilSize` setting from store
4. Fix vertical text underline calculation

### Medium Priority
1. Add transparent selection mode
2. Fix curve/polygon preview to respect mouse button
3. Implement Shift-key proportional constraints for shapes
4. Auto-commit selection on tool change

### Low Priority
1. Remove debug console.log statements
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
