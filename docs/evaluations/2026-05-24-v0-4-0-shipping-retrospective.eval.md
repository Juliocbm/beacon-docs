---
title: v0.4.0 Shipping Retrospective — release cadence, dogfooding gap, plugin design tradeoffs
date: 2026-05-24
scope: releases v0.1.1 through v0.4.0 (post-v1.0 patches + first 3 minors)
---

# v0.4.0 Shipping Retrospective

## Summary

Captures observations after three days of intensive iteration on Beacon — eight patch releases (`v0.1.1` → `v0.1.8`), one minor (`v0.2.0`), one patch (`v0.2.1`), one minor (`v0.3.0`), one patch (`v0.3.1`), and one minor (`v0.4.0`). Total: **12 npm releases across 3 calendar days**.

| Metric | v0.1.0 baseline | v0.4.0 today |
|---|---|---|
| Top-level commands | 7 | 10 (`+about`, `+completion`, `+doctor`) |
| Lint rules | 11 | 11 (no new rules; rule docs added) |
| Doctor checks | — | 5 |
| ADRs | 6 | 11 |
| Tests | 147 | 302 |
| Plugin contract | none | shipped (checks + rules) |

## Findings

### What worked

**Subagent-driven development with conversational scope decisions.** Most releases skipped a dedicated plan doc and ran straight from ADR → code → release. v0.2.0 was the only release that had a full pre-written plan in `docs/plans/`. For releases this small (1-3 task units each), the conversational flow was faster than writing a plan first; the ADR captured the durable design decision and the conversation captured the execution.

**ADR-first for every minor.** All four minors (`v0.2.0`, `v0.3.0`, `v0.4.0`, plus the in-spirit-minor `v0.2.1` and `v0.3.1`) had an ADR written **before** implementation began. This caught at least two design issues that would have been painful to revert:
- ADR-009 considered callback-based completion before settling on static-script generation (Node startup latency would have made TAB feel broken).
- ADR-011 considered postinstall hooks for plugins before settling on the resolve-from-project-root pattern (postinstall is user-hostile in CI).

**Release flow pattern was sticky.** After v0.1.5 we converged on: code → changeset → bump → commit → tag → publish → push → smoke-test → user creates GH Release → continue. Same flow every release reduced cognitive overhead.

**SemVer discipline.** We jumped `0.1.8 → 0.2.0` for the new `doctor` command instead of using `0.1.9`. Documented this in v0.2.1 with a README "Versioning policy" section after the user asked why v0.1.9 was skipped. Patches stayed patches; new commands triggered minor bumps; no breaking changes were shipped (so no major bumps needed).

### What didn't work

**Dogfooding was uneven across categories.** Audit run on this date showed:
- **ADRs:** healthy — added one per significant release (5 new ADRs in 3 days).
- **Plans:** underused — only 2 plans in the repo total, despite 4 minors shipping.
- **Backlog:** frozen on day 1 until today — we deferred scope (e.g., "categories+agents to v0.5+" in ADR-011) without capturing it as a backlog item. This retrospective is being written in part to fix that.
- **Evals:** until today, exactly 1 eval existed (the v1 feature-completeness snapshot). Zero per-release retrospectives.
- **Patterns:** 3 from day 1 + `writing-a-plugin` added with v0.4.0. Acceptable, since patterns serve contributors and we added one when we needed one.

**`v0-1-2-polish.plan.md` lingered as active for too long.** The plan was created on day 2 for v0.1.2 but never archived even though all polish work shipped across v0.1.2–v0.1.8. The plan had unchecked TODOs (we never went back to mark them done as steps shipped); `beacon archive plan v0-1-2-polish` correctly refused without `--force`. This is the doctor working as intended — but it should have been archived release-by-release instead of needing a cleanup pass today.

**Pre-existing test mock drift discovered late.** When ramping up v0.1.8 tests, we hit a failure in `tests/integration/init-interactive.test.ts` that was actually broken since v0.1.6 — the `@clack/prompts` mock didn't expose `note` after we added `p.note()` for the wizard intro. The test had been silently failing since v0.1.6 but we didn't notice because tests weren't run in the right order until v0.1.8. **Lesson:** run `npm test` after every patch release, not just before the next minor.

**Plugin authoring scope was a real tradeoff call.** ADR-011 chose "checks + rules only" for v0.4.0 over the full "categories + agents + checks + rules" scope. Both options were defensible. The conservative choice ships sooner (good) and lets us learn from real plugin authors (good) but means v0.4.0 is incomplete relative to the original "plugin system" mental model. The deferred items now live in [v0-5-plugin-categories-and-agents.todo.md](../backlog/v0-5-plugin-categories-and-agents.todo.md) — created today to close the dogfooding gap.

### Observations about the product itself

**`beacon doctor` flagged something real** during this audit attempt: the unchecked-TODOs guard on `beacon archive plan` stopped me from archiving `v0-1-2-polish.plan.md` until I read the warning and decided `--force` was correct. That's the tool earning its keep.

**`orphan-readmes` (shipped v0.3.1) would have triggered on this repo if we'd been less disciplined.** No add-on category here is orphaned right now because we've kept all enabled add-ons populated. But the check would have caught us if we had, say, enabled `compliance` "just in case" at init time and never used it.

**The plugin system has not yet been used by anyone external.** v0.4.0 is hours old at the time of writing. The shipped example plugin (`examples/plugin-example/`) is the only consumer. **All design decisions in ADR-011 are theoretically defensible but not yet validated by real third-party use.** This is the single biggest unknown going into v0.5.

## Recommendations

### Process recommendations for the next 2-4 weeks

1. **Stop building. Start distributing.** Announce v0.4.0 (HN, Reddit, devtools communities). Without external eyeballs the next release will be speculation.
2. **Run `beacon doctor` weekly on this repo** as a forcing function — if it surfaces a finding, the discipline gap will be visible.
3. **Hold off on v0.5.** Don't extend the plugin system until there's at least one external plugin in the wild. ADR-011's "categories + agents deferred" is the correct call.
4. **Write release-retrospective evals more frequently going forward.** Even a 5-line eval per minor is more useful than zero. Today's gap was 4 minors with no retrospective; that's too long.

### Product recommendations (low priority — defer)

1. **Consider a `beacon doctor` check for "active plans with no commits in their slug area in N days"** — would catch the polish-plan-not-archived case faster than mtime-only logic. Defer until v0.5+; not urgent.
2. **The `--force` warning text on archive could suggest "consider running `beacon doctor` to identify stale plans"** — chain the tools together so users discover doctor through archive friction. Trivial patch — could be v0.4.1 if we decide to keep building.
