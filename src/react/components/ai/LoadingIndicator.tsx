/**
 * Windows 98 style loading indicator component.
 * Shows an animated progress bar during AI response generation.
 * Uses the classic marquee-style animation with segmented blocks.
 */
import { useTranslation } from "react-i18next";
import "./LoadingIndicator.css";

/**
 * Props for the LoadingIndicator component
 */
export interface LoadingIndicatorProps {
  /** Whether the loading indicator is visible */
  isLoading: boolean;
  /** Optional custom message to display */
  message?: string;
}

/**
 * Displays a Windows 98 style loading indicator with animated progress bar.
 * Uses the classic marquee animation pattern from Windows 98.
 * @param {LoadingIndicatorProps} props - Component props
 * @returns {JSX.Element | null} The rendered loading indicator or null if not loading
 */
export function LoadingIndicator({ isLoading, message }: LoadingIndicatorProps) {
  const { t } = useTranslation();

  if (!isLoading) {
    return null;
  }

  const displayMessage = message || t("Thinking...");

  return (
    <div className="win98-loading-indicator">
      <div className="win98-loading-content">
        <div className="win98-loading-icon">
          <div className="win98-hourglass" />
        </div>
        <div className="win98-loading-text">{displayMessage}</div>
      </div>
      <div className="win98-progress-container">
        <div className="win98-progress-track">
          <div className="win98-progress-blocks">
            <div className="win98-progress-block" />
            <div className="win98-progress-block" />
            <div className="win98-progress-block" />
            <div className="win98-progress-block" />
            <div className="win98-progress-block" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoadingIndicator;
