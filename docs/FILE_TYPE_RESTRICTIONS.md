# File Type Restrictions

## Supported File Formats for Opening

MCPaint now restricts file opening to the following well-supported formats:

- **PNG** (.png) - Portable Network Graphics
- **JPEG** (.jpg, .jpeg) - Joint Photographic Experts Group
- **BMP** (.bmp) - Bitmap Image File

These are the core image formats that MS Paint supports and are well-tested in the application.

## Where Restrictions Apply

### 1. File > Open
Located in: `src/react/hooks/useMenuActions.ts` (fileOpen function)

```typescript
input.accept = ".png,.jpg,.jpeg,.bmp,image/png,image/jpeg,image/bmp";
```

### 2. Edit > Paste From
Located in: `src/react/hooks/useMenuActions.ts` (editPasteFrom function)

```typescript
input.accept = ".png,.jpg,.jpeg,.bmp,image/png,image/jpeg,image/bmp";
```

## Where Restrictions Do NOT Apply

### File > Load From URL
The LoadFromUrlDialog allows any URL to be entered. The browser will attempt to load whatever format is provided. This is intentional to maintain flexibility for web-based images.

### Paste from Clipboard
Direct clipboard paste (Ctrl+V) is handled by the browser and supports whatever image formats the clipboard contains.

## Technical Details

The `accept` attribute uses both:
- **File extensions**: `.png,.jpg,.jpeg,.bmp` - User-friendly filter in file picker
- **MIME types**: `image/png,image/jpeg,image/bmp` - Explicit format specification

This dual approach ensures:
- File picker shows only compatible files
- Users cannot accidentally select unsupported formats
- Browser correctly identifies acceptable file types

## Future Considerations

If additional formats need to be supported in the future:

1. Add the extension and MIME type to the accept string
2. Test thoroughly with the canvas loading logic
3. Update this documentation
4. Consider adding format conversion if needed

### Potentially Supportable Formats
- **GIF** (.gif) - Simple animation support exists in browser
- **WebP** (.webp) - Modern format with good browser support
- **TIFF** (.tif, .tiff) - Professional format (may need library)

Note: Before adding formats, verify they work correctly with:
- Canvas.getImageData() / putImageData()
- History/undo system
- Save functionality
- Transparent image handling
