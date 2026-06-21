#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const buildDir = path.join(root, 'node_modules', 'better-sqlite3', 'build');

if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true, force: true });
}

const bin = path.join(
  root,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'electron-builder.cmd' : 'electron-builder'
);

const result = spawnSync(bin, ['install-app-deps'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error('[rebuild-electron] failed to spawn electron-builder:', result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);