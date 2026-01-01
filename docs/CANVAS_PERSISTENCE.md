# Canvas Persistence Architecture

This document explains how MCPaint persists canvas state across component remounts and page refreshes.

## Overview

MCPaint uses a **two-tier persistence strategy** to handle different scenarios:

1. **Module-Level Persistence** (in-memory) - for React component remounts
2. **IndexedDB Persistence** (browser storage) - for page refreshes

## Two-Tier Persistence Strategy

### 1. Module-Level Persistence

**Purpose**: Preserve canvas state during React component lifecycle events

**Storage Location**: Module-level variable `savedCanvasData` in `useCanvasLifecycle.ts`

**Lifetime**: Single page session only (cleared on page refresh)

**When Saved**:
- In the cleanup function when Canvas component unmounts

**When Restored**:
- On Canvas component remount if data is available

**Use Cases**:
- Hot module reloading during development
- React Strict Mode double-mounting
- Component re-renders that cause unmount/remount

### 2. IndexedDB Persistence

**Purpose**: Persist canvas state across page refreshes and browser sessions

**Storage Location**: Browser IndexedDB with key `"savedCanvas"`

**Lifetime**: Survives page reloads, persists until manually cleared

**When Saved**:
- During drawing operations via `Canvas.tsx` `saveHistoryState()` function
- After every tool operation (pencil stroke, fill, shape drawing, etc.)

**When Restored**:
- On initial mount after page refresh
- Only if dimensions match saved data

**Use Cases**:
- User refreshes the page
- Browser crash recovery
- Returning to the app after closing tab

## Critical Implementation Details

### Why We Don't Save to IndexedDB in Cleanup

**The Problem**: React lifecycle and canvas DOM clearing

When a React component unmounts, the cleanup function runs. However, React may clear the canvas DOM *before* the cleanup function executes. If we call `ctx.getImageData()` after the canvas has been cleared, we get empty/transparent pixels instead of the actual drawing.

**The Bug**: Corrupted data overwrites valid data

```
Timeline of the bug:
1. User draws on canvas
2. saveHistoryState() saves valid data to IndexedDB ✅
3. User refreshes page
4. React cleanup runs
5. Canvas DOM is already cleared by React ⚠️
6. ctx.getImageData() returns empty pixels ❌
7. If we save this to IndexedDB, we overwrite the valid drawing ❌
8. Next page load restores blank canvas ❌
```

**The Solution**: Only save to IndexedDB during active drawing

```typescript
// ❌ WRONG - Do NOT save to IndexedDB in cleanup
return () => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    saveCanvasToIndexedDB(imageData); // May save corrupted data!
};

// ✅ CORRECT - Only save during drawing operations
function saveHistoryState(operationName: string) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    saveSetting("savedCanvas", imageData); // Canvas has valid data here
}
```

## Code Organization

### Files Involved

1. **`useCanvasLifecycle.ts`**
   - Manages canvas initialization and module-level persistence
   - Loads from IndexedDB on mount
   - Saves to module-level on cleanup (NOT IndexedDB!)

2. **`Canvas.tsx`**
   - Contains `saveHistoryState()` function
   - PRIMARY save point for IndexedDB persistence
   - Called after every drawing operation

3. **`canvasStore.ts`**
   - Stores canvas dimensions in IndexedDB
   - Provides `loadPersistedCanvasState()` to restore dimensions

4. **`persistence.ts`**
   - Low-level IndexedDB wrapper functions
   - `saveSetting()` and `loadSetting()`

### Initialization Flow

```
App Mount
  ↓
StoreInitializer
  ↓
useInitializeStores() - Load canvas dimensions from IndexedDB
  ↓
Canvas Component Mounts
  ↓
useCanvasLifecycle runs
  ↓
Check if canvas has content (from fileOpen, etc.)
  ↓ (if no content)
Check module-level savedCanvasData
  ↓ (if not available)
Load from IndexedDB
  ↓ (if dimensions match)
Restore ImageData to canvas ✅
  ↓ (if no saved data)
Initialize with white background
```

### Drawing Operation Flow

```
User draws with tool (pencil, fill, etc.)
  ↓
Tool hook performs drawing on canvas
  ↓
Tool hook calls saveHistoryState("Tool Name")
  ↓
saveHistoryState() captures canvas ImageData
  ↓
Saves to history tree
  ↓
Saves to IndexedDB ✅ (valid data saved here)
```

### Page Refresh Flow

```
User refreshes page
  ↓
Canvas component cleanup runs
  ↓
Saves to module-level savedCanvasData only
  ↓ (NOT to IndexedDB - may be corrupted)
Page reloads
  ↓
useInitializeStores() loads canvas dimensions
  ↓
useCanvasLifecycle runs
  ↓
Loads from IndexedDB (still has valid data from last drawing operation) ✅
  ↓
Canvas restored successfully
```

## Testing the Persistence

### Manual Testing Steps

1. **Test Module-Level Persistence**:
   - Draw something on canvas
   - Trigger HMR by editing a source file
   - Canvas should remain unchanged

2. **Test IndexedDB Persistence**:
   - Draw something on canvas
   - Hard refresh page (Ctrl+Shift+R)
   - Canvas should restore the drawing
   - Refresh multiple times - drawing should persist

3. **Test Dimension Mismatch**:
   - Draw something on 480×320 canvas
   - Change canvas size to 640×480
   - Refresh page
   - Canvas should initialize with white background (dimension mismatch)

### Common Issues

**Issue**: Canvas becomes blank after multiple refreshes

**Cause**: IndexedDB was being saved in cleanup function with corrupted data

**Fix**: Only save to IndexedDB during drawing operations (current implementation)

---

**Issue**: Canvas doesn't restore after page refresh

**Cause**: Canvas dimensions don't match saved ImageData dimensions

**Solution**: Check browser console for dimension mismatch warnings

---

**Issue**: Canvas state lost during development (HMR)

**Cause**: Module-level variable was cleared

**Solution**: This is expected - module-level persistence only works within same page session

## Future Improvements

- Add automatic dimension scaling when loading mismatched ImageData
- Implement checksum validation to detect corrupted data
- Add timestamp-based cleanup of old IndexedDB entries
- Consider using SharedWorker for cross-tab synchronization

## References

- `src/react/hooks/useCanvasLifecycle.ts` - Full implementation with detailed comments
- `src/react/components/Canvas.tsx` - `saveHistoryState()` function
- `src/react/context/state/persistence.ts` - IndexedDB wrapper
