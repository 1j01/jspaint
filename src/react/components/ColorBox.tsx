import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  KeyboardEvent,
  PointerEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { DEFAULT_PALETTE } from "../data/palette";
import { Component } from "./Component";

/**
 * Props for ColorBox component
 */
interface ColorBoxProps {
  /** Array of color strings for the palette (default: DEFAULT_PALETTE) */
  palette?: string[];
  /** Initial primary/foreground color */
  initialPrimary?: string;
  /** Initial secondary/background color */
  initialSecondary?: string;
  /** Callback when primary color changes (left click) */
  onPrimaryChange?: (color: string) => void;
  /** Callback when secondary color changes (right click) */
  onSecondaryChange?: (color: string) => void;
  /** Callback when user double-clicks to edit a color */
  onEditRequest?: (color: string, slot: "foreground" | "background") => void;
  /** Whether to use vertical/tall layout (default: false for wide layout) */
  vertical?: boolean;
}

/** Default primary color */
const FALLBACK_PRIMARY = "rgb(0,0,0)";
/** Default secondary color */
const FALLBACK_SECONDARY = "rgb(255,255,255)";
/** Double-click detection window in milliseconds */
const DOUBLE_CLICK_MS = 400;

/**
 * Ensures palette is valid and non-empty
 * Falls back to DEFAULT_PALETTE if palette is missing or empty.
 *
 * @param {string[]} palette - Palette array to validate
 * @returns {string[]} Valid non-empty palette
 */
const ensurePalette = (palette?: string[]): string[] => {
  if (!Array.isArray(palette) || palette.length === 0) {
    return DEFAULT_PALETTE;
  }
  return palette;
};

/**
 * Normalizes a color value to a valid string
 * Returns fallback if color is undefined or empty.
 *
 * @param {string | undefined} color - Color to normalize
 * @param {string} fallback - Fallback color value
 * @returns {string} Valid color string
 */
const normalizeColor = (color: string | undefined, fallback: string): string =>
  typeof color === "string" && color ? color : fallback;

/**
 * ColorBox component - Color palette and selection
 * Recreates the classic MS Paint color palette with foreground/background color selection.
 * Mirrors the legacy $ColorBox structure and behavior for CSS compatibility.
 *
 * Features:
 * - Current colors display (overlapping squares showing foreground/background)
 * - Click current colors to swap foreground and background
 * - Color palette grid (forced 2-row layout via dynamic sizing)
 * - Left-click palette color to set foreground
 * - Right-click palette color to set background
 * - Double-click palette color to open edit dialog
 * - Supports both wide (horizontal) and tall (vertical) layouts
 * - Prevents context menu on right-click
 *
 * @param {ColorBoxProps} props - Component props
 * @returns {JSX.Element} Color palette with current colors and palette grid
 *
 * @example
 * <ColorBox
 *   palette={DEFAULT_PALETTE}
 *   initialPrimary="rgb(0,0,0)"
 *   initialSecondary="rgb(255,255,255)"
 *   onPrimaryChange={setPrimaryColor}
 *   onSecondaryChange={setSecondaryColor}
 *   onEditRequest={(color, slot) => openDialog('editColors', { color, slot })}
 * />
 */
export function ColorBox({
  palette: paletteProp,
  initialPrimary,
  initialSecondary,
  onPrimaryChange,
  onSecondaryChange,
  onEditRequest,
  vertical = false,
}: ColorBoxProps) {
  const { t } = useTranslation();
  const palette = useMemo(() => ensurePalette(paletteProp ?? DEFAULT_PALETTE), [paletteProp]);
  const [foreground, setForeground] = useState(() => normalizeColor(initialPrimary, palette[0] ?? FALLBACK_PRIMARY));
  const [background, setBackground] = useState(() =>
    normalizeColor(initialSecondary, palette[palette.length - 1] ?? FALLBACK_SECONDARY),
  );

  // Sync internal state with props when they change externally (e.g., from color picker tool)
  useEffect(() => {
    if (initialPrimary && initialPrimary !== foreground) {
      setForeground(initialPrimary);
    }
  }, [initialPrimary]); // Intentionally not including foreground in deps to avoid loops

  useEffect(() => {
    if (initialSecondary && initialSecondary !== background) {
      setBackground(initialSecondary);
    }
  }, [initialSecondary]); // Intentionally not including background in deps to avoid loops

  // Ref for palette to calculate dimensions for 2-row layout
  const paletteRef = useRef<HTMLDivElement>(null);

  // Calculate palette dimensions to force 2-row layout (matches legacy behavior)
  useLayoutEffect(() => {
    const paletteEl = paletteRef.current;
    if (!paletteEl) return;

    const firstButton = paletteEl.querySelector(".color-button") as HTMLElement | null;
    if (!firstButton) return;

    const style = getComputedStyle(firstButton);
    const colorsPerRow = Math.ceil(palette.length / 2);

    if (vertical) {
      // Tall mode: set height to fit half the colors per column
      const heightPerButton =
        firstButton.offsetHeight + parseFloat(style.marginTop || "0") + parseFloat(style.marginBottom || "0");
      paletteEl.style.height = `${colorsPerRow * heightPerButton}px`;
      paletteEl.style.width = "";
    } else {
      // Wide mode: set width to fit half the colors per row
      const widthPerButton =
        firstButton.offsetWidth + parseFloat(style.marginLeft || "0") + parseFloat(style.marginRight || "0");
      paletteEl.style.width = `${colorsPerRow * widthPerButton}px`;
      paletteEl.style.height = "";
    }
  }, [palette.length, vertical]);

  // Double-click detection state (matches legacy behavior)
  const doubleClickState = useRef<{
    withinPeriod: boolean;
    button: number | null;
    timeout: ReturnType<typeof setTimeout> | null;
  }>({
    withinPeriod: false,
    button: null,
    timeout: null,
  });

  const setForegroundColor = useCallback(
    (color: string) => {
      setForeground(color);
      onPrimaryChange?.(color);
    },
    [onPrimaryChange],
  );

  const setBackgroundColor = useCallback(
    (color: string) => {
      setBackground(color);
      onSecondaryChange?.(color);
    },
    [onSecondaryChange],
  );

  // Swap foreground and background colors (click on current-colors)
  const swapColors = useCallback(() => {
    setForeground((currentFg) => {
      const newFg = background;
      setBackground(currentFg);
      onPrimaryChange?.(newFg);
      onSecondaryChange?.(currentFg);
      return newFg;
    });
  }, [background, onPrimaryChange, onSecondaryChange]);

  const handleCurrentColorsPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      swapColors();
    },
    [swapColors],
  );

  const handleCurrentColorsKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        swapColors();
      }
    },
    [swapColors],
  );

  // Handle color button interaction (matches legacy pointerdown behavior)
  const handleColorButtonPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>, color: string) => {
      event.preventDefault();

      // Determine which color slot to update based on button and modifiers
      // button 0 = left click = foreground
      // button 2 = right click = background
      // ctrl+click = ternary (not implemented yet, treat as foreground)
      const slot: "foreground" | "background" | null = event.ctrlKey
        ? "foreground"
        : event.button === 0
          ? "foreground"
          : event.button === 2
            ? "background"
            : null;

      if (!slot) return;

      // Check for double-click
      const state = doubleClickState.current;
      if (state.withinPeriod && event.button === state.button) {
        // Double-click detected - open edit dialog
        onEditRequest?.(color, slot);
      } else {
        // Single click - set color
        if (slot === "foreground") {
          setForegroundColor(color);
        } else {
          setBackgroundColor(color);
        }
      }

      // Reset and start double-click timer
      if (state.timeout) {
        clearTimeout(state.timeout);
      }
      state.withinPeriod = true;
      state.button = event.button;
      state.timeout = setTimeout(() => {
        state.withinPeriod = false;
        state.button = null;
      }, DOUBLE_CLICK_MS);
    },
    [setForegroundColor, setBackgroundColor, onEditRequest],
  );

  // Prevent context menu on right-click (we handle it ourselves)
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
  }, []);

  const handleColorButtonKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>, color: string) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setForegroundColor(color);
      }
    },
    [setForegroundColor],
  );

  return (
    <Component title={t("Colors")} className="colors-component" orientation={vertical ? "tall" : "wide"}>
      <div className="color-box" role="group" aria-label={t("Color palette")}>
        {/* Current colors display - click to swap */}
        <div
          className="current-colors swatch"
          role="button"
          tabIndex={0}
          aria-label={`Swap foreground ${foreground} and background ${background}`}
          onPointerDown={handleCurrentColorsPointerDown}
          onKeyDown={handleCurrentColorsKeyDown}
        >
          {/* Order matches legacy: background first (bottom-right), then foreground (top-left) */}
          <div
            className="swatch color-selection background-color"
            style={{ backgroundColor: background }}
            aria-hidden="true"
          />
          <div
            className="swatch color-selection foreground-color"
            style={{ backgroundColor: foreground }}
            aria-hidden="true"
          />
        </div>

        {/* Palette grid - sized to force 2-row layout */}
        <div ref={paletteRef} className="palette" role="listbox" aria-label={t("Available colors")}>
          {palette.map((color, index) => (
            <div
              key={`${index}-${color}`}
              className="swatch color-button"
              role="option"
              tabIndex={0}
              style={{ backgroundColor: color }}
              aria-label={`Color ${color}`}
              aria-selected={color === foreground}
              data-color={color}
              onPointerDown={(e) => handleColorButtonPointerDown(e, color)}
              onKeyDown={(e) => handleColorButtonKeyDown(e, color)}
              onContextMenu={handleContextMenu}
            />
          ))}
        </div>
      </div>
    </Component>
  );
}

export default ColorBox;
