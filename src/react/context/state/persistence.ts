/**
 * IndexedDB persistence layer for MCPaint state
 * Provides a clean API for storing and retrieving application state
 */

import { openDB, DBSchema, IDBPDatabase } from "idb";

/**
 * Database schema interface
 * Defines the structure of the MCPaint IndexedDB database
 */
interface MCPaintDB extends DBSchema {
  /**
   * Settings object store
   * Stores user preferences and configuration (key-value pairs)
   */
  settings: {
    key: string;
    value: unknown;
  };
  /**
   * Canvas history object store
   * Stores canvas history entries for undo/redo functionality
   */
  canvasHistory: {
    key: string;
    value: {
      /** Timestamp when this state was saved */
      timestamp: number;
      /** Canvas image data as ArrayBuffer */
      imageData: ArrayBuffer;
      /** Canvas width in pixels */
      width: number;
      /** Canvas height in pixels */
      height: number;
    };
    /** Index for querying by timestamp */
    indexes: { "by-timestamp": number };
  };
}

/** Database name */
const DB_NAME = "mcpaint-db";
/** Database version */
const DB_VERSION = 1;

/** Cached database instance */
let dbInstance: IDBPDatabase<MCPaintDB> | null = null;

/**
 * Initialize the IndexedDB database
 * Creates object stores and indexes if they don't exist
 * @returns {Promise<IDBPDatabase<MCPaintDB>>} Database instance
 */
async function initDB(): Promise<IDBPDatabase<MCPaintDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<MCPaintDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Settings store for user preferences and UI state
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings");
      }

      // Canvas history store for undo/redo with timestamps
      if (!db.objectStoreNames.contains("canvasHistory")) {
        const historyStore = db.createObjectStore("canvasHistory");
        historyStore.createIndex("by-timestamp", "timestamp");
      }
    },
  });

  return dbInstance;
}

/**
 * Save a setting to IndexedDB
 * @param {string} key - Setting key
 * @param {unknown} value - Setting value (any JSON-serializable type)
 * @returns {Promise<void>}
 */
export async function saveSetting(key: string, value: unknown): Promise<void> {
  try {
    const db = await initDB();
    await db.put("settings", value, key);
  } catch (error) {
    // console.error(`Failed to save setting ${key}:`, error);
  }
}

/**
 * Load a setting from IndexedDB
 * @template T - Type of the setting value
 * @param {string} key - Setting key
 * @param {T} defaultValue - Default value if setting doesn't exist
 * @returns {Promise<T>} Setting value or default value
 */
export async function loadSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await initDB();
    const value = await db.get("settings", key);
    return value !== undefined ? (value as T) : defaultValue;
  } catch (error) {
    // console.error(`Failed to load setting ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Remove a setting from IndexedDB
 * @param {string} key - Setting key to remove
 * @returns {Promise<void>}
 */
export async function removeSetting(key: string): Promise<void> {
  try {
    const db = await initDB();
    await db.delete("settings", key);
  } catch (error) {
    // console.error(`Failed to remove setting ${key}:`, error);
  }
}

/**
 * Save canvas history entry
 * Converts ImageData to ArrayBuffer for efficient storage
 * @param {string} id - Unique ID for this history entry
 * @param {ImageData} imageData - Canvas image data to save
 * @returns {Promise<void>}
 */
export async function saveCanvasHistory(id: string, imageData: ImageData): Promise<void> {
  try {
    const db = await initDB();
    // Convert ImageData to ArrayBuffer for storage
    const buffer = imageData.data.buffer;
    await db.put(
      "canvasHistory",
      {
        timestamp: Date.now(),
        imageData: buffer,
        width: imageData.width,
        height: imageData.height,
      },
      id,
    );
  } catch (error) {
    // console.error(`Failed to save canvas history ${id}:`, error);
  }
}

/**
 * Load canvas history entry
 * Reconstructs ImageData from stored ArrayBuffer
 * @param {string} id - Unique ID of the history entry to load
 * @returns {Promise<ImageData | null>} Loaded ImageData or null if not found
 */
export async function loadCanvasHistory(id: string): Promise<ImageData | null> {
  try {
    const db = await initDB();
    const entry = await db.get("canvasHistory", id);
    if (!entry) return null;

    // Reconstruct ImageData from stored buffer
    const data = new Uint8ClampedArray(entry.imageData);
    return new ImageData(data, entry.width, entry.height);
  } catch (error) {
    // console.error(`Failed to load canvas history ${id}:`, error);
    return null;
  }
}

/**
 * Clear old canvas history entries (keep only recent ones)
 * Removes oldest entries by timestamp to manage storage space
 * @param {number} [keepCount=50] - Maximum number of entries to keep
 * @returns {Promise<void>}
 */
export async function cleanupCanvasHistory(keepCount: number = 50): Promise<void> {
  try {
    const db = await initDB();
    const tx = db.transaction("canvasHistory", "readwrite");
    const index = tx.store.index("by-timestamp");
    const keys = await index.getAllKeys();

    // Remove oldest entries if we exceed the limit
    if (keys.length > keepCount) {
      const keysToDelete = keys.slice(0, keys.length - keepCount);
      await Promise.all(keysToDelete.map((key) => tx.store.delete(key)));
    }

    await tx.done;
  } catch (error) {
    // console.error("Failed to cleanup canvas history:", error);
  }
}

/**
 * Clear all persisted data
 * Removes all settings and canvas history from IndexedDB
 * @returns {Promise<void>}
 */
export async function clearAllData(): Promise<void> {
  try {
    const db = await initDB();
    await db.clear("settings");
    await db.clear("canvasHistory");
  } catch (error) {
    // console.error("Failed to clear all data:", error);
  }
}
