---
description: Manual slash command (invoke explicitly as /beacon:beacon-explain <term>). Looks up a Beacon lint rule, doctor check, or plugin-contributed item and surfaces the verbose explanation. For auto-detected "what does X do" questions about Beacon internals, beacon-workflow handles them instead.
disable-model-invocation: true
allowed-tools:
  - Bash
arguments:
  - term
---

# /beacon:beacon-explain &lt;term&gt;

Renders the verbose explanation for a Beacon lint rule, doctor check, or plugin-contributed item. The CLI is the source of truth — this skill is a thin wrapper that picks the right CLI subcommand and presents the output faithfully.

## The faithful-rendering rule (the most important rule)

**Render the CLI's `--explain` output verbatim in a code block. Do NOT paraphrase, summarize, reshape, or add commentary.**

The user invoked `--explain`. That word is the spec: they want the *explanation*, not your remix of it. Your training knowledge about kebab-case naming, ADR conventions, or doctor patterns is almost certainly less precise than what the CLI maintainer wrote into the rule's `summary`/`why`/`fix` fields.

```
✅ CORRECT response shape:
   "Here's `beacon lint --explain kebab-case`:"
   ```
   [verbatim CLI output, ~30 lines]
   ```

❌ WRONG response shapes:
   - "The kebab-case rule means filenames must be lowercase..."  (paraphrase)
   - "**What it checks:** ... **Why:** ... **Fix:** ..."          (reshape)
   - "This rule is common because URLs are case-sensitive..."     (commentary from training)
```

The user can ALWAYS ask for a summary afterward (*"summarize that in 2 lines"*) — give them the raw first, summarize only on request.

## Decision tree

```
User invoked /beacon:beacon-explain <args>?
  │
  ├─ <args> is empty → ALL-CATALOG mode (see below)
  │
  └─ <args> has a term →
       │
       ├─ Term obviously names a lint rule (suffix-location, kebab-case, etc.) → lint first
       ├─ Term obviously names a doctor check (stale-plans, proposed-adrs, etc.) → doctor first
       └─ Ambiguous / unknown → PARALLEL both in one message
```

## Pattern A — Term provided (the common case)

Run **both** `beacon lint --explain <term>` and `beacon doctor --explain <term>` **in parallel** (single message with two Bash tool calls). They're both read-only, both cheap, and parallel dispatch eliminates the wasted turn of sequential lint-then-doctor.

Then:

| Result | Action |
|---|---|
| Lint succeeds, doctor fails | Render lint output verbatim |
| Doctor succeeds, lint fails | Render doctor output verbatim. Lead with one line: *"This is a `beacon doctor` check, not a lint rule."* (teaches the taxonomy) |
| Both succeed | Render both with a header per section. Unusual but possible if a plugin contributes both. |
| Lint fails with `"Did you mean X?"` suggestion | Run the suggested term in the same turn (don't wait for confirmation — `--explain` is read-only and idempotent). Be transparent: *"The CLI didn't recognize `kebab-cas` and suggested `kebab-case`. Running that now:"* |
| Both fail with no Levenshtein hit | Fall through to the **Unknown term protocol** below |

## Pattern B — No argument (ALL-CATALOG mode)

User invoked `/beacon:beacon-explain` with no term. **This is a legitimate use case** — both CLI commands explicitly support empty arg → full catalog. Don't ask "what do you want to explain?" — the empty arg already answered that.

Run both `beacon lint --explain` and `beacon doctor --explain` in parallel. Present as a single navigable index:

```
**Lint rules** (run `/beacon:beacon-explain <name>` for details):
- name · severity · one-line summary
- ...

**Doctor checks** (run `/beacon:beacon-explain <name>` for details):
- name · area · one-line summary
- ...
```

NOT verbatim concatenation of both CLI outputs (16 blocks, redundant framing, unreadable).

## Unknown term protocol

When both `lint --explain <term>` and `doctor --explain <term>` fail with no Levenshtein suggestion:

1. Tell the user plainly: *"`<term>` isn't a registered lint rule or doctor check, and it's far enough from any real name that the CLI didn't suggest a correction."*
2. Run `beacon lint --explain` + `beacon doctor --explain` (both empty arg) in parallel to get the full catalog
3. Present the catalog as in Pattern B
4. Close with: *"Did you mean one of these?"*

**Do NOT:**
- Hallucinate a plausible-sounding explanation hedged with "I think you might mean..." (people-pleaser hallucination)
- Apologize repeatedly
- Grep the beacon-docs source code looking for the string (over-engineering)
- Ask the user to rephrase without showing them the catalog first

## Compose, don't duplicate

This skill is **invoked manually** via `/beacon:beacon-explain`. It does NOT auto-load for natural-language questions like "what is kebab-case?" — those go through `beacon-workflow` (which may or may not invoke explain depending on context).

If the user asks a plain question that maps to a beacon concept, the right answer is usually to point them at this skill: *"Run `/beacon:beacon-explain kebab-case` for the canonical explanation."* Don't reimplement explain logic in casual responses.

## Rationalization table

| Excuse | Reality |
|---|---|
| "User skims, let me summarize the explainer" | They invoked `--explain`. Word is the spec. Render verbatim. Offer summary on request. |
| "Let me restructure with my own headers (What/Why/Fix)" | The CLI output ALREADY has structure. Re-headers are noise, not value. |
| "Let me add commentary from training knowledge" | Your training is fuzzier than the maintainer's rule definition. Stay out of it. |
| "Try lint first, then doctor if it fails" | Parallel both. Cheap, eliminates wasted turn. |
| "Empty argument is a mistake, let me ask what they want" | No. Empty arg = legitimate catalog request. Run both `--explain` no-args in parallel. |
| "Term not found, let me invent something plausible" | Hallucination wearing helpful clothes. State plainly "not found", show catalog. |
| "Let me grep source to verify the CLI output" | The CLI IS the source of truth. Grep is over-engineering. |
| "Levenshtein suggestion might be wrong, ask user to confirm" | Read-only operation. Run the suggestion transparently. Confirmation theater wastes turns. |

## Red flags — STOP and reconsider

When you catch yourself thinking ANY of these mid-response, pause:

- About to write *"This rule means..."* in your own words → STOP, render CLI output verbatim
- About to call lint and doctor sequentially → STOP, parallel in one message
- About to ask *"what do you want to explain?"* on empty arg → STOP, run both --explain no-args
- About to write a hedged guess for unknown term → STOP, show catalog
- About to grep beacon-docs source code → STOP, trust the CLI

**Each of these means: stop the current action, run the canonical path, then continue.**

## Self-checks

- If CLI exits non-zero in unexpected ways (not "Unknown rule" / "Unknown check"), surface the raw stderr to the user. Don't swallow errors.
- If the user is in a project without `docs/_meta/beacon.config.json`, the CLI works but plugin-explain won't load any plugin-contributed terms. Mention this in the response if the term might be plugin-contributed.
- If the user pastes the explain output back at you asking "what does this mean", THEN summarize — that's their explicit request.
