# Beacon — Claude Code companion plugin

> **Status:** MVP scaffolding (T2 complete). Skills currently contain placeholder bodies; full behavior arrives in T3 + T4 of the [implementation plan](https://github.com/Juliocbm/beacon-docs/blob/main/docs/plans/claude-code-plugin-mvp.plan.md).

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

The MVP distributes via a **local marketplace** declared at the repo root. Clone the repo, register the marketplace, then install:

```bash
# 1. Clone the beacon-docs repo
git clone https://github.com/Juliocbm/beacon-docs.git
cd beacon-docs

# 2. Register the local marketplace (one-time, picks up .claude-plugin/marketplace.json)
claude plugin marketplace add ./

# 3. Install the plugin from that marketplace
claude plugin install beacon@beacon-docs-plugins
```

That's it. Open a fresh Claude Code session and the plugin loads automatically.

### Why a local marketplace instead of `--plugin-dir`?

Claude Code's `claude plugin install` only accepts marketplace-resolved plugin names today (no `--plugin-dir` flag). The local marketplace pattern is the supported workflow for testing or distributing plugins from a local filesystem path. See [ADR-013](https://github.com/Juliocbm/beacon-docs/blob/main/docs/adr/ADR-013-marketplace-distribution-for-claude-plugin.md) for the full rationale.

### Future install paths

- **HTTPS-hosted marketplace** — serve `marketplace.json` from a public URL so users don't need to clone the repo first. Not yet shipped.
- **Community marketplace submission** — once the plugin has independent traction, split into a standalone repo and submit to `claude-plugins-community` for `claude plugin install beacon` (no `@<marketplace>` suffix needed). Tracked by ADR-012's "split when registry requires" trigger.

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
