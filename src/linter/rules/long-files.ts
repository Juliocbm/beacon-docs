import fs from "fs-extra";
import type { Rule } from "../types";

const LIMIT = 1000;

export const rule: Rule = {
  name: "long-files",
  severity: "warning",
  async check(ctx) {
    const findings = [];
    for (const f of ctx.files) {
      const content = await fs.readFile(f.absolutePath, "utf8");
      const lines = content.split("\n").length;
      if (lines > LIMIT) {
        findings.push({
          severity: "warning" as const,
          rule: "long-files",
          file: f.relativePath,
          message: `File has ${lines} lines (>${LIMIT}). Consider splitting.`,
        });
      }
    }
    return findings;
  },
};
