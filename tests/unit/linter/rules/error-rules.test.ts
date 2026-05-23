import { describe, it, expect } from "vitest";
import { rule as suffixLocation } from "../../../../src/linter/rules/suffix-location";
import { rule as kebabCase } from "../../../../src/linter/rules/kebab-case";
import { rule as evalDate } from "../../../../src/linter/rules/eval-date-prefix";
import { rule as readmePresent } from "../../../../src/linter/rules/readme-present";
import type { RuleContext } from "../../../../src/linter/types";

function ctx(overrides: Partial<RuleContext>): RuleContext {
  return {
    root: "/r",
    config: {
      version: "1.0", projectType: "library",
      categories: ["reference", "plans", "evaluations"],
      agents: ["claude"], language: "en",
    },
    files: [],
    ...overrides,
  };
}

describe("suffix-location rule", () => {
  it("flags a .plan.md file outside docs/plans/", async () => {
    const findings = await suffixLocation.check(ctx({
      files: [{ absolutePath: "", relativePath: "reference/x.plan.md", category: "reference", basename: "x.plan.md", isReadme: false, isArchived: false }],
    }));
    expect(findings.length).toBe(1);
    expect(findings[0]!.severity).toBe("error");
  });

  it("passes a correctly-located .plan.md", async () => {
    const findings = await suffixLocation.check(ctx({
      files: [{ absolutePath: "", relativePath: "plans/x.plan.md", category: "plans", basename: "x.plan.md", isReadme: false, isArchived: false }],
    }));
    expect(findings).toEqual([]);
  });
});

describe("kebab-case rule", () => {
  it("flags PascalCase filenames", async () => {
    const findings = await kebabCase.check(ctx({
      files: [{ absolutePath: "", relativePath: "plans/BillingIntegration.plan.md", category: "plans", basename: "BillingIntegration.plan.md", isReadme: false, isArchived: false }],
    }));
    expect(findings.length).toBe(1);
  });

  it("allows README.md", async () => {
    const findings = await kebabCase.check(ctx({
      files: [{ absolutePath: "", relativePath: "plans/README.md", category: "plans", basename: "README.md", isReadme: true, isArchived: false }],
    }));
    expect(findings).toEqual([]);
  });

  it("allows ADR-NNN- prefix", async () => {
    const findings = await kebabCase.check(ctx({
      files: [{ absolutePath: "", relativePath: "adr/ADR-015-add-rate-limiting.md", category: "adr", basename: "ADR-015-add-rate-limiting.md", isReadme: false, isArchived: false }],
    }));
    expect(findings).toEqual([]);
  });
});

describe("eval-date-prefix rule", () => {
  it("flags an eval file missing YYYY-MM-DD- prefix", async () => {
    const findings = await evalDate.check(ctx({
      files: [{ absolutePath: "", relativePath: "evaluations/audit.eval.md", category: "evaluations", basename: "audit.eval.md", isReadme: false, isArchived: false }],
    }));
    expect(findings.length).toBe(1);
  });

  it("passes when prefix is present", async () => {
    const findings = await evalDate.check(ctx({
      files: [{ absolutePath: "", relativePath: "evaluations/2026-05-22-audit.eval.md", category: "evaluations", basename: "2026-05-22-audit.eval.md", isReadme: false, isArchived: false }],
    }));
    expect(findings).toEqual([]);
  });
});

describe("readme-present rule", () => {
  it("errors when an enabled category folder lacks README.md", async () => {
    const findings = await readmePresent.check(ctx({
      files: [
        { absolutePath: "", relativePath: "plans/foo.plan.md", category: "plans", basename: "foo.plan.md", isReadme: false, isArchived: false },
      ],
    }));
    expect(findings.some((f) => f.message.includes("plans"))).toBe(true);
  });

  it("passes when README.md exists", async () => {
    const findings = await readmePresent.check(ctx({
      files: [
        { absolutePath: "", relativePath: "plans/README.md", category: "plans", basename: "README.md", isReadme: true, isArchived: false },
      ],
    }));
    expect(findings.filter((f) => f.message.includes("plans"))).toEqual([]);
  });
});
