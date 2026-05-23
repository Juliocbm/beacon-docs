import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { runInit } from "../../src/commands/init";
import { runEnable, runDisable } from "../../src/commands/toggle";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-toggle-"));
  await runInit({
    root: tmp, yes: true, type: "library",
    with: [], without: [],
    agents: ["claude"], language: "en", existingFiles: "replace",
  });
});

afterEach(async () => {
  await fs.remove(tmp);
});

describe("beacon enable", () => {
  it("creates the folder, README, and adds to config.categories", async () => {
    await runEnable({ root: tmp, addon: "operations" });
    expect(await fs.pathExists(path.join(tmp, "docs", "operations"))).toBe(true);
    expect(await fs.pathExists(path.join(tmp, "docs", "operations", "README.md"))).toBe(true);
    const cfg = await fs.readJson(path.join(tmp, "docs", "_meta", "beacon.config.json"));
    expect(cfg.categories).toContain("operations");
  });

  it("is idempotent", async () => {
    await runEnable({ root: tmp, addon: "operations" });
    await runEnable({ root: tmp, addon: "operations" });
    const cfg = await fs.readJson(path.join(tmp, "docs", "_meta", "beacon.config.json"));
    const count = cfg.categories.filter((c: string) => c === "operations").length;
    expect(count).toBe(1);
  });

  it("re-runs sync so CLAUDE.md mentions the new category", async () => {
    await runEnable({ root: tmp, addon: "operations" });
    const claude = await fs.readFile(path.join(tmp, "CLAUDE.md"), "utf8");
    expect(claude).toContain("operations/");
  });
});

describe("beacon disable", () => {
  beforeEach(async () => {
    await runEnable({ root: tmp, addon: "operations" });
  });

  it("removes from config when folder is empty", async () => {
    await runDisable({ root: tmp, addon: "operations", force: false });
    const cfg = await fs.readJson(path.join(tmp, "docs", "_meta", "beacon.config.json"));
    expect(cfg.categories).not.toContain("operations");
  });

  it("refuses when folder has documents unless --force", async () => {
    await fs.writeFile(path.join(tmp, "docs", "operations", "deploy.guide.md"), "x");
    await expect(
      runDisable({ root: tmp, addon: "operations", force: false }),
    ).rejects.toThrow(/--force/i);
  });

  it("with --force, removes from config but leaves files on disk", async () => {
    await fs.writeFile(path.join(tmp, "docs", "operations", "deploy.guide.md"), "x");
    await runDisable({ root: tmp, addon: "operations", force: true });
    const cfg = await fs.readJson(path.join(tmp, "docs", "_meta", "beacon.config.json"));
    expect(cfg.categories).not.toContain("operations");
    expect(await fs.pathExists(path.join(tmp, "docs", "operations", "deploy.guide.md"))).toBe(true);
  });
});
