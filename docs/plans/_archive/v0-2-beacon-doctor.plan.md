---
title: v0.2 — beacon doctor health checks
status: active
created: 2026-05-23
---

# v0.2 — `beacon doctor` health checks

## Goal

Ship `beacon doctor` — a separate-from-lint command that surfaces project health signals
(stale plans, ADRs stuck in proposed, old evaluations, backlog imbalance) with actionable
suggestions, exit code 0 by default, `--strict` and `--json` opt-ins.

Design rationale: [ADR-007](../adr/ADR-007-beacon-doctor-design.md).

Acceptance criteria source: [beacon-doctor-health-checks backlog item](../backlog/beacon-doctor-health-checks.todo.md).

## Scope

**In:**
- `src/doctor/` module mirroring `src/linter/` structure
- 4 initial checks (one per area): `stale-plans`, `proposed-adrs`, `old-evaluations`, `backlog-balance`
- `src/commands/doctor.ts` orchestrator
- CLI wiring (`beacon doctor [--strict] [--json]`)
- Integration tests parallel to `tests/integration/lint.test.ts`

**Out:**
- Custom check authoring (defer to plugin system, v0.3+)
- HTML / web dashboard (CLI-only)
- Configurable thresholds (`v0.2.1` patch — config file integration)
- Auto-fix / interactive remediation

## File structure

```
src/doctor/
├── types.ts            # Area, Finding (doctor variant), Check, CheckContext
├── runner.ts           # runDoctor(opts: { root, checks }): { findings, areaCounts }
├── reporter.ts         # formatText, formatJson
└── checks/
    ├── stale-plans.ts        # activity area
    ├── proposed-adrs.ts      # decisions area
    ├── old-evaluations.ts    # snapshots area
    └── backlog-balance.ts    # balance area

src/commands/
└── doctor.ts           # runDoctorCommand({ root, strict, json })

tests/unit/doctor/
├── runner.test.ts
└── checks/
    ├── stale-plans.test.ts
    ├── proposed-adrs.test.ts
    ├── old-evaluations.test.ts
    └── backlog-balance.test.ts

tests/integration/
└── doctor.test.ts
```

`src/doctor/` is parallel to `src/linter/`. They share the file walker from
`src/linter/walker.ts` (reuse, not duplicate) but have distinct `Rule`/`Check` interfaces and
`Finding` shapes.

## TODOs

### T1 — Doctor types + runner framework

- [ ] Define `Area = "activity" | "decisions" | "snapshots" | "balance"` in `src/doctor/types.ts`.
- [ ] Define `Finding { area, target?, observation, suggestion }` (no severity — uniform info).
- [ ] Define `CheckContext { root, config, files }` (reuse `DocFile` from `linter/types.ts`).
- [ ] Define `Check { name, area, check(ctx): Promise<Finding[]> | Finding[] }`.
- [ ] Implement `runDoctor({ root, checks })` in `src/doctor/runner.ts`. Reuses
      `walkDocs(root)` from `src/linter/walker.ts`. Returns `{ findings, areaCounts }`.
- [ ] Unit test: empty checks array → zero findings. Mock check returning 2 findings → both
      surface in result. `areaCounts` aggregates correctly.

### T2 — `stale-plans` check (activity area)

- [ ] Test fixtures: temp dir with `docs/plans/old.plan.md` (mtime 40 days ago) and
      `docs/plans/recent.plan.md` (mtime today).
- [ ] Test: check returns 1 finding for `old.plan.md`, 0 for `recent.plan.md`.
- [ ] Test: archived plans (`_archive/`) are not flagged regardless of age.
- [ ] Test: threshold defaults to 30 days; doc the constant.
- [ ] Implement `src/doctor/checks/stale-plans.ts`. Finding format:
      `{ area: "activity", target: "docs/plans/foo.plan.md", observation: "Last modified 47 days ago.", suggestion: "If shipped, archive it. If stalled, add a status note." }`

### T3 — `proposed-adrs` check (decisions area)

- [ ] Test fixtures: `docs/adr/ADR-001-foo.md` with `status: proposed` + frontmatter date
      14 days old; `docs/adr/ADR-002-bar.md` with `status: accepted`.
- [ ] Test: only ADR-001 flagged.
- [ ] Test: ADRs without frontmatter `date` field use file mtime as fallback.
- [ ] Implement `src/doctor/checks/proposed-adrs.ts`. Uses `gray-matter`. Threshold: 14 days.

### T4 — `old-evaluations` check (snapshots area)

- [ ] Test fixtures: `docs/evaluations/2025-08-01-old.eval.md` (>6 months ago) with no newer
      eval; `docs/evaluations/2026-05-01-recent.eval.md`.
- [ ] Test: `old.eval.md` flagged, `recent.eval.md` not.
- [ ] Test: if a newer eval exists with similar title (case-insensitive substring match), the
      older one is NOT flagged (it has been refreshed).
- [ ] Implement `src/doctor/checks/old-evaluations.ts`. Parses date from filename prefix.
      Threshold: 6 months.

### T5 — `backlog-balance` check (balance area)

- [ ] Test fixtures: `docs/plans/` with 10 files, `docs/backlog/` empty; vs. `docs/plans/` with
      2 files, `docs/backlog/` with 5 files.
- [ ] Test: first case flagged ("12 active plans, 0 backlog items"); second case not flagged.
- [ ] Test: ratio threshold — flag when plans > 5 AND backlog == 0, OR when plans:backlog > 5:1
      AND plans > 5.
- [ ] Implement `src/doctor/checks/backlog-balance.ts`. Counts non-README, non-archived files
      in each folder.

### T6 — Reporter

- [ ] Test: text output groups findings by area, with area name + count headers.
- [ ] Test: text output uses `📄`/`📁` glyphs for file vs folder targets.
- [ ] Test: text output ends with summary line: "N findings across M areas".
- [ ] Test: JSON output is valid JSON, round-trips identical Finding[].
- [ ] Implement `src/doctor/reporter.ts` (`formatText`, `formatJson`).

### T7 — `runDoctorCommand` orchestrator

- [ ] Integration test fixtures: scaffold a temp project, populate with files designed to trip
      each check.
- [ ] Test: clean tree → empty findings, exit code 0 even with `--strict`.
- [ ] Test: tree with stale plan + proposed ADR → 2 findings, exit code 0.
- [ ] Test: same tree + `--strict` → exit code 1.
- [ ] Test: `--json` → valid JSON parses to array of expected length.
- [ ] Implement `src/commands/doctor.ts`. Registers all 4 checks, calls `runDoctor`, formats
      via reporter, returns `{ exitCode, output }`.

### T8 — CLI wiring

- [ ] In `src/cli.ts`, add `beacon doctor` command after `lint` registration. Mirror the
      lint command's option set (`--strict`, `--json`) and output handling.
- [ ] Smoke test: build, then `node dist/cli.js doctor` in a fresh init'd project → exit 0,
      "0 findings across 4 areas".

### T9 — Changeset + release prep

- [ ] `npx changeset add` — minor bump (`0.1.x` → `0.2.0`); description summarizes doctor scope.
- [ ] Update README: add `beacon doctor` to commands table; brief section explaining lint vs
      doctor distinction.
- [ ] Update CLAUDE.md / AGENTS.md / etc. via `beacon sync` (no actual change unless we touch
      convention.md, but verify).
- [ ] Bump test count expectation in README badge if applicable.

### T10 — Sprint W0.2 checkpoint

- [ ] All tests green (target ~165+ tests, was 147 at v0.1.0).
- [ ] `npm run typecheck`, `npm run build`, `node dist/cli.js lint` — all clean.
- [ ] `git tag -a v0.2.0-rc1` (release candidate before npm publish).
- [ ] Once smoke-tested by author: `npx changeset version`, commit, `npm publish --access public`.
- [ ] Move this plan to `docs/plans/_archive/` after v0.2.0 ships.

## Effort estimate

~1-2 weekends (V1 took ~37 tasks across 4 sprints; this is 10 tasks parallel to one V1 sprint).

## Open questions

- Should `doctor` cache results to disk for faster re-runs? Defer — CLI is fast enough at MVP.
- Should `--strict` differentiate "all findings" vs "findings in specific areas"? Defer to v0.3.
- Should there be a `beacon doctor explain <check-name>` for verbose rationale? Defer.
