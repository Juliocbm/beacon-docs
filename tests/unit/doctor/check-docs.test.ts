import { describe, it, expect, beforeEach } from "vitest";
import {
  renderCheckExplain,
  listAllChecks,
  getAllCheckNames,
} from "../../../src/doctor/check-docs";

beforeEach(() => {
  process.env.NO_COLOR = "1";
});

describe("doctor/check-docs.getAllCheckNames", () => {
  it("returns the current check names", () => {
    const names = getAllCheckNames();
    expect(names).toEqual([
      "stale-plans",
      "proposed-adrs",
      "old-evaluations",
      "orphan-readmes",
      "backlog-balance",
    ]);
  });
});

describe("doctor/check-docs.renderCheckExplain", () => {
  it("returns null for unknown checks", () => {
    expect(renderCheckExplain("nope")).toBeNull();
  });

  it("includes check name, area, summary, why, triggers, example, and not-flagged-when sections", () => {
    const text = renderCheckExplain("stale-plans");
    expect(text).not.toBeNull();
    expect(text).toContain("Check: stale-plans");
    expect(text).toContain("area: Activity");
    expect(text).toContain("Why this check exists:");
    expect(text).toContain("Triggers when:");
    expect(text).toContain("Example finding:");
    expect(text).toContain("Not flagged when:");
  });

  it("documents all 4 checks", () => {
    for (const name of getAllCheckNames()) {
      const text = renderCheckExplain(name);
      expect(text, `check ${name} should render`).not.toBeNull();
      expect(text).toContain(`Check: ${name}`);
    }
  });
});

describe("doctor/check-docs.listAllChecks", () => {
  it("groups checks under their respective area headers", () => {
    const text = listAllChecks();
    expect(text).toContain("Activity");
    expect(text).toContain("Decisions");
    expect(text).toContain("Snapshots");
    expect(text).toContain("Balance");
    expect(text).toContain("stale-plans");
    expect(text).toContain("proposed-adrs");
    expect(text).toContain("old-evaluations");
    expect(text).toContain("backlog-balance");
  });

  it("includes the hint pointing to `--explain <check>`", () => {
    const text = listAllChecks();
    expect(text).toContain("beacon doctor --explain <check>");
  });
});
