import type { BeaconConfig } from "../core/config";
import { CATEGORY_META } from "../core/categories";

export function buildUniversalRules(): string {
  return [
    "## Universal rules",
    "",
    "1. **One doc = one category.** Never duplicate across folders.",
    "2. **Status via folder, never filename.** Closed plan → `_archive/`, never `*_DONE.md` or `*_v2.md`.",
    "3. **kebab-case for all filenames.** No camelCase, no snake_case, no spaces.",
    "4. **README required in every category folder.**",
    "5. **ADRs are append-only.** Supersede with a new ADR; never edit an accepted one.",
    "6. **Evaluations are immutable snapshots.** To revise, create a new dated file.",
    "7. **Plans archive to `_archive/` when done.** Move them, never rename.",
    "8. **Generated AI files (this one) must match `docs/_meta/convention.md`.** Run `beacon sync` after editing the convention.",
    "9. **Don't create folders outside the convention.** Run `beacon enable <addon>` or propose an ADR.",
    "",
    "**Persistence rule:** Decisions live in ADRs, multi-step work lives in plans, deferred work lives in backlog, retrospection lives in evals. Chat memory is session-scoped and lost when the conversation ends. If you find yourself relying on chat memory to track a decision, plan, or follow-up — write the document instead.",
  ].join("\n");
}

/**
 * Behavioral rules — *when* to create documents, not just where they go.
 *
 * These are the conversational triggers that should prompt an AI agent to
 * proactively create or update Beacon documents. Each trigger maps a
 * conversational signal to a concrete `beacon` command.
 *
 * Rationale: ADR-012 + the 2026-05-24-ai-rules-behavioral-effectiveness eval
 * — the v0.4.0 audit showed the AI followed structural rules perfectly but
 * under-created plans, evals, and backlog items because no rule said *when*.
 */
export function buildWorkflowTriggers(config: BeaconConfig): string {
  const lines = [
    "## Workflow triggers — when to create documents",
    "",
    "These are the conversational signals that should prompt you to create or update Beacon documents. Treat them as imperatives, not suggestions.",
    "",
  ];

  const enabled = new Set(config.categories);

  if (enabled.has("adr")) {
    lines.push(
      "- **Design decision made** → write an ADR before implementing. Decisions about architecture, dependencies, naming conventions, or future flexibility belong in `adr/`. Run `beacon new adr <slug>`. Draft the ADR inline; don't ask permission to write it.",
    );
  }
  if (enabled.has("plans")) {
    lines.push(
      "- **Multi-step work agreed (3+ distinct actions)** → write a plan with checkbox steps. Run `beacon new plan <slug>` and write bite-sized steps. Check off each step in the same commit that completes it. Don't keep multi-step work only in chat memory.",
    );
  }
  if (enabled.has("backlog")) {
    lines.push(
      '- **Scope deferred** → capture it as a backlog item immediately. When the user says "let\'s do that later", "out of scope for now", "maybe v0.5", or similar, run `beacon new todo <slug>` and write the *why* plus acceptance criteria. Don\'t let deferred work live only in conversation.',
    );
  }
  if (enabled.has("evaluations")) {
    lines.push(
      "- **Release shipped or milestone reached** → write a dated retrospective eval. Run `beacon new eval <slug>-retrospective` and capture what worked, what didn't, what you'd do differently. Even a 10-line eval is better than zero.",
    );
  }
  if (enabled.has("reference")) {
    lines.push(
      "- **Approach explained twice** → write a pattern doc. If you find yourself explaining the same technical approach across multiple files or sessions, run `beacon new pattern <slug>` and capture it in `reference/`.",
    );
  }
  if (enabled.has("architecture")) {
    lines.push(
      "- **System structure changed** → update or add an architecture doc. New module, new layer, new external dependency that affects how the system is shaped — that goes in `architecture/`.",
    );
  }

  return lines.join("\n");
}

/**
 * Lifecycle rules — keeping documents alive after creation.
 */
export function buildLifecycleRules(config: BeaconConfig): string {
  const lines = [
    "## Document lifecycle — keeping documents alive",
    "",
  ];

  const enabled = new Set(config.categories);

  if (enabled.has("plans")) {
    lines.push(
      "- **Plans must be checked off as you go.** When you complete a step in an active plan, edit the checkbox in the same commit. Don't accumulate weeks of unchecked steps.",
    );
    lines.push(
      "- **Plans must archive when shipped.** Run `beacon archive plan <slug>` in the same session that ships the work. Don't leave shipped plans active in `docs/plans/`.",
    );
  }
  if (enabled.has("adr")) {
    lines.push(
      "- **ADRs that supersede must link both ways.** When a new ADR supersedes an old one, edit the old ADR's frontmatter `superseded-by` field to point to the new one. Both ADRs must reference each other.",
    );
  }
  if (enabled.has("backlog") && enabled.has("plans")) {
    lines.push(
      "- **Backlog items graduate to plans, not the other way.** When a backlog item is about to be worked on, create a `.plan.md` and delete the `.todo.md`. Don't let both exist for the same scope.",
    );
  }
  if (enabled.has("evaluations")) {
    lines.push(
      "- **Retrospective evals belong to a moment in time.** Never edit a past eval. To revise observations, create a new dated eval that references the old one.",
    );
  }

  // If no lifecycle-relevant categories are enabled, skip the section entirely.
  if (lines.length === 2) return "";
  return lines.join("\n");
}

/**
 * Self-check rules — use Beacon's own tools as forcing functions.
 */
export function buildSelfChecks(): string {
  return [
    "## Self-checks — use Beacon on your own work",
    "",
    "- **Before committing to `docs/`:** run `beacon lint`. Fix errors. Don't ship docs that fail your own linter.",
    "- **Before tagging a release:** run `beacon doctor`. Address findings or document why they're acceptable.",
    "- **When uncertain where something goes:** run `beacon lint --explain <rule>` or `beacon doctor --explain <check>`. The verbose docs exist for exactly this reason.",
    "- **When in a new directory:** run `beacon about` to verify project type, enabled categories, and AI-file status before assuming structure.",
  ].join("\n");
}

const PROJECT_SPECIFIC_RULES: Record<string, string> = {
  compliance: "- **`compliance/`** — regulatory docs only. Link from related modules/architecture; never duplicate.",
  modules: "- **`modules/`** — domain logic per module. Technical patterns extracted from a module go in `reference/`, not here.",
  integrations: "- **`integrations/*.guide.md`** — setup for external services (Stripe, email, etc.). Code patterns for *using* them go in `reference/`.",
  business: "- **`business/*.business.md`** — strategy, pricing, product model. No technical content.",
  operations: "- **`operations/*.guide.md`** — deploy guides, admin runbooks, troubleshooting. Post-mortems go in `evaluations/`.",
  roadmaps: "- **`roadmaps/*.roadmap.md`** — multi-sprint planning. Individual sprint work goes in `plans/`.",
};

export function buildProjectSpecificRules(config: BeaconConfig): string {
  const lines: string[] = ["## Project-specific rules", ""];
  let any = false;
  for (const c of config.categories) {
    if (PROJECT_SPECIFIC_RULES[c]) {
      lines.push(PROJECT_SPECIFIC_RULES[c]);
      any = true;
    }
  }
  if (!any) {
    lines.push("- (none for this project)");
  }
  return lines.join("\n");
}

const DECISION_ROWS: Record<string, string> = {
  reference: '| "How is X done technically?" | `reference/` |',
  architecture: '| "How is the system structured?" | `architecture/` |',
  adr: '| "Why was X decided?" | `adr/` |',
  modules: '| "What does module X do?" | `modules/` |',
  compliance: '| "Does X comply with regulation Y?" | `compliance/` |',
  integrations: '| "How do I set up service X?" | `integrations/` |',
  operations: '| "How do I deploy/administer X?" | `operations/` |',
  business: '| "What is the business model?" | `business/` |',
  plans: '| "What is being built right now?" | `plans/` |',
  roadmaps: '| "What is planned for next quarter?" | `roadmaps/` |',
  backlog: '| "What is on the future backlog?" | `backlog/` |',
  evaluations: '| "What was the state at date X?" | `evaluations/` |',
};

export function buildDecisionTable(config: BeaconConfig): string {
  const lines = [
    "## Where does X go?",
    "",
    "| Question | Folder |",
    "|---|---|",
  ];
  for (const c of config.categories) {
    if (DECISION_ROWS[c]) lines.push(DECISION_ROWS[c]);
  }
  return lines.join("\n");
}

export function buildSuffixTable(config: BeaconConfig): string {
  const lines = ["## Suffix reference", "", "| Folder | Suffix |", "|---|---|"];
  for (const c of config.categories) {
    lines.push(`| \`${c}/\` | \`${CATEGORY_META[c].suffix}\` |`);
  }
  return lines.join("\n");
}
