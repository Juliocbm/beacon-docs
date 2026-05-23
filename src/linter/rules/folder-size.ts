import type { Rule } from "../types";

const LIMIT = 30;

export const rule: Rule = {
  name: "folder-size",
  severity: "warning",
  check(ctx) {
    const counts = new Map<string, number>();
    for (const f of ctx.files) {
      if (f.isReadme || f.isArchived) continue;
      counts.set(f.category, (counts.get(f.category) ?? 0) + 1);
    }
    const findings = [];
    for (const [cat, count] of counts) {
      if (count > LIMIT) {
        findings.push({
          severity: "warning" as const,
          rule: "folder-size",
          message: `docs/${cat}/ has ${count} files (>${LIMIT}). Consider organizing into subfolders.`,
        });
      }
    }
    return findings;
  },
};
