---
title: Install & quick start
description: Install beacon-docs from npm and scaffold your first project.
---

## Requirements

- **Node.js ≥ 20**
- npm, pnpm, yarn, or any other package manager

## Install

As a project dev dependency:

```bash
npm install -D beacon-docs
```

Or run without installing:

```bash
npx beacon-docs init
```

## Interactive scaffold (recommended)

```bash
npx beacon-docs init
```

The wizard detects your project (reads `package.json`, suggests add-ons based on installed dependencies like `stripe` or `@prisma/client`), then walks you through:

1. Project type (7 options: web-app, backend-service, library, cli-tool, mobile-app, monorepo, custom)
2. Categories to enable (6 core + 6 opt-in)
3. AI agents to support (Claude, Cursor, Codex, Gemini)
4. Whether to merge or replace existing `CLAUDE.md` / `.cursorrules` if present

## Non-interactive (CI / scripted setup)

```bash
npx beacon-docs init \
  --yes \
  --type=library \
  --with=operations \
  --without=backlog \
  --agents=claude,cursor
```

| Flag | Purpose |
|---|---|
| `--yes` | Skip the interactive wizard |
| `--type=<type>` | One of: `web-app`, `backend-service`, `library`, `cli-tool`, `mobile-app`, `monorepo`, `custom` |
| `--with=a,b` | Add categories beyond your project type's defaults |
| `--without=a,b` | Remove categories from defaults |
| `--agents=a,b` | AI agents to support: `claude`, `cursor`, `codex`, `gemini` |
| `--language=en` | Docs language (only `en` ships today) |

## What gets created

```
your-project/
├── CLAUDE.md                         ← generated, read by Claude Code
├── AGENTS.md                         ← generated, read by Codex / Copilot
├── GEMINI.md                         ← generated, read by Gemini CLI
├── .cursorrules                      ← generated, legacy Cursor
├── .cursor/rules/beacon.mdc          ← generated, modern Cursor
├── package.json                      ← gets a `docs:lint` script
└── docs/
    ├── README.md                     ← master index
    ├── _meta/
    │   ├── convention.md             ← single source of truth (you edit this)
    │   └── beacon.config.json
    ├── reference/
    ├── architecture/
    ├── adr/
    ├── plans/
    │   └── _archive/
    ├── backlog/
    └── evaluations/
```

Categories enabled depend on your project type.

## What the AI rule files contain

Each generated AI rule file (CLAUDE.md, AGENTS.md, GEMINI.md, .cursorrules) includes:

- **Universal rules** — 9 invariant structural rules (kebab-case, ADRs append-only, etc.)
- **Project-specific rules** — disambiguation for enabled add-ons
- **"Where does X go?"** lookup table
- **Workflow triggers** *(v0.4.1+)* — when to create each doc type
  *("Design decision made → run `beacon new adr`")*
- **Document lifecycle** *(v0.4.1+)* — maintenance rules
  *("Plans must archive when shipped")*
- **Self-checks** *(v0.4.1+)* — Beacon's own tools as forcing functions
  *("Run `beacon doctor` before tagging a release")*

The behavioral sections (workflow triggers, lifecycle, self-checks) are what make AI agents proactively create docs instead of only following structural rules for docs they happen to write.

## After init

Use [Commands](/commands/) to start creating docs. Highlights:

- `beacon new <type> <slug>` — create a doc with correct location and frontmatter
- `beacon lint` — validate the docs tree against the convention
- `beacon doctor` — surface health signals (stale plans, proposed ADRs, etc.)
- `beacon completion bash > /path` — install shell completion for a smoother workflow
- `beacon about` — see version, config, AI-file status

## Optional: enable plugins

`beacon doctor` and `beacon lint` are extensible. Add plugins to `docs/_meta/beacon.config.json`:

```json
{
  "plugins": [
    "beacon-plugin-compliance",       // npm package
    "./scripts/internal-checks.mjs"   // relative path
  ]
}
```

See [`examples/plugin-example/`](https://github.com/Juliocbm/beacon-docs/tree/main/examples/plugin-example) in the repo for a working reference and [`writing-a-plugin.pattern.md`](https://github.com/Juliocbm/beacon-docs/blob/main/docs/reference/writing-a-plugin.pattern.md) for the full authoring guide.
