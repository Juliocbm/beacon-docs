---
adr: 009
title: shell-completion-design
status: accepted
date: 2026-05-23
supersedes: null
superseded-by: null
---

# ADR-009: Shell completion — bash, zsh, fish via static script generation

## Status

Accepted (v0.3.0).

## Context

By v0.2.1 Beacon had 8 top-level commands, 6 add-on categories, 11 doc types, 11 lint rules, 4 doctor checks, and a handful of value-bearing flags (`--type`, `--agents`, `--explain`). Users were memorizing growing lists or running `beacon --help` repeatedly. v0.1.8 added typo-correction as a safety net *after* mistakes; this decision is about preventing the mistake in the first place via shell tab-completion.

Three shells cover roughly 95% of the target audience: **bash** (default on Linux distros and Git Bash on Windows), **zsh** (default on macOS), and **fish** (popular among the same power-user base that adopts opinionated tools like Beacon).

## Decision

Ship a `beacon completion <shell>` command that prints an idiomatic completion script to stdout. Users redirect the output to the shell's completions directory and reload. The script is **static** — it embeds the command/flag/value lists at generation time and does not call back into `beacon` at completion-time.

Dynamic completion is limited to one case: `beacon archive plan|roadmap <slug>` reads the filesystem (`ls docs/plans/*.plan.md`) inline from the shell.

### Single source of truth: `src/completion/schema.ts`

All three shell generators read from one schema:

```ts
COMMAND_SCHEMA: readonly CommandSchema[] = [
  { name: "init", flags: [...], flagValues: { type: PROJECT_TYPES, agents: AGENT_IDS, ... } },
  { name: "lint", flags: [...], flagValues: { explain: getAllRuleNames() } },
  ...
]
```

This avoids the bug class where bash and zsh drift (the same flag offered different values across shells) and means a new command added to `cli.ts` requires exactly one corresponding entry in `schema.ts`.

### Why static, not callback-based

A callback-based approach (e.g., zsh's `_arguments` calling `beacon --complete-words foo bar`) would let completion adapt to live state (current config, dynamically enabled add-ons). Tradeoffs considered:

- **Static pros:** no shell-language-specific helper to debug, no Node startup latency per TAB press (~150ms on cold cache), script works without `beacon` in PATH after install.
- **Callback pros:** completions reflect current project state (e.g., only offer disabled add-ons to `enable`, only enabled add-ons to `disable`).

Decision: **static** for v0.3.0. The Node startup cost dominates the UX — even 100ms of TAB lag feels broken. The "list available add-ons" case is acceptable to over-suggest because Beacon's typo correction (v0.1.8) catches invalid values at runtime with a helpful error. Filesystem-aware completion (archive plan slugs) uses inline shell `ls`, which is fast.

### Per-shell idioms

- **bash**: `_beacon_completion` function + `complete -F`, uses `COMPREPLY` and `compgen -W`
- **zsh**: `#compdef beacon` header + `_values` builtin with `name:description` entries (richer than bash)
- **fish**: `complete -c beacon -n <condition>` lines; conditions use `__fish_use_subcommand` and `__fish_seen_subcommand_from`

## Consequences

**Maintenance cost:** Adding a new command requires updating `cli.ts` AND `src/completion/schema.ts`. We add a unit test (`completion.test.ts`) to detect drift via grep assertions ("offers stale-plans for `doctor --explain`").

**Discoverability:** Install instructions go in README under a new "Shell completion" section. The `beacon --help` output mentions `completion <shell>` in a new "Shell" section group.

**Future extensions deferred:**
- Powershell completion (low demand; powershell users on Windows usually fall back to git-bash).
- Dynamic completion when project state would help (e.g., addon-aware `enable`/`disable`). Reconsider if user reports indicate over-suggestion is a real pain point.
- `beacon completion install <shell>` as a convenience to detect the right path automatically. Deferred — users on different distros prefer to redirect output themselves.

## Alternatives considered

1. **Use a completion library** (e.g., `omelette`, `tabtab`). Rejected: extra dependency, none generate all three shells cleanly, and embedding shell scripts is not complex enough to justify the dep.
2. **Generate completions at install-time via a postinstall hook.** Rejected: postinstall hooks are user-hostile (slow `npm install`, sometimes blocked in CI environments). Manual install via `beacon completion <shell> > path` is the standard for `gh`, `kubectl`, `cargo`, etc.
3. **Skip zsh and fish, ship bash only.** Rejected: macOS defaults to zsh since 2019 — bash-only would miss most of the macOS user base.
