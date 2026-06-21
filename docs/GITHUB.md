# LeetVault — GitHub & Releases

How to push this repo to GitHub from scratch, how the CI release workflow works, and what to verify before tagging.

## Initial push (if the repo isn't on GitHub yet)

The local checkout is currently not a git repo at the root (`leetvault_desktop/` is the actual project — the parent `LeetVault_Setup/` is a working folder). Decide first which layout you want on GitHub:

- **Option A (recommended)** — push the whole `LeetVault_Setup/` tree, so the docs, `leetvault_desktop/`, and `leetcode_extension/` stay together. This matches how everything is referenced from the docs.
- **Option B** — push only `leetvault_desktop/` (the app) and `leetcode_extension/` (the extension) as separate repos. Cleaner per-project, but the cross-references in `docs/` break.

Steps for Option A from a Windows PowerShell or Linux/macOS shell:

```bash
cd /path/to/LeetVault_Setup

git init -b main
git add .
git status                       # eyeball what's about to be committed
git commit -m "Initial import of LeetVault v2.1"

# Create an empty repo on github.com first (no README, no .gitignore — we have ours).
# Then:
git remote add origin git@github.com:<your-user>/leetvault.git
git push -u origin main
```

Before that first `git add .` confirm a `.gitignore` exists at the repo root with at least:

```
node_modules/
out/
release/
.dev-userdata/
*.log
.DS_Store
Thumbs.db
.vscode/
.idea/
```

The Electron build outputs (`out/`, `release/`, dev-only `.dev-userdata/leetcode.db`) are large and machine-specific — keep them out.

If `leetvault_desktop/` already has its own `.gitignore`, the root one only needs to add the top-level dev folders.

## Secrets — never commit these

| Item | Where it lives locally | Why it must not be pushed |
|---|---|---|
| Groq API key | `%APPDATA%\LeetVault\leetcode.db` (Win), `~/Library/Application Support/LeetVault/leetcode.db` (mac), `~/.config/LeetVault/leetcode.db` (Linux) | Per-user secret. The DB is in `userData`, not in the repo, so this is already safe — but never paste a real `gsk_…` key into a commit message, code comment, or test fixture. |
| Apple Developer ID / notarization password | CI secrets (`APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`) | Only needed if you turn on macOS notarization. Configure under **Settings → Secrets and variables → Actions** in the GitHub repo. |
| Windows code-signing cert | CI secret (base64-encoded `.pfx` + password) | Only needed for signed Windows installers; out of scope for v2.x. |

Run a quick scan before the first push:

```bash
git grep -nE "gsk_[A-Za-z0-9_-]{20,}"   # Groq keys
git grep -nE "APPLE_ID|APP_SPECIFIC_PASSWORD"
```

Anything that hits → scrub from history (`git filter-repo`) before pushing.

## Day-to-day workflow

Once the repo is on GitHub:

```bash
git checkout -b feature/some-thing
# work...
npm --prefix leetvault_desktop run typecheck
npm --prefix leetvault_desktop run lint
npm --prefix leetvault_desktop test
git commit -am "feat: …"
git push -u origin feature/some-thing
gh pr create --fill                     # via the GitHub CLI
```

A bare `main` is the protected branch. PR merge → CI builds, no tag = no release artifacts.

## Cutting a release

Releases are tag-driven. The CI workflow lives at `.github/workflows/release.yml` (set up in BUILD.md → CI section).

```bash
# 1. Bump the version in leetvault_desktop/package.json
#    (this is the single source of truth — electron-builder reads it).
$EDITOR leetvault_desktop/package.json

# 2. Commit the bump and tag.
git add leetvault_desktop/package.json
git commit -m "chore: release v2.1.0"
git tag v2.1.0
git push origin main v2.1.0
```

What happens next:

1. GitHub Actions spins up three matrix jobs (`ubuntu-latest`, `macos-latest`, `windows-latest`).
2. Each runs `npm ci` in `leetvault_desktop/`, then `npm run package:<os>`.
3. Artifacts (`.exe`, `.dmg`, `.AppImage`, `.deb`) upload to a **draft** GitHub Release named `v2.1.0`.
4. You open the draft, smoke-test each artifact on its OS (see the BUILD.md checklist), then click **Publish release**.

If a matrix job fails, the draft is still created with the artifacts that succeeded. Re-run the failed job from the Actions tab — no need to re-tag.

## Updating the Chrome extension

The extension lives at `leetcode_extension/` and ships independently of the desktop app — it's loaded "unpacked" from `chrome://extensions` by end users.

```bash
# Bump the version inside leetcode_extension/manifest.json
# Commit and push as part of the same release if the wire format changed.
```

There is no auto-publish to the Chrome Web Store; users pull the latest from a `git pull` of the repo and re-load the unpacked folder.

## Forking strategy

The repo is structured so a fork can:

- Replace `resources/icon.png` + rebuild icons (`node scripts/icons.cjs`) to rebrand.
- Swap the curated `src/main/interview/data/problems.ts` for their own set without touching anything else.
- Adjust the Tailwind color tokens in `tailwind.config.ts` to retheme.

Anything beyond that (different DB schema, different IPC contract, different extension wire format) crosses into "different project" territory — at that point a fresh repo with a credit-back link is cleaner than a long-lived fork.

## Further reading

- [`DEVELOPMENT.md`](DEVELOPMENT.md) — local dev loop, Windows-specific setup, troubleshooting.
- [`BUILD.md`](BUILD.md) — installer formats, signing, smoke-test checklist.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — how the pieces fit together.
