const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const cliMdPath = path.join(__dirname, "..", "CLI.md");
const command = "npx jspaint --help";
console.log("Updating CLI.md with latest --help output from the CLI...");
console.log("Running command:", command);
const cliHelpOutput = execSync(command).toString().trim();
const oldMarkdown = fs.readFileSync(cliMdPath, "utf8");
const newMarkdown = oldMarkdown.replace(/```HELP_OUTPUT.+?```/s, "```HELP_OUTPUT\n" + cliHelpOutput + "\n```");
fs.writeFileSync(cliMdPath, newMarkdown);
console.log("Wrote updated CLI.md to", cliMdPath);
