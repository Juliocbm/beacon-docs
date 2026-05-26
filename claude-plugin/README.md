# Beacon — Claude Code companion plugin

> **Status:** v0.2.0 — all 6 skills shipped with empirically validated bodies (strict TDD per skill, 4/4 manual validation tests passed). See the [T4 retrospective](https://github.com/Juliocbm/beacon-docs/blob/main/docs/evaluations/2026-05-26-claude-plugin-t4-retrospective.eval.md) for the build process.

Conversational wrapper for [`beacon-docs`](https://beacon-docs.com). Adds five invocable skills (`/beacon:beacon-init`, `/beacon:beacon-new`, `/beacon:beacon-doctor`, `/beacon:beacon-explain`, `/beacon:beacon-archive`) plus one always-available workflow skill that nudges Claude to create the right Beacon documents at the right conversational moments.

This is a **Claude Code plugin**. It lives in a subfolder of the main `beacon-docs` repo for ease of coordinated maintenance. See [ADR-012](https://github.com/Juliocbm/beacon-docs/blob/main/docs/adr/ADR-012-claude-code-plugin-design.md) for the rationale.

## Prerequisites

- **Claude Code v2.1.144 or later** (verify with `claude --version`). Earlier versions may not have `claude plugin marketplace` at all.
- *(Recommended)* **beacon-docs** CLI installed globally or per-project:
  ```bash
  npm install -g beacon-docs
  ```
  The plugin works without it in **advisory mode** (provides convention guidance but cannot execute commands).

## Install

Two commands, no clone required. The `.claude-plugin/marketplace.json` at the repo root is fetched directly from GitHub:

```bash
claude plugin marketplace add Juliocbm/beacon-docs
claude plugin install beacon@beacon-docs-plugins
```

That's it. Open a fresh Claude Code session and the plugin loads automatically.

### Updates

Claude Code refreshes the marketplace data at startup by default. New plugin versions land via:

```bash
claude plugin install beacon@beacon-docs-plugins   # re-resolves to latest
```

Or inside Claude Code: `/reload-plugins` after a `marketplace update`.

### Alternative install paths

- **Local development** — if you're contributing to the plugin: `claude plugin marketplace add ./` from a local clone of `beacon-docs`.
- **Pinned to a tag** — `claude plugin marketplace add https://github.com/Juliocbm/beacon-docs.git#claude-plugin-v0.2.0` to freeze on a specific release.
- **Community marketplace** — once the plugin has independent traction, it'll be split into its own repo and submitted to `claude-plugins-community` for `claude plugin install beacon` (no `@<marketplace>` suffix). Tracked by ADR-012's "split when registry requires" trigger. See [ADR-013](https://github.com/Juliocbm/beacon-docs/blob/main/docs/adr/ADR-013-marketplace-distribution-for-claude-plugin.md) for the full distribution rationale.

## Verify the plugin loaded

After install, open Claude Code in any project. Then:

```
/plugin list
```

You should see `beacon` listed. To check skills are recognized:

```
/help
```

The five invocable skills (`/beacon:beacon-init`, etc.) should appear in the command palette. The always-available `beacon-workflow` skill is auto-invoked based on context (no menu entry).

## What you get

| Skill | Invocation | What it does |
|---|---|---|
| `beacon-workflow` | *(auto-loads)* | Always-available workflow guidance — triggers Claude to use `beacon new` when a decision/plan/scope-defer happens in conversation. |
| `beacon-init` | `/beacon:beacon-init` | Inspects the repo, recommends project type + add-ons, runs `beacon init`. |
| `beacon-new` | `/beacon:beacon-new <description>` | Natural language → `beacon new <type> <slug>`. *"plan to refactor auth"* → `beacon new plan refactor-auth`. |
| `beacon-doctor` | `/beacon:beacon-doctor` | Runs `beacon doctor --json`, parses findings, proposes actions per finding. |
| `beacon-explain` | `/beacon:beacon-explain <term>` | Looks up a lint rule or doctor check by name; surfaces the verbose explanation. |
| `beacon-archive` | `/beacon:beacon-archive` | Lists active plans, lets you select which to archive. |

## How it works

```
┌─────────────────────────────────────────┐
│  Claude (runtime)                       │
│  + this plugin (skills)                 │
└─────────────────┬───────────────────────┘
                  │ shells out to (via Bash tool)
                  ↓
┌─────────────────────────────────────────┐
│  beacon-docs CLI                        │
└─────────────────┬───────────────────────┘
                  │ writes / reads
                  ↓
┌─────────────────────────────────────────┐
│  docs/ + CLAUDE.md + AGENTS.md + ...    │
└─────────────────────────────────────────┘
```

The plugin **delegates** to the CLI. It doesn't reimplement Beacon — it makes Claude better at invoking it.

## Versioning

Plugin version lives in [`.claude-plugin/plugin.json`](.claude-plugin/plugin.json) and is **independent** of the `beacon-docs` npm package version. The CLI may ship multiple patches while the plugin stays at `0.1.0`; conversely, a plugin update doesn't require a CLI release.

## Contributing

Issues and PRs welcome at the [main beacon-docs repo](https://github.com/Juliocbm/beacon-docs). Use the `plugin` label (or mention `[plugin]` in the title) so they're easy to triage.

When changing CLI behavior that the plugin depends on (new flags on `beacon doctor`, etc.), update the relevant skill in the **same PR** to keep CLI ↔ skill drift impossible.

## License

MIT — see [LICENSE](https://github.com/Juliocbm/beacon-docs/blob/main/LICENSE) at the repo root.
