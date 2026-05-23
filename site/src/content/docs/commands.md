---
title: Commands
description: The 7 beacon commands — init, new, archive, sync, enable, disable, lint.
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
| [`beacon lint`](#beacon-lint) | Validate the docs tree |

## `beacon init`

Scaffold the convention. See [Install](/install/) for full details and flags.

## `beacon new`

Create a new document with correct location, naming, and frontmatter skeleton.

```bash
beacon new plan billing-integration       # → docs/plans/billing-integration.plan.md
beacon new adr add-rate-limiting          # → docs/adr/ADR-001-add-rate-limiting.md (auto-numbered)
beacon new pattern multi-tenancy          # → docs/reference/multi-tenancy.pattern.md
beacon new eval frontend-audit            # → docs/evaluations/2026-05-22-frontend-audit.eval.md
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

Only `plan` and `roadmap` types are archivable in v0.1. Evaluations are intentionally not archived (their date prefix already bounds them temporally).

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

## `beacon lint`

Validate the docs tree against the convention. 11 rules across error / warning / suggestion severity.

```bash
beacon lint                # text output, exit 1 only on errors
beacon lint --strict       # escalates warnings to errors (recommended for CI)
beacon lint --json         # machine-readable output for CI integration
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
- ADR numbering gaps (intentional gaps from rejected/superseded ADRs are common)
- Plans with no TODOs

**Suggestions** (informational):
- Plans not modified in > 30 days
- ADRs without `status:` frontmatter
- Evaluations older than 6 months

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
```
