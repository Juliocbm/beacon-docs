---
description: Manual slash command (invoke explicitly as /beacon:beacon-doctor). Runs beacon doctor, parses findings, and proposes specific actions per finding (archive a stale plan, accept a stuck ADR, etc.). For auto-detected pre-release moments, beacon-workflow handles them instead.
disable-model-invocation: true
allowed-tools:
  - Bash
  - Read
---

# /beacon:beacon-doctor

> **T4 implementation pending.** Final logic owned by T4 of the [claude-code-plugin-mvp plan](https://github.com/Juliocbm/beacon-docs/blob/main/docs/plans/claude-code-plugin-mvp.plan.md).

## What this skill does (target behavior)

1. Run `bash: beacon doctor --json`.
2. Parse the JSON array of `Finding` objects (each with `area`, `check`, `target?`, `observation`, `suggestion`).
3. Group findings by area (activity / decisions / snapshots / balance) and render them with sensible context.
4. For each finding, propose a concrete next action that the user can confirm:
   - `stale-plans` → "Archive this plan? (`beacon archive plan <slug>`)"
   - `proposed-adrs` → "Update status to accepted/rejected, or add a status note?"
   - `old-evaluations` → "Create a refreshed snapshot? (`beacon new eval <slug>`)"
   - `orphan-readmes` → "Disable this add-on? (`beacon disable <addon>`)"
   - `backlog-balance` → "Archive shipped plans + capture new backlog items?"
5. Execute confirmed actions via Bash.

## When the user accepts all findings as informational

Just summarize: "N findings across M areas, nothing urgent."

(Output parsing rules, prompt format, and batch-confirmation flow come in T4.)
