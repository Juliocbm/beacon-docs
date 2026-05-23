import type { BeaconConfig } from "../core/config";
import { HEADER } from "./_header";
import { buildUniversalRules, buildProjectSpecificRules, buildDecisionTable } from "./ai-rules";

export function renderClaudeMd(config: BeaconConfig): string {
  return [
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
  ].join("\n");
}
