const { execSync } = require("child_process");
// const fs = require("fs");
const path = require("path");

// async function run(command) {
// 	console.log(`Running command: ${command}`);
// 	const [prog, ...args] = command.split(" ");
// 	console.log(JSON.stringify({ prog, args }));
// 	const child = spawn(prog, args);
// 	child.stdout.pipe(process.stdout);
// 	child.stderr.pipe(process.stderr);
// 	child.on('close', (code) => {
// 		console.log(`child process exited with code ${code}`);
// 	});
// }

const repoRoot = path.join(__dirname, "../..");

function run(command) {
	console.log(`\n👉 Running command: ${command}\n`);
	return execSync(command, { stdio: "inherit", cwd: repoRoot, env: process.env });
}
function getOutput(command) {
	console.log(`\n🧐 Getting output of command: ${command}\n`);
	return execSync(command, { stdio: "pipe", cwd: repoRoot, env: process.env }).toString();
}
function load(modulePath) {
	console.log(`\n🧩 Loading module: ${modulePath}\n`);
	require(modulePath);
}

function release() {
	const version = (process.argv[2] ?? "").trim().replace(/^v/, "");

	// Sanity check version numbers
	if (!version) {
		console.error("VERSION argument is not set");
		console.error("Usage: npm run release -- <version>");
		process.exit(1);
	}
	if (!/^\d+\.\d+\.\d+(-[\w.-]+)?$/.test(version)) {
		console.error("Invalid version format");
		process.exit(1);
	}
	// TODO: check that `version` is greater?
	if (version === require("../../package.json").version) {
		console.error(`VERSION argument matches package.json version (${version})`);
		console.error("Please reset to a clean state in case the release was interrupted, and otherwise, make sure to increment the version.");
		process.exit(1);
	}

	// Check working directory is clean
	if (getOutput("git status -u --porcelain").trim()) {
		console.error("Working directory is not clean.");
		process.exit(1);
	}

	// Check branch is master
	if (getOutput("git branch --show-current").trim() !== "master") {
		console.error("Current branch is not master.");
		process.exit(1);
	}

	// Run quality assurance checks:
	run("npm run lint");

	// TODO: try/catch with git reset --hard for the rest of the script to make it atomic?

	// Update CLI docs:
	load("../update-cli-docs.js");

	// Bump package version
	run(`npm version ${version} --no-git-tag-version`);

	// Some of these sub-scripts check package.json version
	// and they must see the updated version number to proceed.
	delete require.cache[require.resolve("../../package.json")];

	// Update version numbers and links in the changelog.
	process.env.VERSION = version;
	load("./bump-changelog.js");

	// Update download links to point to the new version:
	process.env.VERSION = version;
	load("./update-dl-links.js");

	// Update version number in MSIX package manifest:
	process.env.VERSION = version;
	load("./update-msix-package-version.js");

	// Update version number in About Paint dialog:
	process.env.VERSION = version;
	load("./update-about-paint-version.js");

	// That's all the changes for the commit.
	// Add them before the lengthy build process in case one gets tempted to edit files while it's building
	run("git add .");

	// Then commit the changes, tag the commit, and push the tag:
	run(`git commit -m "Release ${version}"`);
	run(`git tag v${version}`);
	// run("git push"); // deferred so the release can be tested first
	run(`git push origin tag v${version}`);

	// Pushing the tag should trigger a GitHub Actions workflow
	// which builds the app for all platforms and creates a release draft,
	// including release notes from the changelog.

	console.log(`
Please install via the GitHub release draft and test the installed desktop app.
If everything looks good, proceed with publishing:

git push

and hit Publish on the GitHub release.
`);
}
release();
