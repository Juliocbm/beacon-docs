---
adr: 008
title: cli-polish-design
status: accepted
date: 2026-05-24
supersedes: null
superseded-by: null
---

# ADR-008: CLI polish — minimal logo, ANSI colors, hierarchical output

## Context

v0.1.0/0.1.1 ship a fully functional CLI with `@clack/prompts` powering the
init wizard, but other commands (`new`, `sync`, `lint`, `archive`,
`enable/disable`) output plain text with no color, no hierarchy, and no
visual differentiation. The lint output in particular becomes unreadable
when there are many findings — errors, warnings, and suggestions all blend
into the same monochrome wall.

Modern CLI dev tools (Bun, Vite, Astro, pnpm, Cargo) demonstrate that
**restrained visual polish** materially improves UX without bloating the
binary or adding heavy dependencies:

- Color-coded severity (red errors / yellow warnings / green success)
- Indented hierarchies for nested information
- Glyphs (✔ ✗ ⚠ ◆) instead of word labels
- Spinners during long operations
- A minimal product header (NOT a 10-line ASCII logo)

The CUBA-CLI-style "big ASCII art on every command" pattern is dated and
distracting for tools used frequently. Beacon commands like `new` and
`lint` will be called many times per day; visual noise compounds.

## Decision

Ship v0.1.2 as a **polish-only** release (no new features, no API changes)
that adds:

1. **Minimal ASCII logo** (3-4 lines max) shown ONLY on `beacon` (no args)
   and `beacon --help`. NOT shown on every command invocation.
2. **ANSI colors via `picocolors`** — chosen for being the smallest, zero-
   dependency color library (~3KB). Tools downstream tested support: Vite,
   Vitest, Astro, esbuild, Rollup all use it.
3. **Hierarchical output** for lint findings — sub-items indented with
   `└─` instead of inline rule labels.
4. **Spinners** via `@clack/prompts`' existing `spinner()` API (already a
   dependency). Used during `sync` (regenerating 5 files) and at the end
   of `init` (during the auto-sync step).
5. **Colored glyphs** — `✔` green, `✗` red, `⚠` yellow, `→` cyan, info
   text dimmed.
6. **Help text reorganization** — `--help` groups commands by category
   (Setup / Lifecycle / Validation) instead of one flat list.

NO breaking changes. All tests must continue passing (after stripping ANSI
codes in assertions). NO config flags for disabling colors — `picocolors`
auto-detects TTY and respects `NO_COLOR` and `FORCE_COLOR` env vars by
default, which is enough.

## Consequences

**Positive:**
- First impression of the CLI is dramatically better. Lint output becomes
  scannable. `beacon` (no args) feels intentional vs the current cac default.
- Aligns Beacon with the visual language of modern dev tools that users
  already trust (Bun, Astro, Vite). Reinforces "this is a real project".
- Spinners eliminate the perception of hangs during `sync` (~200ms feels
  longer when there's no feedback).
- Hierarchical lint output reduces cognitive load when scanning 20+ findings.

**Negative:**
- Adds 1 runtime dependency (`picocolors`, ~3KB). Marginal cost.
- Tests need a `stripAnsi` helper — adds ~10 lines of test infrastructure.
- Color output may look weird in dev environments that misreport TTY
  capabilities (rare; `picocolors`'s auto-detect handles 99% of cases).

## Alternatives considered

1. **`chalk`** — most popular color library but ~30KB+ with deps. Rejected
   for bundle size. `picocolors` has identical API for our usage.
2. **`kleur`** — slightly larger than `picocolors`, similar API. Tie-broken
   on `picocolors` being more actively used in the modern toolchain.
3. **No dependency, hand-rolled ANSI** — would work for our minimal needs
   (~10 colors, ~3 styles) but `picocolors` already handles
   `NO_COLOR`/`FORCE_COLOR`/TTY detection correctly. Reimplementing those
   3 checks isn't worth the dep avoidance.
4. **Big ASCII art on every command (CUBA-CLI style)** — rejected. Adds
   visual noise to frequently-called commands. Doesn't match modern dev
   tool conventions.
5. **Defer polish to v0.2 (bundle with `beacon doctor`)** — rejected.
   Polish and doctor are unrelated concerns; bundling them would couple
   release notes and increase risk of regression across both.

## Color palette

| Element | picocolors function | Notes |
|---|---|---|
| Errors | `red()` | Lint errors, command failures |
| Warnings | `yellow()` | Lint warnings, TODO-not-checked archive warning |
| Suggestions / info | `cyan()` | Lint suggestions, info messages |
| Success | `green()` | ✔ glyphs, "Created", "Archived", etc. |
| Muted / hints | `dim()` | File paths, rule names, timestamps |
| Accents | `bold()` | Command names in --help, section headers |
| Logo | `cyan(bold())` | The ASCII logo gradient effect |

## Output format examples

### Current `beacon lint` output (v0.1.1)

```
Errors (3)
  [suffix-location] docs/plans/foo.pattern.md — File with suffix ".pattern.md" must live in docs/reference/ (found in docs/plans/).
  [kebab-case] docs/adr/MyADR.md — Filename "MyADR.md" must be kebab-case.
  [readme-present] — docs/operations/README.md is required.

Warnings (1)
  [folder-size] — docs/reference/ has 35 files (>30). Consider organizing into subfolders.

Suggestions (0)
```

### Polished `beacon lint` output (v0.1.2 target)

```
✗ Errors (3)
  ✗ docs/plans/foo.pattern.md
    └─ suffix-location: must live in docs/reference/
  ✗ docs/adr/MyADR.md
    └─ kebab-case: filename must be lowercase-hyphen-separated
  ✗ docs/operations/
    └─ readme-present: README.md required

⚠ Warnings (1)
  ⚠ docs/reference/
    └─ folder-size: has 35 files (>30); consider subfolders

  Suggestions (0)
  All clear.
```

(Glyphs/severity colored per the palette above; file paths in dim;
rule names in cyan.)

### `beacon` (no args, v0.1.2 target)

```
   ╱╲    beacon
  ╱  ╲   Trail markers for AI-collaborative codebases.
 ╱────╲
╱──────╲ v0.1.2  ·  https://beacon-docs.com

Usage:
  beacon <command> [options]

Setup:
  init                  Initialize Beacon docs convention in this project

Lifecycle:
  new <type> <slug>     Create a new doc with correct location and naming
  archive <type> <slug> Move a completed plan or roadmap to _archive/
  enable <addon>        Enable an add-on category
  disable <addon>       Disable an add-on category

Validation:
  sync                  Regenerate AI rule files
  lint                  Validate the docs tree

Run `beacon <command> --help` for command-specific options.
```

(Logo lines in cyan-bold gradient; section headers `Setup:` `Lifecycle:`
`Validation:` in bold; command names in cyan; descriptions in regular.)

See [docs/plans/v0-1-2-polish.plan.md](../plans/v0-1-2-polish.plan.md) for
the implementation breakdown.
