import { describe, it, expect } from "vitest";
import {
  buildUniversalRules,
  buildProjectSpecificRules,
  buildDecisionTable,
  buildSuffixTable,
} from "../../../src/generators/ai-rules";
import type { BeaconConfig } from "../../../src/core/config";

const libCfg: BeaconConfig = {
  version: "1.0",
  projectType: "library",
  categories: ["reference", "architecture", "adr", "plans", "backlog", "evaluations"],
  agents: ["claude"],
  language: "en",
};

const webCfg: BeaconConfig = {
  version: "1.0",
  projectType: "web-app",
  categories: [...libCfg.categories, "business", "integrations", "operations", "roadmaps"],
  agents: ["claude"],
  language: "en",
};

describe("ai-rules", () => {
  it("universal rules contain the 9 invariant statements", () => {
    const out = buildUniversalRules();
    expect(out).toMatch(/one doc = one category/i);
    expect(out).toMatch(/status via folder/i);
    expect(out).toMatch(/kebab-case/i);
    expect(out).toMatch(/readme/i);
    expect(out).toMatch(/adrs.*append-only/i);
    expect(out).toMatch(/evaluations.*immutable/i);
    expect(out).toMatch(/_archive/i);
    expect(out).toMatch(/beacon sync/i);
    expect(out).toMatch(/beacon enable/i);
  });

  it("project-specific rules omit sections for disabled categories", () => {
    const out = buildProjectSpecificRules(libCfg);
    expect(out).not.toMatch(/compliance/i);
    expect(out).not.toMatch(/business/i);
    expect(out).not.toMatch(/integrations/i);
  });

  it("project-specific rules include sections for enabled add-ons", () => {
    const out = buildProjectSpecificRules(webCfg);
    expect(out).toMatch(/business/i);
    expect(out).toMatch(/integrations/i);
    expect(out).toMatch(/operations/i);
    expect(out).toMatch(/roadmaps/i);
  });

  it("decision table only includes rows for enabled categories", () => {
    const out = buildDecisionTable(libCfg);
    expect(out).toContain("`reference/`");
    expect(out).toContain("`plans/`");
    expect(out).not.toContain("`business/`");
    expect(out).not.toContain("`integrations/`");
  });

  it("suffix table lists each enabled category once", () => {
    const out = buildSuffixTable(webCfg);
    expect(out).toContain(".plan.md");
    expect(out).toContain(".business.md");
    expect(out).toContain(".guide.md"); // integrations + operations
    expect(out).not.toContain(".module.md"); // modules not enabled
  });
});
