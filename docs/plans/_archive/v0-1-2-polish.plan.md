---
title: v0.1.2 — CLI polish
status: active
created: 2026-05-24
---

# v0.1.2 — CLI polish

## Goal

Add restrained visual polish to the Beacon CLI: minimal ASCII logo on `beacon`
(no args) and `--help`, ANSI colors via `picocolors`, spinners during long
operations, hierarchical/colored lint output, glyph severity indicators, and a
reorganized help layout.

**Polish-only release** — no new features, no breaking changes, no API additions.

Design rationale: [ADR-008](../adr/ADR-008-cli-polish-design.md).

## Scope

**In:**
- New `src/ui/` module: `colors.ts`, `logo.ts`, `glyphs.ts`, `spinner.ts`
- Color all command output (init/new/archive/sync/enable/disable/lint)
- Rewrite `src/linter/reporter.ts` `formatText()` for hierarchical colored output
- Reorganize `--help` in `src/cli.ts`
- Add `picocolors` dependency
- Test infrastructure: `stripAnsi()` helper in `tests/test-utils.ts`

**Out:**
- New commands (defer to v0.2 doctor)
- Config option to disable colors (`picocolors` honors `NO_COLOR` env var natively)
- Logo on every command (would be annoying — only `beacon` no-args + `--help`)
- Themes / custom color schemes (over-engineering for v0.1.x)

## File structure

```
src/ui/
├── colors.ts           # exports c.red, c.green, c.yellow, c.cyan, c.dim, c.bold helpers wrapping picocolors
├── glyphs.ts           # exports CHECK, CROSS, WARN, ARROW with default colors
├── logo.ts             # exports ASCII logo string + helpers (full vs compact)
└── spinner.ts          # thin wrapper around @clack/prompts spinner with consistent prefix

src/cli.ts              # reorganized help text + show logo on no-args/--help
src/linter/reporter.ts  # rewrite formatText() for colored hierarchical output
src/commands/*.ts       # use c.green('✔ ...') etc. for success messages

tests/test-utils.ts     # stripAnsi() helper
tests/unit/ui/
├── colors.test.ts
├── glyphs.test.ts
└── logo.test.ts
tests/unit/linter/reporter.test.ts  # update to use stripAnsi() for assertions
```

## TODOs

### T1 — UI primitives module (TDD)

- [ ] Install `picocolors` as runtime dep, update package.json.
- [ ] Create `src/ui/colors.ts`:
      ```ts
      import pc from "picocolors";
      export const c = {
        red: pc.red, green: pc.green, yellow: pc.yellow,
        cyan: pc.cyan, dim: pc.dim, bold: pc.bold,
        bgRed: pc.bgRed,
      };
      ```
- [ ] Create `src/ui/glyphs.ts`:
      ```ts
      import { c } from "./colors";
      export const CHECK = c.green("✔");
      export const CROSS = c.red("✗");
      export const WARN = c.yellow("⚠");
      export const ARROW = c.cyan("→");
      export const TREE_LAST = c.dim("└─");
      ```
- [ ] Test `tests/unit/ui/colors.test.ts`: verify each export is a function;
      verify that calling `c.red("x")` returns a string containing "x" (with
      or without ANSI codes — `picocolors` auto-disables in non-TTY).
- [ ] Test `tests/unit/ui/glyphs.test.ts`: verify CHECK includes "✔", CROSS
      includes "✗", WARN includes "⚠", TREE_LAST includes "└─". Use
      `stripAnsi()` (created in T2) for cleanness.

### T2 — Test infrastructure for ANSI

- [ ] Create `tests/test-utils.ts` exporting `stripAnsi(s: string): string`.
      Implementation: regex-based ANSI escape removal.
      ```ts
      const ANSI_RE = /[][[\]()#;?]*((?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><])/g;
      export const stripAnsi = (s: string): string => s.replace(ANSI_RE, "");
      ```
- [ ] Use this helper in T1 tests and downstream T5 (reporter) tests.

### T3 — Logo + help text reorganization

- [ ] Create `src/ui/logo.ts` exporting:
      ```ts
      export const LOGO_LINES = [
        "   ╱╲",
        "  ╱  ╲   beacon",
        " ╱────╲",
        "╱──────╲",
      ];
      export function renderLogo(version: string): string { /* assemble + color */ }
      export const TAGLINE = "Trail markers for AI-collaborative codebases.";
      ```
- [ ] In `src/cli.ts`, detect `process.argv.length === 2` (no args) and print
      logo + help. Also intercept `--help` to print logo at top.
- [ ] Reorganize cac command registrations to group output: cac doesn't
      natively group, so add a custom `cli.help()` override using
      `cli.on()` or pre-print before letting cac take over.
- [ ] Smoke test: `node dist/cli.js` → shows logo + grouped help.
      `node dist/cli.js --help` → same.
      `node dist/cli.js --version` → just version (no logo).

### T4 — Spinner wrapper

- [ ] `@clack/prompts` already exposes `spinner()`. Create thin wrapper at
      `src/ui/spinner.ts`:
      ```ts
      import * as p from "@clack/prompts";
      export function withSpinner<T>(message: string, fn: () => Promise<T>): Promise<T> {
        const s = p.spinner();
        s.start(message);
        return fn().then(
          (v) => { s.stop(); return v; },
          (e) => { s.stop(); throw e; },
        );
      }
      ```
- [ ] Use in `src/commands/sync.ts`:
      ```ts
      import { withSpinner } from "../ui/spinner";
      // ...
      await withSpinner("Regenerating AI rule files...", async () => {
        // existing sync logic
      });
      ```
- [ ] Use in `src/commands/init.ts` for the auto-sync at end of runInit:
      ```ts
      await withSpinner("Generating AI rule files...", () => runSync({ root }));
      ```
- [ ] Test: tricky because spinner is animated. Skip explicit unit test;
      verify visually via smoke test.

### T5 — Lint reporter rewrite (colored hierarchical output)

- [ ] Update `src/linter/reporter.ts` `formatText()` to use glyphs + indentation:
      ```
      ✗ Errors (3)
        ✗ <file path in dim>
          └─ <rule in cyan>: <message>

      ⚠ Warnings (1)
        ⚠ <file path in dim>
          └─ <rule in cyan>: <message>

        Suggestions (0)
        All clear.
      ```
- [ ] When no findings, print `All clear.` in dim italics (or just `All clear.`
      in green for visibility).
- [ ] Group findings by severity (current behavior), then within each severity
      group by file path (subgroup).
- [ ] Tests in `tests/unit/linter/reporter.test.ts`:
      - Update existing 3 tests to use `stripAnsi()` and assert on stripped content
      - Add new test: hierarchy structure (each finding indented under its file path)
      - Add new test: "All clear." printed when 0 findings

### T6 — Colored success/error messages across commands

- [ ] In `src/commands/new.ts`:
      ```ts
      console.log(`${c.green("✔")} Created ${c.dim(path.relative(...))}`);
      ```
- [ ] In `src/commands/archive.ts`:
      - Warnings: `console.warn(`${c.yellow("⚠")} ${w}`);`
      - Success: `console.log(`${c.green("✔")} Archived to ${c.dim(...)}`);`
- [ ] In `src/commands/sync.ts`:
      ```ts
      console.log(`${c.green("✔")} AI rule files regenerated.`);
      ```
- [ ] In `src/commands/toggle.ts`:
      ```ts
      console.log(`${c.green("✔")} Enabled ${c.cyan(addon)}.`);
      ```
- [ ] In `src/commands/init.ts` (the interactive wizard error paths):
      keep `p.cancel()` (already styled by @clack/prompts).
- [ ] Update `src/commands/init.ts` error messages on `--yes` validation
      failures:
      ```ts
      console.error(`${c.red("✗")} ${c.bold("Error:")} --type is required when using --yes.`);
      ```

### T7 — Changeset + version bump prep

- [ ] `npx changeset add` → patch bump, description:
      ```
      Polish release: ANSI colors via picocolors, hierarchical lint output,
      minimal ASCII logo on `beacon` / `--help`, spinners during sync.
      No new features, no breaking changes.
      ```
- [ ] Verify changeset file at `.changeset/v0-1-2-polish-XXX.md` (auto-named).

### T8 — Full verification

- [ ] `npm run typecheck` clean.
- [ ] `npm test` — all tests pass (counts: 147 prior + ~5 new for ui = ~152).
- [ ] `npm run build` clean.
- [ ] Smoke test:
      ```bash
      cd /tmp/beacon-smoke-$$
      node <abs>/dist/cli.js                  # → logo + help
      node <abs>/dist/cli.js --help           # → logo + help
      node <abs>/dist/cli.js --version        # → just "beacon/0.1.2"
      node <abs>/dist/cli.js init --yes --type=library --agents=claude
      # → spinner during AI file generation, then ✔ in green
      cd /tmp/beacon-smoke-$$
      echo "# bad" > docs/plans/badname.pattern.md   # plant a violation
      node <abs>/dist/cli.js lint
      # → colored hierarchical output: ✗ in red, file in dim, rule in cyan
      rm -rf /tmp/beacon-smoke-$$
      ```

### T9 — Release prep + publish

- [ ] `npx changeset version` → bumps 0.1.1 → 0.1.2, updates CHANGELOG.
- [ ] `git add . && git commit -m "chore: release beacon-docs@0.1.2"`
- [ ] `git tag -a v0.1.2 -m "Beacon v0.1.2 — CLI polish"`
- [ ] `git push origin main --tags`
- [ ] `npm publish --access public` (use TOTP or refresh GAT if expired)
- [ ] Verify: `npm view beacon-docs version` → `0.1.2`
- [ ] Smoke test from registry: `npx beacon-docs@0.1.2 --version`

### T10 — GitHub Release notes for v0.1.2

- [ ] Create release at https://github.com/Juliocbm/beacon-docs/releases/new?tag=v0.1.2
- [ ] Title: `v0.1.2 — CLI polish (colors, glyphs, spinners, logo)`
- [ ] Brief description focused on user-visible improvements (lint output is
      scannable, install feels more "alive"). Link to ADR-008 for design
      rationale.
- [ ] Move this plan to `docs/plans/_archive/v0-1-2-polish.plan.md` after
      release ships.

## Effort estimate

~6-8 hours total. Comfortably one long weekend.

| Task | Estimated time |
|---|---|
| T1 UI primitives | 30 min |
| T2 Test infrastructure | 20 min |
| T3 Logo + help reorganization | 1.5 h |
| T4 Spinner wrapper | 30 min |
| T5 Lint reporter rewrite | 1.5 h |
| T6 Colored output across commands | 1 h |
| T7-T9 Changeset + verify + publish | 1 h |
| T10 GitHub Release | 15 min |

## Open questions / decisions

- **Logo design**: the 3-line `╱╲` lighthouse shape proposed in ADR-008 is a
  starting point. May iterate if a better shape emerges during T3.
- **`--no-color` flag**: deliberately skipped — `picocolors` honors `NO_COLOR`
  env var per https://no-color.org. Reconsider only if users complain.
- **Width handling**: terminal width detection (for wrapping long messages)
  is out of scope for v0.1.2. Lint messages are typically short enough; revisit
  if user feedback demands.
