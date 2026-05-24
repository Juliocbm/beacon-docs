import { describe, it, expect, beforeEach } from "vitest";
import { formatText, formatJson } from "../../../src/doctor/reporter";
import type { Finding } from "../../../src/doctor/types";

beforeEach(() => {
  // Disable color codes so substring assertions are stable across environments.
  process.env.NO_COLOR = "1";
});

const sample: Finding[] = [
  {
    area: "activity",
    check: "stale-plans",
    target: "docs/plans/foo.plan.md",
    observation: "Last modified 47 days ago.",
    suggestion: "Archive it.",
  },
  {
    area: "activity",
    check: "stale-plans",
    target: "docs/plans/bar.plan.md",
    observation: "Last modified 33 days ago.",
    suggestion: "Archive it.",
  },
  {
    area: "decisions",
    check: "proposed-adrs",
    target: "docs/adr/ADR-005-foo.md",
    observation: "Stuck in proposed for 22 days.",
    suggestion: "Decide on it.",
  },
];

describe("doctor/reporter.formatText", () => {
  it("prints an all-clear message when there are no findings", () => {
    const text = formatText([]);
    expect(text).toContain("All checks passed.");
    expect(text).toContain("4 areas inspected");
  });

  it("groups findings by area with counts in headers", () => {
    const text = formatText(sample);
    expect(text).toContain("Activity (2)");
    expect(text).toContain("Decisions (1)");
    expect(text).not.toContain("Snapshots (");
    expect(text).not.toContain("Balance (");
  });

  it("includes target paths and check names", () => {
    const text = formatText(sample);
    expect(text).toContain("docs/plans/foo.plan.md");
    expect(text).toContain("docs/adr/ADR-005-foo.md");
    expect(text).toContain("stale-plans");
    expect(text).toContain("proposed-adrs");
  });

  it("renders observations and suggestions for each finding", () => {
    const text = formatText(sample);
    expect(text).toContain("Last modified 47 days ago.");
    expect(text).toContain("Archive it.");
    expect(text).toContain("Decide on it.");
  });

  it("ends with a summary line of total findings and active areas", () => {
    const text = formatText(sample);
    expect(text).toContain("3 findings across 2 areas.");
  });

  it("pluralizes singular finding/area correctly", () => {
    const text = formatText([sample[0]!]);
    expect(text).toContain("1 finding across 1 area.");
  });

  it("uses 📁 glyph for targets without a .md extension", () => {
    const text = formatText([
      {
        area: "balance",
        check: "backlog-balance",
        target: "docs/plans",
        observation: "10 active plans, 0 backlog items.",
        suggestion: "Capture backlog items.",
      },
    ]);
    expect(text).toContain("📁");
    expect(text).toContain("docs/plans");
  });

  it("uses 📄 glyph for .md targets", () => {
    const text = formatText([sample[0]!]);
    expect(text).toContain("📄");
  });
});

describe("doctor/reporter.formatJson", () => {
  it("emits valid JSON that round-trips to the input findings", () => {
    const json = formatJson(sample);
    const parsed = JSON.parse(json) as Finding[];
    expect(parsed).toEqual(sample);
  });

  it("emits `[]` for empty findings", () => {
    expect(formatJson([])).toBe("[]");
  });
});
