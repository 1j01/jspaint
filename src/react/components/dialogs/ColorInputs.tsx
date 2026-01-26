import { RefObject } from "react";
import { useTranslation } from "react-i18next";

function abbreviateToThreeLetters(label: string): string {
  // Remove common trailing punctuation (kept separate for consistent formatting)
  const normalized = label.trim().replace(/[:\s]+$/u, "");
  // Prefer letters over whitespace; keep Unicode code points intact
  const lettersOnly = Array.from(normalized.replace(/\s+/gu, ""));
  return lettersOnly.slice(0, 3).join("") || normalized;
}

function maybeAbbreviateWithColon(labelWithOptionalColon: string): string {
  const normalized = labelWithOptionalColon.trim();
  const withoutTrailingColon = normalized.replace(/[:\s]+$/u, "");
  const letterCount = Array.from(withoutTrailingColon.replace(/\s+/gu, "")).length;

  // Keep short labels as-is (e.g. Hue:, Sat:, Lum:, Red:, Blue:).
  // Abbreviate only when translations are long and overflow the fixed layout.
  if (letterCount <= 6) {
    return normalized;
  }

  return `${abbreviateToThreeLetters(withoutTrailingColon)}:`;
}

function maybeAbbreviateColorSolid(label: string): string {
  // Legacy UI uses a pipe separator, but some translations may omit it.
  const normalized = label.trim();
  const letterCount = Array.from(normalized.replace(/[\s|]/gu, "")).length;

  // Keep the classic English label intact; abbreviate only if it gets long.
  if (letterCount <= 12) {
    return normalized;
  }

  if (normalized.includes("|")) {
    const parts = normalized.split(/\s*\|\s*/u);
    return parts.map((p) => abbreviateToThreeLetters(p)).join("|");
  }
  return abbreviateToThreeLetters(normalized);
}

interface ColorInputsProps {
  resultCanvasRef: RefObject<HTMLCanvasElement>;
  hue: number;
  saturation: number;
  luminosity: number;
  red: number;
  green: number;
  blue: number;
  onHslInput: (value: string, setter: (val: number) => void, max: number) => void;
  onRgbInput: (component: "r" | "g" | "b", value: string) => void;
  onAddToCustomColors: () => void;
  setHue: (val: number) => void;
  setSaturation: (val: number) => void;
  setLuminosity: (val: number) => void;
}

/**
 * Color input fields component - matches jQuery implementation with absolute positioning
 *
 * Displays:
 * - Result color preview canvas (positioned at left:10, top:198)
 * - "Color|Solid" label (positioned at left:10, top:244)
 * - HSL input fields (Hue, Sat, Lum) - absolutely positioned
 * - RGB input fields (Red, Green, Blue) - absolutely positioned
 * - "Add to Custom Colors" button (positioned at bottom:5, right:5)
 *
 * All elements use absolute positioning to exactly match edit-colors.js layout.
 */
export function ColorInputs({
  resultCanvasRef,
  hue,
  saturation,
  luminosity,
  red,
  green,
  blue,
  onHslInput,
  onRgbInput,
  onAddToCustomColors,
  setHue,
  setSaturation,
  setLuminosity,
}: ColorInputsProps) {
  const { t } = useTranslation();
  const inputYSpacing = 22;

  const colorSolidFull = t("Color|Solid");
  const hueFull = t("Hue:");
  const satFull = t("Sat:");
  const lumFull = t("Lum:");
  const redFull = t("Red:");
  const greenFull = t("Green:");
  const blueFull = t("Blue:");

  return (
    <>
      {/* Result canvas - shows current color */}
      <canvas
        ref={resultCanvasRef}
        id="color-solid-canvas"
        className="result-color-canvas inset-shallow"
        width={58}
        height={40}
        style={{
          position: "absolute",
          left: 10,
          top: 198,
        }}
      />

      {/* "Color|Solid" label */}
      <label
        htmlFor="color-solid-canvas"
        title={colorSolidFull}
        aria-label={colorSolidFull}
        style={{
          position: "absolute",
          left: 10,
          top: 244,
          whiteSpace: "nowrap",
        }}
      >
        {maybeAbbreviateColorSolid(colorSolidFull)}
      </label>

      {/* HSL inputs - legacy positions */}
      <label
        title={hueFull}
        aria-label={hueFull}
        style={{
          position: "absolute",
          left: 63,
          top: 202,
          textAlign: "right",
          display: "inline-block",
          width: 40,
          height: 20,
          lineHeight: "20px",
          whiteSpace: "nowrap",
        }}
      >
        {maybeAbbreviateWithColon(hueFull)}
      </label>
      <input
        type="text"
        className="inset-deep"
        value={Math.floor(hue)}
        onChange={(e) => onHslInput(e.target.value, setHue, 360)}
        style={{
          position: "absolute",
          left: 106,
          top: 202,
          width: 21,
          height: 14,
        }}
      />

      <label
        title={satFull}
        aria-label={satFull}
        style={{
          position: "absolute",
          left: 63,
          top: 202 + inputYSpacing,
          textAlign: "right",
          display: "inline-block",
          width: 40,
          height: 20,
          lineHeight: "20px",
          whiteSpace: "nowrap",
        }}
      >
        {maybeAbbreviateWithColon(satFull)}
      </label>
      <input
        type="text"
        className="inset-deep"
        value={Math.floor(saturation)}
        onChange={(e) => onHslInput(e.target.value, setSaturation, 100)}
        style={{
          position: "absolute",
          left: 106,
          top: 202 + inputYSpacing,
          width: 21,
          height: 14,
        }}
      />

      <label
        title={lumFull}
        aria-label={lumFull}
        style={{
          position: "absolute",
          left: 63,
          top: 202 + inputYSpacing * 2,
          textAlign: "right",
          display: "inline-block",
          width: 40,
          height: 20,
          lineHeight: "20px",
          whiteSpace: "nowrap",
        }}
      >
        {maybeAbbreviateWithColon(lumFull)}
      </label>
      <input
        type="text"
        className="inset-deep"
        value={Math.floor(luminosity)}
        onChange={(e) => onHslInput(e.target.value, setLuminosity, 100)}
        style={{
          position: "absolute",
          left: 106,
          top: 202 + inputYSpacing * 2 + 1, // uneven spacing by 1px
          width: 21,
          height: 14,
        }}
      />

      {/* RGB inputs - legacy positions */}
      <label
        title={redFull}
        aria-label={redFull}
        style={{
          position: "absolute",
          left: 143,
          top: 202,
          textAlign: "right",
          display: "inline-block",
          width: 40,
          height: 20,
          lineHeight: "20px",
          whiteSpace: "nowrap",
        }}
      >
        {maybeAbbreviateWithColon(redFull)}
      </label>
      <input
        type="text"
        className="inset-deep"
        value={red}
        onChange={(e) => onRgbInput("r", e.target.value)}
        style={{
          position: "absolute",
          left: 186,
          top: 202,
          width: 21,
          height: 14,
        }}
      />

      <label
        title={greenFull}
        aria-label={greenFull}
        style={{
          position: "absolute",
          left: 143,
          top: 202 + inputYSpacing,
          textAlign: "right",
          display: "inline-block",
          width: 40,
          height: 20,
          lineHeight: "20px",
          whiteSpace: "nowrap",
        }}
      >
        {maybeAbbreviateWithColon(greenFull)}
      </label>
      <input
        type="text"
        className="inset-deep"
        value={green}
        onChange={(e) => onRgbInput("g", e.target.value)}
        style={{
          position: "absolute",
          left: 186,
          top: 202 + inputYSpacing,
          width: 21,
          height: 14,
        }}
      />

      <label
        title={blueFull}
        aria-label={blueFull}
        style={{
          position: "absolute",
          left: 143,
          top: 202 + inputYSpacing * 2,
          textAlign: "right",
          display: "inline-block",
          width: 40,
          height: 20,
          lineHeight: "20px",
          whiteSpace: "nowrap",
        }}
      >
        {maybeAbbreviateWithColon(blueFull)}
      </label>
      <input
        type="text"
        className="inset-deep"
        value={blue}
        onChange={(e) => onRgbInput("b", e.target.value)}
        style={{
          position: "absolute",
          left: 186,
          top: 202 + inputYSpacing * 2 + 1, // uneven spacing by 1px
          width: 21,
          height: 14,
        }}
      />

      {/* Add to Custom Colors button - positioned at bottom right */}
      <button className="add-to-custom-colors-button" type="button" onClick={onAddToCustomColors}>
        {t("Add To Custom Colors")}
      </button>
    </>
  );
}
