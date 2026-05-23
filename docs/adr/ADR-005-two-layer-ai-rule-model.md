---
adr: 005
title: Two-layer AI rule model (universal + project-specific)
status: accepted
date: 2026-05-22
supersedes: null
superseded-by: null
---

# ADR-005: Two-layer AI rule model (universal + project-specific)

## Context

Every generated AI rule file (CLAUDE.md, AGENTS.md, GEMINI.md, .cursorrules) needs to serve
two different audiences simultaneously:

1. **The convention itself**: rules that apply to any Beacon-using project, regardless of type
   or enabled add-ons. These should be identical across all projects so that AI agents familiar
   with Beacon in one codebase can apply the same mental model to another.
2. **The specific project**: rules that only make sense when a given add-on is enabled. Showing
   a `compliance/` rule to a project that has compliance disabled adds noise and confusion. Worse,
   it may mislead the AI agent into expecting a folder that doesn't exist.

Two degenerate alternatives were considered:

- **Monolithic per-project**: each project writes its AI rule files from scratch, with no shared
  base. Maximum flexibility, but no cross-project predictability; defeats the "trail markers"
  purpose.
- **Fully generated from config**: all content derived from `beacon.config.json` with no
  human-authored layer. No per-project customization possible (see ADR-002 for why this was
  rejected).

(Spec §7.0)

## Decision

Structure every generated AI rule file with exactly two layers:

**Layer 1 — Universal rules** (identical in every Beacon project):
Nine rules that encode the core Beacon invariants: one doc = one category, status via folder,
kebab-case naming, README in every category, ADRs are append-only, evals are immutable snapshots,
plans archive to `_archive/`, generated files must stay in sync, and no out-of-convention folders.
These are hardcoded in `src/generators/ai-rules.ts → buildUniversalRules()` and never vary.

**Layer 2 — Project-specific rules** (only categories enabled in `beacon.config.json`):
One rule entry per enabled add-on category, describing where content for that category belongs and
what stays out. Built dynamically in `buildProjectSpecificRules()` from the `categories` array in
config. A library project with no add-ons gets a minimal file; a web-app with all add-ons enabled
gets a complete decision table.

The **decision table** ("Where does X go?") is also dynamically generated — it only contains rows
for enabled categories. This is the most-used reference: AI agents consult it when deciding where
to create a new document.

The size of the generated file naturally scales with the project's complexity:
- A `library` project: ~30 lines (universal rules + empty project-specific section + 6 table rows).
- A `web-app` with all add-ons: ~70 lines.

## Consequences

**Positive:**
- Universal rules are guaranteed to be identical across all Beacon projects — AI agents transfer
  knowledge between codebases without re-learning the convention.
- Project-specific rules and the decision table never contain irrelevant rows, keeping the AI
  agent's context free of noise.
- Adding a new rule to the universal layer propagates to all projects on the next `beacon sync`.
- Adding a new add-on category only requires adding an entry to `PROJECT_SPECIFIC_RULES` and
  `DECISION_ROWS` in `ai-rules.ts` (see the "Adding a category" reference pattern).

**Negative / Trade-offs:**
- The universal rules are hardcoded — changing them requires a Beacon release and users running
  `beacon sync` again. No mechanism for per-project override of universal rules (by design: they
  are invariants, not suggestions).
- Projects with many add-ons produce longer AI rule files. At the current maximum (~70 lines for
  a full web-app), this is well within AI agent context window limits.
