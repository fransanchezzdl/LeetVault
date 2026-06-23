#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const buildDir = path.join(root, 'node_modules', 'better-sqlite3', 'build');

if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true, force: true });
}

// Electron 42+ no longer registers an `install` postinstall hook — the binary
// download moved behind an opt-in `install-electron` bin. If the runtime
// binary is missing, fetch it before electron-builder tries to use it.
const electronInstall = path.join(root, 'node_modules', 'electron', 'install.js');
const electronDist = path.join(root, 'node_modules', 'electron', 'dist');
if (fs.existsSync(electronInstall) && !fs.existsSync(electronDist)) {
  console.log('[rebuild-electron] fetching electron runtime binary…');
  const dl = spawnSync(process.execPath, [electronInstall], {
    cwd: path.dirname(electronInstall),
    stdio: 'inherit',
  });
  if (dl.status !== 0) {
    console.error('[rebuild-electron] failed to download electron binary');
    process.exit(dl.status ?? 1);
  }
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