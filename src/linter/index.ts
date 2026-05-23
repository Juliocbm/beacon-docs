import { readConfig } from "../core/config";
import { walkDocs } from "./walker";
import type { Finding, Rule, RuleContext, Severity } from "./types";

export interface RunLintResult {
  findings: Finding[];
  errorCount: number;
  warningCount: number;
  suggestionCount: number;
}

export async function runLint(opts: { root: string; rules: Rule[] }): Promise<RunLintResult> {
  const config = await readConfig(opts.root);
  const files = await walkDocs(opts.root);
  const ctx: RuleContext = { root: opts.root, config, files };

  const findings: Finding[] = [];
  for (const rule of opts.rules) {
    const result = await rule.check(ctx);
    findings.push(...result);
  }

  const counts: Record<Severity, number> = { error: 0, warning: 0, suggestion: 0 };
  for (const f of findings) counts[f.severity]++;

  return {
    findings,
    errorCount: counts.error,
    warningCount: counts.warning,
    suggestionCount: counts.suggestion,
  };
}
