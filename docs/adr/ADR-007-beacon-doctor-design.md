---
adr: 007
title: beacon-doctor-design
status: accepted
date: 2026-05-23
supersedes: null
superseded-by: null
---

# ADR-007: `beacon doctor` design — separate health checks from lint

## Context

`beacon lint` is the structural / naming validator. It enforces hard rules with pass/fail
semantics: if `lint` is green, the docs tree obeys the convention. This is the right contract
for CI gates and pre-commit hooks.

But there is a different class of observations that are not lint violations:

- A plan in `docs/plans/` not modified in 60 days. Maybe it shipped and nobody archived it.
  Maybe it stalled. Maybe it's still active but slow. Lint cannot know.
- An ADR with `status: proposed` for 4 weeks. Should be accepted, rejected, or superseded.
- An evaluation 9 months old with no newer eval in the same area. Stale state snapshot.
- 20 plans active, empty backlog. Backlog hygiene is suffering.

Surfacing these in `lint` would be wrong: they would either (a) become warnings, polluting the
error/warning signal, or (b) become a separate severity that nobody runs in CI. Either way,
the strict pass/fail contract of `lint` weakens.

## Decision

Ship a dedicated `beacon doctor` command with different semantics from `lint`:

- **Exit code 0 by default**, regardless of findings. `doctor` is a report, not a gate.
- **`--strict` opt-in** to escalate findings to exit code 1 — for teams that want doctor
  in CI as a "hygiene gate."
- **`--json` output** for machine consumption (parity with `lint`).
- **Findings are categorized by health area**, not severity (`activity`, `decisions`,
  `snapshots`, `balance`).
- **Findings include suggested actions**, not just diagnostics (lint says "what's wrong";
  doctor says "what to do next").
- **No overlap with lint rules**: anything that's a structural violation stays in `lint`.

## Consequences

**Positive:**
- `lint` keeps its narrow, predictable contract.
- Teams can run `doctor` weekly/monthly without it being a build gate.
- AI agents reviewing a project can call `doctor` to get human-readable health insights.

**Negative:**
- Two commands to remember instead of one. Mitigated by clear naming: lint = check, doctor =
  diagnose.
- Some users will want to merge them. We accept that complaint in exchange for the cleaner
  separation of concerns.

## Alternatives considered

1. **Add as new severity tier in `lint`** (e.g., `health`): rejected. Dilutes the error/warning
   signal. Users would either ignore them (defeating the purpose) or be forced to fix them in
   CI (wrong contract).
2. **Per-rule configuration in `beacon.config.json`** to enable health rules in lint: rejected.
   Pushes complexity onto users who don't want it. Beacon's opinionated stance argues against
   per-rule configuration.
3. **Web UI dashboard for project health**: rejected for v0.2. CLI-first tool; a web dashboard
   could be a v1.x extension.
4. **Reuse lint runner with a `severity: "info"` tier**: rejected. The lint runner returns
   findings that aggregate by error/warning/suggestion counts; introducing a fourth tier
   complicates the API and the reporter.

## Severity model

`doctor` findings have one of four **areas** (not severities):

| Area | Examples |
|---|---|
| `activity` | Stale plans, abandoned roadmaps |
| `decisions` | ADRs stuck in `proposed`, ADRs with no rationale |
| `snapshots` | Old evaluations without follow-up |
| `balance` | Plans-to-backlog ratio, modules with no docs |

Each finding has: `area`, `target` (file or category), `observation`, `suggestion`.

No "error/warning/suggestion" tier — `doctor` is uniformly informational. The single
severity dial is the `--strict` exit code escalation.

## Output format

**Default (text):**

```
🩺 Beacon doctor — health report for beacon-docs (cli-tool)

Activity (2 findings)
  📄 docs/plans/billing-integration.plan.md
     Last modified 47 days ago.
     → If shipped, archive it. If stalled, add a status note.
  📄 docs/plans/realtime-rework.plan.md
     Last modified 32 days ago.
     → Consider archiving or splitting into smaller plans.

Decisions (1 finding)
  📄 docs/adr/ADR-003-database-choice.md
     status: proposed for 21 days.
     → Move to accepted/rejected/superseded.

Snapshots (0 findings)

Balance (1 finding)
  📁 docs/plans/ has 12 active plans; docs/backlog/ has 0 items.
     → Active work is healthy but backlog hygiene is lagging.

4 findings across 3 areas. Run `beacon doctor --json` for machine output.
```

**`--json`:**

```json
[
  {
    "area": "activity",
    "target": "docs/plans/billing-integration.plan.md",
    "observation": "Last modified 47 days ago.",
    "suggestion": "If shipped, archive it. If stalled, add a status note."
  }
]
```

## Implementation note

`doctor` reuses the `walker` and `DocFile` types from `src/linter/` but introduces its own
`Check` interface (parallel to `Rule`) and `Finding` shape. Sharing the walker avoids a second
file scan; diverging the rule interface keeps the contracts distinct.

See [docs/plans/v0-2-beacon-doctor.plan.md](../plans/v0-2-beacon-doctor.plan.md) for the
implementation breakdown.
