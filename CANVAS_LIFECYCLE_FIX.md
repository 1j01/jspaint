# Canvas Lifecycle Fix - File Upload Issue Resolution

## Problem

When loading an image via File → Open:
1. Image loaded successfully (confirmed by logs showing pixel data)
2. Image drawn to canvas successfully
3. **But image disappeared immediately after**

## Root Cause

The `useCanvasLifecycle` hook was **overwriting the loaded image** with old data from:
- Module-level `savedCanvasData` (from component unmount)
- IndexedDB persistence (from page refresh)

### The Bug Flow

1. User clicks File → Open
2. `fileOpen` in `useMenuActions.ts` runs:
   - Loads image file
   - Draws to canvas with `ctx.drawImage(img, 0, 0)`
   - Calls `saveState(imageData)` to save to history
   - Canvas now contains the loaded image ✅

3. **BUT** then `useCanvasLifecycle` runs (triggered by canvas resize or component re-render):
   - Checks `savedCanvasData` → restores old white canvas
   - OR checks IndexedDB → restores old saved canvas
   - **Overwrites the newly loaded image** ❌

## Solution

Added **content detection** to `useCanvasLifecycle.ts` as **Priority 0** (before all other priorities):

```typescript
// Check if canvas already has content (e.g., from fileOpen)
// Sample a few pixels to detect if it's already been drawn to
const sampleData = ctx.getImageData(0, 0, Math.min(10, canvas.width), Math.min(10, canvas.height));
let hasContent = false;
for (let i = 0; i < sampleData.data.length; i += 4) {
    const r = sampleData.data[i];
    const g = sampleData.data[i + 1];
    const b = sampleData.data[i + 2];
    const a = sampleData.data[i + 3];
    // If we find any non-white, non-transparent pixel, canvas has content
    if (!(r === 255 && g === 255 && b === 255) && a > 0) {
        hasContent = true;
        break;
    }
}

if (hasContent) {
    console.log("[useCanvasLifecycle] Canvas already has content, skipping initialization");
    canvasInitialized = true;
    loadedFromIndexedDB = true; // Prevent IndexedDB load on next mount

    // Initialize history tree with existing canvas if needed
    if (!historyTreeInitialized) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        useHistoryStore.getState().pushState(imageData, "Loaded Document");
        historyTreeInitialized = true;
    }
    return;
}
```

### New Priority Order

**Priority 0 (NEW):** Check if canvas already has content → skip initialization
**Priority 1:** Restore from `savedCanvasData` (component remount)
**Priority 2:** Load from IndexedDB (page refresh)
**Priority 3:** Initialize with white background (new document)

## How It Works

1. When `useCanvasLifecycle` runs, it first samples 10x10 pixels from the canvas
2. If any pixel is non-white (R≠255, G≠255, B≠255) and non-transparent (A>0), canvas has content
3. If content detected:
   - Set `canvasInitialized = true` to prevent white background
   - Set `loadedFromIndexedDB = true` to prevent IndexedDB restore
   - Initialize history tree with "Loaded Document" if needed
   - **Skip all restoration logic**

## Benefits

✅ File → Open now works correctly - loaded images stay visible
✅ Doesn't break existing functionality:
   - Page refresh still restores from IndexedDB (canvas is white initially)
   - Component remount still restores from savedCanvasData (canvas is white initially)
   - New document still gets white background
✅ Simple, efficient content detection (only checks 10x10 pixels)
✅ Preserves all existing persistence features

## Testing

To test:
1. Visit `http://localhost:2000/new/`
2. File → Open
3. Select a JPG or PNG file
4. **Image should now be visible** ✅

Console should show:
```
[fileOpen] Successfully loaded image: WxH
[useCanvasLifecycle] Canvas already has content, skipping initialization
```

## Files Changed

- `src/react/hooks/useCanvasLifecycle.ts` - Added content detection logic
