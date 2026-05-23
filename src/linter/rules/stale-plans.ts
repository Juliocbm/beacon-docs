import fs from "fs-extra";
import type { Rule } from "../types";

const STALE_MS = 30 * 24 * 60 * 60 * 1000;

export const rule: Rule = {
  name: "stale-plans",
  severity: "suggestion",
  async check(ctx) {
    const findings = [];
    const now = Date.now();
    for (const f of ctx.files) {
      if (f.category !== "plans" || f.isArchived || f.isReadme) continue;
      const stat = await fs.stat(f.absolutePath);
      if (now - stat.mtimeMs > STALE_MS) {
        findings.push({
          severity: "suggestion" as const,
          rule: "stale-plans",
          file: f.relativePath,
          message: `Plan not modified in >30 days. If complete, archive it.`,
        });
      }
    }
    return findings;
  },
};
