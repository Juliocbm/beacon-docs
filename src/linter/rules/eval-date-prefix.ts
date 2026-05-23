import type { Rule } from "../types";

const DATE_PREFIX = /^\d{4}-\d{2}-\d{2}-.+\.eval\.md$/;

export const rule: Rule = {
  name: "eval-date-prefix",
  severity: "error",
  check(ctx) {
    const findings = [];
    for (const f of ctx.files) {
      if (!f.basename.endsWith(".eval.md")) continue;
      if (!DATE_PREFIX.test(f.basename)) {
        findings.push({
          severity: "error" as const,
          rule: "eval-date-prefix",
          file: f.relativePath,
          message: `Eval file "${f.basename}" must start with YYYY-MM-DD-.`,
        });
      }
    }
    return findings;
  },
};
