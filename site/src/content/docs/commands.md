---
title: Commands
description: The 10 beacon commands — init, new, archive, sync, enable, disable, lint, doctor, completion, about.
---

## Overview

| Command | Purpose |
|---|---|
| [`beacon init`](#beacon-init) | Interactive scaffold (or `--yes --type=...` for CI) |
| [`beacon new`](#beacon-new) | Create a doc with correct location, naming, frontmatter |
| [`beacon archive`](#beacon-archive) | Move a completed plan/roadmap to `_archive/` |
| [`beacon sync`](#beacon-sync) | Regenerate AI rule files from `docs/_meta/convention.md` |
| [`beacon enable`](#beacon-enable--disable) | Enable an add-on category |
| [`beacon disable`](#beacon-enable--disable) | Disable an add-on category |
| [`beacon lint`](#beacon-lint) | Validate the docs tree (11 rules) |
| [`beacon doctor`](#beacon-doctor) | Surface health signals (5 checks) |
| [`beacon completion`](#beacon-completion) | Print a TAB-completion script for bash/zsh/fish |
| [`beacon about`](#beacon-about) | Show version, install path, project config, AI-file status |

## `beacon init`

Scaffold the convention. See [Install](/install/) for full details and flags.

## `beacon new`

Create a new document with correct location, naming, and frontmatter skeleton.

```bash
beacon new plan billing-integration       # → docs/plans/billing-integration.plan.md
beacon new adr add-rate-limiting          # → docs/adr/ADR-001-add-rate-limiting.md (auto-numbered)
beacon new pattern multi-tenancy          # → docs/reference/multi-tenancy.pattern.md
beacon new eval frontend-audit            # → docs/evaluations/YYYY-MM-DD-frontend-audit.eval.md
beacon new module invoicing               # → docs/modules/invoicing.module.md (requires `modules` enabled)
beacon new todo realtime-hardening        # → docs/backlog/realtime-hardening.todo.md
beacon new guide deploy --category=operations   # → docs/operations/deploy.guide.md
```

Supported types: `plan`, `adr`, `pattern`, `architecture`, `module`, `guide`, `roadmap`, `todo`, `eval`, `compliance`, `business`.

## `beacon archive`

Move a completed plan or roadmap to its `_archive/` sibling folder.

```bash
beacon archive plan billing-integration
```

Refuses if unchecked TODOs (`- [ ]`) remain in the doc. Pass `--force` to archive anyway.

Only `plan` and `roadmap` types are archivable. Evaluations are intentionally not archived (their date prefix already bounds them temporally).

## `beacon sync`

Regenerate all AI rule files (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.cursorrules`, `.cursor/rules/beacon.mdc`) from `docs/_meta/convention.md`. Run after editing the convention.

```bash
beacon sync
```

Idempotent. Safe to run in pre-commit hooks.

## `beacon enable` / `beacon disable`

Toggle an add-on category after initial setup.

```bash
beacon enable operations           # creates docs/operations/ + README, re-syncs AI files
beacon disable operations          # removes from config (refuses if folder has docs unless --force)
beacon disable business --force    # removes from config but keeps files on disk
```

Run with no addon name to list the available add-on categories. Typo correction is built-in (`beacon enable opperations` → *"did you mean operations?"*).

## `beacon lint`

Validate the docs tree against the convention. 11 rules across error / warning / suggestion severity.

```bash
beacon lint                # text output, exit 1 only on errors
beacon lint --strict       # escalates warnings to errors (recommended for CI)
beacon lint --json         # machine-readable output for CI integration
beacon lint --explain      # list all 11 rules grouped by severity
beacon lint --explain kebab-case   # verbose docs for a specific rule
```

### Rules

**Errors** (must fix):
- Suffix/location mismatch (`.plan.md` outside `plans/`)
- kebab-case violation
- Missing `README.md` in an enabled category folder
- Eval file missing `YYYY-MM-DD-` prefix
- Generated AI files out of sync with `convention.md`

**Warnings** (recommended fix):
- Duplicate H1 titles across categories
- File > 1000 lines
- Category folder > 30 files (suggests subdivision)
- ADR numbering gaps

**Suggestions** (informational):
- Plans not modified in > 30 days
- ADRs without `status:` frontmatter

## `beacon doctor`

Surface docs-tree health signals across four areas. **Different from lint** — lint validates structure (hard rules), doctor surfaces soft observations.

```bash
beacon doctor                      # exit 0 even with findings (informational)
beacon doctor --strict             # exit 1 if any findings exist (for CI gating)
beacon doctor --json               # machine-readable for tooling
beacon doctor --explain            # list all 5 checks grouped by area
beacon doctor --explain stale-plans   # verbose docs for a specific check
```

### Checks

| Area | Check | Triggers when |
|---|---|---|
| Activity | `stale-plans` | Plan files unmodified for ≥ 30 days |
| Decisions | `proposed-adrs` | ADRs at `status: proposed` for ≥ 14 days |
| Snapshots | `old-evaluations` | Evals ≥ 6 months old with no newer refresh |
| Balance | `orphan-readmes` | Add-on folders enabled but containing only README |
| Balance | `backlog-balance` | > 5 plans with empty backlog, or plans:backlog > 5:1 |

### Configurable thresholds

Every threshold is overridable per-project in `docs/_meta/beacon.config.json`:

```json
{
  "doctor": {
    "thresholds": {
      "stalePlanDays": 60,
      "proposedAdrDays": 21,
      "oldEvalMonths": 12,
      "orphanReadmeDays": 45,
      "backlogMinPlans": 10,
      "backlogPlansPerItem": 8
    }
  }
}
```

All fields optional; unset uses defaults. Invalid values (non-number, negative) silently ignored.

## `beacon completion`

Print a TAB-completion script for bash, zsh, or fish. Install once per shell:

```bash
beacon completion bash > ~/.local/share/bash-completion/completions/beacon
beacon completion zsh  > "${fpath[1]}/_beacon"
beacon completion fish > ~/.config/fish/completions/beacon.fish
```

After installing, every command is TAB-completable. `beacon archive plan <TAB>` reads `docs/plans/` and suggests real slugs.

## `beacon about`

Diagnostics in one place — version, install path, Node version, platform, project config, threshold overrides vs defaults, AI-file status, loaded plugins.

```bash
beacon about
```

Useful for bug reports and verifying installs.

## Plugins

`beacon doctor` and `beacon lint` are extensible. Add plugins in `docs/_meta/beacon.config.json`:

```json
{
  "plugins": [
    "beacon-plugin-compliance",       // npm package
    "./scripts/internal-checks.mjs"   // relative path
  ]
}
```

A plugin is a JS module exporting a `BeaconPlugin` object with optional `checks[]`, `rules[]`, and `explain` entries. See the [example plugin](https://github.com/Juliocbm/beacon-docs/tree/main/examples/plugin-example) for a working reference and [`writing-a-plugin.pattern.md`](https://github.com/Juliocbm/beacon-docs/blob/main/docs/reference/writing-a-plugin.pattern.md) for the full authoring guide.

## CI integration

```yaml title=".github/workflows/docs-lint.yml"
name: Beacon docs lint
on:
  pull_request:
    paths: ["docs/**", "CLAUDE.md", "AGENTS.md", "GEMINI.md", ".cursorrules", ".cursor/**"]
  push:
    branches: [main]
jobs:
  beacon-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npx beacon-docs lint --strict
      - run: npx beacon-docs doctor --strict
```
