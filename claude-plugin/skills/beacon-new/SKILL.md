---
description: Manual slash command (invoke explicitly as /beacon:beacon-new <description>). Translates a natural-language description into a beacon new <type> <slug> invocation. For auto-detected doc creation triggers, beacon-workflow handles them instead.
disable-model-invocation: true
allowed-tools:
  - Bash
  - Read
arguments:
  - description
---

# /beacon:beacon-new &lt;description&gt;

Creates a new Beacon document by parsing a natural-language description into a `beacon new <type> <slug>` invocation. Handles type inference, slug extraction, add-on availability checks, and — critically — the explicit-path-vs-convention tension that produced the Option A architectural fix.

## Core principle

**Translate deterministically. Echo before execute. Ask only when genuinely ambiguous.**

The user invoked a slash command — they expect action, not a confirmation gauntlet. But silent lossy translation (dropping words from the slug, picking the wrong type on ambiguous input, silently renaming explicit paths) is worse than one extra turn. The line: act on clear input, ask on ambiguous input, NEVER silently transform what the user typed.

## Detection: description mode vs path mode

First, classify the `$ARGUMENTS` input:

| Input shape | Mode | Behavior |
|---|---|---|
| Starts with `docs/` or contains `/` | **Path mode** | Treat as explicit path → check suffix vs convention → ask if mismatch |
| Free-text description, no path separator | **Description mode** | Parse type + slug, optionally ask, then execute |

Path mode is the **Pattern 1 integration** — the most important branch of this skill.

## Path mode (the critical case)

User invoked: `/beacon:beacon-new docs/plans/refactor-auth.md`

The user typed a literal file path. They could have typed `/beacon:beacon-new refactor-auth plan` and gotten convention-compliant naming. Choosing a literal path is a SIGNAL of intent, not a hint to be helpful about.

### The rule

**An explicit literal path from the user is a stronger signal than a convention.** When the path conflicts with the convention's suffix, ASK — do not silently apply the convention.

### Specifically

1. **Extract** the apparent type from the folder (`docs/plans/` → type `plan`).
2. **Compare** the user's filename suffix against the convention's required suffix for that type:
   - plans → `.plan.md`
   - patterns → `.pattern.md`
   - architecture → `.architecture.md`
   - module → `.module.md`
   - business → `.business.md`
   - guide → `.guide.md`
   - roadmap → `.roadmap.md`
   - todo → `.todo.md`
   - eval → `.eval.md` (also requires `YYYY-MM-DD-` prefix)
   - adr → `.md` (with `ADR-NNN-` prefix)
   - compliance → `.md` (no suffix)
3. **If suffix matches** → run `beacon new <type> <slug>` (slug extracted from filename minus suffix). Echo the command.
4. **If suffix mismatches** → ASK. Exactly this shape:

```
You passed `docs/plans/refactor-auth.md`, but the beacon convention for
plans is the `.plan.md` suffix (rule 2 in CLAUDE.md, enforced by `beacon lint`).
Two options:
  A. Generate `docs/plans/refactor-auth.plan.md` via `beacon new plan refactor-auth`
     (convention-compliant, will pass lint)
  B. Create the literal `docs/plans/refactor-auth.md` via Write
     (matches your input exactly, will FAIL lint until renamed)
Which did you mean? If unsure, A is the safe default.
```

5. **Wait for response. Execute the chosen path.** If user picks B, also note: *"This will fail `beacon lint` — fix by renaming to `.plan.md` later."*

### Why this matters

Silent transformation conflates two distinct intents:
- *"Make me a plan, do it right"* → use `beacon new plan <slug>`, accept `.plan.md`
- *"Create this file at this path"* → literal `Write`, suffix and all

A user who wanted the first would have typed a slug or description. Typing a full path with a specific suffix is evidence of the second intent (or a mistake — which a clarifying question catches either way).

**Historical context:** the placeholder version of this skill silently chose option A above, renaming the user's `refactor-auth.md` to `refactor-auth.plan.md` without asking. That triggered the Option A architectural REFACTOR (disable-model-invocation on invocable skills). The architectural fix prevents auto-loading; this body prevents the silent-transform behavior when explicitly invoked.

## Description mode

User invoked: `/beacon:beacon-new plan to refactor the auth module` (or similar free-text).

### Step 1 — Parse type

Look for a type keyword in the description. Direct mappings (case-insensitive):

| Keyword | Type |
|---|---|
| "plan" | plan |
| "adr", "decision", "decidí", "vamos con" | adr |
| "pattern", "patrón" | pattern |
| "architecture", "arquitectura" | architecture |
| "module", "módulo" | module |
| "guide", "guía", "runbook" | guide |
| "roadmap" | roadmap |
| "todo", "backlog", "later", "deferred", "más adelante" | todo |
| "eval", "evaluation", "retrospective", "audit", "snapshot" | eval |
| "business" | business |
| "compliance", "regulation" | compliance |

**If exactly one keyword matched → commit to that type.** Echo and proceed.

**If no keyword matched** → see Step 1b below.

**If multiple keywords matched** (rare — e.g., "plan for adr decision") → ASK the user with a 2-option menu.

### Step 1b — No type keyword (just topic)

User gave a topic without a type signal: `/beacon:beacon-new password reset email handling`

**Don't default to `plan` or any type.** Word choice gives weak prior, not signal.

Present a **shortlist of 3-4 likely candidates** with one-line consequences each. NOT all 11 types:

```
"password reset email handling" — which doc type?

  1. plan        — active multi-step work (e.g., build password reset feature)
  2. pattern     — replicable approach (how we handle reset emails across products)
  3. architecture — system design of the email-handling subsystem
  4. adr         — decision about email delivery service for reset flow

Or another type (todo, eval, guide, module, ...) — just say which.
```

Pick the shortlist by considering the topic: implementation-flavored topics favor plan/pattern/architecture; decision-flavored favor adr; deferred-flavored favor todo.

### Step 2 — Parse slug

Take the description, drop the type keyword if it appeared first, drop stopwords (the, to, a, for, in, on, of), and kebab-case the remainder.

**Preserve user's content. Do not shorten silently.**

- `"plan to refactor the auth module"` → slug: `refactor-auth-module` (not `refactor-auth` — preserve "module")
- `"adr for using postgres over sqlite"` → slug: `using-postgres-over-sqlite`
- `"todo for password reset"` → slug: `password-reset`

If the slug ends up >40 chars, ask: *"Slug is long: `<slug>`. Use as-is or shorter?"*

### Step 3 — Pre-execution checks

Before running `beacon new`:

1. **Read** `docs/_meta/beacon.config.json` to see enabled categories.
2. **Verify** the type's category is enabled:
   - Core types (plan, adr, pattern, architecture, todo, eval) are always enabled — skip check.
   - Add-on types (module, business, compliance, roadmap, integrations, operations) require the add-on to be in `config.categories`.
3. **If add-on not enabled** → tell user, suggest `beacon enable <addon>`, stop. Don't try to run.

### Step 4 — Guide special handling

The `guide` type requires `--category integrations` or `--category operations`. Both are add-ons.

| State | Action |
|---|---|
| Both enabled | ASK: *"integrations or operations? (deploy runbook → operations; setup of external service → integrations)"* |
| Only one enabled | Use the enabled one. Mention: *"Only `<category>` is enabled. If you meant the other, run `beacon enable <other>` first."* |
| Neither enabled | Suggest `beacon enable integrations` (or operations), stop. |

### Step 5 — Echo and execute

For unambiguous translations, do NOT ask "confirm?" — just echo + run:

```
Creating: `beacon new plan refactor-auth-module`
[Bash: beacon new plan refactor-auth-module]
✓ Created docs/plans/refactor-auth-module.plan.md
```

Then optionally read the file and offer to draft initial content:

> *"File scaffolded with empty frontmatter. Want me to draft a Goal + initial TODOs based on your description?"*

For ambiguous inputs (Step 1b shortlist, multi-keyword, suffix mismatch), don't skip the ask.

## The 11 doc types — reference

| Type | Folder | Suffix | Add-on required |
|---|---|---|---|
| `plan` | `docs/plans/` | `.plan.md` | no (core) |
| `adr` | `docs/adr/` | `.md` with ADR-NNN- prefix | no (core) |
| `pattern` | `docs/reference/` | `.pattern.md` | no (core) |
| `architecture` | `docs/architecture/` | `.architecture.md` | no (core) |
| `todo` | `docs/backlog/` | `.todo.md` | no (core) |
| `eval` | `docs/evaluations/` | `.eval.md` with YYYY-MM-DD- prefix | no (core) |
| `module` | `docs/modules/` | `.module.md` | `modules` add-on |
| `business` | `docs/business/` | `.business.md` | `business` add-on |
| `compliance` | `docs/compliance/` | `.md` | `compliance` add-on |
| `guide` | `docs/integrations/` OR `docs/operations/` | `.guide.md` | `integrations` and/or `operations` add-on |
| `roadmap` | `docs/roadmaps/` | `.roadmap.md` | `roadmaps` add-on |

## Compose, don't duplicate

This skill handles **explicit invocation of `/beacon:beacon-new`**. It does NOT auto-load when the user mentions "let's create a plan" in conversation — those go through `beacon-workflow`'s triggers (which may suggest *"Run `/beacon:beacon-new <description>` for fast creation"*).

Path-mode handling here mirrors workflow's Pattern 1. The two skills agree on the rule: literal user paths get a clarifying question on suffix mismatch, never silent transformation. This is the architectural lesson from Option A REFACTOR encoded in two places.

## Rationalization table

| Excuse | Reality |
|---|---|
| "Translate liberally and run with best guess" | Echo before execute. Don't drop words from slug silently. |
| "User invoked beacon, so apply convention silently to their explicit path" | **THE OPTION A FAILURE MODE.** Literal path = literal intent. Ask before transforming. |
| "User said 'doc about Stripe' — let me just default to ADR" | ADR is the heaviest type (immutable). Wrong default. Present 3-4 candidate shortlist. |
| "Default to plan because it's most common" | Wrong-type doc requires archive+recreate. Ask is cheaper. |
| "Skip the config read, the CLI will tell me if add-on is missing" | Config read is one tool call. CLI failure is a wasted turn + user-facing error. |
| "Guide can default to operations since 'deploying' sounds operational" | Intent ambiguity isn't config ambiguity. Both enabled → ask. |
| "Slug 'refactor-auth-module' is too long, shorten to 'refactor-auth'" | Don't shorten user input silently. Preserve their words. |
| "Echo + run looks slow; just run silently and report after" | Echo is one line. Silent runs hide mistakes until they're already done. |
| "Suffix collision? Just rename to convention, it's only a rename" | "It's only a rename" is a tell. Stop and ask. |

## Red flags — STOP and reconsider

When you catch yourself thinking ANY of these mid-response, pause:

- About to silently transform an explicit user path → STOP, ask the Pattern 1 question
- About to drop a word from the slug to make it shorter → STOP, preserve user content
- About to default to a type on ambiguous input → STOP, present shortlist
- About to run `beacon new <addon-type>` without checking config → STOP, read config first
- About to default to `operations` (or `integrations`) for guide without checking config → STOP, follow guide protocol
- About to skip the echo line and just run → STOP, echo first
- About to ask "confirm?" on unambiguous input → STOP, echo + run is the answer (no ask)

**Each of these means: stop the current action, run the canonical path, then continue.**

## Self-checks

- After running `beacon new`, **read the created file** and surface its path to the user. Confirms the operation succeeded and shows them where it landed.
- If the user's description suggests a workflow that crosses doc types (e.g., "an ADR + a plan + a backlog item for X"), offer to chain multiple `beacon new` calls but ask first — that's a sequence, not a single command.
- If the user re-invokes `/beacon:beacon-new` with the same description seconds after a successful creation, surface the existing file rather than creating a duplicate.
- If `beacon new` exits non-zero with an unexpected error (not "add-on missing" / "invalid type"), surface raw stderr to user. Don't swallow.
