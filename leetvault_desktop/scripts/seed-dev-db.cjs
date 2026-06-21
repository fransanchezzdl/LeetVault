#!/usr/bin/env node
/**
 * Seeds the dev userData DB by copying an existing leetcode.db into the path
 * the Electron app uses on the current OS. Idempotent unless --force is passed.
 *
 * Usage:
 *   node scripts/seed-dev-db.cjs                                 # copy from default v1 location
 *   node scripts/seed-dev-db.cjs --src /path/to/leetcode.db      # copy from explicit path
 *   node scripts/seed-dev-db.cjs --force                         # overwrite existing dev DB
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const APP_NAME = 'LeetVault';

function userDataDir() {
  const home = os.homedir();
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), APP_NAME);
  }
  if (process.platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', APP_NAME);
  }
  return path.join(process.env.XDG_CONFIG_HOME || path.join(home, '.config'), APP_NAME);
}

function legacyDbCandidates() {
  const home = os.homedir();
  return [
    path.join(home, '.local', 'share', APP_NAME, 'leetcode.db'),
    path.join(userDataDir(), 'leetcode.db'),
  ];
}

function parseArgs(argv) {
  const args = { force: false, src: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--force') args.force = true;
    else if (argv[i] === '--src') args.src = argv[++i];
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const targetDir = userDataDir();
  const target = path.join(targetDir, 'leetcode.db');

  const sources = args.src ? [args.src] : legacyDbCandidates();
  const source = sources.find((p) => p && fs.existsSync(p) && p !== target);

  if (!source) {
    console.error('No source leetcode.db found. Tried:');
    for (const s of sources) console.error('  ' + s);
    console.error('Pass --src /path/to/leetcode.db to override.');
    process.exit(1);
  }

  fs.mkdirSync(targetDir, { recursive: true });

  if (fs.existsSync(target) && !args.force) {
    console.error(`Refusing to overwrite ${target} (pass --force).`);
    process.exit(1);
  }

  fs.copyFileSync(source, target);
  for (const suffix of ['-wal', '-shm']) {
    const sideSrc = source + suffix;
    if (fs.existsSync(sideSrc)) fs.copyFileSync(sideSrc, target + suffix);
  }
  console.log(`Seeded dev DB: ${source} → ${target}`);
}

main();
