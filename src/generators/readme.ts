import type { BeaconConfig } from "../core/config";
import type { Category } from "../core/project-types";

export function renderMasterReadme(config: BeaconConfig): string {
  return `# Documentation\n\nManaged by Beacon. Project type: ${config.projectType}.\n`;
}

export function renderCategoryReadme(category: Category): string {
  return `# ${category}\n\nDocuments in this folder follow the Beacon convention.\n`;
}
