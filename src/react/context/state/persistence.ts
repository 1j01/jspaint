/**
 * IndexedDB persistence layer for MCPaint state
 * Provides a clean API for storing and retrieving application state
 */

import { openDB, DBSchema, IDBPDatabase } from "idb";

interface MCPaintDB extends DBSchema {
	settings: {
		key: string;
		value: unknown;
	};
	canvasHistory: {
		key: string;
		value: {
			timestamp: number;
			imageData: ArrayBuffer;
			width: number;
			height: number;
		};
		indexes: { "by-timestamp": number };
	};
}

const DB_NAME = "mcpaint-db";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<MCPaintDB> | null = null;

/**
 * Initialize the IndexedDB database
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
 */
export async function saveCanvasHistory(
	id: string,
	imageData: ImageData,
): Promise<void> {
	try {
		const db = await initDB();
		// Convert ImageData to ArrayBuffer for storage
		const buffer = imageData.data.buffer;
		await db.put("canvasHistory", {
			timestamp: Date.now(),
			imageData: buffer,
			width: imageData.width,
			height: imageData.height,
		}, id);
	} catch (error) {
		// console.error(`Failed to save canvas history ${id}:`, error);
	}
}

/**
 * Load canvas history entry
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
			await Promise.all(keysToDelete.map(key => tx.store.delete(key)));
		}

		await tx.done;
	} catch (error) {
		// console.error("Failed to cleanup canvas history:", error);
	}
}

/**
 * Clear all persisted data
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
