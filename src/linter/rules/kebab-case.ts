import type { Rule } from "../types";

const KEBAB_OR_ADR = /^(ADR-\d{3}-)?[a-z0-9]+(-[a-z0-9]+)*(\.[a-z]+)*\.md$/;

export const rule: Rule = {
  name: "kebab-case",
  severity: "error",
  check(ctx) {
    const findings = [];
    for (const f of ctx.files) {
      if (f.isReadme) continue;
      if (!KEBAB_OR_ADR.test(f.basename)) {
        findings.push({
          severity: "error" as const,
          rule: "kebab-case",
          file: f.relativePath,
          message: `Filename "${f.basename}" must be kebab-case (lowercase, hyphen-separated).`,
        });
      }
    }
    return findings;
  },
};
