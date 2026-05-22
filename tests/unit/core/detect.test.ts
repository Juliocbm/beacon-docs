import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { detectContext } from "../../../src/core/detect";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-detect-"));
});

afterEach(async () => {
  await fs.remove(tmp);
});

describe("detect.detectContext", () => {
  it("returns empty context for an empty directory", async () => {
    const ctx = await detectContext(tmp);
    expect(ctx.hasPackageJson).toBe(false);
    expect(ctx.hasTsconfig).toBe(false);
    expect(ctx.hasGit).toBe(false);
    expect(ctx.existingAgentFiles).toEqual([]);
  });

  it("detects package.json and reads dependencies", async () => {
    await fs.writeJson(path.join(tmp, "package.json"), {
      name: "x",
      dependencies: { next: "^14", stripe: "^15" },
    });
    const ctx = await detectContext(tmp);
    expect(ctx.hasPackageJson).toBe(true);
    expect(ctx.dependencies).toContain("next");
    expect(ctx.dependencies).toContain("stripe");
  });

  it("detects tsconfig.json", async () => {
    await fs.writeJson(path.join(tmp, "tsconfig.json"), {});
    const ctx = await detectContext(tmp);
    expect(ctx.hasTsconfig).toBe(true);
  });

  it("detects .git directory", async () => {
    await fs.ensureDir(path.join(tmp, ".git"));
    const ctx = await detectContext(tmp);
    expect(ctx.hasGit).toBe(true);
  });

  it("detects existing CLAUDE.md", async () => {
    await fs.writeFile(path.join(tmp, "CLAUDE.md"), "hi");
    const ctx = await detectContext(tmp);
    expect(ctx.existingAgentFiles).toContain("CLAUDE.md");
  });

  it("detects existing .cursorrules", async () => {
    await fs.writeFile(path.join(tmp, ".cursorrules"), "hi");
    const ctx = await detectContext(tmp);
    expect(ctx.existingAgentFiles).toContain(".cursorrules");
  });

  it("suggests integrations when stripe is present", async () => {
    await fs.writeJson(path.join(tmp, "package.json"), {
      dependencies: { stripe: "^15" },
    });
    const ctx = await detectContext(tmp);
    expect(ctx.suggestedAddons).toContain("integrations");
  });

  it("suggests reference/database when prisma is present", async () => {
    await fs.writeJson(path.join(tmp, "package.json"), {
      dependencies: { "@prisma/client": "^5" },
    });
    const ctx = await detectContext(tmp);
    expect(ctx.suggestedSubfolders).toContain("reference/database");
  });
});
