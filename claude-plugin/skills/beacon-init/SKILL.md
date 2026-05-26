---
description: Manual slash command (invoke explicitly as /beacon:beacon-init). Initializes beacon-docs in the current project after inspecting the repo to recommend project type and add-ons.
disable-model-invocation: true
allowed-tools:
  - Bash
  - Read
  - Glob
---

# /beacon:beacon-init

Initializes beacon-docs in the current project. **`beacon init` is destructive in surprising ways** — it creates persistent artifacts (folders, config, generated AI rule files at the project root) that are annoying to undo. This skill exists to make sure init only happens (a) on appropriate state, (b) with the right type+add-ons inference, (c) with user consent over the choices that are team intent rather than mechanical.

## Core principle

**Asymmetric blast radius justifies asymmetric caution.** A wasted turn confirming state costs the user 30 seconds. A misapplied init overwrites their CLAUDE.md, scaffolds folders that compete with existing docs, and forces a git revert. Read state first, then act.

## First action: state detection

Before anything else, run these checks **in parallel** (single message, multiple tool calls):

```bash
# 1. Is beacon-docs already initialized here?
test -f docs/_meta/beacon.config.json && cat docs/_meta/beacon.config.json

# 2. What's in docs/ if it exists?
ls -la docs/ 2>/dev/null

# 3. What kind of project is this?
test -f package.json && cat package.json
ls -la           # top-level structure
```

These four reads give you everything needed to pick the right mode.

## The 5 modes

Based on what state-detection finds, pick exactly one of these:

### Mode 1 — Already initialized (config exists)

`docs/_meta/beacon.config.json` is present. **Refuse to re-init.**

```
This project is already initialized with beacon-docs:
- Project type: <projectType from config>
- Enabled categories: <categories>
- AI agents: <agents>

Re-running `beacon init` would overwrite CLAUDE.md, .cursorrules, and possibly
hand-edited READMEs. You probably want one of:
- `beacon enable <addon>`     — to add categories (compliance, business, ...)
- `beacon disable <addon>`    — to remove categories
- `beacon sync`               — to regenerate AI files from convention.md
- `beacon about`              — to see current state in one place

If you really want a destructive reset, confirm "yes, wipe and restart" and
I'll run `beacon init --yes --type=... --force` — but only with your explicit
acknowledgment that current customizations to CLAUDE.md / .cursorrules will
be lost.
```

**Never** run `beacon init` and let the CLI's interactive prompt handle the merge question — that gambles destructive behavior on a misread of user intent.

### Mode 2 — Empty fresh project

No `package.json`, no `docs/`, no source files. You have zero signals.

**Don't investigate further** (no clues to find). **Don't assume a default** (e.g., "library" because the template uses it). **Don't launch the interactive wizard** — TTY-driven wizards can hang inside Claude Code's tool-call environment.

Ask the user with a structured multiple choice:

```
This folder is empty — no package.json, no source files. I can't infer the
project type. Beacon supports:

  1. web-app          — frontend or fullstack web app
  2. backend-service  — API, microservice
  3. library          — SDK, npm package, shared module
  4. cli-tool         — command-line tool
  5. mobile-app       — iOS, Android, cross-platform
  6. monorepo         — multi-package workspace
  7. custom           — pick exactly what you want

Which fits? Also: which AI agents should I configure
(claude, cursor, codex, gemini)? Default is claude + cursor.
```

On their response, run `beacon init --yes --type=<choice> --agents=<choices>`.

### Mode 3 — Signals present, no existing docs

`package.json` exists (or other signal files), and `docs/` either doesn't exist or has only generated content from earlier failed attempts.

**Inference is your job. Confirmation is theirs.** Type can usually be inferred with high confidence; add-on choice is team intent that you cannot infer.

#### Type inference rules

| Signal in package.json or repo | Likely type | Confidence |
|---|---|---|
| `next` / `react` / `vue` / `astro` / `tailwindcss` | `web-app` | High |
| `express` / `fastify` / `hapi` / `koa` + no UI deps | `backend-service` | High |
| `bin` field + `commander`/`cac`/`yargs`/`oclif` | `cli-tool` | High |
| `react-native` / `expo` / iOS or Android folder | `mobile-app` | High |
| Root `package.json` has `workspaces` + `apps/` + `packages/` | `monorepo` | High |
| `main` / `exports` field + no app deps + no `bin` | `library` | Medium |
| Anything else / mixed signals | Ask (use Mode 2 menu) | Low |

#### Add-on inference rules

| Signal | Add-on candidate | Confidence | Action |
|---|---|---|---|
| `stripe` / `@stripe/stripe-js` / payment libs | `integrations`, possibly `compliance` | Medium | Mention, ask |
| `@prisma/client` / `mongoose` / DB drivers | none directly — `architecture/` is core | N/A | Don't add an add-on for this |
| Project name contains "saas"/"product" | `business` | Low (naming convention isn't intent) | Don't assume, mention |
| Dockerfile / fly.toml / vercel.json | `operations` | Medium | Mention, ask |
| `workspaces` field with multiple apps | `modules` (if functional/business domain split exists) | Low | Surface "modules ≠ technical packages" distinction, ask |

**Rule:** type inference: commit. Add-on inference: mention candidates, ask the user.

Propose with the type filled in but add-ons as a question:

```
Detected: <type> project (based on <key signals>).

I'd run: `beacon init --yes --type=<type> --agents=claude` for the base.

Add-on candidates from the package.json:
- integrations (because Stripe is present) — payment/external service docs
- compliance (because payments → PCI/data retention) — regulatory docs

Want both, just integrations, neither, or different add-ons?
(Other options: business, modules, operations, roadmaps)
```

Then run on confirmation.

### Mode 4 — Existing non-beacon docs

`docs/` exists but no `docs/_meta/beacon.config.json`. The user has been doing documentation work without convention.

**Don't run `beacon init` silently.** Even though the CLI won't delete the existing files, the new beacon structure will create competing conventions (`docs/architecture.md` AND `docs/architecture/` both exist). Future docs become ambiguous.

Inspect existing content first:

```bash
ls -la docs/                            # top-level
find docs -name "*.md" -maxdepth 2      # all markdown
```

Then read 3-5 representative files to understand content shape. Surface a **migration plan** as a table:

```
You have existing docs/ content. `beacon init` won't delete it, but it WILL
create a competing structure. Recommend we migrate first.

Proposed mapping (please review before any move):

| Current                       | Beacon home                            | Notes                       |
|-------------------------------|----------------------------------------|-----------------------------|
| docs/README.md                | (stays)                                | beacon expects this         |
| docs/architecture.md          | docs/architecture/overview.md          | split if multi-topic        |
| docs/ADR-database-choice.md   | docs/adr/ADR-001-database-choice.md    | renumbered, frontmatter     |
| docs/PLAN_v2_FINAL.md         | docs/plans/<slug>.plan.md OR _archive  | depends on status — confirm |
| docs/deployment.md            | docs/operations/deployment.guide.md    | requires `operations` add-on|
| docs/meeting-notes/           | <no beacon home>                       | move to notes/ outside docs |
| docs/archived/                | split per-category into _archive/      | per category              |

Strongly recommend: commit current state first (`git add docs && git commit
-m "snapshot before beacon migration"`) so the migration is reversible.

Approve plan? Or want to adjust mappings first?
```

Only proceed to `beacon init` after the user confirms the migration plan AND optionally checkpoints in git.

### Mode 5 — Monorepo

Detected `workspaces` + `apps/` + `packages/` (or pnpm-workspace.yaml, turbo.json, etc.).

Init at **root only**. Don't suggest per-workspace `docs/` — that violates "one doc = one category" at the repo level. Cross-workspace ADRs have no canonical home if each workspace has its own `docs/`.

**Surface the modules add-on trap honestly:**

```
Detected: monorepo with N workspaces (apps/web, apps/api, packages/ui, ...).

I'd run: `beacon init --yes --type=monorepo --agents=claude`.

About the `modules` add-on (one doc per functional/business module):
- This is for BUSINESS modules (checkout, billing, identity), not technical
  packages (ui, db, config).
- Mapping 1:1 from packages/* → modules/* would duplicate what reference/
  already covers for shared packages.
- Only enable `modules` if you have business domains that cut across
  workspaces.

About docs location:
- Beacon's design is single root docs/ covering everything.
- For monorepos, some teams want per-workspace docs/ for app-specific
  content. If that's you, init at root now, then consider an ADR proposing
  per-workspace docs with the root reserved for cross-cutting concerns.

Add-ons to enable? Default proposal: none. Suggest if you want any.
```

## Inference rules summary

| What | Inference | Action |
|---|---|---|
| Project type (web-app, library, etc.) | Reliable from package.json / folder structure | Propose with confidence, get one confirmation |
| Add-ons (compliance, business, etc.) | NOT reliable — team intent | Mention candidates, always ask |
| AI agents | NOT inferable — user preference | Default claude+cursor, allow override |
| Existing docs migration mapping | Reliable for naming, NOT for plan-status (active vs archived) | Propose mapping, ask about plan status case-by-case |
| Already-initialized vs fresh | 100% reliable (config file present) | Branch behavior accordingly |

## Safety protocols

1. **Read state before destructive ops.** One JSON read costs nothing; clobbering CLAUDE.md costs an angry user.
2. **Never auto-`--force`.** Force requires explicit user acknowledgment of what's being overwritten.
3. **Recommend git checkpoint** when initializing into a directory with existing `docs/` content. *"Run `git add docs && git commit -m 'snapshot before beacon'` first, so migration is reversible."*
4. **Don't launch the interactive wizard from Claude Code.** TTY-driven prompts hang or behave oddly inside tool-call environments. Use `--yes --type=...` + inferred/asked add-ons instead.
5. **Surface tensions instead of silent workarounds.** Monorepo root-only design has a real tradeoff; name it. Existing docs migration has judgment calls; ask.

## Compose, don't duplicate

This skill is **invoked manually** via `/beacon:beacon-init`. It does NOT auto-load when the user says "let's organize the docs" or "this project needs documentation" — those go through `beacon-workflow` (which may suggest *"Run `/beacon:beacon-init` to scaffold"*).

If the user wants to ADD an add-on after init, the right tool is `/beacon:beacon-archive`'s sibling that doesn't exist yet — for now, point them at `beacon enable <addon>` directly.

## Rationalization table

| Excuse | Reality |
|---|---|
| "Signals are strong, just run --yes" | Type yes; add-ons require team intent. Always ask for add-ons. |
| "Empty directory, just default to library" | No signal = no inference. Ask with structured menu. |
| "Already initialized? Let the CLI's prompt handle it" | Gambles destructive behavior. Detect state, refuse, suggest correct command. |
| "Existing docs? Init creates new tree alongside, no harm" | Competing conventions = invisible damage. Migration plan first. |
| "Monorepo has packages/*, --with=modules obviously" | Modules ≠ technical packages. Surface distinction, ask. |
| "Launch interactive wizard so user controls everything" | Wizards hang in Claude Code. Use --yes with inferred type. |
| "git checkpoint suggestion slows them down" | One commit = reversible migration. Worth the 10 seconds. |

## Red flags — STOP and reconsider

When you catch yourself thinking ANY of these mid-response, pause:

- About to run `beacon init` without checking for `docs/_meta/beacon.config.json` first → STOP, detect state
- About to launch `beacon init` interactive (no `--yes`) → STOP, will hang in Claude Code
- About to pre-populate `--with=<addons>` without asking → STOP, ask the user
- About to default to "library" in an empty directory → STOP, ask with menu
- About to auto-`--force` when CLI refuses on existing state → STOP, get explicit consent
- About to silently init alongside non-beacon `docs/` → STOP, migration plan first

**Each of these means: stop the current action, run the canonical path, then continue.**

## Self-checks

- After running `beacon init` successfully, run `beacon about` and surface the result so user sees exactly what was created.
- If `beacon` CLI is not installed (`which beacon` fails), surface this and recommend `npm install -g beacon-docs` before re-invoking. Don't try to work around the missing CLI.
- If the project is git-tracked and the working tree is dirty before init, mention this in the recommendation — uncommitted changes mixed with scaffold output makes diffs harder to read.
- If the user has unusual constraints (e.g., docs/ is a git submodule, or `docs/_meta/` is gitignored), surface these before init.
