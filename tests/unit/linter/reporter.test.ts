import { describe, it, expect } from "vitest";
import { formatText, formatJson } from "../../../src/linter/reporter";
import { stripAnsi } from "../../test-utils";
import type { Finding } from "../../../src/linter/types";

const mixed: Finding[] = [
  { severity: "error", rule: "kebab-case", file: "plans/FOO.plan.md", message: "Bad name" },
  { severity: "warning", rule: "folder-size", message: "Too many" },
  { severity: "suggestion", rule: "stale-plans", file: "plans/old.plan.md", message: "Stale" },
];

describe("reporter — text", () => {
  it("groups by severity with counts in section headers", () => {
    const out = stripAnsi(formatText(mixed));
    expect(out).toMatch(/Errors \(1\)/);
    expect(out).toMatch(/Warnings \(1\)/);
    expect(out).toMatch(/Suggestions \(1\)/);
  });

  it("emits the file path for findings that have one", () => {
    const out = stripAnsi(formatText(mixed));
    expect(out).toContain("plans/FOO.plan.md");
    expect(out).toContain("plans/old.plan.md");
  });

  it("emits `(global)` placeholder for findings without a file", () => {
    const out = stripAnsi(formatText(mixed));
    // folder-size warning has no `file` field — should show (global)
    expect(out).toContain("(global)");
  });

  it("uses 'rule: message' format (no brackets)", () => {
    const out = stripAnsi(formatText(mixed));
    expect(out).toContain("kebab-case: Bad name");
    expect(out).toContain("folder-size: Too many");
    expect(out).toContain("stale-plans: Stale");
    expect(out).not.toContain("[kebab-case]"); // confirms old bracket format is gone
  });

  it("uses tree branch glyph (└─) for inner detail lines", () => {
    const out = stripAnsi(formatText(mixed));
    expect(out).toContain("└─");
  });

  it("uses ✗ for errors and ⚠ for warnings and → for suggestions", () => {
    const out = stripAnsi(formatText(mixed));
    expect(out).toContain("✗");
    expect(out).toContain("⚠");
    expect(out).toContain("→");
  });

  it("when empty, prints `All clear.` and zero-counts for every section", () => {
    const out = stripAnsi(formatText([]));
    expect(out).toContain("Errors (0)");
    expect(out).toContain("Warnings (0)");
    expect(out).toContain("Suggestions (0)");
    expect(out).toContain("All clear.");
  });

  it("when only some severity types have findings, others show (0)", () => {
    const onlyError: Finding[] = [
      { severity: "error", rule: "kebab-case", file: "plans/x.md", message: "Bad" },
    ];
    const out = stripAnsi(formatText(onlyError));
    expect(out).toContain("Errors (1)");
    expect(out).toContain("Warnings (0)");
    expect(out).toContain("Suggestions (0)");
    expect(out).not.toContain("All clear.");
  });
});

describe("reporter — json", () => {
  it("emits an array of findings", () => {
    const out = formatJson(mixed);
    expect(JSON.parse(out)).toEqual(mixed);
  });

  it("json output contains NO ANSI codes (for CI parseability)", () => {
    const out = formatJson(mixed);
    expect(out).not.toMatch(/\x1b\[/);
  });
});
