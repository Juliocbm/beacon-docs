---
description: List active plans (or roadmaps) and help archive shipped ones. Wraps beacon archive plan/roadmap with a selection UX instead of requiring the user to remember the exact slug.
allowed-tools:
  - Bash
  - Glob
---

# /beacon:beacon-archive

> **T4 implementation pending.** Final logic owned by T4 of the [claude-code-plugin-mvp plan](https://github.com/Juliocbm/beacon-docs/blob/main/docs/plans/claude-code-plugin-mvp.plan.md).

## What this skill does (target behavior)

1. List active plans via Glob (`docs/plans/*.plan.md`) and active roadmaps (`docs/roadmaps/*.roadmap.md` if the add-on is enabled).
2. Present them as a numbered list with last-modified date for each.
3. Ask the user which to archive (single, multiple, or all).
4. For each selection, run `bash: beacon archive plan <slug>` (or `roadmap`).
5. If the CLI blocks on unchecked TODOs, surface the warning and ask: "Force-archive anyway? (`--force`)" before retrying.

## Default safe behavior

Never pass `--force` automatically. Always require explicit user confirmation when the CLI surfaces an unchecked-TODOs warning — they should be a conscious choice, not silent batches.

(Exact selection prompt format and multi-archive flow come in T4.)
