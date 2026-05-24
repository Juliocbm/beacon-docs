import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { check as backlogBalance } from "../../../../src/doctor/checks/backlog-balance";
import { walkDocs } from "../../../../src/linter/walker";
import { DEFAULT_THRESHOLDS } from "../../../../src/doctor/defaults";
import type { CheckContext } from "../../../../src/doctor/types";

let tmp: string;

async function makeContext(root: string): Promise<CheckContext> {
  const files = await walkDocs(root);
  return {
    root,
    config: {
      version: "1.0",
      projectType: "library",
      categories: ["plans", "backlog"],
      agents: ["claude"],
      language: "en",
    },
    files,
    now: Date.UTC(2026, 4, 23),
    thresholds: DEFAULT_THRESHOLDS,
  };
}

async function writeMany(root: string, category: string, n: number, suffix: string) {
  const dir = path.join(root, "docs", category);
  await fs.ensureDir(dir);
  for (let i = 0; i < n; i++) {
    await fs.writeFile(path.join(dir, `item-${i}.${suffix}.md`), `# item ${i}\n`);
  }
}

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-backlog-balance-"));
});

afterEach(async () => {
  await fs.remove(tmp);
});

describe("doctor/checks/backlog-balance", () => {
  it("flags when there are many plans and zero backlog items", async () => {
    await writeMany(tmp, "plans", 10, "plan");
    const ctx = await makeContext(tmp);
    const findings = await backlogBalance.check(ctx);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.observation).toContain("10 active plans");
    expect(findings[0]?.observation).toContain("0 backlog items");
  });

  it("does not flag when plans count is below threshold", async () => {
    await writeMany(tmp, "plans", 3, "plan");
    const ctx = await makeContext(tmp);
    const findings = await backlogBalance.check(ctx);
    expect(findings).toEqual([]);
  });

  it("does not flag when ratio is healthy (plans ≤ 5× backlog)", async () => {
    await writeMany(tmp, "plans", 6, "plan");
    await writeMany(tmp, "backlog", 3, "todo");
    const ctx = await makeContext(tmp);
    const findings = await backlogBalance.check(ctx);
    expect(findings).toEqual([]);
  });

  it("flags when ratio exceeds 5:1 even with some backlog items", async () => {
    await writeMany(tmp, "plans", 12, "plan");
    await writeMany(tmp, "backlog", 1, "todo");
    const ctx = await makeContext(tmp);
    const findings = await backlogBalance.check(ctx);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.observation).toContain("12 active plans, 1 backlog items");
  });

  it("ignores README files when counting", async () => {
    await writeMany(tmp, "plans", 6, "plan");
    await fs.writeFile(path.join(tmp, "docs", "plans", "README.md"), "# Plans\n");
    await writeMany(tmp, "backlog", 2, "todo");
    await fs.writeFile(path.join(tmp, "docs", "backlog", "README.md"), "# Backlog\n");
    const ctx = await makeContext(tmp);
    const findings = await backlogBalance.check(ctx);
    // 6 plans / 2 backlog = 3:1 → healthy
    expect(findings).toEqual([]);
  });
});
