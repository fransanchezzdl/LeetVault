#!/usr/bin/env node
/*
 * Cross-platform wrapper that:
 *   1. Strips ELECTRON_RUN_AS_NODE before invoking `electron-vite` — VS Code,
 *      Cursor, and Claude Code spawn terminals with this var set so their own
 *      Node-hosted tooling works, but it forces our Electron app into Node-only
 *      mode and breaks `require('electron')`.
 *   2. Filters known harmless Chromium GPU log spam from stderr so the dev
 *      console stays readable. Everything not in the allowlist passes through.
 *
 * Usage: node scripts/run.cjs <dev|preview>
 */
const { spawn } = require('node:child_process');
const path = require('node:path');

const mode = process.argv[2];
if (mode !== 'dev' && mode !== 'preview') {
  console.error('Usage: node scripts/run.cjs <dev|preview>');
  process.exit(2);
}

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const isWin = process.platform === 'win32';
const bin = path.join(
  __dirname,
  '..',
  'node_modules',
  '.bin',
  isWin ? 'electron-vite.cmd' : 'electron-vite'
);

const NOISE_PATTERNS = [
  /GetVSyncParametersIfAvailable\(\) failed/,
  /gl_surface_presentation_helper\.cc/,
  /Failed to connect to the bus/,
  /Floss manager not present/,
  /Bluez may not be available/,
];

const child = spawn(
  isWin ? process.env.ComSpec || 'cmd.exe' : bin,
  isWin ? ['/d', '/s', '/c', bin, mode] : [mode],
  {
    env,
    stdio: ['inherit', 'inherit', 'pipe'],
    // On Windows we invoke cmd.exe explicitly instead of using `shell: true`,
    // which triggers DEP0190 in Node >=22 when combined with an args array.
  }
);

let stderrBuf = '';
child.stderr.on('data', (chunk) => {
  stderrBuf += chunk.toString();
  let nl;
  while ((nl = stderrBuf.indexOf('\n')) !== -1) {
    const line = stderrBuf.slice(0, nl);
    stderrBuf = stderrBuf.slice(nl + 1);
    if (!NOISE_PATTERNS.some((re) => re.test(line))) {
      process.stderr.write(line + '\n');
    }
  }
});
child.stderr.on('end', () => {
  if (stderrBuf && !NOISE_PATTERNS.some((re) => re.test(stderrBuf))) {
    process.stderr.write(stderrBuf);
  }
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
