# Documentation Convention

> Single source of truth for the Beacon convention in this project. AI rule files (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.cursorrules`) are generated from this file — run `beacon sync` after editing.

## Project type

`cli-tool`

## Enabled categories

- `reference/` — Replicable technical patterns.
- `architecture/` — System structure and layering decisions.
- `adr/` — Architecture Decision Records.
- `plans/` — Active work with TODOs.
- `backlog/` — Future items waiting to be sprinted.
- `evaluations/` — Date-prefixed audits and snapshots.
- `operations/` — Runbooks and deploy guides.

## Universal rules

1. **One doc = one category.** Never duplicate across folders.
2. **Status via folder, never filename.** Closed plan → `_archive/`, never `*_DONE.md`.
3. **kebab-case for all filenames.**
4. **README required in every category folder.**
5. **ADRs are append-only.** Supersede with a new ADR; never edit an accepted one.
6. **Evaluations are immutable snapshots.** To revise, create a new dated file.
7. **Plans archive to `_archive/` when done.** Never rename.
8. **Generated AI files must match this file.** Run `beacon sync` after editing.
9. **Don't create folders outside this convention.** Run `beacon enable <addon>` or open an ADR.

**Persistence rule:** Decisions live in ADRs, multi-step work lives in plans, deferred work lives in backlog, retrospection lives in evals. Chat memory is session-scoped and lost when the conversation ends. If you find yourself relying on chat memory to track a decision, plan, or follow-up — write the document instead.

## Workflow triggers — when to create documents

These are the conversational signals that should prompt an AI agent (or you) to create or update Beacon documents. Treat them as imperatives, not suggestions.

- **Design decision made** → write an ADR before implementing. Run `beacon new adr <slug>`. Draft inline; don't ask permission.
- **Multi-step work agreed (3+ distinct actions)** → write a plan with checkbox steps. Run `beacon new plan <slug>`. Check off steps in the same commit that completes them.
- **Scope deferred** ("let's do that later", "out of scope for now", "maybe v0.5") → run `beacon new todo <slug>` with *why* + acceptance criteria. Don't leave deferred work in chat only.
- **Release shipped or milestone reached** → write a dated retrospective. Run `beacon new eval <slug>-retrospective`. Even a 10-line eval is better than zero.
- **Approach explained twice** → write a pattern doc. Run `beacon new pattern <slug>` and capture it in `reference/`.
- **System structure changed** → update or add an architecture doc in `architecture/`.

## Document lifecycle

- **Plans must be checked off as you go.** Edit the checkbox in the same commit that completes the step.
- **Plans must archive when shipped.** Run `beacon archive plan <slug>` in the same session that ships the work.
- **ADRs that supersede must link both ways.** Update the old ADR's `superseded-by` frontmatter when adding a successor.
- **Backlog items graduate to plans.** When picked up, create a `.plan.md` and delete the `.todo.md`. Don't let both exist for the same scope.
- **Retrospective evals belong to a moment in time.** Never edit a past eval; create a new dated one if observations change.

## Self-checks

- **Before committing to `docs/`:** run `beacon lint`. Fix errors.
- **Before tagging a release:** run `beacon doctor`. Address findings or document why they're acceptable.
- **When uncertain where something goes:** `beacon lint --explain <rule>` or `beacon doctor --explain <check>`.
- **When in a new directory:** `beacon about` shows project type, categories, AI-file status.

## Suffix table

| Category | Suffix | Notes |
|---|---|---|
| `reference/` | `.pattern.md` |  |
| `architecture/` | `.architecture.md` |  |
| `adr/` | `.md` | Auto-numbered (ADR-NNN-). |
| `plans/` | `.plan.md` |  |
| `backlog/` | `.todo.md` |  |
| `evaluations/` | `.eval.md` | Requires `YYYY-MM-DD-` prefix. |
| `operations/` | `.guide.md` |  |
