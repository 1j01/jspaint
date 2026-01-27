/**
 * AI Service Client
 * Handles SSE connection to /api/ai/draw endpoint
 * Parses incoming events and dispatches to callbacks
 */

import type { AIDrawRequest, SSEEvent, DrawingCommand, ChatRole } from "../types/ai";

/**
 * Callbacks for SSE event handling
 */
export interface AIServiceCallbacks {
  /** Called when a text token is received */
  onToken?: (content: string) => void;
  /** Called when drawing commands are received */
  onCommands?: (commands: DrawingCommand[]) => void;
  /** Called with progress updates */
  onProgress?: (current: number, total: number) => void;
  /** Called when streaming is complete */
  onDone?: (message?: string) => void;
  /** Called when an error occurs */
  onError?: (message: string) => void;
}

/**
 * Options for AI service requests
 */
export interface AIServiceOptions {
  /** Base URL for API (defaults to window origin) */
  baseUrl?: string;
  /** Request timeout in ms */
  timeout?: number;
}

/**
 * Parse SSE event from text line
 * @param {string} eventType - The event type
 * @param {string} data - The event data
 * @returns {SSEEvent | null} Parsed event or null
 */
function parseSSEEvent(eventType: string, data: string): SSEEvent | null {
  try {
    const parsed = JSON.parse(data);

    switch (eventType) {
      case "token":
        return { type: "token", content: parsed.content || "" };

      case "commands":
        return { type: "commands", commands: parsed.commands || [] };

      case "progress":
        return {
          type: "progress",
          current: parsed.current || 0,
          total: parsed.total || 0,
        };

      case "done":
        return { type: "done", message: parsed.message };

      case "error":
        return { type: "error", message: parsed.message || "Unknown error" };

      default:
        return null;
    }
  } catch (e) {
    console.error("[aiService] Failed to parse SSE event:", eventType, data, e);
    return null;
  }
}

/**
 * Send a chat request to the AI draw endpoint
 * @param {Object} params - Request parameters
 * @param {Array<{ role: ChatRole; content: string }>} params.messages - Chat history
 * @param {number} params.canvasWidth - Canvas width
 * @param {number} params.canvasHeight - Canvas height
 * @param {{ primary: string; secondary: string }} params.currentColors - Current colors
 * @param {AIServiceCallbacks} callbacks - Event callbacks
 * @param {AIServiceOptions} options - Service options
 * @returns {{ abort: () => void }} Object with abort function
 */
export function sendAIRequest(
  params: {
    messages: Array<{ role: ChatRole; content: string }>;
    canvasWidth: number;
    canvasHeight: number;
    currentColors: { primary: string; secondary: string };
  },
  callbacks: AIServiceCallbacks,
  options: AIServiceOptions = {},
): { abort: () => void } {
  const { baseUrl = "", timeout = 60000 } = options;
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const request: AIDrawRequest = {
    messages: params.messages,
    canvasWidth: params.canvasWidth,
    canvasHeight: params.canvasHeight,
    currentColors: params.currentColors,
  };

  // Set timeout
  if (timeout > 0) {
    timeoutId = setTimeout(() => {
      controller.abort();
      callbacks.onError?.("Request timed out");
    }, timeout);
  }

  // Start the fetch
  fetch(`${baseUrl}/api/ai/draw`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let currentEventType = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          // Parse SSE format
          if (line.startsWith("event: ")) {
            currentEventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const data = line.slice(6);
            const event = parseSSEEvent(currentEventType, data);

            if (event) {
              switch (event.type) {
                case "token":
                  callbacks.onToken?.(event.content);
                  break;
                case "commands":
                  callbacks.onCommands?.(event.commands);
                  break;
                case "progress":
                  callbacks.onProgress?.(event.current, event.total);
                  break;
                case "done":
                  callbacks.onDone?.(event.message);
                  break;
                case "error":
                  callbacks.onError?.(event.message);
                  break;
              }
            }
          }
        }
      }
    })
    .catch((error) => {
      if (timeoutId) clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        // Request was aborted, don't call error callback if it was intentional
        return;
      }

      callbacks.onError?.(error instanceof Error ? error.message : "Unknown error");
    });

  return {
    abort: () => {
      if (timeoutId) clearTimeout(timeoutId);
      controller.abort();
    },
  };
}

/**
 * AI Service class for managing multiple requests
 */
export class AIService {
  private currentRequest: { abort: () => void } | null = null;
  private options: AIServiceOptions;
  /**
   * Create a new AI Service instance
   * @param {AIServiceOptions} options - Service options
   */
  constructor(options: AIServiceOptions = {}) {
    this.options = options;
  }
  /**
   * Send a request, canceling any existing request
   * @param {Object} params - Request parameters
   * @param {AIServiceCallbacks} callbacks - Event callbacks
   */
  send(
    params: {
      messages: Array<{ role: ChatRole; content: string }>;
      canvasWidth: number;
      canvasHeight: number;
      currentColors: { primary: string; secondary: string };
    },
    callbacks: AIServiceCallbacks,
  ): void {
    // Cancel existing request
    this.cancel();

    // Start new request
    this.currentRequest = sendAIRequest(params, callbacks, this.options);
  }
  /**
   * Cancel the current request
   */
  cancel(): void {
    if (this.currentRequest) {
      this.currentRequest.abort();
      this.currentRequest = null;
    }
  }
  /**
   * Check if a request is currently in progress
   * @returns {boolean} True if request is active
   */
  isActive(): boolean {
    return this.currentRequest !== null;
  }
}

/**
 * Create a singleton AI service instance
 */
export const aiService = new AIService();
