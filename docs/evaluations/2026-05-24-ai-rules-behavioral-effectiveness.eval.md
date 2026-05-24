---
title: AI rules — behavioral effectiveness audit
date: 2026-05-24
scope: generated AI rule files (CLAUDE.md, AGENTS.md, GEMINI.md, .cursorrules) and the source convention.md
---

# AI rules — behavioral effectiveness audit

## Summary

The AI rule files that Beacon generates (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.cursorrules`, `.cursor/rules/beacon.mdc`) teach AI agents **structure** but not **behavior**. They answer *"if you write an ADR, follow these conventions"* but never *"when should you write an ADR?"*. This is the root cause of the dogfooding gap observed in [2026-05-24-v0-4-0-shipping-retrospective.eval.md](2026-05-24-v0-4-0-shipping-retrospective.eval.md): in three days of intensive development, the AI (me) faithfully created 5 ADRs but only 1 plan, 0 retrospective evals (until prompted), and never added a backlog item to capture deferred scope (also until prompted). The structural rules worked — every doc that was created followed convention perfectly. The behavioral gap is that not enough docs were created in the first place.

**Severity:** moderate. The product works as advertised — Beacon enforces structure when used — but a key value proposition ("AI agents stop creating docs in random places") is incomplete without its complement ("AI agents actually create the docs the project needs"). This affects every project that adopts Beacon, not just this repo.

## Findings

### What the current rules contain

Inventory of `src/generators/ai-rules.ts` and `docs/_meta/convention.md` as of v0.4.0:

| Section | Count | Type | Purpose |
|---|---|---|---|
| Universal rules | 9 | defensive/structural | "Don't duplicate", "kebab-case", "ADRs append-only", "archive don't rename" |
| Project-specific rules | 0-6 (variable by enabled add-ons) | disambiguation | "compliance docs only", "operations is for runbooks not post-mortems" |
| "Where does X go?" table | 6-12 rows | lookup | Question → folder mapping |
| Suffix reference table | 6-12 rows | lookup | Folder → filename suffix |

**Zero rules are behavioral.** Zero say "when X happens in conversation, do Y." Zero describe the lifecycle of a document (when to create, when to update, when to archive). Zero connect Beacon commands (`new`, `archive`, `doctor`) to specific moments in development workflow.

### Evidence from this repo's own development

Tracing the gap in our 3-day, 12-release sprint (data from git log on creation dates):

| Document type | Created | Should have been created (based on what happened in chat) |
|---|---|---|
| ADRs | 5 (one per significant feature) | 5 — ✅ on target |
| Plans | 1 (v0-1-2-polish, written but stale until today) | 4 (one per minor release) — ❌ missed 3 |
| Retrospective evals | 0 (until prompted today by user) | 4 (one per minor) — ❌ missed all 4 |
| Backlog items (new) | 0 (until prompted today) | At minimum 1 (deferred plugin scope from ADR-011) — ❌ missed |
| Pattern docs | 1 (writing-a-plugin) | 1 — ✅ on target |

The AI followed convention perfectly **for the docs it created**. The miss is that it didn't create them. Specifically:

- **Plans:** the AI executed each release directly in conversation ("ok next I'll add the schema, then the loader, then wire it in"). The bite-sized step list lived in conversation memory and TodoWrite, both of which are session-scoped. A persistent `.plan.md` would have survived across sessions.
- **Evals:** after shipping each minor, the conversation moved straight to "what's next?". The reflective pause that produces a retrospective never happened.
- **Backlog:** when ADR-011 said "categories+agents deferred to v0.5+", that scope decision lived only in ADR prose. A `.todo.md` capturing it would have been the natural follow-through.

### Why the current rules failed to trigger this behavior

The current rules are written as **constraints on action**, not **prompts to action**. Consider the difference:

> Current rule: *"ADRs are append-only. Supersede with a new ADR; never edit an accepted one."*
>
> Missing rule: *"When you and the user reach a design decision affecting architecture, dependencies, naming, or future flexibility, write an ADR before implementing. Don't ask permission first — draft the ADR inline and let the user redirect if needed."*

The first tells the AI what NOT to do with an ADR it has already decided to write. The second tells the AI WHEN to decide to write one.

### Categories of missing behavioral rules

Five gaps observed:

1. **Triggers (conversational signals → document creation).** No rule says "when X happens in conversation, propose Y document."
2. **Lifecycle (docs that need ongoing maintenance).** No rule says "when you complete a plan step, check off the checkbox in the same commit."
3. **Cross-references (linking docs together).** No rule says "when a new ADR supersedes an old one, update the old ADR's frontmatter `superseded-by` field too."
4. **Self-checks (using beacon's own tools).** No rule says "run `beacon doctor` before tagging a release" or "run `beacon lint` before committing to docs/."
5. **Conversation hygiene (when chat is the wrong medium).** No rule says "if you find yourself listing 'next steps 1, 2, 3, 4' in a response, that should be a `.plan.md` with checkboxes — chat memory is not persistent."

### Why "more rules = worse" is also a risk

A defensive counterpoint worth naming: AI agents tune out walls of text. The current CLAUDE.md is ~35 lines. Adding 30 more lines of behavioral rules could backfire — the AI starts skimming, the universal rules lose weight. Mitigation:

- Group behavioral rules into a separate clearly-named section ("**Workflow triggers**" or "**When to create documents**") that AI can find by section heading.
- Each rule should be **one sentence + one example**, not paragraphs.
- Connect every rule to a specific beacon command so the rule is actionable, not aspirational.
- Test the change by observing AI behavior in a fresh project after `beacon sync`.

## Recommendations

### A — Add a "Workflow triggers" section to `src/generators/ai-rules.ts`

New function `buildWorkflowTriggers()` rendered into every AI rule file. Proposed content (one sentence + one beacon command per trigger):

```markdown
## Workflow triggers — when to create documents

These are the conversational signals that should prompt you (the AI agent) to create or update Beacon documents. Treat them as imperatives, not suggestions.

- **Design decision made** → write an ADR before implementing. Decisions about architecture, dependencies, naming conventions, or future flexibility belong in `adr/`. Run `beacon new adr <slug>`. Draft the ADR inline; don't ask permission to write it.

- **Multi-step work agreed** → write a plan with checkbox steps. If the user agrees to something that takes 3+ distinct actions, run `beacon new plan <slug>` and write bite-sized steps. Check off each step in the same commit that completes it. Don't keep multi-step work only in chat memory.

- **Scope deferred** → capture it as a backlog item immediately. When the user says "let's do that later", "out of scope for now", "maybe v0.5", or similar, run `beacon new todo <slug>` and write the why + acceptance criteria. Don't let deferred work live only in conversation.

- **Release shipped** → write a dated retrospective eval. After tagging any release worth talking about, run `beacon new eval <slug>-retrospective` and capture what worked, what didn't, what you'd do differently. Even a 10-line eval is better than zero.

- **Approach explained twice** → write a pattern doc. If you find yourself explaining the same technical approach across multiple files or sessions, run `beacon new pattern <slug>` and capture it in `reference/`.

- **System structure changed** → update or add an architecture doc. New module, new layer, new external dependency that affects how the system is shaped — that goes in `architecture/`.
```

### B — Add a "Document lifecycle" section

Distinct from triggers — these rules govern docs that already exist:

```markdown
## Document lifecycle — keeping documents alive

- **Plans must be checked off as you go.** When you complete a step in an active plan, edit the checkbox in the same commit. Don't accumulate weeks of unchecked steps.

- **Plans must archive when shipped.** Run `beacon archive plan <slug>` in the same session that ships the work. Don't leave shipped plans active in `docs/plans/`.

- **ADRs that supersede must link both ways.** When a new ADR supersedes an old one, edit the old ADR's frontmatter `superseded-by` field to point to the new one's number. Both ADRs reference each other.

- **Backlog items graduate to plans, not the other way.** When a backlog item is about to be worked on, create a `.plan.md` and delete the `.todo.md`. Don't let both exist for the same scope.

- **Retrospective evals belong to a moment in time.** Never edit a past eval. If you want to revise observations, create a new dated eval that references the old one.
```

### C — Add a "Self-checks" section

Connect Beacon's own tools to the workflow:

```markdown
## Self-checks — use Beacon on your own work

- **Before committing to `docs/`:** run `beacon lint`. Fix errors. Don't ship docs that fail your own linter.
- **Before tagging a release:** run `beacon doctor`. Address findings or document why they're acceptable.
- **When uncertain where something goes:** run `beacon lint --explain <rule>` or `beacon doctor --explain <check>`. The verbose docs exist for exactly this reason.
- **When in a new directory:** run `beacon about` to verify project type, enabled categories, and AI-file status before assuming structure.
```

### D — Add a "Conversation hygiene" reminder

One short paragraph in the universal rules section:

```markdown
**Persistence rule:** Decisions live in ADRs, multi-step work lives in plans, deferred work lives in backlog, retrospection lives in evals. Chat memory is session-scoped and lost when the conversation ends. If you find yourself relying on chat memory to track a decision, plan, or follow-up — write the document instead.
```

## Risk analysis

### Risks of NOT making this change

- Beacon continues being a structural-only tool. AI agents using it create well-named docs in the right folders **only when prompted**, not proactively. The "AI-first" wedge in the README becomes a softer claim than it should be.
- Future Beacon adopters experience the same dogfooding gap we did. Each project re-discovers that the rules don't trigger doc creation.
- The product's main differentiator vs `.cursorrules` written by hand erodes — handcrafted rules can be opinionated about behavior; Beacon's generated ones are not.

### Risks of making this change

- **AI tune-out.** A 70-line CLAUDE.md may be skimmed where a 35-line one was read. Mitigation: group new rules under bold section headings AI can find via search ("## Workflow triggers", "## Document lifecycle").
- **False positives.** AI proactively writes a `.plan.md` for a 2-step task. Mitigation: thresholds in rule text ("3+ distinct actions" not "any work").
- **Over-correction in our own repo.** Once we ship this, the next dev session will likely produce a flood of plans, evals, and backlog items as the AI catches up. That's actually good signal — but worth being aware of.

### Validation plan

If we ship, validate effectiveness in two ways:

1. **Internal:** open a fresh Claude/Cursor session on a Beacon-managed project (not this one — too contaminated by current conversation context). Ask it to implement a small feature. Observe whether it spontaneously proposes an ADR, plan, backlog item.
2. **External:** after announcing v0.4.1, ask 2-3 beacon-docs users to share their CLAUDE.md and report whether AI behavior changed.

## Recommendation summary

**Ship v0.4.1 with proposals A + B + C + D.** Net change: ~30 lines added to every generated AI rule file, organized into 4 clearly-named sections. Estimated effort: 2-3 hours including tests + a fresh validation session. This is the highest-leverage product improvement currently visible — without it, the next 3 minor releases would be incremental rather than transformative.

**Defer to v0.5+:** project-type-specific behavioral rules (e.g., "cli-tool projects should write a `release-process.guide.md`"). Get the universal behavioral rules right first; specialize later.
