import type { Rule } from "../types";

export const rule: Rule = {
  name: "readme-present",
  severity: "error",
  check(ctx) {
    const present = new Set<string>();
    for (const f of ctx.files) {
      if (f.isReadme && !f.isArchived) present.add(f.category);
    }
    const findings = [];
    for (const c of ctx.config.categories) {
      if (!present.has(c)) {
        findings.push({
          severity: "error" as const,
          rule: "readme-present",
          message: `docs/${c}/README.md is required.`,
        });
      }
    }
    return findings;
  },
};
