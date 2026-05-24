---
description: Use when working in a project that has beacon-docs installed (look for docs/_meta/beacon.config.json) or when the user asks to create/manage documentation that should follow a clear convention. Provides workflow guidance so docs are created at the right conversational moments and via the beacon CLI (not by hand).
---

# Beacon Workflow

> **T3 implementation pending.** This skill is the always-available context for Beacon-managed projects. Final body content is owned by T3 of the [claude-code-plugin-mvp plan](https://github.com/Juliocbm/beacon-docs/blob/main/docs/plans/claude-code-plugin-mvp.plan.md).

## Detection

First step in any Beacon-relevant task: verify `docs/_meta/beacon.config.json` exists in the project root. If missing, switch to advisory mode — describe the convention but don't attempt to execute `beacon` CLI commands; suggest installing beacon-docs first.

## Triggers (placeholder)

- Design decision → `beacon new adr <slug>`
- Multi-step work (3+ actions) → `beacon new plan <slug>`
- Deferred scope → `beacon new todo <slug>`
- Release shipped → `beacon new eval <slug>-retrospective`

(Full trigger logic and conversational examples come in T3.)
