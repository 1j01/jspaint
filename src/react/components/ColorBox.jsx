import React, { useCallback, useMemo, useState } from "react";
import { DEFAULT_PALETTE } from "../data/palette.js";
import { Component } from "./Component.jsx";

const FALLBACK_PRIMARY = "rgb(0,0,0)";
const FALLBACK_SECONDARY = "rgb(255,255,255)";

const ensurePalette = (palette) => {
        if (!Array.isArray(palette) || palette.length === 0) {
                return DEFAULT_PALETTE;
        }
        return palette;
};

const normalizeColor = (color, fallback) => (typeof color === "string" && color ? color : fallback);

/**
 * React-friendly recreation of the legacy Colors component using the classic styles.
 *
 * @param {object} props
 * @param {string[]} [props.palette]
 * @param {string} [props.initialPrimary]
 * @param {string} [props.initialSecondary]
 * @param {(color: string) => void} [props.onPrimaryChange]
 * @param {(color: string) => void} [props.onSecondaryChange]
 * @param {(primary: string, secondary: string) => void} [props.onEditRequest]
 * @returns {import("react").ReactElement}
 */
export function ColorBox({
        palette: paletteProp,
        initialPrimary,
        initialSecondary,
        onPrimaryChange,
        onSecondaryChange,
        onEditRequest,
}) {
        const palette = useMemo(() => ensurePalette(paletteProp ?? DEFAULT_PALETTE), [paletteProp]);
        const [primary, setPrimary] = useState(() => normalizeColor(initialPrimary, palette[0] ?? FALLBACK_PRIMARY));
        const [secondary, setSecondary] = useState(() => normalizeColor(initialSecondary, palette[palette.length - 1] ?? FALLBACK_SECONDARY));

        const emitPrimary = useCallback((color) => {
                setPrimary(color);
                onPrimaryChange?.(color);
        }, [onPrimaryChange]);

        const emitSecondary = useCallback((color) => {
                setSecondary(color);
                onSecondaryChange?.(color);
        }, [onSecondaryChange]);

        const swapColors = useCallback(() => {
                setPrimary((currentPrimary) => {
                        const nextPrimary = secondary;
                        setSecondary(currentPrimary);
                        onPrimaryChange?.(nextPrimary);
                        onSecondaryChange?.(currentPrimary);
                        return nextPrimary;
                });
        }, [secondary, onPrimaryChange, onSecondaryChange]);

        const handleSwapKey = useCallback((event) => {
                if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        swapColors();
                }
        }, [swapColors]);

        const handleEditRequest = useCallback(() => {
                onEditRequest?.(primary, secondary);
        }, [onEditRequest, primary, secondary]);

        const resolveColor = (color) => (typeof color === "string" && color ? color : FALLBACK_PRIMARY);

        const handlePaletteInteraction = useCallback((event, color) => {
                const resolvedColor = resolveColor(color);
                if (event.type === "contextmenu" || event.button === 2 || event.ctrlKey) {
                        event.preventDefault();
                        emitSecondary(resolvedColor);
                        return;
                }
                emitPrimary(resolvedColor);
        }, [emitPrimary, emitSecondary]);

        return (
                <Component title="Colors" className="colors-component" orientation="wide">
                        <div className="color-box" role="group" aria-label="Color palette">
                                <div
                                        className="current-colors"
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`Swap colors ${primary} and ${secondary}`}
                                        onClick={swapColors}
                                        onKeyDown={handleSwapKey}
                                >
                                        <span className="color-selection background-color" style={{ background: secondary }} aria-hidden="true" />
                                        <span className="color-selection foreground-color" style={{ background: primary }} aria-hidden="true" />
                                </div>
                                <div className="palette" role="listbox" aria-label="Available colors">
                                        {palette.map((color, index) => {
                                                const resolvedColor = resolveColor(color);
                                                return (
                                                        <button
                                                                key={`${index}-${resolvedColor}`}
                                                                type="button"
                                                                className="color-button"
                                                                style={{ background: resolvedColor }}
                                                                aria-label={`Select color ${resolvedColor}`}
                                                                onClick={(event) => handlePaletteInteraction(event, color)}
                                                                onContextMenu={(event) => handlePaletteInteraction(event, color)}
                                                                onDoubleClick={handleEditRequest}
                                                                data-color={resolvedColor}
                                                        />
                                                );
                                        })}
                                </div>
                        </div>
                </Component>
        );
}

export default ColorBox;
