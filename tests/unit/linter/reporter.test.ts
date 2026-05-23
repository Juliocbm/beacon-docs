import { describe, it, expect } from "vitest";
import { formatText, formatJson } from "../../../src/linter/reporter";
import type { Finding } from "../../../src/linter/types";

const findings: Finding[] = [
  { severity: "error", rule: "kebab-case", file: "plans/FOO.plan.md", message: "Bad name" },
  { severity: "warning", rule: "folder-size", message: "Too many" },
  { severity: "suggestion", rule: "stale-plans", file: "plans/old.plan.md", message: "Stale" },
];

describe("reporter", () => {
  it("text output groups by severity", () => {
    const out = formatText(findings);
    expect(out).toMatch(/Errors \(1\)/);
    expect(out).toMatch(/Warnings \(1\)/);
    expect(out).toMatch(/Suggestions \(1\)/);
    expect(out).toContain("FOO.plan.md");
  });

  it("text output uses bracketed rule names", () => {
    const out = formatText(findings);
    expect(out).toContain("[kebab-case]");
  });

  it("json output emits an array of findings", () => {
    const out = formatJson(findings);
    expect(JSON.parse(out)).toEqual(findings);
  });
});
