# JS Paint CLI

JS Paint provides a command line interface (CLI) for opening the desktop app.

## Installation

The command `jspaint` is installed automatically when you install the desktop app on Windows.

On other platforms, you need to edit `.bashrc` or similar, depending on your shell, to add a line that extends the `PATH` environment variable.

For example (this is a fake path):

```sh
export PATH="$PATH:/path/to/jspaint/bin"
```

Then `source ~/.bashrc` or restart your terminal to access the `jspaint` command.

## Usage

```HELP_OUTPUT
usage: jspaint [-h] [-v] [file_path]

MS Paint in JavaScript, running in Electron.

positional arguments:
  file_path      Image file to open

optional arguments:
  -h, --help     show this help message and exit
  -v, --version  show program's version number and exit
```
