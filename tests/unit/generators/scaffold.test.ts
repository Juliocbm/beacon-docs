import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { scaffoldStructure } from "../../../src/generators/scaffold";
import type { BeaconConfig } from "../../../src/core/config";

let tmp: string;
const baseCfg: BeaconConfig = {
  version: "1.0",
  projectType: "library",
  categories: ["reference", "architecture", "adr", "plans", "backlog", "evaluations"],
  agents: ["claude"],
  language: "en",
};

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-scaffold-"));
});

afterEach(async () => {
  await fs.remove(tmp);
});

describe("scaffoldStructure", () => {
  it("creates docs/_meta directory", async () => {
    await scaffoldStructure(tmp, baseCfg);
    expect(await fs.pathExists(path.join(tmp, "docs", "_meta"))).toBe(true);
  });

  it("creates a directory for every enabled category", async () => {
    await scaffoldStructure(tmp, baseCfg);
    for (const c of baseCfg.categories) {
      expect(await fs.pathExists(path.join(tmp, "docs", c))).toBe(true);
    }
  });

  it("does NOT create directories for disabled add-on categories", async () => {
    await scaffoldStructure(tmp, baseCfg);
    expect(await fs.pathExists(path.join(tmp, "docs", "compliance"))).toBe(false);
    expect(await fs.pathExists(path.join(tmp, "docs", "business"))).toBe(false);
  });

  it("creates _archive subfolder for archivable categories", async () => {
    await scaffoldStructure(tmp, baseCfg);
    expect(await fs.pathExists(path.join(tmp, "docs", "plans", "_archive"))).toBe(true);
  });

  it("does NOT create _archive for non-archivable categories", async () => {
    await scaffoldStructure(tmp, baseCfg);
    expect(await fs.pathExists(path.join(tmp, "docs", "evaluations", "_archive"))).toBe(false);
    expect(await fs.pathExists(path.join(tmp, "docs", "reference", "_archive"))).toBe(false);
  });

  it("creates README.md in every category folder", async () => {
    await scaffoldStructure(tmp, baseCfg);
    for (const c of baseCfg.categories) {
      expect(await fs.pathExists(path.join(tmp, "docs", c, "README.md"))).toBe(true);
    }
  });

  it("creates docs/README.md (master index)", async () => {
    await scaffoldStructure(tmp, baseCfg);
    expect(await fs.pathExists(path.join(tmp, "docs", "README.md"))).toBe(true);
  });

  it("creates docs/_meta/convention.md", async () => {
    await scaffoldStructure(tmp, baseCfg);
    expect(await fs.pathExists(path.join(tmp, "docs", "_meta", "convention.md"))).toBe(true);
  });

  it("creates docs/_meta/beacon.config.json reflecting the input", async () => {
    await scaffoldStructure(tmp, baseCfg);
    const saved = await fs.readJson(path.join(tmp, "docs", "_meta", "beacon.config.json"));
    expect(saved).toEqual(baseCfg);
  });

  it("handles roadmaps as archivable too", async () => {
    const cfg: BeaconConfig = { ...baseCfg, projectType: "web-app", categories: [...baseCfg.categories, "roadmaps"] };
    await scaffoldStructure(tmp, cfg);
    expect(await fs.pathExists(path.join(tmp, "docs", "roadmaps", "_archive"))).toBe(true);
  });
});
