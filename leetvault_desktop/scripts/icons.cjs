#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('node:fs');
const path = require('node:path');

const SRC = path.join(__dirname, '..', 'resources', 'icon.png');
const OUT_ICO = path.join(__dirname, '..', 'resources', 'icon.ico');
const OUT_ICNS = path.join(__dirname, '..', 'resources', 'icon.icns');

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`[icons] missing source: ${SRC}`);
    process.exit(1);
  }

  let pngToIco, png2icons;
  try {
    pngToIco = require('png-to-ico');
    png2icons = require('png2icons');
  } catch (e) {
    console.error(
      '[icons] missing deps. Run: npm i -D png-to-ico png2icons'
    );
    process.exit(1);
  }

  const buf = fs.readFileSync(SRC);

  const ico = await pngToIco(buf);
  fs.writeFileSync(OUT_ICO, ico);
  console.log(`[icons] wrote ${path.relative(process.cwd(), OUT_ICO)}`);

  const icns = png2icons.createICNS(buf, png2icons.BILINEAR, 0);
  if (!icns) {
    console.error('[icons] icns conversion failed');
    process.exit(1);
  }
  fs.writeFileSync(OUT_ICNS, icns);
  console.log(`[icons] wrote ${path.relative(process.cwd(), OUT_ICNS)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
