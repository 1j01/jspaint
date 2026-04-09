const fs = require("fs");
const path = require("path");

const pkgPath = path.resolve(__dirname, "../../package.json");
const changelogPath = path.resolve(__dirname, "../../CHANGELOG.md");

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

const changelogMarkdown = fs.readFileSync(changelogPath, "utf8");

const regex = /^##\s*\[([^\]]+)\]\s-\s\d+-\d+-\d+[\r\n]+((?:^(?!##\s).*$[\r\n]?)*)/m;

const match = changelogMarkdown.match(regex);
if (!match) {
	console.error(`❌ No changelog section found matching regex: ${regex}`);
	process.exit(1);
}
if (match[1].trim() !== pkg.version) {
	console.error(`❌ Changelog version (${match[1].trim()}) does not match package.json version (${pkg.version})`);
	process.exit(1);
}

const body = match[2];

// GitHub Actions output format
console.log("changelog<<EndOfStringDelimiter");
console.log(body);
console.log("EndOfStringDelimiter");
