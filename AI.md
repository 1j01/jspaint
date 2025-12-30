# MCPaint AI Architecture

## Overview

This document outlines the AI integration architecture for MCPaint, enabling natural language control of the drawing canvas. Users can describe what they want to draw, and an LLM will generate a sequence of drawing commands that are executed on the canvas.

Based on the architecture from [MCPlator](https://github.com/evgenyvinnik/MCPlator), adapted for a paint application.

## Architecture Components

### 1. Chat Panel (OS-GUI)

A Windows 98-style chat panel using OS-GUI library, positioned on the right side of the main canvas.

**Component Structure:**
```
AIChatPanel (OS-GUI $Window)
├── MessageList
│   ├── UserMessage
│   ├── AIMessage
│   └── StreamingMessage (for real-time display)
├── InputArea
│   ├── TextInput (multiline)
│   └── SendButton
└── StatusIndicator (drawing progress)
```

**File Location:** `src/react/components/AIChatPanel.tsx`

### 2. LLM Integration

**API Provider:** Claude API with tool calling (Anthropic)

**Backend Proxy:** Vercel Edge Functions or similar serverless endpoint
- Handles API key security (keys never exposed to client)
- Implements request validation/filtering
- Streams responses via SSE

**Endpoint:** `/api/ai/draw`

### 3. Command System (Tool Calling)

The AI has access to **everything** a user can do - all 16 drawing tools, selection operations, canvas manipulation, color management, and more.

#### Tool Categories

```typescript
type CommandCategory =
  | 'drawing'      // Pencil, brush, shapes, etc.
  | 'selection'    // Select, move, transform
  | 'canvas'       // Resize, clear, attributes
  | 'color'        // Set colors, pick from canvas
  | 'edit'         // Undo, redo, copy, paste
  | 'transform'    // Flip, rotate, stretch, skew
  | 'view';        // Zoom, magnifier
```

---

### 3.1 Drawing Tools (16 Tools)

```typescript
// ═══════════════════════════════════════════════════════════
// FREEFORM DRAWING
// ═══════════════════════════════════════════════════════════

interface PencilCommand {
  tool: 'pencil';
  params: {
    path: string;              // "x1,y1;x2,y2;x3,y3" compact format
    color?: string;            // Hex color (uses primary if omitted)
  };
}

interface BrushCommand {
  tool: 'brush';
  params: {
    path: string;              // "x1,y1;x2,y2;x3,y3"
    color?: string;
    size?: number;             // 1-50 pixels
    shape?: 'round' | 'square' | 'forward_slash' | 'back_slash';
  };
}

interface AirbrushCommand {
  tool: 'airbrush';
  params: {
    path?: string;             // For spraying along a path
    x?: number;                // Single point spray
    y?: number;
    color?: string;
    size?: number;             // Spray radius
    density?: number;          // 1-100, particles per spray
    duration?: number;         // ms to spray at single point
  };
}

interface EraserCommand {
  tool: 'eraser';
  params: {
    path: string;              // "x1,y1;x2,y2;x3,y3"
    size?: number;             // Eraser size
    shape?: 'round' | 'square';
    eraseToColor?: string;     // Default: secondary color (usually white)
  };
}

// ═══════════════════════════════════════════════════════════
// SHAPE TOOLS
// ═══════════════════════════════════════════════════════════

interface LineCommand {
  tool: 'line';
  params: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color?: string;
    width?: number;            // Line thickness 1-5
  };
}

interface RectangleCommand {
  tool: 'rectangle';
  params: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color?: string;            // Outline color
    fillColor?: string;        // Fill color (if filled)
    fillMode?: 'outline' | 'filled' | 'filled_with_outline';
    lineWidth?: number;
  };
}

interface RoundedRectangleCommand {
  tool: 'rounded_rectangle';
  params: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color?: string;
    fillColor?: string;
    fillMode?: 'outline' | 'filled' | 'filled_with_outline';
    cornerRadius?: number;     // Radius of rounded corners
    lineWidth?: number;
  };
}

interface EllipseCommand {
  tool: 'ellipse';
  params: {
    startX: number;            // Bounding box
    startY: number;
    endX: number;
    endY: number;
    color?: string;
    fillColor?: string;
    fillMode?: 'outline' | 'filled' | 'filled_with_outline';
    lineWidth?: number;
  };
}

interface PolygonCommand {
  tool: 'polygon';
  params: {
    points: Array<{ x: number; y: number }>;  // Vertices
    color?: string;
    fillColor?: string;
    fillMode?: 'outline' | 'filled' | 'filled_with_outline';
    closed?: boolean;          // Auto-close polygon (default: true)
    lineWidth?: number;
  };
}

interface CurveCommand {
  tool: 'curve';
  params: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    controlPoint1: { x: number; y: number };   // First bend point
    controlPoint2?: { x: number; y: number };  // Optional second bend
    color?: string;
    lineWidth?: number;
  };
}

// ═══════════════════════════════════════════════════════════
// FILL & COLOR TOOLS
// ═══════════════════════════════════════════════════════════

interface FillCommand {
  tool: 'fill';
  params: {
    x: number;                 // Start point for flood fill
    y: number;
    color?: string;            // Fill color (uses primary if omitted)
    tolerance?: number;        // Color matching tolerance 0-255
  };
}

interface PickColorCommand {
  tool: 'pick_color';
  params: {
    x: number;
    y: number;
    target?: 'primary' | 'secondary';  // Which color to set
  };
}

// ═══════════════════════════════════════════════════════════
// TEXT TOOL
// ═══════════════════════════════════════════════════════════

interface TextCommand {
  tool: 'text';
  params: {
    x: number;
    y: number;
    text: string;
    color?: string;
    fontFamily?: string;       // e.g., "Arial", "Times New Roman"
    fontSize?: number;         // Points
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    backgroundColor?: string;  // For opaque text background
    transparent?: boolean;     // Transparent background (default: true)
  };
}

// ═══════════════════════════════════════════════════════════
// VIEW/MAGNIFIER
// ═══════════════════════════════════════════════════════════

interface MagnifierCommand {
  tool: 'magnifier';
  params: {
    x?: number;                // Center zoom on point
    y?: number;
    zoom: number;              // 1, 2, 4, 6, 8 (1 = 100%)
  };
}
```

---

### 3.2 Selection Tools

```typescript
// ═══════════════════════════════════════════════════════════
// SELECTION CREATION
// ═══════════════════════════════════════════════════════════

interface RectangularSelectCommand {
  tool: 'select_rectangle';
  params: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    mode?: 'opaque' | 'transparent';  // Include/exclude background
  };
}

interface FreeformSelectCommand {
  tool: 'select_freeform';
  params: {
    path: string;              // "x1,y1;x2,y2;..." outline points
    mode?: 'opaque' | 'transparent';
  };
}

interface SelectAllCommand {
  tool: 'select_all';
  params: {};
}

interface DeselectCommand {
  tool: 'deselect';
  params: {};
}

// ═══════════════════════════════════════════════════════════
// SELECTION OPERATIONS
// ═══════════════════════════════════════════════════════════

interface MoveSelectionCommand {
  tool: 'move_selection';
  params: {
    deltaX: number;            // Relative movement
    deltaY: number;
    // OR absolute position:
    toX?: number;
    toY?: number;
  };
}

interface CopySelectionCommand {
  tool: 'copy';
  params: {};
}

interface CutSelectionCommand {
  tool: 'cut';
  params: {};
}

interface PasteCommand {
  tool: 'paste';
  params: {
    x?: number;                // Paste position (default: top-left)
    y?: number;
  };
}

interface DeleteSelectionCommand {
  tool: 'delete_selection';
  params: {};                  // Fills with secondary color
}

interface CropToSelectionCommand {
  tool: 'crop_to_selection';
  params: {};
}
```

---

### 3.3 Transform Operations

```typescript
// ═══════════════════════════════════════════════════════════
// FLIP & ROTATE (applies to selection or entire canvas)
// ═══════════════════════════════════════════════════════════

interface FlipCommand {
  tool: 'flip';
  params: {
    direction: 'horizontal' | 'vertical';
    target?: 'selection' | 'canvas';  // Default: selection if exists
  };
}

interface RotateCommand {
  tool: 'rotate';
  params: {
    angle: 90 | 180 | 270 | number;  // Degrees clockwise
    target?: 'selection' | 'canvas';
  };
}

// ═══════════════════════════════════════════════════════════
// STRETCH & SKEW
// ═══════════════════════════════════════════════════════════

interface StretchCommand {
  tool: 'stretch';
  params: {
    horizontalPercent?: number;  // 1-500%
    verticalPercent?: number;    // 1-500%
    target?: 'selection' | 'canvas';
  };
}

interface SkewCommand {
  tool: 'skew';
  params: {
    horizontalDegrees?: number;  // -89 to 89
    verticalDegrees?: number;    // -89 to 89
    target?: 'selection' | 'canvas';
  };
}

// ═══════════════════════════════════════════════════════════
// RESIZE SELECTION
// ═══════════════════════════════════════════════════════════

interface ResizeSelectionCommand {
  tool: 'resize_selection';
  params: {
    width: number;
    height: number;
    maintainAspectRatio?: boolean;
  };
}
```

---

### 3.4 Canvas Operations

```typescript
// ═══════════════════════════════════════════════════════════
// CANVAS MANAGEMENT
// ═══════════════════════════════════════════════════════════

interface ClearCanvasCommand {
  tool: 'clear';
  params: {
    color?: string;            // Fill color (default: white)
  };
}

interface ResizeCanvasCommand {
  tool: 'resize_canvas';
  params: {
    width: number;
    height: number;
    anchor?: 'top-left' | 'top' | 'top-right' |
             'left' | 'center' | 'right' |
             'bottom-left' | 'bottom' | 'bottom-right';
  };
}

interface SetAttributesCommand {
  tool: 'set_attributes';
  params: {
    width?: number;
    height?: number;
    colorMode?: 'color' | 'black_and_white';
    transparent?: boolean;     // Use transparency
  };
}

// ═══════════════════════════════════════════════════════════
// INVERT COLORS
// ═══════════════════════════════════════════════════════════

interface InvertColorsCommand {
  tool: 'invert_colors';
  params: {
    target?: 'selection' | 'canvas';
  };
}
```

---

### 3.5 Color Management

```typescript
// ═══════════════════════════════════════════════════════════
// COLOR SETTING
// ═══════════════════════════════════════════════════════════

interface SetColorCommand {
  tool: 'set_color';
  params: {
    target: 'primary' | 'secondary';
    color: string;             // Hex color "#RRGGBB"
  };
}

interface SwapColorsCommand {
  tool: 'swap_colors';
  params: {};                  // Swap primary ↔ secondary
}

interface SetPaletteColorCommand {
  tool: 'set_palette_color';
  params: {
    index: number;             // 0-27 (palette position)
    color: string;
  };
}
```

---

### 3.6 Edit Operations

```typescript
// ═══════════════════════════════════════════════════════════
// UNDO / REDO
// ═══════════════════════════════════════════════════════════

interface UndoCommand {
  tool: 'undo';
  params: {
    steps?: number;            // Number of steps to undo (default: 1)
  };
}

interface RedoCommand {
  tool: 'redo';
  params: {
    steps?: number;
  };
}

// ═══════════════════════════════════════════════════════════
// REPEAT LAST ACTION
// ═══════════════════════════════════════════════════════════

interface RepeatCommand {
  tool: 'repeat';
  params: {
    times?: number;            // Repeat N times
  };
}
```

---

### 3.7 Batch & Composite Commands

```typescript
// ═══════════════════════════════════════════════════════════
// EFFICIENCY COMMANDS (for 100+ operations)
// ═══════════════════════════════════════════════════════════

interface BatchShapesCommand {
  tool: 'batch_shapes';
  params: {
    shapeType: 'rectangle' | 'ellipse' | 'line';
    shapes: Array<{
      startX: number; startY: number;
      endX: number; endY: number;
    }>;
    color?: string;
    fillColor?: string;
    fillMode?: 'outline' | 'filled' | 'filled_with_outline';
  };
}

interface BatchPointsCommand {
  tool: 'batch_points';
  params: {
    points: string;            // "x1,y1;x2,y2;..." many individual pixels
    color?: string;
  };
}

interface PatternRepeatCommand {
  tool: 'pattern_repeat';
  params: {
    commands: Command[];       // Commands to repeat as a pattern
    repeatX: number;           // Times to repeat horizontally
    repeatY: number;           // Times to repeat vertically
    offsetX: number;           // X spacing between repeats
    offsetY: number;           // Y spacing between repeats
  };
}

interface DrawGridCommand {
  tool: 'draw_grid';
  params: {
    startX: number;
    startY: number;
    cols: number;
    rows: number;
    cellWidth: number;
    cellHeight: number;
    color?: string;
    lineWidth?: number;
  };
}

// SVG-style path for complex curves
interface DrawPathCommand {
  tool: 'draw_path';
  params: {
    d: string;                 // SVG path: "M 10 10 L 50 50 Q 100 100 150 50 Z"
    color?: string;
    fillColor?: string;
    lineWidth?: number;
  };
}
```

---

### Complete Tool Enum

```typescript
type Tool =
  // Drawing (16 tools)
  | 'pencil' | 'brush' | 'airbrush' | 'eraser'
  | 'line' | 'curve' | 'rectangle' | 'rounded_rectangle'
  | 'ellipse' | 'polygon' | 'fill' | 'pick_color'
  | 'text' | 'magnifier'
  | 'select_rectangle' | 'select_freeform'

  // Selection operations
  | 'select_all' | 'deselect' | 'move_selection'
  | 'copy' | 'cut' | 'paste' | 'delete_selection' | 'crop_to_selection'

  // Transform
  | 'flip' | 'rotate' | 'stretch' | 'skew' | 'resize_selection'

  // Canvas
  | 'clear' | 'resize_canvas' | 'set_attributes' | 'invert_colors'

  // Color
  | 'set_color' | 'swap_colors' | 'set_palette_color'

  // Edit
  | 'undo' | 'redo' | 'repeat'

  // Batch/efficiency
  | 'batch_shapes' | 'batch_points' | 'pattern_repeat' | 'draw_grid' | 'draw_path';
```

---

### Tool Schema for Claude API

```typescript
const canvasControlTool = {
  name: "canvas_control",
  description: `Execute commands on the MS Paint canvas. Full control over all drawing tools,
selection, transformation, colors, and canvas properties. Commands execute sequentially.`,
  input_schema: {
    type: "object",
    properties: {
      commands: {
        type: "array",
        items: {
          type: "object",
          properties: {
            tool: {
              type: "string",
              description: "The tool/operation to execute"
            },
            params: {
              type: "object",
              description: "Parameters specific to the tool"
            }
          },
          required: ["tool", "params"]
        },
        description: "Array of commands to execute sequentially"
      }
    },
    required: ["commands"]
  }
};
```

#### Example Commands

```json
{
  "commands": [
    {
      "tool": "clear",
      "params": {}
    },
    {
      "tool": "rectangle",
      "params": {
        "startX": 50,
        "startY": 50,
        "endX": 200,
        "endY": 150,
        "color": "#8B4513",
        "filled": true
      }
    },
    {
      "tool": "ellipse",
      "params": {
        "startX": 80,
        "startY": 20,
        "endX": 170,
        "endY": 60,
        "color": "#228B22",
        "filled": true
      }
    },
    {
      "tool": "text",
      "params": {
        "x": 100,
        "y": 180,
        "text": "A Tree",
        "color": "#000000",
        "fontSize": 14
      }
    }
  ]
}
```

### 4. Communication Protocol (SSE)

Server-Sent Events for real-time streaming:

**Event Types:**
| Event | Payload | Description |
|-------|---------|-------------|
| `token` | `{ text: string }` | Partial AI text response |
| `commands` | `{ commands: DrawCommand[] }` | Drawing commands from tool invocation |
| `progress` | `{ current: number, total: number }` | Drawing progress update |
| `done` | `{ message: string }` | Completion with full message |
| `error` | `{ error: string }` | Error notification |

**Client-side handling:**
```typescript
const eventSource = new EventSource('/api/ai/draw');

eventSource.addEventListener('token', (e) => {
  // Update streaming message display
  appendToStreamingMessage(JSON.parse(e.data).text);
});

eventSource.addEventListener('commands', (e) => {
  // Queue commands for animated execution
  const { commands } = JSON.parse(e.data);
  queueDrawingCommands(commands);
});

eventSource.addEventListener('done', (e) => {
  // Finalize message in chat history
  finalizeMessage(JSON.parse(e.data).message);
});
```

### 5. Command Execution Pipeline

**Three-stage execution:**

1. **Queueing:** Commands stored in execution queue with unique IDs
2. **Animation:** Commands executed with visual delay for user feedback
   - Default: 50ms between commands (adjustable)
   - Shows each stroke/shape being drawn
3. **Completion:** Callback to chat panel with result status

**Executor Service:**
```typescript
interface CommandExecutor {
  queue: DrawCommand[];
  isRunning: boolean;
  animationDelay: number;  // ms between commands

  enqueue(commands: DrawCommand[]): void;
  execute(): Promise<void>;
  pause(): void;
  resume(): void;
  clear(): void;
}
```

### 6. State Management Integration

New state additions to `AppContext.tsx`:

```typescript
interface AIState {
  chatMessages: ChatMessage[];
  isStreaming: boolean;
  commandQueue: DrawCommand[];
  isExecuting: boolean;
  executionProgress: { current: number; total: number };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  commands?: DrawCommand[];  // Associated drawing commands
  timestamp: Date;
}
```

**New Actions:**
- `AI_SEND_MESSAGE`
- `AI_APPEND_TOKEN`
- `AI_RECEIVE_COMMANDS`
- `AI_EXECUTION_PROGRESS`
- `AI_EXECUTION_COMPLETE`
- `AI_CLEAR_CHAT`

## File Structure

```
src/react/
├── components/
│   └── ai/
│       ├── AIChatPanel.tsx      # Main chat panel (OS-GUI window)
│       ├── MessageList.tsx      # Chat message display
│       ├── ChatInput.tsx        # Text input + send button
│       └── StreamingMessage.tsx # Real-time response display
├── hooks/
│   ├── useAIChat.ts            # Chat state and API communication
│   └── useCommandExecutor.ts   # Drawing command execution
├── services/
│   └── aiService.ts            # API client for AI endpoint
└── types/
    └── ai.ts                   # TypeScript interfaces
```

## API Endpoint Design

**POST `/api/ai/draw`**

Request:
```json
{
  "message": "Draw a house with a red roof and blue door",
  "canvasWidth": 800,
  "canvasHeight": 600,
  "currentColors": {
    "primary": "#000000",
    "secondary": "#FFFFFF"
  }
}
```

Response: SSE stream with events as described above.

## System Prompt

The LLM system prompt should include:
1. Canvas dimensions context
2. Available tools and their parameters
3. Coordinate system explanation (0,0 = top-left)
4. Color format requirements (hex)
5. Guidelines for creating visually appealing drawings
6. Instruction to break complex drawings into sequential commands

## UI/UX Considerations

1. **Panel Toggle:** Button in toolbar to show/hide AI panel
2. **Resize Handle:** Draggable divider between canvas and chat
3. **Command Preview:** Optional preview of commands before execution
4. **Undo Integration:** AI-drawn content should be undoable as a single action
5. **Cancel Button:** Stop execution mid-stream
6. **History:** Persist chat history in session/localStorage

## Scalability: Handling 100+ Commands

### The Challenge

Complex drawings (detailed scenes, patterns, pixel art) may require 100+ individual commands. This creates challenges:

1. **LLM Output Limits**: Claude's tool responses are typically limited to ~4096 tokens. 100 detailed commands with coordinates could exceed this.
2. **Token Efficiency**: Each command with full property names is verbose
3. **Latency**: Generating 100+ commands takes time
4. **Execution Time**: Animating 100 commands at 50ms = 5 seconds

### Solution 1: Multiple Tool Calls

The LLM can invoke `draw_on_canvas` multiple times in a single response:

```
Turn 1: AI calls draw_on_canvas with commands 1-30
Turn 1: AI calls draw_on_canvas with commands 31-60
Turn 1: AI calls draw_on_canvas with commands 61-100
```

The client accumulates all commands before (or during) execution.

### Solution 2: Higher-Level Primitives

Add composite tools that reduce command count:

```typescript
// Draw multiple shapes of same type
interface BatchShapes {
  tool: 'batch_rectangles' | 'batch_ellipses' | 'batch_lines';
  params: {
    color: string;
    filled?: boolean;
    shapes: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  };
}

// Repeat a pattern
interface RepeatPattern {
  tool: 'repeat';
  params: {
    commands: DrawCommand[];  // Commands to repeat
    count: number;
    offsetX: number;          // X offset per repetition
    offsetY: number;          // Y offset per repetition
  };
}

// Draw a grid
interface DrawGrid {
  tool: 'grid';
  params: {
    startX: number;
    startY: number;
    cols: number;
    rows: number;
    cellWidth: number;
    cellHeight: number;
    color: string;
  };
}

// Draw a polygon (multiple connected lines)
interface DrawPolygon {
  tool: 'polygon';
  params: {
    points: Array<{ x: number; y: number }>;
    color: string;
    filled?: boolean;
    closed?: boolean;
  };
}

// Draw a path (SVG-like)
interface DrawPath {
  tool: 'path';
  params: {
    d: string;  // SVG path notation: "M 10 10 L 50 50 Q 100 100 150 50"
    color: string;
    strokeWidth?: number;
  };
}
```

### Solution 3: Compressed Coordinate Format

For freeform drawing with many points, use compact notation:

```typescript
// Instead of:
{
  tool: "pencil",
  params: {
    points: [
      { x: 10, y: 20 },
      { x: 11, y: 21 },
      { x: 12, y: 22 },
      // ... 100 more points
    ]
  }
}

// Use compressed format:
{
  tool: "pencil",
  params: {
    color: "#000000",
    path: "10,20;11,21;12,22;13,23"  // Semicolon-separated x,y pairs
  }
}

// Or delta encoding (relative movements):
{
  tool: "pencil",
  params: {
    color: "#000000",
    start: { x: 10, y: 20 },
    deltas: "1,1;1,1;1,1;1,1"  // Each is offset from previous
  }
}
```

### Solution 4: Agentic Loop (Multi-Turn)

For very complex drawings, use iterative refinement:

```
User: "Draw a detailed cityscape"

AI Turn 1: "I'll start with the sky and background buildings..."
   → Executes 30 commands

AI Turn 2: "Now adding the foreground buildings..."
   → Executes 40 commands

AI Turn 3: "Adding details - windows, doors, street..."
   → Executes 50 commands

AI Turn 4: "Complete! Here's your cityscape."
```

This requires server-side orchestration to continue generation.

### Solution 5: Hybrid Approach (Recommended)

Combine strategies based on complexity:

| Complexity | Strategy |
|------------|----------|
| Simple (1-20 commands) | Single tool call |
| Medium (20-50 commands) | Multiple tool calls in one response |
| Complex (50-100 commands) | Higher-level primitives + batching |
| Very Complex (100+ commands) | Agentic multi-turn + primitives |

### Implementation Priority

1. **Phase 1**: Basic single tool call (handles ~80% of use cases)
2. **Phase 2**: Multiple tool calls per response
3. **Phase 3**: Higher-level primitives (batch, repeat, polygon)
4. **Phase 4**: Compressed formats and agentic loops

### Practical Limits

| Metric | Recommended Limit | Hard Limit |
|--------|-------------------|------------|
| Commands per tool call | 30 | 50 |
| Total commands per request | 100 | 200 |
| Points in a path | 500 | 1000 |
| Animation delay (busy) | 10ms | 0ms |
| Animation delay (visual) | 50ms | 100ms |

## Security Considerations

1. API keys stored server-side only (Vercel environment variables)
2. Request rate limiting
3. Input sanitization (prevent prompt injection)
4. Command validation before execution (bounds checking)

## Artistic Prompts: "Draw me a starry night"

### The Vision

Users should be able to request complex artistic scenes:
- "Draw me a starry night using paint"
- "Paint a sunset over mountains"
- "Create a forest scene with autumn colors"
- "Draw a city skyline at night"

The AI watches the canvas come alive as the system attempts its best interpretation.

### How It Works

The LLM must decompose artistic concepts into primitive paint operations:

**Example: "Draw me a starry night"**

```
User: "Draw me a starry night using paint"

AI thinking:
- Background: Dark blue sky gradient (layered fills or airbrush)
- Stars: Many small white/yellow ellipses and airbrush dots
- Moon: Yellow ellipse with crescent effect
- Swirls: Curved brush strokes in blues/whites (Van Gogh style)
- Horizon: Dark landscape silhouette
- Village: Small rectangles with yellow windows
```

**Generated Commands (simplified):**
```json
{
  "commands": [
    // Sky background - layered blues
    { "tool": "fill", "params": { "x": 200, "y": 100, "color": "#0a1628" }},

    // Swirling sky texture with airbrush
    { "tool": "airbrush", "params": {
      "path": "100,50;120,45;140,50;160,45;180,50",
      "color": "#1e3a5f", "size": 20
    }},
    { "tool": "airbrush", "params": {
      "path": "80,80;110,75;140,85;170,75;200,80",
      "color": "#2e5a8f", "size": 15
    }},

    // Large swirl (brush strokes)
    { "tool": "brush", "params": {
      "path": "150,100;160,90;175,85;190,90;200,100;205,115;195,125;180,120;170,110;165,100",
      "color": "#4a7ab0", "size": 8
    }},

    // Moon
    { "tool": "ellipse", "params": {
      "startX": 320, "startY": 40, "endX": 370, "endY": 90,
      "color": "#f4e99b", "filled": true
    }},

    // Stars - many small dots
    { "tool": "airbrush", "params": { "x": 50, "y": 30, "color": "#ffffff", "size": 3, "density": 100 }},
    { "tool": "airbrush", "params": { "x": 120, "y": 60, "color": "#ffffcc", "size": 4, "density": 100 }},
    { "tool": "airbrush", "params": { "x": 200, "y": 25, "color": "#ffffff", "size": 2, "density": 100 }},
    // ... 20+ more stars

    // Bright stars with glow
    { "tool": "airbrush", "params": { "x": 280, "y": 45, "color": "#ffffaa", "size": 8, "density": 50 }},
    { "tool": "ellipse", "params": {
      "startX": 278, "startY": 43, "endX": 282, "endY": 47,
      "color": "#ffffff", "filled": true
    }},

    // Dark horizon/hills
    { "tool": "polygon", "params": {
      "points": [
        {"x": 0, "y": 350}, {"x": 50, "y": 320}, {"x": 100, "y": 340},
        {"x": 150, "y": 300}, {"x": 200, "y": 330}, {"x": 250, "y": 310},
        {"x": 300, "y": 340}, {"x": 350, "y": 320}, {"x": 400, "y": 350}
      ],
      "color": "#0a0a0a", "filled": true, "closed": true
    }},

    // Village buildings
    { "tool": "rectangle", "params": {
      "startX": 100, "startY": 320, "endX": 120, "endY": 350,
      "color": "#1a1a1a", "filled": true
    }},
    // Yellow window
    { "tool": "rectangle", "params": {
      "startX": 105, "startY": 330, "endX": 110, "endY": 335,
      "color": "#ffdd44", "filled": true
    }}
    // ... more buildings
  ]
}
```

### Key Tools for Artistic Work

| Tool | Artistic Use |
|------|--------------|
| **Airbrush** | Texture, gradients, soft glows, stars, clouds |
| **Brush** | Bold strokes, swirls, expressive lines |
| **Polygon** | Landscapes, mountains, irregular shapes |
| **Ellipse** | Sun, moon, halos, organic shapes |
| **Fill** | Large background areas |
| **Line** | Rays, straight edges, structure |

### System Prompt for Artistic Mode

```
You are an AI artist working with MS Paint-style tools. When asked to draw artistic scenes:

1. DECOMPOSE the scene into layers:
   - Background (sky, water, ground)
   - Mid-ground (hills, trees, buildings)
   - Foreground (details, subjects)
   - Accents (stars, highlights, shadows)

2. USE APPROPRIATE TOOLS:
   - Airbrush for soft textures and gradients (spray in overlapping areas)
   - Brush for bold, expressive strokes
   - Polygon for irregular natural shapes
   - Multiple overlapping shapes to simulate depth

3. WORK BACK TO FRONT:
   - Draw background first, then overlay details
   - Later commands draw on top of earlier ones

4. COLOR PALETTE:
   - Use related colors for harmony
   - Add lighter/darker variations for depth
   - Include accent colors for interest

5. EMBRACE THE MEDIUM:
   - This is Paint, not Photoshop - embrace the pixelated, retro aesthetic
   - Simple shapes can be charming
   - Don't try to be photorealistic

Canvas size: {width}x{height} pixels
Coordinate system: (0,0) is top-left
```

### Watching It Come Alive

The execution animation is crucial for artistic prompts:

```typescript
interface ArtisticExecutionConfig {
  // Slower for artistic effect - let user see each stroke
  animationDelay: 100,  // ms between commands

  // Group related commands for smoother viewing
  batchRelatedStrokes: true,

  // Show progress overlay
  showLayerProgress: true,  // "Drawing: Sky... Stars... Moon..."

  // Optional: narrate what's being drawn
  narrateProgress: true,  // AI describes: "Adding swirling clouds..."
}
```

**Progress Display:**
```
┌─────────────────────────────────────┐
│  🎨 Drawing: Starry Night           │
│  ━━━━━━━━━━━━━━━━░░░░░  67%        │
│                                     │
│  ✓ Sky background                   │
│  ✓ Swirling clouds                  │
│  → Adding stars...                  │
│  ○ Moon                             │
│  ○ Landscape                        │
│  ○ Village                          │
└─────────────────────────────────────┘
```

### Example Prompts & Complexity

| Prompt | Estimated Commands | Approach |
|--------|-------------------|----------|
| "Draw a simple house" | 10-20 | Single tool call |
| "Paint a sunset" | 30-50 | Airbrush gradients + shapes |
| "Draw a starry night" | 80-150 | Multi-turn agentic |
| "Create a forest scene" | 100-200 | Multi-turn + repeat patterns |
| "Pixel art character" | 50-100 | Batch rectangles |

### Limitations to Communicate

The system should be honest about its capabilities:

```
AI: "I'll draw a starry night for you! Keep in mind I'm working with
basic Paint tools, so this will be an impressionistic interpretation
rather than a photorealistic image. Let me start with the sky..."
```

## Future Enhancements

1. **Image Understanding:** Allow user to upload/reference current canvas state
2. **Iterative Refinement:** "Make the tree bigger" - context-aware modifications
3. **Templates:** Pre-built prompts for common drawings
4. **Voice Input:** Speech-to-text for drawing commands
5. **Multi-turn Context:** Remember previous drawings in conversation

## Implementation Phases

### Phase 1: Core Infrastructure
- [ ] Create AI chat panel component with OS-GUI styling
- [ ] Set up Vercel Edge Function for Claude API proxy
- [ ] Implement SSE communication

### Phase 2: Drawing Integration
- [ ] Define and implement drawing command executor
- [ ] Integrate with existing canvas drawing functions
- [ ] Add undo support for AI operations

### Phase 3: Polish
- [ ] Add streaming message display
- [ ] Implement execution animation
- [ ] Add progress indicators
- [ ] Handle errors gracefully

### Phase 4: Enhancements
- [ ] Canvas state awareness (describe what's on canvas)
- [ ] Iterative refinement support
- [ ] Prompt templates
