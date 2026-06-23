# LeetVault — Desktop (v2)

Electron + React + TypeScript rewrite of `leetcode_tracker/`. Local SQLite, cross-platform (Windows / macOS / Linux), preserves the existing `leetcode.db` schema and the extension HTTP wire format on `localhost:7842`.

## Quick start

```bash
npm install         # also runs electron-builder install-app-deps (rebuilds better-sqlite3)
npm run dev         # launches Electron with HMR for the renderer
```

If `better-sqlite3` complains about ABI mismatch:

```bash
npm run rebuild:electron
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Electron + Vite HMR |
| `npm run build` | Build main / preload / renderer bundles into `out/` |
| `npm run typecheck` | TS check (node + web projects) |
| `npm test` | Vitest (SM-2 parity, repo, server) |
| `npm run package:win` | NSIS installer |
| `npm run package:mac` | dmg (x64 + arm64) |
| `npm run package:linux` | AppImage + deb |

## Database location

Resolves via `app.getPath('userData')` after `app.setName('LeetVault')`:

- **Windows** — `%APPDATA%\LeetVault\leetcode.db` (matches v1)
- **macOS** — `~/Library/Application Support/LeetVault/leetcode.db` (matches v1)
- **Linux** — `~/.config/LeetVault/leetcode.db` (v1 was `~/.local/share/LeetVault/`; one-shot copy on first launch)

## Status

Phase 0 — bootstrap. See `/home/francisco-sanchez/.claude/plans/sprightly-hopping-porcupine.md` for the full plan.
