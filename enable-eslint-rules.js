#!/usr/bin/env node

// This script enables all ESLint rules that have the exact comment "// TODO" at the end of the line,
// one by one, and commits the changes to git, including eslint auto-fixes.

const fs = require('fs');
const { EOL } = require('os');
const { execSync } = require('child_process');
const run = (cmd, options) => {
	console.log("  $", cmd, options);
	return execSync(cmd, options);
};

// ESLint config file path
const ESLINT_CONFIG_FILE = 'eslint.config.mjs';
// Source folder to lint
const SOURCE_FOLDER = 'src';

// Read the ESLint config file
const eslintConfig = fs.readFileSync(ESLINT_CONFIG_FILE, 'utf8');

// Split the file into lines
const lines = eslintConfig.split(/\r?\n/);

// Iterate over each line
let count = 0;
for (let i = 0; i < lines.length; i++) {
	// Find lines with exact TODO comments
	if (lines[i].endsWith('// TODO')) {
		count++;

		// Uncomment the rule and remove the TODO comment
		const originalLine = lines[i];
		const updatedLine = lines[i].replace(/\/\/ (.*) \/\/ TODO/, '$1');

		if (originalLine === updatedLine) {
			console.error(`Failed to process line ${i + 1}: ${originalLine}`);
			continue;
		}

		// Update the line in the array
		lines[i] = updatedLine;

		console.log(`Enabling rule: ${updatedLine.trim()}`);

		// Write the updated content back to the file
		fs.writeFileSync(ESLINT_CONFIG_FILE, lines.join(EOL), 'utf8');

		// Extract the rule name for the commit message
		const ruleName = updatedLine.match(/"([^"]+)"/)[1];

		try {
			// Run lint fix
			run('npm run lint -- --fix', { stdio: 'inherit' });

			// Commit the change to git
			run(`git add ${ESLINT_CONFIG_FILE} ${SOURCE_FOLDER}`);
			run(`git commit -m "Enable ESLint rule: \`${ruleName}"\``);
		} catch (error) {
			console.error(`Error processing rule "${ruleName}":`, error);
			// Revert the line change if there's an error
			lines[i] = originalLine;
			// fs.writeFileSync(ESLINT_CONFIG_FILE, lines.join(EOL), 'utf8');
			// Actually, it's possible for eslint to auto-fix some issues, but still fail,
			// so we need to revert the changes in the working directory as well.
			// Let's stash the changes, so we can restore them later and manually fix the issues.
			run(`git stash push -m "Enable ESLint rule: \`${ruleName}" -- ${ESLINT_CONFIG_FILE} ${SOURCE_FOLDER}`);
		}

		console.log("--------------------------------------------------");
	}
}

console.log('Processed', count, 'rules.');
