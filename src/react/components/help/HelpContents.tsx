/**
 * Table of Contents component for the Help window.
 * Displays a Windows 98-style tree structure of help topics.
 */
import React, { useCallback, useState } from "react";
import type { HelpItem } from "../../utils/helpParser";

export interface HelpContentsProps {
	/** TOC items to display */
	items: HelpItem[];
	/** Callback when a topic is selected */
	onSelectTopic: (url: string) => void;
	/** Currently selected URL */
	selectedUrl: string | null;
	/** Loading state */
	isLoading?: boolean;
	/** Error message */
	error?: string | null;
}

interface HelpItemComponentProps {
	item: HelpItem;
	onSelectTopic: (url: string) => void;
	selectedUrl: string | null;
	expandedFolders: Set<string>;
	onToggleFolder: (name: string) => void;
	depth: number;
	isSubItem?: boolean;
}

function HelpItemComponent({
	item,
	onSelectTopic,
	selectedUrl,
	expandedFolders,
	onToggleFolder,
	depth,
	isSubItem = false,
}: HelpItemComponentProps) {
	const isFolder = item.children && item.children.length > 0;
	const isExpanded = expandedFolders.has(item.name);
	const isSelected = item.local && selectedUrl?.endsWith(item.local);

	const handleClick = useCallback(() => {
		if (isFolder) {
			onToggleFolder(item.name);
		} else if (item.local) {
			onSelectTopic(item.local);
		}
	}, [isFolder, item.name, item.local, onToggleFolder, onSelectTopic]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				handleClick();
			}
		},
		[handleClick],
	);

	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		// Prevent text selection on double-click
		if (e.detail > 1) {
			e.preventDefault();
		}
	}, []);

	// Determine the class for the list item
	const liClassName = [
		isFolder ? "folder" : "page",
		isExpanded ? "expanded" : "",
		isSubItem ? "sub-item" : "",
	]
		.filter(Boolean)
		.join(" ");

	return (
		<li className={liClassName}>
			<div
				className={`item ${isSelected ? "selected" : ""}`}
				onClick={handleClick}
				onMouseDown={handleMouseDown}
				onKeyDown={handleKeyDown}
				role="treeitem"
				aria-expanded={isFolder ? isExpanded : undefined}
				aria-selected={isSelected || false}
				tabIndex={0}
				style={{ paddingLeft: `${depth * 16 + 4}px` }}
			>
				<span className="item-text">{item.name}</span>
			</div>
			{isFolder && isExpanded && item.children && (
				<ul role="group">
					{item.children.map((child, index) => (
						<HelpItemComponent
							key={`${child.name}-${index}`}
							item={child}
							onSelectTopic={onSelectTopic}
							selectedUrl={selectedUrl}
							expandedFolders={expandedFolders}
							onToggleFolder={onToggleFolder}
							depth={depth + 1}
							isSubItem={true}
						/>
					))}
				</ul>
			)}
		</li>
	);
}

export function HelpContents({
	items,
	onSelectTopic,
	selectedUrl,
	isLoading = false,
	error = null,
}: HelpContentsProps) {
	// Track which folder is expanded (only ONE at a time, matching jQuery's $last_expanded)
	const [expandedFolder, setExpandedFolder] = useState<string | null>(null);

	const handleToggleFolder = useCallback((name: string) => {
		setExpandedFolder((prev) => {
			// If clicking the already-expanded folder, collapse it
			// Otherwise, expand the new folder (auto-collapsing the previous one)
			return prev === name ? null : name;
		});
	}, []);

	// Convert single folder to Set for compatibility with HelpItemComponent
	const expandedFolders = expandedFolder ? new Set([expandedFolder]) : new Set<string>();

	const handleWelcomeClick = useCallback(() => {
		onSelectTopic("default.html");
	}, [onSelectTopic]);

	if (isLoading) {
		return (
			<div className="help-contents inset-deep">
				<div className="help-contents-loading">Loading help contents...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="help-contents inset-deep">
				<div className="help-contents-error">{error}</div>
			</div>
		);
	}

	return (
		<ul className="help-contents" role="tree">
			{/* Welcome item always at top with question mark icon */}
			<li className="page welcome">
				<div
					className={`item welcome ${selectedUrl?.endsWith("default.html") ? "selected" : ""}`}
					onClick={handleWelcomeClick}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							handleWelcomeClick();
						}
					}}
					role="treeitem"
					aria-selected={selectedUrl?.endsWith("default.html") || false}
					tabIndex={0}
					style={{ paddingLeft: "4px" }}
				>
					<span className="item-text">Welcome to Help</span>
				</div>
			</li>
			{/* TOC items */}
			{items.map((item, index) => (
				<HelpItemComponent
					key={`${item.name}-${index}`}
					item={item}
					onSelectTopic={onSelectTopic}
					selectedUrl={selectedUrl}
					expandedFolders={expandedFolders}
					onToggleFolder={handleToggleFolder}
					depth={0}
				/>
			))}
		</ul>
	);
}

export default HelpContents;
