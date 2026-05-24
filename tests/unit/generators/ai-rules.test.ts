import { describe, it, expect } from "vitest";
import {
  buildUniversalRules,
  buildProjectSpecificRules,
  buildDecisionTable,
  buildSuffixTable,
  buildWorkflowTriggers,
  buildLifecycleRules,
  buildSelfChecks,
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

  it("universal rules include the persistence reminder", () => {
    const out = buildUniversalRules();
    expect(out).toMatch(/Persistence rule/);
    expect(out).toMatch(/chat memory.*session-scoped/i);
  });
});

describe("ai-rules.buildWorkflowTriggers", () => {
  it("includes a trigger for each enabled trigger-relevant category", () => {
    const out = buildWorkflowTriggers(libCfg);
    expect(out).toContain("Workflow triggers");
    expect(out).toContain("Design decision made");
    expect(out).toContain("beacon new adr");
    expect(out).toContain("Multi-step work agreed");
    expect(out).toContain("beacon new plan");
    expect(out).toContain("Scope deferred");
    expect(out).toContain("beacon new todo");
    expect(out).toContain("Release shipped");
    expect(out).toContain("beacon new eval");
    expect(out).toContain("Approach explained twice");
    expect(out).toContain("beacon new pattern");
    expect(out).toContain("System structure changed");
  });

  it("omits triggers for disabled categories", () => {
    const minimalCfg: BeaconConfig = {
      version: "1.0",
      projectType: "custom",
      categories: ["adr"], // only ADRs
      agents: ["claude"],
      language: "en",
    };
    const out = buildWorkflowTriggers(minimalCfg);
    expect(out).toContain("Design decision made");
    expect(out).not.toContain("beacon new plan");
    expect(out).not.toContain("beacon new todo");
    expect(out).not.toContain("beacon new eval");
    expect(out).not.toContain("beacon new pattern");
  });
});

describe("ai-rules.buildLifecycleRules", () => {
  it("includes plan + ADR lifecycle rules when both are enabled", () => {
    const out = buildLifecycleRules(libCfg);
    expect(out).toContain("Document lifecycle");
    expect(out).toContain("Plans must be checked off");
    expect(out).toContain("beacon archive plan");
    expect(out).toContain("ADRs that supersede");
    expect(out).toContain("Backlog items graduate to plans");
    expect(out).toContain("Retrospective evals");
  });

  it("returns empty string when no lifecycle-relevant categories enabled", () => {
    const minimalCfg: BeaconConfig = {
      version: "1.0",
      projectType: "custom",
      categories: ["reference"], // only patterns — no lifecycle relevance
      agents: ["claude"],
      language: "en",
    };
    const out = buildLifecycleRules(minimalCfg);
    expect(out).toBe("");
  });

  it("omits the backlog→plan rule when backlog is not enabled", () => {
    const noBacklogCfg: BeaconConfig = {
      ...libCfg,
      categories: libCfg.categories.filter((c) => c !== "backlog"),
    };
    const out = buildLifecycleRules(noBacklogCfg);
    expect(out).toContain("Plans must");
    expect(out).not.toContain("Backlog items graduate");
  });
});

describe("ai-rules.buildSelfChecks", () => {
  it("references the four key beacon commands by name", () => {
    const out = buildSelfChecks();
    expect(out).toContain("beacon lint");
    expect(out).toContain("beacon doctor");
    expect(out).toContain("beacon about");
    expect(out).toContain("--explain");
  });

  it("groups guidance by trigger moment (commit, tag, uncertainty, new directory)", () => {
    const out = buildSelfChecks();
    expect(out).toMatch(/Before committing/);
    expect(out).toMatch(/Before tagging/);
    expect(out).toMatch(/When uncertain/);
    expect(out).toMatch(/When in a new directory/);
  });
});
