import fs from "fs-extra";
import type { Check, Finding } from "../types";

const STALE_PLAN_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const check: Check = {
  name: "stale-plans",
  area: "activity",
  async check(ctx) {
    const findings: Finding[] = [];
    const planFiles = ctx.files.filter(
      (f) =>
        f.category === "plans" &&
        !f.isReadme &&
        !f.isArchived &&
        f.basename.endsWith(".plan.md"),
    );
    for (const file of planFiles) {
      const stat = await fs.stat(file.absolutePath);
      const ageDays = Math.floor((ctx.now - stat.mtimeMs) / MS_PER_DAY);
      if (ageDays >= STALE_PLAN_DAYS) {
        findings.push({
          area: "activity",
          check: "stale-plans",
          target: `docs/${file.relativePath}`,
          observation: `Last modified ${ageDays} days ago.`,
          suggestion:
            "If the plan shipped, run `beacon archive plan <slug>`. If it stalled, add a status note explaining why.",
        });
      }
    }
    return findings;
  },
};
