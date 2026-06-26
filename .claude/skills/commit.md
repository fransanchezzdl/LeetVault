---
name: commit
description: Stage, format, and create a standardized git commit for LeetVault following the project's conventional commit style.
---

# commit skill

Review staged/unstaged changes, then create a properly formatted commit following the conventions below.

## Conventions

### Type prefixes

| Type | When to use |
|------|-------------|
| `feat` | New feature or capability visible to the user |
| `fix` | Bug fix |
| `chore` | Release bumps, dependency updates, tooling, no production code change |
| `ci` | CI/CD pipeline changes |
| `docs` | Documentation only |
| `refactor` | Code restructure with no behavior change |
| `test` | Adding or updating tests |

### Subject line format

```
<type>: <short imperative description>
```

- Use the imperative mood: "add", "fix", "remove" — not "added", "fixes", "removed"
- No capital letter after the colon
- No trailing period
- Max ~72 characters
- For multi-scope commits, list the main areas after the dash: `feat: v2.2.2 - bundle extension, rework popup, add IPC`

### Body (optional, use for non-obvious changes)

- Blank line after subject
- Bullet points with `-` for each logical change
- Group by area: desktop first, then extension, then docs
- Explain **what changed and why**, not how
- No trailing "this commit…" phrases

### Branch naming

```
feat/v<version>        # version feature branch
fix/<short-slug>       # bug fix branch
chore/<short-slug>     # release / tooling
ci/<short-slug>        # pipeline work
```

Slugs: lowercase, hyphen-separated, no special chars. Max ~30 chars.

## Procedure

1. Run `git status` and `git diff` (or `rtk git diff`) to review all changes.
2. Stage relevant files explicitly by name — never `git add -A` or `git add .`.
3. Group logically unrelated work into separate commits if needed.
4. Write the commit using a HEREDOC:

```bash
git commit -m "$(cat <<'EOF'
feat: short subject line

- area: what changed
- area: what changed
EOF
)"
```

5. Run `git status` after to confirm the working tree is clean.

## Examples drawn from this repo

```
feat: v2.2.2 — bundle extension, rework extension UI, add extension path IPC
fix: schema bug
chore: release v2.2.1
fix: electron-builder schema for v26
ci: trigger workflow
feat: v2.2.0 - analytics, updater modal, sidebar version, CI
docs: rewrite extension README in English
```

## What NOT to do

- Don't use past tense ("added X", "fixed Y")
- Don't start with a capital ("Feat:", "Fix:")
- Don't amend published commits — create a new one
- Don't commit `.env`, secrets, or large generated files (`release/`, `out/`, `node_modules/`)
- Don't use vague subjects: "fix bug", "update stuff", "changes"
