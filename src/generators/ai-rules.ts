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
