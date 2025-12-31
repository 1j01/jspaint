/**
 * HistoryTreeDialog - Temporal Branch Visualizer
 *
 * A stunning, production-ready history tree visualization inspired by:
 * - Git graph visualizations
 * - Timeline interfaces
 * - Technical diagrams with personality
 *
 * Design Philosophy: "Brutalist Elegance with Neon Accents"
 * - Sharp, geometric forms with precise alignment
 * - Monospace typography (IBM Plex Mono) for technical authenticity
 * - Selective use of vibrant neon highlights for interaction states
 * - Organic, flowing connections contrasting with rigid node containers
 * - Scanline and grain effects for tactile depth
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
 * Calculate tree layout positions using a sophisticated algorithm
 * that prevents overlaps and creates visually balanced trees.
 */
function calculateTreeLayout(root: HistoryNode | null): TreeLayout[] {
	if (!root) return [];

	const layouts: TreeLayout[] = [];
	const nodeWidth = 160;
	const nodeHeight = 100;
	const horizontalSpacing = 60;
	const verticalSpacing = 30;

	// Track occupied positions at each depth
	const depthPositions = new Map<number, number>();

	const traverse = (node: HistoryNode, depth: number, parentY?: number) => {
		let y: number;

		if (parentY !== undefined && node.parent?.children.length === 1) {
			// Single child: align with parent for clean linear progression
			y = parentY;
		} else {
			// Multiple children or root: stack vertically with spacing
			const currentY = depthPositions.get(depth) || 0;
			y = currentY;
			depthPositions.set(depth, y + nodeHeight + verticalSpacing);
		}

		const x = depth * (nodeWidth + horizontalSpacing);

		layouts.push({ node, x, y, depth });

		// Recurse to children
		node.children.forEach((child) => {
			traverse(child, depth + 1, y);
		});
	};

	traverse(root, 0);

	return layouts;
}

/**
 * Generate beautiful SVG path connections using cubic Bezier curves.
 * Creates organic, flowing lines between rigid geometric nodes.
 */
function generateConnections(layouts: TreeLayout[]): JSX.Element[] {
	const connections: JSX.Element[] = [];

	layouts.forEach((layout) => {
		const parent = layouts.find((l) => l.node === layout.node.parent);
		if (!parent) return;

		// Calculate anchor points (right edge of parent to left edge of child)
		const x1 = parent.x + 160;
		const y1 = parent.y + 50;
		const x2 = layout.x;
		const y2 = layout.y + 50;

		// Cubic bezier with horizontal tangents for smooth, professional curves
		const midX = (x1 + x2) / 2;
		const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

		connections.push(
			<path
				key={`${parent.node.id}-${layout.node.id}`}
				d={path}
				stroke="rgba(120, 255, 180, 0.2)"
				strokeWidth="2.5"
				fill="none"
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
	const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 900, height: 550 });
	const [isPanning, setIsPanning] = useState(false);
	const [panStart, setPanStart] = useState({ x: 0, y: 0 });

	const layouts = calculateTreeLayout(rootNode);
	const connections = generateConnections(layouts);

	// Auto-center on current node when dialog opens
	useEffect(() => {
		if (isOpen && currentNode && layouts.length > 0) {
			const currentLayout = layouts.find((l) => l.node.id === currentNode.id);
			if (currentLayout) {
				setTimeout(() => {
					setViewBox({
						x: Math.max(0, currentLayout.x - 300),
						y: Math.max(0, currentLayout.y - 200),
						width: 900,
						height: 550,
					});
				}, 100);
			}
		}
	}, [isOpen, currentNode, layouts]);

	// Pan interaction handlers
	const handleMouseDown = (e: React.MouseEvent) => {
		setIsPanning(true);
		setPanStart({ x: e.clientX, y: e.clientY });
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!isPanning) return;

		const dx = (panStart.x - e.clientX) * 1.5;
		const dy = (panStart.y - e.clientY) * 1.5;

		setViewBox((prev) => ({
			...prev,
			x: Math.max(0, prev.x + dx),
			y: Math.max(0, prev.y + dy),
		}));

		setPanStart({ x: e.clientX, y: e.clientY });
	};

	const handleMouseUp = () => {
		setIsPanning(false);
	};

	const handleNodeClick = (nodeId: string) => {
		setSelectedNode(nodeId);
		onNavigateToNode(nodeId);
	};

	const renderNode = (layout: TreeLayout) => {
		const { node, x, y } = layout;
		const isCurrent = currentNode?.id === node.id;
		const isHovered = hoveredNode === node.id;
		const isSelected = selectedNode === node.id;

		// Generate crisp thumbnail
		const canvas = document.createElement("canvas");
		const thumbSize = 70;
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
		const timestamp = new Date(node.timestamp).toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		});

		return (
			<g
				key={node.id}
				transform={`translate(${x}, ${y})`}
				onMouseEnter={() => setHoveredNode(node.id)}
				onMouseLeave={() => setHoveredNode(null)}
				onClick={(e) => {
					e.stopPropagation();
					handleNodeClick(node.id);
				}}
				className="history-node"
				style={{ cursor: "pointer" }}
			>
				{/* Animated glow for current node */}
				{isCurrent && (
					<rect
						x="-6"
						y="-6"
						width="172"
						height="112"
						fill="none"
						stroke="#78ffb4"
						strokeWidth="2"
						rx="6"
						className="current-glow"
					>
						<animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
					</rect>
				)}

				{/* Node container - brutalist sharp edges */}
				<rect
					x="0"
					y="0"
					width="160"
					height="100"
					fill={isCurrent ? "#1a2f26" : isHovered ? "#252525" : "#1a1a1a"}
					stroke={isCurrent ? "#78ffb4" : isSelected ? "#ff6b9d" : isHovered ? "#555" : "#333"}
					strokeWidth={isCurrent ? "2.5" : isHovered ? "2" : "1.5"}
					rx="4"
					className="node-bg"
				/>

				{/* Thumbnail container with inset border */}
				<foreignObject x="8" y="8" width="74" height="74">
					<div
						style={{
							width: "74px",
							height: "74px",
							border: "2px solid #2a2a2a",
							background: "#0a0a0a",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							overflow: "hidden",
							boxShadow: "inset 0 0 8px rgba(0,0,0,0.7)",
						}}
					>
						<img
							src={dataUrl}
							alt={node.name}
							style={{
								maxWidth: "100%",
								maxHeight: "100%",
								imageRendering: "pixelated",
								filter: isCurrent ? "brightness(1.1)" : "brightness(0.85)",
							}}
						/>
					</div>
				</foreignObject>

				{/* Node info with IBM Plex Mono aesthetic */}
				<foreignObject x="88" y="8" width="64" height="84">
					<div
						style={{
							fontFamily: '"IBM Plex Mono", "JetBrains Mono", "Courier New", monospace',
							fontSize: "9px",
							color: isCurrent ? "#78ffb4" : "#999",
							lineHeight: "1.3",
							letterSpacing: "0.02em",
						}}
					>
						{/* Operation name */}
						<div
							style={{
								fontWeight: "600",
								marginBottom: "4px",
								color: isCurrent ? "#78ffb4" : isHovered ? "#fff" : "#ccc",
								textTransform: "uppercase",
								fontSize: "8px",
								letterSpacing: "0.5px",
							}}
						>
							{node.name.substring(0, 10)}
							{node.name.length > 10 && "…"}
						</div>

						{/* Timestamp */}
						<div style={{ fontSize: "7px", color: "#666", marginBottom: "3px" }}>{timestamp}</div>

						{/* Dimensions */}
						<div style={{ fontSize: "7px", color: "#555" }}>
							{node.imageData.width}×{node.imageData.height}
						</div>

						{/* Branch count */}
						{node.children.length > 0 && (
							<div style={{ fontSize: "7px", marginTop: "4px", color: "#ff6b9d", fontWeight: "600" }}>
								↳ {node.children.length} {node.children.length > 1 ? "branches" : "branch"}
							</div>
						)}
					</div>
				</foreignObject>

				{/* Current indicator pulse */}
				{isCurrent && (
					<circle cx="152" cy="12" r="5" fill="#78ffb4">
						<animate attributeName="r" values="4;6;4" dur="1.5s" repeatCount="indefinite" />
						<animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" />
					</circle>
				)}

				{/* Hover state indicator */}
				{isHovered && !isCurrent && (
					<circle cx="152" cy="12" r="4" fill="#ff6b9d" opacity="0.8" />
				)}
			</g>
		);
	};

	if (!isOpen || !rootNode) return null;

	const maxDepth = Math.max(...layouts.map((l) => l.depth)) + 1;
	const nodeCount = layouts.length;

	return (
		<Dialog isOpen={isOpen} onClose={onClose} title="⟨ TEMPORAL BRANCHES ⟩" width="960px">
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');

				.history-tree-container {
					background: linear-gradient(160deg, #0d0d0d 0%, #1a1a1a 50%, #0f0f0f 100%);
					border: 2px solid #2a2a2a;
					border-radius: 6px;
					position: relative;
					overflow: hidden;
					box-shadow: inset 0 0 40px rgba(0,0,0,0.5);
				}

				.tree-connection {
					transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
					filter: drop-shadow(0 0 2px rgba(120, 255, 180, 0.1));
				}

				.history-node:hover ~ .tree-connection,
				.tree-connection:hover {
					stroke: rgba(255, 107, 157, 0.6) !important;
					stroke-width: 3.5 !important;
					filter: drop-shadow(0 0 8px rgba(255, 107, 157, 0.4));
				}

				.node-bg {
					transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
				}

				.history-node:hover .node-bg {
					filter: brightness(1.4);
					transform: scale(1.02);
				}

				.current-glow {
					filter: drop-shadow(0 0 12px rgba(120, 255, 180, 0.6));
				}

				.history-controls {
					display: flex;
					gap: 15px;
					margin-top: 16px;
					padding: 12px 16px;
					background: linear-gradient(135deg, #1a1a1a 0%, #222 100%);
					border: 1.5px solid #333;
					border-radius: 5px;
					font-family: 'IBM Plex Mono', 'Courier New', monospace;
					font-size: 10px;
					box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
				}

				.history-legend {
					display: flex;
					gap: 24px;
					align-items: center;
					color: #888;
					flex-wrap: wrap;
				}

				.legend-item {
					display: flex;
					align-items: center;
					gap: 8px;
					font-weight: 500;
					letter-spacing: 0.3px;
				}

				.legend-dot {
					width: 12px;
					height: 12px;
					border-radius: 50%;
					border: 1px solid rgba(255,255,255,0.1);
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
					height: 3px;
					background: linear-gradient(transparent, rgba(120, 255, 180, 0.08), transparent);
					animation: scanline 4s linear infinite;
					pointer-events: none;
					z-index: 10;
				}

				@keyframes grain {
					0%, 100% { opacity: 0.03; }
					50% { opacity: 0.06; }
				}

				.grain-overlay {
					position: absolute;
					inset: 0;
					background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
					opacity: 0.04;
					pointer-events: none;
					animation: grain 8s infinite;
					mix-blend-mode: overlay;
				}

				.svg-canvas {
					cursor: ${isPanning ? "grabbing" : "grab"};
					user-select: none;
				}

				.tree-stats {
					margin-left: auto;
					color: #666;
					font-size: 9px;
					font-weight: 600;
					letter-spacing: 0.5px;
					text-align: right;
				}

				.tree-stats-value {
					color: #78ffb4;
					font-weight: 700;
				}

				.help-text {
					margin-top: 12px;
					color: #777;
					fontSize: 10px;
					fontFamily: 'IBM Plex Mono', monospace;
					lineHeight: 1.6;
					borderTop: 1px solid #2a2a2a;
					paddingTop: 12px;
				}

				.help-bullet {
					color: #78ffb4;
					fontWeight: 700;
					marginRight: 6px;
				}
			`}</style>

			<div className="history-tree-container" ref={containerRef}>
				{/* Atmospheric effects */}
				<div className="scanline-effect" />
				<div className="grain-overlay" />

				<svg
					className="svg-canvas"
					width="100%"
					height="520"
					viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onMouseLeave={handleMouseUp}
					style={{
						background: "#0a0a0a",
						borderRadius: "6px",
					}}
				>
					{/* Grid pattern for technical aesthetic */}
					<defs>
						<pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
							<path d="M 30 0 L 0 0 0 30" fill="none" stroke="#151515" strokeWidth="0.5" />
						</pattern>
						<pattern id="grid-major" width="150" height="150" patternUnits="userSpaceOnUse">
							<path d="M 150 0 L 0 0 0 150" fill="none" stroke="#1a1a1a" strokeWidth="1" />
						</pattern>
					</defs>

					<rect width="100%" height="100%" fill="url(#grid)" />
					<rect width="100%" height="100%" fill="url(#grid-major)" />

					{/* Connection layer */}
					<g className="connections">{connections}</g>

					{/* Node layer */}
					<g className="nodes">{layouts.map((layout) => renderNode(layout))}</g>
				</svg>
			</div>

			{/* Control panel */}
			<div className="history-controls">
				<div className="history-legend">
					<div className="legend-item">
						<div
							className="legend-dot"
							style={{
								background: "#78ffb4",
								boxShadow: "0 0 8px rgba(120, 255, 180, 0.6)",
							}}
						/>
						<span>CURRENT</span>
					</div>
					<div className="legend-item">
						<div className="legend-dot" style={{ background: "#ff6b9d" }} />
						<span>SELECTED</span>
					</div>
					<div className="legend-item">
						<div className="legend-dot" style={{ background: "#666" }} />
						<span>AVAILABLE</span>
					</div>
					<div className="tree-stats">
						<span className="tree-stats-value">{nodeCount}</span> STATE
						{nodeCount !== 1 ? "S" : ""} | DEPTH: <span className="tree-stats-value">{maxDepth}</span>
					</div>
				</div>
			</div>

			{/* Help text */}
			<div className="help-text">
				<div>
					<span className="help-bullet">◆</span>
					Click any node to jump to that state in time
				</div>
				<div>
					<span className="help-bullet">◆</span>
					Branches show alternate timelines where different choices were made
				</div>
				<div>
					<span className="help-bullet">◆</span>
					Drag the canvas to pan and explore your complete history
				</div>
			</div>

			<DialogButtons>
				<button
					onClick={onClose}
					style={{
						fontFamily: '"IBM Plex Mono", monospace',
						textTransform: "uppercase",
						letterSpacing: "0.5px",
						fontWeight: "600",
					}}
				>
					[ESC] Close
				</button>
			</DialogButtons>
		</Dialog>
	);
}
