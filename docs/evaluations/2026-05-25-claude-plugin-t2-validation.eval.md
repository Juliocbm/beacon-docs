---
title: T2 validation — Claude Code companion plugin install + auto-invocation
date: 2026-05-25
scope: claude-plugin/ — install via local marketplace + skill auto-loading behavior on Claude Code v2.1.150
---

# T2 validation — Claude Code companion plugin install + auto-invocation

## Summary

T2 of the [`claude-code-plugin-mvp` plan](../plans/claude-code-plugin-mvp.plan.md) shipped the scaffolding for the Claude Code companion plugin: a `claude-plugin/` subfolder with manifest, README, and 6 SKILL.md placeholders. The task description was "scaffolding only — skills don't do useful work yet, but the plugin should be loadable."

End-to-end validation performed the same day on Claude Code v2.1.150 / Windows 11 / PowerShell revealed two things:

1. **One concrete blocker** in the originally-planned install path (`--plugin-dir`) which forced a real architectural decision (captured as [ADR-013](../adr/ADR-013-marketplace-distribution-for-claude-plugin.md)).
2. **Six unexpectedly positive findings** about how the plugin actually behaves once installed via the working path. The placeholder skills did substantially more than "load without erroring" — they composed naturally with other plugins, auto-invoked on the first relevant prompt, and triggered Claude to do the right thing without any body content written yet.

This eval captures both for future-self reference and for anyone authoring follow-on skills in this plugin.

## Findings

### Install path discovery (the blocker)

`claude plugin install --plugin-dir <path>` does not exist as a flag in Claude Code v2.1.150. The plan from T1 had assumed this was the MVP install mechanism. Reality forced a switch to the "custom marketplace at repo root" path, which T1 had identified as an option but slotted as the next step *after* `--plugin-dir`.

Switching paths required:
- Creating `beacon-docs/.claude-plugin/marketplace.json` (a new artifact, plus a new `.claude-plugin/` directory at the repo root that did not exist before).
- Updating `claude-plugin/README.md` install instructions.
- Writing ADR-013 to document the decision.

Total switch time: ~30 minutes including research, manifest creation, retries on Windows path quoting, and successful validation. Not a major blocker — but worth noting that *any* T1-level research has limits when the underlying CLI behavior isn't tested hands-on.

**Takeaway:** when implementation involves an external CLI we don't control, validate the actual command interface (not just docs) before assuming installability. T1's research read docs that may have referenced a not-yet-shipped feature, an older feature now removed, or a planned feature in another CLI build. Always do a smoke test of the install command itself before scoping the rest.

### Auto-invocation worked on the first prompt (finding 1 of 6)

After install, I opened a fresh Claude Code session in the beacon-docs directory and typed:

> *"Necesito tomar una decisión sobre qué base de datos usar para este proyecto, postgres o sqlite. Ayúdame a documentarlo."*

Claude's first action — without any explicit `/beacon:*` invocation — was:

```
● Skill(beacon:beacon-workflow)
  ⎿  Successfully loaded skill
```

The skill auto-loaded purely from the `description` field in the SKILL.md frontmatter. No file-presence trigger, no manual invocation, no explicit instruction in the prompt. Claude's contextual judgment was sufficient.

**Why this matters:** the original plan (T1 + T2) listed "no file-presence auto-load triggers" as a constraint to work around, and assumed T3 would need careful description engineering to make auto-invocation reliable. T2 placeholder demonstrates the auto-invocation is already reliable enough for the MVP. T3 can focus on body depth instead.

### Skill composition with brainstorming (finding 2 of 6)

Immediately after loading `beacon:beacon-workflow`, Claude also loaded `superpowers:brainstorming`:

```
● Skill(superpowers:brainstorming)
  ⎿  Successfully loaded skill
```

These two skills come from different plugins (ours and the superpowers plugin), have different scopes (beacon workflow vs. general design dialogue), and cooperated naturally — no conflict, no override, both contributed to the response shape.

**Implication:** Beacon's plugin doesn't need to reimplement brainstorming logic. The composition model means we can write narrow, focused skills and rely on Claude to combine them with other relevant skills the user already has. T3 should NOT try to teach `beacon-workflow` to do brainstorming — that's already covered by superpowers and composing is correct.

### Claude consulted the actual repo context before responding (finding 3 of 6)

Before answering the database question, Claude went and read:

```
Searched for 1 pattern, read 2 files (ctrl+o to expand)
```

…confirming it found 12 existing ADRs and the project config. Only then did it respond — with a substantive observation: *"beacon-docs es una CLI que trabaja 100% sobre el sistema de archivos. Hoy no tiene ninguna capa de base de datos, ni servidor, ni persistencia más allá de archivos en disco."*

**This is the persistence rule from CLAUDE.md activating exactly as designed.** The v0.4.1 behavioral rules say "consult existing decisions before proposing new ones." Without any explicit instruction in the SKILL.md placeholder, Claude did exactly that. The combination of (a) Beacon-generated CLAUDE.md being present in the project root, (b) the plugin skill being active, and (c) Claude's own training to consult context produced the right behavior automatically.

### Premise challenge over blind documentation (finding 4 of 6)

The user prompt explicitly asked Claude to "help document" a Postgres vs SQLite decision. Claude's response did *not* immediately create an ADR. Instead:

> *"Antes de comparar Postgres vs SQLite, necesito entender qué problema te está empujando a meter una base de datos, porque puede que la mejor decisión sea 'ninguna de las dos'. Documentar bien un ADR empieza por el contexto y la fuerza que lo motiva, no por las opciones."*

Claude then surfaced a multiple-choice question with 4 specific options including *"No es beacon-docs en realidad — la decisión es para OTRO proyecto/repo."*

**This is what a good senior engineer does.** A junior assistant would have created `beacon new adr postgres-vs-sqlite` and started typing pros/cons. The skill description nudged Claude toward "ADR-worthy context exploration first, document second." Combined with the brainstorming skill's "explore before deciding" pattern, the result was a high-quality interaction that respected the user's actual context (a CLI that doesn't need a database).

### Plugin manifest validation surfaced one fixable issue (finding 5 of 6)

`claude plugin validate .` (against the marketplace.json) returned:

```
⚠ Found 1 warning:
  ❯ description: No marketplace description provided.
✔ Validation passed with warnings
```

Fixed in the same session by adding a `description` field to marketplace.json. Plugin manifest itself (`claude plugin validate ./claude-plugin`) passed with zero warnings.

**Takeaway:** Claude Code's `validate` subcommand is reliable as a pre-flight check. Recommend running it in CI once the plugin is a v1.0 artifact (captured as future work in ADR-013).

### Install + activation completed in under 90 seconds (finding 6 of 6)

End-to-end clock time from `claude plugin marketplace add ./` to a working `/plugin list` showing `beacon@beacon-docs-plugins v0.1.0 enabled` was approximately 90 seconds, including:

- `marketplace add` — instant
- `plugin install` — ~3 seconds
- closing the previous Claude Code session and opening a fresh one — ~30 seconds (mostly waiting for the prompt)
- `/plugin list` verification — ~5 seconds
- First skill auto-invocation in the validation prompt — ~10 seconds wall-clock from prompt submission to response start

This is well within "five-minute setup" friction tolerance for an MVP install path. If we ever ship an HTTPS-hosted marketplace.json (no clone needed), this drops further.

## Recommendations

### For T3 (immediate next task)

- **Don't over-engineer description-based auto-invocation.** The placeholder description for `beacon-workflow` already works. Refine the description if T3 reveals a specific failure mode, otherwise leave it alone.
- **Do invest in body depth.** Add explicit triggers, advisory-mode logic, conversational patterns, and instructions to consult existing ADRs/plans before responding. The composition with brainstorming is already strong — don't duplicate brainstorming logic.
- **Preserve the "challenge the premise" pattern.** The SKILL.md body should explicitly tell Claude to verify the user's framing of a documentation request before creating files. v0.4.1's persistence rule is necessary but not sufficient — the skill should reinforce "explore context before documenting."

### For T4 (invocable skills bodies)

- Each invocable skill has a different surface; the auto-invocation patterns observed for `beacon-workflow` don't necessarily generalize to `/beacon:beacon-doctor` etc. T4 should validate each invocable skill manually after writing its body.
- The `allowed-tools` declaration in the placeholders is correct (Bash, Read, Glob). T4 should not change these without reason — they pre-authorize the specific tools each skill needs without user prompts.

### For T7 (final validation) — substantially complete already

Most of T7 happened naturally during this T2 validation. What remains:

- Test each of the 5 invocable skills after T4 fills their bodies.
- Test advisory mode by running in a Beacon-less project.
- Test the typo-correction surface (e.g., `/beacon:beacon-explan` if Claude Code allows fuzzy command matching).
- Confirm the `/plugin update` flow when a new plugin version ships.

### For process

- **Validate install hands-on in the same session that scaffolds the artifact.** Don't separate T2 (scaffold) and T7 (validate) by days — by validating end-to-end immediately after T2, we caught the `--plugin-dir` blocker before writing any skill bodies on assumptions that would have been invalidated.
- **Use the working session to write the eval.** Capturing this eval the same day as the validation preserves details that would have been lost in 24 hours (specific PowerShell errors, exact ordering of skill loads, exact Claude phrasing).

### For ADR-013 future work

The "CI validation" item in ADR-013's Future work section becomes more concrete after this eval: a simple `claude plugin validate ./claude-plugin && claude plugin validate .` step in CI would catch the kinds of warnings and errors we hit during T2 validation. Worth adding when the plugin matures past v0.1.0.
