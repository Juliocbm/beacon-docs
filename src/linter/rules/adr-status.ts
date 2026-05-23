import fs from "fs-extra";
import matter from "gray-matter";
import type { Rule } from "../types";

export const rule: Rule = {
  name: "adr-status",
  severity: "suggestion",
  async check(ctx) {
    const findings = [];
    for (const f of ctx.files) {
      if (f.category !== "adr" || f.isReadme) continue;
      const content = await fs.readFile(f.absolutePath, "utf8");
      const fm = matter(content).data as { status?: string };
      if (!fm.status) {
        findings.push({
          severity: "suggestion" as const,
          rule: "adr-status",
          file: f.relativePath,
          message: "ADR missing `status:` frontmatter (proposed/accepted/superseded/rejected).",
        });
      }
    }
    return findings;
  },
};
