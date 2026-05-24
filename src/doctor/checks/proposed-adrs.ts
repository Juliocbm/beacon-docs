import fs from "fs-extra";
import matter from "gray-matter";
import type { Check, Finding } from "../types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseFrontmatterDate(value: unknown): number | null {
  if (!value) return null;
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isNaN(t) ? null : t;
  }
  if (typeof value === "string") {
    const t = Date.parse(value);
    return Number.isNaN(t) ? null : t;
  }
  return null;
}

export const check: Check = {
  name: "proposed-adrs",
  area: "decisions",
  async check(ctx) {
    const findings: Finding[] = [];
    const adrFiles = ctx.files.filter(
      (f) => f.category === "adr" && !f.isReadme && !f.isArchived,
    );
    for (const file of adrFiles) {
      const raw = await fs.readFile(file.absolutePath, "utf8");
      const { data } = matter(raw);
      if (data.status !== "proposed") continue;
      let timestamp = parseFrontmatterDate(data.date);
      if (timestamp === null) {
        const stat = await fs.stat(file.absolutePath);
        timestamp = stat.mtimeMs;
      }
      const ageDays = Math.floor((ctx.now - timestamp) / MS_PER_DAY);
      if (ageDays >= ctx.thresholds.proposedAdrDays) {
        findings.push({
          area: "decisions",
          check: "proposed-adrs",
          target: `docs/${file.relativePath}`,
          observation: `Stuck in "proposed" for ${ageDays} days.`,
          suggestion:
            "Accept it, reject it, or update the ADR with a status note explaining why a decision is still pending.",
        });
      }
    }
    return findings;
  },
};
