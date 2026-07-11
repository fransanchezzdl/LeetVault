# LeetVault — Architecture

How the desktop app is wired up internally, end-to-end. Read [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) first if you haven't.

## Process model

Electron splits the app across three JavaScript contexts:

```
┌────────────────────────────────────────────────────────────────┐
│ Main process (Node)                                            │
│  ─ App lifecycle, single-instance lock, frameless window       │
│  ─ SQLite (better-sqlite3)                                     │
│  ─ Fastify HTTP server on 127.0.0.1:7842                       │
│  ─ IPC handlers for `db:*`, `sr:*`, `app:*`, `window:*`        │
└──────▲────────────────────────────────────▲────────────────────┘
       │ contextBridge                       │ ipcMain.invoke / .send
       │                                     │
┌──────┴──────────────┐               ┌──────┴──────────────────┐
│ Preload (Isolated)  │               │ Renderer (Chromium)     │
│  ─ Exposes typed    │  window.lv    │  ─ React 18 + Tailwind  │
│    `window.lv` API  │ ────────────▶ │  ─ TanStack Query/Table │
│  ─ No Node access   │               │  ─ Recharts, heatmap    │
│    leaks downstream │               │                          │
└─────────────────────┘               └──────────────────────────┘
```

Security defaults: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: false` (preload needs Node). The renderer can only reach Node-level capabilities through `window.lv`.

## Repo (desktop app) layout

```
leetvault_desktop/src/
├── main/
│   ├── index.ts                  app boot, single-instance, window, server start
│   ├── window.ts                 frameless config per OS
│   ├── ipc/   register.ts, problems.ts, reviews.ts, stats.ts, import.ts, window.ts
│   ├── server/  fastify.ts, routes.ts, save.ts, cors.ts
│   ├── db/    path.ts, connection.ts, migrations.ts, statements.ts,
│   │          problems.repo.ts, reviews.repo.ts, stats.repo.ts
│   └── domain/ sm2.ts            pure SM-2 algorithm (no DB, no IO)
├── preload/  index.ts            contextBridge → window.lv
├── shared/   ipc-channels.ts, types/{problem,review,stats}.ts
└── renderer/
    ├── main.tsx, App.tsx
    ├── lib/   ipc.ts, queryClient.ts, useElasticScroll.ts, cn.ts
    ├── hooks/ useApplyTheme.ts, useResolvedTheme.ts
    ├── store/ ui.ts              Zustand: nav, filters, modal state, theme
    ├── styles/ globals.css, fonts.css
    ├── components/  chrome/{TitleBar,Sidebar (grouped nav)}, ui/, badges/
    └── features/
        ├── problems/  ProblemsView, ProblemsTable, ProblemFormDialog, FilterBar, hooks.ts
        ├── review/    ReviewView, ReviewCard, hooks.ts
        ├── stats/     StatsView (theme-aware charts + heatmap), hooks.ts
        ├── roadmap/   RoadmapView, RoadmapTree (theme-aware SVG), CategoryPanel, data.ts
        ├── interview/ InterviewView (setup/live/evaluation), voice.ts, store.ts
        ├── settings/  SettingsView (Language, Appearance, Privacy & Data)
        ├── help/      HelpView
        └── donate/    DonateView (placeholder)
```

## IPC contract

The renderer never touches Node APIs directly. Everything is `window.lv.*`, defined in `src/preload/index.ts` and channelled through `src/shared/ipc-channels.ts`.

### Request / response (renderer → main)

| Group       | Method                     | Channel                       | Returns                          |
|-------------|----------------------------|-------------------------------|----------------------------------|
| `problems`  | `list()`                   | `db:problems:list`            | `Problem[]`                      |
|             | `get(id)`                  | `db:problems:get`             | `Problem \| null`                |
|             | `getByNumber(n)`           | `db:problems:getByNumber`     | `Problem \| null`                |
|             | `create(draft)`            | `db:problems:create`          | `{ id }`                         |
|             | `update(id, draft)`        | `db:problems:update`          | `void`                           |
|             | `remove(id)`               | `db:problems:delete`          | `void`                           |
|             | `byPattern(pattern)`       | `db:problems:byPattern`       | `Problem[]`                      |
| `reviews`   | `due()`                    | `db:reviews:due`              | `Problem[]`                      |
|             | `nextDate()`               | `db:reviews:nextDate`         | `string \| null`                 |
|             | `countDue()`               | `db:reviews:countDue`         | `number`                         |
|             | `rate(id, quality)`        | `sr:rate`                     | `void` — applies SM-2            |
|             | `finish(id)`               | `sr:finish`                   | `void` — clears SR, → Solved     |
| `stats`     | `bundle()`                 | `db:stats:bundle`             | `StatsBundle`                    |
| `app`       | `openExternal(url)`        | `app:openExternal`            | `void`                           |
|             | `importDb()`               | `app:importDb`                | `{ok,imported,backupPath}` / err |
|             | `dbPath()`                 | `app:dbPath`                  | `string`                         |
|             | `extensionPath()`          | `app:extensionPath`           | `string` — bundled extension dir |
|             | `openExtensionFolder()`    | `app:openExtensionFolder`     | `void` — opens it in OS file manager |
| `window`    | `minimize()` etc.          | `window:minimize` etc.        | `void`                           |

### Broadcasts (main → renderer)

| Channel                     | Sender                              | Payload                                  |
|-----------------------------|-------------------------------------|------------------------------------------|
| `events:problems-changed`   | every UI write **and** `POST /save` | `{source:'ui'\|'extension', action, id?}`|
| `events:reviews-changed`    | `sr:rate`, `sr:finish`              | `{id}`                                   |
| `events:server-status`      | Fastify start/stop                  | `{port, running}`                        |

`renderer/lib/queryClient.ts` subscribes via `window.lv.on(...)` and calls `queryClient.invalidateQueries(['problems'|'stats'|'reviews'])`. **There is no `setInterval` anywhere in the renderer** — the v1 2.5 s polling loop is gone.

## DB layer

### Path resolution (`src/main/db/path.ts`)

The path is derived from `app.getPath('userData')` after `app.setName('LeetVault')` runs first thing in `main/index.ts`:

| OS      | Path                                            |
|---------|-------------------------------------------------|
| Windows | `%APPDATA%\LeetVault\leetcode.db`               |
| macOS   | `~/Library/Application Support/LeetVault/leetcode.db` |
| Linux   | `~/.config/LeetVault/leetcode.db`               |

On Linux only, the first launch copies `~/.local/share/LeetVault/leetcode.db` (+ `-wal`/`-shm` siblings) over to the new location if present. v1 PyInstaller used the `.local/share` path; Electron picks `.config` by default. We don't symlink — we copy once so users can keep both apps installed during a transition.

### Connection (`connection.ts`)

Singleton `better-sqlite3` handle with:

```
PRAGMA journal_mode = WAL;
PRAGMA synchronous  = NORMAL;
PRAGMA cache_size   = -4000;
PRAGMA foreign_keys = ON;
```

### Schema (`migrations.ts`)

The `problems` table mirrors v1 byte-for-byte (column names, types, CHECK constraints, defaults). v2 adds:

- `CREATE INDEX idx_problems_number ON problems(number)` — kills the O(n) scan from `GET /problem/:n`.
- `CREATE INDEX idx_problems_next_review ON problems(sr_next_review)` — speeds up the review queue.
- `schema_meta(key, value)` table with `version = 2`.

v2.1 bumps the schema to `version = 3` and adds two tables:

- `settings(key TEXT PRIMARY KEY, value TEXT NOT NULL)` — key/value store. The Groq API key is encrypted with Electron's `safeStorage` and base64-stored under `groq_api_key`. UI prefs (`interview_tts_enabled`, `interview_voice_id`, etc.) live here as plain strings.
- `interview_sessions(id, problem_id, difficulty, language, duration_sec, final_code, evaluation_json, started_at, finished_at)` plus `idx_interview_started`. Every finished mock interview lands here; the Stats view aggregates over `evaluation_json` for scorecard averages and verdict distribution.

Migrations are idempotent. There's no migration framework (knex/prisma); a single `runMigrations(db)` runs on boot and uses `CREATE … IF NOT EXISTS` + `INSERT OR REPLACE INTO schema_meta`. An older v1 or v2 DB opens correctly under a v2.1 binary — the missing tables/indexes are created in place, existing rows are never touched.

### Repos

Thin wrappers around prepared statements. Each exposes a focused surface so the IPC layer stays trivial:

- `problems.repo.ts` — `list / get / getByNumber / create / update / delete / byPattern / enterReview / leaveReview`.
- `reviews.repo.ts` — `due / nextDate / countDue / applyQuality / finish`.
- `stats.repo.ts` — `bundle()` returns difficulty/pattern/date counts in one DB roundtrip.

### SM-2 (`src/main/domain/sm2.ts`)

Pure function, no DB, no `Date.now()` baked in. Mirrors `leetcode_tracker/database.py:110-166`:

```ts
type Quality = 0 | 2 | 3 | 4 | 5;
interface SrState  { interval: number; repetitions: number; ease: number }
interface SrUpdate extends SrState { nextReviewISO: string }
function applySm2(prev: SrState, q: Quality, today?: Date): SrUpdate
```

Tested against a golden fixture generated from Python (`tests/fixtures/sm2_python_outputs.json`) — every `(state × quality)` over 20 iterations with a pinned `today`. Ease tolerance ≤ 1e-9.

## Spaced repetition policy (v2.0)

Diverges from v1, deliberately:

- **Only `status = 'To Review'` enters the queue.** v1 enqueued every `Solved` problem; for power users with hundreds of problems the queue exploded over time. v2 makes opt-in explicit.
- **Status transitions reshape the queue** (handled in `problems.repo.ts:update`):
  - `→ To Review` seeds SR fields: `next_review = today`, `interval = 1`, `ease = 2.5`, `repetitions = 0`.
  - Leaving `To Review` clears SR fields (`NULL`s).
- **Review session toggle "Seguir repasando"**:
  - **ON** → 5 quality buttons (Blackout / Difícil / Bien / Fácil / Perfecto). Calls `sr:rate` → SM-2 → new `next_review`.
  - **OFF** → single "Listo" button. Calls `sr:finish` → status reverts to `Solved`, SR fields cleared, problem leaves the queue forever.

## HTTP server (extension wire format)

Fastify on `127.0.0.1:7842`. **The wire format is contractual** — the Chrome extension is a separate codebase and we cannot break it.

### CORS (`src/main/server/cors.ts`)

Mirrors the v1 Python rules exactly (`leetcode_tracker/local_server.py:45-49`):

- No `Origin` header → allow without `Access-Control-Allow-Origin` (curl, server-to-server).
- `Origin` starts with `chrome-extension://` → echo the origin back.
- Anything else → 403.
- Methods: `GET, POST, OPTIONS`. Allowed header: `Content-Type`. No credentials.
- `OPTIONS` short-circuits with 204.

### Routes (`src/main/server/routes.ts`, `save.ts`)

| Verb  | Path              | Response                                                   |
|-------|-------------------|------------------------------------------------------------|
| GET   | `/status`         | `{status:"ok", app:"LeetVault"}`                           |
| GET   | `/api/problems`   | `{problems:[…]}`                                           |
| GET   | `/api/stats`      | `{stats, due_reviews, next_review}`                        |
| GET   | `/problem/:n`     | `1..9999` only, `{found:true, problem}` or `{found:false}` |
| POST  | `/save`           | Validation per `local_server.py:144-218`. Returns `{saved:true, action:"created"\|"updated", id?}` |
| OPTIONS | `*`             | 204 + CORS headers                                          |
| other | `*`               | 404 `{error:"Not found"}`                                  |

Validation limits in `/save`: payload ≤1 MB, `title` ≤300 chars, `difficulty` ∈ enum, `status` ∈ enum, `solution` ≤200 000 chars, `notes` ≤50 000 chars, `date_solved` matches `YYYY-MM-DD`.

After a successful `POST /save`, the server emits `events:problems-changed` with `source:'extension'`. That's the polling replacement — the renderer's TanStack Query cache invalidates within a frame of the extension write.

Error bodies are always `{error:"…"}` with HTTP codes 400 / 403 / 404 / 413 / 500.

## Event-driven cache invalidation

The renderer's query cache is keyed roughly:

- `['problems']` → list, by-id, by-pattern
- `['reviews']`  → due list, count, next date
- `['stats']`    → bundle

Every main-side mutation (IPC or HTTP) ends with `mainWindow.webContents.send('events:problems-changed', …)` (or `…reviews-changed`). In `renderer/lib/queryClient.ts` a `useEffect` subscribes once at boot and invalidates by key.

This is what makes the UI feel instant after an extension save — no debounce, no polling, no manual refresh button.

## Frameless window

Per-OS config in `src/main/window.ts`:

- **Windows / Linux**: `frame: false` + custom `<TitleBar />` with drag region (`-webkit-app-region: drag`). Controls have `no-drag`.
- **macOS**: `titleBarStyle: 'hiddenInset'` — keep the native traffic-light buttons, just hide the title bar.
- **Linux escape hatch**: set env `LV_NATIVE_FRAME=1` to fall back to a native frame (some Wayland compositors mishandle drag regions).

## Elastic scroll (`renderer/lib/useElasticScroll.ts`)

Shared hook used by the problems table, stats, and help views. Asymptotic damping (`resistance = 1 - |bounce|/BOUNCE_MAX`) so the further you push past the edge, the smaller each step gets — feels like an infinite-limit pull. Springs back with `cubic-bezier(.2,.9,.25,1.15)` over 520 ms.

Important pattern: sticky headers must live **outside** the transformed bounce wrapper. Otherwise the transform shifts them along with the content and `position: sticky` stops working. See `ProblemsTable.tsx` for the canonical layout.

## Chrome extension (companion)

`leetcode_extension/` is a separate Manifest V3 bundle. As of v2.2.2 it is bundled with the installers via electron-builder `extraResources` (see `leetvault_desktop/electron-builder.yml`), landing at `<resources>/leetcode_extension/` inside the installed app — on Windows typically `<InstallDir>\resources\leetcode_extension`, on macOS `LeetVault.app/Contents/Resources/leetcode_extension`, on Linux `/opt/LeetVault/resources/leetcode_extension` (deb) or the equivalent AppImage mount path. Users still load it unpacked from `chrome://extensions`; the Help view exposes the absolute path and an "Abrir carpeta de la extensión" button (IPC `app:extensionPath` / `app:openExtensionFolder`).

- `content.js` — scrapes number, title, difficulty, tags, and Monaco editor code from `leetcode.com/problems/*`.
- `popup.js` — two actions: "Pista IA" (Groq `llama-3.1-8b-instant`, single approach-mentor prompt) and "Guardar" (`POST http://localhost:7842/save`).
- Groq API key is stored only in `chrome.storage.local`. The desktop app never sees it.

## Live Coding Interview (v2.1)

A self-contained feature module: the user picks difficulty + language + timer, an AI interviewer streams in a problem, the user codes alongside it in Monaco, then a final evaluator produces a structured scorecard.

### Pieces

```
Main:
├── ai/groq.ts         fetch wrapper + SSE parser + retry/timeout
├── ai/prompts.ts      interviewer + evaluator system prompts (English-only)
├── interview/
│   ├── data/problems.ts    25-30 hand-curated problems (Zod-validated at boot)
│   ├── picker.ts           random pick excluding recent ids
│   ├── session.ts          per-session state + history + Groq streaming
│   └── evaluation.ts       evaluator-JSON parser w/ fallback
├── db/settings.repo.ts     safeStorage-encrypted key/value
├── db/interview.repo.ts    insert + list + aggregates() for stats
└── ipc/interview.ts        start / send / finish / abort / list / stats / pick

Renderer (features/interview/):
├── InterviewView.tsx           phase machine (setup → live → evaluation)
├── SetupPanel.tsx              difficulty/language/timer + animated brand logos
├── LivePanel.tsx               ChatPanel + CodeEditor split (react-resizable-panels)
├── ChatPanel.tsx               messages (react-markdown for assistant), mic + TTS toggles
├── CodeEditor.tsx              Monaco wrapper, themed
├── HeaderBar.tsx               timer (pulses red < 5 min), language pill, Finish
├── EvaluationPanel.tsx         scorecard + reference solution reveal
├── ApiKeyDialog.tsx            Groq key + voice picker (per-OS voices)
├── voice.ts                    Web Speech wrappers (STT + TTS w/ preferred voice)
├── hooks.ts                    timer + stream subscription
└── store.ts                    Zustand phase + messages + code + ttsEnabled
```

### Flow

1. Renderer calls `lv.interview.start({difficulty, language, timerMin})`. Main picks a problem (excluding recently-seen), seeds an in-memory session, and after a 50 ms tick kicks off the opening turn.
2. Main streams Groq SSE deltas as `events:interview-stream` (`{sessionId, delta, done, error?}`); the renderer buffers them into the last assistant bubble. A final `events:interview-message` carries the complete text + role.
3. User chats / codes / clarifies. `lv.interview.send` appends the user turn + current code/language to the session history and triggers another assistant turn.
4. **Finish** posts the full transcript + code to the evaluator prompt with `response_format: json_object`. Result is parsed against the `Evaluation` Zod-style shape; failures render in a raw-text fallback panel. The row goes to `interview_sessions` for stats.
5. Stats query `['stats','interview']` is invalidated, so the Stats view's "Entrevistas simuladas" card refreshes the next time it's opened.

### Voice

- **STT** — `webkitSpeechRecognition`, `lang: 'en-US'`, interim results populate the input field.
- **TTS** — `speechSynthesis`. Voices load asynchronously (Chromium quirk), so `ensureVoices()` memoizes a Promise that resolves on `voiceschanged` (or after 1200 ms). The user's preferred `voiceURI` is loaded at view mount via the settings table; `pickVoice()` falls back to the first English voice. Markdown is stripped before speaking.
- Linux: main process appends `--enable-speech-dispatcher` at boot so Chromium can use the system TTS backend (espeak-ng / festival / etc.).

### Settings persistence

| Key | Stored as | Notes |
|---|---|---|
| `groq_api_key` | `safeStorage.encryptString()` → base64 | Never returned to the renderer in any IPC that includes the value. `hasKey()` / `get()` exist for the in-app Settings dialog only. |
| `interview_tts_enabled` | `'1'` / `'0'` | Loaded by `InterviewView` on mount. |
| `interview_voice_id` | voiceURI (or name fallback) | Loaded by `InterviewView`; persisted from the Settings dialog. |

### Where each functionality lives

| Functionality | File |
|---|---|
| Curated problem dataset | `src/main/interview/data/problems.ts` |
| Interviewer + evaluator prompts | `src/main/ai/prompts.ts` |
| Groq streaming client | `src/main/ai/groq.ts` |
| Session lifecycle | `src/main/interview/session.ts` |
| Settings encryption | `src/main/db/settings.repo.ts` |
| Interview persistence + aggregates | `src/main/db/interview.repo.ts` |
| Voice wrappers (STT + TTS) | `src/renderer/features/interview/voice.ts` |
| Scorecard UI | `src/renderer/features/interview/EvaluationPanel.tsx` |
| Stats card | `src/renderer/features/stats/StatsView.tsx` (`InterviewStatsSection`) |

## Where each functionality lives (quick map)

| Functionality | File |
|---|---|
| App boot, single-instance, window, server start | `src/main/index.ts` |
| DB path resolution + Linux v1 migration | `src/main/db/path.ts` |
| Schema + indexes | `src/main/db/migrations.ts` |
| SM-2 algorithm | `src/main/domain/sm2.ts` |
| HTTP server (extension wire format) | `src/main/server/` |
| IPC handlers | `src/main/ipc/` |
| Typed bridge | `src/preload/index.ts` |
| Renderer entry | `src/renderer/main.tsx` |
| Problems list (virtualized + elastic scroll) | `src/renderer/features/problems/` |
| Review queue + Keep-revising toggle | `src/renderer/features/review/` |
| Stats + heatmap + legend (theme-aware) | `src/renderer/features/stats/` |
| Roadmap (NeetCode 150/250, Blind 75, LC 75) | `src/renderer/features/roadmap/` |
| Help view (usage guide, extension path) | `src/renderer/features/help/` |
| Settings (Language, Appearance, Privacy & Data — incl. DB import) | `src/renderer/features/settings/` |
| Donate view (placeholder — to be developed) | `src/renderer/features/donate/` |
| Live Coding Interview feature | `src/renderer/features/interview/` |
| Sidebar nav (primary + secondary groups) | `src/renderer/components/chrome/Sidebar.tsx` |
| Theme resolution (`useResolvedTheme`) + application | `src/renderer/hooks/` |
| Design tokens + CSS variables (`--shadow-*`, `--panel-bg`, `--sidebar-bg`, per-theme palette) | `src/renderer/styles/globals.css` |
| Reusable elastic-scroll hook | `src/renderer/lib/useElasticScroll.ts` |

## Further reading

- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — high-level overview.
- [`DEVELOPMENT.md`](DEVELOPMENT.md) — setup on a new machine, dev loop, troubleshooting.
- [`BUILD.md`](BUILD.md) — packaging for Windows / macOS / Linux, icons, CI.
- [`GITHUB.md`](GITHUB.md) — pushing to GitHub, secrets, release tag workflow.
