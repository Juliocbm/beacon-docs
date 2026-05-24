import { runDoctor } from "../doctor/runner";
import { formatText, formatJson } from "../doctor/reporter";
import { check as stalePlans } from "../doctor/checks/stale-plans";
import { check as proposedAdrs } from "../doctor/checks/proposed-adrs";
import { check as oldEvaluations } from "../doctor/checks/old-evaluations";
import { check as backlogBalance } from "../doctor/checks/backlog-balance";
import { check as orphanReadmes } from "../doctor/checks/orphan-readmes";

const CHECKS = [stalePlans, proposedAdrs, oldEvaluations, backlogBalance, orphanReadmes];

export interface DoctorCommandResult {
  exitCode: 0 | 1;
  output: string;
}

export async function runDoctorCommand(opts: {
  root: string;
  strict: boolean;
  json: boolean;
}): Promise<DoctorCommandResult> {
  const result = await runDoctor({ root: opts.root, checks: CHECKS });

  const exitCode: 0 | 1 = opts.strict && result.findings.length > 0 ? 1 : 0;
  const output = opts.json ? formatJson(result.findings) : formatText(result.findings);
  return { exitCode, output };
}
