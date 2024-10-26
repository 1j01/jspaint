// Copyright (c) 2011-2022 GitHub Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

let powershellPath;
const path = require('path');
const Spawner = require('./spawner');

if (process.env.SystemRoot) {
	const system32Path = path.join(process.env.SystemRoot, 'System32');
	powershellPath = path.join(
		system32Path,
		'WindowsPowerShell',
		'v1.0',
		'powershell.exe'
	);
} else {
	powershellPath = 'powershell.exe';
}

// Spawn powershell.exe and callback when it completes
const spawnPowershell = function (args, callback) {
	// Set encoding and execute the command, capture the output, and return it
	// via .NET's console in order to have consistent UTF-8 encoding.
	// See http://stackoverflow.com/questions/22349139/utf-8-output-from-powershell
	// to address https://github.com/atom/atom/issues/5063
	args[0] = `\
[Console]::OutputEncoding=[System.Text.Encoding]::UTF8
$output=${args[0]}
[Console]::WriteLine($output)\
`;
	args.unshift('-command');
	args.unshift('RemoteSigned');
	args.unshift('-ExecutionPolicy');
	args.unshift('-noprofile');
	Spawner.spawn(powershellPath, args, callback);
};

// Get the user's PATH environment variable registry value.
//
// * `callback` The {Function} to call after registry operation is done.
//   It will be invoked with the same arguments provided by {Spawner.spawn}.
//
// Returns the user's path {String}.
exports.getPath = callback =>
	spawnPowershell(
		["[environment]::GetEnvironmentVariable('Path','User')"],
		function (error, stdout) {
			if (error != null) {
				return callback(error);
			}

			const pathOutput = stdout.replace(/^\s+|\s+$/g, '');
			return callback(null, pathOutput);
		}
	);
