---
adr: 011
title: plugin-system-design
status: accepted
date: 2026-05-24
supersedes: null
superseded-by: null
---

# ADR-011: Plugin system — third-party doctor checks and lint rules

## Status

Accepted (v0.4.0).

## Context

Through v0.3.1 Beacon was 100% opinionated: 11 lint rules and 5 doctor checks, no way to add custom ones without forking. That works for the universal-convention parts of the product (kebab-case, suffix-location, etc.) but cracks for project-specific judgment calls — corporate teams want compliance-flavored checks, monorepos want workspace-shape rules, etc. Without an escape hatch, every new use case is either "we're sorry, fork the repo" or "send us a PR for our built-in list."

We had two backlog items in `docs/backlog/`:
- `plugin-system-for-custom-categories.todo.md`
- (Implicitly) custom checks/rules

This is the last big deferred feature before we can credibly cut a v1.0.

## Decision

Ship a plugin loader in v0.4.0 with a deliberately small scope: **checks + rules only**. Categories and AI agents stay built-in for now (deferred to v0.5+) — they are bigger surface changes that we want to design with real usage data, not preemptively.

### Plugin contract

```ts
export interface BeaconPlugin {
  name: string;                 // required, unique identifier
  version?: string;             // optional
  checks?: Check[];             // doctor checks (same Check type as built-ins)
  rules?: Rule[];               // lint rules (same Rule type as built-ins)
  explain?: Record<string, { summary: string; why?: string; fix?: string }>;
}
```

A plugin exports the object as either the default export OR a named `plugin` export. Plugins live in their own files/packages and are loaded dynamically at runtime; they reuse Beacon's existing `Check` and `Rule` types so there is one programming model, not two.

### Config integration

Plugin sources go in `docs/_meta/beacon.config.json`:

```json
{
  "plugins": [
    "beacon-plugin-compliance",            // npm package name
    "./scripts/internal-checks.mjs"        // relative path
  ]
}
```

Two source types are supported per Decision B (user-confirmed):
- **npm package names** — resolved from the project's `node_modules` (not the CLI's). Plugins must be `npm install`-ed in the project.
- **Relative paths** (start with `./` or `../`) — resolved against the project root. Useful for in-repo plugins.

Absolute paths also work but are discouraged (not portable across machines).

### Error handling

Plugin load failures are **accumulated, not fatal**. A misconfigured plugin should never brick `beacon doctor` or `beacon lint`. Errors surface to stderr as warnings; built-in checks/rules continue to run.

### --explain integration

`beacon lint --explain <rule>` and `beacon doctor --explain <check>` look up the name in built-ins first, then fall through to plugin `explain` entries, then suggest a typo correction across both sets if nothing matches. Plugins without an `explain` entry still surface (with a fallback message pointing the user to the plugin's README).

### `beacon about` integration

`beacon about` now lists loaded plugins, their versions, and how many checks/rules each contributes — useful for verifying plugin installation and diagnosing version drift.

## Consequences

**For end users:**
- Zero breakage. Configs without `plugins` continue working unchanged.
- Plugins are opt-in per-project, version-controlled with the project (config lives in git).

**For plugin authors:**
- Public API is two types (`Check`, `Rule`) re-exported from beacon-docs. Plugins should peer-dep on a compatible major version.
- We commit to keeping the `BeaconPlugin` contract stable in patches; minor versions may add optional fields; major versions may rename.

**For Beacon maintenance:**
- New public surface to maintain. Breaking change cost goes up — any internal refactor of `Check`/`Rule` types now ripples to plugin authors.
- We retain the right to add built-ins that overlap with popular plugins. Plugins can override only by name disambiguation (a plugin check named `stale-plans` would shadow the built-in — we may want to gate this in v0.5).

## Alternatives considered

1. **Config-driven rule tuning instead of plugins** — `lint.rules.kebab-case.enabled: false`, etc. Rejected: addresses only a slice of the problem (disabling built-ins) and not the bigger one (adding genuinely new behavior). The config can still grow later for tuning; it's orthogonal to plugins.

2. **JavaScript-only plugins via `eval`** — rejected outright for security and DX reasons.

3. **WASM plugins** — over-engineered for v0.4. Real-world demand is "I need to write a JS function," not "I need polyglot extensibility."

4. **Postinstall script that copies plugins into the CLI's node_modules** — rejected because it forces global writes and breaks `npx`. Resolving from the project root is the standard pattern (ESLint, Prettier, Stylelint all do this).

5. **Plugin registry / marketplace** — out of scope. Users find plugins via npm search (`keywords: ["beacon-plugin"]` convention) and install with `npm install`. Adding a curated registry would commit us to discovery and review burdens we don't want yet.

## Future work

- **v0.5+:** custom categories (declare a new folder, suffix, archival policy) and custom AI agents (declare a new generated file format).
- Plugin lifecycle hooks (e.g., `onInit`, `onSync`) if real plugins need them.
- Plugin sandboxing if untrusted plugins become a concern (today users explicitly opt in via config — same trust model as `npm install`).
