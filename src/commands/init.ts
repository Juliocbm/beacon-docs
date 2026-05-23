import {
  PROJECT_TYPES,
  CORE_CATEGORIES,
  ADDON_CATEGORIES,
  defaultCategoriesFor,
  isValidProjectType,
  type ProjectType,
  type Category,
} from "../core/project-types";
import type { AgentId, BeaconConfig } from "../core/config";
import { scaffoldStructure } from "../generators/scaffold";
import { addDocsLintScript } from "../core/package-json";
import type { ExistingFileAction } from "../core/existing-files";

export interface InitOptions {
  root: string;
  yes: boolean;
  type: ProjectType;
  with: string[];
  without: string[];
  agents: AgentId[];
  language: string;
  existingFiles: ExistingFileAction;
}

const ALL_CATEGORIES = new Set<string>([...CORE_CATEGORIES, ...ADDON_CATEGORIES]);

export async function runInit(options: InitOptions): Promise<BeaconConfig> {
  if (!isValidProjectType(options.type)) {
    throw new Error(
      `Unknown project type: "${options.type}". Valid types: ${PROJECT_TYPES.join(", ")}.`,
    );
  }

  for (const c of [...options.with, ...options.without]) {
    if (!ALL_CATEGORIES.has(c)) {
      throw new Error(
        `Unknown category: "${c}". Valid categories: ${[...ALL_CATEGORIES].join(", ")}.`,
      );
    }
  }

  const defaults = defaultCategoriesFor(options.type);
  const finalSet = new Set<Category>(defaults);
  for (const c of options.with) finalSet.add(c as Category);
  for (const c of options.without) finalSet.delete(c as Category);

  const config: BeaconConfig = {
    version: "1.0",
    projectType: options.type,
    categories: [...finalSet],
    agents: options.agents,
    language: options.language,
  };

  await scaffoldStructure(options.root, config);
  await addDocsLintScript(options.root);

  return config;
}
