import type { BeaconConfig } from "../core/config";
import { HEADER } from "./_header";
import {
  buildUniversalRules,
  buildProjectSpecificRules,
  buildDecisionTable,
  buildWorkflowTriggers,
  buildLifecycleRules,
  buildSelfChecks,
} from "./ai-rules";

export function renderClaudeMd(config: BeaconConfig): string {
  const sections = [
    HEADER,
    "",
    "# Documentation Convention",
    "",
    "> Project type: **" + config.projectType + "**. Full convention: [`docs/_meta/convention.md`](docs/_meta/convention.md).",
    "",
    buildUniversalRules(),
    "",
    buildProjectSpecificRules(config),
    "",
    buildDecisionTable(config),
    "",
    buildWorkflowTriggers(config),
    "",
  ];
  const lifecycle = buildLifecycleRules(config);
  if (lifecycle) {
    sections.push(lifecycle, "");
  }
  sections.push(buildSelfChecks(), "");
  return sections.join("\n");
}
