/**
 * Vercel Edge Function for AI-powered drawing commands
 * Proxies requests to Claude API and streams back SSE events
 *
 * POST /api/ai/draw
 * Request: { messages, canvasWidth, canvasHeight, currentColors }
 * Response: SSE stream with token/commands/done/error events
 */

export const config = {
	runtime: "edge",
};

// Tool definition for canvas control
const CANVAS_CONTROL_TOOL = {
	name: "canvas_control",
	description: `Execute drawing commands on the canvas. You have access to all MS Paint tools and operations.

IMPORTANT GUIDELINES:
- Use coordinates within canvas bounds (0 to width-1, 0 to height-1)
- Colors are hex strings like "#FF0000" for red
- For paths, use "x1,y1;x2,y2;x3,y3" format
- Always provide complete commands with required parameters
- You can batch multiple commands in a single call for efficiency`,
	input_schema: {
		type: "object",
		properties: {
			commands: {
				type: "array",
				description: "Array of drawing commands to execute",
				items: {
					type: "object",
					properties: {
						tool: {
							type: "string",
							description: "Tool name: pencil, brush, airbrush, eraser, line, rectangle, rounded_rectangle, ellipse, polygon, curve, fill, pick_color, text, magnifier, select_rectangle, select_freeform, select_all, deselect, move_selection, copy, cut, paste, delete_selection, crop_to_selection, flip, rotate, stretch, skew, resize_selection, clear, resize_canvas, set_attributes, get_attributes, invert_colors, new_image, load_image, export_image, set_color, swap_colors, set_palette_color, set_custom_color, get_custom_colors, define_color, sample_color, load_palette, save_palette, undo, redo, repeat, batch_shapes, batch_points, pattern_repeat, draw_grid, draw_path",
						},
						params: {
							type: "object",
							description: "Parameters for the command (varies by tool)",
						},
					},
					required: ["tool", "params"],
				},
			},
		},
		required: ["commands"],
	},
};

// System prompt for the AI
const SYSTEM_PROMPT = `You are an AI assistant integrated into MCPaint, a web-based clone of MS Paint. You help users draw and manipulate images through natural language commands.

AVAILABLE TOOLS:
- Drawing: pencil, brush, airbrush, eraser (use path format "x1,y1;x2,y2;...")
- Shapes: line, rectangle, rounded_rectangle, ellipse, polygon, curve
- Fill/Color: fill (flood fill), pick_color, set_color, swap_colors
- Text: text (with font, size, bold, italic options)
- Selection: select_rectangle, select_freeform, select_all, deselect, move_selection, copy, cut, paste, delete_selection, crop_to_selection
- Transform: flip, rotate, stretch, skew, resize_selection
- Canvas: clear, resize_canvas, set_attributes, invert_colors, new_image
- View: magnifier (zoom levels: 1, 2, 4, 6, 8)
- Edit: undo, redo
- Batch: batch_shapes, batch_points, draw_grid, draw_path (for complex drawings)

COORDINATE SYSTEM:
- Origin (0,0) is top-left corner
- X increases to the right, Y increases downward
- All coordinates in pixels

COLOR FORMAT:
- Use hex colors: "#RRGGBB" (e.g., "#FF0000" for red, "#00FF00" for green, "#0000FF" for blue)
- Common colors: #000000 (black), #FFFFFF (white), #FF0000 (red), #00FF00 (green), #0000FF (blue), #FFFF00 (yellow), #FF00FF (magenta), #00FFFF (cyan)

FILL MODES (for shapes):
- "outline": just the border
- "filled": solid fill, no border
- "filled_with_outline": both fill and border

BEST PRACTICES:
1. Break complex drawings into multiple commands
2. Use batch_shapes or draw_grid for repetitive patterns
3. Confirm the action in your response text
4. If the request is ambiguous, ask for clarification
5. For complex art, work step by step

When you receive a request:
1. Understand what the user wants to create or modify
2. Generate appropriate drawing commands
3. Provide a brief, friendly response explaining what you did`;

interface Message {
	role: "user" | "assistant";
	content: string;
}

interface RequestBody {
	messages: Message[];
	canvasWidth: number;
	canvasHeight: number;
	currentColors: {
		primary: string;
		secondary: string;
	};
}

// SSE event helper
function sseEvent(type: string, data: unknown): string {
	return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
}

export default async function handler(request: Request): Promise<Response> {
	// Handle CORS preflight
	if (request.method === "OPTIONS") {
		return new Response(null, {
			status: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "POST, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type",
			},
		});
	}

	// Only allow POST
	if (request.method !== "POST") {
		return new Response(JSON.stringify({ error: "Method not allowed" }), {
			status: 405,
			headers: { "Content-Type": "application/json" },
		});
	}

	// Get API key from environment
	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!apiKey) {
		console.error("[AI API] ANTHROPIC_API_KEY environment variable is not set");
		return new Response(
			JSON.stringify({
				error: "API key not configured",
				details: "The ANTHROPIC_API_KEY environment variable is not set. Please add it in your Vercel project settings."
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			}
		);
	}

	// Validate API key format (should start with sk-ant-)
	if (!apiKey.startsWith("sk-ant-")) {
		console.error("[AI API] ANTHROPIC_API_KEY has invalid format");
		return new Response(
			JSON.stringify({
				error: "Invalid API key format",
				details: "The ANTHROPIC_API_KEY should start with 'sk-ant-'. Please check your Vercel environment variables."
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			}
		);
	}

	let body: RequestBody;
	try {
		body = await request.json();
	} catch (e) {
		console.error("[AI API] Invalid JSON in request body:", e);
		return new Response(JSON.stringify({ error: "Invalid JSON" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const { messages, canvasWidth, canvasHeight, currentColors } = body;

	if (!messages || !Array.isArray(messages)) {
		return new Response(
			JSON.stringify({ error: "Messages array required" }),
			{
				status: 400,
				headers: { "Content-Type": "application/json" },
			}
		);
	}

	// Build context-aware system prompt
	const contextPrompt = `${SYSTEM_PROMPT}

CURRENT CANVAS STATE:
- Dimensions: ${canvasWidth || 800}x${canvasHeight || 600} pixels
- Primary color: ${currentColors?.primary || "#000000"}
- Secondary color: ${currentColors?.secondary || "#FFFFFF"}`;

	// Prepare messages for Claude API
	const claudeMessages = messages.map((m) => ({
		role: m.role,
		content: m.content,
	}));

	// Create streaming response
	const encoder = new TextEncoder();
	const stream = new ReadableStream({
		async start(controller) {
			try {
				// Call Claude API with streaming
				const response = await fetch(
					"https://api.anthropic.com/v1/messages",
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"x-api-key": apiKey,
							"anthropic-version": "2023-06-01",
						},
						body: JSON.stringify({
							model: "claude-sonnet-4-20250514",
							max_tokens: 4096,
							system: contextPrompt,
							messages: claudeMessages,
							tools: [CANVAS_CONTROL_TOOL],
							stream: true,
						}),
					}
				);

				if (!response.ok) {
					const errorText = await response.text();
					console.error("[AI API] Claude API error:", response.status, errorText);
					controller.enqueue(
						encoder.encode(
							sseEvent("error", {
								message: `API error: ${response.status} - ${errorText}`,
							})
						)
					);
					controller.enqueue(encoder.encode(sseEvent("done", {})));
					controller.close();
					return;
				}

				const reader = response.body?.getReader();
				if (!reader) {
					controller.enqueue(
						encoder.encode(
							sseEvent("error", { message: "No response body" })
						)
					);
					controller.enqueue(encoder.encode(sseEvent("done", {})));
					controller.close();
					return;
				}

				const decoder = new TextDecoder();
				let buffer = "";
				let accumulatedText = "";
				let toolInput = "";
				let isCollectingToolInput = false;

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n");
					buffer = lines.pop() || "";

					for (const line of lines) {
						if (!line.startsWith("data: ")) continue;

						const data = line.slice(6);
						if (data === "[DONE]") continue;

						try {
							const event = JSON.parse(data);

							// Handle different event types from Claude streaming API
							switch (event.type) {
								case "content_block_start":
									if (event.content_block?.type === "tool_use") {
										console.log("[AI API] Tool use block started:", event.content_block.name);
										isCollectingToolInput = true;
										toolInput = "";
									}
									break;

								case "content_block_delta":
									if (event.delta?.type === "text_delta") {
										const text = event.delta.text;
										accumulatedText += text;
										controller.enqueue(
											encoder.encode(
												sseEvent("token", { content: text })
											)
										);
									} else if (
										event.delta?.type === "input_json_delta"
									) {
										toolInput += event.delta.partial_json || "";
									}
									break;

								case "content_block_stop":
									if (isCollectingToolInput && toolInput) {
										console.log("[AI API] Tool input collected, length:", toolInput.length);
										try {
											const toolData = JSON.parse(toolInput);
											console.log("[AI API] Parsed tool data, commands:", toolData.commands?.length || 0);
											if (
												toolData.commands &&
												Array.isArray(toolData.commands)
											) {
												controller.enqueue(
													encoder.encode(
														sseEvent("commands", {
															commands: toolData.commands,
														})
													)
												);
											}
										} catch (parseErr) {
											console.error("[AI API] Failed to parse tool JSON:", parseErr);
											// Invalid tool JSON, ignore
										}
										isCollectingToolInput = false;
										toolInput = "";
									}
									break;

								case "message_stop":
									controller.enqueue(
										encoder.encode(
											sseEvent("done", {
												message: accumulatedText,
											})
										)
									);
									break;

								case "error":
									controller.enqueue(
										encoder.encode(
											sseEvent("error", {
												message:
													event.error?.message || "Unknown error",
											})
										)
									);
									break;
							}
						} catch {
							// Parse error, skip this line
						}
					}
				}

				// Ensure we always send a done event
				controller.enqueue(
					encoder.encode(sseEvent("done", { message: accumulatedText }))
				);
				controller.close();
			} catch (error) {
				console.error("[AI API] Stream error:", error);
				controller.enqueue(
					encoder.encode(
						sseEvent("error", {
							message:
								error instanceof Error
									? error.message
									: "Unknown error",
						})
					)
				);
				controller.enqueue(encoder.encode(sseEvent("done", {})));
				controller.close();
			}
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			"Connection": "keep-alive",
			"Access-Control-Allow-Origin": "*",
		},
	});
}
