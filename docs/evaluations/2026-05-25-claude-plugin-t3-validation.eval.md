---
title: T3 (beacon-workflow) — Phase 5 manual validation in Claude Code v2.1.150
date: 2026-05-25
scope: claude-plugin/skills/beacon-workflow + Option A REFACTOR + 5 pressure scenarios in real Claude Code sessions
---

# T3 (beacon-workflow) — Phase 5 manual validation

## Summary

T3 of the [claude-code-plugin-mvp plan](../plans/claude-code-plugin-mvp.plan.md) was completed on 2026-05-24 via strict TDD (12 subagent dispatches across 4 phases: RED → GREEN → VERIFY → REFACTOR). Phase 5 (manual validation in real Claude Code sessions) was executed on 2026-05-25 across 5 distinct pressure scenarios, mirroring the subagent-based scenarios from the earlier TDD phases.

**Result: all 5 tests PASSED.** One was PARTIAL on the first run, surfacing an architectural collision that required a small REFACTOR commit (Option A — `disable-model-invocation: true` on the 5 placeholder invocable skills). After that REFACTOR + plugin version bump 0.1.0 → 0.1.1, the re-test of the partial scenario passed cleanly along with the remaining 3.

The skill is empirically validated against real Claude Code v2.1.150 behavior across all 5 patterns it was designed to enforce (discovery-first, suffix-collision question, mid-flow capture, post-release retrospective, advisory-mode recommendation).

## Findings

### Per-test results

| # | Pattern tested | Scenario | First run | After Option A | Bonus quality observed |
|---|---|---|---|---|---|
| 1 | Discovery-first + supersede + lifecycle | New ADR conflicts with existing accepted ADR | ✅ PASS | — | Ran `beacon lint` as self-check without being told; cited convention rule 5 explicitly |
| 2 | Pattern 1 (suffix collision → ask one question) | User asks for `docs/plans/X.md` direct write | ⚠️ PARTIAL (placeholder `beacon-new` preempted workflow → silent rename) | ✅ PASS | Multiple-choice format with explicit Recommended tag; cited rule 2/8 of CLAUDE.md |
| 3 | Pattern 2 (deferral → capture + continue) | Mid-flow "lo dejamos para después" | ✅ PASS | — | Quoted skill rationalization verbatim ("won't leave in chat memory"); referenced existing refactor-auth.plan.md across sessions |
| 4 | Pattern 3 (post-release → eval before "qué sigue") | "Listo, hice release v1.0. ¿Qué sigue?" | ✅ PASS | — | Used `‹…›` placeholders instead of fabricating "What worked / hurt"; surfaced plan-state ambiguity as a structured blocker question |
| 5 | Pattern 4 (no-Beacon → concrete recommendation) | Fresh project with 30 mixed .md files | ✅ PASS | — | Offered "structured-manual mode" (REFACTOR addition from Phase 4) as explicit option 2 — exactly as designed |

### Option A REFACTOR finding (critical)

Test 2's first run revealed a collision the subagent-based TDD had not caught: the **placeholder invocable skills from T2** (with broad descriptions like *"Create any doc type in a Beacon-managed project"*) auto-loaded BEFORE `beacon-workflow` on doc-creation prompts. Result: `beacon-new` placeholder ran `beacon new plan refactor-auth` directly, silently renaming the user's explicit `refactor-auth.md` to `refactor-auth.plan.md` — bypassing Pattern 1's "ask one question" rule entirely.

**Fix:** added `disable-model-invocation: true` to frontmatter of all 5 invocable skill SKILL.md files. Descriptions narrowed to declare them as manual slash commands only. After the fix:
- `beacon-workflow` is the ONLY auto-invoked skill in the plugin
- `/beacon:beacon-*` only fire when user explicitly types the slash command
- Re-test of Test 2 passed cleanly (Pattern 1's "ask one question" fired correctly)

**Why subagent TDD didn't catch this:** Phase 3 verification tested `beacon-workflow` in isolation (subagent prompt had only the workflow body in context, not other plugin skills). Real Claude Code loads ALL plugin skills simultaneously, so descriptions compete. **Lesson for T4: when writing the real bodies of the 5 invocable skills, validate that they still don't preempt workflow — and run a 6th pressure test that confirms workflow handles auto-cases while invocable skills handle explicit cases.**

### Bonus quality observations (not anticipated)

Several behaviors emerged that weren't explicitly designed into the skill but came naturally from its structure:

1. **Cross-session document memory.** In Test 3, Claude discovered the `refactor-auth.plan.md` created in Test 2 (different session) and referenced it correctly: *"este /login es el primer ítem del plan activo refactor-auth.plan.md."* The persistence rule + discovery-first pattern produced cross-session continuity without explicit programming.

2. **Honest about uncertainty.** In Test 4, Claude's eval draft used `‹…›` placeholders for "What worked / What hurt" instead of fabricating content from limited session context. Marked the eval explicitly as `> **Draft — needs your input.**` — exactly the behavior a senior engineer would produce. This wasn't in the skill body; it emerged from Claude's training + the skill's "draft inline; don't ask permission" framing combining well.

3. **Structured ambiguity resolution.** In Test 4, when Claude detected the unresolved plan (`refactor-auth.plan.md` still active despite "v1.0 shipped"), it surfaced the contradiction as a 3-option multiple-choice question rather than guessing OR refusing to act. This is what differentiates a bulletproof skill from a regular one: don't be dogmatic OR passive, discriminate correctly.

4. **Self-check rule firing without prompts.** In Tests 1, 2, and 4, Claude ran `beacon lint` after creating/editing docs without being explicitly told to. The skill's "Self-checks" section (added in REFACTOR Phase 4 of T3 authoring) is being applied in practice, not just read.

5. **Skill composition with `superpowers:brainstorming`.** Test 3 setup loaded brainstorming naturally when the prompt was implementation-flow ("vamos a implementar un endpoint"). beacon-workflow correctly did NOT preempt — it stayed quiet because the prompt wasn't documentation-relevant. Later, when the deferral phrase fired Pattern 2, workflow loaded cleanly. **No conflict between plugins.**

### Strict-TDD methodology validation

T3 used 12 subagent dispatches (5 baseline + 5 verify + 2 REFACTOR re-verify). Subagent testing surfaced 3 gaps that would otherwise have shipped:
- CLI-fail fallback (Pattern 5 — added in REFACTOR)
- Eval skeleton template (added to Pattern 3)
- Structured-manual mode (added to Pattern 4)

Without strict TDD, those 3 gaps would have been discovered in production (Phase 5 manual validation) or worse, by end users in real projects. The subagent TDD caught them in ~30 minutes of dispatch + analysis vs hours/days of cleanup if they had shipped.

**However**, subagent TDD has a known limitation: it tests skills in isolation, not in the full plugin context. The Option A collision found in Phase 5 Test 2 is the proof. **T4 must include a cross-skill integration test as part of its TDD methodology**, not just per-skill verification.

## Recommendations

### For T4 (next task)

1. **Apply same strict TDD discipline per skill.** No shortcuts. Each of the 5 invocable skills needs RED → GREEN → VERIFY → REFACTOR cycle. Quality bar non-negotiable.

2. **Order skills from simplest/lowest-risk to most complex/destructive:** beacon-explain → beacon-doctor → beacon-init → beacon-new → beacon-archive. Lessons compound.

3. **Add a 6th cross-skill integration test per skill.** After each skill's body is written, run one scenario that tests:
   - Does this skill still NOT preempt workflow on auto-cases?
   - Does workflow correctly hand off to this skill when user types `/beacon:beacon-X`?
   - Are there other invocable skills that might compete for this prompt?

4. **Preserve `disable-model-invocation: true`** on all 5 skills even after their bodies are real. Don't be tempted to remove it "because now the body is good" — Option A is the correct architecture, validated by Phase 5.

5. **For destructive operations (beacon-archive especially):** add explicit safety checks in the skill body. Never `--force` automatically. Always require user confirmation when CLI surfaces a warning. Mirror the safety language used in the convention's lifecycle rules.

### For the project broadly

1. **The plugin works.** All 5 patterns of beacon-workflow are empirically validated. T3 is closable.

2. **The Option A architecture is the right one.** beacon-workflow as sole auto-invoked skill + 5 invocable slash commands = clean separation of concerns. Don't second-guess this in future iterations unless a real failure mode appears.

3. **Phase 5 took ~2 hours of focused testing.** Future plugin releases should budget similar time for manual validation, especially when adding new skills or changing skill descriptions. Subagent TDD reduces but does not eliminate the need for end-to-end testing.

4. **Consider documenting the cross-skill integration test pattern as a beacon-plugin authoring convention.** This eval surfaces a gap in the writing-skills meta-skill: it teaches per-skill TDD but doesn't explicitly cover cross-skill collision testing. Worth contributing back as a pattern doc if the meta-skill ecosystem accepts external contributions.

### For future Phase 5-like validations

1. **Take screenshots / capture verbatim output for each test.** Hard to remember exact wording after the fact. The Phase 5 reports from the test session were essential for writing this eval.

2. **Test in a fresh session per test scenario.** Mixing scenarios in one session contaminates context — Claude might "remember" patterns from earlier tests and apply them incorrectly. Fresh sessions = true skill behavior.

3. **The cleanup discipline matters.** Sandbox approach (separate `C:\temp\<test-name>\` directories with `beacon init`) was essential — testing in the actual beacon-docs repo would have polluted the dogfooded docs tree with test artifacts. Future validation work should always use sandboxes for skill testing.
