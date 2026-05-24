# beacon-docs

## 0.4.0

### Minor Changes

- **Plugin system — `beacon doctor` and `beacon lint` are now extensible.**

  Third-party plugins can add custom doctor checks and lint rules without forking. Configure them in `docs/_meta/beacon.config.json`:

  ```json
  {
    "plugins": [
      "beacon-plugin-compliance", // npm package
      "./scripts/internal-checks.mjs" // relative path
    ]
  }
  ```

  A plugin is a JS module exporting a `BeaconPlugin` object with optional `checks[]`, `rules[]`, and `explain` entries that surface in `beacon doctor --explain` / `beacon lint --explain` alongside built-ins. Plugin-load failures warn to stderr but never crash the run.

  `beacon about` now lists loaded plugins with their version and contributed-item counts.

  Working reference plugin shipped at [`examples/plugin-example/`](https://github.com/Juliocbm/beacon-docs/tree/main/examples/plugin-example). Full authoring guide in [`docs/reference/writing-a-plugin.pattern.md`](https://github.com/Juliocbm/beacon-docs/blob/main/docs/reference/writing-a-plugin.pattern.md). Design rationale in [ADR-011](https://github.com/Juliocbm/beacon-docs/blob/main/docs/adr/ADR-011-plugin-system-design.md).

  v0.4 scope is **checks + rules only** by design. Custom categories and AI agents deferred to v0.5+ pending real plugin authoring experience.

  Tests: +31 (271 → 302 total).

## 0.3.1

### Patch Changes

- Three additions to the doctor + diagnostics surface:

  - **New doctor check: `orphan-readmes`** (balance area). Flags add-on category folders that were enabled with `beacon enable <addon>` but never received any actual docs — only the auto-generated README still sits there ≥ 30 days later. Core categories (reference/adr/plans/...) are intentionally exempt.
  - **Configurable doctor thresholds.** Every threshold (`stalePlanDays`, `proposedAdrDays`, `oldEvalMonths`, `orphanReadmeDays`, `backlogMinPlans`, `backlogPlansPerItem`) is now overridable per-project via `doctor.thresholds` in `docs/_meta/beacon.config.json`. All fields optional; unset ones use defaults. Invalid values (negative, NaN, non-number) are silently ignored. Design rationale in ADR-010.
  - **New command: `beacon about`.** Diagnostic output: version, install path, Node version, platform, project config (type, categories, agents, language), threshold overrides vs defaults, and whether each expected AI rule file exists on disk.

## 0.3.0

### Minor Changes

- **`beacon completion <shell>` — TAB-completion for bash, zsh, and fish.**

  Install once per shell:

  ```bash
  beacon completion bash > ~/.local/share/bash-completion/completions/beacon
  beacon completion zsh  > "${fpath[1]}/_beacon"
  beacon completion fish > ~/.config/fish/completions/beacon.fish
  ```

  Then `beacon <TAB>`, `beacon doctor --explain <TAB>`, `beacon enable <TAB>`, etc. all autocomplete. Filesystem-aware for `beacon archive plan|roadmap <slug>` (reads `docs/plans/` and `docs/roadmaps/` inline). Typo correction for unknown shell names ("Did you mean bash?").

  Architecturally: a single source-of-truth schema (`src/completion/schema.ts`) feeds three idiomatic shell generators (bash uses `compgen -W`, zsh uses `_values` with `name:description` entries, fish uses `complete -c -n`). Design rationale and alternatives considered are in ADR-009.

  Tests: +29 (226 → 255 total).

## 0.2.1

### Patch Changes

- Polish patch for v0.2.0:

  - **`beacon doctor --explain [check]`** — verbose explainer for each of the 4 doctor checks: area, why it exists, what triggers it, an example finding, and when it's _not_ flagged. Run with no check name to list all checks grouped by area. Mirrors `beacon lint --explain`.
  - Typo correction for unknown check names (Levenshtein, same engine as the lint version).
  - **README "Versioning policy" section** — explicit SemVer commitment and explains why versions can jump (e.g., `0.1.8` → `0.2.0` was a new command, not a polish).
  - Tidied backlog: removed `beacon-doctor-health-checks.todo.md` now that the feature shipped (ADR-007 + the code itself are the durable record).

## 0.2.0

### Minor Changes

- **`beacon doctor` — docs-tree health checks.**

  A new command separate from `lint` that surfaces _soft_ health signals across four areas:

  - **`stale-plans`** (activity) — flags plan files unmodified for 30+ days
  - **`proposed-adrs`** (decisions) — flags ADRs with `status: proposed` stuck for 14+ days
  - **`old-evaluations`** (snapshots) — flags evals 6+ months old where no newer eval refreshes the same topic
  - **`backlog-balance`** (balance) — flags when plans count > 5 with empty backlog, OR plans:backlog ratio > 5:1

  Output is grouped by area with file/folder glyphs and per-finding suggestions. Exit 0 by default (informational); `--strict` for CI gating; `--json` for tooling.

  This is the v0.2.0 milestone planned in ADR-007. Lint stays focused on hard structural rules; doctor handles the "is this healthy?" judgment calls.

## 0.1.8

### Patch Changes

- Three UX improvements for the lint and CLI surface:

  - **`beacon lint --explain <rule>`** — verbose explainer for any of the 11 lint rules (severity, why the rule exists, allowed patterns, example violations, how to fix). Run with no rule name to list all rules grouped by severity.
  - **Typo correction for unknown commands and add-ons** — `beacon linnt` now suggests `lint`, `beacon enable opperations` now suggests `operations`. Uses Levenshtein distance with a max of 3 edits.
  - **`beacon enable` / `beacon disable` no-args help** — invoking either command without an add-on now prints the list of available add-on categories with descriptions instead of cac's terse "missing required arg" error.

## 0.1.7

### Patch Changes

- UX: four "quick win" explanation improvements across the CLI so first-time users don't have to guess what things mean.

  **1. Project type hints in the init wizard** — each option in "Project type?" now shows which categories it enables by default:

  ```
  ● Web Application (full-stack, SaaS)   core + business, integrations, operations, roadmaps
  ○ Backend Service / API                core + integrations, operations, roadmaps
  ○ Library / SDK / Package              core only (minimal)
  ○ CLI Tool                             core + operations
  ○ Custom (no defaults)                 nothing pre-selected — you opt into everything
  ```

  Computed from `defaultCategoriesFor()` — single source of truth, no drift.

  **2. AI agent hints in the init wizard** — each agent shows which file it generates:

  ```
  ■ Claude Code        generates CLAUDE.md at project root
  ■ Cursor             generates .cursorrules + .cursor/rules/beacon.mdc
  □ Codex / Copilot    generates AGENTS.md at project root
  □ Gemini CLI         generates GEMINI.md at project root
  ```

  **3. Friendly help for `beacon new` without args** — instead of cac's terse "missing required arg" error, the CLI now prints a usage reference listing all 11 doc types with their destination paths and examples:

  ```
  $ beacon new
  Usage:
    beacon new <type> <slug> [--category <integrations|operations>]

  Available types:
    plan         active work with TODOs           → docs/plans/<slug>.plan.md
    adr          architecture decision record     → docs/adr/ADR-NNN-<slug>.md  (auto-numbered)
    pattern      replicable technical pattern     → docs/reference/<slug>.pattern.md
    ...

  Examples:
    beacon new plan billing-integration
    beacon new adr add-rate-limiting
    beacon new guide deploy-staging --category operations

  Slugs must be kebab-case (lowercase, hyphen-separated).
  ```

  **4. `sync` description expanded in `--help`** — the global help now explains when to run `sync`, not just what it does:

  ```
  Validation:
    sync     Regenerate AI rule files from docs/_meta/convention.md
             ↳ Run after editing convention.md, or if `lint` reports
               ai-files-sync (generated files drifted).
    lint     Validate the docs tree against the convention
  ```

  None of these change behavior — purely adding context where it was missing.

## 0.1.6

### Patch Changes

- UX: the interactive `beacon init` wizard now shows a boxed note before the first prompt explaining what the wizard will do — so users know what to expect (and what gets touched in their repo) before answering questions.

  The note covers:

  - What the wizard will ask
  - What files / folders will be created (docs/, AI rule files, package.json script)
  - That `Ctrl+C` is safe — nothing is written until all choices are confirmed

  ```
  ┌  Beacon — initialize docs convention
  │
  ◇  This wizard will: ──────────────────────────────────────────────────────────╮
  │                                                                              │
  │  1. Ask about your project type and which doc categories to enable           │
  │  2. Create a `docs/` folder structure in this directory                      │
  │  3. Generate AI rule files (CLAUDE.md, AGENTS.md, etc.) at the project root  │
  │  4. Add a `docs:lint` script to your package.json (if present)               │
  │                                                                              │
  │  Press Ctrl+C to abort. Nothing is written until you confirm all choices.    │
  │                                                                              │
  ├──────────────────────────────────────────────────────────────────────────────╯
  │
  ◆  Project type?
  ```

  The non-interactive path (`beacon init --yes ...`) is unchanged — the note only appears in the interactive wizard.

## 0.1.5

### Patch Changes

- UX: the interactive wizard now shows a one-line description next to each category in the "Which categories to enable?" prompt, so new users can tell `reference` vs `architecture` vs `adr` apart without leaving the terminal.

  Before:

  ```
  ■ reference
  ■ architecture
  ■ adr
  ■ plans
  ■ backlog
  ■ evaluations
  ```

  After:

  ```
  ■ reference     Replicable technical patterns.
  ■ architecture  System structure and layering decisions.
  ■ adr           Architecture Decision Records.
  ■ plans         Active work with TODOs.
  ■ backlog       Future items waiting to be sprinted.
  ■ evaluations   Date-prefixed audits and snapshots.
  ```

  When a category is also suggested by automatic project detection (e.g., `integrations` when `stripe` is in `package.json`), the hint becomes `<description> · suggested by detection` to preserve that signal.

  Descriptions come from the existing `CATEGORY_DESCRIPTIONS` map in `src/core/category-descriptions.ts` — same source of truth used by the master README and convention.md generators, so the wizard, the master README, and the convention doc all stay consistent.

## 0.1.4

### Patch Changes

- Fix: user-facing errors from CLI commands now print as clean colored messages instead of full Node.js stack traces.

  Before:

  ```
  file:///.../dist/cli.js:669
        throw new Error(
              ^
  Error: Document has unchecked TODOs. Re-run with --force to archive anyway.
      at runArchive (.../dist/cli.js:669:13)
      at async CAC.<anonymous> (.../dist/cli.js:1604:18)
  Node.js v22.19.0
  ```

  After:

  ```
  ✗ Error: Document has unchecked TODOs. Re-run with --force to archive anyway.
  ```

  Affects all commands (`archive`, `new`, `enable`, `disable`, etc.) — any expected user-facing error now formats consistently. Exit code remains 1.

  For debugging, set `BEACON_DEBUG=1` to also print the stack trace below the clean error line.

## 0.1.3

### Patch Changes

- Fix: `beacon init --yes` was silently succeeding — no message printed after scaffolding completed. Users reasonably assumed nothing happened.

  Now prints a success line and a hint for the next step:

  ```
  ✔ Beacon docs scaffolded at /path/to/project/docs/
    → Next: `beacon new plan <slug>` to create your first plan
  ```

  The interactive wizard path (`beacon init` without `--yes`) was unaffected — `@clack/prompts` already prints its own `outro` message there.

## 0.1.2

### Patch Changes

- Polish release — restrained visual upgrades, no new features or breaking changes:

  - **Minimal ASCII logo** shown on `beacon` (no args) and `beacon --help`, with a reorganized help layout grouping commands by category (Setup / Lifecycle / Validation).
  - **ANSI colors** throughout via `picocolors` (zero deps, ~3KB): errors in red, warnings in yellow, success in green, file paths dimmed, rule/category names in cyan.
  - **Hierarchical lint output** — findings grouped by severity with file paths and tree-branch glyphs (`└─`) for inner detail lines, replacing the previous flat `[rule] file — message` format.
  - **Spinners** during `beacon sync` (suppressed when called transitively from `beacon init`).
  - **Colored glyphs** (`✔` green, `✗` red, `⚠` yellow, `→` cyan) replace plain unicode in command success/error messages.

  Respects `NO_COLOR` env var natively (via picocolors auto-detect).

## 0.1.1

### Patch Changes

- acd6e36: Polish and minor fixes:

  - **CLI version is now read dynamically from `package.json`** so `beacon --version` prints the actual installed version (was hardcoded to `0.0.0`).
  - **Refactored `CATEGORY_DESCRIPTIONS`** into a single source at `src/core/category-descriptions.ts` (was duplicated across `src/generators/readme.ts` and `src/generators/convention.ts`).
  - **Symmetric content handling in `handleExistingFile`**: the `merge` path no longer trims `newContent` — preserves caller's content exactly, matching `replace`/new-file behavior.
  - **Stricter guard in `addDocsLintScript`**: uses `=== undefined` instead of a falsy check, so an intentional empty-string script value is preserved.
  - **GitHub Actions CI** added: `.github/workflows/test.yml` (tests across Linux/macOS/Windows × Node 20/22) and `.github/workflows/docs-lint.yml` (dogfooded `beacon lint --strict`).

## 0.1.0

### Minor Changes

- 53e7bb8: Initial public release. Includes:
  - `beacon init` interactive wizard with 7 project types and granular add-on customization.
  - `beacon new` / `beacon archive` for doc lifecycle.
  - `beacon sync` regenerates AI rule files for Claude, Cursor, Codex, Gemini.
  - `beacon enable` / `beacon disable` to toggle add-on categories.
  - `beacon lint` with errors, warnings, suggestions, and `--strict` / `--json` modes.
