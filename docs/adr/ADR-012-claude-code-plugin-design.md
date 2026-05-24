---
adr: 012
title: claude-code-plugin-design
status: accepted
date: 2026-05-24
supersedes: null
superseded-by: null
---

# ADR-012: Companion Claude Code plugin — `claude-plugin/` in the same repo

## Status

Accepted (planned for next iteration, no version assigned to beacon-docs).

## Context

In v0.4.1 (just shipped) we added behavioral rules to the generated AI rule files — workflow triggers, document lifecycle, self-checks. That solves part of the problem: once `beacon init` has run, Claude (and other AI agents) read CLAUDE.md and follow the convention proactively.

But CLAUDE.md is **passive context**. It tells Claude what to do, but it can't:

- Detect a Beacon-less project and propose `beacon init` proactively.
- Wrap the CLI with conversational UX (slash commands like `/beacon-doctor`).
- Parse `beacon doctor` output and propose executable actions (e.g., "I see 3 stale plans — should I archive them?").
- Translate natural-language intent into precise commands (`"plan for refactoring auth"` → `beacon new plan refactor-auth`).
- Provide a consistent global behavior across every project the user opens.

A **Claude Code plugin** (markdown skill + slash commands distributed via Claude's plugin system) closes this gap. It lives at the agent's runtime layer and complements Beacon (which lives at the codebase build-time layer).

We considered three architectural options:

1. **Separate repo** (`claude-plugin-beacon`) — cleanest distribution, but doubles maintenance overhead and discoverability friction for a solo maintainer.
2. **Same repo as subfolder** (`beacon-docs/claude-plugin/`) — single source of truth, atomic changes across CLI + skill, lowest maintenance overhead. Reversible: trivially split later if registry or marketing demands it.
3. **npm workspaces / formal monorepo** — overkill. The skill is markdown, not a Node package; sharing dependencies via workspaces solves a problem we don't have.

## Decision

**Option 2: same repo, subfolder `claude-plugin/`.** Specifically:

- Live in `beacon-docs/claude-plugin/` at the repo root.
- Distributed independently of `beacon-docs` npm package (not part of `npm publish`).
- Independent versioning via `claude-plugin/plugin.json` (`version` field decoupled from the CLI's `package.json`).
- MVP scope: **1 skill + 4-5 slash commands + advisory mode** (works without Beacon installed, in degraded form).
- Splits to separate repo only when ONE of these triggers fires:
  - Claude Code plugin registry requires dedicated repo URLs.
  - Skill gains independent tracción (issues, stars, PRs) that justifies its own release notes.
  - User audiences for skill vs CLI diverge meaningfully.

The skill **delegates to the CLI** — does not duplicate functionality. When a user says "create an ADR for X", the skill runs `bash: beacon new adr <slug>` via Claude's Bash tool, not a manual file write.

Full MVP specification lives in [`docs/plans/claude-code-plugin-mvp.plan.md`](../plans/claude-code-plugin-mvp.plan.md).

## Consequences

**For Beacon users (CLI only):**
- Zero impact. The CLI remains unchanged. The plugin is opt-in for Claude Code users only.

**For Claude Code power users:**
- Lower friction (slash commands instead of remembering CLI syntax).
- Discovery (skill recommends Beacon when missing).
- Proactive document creation at the right conversational moments.
- Consistent agent behavior across projects (global skill vs per-project CLAUDE.md).

**For maintenance:**
- New artifact in the repo (`claude-plugin/` folder + its own README + manifest).
- Two product surfaces to keep coherent: CLI capabilities and skill expectations must not drift (e.g., if `beacon doctor` gains a flag, the skill should be aware).
- Mitigation: same repo means a single PR can update both atomically.
- Skill is mostly markdown — velocity of changes is much lower than CLI. Expected delta: ~1-2 commits per CLI minor release.

**For distribution:**
- Beacon CLI: keeps going via `npm publish` (unchanged).
- Plugin: distributed via Claude Code's mechanism (git URL pointing into the subfolder, or whatever the registry format requires). Exact mechanics to be validated during implementation.

## Alternatives considered

1. **Separate repo from day 1** — rejected: doubles overhead before adoption justifies it. Reversibility favors starting joined.

2. **No plugin at all; rely on CLAUDE.md alone** — rejected: CLAUDE.md is passive. It can't shell out commands, can't detect Beacon-less projects, can't parse `beacon doctor` output. The plugin captures the "execute on behalf of" value that markdown rules cannot.

3. **MCP server as the integration mechanism** — deferred. An MCP server would expose Beacon's functionality as typed tools (Claude calls `beacon_doctor` directly, no shell-out). Better UX but real engineering work. The MVP uses Bash invocation; MCP can be a v0.2 of the plugin if traction justifies it.

4. **Pure documentation skill (markdown only, no slash commands)** — rejected as too thin. Provides almost no value over what CLAUDE.md already does in a Beacon-initialized project. The slash commands and Bash delegation are what give the plugin distinctive value.

## Open questions to resolve during implementation

- Exact Claude Code plugin manifest format (`plugin.json` schema, required vs optional fields).
- Installation mechanism: does the registry pull from git URLs? require a published package? need a `.claude-plugin.json` at the repo root?
- Slash command discovery: how does the skill register `/beacon-doctor` so it shows in Claude's command palette?
- Testing strategy: skills are markdown — what does "tests" look like? Likely manual: install, invoke, verify behavior.

These are research items for T1 of the implementation plan, not blockers for accepting this ADR.

## Future work

- v0.2 of the plugin: MCP server, output parsing for doctor findings as executable actions, more sophisticated slash commands.
- Cross-link: when the plugin matures, mention it in beacon-docs README + landing page as the "Claude Code companion."
- Consider parallel plugins for Cursor / Copilot agent mode if their plugin ecosystems mature similarly.
