import type { BeaconConfig } from "../core/config";

export function renderConventionPlaceholder(config: BeaconConfig): string {
  return `# Documentation Convention\n\nProject type: ${config.projectType}.\n\nEnabled categories: ${config.categories.join(", ")}.\n`;
}
