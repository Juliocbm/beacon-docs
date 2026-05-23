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

const RULES = [
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
}

export async function runLintCommand(opts: {
  root: string;
  strict: boolean;
  json: boolean;
}): Promise<LintCommandResult> {
  const result = await runLint({ root: opts.root, rules: RULES });

  let exitCode: 0 | 1 = 0;
  if (result.errorCount > 0) exitCode = 1;
  if (opts.strict && result.warningCount > 0) exitCode = 1;

  const output = opts.json ? formatJson(result.findings) : formatText(result.findings);
  return { exitCode, output };
}
