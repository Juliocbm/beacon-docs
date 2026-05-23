import type { BeaconConfig } from "../core/config";
import { HEADER } from "./_header";
import { buildUniversalRules, buildProjectSpecificRules, buildDecisionTable } from "./ai-rules";

export function renderGeminiMd(config: BeaconConfig): string {
  return [
    HEADER,
    "",
    "# GEMINI.md — Documentation Convention",
    "",
    "> Read by Gemini CLI. Full convention: [`docs/_meta/convention.md`](docs/_meta/convention.md).",
    "",
    buildUniversalRules(),
    "",
    buildProjectSpecificRules(config),
    "",
    buildDecisionTable(config),
    "",
  ].join("\n");
}
