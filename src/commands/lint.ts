import { runLint } from "../linter";
import { formatText, formatJson } from "../linter/reporter";
import { rule as suffixLocation } from "../linter/rules/suffix-location";
import { rule as kebabCase } from "../linter/rules/kebab-case";
import { rule as evalDate } from "../linter/rules/eval-date-prefix";
import { rule as readmePresent } from "../linter/rules/readme-present";
import { rule as aiFilesSync } from "../linter/rules/ai-files-sync";
import { rule as duplicateTitles } from "../linter/rules/duplicate-titles";
import { rule as longFiles } from "../linter/rules/long-files";
import { rule as folderSize } from "../linter/rules/folder-size";
import { rule as adrNumbering } from "../linter/rules/adr-numbering";
import { rule as stalePlans } from "../linter/rules/stale-plans";
import { rule as adrStatus } from "../linter/rules/adr-status";
import { readConfig } from "../core/config";
import { loadPlugins } from "../plugins/loader";
import { c } from "../ui/colors";
import { WARN } from "../ui/glyphs";

const BUILTIN_RULES = [
  suffixLocation,
  kebabCase,
  evalDate,
  readmePresent,
  aiFilesSync,
  duplicateTitles,
  longFiles,
  folderSize,
  adrNumbering,
  stalePlans,
  adrStatus,
];

export interface LintCommandResult {
  exitCode: 0 | 1;
  output: string;
  /** Plugin-load errors surfaced to stderr (separate from `output` which goes to stdout). */
  pluginErrors: string[];
}

export async function runLintCommand(opts: {
  root: string;
  strict: boolean;
  json: boolean;
}): Promise<LintCommandResult> {
  const config = await readConfig(opts.root);
  const pluginLoad = await loadPlugins({ root: opts.root, sources: config.plugins ?? [] });

  const pluginRules = pluginLoad.plugins.flatMap((lp) => lp.plugin.rules ?? []);
  const rules = [...BUILTIN_RULES, ...pluginRules];

  const result = await runLint({ root: opts.root, rules });

  let exitCode: 0 | 1 = 0;
  if (result.errorCount > 0) exitCode = 1;
  if (opts.strict && result.warningCount > 0) exitCode = 1;

  const output = opts.json ? formatJson(result.findings) : formatText(result.findings);
  const pluginErrors = pluginLoad.errors.map(
    (e) => `${WARN} ${c.yellow(`Plugin "${e.source}" failed to load:`)} ${e.message}`,
  );
  return { exitCode, output, pluginErrors };
}
