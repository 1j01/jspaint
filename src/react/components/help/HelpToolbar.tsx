/**
 * Toolbar component for the Help window.
 * Contains Hide/Show, Back, Forward, Options, and Web Help buttons.
 * Matches the Windows 98 Help toolbar look.
 */

export interface HelpToolbarProps {
	/** Toggle sidebar visibility */
	onToggleSidebar: () => void;
	/** Whether sidebar is currently visible */
	sidebarVisible: boolean;
	/** Go back in history */
	onBack: () => void;
	/** Go forward in history */
	onForward: () => void;
	/** Open web help */
	onWebHelp: () => void;
	/** Whether can go back */
	canGoBack: boolean;
	/** Whether can go forward */
	canGoForward: boolean;
}

interface ToolbarButtonProps {
	label: string;
	action: string;
	onClick: () => void;
	disabled?: boolean;
}

function ToolbarButton({
	label,
	action,
	onClick,
	disabled = false,
}: ToolbarButtonProps) {
	return (
		<button
			className="help-toolbar-button"
			data-action={action}
			onClick={onClick}
			disabled={disabled}
			type="button"
			title={label}
		>
			<div className="help-toolbar-icon" />
			<span className="help-toolbar-label">{label}</span>
		</button>
	);
}

export function HelpToolbar({
	onToggleSidebar,
	sidebarVisible,
	onBack,
	onForward,
	onWebHelp,
	canGoBack,
	canGoForward,
}: HelpToolbarProps) {
	return (
		<div className="help-toolbar">
			<ToolbarButton
				label={sidebarVisible ? "Hide" : "Show"}
				action={sidebarVisible ? "hide" : "show"}
				onClick={onToggleSidebar}
			/>
			<ToolbarButton
				label="Back"
				action="back"
				onClick={onBack}
				disabled={!canGoBack}
			/>
			<ToolbarButton
				label="Forward"
				action="forward"
				onClick={onForward}
				disabled={!canGoForward}
			/>
			<ToolbarButton
				label="Options"
				action="options"
				onClick={() => {}}
				disabled={true}
			/>
			<ToolbarButton
				label="Web Help"
				action="webhelp"
				onClick={onWebHelp}
			/>
		</div>
	);
}

export default HelpToolbar;
