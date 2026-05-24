import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { check as stalePlans } from "../../../../src/doctor/checks/stale-plans";
import { walkDocs } from "../../../../src/linter/walker";
import type { CheckContext } from "../../../../src/doctor/types";

let tmp: string;
const NOW = Date.UTC(2026, 4, 23); // 2026-05-23
const DAY = 24 * 60 * 60 * 1000;

async function makeContext(root: string): Promise<CheckContext> {
  const files = await walkDocs(root);
  return {
    root,
    config: {
      version: "1.0",
      projectType: "library",
      categories: ["plans"],
      agents: ["claude"],
      language: "en",
    },
    files,
    now: NOW,
  };
}

async function writePlan(root: string, name: string, ageDays: number, archived = false) {
  const dir = archived
    ? path.join(root, "docs", "plans", "_archive")
    : path.join(root, "docs", "plans");
  await fs.ensureDir(dir);
  const filePath = path.join(dir, name);
  await fs.writeFile(filePath, "# Plan\n");
  const mtime = (NOW - ageDays * DAY) / 1000;
  await fs.utimes(filePath, mtime, mtime);
}

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-stale-plans-"));
});

afterEach(async () => {
  await fs.remove(tmp);
});

describe("doctor/checks/stale-plans", () => {
  it("flags plans older than 30 days", async () => {
    await writePlan(tmp, "old.plan.md", 40);
    const ctx = await makeContext(tmp);
    const findings = await stalePlans.check(ctx);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.target).toBe("docs/plans/old.plan.md");
    expect(findings[0]?.observation).toContain("40 days");
  });

  it("does not flag plans modified within 30 days", async () => {
    await writePlan(tmp, "recent.plan.md", 5);
    const ctx = await makeContext(tmp);
    const findings = await stalePlans.check(ctx);
    expect(findings).toEqual([]);
  });

  it("does not flag archived plans regardless of age", async () => {
    await writePlan(tmp, "old.plan.md", 100, true);
    const ctx = await makeContext(tmp);
    const findings = await stalePlans.check(ctx);
    expect(findings).toEqual([]);
  });

  it("does not flag README in plans/", async () => {
    await fs.ensureDir(path.join(tmp, "docs", "plans"));
    const readme = path.join(tmp, "docs", "plans", "README.md");
    await fs.writeFile(readme, "# Plans\n");
    const mtime = (NOW - 100 * DAY) / 1000;
    await fs.utimes(readme, mtime, mtime);
    const ctx = await makeContext(tmp);
    const findings = await stalePlans.check(ctx);
    expect(findings).toEqual([]);
  });

  it("uses 30 days as the threshold (boundary check)", async () => {
    await writePlan(tmp, "exactly-30.plan.md", 30);
    await writePlan(tmp, "exactly-29.plan.md", 29);
    const ctx = await makeContext(tmp);
    const findings = await stalePlans.check(ctx);
    const flagged = findings.map((f) => f.target);
    expect(flagged).toContain("docs/plans/exactly-30.plan.md");
    expect(flagged).not.toContain("docs/plans/exactly-29.plan.md");
  });
});
