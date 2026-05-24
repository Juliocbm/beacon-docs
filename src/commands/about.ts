import fs from "fs-extra";
import path from "node:path";
import { configPath, readConfig } from "../core/config";
import { resolveThresholds, DEFAULT_THRESHOLDS } from "../doctor/defaults";
import { c } from "../ui/colors";
import { CHECK, CROSS } from "../ui/glyphs";

export interface AboutCommandResult {
  exitCode: 0;
  output: string;
}

/** Files Beacon may generate at the project root, by agent. */
const AGENT_FILES: Record<string, string[]> = {
  claude: ["CLAUDE.md"],
  codex: ["AGENTS.md"],
  gemini: ["GEMINI.md"],
  cursor: [".cursorrules", ".cursor/rules/beacon.mdc"],
};

export async function runAboutCommand(opts: {
  root: string;
  version: string;
  installPath: string;
}): Promise<AboutCommandResult> {
  const lines: string[] = [];

  lines.push(`${c.bold("Beacon")} ${c.cyan(`v${opts.version}`)}`);
  lines.push(`  ${c.dim("install path:")}  ${opts.installPath}`);
  lines.push(`  ${c.dim("node version:")}  ${process.version}`);
  lines.push(`  ${c.dim("platform:")}      ${process.platform} ${process.arch}`);
  lines.push("");

  const cfgPath = configPath(opts.root);
  const cfgExists = await fs.pathExists(cfgPath);

  if (!cfgExists) {
    lines.push(c.dim(`No beacon config in this directory.`));
    lines.push(c.dim(`  Run \`beacon init\` to scaffold the docs convention here.`));
    lines.push(c.dim(`  (Looked for: ${path.relative(opts.root, cfgPath) || cfgPath})`));
    return { exitCode: 0, output: lines.join("\n") };
  }

  const config = await readConfig(opts.root);
  lines.push(`${c.bold("Project config")} ${c.dim(`(${path.relative(opts.root, cfgPath)})`)}`);
  lines.push(`  ${c.dim("project type:")}  ${c.cyan(config.projectType)}`);
  lines.push(`  ${c.dim("categories:")}    ${config.categories.join(", ")} ${c.dim(`(${config.categories.length})`)}`);
  lines.push(`  ${c.dim("AI agents:")}     ${config.agents.join(", ")} ${c.dim(`(${config.agents.length})`)}`);
  lines.push(`  ${c.dim("language:")}      ${config.language}`);

  const overrides = config.doctor?.thresholds;
  const resolved = resolveThresholds(overrides);
  const overridden = Object.entries(resolved).filter(
    ([k, v]) => v !== DEFAULT_THRESHOLDS[k as keyof typeof DEFAULT_THRESHOLDS],
  );
  if (overridden.length === 0) {
    lines.push(`  ${c.dim("thresholds:")}    using defaults`);
  } else {
    lines.push(`  ${c.dim("thresholds:")}    ${c.cyan(`${overridden.length} override${overridden.length === 1 ? "" : "s"}`)}`);
    for (const [k, v] of overridden) {
      const def = DEFAULT_THRESHOLDS[k as keyof typeof DEFAULT_THRESHOLDS];
      lines.push(`    ${c.dim("·")} ${k} = ${c.cyan(String(v))} ${c.dim(`(default: ${def})`)}`);
    }
  }
  lines.push("");

  lines.push(c.bold("Generated AI files"));
  const seen = new Set<string>();
  for (const agent of config.agents) {
    for (const file of AGENT_FILES[agent] ?? []) {
      if (seen.has(file)) continue;
      seen.add(file);
      const exists = await fs.pathExists(path.join(opts.root, file));
      lines.push(`  ${exists ? CHECK : CROSS} ${file}${exists ? "" : c.dim(" (missing — run `beacon sync`)")}`);
    }
  }

  return { exitCode: 0, output: lines.join("\n") };
}
