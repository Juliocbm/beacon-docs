import fs from "fs-extra";
import path from "node:path";
import { renderClaudeMd } from "../../generators/claude";
import { renderAgentsMd } from "../../generators/agents";
import { renderGeminiMd } from "../../generators/gemini";
import { renderCursorRules, renderCursorMdc } from "../../generators/cursor";
import type { Rule } from "../types";

export const rule: Rule = {
  name: "ai-files-sync",
  severity: "error",
  async check(ctx) {
    const findings = [];
    const checks: Array<{ agent: string; filename: string; render: () => string }> = [
      { agent: "claude", filename: "CLAUDE.md", render: () => renderClaudeMd(ctx.config) },
      { agent: "codex", filename: "AGENTS.md", render: () => renderAgentsMd(ctx.config) },
      { agent: "gemini", filename: "GEMINI.md", render: () => renderGeminiMd(ctx.config) },
      { agent: "cursor", filename: ".cursorrules", render: () => renderCursorRules(ctx.config) },
      { agent: "cursor", filename: ".cursor/rules/beacon.mdc", render: () => renderCursorMdc(ctx.config) },
    ];
    for (const c of checks) {
      if (!ctx.config.agents.includes(c.agent as never)) continue;
      const file = path.join(ctx.root, c.filename);
      if (!(await fs.pathExists(file))) {
        findings.push({
          severity: "error" as const,
          rule: "ai-files-sync",
          file: c.filename,
          message: `${c.filename} missing. Run \`beacon sync\`.`,
        });
        continue;
      }
      const actual = await fs.readFile(file, "utf8");
      const expected = c.render();
      if (actual !== expected) {
        findings.push({
          severity: "error" as const,
          rule: "ai-files-sync",
          file: c.filename,
          message: `${c.filename} is out of sync with docs/_meta/convention.md. Run \`beacon sync\`.`,
        });
      }
    }
    return findings;
  },
};
