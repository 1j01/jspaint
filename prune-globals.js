// Usage: node prune-globals.js
// This script will document which `window.* = ...` assignments are used by other files in the src directory.
// Note that this script is NOT idempotent, because it naively and stupidly matches the comments that it generates.
// Also its purpose is very specific; it only looks for global assignments following a "// Temporary globals" comment.

const fs = require('fs');
const path = require('path');

// Assuming all files are in the src directory and not subdirectories
const srcDir = './src';

// Silly wrapper function to read a file and return its content
function readFile(filePath) {
	return fs.readFileSync(filePath, 'utf8');
}

// Function to write content to a file
function writeFile(filePath, content) {
	console.log("Writing file", filePath);
	fs.writeFileSync(filePath, content, 'utf8');
}

function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// Function to find non-ESM usages of an identifier
function findDependencies(identifier, fileContent, excludeFiles = []) {
	// console.log("Finding dependencies for", identifier);
	const importRegex = new RegExp(`^\\s*import .*${escapeRegExp(identifier)}.* from`, 'm');
	const dependencies = [];
	for (const [filePath, content] of Object.entries(fileContent)) {
		if (excludeFiles.includes(filePath)) {
			continue;
		}
		if (content.includes(identifier)) {
			// importRegex.lastIndex = 0; // Bugger! I hate stateful RegExp! Actually I don't need the g flag.
			if (!importRegex.test(content)) {
				// console.log(`'${filePath}' includes '${identifier}' but doesn't match ${importRegex}`);
				// console.log("Usage:\n    ", content.match(new RegExp(`.*${escapeRegExp(identifier)}.*`, 'm'))[0]);
				// console.log("Debug:\n    ", content.match(new RegExp(`.*${escapeRegExp(identifier)}.*`, 'm'))[0].match(importRegex));
				dependencies.push(filePath);
			}
		}
	}
	return dependencies;
}

// Function to process each file in the src directory
function processFiles() {
	const fileContent = {};
	fs.readdir(srcDir, (err, files) => {
		if (err) {
			console.error('Error reading directory:', err);
			return;
		}
		// First read all files into memory, since we'll need to look at each file
		// in reference to every other file, and there's not that many files.
		for (const file of files) {
			if (path.extname(file) === '.js') {
				const filePath = path.join(srcDir, file);
				const content = readFile(filePath);
				fileContent[filePath] = content;
			}
		}
		// Then process each file.
		for (const [filePath, content] of Object.entries(fileContent)) {
			console.log("--------", filePath);
			const startIndex = content.indexOf('// Temporary globals');
			if (startIndex !== -1) {
				const updatedContent = content.slice(0, startIndex) + content.slice(startIndex).replace(
					/(?:\/\/\s*)?(window\.(.*?) = .*;)(\s*\/\/.*)?/g,
					(match, assignment, identifier, comment) => {
						const dependencies = findDependencies(identifier, fileContent, [filePath]);
						const formatPath = filePath => path.relative(srcDir, filePath).replace(/\\/g, '/');
						const formattedPaths = dependencies.map(formatPath).join(', ');
						console.log(`Dependencies for ${identifier}: ${formattedPaths || "(none found)"}`);
						if (dependencies.length) {
							return `${assignment} // may be used by ${formattedPaths}`;
						} else {
							return `// ${assignment} // unused`;
						}
					}
				);
				writeFile(filePath, updatedContent);
			}
		}
	});
}

processFiles();
