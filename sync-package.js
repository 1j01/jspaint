// Pulls a dependency's code into the repo, based on the package.json "files" field.

const fs = require("fs/promises");
const path = require("path");

(async () => {

	const packageName = process.argv[2];

	if (!packageName) {
		console.log("Usage: node sync-package.js <package-name>");
		process.exit(1);
	}

	const alwaysIncludedFiles = []; // ["README.md", "LICENSE", "CHANGELOG.md", "package.json"];
	const alwaysExclude = ["demo/", "index.html", "$MenuBar.js"];

	const packageDir = path.join(__dirname, "node_modules", packageName);

	const outputDir = path.join(__dirname, "lib", packageName);

	console.log(`Syncing ${packageName}...`);
	console.log(`Source directory: ${packageDir}`);
	console.log(`Output directory: ${outputDir}`);

	const packageJson = JSON.parse(await fs.readFile(path.join(packageDir, "package.json"), "utf8"));
	const { files } = packageJson;
	if (!files) {
		console.log(`No "files" field in ${packageDir}`);
		process.exit(1);
	}
	if (!Array.isArray(files)) {
		console.log(`"files" field is not an array in ${packageDir}`);
		process.exit(1);
	}
	if (files.length === 0) {
		console.log(`"files" field is empty in ${packageDir}`);
		process.exit(1);
	}

	// TODO: Use more npm machinery, in order to include things like README.md without being specific to the variations used.
	// For example see https://www.npmjs.com/package/npm-packlist
	// Icing on the cake would be to rewrite README.md so that relative links work.
	for (const extraFile of alwaysIncludedFiles) {
		if (!files.includes(extraFile)) {
			files.push(extraFile);
		}
	}
	// TODO: Command line option to exclude files, and use glob instead of exact match on "files" field item.
	for (const exclude of alwaysExclude) {
		const index = files.indexOf(exclude);
		if (index !== -1) {
			files.splice(index, 1);
		}
	}

	await fs.rm(outputDir, { recursive: true });

	for (const file of files) {
		const from = path.join(packageDir, file);
		const to = path.join(outputDir, file);
		console.log("Copying", from, "to", to);
		await fs.cp(from, to, { recursive: true });
	}
})();
