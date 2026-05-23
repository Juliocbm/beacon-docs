import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { runInit } from "../../src/commands/init";
import { runNew } from "../../src/commands/new";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-new-"));
  await runInit({
    root: tmp,
    yes: true,
    type: "web-app",
    with: ["modules", "compliance"],
    without: [],
    agents: ["claude"],
    language: "en",
    existingFiles: "replace",
  });
});

afterEach(async () => {
  await fs.remove(tmp);
});

describe("beacon new", () => {
  it("plan: creates docs/plans/<slug>.plan.md", async () => {
    const file = await runNew({ root: tmp, type: "plan", slug: "billing-integration", today: "2026-05-22" });
    expect(file).toBe(path.join(tmp, "docs", "plans", "billing-integration.plan.md"));
    expect(await fs.pathExists(file)).toBe(true);
    const content = await fs.readFile(file, "utf8");
    expect(content).toContain("title: billing-integration");
  });

  it("adr: creates docs/adr/ADR-001-<slug>.md and auto-numbers", async () => {
    const f1 = await runNew({ root: tmp, type: "adr", slug: "rate-limiting", today: "2026-05-22" });
    expect(f1).toContain("ADR-001-rate-limiting.md");
    const f2 = await runNew({ root: tmp, type: "adr", slug: "session-cookies", today: "2026-05-22" });
    expect(f2).toContain("ADR-002-session-cookies.md");
  });

  it("pattern: creates docs/reference/<slug>.pattern.md", async () => {
    const f = await runNew({ root: tmp, type: "pattern", slug: "multi-tenancy", today: "2026-05-22" });
    expect(f).toBe(path.join(tmp, "docs", "reference", "multi-tenancy.pattern.md"));
  });

  it("eval: creates docs/evaluations/YYYY-MM-DD-<slug>.eval.md", async () => {
    const f = await runNew({ root: tmp, type: "eval", slug: "frontend-audit", today: "2026-05-22" });
    expect(f).toBe(path.join(tmp, "docs", "evaluations", "2026-05-22-frontend-audit.eval.md"));
  });

  it("module: requires modules addon (enabled in this test)", async () => {
    const f = await runNew({ root: tmp, type: "module", slug: "invoicing", today: "2026-05-22" });
    expect(f).toBe(path.join(tmp, "docs", "modules", "invoicing.module.md"));
  });

  it("todo: creates docs/backlog/<slug>.todo.md", async () => {
    const f = await runNew({ root: tmp, type: "todo", slug: "realtime-hardening", today: "2026-05-22" });
    expect(f).toBe(path.join(tmp, "docs", "backlog", "realtime-hardening.todo.md"));
  });

  it("business: creates docs/business/<slug>.business.md", async () => {
    const f = await runNew({ root: tmp, type: "business", slug: "pricing-model", today: "2026-05-22" });
    expect(f).toBe(path.join(tmp, "docs", "business", "pricing-model.business.md"));
  });

  it("rejects when the category is not enabled and suggests `beacon enable`", async () => {
    // re-init without `business` enabled
    await fs.remove(tmp);
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-new-"));
    await runInit({
      root: tmp, yes: true, type: "library", with: [], without: [],
      agents: ["claude"], language: "en", existingFiles: "replace",
    });
    await expect(
      runNew({ root: tmp, type: "business", slug: "x", today: "2026-05-22" }),
    ).rejects.toThrow(/beacon enable business/);
  });

  it("rejects non-kebab-case slugs", async () => {
    await expect(
      runNew({ root: tmp, type: "plan", slug: "Billing_Integration", today: "2026-05-22" }),
    ).rejects.toThrow(/kebab-case/i);
  });
});
