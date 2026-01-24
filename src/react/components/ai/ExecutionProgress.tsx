/**
 * Execution progress component.
 * Shows a progress bar during command execution with current/total count.
 */

/**
 * Props for the ExecutionProgress component
 */
export interface ExecutionProgressProps {
  /** Current command being executed (1-indexed for display) */
  current: number;
  /** Total number of commands to execute */
  total: number;
  /** Whether execution is currently active */
  isExecuting: boolean;
}

/**
 * Displays a Windows 98 style progress bar during command execution.
 * Shows the current progress as "Executing command X of Y".
 * @param {ExecutionProgressProps} props - Component props
 * @returns {JSX.Element | null} The rendered progress bar or null if not executing
 */
export function ExecutionProgress({ current, total, isExecuting }: ExecutionProgressProps) {
  if (!isExecuting || total === 0) {
    return null;
  }

  const percentage = Math.round((current / total) * 100);

  return (
    <div
      className="execution-progress"
      style={{
        padding: "8px",
        borderTop: "1px solid #808080",
        backgroundColor: "#c0c0c0",
      }}
    >
      <div
        className="execution-progress-label"
        style={{
          fontSize: "11px",
          marginBottom: "4px",
          color: "#000000",
        }}
      >
        Executing command {current} of {total}...
      </div>
      <div
        className="execution-progress-bar field"
        style={{
          height: "16px",
          backgroundColor: "#ffffff",
          border: "1px inset #808080",
          padding: "2px",
        }}
      >
        <div
          className="execution-progress-fill"
          style={{
            height: "100%",
            width: `${percentage}%`,
            backgroundColor: "#000080",
            transition: "width 0.1s ease-out",
          }}
        />
      </div>
    </div>
  );
}

export default ExecutionProgress;
