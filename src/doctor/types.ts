import type { BeaconConfig, DoctorThresholds } from "../core/config";
import type { DocFile } from "../linter/types";

/**
 * High-level health areas surfaced by `beacon doctor`.
 * Each check belongs to exactly one area; findings are grouped by area in the reporter.
 */
export type Area = "activity" | "decisions" | "snapshots" | "balance";

/**
 * A single doctor finding. Doctor findings are uniformly informational —
 * no severity field (unlike lint findings). Strictness is decided at the command level.
 */
export interface Finding {
  area: Area;
  check: string;
  target?: string;
  observation: string;
  suggestion: string;
}

export interface CheckContext {
  root: string;
  config: BeaconConfig;
  files: DocFile[];
  /** Reference timestamp for "X days ago" calculations. Defaults to Date.now(). */
  now: number;
  /** Doctor thresholds — defaults merged with per-project overrides from config. */
  thresholds: Required<DoctorThresholds>;
}

export interface Check {
  name: string;
  area: Area;
  check: (ctx: CheckContext) => Promise<Finding[]> | Finding[];
}
