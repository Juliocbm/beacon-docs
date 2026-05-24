import { runDoctor } from "../doctor/runner";
import { formatText, formatJson } from "../doctor/reporter";
import { check as stalePlans } from "../doctor/checks/stale-plans";
import { check as proposedAdrs } from "../doctor/checks/proposed-adrs";
import { check as oldEvaluations } from "../doctor/checks/old-evaluations";
import { check as backlogBalance } from "../doctor/checks/backlog-balance";
import { check as orphanReadmes } from "../doctor/checks/orphan-readmes";
import { readConfig } from "../core/config";
import { loadPlugins } from "../plugins/loader";
import { c } from "../ui/colors";
import { WARN } from "../ui/glyphs";

const BUILTIN_CHECKS = [stalePlans, proposedAdrs, oldEvaluations, backlogBalance, orphanReadmes];

export interface DoctorCommandResult {
  exitCode: 0 | 1;
  output: string;
  /** Plugin-load errors surfaced to stderr (separate from `output` which goes to stdout). */
  pluginErrors: string[];
}

export async function runDoctorCommand(opts: {
  root: string;
  strict: boolean;
  json: boolean;
}): Promise<DoctorCommandResult> {
  const config = await readConfig(opts.root);
  const pluginLoad = await loadPlugins({ root: opts.root, sources: config.plugins ?? [] });

  const pluginChecks = pluginLoad.plugins.flatMap((lp) => lp.plugin.checks ?? []);
  const checks = [...BUILTIN_CHECKS, ...pluginChecks];

  const result = await runDoctor({ root: opts.root, checks });

  const exitCode: 0 | 1 = opts.strict && result.findings.length > 0 ? 1 : 0;
  const output = opts.json ? formatJson(result.findings) : formatText(result.findings);
  const pluginErrors = pluginLoad.errors.map(
    (e) => `${WARN} ${c.yellow(`Plugin "${e.source}" failed to load:`)} ${e.message}`,
  );
  return { exitCode, output, pluginErrors };
}
