# File Upload Debugging Guide

## Changes Made

I've added comprehensive error handling to the `fileOpen` function in `src/react/hooks/useMenuActions.ts`:

### Error Handling Added:
1. **Image loading errors** - Shows alert if image fails to load
2. **File reading errors** - Shows alert if file can't be read
3. **Console logging** - Logs success and failure messages

### How to Test & Debug:

1. **Open the browser console** (F12 or Cmd+Option+I)
2. **Navigate to http://localhost:2000/new/**
3. **Try to open a JPG or PNG file** via File → Open
4. **Check the console for error messages**:
   - `[fileOpen] Successfully loaded image: WxH` = Success ✅
   - `[fileOpen] Failed to load image` = Image format issue
   - `[fileOpen] Failed to read file` = File reading issue
   - `[fileOpen] Canvas ref not available` = React issue
   - `[fileOpen] Could not get 2d context` = Canvas API issue

## Common Issues & Solutions

### Issue: File dialog doesn't open
- **Check**: Browser console for JavaScript errors
- **Fix**: Make sure you're clicking File → Open in the menu

### Issue: File selected but nothing happens
- **Check**: Console for error messages
- **Possible causes**:
  1. Canvas ref not initialized
  2. Invalid image format
  3. File too large
  4. CORS issues (if loading from URL)

### Issue: Image loads but canvas stays white
- **Check**: `setCanvasSize` is being called correctly
- **Check**: Canvas dimensions in console log
- **Possible fix**: The canvas might need a manual refresh

## Testing Steps:

1. **Test with a small PNG** (< 1MB)
   - Should work without issues

2. **Test with a JPG**
   - Should work without issues

3. **Test with a large image** (> 5MB)
   - Might be slow but should work

4. **Check console output**:
   ```
   [fileOpen] Successfully loaded image: 800x600
   ```

## If Still Failing:

Please provide:
1. **Exact error message from console**
2. **File type and size** (e.g., "test.jpg, 2.5MB")
3. **What happens** (e.g., "file dialog opens but image doesn't load")

## Temporary Console Logging

Note: I've added console.log/console.error statements specifically for debugging this issue. These help identify exactly where the failure occurs.
