---
adr: 010
title: configurable-doctor-thresholds
status: accepted
date: 2026-05-24
supersedes: null
superseded-by: null
---

# ADR-010: Configurable doctor thresholds via `beacon.config.json`

## Status

Accepted (v0.3.1).

## Context

`beacon doctor` v0.2.0 hardcoded thresholds for each check (`STALE_PLAN_DAYS = 30`, `PROPOSED_ADR_DAYS = 14`, etc.). The original plan deferred configurability to a later patch with two reasons: (a) we wanted to see what defaults felt right in real use, and (b) we didn't want to add config-file complexity before we had data on what *should* be tunable.

After v0.2.0–v0.3.0 of dogfooding, the defaults feel correct as starting points, but reasonable teams will want different rhythms — a project with quarterly planning cycles will want `stalePlanDays = 90`, a project that explicitly buffers proposed ADRs for stakeholder review will want `proposedAdrDays = 30`, etc.

## Decision

Per-project thresholds go in `docs/_meta/beacon.config.json` under `doctor.thresholds`. **All fields optional** — unset fields fall back to the defaults defined in `src/doctor/defaults.ts`. Schema:

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

`resolveThresholds(user)` merges user overrides with defaults, ignoring invalid values (non-number, negative, NaN) so a typo in the config never crashes the doctor. Resolved thresholds flow into `CheckContext.thresholds: Required<DoctorThresholds>` so each check reads `ctx.thresholds.<field>` instead of a module-level constant.

## Alternatives considered

1. **Env vars** (`BEACON_STALE_PLAN_DAYS=60 beacon doctor`). Rejected: not persistent, not version-controlled with the project, and easy to forget on a CI runner. Config file matches Beacon's existing `docs/_meta/beacon.config.json` mental model.
2. **CLI flags** (`beacon doctor --stale-plan-days=60`). Rejected for the same reason — repeated typing per invocation defeats the purpose. Could be added later as overrides for one-off runs, but not as the primary mechanism.
3. **Separate `doctor.config.json`**. Rejected: avoids file proliferation in `docs/_meta/`. The doctor section nests cleanly under the existing config.

## Consequences

- New optional field in `BeaconConfig` (`doctor?: DoctorConfig`). Existing configs need zero migration — all fields default to current behavior.
- `beacon about` (also new in v0.3.1) surfaces "using defaults" vs "N overrides" so users can verify their tuning at a glance.
- Adding a future threshold means three coordinated edits: add field to `DoctorThresholds`, add default in `DEFAULT_THRESHOLDS`, use in the check.
- Plugin checks (deferred to a future release) will read from the same `ctx.thresholds` shape — they can opt into the standard config surface.
