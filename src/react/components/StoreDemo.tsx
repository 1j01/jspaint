/**
 * Example: Store Usage Demo Component
 * Demonstrates how to use the new Zustand stores
 */

import React from "react";
import { useColors } from "../context/state/useColors";
import { useBrushSettings } from "../context/state/useBrushSettings";
import { useShapeSettings } from "../context/state/useShapeSettings";
import { useHistory } from "../context/state/useHistory";
import { useToolStore } from "../context/state/toolStore";
import { useUIStore } from "../context/state/uiStore";
import { useCanvasStore } from "../context/state/canvasStore";
import { TOOL_IDS } from "../context/state/types";

export function StoreDemo() {
  // Using selector hooks (recommended)
  const { primaryColor, secondaryColor, setPrimaryColor, swapColors } = useColors();
  const { brushSize, brushShape, setBrushSize } = useBrushSettings();
  const { fillStyle, setFillStyle } = useShapeSettings();
  const { canUndo, canRedo } = useHistory();

  // Using store hooks directly
  const selectedToolId = useToolStore((state) => state.selectedToolId);
  const setTool = useToolStore((state) => state.setTool);
  const showToolBox = useUIStore((state) => state.showToolBox);
  const toggleToolBox = useUIStore((state) => state.toggleToolBox);
  const canvasWidth = useCanvasStore((state) => state.canvasWidth);
  const fileName = useCanvasStore((state) => state.fileName);

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>Zustand Store Demo</h1>

      <section>
        <h2>Colors (Auto-persisted)</h2>
        <div>
          <label>
            Primary Color:
            <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
            {primaryColor}
          </label>
        </div>
        <div>
          <label>
            Secondary Color:
            <input type="color" value={secondaryColor} disabled />
            {secondaryColor}
          </label>
        </div>
        <button onClick={swapColors}>Swap Colors</button>
      </section>

      <section>
        <h2>Brush Settings (Auto-persisted)</h2>
        <div>
          <label>
            Brush Size: {brushSize}
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
            />
          </label>
        </div>
        <div>
          <label>Brush Shape: {brushShape}</label>
        </div>
      </section>

      <section>
        <h2>Shape Settings (Auto-persisted)</h2>
        <div>
          <label>
            Fill Style:
            <select value={fillStyle} onChange={(e) => setFillStyle(e.target.value as any)}>
              <option value="outline">Outline</option>
              <option value="fill">Fill</option>
              <option value="both">Both</option>
            </select>
          </label>
        </div>
      </section>

      <section>
        <h2>Tool State (Session-only)</h2>
        <div>Current Tool: {selectedToolId}</div>
        <div>
          <button onClick={() => setTool(TOOL_IDS.PENCIL)}>Pencil</button>
          <button onClick={() => setTool(TOOL_IDS.BRUSH)}>Brush</button>
          <button onClick={() => setTool(TOOL_IDS.ERASER)}>Eraser</button>
        </div>
      </section>

      <section>
        <h2>UI State (Auto-persisted)</h2>
        <div>
          <label>
            <input type="checkbox" checked={showToolBox} onChange={toggleToolBox} />
            Show Tool Box
          </label>
        </div>
      </section>

      <section>
        <h2>Canvas State</h2>
        <div>File Name: {fileName}</div>
        <div>Canvas Size: {canvasWidth}px</div>
        <div>
          <button disabled={!canUndo}>Undo</button>
          <button disabled={!canRedo}>Redo</button>
        </div>
      </section>

      <section>
        <h2>Persistence Test</h2>
        <p>
          Change any auto-persisted setting above (colors, brush size, fill style, UI toggles), then{" "}
          <strong>refresh the page</strong>. Your settings should be restored!
        </p>
      </section>
    </div>
  );
}
