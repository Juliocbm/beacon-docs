import type { BeaconConfig } from "../core/config";
import { HEADER } from "./_header";
import { buildUniversalRules, buildProjectSpecificRules, buildDecisionTable } from "./ai-rules";

export function renderAgentsMd(config: BeaconConfig): string {
  return [
    HEADER,
    "",
    "# AGENTS.md — Documentation Convention",
    "",
    "> Read by OpenAI Codex / GitHub Copilot. Full convention: [`docs/_meta/convention.md`](docs/_meta/convention.md).",
    "",
    buildUniversalRules(),
    "",
    buildProjectSpecificRules(config),
    "",
    buildDecisionTable(config),
    "",
  ].join("\n");
}
