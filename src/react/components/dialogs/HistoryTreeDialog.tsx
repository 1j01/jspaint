/**
 * HistoryTreeDialog - Neo-Brutalist Tech Archive
 *
 * A visually stunning tree visualization for non-linear history navigation.
 * Inspired by git graphs, version control systems, and technical diagrams.
 */

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogButtons } from "./Dialog";
import type { HistoryNode } from "../../utils/historyTree";

interface HistoryTreeDialogProps {
	isOpen: boolean;
	onClose: () => void;
	rootNode: HistoryNode | null;
	currentNode: HistoryNode | null;
	onNavigateToNode: (nodeId: string) => void;
}

interface TreeLayout {
	node: HistoryNode;
	x: number;
	y: number;
	depth: number;
}

/**
 * Calculate tree layout positions for visualization
 */
function calculateTreeLayout(root: HistoryNode | null): TreeLayout[] {
	if (!root) return [];

	const layouts: TreeLayout[] = [];
	const nodeWidth = 140;
	const nodeHeight = 120;
	const horizontalSpacing = 40;
	const verticalSpacing = 40;

	// Track occupied positions to prevent overlaps
	const occupiedY = new Map<number, number>(); // depth -> max y position

	const traverse = (node: HistoryNode, depth: number, parentY?: number) => {
		// Calculate y position
		let y: number;
		if (parentY !== undefined && node.parent?.children.length === 1) {
			// Single child: align with parent
			y = parentY;
		} else {
			// Multiple children or root: stack vertically
			const currentMaxY = occupiedY.get(depth) || 0;
			y = currentMaxY;
			occupiedY.set(depth, y + nodeHeight + verticalSpacing);
		}

		const x = depth * (nodeWidth + horizontalSpacing);

		layouts.push({ node, x, y, depth });

		// Process children
		node.children.forEach((child) => {
			traverse(child, depth + 1, y);
		});
	};

	traverse(root, 0);

	return layouts;
}

/**
 * Generate SVG paths for connections between nodes
 */
function generateConnections(layouts: TreeLayout[]): JSX.Element[] {
	const connections: JSX.Element[] = [];

	layouts.forEach((layout) => {
		const parent = layouts.find((l) => l.node === layout.node.parent);
		if (!parent) return;

		const x1 = parent.x + 70; // Center of parent node
		const y1 = parent.y + 45;
		const x2 = layout.x + 70; // Center of current node
		const y2 = layout.y + 45;

		// Cubic bezier curve for smooth connections
		const midX = (x1 + x2) / 2;
		const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

		connections.push(
			<path
				key={`${parent.node.id}-${layout.node.id}`}
				d={path}
				stroke="rgba(100, 255, 100, 0.3)"
				strokeWidth="2"
				fill="none"
				strokeDasharray="5,5"
				className="tree-connection"
			/>
		);
	});

	return connections;
}

export function HistoryTreeDialog({
	isOpen,
	onClose,
	rootNode,
	currentNode,
	onNavigateToNode,
}: HistoryTreeDialogProps) {
	const [hoveredNode, setHoveredNode] = useState<string | null>(null);
	const [selectedNode, setSelectedNode] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 600 });

	const layouts = calculateTreeLayout(rootNode);
	const connections = generateConnections(layouts);

	// Auto-scroll to current node when dialog opens
	useEffect(() => {
		if (isOpen && currentNode && containerRef.current) {
			const currentLayout = layouts.find((l) => l.node.id === currentNode.id);
			if (currentLayout) {
				// Center viewport on current node
				setTimeout(() => {
					setViewBox({
						x: Math.max(0, currentLayout.x - 200),
						y: Math.max(0, currentLayout.y - 200),
						width: 800,
						height: 600,
					});
				}, 100);
			}
		}
	}, [isOpen, currentNode, layouts]);

	const handleNodeClick = (nodeId: string) => {
		setSelectedNode(nodeId);
		onNavigateToNode(nodeId);
	};

	const renderNode = (layout: TreeLayout) => {
		const { node, x, y } = layout;
		const isCurrent = currentNode?.id === node.id;
		const isHovered = hoveredNode === node.id;
		const isSelected = selectedNode === node.id;

		// Generate thumbnail
		const canvas = document.createElement("canvas");
		const thumbSize = 60;
		const scale = Math.min(thumbSize / node.imageData.width, thumbSize / node.imageData.height);
		canvas.width = node.imageData.width * scale;
		canvas.height = node.imageData.height * scale;
		const ctx = canvas.getContext("2d");

		if (ctx) {
			const tempCanvas = document.createElement("canvas");
			tempCanvas.width = node.imageData.width;
			tempCanvas.height = node.imageData.height;
			const tempCtx = tempCanvas.getContext("2d");
			if (tempCtx) {
				tempCtx.putImageData(node.imageData, 0, 0);
				ctx.imageSmoothingEnabled = false;
				ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
			}
		}

		const dataUrl = canvas.toDataURL();
		const timestamp = new Date(node.timestamp).toLocaleTimeString();

		return (
			<g
				key={node.id}
				transform={`translate(${x}, ${y})`}
				onMouseEnter={() => setHoveredNode(node.id)}
				onMouseLeave={() => setHoveredNode(null)}
				onClick={() => handleNodeClick(node.id)}
				className="history-node"
				style={{ cursor: "pointer" }}
			>
				{/* Outer glow for current node */}
				{isCurrent && (
					<rect
						x="-5"
						y="-5"
						width="150"
						height="100"
						fill="none"
						stroke="#00ff00"
						strokeWidth="3"
						rx="4"
						className="current-glow"
					>
						<animate
							attributeName="stroke-opacity"
							values="0.3;1;0.3"
							dur="2s"
							repeatCount="indefinite"
						/>
					</rect>
				)}

				{/* Node container */}
				<rect
					x="0"
					y="0"
					width="140"
					height="90"
					fill={isCurrent ? "#1a3a1a" : isHovered ? "#2a2a2a" : "#1a1a1a"}
					stroke={isCurrent ? "#00ff00" : isSelected ? "#00aaff" : "#444"}
					strokeWidth={isCurrent ? "2" : "1"}
					rx="3"
					className="node-bg"
				/>

				{/* Thumbnail */}
				<foreignObject x="5" y="5" width="60" height="60">
					<div
						style={{
							width: "60px",
							height: "60px",
							border: "2px solid #333",
							background: "#000",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							overflow: "hidden",
						}}
					>
						<img
							src={dataUrl}
							alt={node.name}
							style={{
								maxWidth: "100%",
								maxHeight: "100%",
								imageRendering: "pixelated",
								filter: isCurrent ? "brightness(1.2)" : "brightness(0.9)",
							}}
						/>
					</div>
				</foreignObject>

				{/* Node info */}
				<foreignObject x="70" y="5" width="65" height="80">
					<div
						style={{
							fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
							fontSize: "9px",
							color: isCurrent ? "#00ff00" : "#aaa",
							lineHeight: "1.2",
						}}
					>
						<div
							style={{
								fontWeight: "bold",
								marginBottom: "3px",
								color: isCurrent ? "#00ff00" : "#fff",
								textTransform: "uppercase",
								letterSpacing: "0.5px",
							}}
						>
							{node.name.substring(0, 12)}
						</div>
						<div style={{ fontSize: "8px", color: "#666" }}>{timestamp}</div>
						<div style={{ fontSize: "8px", marginTop: "2px" }}>
							{node.imageData.width}×{node.imageData.height}
						</div>
						{node.children.length > 0 && (
							<div style={{ fontSize: "8px", marginTop: "2px", color: "#00aaff" }}>
								↳ {node.children.length} branch{node.children.length > 1 ? "es" : ""}
							</div>
						)}
					</div>
				</foreignObject>

				{/* Current node indicator */}
				{isCurrent && (
					<circle cx="135" cy="10" r="4" fill="#00ff00">
						<animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />
					</circle>
				)}
			</g>
		);
	};

	if (!isOpen || !rootNode) return null;

	return (
		<Dialog isOpen={isOpen} onClose={onClose} title="◢ HISTORY TREE ◣" width="900px">
			<style>{`
				.history-tree-container {
					background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
					border: 2px solid #333;
					border-radius: 4px;
					position: relative;
					overflow: hidden;
				}

				.tree-connection {
					transition: stroke 0.3s ease;
				}

				.history-node:hover .tree-connection {
					stroke: rgba(0, 170, 255, 0.6) !important;
				}

				.node-bg {
					transition: all 0.2s ease;
				}

				.history-node:hover .node-bg {
					filter: brightness(1.3);
				}

				.current-glow {
					filter: drop-shadow(0 0 10px #00ff00);
				}

				.history-controls {
					display: flex;
					gap: 10px;
					margin-top: 15px;
					padding: 10px;
					background: #1a1a1a;
					border: 1px solid #333;
					border-radius: 3px;
					font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
					font-size: 11px;
				}

				.history-legend {
					display: flex;
					gap: 20px;
					align-items: center;
					color: #888;
				}

				.legend-item {
					display: flex;
					align-items: center;
					gap: 6px;
				}

				.legend-dot {
					width: 10px;
					height: 10px;
					border-radius: 50%;
				}

				@keyframes scanline {
					0% { transform: translateY(-100%); }
					100% { transform: translateY(100%); }
				}

				.scanline-effect {
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					height: 2px;
					background: linear-gradient(transparent, rgba(0, 255, 0, 0.1), transparent);
					animation: scanline 3s linear infinite;
					pointer-events: none;
				}
			`}</style>

			<div className="history-tree-container" ref={containerRef}>
				{/* Scanline effect for retro feel */}
				<div className="scanline-effect" />

				<svg
					width="100%"
					height="500"
					viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
					style={{
						background: "#0a0a0a",
						borderRadius: "4px",
					}}
				>
					{/* Grid pattern */}
					<defs>
						<pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
							<path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1a1a1a" strokeWidth="0.5" />
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill="url(#grid)" />

					{/* Connections */}
					<g className="connections">{connections}</g>

					{/* Nodes */}
					<g className="nodes">{layouts.map((layout) => renderNode(layout))}</g>
				</svg>
			</div>

			<div className="history-controls">
				<div className="history-legend">
					<div className="legend-item">
						<div className="legend-dot" style={{ background: "#00ff00", boxShadow: "0 0 5px #00ff00" }} />
						<span>CURRENT</span>
					</div>
					<div className="legend-item">
						<div className="legend-dot" style={{ background: "#00aaff" }} />
						<span>SELECTED</span>
					</div>
					<div className="legend-item">
						<div className="legend-dot" style={{ background: "#666" }} />
						<span>AVAILABLE</span>
					</div>
					<div style={{ marginLeft: "auto", color: "#666", fontSize: "10px" }}>
						{layouts.length} STATE{layouts.length !== 1 ? "S" : ""} | TREE DEPTH: {Math.max(...layouts.map((l) => l.depth)) + 1}
					</div>
				</div>
			</div>

			<div style={{ marginTop: "10px", color: "#888", fontSize: "11px", fontFamily: '"JetBrains Mono", monospace' }}>
				<strong style={{ color: "#00ff00" }}>◢</strong> Click any node to jump to that state
				<br />
				<strong style={{ color: "#00ff00" }}>◢</strong> Branches show alternate timelines where you made different choices
			</div>

			<DialogButtons>
				<button onClick={onClose} style={{ fontFamily: '"JetBrains Mono", monospace', textTransform: "uppercase" }}>
					[ESC] Close
				</button>
			</DialogButtons>
		</Dialog>
	);
}
