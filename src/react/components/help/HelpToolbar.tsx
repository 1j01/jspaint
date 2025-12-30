/**
 * Toolbar component for the Help window.
 * Contains Hide/Show, Back, Forward, Options, and Web Help buttons.
 */
import React from "react";

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
	spriteIndex: number;
	onClick: () => void;
	disabled?: boolean;
}

function ToolbarButton({
	label,
	spriteIndex,
	onClick,
	disabled = false,
}: ToolbarButtonProps) {
	return (
		<button
			className="help-toolbar-button lightweight"
			onClick={onClick}
			disabled={disabled}
			type="button"
		>
			<div
				className="help-toolbar-icon"
				style={{
					backgroundPosition: `${-spriteIndex * 55}px 0px`,
				}}
			/>
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
				spriteIndex={sidebarVisible ? 0 : 5}
				onClick={onToggleSidebar}
			/>
			<ToolbarButton
				label="Back"
				spriteIndex={1}
				onClick={onBack}
				disabled={!canGoBack}
			/>
			<ToolbarButton
				label="Forward"
				spriteIndex={2}
				onClick={onForward}
				disabled={!canGoForward}
			/>
			<ToolbarButton
				label="Options"
				spriteIndex={3}
				onClick={() => {}}
				disabled={true}
			/>
			<ToolbarButton
				label="Web Help"
				spriteIndex={4}
				onClick={onWebHelp}
			/>
		</div>
	);
}

export default HelpToolbar;
