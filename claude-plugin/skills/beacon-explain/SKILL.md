---
description: Explain a Beacon lint rule, doctor check, or plugin-contributed item. Searches built-in lint rules first, falls through to doctor checks. Use when the user asks "what does <name> do?" or "why is this flagged?".
allowed-tools:
  - Bash
arguments:
  - term
---

# /beacon:beacon-explain <term>

> **T4 implementation pending.** Final logic owned by T4 of the [claude-code-plugin-mvp plan](https://github.com/Juliocbm/beacon-docs/blob/main/docs/plans/claude-code-plugin-mvp.plan.md).

## What this skill does (target behavior)

User provides `$0` (the term to explain).

1. Try `bash: beacon lint --explain "$0"` first.
2. If that exits non-zero with "Unknown rule", try `bash: beacon doctor --explain "$0"`.
3. If both fail, surface the typo-corrected suggestion that the CLI returns (`"Did you mean X?"`).
4. Render the explanation faithfully — don't summarize unless the user asks for a summary.

## With no argument

Run both `beacon lint --explain` and `beacon doctor --explain` (no name) to list all available items grouped by category.

(Edge cases like ambiguous matches across lint + doctor namespaces handled in T4.)
