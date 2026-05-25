---
adr: 013
title: marketplace-distribution-for-claude-plugin
status: accepted
date: 2026-05-25
supersedes: null
superseded-by: null
---

# ADR-013: Marketplace-based distribution for the Claude Code plugin

## Status

Accepted (2026-05-25). Partially supersedes ADR-012's distribution section (paths labelled A/B/C in that ADR's `Open questions` and `Plan revisions after T1`).

## Context

[ADR-012](ADR-012-claude-code-plugin-design.md) settled the high-level question of *where* the Claude Code companion plugin would live (`claude-plugin/` subfolder of the main `beacon-docs` repo). It deferred the question of *how* end users would install it to T1 research in the implementation plan, which identified three theoretical paths:

- **Path A:** local install via `claude plugin install --plugin-dir <path>`.
- **Path B:** custom marketplace (`marketplace.json` at the repo root) consumed via `claude plugin marketplace add` + `claude plugin install <plugin>@<marketplace>`.
- **Path C:** split the plugin into a standalone repo and submit to the community marketplace.

The plan recommended Path A for the MVP (zero overhead, single user-facing command).

During T2 hands-on validation against **Claude Code v2.1.150**, we discovered that:

1. **`--plugin-dir` does not exist** in the current `claude plugin install` subcommand. The CLI only accepts marketplace-resolved plugin names (`<name>` or `<name>@<marketplace>`).
2. **`claude plugin marketplace add <source>` does exist** and accepts relative paths (`./`), absolute paths, GitHub `owner/repo` shorthand, and HTTPS URLs.
3. **Local filesystem marketplaces are explicitly supported** by Claude Code — `claude plugin marketplace add ./` resolves to a directory containing `.claude-plugin/marketplace.json` and registers it under the name declared in that file.
4. **A `git-subdir` source type** exists in the marketplace schema for plugins living in subfolders of a git repository, but for the local-development case the simpler relative-path approach (`"source": "./claude-plugin"`) inside the marketplace.json is sufficient.

Path A is therefore not viable today regardless of architectural preference. Path B works end-to-end and was validated in T2.

## Decision

**Use Path B (custom marketplace at repo root) as the supported install mechanism for the MVP.**

Concrete artifacts:

- A `marketplace.json` at `beacon-docs/.claude-plugin/marketplace.json` declaring a marketplace named `beacon-docs-plugins`, with a single plugin entry pointing to the relative path `./claude-plugin`.
- End-user install flow:
  ```bash
  cd beacon-docs                                       # clone first
  claude plugin marketplace add ./                     # register the local marketplace
  claude plugin install beacon@beacon-docs-plugins     # install the plugin
  ```
- `claude-plugin/README.md` documents this flow as the primary install path; `--plugin-dir` references are removed.

This decision **supersedes the "MVP install path"** portion of ADR-012's distribution analysis. The high-level decision in ADR-012 (companion plugin in the same repo as a subfolder) remains intact.

Path C (split-to-standalone-repo + community marketplace submission) is **still the future trigger** for when the plugin gains independent traction. ADR-012's split criteria still apply unchanged.

## Consequences

**For end users (today):**

- Install requires cloning the `beacon-docs` repo first, then two CLI commands. Slightly more friction than the originally-imagined `claude plugin install --plugin-dir`, but still well within "five-minute setup" territory.
- The marketplace name (`beacon-docs-plugins`) is publicly visible. Future plugins added to this marketplace (Cursor variant, MCP server, etc.) will install with the same `@beacon-docs-plugins` suffix.

**For maintenance:**

- **One additional artifact to keep consistent**: `beacon-docs/.claude-plugin/marketplace.json` must stay in sync with `beacon-docs/claude-plugin/.claude-plugin/plugin.json` (specifically: plugin name, source path, version).
- **Plugin-side `version` in `plugin.json` is the authoritative version**. The marketplace.json does NOT carry a per-plugin version; it just points at the source.
- A validation step in CI (or pre-commit) running `claude plugin validate .` (marketplace) and `claude plugin validate ./claude-plugin` (plugin) would catch drift early. Not blocking for v0.1.0 of the plugin, but worth adding when the plugin matures.

**For Claude Code version compatibility:**

- The marketplace mechanism was confirmed working on Claude Code v2.1.144 and v2.1.150. We document the minimum required version in the plugin README as v2.1.144 — earlier versions may not have `claude plugin marketplace` at all.
- If Claude Code later adds `--plugin-dir` back (or some equivalent), this decision can be revisited as an **additive** convenience path; users on older versions would keep using the marketplace flow.

**For documentation:**

- The plugin README (`claude-plugin/README.md`) is updated in lockstep with this ADR to show the marketplace flow.
- The implementation plan (`docs/plans/claude-code-plugin-mvp.plan.md`) gets a `Plan revisions after T2` section that points here.

## Alternatives considered

1. **Wait for Claude Code to add `--plugin-dir`.** Rejected: no ETA, unclear if it's planned, and we already have a working alternative. Shipping is more valuable than waiting for the imagined cleaner option.

2. **Use an HTTPS-hosted `marketplace.json`** (e.g., serve it from beacon-docs.com or GitHub Pages). Rejected for the MVP: adds hosting concerns, breaks the "test locally before publishing" workflow, requires another deploy target. May make sense as a future addition for users who don't want to clone the repo.

3. **Skip the local marketplace entirely and submit to the community marketplace immediately.** Rejected: requires the plugin to be in its own repo (Path C from ADR-012), which we explicitly deferred until adoption justifies the maintenance overhead. Path B is the necessary intermediate step.

4. **Use the `git-subdir` source type in the marketplace.json instead of a relative path.** Considered but unnecessary for local development. `git-subdir` is appropriate when the marketplace itself is hosted on git and references a plugin in another git location — overkill for a same-repo subfolder. Keeping the simpler `"source": "./claude-plugin"` reduces moving parts.

## Validation evidence

End-to-end install + activation tested on 2026-05-25 against Claude Code v2.1.150 on Windows 11 / PowerShell. Detailed observations: [`docs/evaluations/2026-05-25-claude-plugin-t2-validation.eval.md`](../evaluations/2026-05-25-claude-plugin-t2-validation.eval.md).

Notable: with the plugin installed via this mechanism, the always-available `beacon-workflow` skill auto-invoked correctly on the first ADR-relevant conversational prompt, composed naturally with the `superpowers:brainstorming` skill, and triggered Claude to consult the actual repo context (existing ADRs + config) before responding. The marketplace install path therefore not only works but works *as designed* — no degradation in skill behavior versus the hypothetical `--plugin-dir` path.

## Future work

- **If Claude Code adds `--plugin-dir`:** document it as a second supported path in the README; keep the marketplace flow as the canonical/recommended one.
- **When Path C activates** (split repo): the marketplace.json moves with the plugin to its new repo, or we register the plugin in the community marketplace and retire the local one.
- **CI validation:** add `claude plugin validate` to the project's CI pipeline once the plugin becomes a v1.0 artifact users depend on.
