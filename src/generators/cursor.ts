import type { BeaconConfig } from "../core/config";
import { HEADER } from "./_header";
import {
  buildUniversalRules,
  buildProjectSpecificRules,
  buildWorkflowTriggers,
  buildLifecycleRules,
  buildSelfChecks,
} from "./ai-rules";

function buildCommonBody(config: BeaconConfig): string[] {
  const sections = [
    buildUniversalRules(),
    "",
    buildProjectSpecificRules(config),
    "",
    buildWorkflowTriggers(config),
    "",
  ];
  const lifecycle = buildLifecycleRules(config);
  if (lifecycle) {
    sections.push(lifecycle, "");
  }
  sections.push(buildSelfChecks(), "");
  return sections;
}

export function renderCursorRules(config: BeaconConfig): string {
  return [HEADER, "", ...buildCommonBody(config)].join("\n");
}

export function renderCursorMdc(config: BeaconConfig): string {
  const front = [
    "---",
    "description: Beacon documentation convention — where docs go and how they're named.",
    'globs: ["docs/**/*.md"]',
    "alwaysApply: true",
    "---",
  ].join("\n");
  return [front, "", HEADER, "", ...buildCommonBody(config)].join("\n");
}
