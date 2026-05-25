---
description: Manual slash command (invoke explicitly as /beacon:beacon-doctor). Runs beacon doctor, parses findings, and proposes specific actions per finding (archive a stale plan, accept a stuck ADR, etc.). For auto-detected pre-release moments, beacon-workflow handles them instead.
disable-model-invocation: true
allowed-tools:
  - Bash
  - Read
---

# /beacon:beacon-doctor

Runs `beacon doctor`, parses findings, proposes informed actions per finding, executes only on user confirmation. This skill turns the CLI's text output into an actionable workflow — but every destructive action requires explicit consent.

## Core principle

**Tools propose. Users decide. Agents execute.**

The CLI's `suggestion` field on each finding is a **hypothesis**, not a command. Your job is to (a) parse what the doctor saw, (b) gather enough context to make the proposal informed, (c) ask for confirmation, (d) execute only on yes.

## Mandate: always use `--json`

Run **`beacon doctor --json`**, never plain `beacon doctor`.

The text output is for humans reading their terminal. You need the structured array of `{area, check, target?, observation, suggestion}` objects to iterate over findings and propose specific actions. Parsing pretty-printed text with regex is fragile (CLI formatting can change); JSON is the stable contract.

```bash
beacon doctor --json
```

Reformatting JSON into human-readable output for your reply is trivial — that's what you're already good at. **Rule:** if a CLI offers `--json` and you need to act on the output, use it.

## The all-clear case

When `findings` is empty (or `[]`):

```
✔ All checks passed. (N areas inspected, M findings.)
```

Relay this and **STOP**. No padding. No "while we're here, want me to also run lint?" No preventive-measures suggestions. No offer to schedule periodic re-runs.

The user asked one question; they got the answer. The pull to add padding ("I should earn this turn") is a calibration bug, not a service to the user. A good doctor's visit ends with "you're fine, see you next year" — not invented follow-ups.

## Per-finding flow (the normal case)

For each finding in `findings[]`:

### Step 1 — Group by area, present concisely

Render findings grouped by `area` (activity / decisions / snapshots / balance). Each finding shows:
- The target (file path or "project-wide")
- The observation
- The CLI's suggestion (verbatim, so the user sees what beacon thinks)

```markdown
## Activity (2)

- `docs/plans/old-refactor.plan.md` — unmodified 62 days. Suggestion: archive if shipped.
- `docs/plans/half-baked.plan.md` — unmodified 38 days. Suggestion: archive OR add status note.

## Decisions (1)

- `docs/adr/ADR-007-event-bus.md` — stuck in proposed 22 days. Suggestion: accept, reject, or supersede.

## Balance (1)

- `docs/compliance/` — add-on enabled 45d ago, only README present. Suggestion: disable or populate.
```

### Step 2 — Read context before proposing destructive actions

Before suggesting `beacon archive plan <slug>` or `beacon disable <addon>`, **read the relevant file** to verify the action makes sense:

| Finding | Context to read | Why |
|---|---|---|
| `stale-plans` | The plan file itself | Does it have unchecked TODOs? Is the language "shipped" or "stalled"? Inform the archive proposal |
| `proposed-adrs` | The ADR file | What decision is stuck? Maybe trivial to accept, maybe needs discussion |
| `orphan-readmes` | The folder listing | Confirm truly only README. Maybe a doc was just added but not committed |
| `old-evaluations` | List of newer evals | Confirm no related newer eval exists that the heuristic missed |
| `backlog-balance` | Plans + backlog listing | Verify the imbalance is real, not transient |

Reading is one extra tool call — cheap insurance against "I'm parroting beacon's guess" and forces the proposal to be informed.

### Step 3 — Propose actions; batch only when reversible AND identical

**Batch:** multiple stale plans that all need `beacon archive plan <slug>` → one question grouping them. *"Archive these 3 shipped plans?"*

**Don't batch:** mixed action types or judgment decisions (ADR state, add-on disable, ambiguity between archive vs status-note).

Rule of thumb: **batch only when the remediation is identical AND reversible.** Archives qualify (the move is reversible by hand). ADR state transitions, add-on disables, and ambiguous-action findings need individual asks.

### Step 4 — Await explicit confirmation per action

```
Action: `beacon archive plan old-refactor`
[Wait for user yes/no]
```

The CLI's standard Bash-permission dialog will surface again per command, which is fine — that's defense in depth.

### Step 5 — Handle CLI warnings (especially --force)

`beacon archive` refuses to archive a plan with unchecked `- [ ]` TODOs in its body unless `--force` is passed. Other Beacon commands have similar safety checks.

**`--force` is a SEPARATE consent.** The user's original "yes, archive" was consent to the *normal* path. The CLI then revealed information they didn't have at the time of consent — unchecked TODOs. That changes the decision.

When the CLI returns a `--force`-required warning:

1. **Read the relevant file** (e.g., the plan) to extract the unchecked TODOs
2. **Surface to user**: *"The plan has these N unchecked items: [list]. Archive anyway with --force, address them first, or skip?"*
3. **Wait for user response**. Three valid paths:
   - **Force**: run `beacon archive plan <slug> --force`
   - **Address first**: offer to mark specific checkboxes if user confirms which are done; do NOT auto-check
   - **Skip**: leave the plan active

**Never** silently mark checkboxes to bypass the safety check — that falsifies the plan's state. **Never** auto-force on the original yes.

## The 5 finding types — action playbook

| Check | Likely action | Considerations |
|---|---|---|
| `stale-plans` | `beacon archive plan <slug>` (if shipped) OR add status note (if stalled) | READ the plan first. Ambiguous between archive and status — surface choice. |
| `proposed-adrs` | Edit the ADR's frontmatter `status:` field (no CLI command for this — it's a hand-edit) | READ the ADR. Was the decision actually made? Then accept. Still debating? Add a "still discussing X" status note. |
| `old-evaluations` | `beacon new eval <slug>-refresh` for a new dated snapshot | Don't edit the old one (evals are immutable per rule 6). |
| `orphan-readmes` | `beacon disable <addon>` (if truly unused) OR `beacon new <type> <slug>` to populate | READ the folder listing. Confirm nothing was just added but uncommitted. |
| `backlog-balance` | Mixed: archive shipped plans + capture new backlog items | Walk through the plans first to identify which ARE shipped. May require multiple targeted actions. |

## Compose, don't duplicate

This skill is **invoked manually** via `/beacon:beacon-doctor`. It does NOT auto-load when the user mentions "release" or "health check" in conversation — those go through `beacon-workflow` (which may suggest *"Run `/beacon:beacon-doctor` to see what surfaces"*).

If the user asks a natural-language question like *"Is my docs tree healthy?"*, point them at this skill: *"Run `/beacon:beacon-doctor` for a structured check."*

## Rationalization table

| Excuse | Reality |
|---|---|
| "All clear is too thin — let me suggest preventive measures" | Padding to look useful. Relay clean, stop. |
| "The CLI's `suggestion` field is what I should do" | It's a hypothesis. Read context, propose informed, await consent. |
| "Text output is more human-readable, run it first" | Use `--json` — you need the structure for action proposals. |
| "User said yes to archive, that covers --force too" | No. --force is separate consent. Surface unchecked TODOs, ask again. |
| "Batch all 4 findings into one 'fix all?' question" | Only batch identical-reversible actions. Judgment calls need individual asks. |
| "Auto-mark the unchecked TODOs to bypass --force" | Falsifies plan state. Never. |
| "The doctor said archive, just archive — efficient" | The doctor said it's stale. Whether to archive is your judgment after reading the file. |
| "Read source first to verify the CLI output" | The CLI is the source of truth for findings. Read source files (plans, ADRs), not beacon-docs itself. |

## Red flags — STOP and reconsider

When you catch yourself thinking ANY of these mid-response, pause:

- About to run `beacon doctor` without `--json` → STOP, add `--json`
- About to pad "all clear" with extra suggestions → STOP, relay and end
- About to propose a destructive action without reading the file first → STOP, read first
- About to auto-execute `--force` on a safety-blocked command → STOP, surface the blocker, ask again
- About to silently mark checkboxes to "fix" a plan before archive → STOP, that's falsification
- About to ask "fix all 4?" with heterogeneous findings → STOP, individual asks for judgment items
- About to invent a `suggestion` not in the JSON → STOP, render what the CLI actually returned

**Each of these means: stop the current action, run the canonical path, then continue.**

## Self-checks

- If `beacon doctor --json` exits non-zero with malformed output, surface raw stderr to user. Don't pretend findings array is empty.
- If a finding's `target` references a file that no longer exists (deleted between doctor run and your read), surface this — likely beacon needs re-running.
- After executing approved actions, **offer to re-run `beacon doctor --json`** to confirm the tree is now clean. Don't assume — verify.
- If the project has plugin-contributed checks (visible in `beacon doctor --explain` listing), the finding `check` field may be a plugin name. Treat the same way — read context, propose informed.
