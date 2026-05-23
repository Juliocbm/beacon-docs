import type { Rule } from "../types";

const ADR_FILE = /^ADR-(\d{3})-.+\.md$/;

export const rule: Rule = {
  name: "adr-numbering",
  severity: "warning",
  check(ctx) {
    const numbers: number[] = [];
    for (const f of ctx.files) {
      if (f.category !== "adr") continue;
      const m = ADR_FILE.exec(f.basename);
      if (m) numbers.push(parseInt(m[1]!, 10));
    }
    numbers.sort((a, b) => a - b);
    const findings = [];
    for (let i = 1; i < numbers.length; i++) {
      const prev = numbers[i - 1]!;
      const cur = numbers[i]!;
      if (cur > prev + 1) {
        for (let n = prev + 1; n < cur; n++) {
          findings.push({
            severity: "warning" as const,
            rule: "adr-numbering",
            message: `ADR-${String(n).padStart(3, "0")} is missing. Intentional gaps (rejected/superseded) are OK; otherwise renumber.`,
          });
        }
      }
    }
    return findings;
  },
};
