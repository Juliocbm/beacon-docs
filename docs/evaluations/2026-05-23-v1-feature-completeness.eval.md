---
title: V1 Feature Completeness Snapshot
date: 2026-05-23
scope: beacon-docs V1 / full system
---

# V1 Feature Completeness Snapshot

## Summary

This evaluation captures the state of Beacon at the `v0.1.0` tag (git tag `v0.1.0`, 38 commits).
The V1 implementation plan (`docs/plans/_archive/v1-implementation.plan.md`) is fully executed.

| Metric | Value |
|---|---|
| Test suite | **147 passing**, 0 failing |
| Sprints completed | **4 of 4** (W1–W4) |
| Commands shipped | **7** (`init`, `new`, `archive`, `lint`, `sync`, `enable`, `disable`) |
| Lint rules | **11** (5 error, 4 warning, 2 suggestion) |
| AI vendor generators | **4** (Claude, Codex/AGENTS, Gemini, Cursor × 2 formats) |
| npm package | `beacon-docs@0.1.0` |

## Findings

Evaluated against each goal stated in spec §3 ("Goals V1"):

| Goal | Status | Notes |
|---|---|---|
| Zero-config bootstrap of documentation structure | ✅ | `beacon init` produces a complete, lint-clean tree. Non-interactive flags (`--yes --type=...`) work for CI. |
| AI rule file generation for Claude, Cursor, Codex, Gemini | ✅ | All 4 vendors + both Cursor formats (`.cursorrules` + `.cursor/rules/beacon.mdc`) generate correctly. |
| Linter validates structure, naming, AI rule sync — CI-friendly | ✅ | 11 rules, exit code semantics correct, `--json` output for machine consumption. |
| Helper commands for creating and archiving documents | ✅ | `beacon new` supports all 11 doc types; `beacon archive` validates TODOs and updates README refs. |
| Interactive wizard for opt-in customization | ✅ | `@clack/prompts` wizard with project-type detection, add-on selection, agent selection. |

Additional checks against spec §5 architecture decisions:

| Convention | Status | Notes |
|---|---|---|
| Single source of truth (`convention.md` → generated files) | ✅ | `ai-files-sync` lint rule enforces sync in CI. |
| Suffix-based naming enforced by linter | ✅ | `suffix-location` rule catches wrong-folder docs. |
| Status via folder (never filename) | ✅ | `archive` command is the only path to `_archive/`; no status suffix in filenames. |
| Two-layer AI rule model (universal + project-specific) | ✅ | `buildUniversalRules` + `buildProjectSpecificRules` in `ai-rules.ts`. |
| Core + add-on category model | ✅ | 6 core, 6 add-on, correct DEFAULTS_BY_TYPE matrix for all 7 project types. |
| ADR auto-numbering | ✅ | `beacon new adr` reads existing ADR files and assigns next sequential number. |
| Eval date-prefix enforcement | ✅ | `eval-date-prefix` lint rule is an error (not a warning). |

## Recommendations

Three non-blocking improvements were detected during code review of the V1 implementation.
None are correctness bugs; all are polish/robustness items for a future patch release.

**1. Description duplication in frontmatter templates:**
Several EJS frontmatter templates (e.g., `plan.md.ejs`, `architecture.md.ejs`) include a
`<!-- e.g., ... -->` comment placeholder in fields like `scope`. These comments are written
to the output file and are not stripped after the user fills in the value — they remain as
noise. A future version should use EJS conditionals to omit the placeholder comment once the
field has a real value, or simply remove the comment from the template.

**2. File handling asymmetry in `beacon archive`:**
`beacon archive` correctly updates README references when moving a plan to `_archive/`. However,
it does not update references in other docs (e.g., an architecture doc that links to the plan
by relative path). This is an edge case but could produce broken links in cross-referenced
documentation. A future version should scan all Markdown files in the `docs/` tree for references
to the archived file and update them.

**3. Falsy guard on `buildProjectSpecificRules` empty check:**
In `src/generators/ai-rules.ts`, the check `if (!any)` after the loop correctly detects that
no project-specific rules were added. However, if a category's rule string in
`PROJECT_SPECIFIC_RULES` is an empty string `""` (a possible future edge case with a misconfigured
entry), `any` would remain `false` even though the category was iterated. The check should be
`if (lines.length <= 2)` (accounting for the header and empty line) instead of tracking a
boolean flag.
