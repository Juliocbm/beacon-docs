---
adr: 003
title: Core categories + opt-in add-ons model
status: accepted
date: 2026-05-22
supersedes: null
superseded-by: null
---

# ADR-003: Core categories + opt-in add-ons model

## Context

Beacon needs to work for wildly different project types: a small open-source library, a full-stack
SaaS, a backend API, a CLI tool, a mobile app, and a monorepo. These differ substantially in what
documentation categories make sense:

- A library never needs `operations/` (no deployment) or `business/` (no commercial strategy).
- A backend service rarely needs `business/` (no consumer-facing product decisions).
- A monorepo needs `modules/` (per-package scope), which is meaningless for a single-package library.

Three design options were considered:

1. **Fully prescriptive**: every project gets every category folder. Simple, but clutters small
   projects with empty folders they'll never use. Worse, it trains users to ignore folders, which
   undermines the convention's goal.
2. **Fully configurable**: users define their own category set from scratch. Maximum flexibility, but
   loses the "trail markers" guarantee — if every project invents its own structure, AI agents
   can't rely on predictable folder locations across projects.
3. **Fixed core + opt-in add-ons**: a set of categories that every project has unconditionally,
   plus a menu of add-ons that can be enabled per project type or manually.

(Spec §3, §5.3)

## Decision

Use the **fixed core + opt-in add-ons** model.

**Core categories** (always present, cannot be disabled):
`reference/`, `architecture/`, `adr/`, `plans/`, `backlog/`, `evaluations/`

These six exist in every Beacon project regardless of type. They represent the minimum documentation
structure that any software project benefits from: technical patterns, system structure, decision
records, active work, future items, and audit snapshots.

**Add-on categories** (opt-in, enabled via wizard or `beacon enable <addon>`):
`compliance/`, `business/`, `modules/`, `integrations/`, `operations/`, `roadmaps/`

Add-ons are only present when the project type warrants them. Each project type has a default add-on
selection (pre-selected in the wizard), but every default is deselectable and every non-default is
selectable. The `custom` project type starts with nothing pre-selected beyond the core.

The enabled category list lives in `docs/_meta/beacon.config.json` under the `categories` key and
is the authoritative list for all commands (`lint`, `sync`, `new`, `enable`, `disable`).

## Consequences

**Positive:**
- The core categories guarantee that AI agents can always find ADRs at `adr/`, plans at `plans/`,
  etc., across any Beacon project — regardless of project type or add-on selection.
- Add-ons prevent folder clutter for projects that don't need them.
- Project-type defaults speed up the wizard without being mandatory — granular customization
  is available on all project types.
- The decision table in generated AI rule files is dynamically built from enabled categories,
  so agents only see rows relevant to the current project (spec §7.0).

**Negative / Trade-offs:**
- The core/add-on boundary is an opinionated call. Teams that want different defaults must manually
  deselect core categories — except `_meta/`, which is mandatory and cannot be deselected.
- New add-ons added in future versions require a code change to register them (see the
  "Adding a category" reference pattern).
