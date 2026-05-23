# Beacon

> Trail markers for AI-collaborative codebases.

Beacon is an opinionated documentation convention plus a CLI that scaffolds the structure, generates per-vendor AI rule files (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.cursorrules`), and lints the result — so your AI agents (and humans) always know where docs go and how they're named.

## Install

```bash
npm install -D beacon-docs
```

## Quick start

```bash
npx beacon-docs init
```

The wizard asks for project type, categories to enable, and which AI agents to support, then scaffolds `docs/` and writes the AI rule files at the project root.

## Commands

| Command | Purpose |
|---|---|
| `beacon init` | Interactive scaffold (or `--yes --type=...` for CI). |
| `beacon new <type> <slug>` | Create a doc with correct location, naming, frontmatter. |
| `beacon archive plan <slug>` | Move a completed plan to `_archive/`. |
| `beacon sync` | Regenerate AI rule files from `docs/_meta/convention.md`. |
| `beacon enable <addon>` | Enable an add-on category. |
| `beacon disable <addon>` | Disable an add-on category. |
| `beacon lint` | Validate the docs tree. |

## License

MIT
