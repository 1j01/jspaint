/**
 * Flip/Rotate dialog for image transformations.
 * Windows 98 style with proper fieldset and radio button layout.
 * Matches legacy jQuery implementation structure.
 */
import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogButtons } from "./Dialog";

export type FlipRotateAction =
  | { type: "flipHorizontal" }
  | { type: "flipVertical" }
  | { type: "rotate"; degrees: number };

export interface FlipRotateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (action: FlipRotateAction) => void;
}

type ActionType = "flipHorizontal" | "flipVertical" | "rotate";

export function FlipRotateDialog({ isOpen, onClose, onApply }: FlipRotateDialogProps) {
  const { t } = useTranslation();
  const [selectedAction, setSelectedAction] = useState<ActionType>("flipHorizontal");
  const [rotateAngle, setRotateAngle] = useState<number>(90);
  const [customAngle, setCustomAngle] = useState<string>("");
  const [isCustomAngle, setIsCustomAngle] = useState(false);
  const firstRadioRef = useRef<HTMLInputElement>(null);

  // Focus first radio button when dialog opens
  useEffect(() => {
    if (isOpen && firstRadioRef.current) {
      firstRadioRef.current.focus();
    }
  }, [isOpen]);

  const handleOk = () => {
    if (selectedAction === "flipHorizontal") {
      onApply({ type: "flipHorizontal" });
    } else if (selectedAction === "flipVertical") {
      onApply({ type: "flipVertical" });
    } else {
      const degrees = isCustomAngle ? parseFloat(customAngle) || 0 : rotateAngle;
      onApply({ type: "rotate", degrees });
    }
    onClose();
  };

  const handleSubOptionsClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Enable rotate mode when clicking in the sub-options area
    setSelectedAction("rotate");
  };

  const isRotateDisabled = selectedAction !== "rotate";

  return (
    <Dialog title={t("Flip and Rotate")} isOpen={isOpen} onClose={onClose} className="dialog-window flip-and-rotate">
      <form className="dialog-form">
        <div>
          <fieldset>
            <legend>{t("Flip or rotate")}</legend>
            <div className="radio-wrapper">
              <input
                ref={firstRadioRef}
                type="radio"
                name="flip-or-rotate"
                id="flip-horizontal"
                value="flip-horizontal"
                checked={selectedAction === "flipHorizontal"}
                onChange={() => setSelectedAction("flipHorizontal")}
              />
              <label htmlFor="flip-horizontal">{t("Flip horizontal")}</label>
            </div>
            <div className="radio-wrapper">
              <input
                type="radio"
                name="flip-or-rotate"
                id="flip-vertical"
                value="flip-vertical"
                checked={selectedAction === "flipVertical"}
                onChange={() => setSelectedAction("flipVertical")}
              />
              <label htmlFor="flip-vertical">{t("Flip vertical")}</label>
            </div>
            <div className="radio-wrapper">
              <input
                type="radio"
                name="flip-or-rotate"
                id="rotate-by-angle"
                value="rotate-by-angle"
                checked={selectedAction === "rotate"}
                onChange={() => setSelectedAction("rotate")}
              />
              <label htmlFor="rotate-by-angle">{t("Rotate by angle")}</label>
            </div>
            <div className="sub-options" onClick={handleSubOptionsClick}>
              <div className="radio-wrapper">
                <input
                  type="radio"
                  name="rotate-by-angle"
                  id="rotate-90"
                  value="90"
                  checked={!isCustomAngle && rotateAngle === 90}
                  onChange={() => {
                    setSelectedAction("rotate");
                    setRotateAngle(90);
                    setIsCustomAngle(false);
                  }}
                  disabled={isRotateDisabled}
                />
                <label htmlFor="rotate-90">90°</label>
              </div>
              <div className="radio-wrapper">
                <input
                  type="radio"
                  name="rotate-by-angle"
                  id="rotate-180"
                  value="180"
                  checked={!isCustomAngle && rotateAngle === 180}
                  onChange={() => {
                    setSelectedAction("rotate");
                    setRotateAngle(180);
                    setIsCustomAngle(false);
                  }}
                  disabled={isRotateDisabled}
                />
                <label htmlFor="rotate-180">180°</label>
              </div>
              <div className="radio-wrapper">
                <input
                  type="radio"
                  name="rotate-by-angle"
                  id="rotate-270"
                  value="270"
                  checked={!isCustomAngle && rotateAngle === 270}
                  onChange={() => {
                    setSelectedAction("rotate");
                    setRotateAngle(270);
                    setIsCustomAngle(false);
                  }}
                  disabled={isRotateDisabled}
                />
                <label htmlFor="rotate-270">270°</label>
              </div>
              <div className="radio-wrapper">
                <input
                  type="radio"
                  name="rotate-by-angle"
                  id="rotate-custom"
                  value="arbitrary"
                  checked={isCustomAngle}
                  onChange={() => {
                    setSelectedAction("rotate");
                    setIsCustomAngle(true);
                  }}
                  disabled={isRotateDisabled}
                />
                <input
                  type="number"
                  min="-360"
                  max="360"
                  name="rotate-by-arbitrary-angle"
                  id="custom-degrees"
                  value={customAngle}
                  onChange={(e) => {
                    setCustomAngle(e.target.value);
                    setSelectedAction("rotate");
                    setIsCustomAngle(true);
                  }}
                  className="no-spinner inset-deep"
                  style={{ width: "50px" }}
                  disabled={isRotateDisabled}
                />
                <label htmlFor="custom-degrees">{t("Degrees")}</label>
              </div>
            </div>
          </fieldset>
        </div>
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

export default FlipRotateDialog;
