# LeetVault — Project Context

LeetVault is a local-first desktop app to capture, organize, and review LeetCode problems with spaced repetition (SM-2), plus practice live mock interviews against an AI interviewer. Everything runs on your machine; only the optional AI interviewer calls out to Groq.

## Repo layout

```
LeetVault_Setup/
├── leetvault_desktop/   Electron + React + TypeScript app (v2 — current)
├── leetcode_extension/  Chrome MV3 extension (captures problems from leetcode.com)
└── docs/                This folder
```

The legacy Python/PyQt app (`leetcode_tracker/`) and its Inno Setup installer were removed in June 2026. The current app preserves the v1 `leetcode.db` schema and the `localhost:7842` HTTP wire format so existing users and the unchanged extension keep working.

## Two-piece architecture

1. **Desktop app** (`leetvault_desktop/`) — Electron shell. Main process owns SQLite + a Fastify server on `:7842`. Renderer is React + Tailwind, talks to main over a typed IPC bridge (`window.lv`).
2. **Chrome extension** (`leetcode_extension/`) — sniffs the LeetCode problem page, posts to `http://localhost:7842/save`, and (optionally) asks Groq for a strategy hint.

The extension and the app never communicate over the public internet — they meet at `localhost:7842`.

## What's in each main piece

### Desktop app (Electron)

- **Main process** — boot, single-instance lock, frameless window, SQLite (via `better-sqlite3`), Fastify HTTP server, IPC handlers.
- **Preload** — `contextBridge` exposes a typed `window.lv` API to the renderer. No `nodeIntegration`.
- **Renderer** — React 18 + Tailwind + shadcn/Radix primitives. TanStack Query for cache, TanStack Table + Virtual for the (now virtualized) problems list, Recharts + react-calendar-heatmap for stats.

Cache invalidation is **event-driven**: every write (UI or extension) emits an IPC broadcast (`events:problems-changed` / `events:reviews-changed`), and the renderer invalidates the relevant query keys. There is no polling.

### Chrome extension

- Manifest V3, two host permissions: `https://leetcode.com/*` and `http://localhost:7842/*` (plus `https://api.groq.com/*` for the optional AI hint).
- `content.js` extracts number, title, difficulty, tags and code (Monaco).
- `popup.js` sends a single approach-mentor prompt to Groq (`llama-3.1-8b-instant`) and posts the saved problem to `/save`.

## Persistence

- SQLite file `leetcode.db` lives in Electron's `userData` directory:
  - **Windows** — `%APPDATA%\LeetVault\leetcode.db` (matches v1)
  - **macOS** — `~/Library/Application Support/LeetVault/leetcode.db` (matches v1)
  - **Linux** — `~/.config/LeetVault/leetcode.db` (v1 lived at `~/.local/share/LeetVault/`; first launch performs a one-shot copy)
- Schema matches v1 byte-for-byte. v2 adds two indexes (`idx_problems_number`, `idx_problems_next_review`) and a `schema_meta` table. Schema v3 adds two more tables, `settings` (encrypted Groq key + UI prefs) and `interview_sessions` (every finished mock interview). All DDL is `CREATE … IF NOT EXISTS`, so older DBs auto-upgrade on first launch with zero data loss.
- The **Settings → Privacy & Data** section exposes an **Import v1 DB** button that backs up the current DB and copies in a v1 file from anywhere on disk.

## Live Coding Interview (new in v2.1)

- A dedicated **Interview** view in the sidebar drives a full mock-interview loop: an AI interviewer presents a fresh problem in English, takes clarifying questions, watches the user's code in a Monaco editor, and at the end issues a structured scorecard (4 criteria, 1-5, plus verdict).
- Backed by **Groq** (`llama-3.3-70b-versatile`). The user's API key is stored in the local `settings` table, encrypted at rest with Electron's `safeStorage` when an OS keychain is available.
- **Voice (optional)** — Web Speech API for both STT (mic input) and TTS (interviewer speaks). Voice picker in the settings dialog lists every English voice the OS exposes; the choice persists across sessions. No cloud TTS, no extra cost.
- **Stats** — finished sessions feed an "Entrevistas simuladas" card on the Stats view: total sessions, avg score per criterion, verdict distribution, splits by difficulty/language, and a recent-history list.

## Spaced repetition policy (changed in v2.0)

- Only problems saved with status **`To Review`** enter the review queue. Solved/In Progress never auto-enter (v1 enqueued every Solved → queue blew up over time).
- During a review session the user toggles **"Seguir repasando"**:
  - ON → 5 SM-2 quality buttons (Blackout / Difícil / Bien / Fácil / Perfecto) → next-review date is recomputed.
  - OFF → single "Listo" button → status reverts to `Solved`, SR fields cleared, removed from the queue.
- Status changes through the form also reshape the queue: `→ To Review` seeds SR fields (next=today, interval=1, ease=2.5); leaving `To Review` clears them.

## Where each functionality lives (quick map)

| Functionality | File |
| --- | --- |
| App boot, single-instance, window, server start | `leetvault_desktop/src/main/index.ts` |
| DB path resolution + Linux v1 migration | `leetvault_desktop/src/main/db/path.ts` |
| Schema + indexes | `leetvault_desktop/src/main/db/migrations.ts` |
| SM-2 algorithm | `leetvault_desktop/src/main/domain/sm2.ts` |
| HTTP server (extension wire format) | `leetvault_desktop/src/main/server/` |
| IPC handlers (problems, reviews, stats, import) | `leetvault_desktop/src/main/ipc/` |
| Typed bridge | `leetvault_desktop/src/preload/index.ts` |
| Renderer entry | `leetvault_desktop/src/renderer/main.tsx` |
| Problems list (virtualized + elastic scroll) | `leetvault_desktop/src/renderer/features/problems/` |
| Review queue + Keep-revising toggle | `leetvault_desktop/src/renderer/features/review/` |
| Stats + heatmap + legend | `leetvault_desktop/src/renderer/features/stats/` |
| Roadmap (NeetCode 150/250, Blind 75, LC 75) | `leetvault_desktop/src/renderer/features/roadmap/` |
| Help view (usage guide, extension path) | `leetvault_desktop/src/renderer/features/help/` |
| Settings (Language, Appearance, Privacy & Data — incl. DB import) | `leetvault_desktop/src/renderer/features/settings/` |
| Donate view (placeholder — to be developed) | `leetvault_desktop/src/renderer/features/donate/` |
| Live Coding Interview feature | `leetvault_desktop/src/renderer/features/interview/` |
| Sidebar nav (grouped: primary + secondary) | `leetvault_desktop/src/renderer/components/chrome/Sidebar.tsx` |
| Theme resolution + application | `leetvault_desktop/src/renderer/hooks/{useResolvedTheme,useApplyTheme}.ts` |
| Groq client + interviewer/evaluator prompts | `leetvault_desktop/src/main/ai/` |
| Interview session lifecycle + curated problems | `leetvault_desktop/src/main/interview/` |
| Settings + interview persistence | `leetvault_desktop/src/main/db/{settings,interview}.repo.ts` |
| Reusable elastic-scroll hook | `leetvault_desktop/src/renderer/lib/useElasticScroll.ts` |
| Extension popup + Groq prompt | `leetcode_extension/popup.js` |
| Extension content scraper | `leetcode_extension/content.js` |

## Deeper reading

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — process model, IPC contract, DB layer, server, event flow.
- [`DEVELOPMENT.md`](DEVELOPMENT.md) — setup on a new machine, dev loop, troubleshooting.
- [`BUILD.md`](BUILD.md) — packaging for Windows / macOS / Linux, icons, CI.
- [`GITHUB.md`](GITHUB.md) — pushing to GitHub, secrets to never commit, the release tag workflow.
