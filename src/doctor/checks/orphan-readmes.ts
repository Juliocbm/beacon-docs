import fs from "fs-extra";
import path from "node:path";
import { ADDON_CATEGORIES, type Category } from "../../core/project-types";
import { categoryDir } from "../../core/paths";
import type { Check, Finding } from "../types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const ADDON_SET = new Set<string>(ADDON_CATEGORIES);

export const check: Check = {
  name: "orphan-readmes",
  area: "balance",
  async check(ctx) {
    const findings: Finding[] = [];
    for (const cat of ctx.config.categories) {
      // Only flag add-on categories — core categories (reference/adr/plans/...) are
      // expected to be present even on a brand-new project; flagging them would be noise.
      if (!ADDON_SET.has(cat)) continue;

      const dir = categoryDir(ctx.root, cat as Category);
      if (!(await fs.pathExists(dir))) continue;

      const entries = await fs.readdir(dir);
      const meaningful = entries.filter((e) => e !== "README.md" && e !== "_archive");
      if (meaningful.length > 0) continue;

      const readmePath = path.join(dir, "README.md");
      if (!(await fs.pathExists(readmePath))) continue;
      const stat = await fs.stat(readmePath);
      const ageDays = Math.floor((ctx.now - stat.mtimeMs) / MS_PER_DAY);
      if (ageDays < ctx.thresholds.orphanReadmeDays) continue;

      findings.push({
        area: "balance",
        check: "orphan-readmes",
        target: `docs/${cat}/`,
        observation: `Add-on enabled ${ageDays} days ago but folder still only contains README.md.`,
        suggestion: `If you don't need this category, run \`beacon disable ${cat}\`. Otherwise add at least one doc (\`beacon new <type> <slug>\`) so the folder earns its keep.`,
      });
    }
    return findings;
  },
};
