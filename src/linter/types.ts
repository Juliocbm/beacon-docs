import type { BeaconConfig } from "../core/config";

export type Severity = "error" | "warning" | "suggestion";

export interface Finding {
  severity: Severity;
  rule: string;
  file?: string;
  message: string;
}

export interface DocFile {
  absolutePath: string;
  relativePath: string;     // relative to docs/, e.g., "plans/a.plan.md"
  category: string;          // first directory under docs/
  basename: string;
  isReadme: boolean;
  isArchived: boolean;
}

export interface RuleContext {
  root: string;
  config: BeaconConfig;
  files: DocFile[];
}

export interface Rule {
  name: string;
  severity: Severity;
  check: (ctx: RuleContext) => Promise<Finding[]> | Finding[];
}
