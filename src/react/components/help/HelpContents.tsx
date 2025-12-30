/**
 * Table of Contents component for the Help window.
 * Displays a tree structure of help topics.
 */
import React, { useState, useCallback } from "react";
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
	expandedFolder: string | null;
	onExpandFolder: (name: string | null) => void;
	depth: number;
}

function HelpItemComponent({
	item,
	onSelectTopic,
	selectedUrl,
	expandedFolder,
	onExpandFolder,
	depth,
}: HelpItemComponentProps) {
	const isFolder = item.children && item.children.length > 0;
	const isExpanded = expandedFolder === item.name;
	const isSelected = item.local && selectedUrl?.endsWith(item.local);

	const handleClick = useCallback(() => {
		if (isFolder) {
			onExpandFolder(isExpanded ? null : item.name);
		} else if (item.local) {
			onSelectTopic(item.local);
		}
	}, [isFolder, isExpanded, item.name, item.local, onExpandFolder, onSelectTopic]);

	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		// Prevent text selection on double-click
		if (e.detail > 1) {
			e.preventDefault();
		}
	}, []);

	return (
		<li className={`help-toc-item ${isFolder ? "folder" : "page"} ${isExpanded ? "expanded" : ""}`}>
			<div
				className={`help-toc-item-content ${isSelected ? "selected" : ""}`}
				onClick={handleClick}
				onMouseDown={handleMouseDown}
				role="treeitem"
				aria-expanded={isFolder ? isExpanded : undefined}
				aria-selected={isSelected || false}
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						handleClick();
					}
				}}
			>
				<span className="help-toc-icon" />
				<span className="help-toc-label">{item.name}</span>
			</div>
			{isFolder && isExpanded && item.children && (
				<ul className="help-toc-children" role="group">
					{item.children.map((child, index) => (
						<HelpItemComponent
							key={`${child.name}-${index}`}
							item={child}
							onSelectTopic={onSelectTopic}
							selectedUrl={selectedUrl}
							expandedFolder={expandedFolder}
							onExpandFolder={onExpandFolder}
							depth={depth + 1}
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
	// Track which folder is expanded (accordion style - only one at a time at root level)
	const [expandedFolder, setExpandedFolder] = useState<string | null>(null);

	const handleWelcomeClick = useCallback(() => {
		onSelectTopic("default.html");
	}, [onSelectTopic]);

	if (isLoading) {
		return (
			<div className="help-contents inset-deep">
				<div className="help-contents-loading">Loading...</div>
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
		<ul className="help-contents inset-deep" role="tree">
			{/* Welcome item always at top */}
			<li className="help-toc-item page">
				<div
					className={`help-toc-item-content ${selectedUrl?.endsWith("default.html") ? "selected" : ""}`}
					onClick={handleWelcomeClick}
					role="treeitem"
					aria-selected={selectedUrl?.endsWith("default.html") || false}
					tabIndex={0}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							handleWelcomeClick();
						}
					}}
				>
					<span className="help-toc-icon" />
					<span className="help-toc-label">Welcome to Help</span>
				</div>
			</li>
			{/* TOC items */}
			{items.map((item, index) => (
				<HelpItemComponent
					key={`${item.name}-${index}`}
					item={item}
					onSelectTopic={onSelectTopic}
					selectedUrl={selectedUrl}
					expandedFolder={expandedFolder}
					onExpandFolder={setExpandedFolder}
					depth={0}
				/>
			))}
		</ul>
	);
}

export default HelpContents;
