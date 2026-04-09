const fs = require("fs");
const version = process.env.VERSION;

if (!version) {
	console.error("VERSION env var is not set");
	process.exit(1);
}
if (version !== require("../../package.json").version) {
	console.error("VERSION env var does not match package.json version");
	process.exit(1);
}
// MSIX version needs four parts. The last part is reserved for the Windows Store to use, and must be zero.
const msixVersion = version + ".0";
const file = "Package.appxmanifest";
const regex = /(<Identity\s*(?:Name="[^"]*"\s+)?Version=")([^"]*)(")/g;
fs.writeFileSync(file, fs.readFileSync(file, "utf8")
	.replace(regex, "$1" + msixVersion + "$3")
);

console.log(`Updated MSIX package version in ${file} to version ${version}.`);
