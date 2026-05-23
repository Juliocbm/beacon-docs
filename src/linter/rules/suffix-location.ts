import { CATEGORY_META } from "../../core/categories";
import type { Rule } from "../types";

const SUFFIX_TO_CATEGORY: Record<string, string> = {};
for (const [, m] of Object.entries(CATEGORY_META)) {
  if (m.suffix !== ".md") SUFFIX_TO_CATEGORY[m.suffix] = m.location;
}

export const rule: Rule = {
  name: "suffix-location",
  severity: "error",
  check(ctx) {
    const findings = [];
    for (const f of ctx.files) {
      if (f.isReadme) continue;
      for (const [suffix, expectedDir] of Object.entries(SUFFIX_TO_CATEGORY)) {
        if (f.basename.endsWith(suffix) && f.category !== expectedDir) {
          findings.push({
            severity: "error" as const,
            rule: "suffix-location",
            file: f.relativePath,
            message: `File with suffix "${suffix}" must live in docs/${expectedDir}/ (found in docs/${f.category}/).`,
          });
        }
      }
    }
    return findings;
  },
};
