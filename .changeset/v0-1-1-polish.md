---
"beacon-docs": patch
---

Polish and minor fixes:

- **CLI version is now read dynamically from `package.json`** so `beacon --version` prints the actual installed version (was hardcoded to `0.0.0`).
- **Refactored `CATEGORY_DESCRIPTIONS`** into a single source at `src/core/category-descriptions.ts` (was duplicated across `src/generators/readme.ts` and `src/generators/convention.ts`).
- **Symmetric content handling in `handleExistingFile`**: the `merge` path no longer trims `newContent` — preserves caller's content exactly, matching `replace`/new-file behavior.
- **Stricter guard in `addDocsLintScript`**: uses `=== undefined` instead of a falsy check, so an intentional empty-string script value is preserved.
- **GitHub Actions CI** added: `.github/workflows/test.yml` (tests across Linux/macOS/Windows × Node 20/22) and `.github/workflows/docs-lint.yml` (dogfooded `beacon lint --strict`).
