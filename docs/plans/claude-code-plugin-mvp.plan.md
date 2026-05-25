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

## File structure (revised after T1)

```
beacon-docs/                          ← existing repo
└── claude-plugin/                    ← NEW subfolder
    ├── README.md                     ← user-facing docs for the plugin
    ├── .claude-plugin/
    │   └── plugin.json               ← Claude Code plugin manifest
    └── skills/                       ← skills only — no commands/ folder
        ├── beacon-workflow/
        │   └── SKILL.md              ← main always-available skill
        ├── beacon-init/
        │   └── SKILL.md              ← /beacon:beacon-init
        ├── beacon-new/
        │   └── SKILL.md              ← /beacon:beacon-new <description>
        ├── beacon-doctor/
        │   └── SKILL.md              ← /beacon:beacon-doctor
        ├── beacon-explain/
        │   └── SKILL.md              ← /beacon:beacon-explain <term>
        └── beacon-archive/
            └── SKILL.md              ← /beacon:beacon-archive
```

Key differences from the original (pre-T1) proposal:
- Manifest lives in `.claude-plugin/plugin.json` (not `plugin.json` at the plugin root).
- **No `commands/` folder** — Claude Code unified skills and commands. The modern approach is "skills only"; flat `.md` commands in `commands/` are explicitly legacy. What we proposed as 5 slash commands become 5 invocable skills (each in its own folder with a `SKILL.md`).
- Skills are FOLDERS, not files. The folder name becomes the invocation suffix: `skills/beacon-doctor/SKILL.md` → `/beacon:beacon-doctor`.

Not distributed via `npm publish`. Distribution mechanics covered in the appendix and `Plan revisions` section.

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

### T1 — Research Claude Code plugin format ✅ DONE 2026-05-24
- [x] Locate official Claude Code plugin authoring docs (WebSearch + claude-code-guide agent).
- [x] Identify required `plugin.json` schema fields.
- [x] Confirm slash command file format and discovery mechanism.
- [x] Confirm skill loading rules (auto-load triggers, naming conventions, frontmatter requirements).
- [x] Document findings in this plan as a `Plugin format reference` appendix before continuing.

**Findings summary:** See [appendix](#appendix-plugin-format-reference) at the end of this plan. Three findings materially change the original design and require an ADR addendum or revision (recorded below in `Plan revisions after T1`).

### T2 — Scaffold `claude-plugin/` folder structure ✅ DONE 2026-05-24
- [x] Create `claude-plugin/` at repo root.
- [x] Create `.claude-plugin/plugin.json` with manifest fields (`name: "beacon"`, `version: "0.1.0"`, `description`, `author`, `homepage`, `repository`, `license: "MIT"`, `keywords: [...]`).
- [x] Create `skills/beacon-workflow/SKILL.md` placeholder with valid `description` frontmatter and a T3-pending marker in the body.
- [x] Create `skills/{beacon-init,beacon-new,beacon-doctor,beacon-explain,beacon-archive}/SKILL.md` placeholders with valid frontmatter (description, allowed-tools, arguments where applicable) and T4-pending markers in their bodies.
- [x] Create `claude-plugin/README.md` with install instructions (local `--plugin-dir` path), verification steps, and a usage table referencing the planned skill behavior.

**Validation status:** Structure should be loadable via `claude plugin install --plugin-dir ./claude-plugin` but skills won't do useful work yet — they're placeholders. T7 (validation) will confirm actual install + load behavior. Real skill bodies come in T3 + T4.

### T3 — Write the main skill (`beacon-workflow`) ✅ DONE 2026-05-25
- [x] Frontmatter: `name: beacon-workflow`, `description: ...` (triggers only, no workflow summary per `superpowers:writing-skills` guidance).
- [x] Body sections: mode detection (active/advisory), discovery-first rule, conversational triggers, 5 bridge moments (direct file write, deferral, post-release, no-Beacon, CLI-fail), rationalization table, red flags, self-checks.
- [x] Cross-reference [docs/_meta/convention.md](../_meta/convention.md) implicitly — body references the CLAUDE.md rules and tells Claude to consult convention.md when uncertain.

**TDD trail (followed `superpowers:writing-skills` Iron Law: NO SKILL WITHOUT A FAILING TEST FIRST):**

- **RED phase:** dispatched 5 subagents in parallel with 5 distinct pressure scenarios (existing-ADR collision, direct file-write request, mid-flow deferral, post-release retrospective, advisory mode with no Beacon). Each subagent gave 250-350 word candid baselines documenting specific rationalizations.
- **GREEN phase:** wrote SKILL.md body (~1300 words) addressing the exact rationalizations captured. Body length over the <500 target was justified by 5 distinct bridge patterns + rationalization table + red flags list (all mandated by writing-skills).
- **VERIFY phase:** re-dispatched same 5 scenarios with SKILL.md content loaded in context. All 5 subagents now complied with the skill. Verification surfaced 3 new gaps not in the original baselines: (a) no fallback when `beacon` CLI itself fails, (b) no skeleton template for eval content, (c) "structured-manual mode" missing for users who pick manual over `beacon init`.
- **REFACTOR phase:** added Pattern 5 (CLI-fail fallback), eval skeleton in Pattern 3, and structured-manual mode addendum to Pattern 4. Also added 2 new rationalization-table rows and 2 new red flags.
- **REFACTOR re-verify:** dispatched 2 targeted subagents for the new patterns. Both passed cleanly with explicit self-reports that the new content "names the urge as the failure mode" and prevents the slip.

Final SKILL.md committed at `claude-plugin/skills/beacon-workflow/SKILL.md`. Phase 5 (manual validation by user in fresh Claude Code session) still pending.

**Quality bar established for remaining tasks:** T4 (5 invocable skills) should follow the same TDD discipline — baseline test per skill BEFORE writing body. Skipping this would be a regression in quality.

**Phase 5 finding (manual validation, 2026-05-25):** Test 1 passed bulletproof. Test 2 surfaced an architectural collision: the invocable skill `beacon-new` (placeholder body from T2, with a broad description) was auto-invoked by Claude before `beacon-workflow`, because beacon-new's description matched "create a doc" more specifically. The result: Pattern 1 ("ask one question on suffix collision") did NOT fire — beacon-new silently ran `beacon new plan refactor-auth`, renaming the user's explicit `refactor-auth.md` to `refactor-auth.plan.md`. Convention-correct but bypassed user intent.

**Architectural fix applied (Option A):** added `disable-model-invocation: true` to frontmatter of all 5 invocable skill SKILL.md files, plus narrowed descriptions to declare them as **manual slash commands only**. Now `beacon-workflow` is the only auto-invoked skill in the plugin; `/beacon:beacon-init`, `/beacon:beacon-new`, `/beacon:beacon-doctor`, `/beacon:beacon-explain`, `/beacon:beacon-archive` only fire when the user explicitly invokes them.

**Impact on T4:** when we write the real bodies of the 5 invocable skills, they should still incorporate the relevant bridge moments from beacon-workflow (e.g., beacon-new must handle suffix collisions per Pattern 1) — but they only run when the user opts in via slash, so they're not competing with workflow's auto-invocation.

Tests 3, 4, 5 of Phase 5 are pending (need fresh Claude Code sessions after plugin update).

### T4 — Write the 5 invocable skills (`skills/beacon-*/SKILL.md`)

Note: these are SKILLS, not legacy `commands/*.md`. Each lives in its own folder; invocation becomes `/beacon:beacon-<action>`.

- [ ] `beacon-init` — repo inspection logic + `beacon init` invocation.
- [ ] `beacon-new` — natural language → command parsing. Cover the 11 doc types. Use `arguments: [description]` frontmatter and `$ARGUMENTS` substitution.
- [ ] `beacon-doctor` — call `beacon doctor --json` via Bash, parse findings, propose actions per finding. Declare `allowed-tools: ["Bash"]` in frontmatter to skip permission prompts.
- [ ] `beacon-explain` — call `beacon lint --explain <name>` first, fall through to `beacon doctor --explain <name>`. Arguments: `[term]`.
- [ ] `beacon-archive` — list `docs/plans/*.plan.md` via Bash, prompt user to select, call `beacon archive plan <slug>`.

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
- **Subfolder distribution is not native** *(new — surfaced in T1)*. The default `claude plugin install <name>` does not accept a repo subfolder path. We have to either: (a) use `--plugin-dir` for local dev install only, (b) create a custom marketplace manifest that uses `git-subdir` source type, or (c) eventually split the plugin into its own repo for marketplace submission. See `Plan revisions after T1` below.

## Plan revisions after T1

T1 research surfaced three findings that materially change the original design. Captured here as a delta so the original ADR-012 and pre-T1 plan stay readable.

### Revision 1 — Skills replace slash commands

**Original assumption:** plugin would have 1 skill + 4-5 slash commands in `commands/*.md`.

**Reality:** Claude Code unified skills and commands. The modern approach is "skills only"; flat `commands/*.md` files are legacy. Each "slash command" becomes a skill in its own folder. Skills are invoked via `/plugin-name:skill-name` (e.g., `/beacon:beacon-doctor`).

**Impact on plan:**
- File structure rewritten (above): no `commands/` folder; 6 skills total (1 always-available + 5 invocable).
- T4 task renamed from "Write 5 slash commands" to "Write 5 invocable skills."
- Each invocable skill uses `arguments: [...]` frontmatter and `$ARGUMENTS` / `$0` substitution where needed.
- No effort delta. Same end-user UX (`/beacon:beacon-doctor` works the same as a `/beacon-doctor` slash command would have).

### Revision 2 — No file-presence auto-load triggers

**Original assumption:** the main `beacon-workflow` skill would auto-load when `docs/_meta/beacon.config.json` is detected in cwd.

**Reality:** Claude Code skills auto-load via the model's contextual judgment based on the `description` frontmatter field, NOT via file-presence patterns. There is no configuration like "auto-load when file X exists."

**Impact on plan:**
- The main skill's `description` must be specific enough that Claude reaches for it when the user mentions Beacon-relevant tasks. Example: `"Use whenever the project has beacon-docs installed (look for docs/_meta/beacon.config.json) or when the user asks to create documentation that should follow a convention."`
- We instruct Claude in the skill body to verify Beacon presence by checking for the config file as its first step, then degrade to "advisory mode" if absent.
- This is a slight UX downgrade from the original aspiration (less deterministic auto-loading) but workable.

### Revision 3 — Subfolder distribution requires extra work (revised again after T2 — see "Plan revisions after T2" below)

**Original assumption:** `claude plugin install user/repo` or similar would handle the `claude-plugin/` subfolder transparently.

**Reality (as of T1):** The standard `claude plugin install <name>` command expects marketplace plugins. For a plugin living in a repo subfolder, three theoretical paths were identified:

| Path | What it requires | When to use |
|---|---|---|
| **A. Local dev install** | `claude plugin install --plugin-dir ./claude-plugin/` | Day 1 — for our own testing + early adopters who clone the repo |
| **B. Custom marketplace** | Create `marketplace.json` referencing the plugin via relative path or `git-subdir`. Users add the marketplace, then install. | Once we want broader distribution without splitting the repo |
| **C. Split to standalone repo** | Move `claude-plugin/` to its own GitHub repo, submit to community marketplace | When we're confident the plugin has traction and want frictionless distribution |

**Impact on plan (as written at T1):**
- T7 (validation) was to use path A — local install via `--plugin-dir`.
- T8 (release prep) was to start with path A and document path B as a follow-up.

**Outcome:** Path A turned out to be non-viable in Claude Code v2.1.144 — `--plugin-dir` does not exist as a flag on `claude plugin install`. See [`Plan revisions after T2`](#plan-revisions-after-t2) and [ADR-013](../adr/ADR-013-marketplace-distribution-for-claude-plugin.md) for the corrected distribution model.

ADR-012's "splits to separate repo only when registry requires it" trigger is still the long-term path; T2 reality just moved us to path B sooner than expected.

## Plan revisions after T2

T2 (scaffold + hands-on install validation) shipped two surprising findings that adjust the plan going forward.

### Revision 4 — Path A is unavailable; MVP uses Path B from day 1

**Discovery:** during T2 install testing on Claude Code v2.1.150, `claude plugin install --plugin-dir <path>` returned `error: unknown option '--plugin-dir'`. The current Claude Code CLI only accepts marketplace-resolved plugin names.

**Decision (ADR-013):** ship Path B (custom marketplace at repo root) as the MVP install mechanism. New artifact: `beacon-docs/.claude-plugin/marketplace.json` declaring marketplace name `beacon-docs-plugins` with a single plugin entry pointing to `./claude-plugin`.

**End-user install flow** (now canonical, replaces the `--plugin-dir` flow from earlier plan iterations):

```bash
cd beacon-docs
claude plugin marketplace add ./
claude plugin install beacon@beacon-docs-plugins
```

**Impact on remaining tasks:**

- **T5** (`claude-plugin/README.md`): updated in this same revision to show the marketplace install flow. Old `--plugin-dir` instructions removed.
- **T7** (manual validation): partially complete already — see [`docs/evaluations/2026-05-25-claude-plugin-t2-validation.eval.md`](../evaluations/2026-05-25-claude-plugin-t2-validation.eval.md). The marketplace + install + skill loading + auto-invocation all worked end-to-end on first try.
- **T8** (release prep): the "decide initial version" item is settled (`0.1.0`). The "announce in beacon-docs CHANGELOG" item still pending. The "tag the plugin release" item likely defers until a stable beacon plugin v0.1.0 is meaningful to publish; T3 + T4 fill the skills before that's worth tagging.

ADR-013 captures the full decision rationale, alternatives considered, and validation evidence.

### Revision 5 — T2 validation reduced T3 risk substantially

**Surprising discovery:** the always-available `beacon-workflow` skill auto-invoked correctly on the **first** ADR-relevant conversational prompt in a fresh Claude Code session, with only the placeholder body content from T2. It also composed naturally with `superpowers:brainstorming` (Claude loaded both skills for the task) and triggered Claude to consult existing ADRs + the beacon config before responding.

**Why this matters for T3:**

- The `description` field on the skill is doing more work than expected. Auto-invocation isn't a problem to solve in T3 — it already works.
- T3 can focus 100% on **body depth**: more triggers, advisory mode, persistence-rule reinforcement, examples of conversational patterns Claude should recognize.
- The architectural bet of ADR-012 (skill-level integration with the codebase) is validated. The plugin works *as designed*.

Full observations captured in the linked eval. Recommended for anyone authoring future skills in this plugin to read first.

---

## Appendix — Plugin format reference

Compiled from official Claude Code documentation (last verified 2026-05-24). Sources cited inline.

### Manifest

**Location:** `<plugin-root>/.claude-plugin/plugin.json`

**Required fields:** only `name`.

**Commonly-used optional fields:** `displayName`, `description`, `version` (SemVer string; falls back to git SHA if omitted), `author` (object with `name`, `email`, `url`), `homepage`, `repository`, `license`, `keywords` (array).

**JSON schema:** `https://json.schemastore.org/claude-code-plugin-manifest.json`

**Sources:**
- https://code.claude.com/docs/en/plugins#create-your-first-plugin
- https://code.claude.com/docs/en/plugins-reference#metadata-fields

### Skills (the unified primitive)

**Location:** `<plugin-root>/skills/<skill-name>/SKILL.md`. Skills are folders, not files. Folder name becomes the invocation suffix.

**Frontmatter fields:**
- `description` *(recommended)* — what the skill does. Drives auto-invocation.
- `disable-model-invocation: true` — prevents Claude from auto-invoking.
- `user-invocable: false` — hides from the `/` menu.
- `allowed-tools: ["Bash", "Read", ...]` — grants tools without per-use approval.
- `arguments: [name1, name2, ...]` — declares positional arguments accessible as `$0`, `$1`, or `$ARGUMENTS`.

**Auto-load behavior:** Claude reads all skill descriptions, decides contextually which skill matches the user's task. NO file-presence triggers. Users can always invoke any skill with `/plugin-name:skill-name`.

**Bash & dynamic context:** Skills can embed bash via `` !`command` `` for inline output or ` ```! ` blocks. The `allowed-tools` frontmatter pre-authorizes specific tools.

**Sources:**
- https://code.claude.com/docs/en/skills
- https://code.claude.com/docs/en/skills#frontmatter-reference
- https://code.claude.com/docs/en/skills#inject-dynamic-context

### Slash commands (legacy)

Flat `<plugin-root>/commands/<name>.md` files still work but are explicitly LEGACY. The modern recommendation is to use skills for everything. We follow the modern approach — no `commands/` folder in our plugin.

### Distribution

**Install command:** `claude plugin install <name> [-s user|project|local]`

**Accepted input:** plugin name from a registered marketplace, or `name@marketplace-name`. The `--plugin-dir` flag (for dev) takes a local filesystem path.

**Subfolder distribution:** not directly supported by the standard install command. Workarounds: `--plugin-dir` for local dev, custom marketplace JSON with `git-subdir` source type for production, or split to a standalone repo.

**Marketplaces:**
- `claude-plugins-official` — Anthropic-curated, auto-available.
- `claude-plugins-community` — community-submitted, submit via https://claude.ai/settings/plugins/submit

**Install path:** `~/.claude/plugins/cache/<plugin-id>/`

**Sources:**
- https://code.claude.com/docs/en/plugins-reference#plugin-install
- https://code.claude.com/docs/en/plugins#submit-your-plugin-to-the-community-marketplace
- https://code.claude.com/docs/en/plugins-reference#version-management

### Versioning

`version` field in `plugin.json` (SemVer). Falls back to git commit SHA if omitted (every commit treated as a new version). Updates fire on `/plugin update <name>` or auto-update. No formal compatibility declarations between plugin version and Claude Code version — recommend documenting minimum Claude Code version in the plugin README.

### Reference examples

Anthropic ships 15+ official sample plugins at https://github.com/anthropics/claude-code/tree/main/plugins. Notable for our use case:

- `plugin-dev` — plugin development toolkit. Likely the best reference for "how to structure a plugin with skills."
- `code-review` — automated PR reviews. Pattern reference for a skill that runs CLI tools.

No ready-made starter for "1 plugin with multiple invocable skills" specifically, but the structure is straightforward enough to assemble from the references above.
