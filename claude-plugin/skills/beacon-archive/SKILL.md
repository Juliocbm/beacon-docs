---
description: Manual slash command (invoke explicitly as /beacon:beacon-archive). Lists active plans (or roadmaps) and helps archive shipped ones with a selection UX. For auto-detected post-shipping moments where a specific plan should be archived, beacon-workflow handles them instead.
disable-model-invocation: true
allowed-tools:
  - Bash
  - Read
  - Glob
---

# /beacon:beacon-archive

Moves shipped plans (and roadmaps) to `_archive/` after surfacing context for informed consent. **This skill performs DESTRUCTIVE filesystem operations** — every action requires the user's explicit confirmation, and `--force` is always a separate consent.

## Core principle

**Read context. Propose informed. Confirm. Execute.**

The CLI's `beacon archive` command moves files between directories. The operation is recoverable via git but annoying to undo, and silently archiving the wrong plan loses days of in-flight context. Every code path in this skill must end with the user's explicit yes before any move happens.

## First action: state detection in parallel

Read the inputs needed for any subsequent decision:

```bash
# 1. What types are archivable in this project?
cat docs/_meta/beacon.config.json | jq '.categories'    # check roadmaps add-on

# 2. What active plans exist?
ls docs/plans/*.plan.md 2>/dev/null

# 3. What active roadmaps exist (if add-on enabled)?
ls docs/roadmaps/*.roadmap.md 2>/dev/null
```

Run these in parallel (single message, multiple tool calls). Then branch based on what you find.

## Detect invocation mode

| User input | Mode |
|---|---|
| `/beacon:beacon-archive` (no arg) | **Selection mode** — list items, let user pick |
| `/beacon:beacon-archive <slug>` | **Direct mode** — propose specific item, confirm once |

## Selection mode (most common)

### Step 1 — Enumerate AND read

Glob for plans and roadmaps in parallel. Then **Read each file in parallel** to get checkbox state. Reading is non-optional — checkbox state is the primary "is this done?" signal; mtime is tiebreaker.

### Step 2 — Empty state

If no active plans (or roadmaps) exist:

```
No active plans to archive.
```

Period. One line. Stop.

**Do NOT** dump `_archive/` contents, **do NOT** suggest "create a plan first", **do NOT** apologize. Empty is an answer, not an absence of one. The "earn the turn by padding" pull is the same calibration bug from `beacon-doctor`'s all-clear case — resist it.

### Step 3 — Single item

If exactly one plan exists:

- Don't ask "which one?" — it's theater. Glob returning 1 result IS the answer.
- Read the plan. Check checkbox state.
- Propose with summary framing:

  ```
  Found one plan: `billing-integration` (47d old, 5/5 boxes checked).
  Running `beacon archive plan billing-integration`. OK to proceed?
  ```

  One confirmation. Execute on yes.

### Step 4 — Multiple items

If multiple items exist, render unified list with type labels and all signals:

```
[plan]    billing-integration   47d   5/5   [SHIPPED?]
[plan]    cleanup-tests         92d   0/3   [STALLED?]
[plan]    migrate-db             8d   3/4   [NEAR-DONE]
[plan]    refactor-auth          2d   0/5   [ACTIVE]
[roadmap] 2026-q1-platform      90d   —     [SHIPPED?]
[roadmap] 2026-q2-mobile        30d   —     [ACTIVE]
```

Notes on the format:
- **Type labels matter.** A unified list without `[plan]`/`[roadmap]` breaks routing (you can't know which `beacon archive <type>` to run). Tag every row.
- **Status hint with `?`.** Status is your inference, not a verdict — the `?` flags it as a hint the user can overrule.
- **Show signals, not just verdict.** mtime + checkbox progress let the user disagree with your inference.

### Step 5 — Split the decision

After presenting, propose:
- **Recommend the obvious**: items with all checkboxes checked → propose archive.
- **Leave the active**: items with recent mtime or 0/N + recent → don't even mention as candidates.
- **Ask about the ambiguous**: stalled items (old + 0/N) could be abandoned OR backlog-worthy; near-done items (N-1 / N) could be "almost done" OR "actually done, just forgot a box".

Example response:

```
I'd archive #1 (billing, 5/5 checked + 47d). #4 (refactor-auth) is clearly
active — leaving it.

Ambiguous:
- #2 cleanup-tests (0/3, 92d stale) — abandoned or backlog material?
- #3 migrate-db (3/4) — one box unchecked. Actually done, or one step left?
- #5 2026-q1-platform roadmap (90d) — shipped or rolling?

Pick which to archive (e.g. "1 and 3" or "all stale ones") or leave individual notes.
```

**Don't batch-propose "archive all stale ones?"** — old ≠ done. Conflating them archives backlog items the user intended to keep.

### Step 6 — Per-item judgment rules

| Signal | Action |
|---|---|
| All checkboxes checked (N/N) | Recommend archive |
| One unchecked (N-1/N) | Don't recommend automatically — ask if last item shipped |
| Zero checked + recent mtime (<30d) | Don't mention — clearly active |
| Zero checked + stale (>30d) | Surface as ambiguous (abandoned vs. backlog material vs. paused) |
| Mixed checked + recent mtime | Active work — leave |
| Mixed checked + stale | Surface ambiguous — could be paused |

**Mtime is the tiebreaker, not the primary signal.** A 100-day-old plan with all boxes checked is more obviously done than a 10-day-old plan with all boxes checked, but both are archivable.

## Direct mode (specific slug)

User invoked: `/beacon:beacon-archive refactor-auth`

The user named the target. Skip selection UX.

1. **Glob to confirm** the slug exists (could be in plans/ or roadmaps/, or be a typo).
2. **Read** the file to get checkbox state.
3. **Propose direct**:

  ```
  Archiving `refactor-auth` (plan, 47d, 5/5 checked). Run `beacon archive plan refactor-auth`?
  ```

4. **If slug not found**: search both folders, surface typo suggestion (use Levenshtein-like proximity, or just list available items).
5. **If checkboxes are unchecked**: still propose normal archive; the CLI's `--force` check will fire later (Step 7 protocol).

## The --force protocol

Mirror of `beacon-doctor`'s `--force` handling. **`--force` is ALWAYS a separate consent.** A user who said "yes, archive" consented to the normal path; `--force` overrides a safety check the CLI deliberately raised.

When `beacon archive plan <slug>` returns:
```
✗ Error: Document has unchecked TODOs. Re-run with --force to archive anyway.
```

### Procedure

1. **Read the plan file** to extract the unchecked TODOs (grep `^- \[ \]` won't capture surrounding context; Read the body).
2. **Show first 5-8 unchecked items with section headers** (e.g., "under `## Migration steps`"). If >8, show count: `(+12 more)`.
3. **Present 3 paths to the user** with no default:

   ```
   El plan `refactor-auth` tiene N TODOs sin marcar:
     - [ ] extraer JWT validator (## Backend)
     - [ ] migrar tokens a httpOnly cookies (## Frontend)
     - [ ] tests E2E (## Verification)
     (+5 more)

   Options:
   - **a) Force-archive** (`--force`): close the plan as-is, unchecked TODOs become historical record. Appropriate if those items no longer apply.
   - **b) Address first**: leave the plan open. You mark/remove items that are actually done; we retry archive without --force. (I will NOT auto-check items.)
   - **c) Cancel**: keep the plan active, no archive.
   ```

4. **Wait for explicit choice. Execute the chosen path.**

### Never auto-tick checkboxes

Marking a TODO complete is a semantic claim that work was done. You have no basis for that claim. If the user picks "address first" and asks for help, **offer to REMOVE items they explicitly identify as no-longer-applicable** — never silently check off remaining ones to bypass the safety rail.

## Roadmap support

The `roadmaps` add-on adds a second archive target. Detection:

| Config state | Folder state | Behavior |
|---|---|---|
| `roadmaps` enabled | `docs/roadmaps/` exists with files | Include in selection list with `[roadmap]` tag |
| `roadmaps` enabled | `docs/roadmaps/` empty | Mention "0 roadmaps active" in empty case |
| `roadmaps` NOT enabled | `docs/roadmaps/` doesn't exist | Skip — no need to mention |
| `roadmaps` NOT enabled | `docs/roadmaps/` exists anyway (unusual) | Surface as warning: *"roadmaps folder present but add-on disabled — skipping. Run `beacon enable roadmaps` to manage."* |

Roadmaps use `beacon archive roadmap <slug>` (not `beacon archive plan`). The type-label tags on the selection list (`[plan]`/`[roadmap]`) carry the routing info.

## Compose, don't duplicate

This skill is **invoked manually** via `/beacon:beacon-archive`. It does NOT auto-load when the user says "el plan ya shipped" in conversation — those go through `beacon-workflow`'s Pattern 2 (deferral/completion triggers) or the post-release Pattern 3 eval flow.

`beacon-workflow` may suggest *"Run `/beacon:beacon-archive` to clear shipped work"* but doesn't run it directly.

## Rationalization table

| Excuse | Reality |
|---|---|
| "Single plan exists — skip the confirmation, just run" | One inferred-target confirmation is the threshold. Skip only when user named the target. |
| "User said yes to archive — `--force` is implied if needed" | No. `--force` overrides a safety rail the CLI deliberately raised. Separate consent. |
| "0/3 checked + 92d old = abandoned, just archive with --force" | Old ≠ done ≠ abandoned. Could be backlog material the user intended to keep. Ask. |
| "Batch propose 'archive all stale ones?' — efficient" | Conflates "stale" with "shipped". Per-item judgment for ambiguous signals. |
| "Empty plans/ → suggest creating a plan or show _archive/ contents" | Empty is the answer. Report and stop. No padding. |
| "Auto-tick the unchecked TODOs to bypass --force check" | Falsifies work-was-done state. Never. (Mirror of doctor skill.) |
| "Default to plan, ignore roadmap as edge case" | Roadmaps are a real type. Read config, present unified list with type labels. |
| "Dump all 20 unchecked TODOs to be thorough" | First 5-8 + count. Dumping buries the decision. |
| "git restore is easy — just archive aggressively" | Recovery cost includes user attention + 'did Claude nuke something?' anxiety. Worth the 3-second confirm. |

## Red flags — STOP and reconsider

When you catch yourself thinking ANY of these mid-response, pause:

- About to run `beacon archive` without reading the plan first → STOP, read for checkbox state
- About to skip the type label on the selection list → STOP, tag every row with `[plan]`/`[roadmap]`
- About to pad "no active plans" with `_archive/` contents → STOP, report and end
- About to batch-archive multiple items in one ask → STOP, split obvious-recommend from ambiguous-ask
- About to auto-`--force` because user said yes once → STOP, surface unchecked TODOs first
- About to silently mark checkboxes to bypass `--force` → STOP, that's falsification
- About to archive a plan with N-1/N checked without asking → STOP, one unchecked = "almost done"
- About to ignore the `roadmaps` add-on because it's "less common" → STOP, read config, include if enabled

**Each of these means: stop the current action, run the canonical path, then continue.**

## Self-checks

- After a successful archive, verify the file is in `_archive/` and surface the new path. Confirms the operation completed.
- If `beacon archive` exits non-zero with an unexpected error (not "Document has unchecked TODOs"), surface raw stderr. Don't swallow.
- If the user's git working tree is dirty before archive, mention it: *"Uncommitted changes detected — the archive move will show up as `rename:` in your next commit, mixed with your other changes."*
- If multiple items were proposed for archive and only some succeeded, surface the partial state explicitly: *"Archived #1, #3. #5 failed (unchecked TODOs). Should I handle #5 separately?"*
- If the user invokes `/beacon:beacon-archive` shortly after archiving (within same session), re-enumerate — they may have created new shipped work to archive in the same flow.
