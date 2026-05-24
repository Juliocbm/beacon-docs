import { c } from "../ui/colors";
import type { Severity } from "./types";

interface RuleDoc {
  name: string;
  severity: Severity;
  summary: string;
  why: string;
  allowed: string[];
  violations: Array<{ bad: string; good: string }>;
  fix: string;
}

const RULE_DOCS: Record<string, RuleDoc> = {
  "suffix-location": {
    name: "suffix-location",
    severity: "error",
    summary: "Each filename suffix must live in its corresponding category folder.",
    why:
      "The Beacon convention encodes a doc's TYPE in its filename suffix (`.plan.md`, " +
      ".pattern.md, .module.md, etc.) and its CATEGORY in its parent folder. Mixing " +
      "them (a .plan.md in docs/reference/) breaks the mental model and confuses AI " +
      "agents looking up where to find a particular kind of doc.",
    allowed: [
      ".pattern.md   → docs/reference/",
      ".architecture.md → docs/architecture/",
      ".plan.md      → docs/plans/",
      ".todo.md      → docs/backlog/",
      ".eval.md      → docs/evaluations/",
      ".business.md  → docs/business/",
      ".module.md    → docs/modules/",
      ".guide.md     → docs/integrations/ or docs/operations/",
      ".roadmap.md   → docs/roadmaps/",
    ],
    violations: [
      { bad: "docs/reference/billing.plan.md", good: "docs/plans/billing.plan.md" },
      { bad: "docs/plans/auth.pattern.md", good: "docs/reference/auth.pattern.md" },
    ],
    fix: "Move the file to its correct category folder, OR change the suffix to match the folder.",
  },

  "kebab-case": {
    name: "kebab-case",
    severity: "error",
    summary: "Filenames must be kebab-case (lowercase, hyphen-separated).",
    why:
      "AI agents are wildly inconsistent with filename casing (camelCase, snake_case, " +
      "PascalCase, Title Case). Enforcing kebab-case at lint time prevents duplicates " +
      "that differ only in casing (e.g., `MyPlan.md` and `my-plan.md`) and makes file " +
      "lookups predictable for both humans and AI.",
    allowed: [
      "lowercase letters (a-z), digits (0-9), hyphens only",
      "ADR-NNN- prefix is allowed for ADR files (e.g., ADR-015-add-rate-limiting.md)",
      "YYYY-MM-DD- prefix is allowed for eval files",
      "README.md is always allowed",
    ],
    violations: [
      { bad: "docs/plans/MyPlan.plan.md", good: "docs/plans/my-plan.plan.md" },
      { bad: "docs/reference/Multi_Tenancy.pattern.md", good: "docs/reference/multi-tenancy.pattern.md" },
      { bad: "docs/adr/ADR-Auth.md", good: "docs/adr/ADR-001-auth.md" },
    ],
    fix: "Rename the file to lowercase with hyphens. Use `beacon new <type> <slug>` to create files with correct naming.",
  },

  "eval-date-prefix": {
    name: "eval-date-prefix",
    severity: "error",
    summary: "Evaluation files must start with a `YYYY-MM-DD-` date prefix.",
    why:
      "Evaluations are temporal snapshots — they describe the state of something at a " +
      "specific point in time and are intentionally NOT archivable. The date prefix " +
      "makes the snapshot date part of the filename itself, so historical evals sort " +
      "chronologically and stay self-describing forever.",
    allowed: [
      "Pattern: YYYY-MM-DD-<slug>.eval.md",
      "The date must match the actual snapshot date (not today's date if you're documenting a past audit)",
    ],
    violations: [
      { bad: "docs/evaluations/audit.eval.md", good: "docs/evaluations/2026-05-22-audit.eval.md" },
      { bad: "docs/evaluations/frontend-review.eval.md", good: "docs/evaluations/2026-03-14-frontend-review.eval.md" },
    ],
    fix: "Rename the file with a YYYY-MM-DD prefix. Use `beacon new eval <slug>` to create with today's date automatically.",
  },

  "readme-present": {
    name: "readme-present",
    severity: "error",
    summary: "Every enabled category folder must contain a README.md.",
    why:
      "Category READMEs are the navigation entry point — they explain what lives in " +
      "the folder, how to add new docs, and link to related categories. Without them, " +
      "users (and AI agents) browsing the repo have no map of what each folder is for.",
    allowed: [
      "Every category listed in docs/_meta/beacon.config.json must have a docs/<category>/README.md",
      "README.md inside `_archive/` subfolders is optional (not enforced)",
    ],
    violations: [
      { bad: "docs/plans/  (no README.md)", good: "docs/plans/README.md" },
    ],
    fix: "Create the README.md. `beacon init` creates them automatically; `beacon enable <addon>` also creates one when enabling a new add-on.",
  },

  "ai-files-sync": {
    name: "ai-files-sync",
    severity: "error",
    summary: "Generated AI rule files must match `docs/_meta/convention.md`.",
    why:
      "Beacon generates CLAUDE.md, AGENTS.md, GEMINI.md, and .cursorrules from a single " +
      "source of truth (docs/_meta/convention.md). When you edit the convention but " +
      "forget to run `beacon sync`, the AI files drift and start giving stale guidance " +
      "to your AI agents. This rule catches the drift in CI.",
    allowed: [
      "After editing convention.md, run `beacon sync` before committing",
      "CI catches drift if you forget (run `beacon lint --strict`)",
    ],
    violations: [
      { bad: "Edited convention.md but CLAUDE.md is stale", good: "Run `beacon sync` to regenerate all AI files" },
    ],
    fix: "Run `beacon sync`. This regenerates ALL AI rule files atomically from convention.md.",
  },

  "duplicate-titles": {
    name: "duplicate-titles",
    severity: "warning",
    summary: "Two docs in different folders share the same H1 title.",
    why:
      "Duplicate titles usually mean either (a) the same content was forked into two " +
      "places (drift will happen), or (b) two different concepts got the same name " +
      "(confusing for search). Both are worth surfacing for review.",
    allowed: [
      "Each non-archived, non-README doc should have a unique H1 across the entire docs tree",
    ],
    violations: [
      { bad: "docs/plans/foo.plan.md and docs/reference/foo.pattern.md both start with `# Foo`", good: "Rename one of them to something more specific" },
    ],
    fix: "Rename the H1 of one of the conflicting docs to be more specific. If both should truly be the same concept, consolidate into one and link from the other.",
  },

  "long-files": {
    name: "long-files",
    severity: "warning",
    summary: "A doc file exceeds 1000 lines.",
    why:
      "Very long docs are hard to read, hard to search, and often a signal that the doc " +
      "is doing too much (covering multiple topics). Splitting into focused sub-docs " +
      "makes each piece more discoverable and maintainable.",
    allowed: [
      "Default threshold: 1000 lines per file",
      "Consider splitting docs over ~500 lines if they cover multiple distinct topics",
    ],
    violations: [
      { bad: "docs/architecture/system.architecture.md (1450 lines)", good: "Split into system-overview.architecture.md, data-flow.architecture.md, etc." },
    ],
    fix: "Split the doc into multiple smaller files in the same category, each focused on one topic.",
  },

  "folder-size": {
    name: "folder-size",
    severity: "warning",
    summary: "A category folder has more than 30 files.",
    why:
      "When a single folder grows past ~30 files, scanning it becomes painful and the " +
      "folder probably contains multiple logical groupings worth separating. The fix " +
      "is usually to introduce subfolders by domain (backend/, frontend/, database/, etc.) " +
      "or to archive old content.",
    allowed: [
      "Default threshold: 30 files per category folder (excluding README.md and _archive/)",
    ],
    violations: [
      { bad: "docs/reference/ has 47 .pattern.md files", good: "Subdivide into docs/reference/backend/, docs/reference/frontend/, etc." },
    ],
    fix: "Group related files into subfolders. Beacon does NOT enforce a particular subfolder taxonomy — pick one that fits your project.",
  },

  "adr-numbering": {
    name: "adr-numbering",
    severity: "warning",
    summary: "ADR sequence has gaps.",
    why:
      "ADR numbering should ideally be sequential (ADR-001, ADR-002, ADR-003, ...). " +
      "Gaps usually mean someone deleted an ADR — but ADRs are append-only by " +
      "convention and should be SUPERSEDED, not deleted. Intentional gaps from " +
      "rejected proposals are normal and acceptable; this rule warns so you can " +
      "verify the gap is intentional.",
    allowed: [
      "Sequential numbering is preferred but gaps are tolerated as warnings (not errors)",
      "If a gap is intentional (rejected ADR was deleted), no action needed",
    ],
    violations: [
      { bad: "ADR-001, ADR-002, ADR-005 (missing 003, 004)", good: "Either: re-add ADR-003 and ADR-004 with status=superseded, OR accept the gap as intentional" },
    ],
    fix: "If the gap was intentional, ignore the warning (or pass `--strict=false`). If accidental, recreate the missing ADRs with their original numbers and mark `status: superseded`.",
  },

  "stale-plans": {
    name: "stale-plans",
    severity: "suggestion",
    summary: "A plan has not been modified in over 30 days.",
    why:
      "Active plans live in docs/plans/ with checked-off TODOs. A plan untouched for " +
      "30+ days is either (a) shipped and forgotten — should be archived — or (b) " +
      "stalled — should get a status note explaining why. Either way, surfacing it " +
      "prevents the plans folder from becoming a graveyard.",
    allowed: [
      "Default threshold: 30 days since last file modification",
      "Archived plans (under _archive/) are exempt",
    ],
    violations: [
      { bad: "docs/plans/billing-integration.plan.md last modified 47 days ago", good: "Either `beacon archive plan billing-integration` (if shipped) OR add a status note to the doc body" },
    ],
    fix: "If the plan shipped, run `beacon archive plan <slug>`. If it stalled, add a status note explaining why and update the file timestamp by saving it.",
  },

  "adr-status": {
    name: "adr-status",
    severity: "suggestion",
    summary: "An ADR is missing the `status:` frontmatter field.",
    why:
      "ADRs go through lifecycle states: proposed → accepted/rejected → potentially " +
      "superseded. Capturing that state in frontmatter (vs implicit) lets tooling " +
      "(and humans) filter for 'all accepted decisions' or 'all proposed decisions " +
      "stuck for too long' (the `proposed-adrs` doctor check uses this).",
    allowed: [
      "Each ADR file should have `status: <state>` in its YAML frontmatter",
      "Valid states: proposed, accepted, rejected, superseded",
    ],
    violations: [
      { bad: "ADR-007 starts directly with `# ADR-007: ...` (no frontmatter)", good: "Add YAML frontmatter at the top with `status: accepted` (or whichever state applies)" },
    ],
    fix: "Add YAML frontmatter to the ADR with `status: <state>`. Use `beacon new adr <slug>` for new ADRs — it includes the frontmatter automatically.",
  },
};

const SEVERITY_GLYPH: Record<Severity, string> = {
  error: c.red("✗"),
  warning: c.yellow("⚠"),
  suggestion: c.cyan("→"),
};

const SEVERITY_LABEL: Record<Severity, string> = {
  error: c.red("error"),
  warning: c.yellow("warning"),
  suggestion: c.cyan("suggestion"),
};

export function renderRuleExplain(name: string): string | null {
  const doc = RULE_DOCS[name];
  if (!doc) return null;

  const lines: string[] = [];
  lines.push("");
  lines.push(`${SEVERITY_GLYPH[doc.severity]} ${c.bold(`Rule: ${doc.name}`)} ${c.dim(`(severity: ${SEVERITY_LABEL[doc.severity]})`)}`);
  lines.push("");
  lines.push(c.dim(doc.summary));
  lines.push("");
  lines.push(c.bold("Why this rule exists:"));
  lines.push("  " + doc.why.replace(/\n/g, "\n  "));
  lines.push("");
  lines.push(c.bold("Allowed patterns:"));
  for (const a of doc.allowed) {
    lines.push(`  ${c.dim("•")} ${a}`);
  }
  lines.push("");
  lines.push(c.bold("Example violations:"));
  for (const v of doc.violations) {
    lines.push(`  ${c.red("✗")} ${c.dim(v.bad)}`);
    lines.push(`  ${c.green("✓")} ${c.dim(v.good)}`);
    lines.push("");
  }
  lines.push(c.bold("How to fix:"));
  lines.push(`  ${doc.fix}`);
  lines.push("");
  return lines.join("\n");
}

export function listAllRules(): string {
  const lines: string[] = [];
  lines.push("");
  lines.push(c.bold("Available lint rules:"));
  lines.push("");
  const bySeverity: Record<Severity, RuleDoc[]> = { error: [], warning: [], suggestion: [] };
  for (const doc of Object.values(RULE_DOCS)) {
    bySeverity[doc.severity].push(doc);
  }
  for (const sev of ["error", "warning", "suggestion"] as const) {
    lines.push(`${SEVERITY_GLYPH[sev]} ${c.bold(`${sev.charAt(0).toUpperCase() + sev.slice(1)}s`)}`);
    for (const doc of bySeverity[sev]) {
      lines.push(`  ${c.cyan(doc.name.padEnd(20))} ${c.dim(doc.summary)}`);
    }
    lines.push("");
  }
  lines.push(c.dim("Use `beacon lint --explain <rule>` for the full explanation of any rule."));
  return lines.join("\n");
}

export function getAllRuleNames(): string[] {
  return Object.keys(RULE_DOCS);
}
