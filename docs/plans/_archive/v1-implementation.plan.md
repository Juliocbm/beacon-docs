---
title: V1 Implementation — Beacon
status: active
created: 2026-05-22
---

# V1 Implementation — Beacon

> Full implementation plan: `docs/superpowers/plans/2026-05-22-beacon-v1.md` in the source repo.
> This is a summary of completed work. The plan has been fully executed.

## Goal

Ship Beacon V1 — a CLI and opinionated documentation convention for AI-collaborative codebases —
published to npm as `beacon-docs` and tagged `v0.1.0`.

## Sprint summaries

**Sprint W1 — Foundation (Project setup, init wizard, scaffold):**
Initialized the TypeScript ESM project with `tsup` build, `vitest` testing, and `cac` CLI
framework. Implemented `src/core/project-types.ts` (7 project types, 6 core categories, 6 add-on
categories, default matrix) and `src/core/categories.ts` (suffix/location/archivable metadata).
Built the `beacon init` wizard using `@clack/prompts` with project-type detection, add-on
selection, agent selection, and scaffold generation. The scaffold creates all enabled folders with
README stubs and writes `beacon.config.json` and the `convention.md` placeholder.

**Sprint W2 — AI rule generation (beacon sync):**
Implemented the four vendor generators: `claude.ts`, `agents.ts`, `gemini.ts`, and `cursor.ts`
(producing both `.cursorrules` and `.cursor/rules/beacon.mdc`). Built the shared `ai-rules.ts`
helpers (`buildUniversalRules`, `buildProjectSpecificRules`, `buildDecisionTable`) that implement
the two-layer rule model (ADR-005). Implemented `beacon sync` command and round-trip validation
tests confirming that synced files match re-rendered output.

**Sprint W3 — Document lifecycle (beacon new, beacon archive):**
Implemented `beacon new <type> <slug>` with EJS frontmatter templates for all 11 document types,
auto-numbering for ADRs (reads existing `ADR-NNN-*.md` files and increments), and `YYYY-MM-DD-`
date prefixing for evals. Implemented `beacon archive <type> <slug>` with TODO completion
validation and README reference updates. Also implemented `beacon enable/disable <addon>`.

**Sprint W4 — Linter, CI, publish:**
Implemented `beacon lint` with 11 rules (5 errors, 4 warnings, 2 suggestions), `--strict` and
`--json` flags, and exit code semantics. Added CI example configuration. Ran full end-to-end
integration tests across all commands. Published to npm as `beacon-docs@0.1.0` tagged `v0.1.0`.

## TODOs

- [x] W1: Initialize TypeScript + tsup + vitest project
- [x] W1: Implement `src/core/project-types.ts`
- [x] W1: Implement `src/core/categories.ts`
- [x] W1: Implement `beacon init` wizard
- [x] W1: Implement scaffold generator
- [x] W2: Implement vendor generators (claude, agents, gemini, cursor)
- [x] W2: Implement `beacon sync` command
- [x] W2: Add round-trip validation tests
- [x] W3: Implement `beacon new` with EJS templates
- [x] W3: Implement ADR auto-numbering
- [x] W3: Implement `beacon archive`
- [x] W3: Implement `beacon enable` / `beacon disable`
- [x] W4: Implement `beacon lint` (11 rules)
- [x] W4: Add `--strict` and `--json` flags
- [x] W4: Integration tests for all commands
- [x] W4: npm publish as `beacon-docs@0.1.0`

## Notes

- Final test count: **147 passing** across unit and integration tests.
- Total commits: **38**.
- Git tag: **v0.1.0**.
