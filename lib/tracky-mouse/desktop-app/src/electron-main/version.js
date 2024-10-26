function getVersion() {
	const isGitRepo = require('fs').existsSync(__dirname + "/../../../.git");

	let version = require("../../package.json").version;
	if (isGitRepo) {
		const { execSync } = require('child_process');
		const describeCommand = "git describe --tags";
		try {
			// By default, execSync inherits stderr, but we want to capture it for a nicer error message.
			// (It says the default is "pipe", which is equivalent to ["pipe", "pipe", "pipe"].
			// But it seems to be ["pipe", "pipe", "inherit"] in practice.)
			const describeOutput = execSync(describeCommand, { cwd: __dirname, stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim();
			version = "development " + describeOutput;
		} catch (error) {
			const stderrOutput = error.stderr ? error.stderr.toString().trim() : '(No stderr output)';
			console.error(`Failed to get \`${describeCommand}\` output (Exit code: ${error.status ?? "unknown"}):\n${stderrOutput}`);
		}
	}
	return version;
}

exports.getVersion = getVersion;
