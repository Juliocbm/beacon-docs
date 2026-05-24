# beacon-docs

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
