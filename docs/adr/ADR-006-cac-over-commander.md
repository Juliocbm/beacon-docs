---
adr: 006
title: Use cac over Commander for CLI framework
status: accepted
date: 2026-05-22
supersedes: null
superseded-by: null
---

# ADR-006: Use cac over Commander for CLI framework

## Context

Beacon is a CLI tool with seven commands: `init`, `new`, `archive`, `lint`, `sync`, `enable`,
and `disable`. It needs a framework to parse arguments, register subcommands, handle `--help`
output, and manage option types. The Node.js ecosystem has several options:

- **Commander.js**: the dominant choice, battle-tested, enormous ecosystem presence. Feature-rich
  but also carries complexity that scales poorly for small CLIs — extensive API surface, complex
  subcommand registration, and a relatively large bundle contribution.
- **yargs**: full-featured with built-in validation, but even heavier than Commander and its API
  requires substantial boilerplate for simple CLIs.
- **cac** (Command And Conquer): a lightweight CLI framework. Minimal API, zero non-dev
  dependencies, tiny bundle footprint. Achieves the same subcommand registration and option parsing
  that Beacon needs in significantly fewer lines.
- **meow**: even simpler but lacks subcommand support needed for Beacon's seven-command surface.

## Decision

Use **cac** as the CLI framework.

Beacon's CLI entry point (`src/cli.ts`) uses cac to register all seven commands with their flags
and option types. The decision reflects Beacon's philosophy of no over-engineering: we have seven
commands, clean argument shapes, and no need for Commander's advanced features (nested subcommands,
coercion functions, custom help formatters, action middleware).

cac provides:
- Subcommand registration with typed options via `.option()`.
- Automatic `--help` and `--version` generation.
- Clean `.parse()` entry point.
- ESM-compatible, TypeScript-friendly.

The difference in bundle size is material: cac adds ~5KB to the output vs. Commander's ~25KB.
For a CLI tool that many users will run via `npx beacon-docs`, startup time and download size
matter.

## Consequences

**Positive:**
- `src/cli.ts` stays lean and readable — the entire command registration fits in a few dozen lines.
- Beacon's distributed bundle is smaller, improving `npx` cold-start time.
- cac's API is simple enough that a new contributor can understand the full CLI registration in
  minutes without reading framework documentation.

**Negative / Trade-offs:**
- cac has less community mindshare than Commander. Contributors familiar only with Commander may
  need a brief orientation. Mitigated by cac's minimal surface area — the API is learned in minutes.
- If Beacon outgrows cac's capabilities (e.g., nested subcommands, complex validation chains),
  migration to Commander would be required. This is unlikely given Beacon's intentionally narrow
  command surface.
