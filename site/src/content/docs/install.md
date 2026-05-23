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
| `--language=en` | Docs language (only `en` ships in v0.1) |

## What gets created

```
your-project/
├── CLAUDE.md                         ← generated, read by Claude Code
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

Categories enabled depend on your project type. See [Commands](/commands/) for what to do next.
