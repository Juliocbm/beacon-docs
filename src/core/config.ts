import fs from "fs-extra";
import path from "node:path";
import type { ProjectType, Category } from "./project-types";

export type AgentId = "claude" | "cursor" | "codex" | "gemini";

export interface BeaconConfig {
  version: "1.0";
  projectType: ProjectType;
  categories: Category[];
  agents: AgentId[];
  language: string;
}

export function configPath(projectRoot: string): string {
  return path.join(projectRoot, "docs", "_meta", "beacon.config.json");
}

export async function readConfig(projectRoot: string): Promise<BeaconConfig> {
  const p = configPath(projectRoot);
  if (!(await fs.pathExists(p))) {
    throw new Error(
      `Could not find docs/_meta/beacon.config.json at ${projectRoot}. Run \`beacon init\` first.`,
    );
  }
  return (await fs.readJson(p)) as BeaconConfig;
}

export async function writeConfig(
  projectRoot: string,
  config: BeaconConfig,
): Promise<void> {
  const p = configPath(projectRoot);
  await fs.ensureDir(path.dirname(p));
  const json = JSON.stringify(config, null, 2) + "\n";
  await fs.writeFile(p, json, "utf8");
}
