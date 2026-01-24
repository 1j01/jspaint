# CSS Migration Strategy: Legacy jQuery to React

This document outlines a systematic approach to align the React application's CSS with the "more correct" legacy jQuery implementation.

## Current Architecture Comparison

### Legacy App (`/old/index.html`)
```html
<!-- Base styles -->
<link rel="stylesheet" href="/styles/normalize.css">
<link rel="stylesheet" href="/styles/layout.css" class="flippable-layout-stylesheet">
<link rel="stylesheet" href="/lib/os-gui/build/layout.css" class="flippable-layout-stylesheet">
<link rel="stylesheet" href="/lib/98.css/98.custom-build.css" class="flippable-layout-stylesheet not-for-modern">
<!-- Theme loaded dynamically via theme.js -->
```

### React App (`/new/index.html`)
```html
<!-- Base styles -->
<link rel="stylesheet" href="/styles/normalize.css">
<link rel="stylesheet" href="/styles/layout.css" class="flippable-layout-stylesheet">
<link rel="stylesheet" href="/lib/os-gui/build/layout.css" class="flippable-layout-stylesheet">
<link rel="stylesheet" href="/lib/os-gui/build/windows-98.css">
<link rel="stylesheet" href="/lib/98.css/98.custom-build.css" class="flippable-layout-stylesheet not-for-modern">
<link rel="stylesheet" href="/styles/themes/classic.css"> <!-- Statically loaded -->
```

## Key Differences Identified

### 1. CSS Loading Strategy
| Aspect | Legacy | React | Impact |
|--------|--------|-------|--------|
| Theme loading | Dynamic via `theme.js` | Static in `<head>` | No theme switching in React |
| Component CSS | Global namespace | Component-scoped imports | Potential specificity conflicts |
| CSS order | Controlled by runtime | Build-time bundling | Style override issues |

### 2. Component CSS in React
The React app introduces 7 component-scoped CSS files that may conflict with or override legacy global styles:

- `src/react/components/FontBoxWindow.css`
- `src/react/components/SelectWin98.css`
- `src/react/components/CanvasResizeHandles.css`
- `src/react/components/help/HelpWindow.css`
- `src/react/components/dialogs/HistoryTreeDialog.css`
- `src/react/components/dialogs/MessageBoxDialog.css`
- `src/react/styles/select-win98.css` (duplicate?)

### 3. React-Preview CSS Overrides
The file `styles/react-preview.css` contains:
- Modern CSS features (gradients, transitions) not in legacy
- Component-specific styles that may conflict with `layout.css`
- Dialog styling that differs from legacy window patterns

## Migration Strategy

### Phase 1: Audit and Document (Priority: High)

**Goal**: Create a visual diff of all components between legacy and React.

**Steps**:
1. Create a test page showing each component side-by-side (legacy vs React)
2. Screenshot each component at multiple viewport sizes
3. Document specific pixel differences in a spreadsheet

**Key components to audit**:
- [ ] Tool buttons (`.tool` class, borders, pressed state)
- [ ] Color palette (`.colors-component`, `.color-button`, current colors overlay)
- [ ] Tool options panel (`.tool-options`, 41×66px sizing)
- [ ] Status bar (`.status-area`, `.status-field`, font sizing)
- [ ] Canvas area (`.canvas-area`, handles, selection)
- [ ] Dialogs (all 13+ dialogs: attributes, save-as, edit-colors, etc.)
- [ ] Menu system (`.menu-button`, `.menu-item`)
- [ ] Window chrome (titlebar, close button, borders)

### Phase 2: Consolidate CSS Architecture (Priority: High)

**Goal**: Reduce CSS fragmentation and establish clear ownership.

**Approach A: Single Source of Truth (Recommended)**
1. Remove all component-scoped CSS imports from React components
2. Move all React-specific styles into `react-preview.css`
3. Ensure `react-preview.css` only adds styles, never overrides `layout.css`
4. Load CSS in correct order: `layout.css` → theme → `react-preview.css`

**Approach B: Colocated Component Styles**
1. Keep component CSS files but ensure they use BEM-like naming
2. Prefix all React-specific classes with `react-` namespace
3. Never target legacy class names directly from component CSS

### Phase 3: Port Specific Style Rules (Priority: High)

Based on the audit, port these categories from `layout.css` and `themes/classic.css`:

#### 3.1 Tool Grid Styling
```css
/* Legacy (layout.css:357-366 + classic.css:135-198) */
.tool {
    width: 25px;
    height: 25px;
    /* Multi-border system for 3D effect */
    border-right: 1px solid var(--ButtonDkShadow);
    border-bottom: 1px solid var(--ButtonDkShadow);
}
.tool:before { /* Inner border layer */ }
.tool.selected { /* Pressed state borders */ }
```
**React status**: Likely missing the `::before` pseudo-element borders.

#### 3.2 Color Component Layout
```css
/* Legacy (layout.css:374-452) */
.colors-component.wide { height: 47px; }
.colors-component.tall { width: 47px; }
.color-button { width: 15px; height: 15px; }
.foreground-color { position: absolute; left: 2px; top: 4px; }
.background-color { position: absolute; right: 3px; bottom: 3px; }
```
**React status**: Verify exact pixel positions match.

#### 3.3 Edit Colors Dialog
```css
/* Legacy (layout.css:454-580) */
.edit-colors-window .color-grid {
    width: 222px;
    grid-template-columns: repeat(8, 16px);
    grid-gap: 5px 9px;
}
.edit-colors-window .swatch { width: 16px; height: 13px; }
```
**React status**: Check `EditColorsDialog.tsx` styling matches.

#### 3.4 Tool Options Panel
```css
/* Legacy (layout.css:346-356) */
.tool-options {
    width: 41px;
    height: 66px;
    margin-top: 3px;
}
```
**React status**: `react-preview.css` overrides this; verify consistency.

#### 3.5 Status Area
```css
/* Legacy (classic.css:109-121) */
.status-area {
    gap: 2px;
    font-family: "Segoe UI", sans-serif;
    font-size: 12px;
    padding-top: 2px;
}
.status-field { height: 21px; }
```

#### 3.6 Canvas Handles
```css
/* Legacy (layout.css:632-646 + classic.css:94-107) */
.canvas-area .handle { width: 3px; height: 3px; }
.canvas-area .handle { background: var(--Hilight); }
.canvas-area .useless-handle { /* grayed-out handles */ }
```

### Phase 4: Theme System Migration (Priority: Medium)

**Goal**: Enable dynamic theme switching in React.

**Options**:

**Option A: Port theme.js to React hook**
```typescript
// useTheme.ts
function useTheme() {
    const [theme, setTheme] = useState('classic');

    useEffect(() => {
        // Dynamically load theme CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `/styles/themes/${theme}.css`;
        document.head.appendChild(link);
        return () => link.remove();
    }, [theme]);

    return { theme, setTheme };
}
```

**Option B: CSS Custom Properties**
1. Extract all theme-specific values to CSS variables
2. Create a theme context that sets `--theme-*` variables on `:root`
3. All components read from CSS variables

### Phase 5: RTL Support (Priority: Low)

**Current state**: Both apps use RTLCSS via `class="flippable-layout-stylesheet"`.

**Migration tasks**:
1. Ensure React components respect `direction: rtl` from i18n
2. Verify `/*rtl:ignore*/` directives are preserved in critical areas (canvas, tool icons)
3. Test RTL layout with Arabic/Hebrew languages

### Phase 6: Remove React-Specific Overrides (Priority: Medium)

After Phase 3, review `react-preview.css` and remove:
- Any rules that duplicate `layout.css` (now correctly applied)
- Modern CSS "enhancements" that deviate from Win98 aesthetic
- Gradient backgrounds (should be solid colors)
- Transition animations (should be instant)
- Drop shadows on dialogs (should use Win98 border system)

---

## Dialog Migration (Priority: CRITICAL)

**This is the highest-priority issue.** React dialogs deviate significantly from legacy styling due to three fundamental problems:

### Problem 1: Missing Legacy Class Names

React's `Dialog.tsx` uses generic classes:
```tsx
// Current (WRONG)
<div className={`window os-window focused dialog ${className || ""}`}>
```

Legacy CSS expects dialog-specific class names like:
- `.dialog-window` - Base dialog styling
- `.attributes-window` - Attributes dialog
- `.save-as` - Save As dialog
- `.edit-colors-window` - Edit Colors dialog
- `.stretch-skew-window` - Stretch/Skew dialog
- etc.

**Fix**: Every dialog must pass its specific class name(s) to the Dialog component.

### Problem 2: Inline Styles Instead of CSS Classes

React dialogs use extensive inline styles that bypass legacy CSS entirely:

```tsx
// Current (WRONG) - from SaveAsDialog.tsx
<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
  <label style={{ display: "block", marginBottom: "4px" }}>

// Current (WRONG) - from AttributesDialog.tsx
<fieldset style={{ marginTop: "6px" }}>
  <div style={{ display: "flex", gap: "12px" }}>
```

**Fix**: Remove all inline styles and rely on CSS classes from `layout.css`.

### Problem 3: Wrong Markup Structure

Legacy dialogs follow a specific form structure that CSS selectors expect:

```html
<!-- Legacy structure (CORRECT) -->
<div class="dialog-window attributes-window">
  <div class="window-content">
    <form>
      <div><!-- Form fields --></div>
      <div class="button-group">
        <button>OK</button>
        <button>Cancel</button>
      </div>
    </form>
  </div>
</div>
```

React dialogs often skip the `<form>` wrapper and use custom layouts:

```tsx
// Current (WRONG)
<div className="window-content window-body">
  <div style={{ display: "flex", flexDirection: "column" }}>
    {/* fields */}
  </div>
  <DialogButtons>  {/* Not wrapped in form */}
```

**Fix**: Wrap dialog content in `<form>` elements where appropriate, use `.button-group` for buttons.

---

### Per-Dialog Migration Requirements

| Dialog Component | Required Classes | Required Structure |
|------------------|------------------|-------------------|
| `AttributesDialog.tsx` | `dialog-window attributes-window` | `form > fieldset + .button-group` |
| `SaveAsDialog.tsx` | `dialog-window save-as` | `form > div > label + .button-group` |
| `EditColorsDialog.tsx` | `edit-colors-window` ✅ | Already correct structure |
| `FlipRotateDialog.tsx` | `dialog-window flip-and-rotate-window` | `form > fieldset + .button-group` |
| `StretchSkewDialog.tsx` | `dialog-window stretch-skew-window` | `form > fieldset + .button-group` |
| `CustomZoomDialog.tsx` | `dialog-window zoom-window` | `form > .button-group` |
| `AboutDialog.tsx` | `dialog-window about-paint-window` | Flexible |
| `HistoryTreeDialog.tsx` | `dialog-window history-window` | `.button-group` |
| `LoadFromUrlDialog.tsx` | `dialog-window` | `form > .button-group` |
| `ImgurUploadDialog.tsx` | `dialog-window` | Content varies |
| `ManageStorageDialog.tsx` | `dialog-window` | Content varies |
| `MessageBoxDialog.tsx` | `dialog-window message-box` | `.button-group horizontal` |

---

### Legacy CSS Rules That Must Apply

#### 1. Base Dialog Styling (`layout.css:700-750`)

```css
/* These rules ONLY apply if .dialog-window class is present */
.dialog-window:not(.horizontal-buttons):not(.edit-colors-window) .window-content {
    padding: 10px;
}
.dialog-window:not(.horizontal-buttons):not(.edit-colors-window) .window-content .button-group {
    padding-left: 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
}
.window-content > form {
    display: flex;
    flex-flow: row;
}
```

#### 2. Attributes Dialog (`layout.css:726-780`)

```css
.attributes-window fieldset .fieldset-body {
    display: grid;
    grid-template-columns: calc(80px * 2) 80px;
}
.attributes-window input[type="number"] {
    width: 56px;
}
.attributes-window .units-radios {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
```

#### 3. Save As Dialog (`layout.css:582-611`)

```css
.save-as .window-content > form > div {
    display: flex;
    flex-direction: column;
}
.save-as .window-content > form > div > label {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-left: 10px;
}
.save-as .window-content > form > div > label > input,
.save-as .window-content > form > div > label > select {
    width: calc(100vw - 220px);
    max-width: 230px;
    float: right;
    margin: 5px;
}
.save-as .button-group button {
    margin: 5px;
}
```

#### 4. Edit Colors Dialog (`layout.css:454-580`)

```css
.edit-colors-window .color-grid {
    width: 222px;
    display: grid;
    grid-template-columns: repeat(8, 16px);
    grid-gap: 5px 9px;
}
.edit-colors-window .swatch {
    width: 16px;
    height: 13px;
}
.edit-colors-window .window-content .left-side {
    width: 217px;
    height: 298px;
}
.edit-colors-window .window-content .right-side {
    width: 218px;
    padding-top: 7px;
    padding-left: 10px;
}
.edit-colors-window .window-content .button-group {
    display: flex;
    flex-flow: row;
}
.edit-colors-window .window-content .button-group button {
    min-width: 66px;
    margin: 3px;
}
```

---

### Refactoring Examples

#### Example 1: AttributesDialog.tsx

**Before (WRONG):**
```tsx
<Dialog title="Attributes" isOpen={isOpen} onClose={onClose} width={380}>
  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
    <fieldset style={{ marginTop: "6px" }}>
      <legend>Image</legend>
      <div style={{ display: "flex", gap: "12px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <input type="radio" name="imageType" checked={isOpaque} />
          Opaque
        </label>
        ...
      </div>
    </fieldset>
  </div>
  <DialogButtons>
    <button onClick={handleOk}>OK</button>
    <button onClick={onClose}>Cancel</button>
  </DialogButtons>
</Dialog>
```

**After (CORRECT):**
```tsx
<Dialog
  title="Attributes"
  isOpen={isOpen}
  onClose={onClose}
  width={380}
  className="dialog-window attributes-window"
>
  <form onSubmit={handleSubmit}>
    <div>
      <fieldset>
        <legend>File last saved</legend>
        <div className="fieldset-body">...</div>
      </fieldset>

      <fieldset>
        <legend>Image</legend>
        <div className="fieldset-body">
          <div className="image-type-radios">
            <label>
              <input type="radio" name="imageType" checked={isOpaque} />
              Opaque
            </label>
            ...
          </div>
        </div>
      </fieldset>
    </div>

    <div className="button-group">
      <button type="submit">OK</button>
      <button type="button" onClick={onClose}>Cancel</button>
      <button type="button" onClick={handleDefault}>Default</button>
    </div>
  </form>
</Dialog>
```

#### Example 2: SaveAsDialog.tsx

**Before (WRONG):**
```tsx
<Dialog title="Save As" isOpen={isOpen} onClose={onClose} width={400}>
  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    <div>
      <label style={{ display: "block", marginBottom: "4px" }}>File name:</label>
      <input style={{ width: "100%", boxSizing: "border-box" }} />
    </div>
    <div>
      <label style={{ display: "block", marginBottom: "4px" }}>Save as type:</label>
      <select style={{ width: "100%", boxSizing: "border-box" }}>...</select>
    </div>
  </div>
  <DialogButtons>
    <button onClick={handleSave}>Save</button>
    <button onClick={onClose}>Cancel</button>
  </DialogButtons>
</Dialog>
```

**After (CORRECT):**
```tsx
<Dialog
  title="Save As"
  isOpen={isOpen}
  onClose={onClose}
  width={400}
  className="dialog-window save-as"
>
  <form onSubmit={handleSubmit}>
    <div>
      <label>
        File name:
        <input
          type="text"
          value={baseName}
          onChange={(e) => setBaseName(e.target.value)}
          className="inset-deep"
        />
      </label>
      <label>
        Save as type:
        <select
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value)}
          className="inset-deep"
        >
          {/* options */}
        </select>
      </label>
    </div>
    <div className="button-group">
      <button type="submit">Save</button>
      <button type="button" onClick={onClose}>Cancel</button>
    </div>
  </form>
</Dialog>
```

---

### Dialog Migration Checklist

For each dialog, verify:

- [ ] **Class names**: Dialog passes correct legacy class names via `className` prop
- [ ] **No inline styles**: All `style={{...}}` removed from elements
- [ ] **Form wrapper**: Content wrapped in `<form>` where form semantics apply
- [ ] **Button group**: Buttons inside `<div className="button-group">`
- [ ] **Fieldset structure**: `<fieldset>` uses `<legend>` and `.fieldset-body`
- [ ] **Input styling**: Inputs/selects use `.inset-deep` class
- [ ] **Visual match**: Side-by-side comparison with legacy shows identical layout

### Dialog-Specific Files to Modify

| File | Changes Required |
|------|------------------|
| `Dialog.tsx` | Ensure `className` prop properly concatenates with base classes |
| `AttributesDialog.tsx` | Add classes, remove inline styles, add form wrapper |
| `SaveAsDialog.tsx` | Add classes, remove inline styles, restructure labels |
| `FlipRotateDialog.tsx` | Add classes, use fieldset pattern |
| `StretchSkewDialog.tsx` | Add classes, use grid layout from legacy |
| `CustomZoomDialog.tsx` | Add classes, use legacy radio layout |
| `HistoryTreeDialog.tsx` | Verify classes, check button alignment |
| `LoadFromUrlDialog.tsx` | Add classes, form structure |
| All dialogs | Verify padding, margins match legacy (10px content padding, etc.) |

---

## Implementation Checklist

### Immediate Actions
- [ ] Create side-by-side visual comparison page
- [ ] Document all CSS differences in detail
- [ ] Decide on CSS architecture approach (A or B from Phase 2)

### Short-term (Next 2 sprints)
- [ ] Consolidate component CSS into single location
- [ ] Port tool button styling from legacy
- [ ] Port color component styling from legacy
- [ ] Port status bar styling from legacy
- [ ] Fix dialog window styling to match legacy

### Medium-term
- [ ] Implement theme switching hook
- [ ] Test all 9 themes with React app
- [ ] Verify RTL support with i18n

### Validation
For each ported component:
1. Visual comparison with legacy at 100% zoom
2. Visual comparison at 2x/4x/8x zoom
3. Verify CSS variable usage (--ButtonFace, --ButtonShadow, etc.)
4. Verify no hardcoded colors that should use theme variables

## CSS Variables Reference

The theme system uses these OS-GUI CSS variables (from `lib/os-gui/`):

```css
--ButtonFace       /* Button and window background */
--ButtonText       /* Button and window text */
--ButtonShadow     /* Dark border edge */
--ButtonHilight    /* Light border edge (outer) */
--ButtonDkShadow   /* Darkest border edge */
--Hilight          /* Selection highlight (blue) */
--HilightText      /* Text on selection */
--AppWorkspace     /* MDI background (canvas area) */
--Background       /* Desktop background (teal) */
--Window           /* Input field background (white) */
--WindowText       /* Input field text */
--checker          /* Transparency pattern */
```

## Files to Modify

| File | Action |
|------|--------|
| `new/index.html` | Remove static classic.css, add dynamic theme loading |
| `styles/react-preview.css` | Refactor to additive-only styles |
| `src/react/components/*.css` | Move to react-preview.css or delete |
| `src/react/hooks/useTheme.ts` | Create (new file) |
| `src/react/components/ToolBox.tsx` | Ensure correct class structure |
| `src/react/components/ColorBox.tsx` | Ensure correct class structure |

## Success Criteria

The migration is complete when:
1. Visual diff between legacy and React shows 0 differences for all components
2. All 9 themes work correctly in React
3. RTL languages display correctly
4. No React-specific CSS overrides remain
5. Single CSS loading strategy for both apps
