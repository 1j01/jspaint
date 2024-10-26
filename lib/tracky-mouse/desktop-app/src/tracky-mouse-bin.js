#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');
const electronPath = require('electron');
const args = process.argv.slice(2);
spawnSync(electronPath, [path.join(__dirname, '..'), ...args], { stdio: 'inherit' });
