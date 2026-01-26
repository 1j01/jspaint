import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogButtons } from "./Dialog";

interface ImgurUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: () => void;
  imageDataUrl: string;
}

/**
 * Simplified Imgur upload dialog
 * Shows a preview and upload button
 */
export function ImgurUploadDialog({ isOpen, onClose, imageDataUrl }: ImgurUploadDialogProps) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();

      // Use XMLHttpRequest for progress tracking
      const formData = new FormData();
      formData.append("image", blob);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.floor((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      // Handle response
      const uploadPromise = new Promise<{ success: boolean; data: { link?: string; error?: string } }>(
        (resolve, reject) => {
          xhr.addEventListener("readystatechange", () => {
            if (xhr.readyState === 4) {
              if (xhr.status === 200) {
                try {
                  const result = JSON.parse(xhr.responseText);
                  resolve(result);
                } catch {
                  reject(new Error(t("Invalid response from Imgur")));
                }
              } else {
                try {
                  const result = JSON.parse(xhr.responseText);
                  if (result.data?.error) {
                    reject(new Error(result.data.error));
                  } else {
                    reject(new Error(`${t("Upload failed")} (HTTP ${xhr.status})`));
                  }
                } catch {
                  reject(new Error(`${t("Upload failed")} (HTTP ${xhr.status})`));
                }
              }
            }
          });
          xhr.addEventListener("error", () => reject(new Error(t("Network error"))));
        },
      );

      xhr.open("POST", "https://api.imgur.com/3/image", true);
      xhr.setRequestHeader("Authorization", "Client-ID 203da2f300125a1");
      xhr.setRequestHeader("Accept", "application/json");
      xhr.send(formData);

      const result = await uploadPromise;

      if (result.success && result.data.link) {
        setUploadedUrl(result.data.link);
      } else {
        setError(result.data.error || t("Upload failed"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setUploading(false);
    setUploadProgress(0);
    setUploadedUrl(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={t("Upload to Imgur")}
      className="dialog-window imgur-upload-window"
    >
      <div className="imgur-upload-content">
        {!uploading && !uploadedUrl && imageDataUrl && (
          <>
            <div className="imgur-preview-container inset-deep">
              <img src={imageDataUrl} alt={t("Preview")} className="imgur-preview-image" />
            </div>
            <p>{t("Click Upload to share your image on Imgur.")}</p>
          </>
        )}

        {uploading && (
          <div className="imgur-uploading">
            <p>{t("Uploading...")}</p>
            <div className="imgur-progress-container inset-deep">
              <div className="imgur-progress-bar" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p>{uploadProgress}%</p>
          </div>
        )}

        {uploadedUrl && (
          <div className="imgur-success">
            <p>{t("Upload successful!")}</p>
            <p>
              {t("Image URL:")}{" "}
              <a href={uploadedUrl} target="_blank" rel="noopener noreferrer">
                {uploadedUrl}
              </a>
            </p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(uploadedUrl);
                alert(t("URL copied to clipboard!"));
              }}
            >
              {t("Copy URL")}
            </button>
          </div>
        )}

        {error && (
          <div className="imgur-error error-message">
            <p>
              {t("Error:")} {error}
            </p>
          </div>
        )}

        <DialogButtons>
          {uploadedUrl ? (
            <button type="button" onClick={handleClose}>
              {t("Close")}
            </button>
          ) : uploading ? null : (
            <>
              <button type="button" onClick={handleUpload}>
                {t("Upload")}
              </button>
              <button type="button" onClick={handleClose}>
                {t("Cancel")}
              </button>
            </>
          )}
        </DialogButtons>
      </div>
    </Dialog>
  );
}
