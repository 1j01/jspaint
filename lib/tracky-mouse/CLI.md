# Tracky Mouse CLI

Tracky Mouse provides a command line interface (CLI) for controlling the desktop app.

It can start and stop head tracking + dwell clicking, and in the future it will be able to change settings on the fly.

Any program that can launch other programs can use this CLI to control Tracky Mouse. A good use case is a voice command system, which would let you control Tracky Mouse with your voice.

## Installation

The command `tracky-mouse` is installed automatically when you install the desktop app on Windows.

On other platforms, you need to edit `.bashrc` or similar, depending on your shell, to add a line that extends the `PATH` environment variable.

For example (this is a fake path):

```sh
export PATH="$PATH:/path/to/tracky-mouse/bin"
```

Then `source ~/.bashrc` or restart your terminal to access the `tracky-mouse` command.

## Usage

```HELP_OUTPUT
usage: tracky-mouse [-h] [--start] [--stop] [-v]

Control your mouse hands-free. This CLI controls the running Tracky Mouse app.
It's meant for external programs like a voice command system to toggle Tracky
Mouse and adjust settings on the fly.

optional arguments:
  -h, --help     show this help message and exit
  --start        Start head tracking.
  --stop         Stop head tracking.
  -v, --version  Show the version number.
```
