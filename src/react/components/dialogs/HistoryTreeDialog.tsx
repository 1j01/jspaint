/**
 * HistoryTreeDialog - Document History Viewer
 *
 * Faithful recreation of the jQuery version's history dialog.
 * Shows history entries in a list with icon + name.
 * Supports two view modes:
 * - Linear timeline: Chronological order
 * - Tree: Hierarchical with indentation showing branches
 */

import { useEffect, useRef, useState } from "react";
import { Dialog } from "./Dialog";
import type { HistoryNode } from "../../utils/historyTree";
import { useCurrentHistoryNode } from "../../context/state/hooks";

interface HistoryTreeDialogProps {
	isOpen: boolean;
	onClose: () => void;
	rootNode: HistoryNode | null;
	currentNode: HistoryNode | null;  // Kept for backward compatibility but will use store directly
	onNavigateToNode: (nodeId: string) => void;
}

type ViewMode = "linear" | "tree";

interface RenderedEntry {
	node: HistoryNode;
	isCurrent: boolean;
	isAncestorOfCurrent: boolean;
	depth: number;
}

/**
 * Get all ancestors of a node (parent, grandparent, etc.)
 */
function getAncestors(node: HistoryNode | null): HistoryNode[] {
	const ancestors: HistoryNode[] = [];
	let current = node?.parent;
	while (current) {
		ancestors.push(current);
		current = current.parent;
	}
	return ancestors;
}

/**
 * Get depth of node in tree (distance from root)
 */
function getDepth(node: HistoryNode): number {
	let depth = 0;
	let current = node.parent;
	while (current) {
		depth++;
		current = current.parent;
	}
	return depth;
}

/**
 * Recursively collect all nodes in tree
 */
function collectAllNodes(root: HistoryNode | null): HistoryNode[] {
	if (!root) return [];

	const nodes: HistoryNode[] = [];

	function traverse(node: HistoryNode) {
		nodes.push(node);
		node.children.forEach(child => traverse(child));
	}

	traverse(root);
	return nodes;
}

export function HistoryTreeDialog({
	isOpen,
	onClose,
	rootNode,
	currentNode: _currentNodeProp,  // Ignored - we get it from store
	onNavigateToNode,
}: HistoryTreeDialogProps) {
	// Get current node directly from store to avoid prop drilling and unnecessary re-renders in parent
	const currentNode = useCurrentHistoryNode();

	const [viewMode, setViewMode] = useState<ViewMode>("tree");
	const listRef = useRef<HTMLDivElement>(null);
	const currentEntryRef = useRef<HTMLDivElement>(null);

	// Collect and prepare all entries
	const entries: RenderedEntry[] = (() => {
		if (!rootNode) return [];

		const allNodes = collectAllNodes(rootNode);
		const ancestors = new Set(getAncestors(currentNode).map(n => n.id));

		let result = allNodes.map(node => ({
			node,
			isCurrent: node.id === currentNode?.id,
			isAncestorOfCurrent: ancestors.has(node.id),
			depth: getDepth(node),
		}));

		// Sort based on view mode
		if (viewMode === "linear") {
			// Chronological order by timestamp
			result.sort((a, b) => a.node.timestamp - b.node.timestamp);
		} else {
			// Tree order (already in tree traversal order, but reversed to match jQuery)
			result.reverse();
		}

		return result;
	})();

	// Auto-scroll to current entry
	useEffect(() => {
		if (isOpen && currentEntryRef.current && listRef.current) {
			requestAnimationFrame(() => {
				const list = listRef.current;
				const entry = currentEntryRef.current;
				if (!list || !entry) return;

				// Scroll to make current entry visible
				const entryTop = entry.offsetTop;
				const entryBottom = entryTop + entry.offsetHeight;
				const listTop = list.scrollTop;
				const listBottom = listTop + list.clientHeight;

				if (entryTop < listTop) {
					list.scrollTop = entryTop;
				} else if (entryBottom > listBottom) {
					list.scrollTop = entryBottom - list.clientHeight;
				}
			});
		}
	}, [isOpen, viewMode, currentNode]);

	// Keyboard navigation
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) return;

			const currentIndex = entries.findIndex(e => e.isCurrent);
			if (currentIndex === -1) return;

			let targetIndex = -1;

			if (e.key === "ArrowDown" || e.key === "Down") {
				targetIndex = Math.min(currentIndex + 1, entries.length - 1);
				e.preventDefault();
			} else if (e.key === "ArrowUp" || e.key === "Up") {
				targetIndex = Math.max(currentIndex - 1, 0);
				e.preventDefault();
			}

			if (targetIndex >= 0 && targetIndex !== currentIndex) {
				onNavigateToNode(entries[targetIndex].node.id);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, entries, onNavigateToNode]);

	const handleEntryClick = (nodeId: string) => {
		onNavigateToNode(nodeId);
	};

	if (!isOpen || !rootNode) return null;

	return (
		<Dialog isOpen={isOpen} onClose={onClose} title="Document History" width="400px">
			<div style={{ display: "flex", flexDirection: "column", height: "500px" }}>
				{/* View mode selector */}
				<label style={{ margin: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
					<select
						className="inset-deep"
						value={viewMode}
						onChange={(e) => setViewMode(e.target.value as ViewMode)}
						style={{
							padding: "4px 8px",
							fontSize: "11px",
							fontFamily: "Arial, sans-serif",
						}}
					>
						<option value="linear">Linear timeline</option>
						<option value="tree">Tree</option>
					</select>
				</label>

				{/* History list */}
				<div
					ref={listRef}
					className="history-view"
					tabIndex={0}
					style={{
						flex: 1,
						overflow: "auto",
						border: "2px inset",
						background: "#fff",
						margin: "0 10px 10px 10px",
						outline: "none",
					}}
				>
					{entries.map((entry) => {
						const isRoot = entry.node.id === rootNode.id;
						const displayName = `${entry.node.name || "Unknown"}${isRoot ? " (Start of History)" : ""}`;

						return (
							<div
								key={entry.node.id}
								ref={entry.isCurrent ? currentEntryRef : undefined}
								className={`history-entry ${entry.isCurrent ? "current" : ""} ${entry.isAncestorOfCurrent ? "ancestor-of-current" : ""}`}
								onClick={() => handleEntryClick(entry.node.id)}
								style={{
									display: "flex",
									alignItems: "center",
									padding: "4px 8px",
									cursor: "pointer",
									marginLeft: viewMode === "tree" ? `${entry.depth * 8}px` : "0",
									background: entry.isCurrent ? "#0a246a" : "transparent",
									color: entry.isCurrent ? "#fff" : entry.isAncestorOfCurrent ? "#000" : "#000",
									fontWeight: entry.isAncestorOfCurrent || entry.isCurrent ? "bold" : "normal",
									fontSize: "11px",
									fontFamily: "Arial, sans-serif",
									userSelect: "none",
								}}
								onMouseEnter={(e) => {
									if (!entry.isCurrent) {
										e.currentTarget.style.background = "#e0e0e0";
									}
								}}
								onMouseLeave={(e) => {
									if (!entry.isCurrent) {
										e.currentTarget.style.background = "transparent";
									}
								}}
							>
								{/* Icon area (placeholder for now - icons can be added later) */}
								<div
									className="history-entry-icon-area"
									style={{
										width: "16px",
										height: "16px",
										marginRight: "6px",
										flexShrink: 0,
									}}
								>
									{/* Icon would go here - for now just a bullet */}
									<div
										style={{
											width: "6px",
											height: "6px",
											borderRadius: "50%",
											background: entry.isCurrent ? "#fff" : "#000",
											margin: "5px",
										}}
									/>
								</div>

								{/* Entry name */}
								<div className="history-entry-name" style={{ flex: 1 }}>
									{displayName}
								</div>
							</div>
						);
					})}
				</div>

				{/* Help text */}
				<div
					style={{
						fontSize: "10px",
						color: "#666",
						padding: "0 10px 10px 10px",
						lineHeight: "1.4",
					}}
				>
					Click an entry to jump to that state. Use arrow keys to navigate.
				</div>
			</div>
		</Dialog>
	);
}
