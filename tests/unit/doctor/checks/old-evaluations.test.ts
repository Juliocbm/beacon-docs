import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { check as oldEvals } from "../../../../src/doctor/checks/old-evaluations";
import { walkDocs } from "../../../../src/linter/walker";
import { DEFAULT_THRESHOLDS } from "../../../../src/doctor/defaults";
import type { CheckContext } from "../../../../src/doctor/types";

let tmp: string;
const NOW = Date.UTC(2026, 4, 23);

async function makeContext(root: string): Promise<CheckContext> {
  const files = await walkDocs(root);
  return {
    root,
    config: {
      version: "1.0",
      projectType: "library",
      categories: ["evaluations"],
      agents: ["claude"],
      language: "en",
    },
    files,
    now: NOW,
    thresholds: DEFAULT_THRESHOLDS,
  };
}

async function writeEval(root: string, name: string) {
  const dir = path.join(root, "docs", "evaluations");
  await fs.ensureDir(dir);
  await fs.writeFile(path.join(dir, name), `# ${name}\n`);
}

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-old-evals-"));
});

afterEach(async () => {
  await fs.remove(tmp);
});

describe("doctor/checks/old-evaluations", () => {
  it("flags evals older than 6 months when nothing newer exists on the same topic", async () => {
    await writeEval(tmp, "2025-08-01-frontend-audit.eval.md");
    const ctx = await makeContext(tmp);
    const findings = await oldEvals.check(ctx);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.target).toBe("docs/evaluations/2025-08-01-frontend-audit.eval.md");
  });

  it("does not flag evals younger than 6 months", async () => {
    await writeEval(tmp, "2026-04-15-recent.eval.md");
    const ctx = await makeContext(tmp);
    const findings = await oldEvals.check(ctx);
    expect(findings).toEqual([]);
  });

  it("does not flag an old eval when a newer eval covers the same topic", async () => {
    await writeEval(tmp, "2025-01-01-frontend-audit.eval.md");
    await writeEval(tmp, "2026-04-01-frontend-audit.eval.md");
    const ctx = await makeContext(tmp);
    const findings = await oldEvals.check(ctx);
    // Old one is refreshed; new one is < 6 months. Neither should be flagged.
    expect(findings).toEqual([]);
  });

  it("does not flag refreshed topic even when the substring match is partial", async () => {
    await writeEval(tmp, "2025-01-01-billing.eval.md");
    await writeEval(tmp, "2026-04-01-billing-deep-dive.eval.md");
    const ctx = await makeContext(tmp);
    const findings = await oldEvals.check(ctx);
    expect(findings).toEqual([]);
  });

  it("ignores files without the date prefix pattern", async () => {
    await writeEval(tmp, "no-date.eval.md");
    const ctx = await makeContext(tmp);
    const findings = await oldEvals.check(ctx);
    expect(findings).toEqual([]); // not flagged (no date to compare)
  });
});
