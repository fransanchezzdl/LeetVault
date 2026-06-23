# LeetVault — PostHog Analytics

How telemetry works in LeetVault (v2.2.0+) and how to wire it up locally and in CI.

## Goal

Answer a small set of product questions without operating any backend:

- How many people use LeetVault daily/monthly (DAU/MAU)?
- Which app versions are still in the wild after a release?
- Which features get used (problems → reviews → interviews funnel)?
- What's the OS split (linux/darwin/win32)?

No content, no PII, no error stack traces with file paths. Counts and enums only.

## Design at a glance

| Decision | Choice | Reason |
|---|---|---|
| Process | **Main only**, `posthog-node` | Renderer is sandboxed; main owns lifecycle (clean flush) and never exposes the key to the web view. |
| Region | **EU Cloud** (`eu.i.posthog.com`) | Lower latency for our users; GDPR-friendlier residency. |
| Consent | **Opt-out** (default-on) | Per-user choice persisted in `settings`. First-launch toast discloses + links to Ajustes. |
| Identity | Per-machine anonymous UUID in `settings.distinct_id` | No `identify()` call. Survives app updates, lost on reinstall — fine for a local-first tool. |
| Keys | Build-time injected via Vite `define` | `__POSTHOG_KEY__` / `__POSTHOG_HOST__` / `__APP_VERSION__` are baked into `out/main/index.js`. Missing keys → analytics dead-code-eliminates to no-ops. |
| PII | Hard-excluded | No titles, code, notes, file paths, API keys, DB rows. Enforced by the typed event catalog. |

## Code layout

```
leetvault_desktop/src/main/analytics/
├── posthog.ts      ← initAnalytics / capture / shutdown / disable / enable
├── identity.ts     ← UUID seed, opt-out flag, first-launch flag (settings k-v)
└── events.ts       ← typed event catalog (source of truth)

leetvault_desktop/src/main/ipc/analytics.ts   ← renderer-triggered events
leetvault_desktop/src/renderer/features/settings/
├── SettingsView.tsx
└── AnalyticsCard.tsx                          ← opt-out toggle + distinct_id
leetvault_desktop/src/renderer/components/AnalyticsNotice.tsx  ← first-launch toast
```

Lifecycle is owned by `src/main/index.ts`:

1. After DB + IPC + server are up and the main window exists, `initAnalytics()` runs.
2. `capture('app_opened', { is_first_launch })` fires once per launch.
3. `markFirstLaunchSeen()` flips the flag after the first run.
4. `will-quit` awaits `shutdownAnalytics()` so the last batch flushes before exit.

## Event catalog

Source of truth: [`src/main/analytics/events.ts`](../leetvault_desktop/src/main/analytics/events.ts).

Every event carries super-properties: `app_version`, `os`, `os_release`, `locale`, `arch`.

| Event | Payload | Trigger |
|---|---|---|
| `app_opened` | `is_first_launch: boolean` | main process boot |
| `view_opened` | `view: 'problems' \| 'review' \| 'stats' \| 'roadmap' \| 'help' \| 'interview' \| 'settings'` | renderer `ui.setView()` |
| `problem_created` | `difficulty`, `status`, `has_pattern` | `ipc/problems.ts` |
| `problem_updated` | `difficulty`, `status` | `ipc/problems.ts` |
| `problem_deleted` | — | `ipc/problems.ts` |
| `review_rated` | `quality: 0 \| 2 \| 3 \| 4 \| 5` | `ipc/reviews.ts` |
| `review_session_finished` | `count: number` | renderer when `due.length === 0` |
| `extension_saved` | `action: 'created' \| 'updated'` | HTTP `/save` |
| `interview_started` | `difficulty`, `language`, `timer_min` | `ipc/interview.ts` |
| `interview_finished` | `duration_sec`, `verdict`, `had_evaluation` | `ipc/interview.ts` |
| `interview_aborted` | `elapsed_sec` | `ipc/interview.ts` |
| `groq_key_set` | — | `ipc/settings.ts` (when key is `groq_api_key`) |
| `analytics_opted_out` | — | fired once on toggle-off, then telemetry goes silent |

Hard exclusions enforced by code review and types:

- Problem titles or LeetCode numbers
- Code / notes / solutions
- API keys (Groq, OpenAI, anything)
- Filesystem paths, DB paths, user directories
- Error messages or stack traces

## How to connect (one-time setup)

### 1. Get a PostHog project key

- Sign in at <https://eu.posthog.com>.
- **Project Settings → API Keys** → copy the **Project API key** (starts with `phc_`).
- Note the ingest host: `https://eu.i.posthog.com`.

### 2. Local dev — `leetvault_desktop/.env`

```env
POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
POSTHOG_HOST=https://eu.i.posthog.com
```

`.env` is gitignored. `electron.vite.config.ts` reads it via `loadEnv()` and Vite's `define` inlines the values into `out/main/index.js`. If `.env` is missing, the bundle still builds — `__POSTHOG_KEY__` becomes `""`, every code path that touches the PostHog client short-circuits, and the app launches with no network calls.

### 3. CI — GitHub Actions secrets

Repo → **Settings → Secrets and variables → Actions**:

- `POSTHOG_KEY` = `phc_...`
- `POSTHOG_HOST` = `https://eu.i.posthog.com`

`.github/workflows/release.yml` passes both as env vars to the Package step. Forks without these secrets still build cleanly — they just produce an analytics-disabled binary.

### 4. PostHog dashboards (build once)

In <https://eu.posthog.com>:

- **DAU/MAU** — Insights → Trends → event `app_opened`, unique users, daily.
- **Version distribution** — Trends → `app_opened`, breakdown by `app_version`.
- **Feature funnel** — Funnels → `app_opened` → `problem_created` → `review_rated` → `interview_finished`.
- **OS split** — Trends → any event, breakdown by `os`.
- **Stragglers on old versions** — Trends → `app_opened` last 7 days, breakdown by `app_version`, filter by `app_version != <latest>`.

## Adding a new event

1. Append the event to `EventName` and `EventProps` in `src/main/analytics/events.ts`.
2. Call `capture('event_name', { ... })` from the main-process handler that owns the action. **Never** from the renderer directly — route through an IPC handler.
3. If the trigger lives in the renderer (e.g. a UI action with no existing IPC), add an IPC channel under `IpcChannels.Analytics.*`, a handler in `src/main/ipc/analytics.ts`, and a preload bridge entry in `src/preload/index.ts`.
4. Keep payloads to enums, booleans, and small counts. If you find yourself reaching for a string field, ask whether it leaks content.

## Opting out

Users can flip analytics off in **Ajustes → Analítica anónima**. The toggle:

- Persists `analytics_enabled = false` in `settings`.
- Fires `analytics_opted_out` once (so we can count opt-outs in aggregate).
- Calls `disableAnalytics()`, which nulls the client. All subsequent `capture()` calls no-op.
- Re-enabling rebuilds the client with the existing distinct_id.

The first-launch toast (`AnalyticsNotice.tsx`) auto-dismisses after 10 s and only shows once (`settings.analytics_notice_seen`).

## Testing

- `npm run test` runs `tests/unit/analytics.identity.spec.ts`, which mocks `electron`'s `safeStorage` and verifies UUID generation/reuse, opt-out default, toggle persistence, and the first-launch flag against an in-memory SQLite DB.
- Manual smoke (with key): set `.env`, `npm run dev`, exercise every event, watch them land in PostHog → Activity within ~30 s.
- Manual smoke (without key): delete `.env`, `npm run dev`, confirm the app boots and makes zero requests to `posthog.com`.

## Troubleshooting

- **No events showing up**: check that the Project API key is the **public** project key (`phc_...`), not a personal API key. Confirm `.env` is in `leetvault_desktop/`, not the repo root. Restart `npm run dev` — `define` is build-time, not hot-reloaded.
- **Events arrive in dev but not from packaged builds**: check the GitHub Actions secrets are set and that the Package step env block references them.
- **better-sqlite3 ABI errors after running tests**: `npm run test` switches the native binary to the Node ABI. Run `npm run rebuild:electron` to switch it back before `npm run dev`.
