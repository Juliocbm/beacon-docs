import type { BeaconConfig } from "../core/config";
import { HEADER } from "./_header";
import { buildUniversalRules, buildProjectSpecificRules } from "./ai-rules";

export function renderCursorRules(config: BeaconConfig): string {
  return [
    HEADER,
    "",
    buildUniversalRules(),
    "",
    buildProjectSpecificRules(config),
    "",
  ].join("\n");
}

export function renderCursorMdc(config: BeaconConfig): string {
  const front = [
    "---",
    "description: Beacon documentation convention — where docs go and how they're named.",
    'globs: ["docs/**/*.md"]',
    "alwaysApply: true",
    "---",
  ].join("\n");
  return [
    front,
    "",
    HEADER,
    "",
    buildUniversalRules(),
    "",
    buildProjectSpecificRules(config),
    "",
  ].join("\n");
}
