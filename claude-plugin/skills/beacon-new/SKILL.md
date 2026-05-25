---
description: Manual slash command (invoke explicitly as /beacon:beacon-new <description>). Translates a natural-language description into a beacon new <type> <slug> invocation. For auto-detected doc creation triggers, beacon-workflow handles them instead.
disable-model-invocation: true
allowed-tools:
  - Bash
arguments:
  - description
---

# /beacon:beacon-new <description>

> **T4 implementation pending.** Final logic owned by T4 of the [claude-code-plugin-mvp plan](https://github.com/Juliocbm/beacon-docs/blob/main/docs/plans/claude-code-plugin-mvp.plan.md).

## What this skill does (target behavior)

User input arrives as `$ARGUMENTS` (free-form natural language).

1. Parse `$ARGUMENTS` to identify the intended doc type from the 11 supported types: plan, adr, pattern, architecture, module, guide, roadmap, todo, eval, compliance, business.
2. Infer a kebab-case slug from the description (e.g., "refactor auth" → `refactor-auth`).
3. For `guide` type, prompt for the category (integrations | operations) since it's required.
4. Execute `bash: beacon new <type> <slug>` and confirm the created file path.
5. Read the new file and offer to draft initial content based on the description.

## Examples (target)

| User says | Skill runs |
|---|---|
| `/beacon:beacon-new plan to refactor auth` | `beacon new plan refactor-auth` |
| `/beacon:beacon-new ADR for event bus decision` | `beacon new adr event-bus-decision` |
| `/beacon:beacon-new pattern for multi-tenancy` | `beacon new pattern multi-tenancy` |
| `/beacon:beacon-new frontend audit eval` | `beacon new eval frontend-audit` |

(Full parsing rules, edge cases, and frontmatter pre-filling logic come in T4.)
