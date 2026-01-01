/**
 * Parser for Microsoft HTML Help Contents (.hhc) files.
 * These files contain the table of contents structure for help systems.
 */

export interface HelpItem {
	id: string; // Unique identifier for each item
	title: string; // Display name
	url?: string; // URL path to the help page
	name: string; // Original name from .hhc file
	local?: string; // Original local path from .hhc file
	children?: HelpItem[];
}

/**
 * Parse an HTML Help Contents (.hhc) file and extract the TOC structure.
 * Fetches the file and parses it into a hierarchical structure.
 *
 * @param hhcPath - Path to the .hhc file (relative or absolute URL)
 * @returns Promise resolving to array of HelpItem objects representing the table of contents
 * @throws Error if file cannot be fetched or parsed
 *
 * @example
 * const toc = await parseHelpContents("help/contents.hhc");
 * // Returns structured table of contents
 */
export async function parseHelpContents(hhcPath: string): Promise<HelpItem[]> {
	try {
		const response = await fetch(hhcPath);
		if (!response.ok) {
			throw new Error(`Failed to fetch ${hhcPath}: ${response.status}`);
		}
		const html = await response.text();
		return parseHhcHtml(html);
	} catch (error) {
		// console.error("Failed to parse help contents:", error);
		throw error;
	}
}

/**
 * Parse the HTML content of an .hhc file.
 * Converts HTML structure into JavaScript object hierarchy.
 * Looks for UL/LI structure with OBJECT elements containing params.
 *
 * @param html - The raw HTML content from .hhc file
 * @returns Array of HelpItem objects representing the parsed structure
 *
 * @example
 * const items = parseHhcHtml(htmlString);
 * // Returns structured help items
 */
export function parseHhcHtml(html: string): HelpItem[] {
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, "text/html");

	// Find the root UL element
	const rootUl = doc.querySelector("body > ul");
	if (!rootUl) {
		return [];
	}

	return parseUlElement(rootUl);
}

/**
 * Recursively parse a UL element and its children.
 * Extracts all LI elements and converts them to HelpItem objects.
 * Handles nested UL elements for hierarchical structure.
 *
 * @param ul - The UL element to parse
 * @param prefix - ID prefix for generating unique IDs
 * @returns Array of HelpItem objects for this level
 */
function parseUlElement(ul: Element, prefix: string = ""): HelpItem[] {
	const items: HelpItem[] = [];

	// Get direct LI children
	const listItems = ul.querySelectorAll(":scope > li");

	for (let i = 0; i < listItems.length; i++) {
		const li = listItems[i];
		const itemId = prefix ? `${prefix}-${i}` : `${i}`;
		const item = parseLiElement(li, itemId);
		if (item) {
			items.push(item);
		}
	}

	return items;
}

/**
 * Parse a single LI element.
 * Extracts OBJECT params for name and local (URL) properties.
 * Recursively processes nested UL for child items.
 *
 * @param li - The LI element to parse
 * @param id - Unique ID for this item
 * @returns HelpItem object or null if invalid/empty
 */
function parseLiElement(li: Element, id: string): HelpItem | null {
	// Find the OBJECT element with sitemap data
	const objectEl = li.querySelector(":scope > object");
	if (!objectEl) {
		return null;
	}

	// Extract params from the object
	const params = parseObjectParams(objectEl);
	const name = params.Name || params.name;

	if (!name) {
		return null;
	}

	const local = params.Local || params.local;

	const item: HelpItem = {
		id,
		name: name.trim(),
		title: name.trim(), // title is same as name
		local,
		url: local ? local : undefined, // Use local path as-is, don't prepend "help/"
	};

	// Check for nested UL (children)
	const childUl = li.querySelector(":scope > ul");
	if (childUl) {
		const children = parseUlElement(childUl, id);
		if (children.length > 0) {
			item.children = children;
		}
	}

	return item;
}

/**
 * Parse param elements within an object element.
 * Extracts name-value pairs from HTML Help OBJECT parameters.
 * Common params include "Name" (title) and "Local" (URL path).
 *
 * @param objectEl - The object element containing param children
 * @returns Object mapping param names to their string values
 */
function parseObjectParams(objectEl: Element): Record<string, string> {
	const params: Record<string, string> = {};
	const paramEls = objectEl.querySelectorAll("param");

	for (const param of paramEls) {
		const name = param.getAttribute("name");
		const value = param.getAttribute("value");
		if (name && value) {
			params[name] = value;
		}
	}

	return params;
}

export default parseHelpContents;
