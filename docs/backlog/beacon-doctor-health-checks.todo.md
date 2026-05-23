---
title: beacon doctor — health checks command
added: 2026-05-22
---

# beacon doctor — health checks command

## Why

`beacon lint` validates structural and naming conventions, but it doesn't surface higher-level
health signals: stale plans that haven't been updated in months, evaluations with no follow-up
action, ADRs stuck in `proposed` status for weeks, or a plans folder with many items but an empty
backlog (suggesting backlog hygiene has been neglected). These are not lint errors — they're
project health indicators that a team lead or AI agent should be aware of during a project review.

A dedicated `beacon doctor` command would aggregate these signals into a readable health report,
separate from the strict pass/fail semantics of `beacon lint`.

(Spec §10, Post-1.0 backlog)

## Acceptance criteria

- [ ] `beacon doctor` runs without requiring the project to be lint-clean first.
- [ ] Reports plans not updated in >30 days with the last-modified date and a suggested action.
- [ ] Reports ADRs with `status: proposed` older than 14 days, suggesting they be accepted,
  rejected, or superseded.
- [ ] Reports evaluations older than 6 months with no newer eval in the same area (by title
  similarity heuristic), suggesting a fresh snapshot.
- [ ] Output is human-readable by default; supports `--json` for CI integration.
- [ ] Exit code is always 0 (health report, not a gate) unless `--strict` is passed.
