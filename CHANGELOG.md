# beacon-docs

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
