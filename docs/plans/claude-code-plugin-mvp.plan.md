---
title: claude-code-plugin-mvp
status: active
created: 2026-05-24
---

# Claude Code Plugin — MVP implementation plan

## Goal

Ship a companion Claude Code plugin that wraps Beacon with conversational UX: 1 skill that loads automatically on Beacon-detected projects, 4-5 slash commands that map natural language to CLI invocations, and proactive recommendations when entering a Beacon-less project. Distributed from `beacon-docs/claude-plugin/` subfolder; independent versioning; runs in degraded "advisory mode" when Beacon isn't installed.

Design rationale: [ADR-012](../adr/ADR-012-claude-code-plugin-design.md).

## Architecture

```
┌─────────────────────────────────────────┐
│  Skill (claude-plugin-beacon)            │  ← runtime de Claude
│  - Slash commands wrap CLI               │
│  - Guía conversacional                   │
│  - Detección proactiva                   │
└─────────────────┬───────────────────────┘
                  │ shells out to (via Bash tool)
                  ↓
┌─────────────────────────────────────────┐
│  Beacon CLI (beacon-docs)                │  ← build-time del codebase
│  - Genera archivos                       │
│  - Lint + doctor                         │
│  - Plugin system propio                  │
└─────────────────┬───────────────────────┘
                  │ writes
                  ↓
┌─────────────────────────────────────────┐
│  Codebase artifacts                      │  ← persistent context
│  - docs/                                 │
│  - CLAUDE.md, AGENTS.md, .cursorrules    │
└─────────────────────────────────────────┘
```

The skill **delegates**, does not duplicate. When the user says "create an ADR for X," the skill runs `bash: beacon new adr <slug>` via Claude's Bash tool — not a hand-written file.

## File structure

```
beacon-docs/                      ← existing repo
└── claude-plugin/                ← NEW subfolder
    ├── README.md                 ← user-facing docs for the plugin
    ├── plugin.json               ← Claude Code plugin manifest (format TBD in T1)
    ├── skills/
    │   └── beacon-workflow/
    │       └── SKILL.md          ← main skill (loaded when beacon.config.json detected)
    └── commands/
        ├── beacon-init.md
        ├── beacon-new.md
        ├── beacon-doctor.md
        ├── beacon-explain.md
        └── beacon-archive.md
```

Not distributed via `npm publish`. Distributed via Claude Code's plugin mechanism (exact mechanics validated in T1).

## Scope

### In scope (MVP)

1. **One skill** (`beacon-workflow`):
   - Detects `docs/_meta/beacon.config.json` in cwd.
   - Loads guidance: when user requests document creation, identify type and invoke `beacon new <type> <slug>` instead of writing the file directly.
   - Conversational signal recognition:
     - "Decision about X" → propose ADR via `beacon new adr <slug>`
     - "Multi-step work" → propose plan via `beacon new plan <slug>`
     - "Defer this" / "out of scope" → propose backlog item via `beacon new todo <slug>`
     - Before release / tag → propose `beacon doctor` run
   - When Beacon is NOT detected: switch to "advisory mode" — provide convention guidance without attempting to execute CLI commands.

2. **Five slash commands** wrapping the CLI:
   - `/beacon-init` — inspect repo, recommend project type + add-ons based on what's present, execute `beacon init --yes --type=... --with=...`.
   - `/beacon-new <description>` — natural language → command. Example: `"plan para refactor de auth"` → `beacon new plan refactor-auth`.
   - `/beacon-doctor` — run doctor, parse JSON output, propose specific actions per finding.
   - `/beacon-explain <term>` — search built-in lint rules first, then doctor checks, then loaded plugins.
   - `/beacon-archive` — list active plans, let user select which to archive.

3. **Proactive Beacon detection** — when Claude enters a repo with no Beacon but visible documentation chaos (>10 .md in docs/, no CLAUDE.md, no convention.md), suggest installation: *"This repo would benefit from beacon-docs. Want me to scaffold it?"*

### Out of scope (deferred)

- MCP server with typed tools (defer to v0.2 of the plugin).
- Output parsing of `beacon doctor` text format (only parse `--json`).
- Parallel plugins for Cursor / Copilot / Gemini (only Claude Code MVP).
- Internationalization of slash command descriptions.
- Automated tests of skill behavior (testing markdown skills is mostly manual — see T7).

## Value matrix

| | Without skill (only beacon-docs) | With both |
|---|---|---|
| Discovery | User must know about Beacon | Skill recommends Beacon proactively |
| Command memory | User memorizes CLI syntax | `/beacon-doctor`, `/beacon-new <natural lang>` |
| Doctor findings | Plain text output | Parsed findings → executable actions |
| Workflow triggers | Static rules in CLAUDE.md | Skill executes suggestions, not just renders them |
| Multi-project | Each repo loads its own CLAUDE.md | Global skill = consistent agent behavior |
| Beacon-less projects | Claude has no convention guidance | Skill provides convention as advisory + suggests install |

## User setup

```bash
# 1. Install Beacon (already standard for current users)
npm install -g beacon-docs

# 2. Install the Claude Code plugin (once, global)
claude plugin install beacon-claude-toolkit   # exact mechanism TBD in T1

# 3. Per project (unchanged)
beacon init    # or /beacon-init from Claude
```

After setup, opening Claude Code in any Beacon project activates the skill automatically. Zero per-session configuration.

## Behavior without Beacon installed

| Capability | Without Beacon | With Beacon |
|---|---|---|
| Conversational convention guidance | ✅ (skill knows the rules) | ✅ |
| Detect project + recommend install | ✅ (`"npm install -g beacon-docs"`) | N/A |
| Create documents | ⚠️ Claude writes by hand (no auto-numbering, no frontmatter scaffolding) | ✅ via `beacon new` |
| Linting | ❌ requires `beacon lint` | ✅ |
| Doctor checks | ❌ requires `beacon doctor` | ✅ |
| `/beacon-*` slash commands | ❌ fail at execution step | ✅ |

The skill detects Beacon absence at startup and degrades gracefully. This lets new users evaluate the skill before committing to the full toolchain.

## TODOs

### T1 — Research Claude Code plugin format
- [ ] Locate official Claude Code plugin authoring docs (WebSearch + claude-code-guide agent).
- [ ] Identify required `plugin.json` schema fields.
- [ ] Confirm slash command file format and discovery mechanism.
- [ ] Confirm skill loading rules (auto-load triggers, naming conventions, frontmatter requirements).
- [ ] Document findings in this plan as a `Plugin format reference` appendix before continuing.

### T2 — Scaffold `claude-plugin/` folder structure
- [ ] Create `claude-plugin/` at repo root.
- [ ] Create `plugin.json` with manifest fields (name, version, description, skills, commands).
- [ ] Create empty `skills/beacon-workflow/SKILL.md` and `commands/*.md` placeholders.
- [ ] Create `claude-plugin/README.md` with install/usage docs scoped to the plugin.

### T3 — Write the main skill (`beacon-workflow`)
- [ ] Frontmatter: `name: beacon-workflow`, `description: ...`, auto-load conditions.
- [ ] Body sections: Detection logic, Conversational triggers, Lifecycle reminders, Advisory mode.
- [ ] Cross-reference [docs/_meta/convention.md](../_meta/convention.md) so the skill stays consistent with the convention source-of-truth.

### T4 — Write the 5 slash commands
- [ ] `/beacon-init` — repo inspection logic + `beacon init` invocation.
- [ ] `/beacon-new` — natural language → command parsing. Cover the 11 doc types.
- [ ] `/beacon-doctor` — `beacon doctor --json` → parse findings → propose actions per finding.
- [ ] `/beacon-explain` — call `beacon lint --explain <name>` first, fall through to `beacon doctor --explain <name>`.
- [ ] `/beacon-archive` — list `docs/plans/*.plan.md`, prompt user to select, call `beacon archive plan <slug>`.

### T5 — `claude-plugin/README.md`
- [ ] What this plugin is, what it does, prerequisites (Beacon optional).
- [ ] Install instructions (exact mechanism from T1).
- [ ] Usage examples for each slash command.
- [ ] How to verify the plugin loaded (`/help`, or whatever Claude Code surfaces).
- [ ] Link back to beacon-docs and ADR-012.

### T6 — Cross-link from main beacon-docs README
- [ ] Add a brief "Claude Code companion plugin" section in the main README pointing to `claude-plugin/README.md`.
- [ ] Mention in the landing page (`site/src/pages/index.astro`) as an optional accelerator for Claude Code users.

### T7 — Validation (manual)
- [ ] Install the plugin locally (`claude plugin install` from local path, or whatever the dev workflow is).
- [ ] Open Claude Code in a Beacon-managed project. Verify the skill auto-loads.
- [ ] Invoke each slash command. Verify the CLI is called correctly and output is handled.
- [ ] Open Claude Code in a Beacon-less directory. Verify the skill switches to advisory mode and recommends installation.
- [ ] Document the test session as an `.eval.md` in `docs/evaluations/`.

### T8 — Release prep
- [ ] Decide initial version (likely `0.1.0` for the plugin — independent of beacon-docs versioning).
- [ ] Tag the plugin release in a way that doesn't conflict with beacon-docs tags (e.g., `claude-plugin-v0.1.0` vs `v0.4.1`).
- [ ] Announce in beacon-docs CHANGELOG.md as a non-CLI release note ("Companion Claude Code plugin v0.1.0 shipped, see claude-plugin/").
- [ ] Update `site/src/pages/index.astro` with a callout banner if launch warrants it.

## Effort estimate

~1-2 sessions for MVP. T1 (research) is the largest unknown; if Claude Code plugin format turns out to require Node code or a complex manifest, scope may grow.

## Open questions (research deliverable from T1)

1. **Distribution mechanism.** Does Claude Code pull plugins from git URLs? Published packages? A custom registry? Does the install command take a subfolder argument?
2. **Manifest schema.** What fields does `plugin.json` require? Versioning constraints? Compatibility declarations?
3. **Skill auto-loading.** What triggers a skill to load automatically (file presence, frontmatter declaration, user invocation)?
4. **Slash command discovery.** How does Claude Code know about new commands after install? Is there a registry refresh, or is it lazy?
5. **Testing.** Is there a standard way to validate skill correctness, or is it manual + production telemetry only?

These are not blockers for the plan — they're the explicit research deliverable of T1. The rest of the plan is scoped against best-guess assumptions that T1 will validate or correct.

## Risk register

- **Plugin format moves.** Claude Code is young; plugin format may change. Mitigation: keep the plugin small and easy to refactor; don't over-invest before format stabilizes.
- **CLI ↔ skill drift.** A new Beacon CLI flag may break a slash command. Mitigation: same-repo PRs can update both atomically; consider a smoke test that pipes `beacon --help` through the skill's expected commands.
- **Adoption uncertainty.** This is a second product surface with zero current adoption. Don't over-invest. MVP first; iterate based on real usage.
