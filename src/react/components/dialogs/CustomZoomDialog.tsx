/**
 * Custom Zoom dialog for setting magnification level.
 * Matches the classic MS Paint Custom Zoom dialog layout.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog } from "./Dialog";

export interface CustomZoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (magnification: number) => void;
  currentMagnification: number;
}

/**
 * Custom Zoom dialog with 2-column radio button layout matching MS Paint.
 * Uses CSS flex column wrap to arrange items into 2 columns.
 * @param props - Dialog properties
 * @returns Custom Zoom dialog component
 */
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
      className="dialog-window custom-zoom-window"
    >
      <div className="custom-zoom-layout">
        <div className="custom-zoom-content">
          <div className="current-zoom">
            {t("Current zoom:")} <bdi>{currentMagnification * 100}%</bdi>
          </div>
          <fieldset>
            <legend>{t("Zoom to")}</legend>
            <div className="fieldset-body">
              {presetZooms.map((zoom) => (
                <div className="radio-field" key={zoom}>
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
              <div className="radio-field">
                <input
                  type="radio"
                  id="zoom-custom"
                  name="zoom"
                  checked={useCustom}
                  onChange={() => setUseCustom(true)}
                />
                <label>
                  <input
                    type="number"
                    name="really-custom-zoom-input"
                    className="inset-deep no-spinner"
                    value={customZoom || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomZoom(val === "" ? 0 : parseInt(val, 10));
                      setUseCustom(true);
                    }}
                    onFocus={() => setUseCustom(true)}
                    min={10}
                    max={1000}
                  />
                  %
                </label>
              </div>
            </div>
          </fieldset>
        </div>
        <div className="custom-zoom-buttons">
          <button type="button" onClick={handleOk}>
            {t("OK")}
          </button>
          <button type="button" onClick={onClose}>
            {t("Cancel")}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export default CustomZoomDialog;
