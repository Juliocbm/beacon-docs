import type { DoctorThresholds } from "../core/config";

/**
 * Default thresholds for every doctor check. Per-project overrides go in
 * `docs/_meta/beacon.config.json` under `doctor.thresholds.*`.
 *
 * Keep documentation comments in sync with the README and `check-docs.ts`
 * entries — these numbers are user-facing.
 */
export const DEFAULT_THRESHOLDS: Required<DoctorThresholds> = {
  /** stale-plans: flag plans unmodified for ≥ this many days. */
  stalePlanDays: 30,
  /** proposed-adrs: flag ADRs at `status: proposed` for ≥ this many days. */
  proposedAdrDays: 14,
  /** old-evaluations: flag evals older than this many months (no newer refresh on same topic). */
  oldEvalMonths: 6,
  /** orphan-readmes: flag add-on folders containing only README.md when README is ≥ this many days old. */
  orphanReadmeDays: 30,
  /** backlog-balance: minimum active plans count below which the check is silent (avoids noise on small projects). */
  backlogMinPlans: 5,
  /** backlog-balance: maximum plans-per-backlog-item ratio before flagging. */
  backlogPlansPerItem: 5,
};

/**
 * Merge user-supplied thresholds with defaults. Undefined or non-number
 * values fall back to the default — never throws.
 */
export function resolveThresholds(user?: DoctorThresholds): Required<DoctorThresholds> {
  const out: Required<DoctorThresholds> = { ...DEFAULT_THRESHOLDS };
  if (!user) return out;
  for (const key of Object.keys(DEFAULT_THRESHOLDS) as (keyof DoctorThresholds)[]) {
    const v = user[key];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
      out[key] = v;
    }
  }
  return out;
}
