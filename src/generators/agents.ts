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

export function renderAgentsMd(config: BeaconConfig): string {
  const sections = [
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
