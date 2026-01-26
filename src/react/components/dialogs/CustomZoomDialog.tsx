/**
 * Custom Zoom dialog for setting magnification level.
 */
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogButtons } from "./Dialog";

export interface CustomZoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (magnification: number) => void;
  currentMagnification: number;
}

export function CustomZoomDialog({ isOpen, onClose, onApply, currentMagnification }: CustomZoomDialogProps) {
  const { t } = useTranslation();
  const [selectedZoom, setSelectedZoom] = useState(currentMagnification * 100);
  const [customZoom, setCustomZoom] = useState(currentMagnification * 100);
  const [useCustom, setUseCustom] = useState(false);

  const presetZooms = [100, 200, 400, 600, 800];

  const handleOk = () => {
    const zoomValue = useCustom ? customZoom : selectedZoom;
    onApply(zoomValue / 100);
    onClose();
  };

  return (
    <Dialog
      title={t("Custom Zoom")}
      isOpen={isOpen}
      onClose={onClose}
      width={250}
      className="dialog-window custom-zoom-window"
    >
      <form className="dialog-form">
        <fieldset>
          <legend>{t("Zoom to")}</legend>
          <div className="fieldset-body">
            {presetZooms.map((zoom) => (
              <div className="radio-row" key={zoom}>
                <input
                  type="radio"
                  id={`zoom-${zoom}`}
                  name="zoom"
                  checked={!useCustom && selectedZoom === zoom}
                  onChange={() => {
                    setSelectedZoom(zoom);
                    setUseCustom(false);
                  }}
                />
                <label htmlFor={`zoom-${zoom}`}>{zoom}%</label>
              </div>
            ))}
            <div className="radio-row custom-zoom-row">
              <input
                type="radio"
                id="zoom-custom"
                name="zoom"
                checked={useCustom}
                onChange={() => setUseCustom(true)}
              />
              <label htmlFor="zoom-custom">{t("Custom:")}</label>
              <input
                type="number"
                className="inset-deep"
                value={customZoom}
                onChange={(e) => {
                  setCustomZoom(parseInt(e.target.value) || 100);
                  setUseCustom(true);
                }}
                min={1}
                max={8000}
              />
              %
            </div>
          </div>
        </fieldset>
        <DialogButtons>
          <button type="button" onClick={handleOk}>
            {t("OK")}
          </button>
          <button type="button" onClick={onClose}>
            {t("Cancel")}
          </button>
        </DialogButtons>
      </form>
    </Dialog>
  );
}

export default CustomZoomDialog;
