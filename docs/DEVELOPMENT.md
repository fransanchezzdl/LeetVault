# LeetVault — Development

How to get the desktop app running on a fresh machine and the everyday dev loop.

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | ≥ 20 LTS | `nvm install 20` is the easiest path |
| npm     | bundled with Node | yarn/pnpm aren't tested |
| Git     | any | |
| Python  | 3.x | only needed by `node-gyp` to compile `better-sqlite3` |
| C/C++ toolchain | — | see per-OS notes below |

### Per-OS native build deps (for `better-sqlite3`)

- **Linux (Debian/Ubuntu)** — `sudo apt install build-essential python3 libsqlite3-dev`
- **Linux (Fedora)** — `sudo dnf groupinstall "Development Tools" && sudo dnf install python3 sqlite-devel`
- **macOS** — `xcode-select --install`
- **Windows** — see the dedicated section below.

## Windows setup (continuing development on a Windows PC)

The repo is platform-agnostic, but the native rebuild step is the most common stumbling block on Windows. Follow this exactly:

1. **Install [Node 20 LTS](https://nodejs.org/)** via the official installer. Check "Automatically install the necessary tools" on the optional-tools page — it pulls in Chocolatey + the Windows Build Tools, which covers most of the next two bullets. Restart the shell afterwards so `node`, `npm`, and `python` resolve on PATH.
2. **Install [Visual Studio Build Tools 2022](https://visualstudio.microsoft.com/visual-cpp-build-tools/)** — pick the "Desktop development with C++" workload. Visual Studio Code is NOT the same thing. The MSVC compiler is what `node-gyp` invokes to compile `better-sqlite3`.
3. **Install Python 3.x** if step 1 didn't (`winget install Python.Python.3.12`). `node-gyp` calls it during the rebuild.
4. **Install [Git for Windows](https://git-scm.com/download/win)**. Use the default settings; the bundled bash shell works fine if you prefer it over PowerShell.
5. Clone and install:
   ```powershell
   git clone <your-fork-url> LeetVault_Setup
   cd LeetVault_Setup\leetvault_desktop
   npm install
   ```
   The `postinstall` step rebuilds `better-sqlite3` against Electron's Node ABI. Let it finish.
6. Run the dev app:
   ```powershell
   npm run dev
   ```

Windows-specific gotchas:

- **Long-path support** — if `npm install` fails with `ENAMETOOLONG`, run `git config --system core.longpaths true` and enable long paths in Windows (`gpedit.msc` → Computer Configuration → Administrative Templates → System → Filesystem → Enable Win32 long paths). Electron's nested `node_modules` blows past 260 chars routinely.
- **PowerShell execution policy** — if scripts won't run, `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once. Don't go fully `Unrestricted`.
- **Antivirus** — Windows Defender slows native compilation by ~3-5×. Add `node_modules\better-sqlite3` and the repo root to its exclusion list during dev.
- **Speech features (interview view)** — Windows ships English voices by default. To install more, go to **Settings → Time & language → Speech → Add voices**. The "Mark", "Zira", and "David" voices are usable; "Aria" (Edge online) is much more natural but requires internet.
- **Building installers on Windows** — `npm run package:win` produces the NSIS `.exe`. The first run takes ~5 min while electron-builder downloads the Electron binaries; subsequent runs are cached under `%LOCALAPPDATA%\electron-builder\Cache`.

## First-time setup

```bash
git clone <your-fork-url> LeetVault_Setup
cd LeetVault_Setup/leetvault_desktop
npm install
```

`postinstall` runs `electron-builder install-app-deps`, which rebuilds `better-sqlite3` against Electron's bundled Node. Wait for it to finish — if you Ctrl-C, the native binding will be ABI-mismatched and dev will throw `NODE_MODULE_VERSION` errors.

## Dev loop

```bash
npm run dev          # electron-vite, with HMR for the renderer
```

This launches Electron pointing at the Vite dev server. The renderer hot-reloads on save. Main-process / preload changes require a full restart (Ctrl-C, re-run).

The dev launcher is `scripts/run.cjs`. It does two things before spawning Electron:

1. Strips `ELECTRON_RUN_AS_NODE` from the environment — VS Code, Cursor, and Claude Code terminals all leak this var, which would otherwise force Electron into Node-only mode and crash with `Cannot find module 'electron'`.
2. Filters known harmless Chromium GPU/dbus log spam from stderr (e.g. `GetVSyncParametersIfAvailable() failed`, `Floss manager not present`). The filter is a small allowlist of regexes at the top of the file — everything else passes through unchanged. Add a pattern there if a new noise line shows up.

### Useful scripts

| Command | Purpose |
|---|---|
| `npm run dev`              | start Electron + Vite with HMR |
| `npm run build`            | type-check + bundle main / preload / renderer into `out/` |
| `npm run preview`          | run the built app from `out/` |
| `npm run typecheck`        | strict TS on both `tsconfig.node.json` and `tsconfig.web.json` |
| `npm run lint`             | eslint, max 0 warnings |
| `npm run format`           | prettier write |
| `npm test`                 | rebuild `better-sqlite3` for Node, run Vitest, rebuild for Electron |
| `npm run seed:dev-db`      | drop a sample dataset into `.dev-userdata/leetcode.db` |
| `npm run package`          | host-OS installer via `electron-builder` (see [`BUILD.md`](BUILD.md)) |
| `npm run package:win\|mac\|linux` | target-specific installer |

`npm test` does an awkward double-rebuild because Vitest runs under plain Node (needs the Node-ABI binding), but the dev app needs the Electron-ABI binding. The script swaps them around the test run automatically.

## DB during dev

In dev, `app.getPath('userData')` resolves to a subfolder under the OS user-data root tagged by Electron's dev marker. To make this predictable, the runner pins it to `<repo>/leetvault_desktop/.dev-userdata/`. Your `leetcode.db` lives there and is gitignored.

To start fresh: stop the app, delete `.dev-userdata/leetcode.db` (+ any `-wal` / `-shm` siblings), restart.

To pre-fill: `npm run seed:dev-db` writes a representative dataset (different difficulties, statuses, dates, SR states).

To import a real v1 DB: open the running app → Ayuda → "Importar leetcode.db…". The current DB is backed up first.

## Project structure cheat-sheet

```
leetvault_desktop/
├── src/main/          # Electron main process (Node)
├── src/preload/       # contextBridge → window.lv
├── src/renderer/      # React app
├── src/shared/        # types + IPC channels (imported by both sides)
├── scripts/           # dev launcher, seed script
├── tests/             # vitest specs + fixtures
├── resources/         # app icons (icon.png; icon.ico/icns generated at build time)
├── build/             # electron-builder resources (entitlements, NSIS hook)
└── electron-builder.yml
```

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the deeper map.

## Working with the Chrome extension during dev

1. Open `chrome://extensions`, enable Developer mode, "Load unpacked" → `leetcode_extension/`.
2. Start the desktop app (`npm run dev`).
3. Open any problem on leetcode.com, click the LeetVault icon, hit Guardar.

Saves hit `POST http://localhost:7842/save`. The desktop app picks them up immediately via `events:problems-changed`. No polling, no reload.

If the extension says "no connection": the desktop app isn't running, or port 7842 is held by another process (often a stale `electron` from a crashed dev run — `pkill -f "node_modules/electron/dist/electron"` clears it, but be careful not to run that command from inside the Electron-launched terminal).

## Working with the Live Coding Interview view

The interview feature talks to **Groq** for the live interviewer + final evaluation. To exercise it locally:

1. Create a free Groq account at <https://console.groq.com/keys> and copy a key starting with `gsk_`.
2. Run the app (`npm run dev`), open the **Interview** view from the sidebar, paste the key into the dialog. The key is stored encrypted via Electron's `safeStorage` when an OS keychain is available (Linux: `gnome-keyring` / `kwallet`). On headless Linux without a keyring it falls back to plain text with an in-app banner.
3. Pick difficulty + language + timer, then **Start interview**. The opening message streams in token-by-token.
4. Try the voice features:
   - Mic button — Web Speech API STT, English-locked. Works out of the box on Chromium/Windows; on Linux it relies on Chromium's hosted endpoint (sometimes flaky, capability-gated in code).
   - Speaker button — Web Speech API TTS, voice picker is in the Settings dialog (gear icon). Local OS voices are preferred (offline) but you can pick cloud voices if your OS exposes them.
5. Click **Finish** to send the transcript + final code to the evaluator. A scorecard appears within ~10 s.

Speech notes (Linux dev box):

- Main process appends `--enable-speech-dispatcher` so Chromium can use the system TTS backend. Install voices with your package manager, e.g. `sudo apt install speech-dispatcher espeak-ng mbrola mbrola-en1`.
- If no voices appear in the picker, run `spd-say "hello"` in a terminal — if that's silent, the issue is at the system layer, not in the app.

## Troubleshooting

### `Error: Cannot find module 'electron'` on `npm run dev`

`ELECTRON_RUN_AS_NODE` is set in your terminal env (VS Code / Cursor / Claude Code leak this). `scripts/run.cjs` strips it; if you bypass the wrapper, run `unset ELECTRON_RUN_AS_NODE` first.

### `NODE_MODULE_VERSION` mismatch on boot

`better-sqlite3` was compiled against the wrong ABI. Fix:

```bash
npm run rebuild:electron   # to run inside Electron (default after install)
# or
npm run rebuild:node       # to run under plain Node (for Vitest)
```

### Port 7842 already in use

Another LeetVault is running (v1 or another dev session). The app shows a dialog and quits. Find and stop the other one, or set `LV_PORT=<other>` (dev only — the extension is hardcoded to 7842, so this is for manual testing only).

### Frameless window misbehaves on Linux

Set `LV_NATIVE_FRAME=1` to fall back to a native frame. Wayland compositors (Mutter, KWin) sometimes ignore drag regions.

### Mac dev app refuses to open after `npm run build`

Quarantine attr from the unsigned bundle. Run `xattr -rd com.apple.quarantine out/` once.

### `better-sqlite3` won't compile on Windows

Make sure you have **Visual Studio Build Tools** with the C++ workload, not just Visual Studio Code. Python ≥ 3.6 must be on PATH. Restart your shell after installing.

### Interview view: "Add your Groq key in Settings"

The key is missing or was cleared. Open the gear icon in the Interview header and paste a `gsk_…` key from <https://console.groq.com/keys>.

### Interview view: TTS is silent

- macOS / Windows — open the gear icon → "Interviewer voice" → pick a different voice → Preview. Some installed voices are present but mute (rare driver bug).
- Linux — install `speech-dispatcher` + `espeak-ng` + an English voice pack. Verify with `spd-say "hello"`. The app forces `--enable-speech-dispatcher` automatically.

### Interview view: "Rate limit reached"

Groq free tier is ~30 req/min, ~6 k tokens/min. Wait a minute or upgrade the key. The app surfaces the error verbatim in the chat panel.

## Coding conventions

- **TypeScript strict** everywhere. New code should compile under `npm run typecheck`.
- **ESLint + Prettier** are the source of truth — `npm run format` before committing.
- **Comments**: only when the *why* is non-obvious. The codebase deliberately keeps these sparse.
- **No polling.** If you need fresh data after a mutation, broadcast an `events:*` and invalidate the right query key.
- **No direct DB access from the renderer.** Always through IPC.
- **Wire-format parity is contractual.** Any change to `:7842` payloads requires bumping the extension in lockstep.

## Further reading

- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — what this project is.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — how the pieces fit together.
- [`BUILD.md`](BUILD.md) — making installers for end users.
- [`GITHUB.md`](GITHUB.md) — pushing to GitHub and cutting releases.
