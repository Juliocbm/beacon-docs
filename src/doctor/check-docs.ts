import { c } from "../ui/colors";
import type { Area } from "./types";

interface CheckDoc {
  name: string;
  area: Area;
  summary: string;
  why: string;
  triggers: string[];
  example: { observation: string; suggestion: string };
  notFlaggedWhen: string[];
}

const CHECK_DOCS: Record<string, CheckDoc> = {
  "stale-plans": {
    name: "stale-plans",
    area: "activity",
    summary: "Plan files that have not been modified in over 30 days.",
    why:
      "Active plans live in docs/plans/ with checked-off TODOs as work progresses. A plan " +
      "untouched for 30+ days is either (a) shipped and forgotten — should be archived to " +
      "docs/plans/_archive/ — or (b) stalled and needs a status note. Either way, surfacing " +
      "it prevents the plans folder from becoming a graveyard of half-finished work.",
    triggers: [
      "File mtime is ≥ 30 days older than now",
      "File lives under docs/plans/ (not under _archive/)",
      "File ends with .plan.md",
    ],
    example: {
      observation: "Last modified 47 days ago.",
      suggestion:
        "If the plan shipped, run `beacon archive plan <slug>`. If it stalled, add a status note explaining why.",
    },
    notFlaggedWhen: [
      "The plan lives under docs/plans/_archive/ (already archived)",
      "The plan was modified in the last 30 days",
      "The file is README.md (not a plan)",
    ],
  },

  "proposed-adrs": {
    name: "proposed-adrs",
    area: "decisions",
    summary: "ADRs stuck in `status: proposed` for over 14 days.",
    why:
      "ADRs go through lifecycle states: proposed → accepted/rejected → potentially superseded. " +
      "When an ADR sits at `proposed` for two weeks, it usually means either the discussion " +
      "stalled or the team moved on without updating the doc. Both are worth surfacing so the " +
      "decision either gets recorded or explicitly deferred with a status note.",
    triggers: [
      "ADR has `status: proposed` in YAML frontmatter",
      "Frontmatter `date` field is ≥ 14 days ago (falls back to file mtime if missing)",
    ],
    example: {
      observation: 'Stuck in "proposed" for 22 days.',
      suggestion:
        "Accept it, reject it, or update the ADR with a status note explaining why a decision is still pending.",
    },
    notFlaggedWhen: [
      "Status is accepted, rejected, or superseded",
      "Frontmatter date is within the last 14 days",
      "ADR is README.md or lives under _archive/",
    ],
  },

  "old-evaluations": {
    name: "old-evaluations",
    area: "snapshots",
    summary:
      "Evaluation snapshots that are over 6 months old AND no newer evaluation refreshes the same topic.",
    why:
      "Evaluations document the state of something at a specific point in time. After six months " +
      "the underlying state has usually drifted — but if a newer eval already covers the same " +
      "topic (matched by slug substring), the old one is just historical record and shouldn't be " +
      "flagged. This check surfaces topics that haven't been re-audited in too long.",
    triggers: [
      "Eval file matches the pattern YYYY-MM-DD-<slug>.eval.md",
      "Date in filename is ≥ 6 months ago",
      "No other eval with a substring-matching slug has a more recent date",
    ],
    example: {
      observation: "Last evaluation on this topic is 245 days old.",
      suggestion:
        "Create a refreshed snapshot with `beacon new eval <slug>` if the underlying state has changed.",
    },
    notFlaggedWhen: [
      "A newer eval with similar slug already refreshes the topic (substring match)",
      "The eval is less than 6 months old",
      "The file does not follow the YYYY-MM-DD prefix pattern",
    ],
  },

  "orphan-readmes": {
    name: "orphan-readmes",
    area: "balance",
    summary:
      "Add-on category folders enabled in config but containing only their auto-generated README.",
    why:
      "When you enable an add-on with `beacon enable <addon>`, Beacon scaffolds the folder and a " +
      "README. If 30+ days later the folder still has nothing but that README, you probably either " +
      "(a) opted in speculatively and never used it, or (b) the AI agent skipped using it. Either way " +
      "it's noise — disable the add-on or start using it. Core categories (reference/adr/plans/...) " +
      "are intentionally exempt: they're expected even when empty.",
    triggers: [
      "Category is an add-on (compliance, business, modules, integrations, operations, roadmaps)",
      "Category is listed in `categories` in `beacon.config.json`",
      "Folder contains only README.md (no other docs; `_archive/` alone doesn't count as content)",
      "README.md mtime is ≥ 30 days ago (threshold: `orphanReadmeDays`)",
    ],
    example: {
      observation: "Add-on enabled 45 days ago but folder still only contains README.md.",
      suggestion:
        "If you don't need this category, run `beacon disable <addon>`. Otherwise add at least one doc (`beacon new <type> <slug>`).",
    },
    notFlaggedWhen: [
      "The add-on was enabled less than 30 days ago (give it time to be used)",
      "The folder contains any non-README doc",
      "The category is a core category (reference, architecture, adr, plans, backlog, evaluations)",
    ],
  },

  "backlog-balance": {
    name: "backlog-balance",
    area: "balance",
    summary:
      "Active plans count > 5 with empty backlog, OR plans:backlog ratio > 5:1.",
    why:
      "A healthy planning rhythm keeps roughly one future idea (backlog item) for every five " +
      "things you're actively building (plans). When backlog stays empty while plans pile up, " +
      "it usually means either (a) finished plans aren't being archived, or (b) the team is " +
      "operating reactively without capturing forward-looking ideas. This check is a soft " +
      "nudge to maintain that balance — not a hard rule.",
    triggers: [
      "Active (non-archived, non-README) plans count > 5",
      "AND either backlog is empty OR plans/backlog ratio > 5",
    ],
    example: {
      observation: "12 active plans, 1 backlog items.",
      suggestion:
        "Convert finished plans to archived (`beacon archive plan <slug>`) and capture future work as backlog items (`beacon new todo <slug>`) to keep planning sustainable.",
    },
    notFlaggedWhen: [
      "Active plans ≤ 5 (no signal yet — too few data points)",
      "Plans:backlog ratio is healthy (≤ 5:1)",
    ],
  },
};

const AREA_LABEL: Record<Area, string> = {
  activity: "Activity",
  decisions: "Decisions",
  snapshots: "Snapshots",
  balance: "Balance",
};

const AREA_GLYPH: Record<Area, string> = {
  activity: c.cyan("◉"),
  decisions: c.magenta("◇"),
  snapshots: c.blue("◈"),
  balance: c.yellow("◐"),
};

export function renderCheckExplain(name: string): string | null {
  const doc = CHECK_DOCS[name];
  if (!doc) return null;

  const lines: string[] = [];
  lines.push("");
  lines.push(
    `${AREA_GLYPH[doc.area]} ${c.bold(`Check: ${doc.name}`)} ${c.dim(`(area: ${AREA_LABEL[doc.area]})`)}`,
  );
  lines.push("");
  lines.push(c.dim(doc.summary));
  lines.push("");
  lines.push(c.bold("Why this check exists:"));
  lines.push("  " + doc.why.replace(/\n/g, "\n  "));
  lines.push("");
  lines.push(c.bold("Triggers when:"));
  for (const t of doc.triggers) {
    lines.push(`  ${c.dim("•")} ${t}`);
  }
  lines.push("");
  lines.push(c.bold("Example finding:"));
  lines.push(`  ${c.cyan("observation")}: ${doc.example.observation}`);
  lines.push(`  ${c.cyan("suggestion")}:  ${c.dim(doc.example.suggestion)}`);
  lines.push("");
  lines.push(c.bold("Not flagged when:"));
  for (const n of doc.notFlaggedWhen) {
    lines.push(`  ${c.dim("•")} ${n}`);
  }
  lines.push("");
  return lines.join("\n");
}

export function listAllChecks(): string {
  const lines: string[] = [];
  lines.push("");
  lines.push(c.bold("Available doctor checks:"));
  lines.push("");
  const byArea: Record<Area, CheckDoc[]> = {
    activity: [],
    decisions: [],
    snapshots: [],
    balance: [],
  };
  for (const doc of Object.values(CHECK_DOCS)) byArea[doc.area].push(doc);

  for (const area of ["activity", "decisions", "snapshots", "balance"] as const) {
    lines.push(`${AREA_GLYPH[area]} ${c.bold(AREA_LABEL[area])}`);
    for (const doc of byArea[area]) {
      lines.push(`  ${c.cyan(doc.name.padEnd(20))} ${c.dim(doc.summary)}`);
    }
    lines.push("");
  }
  lines.push(c.dim("Use `beacon doctor --explain <check>` for the full explanation of any check."));
  return lines.join("\n");
}

export function getAllCheckNames(): string[] {
  return Object.keys(CHECK_DOCS);
}
