#!/usr/bin/env node

/**
 * SLOC (Source Lines of Code) Counter
 *
 * Counts source lines of code in the project, excluding:
 * - Empty lines
 * - Comment-only lines
 * - node_modules, dist, build directories
 * - Generated files
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
  ".json",
  ".md",
  ".yml",
  ".yaml",
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
]);

const IGNORE_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  ".DS_Store",
]);

const stats = {
  totalFiles: 0,
  totalLines: 0,
  codeLines: 0,
  commentLines: 0,
  blankLines: 0,
  byExtension: {},
};

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
    case ".yml":
    case ".yaml":
      return trimmed.startsWith("#");
    case ".md":
      return false;
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

      const { total, code, comments, blank } = await countLines(fullPath);

      stats.totalFiles++;
      stats.totalLines += total;
      stats.codeLines += code;
      stats.commentLines += comments;
      stats.blankLines += blank;

      if (!stats.byExtension[ext]) {
        stats.byExtension[ext] = { files: 0, code: 0, comments: 0, blank: 0 };
      }
      stats.byExtension[ext].files++;
      stats.byExtension[ext].code += code;
      stats.byExtension[ext].comments += comments;
      stats.byExtension[ext].blank += blank;
    }
  }
}

function formatNumber(num) {
  return num.toLocaleString();
}

function printResults() {
  console.log("\n" + "=".repeat(60));
  console.log("📊 SLOC (Source Lines of Code) Report");
  console.log("=".repeat(60));

  console.log("\n📁 Summary:");
  console.log(`   Total Files:    ${formatNumber(stats.totalFiles)}`);
  console.log(`   Total Lines:    ${formatNumber(stats.totalLines)}`);
  console.log(`   Code Lines:     ${formatNumber(stats.codeLines)}`);
  console.log(`   Comment Lines:  ${formatNumber(stats.commentLines)}`);
  console.log(`   Blank Lines:    ${formatNumber(stats.blankLines)}`);

  console.log("\n📋 By Extension:");
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
        formatNumber(data.files).padStart(8) +
        formatNumber(data.code).padStart(10) +
        formatNumber(data.comments).padStart(10) +
        formatNumber(data.blank).padStart(10)
    );
  }

  console.log("-".repeat(60));
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
