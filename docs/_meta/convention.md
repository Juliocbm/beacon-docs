# Documentation Convention

> Single source of truth for the Beacon convention in this project. AI rule files (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.cursorrules`) are generated from this file — run `beacon sync` after editing.

## Project type

`cli-tool`

## Enabled categories

- `reference/` — Replicable technical patterns.
- `architecture/` — System structure and layering decisions.
- `adr/` — Architecture Decision Records.
- `plans/` — Active work with TODOs.
- `backlog/` — Future items waiting to be sprinted.
- `evaluations/` — Date-prefixed audits and snapshots.
- `operations/` — Runbooks and deploy guides.

## Universal rules

1. **One doc = one category.** Never duplicate across folders.
2. **Status via folder, never filename.** Closed plan → `_archive/`, never `*_DONE.md`.
3. **kebab-case for all filenames.**
4. **README required in every category folder.**
5. **ADRs are append-only.** Supersede with a new ADR; never edit an accepted one.
6. **Evaluations are immutable snapshots.** To revise, create a new dated file.
7. **Plans archive to `_archive/` when done.** Never rename.
8. **Generated AI files must match this file.** Run `beacon sync` after editing.
9. **Don't create folders outside this convention.** Run `beacon enable <addon>` or open an ADR.

## Suffix table

| Category | Suffix | Notes |
|---|---|---|
| `reference/` | `.pattern.md` |  |
| `architecture/` | `.architecture.md` |  |
| `adr/` | `.md` | Auto-numbered (ADR-NNN-). |
| `plans/` | `.plan.md` |  |
| `backlog/` | `.todo.md` |  |
| `evaluations/` | `.eval.md` | Requires `YYYY-MM-DD-` prefix. |
| `operations/` | `.guide.md` |  |
