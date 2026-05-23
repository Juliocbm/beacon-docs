import fs from "fs-extra";
import type { Rule } from "../types";

export const rule: Rule = {
  name: "duplicate-titles",
  severity: "warning",
  async check(ctx) {
    const titleMap = new Map<string, string[]>();
    for (const f of ctx.files) {
      if (f.isReadme || f.isArchived) continue;
      const content = await fs.readFile(f.absolutePath, "utf8");
      const m = /^#\s+(.+)$/m.exec(content);
      if (!m) continue;
      const title = m[1]!.trim();
      const arr = titleMap.get(title) ?? [];
      arr.push(f.relativePath);
      titleMap.set(title, arr);
    }
    const findings = [];
    for (const [title, files] of titleMap) {
      if (files.length > 1) {
        findings.push({
          severity: "warning" as const,
          rule: "duplicate-titles",
          message: `Title "${title}" appears in: ${files.join(", ")}`,
        });
      }
    }
    return findings;
  },
};
