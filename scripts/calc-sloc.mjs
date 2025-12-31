#!/usr/bin/env node

/**
 * SLOC (Source Lines of Code) Counter
 *
 * Counts source lines of code in the project, comparing:
 * - Legacy jQuery implementation (src/ excluding src/react and src/new)
 * - New React implementation (src/react and src/new)
 *
 * Usage: node scripts/calc-sloc.mjs
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

const EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".css",
  ".scss",
  ".html",
]);

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  ".nyc_output",
  ".cache",
  ".vercel",
  ".turbo",
  "cypress/screenshots",
  "cypress/videos",
  "lib",
  "help",
]);

const IGNORE_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  ".DS_Store",
]);

function createStats() {
  return {
    totalFiles: 0,
    totalLines: 0,
    codeLines: 0,
    commentLines: 0,
    blankLines: 0,
    byExtension: {},
  };
}

const legacyStats = createStats();
const reactStats = createStats();
const otherStats = createStats();

function isCommentLine(line, ext) {
  const trimmed = line.trim();

  if (!trimmed) return false;

  switch (ext) {
    case ".js":
    case ".jsx":
    case ".ts":
    case ".tsx":
    case ".mjs":
    case ".cjs":
    case ".css":
    case ".scss":
      return (
        trimmed.startsWith("//") ||
        trimmed.startsWith("/*") ||
        trimmed.startsWith("*") ||
        trimmed.startsWith("*/")
      );
    case ".html":
      return trimmed.startsWith("<!--") || trimmed.startsWith("-->");
    default:
      return false;
  }
}

async function countLines(filePath) {
  const content = await readFile(filePath, "utf-8");
  const ext = extname(filePath);
  const lines = content.split("\n");

  let code = 0;
  let comments = 0;
  let blank = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      blank++;
    } else if (isCommentLine(line, ext)) {
      comments++;
    } else {
      code++;
    }
  }

  return { total: lines.length, code, comments, blank };
}

function getCategory(relativePath) {
  if (
    relativePath.startsWith("src/react/") ||
    relativePath.startsWith("src/new/")
  ) {
    return "react";
  }
  if (relativePath.startsWith("src/")) {
    return "legacy";
  }
  return "other";
}

function addToStats(stats, ext, lineStats) {
  stats.totalFiles++;
  stats.totalLines += lineStats.total;
  stats.codeLines += lineStats.code;
  stats.commentLines += lineStats.comments;
  stats.blankLines += lineStats.blank;

  if (!stats.byExtension[ext]) {
    stats.byExtension[ext] = { files: 0, code: 0, comments: 0, blank: 0 };
  }
  stats.byExtension[ext].files++;
  stats.byExtension[ext].code += lineStats.code;
  stats.byExtension[ext].comments += lineStats.comments;
  stats.byExtension[ext].blank += lineStats.blank;
}

async function walkDir(dir) {
  const entries = await readdir(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const relativePath = fullPath.replace(rootDir + "/", "");

    if (IGNORE_DIRS.has(entry)) continue;
    if (IGNORE_FILES.has(entry)) continue;

    const entryStat = await stat(fullPath);

    if (entryStat.isDirectory()) {
      const shouldIgnore = [...IGNORE_DIRS].some(
        (ignoreDir) =>
          relativePath.startsWith(ignoreDir + "/") ||
          relativePath.includes("/" + ignoreDir + "/")
      );
      if (!shouldIgnore) {
        await walkDir(fullPath);
      }
    } else if (entryStat.isFile()) {
      const ext = extname(entry);
      if (!EXTENSIONS.has(ext)) continue;

      const lineStats = await countLines(fullPath);
      const category = getCategory(relativePath);

      if (category === "legacy") {
        addToStats(legacyStats, ext, lineStats);
      } else if (category === "react") {
        addToStats(reactStats, ext, lineStats);
      } else {
        addToStats(otherStats, ext, lineStats);
      }
    }
  }
}

function formatNumber(num) {
  return num.toLocaleString().padStart(8);
}

function printStatsTable(stats, title) {
  console.log(`\n${title}`);
  console.log("-".repeat(60));
  console.log(
    "Extension".padEnd(12) +
      "Files".padStart(8) +
      "Code".padStart(10) +
      "Comments".padStart(10) +
      "Blank".padStart(10)
  );
  console.log("-".repeat(60));

  const sortedExtensions = Object.entries(stats.byExtension).sort(
    ([, a], [, b]) => b.code - a.code
  );

  for (const [ext, data] of sortedExtensions) {
    console.log(
      ext.padEnd(12) +
        formatNumber(data.files) +
        formatNumber(data.code) +
        formatNumber(data.comments) +
        formatNumber(data.blank)
    );
  }

  console.log("-".repeat(60));
  console.log(
    "TOTAL".padEnd(12) +
      formatNumber(stats.totalFiles) +
      formatNumber(stats.codeLines) +
      formatNumber(stats.commentLines) +
      formatNumber(stats.blankLines)
  );
}

function printComparison() {
  console.log("\n" + "=".repeat(70));
  console.log("📊 IMPLEMENTATION COMPARISON: Legacy (jQuery) vs New (React)");
  console.log("=".repeat(70));

  console.log("\n┌────────────────────┬────────────┬────────────┬────────────┐");
  console.log("│      Metric        │   Legacy   │   React    │   Change   │");
  console.log("├────────────────────┼────────────┼────────────┼────────────┤");

  const metrics = [
    ["Files", legacyStats.totalFiles, reactStats.totalFiles],
    ["Code Lines", legacyStats.codeLines, reactStats.codeLines],
    ["Comment Lines", legacyStats.commentLines, reactStats.commentLines],
    ["Blank Lines", legacyStats.blankLines, reactStats.blankLines],
    ["Total Lines", legacyStats.totalLines, reactStats.totalLines],
  ];

  for (const [name, legacy, react] of metrics) {
    const diff = react - legacy;
    const diffStr =
      diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString();

    console.log(
      `│ ${name.padEnd(18)} │ ${legacy.toLocaleString().padStart(10)} │ ${react.toLocaleString().padStart(10)} │ ${diffStr.padStart(10)} │`
    );
  }

  console.log("└────────────────────┴────────────┴────────────┴────────────┘");

  // Progress indicator
  const totalLegacy = legacyStats.codeLines;
  const totalReact = reactStats.codeLines;
  const ratio = totalLegacy > 0 ? (totalReact / totalLegacy) * 100 : 0;

  console.log("\n📈 Migration Progress:");
  console.log(
    `   React implementation is ${ratio.toFixed(1)}% the size of legacy code`
  );

  if (totalReact < totalLegacy) {
    console.log(
      `   ✨ React code is ${((1 - totalReact / totalLegacy) * 100).toFixed(1)}% more concise!`
    );
  }
}

function printResults() {
  console.log("\n" + "=".repeat(70));
  console.log("📊 SLOC (Source Lines of Code) Report");
  console.log("=".repeat(70));

  printStatsTable(legacyStats, "🔧 LEGACY IMPLEMENTATION (src/ - jQuery)");
  printStatsTable(reactStats, "⚛️  NEW IMPLEMENTATION (src/react + src/new)");

  if (otherStats.totalFiles > 0) {
    printStatsTable(otherStats, "📁 OTHER FILES (root level)");
  }

  printComparison();

  console.log("\n✅ Analysis complete!\n");
}

async function main() {
  console.log("🔍 Scanning project directory...");
  await walkDir(rootDir);
  printResults();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
