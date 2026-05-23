import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { runInit } from "../../src/commands/init";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-init-"));
});

afterEach(async () => {
  await fs.remove(tmp);
});

describe("beacon init (non-interactive)", () => {
  it("creates a library scaffold from --type=library --yes", async () => {
    await runInit({
      root: tmp,
      yes: true,
      type: "library",
      with: [],
      without: [],
      agents: ["claude"],
      language: "en",
      existingFiles: "replace",
    });
    expect(await fs.pathExists(path.join(tmp, "docs", "reference"))).toBe(true);
    expect(await fs.pathExists(path.join(tmp, "docs", "compliance"))).toBe(false);
    const cfg = await fs.readJson(path.join(tmp, "docs", "_meta", "beacon.config.json"));
    expect(cfg.projectType).toBe("library");
    expect(cfg.categories).not.toContain("business");
  });

  it("--with adds a category beyond defaults", async () => {
    await runInit({
      root: tmp,
      yes: true,
      type: "library",
      with: ["operations"],
      without: [],
      agents: ["claude"],
      language: "en",
      existingFiles: "replace",
    });
    expect(await fs.pathExists(path.join(tmp, "docs", "operations"))).toBe(true);
    const cfg = await fs.readJson(path.join(tmp, "docs", "_meta", "beacon.config.json"));
    expect(cfg.categories).toContain("operations");
  });

  it("--without removes a default category", async () => {
    await runInit({
      root: tmp,
      yes: true,
      type: "web-app",
      with: [],
      without: ["business"],
      agents: ["claude"],
      language: "en",
      existingFiles: "replace",
    });
    expect(await fs.pathExists(path.join(tmp, "docs", "business"))).toBe(false);
    const cfg = await fs.readJson(path.join(tmp, "docs", "_meta", "beacon.config.json"));
    expect(cfg.categories).not.toContain("business");
  });

  it("custom type starts with empty categories unless --with provided", async () => {
    await runInit({
      root: tmp,
      yes: true,
      type: "custom",
      with: ["plans", "adr"],
      without: [],
      agents: ["claude"],
      language: "en",
      existingFiles: "replace",
    });
    const cfg = await fs.readJson(path.join(tmp, "docs", "_meta", "beacon.config.json"));
    expect(cfg.categories).toEqual(["plans", "adr"]);
    expect(await fs.pathExists(path.join(tmp, "docs", "reference"))).toBe(false);
  });

  it("rejects unknown project type with a clear error", async () => {
    await expect(
      runInit({
        root: tmp,
        yes: true,
        type: "potato",
        with: [],
        without: [],
        agents: ["claude"],
        language: "en",
        existingFiles: "replace",
      } as never),
    ).rejects.toThrow(/project type/i);
  });

  it("rejects unknown --with category with a clear error", async () => {
    await expect(
      runInit({
        root: tmp,
        yes: true,
        type: "library",
        with: ["unknown-cat"],
        without: [],
        agents: ["claude"],
        language: "en",
        existingFiles: "replace",
      } as never),
    ).rejects.toThrow(/category/i);
  });

  it("adds docs:lint to package.json when present", async () => {
    await fs.writeJson(path.join(tmp, "package.json"), { name: "x", scripts: { test: "vitest" } });
    await runInit({
      root: tmp,
      yes: true,
      type: "library",
      with: [],
      without: [],
      agents: ["claude"],
      language: "en",
      existingFiles: "replace",
    });
    const pkg = await fs.readJson(path.join(tmp, "package.json"));
    expect(pkg.scripts["docs:lint"]).toBe("beacon lint");
  });
});
