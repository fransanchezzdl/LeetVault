# LeetVault — Build & Packaging

How to produce installers for Windows, macOS, and Linux.

## Outputs

| OS      | Format    | Filename pattern                          | Size (approx) |
|---------|-----------|-------------------------------------------|---------------|
| Windows | NSIS .exe | `LeetVault-<version>-Setup.exe`           | ~95 MB |
| macOS   | .dmg      | `LeetVault-<version>-{x64,arm64}.dmg`     | ~115 MB |
| Linux   | AppImage  | `LeetVault-<version>.AppImage`            | ~130 MB |
| Linux   | .deb      | `leetvault_<version>_amd64.deb`           | ~101 MB |

Sizes vary per release and Electron version (Linux values measured on v2.2.x after the dependency slimming — renderer-only packages are no longer shipped raw inside `app.asar`; Windows/macOS values are estimates).

All artifacts land in `leetvault_desktop/release/`.

## Quick commands

From `leetvault_desktop/`:

```bash
npm run package          # build for the host OS
npm run package:win      # NSIS — must run on Windows
npm run package:mac      # dmg — must run on macOS (x64 + arm64)
npm run package:linux    # AppImage + deb — runs on any Linux
```

Each command runs `electron-vite build` then `electron-builder` with the right target. Cross-compilation between OSes is technically possible but not supported by this repo — use real runners per OS (see [CI section](#ci-cross-platform-release)).

## Icons

The app ships a single source-of-truth PNG: `leetvault_desktop/resources/icon.png` (at least 1024×1024, transparent background).

`scripts/icons.cjs` regenerates the OS-specific formats from that PNG:

```bash
node scripts/icons.cjs
# writes:
#   resources/icon.ico   (Windows, multi-resolution)
#   resources/icon.icns  (macOS, multi-resolution)
```

It uses [`png-to-ico`](https://www.npmjs.com/package/png-to-ico) and [`png2icons`](https://www.npmjs.com/package/png2icons). Neither is a permanent dependency — install them on demand (`npm i --no-save png-to-ico@^2 png2icons`), exactly as the release workflow does. The script is idempotent.

When changing the icon: replace `resources/icon.png`, rerun the script, commit all three files.

## electron-builder config

`leetvault_desktop/electron-builder.yml` is annotated below. Highlights:

- `asarUnpack: ["**/node_modules/better-sqlite3/**"]` — the native binding must live outside `app.asar`; `dlopen` can't open from inside an archive.
- `files: ["out/**", "resources/**", "!**/{.DS_Store,.git,.vscode,.idea,tests,scripts,.dev-userdata}"]` — keep dev junk out of the bundle. Only main-process runtime deps live in `package.json` `dependencies`; everything renderer-only is a devDependency (Vite bundles it into `out/renderer`), so it never ships raw in `app.asar`.
- `extraResources` — bundles `../leetcode_extension` into `<resources>/leetcode_extension/`, excluding `icon.png` and `README.md` (not needed at runtime; the manifest only uses `icon16/48/128.png`).
- `directories.output: release` — where artifacts go.
- `publish: null` — we don't auto-upload to anywhere.

### Per-target notes

- **Windows / NSIS** — `oneClick: false`, `allowToChangeInstallationDirectory: true`. The hook `build/installer.nsh` ensures `%APPDATA%\LeetVault` exists before first run (so the v1 DB path is preserved on upgrade).
- **macOS / dmg** — universal builds via dual `arch: [x64, arm64]`. `hardenedRuntime: true`, `entitlements: build/entitlements.mac.plist`. **Notarization is off** by default (`notarize: false`); first-time Mac users will need to `xattr -rd com.apple.quarantine /Applications/LeetVault.app` once or right-click → Open. Enabling notarization needs an Apple Developer ID ($99/yr) and credentials in CI secrets — see [Code signing](#code-signing).
- **Linux** — AppImage works portable; the .deb installs to `/opt/LeetVault/`. `linux.maintainer` is required by `fpm` for .deb builds; it's set in `electron-builder.yml`.

## Code signing

Optional in v2.0. Out of the box installers are unsigned, which means:

- **Windows** — SmartScreen will warn the first time. Users click "More info" → "Run anyway". Code signing certs run ~$200/yr (Sectigo, DigiCert).
- **macOS** — Gatekeeper blocks unsigned bundles. The `xattr` workaround above bypasses it once; or pay for a Developer ID and flip `notarize: true` + provide `APPLE_ID` / `APPLE_APP_SPECIFIC_PASSWORD` / `APPLE_TEAM_ID` env vars to `electron-builder`.
- **Linux** — no signing required.

If/when you turn on macOS notarization, do it via CI env vars — never commit credentials. `electron-builder` reads them automatically when `notarize` is enabled.

## CI: cross-platform release

`.github/workflows/release.yml` builds all four artifacts in parallel on tag push.

Trigger:

```bash
# bump version in leetvault_desktop/package.json first
git tag v2.0.1
git push origin v2.0.1
```

What happens:

1. Three matrix jobs spin up — `ubuntu-latest`, `macos-latest`, `windows-latest`.
2. Each installs Node 22, runs `npm ci --ignore-scripts` in `leetvault_desktop/`, rebuilds `better-sqlite3` for the Electron ABI (`scripts/rebuild-electron.cjs`), generates platform icons (`scripts/icons.cjs`), then runs `npm run package:<os>` with the PostHog secrets in the env.
3. Artifacts upload to a draft GitHub Release named after the tag.

You then promote the draft to public from the GitHub Releases UI after a smoke test on each OS.

Caveat: `macos-latest` runners are Apple Silicon (arm64). The dmg target is `arch: [x64, arm64]` and electron-builder produces both slices in a single universal pass.

## Upgrades — what the installer takes care of

Installers handle three cases:

### v2 → newer v2 (the common case)

| OS | Behavior |
|---|---|
| Windows (NSIS) | Detects the previous install via `appId = com.leetvault.desktop`, overwrites program files in place. `%APPDATA%\LeetVault\leetcode.db` is **not touched**. |
| macOS (dmg) | User drags new `LeetVault.app` to `/Applications`, replaces existing. `~/Library/Application Support/LeetVault/` stays intact. |
| Linux (.deb) | `sudo dpkg -i leetvault_<new>.deb` does an in-place upgrade. `~/.config/LeetVault/` is preserved. |
| Linux (AppImage) | Portable file — the user swaps the binary themselves. DB path is independent of the binary location. |

The schema migration runs on every boot (`runMigrations()` in `src/main/db/migrations.ts`) and is idempotent — it uses `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` for every object, then `INSERT OR REPLACE INTO schema_meta(version)`. So an older v2 DB (or even a fresh v1 file) opens correctly under a newer v2 binary with no manual step. v2.1 bumps the schema to **version 3**, which adds two tables (`settings` for the encrypted Groq key + UI prefs, `interview_sessions` for finished mock interviews) and one index — none of that touches the existing `problems` table.

### v1 (Python/PyQt) → v2

| OS | DB picked up automatically? | Old binary auto-removed? |
|---|---|---|
| Windows | Yes — v1 Inno installer used the same `%APPDATA%\LeetVault\leetcode.db` path. | **No.** The v1 entry remains in *Apps & features*. Tell the user to uninstall it manually. |
| macOS | Yes — same `~/Library/Application Support/LeetVault/` path. | **No.** User drags the old `LeetVault.app` to Trash. |
| Linux | Yes — `src/main/db/path.ts` copies `~/.local/share/LeetVault/leetcode.db` (+ `-wal`/`-shm`) into `~/.config/LeetVault/` on first launch if the new path is empty. | **No.** v1 was distributed as a tarball, never as a system package. User removes the old folder. |

The schema is identical between v1 and v2 — v2 just adds two indexes (`idx_problems_number`, `idx_problems_next_review`) and a `schema_meta` table; v2.1 adds the `settings` and `interview_sessions` tables. None of that touches existing rows. Users keep every problem, solution, note, and SR state. The first launch on a brand-new binary will quietly run all `CREATE … IF NOT EXISTS` statements against the existing DB and bump `schema_meta.version` to `3`.

### Manual fallback if a v1 DB lives somewhere unusual

The **Ajustes → Datos → Importar leetcode.db…** button (Settings → Data) in the running app lets the user pick any `.db` file from disk. It validates the schema and replaces the current DB after a timestamped backup. Use this for users who installed v1 to a custom path or want to import from a backup drive.

### Adding automatic v1 uninstall on Windows (future)

`build/installer.nsh` is the hook point. To silently remove the v1 Inno Setup entry on install, look up its uninstall registry key and call `unins000.exe /SILENT`. Out of scope for v2.0 because the v1 install path is user-configurable; risks a partial uninstall on edge cases. Document the manual step instead.

## Smoke test checklist

Before promoting a release, on each OS:

1. Install the artifact on a clean user (or VM).
2. App launches; no console error dialog.
3. Empty state shows in Problems / Stats / Review.
4. Add a problem manually → it appears in the table.
5. Open `chrome://extensions` → load the bundled extension unpacked (the Help view shows the absolute path and has an "open folder" button).
6. From leetcode.com, save a problem → the app updates without manual refresh.
7. Mark a problem `To Review` → it appears in Repaso → rate it → next-review date updates.
8. Quit and relaunch → data persists.
9. (Linux only) verify the v1 → v2 DB copy: drop a v1 file at `~/.local/share/LeetVault/leetcode.db`, delete `~/.config/LeetVault/leetcode.db`, relaunch, confirm import.
10. **Interview view** — open the sidebar entry, paste a Groq key, start a Medium / Python / 45 min session. The opening message must stream in. Send "what are the constraints?" — assistant streams the full constraints. Finish the session early; a scorecard must render within ~10 s.
11. **Interview stats** — after the test session above, open Stats. The "Entrevistas simuladas" card should show 1 session, avg scores, the verdict badge, and a recent-history entry.
12. **Upgrade-in-place** — install over an existing v2.0 install on the same OS. Open the app and check that:
    - the existing `problems` table is intact (count matches before/after);
    - the Interview view opens and prompts for an API key (no `no such table` errors in dev console);
    - `schema_meta.value` is now `3` (`sqlite3 leetcode.db "select * from schema_meta;"`).

## Versioning

- `leetvault_desktop/package.json` `version` is the single source of truth.
- Update before tagging.
- The Chrome extension's `manifest.json` version is independent — bump it only when extension code changes (the `:7842` wire format is the contract between them).

## Further reading

- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — what this project is.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — how the pieces fit together.
- [`DEVELOPMENT.md`](DEVELOPMENT.md) — daily dev loop.
- [`GITHUB.md`](GITHUB.md) — repo push, secrets, release tag workflow.
