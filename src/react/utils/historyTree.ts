/**
 * Tree-based History System
 *
 * Implements a non-linear undo/redo system where:
 * - Each action creates a new history node
 * - Undo moves to the parent node
 * - Redo moves to the most recent child node
 * - Making a change after undo creates a new branch (doesn't delete redo history)
 * - Users can navigate the full tree via a history dialog
 *
 * This matches the sophisticated history system from MS Paint.
 */

/**
 * History node in the tree structure.
 * Each node represents a saved state of the canvas.
 */
export interface HistoryNode {
  /** Unique identifier for this node */
  id: string;

  /** Parent node (the state this was created from), or null for root */
  parent: HistoryNode | null;

  /** Child nodes (states created from this state) */
  children: HistoryNode[];

  /** When this state was created */
  timestamp: number;

  /** The canvas image data for this state */
  imageData: ImageData;

  /** Selection image data, if any */
  selectionImageData?: ImageData | null;

  /** Selection position */
  selectionX?: number;
  selectionY?: number;
  selectionWidth?: number;
  selectionHeight?: number;

  /** Text box state, if any */
  textBoxText?: string;
  textBoxX?: number;
  textBoxY?: number;
  textBoxWidth?: number;
  textBoxHeight?: number;

  /** Operation name (for display in history dialog) */
  name: string;

  /** Whether this is a "soft" state (should be skipped during normal undo/redo) */
  soft?: boolean;

  /** Foreground color at this state */
  foregroundColor?: string;

  /** Background color at this state */
  backgroundColor?: string;
}

/**
 * History tree manager.
 * Maintains the tree structure and current position.
 */
export class HistoryTree {
  private root: HistoryNode;
  private current: HistoryNode;
  private nextId = 0;
  private oldHistoryPath: Set<HistoryNode> = new Set(); // Track previous path for smart redo

  /**
   * Create a new history tree with an initial state.
   *
   * @param initialImageData - Initial canvas state
   * @param name - Name for the initial state
   */
  constructor(initialImageData: ImageData, name = "Initial State") {
    this.root = {
      id: this.generateId(),
      parent: null,
      children: [],
      timestamp: Date.now(),
      imageData: initialImageData,
      name,
    };
    this.current = this.root;
  }

  /**
   * Generate a unique ID for a history node.
   * Uses incrementing counter for simplicity.
   *
   * @returns Unique string ID in format "node-N"
   */
  private generateId(): string {
    return `node-${this.nextId++}`;
  }

  /**
   * Get the current history node.
   *
   * @returns The currently active history node
   */
  getCurrent(): HistoryNode {
    return this.current;
  }

  /**
   * Get the root history node.
   *
   * @returns The root node of the history tree (first state)
   */
  getRoot(): HistoryNode {
    return this.root;
  }

  /**
   * Get all nodes in the tree (for history dialog).
   * Returns nodes in depth-first order starting from root.
   * Used to display the complete history tree visualization.
   *
   * @returns Array of all HistoryNode objects in the tree
   */
  getAllNodes(): HistoryNode[] {
    const nodes: HistoryNode[] = [];

    const traverse = (node: HistoryNode) => {
      nodes.push(node);
      for (const child of node.children) {
        traverse(child);
      }
    };

    traverse(this.root);
    return nodes;
  }

  /**
   * Get path from root to current node (for linear undo/redo display).
   * Returns array of nodes starting with root and ending with current.
   * Used by linear history views and for calculating undo depth.
   *
   * @returns Array of HistoryNode objects from root to current
   */
  getCurrentPath(): HistoryNode[] {
    const path: HistoryNode[] = [];
    let node: HistoryNode | null = this.current;

    while (node) {
      path.unshift(node);
      node = node.parent;
    }

    return path;
  }

  /**
   * Push a new state onto the history tree.
   * Creates a new node as a child of the current node.
   *
   * @param imageData - Canvas state to save
   * @param name - Operation name
   * @param options - Additional state data
   * @returns The newly created node
   */
  push(
    imageData: ImageData,
    name: string,
    options: {
      selectionImageData?: ImageData | null;
      selectionX?: number;
      selectionY?: number;
      selectionWidth?: number;
      selectionHeight?: number;
      textBoxText?: string;
      textBoxX?: number;
      textBoxY?: number;
      textBoxWidth?: number;
      textBoxHeight?: number;
      soft?: boolean;
      foregroundColor?: string;
      backgroundColor?: string;
    } = {},
  ): HistoryNode {
    const newNode: HistoryNode = {
      id: this.generateId(),
      parent: this.current,
      children: [],
      timestamp: Date.now(),
      imageData,
      name,
      ...options,
    };

    // Add as child of current node
    this.current.children.push(newNode);

    // Move to new node
    this.current = newNode;

    return newNode;
  }

  /**
   * Check if undo is possible.
   * Undo is possible when current node has a parent (not at root).
   *
   * @returns True if undo operation can be performed
   */
  canUndo(): boolean {
    return this.current.parent !== null;
  }

  /**
   * Check if redo is possible.
   * Redo is possible if the current node has at least one child node.
   * When multiple children exist, redo chooses the most recent or preferred branch.
   *
   * @returns True if redo operation can be performed
   */
  canRedo(): boolean {
    return this.current.children.length > 0;
  }

  /**
   * Undo to the parent state.
   * Skips soft states during normal undo.
   *
   * @returns The node we moved to, or null if can't undo
   */
  undo(): HistoryNode | null {
    if (!this.canUndo()) return null;

    let node = this.current.parent!;

    // Skip soft states during normal undo
    while (node.soft && node.parent) {
      node = node.parent;
    }

    this.current = node;
    return node;
  }

  /**
   * Redo to a child state.
   * Uses smart branch selection - prefers nodes on the previous path (where you came from).
   * This matches jQuery's behavior from functions.js:2089-2103
   *
   * @returns The node we moved to, or null if can't redo
   */
  redo(): HistoryNode | null {
    if (!this.canRedo()) return null;

    // Sort children to prefer nodes on the old history path
    // This ensures redo takes you back to where you came from after jumping around
    const sortedChildren = [...this.current.children].sort((a, b) => {
      const aOnOldPath = this.oldHistoryPath.has(a);
      const bOnOldPath = this.oldHistoryPath.has(b);

      if (aOnOldPath && !bOnOldPath) return -1; // a comes first
      if (!aOnOldPath && bOnOldPath) return 1; // b comes first
      return 0; // Keep original order
    });

    // Move to the first child (prioritized by old path)
    let node = sortedChildren[0];

    // Skip soft states during normal redo
    while (node.soft && node.children.length > 0) {
      const sortedGrandchildren = [...node.children].sort((a, b) => {
        const aOnOldPath = this.oldHistoryPath.has(a);
        const bOnOldPath = this.oldHistoryPath.has(b);
        if (aOnOldPath && !bOnOldPath) return -1;
        if (!aOnOldPath && bOnOldPath) return 1;
        return 0;
      });
      node = sortedGrandchildren[0];
    }

    this.current = node;
    return node;
  }

  /**
   * Go to a specific node in the tree.
   * Used by the history dialog for non-linear navigation.
   * Updates the old history path for smart redo behavior.
   * Matches jQuery's go_to_history_node logic from functions.js:2074-2109
   *
   * @param nodeId - ID of the node to go to
   * @returns The node we moved to, or null if not found
   */
  goToNode(nodeId: string): HistoryNode | null {
    const findNode = (node: HistoryNode): HistoryNode | null => {
      if (node.id === nodeId) return node;

      for (const child of node.children) {
        const found = findNode(child);
        if (found) return found;
      }

      return null;
    };

    const targetNode = findNode(this.root);
    if (!targetNode) return null;

    // Save the old history path before jumping
    // This allows redo to intelligently choose branches
    const oldPath: HistoryNode[] = [];
    let node: HistoryNode | null = this.current;
    while (node) {
      oldPath.push(node);
      node = node.parent;
    }

    // Update old history path set
    this.oldHistoryPath = new Set(oldPath);

    // Move to the target node
    this.current = targetNode;

    return targetNode;
  }

  /**
   * Get undo stack (path from root to current, excluding current).
   * For compatibility with linear undo/redo UI.
   * Returns all previous states that can be undone to.
   *
   * @returns Array of HistoryNode objects representing undo stack
   */
  getUndoStack(): HistoryNode[] {
    const path = this.getCurrentPath();
    return path.slice(0, -1); // Exclude current
  }

  /**
   * Get redo stack (most recent child branch from current).
   * For compatibility with linear undo/redo UI.
   * Follows the most recently created child at each level.
   *
   * @returns Array of HistoryNode objects representing redo stack
   */
  getRedoStack(): HistoryNode[] {
    const redos: HistoryNode[] = [];
    let node = this.current;

    // Follow the most recent child branch
    while (node.children.length > 0) {
      node = node.children[node.children.length - 1];
      redos.push(node);
    }

    return redos;
  }

  /**
   * Prune old history to save memory.
   * Removes nodes older than a certain threshold or limits total nodes.
   *
   * @param maxNodes - Maximum number of nodes to keep
   */
  prune(maxNodes = 50): void {
    const allNodes = this.getAllNodes();

    if (allNodes.length <= maxNodes) return;

    // Keep nodes on the current path plus recent branches
    const currentPath = new Set(this.getCurrentPath().map((n) => n.id));
    const nodesToKeep = new Set(currentPath);

    // Sort all nodes by timestamp (oldest first)
    const sortedNodes = [...allNodes].sort((a, b) => a.timestamp - b.timestamp);

    // Keep the most recent nodes
    const recentNodes = sortedNodes.slice(-maxNodes);
    recentNodes.forEach((n) => nodesToKeep.add(n.id));

    // Remove nodes not in the keep set
    const removeFromNode = (node: HistoryNode) => {
      node.children = node.children.filter((child) => {
        if (nodesToKeep.has(child.id)) {
          removeFromNode(child);
          return true;
        }
        return false;
      });
    };

    removeFromNode(this.root);
  }
}
