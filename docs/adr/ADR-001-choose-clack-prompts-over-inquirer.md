---
adr: 001
title: Choose @clack/prompts over Inquirer for interactive wizard
status: accepted
date: 2026-05-22
supersedes: null
superseded-by: null
---

# ADR-001: Choose @clack/prompts over Inquirer for interactive wizard

## Context

`beacon init` is the primary user-facing command. It presents a multi-step wizard that asks the user
to confirm project type, select add-on categories, pick AI agents, and optionally seed reference
patterns. The quality of this UX is critical: a clunky or visually dated prompt experience will
undermine first impressions of a tool positioned as modern and opinionated.

The Node.js ecosystem has three main options for interactive CLI prompts:

- **Inquirer.js**: the long-standing standard, rich feature set, but its default visual style is
  plain and dated (checkbox lists look like 1990s terminal UIs). It carries significant legacy
  surface area and is harder to compose into a wizard flow.
- **Prompts**: lightweight alternative to Inquirer, similar UX aesthetics, less maintenance activity
  recently.
- **@clack/prompts**: a newer library built specifically for beautiful multi-step CLI wizard flows.
  Used in production by Astro's `create-astro`, Nuxt's `nuxi`, and `create-svelte`. Its spinner,
  group, and multi-select primitives map directly onto what Beacon needs.

## Decision

Use **@clack/prompts** as the sole interactive prompt library for `beacon init` (and any future
wizard-style commands).

The key reasons:

1. **Ecosystem signal**: Adoption by Astro, Nuxt, and create-svelte means the library is
   battle-tested in exactly the kind of "scaffold a new project" wizard flow that `beacon init`
   implements. These are high-traffic tools; bugs in the prompt UX surface quickly.
2. **Visual quality out of the box**: @clack/prompts renders boxes, spinners, and group headers
   that look polished without custom styling. For a convention tool that will be evaluated in the
   first 60 seconds of `npx beacon-docs init`, this matters.
3. **Wizard-first API**: `group()`, `multiselect()`, `select()`, `confirm()`, and `spinner()` are
   exactly the primitives needed. Inquirer requires more wiring to achieve the same flow.
4. **Minimal footprint**: @clack/prompts is smaller and has fewer transitive dependencies than
   Inquirer, consistent with Beacon's philosophy of no over-engineering.

## Consequences

**Positive:**
- The `beacon init` wizard has a modern, high-quality UX that reflects positively on the project.
- The API surface is small and readable — the init command source is easier to maintain.
- Beacon aligns with tooling conventions used by the major framework scaffolders.

**Negative / Trade-offs:**
- @clack/prompts is less mature than Inquirer. If the project becomes abandoned or has breaking
  changes, migration would be needed. Mitigated by the framework adoption signal.
- Non-interactive mode (`--yes`, `--type=...` flags) must be implemented separately since
  @clack/prompts is interactive-only. Beacon handles this in `commands/init.ts` by detecting
  CLI flags before entering the prompt flow.
