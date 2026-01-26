/**
 * Parser for Microsoft HTML Help Contents (.hhc) files.
 * These files contain the table of contents structure for help systems.
 *
 * Features:
 * - Automatic URL resolution relative to .hhc file location
 * - Works with any directory structure (not hardcoded paths)
 * - i18n-ready: supports language-specific help folders
 */

export interface HelpItem {
  id: string; // Unique identifier for each item
  title: string; // Display name
  url?: string; // URL path to the help page (resolved to absolute path)
  name: string; // Original name from .hhc file
  local?: string; // Original local path from .hhc file
  children?: HelpItem[];
}

/**
 * Resolve a relative URL against a base URL path.
 * Uses the browser's URL API for proper resolution that handles:
 * - Simple relative paths: "page.html" → "/help/page.html"
 * - Parent references: "../other/page.html" → "/other/page.html"
 * - Already absolute paths: "/absolute/path.html" → "/absolute/path.html"
 * - Subdirectory paths: "sub/page.html" → "/help/sub/page.html"
 *
 * @param relativePath - The relative path to resolve
 * @param basePath - The base path (e.g., "/help/mspaint.hhc")
 * @returns Resolved absolute path
 *
 * @example
 * resolveHelpUrl("paint_lines.html", "/help/mspaint.hhc")
 * // Returns "/help/paint_lines.html"
 *
 * resolveHelpUrl("../docs/readme.html", "/help/en/contents.hhc")
 * // Returns "/help/readme.html"
 */
export function resolveHelpUrl(relativePath: string, basePath: string): string {
  // Already absolute? Return as-is
  if (relativePath.startsWith("/")) {
    return relativePath;
  }

  // Use URL API with a dummy origin for proper path resolution
  // The URL API correctly handles "..", ".", and relative paths
  try {
    const baseUrl = new URL(basePath, "http://localhost");
    const resolvedUrl = new URL(relativePath, baseUrl);
    return resolvedUrl.pathname;
  } catch {
    // Fallback: simple directory extraction
    const baseDir = basePath.substring(0, basePath.lastIndexOf("/") + 1);
    return baseDir + relativePath;
  }
}

/**
 * Parse an HTML Help Contents (.hhc) file and extract the TOC structure.
 * Fetches the file and parses it into a hierarchical structure.
 * URLs are automatically resolved relative to the .hhc file location.
 *
 * @param hhcPath - Path to the .hhc file (e.g., "/help/mspaint.hhc")
 * @returns Promise resolving to array of HelpItem objects representing the table of contents
 * @throws Error if file cannot be fetched or parsed
 *
 * @example
 * // English help
 * const toc = await parseHelpContents("/help/mspaint.hhc");
 *
 * // Future: French help
 * const tocFr = await parseHelpContents("/help/fr/mspaint.hhc");
 */
export async function parseHelpContents(hhcPath: string): Promise<HelpItem[]> {
  const response = await fetch(hhcPath);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${hhcPath}: ${response.status}`);
  }
  const html = await response.text();
  return parseHhcHtml(html, hhcPath);
}

/**
 * Parse the HTML content of an .hhc file.
 * Converts HTML structure into JavaScript object hierarchy.
 * Looks for UL/LI structure with OBJECT elements containing params.
 *
 * @param html - The raw HTML content from .hhc file
 * @param basePath - Base path for resolving relative URLs
 * @returns Array of HelpItem objects representing the parsed structure
 *
 * @example
 * const items = parseHhcHtml(htmlString, "/help/mspaint.hhc");
 */
export function parseHhcHtml(html: string, basePath: string = "/help/"): HelpItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Find the root UL element
  const rootUl = doc.querySelector("body > ul");
  if (!rootUl) {
    return [];
  }

  return parseUlElement(rootUl, "", basePath);
}

/**
 * Recursively parse a UL element and its children.
 * Extracts all LI elements and converts them to HelpItem objects.
 * Handles nested UL elements for hierarchical structure.
 *
 * @param ul - The UL element to parse
 * @param prefix - ID prefix for generating unique IDs
 * @param basePath - Base path for resolving relative URLs
 * @returns Array of HelpItem objects for this level
 */
function parseUlElement(ul: Element, prefix: string = "", basePath: string): HelpItem[] {
  const items: HelpItem[] = [];

  // Get direct LI children
  const listItems = ul.querySelectorAll(":scope > li");

  for (let i = 0; i < listItems.length; i++) {
    const li = listItems[i];
    const itemId = prefix ? `${prefix}-${i}` : `${i}`;
    const item = parseLiElement(li, itemId, basePath);
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
 * URLs are resolved relative to the .hhc file location.
 *
 * @param li - The LI element to parse
 * @param id - Unique ID for this item
 * @param basePath - Base path for resolving relative URLs
 * @returns HelpItem object or null if invalid/empty
 */
function parseLiElement(li: Element, id: string, basePath: string): HelpItem | null {
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
    // Resolve URL relative to .hhc file location - works for any directory structure
    url: local ? resolveHelpUrl(local, basePath) : undefined,
  };

  // Check for nested UL (children)
  const childUl = li.querySelector(":scope > ul");
  if (childUl) {
    const children = parseUlElement(childUl, id, basePath);
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
