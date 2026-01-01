# Canvas Persistence - Quick Reference

## DO ✅

- **DO** save to IndexedDB during drawing operations (in `Canvas.tsx` `saveHistoryState()`)
- **DO** save to module-level in cleanup (for HMR and component remounts)
- **DO** load from IndexedDB on initial mount
- **DO** check dimension match before restoring from IndexedDB

## DON'T ❌

- **DON'T** save to IndexedDB in React cleanup functions
- **DON'T** assume canvas data is valid in cleanup (React may have cleared it)
- **DON'T** restore from IndexedDB if dimensions don't match
- **DON'T** rely on module-level persistence for page refresh recovery

## Key Code Locations

### Primary IndexedDB Save Point
```typescript
// src/react/components/Canvas.tsx
const saveHistoryState = useCallback((operationName: string) => {
    // ... get imageData ...
    saveSetting("savedCanvas", canvasData); // ✅ Save here during drawing
}, [canvasRef, pushTreeState]);
```

### Cleanup (Module-Level Only)
```typescript
// src/react/hooks/useCanvasLifecycle.ts
return () => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    savedCanvasData = imageData; // ✅ Module-level only
    // ❌ DO NOT: saveCanvasToIndexedDB(imageData)
};
```

### IndexedDB Restore
```typescript
// src/react/hooks/useCanvasLifecycle.ts
const persistedCanvas = await loadCanvasFromIndexedDB();
if (persistedCanvas && persistedCanvas.width === canvas.width) {
    ctx.putImageData(persistedCanvas, 0, 0); // ✅ Restore if dimensions match
}
```

## Bug Symptoms

### Canvas goes blank after 2+ refreshes
**Cause**: Saving corrupted data in cleanup
**Fix**: Don't save to IndexedDB in cleanup (already fixed)

### Canvas doesn't restore after refresh
**Cause**: Dimension mismatch or no drawing operations performed
**Fix**: Draw something, then refresh (drawing triggers IndexedDB save)

### Canvas flickers on HMR
**Cause**: Module-level variable cleared on HMR
**Fix**: This is expected behavior during development

## Testing Checklist

- [ ] Draw on canvas, refresh page → canvas restores
- [ ] Draw, refresh 3+ times → canvas still there
- [ ] Draw, resize canvas, refresh → new blank canvas (dimension mismatch)
- [ ] Draw, trigger HMR → canvas preserved (module-level)
- [ ] New session, no drawing → white canvas initialized

## See Also

- [CANVAS_PERSISTENCE.md](./CANVAS_PERSISTENCE.md) - Full documentation
- [useCanvasLifecycle.ts](../src/react/hooks/useCanvasLifecycle.ts) - Implementation with detailed comments
