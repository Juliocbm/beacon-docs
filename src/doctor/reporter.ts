import type { Area, Finding } from "./types";
import { c } from "../ui/colors";
import { CHECK, ARROW, TREE_LAST } from "../ui/glyphs";

const AREA_ORDER: Area[] = ["activity", "decisions", "snapshots", "balance"];

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

function targetGlyph(target?: string): string {
  if (!target) return c.dim("·");
  // Heuristic: paths ending in `.md` are files; otherwise folders.
  return target.endsWith(".md") ? c.dim("📄") : c.dim("📁");
}

export function formatText(findings: Finding[]): string {
  const lines: string[] = [];

  if (findings.length === 0) {
    lines.push(`${CHECK} ${c.green("All checks passed.")} ${c.dim("(4 areas inspected)")}`);
    return lines.join("\n");
  }

  const grouped: Record<Area, Finding[]> = {
    activity: [],
    decisions: [],
    snapshots: [],
    balance: [],
  };
  for (const f of findings) grouped[f.area].push(f);

  let activeAreaCount = 0;
  for (const area of AREA_ORDER) {
    const group = grouped[area];
    if (group.length === 0) continue;
    activeAreaCount++;
    lines.push(`${AREA_GLYPH[area]} ${c.bold(`${AREA_LABEL[area]} (${group.length})`)}`);
    for (const f of group) {
      const loc = f.target ?? "(project-wide)";
      lines.push(`  ${targetGlyph(f.target)} ${c.dim(loc)}`);
      lines.push(`    ${TREE_LAST} ${c.cyan(f.check)}: ${f.observation}`);
      lines.push(`       ${ARROW} ${c.dim(f.suggestion)}`);
    }
    lines.push("");
  }

  lines.push(
    c.dim(
      `${findings.length} finding${findings.length === 1 ? "" : "s"} across ${activeAreaCount} area${activeAreaCount === 1 ? "" : "s"}.`,
    ),
  );

  return lines.join("\n");
}

export function formatJson(findings: Finding[]): string {
  return JSON.stringify(findings, null, 2);
}
