---
title: claude-plugin-t4-retrospective
date: 2026-05-26
scope: claude-plugin / skill authoring methodology
---

# claude-plugin-t4-retrospective

T4 wrote bodies for the 5 invocable skills (`beacon-init`, `beacon-new`, `beacon-doctor`, `beacon-explain`, `beacon-archive`) following the strict-TDD discipline established in T3. Paso 3 verified cross-skill composition. This eval snapshots what worked, what hurt, and what the build process taught about authoring skills under the Claude Code Plugin format.

## Summary

**Shipped:** 5 invocable skills + cross-skill integration check, in 6 commits over a single multi-hour session. Plugin remains at version 0.1.1; bump to 0.2.0 deferred to Paso 6 release decision.

**Methodology:** strict TDD per skill — 5 parallel RED baselines (subagent dispatches with pressure scenarios), GREEN body addressing observed rationalizations, 5 parallel VERIFY dispatches. ZERO REFACTOR phases needed across all 5 T4 skills.

**Outcome:** integration clean (Paso 3 PASS, commit `b537bc9`). All 5 invocables preserve Option A (`disable-model-invocation: true`), none preempt workflow auto-cases, cross-skill protocols (`--force`, empty-state minimalism, Pattern 1 mirror) are consistent and explicitly cross-referenced.

## Findings

### What worked

1. **TDD discipline ported cleanly from T3.** The Iron Law from `superpowers:writing-skills` ("NO SKILL WITHOUT A FAILING TEST FIRST") held under scale. Five skills, ~50 subagent dispatches, no body written before its baseline. The methodology compounds — each skill's RED phase was faster than the previous one because we knew which pressure scenarios reliably surface rationalizations.

2. **"Named-and-shamed" rationalization technique generalized.** Every verify subagent quoted at least one rationalization-table row as the thing that defused the failure mode. Concrete quote from beacon-archive verify D: *"Naming the exact failure mode ('earn the turn by padding') is what makes it stick — unnamed pulls win."* This technique is now load-bearing in skill authoring — abstract rules don't bind agents, named rationalizations do.

3. **Layered redundancy paid off.** Each skill states the most important rules in 3-4 distinct formats: core principle (1-sentence), section body (paragraph), rationalization-table row (one-liner with reality check), red-flag list item (verb-first imperative). Subagents in verify cited *different layers* as what saved them — proving the redundancy isn't waste, it's catching different cognitive failure modes.

4. **Cross-skill mirrors held under audit.** `--force` protocol identical between doctor + archive (verified Paso 3). Empty-state minimalism identical between doctor (all-clear) + archive (no plans) with explicit cross-reference. Pattern 1 (suffix collision) consistent between workflow + beacon-new with explicit cross-reference in both directions. The discipline of *referencing* the mirror skill in the body (not just matching it silently) turns out to matter for future agents reading the skill — they see the constraint as architectural, not coincidental.

5. **Option A architecture (T3 retro lesson) prevented regression.** All 5 invocables shipped with `disable-model-invocation: true`. The `beacon-new` body explicitly encodes the Pattern 1 lesson with a historical-context block citing the Option A REFACTOR by name. The lesson is now defended in two layers: frontmatter (prevents auto-load) + body (prevents silent transform even when explicitly invoked).

6. **ZERO REFACTOR phases across all 5 T4 skills.** T3 needed a REFACTOR cycle (Pattern 5 CLI-fail fallback, eval skeleton, structured-manual mode). T4 didn't. The interpretation: the RED-phase baseline scenarios were chosen well enough that the GREEN body captured all the rationalizations. T3 paid the upfront cost of learning what to look for; T4 ran cleanly.

### What hurt

1. **Pattern 1 architectural fix was discovered post-T3, not during.** The Option A failure mode (beacon-new silently transforming user paths) was caught only in Phase 5 manual validation, *after* T3 was already "done". If we'd had cross-skill integration tests during T3, this would have surfaced sooner. T4's process improvement (cross-skill integration as Paso 3, before Paso 4 retro) was designed to prevent this — and it worked, no late surprises.

2. **Subagent TDD tests skills in isolation, missing cross-skill collisions.** Confirmed lesson from T3 still applies: subagents only see what's in their dispatch prompt. Cross-skill preemption, frontmatter-driven auto-load conflicts, and shared-protocol drift are invisible to per-skill subagent tests. Paso 3 (manual cross-skill audit) is the necessary complement to per-skill TDD — neither suffices alone.

3. **Body lengths consistently overshot the writing-skills target.** Target: <500 words for frequently-loaded skills, <200 for getting-started. Actual T4 bodies: explain ~1100, doctor ~1400, init ~1700, new ~2000, archive ~1800. Justification per skill is real (5-mode state machine, 5-finding playbook, Pattern 1 architecture), but the cumulative cost is real too. These skills are user-invoked (disable-model-invocation), so they don't load into every conversation — but when they DO load, they're heavy.

4. **Language inconsistency in `--force` templates.** Archive uses Spanish (*"El plan tiene N TODOs sin marcar..."*), doctor uses English. Both functional, both convey the same 3-path consent flow. This drifted because skills were authored at different points in the session and the author followed local conversation language at the moment of writing. Worth normalizing in a follow-up cleanup pass.

5. **Frontmatter `name:` field omitted on 5 invocables.** `beacon-workflow` declares `name: beacon-workflow`; the 5 invocables don't declare `name:` at all. Folder-name fallback works in Claude Code, but the `superpowers:writing-skills` meta-skill explicitly lists `name` and `description` as the two required fields. Worth adding for spec-compliance even if Claude Code accepts the omission.

6. **Subagent dispatch cost is high.** ~50 dispatches across T4.1-T4.5. Each is a small spend individually; cumulatively a real budget. The discipline is correct (no body without failing test first), but the cost is real and worth being explicit about in future skill-authoring estimates. Strict TDD for skills is not "free quality"; it's "high-quality skills at meaningful subagent cost".

### Process observations

1. **The 5-baseline / 5-verify cadence converged on the right granularity.** Fewer baselines (3) would miss rationalizations; more (10) would be diminishing returns. Same for verifies. This isn't a hard rule but is a useful starting heuristic for future skill TDD.

2. **Skill-by-skill commits with detailed TDD trail in commit messages helps future audits.** Each T4 commit message contains verbatim quotes from verify subagents and the specific rationalizations the body addresses. Looking at `git log` for the plugin is now a usable record of *why* each skill is structured the way it is — not just *what* changed.

3. **Cross-skill audit (Paso 3) was fast because the per-skill bodies explicitly cross-reference each other.** Archive's "same calibration bug from `beacon-doctor`'s all-clear case" line, beacon-new's "Path-mode handling here mirrors workflow's Pattern 1" line — these turn audit from "compare body N to body M and notice the differences" into "follow the explicit cross-reference and verify it still matches". The cost was paid at write time; the audit benefited.

## Recommendations

### For Paso 5 manual validation

- **Test the `--force` consent-laundering shortcut** in beacon-doctor and beacon-archive. Subagent verifies passed it; manual test in fresh Claude Code (no skill body in initial context, only the description) is the real test. If user says "yes archive" and the CLI returns the unchecked-TODOs error, does the agent surface the 3 paths or auto-`--force`?
- **Test Pattern 1 in beacon-new** by typing `/beacon:beacon-new docs/plans/something.md`. Confirm the agent asks the A/B clarifying question, not silently renames.
- **Test empty-state minimalism** by running `/beacon:beacon-archive` in a project with zero active plans. Confirm "No active plans to archive." single line, no padding.
- **Test selection mode UX** by running `/beacon:beacon-archive` with 3+ active plans of mixed checkbox state. Confirm the agent renders the unified list with `[plan]`/`[roadmap]` type labels and per-item judgment.

### For Paso 6 release decision

- **Bump to 0.2.0.** Shipping 5 functional invocable skills is a substantive feature beyond the 0.1.1 architectural-fix baseline. Semver minor bump warranted.
- **Update `marketplace.json` description** to reflect that the 5 slash-skills now have real bodies (current description was accurate at 0.1.0 and remains accurate, but worth reviewing).
- **Add a CHANGELOG entry** in `beacon-docs/CHANGELOG.md` under "Companion plugin" subheader, summarizing the T4 ship.
- **Consider tagging** the plugin release separately from beacon-docs CLI (per the original T8 plan: `claude-plugin-v0.2.0` vs `v0.4.1`).

### For future skill authoring in this plugin

- **Run cross-skill integration check (Paso 3 equivalent) before declaring any future skill batch done.** The Option A finding cost us a REFACTOR mid-T3. Cross-skill audit is the necessary complement to per-skill subagent TDD.
- **Normalize language in cross-skill templates.** Pick one (English for global accessibility, or Spanish for consistency with the user's primary language) and apply across all `--force` / Pattern 1 / 3-paths templates. Mixed is worse than either consistent choice.
- **Add `name:` field to the 5 invocable frontmatters.** Small change, spec compliance, no behavior change.
- **Keep the "named-and-shamed" rationalization-table technique.** It's the highest-ROI authoring tool we have for discipline-enforcing skills.

### For future skill authoring outside this plugin

- **The strict-TDD methodology for skills is real and works.** Pay the subagent cost upfront for skills that need to enforce discipline under pressure. Skip it for pure-reference skills (API docs, command references) where there's no rationalization to test against.
- **The "core principle in one sentence, then layered redundancy" structure compounds.** Subagents in verify cited different layers as what saved them. Don't compress to a single statement.
- **Empty-state minimalism is a real failure mode worth designing against.** Multiple T4 skills had to explicitly forbid padding the "nothing to do here" response. The pull to "earn the turn" is consistent across agents and consistent across skills — name it once, defend it everywhere.

## Open threads

- **Paso 5 (user manual validation) pending.** Equivalent to T3's Phase 5. Real test of whether the 5 skills hold up outside subagent-TDD environment.
- **Paso 6 (release decision) pending.** Version bump, marketplace description, CHANGELOG, tag.
- **Minor cleanups noted in Paso 3 deferrred here:** `name:` field on 5 invocables, language normalization in `--force` templates. Non-blocking; could ship as a 0.2.1 polish release or roll into 0.2.0 if Paso 5 surfaces other small issues.
- **No T5/T6/T7/T8 retro yet.** T5 (`claude-plugin/README.md`), T6 (cross-link from main README), T7 (manual validation — overlaps with Paso 5), T8 (release prep — overlaps with Paso 6) still pending. After Paso 6 ships 0.2.0, separate plan revision may be warranted to consolidate.
