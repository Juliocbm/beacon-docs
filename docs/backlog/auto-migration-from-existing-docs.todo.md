---
title: Auto-migration from existing documentation structures
added: 2026-05-22
---

# Auto-migration from existing documentation structures

## Why

Many projects that would benefit from Beacon already have an existing documentation structure —
whether it's a flat `docs/` folder full of randomly named Markdown files, a Notion export with
date-prefixed pages, a Diátaxis-organized folder (`tutorials/`, `how-tos/`, `reference/`,
`explanation/`), or just a pile of `PLAN_v2_FINAL.md` files in the repo root. Running
`beacon init` on such a project creates the correct folder structure but leaves all the existing
documents untouched — the team is left to manually reclassify and rename every doc.

An auto-migration command would analyze the existing content (using filename patterns, frontmatter,
heading heuristics, and optionally an LLM classification pass) and propose moves to the correct
Beacon locations.

(Spec §3, Non-goals V1; Spec §10)

## Acceptance criteria

- [ ] `beacon migrate --dry-run` scans the existing `docs/` tree and proposes a mapping: each
  existing file → suggested Beacon category, target filename (with correct suffix and kebab-case).
- [ ] Proposals are printed as a table with confidence level (high/medium/low) per file.
- [ ] `beacon migrate` (without `--dry-run`) executes the moves that have high confidence and
  prompts for confirmation on medium/low confidence items.
- [ ] Files that cannot be classified are moved to a `docs/_unmapped/` holding area with a note,
  rather than left in place.
- [ ] After migration, `beacon lint` passes with no new errors beyond pre-existing issues.
- [ ] The command handles Diátaxis structure (`tutorials/`, `how-tos/`, `explanation/`) as a
  known migration source with explicit mapping rules.
