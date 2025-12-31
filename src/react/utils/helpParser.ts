/**
 * Parser for Microsoft HTML Help Contents (.hhc) files.
 * These files contain the table of contents structure for help systems.
 */

export interface HelpItem {
	name: string;
	local?: string; // URL path to the help page
	children?: HelpItem[];
}

/**
 * Parse an HTML Help Contents (.hhc) file and extract the TOC structure.
 * @param hhcPath - Path to the .hhc file
 * @returns Promise resolving to array of HelpItem objects
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
 * @param html - The raw HTML content
 * @returns Array of HelpItem objects
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
 * @param ul - The UL element to parse
 * @returns Array of HelpItem objects
 */
function parseUlElement(ul: Element): HelpItem[] {
	const items: HelpItem[] = [];

	// Get direct LI children
	const listItems = ul.querySelectorAll(":scope > li");

	for (const li of listItems) {
		const item = parseLiElement(li);
		if (item) {
			items.push(item);
		}
	}

	return items;
}

/**
 * Parse a single LI element.
 * @param li - The LI element to parse
 * @returns HelpItem or null if invalid
 */
function parseLiElement(li: Element): HelpItem | null {
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

	const item: HelpItem = {
		name: name.trim(),
	};

	// Get the Local param (URL path)
	const local = params.Local || params.local;
	if (local) {
		item.local = local;
	}

	// Check for nested UL (children)
	const childUl = li.querySelector(":scope > ul");
	if (childUl) {
		const children = parseUlElement(childUl);
		if (children.length > 0) {
			item.children = children;
		}
	}

	return item;
}

/**
 * Parse param elements within an object element.
 * @param objectEl - The object element containing params
 * @returns Object mapping param names to values
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
