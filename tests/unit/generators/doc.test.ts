import { describe, it, expect } from "vitest";
import { renderDoc } from "../../../src/generators/doc";

describe("renderDoc", () => {
  it("plan: renders title + status:active + TODOs section", () => {
    const out = renderDoc({ type: "plan", title: "Billing integration", today: "2026-05-22" });
    expect(out).toContain("title: Billing integration");
    expect(out).toContain("status: active");
    expect(out).toContain("- [ ] First step");
  });

  it("adr: renders with number padded to 3 digits", () => {
    const out = renderDoc({ type: "adr", title: "Add rate limiting", today: "2026-05-22", number: "015" });
    expect(out).toContain("adr: 015");
    expect(out).toContain("# ADR-015: Add rate limiting");
  });

  it("eval: renders with date in frontmatter", () => {
    const out = renderDoc({ type: "eval", title: "Frontend audit", today: "2026-05-22" });
    expect(out).toContain("date: 2026-05-22");
  });

  it("pattern: simple title + problem/solution skeleton", () => {
    const out = renderDoc({ type: "pattern", title: "Multi-tenancy", today: "2026-05-22" });
    expect(out).toContain("# Multi-tenancy");
    expect(out).toMatch(/## Problem/);
  });
});
