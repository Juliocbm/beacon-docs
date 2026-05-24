import { readConfig } from "../core/config";
import { walkDocs } from "../linter/walker";
import { resolveThresholds } from "./defaults";
import type { Area, Check, CheckContext, Finding } from "./types";

export interface RunDoctorResult {
  findings: Finding[];
  areaCounts: Record<Area, number>;
}

export async function runDoctor(opts: {
  root: string;
  checks: Check[];
  now?: number;
}): Promise<RunDoctorResult> {
  const config = await readConfig(opts.root);
  const files = await walkDocs(opts.root);
  const ctx: CheckContext = {
    root: opts.root,
    config,
    files,
    now: opts.now ?? Date.now(),
    thresholds: resolveThresholds(config.doctor?.thresholds),
  };

  const findings: Finding[] = [];
  for (const check of opts.checks) {
    const result = await check.check(ctx);
    findings.push(...result);
  }

  const areaCounts: Record<Area, number> = {
    activity: 0,
    decisions: 0,
    snapshots: 0,
    balance: 0,
  };
  for (const f of findings) areaCounts[f.area]++;

  return { findings, areaCounts };
}
