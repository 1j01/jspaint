import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { IMAGE_FORMATS, getFileExtension, getFormatByExtension } from "../../utils/imageFormats";
import { Dialog, DialogButtons } from "./Dialog";

interface SaveAsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (filename: string, formatId: string) => void;
  currentFilename?: string;
}

/**
 * Save As dialog for saving canvas to various image formats
 * Windows 98 style with proper form controls
 */
export function SaveAsDialog({ isOpen, onClose, onSave, currentFilename = "untitled.png" }: SaveAsDialogProps) {
  const { t } = useTranslation();
  const filenameInputRef = useRef<HTMLInputElement>(null);

  const initialFormatId = useMemo(() => {
    const ext = getFileExtension(currentFilename);
    return getFormatByExtension(ext)?.formatID ?? "png";
  }, [currentFilename]);

  const [filename, setFilename] = useState(currentFilename);
  const [selectedFormat, setSelectedFormat] = useState(initialFormatId);

  const getSelectedFormat = useCallback(() => {
    return IMAGE_FORMATS.find((f) => f.formatID === selectedFormat);
  }, [selectedFormat]);

  const formatLabel = useCallback((formatId: string): string => {
    const format = IMAGE_FORMATS.find((f) => f.formatID === formatId);
    if (!format) return formatId;
    const parts = format.extensions.map((ext) => `*.${ext}`);
    return `${format.name} (${parts.join(";")})`;
  }, []);

  const selectFormatFromFilename = useCallback(
    (nextFilename: string) => {
      const ext = getFileExtension(nextFilename);
      if (!ext) return;
      const selected = getSelectedFormat();
      if (selected && selected.extensions.includes(ext)) {
        return;
      }
      const matched = getFormatByExtension(ext);
      if (matched) {
        setSelectedFormat(matched.formatID);
      }
    },
    [getSelectedFormat],
  );

  const updateExtensionFromFormat = useCallback(
    (nextFilename: string, formatId: string, addExtensionIfAbsent: boolean): string => {
      const format = IMAGE_FORMATS.find((f) => f.formatID === formatId);
      if (!format) return nextFilename;

      const withoutExtension = nextFilename.replace(/\.[^.]+$/i, "");
      const extensionPresent = withoutExtension !== nextFilename;
      const extension = extensionPresent ? nextFilename.slice(withoutExtension.length + 1).toLowerCase() : "";

      if (!extensionPresent && !addExtensionIfAbsent) {
        return nextFilename;
      }

      // If extension is present and already acceptable (including non-primary like .dib), keep it.
      if (extensionPresent && format.extensions.includes(extension)) {
        return nextFilename;
      }

      const primaryExtension = format.extensions[0] ?? "png";
      return `${withoutExtension}.${primaryExtension}`;
    },
    [],
  );

  // Reset fields each time the dialog opens (matches legacy behavior)
  useEffect(() => {
    if (!isOpen) return;
    setFilename(currentFilename);
    setSelectedFormat(initialFormatId);
    // Focus + select the filename field (like jQuery: $file_name.focus().select())
    requestAnimationFrame(() => {
      filenameInputRef.current?.focus();
      filenameInputRef.current?.select();
    });
  }, [isOpen, currentFilename, initialFormatId]);

  const handleSave = useCallback(() => {
    const trimmed = filename.trim();
    if (!trimmed) return;
    const finalFilename = updateExtensionFromFormat(trimmed, selectedFormat, true);
    onSave(finalFilename, selectedFormat);
    onClose();
  }, [filename, selectedFormat, updateExtensionFromFormat, onSave, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSave();
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [handleSave, onClose],
  );

  return (
    <Dialog title={t("Save As")} isOpen={isOpen} onClose={onClose} width={400} className="dialog-window save-as">
      <form>
        <div>
          <label>
            {t("File name:")}
            <input
              ref={filenameInputRef}
              type="text"
              className="file-name inset-deep"
              value={filename}
              onChange={(e) => {
                const next = e.target.value;
                setFilename(next);
                selectFormatFromFilename(next);
              }}
              onKeyDown={handleKeyDown}
            />
          </label>
          <label>
            {t("Save as type:")}
            <select
              className="file-type-select inset-deep"
              value={selectedFormat}
              onChange={(e) => {
                const nextFormat = e.target.value;
                setSelectedFormat(nextFormat);
                // Update extension when user picks a type (but don't add one if none present)
                setFilename((prev) => updateExtensionFromFormat(prev, nextFormat, false));
              }}
            >
              {IMAGE_FORMATS.map((format) => (
                <option key={format.formatID} value={format.formatID}>
                  {formatLabel(format.formatID)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <DialogButtons>
          <button type="button" onClick={handleSave} disabled={!filename.trim()}>
            {t("Save")}
          </button>
          <button type="button" onClick={onClose}>
            {t("Cancel")}
          </button>
        </DialogButtons>
      </form>
    </Dialog>
  );
}

export default SaveAsDialog;
