import React, { useEffect, useRef, useState } from "react";
import Dialog from "./Dialog";
import { HistoryNode, getHistoryTreeData } from "../../hooks/useTreeHistory";
import "./HistoryTreeDialog.css";

interface HistoryTreeDialogProps {
	isOpen: boolean;
	onClose: () => void;
	root: HistoryNode | null;
	current: HistoryNode | null;
	onNavigate: (node: HistoryNode) => void;
}

/**
 * History Tree Visualization Dialog
 *
 * An innovative, visually stunning tree viewer for the branching undo/redo system.
 * Features smooth animations, interactive navigation, and a unique subway-map inspired layout.
 */
export default function HistoryTreeDialog({
	isOpen,
	onClose,
	root,
	current,
	onNavigate,
}: HistoryTreeDialogProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [hoveredNode, setHoveredNode] = useState<string | null>(null);
	const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(
		new Map(),
	);

	// Draw the tree
	useEffect(() => {
		if (!isOpen || !root) return;

		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const { nodes, edges } = getHistoryTreeData(root);

		// Calculate layout
		const positions = new Map<string, { x: number; y: number }>();
		const nodeWidth = 120;
		const nodeHeight = 80;
		const horizontalSpacing = 180;
		const verticalSpacing = 100;

		// Group nodes by depth
		const depthGroups = new Map<number, typeof nodes>();
		nodes.forEach((node) => {
			if (!depthGroups.has(node.depth)) {
				depthGroups.set(node.depth, []);
			}
			depthGroups.get(node.depth)!.push(node);
		});

		// Position nodes
		let maxDepth = 0;
		depthGroups.forEach((groupNodes, depth) => {
			maxDepth = Math.max(maxDepth, depth);
			groupNodes.forEach((node, index) => {
				const x = depth * horizontalSpacing + 60;
				const y = index * verticalSpacing + 60;
				positions.set(node.id, { x, y });
			});
		});

		// Set canvas size
		const canvasWidth = (maxDepth + 1) * horizontalSpacing + 120;
		const canvasHeight = Math.max(
			...Array.from(depthGroups.values()).map((g) => g.length * verticalSpacing + 120),
		);
		canvas.width = canvasWidth;
		canvas.height = canvasHeight;

		setNodePositions(positions);

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw connections (edges) first
		ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
		ctx.lineWidth = 3;
		ctx.lineCap = "round";

		edges.forEach((edge) => {
			const fromPos = positions.get(edge.from);
			const toPos = positions.get(edge.to);
			if (fromPos && toPos) {
				// Draw curved bezier connection
				ctx.beginPath();
				ctx.moveTo(fromPos.x + nodeWidth / 2, fromPos.y + nodeHeight / 2);

				const controlPointOffset = horizontalSpacing * 0.5;
				ctx.bezierCurveTo(
					fromPos.x + nodeWidth / 2 + controlPointOffset,
					fromPos.y + nodeHeight / 2,
					toPos.x + nodeWidth / 2 - controlPointOffset,
					toPos.y + nodeHeight / 2,
					toPos.x + nodeWidth / 2,
					toPos.y + nodeHeight / 2,
				);

				ctx.stroke();
			}
		});

		// Draw nodes
		nodes.forEach((node) => {
			const pos = positions.get(node.id);
			if (!pos) return;

			const isCurrent = current?.id === node.id;
			const isHovered = hoveredNode === node.id;

			// Node background with glass morphism effect
			const gradient = ctx.createLinearGradient(pos.x, pos.y, pos.x, pos.y + nodeHeight);

			if (isCurrent) {
				gradient.addColorStop(0, "rgba(59, 130, 246, 0.9)");
				gradient.addColorStop(1, "rgba(37, 99, 235, 0.9)");
			} else if (isHovered) {
				gradient.addColorStop(0, "rgba(139, 92, 246, 0.8)");
				gradient.addColorStop(1, "rgba(124, 58, 237, 0.8)");
			} else {
				gradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
				gradient.addColorStop(1, "rgba(241, 245, 249, 0.95)");
			}

			ctx.fillStyle = gradient;
			ctx.strokeStyle = isCurrent
				? "rgba(59, 130, 246, 1)"
				: isHovered
					? "rgba(139, 92, 246, 1)"
					: "rgba(203, 213, 225, 0.6)";
			ctx.lineWidth = isCurrent ? 3 : isHovered ? 2 : 1;

			// Draw rounded rectangle
			const radius = 12;
			ctx.beginPath();
			ctx.moveTo(pos.x + radius, pos.y);
			ctx.lineTo(pos.x + nodeWidth - radius, pos.y);
			ctx.quadraticCurveTo(pos.x + nodeWidth, pos.y, pos.x + nodeWidth, pos.y + radius);
			ctx.lineTo(pos.x + nodeWidth, pos.y + nodeHeight - radius);
			ctx.quadraticCurveTo(
				pos.x + nodeWidth,
				pos.y + nodeHeight,
				pos.x + nodeWidth - radius,
				pos.y + nodeHeight,
			);
			ctx.lineTo(pos.x + radius, pos.y + nodeHeight);
			ctx.quadraticCurveTo(pos.x, pos.y + nodeHeight, pos.x, pos.y + nodeHeight - radius);
			ctx.lineTo(pos.x, pos.y + radius);
			ctx.quadraticCurveTo(pos.x, pos.y, pos.x + radius, pos.y);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();

			// Shadow for depth
			if (isCurrent || isHovered) {
				ctx.shadowColor = isCurrent ? "rgba(59, 130, 246, 0.4)" : "rgba(139, 92, 246, 0.4)";
				ctx.shadowBlur = 15;
				ctx.shadowOffsetX = 0;
				ctx.shadowOffsetY = 5;
			}

			// Node text
			ctx.shadowBlur = 0;
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 0;
			ctx.fillStyle = isCurrent ? "white" : "#1e293b";
			ctx.font = isCurrent ? "bold 13px 'Segoe UI'" : "600 12px 'Segoe UI'";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";

			// Truncate text if too long
			let displayName = node.name;
			if (displayName.length > 14) {
				displayName = displayName.slice(0, 11) + "...";
			}

			ctx.fillText(displayName, pos.x + nodeWidth / 2, pos.y + nodeHeight / 2 - 8);

			// Timestamp
			const time = new Date(node.timestamp).toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
			});
			ctx.font = "10px 'Segoe UI'";
			ctx.fillStyle = isCurrent ? "rgba(255, 255, 255, 0.8)" : "rgba(71, 85, 105, 0.7)";
			ctx.fillText(time, pos.x + nodeWidth / 2, pos.y + nodeHeight / 2 + 10);

			// Branch indicator
			if (node.hasChildren) {
				ctx.fillStyle = isCurrent ? "rgba(255, 255, 255, 0.6)" : "rgba(99, 102, 241, 0.6)";
				ctx.beginPath();
				ctx.arc(pos.x + nodeWidth - 15, pos.y + 15, 5, 0, Math.PI * 2);
				ctx.fill();
			}
		});
	}, [isOpen, root, current, hoveredNode]);

	// Handle canvas click
	const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		// Find clicked node
		const { nodes } = getHistoryTreeData(root);
		for (const node of nodes) {
			const pos = nodePositions.get(node.id);
			if (!pos) continue;

			if (x >= pos.x && x <= pos.x + 120 && y >= pos.y && y <= pos.y + 80) {
				// Find the actual HistoryNode
				const findNode = (n: HistoryNode): HistoryNode | null => {
					if (n.id === node.id) return n;
					for (const future of n.futures) {
						const found = findNode(future);
						if (found) return found;
					}
					return null;
				};

				if (root) {
					const historyNode = findNode(root);
					if (historyNode) {
						onNavigate(historyNode);
					}
				}
				break;
			}
		}
	};

	// Handle canvas hover
	const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		// Find hovered node
		const { nodes } = getHistoryTreeData(root);
		let foundHover = false;
		for (const node of nodes) {
			const pos = nodePositions.get(node.id);
			if (!pos) continue;

			if (x >= pos.x && x <= pos.x + 120 && y >= pos.y && y <= pos.y + 80) {
				setHoveredNode(node.id);
				canvas.style.cursor = "pointer";
				foundHover = true;
				break;
			}
		}

		if (!foundHover) {
			setHoveredNode(null);
			canvas.style.cursor = "default";
		}
	};

	if (!root) {
		return (
			<Dialog isOpen={isOpen} onClose={onClose} title="History" width={400}>
				<div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
					No history available yet. Start drawing to build your history tree!
				</div>
			</Dialog>
		);
	}

	return (
		<Dialog isOpen={isOpen} onClose={onClose} title="History Tree" width={800}>
			<div className="history-tree-container" ref={containerRef}>
				<div className="history-tree-legend">
					<div className="legend-item">
						<div className="legend-color current"></div>
						<span>Current State</span>
					</div>
					<div className="legend-item">
						<div className="legend-color hover"></div>
						<span>Hover</span>
					</div>
					<div className="legend-item">
						<div className="legend-color branch"></div>
						<span>Has Branches</span>
					</div>
				</div>

				<div className="history-tree-canvas-wrapper">
					<canvas
						ref={canvasRef}
						onClick={handleCanvasClick}
						onMouseMove={handleCanvasMouseMove}
						onMouseLeave={() => setHoveredNode(null)}
					/>
				</div>

				<div className="history-tree-help">
					<p>Click any node to jump to that state in history</p>
					<p>Branches show where you undid and made different changes</p>
				</div>
			</div>
		</Dialog>
	);
}
