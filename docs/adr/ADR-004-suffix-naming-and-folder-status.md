---
adr: 004
title: Suffix encodes type; folder encodes status
status: accepted
date: 2026-05-22
supersedes: null
superseded-by: null
---

# ADR-004: Suffix encodes type; folder encodes status

## Context

Documentation files need to carry two orthogonal pieces of information: **what type of document
is this** (pattern, plan, ADR, evaluation, etc.) and **what is its lifecycle status** (active,
archived, superseded).

Several common approaches exist:

- **Prefix or suffix in the filename for status**: e.g., `billing_DONE.plan.md`,
  `billing_v2_FINAL.plan.md`, `_archived_billing.plan.md`. This is the most common ad-hoc approach
  but leads to inconsistency and makes status grep-unfriendly.
- **Frontmatter only**: status lives in YAML frontmatter (`status: archived`). Invisible in file
  system listings; requires opening the file to know if it's still active.
- **Folder for status, suffix for type**: active plans in `plans/`, archived plans in
  `plans/_archive/`. The file extension encodes the document type; its location encodes lifecycle.

(Spec §5.4, §5.5)

## Decision

**Filename suffix encodes document type. Folder path encodes lifecycle status. Never both in the
filename.**

The suffix convention:

| Suffix | Document type |
|---|---|
| `.pattern.md` | Replicable technical pattern |
| `.architecture.md` | Architecture overview |
| `.guide.md` | Operational guide / integration setup |
| `.plan.md` | Active plan with TODOs |
| `.roadmap.md` | Multi-sprint roadmap |
| `.todo.md` | Backlog item |
| `.eval.md` | Audit / evaluation snapshot |
| `.business.md` | Business / product / strategy document |
| `.module.md` | Functional module description |
| `ADR-NNN-*.md` | Architecture Decision Record (auto-numbered) |

Status is encoded via folder position only:
- Active plan: `plans/billing-integration.plan.md`
- Archived plan: `plans/_archive/billing-integration.plan.md`

The `beacon lint` `suffix-location` rule enforces that each suffix lives in the correct category
folder. The `kebab-case` rule enforces that all filenames use kebab-case with no status markers.
The `beacon archive` command is the only supported way to move a plan to `_archive/`.

One special case: `.eval.md` files **require** a `YYYY-MM-DD-` date prefix (e.g.,
`2026-05-22-frontend-audit.eval.md`). Evals are temporal snapshots — the date is part of their
identity and makes chronological ordering work naturally in file system listings.

## Consequences

**Positive:**
- File system listings immediately reveal document types without opening files.
- Status (active vs. archived) is visible from the directory path, not hidden in metadata.
- `beacon lint` can mechanically verify both conventions without parsing file content.
- Eliminates the `*_DONE.md`, `*_v2_FINAL.md`, `*_ARCHIVED.md` filename pollution that plagues
  unmanaged doc folders.
- AI agents can locate documents by type via glob patterns (`docs/plans/*.plan.md`,
  `docs/adr/ADR-*.md`) without understanding frontmatter.

**Negative / Trade-offs:**
- Contributes to longer filenames (e.g., `billing-integration.plan.md` vs `billing-integration.md`).
  Acceptable trade-off given the readability and machine-parsability benefits.
- Moving a file to `_archive/` changes its path, which can break external links. `beacon archive`
  updates internal README references, but external links are the team's responsibility.
