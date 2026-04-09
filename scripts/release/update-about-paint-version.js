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
const file = "index.html";
const regex = /(<div id="jspaint-version"[^>]*>)([^<]*)(<\/div>)/g;
fs.writeFileSync(file, fs.readFileSync(file, "utf8")
	.replace(regex, "$1Version " + version + "$3")
);

console.log(`Updated About Paint version number in ${file} to version ${version}.`);
