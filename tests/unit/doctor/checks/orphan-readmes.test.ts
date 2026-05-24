import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { check as orphanReadmes } from "../../../../src/doctor/checks/orphan-readmes";
import { walkDocs } from "../../../../src/linter/walker";
import { DEFAULT_THRESHOLDS } from "../../../../src/doctor/defaults";
import type { CheckContext } from "../../../../src/doctor/types";
import type { Category } from "../../../../src/core/project-types";

let tmp: string;
const NOW = Date.UTC(2026, 4, 23);
const DAY = 24 * 60 * 60 * 1000;

async function makeContext(root: string, categories: Category[]): Promise<CheckContext> {
  const files = await walkDocs(root);
  return {
    root,
    config: {
      version: "1.0",
      projectType: "library",
      categories,
      agents: ["claude"],
      language: "en",
    },
    files,
    now: NOW,
    thresholds: DEFAULT_THRESHOLDS,
  };
}

async function writeReadme(root: string, category: string, ageDays: number) {
  const dir = path.join(root, "docs", category);
  await fs.ensureDir(dir);
  const readme = path.join(dir, "README.md");
  await fs.writeFile(readme, `# ${category}\n`);
  const mtime = (NOW - ageDays * DAY) / 1000;
  await fs.utimes(readme, mtime, mtime);
}

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-orphan-"));
});

afterEach(async () => fs.remove(tmp));

describe("doctor/checks/orphan-readmes", () => {
  it("flags add-on folders with only a stale README", async () => {
    await writeReadme(tmp, "compliance", 45);
    const ctx = await makeContext(tmp, ["compliance"]);
    const findings = await orphanReadmes.check(ctx);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.target).toBe("docs/compliance/");
    expect(findings[0]?.observation).toContain("45 days ago");
    expect(findings[0]?.suggestion).toContain("beacon disable compliance");
  });

  it("does not flag add-on folders younger than the threshold", async () => {
    await writeReadme(tmp, "business", 10);
    const ctx = await makeContext(tmp, ["business"]);
    const findings = await orphanReadmes.check(ctx);
    expect(findings).toEqual([]);
  });

  it("does not flag add-on folders that contain real docs alongside the README", async () => {
    await writeReadme(tmp, "operations", 90);
    await fs.writeFile(
      path.join(tmp, "docs", "operations", "deploy.guide.md"),
      "# Deploy\n",
    );
    const ctx = await makeContext(tmp, ["operations"]);
    const findings = await orphanReadmes.check(ctx);
    expect(findings).toEqual([]);
  });

  it("does not flag core categories even when only README is present", async () => {
    // reference is a core category. Empty core folders are expected after init.
    await writeReadme(tmp, "reference", 90);
    const ctx = await makeContext(tmp, ["reference"]);
    const findings = await orphanReadmes.check(ctx);
    expect(findings).toEqual([]);
  });

  it("ignores categories enabled in config but missing on disk", async () => {
    // No files written. Should not throw.
    const ctx = await makeContext(tmp, ["modules"]);
    const findings = await orphanReadmes.check(ctx);
    expect(findings).toEqual([]);
  });

  it("flags multiple orphans in one run", async () => {
    await writeReadme(tmp, "compliance", 60);
    await writeReadme(tmp, "modules", 35);
    await writeReadme(tmp, "business", 10); // too fresh
    const ctx = await makeContext(tmp, ["compliance", "modules", "business"]);
    const findings = await orphanReadmes.check(ctx);
    const targets = findings.map((f) => f.target).sort();
    expect(targets).toEqual(["docs/compliance/", "docs/modules/"]);
  });

  it("respects a configured threshold override", async () => {
    await writeReadme(tmp, "compliance", 20);
    const ctx = await makeContext(tmp, ["compliance"]);
    ctx.thresholds = { ...DEFAULT_THRESHOLDS, orphanReadmeDays: 10 };
    const findings = await orphanReadmes.check(ctx);
    expect(findings).toHaveLength(1);
  });

  it("does not count _archive subfolders as meaningful content", async () => {
    await writeReadme(tmp, "roadmaps", 45);
    await fs.ensureDir(path.join(tmp, "docs", "roadmaps", "_archive"));
    const ctx = await makeContext(tmp, ["roadmaps"]);
    const findings = await orphanReadmes.check(ctx);
    expect(findings).toHaveLength(1); // still flagged — _archive alone is not real content
  });
});
