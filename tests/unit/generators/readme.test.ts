import { describe, it, expect } from "vitest";
import { renderMasterReadme, renderCategoryReadme } from "../../../src/generators/readme";
import { renderConvention } from "../../../src/generators/convention";
import type { BeaconConfig } from "../../../src/core/config";

const cfg: BeaconConfig = {
  version: "1.0",
  projectType: "web-app",
  categories: ["reference", "architecture", "adr", "plans", "backlog", "evaluations", "business", "integrations", "operations"],
  agents: ["claude"],
  language: "en",
};

describe("readme generators", () => {
  it("master README includes decision table for all enabled categories", () => {
    const md = renderMasterReadme(cfg);
    expect(md).toContain("# Documentation");
    expect(md).toContain("reference");
    expect(md).toContain("business");
    expect(md).toContain("integrations");
    expect(md).not.toContain("compliance"); // not enabled
    expect(md).not.toContain("modules"); // not enabled
  });

  it("master README has a decision-table heading", () => {
    expect(renderMasterReadme(cfg)).toMatch(/where do i find/i);
  });

  it("category README for plans mentions archiving rule", () => {
    expect(renderCategoryReadme("plans")).toMatch(/archive/i);
  });

  it("category README for evaluations mentions date prefix", () => {
    expect(renderCategoryReadme("evaluations")).toMatch(/YYYY-MM-DD/);
  });

  it("category README for adr mentions numbering", () => {
    expect(renderCategoryReadme("adr")).toMatch(/ADR-\d/i);
  });
});

describe("convention generator", () => {
  it("convention.md lists each enabled category", () => {
    const md = renderConvention(cfg);
    for (const c of cfg.categories) {
      expect(md).toContain(c);
    }
  });

  it("convention.md does NOT mention disabled add-ons", () => {
    const md = renderConvention(cfg);
    expect(md).not.toContain("docs/compliance/");
    expect(md).not.toContain("docs/modules/");
  });
});
